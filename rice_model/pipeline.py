"""Sequential resumable training runner. Full models never share the GPU."""
import json
import os
import subprocess
import sys
import time
from pathlib import Path
from filelock import FileLock

from .common import MODELS, read_json, write_json


def main():
    root = Path(__file__).resolve().parents[1]
    os.chdir(root)
    status_path = root/'artifacts/rice/pipeline_status.json'
    started = time.time()
    plan_path = root/'artifacts/rice/execution_plan.json'
    plan = read_json(plan_path) if plan_path.exists() else {'models': list(MODELS), 'train': True}
    names = plan['models']
    if not names or any(name not in MODELS for name in names):
        raise ValueError('Invalid models in execution plan')
    def run(module, *args):
        write_json(status_path, {'state': 'running', 'phase': module, 'args': args, 'pid': os.getpid(), 'started_at_unix': started})
        subprocess.run([sys.executable, '-u', '-m', module, *args], check=True, cwd=root)
    try:
        for name in (names if plan.get('train', True) else []):
            if (root/'artifacts/rice/STOP_AFTER_EPOCH').exists():
                raise KeyboardInterrupt('Cooperative stop requested; queued model training was skipped')
            smoke = read_json(root/f'artifacts/rice/smoke_verified/{name}_smoke/summary.json')
            if not smoke['complete'] or not smoke['smoke_only']:
                raise ValueError('Verified smoke tests required before full training')
            history = read_json(root/f'artifacts/rice/smoke_verified/{name}_smoke/history.json')
            if not all(h.get('optimizer_updates', 0) > 0 for h in history):
                raise ValueError('Smoke test did not update weights')
            run_dir = root/f'artifacts/rice/runs/{name}'
            if not (run_dir/'summary.json').exists():
                resume = ['--resume'] if (run_dir/'last.pt').exists() else []
                run('rice_model.train', '--model', name, *resume)
        if not (root/'artifacts/rice/evaluation/deployment/deployment.json').exists():
            partial = ['--allow-partial'] if not plan.get('train', True) else []
            run('rice_model.evaluate', '--models', *names, '--minimum-threshold', str(plan.get('minimum_threshold', .5)), *partial)
        run('rice_model.export')
        run('rice_model.benchmark')
        write_json(status_path, {'state': 'complete', 'seconds': time.time()-started,
                                'deployment': 'artifacts/rice/evaluation/deployment'})
    except BaseException as error:
        write_json(status_path, {'state': 'interrupted_or_failed', 'seconds': time.time()-started,
                                'error': str(error), 'resume': 'python -m rice_model.pipeline'})
        raise


if __name__ == '__main__':
    lock_path = Path(__file__).resolve().parents[1]/'artifacts/rice/pipeline.lock'
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with FileLock(str(lock_path), timeout=0):
        main()
