const ConsultaModel = require('../models/consulta.model');

class ConsultaController {
    create = async (req, res) => {
        const { cita_id, diagnostico, receta, usuario_reg } = req.body;

        if (!cita_id || !diagnostico) {
            return res.status(400).json({ message: 'cita_id y diagnostico son obligatorios' });
        }

        try {
            const consulta = await ConsultaModel.create({ cita_id, diagnostico, receta, usuario_reg });
            res.status(201).json(consulta);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };
}

module.exports = new ConsultaController();
