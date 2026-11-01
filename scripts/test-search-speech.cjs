const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const { chromium } = require('playwright');
const config = require('../backend/src/config/environment');
const routes = require('../backend/src/routes/speech-routes');
const pages = require('../routes/pageRoutes');

const listen = server => new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}`)));
const close = server => new Promise(resolve => server.close(resolve));

test('homepage speech API validates and forwards PCM to the local model without cloud credentials', async () => {
  let forwarded = 0;
  const worker = http.createServer((req, res) => {
    let bytes = 0;
    req.on('data', data => bytes += data.length);
    req.on('end', () => {
      forwarded++;
      assert.ok(['/transcribe?language=hi', '/transcribe?language=en'].includes(req.url));
      assert.equal(bytes, 3200);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ text: 'धान की खेती' }));
    });
  });
  const original = config.localSpeechUrl;
  config.localSpeechUrl = await listen(worker);
  const app = express();
  app.use('/api/v1/speech', routes);
  app.use((error, req, res, next) => res.status(error.status || 500).json({ error: error.message }));
  const server = http.createServer(app);
  const origin = await listen(server);
  const post = (language, body) => fetch(`${origin}/api/v1/speech/search?language=${language}`, {
    method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body
  });
  try {
    assert.equal((await post('fr', Buffer.alloc(3200))).status, 400);
    assert.equal((await post('en', Buffer.alloc(1601))).status, 400);
    assert.equal((await post('en', Buffer.alloc(655362))).status, 413);
    const good = await post('hi', Buffer.alloc(3200));
    assert.equal(good.status, 200);
    assert.equal((await good.json()).text, 'धान की खेती');
    assert.equal(forwarded, 1);
    for (const language of ['hi_in', 'hi', 'en_us', 'en']) {
      const dictation = await fetch(`${origin}/api/v1/speech/transcribe?language=${language}`, {
        method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: Buffer.alloc(3200)
      });
      assert.equal(dictation.status, 200);
      assert.ok((await dictation.json()).text);
    }
    assert.equal(forwarded, 5);
    for (const [language, body, status] of [
      ['fr', Buffer.alloc(3200), 400], ['en_us', Buffer.alloc(1601), 400],
      ['en_us', Buffer.alloc(655362), 413]
    ]) {
      const invalid = await fetch(`${origin}/api/v1/speech/transcribe?language=${language}`, {
        method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body
      });
      assert.equal(invalid.status, status);
    }
    await close(worker);
    const offline = await post('en', Buffer.alloc(3200));
    assert.equal(offline.status, 503);
    assert.match((await offline.json()).error, /npm start/);
  } finally {
    config.localSpeechUrl = original;
    if (worker.listening) await close(worker);
    await close(server);
  }
});

test('home search stops on silence, inserts text, retries, cancels stale results and handles denied permission', async () => {
  const server = http.createServer(pages.handleRequest);
  const origin = await listen(server);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.addInitScript(() => {
      localStorage.setItem('agriLanguage', 'en');
      sessionStorage.setItem('agriLanguagePrompted', 'true');
      window.stops = 0;
      window.denyMic = false;
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: async () => {
        if (window.denyMic) throw new DOMException('Denied', 'NotAllowedError');
        return { getTracks: () => [{ stop: () => window.stops++ }] };
      } });
      const node = () => ({ connect(target) { return target; }, disconnect() {} });
      window.AudioContext = class {
        sampleRate = 48000;
        state = 'running';
        destination = {};
        audioWorklet = { addModule: async () => {} };
        async resume() {}
        async close() { this.state = 'closed'; }
        createMediaStreamSource() { return node(); }
        createGain() { return { ...node(), gain: { value: 0 } }; }
      };
      window.AudioWorkletNode = class {
        port = {};
        constructor() { window.recorder = this; }
        connect(target) { return target; }
        disconnect() {}
      };
      window.speakAndPause = (speak = true) => {
        const send = value => window.recorder.port.onmessage?.({ data: new Float32Array(4800).fill(value) });
        if (speak) for (let i = 0; i < 4; i++) send(.1);
        for (let i = 0; i < 8; i++) send(0);
      };
    });
    let requests = 0;
    let delay = 0;
    await page.route('**/*', async route => {
      const url = route.request().url();
      if (url.includes('/api/v1/speech/search')) {
        requests++;
        assert.match(url, /language=en$/);
        assert.ok(route.request().postDataBuffer().length > 1600);
        if (delay) await new Promise(resolve => setTimeout(resolve, delay));
        await route.fulfill({ json: { text: 'rice farming' } }).catch(() => {});
      } else if (!url.startsWith(origin) || url.includes('/api/')) await route.abort();
      else await route.continue();
    });
    await page.goto(origin);
    await page.click('#search-tog');
    await page.waitForFunction(() => document.querySelector('#search-microphone').getAttribute('aria-pressed') === 'true');
    assert.equal(await page.locator('#inline-search-container .agri-voice-button').count(), 0);
    await page.evaluate(() => window.speakAndPause());
    await page.waitForFunction(() => document.querySelector('#search-input').value === 'rice farming');
    assert.equal(requests, 1);
    assert.ok(await page.evaluate(() => window.stops > 0));
    await page.click('#search-microphone');
    await page.waitForFunction(() => document.querySelector('#search-microphone').getAttribute('aria-pressed') === 'true');
    await page.evaluate(() => window.speakAndPause(false));
    await page.click('#search-microphone');
    assert.match(await page.locator('#search-voice-status').textContent(), /No speech/);
    assert.equal(requests, 1);
    delay = 500;
    await page.click('#search-microphone');
    await page.waitForFunction(() => document.querySelector('#search-microphone').getAttribute('aria-pressed') === 'true');
    await page.evaluate(() => window.speakAndPause());
    await page.locator('#search-input').fill('typed query');
    await page.waitForTimeout(700);
    assert.equal(await page.inputValue('#search-input'), 'typed query');
    await page.click('#search-tog');
    await page.evaluate(() => window.denyMic = true);
    await page.click('#search-tog');
    await page.waitForFunction(() => document.querySelector('#search-voice-status').textContent.includes('Allow microphone access,'));
    await page.locator('#search-input').fill('typing still works');
    assert.equal(await page.inputValue('#search-input'), 'typing still works');
    await page.setViewportSize({ width: 390, height: 844 });
    const mic = await page.locator('#search-microphone').boundingBox();
    assert.ok(mic && mic.x >= 0 && mic.x + mic.width <= 390, `microphone stays within mobile viewport: ${JSON.stringify(mic)}`);
    await page.click('#search-microphone');
    await page.waitForFunction(() => document.querySelector('#search-voice-status').textContent.includes('Allow microphone access,'));
  } finally {
    await browser.close();
    await close(server);
  }
});
