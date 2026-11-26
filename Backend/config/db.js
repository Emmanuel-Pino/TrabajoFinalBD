// =====================================================
// CONEXIÓN A MYSQL
// =====================================================


require("dotenv").config({ path: require("path").join(__dirname, "..", ".env"), override: true });


const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",   
  port: process.env.DB_PORT || 3306,          
  user: process.env.DB_USER || "root",                  
  password: process.env.DB_PASSWORD || "admin",          
  database: process.env.DB_NAME || "proyectobd",
  charset: "utf8mb4",                         
  waitForConnections: true,                 
  connectionLimit: 10                        
});

module.exports = pool;