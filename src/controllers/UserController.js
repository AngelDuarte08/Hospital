import pool from "../config/db.js";
import bcrypt from "bcrypt";

// Crear un nuevo usuario con contraseña hasheada
export const createUser = async (req, res) => {
  const { username, password, email, rol_id } = req.body;

  if (!username || !password || !email || !rol_id) {
    return res
      .status(400)
      .json({ mensaje: "Todos los campos son obligatorios" });
  }

  try {
    // Generar el hash de la contraseña
    const saltRounds = 10; // Número de rondas de salting para seguridad
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Guardar el nuevo usuario en la base de datos con la contraseña hasheada
    const result = await pool.query(
      "INSERT INTO usuarios (username, password, email, rol_id) VALUES ($1, $2, $3, $4) RETURNING id, username, email, created_at",
      [username, hashedPassword, email, rol_id],
    );

    const newUser = result.rows[0];

    res.status(201).json({
      mensaje: "Usuario creado exitosamente",
      usuario: newUser,
    });
  } catch (error) {
    // Manejo de errores (ej. usuario duplicado)
    if (error.code === "23505") {
      // Código para violación de restricción única
      return res
        .status(409)
        .json({ mensaje: "El nombre de usuario o el email ya existen" });
    }
    console.error("Error al crear el usuario:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};
