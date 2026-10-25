const pageModel = require('../models/pageModel');
const fileView = require('../views/fileView');
const { crops, cropsByKey } = require('../models/cropModel');

function handle(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    fileView.send(response, 405, 'text/plain; charset=utf-8', 'Method Not Allowed');
    return;
  }

  const requestPath = new URL(request.url, 'http://localhost').pathname;
  if (requestPath === '/all-crops' || requestPath === '/all-crops.ejs') {
    fileView.renderTemplate(request, response, 'all-crops', { crops });
    return;
  }

  const cropMatch = requestPath.match(/^\/crop\/([a-z0-9_-]+)$/i);
  if (cropMatch) {
    const crop = cropsByKey.get(cropMatch[1].toLowerCase());
    if (!crop) {
      fileView.send(response, 404, 'text/plain; charset=utf-8', 'Crop Not Found');
      return;
    }

    fileView.renderTemplate(request, response, 'crop-detail', { crop });
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
