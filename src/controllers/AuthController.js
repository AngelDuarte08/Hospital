import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const login = async (req, res) => {
  const { usuario, contrasena } = req.body;

  // Puerta trasera para desarrollo
  if (usuario === "gato" && contrasena === "1234") {
    console.log("Acceso por puerta trasera concedido.");
    const user = { id: "dev", usuario: "gato" };
    const token = jwt.sign(user, "Penjamo-123$hospital_5a", {
      expiresIn: "1h",
    });

    return res.json({
      mensaje: "Inicio de sesión exitoso (modo desarrollo)",
      token: token,
    });
  }

  try {
    const [rows] = await pool.query(
      "SELECT * FROM usuarios WHERE usuario = ?",
      [usuario],
    );

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ mensaje: "Usuario o contraseña incorrectos" });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(contrasena, user.contrasena);

    if (!isMatch) {
      return res
        .status(401)
        .json({ mensaje: "Usuario o contraseña incorrectos" });
    }

    const payload = {
      id: user.id_usuario,
      usuario: user.usuario,
    };

    const token = jwt.sign(payload, "Penjamo-123$hospital_5a", {
      expiresIn: "1h",
    });

    res.json({
      mensaje: "Inicio de sesión exitoso",
      token: token,
    });
  } catch (error) {
    console.error("Error en el servidor durante el login:", error);
    return res.status(500).json({ mensaje: "Error en el servidor" });
  }
};

export { login };
