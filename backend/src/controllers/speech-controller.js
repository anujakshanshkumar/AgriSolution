const { translateSpeech } = require('../services/speech-translation');
const { transcribeSearch } = require('../services/local-speech');

const supportedLanguages = new Set(['hi', 'en', 'hi_in', 'en_us']);
const requestWindowMs = 10 * 60 * 1000;
const maxRequestsPerWindow = 30;
const requestCounts = new Map();
const translationRequestCounts = new Map();

function isRateLimited(ipAddress, counts = requestCounts) {
  const now = Date.now();
  const window = counts.get(ipAddress);

  if (!window && counts.size >= 1000) {
    for (const [address, entry] of counts) {
      if (now - entry.startedAt >= requestWindowMs) counts.delete(address);
    }
    if (counts.size >= 1000) return true;
  }

  if (!window || now - window.startedAt >= requestWindowMs) {
    counts.set(ipAddress, { startedAt: now, count: 1 });
    return false;
  }

  window.count += 1;
  return window.count > maxRequestsPerWindow;
}

async function transcribe(request, response, next) {
  if (isRateLimited(request.ip)) {
    response.status(429).json({ error: 'Too many speech requests. Please try again later.' });
    return;
  }

  if (!Buffer.isBuffer(request.body) || request.body.length < 1600 || request.body.length % 2 !== 0) {
    response.status(400).json({ error: 'Recording must contain valid 16 kHz mono PCM audio.' });
    return;
  }

  const language = request.query.language;
  if (!supportedLanguages.has(language)) {
    response.status(400).json({ error: 'Choose Hindi or English for speech recognition.' });
    return;
  }

  try {
    const text = await transcribeSearch(request.body, { hi_in: 'hi', en_us: 'en' }[language] || language);
    response.json({ text });
  } catch (error) {
    if (error.statusCode) {
      response.status(error.statusCode).json({ error: error.message });
      return;
    }
    next(error);
  }
}

async function translate(request, response, next) {
  if (isRateLimited(request.ip, translationRequestCounts)) {
    response.status(429).json({ error: 'Too many translation requests. Please try again later.' });
    return;
  }

  const { text, language } = request.body || {};
  if (typeof text !== 'string' || !text.trim() || text.length > 2000) {
    response.status(400).json({ error: 'Speech text must contain between 1 and 2000 characters.' });
    return;
  }
  if (language !== 'hi' && language !== 'en') {
    response.status(400).json({ error: 'Choose Hindi or English for speech translation.' });
    return;
  }

  try {
    const translatedText = await translateSpeech(text.trim(), language);
    response.json({ text: translatedText });
  } catch (error) {
    if (error.statusCode) {
      response.status(error.statusCode).json({ error: error.message });
      return;
    }
    next(error);
  }
}

async function search(request, response, next) {
  if (isRateLimited(request.ip)) {
    return response.status(429).json({ error: 'Too many speech requests. Please try again later.' });
  }
  if (!Buffer.isBuffer(request.body) || request.body.length < 1600 || request.body.length % 2 !== 0) {
    return response.status(400).json({ error: 'Recording must contain valid 16 kHz mono PCM audio.' });
  }
  if (!['hi', 'en'].includes(request.query.language)) {
    return response.status(400).json({ error: 'Choose Hindi or English for speech recognition.' });
  }
  try {
    response.json({ text: await transcribeSearch(request.body, request.query.language) });
  } catch (error) {
    if (error.statusCode) return response.status(error.statusCode).json({ error: error.message });
    next(error);
  }
}

module.exports = { transcribe, translate, search };
