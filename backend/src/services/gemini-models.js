const { createHash } = require('node:crypto');
const AppError = require('../errors/app-error');

const cache = new Map();
const retryable = status => [400, 404, 429, 500, 502, 503, 504].includes(status);

async function discoverModels({ apiKey, preferredModel, signal, fetchImpl }) {
  const cacheKey = createHash('sha256').update(apiKey).update(preferredModel || '').digest('hex');
  const cached = cache.get(cacheKey);
  if (cached?.expires > Date.now()) return cached.models;
  const models = [];
  let pageToken = '';
  do {
    const url = new URL('https://generativelanguage.googleapis.com/v1beta/models');
    url.searchParams.set('pageSize', '100');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const response = await fetchImpl(url.toString(), {
      headers: { 'x-goog-api-key': apiKey }, signal: AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(5000)]), redirect: 'error',
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new AppError(503, [401, 403].includes(response.status)
        ? 'Gemini rejected the configured key or its permissions. Check the server API key for this feature.'
        : 'Gemini model discovery is temporarily unavailable. Please try again.');
    }
    const data = await response.json();
    for (const model of data.models || []) {
      if (model.supportedGenerationMethods?.includes('generateContent') &&
          /^models\/gemini-[a-zA-Z0-9._-]+$/.test(model.name) &&
          !/image|tts|audio|live|robotics|embedding/i.test(model.name)) {
        models.push(model.name.slice(7));
      }
    }
    pageToken = data.nextPageToken || '';
  } while (pageToken && !signal?.aborted);
  const rank = model => (/preview|experimental|exp-/i.test(model) ? 10 : 0) +
    (model === preferredModel ? 0 : /flash-lite/i.test(model) ? 1 : /flash/i.test(model) ? 2 : 3);
  const sorted = [...new Set(models)].sort((a, b) => rank(a) - rank(b));
  if (!sorted.length) throw new AppError(503, 'No compatible Gemini text models are available to the configured key.');
  if (cache.size >= 20) cache.clear();
  cache.set(cacheKey, { models: sorted, expires: Date.now() + 5 * 60 * 1000 });
  return sorted;
}

async function generateWithFallback({ apiKey, preferredModel, body, signal, fetchImpl = globalThis.fetch,
  readResponse = response => response.json(), validateText, attemptTimeoutMs = 15000 }) {
  let models;
  try {
    models = await discoverModels({ apiKey, preferredModel, signal, fetchImpl });
  } catch (error) {
    // A temporary discovery outage should not block a known configured model.
    if (signal?.aborted || !/^[a-zA-Z0-9._-]+$/.test(preferredModel || '') ||
        /rejected|No compatible/.test(error.message)) throw error;
    models = [preferredModel];
  }
  let lastStatus;
  for (const model of models.slice(0, 4)) {
    signal?.throwIfAborted();
    const attemptSignal = AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(attemptTimeoutMs)]);
    try {
      const response = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST', redirect: 'error', signal: attemptSignal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(typeof body === 'function' ? body(model) : body),
      });
      lastStatus = response.status;
      if (!response.ok) {
        await response.body?.cancel();
        if ([401, 403].includes(response.status)) throw new AppError(503, 'Gemini rejected the configured key or its permissions. Check the server API key for this feature.');
        if (retryable(response.status)) continue;
        throw new AppError(502, 'Gemini could not answer this request. Please try again.');
      }
      const result = await readResponse(response);
      const candidate = result.candidates?.[0];
      if (result.promptFeedback?.blockReason || ['SAFETY', 'RECITATION', 'BLOCKLIST', 'PROHIBITED_CONTENT'].includes(candidate?.finishReason)) {
        throw new AppError(502, 'The farming assistant could not answer this request. Please rephrase your question.');
      }
      const text = candidate?.content?.parts?.filter(part => !part.thought && typeof part.text === 'string').map(part => part.text).join('').trim();
      if (text) {
        if (validateText) {
          if (candidate.finishReason !== 'STOP') continue;
          try { return { text, model, value: validateText(text) }; }
          catch { continue; } // Invalid structured output must never reach the report.
        }
        return { text, model };
      }
    } catch (error) {
      if (signal?.aborted || error instanceof AppError) throw error;
      // Try another model for a stalled connection or unusable response.
    }
  }
  throw new AppError(lastStatus === 429 ? 503 : 502, lastStatus === 429
    ? 'Gemini quota is currently exhausted. Please check project quota or try again later.'
    : 'Available Gemini models could not respond in time. Please try again.');
}

module.exports = { generateWithFallback };
