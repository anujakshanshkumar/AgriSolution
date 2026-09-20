const http = require('http');
const pageRoutes = require('./routes/pageRoutes');

const HOST = '127.0.0.1';
const PORT = 5501;
const server = http.createServer(pageRoutes.handleRequest);

server.listen(PORT, HOST, () => {
  console.log(`Static server running at http://${HOST}:${PORT}`);
});
