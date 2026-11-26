// =====================================================
// SERVIDOR PRINCIPAL (Express)
// Arranque:  npm start
// =====================================================
require("dotenv").config({ quiet: true });   // carga el archivo .env
const path = require("path");
const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const { conectarMongo, obtenerMongo } = require("./config/mongo");

const app = express();

// -----------------------------------------------------
// MIDDLEWARES (se ejecutan en cada petición, en este orden)
// -----------------------------------------------------
app.use(cors());           // permite que las páginas llamen a la API
app.use(express.json());   // permite leer el cuerpo JSON de las peticiones
app.use("/audio", express.static(path.join(__dirname, "audio")));
app.use("/api", require("./routes/artistas.routes"));
app.use("/api", require("./routes/albumes.routes"));
app.use("/api", require("./routes/canciones.routes"));
app.use("/api", require("./routes/playlists.routes"));
app.use("/api", require("./routes/comunidades.routes"));
app.use("/Playlist", express.static(
    path.join(__dirname, "../Playlist")
));
// -----------------------------------------------------
// RUTAS DE LA API
// Todo lo de routes/auth.routes.js queda bajo "/api":
//   POST /api/registro
// -----------------------------------------------------
app.use("/api", require("./routes/auth.routes"));


// -----------------------------------------------------
// RUTA DE PRUEBA: comprueba que el servidor y MySQL responden
// Ábrela en el navegador: http://localhost:3000/api/salud
// -----------------------------------------------------
app.get("/api/salud", async (req, res) => {

    const estado = {
        MySQL: "Desconectado",
        MongoDB: "Desconectado"
    };

    try {
        await db.query("SELECT 1");
        estado.MySQL = "Conectado";
    } catch (error) {
        console.error("Error en MySQL:", error.message);
    }

    try {
        await obtenerMongo().command({ ping: 1 });
        estado.MongoDB = "Conectado";
    } catch (error) {
        console.error("Error en MongoDB:", error.message);
    }

    const ok = estado.MySQL === "Conectado" &&
               estado.MongoDB === "Conectado";

    res.status(ok ? 200 : 503).json({
        ok,
        bases_de_datos: estado
    });
});

// -----------------------------------------------------
// PÁGINAS DEL PROYECTO
// Así las abres en http://localhost:3000/Login/inicio_sesion/inicio_sesion.html
// Se sirven SOLO estas carpetas, para no exponer el .env del backend.
// -----------------------------------------------------
const raiz = path.join(__dirname, "..");
["Login", "Main", "Foros", "Playlist", "NuevaPlaylist"].forEach((carpeta) => {
  app.use("/" + carpeta, express.static(path.join(raiz, carpeta)));
});

// -----------------------------------------------------
// ARRANQUE
// -----------------------------------------------------
const PUERTO = process.env.PORT || 3000;

async function iniciarServidor() {

    try {

        // Verificar conexión con MySQL
        await db.query("SELECT 1");

        console.log("Conexión a MySQL correcta.");

        // Establecer conexión con MongoDB
        await conectarMongo();

        // Iniciar servidor Express
        app.listen(PUERTO, () => {

            console.log(
                "Servidor listo en http://localhost:" + PUERTO
            );
        });

    } catch (error) {

        console.error("Error al iniciar el servidor:");
        console.error(error.message);

        process.exit(1);
    }
}

iniciarServidor();