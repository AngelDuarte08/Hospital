const axios   = require('axios');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool = require('../config/db');

const FACE_API_KEY    = process.env.FACE_API_KEY;
const FACE_API_SECRET = process.env.FACE_API_SECRET;
const JWT_SECRET      = process.env.JWT_SECRET;
const SALT_ROUNDS     = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;

const ALLOWED_TABLES   = ['auxiliares'];
const PROTECTED_FIELDS = ['id_auxiliar', 'contrasena'];

// ─── REGISTER AUXILIAR ────────────────────────────────────────────────────────
const registerAuxiliar = async (req, res) => {
    console.log('DATOS RECIBIDOS:', req.body);

    const {
        numero_empleado,
        contrasena,
        nombre,
        apellidos,
        telefono,
        email,
        tipo_auxiliar,
        departamento,
        turno,
        puede_registrar,
        face_image,
    } = req.body;

    if (!numero_empleado || !contrasena) {
        return res.status(400).json({ message: 'Número de empleado y contraseña son requeridos' });
    }

    const tipo_aux = tipo_auxiliar
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();

    try {
        const hashedPassword = await bcrypt.hash(contrasena, SALT_ROUNDS);

        // ── Reconocimiento facial (opcional) ──────────────────────────────────
        let face_token = null;

        if (face_image) {
            try {
                const base64 = face_image.replace(/^data:image\/\w+;base64,/, '');

                const response = await axios.post(
                    'https://api-us.faceplusplus.com/facepp/v3/detect',
                    new URLSearchParams({
                        api_key:      FACE_API_KEY,
                        api_secret:   FACE_API_SECRET,
                        image_base64: base64,
                    })
                );

                console.log('FACE++ RESPONSE:', response.data);

                if (response.data.faces && response.data.faces.length > 0) {
                    face_token = response.data.faces[0].face_token;
                } else {
                    return res.status(400).json({ message: 'No se detectó rostro en la imagen' });
                }

            } catch (error) {
                console.error('ERROR FACE++:', error.response?.data || error.message);
                return res.status(500).json({
                    message: 'Error en reconocimiento facial',
                    error:   error.response?.data || error.message,
                });
            }
        }

        // ── INSERT en tabla auxiliares ────────────────────────────────────────
        const query = `
            INSERT INTO auxiliares
                (numero_empleado, contrasena, nombre, apellidos, telefono, email,
                 tipo_auxiliar, departamento, turno, puede_registrar, face_token)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id_auxiliar, numero_empleado, nombre, apellidos, tipo_auxiliar, departamento, turno
        `;

        const values = [
            numero_empleado,
            hashedPassword,
            nombre,
            apellidos,
            telefono        || null,
            email           || null,
            tipo_aux,
            departamento,
            turno,
            puede_registrar ?? false,
            face_token      || null,
        ];

        const result = await pool.query(query, values);

        return res.status(201).json({
            message: 'Auxiliar registrado correctamente',
            user: result.rows[0],
        });

    } catch (err) {
        console.error('ERROR AL REGISTRAR AUXILIAR:', err);

        if (err.code === '23505') {
            return res.status(400).json({ message: 'El número de empleado ya existe' });
        }

        return res.status(500).json({ error: err.message });
    }
};

// ─── LOGIN CON CONTRASEÑA ─────────────────────────────────────────────────────
const login = async (req, res) => {
    const { numero_empleado, contrasena } = req.body;

    if (!numero_empleado || !contrasena) {
        return res.status(400).json({ message: 'Número de empleado y contraseña son requeridos' });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM auxiliares WHERE numero_empleado = $1',
            [numero_empleado]
        );
        const auxiliar = result.rows[0];

        if (!auxiliar || !(await bcrypt.compare(contrasena, auxiliar.contrasena))) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            {
                id:              auxiliar.id_auxiliar,
                numero_empleado: auxiliar.numero_empleado,
                nombre:          auxiliar.nombre,
                tipo_auxiliar:   auxiliar.tipo_auxiliar,
                puede_registrar: auxiliar.puede_registrar,
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        return res.json({ token });

    } catch (err) {
        return res.status(500).json({ message: 'Error al generar token', error: err.message });
    }
};

// ─── LOGIN CON ROSTRO ─────────────────────────────────────────────────────────
const loginFace = async (req, res) => {
    try {
        const { face_token } = req.body;

        if (!face_token) {
            return res.status(400).json({ message: 'Face token requerido' });
        }

        const result = await pool.query(
            'SELECT * FROM auxiliares WHERE face_token = $1',
            [face_token]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Rostro no registrado' });
        }

        const user = result.rows[0];

        const token = jwt.sign(
            {
                id:              user.id_auxiliar,
                numero_empleado: user.numero_empleado,
                nombre:          user.nombre,
                puede_registrar: user.puede_registrar,
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        return res.json({ token });

    } catch (error) {
        console.error('LOGIN FACE ERROR:', error);
        return res.status(500).json({ message: 'Error en login facial' });
    }
};

// ─── QUERY TABLE ──────────────────────────────────────────────────────────────
const queryTable = async (req, res) => {
    const { table } = req.params;

    if (!ALLOWED_TABLES.includes(table)) {
        return res.status(403).json({ error: 'Tabla no permitida' });
    }

    try {
        const result = await pool.query(
            `SELECT id_auxiliar, numero_empleado, nombre, apellidos, telefono, email,
                    tipo_auxiliar, departamento, turno, puede_registrar
             FROM ${table} LIMIT 100`
        );

        return res.json({
            keys: result.fields.map(f => f.name),
            data: result.rows,
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// ─── UPDATE RECORD ────────────────────────────────────────────────────────────
const updateRecord = async (req, res) => {
    const { table, id } = req.params;

    if (!ALLOWED_TABLES.includes(table)) {
        return res.status(403).json({ error: 'Tabla no permitida' });
    }

    const fields = Object.keys(req.body).filter(f => !PROTECTED_FIELDS.includes(f));
    const values = fields.map(f => req.body[f]);

    if (fields.length === 0) {
        return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    values.push(id);

    try {
        const query = `UPDATE ${table} SET ${setClause} WHERE id_auxiliar = $${values.length} RETURNING *`;
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }

        return res.json(result.rows[0]);

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// ─── DELETE AUXILIAR ──────────────────────────────────────────────────────────
const deleteAuxiliar = async (req, res) => {
    if (!req.user.puede_registrar) {
        return res.status(403).json({ message: 'Sin permisos para eliminar' });
    }

    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM auxiliares WHERE id_auxiliar = $1 RETURNING id_auxiliar, nombre',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Auxiliar no encontrado' });
        }

        return res.json({
            message:  'Auxiliar eliminado correctamente',
            auxiliar: result.rows[0],
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

module.exports = {
    registerAuxiliar,
    login,
    loginFace,
    queryTable,
    updateRecord,
    deleteAuxiliar,
};
