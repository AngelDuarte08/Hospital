const express = require("express");
const router = express.Router();

// ── Rutas existentes ──────────────────────────────────────────────────────────
const authRoutes = require("./auth.routes");
const patientRoutes = require("./patient.routes");
const consultaRoutes = require("./consulta.routes");
const recetaRoutes = require("./receta.routes");
const tableRoutes = require("./table.routes");
const auxiliaresRoutes = require("./auxiliares.routes");

// ── Rutas admin ───────────────────────────────────────────────────────────────
const rolesRoutes = require("./RolRoute");
const consultoriosRoutes = require("./ConsultoriosRoutes");
const especialidadesRoutes = require("./EspecialidadesRouter");
const pacientesRoutes = require("./PacientesRoutes");
const usuariosRoutes = require("./UsuariosRoutes");
const doctoresRoutes = require("./DoctoresRoutes");
const urgenciasRoutes = require("./UrgenciasRoutes");
const consultasRoutes = require("./ConsultasRoutes");
const citasRoutes = require("./CitasRoutes");
const statsRoutes = require("./StatsRoutes");
const adminRoutes = require("./AdminRoutes");
const authAdminRoutes = require("./AuthRoutes");

// ============================================================
// RUTAS PÚBLICAS
// ============================================================
router.use("/auth", authRoutes);
router.use("/patients", patientRoutes);
router.use("/consultas", consultaRoutes);
router.use("/recetas", recetaRoutes);
router.use("/auxiliares", auxiliaresRoutes);
router.use("/", tableRoutes);

// ============================================================
// RUTAS ADMIN
// Importante: /admin/stats debe ir ANTES de /admin para que
// StatsRoutes no quede tapado por la ruta GET /stats de AdminRoutes
// ============================================================
router.use("/admin/roles", rolesRoutes);
router.use("/admin/consultorios", consultoriosRoutes);
router.use("/admin/especialidades", especialidadesRoutes);
router.use("/admin/pacientes", pacientesRoutes);
router.use("/admin/usuarios", usuariosRoutes);
router.use("/admin/doctores", doctoresRoutes);
router.use("/admin/urgencias", urgenciasRoutes);
router.use("/admin/consultas", consultasRoutes);
router.use("/admin/citas", citasRoutes);
router.use("/admin/stats", statsRoutes);
router.use("/admin/auth", adminRoutes);
router.use("/auth-admin", authAdminRoutes);

module.exports = router;
