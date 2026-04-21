const db = require('../config/db');

class RecetaModel {
    static async create({ id_consulta, medicamentos, indicaciones }) {
        const query = `
            INSERT INTO recetas (id_consulta, medicamentos, indicaciones)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const result = await db.query(query, [id_consulta, medicamentos, indicaciones]);
        return result.rows[0];
    }

    static async findByConsulta(id_consulta) {
        const result = await db.query('SELECT * FROM recetas WHERE id_consulta = $1', [id_consulta]);
        return result.rows;
    }
}

module.exports = RecetaModel;
