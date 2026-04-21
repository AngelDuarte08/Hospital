const express = require('express');
const router = express.Router();

// Importamos los archivos de rutas individuales
const patientRoutes = require('./patient.routes');

// Definimos el prefijo para cada módulo
router.use('/patients', patientRoutes);

module.exports = router;
