
const path = require("path");
const express = require("express");
const cors = require("cors");
const db = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

// Ruta de prueba: http://localhost:3000/api/salud
app.get("/api/salud", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ ok: true, mensaje: "Servidor y base de datos funcionando." });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: "No hay conexión con MySQL.", detalle: err.code });
  }
});

// Páginas del proyecto (solo estas carpetas, para no exponer el .env)
const raiz = path.join(__dirname, "..");
["Login", "Main", "Foros", "Playlists", "NuevaPlaylist"].forEach((carpeta) => {
  app.use("/" + carpeta, express.static(path.join(raiz, carpeta)));
});

const PUERTO = process.env.PORT || 3000;

app.listen(PUERTO, async () => {
  console.log("Servidor listo en http://localhost:" + PUERTO);
  try {
    await db.query("SELECT 1");
    console.log("Conexión a MySQL correcta.");
  } catch (err) {
    console.error("No se pudo conectar a MySQL (" + err.code + ").");
    console.error("Revisa los datos de tu archivo .env y que MySQL esté encendido.");
  }
});