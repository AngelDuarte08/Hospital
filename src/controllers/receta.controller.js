const RecetaModel = require('../models/receta.model');

class RecetaController {
    create = async (req, res) => {
        const { id_consulta, medicamentos, indicaciones } = req.body;
        try {
            const receta = await RecetaModel.create({ id_consulta, medicamentos, indicaciones });
            res.json(receta);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };

    findByConsulta = async (req, res) => {
        try {
            const recetas = await RecetaModel.findByConsulta(req.params.id_consulta);
            res.json(recetas);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };
}

module.exports = new RecetaController();
