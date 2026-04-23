const { pool } = require("../config/db");

const crearPaciente = async (req, res) => {
  const { dni, nombre, apellido, telefono, edad } = req.body;

  if (!dni || !nombre || !apellido) {
    return res.status(400).json({
      error: "Faltan datos obligatorios: dni, nombre y apellido son requeridos",
      recibido: req.body,
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO pacientes (dni, nombre, apellido, telefono, edad)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [dni, nombre, apellido, telefono || null, edad ?? null],
    );

    res.status(201).json({
      mensaje: "Paciente creado",
      paciente: result.rows[0],
    });
  } catch (error) {
    console.error("Error al crear paciente:", error);
    if (error.code === "23505") {
      return res.status(409).json({
        mensaje: "Registro duplicado",
        detalle: error.detail || null,
      });
    }
    res.status(500).json({ mensaje: "Error interno", detalle: error.message });
  }
};

const obtenerPacientes = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, dni, nombre, apellido, telefono, edad FROM pacientes ORDER BY id ASC",
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al obtener pacientes:", error);
    res
      .status(500)
      .json({ mensaje: "Error interno del servidor", detalle: error.message });
  }
};

module.exports = { crearPaciente, obtenerPacientes };
