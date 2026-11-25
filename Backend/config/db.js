// =====================================================
// CONEXIÓN A MYSQL
// Usa un "pool": varias conexiones listas para reutilizar
// (más rápido que abrir una conexión nueva en cada petición).
// Los datos de conexión salen del archivo .env, nunca van
// escritos directamente en el código.
// =====================================================

// Lee el archivo .env y carga sus valores en process.env
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env"), override: true });

// mysql2/promise permite usar async/await con MySQL
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",   // dónde está MySQL
  port: process.env.DB_PORT || 3306,          // puerto de MySQL
  user: process.env.DB_USER || "root",                  // tu usuario de MySQL
  password: process.env.DB_PASSWORD || "admin",          // tu contraseña de MySQL
  database: process.env.DB_NAME || "proyectobd",
  charset: "utf8mb4",                         // para tildes y ñ
  waitForConnections: true,                   // si todas están ocupadas, espera
  connectionLimit: 10                         // máximo de conexiones a la vez
});

// Exportamos el pool para usarlo desde los controladores:
//   const db = require("../config/db");
module.exports = pool;