"""CPU timing and CPU/CUDA numerical checks of explicitly non-production smoke weights."""
import time
from pathlib import Path

import numpy as np
import timm
import torch
from PIL import Image

from .common import CLASSES, MODELS, transform, write_json


def main():
    torch.set_num_threads(2)
    torch.backends.cudnn.allow_tf32 = False
    torch.backends.cuda.matmul.allow_tf32 = False
    results = {}
    image = Image.new('RGB', (480, 640), (50, 130, 60))
    for name in MODELS:
        checkpoint = torch.load(Path('artifacts/rice/smoke_verified')/f'{name}_smoke/best.pt', map_location='cpu', weights_only=True)
        cfg = checkpoint['config']
        if not cfg['smoke']:
            raise ValueError('This command expects only smoke checkpoints')
        model = timm.create_model(cfg['architecture'], pretrained=False, num_classes=len(CLASSES)).eval()
        model.load_state_dict(checkpoint['model_state'])
        preprocess = transform(cfg['size'])
        with torch.inference_mode():
            for _ in range(3):
                model(preprocess(image).unsqueeze(0))
            samples = []
            for _ in range(20):
                start = time.perf_counter()
                cpu_logits = model(preprocess(image).unsqueeze(0))
                samples.append((time.perf_counter()-start)*1000)
            cuda_parity = 'not available'
            if torch.cuda.is_available():
                model.to('cuda')
                cuda_logits = model(preprocess(image).unsqueeze(0).to('cuda')).cpu()
                torch.testing.assert_close(cpu_logits, cuda_logits, atol=1e-4, rtol=1e-3)
                cuda_parity = 'passed'
        results[name] = {'smoke_only': True, 'cpu_threads': 2, 'cpu_median_ms': float(np.median(samples)),
                         'cpu_p95_ms': float(np.quantile(samples, .95)), 'cpu_cuda_parity': cuda_parity,
                         'includes_preprocessing': True, 'runs': 20,
                         'notes': 'Synthetic image and smoke weights. Other training may be active. Not final deployment latency or accuracy.'}
        del model, checkpoint
    write_json('artifacts/rice/smoke_verified/inference_checks.json', results)
    print(results)


if __name__ == '__main__':
    main()
