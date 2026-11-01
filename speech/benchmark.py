"""Measure a running worker using a 16 kHz mono, 16-bit WAV recording."""
import argparse
import json
import statistics
import time
import urllib.request
import wave


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("wav")
    parser.add_argument("--url", default="http://127.0.0.1:8765")
    parser.add_argument("--language", choices=("en", "hi"), default="en")
    parser.add_argument("--repeat", type=int, default=3)
    args = parser.parse_args()
    if not 1 <= args.repeat <= 10:
        parser.error("repeat must be between 1 and 10")
    with wave.open(args.wav, "rb") as recording:
        if (recording.getframerate(), recording.getnchannels(), recording.getsampwidth()) != (16000, 1, 2):
            parser.error("WAV must be 16 kHz mono signed 16-bit PCM")
        audio = recording.readframes(recording.getnframes())
    with urllib.request.urlopen(args.url + "/health", timeout=5) as response:
        health = json.load(response)
    timings = []
    for _ in range(args.repeat):
        started = time.perf_counter()
        request = urllib.request.Request(
            args.url + "/transcribe?language=" + args.language, data=audio,
            headers={"Content-Type": "application/octet-stream"},
        )
        with urllib.request.urlopen(request, timeout=180) as response:
            result = json.load(response)
        elapsed = round((time.perf_counter() - started) * 1000)
        timings.append(elapsed)
        print(json.dumps({"elapsed_ms": elapsed, **result}, ensure_ascii=False), flush=True)
    print(json.dumps({"worker": health, "median_ms": statistics.median(timings),
                      "audio_seconds": len(audio) / 32000}), flush=True)


if __name__ == "__main__":
    main()
