// Start the private classifier, then the existing portal (including speech).
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

async function main() {
  const python = process.env.RICE_PYTHON || path.join(root, 'speech', '.venv', 'Scripts', 'python.exe');
  const bundle = path.resolve(root, process.env.RICE_MODEL_DIR || 'artifacts/rice/evaluation/deployment');
  if (!fs.existsSync(path.join(bundle, 'deployment.json'))) throw Error('No evaluated rice model bundle. Finish training/evaluation first; see rice_model/README.md.');
  const port = Number(process.env.RICE_PORT || 8766);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('RICE_PORT must be 1024..65535.');
  const token = process.env.RICE_SERVICE_TOKEN || crypto.randomBytes(32).toString('hex');
  Object.assign(process.env, { PLANT_DISEASE_AI_PROVIDER: 'local_rice', RICE_SERVICE_TOKEN: token,
    RICE_SERVICE_URL: `http://127.0.0.1:${port}`, RICE_MODEL_DIR: bundle });
  const child = spawn(python, ['-m', 'uvicorn', 'rice_model.service:app', '--host', '127.0.0.1', '--port', String(port), '--workers', '1', '--no-access-log'],
    { cwd: root, windowsHide: true, stdio: 'inherit', env: { ...process.env, RICE_DEVICE: process.env.RICE_DEVICE || 'cpu' } });
  let portal, stopping = false, exited = false, startupError;
  function stop(code = 0) {
    if (stopping) return;
    stopping = true;
    process.exitCode = code;
    portal?.stop(code);
    if (!exited && child.pid) {
      if (process.platform === 'win32') {
        const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
        killer.on('error', () => child.kill());
      } else child.kill();
    }
  }
  child.on('error', error => { startupError = error; exited = true; if (portal) stop(1); });
  child.on('exit', code => { exited = true; if (!stopping && portal) { console.error('Rice classifier stopped.'); stop(code || 1); } });
  process.once('SIGINT', () => stop(130));
  process.once('SIGTERM', () => stop(143));
  try {
    let ready = false;
    for (let attempt = 0; attempt < 60 && !exited && !stopping; attempt++) {
      try {
        const response = await fetch(`${process.env.RICE_SERVICE_URL}/health`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(1000) });
        if (response.ok) {
          const health = await response.json();
          if (health.ready) {
            fs.mkdirSync(path.join(root, 'artifacts/rice'), { recursive: true });
            fs.writeFileSync(path.join(root, 'artifacts/rice/service-health.json'), JSON.stringify({
              checkedAt: new Date().toISOString(), ready: true, device: health.device,
              modelVersion: health.modelVersion, servicePort: port, servicePid: child.pid, launcherPid: process.pid,
            }, null, 2));
            ready = true;
            break;
          }
        }
      } catch { /* Wait for model load. */ }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    if (!ready || exited || stopping) throw startupError || Error('Private rice service did not become ready. Check its startup output.');
    portal = require('./start').start();
    console.log('Local rice classifier is ready. Portal started; voice search will be available after "Speech model ready".');
  } catch (error) {
    stop(1);
    throw error;
  }
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { main };
