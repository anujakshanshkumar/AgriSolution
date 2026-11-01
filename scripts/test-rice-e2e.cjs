const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');
const http = require('node:http');
const path = require('node:path');
const express = require('express');
const sharp = require('sharp');
const { chromium } = require(process.env.RICE_PLAYWRIGHT_MODULE || 'playwright');
const { getPlantDiseaseConfig } = require('../backend/src/config/plant-disease');
const { createPlantDiseaseRouter } = require('../backend/src/routes/plant-disease-routes');

async function main() {
  const root = path.resolve(__dirname, '..');
  const reservation = http.createServer();
  await new Promise(r => reservation.listen(0, '127.0.0.1', r));
  const port = reservation.address().port;
  await new Promise(r => reservation.close(r));
  const token = crypto.randomBytes(32).toString('hex');
  const origin = `http://127.0.0.1:${port}`;
  const child = spawn(process.env.RICE_PYTHON || path.join(root, 'speech/.venv/Scripts/python.exe'), ['-m', 'rice_model.tests.fixture_service'],
    { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, RICE_SERVICE_TOKEN: token, RICE_TEST_PORT: String(port) } });
  let diagnostics = '', childError;
  child.on('error', e => { childError = e; });
  child.stdout.on('data', data => { diagnostics = (diagnostics + data).slice(-4000); });
  child.stderr.on('data', data => { diagnostics = (diagnostics + data).slice(-4000); });
  let server, browser;
  try {
    let ready = false;
    for (let i = 0; i < 60; i++) {
      if (childError) throw childError;
      if (child.exitCode !== null) throw Error(diagnostics);
      try { const r = await fetch(origin+'/health', { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(1000) }); if (r.ok) { ready = true; break; } } catch {}
      await new Promise(r => setTimeout(r, 500));
    }
    assert.ok(ready, diagnostics);
    const records = [];
    const repository = { save: async (user, data) => { const r = { ...data, id: '1'.repeat(24), createdAt: new Date().toISOString() }; records.push(r); return r; },
      list: async () => ({ analyses: records, nextBefore: null }), get: async () => records[0] };
    const app = express();
    app.use('/api/plant-disease', createPlantDiseaseRouter({ repository,
      config: getPlantDiseaseConfig({ PLANT_DISEASE_AI_PROVIDER: 'local_rice', RICE_SERVICE_TOKEN: token, RICE_SERVICE_URL: origin }),
      authenticate: (req, res, next) => { if (req.headers.authorization !== 'Bearer browser-test-only') return res.sendStatus(401); req.user = { _id: 'test-user' }; next(); },
    }));
    app.use((req, res) => require('../routes/pageRoutes').handleRequest(req, res));
    server = app.listen(0, '127.0.0.1');
    await new Promise(r => server.once('listening', r));
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(e.message));
    await page.addInitScript(() => sessionStorage.setItem('agriUser', JSON.stringify({ accessToken: 'browser-test-only', name: 'Test Farmer', expiresAt: new Date(Date.now()+600000).toISOString() })));
    await page.goto(`http://127.0.0.1:${server.address().port}/plant-disease.html`);
    await page.locator('[data-language-dialog] button').filter({ hasText: 'English' }).click();
    await page.locator('#plant-workspace').waitFor({ state: 'visible' });
    assert.match(await page.locator('#plant-provider-notice').textContent(), /local rice classifier/);
    assert.equal(await page.locator('#plant-crop').inputValue(), 'Rice');
    const buffer = await sharp({ create: { width: 80, height: 100, channels: 3, background: '#558844' } }).png().toBuffer();
    await page.locator('#plant-image').setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer });
    await page.locator('#plant-report').waitFor({ state: 'visible', timeout: 30000 });
    const report = await page.locator('#report-content').textContent();
    assert.doesNotMatch(report, /Validation-calibrated confidence|Highest-scoring prediction among the supported rice classes|Possible disease|Rice \(unverified\)/);
    assert.doesNotMatch(report, /Top three model predictions|Expert review recommended|Visible observations|Other possible causes|Recommended next steps|Prevention practices|Uncertainty and limitations/);
    assert.match(report, /Low confidence/);
    assert.doesNotMatch(report, /Rice only\. Rice identity and unknown diseases are not verified\. Field-photo accuracy has not been established\./);
    assert.match(report, /Care guidance is unavailable right now/);
    assert.equal(await page.locator('#analyze-plant').count(), 0);
    assert.equal(records.length, 1);
    assert.equal(records[0].result.classifier.modelVersion, 'test-only-random-weights');
    assert.deepEqual(pageErrors, []);
    require('node:fs').mkdirSync(path.join(root, 'artifacts/rice'), { recursive: true });
    await page.screenshot({ path: path.join(root, 'artifacts/rice/browser-upload-test.png'), fullPage: true });
    console.log('PASS: browser upload -> authenticated Node route -> private FastAPI -> CPU model -> report/history. Disposable random weights; no diagnostic accuracy claim.');
  } finally {
    await browser?.close();
    if (server) await new Promise(r => server.close(r));
    if (child.pid && child.exitCode === null) {
      if (process.platform === 'win32') {
        await new Promise(resolve => { const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); killer.on('close', resolve); killer.on('error', () => { child.kill(); resolve(); }); });
      } else child.kill();
    }
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
