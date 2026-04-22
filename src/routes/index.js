const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const patientRoutes = require("./patient.routes");
const consultaRoutes = require("./consulta.routes");
const recetaRoutes = require("./receta.routes");
const tableRoutes = require("./table.routes");

// nuevas rutas admin
const rolesRoutes = require("./RolRoute.js");
const consultoriosRoutes = require("./ConsultoriosRoutes.js");
const especialidadesRoutes = require("./EspecialidadesRouter.js");
const pacientesRoutes = require("./PacientesRoutes.js");
const usuariosRoutes = require("./UsuariosRoutes.js");
const doctoresRoutes = require("./DoctoresRoutes.js");
const urgenciasRoutes = require("./UrgenciasRoutes.js");
const consultasRoutes = require("./ConsultasRoutes.js");
const citasRoutes = require("./CitasRoutes.js");
const adminRoutes = require("./AdminRoutes.js");
const authAdminRoutes = require("./AuthRoutes.js");

// públicas
router.use("/auth", authRoutes);
router.use("/patients", patientRoutes);
router.use("/consultas", consultaRoutes);
router.use("/recetas", recetaRoutes);
router.use("/", tableRoutes);

// admin
router.use("/admin/roles", rolesRoutes);
router.use("/admin/consultorios", consultoriosRoutes);
router.use("/admin/especialidades", especialidadesRoutes);
router.use("/admin/pacientes", pacientesRoutes);
router.use("/admin/usuarios", usuariosRoutes);
router.use("/admin/doctores", doctoresRoutes);
router.use("/admin/urgencias", urgenciasRoutes);
router.use("/admin/consultas", consultasRoutes);
router.use("/admin/citas", citasRoutes);
router.use("/admin", adminRoutes);
router.use("/auth-admin", authAdminRoutes);

module.exports = router;