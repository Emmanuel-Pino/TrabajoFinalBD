// =====================================================
// SERVIDOR PRINCIPAL (Express)
// Arranque:  npm start
// =====================================================
require("dotenv").config({ quiet: true });   // carga el archivo .env
const path = require("path");
const express = require("express");
const cors = require("cors");
const db = require("./config/db");

const app = express();

// -----------------------------------------------------
// MIDDLEWARES (se ejecutan en cada petición, en este orden)
// -----------------------------------------------------
app.use(cors());           // permite que las páginas llamen a la API
app.use(express.json());   // permite leer el cuerpo JSON de las peticiones
app.use("/audio", express.static(path.join(__dirname, "audio")));
// -----------------------------------------------------
// RUTAS DE LA API
// Todo lo de routes/auth.routes.js queda bajo "/api":
//   POST /api/registro
// -----------------------------------------------------
app.use("/api", require("./routes/auth.routes"));
app.use("/api", require("./routes/canciones.routes"));

// -----------------------------------------------------
// RUTA DE PRUEBA: comprueba que el servidor y MySQL responden
// Ábrela en el navegador: http://localhost:3000/api/salud
// -----------------------------------------------------
app.get("/api/salud", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ ok: true, mensaje: "Servidor y base de datos funcionando." });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: "No hay conexión con MySQL.", detalle: err.code });
  }
});

// -----------------------------------------------------
// PÁGINAS DEL PROYECTO
// Así las abres en http://localhost:3000/Login/inicio_sesion/inicio_sesion.html
// Se sirven SOLO estas carpetas, para no exponer el .env del backend.
// -----------------------------------------------------
const raiz = path.join(__dirname, "..");
["Login", "Main", "Foros", "Playlists", "NuevaPlaylist"].forEach((carpeta) => {
  app.use("/" + carpeta, express.static(path.join(raiz, carpeta)));
});

// -----------------------------------------------------
// ARRANQUE
// -----------------------------------------------------
const PUERTO = process.env.PORT || 3000;

app.listen(PUERTO, async () => {
  console.log("Servidor listo en http://localhost:" + PUERTO);

  // Al arrancar probamos la conexión a MySQL y avisamos del resultado
  try {
    await db.query("SELECT 1");
    console.log("Conexión a MySQL correcta.");
  } catch (err) {
    console.error("No se pudo conectar a MySQL (" + err.code + ").");
    console.error("Revisa los datos de tu archivo .env y que MySQL esté encendido.");
  }
});