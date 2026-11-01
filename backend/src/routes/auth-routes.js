const express = require('express');
const authController = require('../controllers/auth-controller');

const router = express.Router();
const authRateLimit = require('../middleware/auth-rate-limit');

router.post('/register', authRateLimit, authController.register);
router.post('/login', authRateLimit, authController.login);

module.exports = router;
