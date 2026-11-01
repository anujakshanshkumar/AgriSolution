"""Read-only image audit; deterministic manifests, exact/near-duplicate groups."""
import argparse
import csv
import hashlib
import json
import random
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

from .common import CLASSES, digest, write_json


class BKTree:
    def __init__(self):
        self.root = None

    def add(self, value, index):
        if self.root is None:
            self.root = (value, [index], {})
            return
        node = self.root
        while True:
            distance = (value ^ node[0]).bit_count()
            if distance == 0:
                node[1].append(index)
                return
            if distance not in node[2]:
                node[2][distance] = (value, [index], {})
                return
            node = node[2][distance]

    def query(self, value, radius):
        stack = [self.root] if self.root else []
        while stack:
            node = stack.pop()
            distance = (value ^ node[0]).bit_count()
            if distance <= radius:
                for index in node[1]:
                    yield index, distance
            stack.extend(child for d, child in node[2].items() if distance-radius <= d <= distance+radius)


def inspect_image(path):
    with Image.open(path) as im:
        im.load()
        rgb = ImageOps.exif_transpose(im).convert('RGB')
        pixel_hash = hashlib.sha256(str(rgb.size).encode() + rgb.tobytes()).hexdigest()
        a = np.asarray(rgb.resize((9, 8)).convert('L'))
        dhash = int.from_bytes(np.packbits(a[:, 1:] > a[:, :-1]).tobytes(), 'big')
        return {'sha256': digest(path), 'pixel_hash': pixel_hash, 'dhash': f'{dhash:016x}',
                'width': rgb.width, 'height': rgb.height}


def assert_no_leakage(records):
    for field in ['sha256', 'pixel_hash', 'group']:
        locations = defaultdict(set)
        for row in records:
            locations[row[field]].add(row['split'])
        if any(len(splits) != 1 for splits in locations.values()):
            raise ValueError(f'Duplicate leakage in {field}')


def assign_splits(rows, seed):
    groups = defaultdict(list)
    for r in rows:
        groups[r['group']].append(r)
    items = sorted(groups.items())
    random.Random(seed).shuffle(items)
    items.sort(key=lambda item: -len(item[1]))
    totals = np.array([sum(r['label'] == c for r in rows) for c in CLASSES])
    targets = np.array([.8, .1, .1])[:, None] * totals[None, :]
    counts = np.zeros_like(targets)
    names = ['train', 'validation', 'internal_test']
    for _, group in items:
        n = np.array([sum(r['label'] == c for r in group) for c in CLASSES])
        costs = (((counts + n - targets)**2 - (counts-targets)**2) / np.maximum(targets, 1)).sum(1)
        split = int(costs.argmin())
        counts[split] += n
        for r in group:
            r['split'] = names[split]
    if (counts == 0).any():
        raise ValueError('Every partition must contain every class; inspect duplicate groups.')


def prepare(root, out, seed=42, near_radius=4, review_radius=8):
    root, out = Path(root).resolve(), Path(out)
    if (out / 'manifest.json').exists():
        raise ValueError('Manifests already exist. Use a new output directory to preserve split identity.')
    with (root / 'train.csv').open(newline='', encoding='utf-8-sig') as f:
        rows = list(csv.DictReader(f))
    if set(rows[0]) != {'image_id', 'label', 'variety', 'age'}:
        raise ValueError('Unexpected CSV columns')
    ids = set()
    for r in rows:
        if r['label'] not in CLASSES or Path(r['image_id']).name != r['image_id'] or r['image_id'] in ids:
            raise ValueError(f'Invalid label or image ID: {r}')
        if not r['variety'] or not r['age'].isdigit():
            raise ValueError(f'Invalid metadata: {r}')
        ids.add(r['image_id'])
        r['path'] = f"train_images/{r['label']}/{r['image_id']}"
        if not (root / r['path']).is_file():
            raise ValueError(f"Missing {r['path']}")
    if {p.relative_to(root).as_posix() for p in (root/'train_images').rglob('*.jpg')} != {r['path'] for r in rows}:
        raise ValueError('Unlisted training images')
    print(f'Validating and hashing {len(rows)} labeled images...', flush=True)
    with ThreadPoolExecutor(max_workers=4) as pool:
        for row, info in zip(rows, pool.map(inspect_image, [root/r['path'] for r in rows])):
            row.update(info)
    parents = list(range(len(rows)))
    def find(i):
        while parents[i] != i:
            parents[i] = parents[parents[i]]
            i = parents[i]
        return i
    def union(i, j):
        a, b = find(i), find(j)
        parents[max(a,b)] = min(a,b)
    hashes = {}
    exact_pairs = []
    for i, row in enumerate(rows):
        if row['pixel_hash'] in hashes:
            j = hashes[row['pixel_hash']]
            if row['label'] != rows[j]['label']:
                raise ValueError('Identical training images have conflicting labels')
            union(i, j)
            exact_pairs.append([rows[j]['image_id'], row['image_id']])
        hashes[row['pixel_hash']] = i
    print('Checking perceptual similarities (review candidates, not confirmed duplicates)...', flush=True)
    tree, near = BKTree(), []
    for i, r in enumerate(rows):
        value = int(r['dhash'], 16)
        for j, distance in tree.query(value, review_radius):
            if r['pixel_hash'] == rows[j]['pixel_hash']:
                continue
            near.append({'a': rows[j]['image_id'], 'b': r['image_id'], 'distance': distance,
                         'grouped': distance <= near_radius})
            if distance <= near_radius:
                union(i, j)  # Keep suspicious close matches together; never delete images.
        tree.add(value, i)
    for i, r in enumerate(rows):
        r['group'] = rows[find(i)]['image_id']
    assign_splits(rows, seed)
    assert_no_leakage(rows)
    lookup = {r['image_id']: r for r in rows}
    for pair in near:
        pair['cross_split'] = lookup[pair['a']]['split'] != lookup[pair['b']]['split']
    original_test = sorted((root/'test_images').glob('*.jpg'))
    with (root/'sample_submission.csv').open(newline='', encoding='utf-8-sig') as f:
        submission = list(csv.DictReader(f))
    if len(submission) != len({r['image_id'] for r in submission}) or any(r['label'] for r in submission):
        raise ValueError('Invalid unlabeled test manifest')
    if {p.name for p in original_test} != {r['image_id'] for r in submission}:
        raise ValueError('Original test image/CSV mismatch')
    train_hashes = defaultdict(list)
    for r in rows:
        train_hashes[r['sha256']].append(r['image_id'])
    overlap = [{'test_image': p.name, 'train_images': train_hashes[h]} for p in original_test
               if (h := digest(p)) in train_hashes]
    stats = {}
    for split in ['train', 'validation', 'internal_test']:
        subset = [r for r in rows if r['split'] == split]
        stats[split] = {'count': len(subset), 'classes': dict(Counter(r['label'] for r in subset)),
                        'varieties': dict(Counter(r['variety'] for r in subset))}
        write_json(out / f'{split}.json', subset)
    write_json(out/'manifest.json', {'version': 1, 'seed': seed, 'classes': CLASSES, 'records': rows,
                                    'near_group_radius': near_radius, 'review_radius': review_radius})
    write_json(out/'near_duplicate_review.json', near)
    write_json(out/'audit.json', {'source_csv_sha256': digest(root/'train.csv'), 'seed': seed,
        'partitions': stats, 'exact_duplicate_extra_images': len(exact_pairs), 'exact_pairs': exact_pairs,
        'near_pairs': len(near), 'cross_split_review_pairs': sum(p['cross_split'] for p in near),
        'original_test_count': len(original_test), 'original_test_overlap': overlap,
        'limitations': 'dHash is a heuristic. Review near_duplicate_review.json. No image was deleted. Original test is never used for evaluation.'})
    print(json.dumps(stats, indent=2), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--data', default='Data')
    parser.add_argument('--out', default='artifacts/rice/splits')
    parser.add_argument('--seed', type=int, default=42)
    args = parser.parse_args()
    prepare(args.data, args.out, args.seed)
