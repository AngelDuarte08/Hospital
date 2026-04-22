require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const apiRoutes = require("./routes/index");

const app = express();
const IS_PROD = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);

const originEnv = process.env.FRONTEND_ORIGIN?.trim();
const corsOrigins = originEnv
  ? originEnv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : true;

if (IS_PROD) {
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
} else {
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
}
//Mendozainc Routes
const rolesRoutes = require("./routes/RolRoute.js");
const ConsultoriosRoutes = require("./routes/ConsultoriosRoutes.js");
const EspecialidadesRoutes = require("./routes/EspecialidadesRouter.js");
const PacientesRoutes = require("./routes/PacientesRoutes.js");
const UsuariosRoutes = require("./routes/UsuariosRoutes.js");
const DoctoresRoutes = require("./routes/DoctoresRoutes.js");
const UrgenciasRoutes = require("./routes/UrgenciasRoutes.js");
const ConsultasRoutes = require("./routes/ConsultasRoutes.js");
const CitasRoutes = require("./routes/CitasRoutes.js");
const AdminRoutes = require("./routes/AdminRoutes.js");
const AuthRoutes = require("./routes/AuthRoutes.js");

app.use("/auth", AuthRoutes);
app.use("/admin/roles", rolesRoutes);
app.use("/admin/consultorios", ConsultoriosRoutes);
app.use("/admin/especialidades", EspecialidadesRoutes);
app.use("/admin/pacientes", PacientesRoutes);
app.use("/admin/usuarios", UsuariosRoutes);
app.use("/admin/doctores", DoctoresRoutes);
app.use("/admin/urgencias", UrgenciasRoutes);
app.use("/admin/consultas", ConsultasRoutes);
app.use("/admin/citas", CitasRoutes);
app.use("/admin", AdminRoutes);

app.use(
  cors({
    origin: corsOrigins,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "8mb" }));

// Rutas
app.use("/api", apiRoutes);

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

module.exports = app;
