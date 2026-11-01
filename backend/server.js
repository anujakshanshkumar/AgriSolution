const express = require('express');
const cors = require('cors');
const config = require('./src/config/environment');
const authRoutes = require('./src/routes/auth-routes');
const speechRoutes = require('./src/routes/speech-routes');
const chatbotRoutes = require('./src/routes/chatbot-routes');
const { errorHandler, notFound } = require('./src/middleware/error-handler');

const app = express();
app.use(cors());
app.use('/api/v1/speech', speechRoutes);
app.use(express.json({ limit: config.jsonBodyLimit }));
app.use('/api/v1/chatbot', chatbotRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api', authRoutes);
app.use('/api/plant-disease', require('./src/routes/plant-disease-routes'));
app.use('/api/v1', require('./src/routes/mobile-routes'));
app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  const server = app.listen(config.port,() => {
    const assignedPort = server.address().port;
    console.log(`Backend listening on port ${assignedPort}`);
  });
}

module.exports = app;
