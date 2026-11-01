const config = require('../config/environment');
const AppError = require('../errors/app-error');
const { generateWithFallback } = require('../services/gemini-models');

const requestWindowMs = 5 * 60 * 1000;
const maxRequestsPerWindow = 10;
const requestCounts = new Map();

function isRateLimited(ipAddress) {
  const now = Date.now();
  const window = requestCounts.get(ipAddress);

  if (!window && requestCounts.size >= 1000) {
    for (const [address, entry] of requestCounts) {
      if (now - entry.startedAt >= requestWindowMs) requestCounts.delete(address);
    }
    if (requestCounts.size >= 1000) return true;
  }

  if (!window || now - window.startedAt >= requestWindowMs) {
    requestCounts.set(ipAddress, { startedAt: now, count: 1 });
    return false;
  }

  window.count += 1;
  return window.count > maxRequestsPerWindow;
}

function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 12) {
    throw new AppError(400, 'Send between 1 and 12 recent chat messages.');
  }

  let totalLength = 0;
  const validatedMessages = messages.map((message) => {
    if (!message || !['user', 'model'].includes(message.role) ||
        typeof message.text !== 'string' || !message.text.trim() || message.text.length > 2000) {
      throw new AppError(400, 'Each chat message must contain a role and 1–2000 characters of text.');
    }

    totalLength += message.text.length;
    return {
      role: message.role,
      parts: [{ text: message.text.trim() }]
    };
  });

  if (totalLength > 8000) {
    throw new AppError(400, 'Recent chat history cannot exceed 8000 characters.');
  }
  if (validatedMessages[validatedMessages.length - 1].role !== 'user') {
    throw new AppError(400, 'The latest chat message must be from the user.');
  }

  return validatedMessages;
}

async function sendMessage(request, response, next) {
  if (!config.geminiApiKey) {
    response.status(503).json({ error: 'The farming assistant is not configured on the server.' });
    return;
  }

  if (isRateLimited(request.ip)) {
    response.status(429).json({ error: 'Too many chat requests. Please try again in a few minutes.' });
    return;
  }

  let contents;
  let language;
  try {
    contents = validateMessages(request.body?.messages);
    if (request.body?.language !== 'en' && request.body?.language !== 'hi') {
      throw new AppError(400, 'Choose English or Hindi for the farming assistant.');
    }
    language = request.body.language === 'hi' ? 'Hindi' : 'English';
  } catch (error) {
    next(error);
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const { text } = await generateWithFallback({
      apiKey: config.geminiApiKey, preferredModel: config.geminiModel, signal: controller.signal,
      body: {
        systemInstruction: { parts: [{ text: `You are Mor Kisani's helpful farming assistant. Reply in ${language}. Give concise, practical agricultural guidance. Distinguish general advice from official policy. Refer current scheme eligibility and pesticide-label questions to the relevant local authority.` }] },
        contents,
        generationConfig: { maxOutputTokens: 2048 },
      },
    });

    response.json({ text });
  } catch (error) {
    if (controller.signal.aborted) {
      response.status(504).json({ error: 'The farming assistant took too long to respond. Please try again.' });
      return;
    }
    next(error);
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { sendMessage };
