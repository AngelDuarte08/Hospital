const TableModel = require('../models/table.model');

const IS_PROD = process.env.NODE_ENV === 'production';
const FACEPP_DETECT_URL = process.env.FACEPP_DETECT_URL || 'https://api-us.faceplusplus.com/facepp/v3/detect';
const FACEPP_API_KEY = process.env.FACEPP_API_KEY || process.env.API_KEY;
const FACEPP_API_SECRET = process.env.FACEPP_API_SECRET || process.env.API_SECRET;

function stripDataUrlBase64(s) {
    if (!s || typeof s !== 'string') return '';
    const m = s.match(/^data:image\/\w+;base64,(.+)$/i);
    return (m ? m[1] : s).replace(/\s/g, '');
}

class TableController {
    findAll = async (req, res) => {
        const { table } = req.params;
        if (!TableModel.isAllowed(table)) {
            return res.status(400).json({ message: 'Tabla no permitida' });
        }
        try {
            const data = await TableModel.findAll(table);
            return res.json(data);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    };

    update = async (req, res) => {
        const { table, id } = req.params;
        if (!TableModel.isUpdateAllowed(table)) {
            return res.status(400).json({ message: 'Tabla no permitida' });
        }

        const fields = Object.keys(req.body);
        const values = Object.values(req.body);

        if (!fields.length) {
            return res.status(400).json({ message: 'No hay campos para actualizar' });
        }

        try {
            const row = await TableModel.update(table, id, fields, values);
            return res.json(row);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    };

    faceDetect = async (req, res) => {
        if (!FACEPP_API_KEY || !FACEPP_API_SECRET) {
            return res.status(503).json({ message: 'Análisis facial no configurado en el servidor' });
        }

        let { image_base64 } = req.body;
        if (!image_base64) {
            return res.status(400).json({ message: 'Falta image_base64' });
        }
        image_base64 = stripDataUrlBase64(image_base64);
        if (!image_base64.length) {
            return res.status(400).json({ message: 'Imagen vacía' });
        }

        const params = new URLSearchParams();
        params.append('api_key', FACEPP_API_KEY);
        params.append('api_secret', FACEPP_API_SECRET);
        params.append('image_base64', image_base64);
        params.append('return_landmark', '0');
        params.append('return_attributes', 'age,gender,smiling');

        const controller = new AbortController();
        const kill = setTimeout(() => controller.abort(), 55000);

        try {
            const r = await fetch(FACEPP_DETECT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                body: params.toString(),
                signal: controller.signal,
            });
            const text = await r.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch {
                const payload = { message: 'Respuesta no JSON de Face++' };
                if (!IS_PROD) payload.raw = text.slice(0, 400);
                return res.status(502).json(payload);
            }

            if (data.error_message) return res.status(400).json(data);

            if (!r.ok) {
                return res.status(r.status >= 500 ? 502 : 400).json({
                    message: 'Error HTTP desde Face++',
                    status: r.status,
                    ...data,
                });
            }

            return res.json(data);
        } catch (err) {
            const aborted = err.name === 'AbortError';
            console.error('[face/detect]', err.message || err);
            const payload = {
                message: aborted ? 'Tiempo de espera agotado al llamar a Face++' : 'Error al contactar Face++',
            };
            if (!IS_PROD) payload.error = err.message;
            return res.status(502).json(payload);
        } finally {
            clearTimeout(kill);
        }
    };
}

module.exports = new TableController();
