const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth.middleware');
const consultaController = require('../controllers/consulta.controller');

router.post('/', verifyToken, consultaController.create);

module.exports = router;
