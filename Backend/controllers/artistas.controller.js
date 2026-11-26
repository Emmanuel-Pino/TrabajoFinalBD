const db = require("../config/db");

async function listarArtistas(req, res) {
    try {
        const [artistas] = await db.execute(`
            SELECT id_artista, nombre_art
            FROM tbl_artista
            ORDER BY nombre_art ASC
        `);

        res.json({
            ok: true,
            artistas
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            ok: false,
            mensaje: "No se pudieron consultar los artistas"
        });
    }
}
async function buscarArtistas(req, res) {
    try {
        const busqueda = String(req.query.q ?? "").trim();

        if (busqueda.length < 2) {
            return res.json({
                ok: true,
                artistas: []
            });
        }

        const [artistas] = await db.execute(`
            SELECT id_artista, nombre_art
            FROM tbl_artista
            WHERE nombre_art LIKE ?
            ORDER BY nombre_art ASC
            LIMIT 10
        `, [`%${busqueda}%`]);

        res.json({
            ok: true,
            artistas
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            ok: false,
            mensaje: "No se pudieron buscar los artistas"
        });
    }
}
async function crearArtista(req, res) {
    try {
        const nombre = String(req.body.nombre_art ?? "")
            .trim()
            .replace(/\s+/g, " ");

        if (nombre.length < 1 || nombre.length > 60) {
            return res.status(400).json({
                ok: false,
                mensaje: "El nombre debe tener entre 1 y 60 caracteres"
            });
        }

        const [resultado] = await db.execute(`
            INSERT INTO tbl_artista (nombre_art)
            VALUES (?)
        `, [nombre]);

        res.status(201).json({
            ok: true,
            mensaje: "Artista registrado correctamente",
            artista: {
                id_artista: resultado.insertId,
                nombre_art: nombre
            }
        });

    } catch (error) {

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                ok: false,
                mensaje: "El artista ya existe"
            });
        }

        console.error(error);

        res.status(500).json({
            ok: false,
            mensaje: "No se pudo registrar el artista"
        });
    }
}
module.exports = { listarArtistas, buscarArtistas, crearArtista };