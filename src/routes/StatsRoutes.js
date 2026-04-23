const express = require("express");
const { obtenerStats } = require("../controllers/StatsController");

const router = express.Router();

// GET /api/admin/stats - Obtener estadísticas generales de la BD
router.get("/", obtenerStats);

module.exports = router;
