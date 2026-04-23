const express = require("express");
const {
  crearConsulta,
  obtenerConsultas,
} = require("../controllers/ConsultasController");

const router = express.Router();

router.post("/crear", crearConsulta);
router.get("/", obtenerConsultas);

module.exports = router;
