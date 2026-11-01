"""Export each selected model's logits. Calibration metadata stays in the bundle."""
import argparse
from pathlib import Path

import numpy as np
import onnx
import timm
import torch

from .common import CLASSES, read_json, write_json


def export(bundle):
    bundle = Path(bundle)
    metadata = read_json(bundle/'deployment.json')
    torch.set_num_threads(4)
    results = []
    for spec in metadata['models']:
        checkpoint = torch.load(bundle/spec['file'], map_location='cpu', weights_only=True)
        model = timm.create_model(spec['architecture'], pretrained=False, num_classes=len(CLASSES)).eval()
        model.load_state_dict(checkpoint['model_state'])
        sample = torch.randn(1, 3, spec['size'], spec['size'])
        path = bundle/Path(spec['file']).with_suffix('.onnx')
        torch.onnx.export(model, sample, str(path), input_names=['image'], output_names=['logits'],
                          dynamic_axes={'image': {0: 'batch'}, 'logits': {0: 'batch'}}, opset_version=17)
        onnx.checker.check_model(onnx.load(path))
        record = {'file': path.name, 'bytes': path.stat().st_size, 'checker': 'passed',
                  'output': 'logits; divide by model temperature then softmax; average model probabilities for ensemble'}
        try:
            import onnxruntime as ort
            session = ort.InferenceSession(str(path), providers=['CPUExecutionProvider'])
            actual = session.run(None, {'image': sample.numpy()})[0]
            with torch.inference_mode():
                expected = model(sample).numpy()
            np.testing.assert_allclose(actual, expected, atol=1e-4, rtol=1e-3)
            record['cpu_parity'] = 'passed'
        except ImportError:
            record['cpu_parity'] = 'not run: install onnxruntime'
        results.append(record)
    write_json(bundle/'onnx_export.json', results)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--bundle', default='artifacts/rice/evaluation/deployment')
    export(parser.parse_args().bundle)
