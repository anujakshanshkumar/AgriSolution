const { test } = require('node:test');
const assert = require('node:assert/strict');
const { generateWithFallback } = require('../backend/src/services/gemini-models');
const json = data => new Response(JSON.stringify(data));
const model = name => ({ name: `models/${name}`, supportedGenerationMethods: ['generateContent'] });

test('a slow model switches to another model within the attempt deadline', async () => {
  const keepAlive = setTimeout(() => {}, 1000);
  try {
    const output = await generateWithFallback({ apiKey: 'test-slow', body: {}, attemptTimeoutMs: 20, fetchImpl: async (url, options) => {
      if (url.includes('pageSize=')) return json({ models: [model('gemini-flash-a'), model('gemini-flash-b')] });
      if (url.includes('gemini-flash-a:')) return new Promise((resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true });
      });
      return json({ candidates: [{ content: { parts: [{ text: 'fast answer' }] } }] });
    } });
    assert.equal(output.model, 'gemini-flash-b');
  } finally { clearTimeout(keepAlive); }
});

test('invalid structured output falls back and validates the next model response', async () => {
  const output = await generateWithFallback({ apiKey: 'test-schema',
    body: selectedModel => ({ selectedModel }), validateText: text => {
      const parsed = JSON.parse(text);
      assert.equal(parsed.valid, true);
      return parsed;
    }, fetchImpl: async (url, options) => {
      if (url.includes('pageSize=')) return json({ models: [model('gemini-flash-a'), model('gemini-flash-b')] });
      const selected = JSON.parse(options.body).selectedModel;
      return json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ valid: selected === 'gemini-flash-b' }) }] } }] });
    } });
  assert.deepEqual(output.value, { valid: true });
  assert.equal(output.model, 'gemini-flash-b');
});

test('discovers paginated text models and falls back without exposing the key in URLs', async () => {
  const calls = [];
  const output = await generateWithFallback({ apiKey: 'test-pagination', preferredModel: 'gemini-missing', body: { contents: [] }, fetchImpl: async (url, options) => {
    assert.ok(!url.includes('test-pagination'));
    assert.equal(options.headers['x-goog-api-key'], 'test-pagination');
    calls.push(url);
    if (url.includes('pageToken=')) return json({ models: [model('gemini-flash-b')] });
    if (url.includes('pageSize=')) return json({ models: [model('gemini-image'), model('gemini-flash-a')], nextPageToken: 'next' });
    if (url.includes('gemini-flash-a:')) return new Response('private upstream details', { status: 503 });
    return json({ candidates: [{ content: { parts: [{ thought: true, text: 'hidden' }, { text: 'answer' }] } }] });
  } });
  assert.equal(output.text, 'answer');
  assert.equal(output.model, 'gemini-flash-b');
  assert.equal(calls.length, 4);
  assert.ok(!calls.some(url => url.includes('gemini-image:')));
});

test('credential rejection stops without attempting other models', async () => {
  let calls = 0;
  await assert.rejects(generateWithFallback({ apiKey: 'test-rejected', preferredModel: 'gemini-flash', body: {}, fetchImpl: async () => {
    calls++;
    return new Response('secret upstream error', { status: 403 });
  } }), error => /rejected/.test(error.message) && !error.message.includes('secret'));
  assert.equal(calls, 1);
});

test('quota exhaustion has bounded attempts and a useful error', async () => {
  let attempts = 0;
  await assert.rejects(generateWithFallback({ apiKey: 'test-quota', body: {}, fetchImpl: async url => {
    if (url.includes('pageSize=')) return json({ models: Array.from({ length: 8 }, (_, i) => model(`gemini-flash-${i}`)) });
    attempts++;
    return new Response('private', { status: 429 });
  } }), error => error.statusCode === 503 && /quota/.test(error.message));
  assert.equal(attempts, 4);
});

test('does not retry a safety-blocked answer across models', async () => {
  let attempts = 0;
  await assert.rejects(generateWithFallback({ apiKey: 'test-block', body: {}, fetchImpl: async url => {
    if (url.includes('pageSize=')) return json({ models: [model('gemini-flash-a'), model('gemini-flash-b')] });
    attempts++;
    return json({ promptFeedback: { blockReason: 'SAFETY' } });
  } }), /rephrase/);
  assert.equal(attempts, 1);
});

test('uses the configured model during a temporary discovery outage', async () => {
  const output = await generateWithFallback({ apiKey: 'test-outage', preferredModel: 'gemini-configured', body: {}, fetchImpl: async url => {
    if (url.includes('pageSize=')) return new Response('', { status: 503 });
    assert.match(url, /gemini-configured:generateContent$/);
    return json({ candidates: [{ content: { parts: [{ text: 'available' }] } }] });
  } });
  assert.equal(output.text, 'available');
});

test('parent cancellation stops before generating or falling back', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(generateWithFallback({ apiKey: 'test-aborted', preferredModel: 'gemini-configured', body: {}, signal: controller.signal, fetchImpl: async (_, options) => {
    options.signal.throwIfAborted();
  } }), error => error.name === 'AbortError');
});
