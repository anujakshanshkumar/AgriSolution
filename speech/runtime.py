"""Select a fast inference device, with a CPU fallback for ordinary laptops."""
import ctypes
import os
from pathlib import Path
import sysconfig

import ctranslate2
import numpy as np
from faster_whisper import WhisperModel
from faster_whisper.vad import get_speech_timestamps

_dll_handles = []


def prepare_windows_cuda():
    if os.name != "nt":
        return
    # pip-installed NVIDIA runtimes stay inside this project's virtualenv.
    base = Path(sysconfig.get_paths()["purelib"]) / "nvidia"
    for package in ("cublas", "cuda_nvrtc", "cudnn"):
        for directory in (base / package / "bin", base / package / "lib"):
            if directory.is_dir():
                _dll_handles.append(os.add_dll_directory(str(directory)))
                os.environ["PATH"] = str(directory) + os.pathsep + os.environ["PATH"]
    for library in ("cublasLt64_12.dll", "cublas64_12.dll", "cudnn64_9.dll"):
        _dll_handles.append(ctypes.WinDLL(library))


def load_model():
    model_name = os.environ.get("SPEECH_MODEL", "turbo")
    requested_device = os.environ.get("SPEECH_DEVICE", "auto")
    if requested_device not in ("auto", "cpu", "cuda"):
        raise ValueError("SPEECH_DEVICE must be auto, cpu, or cuda")
    device = "cpu"
    if requested_device != "cpu":
        try:
            if not ctranslate2.get_cuda_device_count():
                raise RuntimeError("No NVIDIA GPU detected")
            prepare_windows_cuda()
            device = "cuda"
        except (OSError, RuntimeError) as error:
            if requested_device == "cuda":
                raise RuntimeError("CUDA is unavailable. Install speech/requirements-gpu.txt or choose SPEECH_DEVICE=cpu.") from error
            print("CUDA runtime unavailable; using CPU int8. Optional GPU setup: npm run setup:speech:gpu", flush=True)

    def create(selected):
        precision = os.environ.get("SPEECH_COMPUTE_TYPE", "int8_float16" if selected == "cuda" else "int8")
        print(f"Loading {model_name} on {selected} ({precision}); warming up before accepting audio…", flush=True)
        model = WhisperModel(model_name, device=selected, compute_type=precision)
        # Pay first-inference and VAD initialization costs during startup.
        segments, _ = model.transcribe(np.zeros(16000, dtype=np.float32), language="en",
                                      beam_size=1, max_new_tokens=1, vad_filter=False)
        list(segments)
        get_speech_timestamps(np.zeros(16000, dtype=np.float32))
        return model, precision

    try:
        model, precision = create(device)
    except RuntimeError:
        if requested_device != "auto" or device != "cuda" or os.environ.get("SPEECH_COMPUTE_TYPE"):
            raise
        print("GPU initialization failed; falling back to CPU int8.", flush=True)
        device = "cpu"
        model, precision = create(device)
    return model, model_name, device, precision
