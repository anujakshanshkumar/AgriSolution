// Optional real-model/browser smoke test. Supply a short English WAV fixture.
// PowerShell: $env:AGRI_SPEECH_WAV='C:\path\sample.wav'; node scripts/test-search-speech-live.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const express = require('express');
const { chromium } = require('playwright');
const pages = require('../routes/pageRoutes');

(async () => {
  if (!process.env.AGRI_SPEECH_WAV) throw new Error('Set AGRI_SPEECH_WAV to an English speech WAV fixture. Start the model worker first.');
  const wav = fs.readFileSync(process.env.AGRI_SPEECH_WAV);
  const app = express();
  app.get('/speech-test.wav', (req, res) => res.type('wav').send(wav));
  app.use('/api/v1/speech', require('../backend/src/routes/speech-routes'));
  app.use(pages.handleRequest);
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
    const page = await browser.newPage();
    await page.addInitScript(() => {
      localStorage.setItem('agriLanguage', 'en');
      sessionStorage.setItem('agriLanguagePrompted', 'true');
      // A WAV-driven MediaStream exercises the real AudioContext, AudioWorklet,
      // pause detector, PCM conversion, Node API and Python model together.
      navigator.mediaDevices.getUserMedia = async () => {
        const context = new AudioContext();
        const bytes = await (await fetch('/speech-test.wav')).arrayBuffer();
        const source = context.createBufferSource();
        source.buffer = await context.decodeAudioData(bytes);
        const destination = context.createMediaStreamDestination();
        source.connect(destination);
        await context.resume();
        source.start(context.currentTime + 0.5);
        return destination.stream;
      };
    });
    await page.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
    await page.goto(origin);
    await page.click('#search-tog');
    await page.waitForFunction(() => document.querySelector('#search-voice-status').textContent.includes('Text added'), { }, { timeout: 180000 });
    const transcript = await page.inputValue('#search-input');
    assert.ok(transcript.length > 0);
    console.log(JSON.stringify({ transcript, status: 'Real browser audio → API → local model → search field passed' }));
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
