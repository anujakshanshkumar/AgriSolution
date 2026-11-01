const express = require('express');
const speechController = require('../controllers/speech-controller');

const router = express.Router();
router.get('/health', (request, response) => {
  const health = require('../services/local-speech').health();
  response.status(health.ready ? 200 : 503).json(health);
});
router.post('/search', express.raw({ type: 'application/octet-stream', limit: '640kb' }), speechController.search);

router.post(
  '/transcribe',
  express.raw({ type: 'application/octet-stream', limit: '640kb' }),
  speechController.transcribe
);
router.post('/translate', express.json({ limit: '12kb' }), speechController.translate);

module.exports = router;
