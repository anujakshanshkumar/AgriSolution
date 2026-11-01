const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const fixture = require('./fixtures/plant-report.cjs');
const { getPlantDiseaseConfig } = require('../backend/src/config/plant-disease');
const { validateImage } = require('../backend/src/services/plant-image');
const { analyzePlant, normalizeReport } = require('../backend/src/services/plant-disease-provider');

const config = getPlantDiseaseConfig({ PLANT_DISEASE_AI_API_KEY: 'test-only-not-a-real-key' });
let png;
before(async () => { png = await sharp({ create: { width: 80, height: 80, channels: 3, background: '#59a046' } }).png().toBuffer(); });
const upload = (buffer, mimetype = 'image/png') => ({ buffer, mimetype, originalname: 'leaf.png' });
const responseFor = (report = fixture()) => new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(report) }] } }] }), { headers: { 'content-type': 'application/json' } });
const request = () => ({ image: { buffer: png, mimeType: 'image/png' }, crop: 'Tomato', symptoms: 'Leaf spots', language: 'en' });
const status = (expected) => (error) => error.statusCode === expected;

test('optional feature configuration fails closed without affecting portal startup', () => {
  assert.equal(getPlantDiseaseConfig({}).configured, false);
  assert.equal(getPlantDiseaseConfig({ PLANT_DISEASE_AI_PROVIDER: 'unknown', GEMINI_API_KEY: 'test' }).configured, false);
  assert.equal(getPlantDiseaseConfig({ GEMINI_API_KEY: 'test', PLANT_DISEASE_MAX_FILE_SIZE_MB: '-1' }).configured, false);
  assert.equal(getPlantDiseaseConfig({ GEMINI_API_KEY: 'test' }).configured, true);
});

test('JPEG, PNG, and WebP are decoded, resized, and stripped of metadata in memory', async () => {
  for (const format of ['jpeg', 'png', 'webp']) {
    const original = await sharp(png).withMetadata({ exif: { IFD0: { Artist: 'Private test metadata' } } }).toFormat(format).toBuffer();
    const image = await validateImage(upload(original, `image/${format}`));
    const metadata = await sharp(image.buffer).metadata();
    assert.equal(image.mimeType, 'image/jpeg');
    assert.equal(metadata.width, 80);
    assert.equal(metadata.exif, undefined);
    assert.equal('path' in image, false);
  }
});

test('signature spoofing, invalid MIME, corrupt image, oversized image, and excessive pixels are rejected', async () => {
  await assert.rejects(validateImage(upload(Buffer.from('<script>bad</script>'), 'image/jpeg')), status(415));
  await assert.rejects(validateImage(upload(png, 'image/jpeg')), status(415));
  await assert.rejects(validateImage(upload(png.subarray(0, 30))), status(400));
  await assert.rejects(validateImage(upload(png), { maxFileSizeBytes: 5 }), status(413));
  await assert.rejects(validateImage(upload(png), { maxPixels: 10 }), status(400));
  await assert.rejects(validateImage(null), status(400));
});

test('possible disease, healthy-looking, and inconclusive reports stay explicit and never manufacture confidence', () => {
  for (const condition of ['possible_disease', 'healthy_looking', 'inconclusive', 'unsupported_image', 'nutrient_deficiency', 'pest_damage', 'environmental_stress']) {
    const report = normalizeReport(fixture(condition));
    assert.equal(report.plantCondition, condition);
    assert.equal(report.primaryDiagnosis.confidence, null);
    assert.ok(report.limitations.some((text) => text.includes('cannot confirm')));
    if (['inconclusive', 'unsupported_image'].includes(condition)) {
      assert.equal(report.primaryDiagnosis.name, null);
      assert.deepEqual(report.alternativeDiagnoses, []);
      assert.equal(report.needsExpertReview, true);
    }
    if (condition === 'unsupported_image') assert.equal(report.crop, null);
  }
  assert.throws(() => normalizeReport({ success: true }), status(502));
  const overconfident = fixture();
  overconfident.primaryDiagnosis.confidence = 0.99;
  assert.throws(() => normalizeReport(overconfident), status(502));
  const malicious = fixture();
  malicious.primaryDiagnosis.name = '<img src=x onerror=alert(1)>Possible spot';
  assert.equal(normalizeReport(malicious).primaryDiagnosis.name, 'Possible spot');
});

test('provider sends image only to documented server endpoint with key in header and a response schema', async () => {
  let sent;
  const result = await analyzePlant(request(), { config, fetchImpl: async (url, options) => {
    sent = { url, options, body: JSON.parse(options.body) };
    return responseFor();
  } });
  assert.equal(result.plantCondition, 'possible_disease');
  assert.match(sent.url, /^https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-3\.8-flash:generateContent$/);
  assert.ok(!sent.url.includes(config.apiKey));
  assert.equal(sent.options.headers['x-goog-api-key'], config.apiKey);
  assert.equal(sent.body.contents[0].parts[0].inline_data.mime_type, 'image/png');
  assert.equal(sent.body.generationConfig.responseMimeType, 'application/json');
  assert.ok(sent.body.generationConfig.responseJsonSchema.properties.plantCondition);
});

test('missing credentials make no provider call', async () => {
  await assert.rejects(analyzePlant(request(), { config: getPlantDiseaseConfig({}), fetchImpl: () => assert.fail('Must not call provider') }), status(503));
});

test('auth, quota, and model provider failures are not retried and do not leak provider text', async () => {
  for (const code of [400, 401, 403, 404, 429]) {
    let calls = 0;
    await assert.rejects(analyzePlant(request(), { config, fetchImpl: async () => {
      calls++;
      return new Response('PRIVATE_KEY_AND_IMAGE_DATA', { status: code });
    } }), (error) => error.statusCode === 503 && !error.message.includes('PRIVATE_KEY'));
    assert.equal(calls, 1);
  }
});

test('transient provider failure retries once; persistent failure remains an error', async () => {
  let calls = 0;
  const result = await analyzePlant(request(), { config, fetchImpl: async () => ++calls === 1 ? new Response('', { status: 503 }) : responseFor() });
  assert.equal(calls, 2);
  assert.equal(result.success, true);
  calls = 0;
  await assert.rejects(analyzePlant(request(), { config, fetchImpl: async () => { calls++; return new Response('', { status: 500 }); } }), status(502));
  assert.equal(calls, 2);
});

test('timeout and caller cancellation abort the provider request', async () => {
  const blockedFetch = async (_url, { signal }) => new Promise((_resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  });
  await assert.rejects(analyzePlant(request(), { config: { ...config, requestTimeoutMs: 20 }, fetchImpl: blockedFetch }), status(504));
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(analyzePlant(request(), { config, fetchImpl: blockedFetch, signal: controller.signal }), status(504));
});

test('malformed, truncated, blocked, oversized, and invalid-schema AI responses never become diagnoses', async () => {
  const responses = [
    () => new Response('not json'),
    () => new Response(JSON.stringify({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{}' }] } }] })),
    () => new Response(JSON.stringify({ promptFeedback: { blockReason: 'SAFETY' } })),
    () => new Response('x'.repeat(140000)),
    () => responseFor({ success: true }),
  ];
  for (const getResponse of responses) {
    await assert.rejects(analyzePlant(request(), { config, fetchImpl: async () => getResponse() }), status(502));
  }
});
