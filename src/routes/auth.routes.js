const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 40,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Demasiados intentos de inicio de sesión. Espera unos minutos.' },
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Demasiados registros desde esta ubicación. Espera e inténtalo más tarde.' },
});

router.post('/register-doctor', registerLimiter, authController.registerDoctor);
router.post('/login', loginLimiter, authController.login);

module.exports = router;
