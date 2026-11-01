const http = require('http');
const pageRoutes = require('./routes/pageRoutes');
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 3000);
const PORT_IS_CONFIGURED = Boolean(process.env.PORT);
// Read the combined server settings before the legacy backend .env is loaded.
// Its PORT configures only a backend started directly with backend/server.js.
const apiApp = require('./backend/server');
const server = http.createServer((request, response) => {
  if (/^\/api(?:\/|\?|$)/.test(request.url)) {
    // Keep the API in the same process as the page server so one startup
    // command owns the complete application.
    apiApp(request, response);
    return;
  }

  pageRoutes.handleRequest(request, response);
});

function listen(port, attempts = 0) {
  server.once('error', (error) => {
    if (error.code === 'EADDRINUSE' && !PORT_IS_CONFIGURED && attempts < 20) {
      listen(port + 1, attempts + 1);
      return;
    }

    console.error(`Unable to start the server on ${HOST}:${port}: ${error.message}`);
    process.exitCode = 1;
  });

  server.listen(port, HOST);
}

server.once('listening', () => {
  const address = server.address();
  if (PORT !== 0 && address.port !== PORT) {
    console.log(`Port ${PORT} is in use; using port ${address.port} instead.`);
  }
  console.log(`Agri-Solution server running at http://${HOST}:${address.port}`);
});

listen(PORT);
module.exports = server;
