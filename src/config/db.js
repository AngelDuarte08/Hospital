require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT || 5432),

    max: 20,                        // Máximo número de clientes
    idleTimeoutMillis: 30000,       // Tiempo de espera para cerrar una conexión inactiva
    connectionTimeoutMillis: 2000,  // Tiempo de espera para establecer una conexión
});

pool.on('error', (err) => {
    console.error('Error inesperado en el cliente de PostgreSQL', err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
