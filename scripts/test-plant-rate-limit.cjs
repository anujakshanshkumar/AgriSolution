const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { createAnalysisGate } = require('../backend/src/routes/plant-disease-routes');

function request(gate, status = 200, finish = true) {
  const req = Object.assign(new EventEmitter(), { user: { _id: 'farmer' }, ip: '127.0.0.1', complete: true });
  const headers = {};
  const res = Object.assign(new EventEmitter(), { statusCode: status, set: (key, value) => { headers[key] = value; } });
  let error;
  gate(req, res, value => { error = value; });
  if (finish) res.emit('finish');
  return { error, headers, res };
}
const config = { configured: true, provider: 'local_rice', requestTimeoutMs: 60000 };

test('local uploads allow 30 per minute and report the remaining wait accurately', () => {
  let time = 0;
  const gate = createAnalysisGate(config, { now: () => time });
  for (let i = 0; i < 30; i++) assert.equal(request(gate).error, undefined);
  time = 10000;
  const blocked = request(gate);
  assert.equal(blocked.error.statusCode, 429);
  assert.equal(blocked.headers['Retry-After'], '50');
  time = 60000;
  assert.equal(request(gate).error, undefined);
});

test('provider failures do not exhaust the Gemini request allowance', () => {
  const gate = createAnalysisGate({ ...config, provider: 'gemini' });
  for (let i = 0; i < 15; i++) assert.equal(request(gate, 503).error, undefined);
  for (let i = 0; i < 10; i++) assert.equal(request(gate).error, undefined);
  assert.equal(request(gate).error.statusCode, 429);
});

test('concurrent duplicate uploads are still blocked and released on completion', () => {
  const gate = createAnalysisGate(config);
  const active = request(gate, 200, false);
  assert.match(request(gate).error.message, /Another plant analysis/);
  active.res.emit('finish');
  assert.equal(request(gate).error, undefined);
});
