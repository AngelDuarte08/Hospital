const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/index'); 

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api', apiRoutes);

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ message: "Ruta no encontrada" });
});

module.exports = app; 