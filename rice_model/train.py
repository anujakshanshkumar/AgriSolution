"""Single-GPU transfer learning. Resume always restarts an interrupted epoch."""
import argparse
import gc
import json
import math
import os
import time
from pathlib import Path
from filelock import FileLock

import numpy as np
import timm
import torch
from torch.utils.data import DataLoader

from .common import (CLASSES, MODELS, RiceDataset, digest, metrics, preprocessing,
                     read_json, seed_all, seed_worker, write_json)
from .prepare import assert_no_leakage


def atomic_save(value, path):
    path = Path(path)
    tmp = path.with_suffix('.tmp')
    torch.save(value, tmp)
    os.replace(tmp, path)


def loader(dataset, batch, workers, shuffle, seed):
    return DataLoader(dataset, batch_size=batch, shuffle=shuffle, num_workers=workers,
                      pin_memory=torch.cuda.is_available(), worker_init_fn=seed_worker,
                      generator=torch.Generator().manual_seed(seed), persistent_workers=False)


@torch.inference_mode()
def predict(model, batches, device):
    torch.backends.cudnn.allow_tf32 = False
    torch.backends.cuda.matmul.allow_tf32 = False
    model.eval()
    logits, labels = [], []
    for x, y in batches:
        # FP32 evaluation matches the default production runtime.
        logits.append(model(x.to(device)).float().cpu())
        labels.append(y)
    return torch.cat(logits), torch.cat(labels)


def train(args):
    if not torch.cuda.is_available():
        raise RuntimeError('CUDA is required for training. Use the CUDA-enabled Python environment.')
    if args.workers < 0 or args.workers > 8:
        raise ValueError('workers must be between 0 and 8')
    cfg = MODELS[args.model]
    batch = args.batch_size or cfg['batch']
    epochs = args.epochs or cfg['epochs']
    if batch < 2 or epochs < 1 or epochs > cfg['epochs']:
        raise ValueError('Batch must be >=2 and epochs within model maximum')
    manifest_path = Path(args.splits)/'manifest.json'
    manifest = read_json(manifest_path)
    if manifest['classes'] != CLASSES:
        raise ValueError('Class mapping mismatch')
    assert_no_leakage(manifest['records'])
    seed = manifest['seed']
    split_hash = digest(manifest_path)
    seed_all(seed)
    out = Path(args.out) / (args.model + ('_smoke' if args.smoke else ''))
    out.mkdir(parents=True, exist_ok=True)
    if (out/'last.pt').exists() and not args.resume:
        raise ValueError('Run exists: use --resume or a new --out directory')
    train_rows = [r for r in manifest['records'] if r['split'] == 'train']
    val_rows = [r for r in manifest['records'] if r['split'] == 'validation']
    if args.smoke:
        train_rows = [r for c in CLASSES for r in [r for r in train_rows if r['label'] == c][:2]]
        val_rows = [r for c in CLASSES for r in [r for r in val_rows if r['label'] == c][:1]]
        epochs = 1
    train_ds = RiceDataset(args.data, train_rows, cfg['size'], True, verify_hashes=True)
    val_ds = RiceDataset(args.data, val_rows, cfg['size'], verify_hashes=True)
    device = torch.device('cuda')
    start = time.perf_counter()
    model = timm.create_model(cfg['architecture'], pretrained=not args.resume, num_classes=len(CLASSES)).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=.01)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=args.lr/100)
    scaler = torch.amp.GradScaler('cuda', init_scale=256)
    counts = np.array([sum(r['label'] == c for r in train_rows) for c in CLASSES])
    weights = 1 / np.sqrt(np.maximum(counts, 1))
    weights /= weights.mean()
    loss_fn = torch.nn.CrossEntropyLoss(weight=torch.tensor(weights, dtype=torch.float32, device=device))
    best, stale, history, first = -1.0, 0, [], 0
    config = {'model': args.model, **cfg, 'classes': CLASSES, 'preprocessing': preprocessing(cfg['size']),
              'seed': seed, 'split_sha256': split_hash, 'epochs': epochs, 'smoke': args.smoke,
              'lr': args.lr, 'patience': args.patience, 'workers': args.workers,
              'torch_version': str(torch.__version__), 'timm_version': timm.__version__,
              'gpu': torch.cuda.get_device_name(0), 'gpu_total_bytes': torch.cuda.get_device_properties(0).total_memory}
    def state(epoch):
        return {'model_state': model.state_dict(), 'optimizer': optimizer.state_dict(),
                'scheduler': scheduler.state_dict(), 'scaler': scaler.state_dict(),
                'epoch': epoch, 'best': best, 'stale': stale, 'history': history,
                'config': config, 'batch_size': batch}
    def restore():
        checkpoint = torch.load(out/'last.pt', map_location='cpu', weights_only=True)
        if any(checkpoint['config'][k] != config[k] for k in ['model', 'split_sha256', 'epochs', 'seed', 'lr', 'smoke']):
            raise ValueError('Resume configuration differs from saved run')
        model.load_state_dict(checkpoint['model_state'])
        optimizer.load_state_dict(checkpoint['optimizer'])
        scheduler.load_state_dict(checkpoint['scheduler'])
        scaler.load_state_dict(checkpoint['scaler'])
        return checkpoint
    if args.resume:
        saved = restore()
        first, best, stale, history = saved['epoch']+1, saved['best'], saved['stale'], saved['history']
        batch = saved['batch_size']
    else:
        atomic_save(state(-1), out/'last.pt')
    write_json(out/'config.json', config)
    print(json.dumps({'event': 'start', 'gpu': config['gpu'], 'model': args.model, 'batch': batch, 'start_epoch': first+1}), flush=True)
    termination_reason = 'epoch_budget_or_early_stopping'
    for epoch in range(first, epochs):
        if stale >= args.patience:
            break
        while True:
            seed_all(seed+epoch)
            torch.cuda.reset_peak_memory_stats()
            epoch_start = time.perf_counter()
            model.train()
            total_loss, samples, updates = 0., 0, 0
            try:
                for step, (x, y) in enumerate(loader(train_ds, batch, args.workers, True, seed+epoch)):
                    x, y = x.to(device, non_blocking=True), y.to(device, non_blocking=True)
                    optimizer.zero_grad(set_to_none=True)
                    with torch.autocast('cuda', dtype=torch.float16):
                        loss = loss_fn(model(x), y)
                    if not torch.isfinite(loss):
                        raise RuntimeError('Non-finite loss; training stopped')
                    scaler.scale(loss).backward()
                    scaler.unscale_(optimizer)
                    torch.nn.utils.clip_grad_norm_(model.parameters(), 5.)
                    previous_scale = scaler.get_scale()
                    scaler.step(optimizer)
                    scaler.update()
                    updates += int(scaler.get_scale() >= previous_scale)
                    total_loss += loss.item()*len(y)
                    samples += len(y)
                    if step % 100 == 0:
                        print(json.dumps({'event': 'batch', 'epoch': epoch+1, 'step': step,
                              'loss': total_loss/samples, 'vram_mb': torch.cuda.memory_allocated()/2**20}), flush=True)
                if updates == 0:
                    raise RuntimeError('AMP skipped every optimizer step; lower initial scaling or inspect gradients')
                val_logits, val_labels = predict(model, loader(val_ds, batch, args.workers, False, seed), device)
                measured = metrics(val_logits.softmax(1).numpy(), val_labels.numpy())
                break
            except torch.cuda.OutOfMemoryError:
                optimizer.zero_grad(set_to_none=True)
                # Free loop references before restoring the previous complete epoch.
                x = y = loss = None
                gc.collect()
                torch.cuda.empty_cache()
                if batch <= 2:
                    raise RuntimeError('CUDA OOM at batch 2; close other GPU processes or reduce input size in a new experiment')
                batch = max(2, batch//2)
                restore()
                print(json.dumps({'event': 'oom_retry_epoch', 'batch': batch}), flush=True)
        scheduler.step()
        score = measured['macro_f1']
        improved = score > best + .0001
        best, stale = (score, 0) if improved else (best, stale+1)
        record = {'epoch': epoch+1, 'loss': total_loss/samples, 'validation': measured,
                  'seconds': time.perf_counter()-epoch_start, 'batch': batch, 'optimizer_updates': updates,
                  'peak_allocated_mb': torch.cuda.max_memory_allocated()/2**20,
                  'peak_reserved_mb': torch.cuda.max_memory_reserved()/2**20, 'lr': scheduler.get_last_lr()[0]}
        history.append(record)
        atomic_save(state(epoch), out/'last.pt')
        if improved:
            atomic_save({'model_state': model.state_dict(), 'config': config, 'epoch': epoch,
                         'validation_macro_f1': best}, out/'best.pt')
        write_json(out/'history.json', history)
        print(json.dumps({'event': 'epoch', **{k:v for k,v in record.items() if k != 'validation'},
                          'val_accuracy': measured['accuracy'], 'val_macro_f1': score}), flush=True)
        if Path(args.stop_file).exists() or (args.stop_after_epoch is not None and epoch+1 >= args.stop_after_epoch):
            termination_reason = 'requested_stop_after_complete_checkpoint'
            print(json.dumps({'event': 'graceful_stop', 'epoch': epoch+1}), flush=True)
            break
    write_json(out/'summary.json', {'complete': True, 'smoke_only': args.smoke,
               'epochs_completed': len(history), 'best_validation_macro_f1': best,
               'training_epoch_seconds': sum(h['seconds'] for h in history),
               'invocation_seconds': time.perf_counter()-start, 'termination_reason': termination_reason, 'config': config})


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', choices=MODELS, required=True)
    parser.add_argument('--data', default='Data')
    parser.add_argument('--splits', default='artifacts/rice/splits')
    parser.add_argument('--out', default='artifacts/rice/runs')
    parser.add_argument('--batch-size', type=int)
    parser.add_argument('--epochs', type=int)
    parser.add_argument('--workers', type=int, default=0)
    parser.add_argument('--lr', type=float, default=.0003)
    parser.add_argument('--patience', type=int, default=7)
    parser.add_argument('--resume', action='store_true')
    parser.add_argument('--smoke', action='store_true')
    parser.add_argument('--stop-after-epoch', type=int)
    parser.add_argument('--stop-file', default='artifacts/rice/STOP_AFTER_EPOCH')
    args = parser.parse_args()
    if args.lr <= 0 or args.patience < 1:
        parser.error('lr and patience must be positive')
    lock_path = Path(__file__).resolve().parents[1]/'artifacts/rice/gpu-training.lock'
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with FileLock(str(lock_path), timeout=0):
        train(args)


if __name__ == '__main__':
    main()
