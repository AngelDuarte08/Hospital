const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const DoctorModel = require('../models/doctor.model');

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
const IS_PROD = process.env.NODE_ENV === 'production';

class AuthController {
    registerDoctor = async (req, res) => {
        const { username, nombre, correo, password, rol_id, especialidad_id, n_colegiado } = req.body;

        if (!username || !password || !nombre || !correo) {
            return res.status(400).json({
                message: 'Debes enviar username, password, nombre y correo',
            });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            const doctor = await DoctorModel.create({ username, nombre, correo, password: hashedPassword, rol_id, especialidad_id, n_colegiado });
            return res.status(201).json({
                message: 'Doctor registrado exitosamente',
                doctor,
            });
        } catch (err) {
            if (err.code === '23505') {
                return res.status(400).json({ message: 'El usuario o correo ya existe' });
            }
            return res.status(500).json({
                message: IS_PROD ? 'Error al registrar' : err.message,
            });
        }
    };

    login = async (req, res) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Debes enviar username y password' });
        }

        try {
            const doctor = await DoctorModel.findByUsername(username);
            if (!doctor) {
                return res.status(401).json({ message: 'Credenciales invalidas' });
            }

            const isValid = await bcrypt.compare(password, doctor.password);
            if (!isValid) {
                return res.status(401).json({ message: 'Credenciales invalidas' });
            }

            const token = jwt.sign(
                { id: doctor.id, id_doctor: doctor.id_doctor, username: doctor.username, rol_id: doctor.rol_id },
                JWT_SECRET,
                { expiresIn: '8h' }
            );

            return res.json({ token });
        } catch (err) {
            return res.status(500).json({ message: IS_PROD ? 'Error al iniciar sesion' : err.message });
        }
    };
}

module.exports = new AuthController();
