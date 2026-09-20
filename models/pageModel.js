const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const PAGES = new Map([
  ['/', 'index.html'],
  ['/index.html', 'index.html'],
  ['/about.html', 'about.html'],
  ['/crop.html', 'crop.html'],
  ['/del.html', 'del.html'],
  ['/distmap.html', 'distmap.html'],
  ['/login.html', 'login.html'],
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
  const relativePath = page || requestPath.replace(/^\/+/, '');
  const filePath = path.resolve(ROOT, relativePath);

  if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${path.sep}`)) {
    return null;
  }

  return filePath;
}

module.exports = { resolveRequestPath };
