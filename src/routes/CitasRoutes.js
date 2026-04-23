const express = require("express");
const { crearCita, obtenerCitas } = require("../controllers/CitasController");

const router = express.Router();

router.post("/", crearCita);
router.get("/", obtenerCitas);

module.exports = router;
