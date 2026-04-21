const PatientModel = require('../models/patient.model');

class PatientController {
    registerAppointment = async (req, res) => {
        const { name, lastName, curp, phone, email, message } = req.body;

        if (!name || !lastName || !curp || !phone || !email || !message) {
            return res.status(400).json({ message: 'Todos los campos son requeridos para realizar la cita' });
        }

        try {
            const newCita = await PatientModel.createPreCita(req.body);
            res.status(201).json({
                message: 'Cita registrada correctamente',
                id: newCita.id_pre_cita
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error al intentar registrar la cita',
                error: error.message
            });
        }
    };

    getSpecialties = async (req, res) => {
        try {
            const specialties = await PatientModel.findSpecialties();
            res.status(200).json(specialties || []);
        } catch (error) {
            res.status(500).json({
                message: 'Error al obtener las especialidades',
                error: error.message
            });
        }
    };
}

module.exports = new PatientController();
