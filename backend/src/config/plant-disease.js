require('./environment');

function boundedNumber(value, fallback, minimum, maximum) {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum ? parsed : null;
}

// A bad optional feature configuration must never prevent the portal from starting.
function getPlantDiseaseConfig(env = process.env) {
  const provider = (env.PLANT_DISEASE_AI_PROVIDER || 'gemini').trim().toLowerCase();
  const apiKey = (env.PLANT_DISEASE_AI_API_KEY || env.GEMINI_API_KEY || '').trim();
  const model = (env.PLANT_DISEASE_AI_MODEL || 'gemini-3.8-flash').trim();
  const careModel = (env.PLANT_CARE_AI_MODEL || 'gemini-flash-lite-latest').trim();
  const maxFileSizeMb = boundedNumber(env.PLANT_DISEASE_MAX_FILE_SIZE_MB, 10, 1, 20);
  const requestTimeoutMs = boundedNumber(env.PLANT_DISEASE_REQUEST_TIMEOUT_MS, 60000, 5000, 120000);
  const riceServiceUrl = (env.RICE_SERVICE_URL || 'http://127.0.0.1:8766').trim();
  const riceServiceToken = (env.RICE_SERVICE_TOKEN || '').trim();
  let validRiceUrl = false;
  try {
    const url = new URL(riceServiceUrl);
    validRiceUrl = url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
      && !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash;
  } catch { /* Invalid optional configuration disables only this feature. */ }
  let setupMessage = null;
  if (!['gemini', 'local_rice'].includes(provider)) setupMessage = 'Set PLANT_DISEASE_AI_PROVIDER to gemini or local_rice on the server.';
  else if (provider === 'local_rice' && (!validRiceUrl || riceServiceToken.length < 32)) setupMessage = 'Configure a loopback RICE_SERVICE_URL and a RICE_SERVICE_TOKEN of at least 32 characters on the server.';
  else if (provider === 'gemini' && !apiKey) setupMessage = 'Plant analysis is not configured. Ask the administrator to set PLANT_DISEASE_AI_API_KEY or GEMINI_API_KEY on the server.';
  else if (provider === 'gemini' && !/^[a-zA-Z0-9._-]{1,100}$/.test(model)) setupMessage = 'Plant analysis model configuration is invalid. Ask the administrator to check PLANT_DISEASE_AI_MODEL.';
  else if (maxFileSizeMb === null || requestTimeoutMs === null) setupMessage = 'Plant analysis limits are invalid. File size must be 1–20 MB and timeout must be 5000–120000 ms.';
  return {
    provider, apiKey, model, careModel, riceServiceUrl, riceServiceToken, configured: !setupMessage, setupMessage,
    maxFileSizeMb: maxFileSizeMb ?? 10,
    maxFileSizeBytes: Math.floor((maxFileSizeMb ?? 10) * 1024 * 1024),
    maxPixels: 25000000,
    requestTimeoutMs: requestTimeoutMs ?? 60000,
  };
}

module.exports = { getPlantDiseaseConfig };
