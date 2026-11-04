const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

function readPort(value, fallback) {
  const configuredValue = value == null || value === '' ? fallback : value;
  const port = Number(configuredValue);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('PORT must be an integer between 0 and 65535');
  }
  return port;
}

module.exports = {
  databaseName: process.env.MONGO_DB || 'AgriSolution',
  databaseUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017',
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || '16kb',
  localSpeechUrl: process.env.LOCAL_SPEECH_URL || 'http://127.0.0.1:8765',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-flash-latest',
  port: readPort(process.env.PORT, 5000)
};
