const express = require("express");
const {
  crearConsultorio,
  obtenerConsultorios,
} = require("../controllers/ConsultoriosController");

const router = express.Router();

router.get("/", obtenerConsultorios);
router.post("/", crearConsultorio);

module.exports = router;
