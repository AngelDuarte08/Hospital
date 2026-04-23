const { pool } = require("../config/db");
const bcrypt = require("bcrypt");

const crearUsuario = async (req, res) => {
  const { username, nombre, correo, password, rol_id } = req.body;

  if (!username || !nombre || !correo || !password || !rol_id) {
    return res
      .status(400)
      .json({ mensaje: "Todos los campos son obligatorios" });
  }

  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await pool.query(
      "INSERT INTO usuarios (username, nombre, correo, password, rol_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, username",
      [username, nombre, correo, passwordHash, rol_id],
    );

    res
      .status(201)
      .json({ mensaje: "Usuario creado", usuario: result.rows[0] });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ mensaje: "Error interno" });
  }
};

const obtenerUsuarios = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM usuarios");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

module.exports = { crearUsuario, obtenerUsuarios };
