const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createSpeechWorker } = require('./speech-worker');

test('pipe worker handles readiness, busy requests, Hindi text and process failure', async () => {
  const worker = createSpeechWorker({ command: process.execPath, args: ['-e', `
    const rl = require('node:readline').createInterface({ input: process.stdin });
    setTimeout(() => console.log(JSON.stringify({ready:true})), 100);
    rl.on('line', line => {
      const req = JSON.parse(line);
      if (req.language === 'en') process.exit(1);
      setTimeout(() => console.log(JSON.stringify({id:req.id,status:200,text:'धान'})), 50);
    });
  `] });
  try {
    await assert.rejects(worker.transcribe(Buffer.alloc(3200), 'hi'), /not ready/);
    const deadline = Date.now() + 5000;
    while (!worker.health().ready && Date.now() < deadline) await new Promise(r => setTimeout(r, 20));
    assert.equal(worker.health().ready, true);
    const result = worker.transcribe(Buffer.alloc(3200), 'hi');
    await assert.rejects(worker.transcribe(Buffer.alloc(3200), 'hi'), /busy/);
    assert.equal(await result, 'धान');
    await assert.rejects(worker.transcribe(Buffer.alloc(3200), 'en'), /stopped/);
    assert.equal(worker.health().ready, false);
  } finally {
    if (worker.child.exitCode === null) {
      const closed = once(worker.child, 'close');
      worker.child.kill();
      await closed;
    }
  }
});
