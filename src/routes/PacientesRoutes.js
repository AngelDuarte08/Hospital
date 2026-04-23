const express = require("express");
const {
  crearPaciente,
  obtenerPacientes,
} = require("../controllers/PacientesController");

const router = express.Router();

router.get("/", obtenerPacientes);
router.post("/", crearPaciente);

module.exports = router;
