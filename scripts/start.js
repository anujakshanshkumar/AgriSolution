const { spawn } = require('node:child_process');
const { createSpeechWorker } = require('./speech-worker');

function start() {
  const worker = createSpeechWorker();
  const server = require('../server');
  require('../backend/src/services/local-speech').setWorker(worker);
  let stopping = false;
  function stop(code = 0) {
    if (stopping) return;
    stopping = true;
    process.exitCode = code;
    server.close(() => {
      require('../backend/src/infrastructure/user-repository').closeDatabase().catch(error => {
        console.error(`Database shutdown failed: ${error.message}`);
        process.exitCode = 1;
      });
    });
    server.closeAllConnections();
    if (worker.child.exitCode === null && worker.child.signalCode === null) {
      if (process.platform === 'win32' && worker.child.pid) {
        const killer = spawn('taskkill', ['/pid', String(worker.child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
        killer.on('error', () => worker.child.kill());
      } else worker.child.kill();
    }
  }
  worker.child.on('error', error => { console.error(error.message); stop(1); });
  worker.child.on('close', () => {
    if (!stopping) { console.error('Speech model stopped.'); stop(1); }
  });
  server.on('error', error => {
    if (error.code !== 'EADDRINUSE' || process.env.PORT || process.exitCode) stop(1);
  });
  process.once('SIGINT', () => stop(130));
  process.once('SIGTERM', () => stop(143));
  console.log('Website and speech share one server. Press Ctrl+C to stop.');
  return { stop, children: [worker.child], server };
}

if (require.main === module) {
  try { start(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { start };
