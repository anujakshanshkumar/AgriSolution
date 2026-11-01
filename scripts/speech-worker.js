const { spawn } = require('node:child_process');
const readline = require('node:readline');
const path = require('node:path');
const fs = require('node:fs');
const failure = message => Object.assign(new Error(message), { statusCode: 503 });

function createSpeechWorker(options = {}) {
  const root = path.resolve(__dirname, '..');
  const python = path.join(root, 'speech', '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
  if (!options.command && !fs.existsSync(python)) throw new Error('Run npm run setup:speech once, then npm start.');
  const child = spawn(options.command || python, options.args || ['-u', 'speech/worker.py'], {
    cwd: root, env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    stdio: ['pipe', 'pipe', 'inherit'], windowsHide: true
  });
  let health = { ready: false };
  let pending;
  let sequence = 0;
  function unavailable() {
    health = { ready: false };
    if (pending) {
      clearTimeout(pending.timer);
      pending.reject(failure('The speech model stopped. Restart npm start.'));
      pending = undefined;
    }
  }
  child.on('error', unavailable);
  child.on('close', unavailable);
  child.stdin.on('error', unavailable);
  readline.createInterface({ input: child.stdout }).on('line', line => {
    let result;
    try { result = JSON.parse(line); } catch { return; }
    if (result.ready) {
      health = result;
      console.log('Speech model ready. Voice search is available on the website server.');
    } else if (pending && result.id === pending.id) {
      const current = pending;
      pending = undefined;
      clearTimeout(current.timer);
      if (result.status !== 200) current.reject(Object.assign(new Error(result.error), { statusCode: result.status }));
      else current.resolve(result.text);
    }
  });
  return {
    child,
    health: () => health,
    transcribe(pcm, language) {
      if (!health.ready) return Promise.reject(failure('The speech model is not ready. Wait for the model to load.'));
      if (pending) return Promise.reject(failure('Speech model is busy. Please try again shortly.'));
      return new Promise((resolve, reject) => {
        const id = ++sequence;
        // Retain the busy slot until Python replies, even after a caller timeout.
        const timer = setTimeout(() => reject(failure('Speech recognition took too long. Please try a shorter phrase.')), options.timeoutMs || 170000);
        pending = { id, resolve, reject, timer };
        child.stdin.write(JSON.stringify({ id, language, audio: pcm.toString('base64') }) + '\n');
      });
    }
  };
}
module.exports = { createSpeechWorker };
