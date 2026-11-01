import hashlib
import json
import os
import random
from pathlib import Path

import numpy as np
import torch
from PIL import Image, ImageOps
from torch.utils.data import Dataset
from torchvision import transforms as T

CLASSES = ['bacterial_leaf_blight', 'bacterial_leaf_streak', 'bacterial_panicle_blight',
           'blast', 'brown_spot', 'dead_heart', 'downy_mildew', 'hispa', 'normal', 'tungro']
MODELS = {
    'efficientnet_b2': {'architecture': 'efficientnet_b2', 'size': 256, 'batch': 8, 'epochs': 40},
    'mobilenetv3_large': {'architecture': 'mobilenetv3_large_100', 'size': 224, 'batch': 16, 'epochs': 35},
}
MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]


def read_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def write_json(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(data, indent=2, allow_nan=False), encoding='utf-8')
    os.replace(tmp, path)


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def seed_all(seed):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.benchmark = False
    torch.backends.cudnn.deterministic = True


def seed_worker(worker_id):
    seed = torch.initial_seed() % 2**32
    random.seed(seed)
    np.random.seed(seed)


def preprocessing(size):
    return {'size': size, 'resize': 'square', 'interpolation': 'bilinear',
            'mean': MEAN, 'std': STD, 'exif_transpose': True, 'color': 'RGB'}


def transform(size, train=False):
    ops = [T.RandomResizedCrop(size, scale=(0.65, 1.0), ratio=(0.8, 1.25)),
           T.RandomHorizontalFlip(), T.RandomRotation(12),
           T.ColorJitter(brightness=0.18, contrast=0.18, saturation=0.15)] if train else [
               T.Resize((size, size), interpolation=T.InterpolationMode.BILINEAR, antialias=True)]
    return T.Compose(ops + [T.ToTensor(), T.Normalize(MEAN, STD)])


class RiceDataset(Dataset):
    def __init__(self, root, records, size, train=False, verify_hashes=False):
        self.root = Path(root).resolve()
        self.records = records
        self.transform = transform(size, train)
        for row in records:
            path = (self.root / row['path']).resolve()
            if not path.is_relative_to(self.root) or not path.is_file():
                raise ValueError(f"Invalid image path: {row['path']}")
            if row['label'] not in CLASSES:
                raise ValueError('Unknown class')
            if verify_hashes and digest(path) != row['sha256']:
                raise ValueError(f"Image changed since preparation: {row['path']}")

    def __len__(self):
        return len(self.records)

    def __getitem__(self, index):
        row = self.records[index]
        with Image.open(self.root / row['path']) as image:
            value = self.transform(ImageOps.exif_transpose(image).convert('RGB'))
        return value, CLASSES.index(row['label'])


def metrics(probabilities, labels):
    p = np.asarray(probabilities)
    y = np.asarray(labels)
    pred = p.argmax(1)
    cm = np.zeros((len(CLASSES), len(CLASSES)), dtype=int)
    np.add.at(cm, (y, pred), 1)
    tp = np.diag(cm)
    precision = tp / np.maximum(cm.sum(0), 1)
    recall = tp / np.maximum(cm.sum(1), 1)
    f1 = 2 * precision * recall / np.maximum(precision + recall, 1e-12)
    support = cm.sum(1)
    confidence = p.max(1)
    correct = pred == y
    ece = 0.0
    for lo in np.linspace(0, .9, 10):
        mask = (confidence >= lo) & (confidence < lo + .1 + (1e-7 if lo > .89 else 0))
        if mask.any():
            ece += mask.mean() * abs(confidence[mask].mean() - correct[mask].mean())
    return {'accuracy': float(correct.mean()), 'macro_f1': float(f1.mean()),
            'weighted_f1': float(np.average(f1, weights=support)), 'ece_10_bins': float(ece),
            'nll': float(-np.log(np.clip(p[np.arange(len(y)), y], 1e-12, 1)).mean()),
            'confusion_matrix': cm.tolist(),
            'per_class': {c: {'precision': float(precision[i]), 'recall': float(recall[i]),
                              'f1': float(f1[i]), 'support': int(support[i])} for i, c in enumerate(CLASSES)},
            'confidence_quantiles': dict(zip(['min', 'p25', 'p50', 'p75', 'p95', 'max'],
                                              np.quantile(confidence, [0, .25, .5, .75, .95, 1]).tolist()))}
