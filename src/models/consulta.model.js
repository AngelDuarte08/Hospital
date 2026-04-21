const db = require('../config/db');

class ConsultaModel {
    static async create({ cita_id, diagnostico, receta, usuario_reg }) {
        const query = `
            INSERT INTO consultas (cita_id, diagnostico, receta, usuario_reg)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [cita_id, diagnostico, receta || null, usuario_reg || null];
        const result = await db.query(query, values);
        return result.rows[0];
    }
}

module.exports = ConsultaModel;
