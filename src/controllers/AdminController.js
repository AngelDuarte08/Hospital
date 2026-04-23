const { pool } = require("../config/db");

const getStats = async (req, res) => {
  try {
    const stats = {};
    const tables = [
      "citas",
      "consultas",
      "consultorios",
      "doctores",
      "especialidades",
      "pacientes",
      "roles",
      "urgencias",
      "usuarios",
    ];

    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      stats[table] = result.rows[0].count;
    }

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

module.exports = { getStats };
