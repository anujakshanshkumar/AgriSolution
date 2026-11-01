const { spawnSync, spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const root = path.resolve(__dirname, '..');
const venv = path.join(root, 'speech', '.venv');
const python = path.join(venv, process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error || result.status !== 0) {
    console.error(result.error?.message || 'Speech setup failed. See the error above.');
    process.exit(result.status || 1);
  }
}
if (process.argv[2] === 'gpu') {
  if (!fs.existsSync(python)) {
    console.error('Run npm run setup:speech before installing GPU support.');
    process.exit(1);
  }
  run(python, ['-m', 'pip', 'install', '--timeout', '120', '-r', 'speech/requirements-gpu.txt']);
  console.log('GPU runtime installed. Restart npm start to enable automatic GPU acceleration.');
} else if (process.argv[2] === 'setup') {
  run(process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3'), ['-m', 'venv', venv]);
  run(python, ['-m', 'pip', 'install', '-r', 'speech/requirements.txt']);
  console.log('Installed. Run npm start to launch the website and load the speech model.');
} else {
  if (!fs.existsSync(python)) {
    console.error('Run npm run setup:speech first (requires Python 3.10+).');
    process.exit(1);
  }
  const child = spawn(python, ['-u', 'speech/server.py'], { cwd: root, stdio: 'inherit' });
  child.on('error', error => { console.error(error.message); process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code || 0; });
  process.on('SIGINT', () => child.kill());
  process.on('SIGTERM', () => child.kill());
}
