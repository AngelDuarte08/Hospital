const db = require('../config/db');

const ALLOWED_TABLES = ['doctores', 'pacientes', 'citas', 'consultorios', 'consultas', 'procedimientos'];
const ALLOWED_UPDATE_TABLES = ['doctores', 'pacientes', 'citas', 'consultorios'];

const TABLE_PK = {
    doctores:     'id',
    pacientes:    'id',
    citas:        'id',
    consultorios: 'id',
};

class TableModel {
    static async findAll(table) {
        if (!ALLOWED_TABLES.includes(table)) throw new Error('Tabla no permitida');
        const result = await db.query(`SELECT * FROM ${table} LIMIT 100`);
        return { keys: result.fields.map(f => f.name), data: result.rows };
    }

    static async update(table, id, fields, values) {
        if (!ALLOWED_UPDATE_TABLES.includes(table)) throw new Error('Tabla no permitida');
        const pk = TABLE_PK[table];
        const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
        values.push(id);
        const query = `UPDATE ${table} SET ${setClause} WHERE ${pk} = $${values.length} RETURNING *`;
        const result = await db.query(query, values);
        return result.rows[0] || null;
    }

    static isAllowed(table) {
        return ALLOWED_TABLES.includes(table);
    }

    static isUpdateAllowed(table) {
        return ALLOWED_UPDATE_TABLES.includes(table);
    }
}

module.exports = TableModel;
