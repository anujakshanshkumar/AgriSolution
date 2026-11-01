import os
import unittest
from unittest.mock import MagicMock, patch

import runtime


class RuntimeTests(unittest.TestCase):
    def setUp(self):
        self.environment = patch.dict(os.environ, {}, clear=True)
        self.environment.start()
        self.addCleanup(self.environment.stop)
        self.model = MagicMock()
        self.model.transcribe.return_value = (iter(()), None)

    @patch.object(runtime, "get_speech_timestamps")
    @patch.object(runtime, "WhisperModel")
    @patch.object(runtime, "prepare_windows_cuda")
    @patch.object(runtime.ctranslate2, "get_cuda_device_count", return_value=1)
    def test_auto_uses_gpu_and_warms_before_ready(self, devices, cuda, factory, vad):
        factory.return_value = self.model
        _, name, device, precision = runtime.load_model()
        self.assertEqual((name, device, precision), ("turbo", "cuda", "int8_float16"))
        self.model.transcribe.assert_called_once()
        vad.assert_called_once()

    @patch.object(runtime, "get_speech_timestamps")
    @patch.object(runtime, "WhisperModel")
    @patch.object(runtime, "prepare_windows_cuda", side_effect=OSError("missing DLL"))
    @patch.object(runtime.ctranslate2, "get_cuda_device_count", return_value=1)
    def test_missing_cuda_falls_back_to_cpu(self, devices, cuda, factory, vad):
        factory.return_value = self.model
        _, _, device, precision = runtime.load_model()
        self.assertEqual((device, precision), ("cpu", "int8"))

    @patch.object(runtime, "prepare_windows_cuda", side_effect=OSError("missing DLL"))
    @patch.object(runtime.ctranslate2, "get_cuda_device_count", return_value=1)
    def test_explicit_cuda_does_not_silently_fallback(self, devices, cuda):
        os.environ["SPEECH_DEVICE"] = "cuda"
        with self.assertRaisesRegex(RuntimeError, "CUDA is unavailable"):
            runtime.load_model()

    @patch.object(runtime, "get_speech_timestamps")
    @patch.object(runtime, "WhisperModel")
    @patch.object(runtime, "prepare_windows_cuda")
    @patch.object(runtime.ctranslate2, "get_cuda_device_count", return_value=1)
    def test_gpu_load_failure_falls_back(self, devices, cuda, factory, vad):
        factory.side_effect = [RuntimeError("out of memory"), self.model]
        _, _, device, precision = runtime.load_model()
        self.assertEqual((device, precision), ("cpu", "int8"))


if __name__ == "__main__":
    unittest.main()
