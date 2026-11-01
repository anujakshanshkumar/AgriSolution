import base64
import io
import json
from pathlib import Path
import subprocess
import sys
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import worker


class WorkerTests(unittest.TestCase):
    def test_shutdown_during_dependency_import(self):
        # Deliver the signal inside an import, before model initialization.
        # A native dependency must not get an exception it can wrap/relabel.
        program = """
import builtins
import runpy
import signal
import sys
original_import = builtins.__import__
def interrupted_import(name, *args, **kwargs):
    if name == 'numpy':
        signal.raise_signal(getattr(signal, sys.argv[2]))
        raise AssertionError('Worker continued after shutdown')
    return original_import(name, *args, **kwargs)
builtins.__import__ = interrupted_import
runpy.run_path(sys.argv[1], run_name='__main__')
"""
        for name, code in (("SIGINT", 130), ("SIGTERM", 143)):
            with self.subTest(signal=name):
                result = subprocess.run(
                    [sys.executable, "-c", program,
                     str(Path(worker.__file__).resolve()), name],
                    capture_output=True, text=True, timeout=20,
                )
                self.assertEqual(result.returncode, code, result.stderr)
                self.assertEqual(result.stderr, "")
                self.assertEqual(result.stdout, "")

    def test_pipe_protocol_and_recovery(self):
        model = MagicMock()
        model.transcribe.side_effect = [
            (iter([SimpleNamespace(text=" धान ")]), None),
            (iter([]), None),
            RuntimeError("inference failed"),
            (iter([SimpleNamespace(text="rice")]), None),
        ]
        audio = base64.b64encode(bytes(3200)).decode("ascii")
        requests = [
            "invalid json", [],
            {"id": 1, "language": "fr", "audio": audio},
            {"id": 2, "language": "en", "audio": "!"},
            {"id": 3, "language": "en", "audio": "AA=="},
            *[{"id": i, "language": "hi", "audio": audio} for i in range(4, 8)],
        ]
        incoming = io.StringIO("\n".join(json.dumps(r) for r in requests) + "\n")
        outgoing = io.StringIO()

        def load():
            print("Loading model")
            return model, "turbo", "cpu", "int8"

        with patch.object(worker, "load_model", side_effect=load), \
                patch.object(worker.sys, "stdin", incoming), \
                patch.object(worker.sys, "stdout", outgoing), \
                patch.object(worker.sys, "stderr", io.StringIO()), \
                patch.dict(worker.os.environ, {"SPEECH_BEAM_SIZE": "1"}):
            worker.main()
        replies = [json.loads(line) for line in outgoing.getvalue().splitlines()]
        self.assertTrue(replies[0]["ready"])
        self.assertEqual([r["status"] for r in replies[1:]],
                         [400, 400, 400, 400, 400, 200, 422, 500, 200])
        self.assertEqual(replies[6]["id"], 4)
        self.assertEqual(replies[6]["text"], "धान")
        self.assertEqual(replies[-1]["text"], "rice")
        self.assertEqual(model.transcribe.call_count, 4)
        self.assertEqual(model.transcribe.call_args.kwargs["language"], "hi")
        self.assertEqual(model.transcribe.call_args.args[0].shape, (1600,))


if __name__ == "__main__":
    unittest.main()
