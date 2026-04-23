const { pool } = require("../config/db");

const crearUrgencia = async (req, res) => {
  const { id_paciente, id_doctor, observacion_p, atendido } = req.body;

  if (!id_paciente || !id_doctor) {
    return res.status(400).json({
      error: "Faltan datos: id_paciente e id_doctor son obligatorios",
      lo_que_llego: req.body,
    });
  }

  try {
    const observacion = observacion_p ?? null;
    const atendidoBool =
      atendido === undefined || atendido === null ? false : Boolean(atendido);

    const result = await pool.query(
      `INSERT INTO urgencias (id_paciente, id_doctor, observacion_p, atendido)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id_paciente, id_doctor, observacion, atendidoBool],
    );

    res.status(201).json({
      mensaje: "Urgencia creada",
      urgencia: result.rows[0],
    });
  } catch (error) {
    console.error("Error al crear urgencia:", error);
    res.status(500).json({ mensaje: "Error interno", detalle: error.message });
  }
};

const obtenerUrgencias = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         u.id_urgencias,
         u.id_paciente,
         p.dni as paciente_dni,
         p.nombre AS paciente_nombre,
         p.apellido as paciente_apellido,
         p.telefono as paciente_telefono,
         p.edad as paciente_edad,
         u.id_doctor,
         u.observacion_p,
         u.fecha_ingreso,
         u.atendido
       FROM urgencias u
       LEFT JOIN pacientes p ON p.id = u.id_paciente
       ORDER BY u.fecha_ingreso DESC`,
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al obtener urgencias:", error);
    res
      .status(500)
      .json({ mensaje: "Error interno del servidor", detalle: error.message });
  }
};

module.exports = { crearUrgencia, obtenerUrgencias };
