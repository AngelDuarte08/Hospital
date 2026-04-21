const db = require('../config/db');

class DoctorModel {
    // Registra primero en usuarios, luego en doctores
    static async create({ username, nombre, correo, password, rol_id, especialidad_id, n_colegiado }) {
        // 1. Insertar en usuarios
        const userQuery = `
            INSERT INTO usuarios (username, nombre, correo, password, rol_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, username, nombre, correo
        `;
        const userResult = await db.query(userQuery, [username, nombre, correo, password, rol_id || null]);
        const usuario = userResult.rows[0];

        // 2. Insertar en doctores con el id del usuario creado
        const doctorQuery = `
            INSERT INTO doctores (usuario_id, especialidad_id, n_colegiado)
            VALUES ($1, $2, $3)
            RETURNING id
        `;
        const doctorResult = await db.query(doctorQuery, [usuario.id, especialidad_id || null, n_colegiado || null]);

        return { ...usuario, id_doctor: doctorResult.rows[0].id };
    }

    static async findByUsername(username) {
        // JOIN para obtener usuario + datos de doctor juntos
        const query = `
            SELECT u.id, u.username, u.nombre, u.correo, u.password, u.rol_id,
                   d.id AS id_doctor, d.especialidad_id, d.n_colegiado
            FROM usuarios u
            LEFT JOIN doctores d ON d.usuario_id = u.id
            WHERE u.username = $1
        `;
        const result = await db.query(query, [username]);
        return result.rows[0];
    }
}

module.exports = DoctorModel;
