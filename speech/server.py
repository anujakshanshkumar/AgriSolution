"""Loopback-only inference worker. Audio stays in memory and is never saved."""
import json
import os
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

import numpy as np
from runtime import load_model


def main():
    beam_size = int(os.environ.get("SPEECH_BEAM_SIZE", "1"))
    if not 1 <= beam_size <= 5:
        raise ValueError("SPEECH_BEAM_SIZE must be between 1 and 5")
    model, model_name, device, compute_type = load_model()
    inference_lock = threading.Lock()

    class Handler(BaseHTTPRequestHandler):
        def setup(self):
            super().setup()
            self.connection.settimeout(180)

        def reply(self, status, payload):
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            try:
                self.send_response(status)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            except (BrokenPipeError, ConnectionResetError):
                pass

        def do_GET(self):
            if self.path == "/health":
                return self.reply(200, {"ready": True, "model": model_name, "device": device,
                                        "compute_type": compute_type, "beam_size": beam_size, "runtime_version": 2})
            self.reply(404, {"error": "Not found"})

        def do_POST(self):
            url = urlparse(self.path)
            if url.path != "/transcribe":
                return self.reply(404, {"error": "Not found"})
            language = parse_qs(url.query).get("language", [""])[0]
            if language not in ("en", "hi"):
                return self.reply(400, {"error": "Choose Hindi or English."})
            try:
                length = int(self.headers.get("Content-Length", "0"))
            except ValueError:
                length = 0
            if not 1600 <= length <= 655360 or length % 2:
                return self.reply(400, {"error": "Expected at most 20 seconds of 16 kHz mono PCM."})
            if self.headers.get("Content-Type") != "application/octet-stream":
                return self.reply(415, {"error": "Expected PCM audio."})
            if not inference_lock.acquire(blocking=False):
                return self.reply(503, {"error": "Speech model is busy. Please try again shortly."})
            try:
                raw = self.rfile.read(length)
                if len(raw) != length:
                    return self.reply(400, {"error": "Incomplete recording."})
                audio = np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768.0
                started = time.perf_counter()
                segments, _ = model.transcribe(
                    audio, language=language, task="transcribe", beam_size=beam_size,
                    temperature=0, condition_on_previous_text=False,
                    vad_filter=True, vad_parameters={"min_silence_duration_ms": 500},
                )
                text = " ".join(segment.text.strip() for segment in segments).strip()
                if not text:
                    return self.reply(422, {"error": "No speech recognized. Please try again."})
                self.reply(200, {"text": text, "inference_ms": round((time.perf_counter() - started) * 1000)})
            except Exception:
                self.reply(500, {"error": "Local speech recognition failed. Please retry."})
            finally:
                inference_lock.release()

        def log_message(self, format, *args):
            # Do not log transcripts or audio.
            pass

    port = int(os.environ.get("SPEECH_PORT", "8765"))
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    server.daemon_threads = True
    print(f"Speech model ready at http://127.0.0.1:{port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
