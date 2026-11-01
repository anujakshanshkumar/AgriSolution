const config = require('../config/environment');
let worker;
function setWorker(value) { worker = value; }
function health() { return worker ? worker.health() : { ready: false }; }

async function transcribeSearch(pcm, language) {
  if (worker) return worker.transcribe(pcm, language);
  let response;
  try {
    response = await fetch(`${config.localSpeechUrl}/transcribe?language=${language}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: pcm,
      signal: AbortSignal.timeout(170000)
    });
  } catch (cause) {
    const error = new Error(cause.name === 'TimeoutError'
      ? 'Speech recognition took too long. Please try a shorter phrase.'
      : 'The local speech model is not ready. Run npm start and wait for the model to load.');
    error.statusCode = 503;
    throw error;
  }
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error || 'Local speech recognition failed.');
    error.statusCode = response.status;
    throw error;
  }
  if (typeof result.text !== 'string' || !result.text.trim()) {
    const error = new Error('No speech recognized. Please speak clearly and try again.');
    error.statusCode = 422;
    throw error;
  }
  return result.text.trim();
}

module.exports = { transcribeSearch, setWorker, health };
