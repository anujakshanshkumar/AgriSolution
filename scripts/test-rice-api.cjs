const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const sharp = require('sharp');
const { getPlantDiseaseConfig } = require('../backend/src/config/plant-disease');
const { analyzeConfiguredPlant, normalizeRiceReport } = require('../backend/src/services/rice-disease-provider');
const { createPlantDiseaseRouter } = require('../backend/src/routes/plant-disease-routes');
const token = 'test-only-'.repeat(5);
const config = getPlantDiseaseConfig({ PLANT_DISEASE_AI_PROVIDER: 'local_rice', RICE_SERVICE_TOKEN: token });
const fixture = () => ({ schemaVersion: 1, modelVersion: 'test-only', label: 'blast', confidence: .7,
  confidenceType: 'temperature_scaled_validation', topThree: [{ label: 'blast', confidence: .7 }, { label: 'normal', confidence: .2 }, { label: 'hispa', confidence: .05 }],
  uncertainty: { status: 'low_confidence', needsReview: true, threshold: .8, reasons: ['Test fixture; rice identity unverified.'] },
  riceOnly: true, scopeVerified: false, inferenceMs: 12 });

test('private service configuration rejects remote URLs and weak secrets', () => {
  assert.ok(config.configured);
  for (const url of ['http://example.com', 'http://127.0.0.1@evil.test', 'http://127.0.0.1/redirect']) {
    assert.equal(getPlantDiseaseConfig({ PLANT_DISEASE_AI_PROVIDER: 'local_rice', RICE_SERVICE_TOKEN: token, RICE_SERVICE_URL: url }).configured, false);
  }
  assert.equal(getPlantDiseaseConfig({ PLANT_DISEASE_AI_PROVIDER: 'local_rice', RICE_SERVICE_TOKEN: 'short' }).configured, false);
});

test('local predictions preserve calibrated confidence and uncertainty; reject inconsistent outputs', () => {
  const result = normalizeRiceReport(fixture());
  assert.equal(result.primaryDiagnosis.confidence, .7);
  assert.equal(result.plantCondition, 'inconclusive');
  assert.equal(result.classifier.topThree.length, 3);
  assert.equal(result.needsExpertReview, true);
  for (const mutate of [p => p.confidence = 5, p => p.topThree[0].label = 'normal', p => p.scopeVerified = true, p => p.uncertainty.status = 'scope_unverified']) {
    const p = fixture(); mutate(p);
    assert.throws(() => normalizeRiceReport(p), error => error.statusCode === 502);
  }
});

test('non-rice context is rejected locally and local failures never call Gemini', async () => {
  let calls = 0;
  const options = { config, fetchImpl: async () => { calls++; throw Error('offline'); } };
  const result = await analyzeConfiguredPlant({ crop: 'Tomato' }, options);
  assert.equal(normalizeRiceReport(result).plantCondition, 'unsupported_image');
  assert.equal(calls, 0);
  await assert.rejects(analyzeConfiguredPlant({ image: { buffer: Buffer.from('test'), mimeType: 'image/jpeg' } }, options), e => e.statusCode === 503);
  assert.equal(calls, 1);
});

test('authenticated multipart upload reaches private HTTP service; report and history retain predictions', async () => {
  let privateCalls = 0;
  const privateServer = http.createServer((req, res) => {
    assert.equal(req.headers.authorization, `Bearer ${token}`);
    assert.equal(req.url, '/predict');
    privateCalls++;
    req.resume();
    req.on('end', () => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(fixture())); });
  });
  await new Promise(resolve => privateServer.listen(0, '127.0.0.1', resolve));
  const records = [];
  const repository = { save: async (user, record) => { const saved = { ...record, id: 'a'.repeat(24), createdAt: new Date().toISOString() }; records.push(saved); return saved; }, list: async () => ({ analyses: records, nextBefore: null }) };
  const app = express();
  app.use('/api/plant-disease', createPlantDiseaseRouter({
    config: { ...config, riceServiceUrl: `http://127.0.0.1:${privateServer.address().port}` }, repository,
    authenticate: (req, res, next) => { if (req.headers.authorization !== 'Bearer test-session') return res.sendStatus(401); req.user = { _id: 'user1' }; next(); },
  }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${server.address().port}/api/plant-disease`;
  try {
    assert.equal((await fetch(origin+'/config')).status, 401);
    const headers = { Authorization: 'Bearer test-session' };
    const publicConfig = await (await fetch(origin+'/config', { headers })).json();
    assert.equal(JSON.stringify(publicConfig).includes(token), false);
    assert.equal('riceServiceUrl' in publicConfig, false);
    const data = new FormData();
    const image = await sharp({ create: { width: 64, height: 64, channels: 3, background: '#407040' } }).png().toBuffer();
    data.append('image', new Blob([image], { type: 'image/png' }), 'leaf.png');
    data.append('crop', 'Rice');
    const response = await fetch(origin+'/analyze', { method: 'POST', headers, body: data });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.result.classifier.uncertainty, 'low_confidence');
    assert.equal(body.result.primaryDiagnosis.confidence, .7);
    assert.equal(privateCalls, 1);
    const history = await (await fetch(origin+'/history', { headers })).json();
    assert.deepEqual(history.analyses[0].result, body.result);
  } finally {
    await Promise.all([new Promise(r => server.close(r)), new Promise(r => privateServer.close(r))]);
  }
});
