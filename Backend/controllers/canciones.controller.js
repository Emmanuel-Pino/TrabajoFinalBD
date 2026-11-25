
const db = require("../config/db");

// Obtener todas las canciones
async function listarCanciones(req, res) {
  try {
    const [canciones] = await db.execute(`
      SELECT
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
      FROM tbl_cancion c
      INNER JOIN tbl_album al
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
        al.titulo_alb
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

module.exports = { listarCanciones };
