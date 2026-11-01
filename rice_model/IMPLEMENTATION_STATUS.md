# Rice disease deployment ? completed November 1, 2026

Verified at **2026-11-01T04:03:21+05:30**, before the 07:30 IST deadline.

The portal is running at **http://127.0.0.1:3000/plant-disease.html**. Log in normally, upload a rice photo, and select Analyze Plant. The private FastAPI service runs on loopback port 8766 and serves the trained **EfficientNet-B2 epoch 8** on **CPU**. No training process remains active. Full MobileNetV3 training was skipped; its code/configuration are retained.

## Actual training and checkpoint preservation

- 8 completed epochs; 8,326 training images, 1,041 validation images, 1,040 internal-test images.
- Training+validation epoch time: **1753.9 seconds (29.23 minutes)**. The earlier 14.8-minute figure was the cumulative first four epochs, not one epoch.
- Peak allocated GPU memory: **786.7 MiB**; peak reserved: **938.0 MiB**, RTX 2050.
- Best checkpoint: `artifacts/rice/runs/efficientnet_b2/best.pt`, epoch 8; verified backup: `artifacts/rice/preserved/efficientnet_b2_epoch_8.pt`.
- Normal CTRL+C/KeyboardInterrupt was delivered only after checkpoint saving finished and epoch 9 announced batch 0. No forced termination occurred. Both the trainer and queued-model runner exited. Stop evidence: `artifacts/rice/deadline_stop.json`.
- Future invocations support cooperative epoch-boundary stopping. The current execution plan sets `train: false` and B2 only, preventing accidental queued MobileNet training.

## Measured model quality

| Metric | Validation (1,041 images) | Internal test (1,040 images) |
|---|---:|---:|
| Accuracy | 96.16% | 95.00% |
| Macro-F1 | 95.77% | 94.61% |
| Weighted F1 | 96.14% | 94.97% |
| Calibration error, 10 bins | 1.27% | 1.43% |

Validation-only temperature: **1.50413**. Conservative confidence threshold: **0.85**. The fixed threshold accepted **90.96%** of internal-test images, with **97.99%** accuracy among accepted images. This does not validate unknown-disease rejection. All predictions still carry rice-scope and field-validation limitations.

The best saved checkpoint was selected using validation macro-F1. CPU validation and calibration were completed before the internal-test partition was evaluated once. The unlabeled original test set was never used to select the model or calculate accuracy. Two unlabeled photographs were later used only to exercise the deployed browser UI.

**Internal-test results are not established as unbiased.** Exact duplicate leakage checks passed, but **1,466 wider-threshold cross-partition perceptual candidate pairs remain unresolved**. Different photos may share plants/capture sessions, for which metadata is absent. Field-photo accuracy is unmeasured. Bacterial leaf blight had the lowest internal-test recall (**85.42%**); inspect the saved per-class metrics before relying on disease-specific performance.

## Actual inference measurements

| Device | Median | p95 |
|---|---:|---:|
| CPU, four threads | 40.7 ms | 51.9 ms |
| CUDA | 15.0 ms | 23.5 ms |

30 warmed batch-one runs, including preprocessing, using a synthetic 480x640 image. Upload/network overhead is excluded. CPU/CUDA probability checks passed. Production is explicitly on CPU; CUDA is not needed to serve the model. Checkpoint size: **29.83 MiB**. ONNX graph validation and CPU parity passed.

## Deployment verification performed

- Authenticated FastAPI `/health` returned ready with device `cpu` and model version `2f51fc0c0668-2f7409b19983-efficientnet_b2`. Evidence: `artifacts/rice/service-health.json`.
- 15 rice Python tests passed, including model loading, hashes, split leakage, calibration, API validation, ONNX parity and one-time evaluation protection.
- 14 Node tests passed for Gemini and local provider adapters; Gemini credentials/provider implementation were preserved. No paid/live Gemini diagnosis was requested for these checks.
- 7 real MongoDB/session integration tests passed.
- 5 existing speech Python tests passed; the live speech worker reports ready on CPU.
- Real deployed browser test passed through registration/login, Node authentication, FastAPI, the trained model, top-three display and MongoDB history.
- A second real user could not read or delete the first user's report; owner read/delete succeeded.
- The low-confidence UI was exercised with a real model prediction of **66.4%**, producing Inconclusive and the explicit warning. This is a UI demonstration, not evidence that the predicted disease was correct.
- Existing dashboard, crop and soil pages returned HTTP 200. Internal service credentials were absent from public configuration.
- Temporary test users, sessions and reports were cleaned up. No original user records or dataset files were deleted.

Live browser evidence: `artifacts/rice/live_deployment_test.json`, `deployed-browser-upload.png`, `deployed-uncertainty-warning.png`.

## Artifacts and changed files

Deployment bundle: `artifacts/rice/evaluation/deployment/` (checkpoint, checksums, class mapping, preprocessing, calibrated temperature, threshold, ONNX model and benchmarks).

Metrics/confusion matrices: `artifacts/rice/evaluation/efficientnet_b2_validation.json`, `internal_test.json`, and the corresponding `_confusion.csv` files. Prediction arrays and model-selection rationale are saved alongside them. The test-start marker remains in place to prevent re-evaluation.

This deadline pass added `rice_model/stop_training.py` and `scripts/test-rice-live.cjs`; updated `rice_model/train.py`, `pipeline.py`, `evaluate.py`, `service.py`, `scripts/start-rice.js` and documentation; and wrote the execution plan/status artifacts. The existing Node adapter and upload UI from the implementation pass are now serving the real trained bundle. Authentication, dashboard routing and Gemini code were not replaced.

## Startup and remaining limitations

The portal is already running. For later startup from the project root:

```powershell
npm.cmd start
```

Use `speech/.venv/Scripts/python.exe` for Python commands. `npm.cmd start` now starts CPU rice inference, checks private service health, and starts the existing frontend/backend/speech workflow with a fresh internal credential. `npm.cmd run start:rice` remains an alias for the same workflow. Stop an existing portal before starting a second instance. For the prior portal/speech workflow using a separately configured provider, use `node scripts/start.js`.

Do not restart training for this release and do not rerun the internal-test evaluation to tune thresholds. Additional field validation, perceptual-pair review, and an independently evaluated unknown/non-rice detector remain future work. Rice identity is not inferred reliably, and a high softmax score does not establish that an uploaded image is within the supported scope. The UI keeps these limitations visible.
