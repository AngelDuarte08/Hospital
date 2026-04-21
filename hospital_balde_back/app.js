require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("./db");

const app = express();
const IS_PROD = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);

const originEnv = process.env.FRONTEND_ORIGIN?.trim();
const corsOrigins = originEnv
  ? originEnv.split(",").map((s) => s.trim()).filter(Boolean)
  : true;

if (IS_PROD) {
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
} else {
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
}
app.use(
  cors({
    origin: corsOrigins,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "8mb" }));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos de inicio de sesión. Espera unos minutos." },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados registros desde esta ubicación. Espera e inténtalo más tarde." },
});

const faceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 45,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas solicitudes de análisis facial. Espera unos minutos." },
});

/** Quita prefijo data:image/...;base64, si viene de canvas (Face++). */
function stripDataUrlBase64(s) {
  if (!s || typeof s !== "string") return "";
  const m = s.match(/^data:image\/\w+;base64,(.+)$/i);
  return (m ? m[1] : s).replace(/\s/g, "");
}

const FACEPP_DETECT_URL =
  process.env.FACEPP_DETECT_URL ||
  "https://api-us.faceplusplus.com/facepp/v3/detect";

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
/** Solo en servidor (nunca en el frontend). Face++ / Megvii. */
const FACEPP_API_KEY = process.env.FACEPP_API_KEY || process.env.API_KEY;
const FACEPP_API_SECRET = process.env.FACEPP_API_SECRET || process.env.API_SECRET;

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment variables.");
}

if (IS_PROD && JWT_SECRET.length < 32) {
  console.warn(
    "[seguridad] JWT_SECRET es corto: usa una cadena aleatoria larga en producción."
  );
}

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  if (!token) {
    return res.status(403).json({ message: "Token requerido" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalido" });
  }
};

app.post("/api/register-doctor", registerLimiter, async (req, res) => {
  const { usuario, contrasena, nombre, especialidad } = req.body;

  if (!usuario || !contrasena || !nombre || !especialidad) {
    return res.status(400).json({
      message: "Debes enviar usuario, contrasena, nombre y especialidad",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(contrasena, SALT_ROUNDS);
    const query = `
      INSERT INTO doctores (usuario, contrasena, nombre, especialidad)
      VALUES ($1, $2, $3, $4)
      RETURNING id_doctor, usuario, nombre, especialidad
    `;
    const values = [usuario, hashedPassword, nombre, especialidad];
    const result = await db.query(query, values);

    return res.status(201).json({
      message: "Doctor registrado exitosamente",
      doctor: result.rows[0],
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ message: "El usuario ya existe" });
    }
    return res.status(500).json({
      message: IS_PROD ? "Error al registrar" : err.message,
    });
  }
});

/**
 * Proxy a Face++ (Megvii). Claves solo en .env del servidor.
 */
app.post("/api/face/detect", faceLimiter, async (req, res) => {
  if (!FACEPP_API_KEY || !FACEPP_API_SECRET) {
    return res.status(503).json({
      message: "Análisis facial no configurado en el servidor",
    });
  }

  let { image_base64 } = req.body;
  if (!image_base64) {
    return res.status(400).json({ message: "Falta image_base64" });
  }
  image_base64 = stripDataUrlBase64(image_base64);
  if (!image_base64.length) {
    return res.status(400).json({ message: "Imagen vacía" });
  }

  const params = new URLSearchParams();
  params.append("api_key", FACEPP_API_KEY);
  params.append("api_secret", FACEPP_API_SECRET);
  params.append("image_base64", image_base64);
  params.append("return_landmark", "0");
  // Atributos mínimos: compatibles con más planes de Face++
  params.append("return_attributes", "age,gender,smiling");

  const controller = new AbortController();
  const kill = setTimeout(() => controller.abort(), 55000);

  try {
    const r = await fetch(FACEPP_DETECT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: params.toString(),
      signal: controller.signal,
    });
    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const payload = { message: "Respuesta no JSON de Face++" };
      if (!IS_PROD) payload.raw = text.slice(0, 400);
      return res.status(502).json(payload);
    }

    if (data.error_message) {
      return res.status(400).json(data);
    }

    if (!r.ok) {
      return res.status(r.status >= 500 ? 502 : 400).json({
        message: "Error HTTP desde Face++",
        status: r.status,
        ...data,
      });
    }

    return res.json(data);
  } catch (err) {
    const aborted = err.name === "AbortError";
    console.error("[face/detect]", err.message || err);
    const payload = {
      message: aborted
        ? "Tiempo de espera agotado al llamar a Face++"
        : "Error al contactar Face++",
    };
    if (!IS_PROD) payload.error = err.message;
    return res.status(502).json(payload);
  } finally {
    clearTimeout(kill);
  }
});

app.post("/api/login", loginLimiter, async (req, res) => {
  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res
      .status(400)
      .json({ message: "Debes enviar usuario y contrasena" });
  }

  try {
    const result = await db.query("SELECT * FROM doctores WHERE usuario = $1", [
      usuario,
    ]);
    const doctor = result.rows[0];

    if (!doctor) {
      return res.status(401).json({ message: "Credenciales invalidas" });
    }

    const isValid = await bcrypt.compare(contrasena, doctor.contrasena);
    if (!isValid) {
      return res.status(401).json({ message: "Credenciales invalidas" });
    }

    const token = jwt.sign(
      { id_doctor: doctor.id_doctor, usuario: doctor.usuario },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({ token });
  } catch (err) {
    return res.status(500).json({ message: "Error al iniciar sesion" });
  }
});

app.get("/api/query/:table", verifyToken, async (req, res) => {
  const { table } = req.params;
  const allowedTables = ["doctores", "pacientes", "citas","consultorios", "consultas", "procedimientos"];

  if (!allowedTables.includes(table)) {
    return res.status(400).json({ message: "Tabla no permitida" });
  }

  try {
    const result = await db.query(`SELECT * FROM ${table} LIMIT 100`);
    return res.json({
      keys: result.fields.map((f) => f.name),
      data: result.rows,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/update/:table/:id", verifyToken, async (req, res) => {
  const { table, id } = req.params;
  const allowedTables = ["doctores", "pacientes", "citas","consultorios"];

  if (!allowedTables.includes(table)) {
    return res.status(400).json({ message: "Tabla no permitida" });
  }

  const fields = Object.keys(req.body);
  const values = Object.values(req.body);

  if (!fields.length) {
    return res.status(400).json({ message: "No hay campos para actualizar" });
  }

  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
  values.push(id);

  try {
    const query = `UPDATE ${table} SET ${setClause} WHERE id = $${
      values.length
    } RETURNING *`;
    const result = await db.query(query, values);
    return res.json(result.rows[0] || null);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/query/consultas", verifyToken, async (req, res) => {
  const { id_paciente, id_doctor, id_consultorio, fecha_hora, motivo, diagnostico, tratamiento, costo, notas_adicionales } = req.body;

  if (!id_paciente || !id_doctor || !id_consultorio || !fecha_hora || !motivo || !diagnostico || !tratamiento || !costo) {
    return res.status(400).json({ message: "Campos obligatorios faltantes" });
  }

  try {
    const query = `
      INSERT INTO consultas (id_paciente, id_doctor, id_consultorio, fecha_hora, motivo, diagnostico, tratamiento, costo, notas_adicionales)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *;
    `;
    const values = [id_paciente, id_doctor, id_consultorio, fecha_hora, motivo, diagnostico, tratamiento, costo, notas_adicionales];
    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/query/procedimientos", verifyToken, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM procedimientos LIMIT 100");
    return res.json({
      keys: result.fields.map((f) => f.name),
      data: result.rows,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
app.post("/api/recetas", verifyToken, async (req, res) => {
  const { id_consulta, medicamentos, indicaciones } = req.body;
  try {
    const result = await db.query(
      "INSERT INTO recetas (id_consulta, medicamentos, indicaciones) VALUES ($1, $2, $3) RETURNING *",
      [id_consulta, medicamentos, indicaciones]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/recetas/:id_consulta", verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM recetas WHERE id_consulta = $1",
      [req.params.id_consulta]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend corriendo en puerto ${PORT}`);
});
