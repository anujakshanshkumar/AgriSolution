"""Disposable random-weight service exclusively for browser integration tests."""
import os
import tempfile
from pathlib import Path

import timm
import torch
import uvicorn

from rice_model.common import CLASSES, digest, preprocessing, write_json
from rice_model.runtime import Predictor
from rice_model.service import create_app


if __name__ == '__main__':
    torch.set_num_threads(2)
    with tempfile.TemporaryDirectory(prefix='rice-test-only-') as directory:
        root = Path(directory)
        model = timm.create_model('mobilenetv3_large_100', pretrained=False, num_classes=10)
        config = {'architecture': 'mobilenetv3_large_100', 'size': 224, 'classes': CLASSES, 'smoke': False}
        torch.save({'model_state': model.state_dict(), 'config': config}, root/'fixture.pt')
        write_json(root/'deployment.json', {'schema_version': 1, 'classes': CLASSES, 'smoke_only': False,
            'internal_test_evaluated': True, 'threshold': .99, 'model_version': 'test-only-random-weights',
            'models': [{'file': 'fixture.pt', 'sha256': digest(root/'fixture.pt'), 'architecture': config['architecture'],
                       'size': 224, 'temperature': 1., 'preprocessing': preprocessing(224)}]})
        app = create_app(lambda: Predictor(root, 'cpu'))
        uvicorn.run(app, host='127.0.0.1', port=int(os.environ['RICE_TEST_PORT']), access_log=False)
