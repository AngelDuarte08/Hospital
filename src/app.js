require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const apiRoutes = require('./routes/index');

const app = express();
const IS_PROD = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);

const originEnv = process.env.FRONTEND_ORIGIN?.trim();
const corsOrigins = originEnv
    ? originEnv.split(',').map(s => s.trim()).filter(Boolean)
    : true;

if (IS_PROD) {
    app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
} else {
    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
}

app.use(cors({
    origin: corsOrigins,
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '8mb' }));

// Rutas
app.use('/api', apiRoutes);

// Ruta no encontrada
app.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
});

module.exports = app;
