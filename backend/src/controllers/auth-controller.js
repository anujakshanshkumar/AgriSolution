const asyncHandler = require('../middleware/async-handler');
const authService = require('../services/auth-service');

const register = asyncHandler(async (request, response) => {
  const result = await authService.register(request.body || {});
  response.json(result);
});

const login = asyncHandler(async (request, response) => {
  const result = await authService.login(request.body || {});
  const session = await require('../services/session-service').createSession(result.userId);
  response.set('Cache-Control', 'no-store').json({ ...result, ...session });
});

module.exports = { login, register };
