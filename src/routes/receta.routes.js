const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth.middleware');
const recetaController = require('../controllers/receta.controller');

router.post('/', verifyToken, recetaController.create);
router.get('/:id_consulta', verifyToken, recetaController.findByConsulta);

module.exports = router;
