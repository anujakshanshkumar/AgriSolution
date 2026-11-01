// Opt-in database integration. Only uniquely named test collections are touched.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const crypto = require('node:crypto');
const { MongoClient, ObjectId } = require('mongodb');
const sharp = require('sharp');
const fixture = require('./fixtures/plant-report.cjs');
const environment = require('../backend/src/config/environment');
const { getPlantDiseaseConfig } = require('../backend/src/config/plant-disease');
const AppError = require('../backend/src/errors/app-error');

if (process.env.PLANT_DB_TEST !== '1') {
  test('MongoDB plant API tests: set PLANT_DB_TEST=1 to use isolated test collections', { skip: true }, () => {});
} else {
  const prefix = `plant_test_${crypto.randomBytes(8).toString('hex')}_`;
  const touched = new Set();
  const client = new MongoClient(environment.databaseUri, { serverSelectionTimeoutMS: 5000 });
  const config = getPlantDiseaseConfig({ PLANT_DISEASE_AI_API_KEY: 'test-key' });
  let database, createRouter, repository, png, first, second;
  const testDb = { collection(name) { const full = prefix + name; touched.add(full); return database.collection(full); } };
  before(async () => {
    await client.connect();
    database = client.db(environment.databaseName);
    const repositoryPath = require.resolve('../backend/src/infrastructure/user-repository');
    require(repositoryPath);
    require.cache[repositoryPath].exports = { getDatabase: async () => testDb, getUsersCollection: async () => testDb.collection('users') };
    const { createSession } = require('../backend/src/services/session-service');
    first = { _id: new ObjectId(), name: 'Plant test one' };
    second = { _id: new ObjectId(), name: 'Plant test two' };
    await testDb.collection('users').insertMany([first, second]);
    first.token = (await createSession(first._id)).accessToken;
    second.token = (await createSession(second._id)).accessToken;
    ({ createPlantDiseaseRouter: createRouter } = require('../backend/src/routes/plant-disease-routes'));
    repository = require('../backend/src/infrastructure/plant-analysis-repository').createAnalysisRepository(async () => testDb);
    png = await sharp({ create: { width: 100, height: 100, channels: 3, background: '#79a05a' } }).png().toBuffer();
  });
  after(async () => {
    for (const name of touched) {
      assert.ok(name.startsWith(prefix) && /^plant_test_[a-f0-9]{16}_[A-Za-z]+$/.test(name));
      await database.collection(name).drop().catch((error) => { if (error.code !== 26) throw error; });
    }
    await client.close();
  });
  async function withServer(options, run) {
    const app = require('express')();
    app.use('/api/plant-disease', createRouter({ config, repository, analyze: async () => fixture(), ...options }));
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}/api/plant-disease`;
    async function call(path, { token = first.token, method = 'GET', form } = {}) {
      const response = await fetch(origin + path, { method, headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
      return { status: response.status, body: await response.json(), headers: response.headers };
    }
    try { await run(call); } finally { await new Promise((resolve) => server.close(resolve)); }
  }
  function form(buffer = png, type = 'image/png') {
    const data = new FormData();
    data.append('image', new Blob([buffer], { type }), 'plant.png');
    data.append('crop', 'Tomato');
    data.append('language', 'en');
    return data;
  }
  test('all plant endpoints require a valid real bearer session', async () => withServer({}, async (call) => {
    for (const [path, method] of [['/config', 'GET'], ['/history', 'GET'], ['/history/' + new ObjectId(), 'GET'], ['/history/' + new ObjectId(), 'DELETE'], ['/history/' + new ObjectId() + '/guidance', 'POST'], ['/analyze', 'POST']]) {
      assert.equal((await call(path, { token: null, method })).status, 401);
      assert.equal((await call(path, { token: 'a'.repeat(64), method })).status, 401);
    }
  }));
  test('valid multipart analysis stores only a report and enforces history ownership and deletion', async () => withServer({}, async (call) => {
    const created = await call('/analyze', { method: 'POST', form: form() });
    assert.equal(created.status, 200);
    assert.equal(created.body.result.plantCondition, 'possible_disease');
    const id = created.body.id;
    const row = await testDb.collection('plantAnalyses').findOne({ _id: new ObjectId(id) });
    assert.deepEqual(Object.keys(row).sort(), ['_id', 'createdAt', 'result', 'selectedCrop', 'userId']);
    assert.equal(row.userId.toString(), first._id.toString());
    assert.ok(!JSON.stringify(row).includes('test-key'));
    assert.equal((await call('/history/' + id)).status, 200);
    const history = await call('/history');
    assert.ok(history.body.analyses.some((record) => record.id === id));
    assert.ok(!(await call('/history', { token: second.token })).body.analyses.some((record) => record.id === id));
    assert.equal((await call('/history/' + id, { token: second.token })).status, 404);
    assert.equal((await call('/history/' + id, { token: second.token, method: 'DELETE' })).status, 404);
    assert.equal((await call('/history/' + id)).status, 200);
    assert.equal((await call('/history/' + id, { method: 'DELETE' })).status, 200);
    assert.equal((await call('/history/' + id)).status, 404);
    assert.equal((await call('/history/' + id, { method: 'DELETE' })).status, 404);
  }));
  test('care guidance enforces ownership, is saved once, and survives history reads', async () => {
    let calls = 0;
    const care = { ...require('./fixtures/plant-care.cjs')(), status: 'ready', provider: 'gemini' };
    await withServer({ generateCare: async () => { calls++; return care; } }, async call => {
      const created = await call('/analyze', { method: 'POST', form: form() });
      const id = created.body.id;
      assert.equal((await call(`/history/${id}/guidance`, { token: second.token, method: 'POST' })).status, 404);
      assert.equal(calls, 0);
      const enriched = await call(`/history/${id}/guidance`, { method: 'POST' });
      assert.equal(enriched.status, 200);
      assert.deepEqual(enriched.body.result.careGuidance, care);
      assert.deepEqual(enriched.body.result.primaryDiagnosis, created.body.result.primaryDiagnosis);
      assert.equal((await call(`/history/${id}/guidance`, { method: 'POST' })).status, 200);
      assert.equal(calls, 1);
      assert.deepEqual((await call(`/history/${id}`)).body.result.careGuidance, care);
      assert.equal(await repository.saveCare(second._id, id, care), null);
    });
  });
  test('care failure preserves diagnosis and a deleted report is never recreated', async () => {
    await withServer({ generateCare: async () => { throw new AppError(503, 'Gemini unavailable'); } }, async call => {
      const created = await call('/analyze', { method: 'POST', form: form() });
      const id = created.body.id;
      assert.equal((await call(`/history/${id}/guidance`, { method: 'POST' })).status, 503);
      assert.deepEqual((await call(`/history/${id}`)).body.result, created.body.result);
      await call(`/history/${id}`, { method: 'DELETE' });
      assert.equal(await repository.saveCare(first._id, id, { status: 'ready' }), null);
    });
  });
  test('upload errors reject before AI; size and MIME are enforced at the HTTP boundary', async () => {
    let invoked = 0;
    await withServer({ analyze: async () => { invoked++; return fixture(); }, config: { ...config, maxFileSizeBytes: 1024 } }, async (call) => {
      assert.equal((await call('/analyze', { method: 'POST', form: form(Buffer.from('not an image'), 'image/png') })).status, 415);
      assert.equal((await call('/analyze', { method: 'POST', form: form(png, 'text/plain') })).status, 415);
      assert.equal((await call('/analyze', { method: 'POST', form: form(Buffer.alloc(2048), 'image/png') })).status, 413);
      assert.equal((await call('/analyze', { method: 'POST', form: new FormData() })).status, 400);
      const invalid = form(); invalid.set('language', 'bad');
      assert.equal((await call('/analyze', { method: 'POST', form: invalid })).status, 400);
      assert.equal(invoked, 0);
    });
  });
  test('setup message is explicit and never exposes key; failed analyses do not create history', async () => {
    await withServer({ config: getPlantDiseaseConfig({}) }, async (call) => {
      const response = await call('/config');
      assert.equal(response.body.configured, false);
      assert.equal('apiKey' in response.body, false);
      assert.equal((await call('/analyze', { method: 'POST', form: form() })).status, 503);
    });
    const count = await testDb.collection('plantAnalyses').countDocuments();
    await withServer({ analyze: async () => { throw new AppError(504, 'Analysis timed out.'); } }, async (call) => {
      assert.equal((await call('/analyze', { method: 'POST', form: form() })).status, 504);
    });
    assert.equal(await testDb.collection('plantAnalyses').countDocuments(), count);
  });
  test('image buffers are cleared after success and failure, without temporary disk files', async () => {
    const validate = require('../backend/src/services/plant-image').validateImage;
    for (const fail of [false, true]) {
      let original, normalized;
      await withServer({
        validateImage: async (file, limits) => { original = file.buffer; const image = await validate(file, limits); normalized = image.buffer; return image; },
        analyze: async () => { if (fail) throw new AppError(502, 'Provider unavailable.'); return fixture(); },
      }, async (call) => {
        assert.equal((await call('/analyze', { method: 'POST', form: form() })).status, fail ? 502 : 200);
        assert.ok(original.every((byte) => byte === 0));
        assert.ok(normalized.every((byte) => byte === 0));
      });
    }
  });
  test('invalid history IDs, query injection, and unbounded page sizes are rejected', async () => withServer({}, async (call) => {
    for (const path of ['/history/not-an-id', '/history?limit=1000', '/history?limit[$gt]=1', '/history?before=invalid', '/history?userId=other']) {
      assert.equal((await call(path)).status, 400, path);
    }
  }));
  test('per-user concurrency gate prevents duplicate simultaneous provider calls and then releases', async () => {
    let release, entered;
    const started = new Promise((resolve) => { entered = resolve; });
    const paused = new Promise((resolve) => { release = resolve; });
    let calls = 0;
    await withServer({ analyze: async () => { calls++; entered(); await paused; return fixture(); } }, async (call) => {
      const firstCall = call('/analyze', { method: 'POST', form: form() });
      await started;
      const busy = await call('/analyze', { method: 'POST', form: form() });
      assert.equal(busy.status, 429);
      assert.ok(busy.headers.get('retry-after'));
      assert.equal(calls, 1);
      release();
      assert.equal((await firstCall).status, 200);
      assert.equal((await call('/analyze', { method: 'POST', form: form() })).status, 200);
    });
  });
}
