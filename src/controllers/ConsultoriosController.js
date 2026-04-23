const { pool } = require("../config/db");

const crearConsultorio = async (req, res) => {
  const { nombre_sala, piso } = req.body;

  if (!nombre_sala || !piso) {
    return res.status(400).json({
      error: "Faltan datos: se requiere nombre_sala y piso",
      lo_que_llego: req.body,
    });
  }

  try {
    const result = await pool.query(
      "INSERT INTO consultorios (nombre_sala, piso) VALUES ($1, $2) RETURNING *",
      [nombre_sala, piso],
    );

    res.status(201).json({
      mensaje: "Consultorio Creado",
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error", detalle: error.message });
  }
};

const obtenerConsultorios = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM consultorios ORDER BY id ASC",
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ mensaje: "Error", detalle: error.message });
  }
};

module.exports = { crearConsultorio, obtenerConsultorios };
