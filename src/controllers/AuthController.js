const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

const login = async (req, res) => {
  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res
      .status(400)
      .json({ mensaje: "Usuario y contraseña son requeridos" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM usuarios WHERE username = $1",
      [usuario],
    );

    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ mensaje: "Usuario o contraseña incorrectos" });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(contrasena, user.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ mensaje: "Usuario o contraseña incorrectos" });
    }

    const payload = {
      id: user.id,
      usuario: user.username,
      rol_id: user.rol_id,
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

module.exports = { login };
