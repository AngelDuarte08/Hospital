const express = require("express");
const { crearRol, obtenerRoles } = require("../controllers/RolController");

const router = express.Router();

router.post("/", crearRol);
router.get("/", obtenerRoles);

module.exports = router;
