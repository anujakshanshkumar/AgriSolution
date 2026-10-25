const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const MIME_TYPES = {
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.mpeg': 'audio/mpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp'
};

function send(response, statusCode, contentType, body) {
  response.writeHead(statusCode, { 'Content-Type': contentType });
  response.end(body);
}

function renderFile(request, response, filePath) {
  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      send(response, 404, 'text/plain; charset=utf-8', 'Not Found');
      return;
    }

    const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': contentType });

    if (request.method === 'HEAD') {
      response.end();
      return;
    }

    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (streamError) => {
      if (response.destroyed || response.writableEnded) {
        return;
      }

      console.error(`Unable to read ${filePath}: ${streamError.message}`);
      response.destroy();
    });

    response.on('close', () => {
      if (!response.writableEnded) {
        fileStream.destroy();
      }
    });

    fileStream.pipe(response);
  });
}

function renderTemplate(request, response, templateName, data) {
  const templatePath = path.join(__dirname, `${templateName}.ejs`);
  ejs.renderFile(templatePath, data, (error, html) => {
    if (error) {
      console.error(`Unable to render ${templatePath}: ${error.message}`);
      send(response, 500, 'text/plain; charset=utf-8', 'Unable to render page');
      return;
    }

    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(request.method === 'HEAD' ? undefined : html);
  });
}

module.exports = { renderFile, renderTemplate, send };
