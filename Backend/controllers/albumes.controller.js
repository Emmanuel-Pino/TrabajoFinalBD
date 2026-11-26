const db = require("../config/db");

async function listarAlbumes(req, res) {
    try {
        const [albumes] = await db.execute(`
            SELECT
                al.id_album,
                al.titulo_alb,
                al.id_artista,
                ar.nombre_art AS artista
            FROM tbl_album al
            INNER JOIN tbl_artista ar
                ON al.id_artista = ar.id_artista
            ORDER BY al.titulo_alb ASC
        `);

        res.json({
            ok: true,
            albumes
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            ok: false,
            mensaje: "No se pudieron consultar los álbumes"
        });
    }
}
async function buscarAlbumes(req, res) {
    try {
        const busqueda = String(req.query.q ?? "").trim();
        const id_artista = Number(req.query.id_artista);

        if (!Number.isInteger(id_artista) || id_artista <= 0) {
            return res.status(400).json({
                ok: false,
                mensaje: "Debes seleccionar un artista válido"
            });
        }

        const [albumes] = await db.execute(`
            SELECT id_album, titulo_alb, id_artista
            FROM tbl_album
            WHERE id_artista = ?
            AND titulo_alb LIKE ?
            ORDER BY titulo_alb ASC
            LIMIT 10
        `, [id_artista, `%${busqueda}%`]);

        res.json({
            ok: true,
            albumes
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            ok: false,
            mensaje: "No se pudieron buscar los álbumes"
        });
    }
}
async function crearAlbum(req, res) {
    try {
        const titulo = String(req.body.titulo_alb ?? "")
            .trim()
            .replace(/\s+/g, " ");

        const id_artista = Number(req.body.id_artista);

        if (titulo.length < 1 || titulo.length > 100) {
            return res.status(400).json({
                ok: false,
                mensaje: "El título debe tener entre 1 y 100 caracteres"
            });
        }

        if (!Number.isInteger(id_artista) || id_artista <= 0) {
            return res.status(400).json({
                ok: false,
                mensaje: "Debes seleccionar un artista válido"
            });
        }

        const [resultado] = await db.execute(`
            INSERT INTO tbl_album (titulo_alb, id_artista)
            VALUES (?, ?)
        `, [titulo, id_artista]);

        res.status(201).json({
            ok: true,
            mensaje: "Álbum registrado correctamente",
            album: {
                id_album: resultado.insertId,
                titulo_alb: titulo,
                id_artista
            }
        });

    } catch (error) {

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                ok: false,
                mensaje: "Este artista ya tiene un álbum con ese título"
            });
        }

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({
                ok: false,
                mensaje: "El artista no existe"
            });
        }

        console.error(error);

        res.status(500).json({
            ok: false,
            mensaje: "No se pudo registrar el álbum"
        });
    }
}
module.exports = { listarAlbumes, buscarAlbumes, crearAlbum };