// =====================================================
// CONEXIÓN A MYSQL
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

module.exports = pool;