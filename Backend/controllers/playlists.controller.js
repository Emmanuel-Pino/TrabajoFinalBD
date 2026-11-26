const db = require("../config/db");

async function crearPlaylist(req, res) {

    try {

        const titulo = String(req.body.titulo_play ?? "").trim();
        const descripcion = String(req.body.descripcion_play ?? "").trim();
        const id_usuario = Number(req.body.id_usuario);

        if (titulo.length < 1 || titulo.length > 50) {
            return res.status(400).json({
                ok: false,
                mensaje: "El título debe tener entre 1 y 50 caracteres"
            });
        }

        if (descripcion.length > 120) {
            return res.status(400).json({
                ok: false,
                mensaje: "La descripción no puede superar los 120 caracteres"
            });
        }

        if (!Number.isInteger(id_usuario) || id_usuario <= 0) {
            return res.status(400).json({
                ok: false,
                mensaje: "Usuario no válido"
            });
        }

        const [resultado] = await db.execute(
            `INSERT INTO tbl_playlist
            (titulo_play, descripcion_play, id_usuario)
            VALUES (?, ?, ?)`,
            [titulo, descripcion || null, id_usuario]
        );

        res.status(201).json({
            ok: true,
            mensaje: "Playlist creada correctamente",
            id_playlist: resultado.insertId
        });

    } catch (error) {

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({
                ok: false,
                mensaje: "El usuario no existe"
            });
        }

        console.error(error);

        res.status(500).json({
            ok: false,
            mensaje: "No se pudo crear la playlist"
        });
    }
}
async function listarPlaylists(req, res) {

    try {

        const id_usuario = Number(req.query.id_usuario);

        if (!Number.isInteger(id_usuario) || id_usuario <= 0) {
            return res.status(400).json({
                ok: false,
                mensaje: "Usuario no válido"
            });
        }

        const [playlists] = await db.execute(
            `SELECT
                p.id_playlist,
                p.titulo_play,
                p.descripcion_play,
                p.fecha_creacion_play,
                p.id_usuario,
                COUNT(pc.id_cancion) AS total_canciones

            FROM tbl_playlist p

            LEFT JOIN tbl_playlist_cancion pc
                ON p.id_playlist = pc.id_playlist

            WHERE p.id_usuario = ?

            GROUP BY
                p.id_playlist,
                p.titulo_play,
                p.descripcion_play,
                p.fecha_creacion_play,
                p.id_usuario

            ORDER BY p.fecha_creacion_play DESC`,
            [id_usuario]
        );

        res.json({
            ok: true,
            playlists
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            mensaje: "No se pudieron consultar las playlists"
        });
    }
}
async function actualizarPlaylist(req, res) {

    try {

        const id_playlist = Number(req.params.id);
        const id_usuario = Number(req.body.id_usuario);

        const titulo = String(req.body.titulo_play ?? "").trim();
        const descripcion = String(req.body.descripcion_play ?? "").trim();

        if (
            !Number.isInteger(id_playlist) || id_playlist <= 0 ||
            !Number.isInteger(id_usuario) || id_usuario <= 0
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Identificadores no válidos"
            });
        }

        if (titulo.length < 1 || titulo.length > 50) {
            return res.status(400).json({
                ok: false,
                mensaje: "El título debe tener entre 1 y 50 caracteres"
            });
        }

        if (descripcion.length > 120) {
            return res.status(400).json({
                ok: false,
                mensaje: "La descripción no puede superar los 120 caracteres"
            });
        }

        const [resultado] = await db.execute(
            `UPDATE tbl_playlist
            SET titulo_play = ?, descripcion_play = ?
            WHERE id_playlist = ? AND id_usuario = ?`,
            [titulo, descripcion || null, id_playlist, id_usuario]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Playlist no encontrada"
            });
        }

        res.json({
            ok: true,
            mensaje: "Playlist actualizada correctamente"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            mensaje: "No se pudo actualizar la playlist"
        });
    }
}
async function eliminarPlaylist(req, res) {

    try {

        const id_playlist = Number(req.params.id);
        const id_usuario = Number(req.query.id_usuario);

        if (
            !Number.isInteger(id_playlist) || id_playlist <= 0 ||
            !Number.isInteger(id_usuario) || id_usuario <= 0
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Identificadores no válidos"
            });
        }

        const [resultado] = await db.execute(
            `DELETE FROM tbl_playlist
            WHERE id_playlist = ? AND id_usuario = ?`,
            [id_playlist, id_usuario]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Playlist no encontrada"
            });
        }

        res.json({
            ok: true,
            mensaje: "Playlist eliminada correctamente"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            mensaje: "No se pudo eliminar la playlist"
        });
    }
}
async function agregarCancionPlaylist(req, res) {

    try {

        const id_playlist = Number(req.params.id);
        const id_cancion = Number(req.body.id_cancion);
        const id_usuario = Number(req.body.id_usuario);

        if (
            !Number.isInteger(id_playlist) || id_playlist <= 0 ||
            !Number.isInteger(id_cancion) || id_cancion <= 0 ||
            !Number.isInteger(id_usuario) || id_usuario <= 0
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Identificadores no válidos"
            });
        }

        const [resultado] = await db.execute(
            `INSERT INTO tbl_playlist_cancion
                (id_playlist, id_cancion)
            SELECT id_playlist, ?
            FROM tbl_playlist
            WHERE id_playlist = ? AND id_usuario = ?`,
            [id_cancion, id_playlist, id_usuario]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Playlist no encontrada"
            });
        }

        res.status(201).json({
            ok: true,
            mensaje: "Canción agregada correctamente"
        });

    } catch (error) {

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                ok: false,
                mensaje: "La canción ya está en la playlist"
            });
        }

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({
                ok: false,
                mensaje: "La canción no existe"
            });
        }

        console.error(error);

        res.status(500).json({
            ok: false,
            mensaje: "No se pudo agregar la canción"
        });
    }
}
async function listarCancionesPlaylist(req, res) {

    try {

        const id_playlist = Number(req.params.id);
        const id_usuario = Number(req.query.id_usuario);

        if (
            !Number.isInteger(id_playlist) || id_playlist <= 0 ||
            !Number.isInteger(id_usuario) || id_usuario <= 0
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Identificadores no válidos"
            });
        }

        const [playlists] = await db.execute(
            `SELECT id_playlist, titulo_play, descripcion_play
            FROM tbl_playlist
            WHERE id_playlist = ? AND id_usuario = ?`,
            [id_playlist, id_usuario]
        );

        if (playlists.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Playlist no encontrada"
            });
        }

        const [canciones] = await db.execute(
            `SELECT
                c.id_cancion,
                c.titulo_can,
                c.duracion_can,
                c.ruta_audio_can,
                al.titulo_alb AS album,

                GROUP_CONCAT(
                    DISTINCT ar.nombre_art
                    ORDER BY ar.nombre_art
                    SEPARATOR ', '
                ) AS artistas

            FROM tbl_playlist_cancion pc

            INNER JOIN tbl_playlist p
                ON pc.id_playlist = p.id_playlist

            INNER JOIN tbl_cancion c
                ON pc.id_cancion = c.id_cancion

            LEFT JOIN tbl_album al
                ON c.id_album = al.id_album

            LEFT JOIN tbl_artista_cancion ac
                ON c.id_cancion = ac.id_cancion

            LEFT JOIN tbl_artista ar
                ON ac.id_artista = ar.id_artista

            WHERE pc.id_playlist = ? AND p.id_usuario = ?

            GROUP BY
                c.id_cancion,
                c.titulo_can,
                c.duracion_can,
                c.ruta_audio_can,
                al.titulo_alb

            ORDER BY c.titulo_can`,
            [id_playlist, id_usuario]
        );

        res.json({
            ok: true,
            playlist: playlists[0],
            canciones
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            mensaje: "No se pudieron consultar las canciones"
        });
    }
}
async function quitarCancionPlaylist(req, res) {

    try {

        const id_playlist = Number(req.params.id);
        const id_cancion = Number(req.params.idCancion);
        const id_usuario = Number(req.query.id_usuario);

        if (
            !Number.isInteger(id_playlist) || id_playlist <= 0 ||
            !Number.isInteger(id_cancion) || id_cancion <= 0 ||
            !Number.isInteger(id_usuario) || id_usuario <= 0
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Identificadores no válidos"
            });
        }

        const [resultado] = await db.execute(
            `DELETE pc
            FROM tbl_playlist_cancion pc

            INNER JOIN tbl_playlist p
                ON pc.id_playlist = p.id_playlist

            WHERE pc.id_playlist = ?
                AND pc.id_cancion = ?
                AND p.id_usuario = ?`,
            [id_playlist, id_cancion, id_usuario]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Canción no encontrada en la playlist"
            });
        }

        res.json({
            ok: true,
            mensaje: "Canción retirada correctamente"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            mensaje: "No se pudo retirar la canción"
        });
    }
}
module.exports = {
    crearPlaylist,
    listarPlaylists,
    actualizarPlaylist,
    eliminarPlaylist,
    agregarCancionPlaylist,
    listarCancionesPlaylist,
    quitarCancionPlaylist
};