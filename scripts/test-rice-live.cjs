// Exercise the deployed model and real authentication/database, cleaning up only
// uniquely named users, sessions and reports created by this test invocation.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { MongoClient, ObjectId } = require('mongodb');
const { chromium } = require(process.env.RICE_PLAYWRIGHT_MODULE || 'playwright');
const config = require('../backend/src/config/environment');

async function main() {
  const base = process.env.RICE_TEST_PORTAL || 'http://127.0.0.1:3000';
  const root = path.resolve(__dirname, '..');
  const deployment = JSON.parse(await fs.readFile(path.join(root, 'artifacts/rice/evaluation/deployment/deployment.json')));
  const prefix = `rice-live-${crypto.randomBytes(5).toString('hex')}`;
  const mobiles = [prefix+'-1', prefix+'-2'];
  const password = crypto.randomBytes(24).toString('hex');
  const dbClient = new MongoClient(config.databaseUri);
  let browser;
  const results = { modelVersion: deployment.model_version, tests: {}, diagnostic_accuracy_test: false };
  const jsonRequest = async (url, body) => {
    const response = await fetch(base+url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
    assert.equal(response.status, 200, `${url}: ${response.status}`);
    return response.json();
  };
  try {
    const sessions = [];
    for (const mobile of mobiles) {
      await jsonRequest('/api/register', { mobile, password, name: 'Rice deployment test', district: 'Test' });
      sessions.push(await jsonRequest('/api/login', { mobile, password }));
    }
    results.tests.real_registration_and_login = 'passed';
    assert.equal((await fetch(base+'/api/plant-disease/config')).status, 401);
    const headers = { Authorization: `Bearer ${sessions[0].accessToken}` };
    const publicConfig = await (await fetch(base+'/api/plant-disease/config', { headers })).json();
    assert.equal(publicConfig.provider, 'local_rice');
    assert.equal('riceServiceToken' in publicConfig, false);
    assert.equal('riceServiceUrl' in publicConfig, false);
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(user => sessionStorage.setItem('agriUser', JSON.stringify(user)), sessions[0]);
    await page.goto(base+'/plant-disease.html');
    await page.locator('[data-language-choice="en"]').click();
    await page.locator('#plant-workspace').waitFor({ state: 'visible' });
    assert.match(await page.locator('#plant-provider-notice').textContent(), /local rice classifier/);
    const responsePromise = page.waitForResponse(r => r.url().endsWith('/api/plant-disease/analyze') && r.request().method() === 'POST');
    const guidanceResponsePromise = page.waitForResponse(r => /\/history\/[^/]+\/guidance$/.test(r.url()) && r.request().method() === 'POST', { timeout: 90000 });
    let analysisRequests = 0;
    page.on('request', r => { if (r.url().endsWith('/api/plant-disease/analyze') && r.method() === 'POST') analysisRequests++; });
    await page.locator('#plant-image').setInputFiles(path.join(root, 'Data/test_images/200001.jpg'));
    const response = await responsePromise;
    assert.equal(response.status(), 200);
    const record = await response.json();
    assert.equal(record.result.classifier.modelVersion, deployment.model_version);
    assert.equal(record.result.classifier.topThree.length, 3);
    assert.ok(record.result.primaryDiagnosis.confidence >= 0 && record.result.primaryDiagnosis.confidence <= 1);
    await page.locator('#plant-report').waitFor({ state: 'visible' });
    assert.doesNotMatch(await page.locator('#report-content').textContent(), /Validation-calibrated confidence|Highest-scoring prediction among the supported rice classes|Possible disease|Rice \(unverified\)/);
    assert.doesNotMatch(await page.locator('#report-content').textContent(), /Top three model predictions|Expert review recommended|Visible observations|Other possible causes|Recommended next steps|Prevention practices|Uncertainty and limitations/);
    assert.doesNotMatch(await page.locator('#report-content').textContent(), /Rice only\. Rice identity and unknown diseases are not verified\. Field-photo accuracy has not been established\./);
    assert.equal(await page.locator('#report-content ol li').count(), 3);
    assert.equal(await page.locator('#analyze-plant').count(), 0);
    assert.equal(await page.locator('.plant-diagnosis-danger').evaluate(node => getComputedStyle(node).color), 'rgb(180, 35, 24)');
    const guidanceResponse = await guidanceResponsePromise;
    assert.equal(guidanceResponse.status(), 200, `Gemini care: ${JSON.stringify(await guidanceResponse.json())}`);
    await page.locator('#plant-care[data-state="ready"]').waitFor({ timeout: 10000 });
    const careHeadings = await page.locator('.plant-care-section > h3').allTextContents();
    assert.deepEqual(careHeadings, ['Treatment Required', 'How to apply', 'What causes this condition?', 'What happens if left untreated?']);
    assert.equal(analysisRequests, 1);
    results.tests.automatic_upload_and_gemini_care = 'passed';
    if (record.result.classifier.uncertainty === 'low_confidence') assert.match(await page.locator('#report-content').textContent(), /Low confidence/);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: path.join(root, 'artifacts/rice/deployed-browser-upload.png'), fullPage: true });
    results.tests.browser_trained_model_upload = 'passed';
    results.example_prediction = { name: record.result.primaryDiagnosis.name, confidence: record.result.primaryDiagnosis.confidence,
      uncertainty: record.result.classifier.uncertainty, inferenceMs: record.result.classifier.inferenceMs, image: 'unlabeled test_images/200001.jpg (demonstration only)' };
    const own = await fetch(base+`/api/plant-disease/history/${record.id}`, { headers });
    assert.equal(own.status, 200);
    assert.equal((await own.json()).result.careGuidance.status, 'ready');
    const otherHeaders = { Authorization: `Bearer ${sessions[1].accessToken}` };
    assert.equal((await fetch(base+`/api/plant-disease/history/${record.id}`, { headers: otherHeaders })).status, 404);
    assert.equal((await fetch(base+`/api/plant-disease/history/${record.id}/guidance`, { method: 'POST', headers: otherHeaders })).status, 404);
    assert.equal((await fetch(base+`/api/plant-disease/history/${record.id}`, { method: 'DELETE', headers: otherHeaders })).status, 404);
    assert.equal((await fetch(base+`/api/plant-disease/history/${record.id}`, { headers })).status, 200);
    assert.equal((await fetch(base+`/api/plant-disease/history/${record.id}`, { method: 'DELETE', headers })).status, 200);
    results.tests.real_history_ownership_and_deletion = 'passed';
    const demoPath = path.join(root, 'artifacts/rice/low_confidence_demo.json');
    try {
      const demo = JSON.parse(await fs.readFile(demoPath));
      const photo = path.resolve(root, demo.image);
      assert.ok(photo.startsWith(path.join(root, 'Data', 'test_images')+path.sep));
      await page.locator('#analyze-another').click();
      const lowResponse = page.waitForResponse(r => r.url().endsWith('/api/plant-disease/analyze') && r.request().method() === 'POST');
      const lowCareResponse = page.waitForResponse(r => /\/history\/[^/]+\/guidance$/.test(r.url()) && r.request().method() === 'POST', { timeout: 90000 });
      await page.locator('#plant-camera').setInputFiles(photo);
      const low = await lowResponse;
      assert.equal(low.status(), 200);
      const lowRecord = await low.json();
      assert.equal(lowRecord.result.classifier.uncertainty, 'low_confidence');
      await page.locator('#plant-report').waitFor({ state: 'visible' });
      assert.match(await page.locator('#report-content').textContent(), /Low confidence/);
      const lowCare = await lowCareResponse;
      assert.equal(lowCare.status(), 200, `Uncertain Gemini care: ${JSON.stringify(await lowCare.json())}`);
      await page.locator('#plant-care[data-state="ready"]').waitFor({ timeout: 10000 });
      assert.equal(await page.locator('.plant-medicine').count(), 0);
      assert.equal(analysisRequests, 2);
      results.tests.automatic_camera_input_and_uncertain_care = 'passed';
      await page.setViewportSize({ width: 390, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      await page.screenshot({ path: path.join(root, 'artifacts/rice/deployed-uncertainty-warning.png'), fullPage: true });
      results.tests.real_low_confidence_browser_warning = 'passed';
      results.low_confidence_example = { confidence: lowRecord.result.primaryDiagnosis.confidence,
        name: lowRecord.result.primaryDiagnosis.name, image: demo.image, diagnostic_accuracy_test: false };
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      results.tests.real_low_confidence_browser_warning = 'not run: no demonstration image selected';
    }
    for (const route of ['/dashboard.html', '/crop.html', '/soil.html']) assert.equal((await fetch(base+route)).status, 200);
    results.tests.existing_pages = 'passed';
    results.tests.private_credentials_not_exposed = 'passed';
    await fs.writeFile(path.join(root, 'artifacts/rice/live_deployment_test.json'), JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await browser?.close();
    await dbClient.connect();
    const db = dbClient.db(config.databaseName);
    const created = await db.collection('users').find({ mobile: { $in: mobiles } }, { projection: { _id: 1, mobile: 1 } }).toArray();
    assert.ok(created.every(user => mobiles.includes(user.mobile) && user.mobile.startsWith(prefix)));
    const ids = created.map(user => user._id);
    if (ids.length) {
      await db.collection('plantAnalyses').deleteMany({ userId: { $in: ids } });
      await db.collection('sessions').deleteMany({ userId: { $in: ids } });
      await db.collection('users').deleteMany({ _id: { $in: ids }, mobile: { $in: mobiles } });
    }
    await dbClient.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
