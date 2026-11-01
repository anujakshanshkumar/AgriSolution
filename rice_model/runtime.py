"""Dataset-independent inference; only a deployment bundle is needed."""
import io
import time
import warnings
from pathlib import Path

import timm
import torch
from PIL import Image, ImageOps, UnidentifiedImageError

from .common import CLASSES, digest, preprocessing, read_json, transform

SCOPE_WARNING = ('Rice only: scores compare the 10 trained classes. Rice identity and unknown diseases '
                 'are not verified by this model. Field-photo accuracy has not been established.')


def decode_image(data, max_bytes=10*1024*1024, max_pixels=25_000_000):
    if not data or len(data) > max_bytes:
        raise ValueError('Empty image or upload too large')
    with warnings.catch_warnings():
        warnings.simplefilter('error', Image.DecompressionBombWarning)
        try:
            with Image.open(io.BytesIO(data)) as im:
                if im.format not in {'JPEG', 'PNG', 'WEBP'} or getattr(im, 'n_frames', 1) != 1:
                    raise ValueError('Use one still JPEG, PNG, or WebP image')
                if im.width*im.height > max_pixels or min(im.size) < 32:
                    raise ValueError('Image dimensions are unsupported')
                im.load()
                return ImageOps.exif_transpose(im).convert('RGB')
        except (OSError, UnidentifiedImageError, Image.DecompressionBombError, Image.DecompressionBombWarning) as error:
            raise ValueError('Image could not be safely decoded') from error


class Predictor:
    def __init__(self, bundle, device='auto'):
        torch.backends.cudnn.allow_tf32 = False
        torch.backends.cuda.matmul.allow_tf32 = False
        bundle = Path(bundle).resolve()
        metadata = read_json(bundle/'deployment.json')
        if metadata.get('schema_version') != 1 or metadata.get('classes') != CLASSES:
            raise ValueError('Invalid model metadata or class mapping')
        if metadata.get('smoke_only') is not False or not metadata.get('internal_test_evaluated'):
            raise ValueError('Only evaluated, non-smoke models can be served')
        if not 0 <= metadata.get('threshold', -1) <= 1.01:
            raise ValueError('Invalid confidence threshold')
        self.device = torch.device(('cuda' if torch.cuda.is_available() else 'cpu') if device == 'auto' else device)
        self.metadata = metadata
        self.models = []
        if not 1 <= len(metadata['models']) <= 2:
            raise ValueError('Expected one or two models')
        for spec in metadata['models']:
            path = (bundle/spec['file']).resolve()
            if not path.is_relative_to(bundle) or digest(path) != spec['sha256']:
                raise ValueError('Checkpoint checksum mismatch or invalid path')
            if spec['preprocessing'] != preprocessing(spec['size']) or not .05 <= spec['temperature'] <= 10:
                raise ValueError('Unsupported preprocessing or calibration')
            checkpoint = torch.load(path, map_location='cpu', weights_only=True)
            if checkpoint['config']['smoke'] or checkpoint['config']['classes'] != CLASSES:
                raise ValueError('Invalid checkpoint')
            if checkpoint['config']['architecture'] != spec['architecture'] or checkpoint['config']['size'] != spec['size']:
                raise ValueError('Checkpoint configuration mismatch')
            model = timm.create_model(spec['architecture'], pretrained=False, num_classes=len(CLASSES))
            model.load_state_dict(checkpoint['model_state'], strict=True)
            model.to(self.device).eval()
            self.models.append((model, transform(spec['size']), spec['temperature']))

    @torch.inference_mode()
    def predict(self, image):
        start = time.perf_counter()
        values = []
        for model, preprocess, temperature in self.models:
            logits = model(preprocess(image).unsqueeze(0).to(self.device)).float()
            values.append((logits/temperature).softmax(1).cpu())
        probabilities = torch.stack(values).mean(0)[0]
        if not torch.isfinite(probabilities).all():
            raise RuntimeError('Non-finite predictions')
        scores, indices = probabilities.topk(3)
        top = [{'label': CLASSES[int(i)], 'confidence': float(s)} for s, i in zip(scores, indices)]
        low = top[0]['confidence'] < self.metadata['threshold']
        return {'schemaVersion': 1, 'modelVersion': self.metadata['model_version'],
                'label': top[0]['label'], 'confidence': top[0]['confidence'],
                'confidenceType': 'temperature_scaled_validation', 'topThree': top,
                'uncertainty': {'status': 'low_confidence' if low else 'scope_unverified',
                                'needsReview': True, 'threshold': self.metadata['threshold'],
                                'reasons': (['Low confidence among the supported classes.'] if low else []) + [SCOPE_WARNING]},
                'riceOnly': True, 'scopeVerified': False,
                'inferenceMs': (time.perf_counter()-start)*1000}
