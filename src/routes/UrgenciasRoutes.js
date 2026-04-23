const express = require("express");
const {
  crearUrgencia,
  obtenerUrgencias,
} = require("../controllers/UrgenciasController");

const router = express.Router();

router.get("/", obtenerUrgencias);
router.post("/", crearUrgencia);

module.exports = router;
