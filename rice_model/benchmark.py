import argparse
import time
from pathlib import Path

import numpy as np
import torch
from PIL import Image

from .common import write_json
from .runtime import Predictor


def benchmark(bundle):
    torch.set_num_threads(4)
    measurements = {}
    reference = None
    for device in ['cpu'] + (['cuda'] if torch.cuda.is_available() else []):
        start = time.perf_counter()
        predictor = Predictor(bundle, device)
        load_seconds = time.perf_counter()-start
        image = Image.new('RGB', (480, 640), (70, 110, 40))
        # Synthetic input measures execution/parity, never diagnostic accuracy.
        for _ in range(5):
            predictor.predict(image)
        times = [predictor.predict(image)['inferenceMs'] for _ in range(30)]
        result = predictor.predict(image)
        if reference:
            if [p['label'] for p in reference['topThree']] != [p['label'] for p in result['topThree']]:
                raise ValueError('CPU/CUDA prediction ordering mismatch')
            np.testing.assert_allclose([p['confidence'] for p in reference['topThree']],
                                       [p['confidence'] for p in result['topThree']], atol=1e-4, rtol=1e-3)
        reference = result
        measurements[device] = {'startup_seconds': load_seconds, 'median_ms': float(np.median(times)),
                                'p95_ms': float(np.quantile(times, .95)), 'runs': 30,
                                'includes_preprocessing': True, 'includes_network': False,
                                'input': 'synthetic 480x640 image; not an accuracy test'}
        del predictor
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    write_json(Path(bundle)/'runtime_benchmark.json', measurements)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--bundle', default='artifacts/rice/evaluation/deployment')
    benchmark(parser.parse_args().bundle)
