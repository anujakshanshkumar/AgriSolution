"""JSON-lines speech worker used by the website launcher."""
import base64
import binascii
from contextlib import redirect_stdout
import json
import os
import signal
import sys
import time

# Native imports can wrap KeyboardInterrupt as a misleading dependency error.
# This pipe worker has no persistent writes; exit directly on launcher shutdown,
# including when Ctrl+C arrives during native model/VAD initialization.
if __name__ == "__main__":
    signal.signal(signal.SIGINT, lambda signum, frame: os._exit(130))
    signal.signal(signal.SIGTERM, lambda signum, frame: os._exit(143))

import numpy as np
from runtime import load_model


def transcribe(model, request, beam_size):
    language = request.get("language")
    if language not in ("en", "hi"):
        return {"status": 400, "error": "Choose Hindi or English."}
    try:
        encoded = request.get("audio", "")
        if not isinstance(encoded, str) or len(encoded) > 873816:
            raise ValueError("Invalid audio")
        raw = base64.b64decode(encoded, validate=True)
    except (ValueError, binascii.Error):
        return {"status": 400, "error": "Expected base64 PCM audio."}
    if not 1600 <= len(raw) <= 655360 or len(raw) % 2:
        return {"status": 400, "error": "Expected at most 20 seconds of 16 kHz mono PCM."}
    audio = np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768.0
    started = time.perf_counter()
    segments, _ = model.transcribe(
        audio, language=language, task="transcribe", beam_size=beam_size,
        temperature=0, condition_on_previous_text=False,
        vad_filter=True, vad_parameters={"min_silence_duration_ms": 500},
    )
    text = " ".join(segment.text.strip() for segment in segments).strip()
    if not text:
        return {"status": 422, "error": "No speech recognized. Please try again."}
    return {"status": 200, "text": text,
            "inference_ms": round((time.perf_counter() - started) * 1000)}


def main():
    beam_size = int(os.environ.get("SPEECH_BEAM_SIZE", "1"))
    if not 1 <= beam_size <= 5:
        raise ValueError("SPEECH_BEAM_SIZE must be between 1 and 5")

    def reply(payload):
        print(json.dumps(payload, ensure_ascii=False), flush=True)

    # Reserve stdout for the pipe protocol; diagnostics belong on stderr.
    with redirect_stdout(sys.stderr):
        model, name, device, precision = load_model()
    reply({"ready": True, "model": name, "device": device,
           "compute_type": precision, "beam_size": beam_size, "runtime_version": 2})
    for line in sys.stdin:
        request_id = None
        try:
            request = json.loads(line)
            if not isinstance(request, dict):
                raise ValueError("Expected an object")
            request_id = request.get("id")
        except (ValueError, TypeError):
            reply({"id": request_id, "status": 400, "error": "Invalid speech request."})
            continue
        try:
            with redirect_stdout(sys.stderr):
                result = transcribe(model, request, beam_size)
        except Exception:
            result = {"status": 500, "error": "Local speech recognition failed. Please retry."}
        reply({"id": request_id, **result})


if __name__ == "__main__":
    main()
