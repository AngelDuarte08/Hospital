const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('../middlewares/auth.middleware');
const tableController = require('../controllers/table.controller');

const faceLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 45,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Demasiadas solicitudes de análisis facial. Espera unos minutos.' },
});

router.get('/query/:table', verifyToken, tableController.findAll);
router.put('/update/:table/:id', verifyToken, tableController.update);
router.post('/face/detect', faceLimiter, tableController.faceDetect);

module.exports = router;
