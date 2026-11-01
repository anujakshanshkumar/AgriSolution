import io
import json
from pathlib import Path

import numpy as np
import pytest
import timm
import torch
from fastapi.testclient import TestClient
from PIL import Image

from rice_model.common import CLASSES, RiceDataset, digest, metrics, preprocessing, write_json
from rice_model.evaluate import fit_temperature, uncertainty_report
from rice_model.prepare import BKTree, assert_no_leakage, assign_splits, inspect_image
from rice_model.runtime import Predictor, decode_image
from rice_model.service import create_app

TOKEN = 'test-only-token-' + 'x'*32


def png(mode='RGB', size=(64, 64)):
    stream = io.BytesIO()
    Image.new(mode, size).save(stream, 'PNG')
    return stream.getvalue()


def test_decode_rgb_and_invalid_inputs():
    assert decode_image(png('L')).mode == 'RGB'
    for bad in [b'', b'not an image', png(size=(2, 2))]:
        with pytest.raises(ValueError):
            decode_image(bad)
    with pytest.raises(ValueError):
        decode_image(png(), max_bytes=5)
    with pytest.raises(ValueError):
        decode_image(png(), max_pixels=10)


def test_dataset_paths_and_labels(tmp_path):
    (tmp_path/'leaf.png').write_bytes(png())
    row = {'path': 'leaf.png', 'label': 'normal'}
    ds = RiceDataset(tmp_path, [row], 224)
    value, label = ds[0]
    assert value.shape == (3, 224, 224) and label == CLASSES.index('normal')
    for row in [{'path': '../secret.png', 'label': 'normal'}, {'path': 'leaf.png', 'label': 'unknown'}]:
        with pytest.raises(ValueError):
            RiceDataset(tmp_path, [row], 224)


def test_pixel_hash_and_bktree(tmp_path):
    a = tmp_path/'a.png'
    b = tmp_path/'b.png'
    a.write_bytes(png())
    b.write_bytes(png())
    assert inspect_image(a)['pixel_hash'] == inspect_image(b)['pixel_hash']
    tree = BKTree()
    for i in range(100):
        tree.add(i*1357, i)
    for query in [0, 17, 539, 98765]:
        assert set(tree.query(query, 4)) == {(i, (query^(i*1357)).bit_count()) for i in range(100) if (query^(i*1357)).bit_count() <= 4}


def test_group_stratification_reproducibility_and_leakage():
    records = [{'label': c, 'group': f'{c}-{i//2}', 'sha256': f'{c}-{i//2}', 'pixel_hash': f'{c}-{i//2}'} for c in CLASSES for i in range(40)]
    clone = json.loads(json.dumps(records))
    assign_splits(records, 42)
    assign_splits(clone, 42)
    assert records == clone
    assert_no_leakage(records)
    for split in ['train', 'validation', 'internal_test']:
        assert {r['label'] for r in records if r['split'] == split} == set(CLASSES)
    records[0]['split'] = 'leaked'
    with pytest.raises(ValueError):
        assert_no_leakage(records)


def test_real_manifests_have_no_leakage():
    path = Path('artifacts/rice/splits/manifest.json')
    if not path.exists():
        pytest.skip('Run dataset preparation first')
    records = json.loads(path.read_text())['records']
    assert_no_leakage(records)
    assert all(r['path'].startswith('train_images/') for r in records)


def test_metrics_and_calibration():
    labels = np.arange(10)
    result = metrics(np.eye(10), labels)
    assert result['accuracy'] == result['macro_f1'] == result['weighted_f1'] == 1
    logits = torch.eye(10)*3
    temperature = fit_temperature(logits, torch.arange(10))
    assert .049 <= temperature <= 10
    assert uncertainty_report(np.eye(10), labels)['threshold'] == 1.01  # insufficient validation support


@pytest.fixture(scope='module')
def bundle(tmp_path_factory):
    torch.set_num_threads(2)
    root = tmp_path_factory.mktemp('test-only-model')
    model = timm.create_model('mobilenetv3_large_100', pretrained=False, num_classes=10)
    config = {'architecture': 'mobilenetv3_large_100', 'size': 224, 'classes': CLASSES, 'smoke': False}
    torch.save({'model_state': model.state_dict(), 'config': config}, root/'model.pt')
    write_json(root/'deployment.json', {'schema_version': 1, 'classes': CLASSES, 'smoke_only': False,
        'internal_test_evaluated': True, 'threshold': .8, 'model_version': 'test-only-random-weights',
        'models': [{'file': 'model.pt', 'sha256': digest(root/'model.pt'), 'architecture': config['architecture'],
                    'size': 224, 'temperature': 1., 'preprocessing': preprocessing(224)}]})
    return root


def test_model_loading_and_prediction(bundle):
    predictor = Predictor(bundle, 'cpu')
    result = predictor.predict(decode_image(png()))
    assert result['riceOnly'] and not result['scopeVerified']
    assert len(result['topThree']) == 3
    assert result['topThree'][0]['label'] == result['label']
    assert result['uncertainty']['needsReview']


@pytest.mark.parametrize('change', ['smoke_only', 'checksum', 'preprocessing', 'classes'])
def test_invalid_model_artifacts_rejected(bundle, tmp_path, change):
    import shutil
    shutil.copy2(bundle/'model.pt', tmp_path/'model.pt')
    metadata = json.loads((bundle/'deployment.json').read_text())
    if change == 'smoke_only': metadata['smoke_only'] = True
    if change == 'checksum': metadata['models'][0]['sha256'] = 'wrong'
    if change == 'preprocessing': metadata['models'][0]['preprocessing']['size'] = 999
    if change == 'classes': metadata['classes'] = CLASSES[::-1]
    write_json(tmp_path/'deployment.json', metadata)
    with pytest.raises(ValueError):
        Predictor(tmp_path, 'cpu')


def test_service_authenticated_upload_and_health(bundle):
    app = create_app(lambda: Predictor(bundle, 'cpu'), TOKEN)
    headers = {'Authorization': 'Bearer '+TOKEN, 'Content-Type': 'image/png'}
    with TestClient(app) as client:
        assert client.get('/health').status_code == 401
        assert client.get('/health', headers=headers).json()['ready']
        assert client.post('/predict', content=png()).status_code == 401
        assert client.post('/predict', content=b'bad', headers=headers).status_code == 400
        assert client.post('/predict', content=png(), headers={**headers, 'Content-Type': 'text/plain'}).status_code == 415
        assert client.post('/predict', content=png(), headers={**headers, 'Content-Length': str(30*1024*1024)}).status_code == 413
        response = client.post('/predict', content=png(), headers=headers)
        assert response.status_code == 200
        assert response.json()['scopeVerified'] is False
        assert response.json()['confidenceType'] == 'temperature_scaled_validation'


def test_service_requires_secret(bundle):
    with pytest.raises(RuntimeError):
        with TestClient(create_app(lambda: Predictor(bundle, 'cpu'), 'short')):
            pass


def test_onnx_export_and_runtime_parity(bundle):
    from rice_model.export import export
    export(bundle)
    result = json.loads((bundle/'onnx_export.json').read_text())
    assert result[0]['checker'] == 'passed'
    assert result[0]['cpu_parity'] in {'passed', 'not run: install onnxruntime'}


def test_evaluation_selects_on_validation_and_opens_test_once(tmp_path, monkeypatch):
    from argparse import Namespace
    from rice_model.common import MODELS
    from rice_model.evaluate import evaluate
    monkeypatch.setattr(torch.cuda, 'is_available', lambda: False)
    torch.set_num_threads(2)
    data, splits, runs, out = [tmp_path/p for p in ['data', 'splits', 'runs', 'evaluation']]
    data.mkdir()
    rows = []
    for s, split in enumerate(['validation', 'internal_test']):
        for i, label in enumerate(CLASSES):
            name = f'{s}-{i}.png'
            Image.new('RGB', (40, 40), (s*80, i*20, 60)).save(data/name)
            rows.append({'image_id': name, 'path': name, 'label': label, 'split': split,
                         'sha256': digest(data/name), 'pixel_hash': name, 'group': name})
    write_json(splits/'manifest.json', {'seed': 42, 'classes': CLASSES, 'records': rows})
    for name, spec in MODELS.items():
        run = runs/name
        run.mkdir(parents=True)
        model = timm.create_model(spec['architecture'], pretrained=False, num_classes=10)
        cfg = {**spec, 'model': name, 'classes': CLASSES, 'smoke': False,
               'split_sha256': digest(splits/'manifest.json'), 'preprocessing': preprocessing(spec['size'])}
        torch.save({'model_state': model.state_dict(), 'config': cfg}, run/'best.pt')
        write_json(run/'summary.json', {'complete': True})
        del model
    args = Namespace(data=str(data), splits=str(splits), runs=str(runs), out=str(out), workers=0, allow_ensemble=False)
    evaluate(args)
    selection = json.loads((out/'selection.json').read_text())
    assert selection['test_used_for_selection'] is False
    assert len(selection['selected']) == 1
    assert (out/'internal_test.json').exists()
    predictor = Predictor(out/'deployment', 'cpu')
    assert predictor.predict(decode_image(png()))['riceOnly']
    with pytest.raises(ValueError, match='already been opened'):
        evaluate(args)
