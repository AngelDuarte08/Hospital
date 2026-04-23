const { Router } = require("express");
const { verifyToken } = require("../middlewares/auth.middleware");
const {
  registerAuxiliar,
  login,
  loginFace,
  queryTable,
  updateRecord,
  deleteAuxiliar,
} = require("../controllers/auxiliares.controller");

const router = Router();

// ── Rutas PÚBLICAS (sin token) ────────────────────────────────────────────────
router.post("/register-auxiliar", registerAuxiliar);
router.post("/login", login);
router.post("/login-face", loginFace);

// ── Rutas PROTEGIDAS (requieren token JWT) ────────────────────────────────────
router.get("/query/:table", verifyToken, queryTable);
router.put("/update/:table/:id", verifyToken, updateRecord);
router.delete("/auxiliares/:id", verifyToken, deleteAuxiliar);

module.exports = router;
