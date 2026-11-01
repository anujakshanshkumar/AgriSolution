# Local rice disease classifier

## Current deployed release — November 1, 2026

EfficientNet-B2 **epoch 8** is deployed on CPU at **http://127.0.0.1:3000/plant-disease.html**. Training was stopped with a normal Python console interrupt after checkpoint completion; the best checkpoint was preserved first. Full MobileNetV3 training is deferred. `artifacts/rice/execution_plan.json` now sets `train: false` and selects only EfficientNet-B2, so restarting the pipeline does not restart training or launch MobileNetV3.

Validation accuracy/macro-F1: **96.16% / 95.77%**. Internal-test accuracy/macro-F1: **95.00% / 94.61%**, evaluated once after selection and validation-only temperature calibration. These internal-test results are **not established as unbiased** because 1,466 cross-partition perceptual candidate pairs remain unresolved. They are not field-photo accuracy estimates. The deployed confidence threshold is **0.85** and temperature is **1.50413**. Warm CPU inference measured **40.7 ms median / 51.9 ms p95**, including preprocessing and excluding uploads/network.

The real deployed browser path passed with actual registration/login, model predictions, top-three scores, low-confidence warnings, and database ownership enforcement. Temporary test users and reports were removed. See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for the final release record.

For later startup (the portal is already running now):

```powershell
npm.cmd start
```

Do not rerun the internal-test evaluation to tune this release. The commands below also document reusable training workflows for future, separately controlled experiments.

This adds local image classification to the existing HTML/JavaScript + Node/Express + MongoDB portal. Authentication, image validation, history ownership, rate limits and Gemini remain in place. `npm.cmd start` starts the local rice provider, frontend, backend, and speech together after an evaluated deployment bundle exists. `npm.cmd run start:rice` remains an alias for the same workflow.

The classifier covers ten rice categories, including Normal. Predictions are conditional on the photo depicting a supported rice condition. It has **no validated rice/non-rice or unknown-disease detector**. Every result requests review and states that field accuracy is unmeasured. An explicitly selected non-rice crop is rejected without classification. Confidence is temperature-scaled on validation data, not a probability of a confirmed diagnosis. No treatment is generated from the numeric score.

## Environment and installation

Run all commands from `C:\Users\anuja\OneDrive\AgriSolution` in PowerShell. The working environment discovered in this project is `speech\.venv`, not a root `.venv`. It reports PyTorch 2.5.1+cu124, torchvision 0.20.1+cu124 and RTX 2050 CUDA support. Set the interpreter explicitly to avoid selecting global CPU-only PyTorch:

```powershell
$ricePython = '.\speech\.venv\Scripts\python.exe'
& $ricePython -c "import torch; print(torch.__version__, torch.cuda.is_available()); print(torch.cuda.get_device_name(0))"
& $ricePython -m pip install -r rice_model/requirements.txt
& $ricePython -m pip check
```

For a separate fresh environment, use `python -m venv .venv`, set `$ricePython = '.\.venv\Scripts\python.exe'`, then install CUDA wheels **before** the requirements:

```powershell
& $ricePython -m pip install torch==2.5.1 torchvision==0.20.1 --index-url https://download.pytorch.org/whl/cu124
& $ricePython -m pip install -r rice_model/requirements.txt
```

Training initially downloads ImageNet weights for `efficientnet_b2.ra_in1k` and `mobilenetv3_large_100.ra_in1k`. Inference never downloads weights. Existing Hugging Face hub 2.x was incompatible with the pinned timm API; requirements pin hub 0.30.2 and requests. Speech regression tests and `pip check` should be run if sharing the environment. A snapshot of the environment used for this run is saved under `artifacts/rice/environment.txt`.

## Dataset preparation

```powershell
& $ricePython -m rice_model.prepare --data Data --out artifacts/rice/splits --seed 42
```

This reads images without modifying them. Existing manifests are never overwritten; choose another `--out` for a new experiment. It checks CSV IDs/labels/metadata, image decoding, file and decoded-pixel SHA-256, and original test membership. All original labeled images are preserved. Exact duplicates with conflicting labels fail preparation.

Duplicate groups and dHash pairs with Hamming distance <=4 are kept together. This conservative grouping does not assert that every perceptual match is a duplicate. A deterministic greedy assignment approximates 80/10/10 class stratification. All classes must appear in every partition. `audit.json` reports per-partition class and variety counts. Image inference never requires variety or age.

The current split contains **8,326 / 1,041 / 1,040** training/validation/internal-test records. There are **74 redundant labeled images**, **7,665 perceptual candidate pairs** at distance <=8, and **1,466 candidate pairs crossing partitions** at the wider review threshold. Review `near_duplicate_review.json`; these could include both genuine related captures and false matches. Exact hash and close perceptual groups have no cross-partition leakage. Session/plant identifiers are unavailable, so independence of different photographs is not established.

The 3,469 original test images are only checked for file membership and exact training overlap. They never enter training, model selection, calibration, accuracy evaluation or the inference bundle. They have no ground-truth labels.

## Smoke tests and training

```powershell
& $ricePython -m rice_model.train --model efficientnet_b2 --smoke --out artifacts/rice/smoke_verified
& $ricePython -m rice_model.train --model mobilenetv3_large --smoke --out artifacts/rice/smoke_verified
```

Each smoke test uses 20 labeled training images and 10 validation images, verifies real optimizer updates, and writes explicitly marked smoke checkpoints. Their metrics are not useful accuracy estimates. Smoke models are refused by evaluation and production loading. To re-run a smoke test use another output directory, or resume a completed smoke run solely to verify checkpoint loading.

Run the complete sequential pipeline after smoke tests:

```powershell
& $ricePython -u -m rice_model.pipeline
```

Without an execution-plan override, the runner trains EfficientNet-B2 first (256 px, batch 8, max 40 epochs), then MobileNetV3-Large (224 px, batch 16, max 35 epochs), selects/calibrates/evaluates, exports ONNX, and benchmarks the deployment on CPU and CUDA. The current deadline plan overrides this: no additional training runs and only B2 is selected. It never trains both simultaneously. Do not start another runner while one is active.

Independent commands, also useful for changing worker count:

```powershell
& $ricePython -u -m rice_model.train --model efficientnet_b2 --workers 0
& $ricePython -u -m rice_model.train --model mobilenetv3_large --workers 0
# Resume from the last completed epoch; an interrupted epoch is replayed.
& $ricePython -u -m rice_model.train --model efficientnet_b2 --resume
```

Each model uses ImageNet initialization, image-only inputs, AdamW, cosine LR, AMP, gradient clipping, square-root inverse class-frequency loss weights, random resized crops, horizontal flips, modest rotation and color jitter. Validation uses RGB, EXIF orientation, square bilinear resize, and ImageNet normalization, with no random augmentation. Early stopping uses validation macro-F1 (patience 7). Seed 42 is recorded; each epoch and loader has deterministic seeds. GPU kernels, framework versions and hardware may still affect exact bitwise reproducibility.

`--batch-size`, `--workers`, `--lr`, `--epochs` and `--patience` are configurable. Windows defaults to workers 0. GPU OOM retries the whole epoch from the last saved checkpoint at half batch size, down to 2. The checkpoint contains weights, optimizer, LR scheduler, AMP scaler, epoch, history and split fingerprint. Changing the model, split, seed, epoch budget or LR while resuming is rejected. Progress includes peak allocated/reserved GPU memory and actual epoch time.

New trainer invocations support `--stop-after-epoch 8` and a cooperative `artifacts/rice/STOP_AFTER_EPOCH` marker, checked only after atomic checkpoint saving. The original active trainer predated these hooks; `rice_model.stop_training` was used to verify and preserve the checkpoint, confirm the next epoch had entered an early training batch with no temporary checkpoint files, and send normal CTRL+C to its inspected dedicated console. It never used force termination. Details are in `artifacts/rice/deadline_stop.json`.

For the background job launched during implementation:

```powershell
Get-Content artifacts/rice/pipeline_status.json
Get-Content artifacts/rice/training.log -Tail 15
Get-Content artifacts/rice/training-errors.log -Tail 15
nvidia-smi
```

`pipeline_status.json` records the actual runner PID. To stop that specific background run, verify that PID belongs to `rice_model.pipeline`, then use `taskkill /PID <verified-pid> /T /F`. This discards only the unfinished epoch. Resume with the pipeline command. Keep the laptop awake and plugged in for training.

## Selection, calibration and evaluation

```powershell
& $ricePython -m rice_model.evaluate
# Optional, only before opening the internal test partition:
# & $ricePython -m rice_model.evaluate --allow-ensemble
```

Both best checkpoints are evaluated on the identical validation records. Primary selection is macro-F1, then worst-class recall, then single-image latency. A probability-averaging ensemble is measured on validation. Deployment of an ensemble requires explicit CLI opt-in, >=0.01 absolute macro-F1 improvement and no decline in minimum class recall. Review measured latency before opting in. The automatic pipeline defaults to a single model.

Temperature is fit using validation logits only. Validation threshold sweeps report accepted coverage and accepted accuracy; a threshold achieving >=95% validation accepted accuracy on >=100 examples is chosen, or all predictions are flagged low-confidence when this is unsupported. These fitted validation statistics are optimistic; they do not validate unknown-disease rejection. The selected model is then evaluated once on internal test data, with a marker preventing accidental re-evaluation in that output directory. Never create another output directory to repeatedly tune against the same test set. A failed test stage needs manual inspection before recovery.

Outputs include accuracy, macro/weighted F1, class precision/recall, JSON/CSV confusion matrices, confidence quantiles, NLL, calibration error, threshold coverage, model size, latency, logits, image IDs and selection rationale. Calibration and thresholds remain fixed for internal-test evaluation. New field photographs and expert labels are still needed for a separate external evaluation.

## Private inference and portal startup

The deployment directory contains copied checkpoints, ordered class mapping, preprocessing, temperatures, threshold and SHA-256 checksums. It is independent of `Data/`. The service loads the bundle once, checks its metadata, and refuses missing, mismatched or smoke artifacts. Only trusted locally produced checkpoints should be loaded.

After the pipeline produces `artifacts/rice/evaluation/deployment/deployment.json`:

```powershell
npm.cmd start
```

This launches FastAPI on loopback port 8766 with a fresh server-only random credential, waits for authenticated health readiness, then starts the existing portal and speech workflow. CPU inference is the default here to leave GPU capacity available for speech. To use a different Python or CUDA:

```powershell
$env:RICE_PYTHON = (Resolve-Path '.venv/Scripts/python.exe').Path # only if using that environment
$env:RICE_DEVICE = 'cuda' # optional; cpu or auto also supported
npm.cmd start
```

Stop an already-running portal before starting this combined command. Open the dashboard's existing Plant Disease Detection page and log in normally. Selecting or capturing a photo starts detection immediately. Results and history display calibrated confidence, top three classes and limitations. Gemini separately supplies treatment options/application methods, causes and conditional untreated progression using only the saved prediction. Its key and model come from the existing plant/Gemini configuration. Care guidance is saved with the owned report; failure does not discard the local prediction. Low-confidence results remain uncertain and have no medicine cards. To use the prior portal/speech workflow with Gemini disease detection, set `PLANT_DISEASE_AI_PROVIDER=gemini` and run `node scripts/start.js`. The combined `npm start` command always selects the local rice provider. No local service credential is returned to the browser.

For separate processes, set the same random `RICE_SERVICE_TOKEN` (>=32 characters) in the Python and Node environments. Set `PLANT_DISEASE_AI_PROVIDER=local_rice` and `RICE_SERVICE_URL=http://127.0.0.1:8766` for Node. Then run:

```powershell
& $ricePython -m uvicorn rice_model.service:app --host 127.0.0.1 --port 8766 --workers 1 --no-access-log
# Another terminal with the same private environment settings:
node scripts/start.js
```

Optional Python settings: `RICE_MODEL_DIR`, `RICE_DEVICE=auto|cpu|cuda`, `RICE_CPU_THREADS=4`, `RICE_MAX_UPLOAD_BYTES=10485760`. No `.env` loader is used by Python. Keep the service private; Node enforces user sessions and ownership. FastAPI also requires a constant-time checked bearer credential for `/health` and `/predict`, bounds streamed uploads and pixel count, validates image decoding, rejects animations, and admits one inference at a time. It accepts raw JPEG/PNG/WebP bodies from Node, not public multipart requests. No images are persisted. Use one Uvicorn worker to avoid duplicate GPU allocations.

## Verification and export

```powershell
& $ricePython -m pytest rice_model/tests -q
& $ricePython -m pytest speech/test_runtime.py speech/test_worker.py -q
& $ricePython -m rice_model.smoke_inference
node --test scripts/test-rice-api.cjs scripts/test-plant-disease.cjs scripts/test-plant-api.cjs
node scripts/test-rice-e2e.cjs
node scripts/test-rice-live.cjs
& $ricePython -m rice_model.export
& $ricePython -m rice_model.benchmark
```

Browser testing requires Playwright and installed Chrome. It exercises real HTML upload -> Node -> private FastAPI -> a real CPU neural-network forward pass -> saved report/history. Authentication/repository are test doubles and model weights are disposable random fixtures; it does not measure accuracy. The separate MongoDB ownership tests are opt-in using `PLANT_DB_TEST=1` and isolated test collections. CUDA training/validation is exercised by the smoke runs; final CPU/CUDA parity and deployment timings are recorded after model selection. ONNX exports logits; consumers must preserve preprocessing and apply the exported temperature before softmax. `onnx_export.json` records graph validation and optional ONNX Runtime parity.

During implementation, the existing OneDrive-backed Playwright installation could not be read (`UNKNOWN` filesystem error). A separate ignored test-tool installation was used without replacing project dependencies:

```powershell
npm.cmd install --prefix artifacts/rice/browser-tools --no-package-lock --ignore-scripts playwright@1.51.1
$env:RICE_PLAYWRIGHT_MODULE = (Resolve-Path 'artifacts/rice/browser-tools/node_modules/playwright').Path
node scripts/test-rice-e2e.cjs
```

Before public use, manually verify login, camera upload, saved-report ownership, Hindi/English display, service-unavailable handling and a labeled set of real farm photographs. Review perceptual matches and false predictions, assess per-class recall and external calibration, and test unknown/non-rice images. Until that work is done, treat the implementation as an integrated system awaiting field validation, not a validated agronomic diagnostic product.
