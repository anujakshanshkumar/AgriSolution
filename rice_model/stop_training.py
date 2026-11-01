"""Windows controller for an already-running legacy trainer without a stop-file hook.

Only sends a normal console CTRL+C after a complete checkpoint is verified and
the trainer has announced an early batch in the next epoch. Never uses taskkill.
"""
import argparse
import ctypes
import os
import shutil
import time
from pathlib import Path

import torch

from .common import CLASSES, digest, read_json, write_json


def interrupt_console(target_pid, expected_pids):
    kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    kernel.FreeConsole()
    if not kernel.AttachConsole(target_pid):
        raise OSError(ctypes.get_last_error(), 'Cannot attach to training console')
    try:
        kernel.SetConsoleCtrlHandler(None, True)  # Ignore CTRL+C only in this controller.
        pids = (ctypes.c_uint32*128)()
        count = kernel.GetConsoleProcessList(pids, 128)
        actual = set(pids[:count])
        if count > 128 or target_pid not in actual or not actual <= set(expected_pids) | {os.getpid()}:
            raise RuntimeError(f'Refusing to signal unexpected console processes: {sorted(actual)}')
        if not kernel.GenerateConsoleCtrlEvent(0, 0):
            raise OSError(ctypes.get_last_error(), 'CTRL+C delivery failed')
        time.sleep(.5)
        return sorted(actual)
    finally:
        kernel.FreeConsole()


def stop(args):
    if os.name != 'nt':
        raise RuntimeError('This controller is for the inspected Windows console runner')
    root = Path('artifacts/rice')
    run = root/'runs/efficientnet_b2'
    deadline = time.monotonic()+args.timeout
    while time.monotonic() < deadline:
        history = read_json(run/'history.json')
        lines = (root/'training.log').read_text(encoding='utf-8').splitlines()
        events = []
        import json
        for line in lines[-10:]:
            try: events.append(json.loads(line))
            except ValueError: pass
        last = events[-1] if events else {}
        completed = history[-1]['epoch']
        early_batch = last.get('event') == 'batch' and last.get('epoch') == completed+1 and last.get('step', 9999) <= 300
        recent = time.time()-(root/'training.log').stat().st_mtime < 30
        if completed >= args.after_epoch and early_batch and recent and not list(run.glob('*.tmp')):
            checkpoint = torch.load(run/'best.pt', map_location='cpu', weights_only=True)
            if checkpoint['config']['classes'] != CLASSES or checkpoint['config']['smoke']:
                raise ValueError('Best checkpoint is invalid')
            best_epoch = checkpoint['epoch']+1
            target = root/'preserved'/f'efficientnet_b2_epoch_{best_epoch}.pt'
            target.parent.mkdir(exist_ok=True)
            source_hash = digest(run/'best.pt')
            shutil.copy2(run/'best.pt', target)
            if digest(target) != source_hash or digest(run/'best.pt') != source_hash or list(run.glob('*.tmp')):
                raise RuntimeError('Checkpoint changed; no signal sent')
            pids = interrupt_console(args.pid, args.console_pids)
            record = {'reason': 'User requested deadline deployment; skip queued MobileNet training',
                      'completed_epochs': completed, 'best_epoch': best_epoch, 'preserved_checkpoint': str(target),
                      'sha256': source_hash, 'signal': 'Windows console CTRL+C / Python KeyboardInterrupt',
                      'console_pids': pids, 'interrupted_batch': last, 'sent_at_unix': time.time()}
            write_json(root/'deadline_stop.json', record)
            print(record, flush=True)
            return
        time.sleep(.5)
    raise TimeoutError('No safe early-batch checkpoint boundary observed; training was not signaled')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--pid', type=int, required=True)
    parser.add_argument('--console-pids', type=int, nargs='+', required=True)
    parser.add_argument('--after-epoch', type=int, default=8)
    parser.add_argument('--timeout', type=int, default=900)
    stop(parser.parse_args())
