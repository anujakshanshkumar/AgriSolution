"""Validation-only model selection/calibration, then one held-out test evaluation."""
import argparse
import csv
import hashlib
import shutil
import time
from pathlib import Path

import numpy as np
import timm
import torch

from .common import CLASSES, MODELS, RiceDataset, digest, metrics, preprocessing, read_json, write_json
from .prepare import assert_no_leakage
from .train import loader, predict


def fit_temperature(logits, labels):
    # Bounded scalar grid is deterministic and cannot diverge.
    candidates = torch.logspace(np.log10(.05), np.log10(10), 180)
    losses = [torch.nn.functional.cross_entropy(logits/t, labels).item() for t in candidates]
    return max(.05, min(10., float(candidates[int(np.argmin(losses))])))


def uncertainty_report(probabilities, labels, minimum_threshold=.5):
    p, y = np.asarray(probabilities), np.asarray(labels)
    confidence = p.max(1)
    correct = p.argmax(1) == y
    rows = []
    for threshold in [.0, .5, .6, .7, .75, .8, .85, .9, .95, .98, .99]:
        accepted = confidence >= threshold
        rows.append({'threshold': threshold, 'coverage': float(accepted.mean()),
                     'accepted_count': int(accepted.sum()),
                     'accepted_accuracy': float(correct[accepted].mean()) if accepted.any() else None})
    # A validation operating point, not a guarantee or an OOD detector.
    feasible = [r for r in rows if r['threshold'] >= minimum_threshold and r['accepted_count'] >= 100 and r['accepted_accuracy'] >= .95]
    threshold = feasible[0]['threshold'] if feasible else 1.01  # reject all if unsupported by validation
    return {'threshold': threshold, 'sweep': rows,
            'unknown_disease_detection': 'NOT VALIDATED: no labeled unknown/non-rice validation set',
            'calibration_and_threshold_metrics': 'Fitted on validation; optimistic. Internal test is untouched until selection.'}


@torch.inference_mode()
def benchmark(model, size, device, runs=30):
    x = torch.zeros(1, 3, size, size, device=device)
    for _ in range(5):
        model(x)
    samples = []
    for _ in range(runs):
        if device.type == 'cuda':
            torch.cuda.synchronize()
        start = time.perf_counter()
        model(x)
        if device.type == 'cuda':
            torch.cuda.synchronize()
        samples.append((time.perf_counter()-start)*1000)
    return {'device': str(device), 'runs': runs, 'batch': 1, 'precision': 'float32',
            'median_ms': float(np.median(samples)), 'p95_ms': float(np.quantile(samples, .95)),
            'includes_upload_or_preprocessing': False}


def save_metrics(out, name, measured):
    write_json(out/f'{name}.json', measured)
    with (out/f'{name}_confusion.csv').open('w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['actual/predicted']+CLASSES)
        for label, row in zip(CLASSES, measured['confusion_matrix']):
            writer.writerow([label]+row)


def evaluate(args):
    torch.set_num_threads(4)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    if (out/'internal_test.json').exists() or (out/'test_started.json').exists():
        raise ValueError('Internal test has already been opened in this evaluation. Do not tune on it.')
    manifest_path = Path(args.splits)/'manifest.json'
    manifest = read_json(manifest_path)
    assert_no_leakage(manifest['records'])
    fingerprint = digest(manifest_path)
    val = [r for r in manifest['records'] if r['split'] == 'validation']
    requested_device = getattr(args, 'device', 'auto')
    device = torch.device(('cuda' if torch.cuda.is_available() else 'cpu') if requested_device == 'auto' else requested_device)
    model_names = getattr(args, 'models', list(MODELS))
    minimum_threshold = getattr(args, 'minimum_threshold', .5)
    audit_path = Path(args.splits)/'audit.json'
    audit = read_json(audit_path) if audit_path.exists() else {}
    limitations = {'exact_duplicate_leakage': 'passed',
        'unresolved_cross_split_near_duplicate_pairs': audit.get('cross_split_review_pairs'),
        'interpretation': 'Internal-test metrics are not established as unbiased: wider-threshold near-duplicate candidates remain unresolved; external field accuracy is unmeasured.'}
    candidates = []
    labels = None
    for name in model_names:
        run = Path(args.runs)/name
        if not getattr(args, 'allow_partial', False) and not read_json(run/'summary.json')['complete']:
            raise ValueError('Training has not completed')
        path = run/'best.pt'
        ckpt = torch.load(path, map_location='cpu', weights_only=True)
        cfg = ckpt['config']
        if cfg['smoke'] or cfg['split_sha256'] != fingerprint or cfg['classes'] != CLASSES or cfg['model'] != name:
            raise ValueError('Checkpoint/split mismatch or smoke checkpoint')
        if cfg['preprocessing'] != preprocessing(cfg['size']):
            raise ValueError('Checkpoint preprocessing differs from evaluation code')
        model = timm.create_model(cfg['architecture'], pretrained=False, num_classes=len(CLASSES)).to(device)
        model.load_state_dict(ckpt['model_state'])
        logits, labels = predict(model, loader(RiceDataset(args.data, val, cfg['size'], verify_hashes=True), 8, args.workers, False, manifest['seed']), device)
        temperature = fit_temperature(logits, labels)
        probabilities = (logits/temperature).softmax(1).numpy()
        measured = metrics(probabilities, labels.numpy())
        measured['uncalibrated'] = metrics(logits.softmax(1).numpy(), labels.numpy())
        measured['calibration_temperature'] = temperature
        measured['latency'] = benchmark(model, cfg['size'], device)
        measured['checkpoint_bytes'] = path.stat().st_size
        measured['uncertainty'] = uncertainty_report(probabilities, labels.numpy(), minimum_threshold)
        measured['limitations'] = limitations
        measured['checkpoint_epoch'] = ckpt.get('epoch', -1)+1
        save_metrics(out, f'{name}_validation', measured)
        np.savez_compressed(out/f'{name}_validation_predictions.npz', logits=logits.numpy(), labels=labels.numpy(),
                            image_ids=np.array([r['image_id'] for r in val]))
        candidates.append({'name': name, 'path': path, 'cfg': cfg, 'temperature': temperature,
                           'probabilities': probabilities, 'metrics': measured})
        del model, ckpt
        if device.type == 'cuda':
            torch.cuda.empty_cache()
    def rank(c):
        m = c['metrics']
        return (m['macro_f1'], min(v['recall'] for v in m['per_class'].values()), -m['latency']['median_ms'])
    best = max(candidates, key=rank)
    ensemble_p = np.mean([c['probabilities'] for c in candidates], axis=0)
    gain, use_ensemble = None, False
    if len(candidates) > 1:
        ensemble_metrics = metrics(ensemble_p, labels.numpy())
        ensemble_metrics['sequential_model_latency_estimate_ms'] = sum(c['metrics']['latency']['median_ms'] for c in candidates)
        save_metrics(out, 'ensemble_validation', ensemble_metrics)
        gain = ensemble_metrics['macro_f1']-best['metrics']['macro_f1']
        minority_ok = min(v['recall'] for v in ensemble_metrics['per_class'].values()) >= min(v['recall'] for v in best['metrics']['per_class'].values())
        use_ensemble = args.allow_ensemble and gain >= .01 and minority_ok
    selected = candidates if use_ensemble else [best]
    selected_probs = ensemble_p if use_ensemble else best['probabilities']
    decision = {'selected': [c['name'] for c in selected], 'ensemble_macro_f1_gain': gain,
                'rationale': 'Highest validation macro-F1; minimum class recall and latency break ties. Ensemble requires opt-in, >=0.01 absolute macro-F1 gain and no minimum-recall loss.',
                'split_sha256': fingerprint, 'test_used_for_selection': False,
                'candidate_models': model_names, 'allow_partial_training': getattr(args, 'allow_partial', False),
                'limitations': limitations}
    write_json(out/'selection.json', decision)
    uncertainty = uncertainty_report(selected_probs, labels.numpy(), minimum_threshold)
    write_json(out/'test_started.json', decision)  # Prevent accidental re-opening on rerun.
    test_rows = [r for r in manifest['records'] if r['split'] == 'internal_test']
    test_probabilities, specifications = [], []
    bundle = out/'deployment'
    bundle.mkdir(exist_ok=True)
    for c in selected:
        cfg = c['cfg']
        ckpt = torch.load(c['path'], map_location='cpu', weights_only=True)
        model = timm.create_model(cfg['architecture'], pretrained=False, num_classes=len(CLASSES)).to(device)
        model.load_state_dict(ckpt['model_state'])
        logits, test_labels = predict(model, loader(RiceDataset(args.data, test_rows, cfg['size'], verify_hashes=True), 8, args.workers, False, manifest['seed']), device)
        test_probabilities.append((logits/c['temperature']).softmax(1).numpy())
        filename = c['name']+'.pt'
        shutil.copy2(c['path'], bundle/filename)
        specifications.append({'file': filename, 'sha256': digest(bundle/filename), 'architecture': cfg['architecture'],
                               'size': cfg['size'], 'temperature': c['temperature'], 'preprocessing': cfg['preprocessing']})
        del model, ckpt
    p = np.mean(test_probabilities, axis=0)
    measured = metrics(p, test_labels.numpy())
    measured['limitations'] = limitations
    mask = p.max(1) >= uncertainty['threshold']
    measured['fixed_validation_threshold'] = uncertainty['threshold']
    measured['accepted_coverage'] = float(mask.mean())
    measured['accepted_accuracy'] = float((p.argmax(1)[mask] == test_labels.numpy()[mask]).mean()) if mask.any() else None
    save_metrics(out, 'internal_test', measured)
    np.savez_compressed(out/'internal_test_predictions.npz', probabilities=p, labels=test_labels.numpy(), image_ids=np.array([r['image_id'] for r in test_rows]))
    weights_id = hashlib.sha256(''.join(s['sha256'] for s in specifications).encode()).hexdigest()[:12]
    write_json(bundle/'deployment.json', {'schema_version': 1, 'classes': CLASSES, 'models': specifications,
               'model_version': fingerprint[:12]+'-'+weights_id+'-'+ '-'.join(c['name'] for c in selected),
               'smoke_only': False, 'internal_test_evaluated': True, 'threshold': uncertainty['threshold'],
               'uncertainty': uncertainty, 'field_validation': 'not performed', 'evaluation_limitations': limitations})
    print({'selection': decision, 'internal_test': measured}, flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--data', default='Data')
    parser.add_argument('--splits', default='artifacts/rice/splits')
    parser.add_argument('--runs', default='artifacts/rice/runs')
    parser.add_argument('--out', default='artifacts/rice/evaluation')
    parser.add_argument('--workers', type=int, default=0)
    parser.add_argument('--allow-ensemble', action='store_true')
    parser.add_argument('--models', nargs='+', choices=MODELS, default=list(MODELS))
    parser.add_argument('--allow-partial', action='store_true', help='Evaluate saved best weights from an intentionally shortened run')
    parser.add_argument('--minimum-threshold', type=float, choices=[.5, .6, .7, .75, .8, .85, .9, .95, .98, .99], default=.5)
    parser.add_argument('--device', choices=['auto', 'cpu', 'cuda'], default='auto')
    evaluate(parser.parse_args())
