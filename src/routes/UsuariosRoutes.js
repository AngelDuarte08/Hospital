const express = require("express");
const {
  crearUsuario,
  obtenerUsuarios,
} = require("../controllers/UsuariosController");

const router = express.Router();

router.get("/", obtenerUsuarios);
router.post("/", crearUsuario);

module.exports = router;
