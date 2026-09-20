const pageModel = require('../models/pageModel');
const fileView = require('../views/fileView');

function handle(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    fileView.send(response, 405, 'text/plain; charset=utf-8', 'Method Not Allowed');
    return;
  }

  const filePath = pageModel.resolveRequestPath(request.url);
  if (!filePath) {
    fileView.send(response, 403, 'text/plain; charset=utf-8', 'Forbidden');
    return;
  }

  fileView.renderFile(request, response, filePath);
}

module.exports = { handle };
