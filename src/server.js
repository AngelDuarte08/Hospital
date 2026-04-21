const app = require('./app');
const { pool } = require('./config/db'); // <--- Verifica que tenga las llaves

const PORT = process.env.PORT || 3000;

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error crítico: No se pudo conectar a la DB', err);
        process.exit(1);
    } else {
        console.log('Conexión a PostgreSQL exitosa');
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    }
});