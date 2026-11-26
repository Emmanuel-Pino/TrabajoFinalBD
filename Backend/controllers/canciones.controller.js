
const db = require("../config/db");
const fs = require("fs/promises");
const path = require("path");

// Obtener todas las canciones
async function listarCanciones(req, res) {
    try {
        const [canciones] = await db.execute(`
    SELECT
    c.id_cancion,
    c.titulo_can,
    c.duracion_can,
    c.ruta_audio_can,
    c.id_album,
    c.id_usuario,
    al.titulo_alb AS album,
    al.id_artista AS id_artista_principal,

    GROUP_CONCAT(
        DISTINCT ar.nombre_art
        ORDER BY ar.nombre_art
        SEPARATOR ', '
    ) AS artistas,

    GROUP_CONCAT(
        DISTINCT ar.id_artista
        ORDER BY ar.nombre_art
        SEPARATOR ','
    ) AS ids_artistas

FROM tbl_cancion c

LEFT JOIN tbl_album al
    ON c.id_album = al.id_album

LEFT JOIN tbl_artista_cancion ac
    ON c.id_cancion = ac.id_cancion

LEFT JOIN tbl_artista ar
    ON ac.id_artista = ar.id_artista

GROUP BY
    c.id_cancion,
    c.titulo_can,
    c.duracion_can,
    c.ruta_audio_can,
    c.id_album,
    c.id_usuario,
al.titulo_alb,
    al.id_artista
    `);

        res.json({
            ok: true,
            canciones
        });

    } catch (err) {
        console.error("Error en listarCanciones:", err.message);
        res.status(500).json({
            ok: false,
            mensaje: "Error al consultar las canciones."
        });
    }
}
async function crearCancion(req, res) {
    let conexion;

    try {
        const { titulo_can, duracion_can } = req.body;
        const id_usuario = Number(req.body.id_usuario);

        const id_album = req.body.id_album || null;
        const artistas = JSON.parse(req.body.artistas || "[]");

        if (
            !titulo_can || !duracion_can || !id_album ||
            !req.file || !Array.isArray(artistas) ||
            artistas.length === 0 ||
            !Number.isInteger(id_usuario) ||
            id_usuario <= 0
        ) {
            throw new Error("Faltan datos obligatorios o usuario inválido");
        }

        const ruta_audio_can = `audio/${req.file.filename}`;

        conexion = await db.getConnection();
        await conexion.beginTransaction();
        const [usuarios] = await conexion.execute(`
    SELECT id_usuario
    FROM tbl_usuario
    WHERE id_usuario = ?
`, [id_usuario]);

        if (usuarios.length === 0) {
            throw new Error("El usuario no existe");
        }

        const [resultado] = await conexion.execute(`
    INSERT INTO tbl_cancion
    (
        titulo_can,
        duracion_can,
        id_album,
        ruta_audio_can,
        id_usuario
    )
    VALUES (?, ?, ?, ?, ?)
`, [
            titulo_can,
            duracion_can,
            id_album,
            ruta_audio_can,
            id_usuario
        ]);

        const id_cancion = resultado.insertId;

        for (const id_artista of artistas) {
            await conexion.execute(`
                INSERT INTO tbl_artista_cancion
                (id_artista, id_cancion)
                VALUES (?, ?)
            `, [id_artista, id_cancion]);
        }

        await conexion.commit();

        res.status(201).json({
            ok: true,
            mensaje: "Canción registrada correctamente",
            id_cancion
        });

    } catch (err) {
        if (conexion) {
            await conexion.rollback();
        }

        if (req.file) {
            await fs.unlink(req.file.path).catch(console.error);
        }

        console.error(err);

        res.status(400).json({
            ok: false,
            mensaje: "No se pudo registrar la canción"
        });

    } finally {
        if (conexion) {
            conexion.release();
        }
    }
}
async function actualizarCancion(req, res) {
    let conexion;
    let rutaAnterior;
    let confirmado = false;

    try {
        const { id } = req.params;
        const { titulo_can, duracion_can } = req.body;
        const id_usuario = Number(req.body.id_usuario);

        const id_album = req.body.id_album || null;
        const artistas = JSON.parse(req.body.artistas || "[]");

        if (
            !titulo_can || !duracion_can ||
            !Array.isArray(artistas) ||
            artistas.length === 0 ||
            !Number.isInteger(id_usuario) ||
            id_usuario <= 0
        ) {
            throw new Error("Faltan datos obligatorios o usuario inválido");
        }
        conexion = await db.getConnection();
        await conexion.beginTransaction();

        // Consultar la canción actual
        const [canciones] = await conexion.execute(`
    SELECT ruta_audio_can, id_usuario
    FROM tbl_cancion
    WHERE id_cancion = ?
    FOR UPDATE
`, [id]);

        if (canciones.length === 0) {

            const error = new Error("La canción no existe");

            error.status = 404;

            throw error;
        }

        // Verificar que el usuario sea el propietario

        if (canciones[0].id_usuario !== id_usuario) {

            const error = new Error(
                "No tienes permisos para editar esta canción"
            );

            error.status = 403;

            throw error;
        }

        rutaAnterior = canciones[0].ruta_audio_can;

        // Conservar el audio si no se sube uno nuevo
        const rutaAudio = req.file
            ? `audio/${req.file.filename}`
            : rutaAnterior;

        // Actualizar la canción
        await conexion.execute(`
    UPDATE tbl_cancion
    SET titulo_can = ?,
        duracion_can = ?,
        id_album = ?,
        ruta_audio_can = ?
    WHERE id_cancion = ?
    AND id_usuario = ?
`, [
            titulo_can,
            duracion_can,
            id_album,
            rutaAudio,
            id,
            id_usuario
        ]);

        // Actualizar las relaciones con los artistas
        await conexion.execute(`
            DELETE FROM tbl_artista_cancion
            WHERE id_cancion = ?
        `, [id]);

        for (const id_artista of artistas) {
            await conexion.execute(`
                INSERT INTO tbl_artista_cancion
                (id_artista, id_cancion)
                VALUES (?, ?)
            `, [id_artista, id]);
        }

        await conexion.commit();
        confirmado = true;

        // Eliminar el audio anterior si fue reemplazado
        if (req.file && rutaAnterior) {
            await fs.unlink(
                path.join(__dirname, "../audio", path.basename(rutaAnterior))
            ).catch(console.error);
        }

        res.json({
            ok: true,
            mensaje: "Canción actualizada correctamente"
        });

    } catch (err) {
        if (conexion && !confirmado) {
            await conexion.rollback();
        }

        if (req.file && !confirmado) {
            await fs.unlink(req.file.path).catch(console.error);
        }

        console.error(err);

        res.status(err.status || 400).json({
            ok: false,
            mensaje: err.status
                ? err.message
                : "No se pudo actualizar la canción"
        });

    } finally {
        if (conexion) {
            conexion.release();
        }
    }
}
async function eliminarCancion(req, res) {
    let conexion;
    let confirmado = false;

    try {
        const { id } = req.params;
        const id_usuario = Number(req.query.id_usuario);

        if (
            !Number.isInteger(id_usuario) ||
            id_usuario <= 0
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Usuario inválido"
            });
        }

        conexion = await db.getConnection();
        await conexion.beginTransaction();

        // Consultar la canción y su ruta de audio
        const [canciones] = await conexion.execute(`
    SELECT ruta_audio_can, id_usuario
    FROM tbl_cancion
    WHERE id_cancion = ?
    FOR UPDATE
`, [id]);

        if (canciones.length === 0) {
            await conexion.rollback();

            return res.status(404).json({
                ok: false,
                mensaje: "La canción no existe"
            });
        }
        // Verificar que el usuario sea el propietario

        if (canciones[0].id_usuario !== id_usuario) {

            await conexion.rollback();

            return res.status(403).json({
                ok: false,
                mensaje: "No tienes permisos para eliminar esta canción"
            });
        }
        const rutaAudio = canciones[0].ruta_audio_can;

        // Eliminar la canción y sus relaciones en cascada
        await conexion.execute(`
    DELETE FROM tbl_cancion
    WHERE id_cancion = ?
    AND id_usuario = ?
`, [id, id_usuario]);

        await conexion.commit();
        confirmado = true;

        // Eliminar el archivo MP3
        if (rutaAudio) {
            await fs.unlink(
                path.join(__dirname, "../audio", path.basename(rutaAudio))
            ).catch(console.error);
        }

        res.json({
            ok: true,
            mensaje: "Canción eliminada correctamente"
        });

    } catch (err) {
        if (conexion && !confirmado) {
            await conexion.rollback();
        }

        console.error(err);

        res.status(500).json({
            ok: false,
            mensaje: "No se pudo eliminar la canción"
        });

    } finally {
        if (conexion) {
            conexion.release();
        }
    }
}
module.exports = { listarCanciones, crearCancion, actualizarCancion, eliminarCancion };
