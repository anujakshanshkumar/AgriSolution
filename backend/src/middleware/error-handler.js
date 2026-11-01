function notFound(request, response, next) {
  const error = new Error('API endpoint not found');
  error.statusCode = 404;
  next(error);
}

function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error.type === 'entity.parse.failed') {
    response.status(400).json({ error: 'Request body must be valid JSON' });
    return;
  }

  if (error.type === 'entity.too.large') {
    response.status(413).json({ error: 'Request body is too large' });
    return;
  }

  if (error.code === 11000) {
    response.status(409).json({ error: 'mobile number already registered' });
    return;
  }

  if (error.name === 'MongoServerSelectionError' ||
      error.name === 'MongoNetworkError' ||
      error.code === 'ECONNREFUSED') {
    response.status(503).json({ error: 'Database is unavailable. Please try again later.' });
    return;
  }

  const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  if (statusCode >= 500) {
    console.error(error);
  }

  response.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal server error' : error.message
  });
}

module.exports = { errorHandler, notFound };
