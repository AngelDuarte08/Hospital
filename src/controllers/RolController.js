const { pool } = require("../config/db");

const crearRol = async (req, res) => {
  const { nombre_rol } = req.body;

  if (!nombre_rol) {
    return res.status(400).json({
      error: "El servidor no recibió 'nombre_rol'",
      lo_que_llego: req.body,
    });
  }
  try {
    const result = await pool.query(
      "INSERT INTO roles (nombre_rol) VALUES ($1) RETURNING *",
      [nombre_rol],
    );
    res.status(201).json({ mensaje: "Rol guardado", id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ mensaje: "Error", detalle: error.message });
  }
};

const obtenerRoles = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM roles ORDER BY id ASC");
    res.status(200).json(result.rows);
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al obtener roles", detalle: error.message });
  }
};

module.exports = { crearRol, obtenerRoles };
