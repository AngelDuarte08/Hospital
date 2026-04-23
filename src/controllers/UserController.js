const { pool } = require("../config/db");
const bcrypt = require("bcrypt");

const createUser = async (req, res) => {
  const { username, password, email, rol_id } = req.body;

  if (!username || !password || !email || !rol_id) {
    return res
      .status(400)
      .json({ mensaje: "Todos los campos son obligatorios" });
  }

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await pool.query(
      "INSERT INTO usuarios (username, password, email, rol_id) VALUES ($1, $2, $3, $4) RETURNING id, username, email, created_at",
      [username, hashedPassword, email, rol_id],
    );

    const newUser = result.rows[0];

    res.status(201).json({
      mensaje: "Usuario creado exitosamente",
      usuario: newUser,
    });
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ mensaje: "El nombre de usuario o el email ya existen" });
    }
    console.error("Error al crear el usuario:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

module.exports = { createUser };
