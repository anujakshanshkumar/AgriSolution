const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const PAGES = new Map([
  ['/', 'index.html'],
  ['/index.html', 'index.html'],
  ['/about.html', 'about.html'],
  ['/crop.html', 'crop.html'],
  ['/crop-details.html', 'crop-details.html'],
  ['/index-Pako.html', 'index.html'],
  ['/del.html', 'del.html'],
  ['/distmap.html', 'distmap.html'],
  ['/dashboard.html', 'dashboard.html'],
  ['/plant-disease.html', 'plant-disease.html'],
  ['/login.html', 'login.html'],
  ['/token.html', 'token.html'],
  ['/schemes.html', 'schemes.html'],
  ['/soil.html', 'soil.html']
]);

function resolveRequestPath(requestUrl) {
  let requestPath;

  try {
    requestPath = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
  } catch {
    return null;
  }

  const page = PAGES.get(requestPath);
  if (/[\\:\x00]/.test(requestPath)) return null;
  // Only public documents and assets may be served, never server code or secrets.
  const publicDocument = /^\/(?:notice-board\.html|Chhattisgarh_districts_map\.svg)$/.test(requestPath)
    || /^\/audios1\/Agri-Solution Portal\(Farmers\)\/(?:index|about|crop|schemes|login)\.html$/.test(requestPath);
  const publicAsset = /^\/(?:images|style|js|fonts|audios|audios1|JAGGU CROP|Soil Image)\//.test(requestPath)
    && /\.(?:css|js|png|jpe?g|webp|avif|gif|svg|ico|mp3|mp4|mpeg|wav|woff2?|ttf|otf)$/i.test(requestPath)
    && !requestPath.split('/').some(part => part.startsWith('.'));
  if (!page && !publicDocument && !publicAsset) return null;
  const relativePath = page || (requestPath.startsWith('/audios/')
    ? path.join('audios1', requestPath.slice('/audios/'.length))
    : requestPath.replace(/^\/+/, ''));
  const filePath = path.resolve(ROOT, relativePath);

  if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${path.sep}`)) {
    return null;
  }

  return filePath;
}

module.exports = { resolveRequestPath };
