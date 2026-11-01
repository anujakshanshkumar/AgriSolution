"""Private service. Authenticated raw-image requests avoid multipart spooling."""
import asyncio
import hmac
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from starlette.concurrency import run_in_threadpool
import torch

from .runtime import Predictor, decode_image


def create_app(predictor_factory=None, token=None):
    service_token = token if token is not None else os.environ.get('RICE_SERVICE_TOKEN', '')
    maximum = int(os.environ.get('RICE_MAX_UPLOAD_BYTES', 10*1024*1024))
    if not 1024 <= maximum <= 20*1024*1024:
        raise ValueError('RICE_MAX_UPLOAD_BYTES must be 1024..20971520')

    @asynccontextmanager
    async def lifespan(app):
        if len(service_token) < 32:
            raise RuntimeError('Set a random RICE_SERVICE_TOKEN of at least 32 characters')
        threads = int(os.environ.get('RICE_CPU_THREADS', '4'))
        if not 1 <= threads <= 32:
            raise RuntimeError('RICE_CPU_THREADS must be 1..32')
        torch.set_num_threads(threads)
        app.state.predictor = (predictor_factory or (lambda: Predictor(
            os.environ.get('RICE_MODEL_DIR', 'artifacts/rice/evaluation/deployment'),
            os.environ.get('RICE_DEVICE', 'auto'))))()
        app.state.gate = asyncio.Lock()
        yield
        app.state.predictor = None

    app = FastAPI(title='Private rice classifier', lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)

    def authorize(request):
        supplied = request.headers.get('authorization', '')
        if not hmac.compare_digest(supplied.encode(), ('Bearer '+service_token).encode()):
            raise HTTPException(401, 'Unauthorized')

    @app.get('/health')
    async def health(request: Request):
        authorize(request)
        return {'ready': True, 'riceOnly': True, 'modelVersion': app.state.predictor.metadata['model_version'],
                'device': str(app.state.predictor.device)}

    @app.post('/predict')
    async def classify(request: Request):
        authorize(request)
        if request.headers.get('content-type', '').split(';')[0] not in {'image/jpeg', 'image/png', 'image/webp'}:
            raise HTTPException(415, 'Use JPEG, PNG, or WebP')
        try:
            length = int(request.headers.get('content-length', '0'))
        except ValueError:
            raise HTTPException(400, 'Invalid content length')
        if length < 0 or length > maximum:
            raise HTTPException(413, 'Image too large')
        if app.state.gate.locked():
            raise HTTPException(429, 'Classifier busy; retry shortly')
        async with app.state.gate:
            data = bytearray()
            try:
                async with asyncio.timeout(30):
                    async for chunk in request.stream():
                        if len(data) + len(chunk) > maximum:
                            raise HTTPException(413, 'Image too large')
                        data.extend(chunk)
            except TimeoutError:
                raise HTTPException(408, 'Upload timed out')
            try:
                image = await run_in_threadpool(decode_image, bytes(data), maximum)
            except ValueError as error:
                raise HTTPException(400, str(error))
            finally:
                data.clear()
            try:
                return await run_in_threadpool(app.state.predictor.predict, image)
            except Exception:
                raise HTTPException(503, 'Classifier unavailable')
            finally:
                image.close()

    return app


app = create_app()
