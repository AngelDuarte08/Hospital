const pool = require('../config/db')

class PatientModel{
    static async createPreCita(data){
        const { name, lastName, curp, phone, email, message } = data;
        const query = 'INSERT INTO peticion_citas (nombres_paciente, apellidos_paciente, curp, telefono, correo, motivo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;';
        const values = [name, lastName, curp, phone, email, message];
        
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async findSpecialties(){
        const query = 'SELECT * FROM especialidades;';
        const result = await pool.query(query); 
        return result.rows;
    }
}

module.exports = PatientModel