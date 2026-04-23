const { pool } = require("../config/db");

const crearDoctores = async (req, res) => {
  const { usuario_id, especialidad_id, n_colegiado } = req.body;

  if (!usuario_id || !especialidad_id) {
    return res.status(400).json({
      error: "Faltan datos: usuario_id y especialidad_id son obligatorios",
      lo_que_llego: req.body,
    });
  }

  try {
    let query = "INSERT INTO doctores (usuario_id, especialidad_id";
    let placeholders = "VALUES ($1, $2";
    const params = [usuario_id, especialidad_id];

    if (
      n_colegiado !== undefined &&
      n_colegiado !== null &&
      n_colegiado !== ""
    ) {
      query += ", n_colegiado";
      placeholders += ", $" + (params.length + 1);
      params.push(n_colegiado);
    }

    query += ") " + placeholders + ") RETURNING *";

    const result = await pool.query(query, params);

    res.status(201).json({
      mensaje: "Doctor Creado",
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error", detalle: error.message });
  }
};

const obtenerDoctores = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM doctores");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al obtener doctores:", error.message);
    res.status(500).json({
      error: "Error al obtener datos de doctores",
      detalle: error.message,
    });
  }
};

module.exports = { crearDoctores, obtenerDoctores };
