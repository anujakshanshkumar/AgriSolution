# Local voice recognition

Homepage search and all shared microphone inputs use self-hosted **Whisper large-v3-turbo** via faster-whisper. Turbo retains Hindi/English support and trades a small amount of accuracy for faster transcription compared with full large-v3. It does not require cloud speech credentials. Benchmark your own recordings before making accuracy claims; use `SPEECH_MODEL=large-v3` and `SPEECH_BEAM_SIZE=5` to restore the previous accuracy-focused configuration.

## Run

Install Python 3.10+ and Node dependencies, then run from the repository root:

```powershell
npm run setup:speech
npm start
```

`setup:speech` is needed only once. `npm start` launches both the website and speech model in one terminal; Ctrl+C stops both processes it started. Wait for `Speech model ready` before using voice search. The first start downloads several GB of model weights into the Hugging Face cache in your user profile; later starts reuse them. If a model worker is already running, the launcher reuses it and leaves that separately managed worker running on exit. `npm run start:speech` remains available for standalone worker use.

Open the homepage on localhost (or HTTPS in deployment), choose English or Hindi, click the search icon, and allow microphone access. Speak in the selected language. After 0.8 seconds of silence the microphone stops and the result replaces the search field. The microphone button starts another recording or finishes the current one. Recording stops after 20 seconds at most. Typing, closing search, changing language, or hiding the page cancels the current operation. This fills the existing search field; it does not introduce a new search-results engine.

No-speech recordings are rejected, and the model's Silero VAD filters silence to reduce hallucinations. Browser pause detection is energy-based, so loud continuous background noise can defer completion to the 20-second limit. Audio stays in memory and is sent only to your own backend/worker, without storing recordings. The first model download requires internet; cached inference does not.

## Hardware and configuration

The default automatically uses an NVIDIA GPU with int8/float16 when CUDA is available and falls back to CPU/int8 otherwise. Install optional CUDA libraries inside the project virtual environment with `npm run setup:speech:gpu`, then restart `npm start`. CPU inference is slower. The model and voice activity detector warm up before the worker reports ready, so first-use initialization does not delay the first search. Greedy decoding (`beam_size=1`) reduces decoder work; a beam size of 5 prioritizes accuracy over speed. The browser allows 180 seconds for a result.

Set worker environment variables in the terminal before `npm start`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `SPEECH_MODEL` | `turbo` | Model name or local CTranslate2 model directory |
| `SPEECH_DEVICE` | `auto` | `auto`, `cpu` or `cuda` |
| `SPEECH_COMPUTE_TYPE` | `int8` on CPU; `int8_float16` on CUDA | Inference precision |
| `SPEECH_BEAM_SIZE` | `1` | Decoder beam width, 1–5 |
| `SPEECH_PORT` | `8765` | Loopback worker port |

CUDA requires compatible NVIDIA drivers/libraries and sufficient GPU memory. See the [faster-whisper hardware requirements](https://github.com/SYSTRAN/faster-whisper#gpu). On machines without a usable GPU, automatic mode falls back to CPU. Explicit `SPEECH_DEVICE=cuda` instead reports a startup error if GPU initialization fails. Health responses include the actual model, device, precision and beam size. Direct worker transcription responses include `inference_ms` to measure latency without logging audio or transcripts.

`LOCAL_SPEECH_URL` in `backend/.env` defaults to `http://127.0.0.1:8765`. Keep the worker private; expose only the website API through HTTPS. The worker handles one transcription at a time and returns a busy response for overlapping requests.

## Validation

```powershell
node --test scripts/test-search-speech.cjs
speech/.venv/Scripts/python.exe speech/test_runtime.py
```

These automated tests use deterministic microphone/model doubles to test pause detection, text insertion, cancellation, permission failures, API validation, and unavailable-worker handling. They do not measure recognition accuracy. For real inference, post 16 kHz mono signed little-endian PCM to `/api/v1/speech/search?language=en` (or `hi`). Health: `http://127.0.0.1:8765/health`.

To exercise the real browser audio pipeline and running model with an English WAV recording:

```powershell
$env:AGRI_SPEECH_WAV='C:\path\sample.wav'
node scripts/test-search-speech-live.cjs
```

Model details: [Whisper Turbo model card](https://huggingface.co/openai/whisper-large-v3-turbo), [faster-whisper](https://github.com/SYSTRAN/faster-whisper).

Benchmark a running worker with a short 16 kHz mono, 16-bit PCM WAV:

```powershell
speech/.venv/Scripts/python.exe speech/benchmark.py C:\path\sample.wav --repeat 3
```

This reports per-request and median inference latency, excluding speaking time and the browser's 0.8-second pause. A short synthetic English sample verifies the pipeline but does not measure general recognition accuracy or Hindi accuracy.

Both `/api/v1/speech/search` and `/api/v1/speech/transcribe` use the same Whisper model. Speech translation remains a separate Gemini service.
