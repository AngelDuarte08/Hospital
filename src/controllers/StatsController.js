const { pool } = require("../config/db");

/**
 * Obtener estadísticas generales de la base de datos
 * Retorna conteos de registros por tabla
 */
const obtenerStats = async (req, res) => {
  try {
    console.log("📊 Generando estadísticas de la BD...");

    const resultados = await Promise.all([
      pool.query("SELECT COUNT(*) as count FROM pacientes"),
      pool.query("SELECT COUNT(*) as count FROM doctores"),
      pool.query("SELECT COUNT(*) as count FROM usuarios"),
      pool.query("SELECT COUNT(*) as count FROM roles"),
      pool.query("SELECT COUNT(*) as count FROM consultorios"),
      pool.query("SELECT COUNT(*) as count FROM especialidades"),
      pool.query("SELECT COUNT(*) as count FROM urgencias"),
      pool.query("SELECT COUNT(*) as count FROM citas"),
      pool.query("SELECT COUNT(*) as count FROM consultas"),
    ]);

    const stats = {
      Pacientes: parseInt(resultados[0].rows[0]?.count || 0),
      Doctores: parseInt(resultados[1].rows[0]?.count || 0),
      Usuarios: parseInt(resultados[2].rows[0]?.count || 0),
      Roles: parseInt(resultados[3].rows[0]?.count || 0),
      Consultorios: parseInt(resultados[4].rows[0]?.count || 0),
      Especialidades: parseInt(resultados[5].rows[0]?.count || 0),
      Urgencias: parseInt(resultados[6].rows[0]?.count || 0),
      Citas: parseInt(resultados[7].rows[0]?.count || 0),
      Consultas: parseInt(resultados[8].rows[0]?.count || 0),
    };

    console.log("✅ Estadísticas generadas:", stats);

    res.status(200).json(stats);
  } catch (error) {
    console.error("❌ Error al obtener estadísticas:", error);
    res.status(500).json({
      mensaje: "Error al obtener estadísticas",
      detalle: error.message,
    });
  }
};

module.exports = { obtenerStats };
