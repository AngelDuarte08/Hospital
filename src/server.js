const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const app = require("./app");
const { pool } = require("./config/db");

const IS_PROD = process.env.NODE_ENV === "production";
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment variables.");
}

if (IS_PROD && JWT_SECRET.length < 32) {
  console.warn(
    "[seguridad] JWT_SECRET es corto: usa una cadena aleatoria larga en producción.",
  );
}

const PORT = Number(process.env.PORT || 3000);

pool.query("SELECT NOW()", (err) => {
  if (err) {
    console.error("Error crítico: No se pudo conectar a la DB", err);
    process.exit(1);
  }
  console.log("Conexión a PostgreSQL exitosa");
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
});
