const Ajv = require('ajv');
const AppError = require('../errors/app-error');
const { analyzePlant, readBoundedJson } = require('./plant-disease-provider');
const classes = ['bacterial_leaf_blight', 'bacterial_leaf_streak', 'bacterial_panicle_blight', 'blast', 'brown_spot', 'dead_heart', 'downy_mildew', 'hispa', 'normal', 'tungro'];
const probability = { type: 'number', minimum: 0, maximum: 1 };
const prediction = { type: 'object', additionalProperties: false, required: ['label', 'confidence'], properties: { label: { enum: classes }, confidence: probability } };
const validate = new Ajv({ strict: true }).compile({
  type: 'object', additionalProperties: false,
  required: ['schemaVersion', 'modelVersion', 'label', 'confidence', 'confidenceType', 'topThree', 'uncertainty', 'riceOnly', 'scopeVerified', 'inferenceMs'],
  properties: {
    schemaVersion: { const: 1 }, modelVersion: { type: 'string', pattern: '^[a-zA-Z0-9_-]{1,160}$' },
    label: { enum: classes }, confidence: probability, confidenceType: { const: 'temperature_scaled_validation' },
    topThree: { type: 'array', minItems: 3, maxItems: 3, items: prediction },
    riceOnly: { const: true }, scopeVerified: { const: false }, inferenceMs: { type: 'number', minimum: 0, maximum: 120000 },
    uncertainty: { type: 'object', additionalProperties: false, required: ['status', 'needsReview', 'threshold', 'reasons'], properties: {
      status: { enum: ['low_confidence', 'scope_unverified'] }, needsReview: { const: true },
      threshold: { type: 'number', minimum: 0, maximum: 1.01 },
      reasons: { type: 'array', minItems: 1, maxItems: 5, items: { type: 'string', maxLength: 1000 } },
    } },
  },
});
const display = label => label === 'normal' ? 'Normal' : label.replaceAll('_', ' ').replace(/^./, c => c.toUpperCase());

function normalizeRiceReport(value, language = 'en') {
  const unsupported = value?.unsupported === true;
  if (!unsupported) {
    if (!validate(value)) throw new AppError(502, 'The rice classifier returned an invalid response.');
    const top = value.topThree;
    if (top[0].label !== value.label || Math.abs(top[0].confidence - value.confidence) > 1e-6
      || new Set(top.map(p => p.label)).size !== 3 || top.some((p, i) => i > 0 && p.confidence > top[i-1].confidence)
      || top.reduce((s, p) => s + p.confidence, 0) > 1.00001
      || (value.uncertainty.status === 'low_confidence') !== (value.confidence < value.uncertainty.threshold)) {
      throw new AppError(502, 'The rice classifier returned inconsistent predictions.');
    }
  }
  const hi = language === 'hi';
  const scope = hi ? 'यह मॉडल केवल धान की 10 श्रेणियों के लिए है। फोटो में धान होने या किसी अज्ञात रोग की पुष्टि नहीं करता। खेत की नई तस्वीरों पर सटीकता अभी सत्यापित नहीं है।'
    : 'Rice only. This model compares 10 trained classes; it does not verify rice identity or recognize every disease. Accuracy on new field photos is not established.';
  const low = !unsupported && value.uncertainty.status === 'low_confidence';
  return {
    success: true, provider: 'local_rice', crop: unsupported ? null : 'Rice (unverified)',
    plantCondition: unsupported ? 'unsupported_image' : low ? 'inconclusive' : value.label === 'normal' ? 'healthy_looking' : ['hispa', 'dead_heart'].includes(value.label) ? 'pest_damage' : 'possible_disease',
    primaryDiagnosis: {
      name: unsupported ? null : display(value.label), confidence: unsupported ? null : value.confidence,
      confidenceType: unsupported ? null : value.confidenceType,
      explanation: unsupported ? (hi ? 'चुनी गई फसल समर्थित नहीं है। धान की फोटो अपलोड करें।' : 'The selected crop is unsupported. Upload a rice photograph.')
        : (hi ? 'यह धान की समर्थित श्रेणियों में सबसे अधिक स्कोर वाली भविष्यवाणी है; रोग की पुष्टि नहीं है।' : 'Highest-scoring prediction among the supported rice classes; this is not a confirmed diagnosis.'),
    },
    alternativeDiagnoses: [], observedSymptoms: [], recommendedActions: [hi ? 'स्पष्ट पत्ती और पूरे पौधे की तस्वीर लें। उपचार से पहले स्थानीय कृषि अधिकारी से सलाह लें।' : 'Take clear leaf and whole-plant photos. Consult a local agricultural officer before treatment.'],
    preventionTips: [], limitations: [scope, hi ? 'भरोसा स्कोर केवल वैलिडेशन डेटा पर कैलिब्रेट किया गया है; नई परिस्थितियों में इसकी विश्वसनीयता बदल सकती है।' : 'Confidence was calibrated on validation data; calibration may change under field conditions.'],
    needsExpertReview: true,
    classifier: { modelVersion: unsupported ? null : value.modelVersion, riceOnly: true, scopeVerified: false,
      topThree: unsupported ? [] : value.topThree.map(p => ({ ...p, name: display(p.label) })),
      uncertainty: unsupported ? 'unsupported_crop' : value.uncertainty.status,
      inferenceMs: unsupported ? null : value.inferenceMs },
  };
}

async function analyzeConfiguredPlant(input, options) {
  if (options.config.provider !== 'local_rice') return analyzePlant(input, options);
  if (input.crop && !['rice', 'paddy', 'धान', 'चावल'].includes(input.crop.toLowerCase().trim())) return { unsupported: true };
  const { config, signal, fetchImpl = globalThis.fetch } = options;
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timer = setTimeout(abort, config.requestTimeoutMs);
  try {
    const response = await fetchImpl(`${config.riceServiceUrl.replace(/\/$/, '')}/predict`, {
      method: 'POST', redirect: 'error', signal: controller.signal,
      headers: { 'Content-Type': input.image.mimeType, Authorization: `Bearer ${config.riceServiceToken}` },
      body: input.image.buffer,
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new AppError(response.status === 429 ? 429 : 503, 'The local rice classifier is unavailable or busy. Please try again later.');
    }
    return await readBoundedJson(response, 16384);
  } catch (error) {
    if (controller.signal.aborted) throw new AppError(504, 'The rice classifier timed out.');
    if (error instanceof AppError) throw error;
    throw new AppError(503, 'Could not reach the local rice classifier.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

module.exports = { analyzeConfiguredPlant, normalizeRiceReport };
