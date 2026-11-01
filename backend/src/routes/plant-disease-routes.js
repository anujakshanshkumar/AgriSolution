const express = require('express');
const multer = require('multer');
const AppError = require('../errors/app-error');
const { requireSession } = require('../services/session-service');
const { getPlantDiseaseConfig } = require('../config/plant-disease');
const { normalizeReport } = require('../services/plant-disease-provider');
const { analyzeConfiguredPlant, normalizeRiceReport } = require('../services/rice-disease-provider');
const { validateImage: validatePlantImage } = require('../services/plant-image');
const { createAnalysisRepository } = require('../infrastructure/plant-analysis-repository');
const { generatePlantCare } = require('../services/plant-care-provider');

const wrap = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const codes = { 400: 'PLANT_BAD_REQUEST', 401: 'PLANT_UNAUTHORIZED', 404: 'PLANT_NOT_FOUND', 413: 'PLANT_IMAGE_TOO_LARGE', 415: 'PLANT_IMAGE_FORMAT', 429: 'PLANT_RATE_LIMIT', 502: 'PLANT_PROVIDER_ERROR', 503: 'PLANT_UNAVAILABLE', 504: 'PLANT_TIMEOUT' };

// This is a bounded, per-process limiter. Multi-instance deployments should add
// a shared gateway/Redis limiter, as documented in the feature setup guide.
function createAnalysisGate(config, { now = Date.now } = {}) {
  const local = config.provider === 'local_rice';
  const windowMs = local ? 60000 : 5 * 60000;
  const userLimit = local ? 30 : 10;
  const ipLimit = local ? 120 : 40;
  const windows = new Map();
  const activeUsers = new Set();
  const activeIps = new Map();
  let activeTotal = 0;
  return (req, res, next) => {
    if (!config.configured) return next(new AppError(503, config.setupMessage || 'Plant analysis is not configured on the server.'));
    const time = now();
    for (const [key, entry] of windows) if (entry.until <= time) windows.delete(key);
    const user = String(req.user._id);
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userKey = `user:${user}`;
    const ipKey = `ip:${ip}`;
    const userWindow = windows.get(userKey);
    const ipWindow = windows.get(ipKey);
    if (windows.size >= 10000 || (userWindow?.count || 0) >= userLimit || (ipWindow?.count || 0) >= ipLimit) {
      const until = Math.max(time + 1000, userWindow?.count >= userLimit ? userWindow.until : 0,
        ipWindow?.count >= ipLimit ? ipWindow.until : 0);
      const seconds = Math.ceil((until - time) / 1000);
      res.set('Retry-After', String(seconds));
      return next(new AppError(429, `Plant analysis request limit reached. Please try again in ${seconds} seconds.`));
    }
    if (activeUsers.has(user) || (activeIps.get(ip) || 0) >= 2 || activeTotal >= 4) {
      res.set('Retry-After', '10');
      return next(new AppError(429, 'Another plant analysis is running. Please wait before trying again.'));
    }
    const chargedEntries = [];
    for (const key of [userKey, ipKey]) {
      const entry = windows.get(key) || { count: 0, until: time + windowMs };
      entry.count++;
      chargedEntries.push(entry);
      windows.set(key, entry);
    }
    activeUsers.add(user);
    activeIps.set(ip, (activeIps.get(ip) || 0) + 1);
    activeTotal++;
    const controller = new AbortController();
    req.plantSignal = controller.signal;
    req.plantDeadline = time + config.requestTimeoutMs;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      if (res.statusCode >= 500) chargedEntries.forEach(entry => { entry.count = Math.max(0, entry.count - 1); });
      clearTimeout(timer);
      controller.abort();
      activeUsers.delete(user);
      const count = (activeIps.get(ip) || 1) - 1;
      if (count === 0) activeIps.delete(ip); else activeIps.set(ip, count);
      activeTotal--;
    };
    const timer = setTimeout(() => {
      controller.abort();
      if (!res.headersSent && !res.destroyed) res.status(504).json({ error: 'Plant analysis timed out. Please try again.', code: codes[504] });
      // Stop accepting more upload bytes after the response is flushed.
      if (!req.complete) res.once('finish', () => req.destroy());
    }, config.requestTimeoutMs);
    timer.unref?.();
    req.once('aborted', release);
    res.once('close', release);
    res.once('finish', release);
    next();
  };
}

function parseContext(body = {}) {
  if (Object.keys(body).some((key) => !['crop', 'symptoms', 'language'].includes(key))) throw new AppError(400, 'Only crop, symptoms, and language fields are supported.');
  const text = (value, maximum, label) => {
    if (value === undefined) return '';
    if (typeof value !== 'string' || value.length > maximum || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new AppError(400, `${label} is invalid or too long.`);
    return value.trim();
  };
  const crop = text(body.crop, 100, 'Crop');
  const symptoms = text(body.symptoms, 1500, 'Symptoms');
  const language = body.language === undefined ? 'en' : body.language;
  if (!['en', 'hi'].includes(language)) throw new AppError(400, 'Language must be en or hi.');
  return { crop, symptoms, language };
}

function createPlantDiseaseRouter({ authenticate = requireSession, repository = createAnalysisRepository(), analyze = analyzeConfiguredPlant, generateCare = generatePlantCare, config = getPlantDiseaseConfig(), validateImage = validatePlantImage } = {}) {
  const router = express.Router();
  router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.use(authenticate);
  // Text guidance can take longer than the local image classifier.
  const careRequestTimeoutMs = Math.max(config.requestTimeoutMs, 120000);
  router.get('/config', (req, res) => res.json({ configured: config.configured, provider: config.provider, careGuidanceConfigured: Boolean(config.apiKey), maxFileSizeMb: config.maxFileSizeMb, requestTimeoutMs: config.requestTimeoutMs, ...(config.setupMessage ? { setupMessage: config.setupMessage } : {}) }));
  const upload = multer({
    storage: multer.memoryStorage(),
    // Busboy emits partsLimit when it reaches the boundary after the final part.
    // Allow that boundary; files/fields independently enforce exactly 1 + 3.
    limits: { fileSize: config.maxFileSizeBytes, files: 1, fields: 3, parts: 5, fieldSize: 6000, fieldNameSize: 40, headerPairs: 100 },
    fileFilter: (req, file, done) => done(['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype) ? null : new AppError(415, 'Choose a JPEG, PNG, or WebP image.'), true),
  }).single('image');
  router.post('/analyze', createAnalysisGate(config), upload, wrap(async (req, res) => {
    let image;
    try {
      if (req.plantSignal.aborted) return;
      const context = parseContext(req.body);
      image = await validateImage(req.file, config);
      if (req.plantSignal.aborted) return;
      const normalize = config.provider === 'local_rice' ? normalizeRiceReport : normalizeReport;
      const result = normalize(await analyze({ image, ...context }, { config: { ...config, requestTimeoutMs: Math.max(1, req.plantDeadline - Date.now()) }, signal: req.plantSignal }), context.language);
      result.language = context.language;
      if (req.plantSignal.aborted) return;
      const record = await repository.save(req.user._id, { selectedCrop: context.crop, result });
      if (!res.headersSent && !res.destroyed) res.json({ success: true, id: record.id, createdAt: record.createdAt, result: record.result });
    } finally {
      req.file?.buffer?.fill(0);
      if (req.file) req.file.buffer = null;
      image?.buffer?.fill(0);
      image = null;
    }
  }));
  router.get('/history', wrap(async (req, res) => {
    if (Object.keys(req.query).some((key) => !['limit', 'before'].includes(key))) throw new AppError(400, 'Unsupported history query.');
    const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
    if (typeof req.query.limit === 'object' || !Number.isInteger(limit) || limit < 1 || limit > 50 || (req.query.before !== undefined && typeof req.query.before !== 'string')) throw new AppError(400, 'Invalid history query.');
    res.json(await repository.list(req.user._id, { limit, before: req.query.before }));
  }));
  router.get('/history/:id', wrap(async (req, res) => {
    const record = await repository.get(req.user._id, req.params.id);
    if (!record) throw new AppError(404, 'Analysis not found.');
    res.json(record);
  }));
  // Look up ownership and reuse saved guidance before any billable provider call.
  const careGate = createAnalysisGate({ ...config, provider: 'gemini', requestTimeoutMs: careRequestTimeoutMs, configured: Boolean(config.apiKey), setupMessage: 'Gemini care guidance is not configured. The disease prediction is still available.' });
  router.post('/history/:id/guidance', wrap(async (req, res, next) => {
    const record = await repository.get(req.user._id, req.params.id);
    if (!record) throw new AppError(404, 'Analysis not found.');
    if (record.result.careGuidance?.status === 'ready') return res.json(record);
    req.plantRecord = record;
    next();
  }), careGate, wrap(async (req, res) => {
    const care = await generateCare(req.plantRecord.result, { config: { ...config, requestTimeoutMs: Math.max(1, req.plantDeadline - Date.now()) }, signal: req.plantSignal });
    if (req.plantSignal.aborted) return;
    const record = await repository.saveCare(req.user._id, req.params.id, care);
    if (!record) throw new AppError(404, 'Analysis not found.');
    if (!res.headersSent && !res.destroyed) res.json(record);
  }));
  router.delete('/history/:id', wrap(async (req, res) => {
    if (!await repository.remove(req.user._id, req.params.id)) throw new AppError(404, 'Analysis not found.');
    res.json({ success: true });
  }));
  router.use((error, req, res, next) => {
    req.file?.buffer?.fill(0);
    if (req.file) req.file.buffer = null;
    if (res.headersSent || res.destroyed) return;
    let status = error instanceof AppError ? error.statusCode : 500;
    let message = error instanceof AppError ? error.message : 'Plant analysis could not be completed. Please try again later.';
    if (error instanceof multer.MulterError) {
      status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      message = status === 413 ? `Choose an image no larger than ${config.maxFileSizeMb} MB.` : 'Upload one image with optional crop, symptoms, and language fields only.';
    } else if (['MongoServerSelectionError', 'MongoNetworkError'].includes(error.name)) {
      status = 503;
      message = 'Analysis history is temporarily unavailable. Please try again later.';
    }
    res.status(status).json({ error: message, code: codes[status] || 'PLANT_INTERNAL_ERROR' });
  });
  return router;
}

module.exports = createPlantDiseaseRouter();
module.exports.createPlantDiseaseRouter = createPlantDiseaseRouter;
module.exports.createAnalysisGate = createAnalysisGate;
module.exports.parseContext = parseContext;
