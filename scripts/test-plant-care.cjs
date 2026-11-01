const { test } = require('node:test');
const assert = require('node:assert/strict');
const { generatePlantCare: generateCare, normalizeCare } = require('../backend/src/services/plant-care-provider');
function generatePlantCare(result, options) {
  return generateCare(result, { ...options, fetchImpl: async (url, init) => {
    init.signal?.throwIfAborted();
    if (url.includes('pageSize=')) return new Response(JSON.stringify({ models: [{
      name: `models/${options.config.careModel || options.config.model}`, supportedGenerationMethods: ['generateContent'],
    }] }));
    return options.fetchImpl(url, init);
  } });
}
const fixture = require('./fixtures/plant-care.cjs');
const result = { language: 'en', crop: 'Rice (unverified)', plantCondition: 'possible_disease', primaryDiagnosis: { name: 'Blast', confidence: .95 }, classifier: { uncertainty: 'scope_unverified' } };
const config = { apiKey: 'secret-test-key', model: 'gemini-test-model', requestTimeoutMs: 1000 };
const response = value => new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(value) }] } }] }), { headers: { 'Content-Type': 'application/json' } });

test('care uses its dedicated model and key without changing the image-analysis model', async () => {
  const dedicated = { ...config, model: 'gemini-3.8-flash', careModel: 'gemini-flash-lite-latest' };
  await generatePlantCare(result, { config: dedicated, fetchImpl: async (url, options) => {
    assert.match(url, /gemini-flash-lite-latest:generateContent$/);
    assert.equal(options.headers['x-goog-api-key'], config.apiKey);
    assert.equal(JSON.parse(options.body).generationConfig.thinkingConfig, undefined);
    return response(fixture());
  } });
  assert.equal(dedicated.model, 'gemini-3.8-flash');
});

test('care request sends only saved assessment; validates and sanitizes Gemini output', async () => {
  const care = fixture(); care.medicines[0].name = '<b>Example</b>';
  const original = structuredClone(result);
  const output = await generatePlantCare({ ...result, userId: 'private-user', image: 'private-image', symptoms: 'private-notes' }, { config, fetchImpl: async (url, options) => {
    assert.equal(options.headers['x-goog-api-key'], config.apiKey);
    const body = JSON.parse(options.body);
    assert.ok(body.generationConfig.responseJsonSchema);
    assert.ok(!options.body.includes('private-'));
    assert.ok(!options.body.includes(config.apiKey));
    assert.match(body.systemInstruction.parts[0].text, /not invent.*doses/i);
    return response(care);
  } });
  assert.equal(output.status, 'ready');
  assert.equal(output.medicines[0].name, 'Example');
  assert.deepEqual(result, original);
});

test('healthy and uncertain results do not receive medicine prescriptions', () => {
  for (const condition of ['healthy_looking', 'inconclusive', 'unsupported_image']) {
    const output = normalizeCare(fixture(), { ...result, plantCondition: condition });
    assert.deepEqual(output.medicines, []);
    assert.match(output.treatmentSummary, /No disease treatment|Confirm the cause/);
  }
  assert.deepEqual(normalizeCare(fixture(), { ...result, classifier: { uncertainty: 'low_confidence' } }).medicines, []);
  assert.throws(() => normalizeCare({ ...fixture(), causes: [] }, result), error => error.statusCode === 502);
  assert.throws(() => normalizeCare({ ...fixture(), unexpected: 'x' }, result), error => error.statusCode === 502);
});

test('medicine cards require composition and shop advice and sanitize both', () => {
  for (const field of ['composition', 'buyingAdvice']) {
    const incomplete = fixture();
    delete incomplete.medicines[0][field];
    assert.throws(() => normalizeCare(incomplete, result), error => error.statusCode === 502);
  }
  const care = fixture();
  care.medicines[0].composition = '<b>Test ingredient</b>';
  care.medicines[0].buyingAdvice = '<i>Ask a licensed dealer</i>';
  const output = normalizeCare(care, result);
  assert.equal(output.medicines[0].composition, 'Test ingredient');
  assert.equal(output.medicines[0].buyingAdvice, 'Ask a licensed dealer');
});

test('Hindi care requests include accessible language and local buying constraints', async () => {
  await generatePlantCare({ ...result, language: 'hi' }, { config, fetchImpl: async (_, options) => {
    const body = JSON.parse(options.body);
    const prompt = body.systemInstruction.parts[0].text;
    assert.match(prompt, /Hindi \(Devanagari\)/);
    assert.match(prompt, /everyday spoken Hindi/);
    assert.match(prompt, /local shop stock is not checked/);
    assert.match(prompt, /NOT a molecular formula/);
    assert.match(prompt, /Never turn a formulation percentage into a spray dose/);
    assert.ok(body.generationConfig.responseJsonSchema.properties.medicines.items.required.includes('composition'));
    return response(fixture());
  } });
});

test('Gemini 3 care requests use bounded reasoning without overriding its default temperature', async () => {
  await generatePlantCare(result, { config: { ...config, model: 'gemini-3.8-flash' }, fetchImpl: async (_, options) => {
    const generation = JSON.parse(options.body).generationConfig;
    assert.equal(generation.thinkingConfig.thinkingLevel, 'low');
    assert.equal('temperature' in generation, false);
    return response(fixture());
  } });
});

test('Gemini errors, malformed responses and aborts leave the original diagnosis intact', async () => {
  for (const [status, expected] of [[403, 503], [429, 503], [500, 502]]) {
    await assert.rejects(generatePlantCare(result, { config, fetchImpl: async () => new Response('private provider error', { status }) }), error => error.statusCode === expected && !error.message.includes('private'));
  }
  await assert.rejects(generatePlantCare(result, { config, fetchImpl: async () => response({}) }), error => error.statusCode === 502);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(generatePlantCare(result, { config, signal: controller.signal, fetchImpl: async (_, options) => { options.signal.throwIfAborted(); } }), error => error.statusCode === 504);
  await assert.rejects(generatePlantCare(result, { config: { ...config, apiKey: '' } }), error => error.statusCode === 503);
  assert.equal(result.primaryDiagnosis.name, 'Blast');
});
