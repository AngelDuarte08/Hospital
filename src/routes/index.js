const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const patientRoutes = require('./patient.routes');
const consultaRoutes = require('./consulta.routes');
const recetaRoutes = require('./receta.routes');
const tableRoutes = require('./table.routes');

router.use('/', authRoutes);
router.use('/patients', patientRoutes);
router.use('/consultas', consultaRoutes);
router.use('/recetas', recetaRoutes);
router.use('/', tableRoutes);

module.exports = router;
