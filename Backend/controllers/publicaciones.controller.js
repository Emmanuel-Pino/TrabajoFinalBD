
const db = require("../config/db");

const { obtenerMongo } = require("../config/mongo");

const { ObjectId } = require("mongodb");

// -----------------------------------------------------
// CREAR PUBLICACIÓN
// -----------------------------------------------------

async function crearPublicacion(req, res) {

    try {

        const { id_comunidad } = req.body;

        const id_usuario = Number(req.body.id_usuario);

        const id_cancion = req.body.id_cancion == null
            ? null
            : Number(req.body.id_cancion);

        const titulo = String(req.body.titulo ?? "").trim();

        const contenido = String(req.body.contenido ?? "").trim();

        // 1. Validar identificador de comunidad

        if (
            typeof id_comunidad !== "string" ||
            !ObjectId.isValid(id_comunidad)
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Identificador de comunidad inválido"
            });
        }

        // 2. Validar identificador del usuario

        if (
            !Number.isInteger(id_usuario) ||
            id_usuario <= 0
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Identificador de usuario inválido"
            });
        }

        // 3. Validar identificador de canción (opcional)

        if (
            id_cancion !== null &&
            (
                !Number.isInteger(id_cancion) ||
                id_cancion <= 0
            )
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Identificador de canción inválido"
            });
        }

        // 4. Validar título

        if (!titulo || titulo.length > 100) {

            return res.status(400).json({
                ok: false,
                mensaje: "El título debe tener entre 1 y 100 caracteres"
            });
        }

        // 5. Validar contenido

        if (!contenido || contenido.length > 2000) {

            return res.status(400).json({
                ok: false,
                mensaje: "El contenido debe tener entre 1 y 2000 caracteres"
            });
        }

        // 6. Obtener las colecciones de MongoDB

        const mongo = obtenerMongo();

        const comunidades = mongo.collection("comunidades");

        const publicaciones = mongo.collection("publicaciones");

        const objectIdComunidad = new ObjectId(id_comunidad);

        // 7. Verificar que la comunidad exista

        const comunidad = await comunidades.findOne({
            _id: objectIdComunidad
        });

        if (!comunidad) {

            return res.status(404).json({
                ok: false,
                mensaje: "La comunidad no existe"
            });
        }

        // 8. Verificar que el usuario exista en MySQL

        const [usuarios] = await db.query(
            "SELECT id_usuario FROM tbl_usuario WHERE id_usuario = ?",
            [id_usuario]
        );

        if (usuarios.length === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: "El usuario no existe"
            });
        }

        // 9. Verificar que pertenezca a la comunidad

        if (!comunidad.miembros.includes(id_usuario)) {

            return res.status(403).json({
                ok: false,
                mensaje: "Debes pertenecer a la comunidad para publicar"
            });
        }

        // 10. Verificar que la canción exista en MySQL

        if (id_cancion !== null) {

            const [canciones] = await db.query(
                "SELECT id_cancion FROM tbl_cancion WHERE id_cancion = ?",
                [id_cancion]
            );

            if (canciones.length === 0) {

                return res.status(404).json({
                    ok: false,
                    mensaje: "La canción no existe"
                });
            }
        }

        // 11. Construir el documento

        const nuevaPublicacion = {

            id_comunidad: objectIdComunidad,

            id_usuario,

            id_cancion,

            titulo,

            contenido,

            fecha: new Date(),

            comentarios: [],

            likes: []
        };

        // 12. Insertar en MongoDB

        const resultado = await publicaciones.insertOne(
            nuevaPublicacion
        );

        return res.status(201).json({

            ok: true,

            mensaje: "Publicación creada correctamente",

            id_publicacion: resultado.insertedId
        });

    } catch (error) {

        console.error("Error al crear publicación:", error);

        return res.status(500).json({

            ok: false,

            mensaje: "Error al crear la publicación"
        });
    }
}

// -----------------------------------------------------
// LISTAR PUBLICACIONES DE UNA COMUNIDAD
// -----------------------------------------------------

async function listarPublicaciones(req, res) {

    try {

        const { id } = req.params;

        const id_usuario = Number(req.query.id_usuario);

        // 1. Validar identificadores

        if (!ObjectId.isValid(id)) {

            return res.status(400).json({
                ok: false,
                mensaje: "Identificador de comunidad inválido"
            });
        }

        if (!Number.isInteger(id_usuario) || id_usuario <= 0) {

            return res.status(400).json({
                ok: false,
                mensaje: "Identificador de usuario inválido"
            });
        }

        const mongo = obtenerMongo();

        const objectIdComunidad = new ObjectId(id);

        // 2. Verificar que exista la comunidad

        const comunidad = await mongo
            .collection("comunidades")
            .findOne({
                _id: objectIdComunidad
            });

        if (!comunidad) {

            return res.status(404).json({
                ok: false,
                mensaje: "La comunidad no existe"
            });
        }

        // 3. Verificar pertenencia

        if (!comunidad.miembros.includes(id_usuario)) {

            return res.status(403).json({
                ok: false,
                mensaje: "Debes pertenecer a la comunidad"
            });
        }

        // 4. Consultar publicaciones en MongoDB

        const publicaciones = await mongo
            .collection("publicaciones")
            .find({
                id_comunidad: objectIdComunidad
            })
            .sort({ fecha: -1 })
            .toArray();

        // 5. Obtener identificadores únicos de usuarios
        // Incluye autores de publicaciones y comentarios

        const idsUsuarios = [...new Set(
            publicaciones.flatMap(p => [
                p.id_usuario,
                ...p.comentarios.map(c => c.id_usuario)
            ])
        )];

        // 6. Obtener identificadores únicos de canciones

        const idsCanciones = [...new Set(
            publicaciones
                .map(p => p.id_cancion)
                .filter(id => id != null)
        )];

        let usuarios = [];

        let canciones = [];

        // 7. Consultar usuarios en MySQL

        if (idsUsuarios.length > 0) {

            const marcadores = idsUsuarios
                .map(() => "?")
                .join(",");

            const [filas] = await db.query(
                `SELECT id_usuario, nombre_usu
                 FROM tbl_usuario
                 WHERE id_usuario IN (${marcadores})`,
                idsUsuarios
            );

            usuarios = filas;
        }

        // 8. Consultar canciones en MySQL

        if (idsCanciones.length > 0) {

            const marcadores = idsCanciones
                .map(() => "?")
                .join(",");

            const [filas] = await db.query(
                `SELECT id_cancion, titulo_can,
                        duracion_can, ruta_audio_can
                 FROM tbl_cancion
                 WHERE id_cancion IN (${marcadores})`,
                idsCanciones
            );

            canciones = filas;
        }

        // 9. Crear mapas para localizar los datos

        const mapaUsuarios = new Map(
            usuarios.map(u => [
                u.id_usuario,
                u.nombre_usu
            ])
        );

        const mapaCanciones = new Map(
            canciones.map(c => [
                c.id_cancion,
                c
            ])
        );

        // 10. Combinar MongoDB y MySQL

        const resultado = publicaciones.map(p => ({

            ...p,

            nombre_usuario:
                mapaUsuarios.get(p.id_usuario)
                || "Usuario eliminado",

            cancion:
                mapaCanciones.get(p.id_cancion)
                || null,

            total_likes: p.likes.length,

            total_comentarios: p.comentarios.length,

            liked: p.likes.includes(id_usuario),

            comentarios: p.comentarios.map(c => ({

                ...c,

                nombre_usuario:
                    mapaUsuarios.get(c.id_usuario)
                    || "Usuario eliminado"
            }))
        }));

        return res.json({

            ok: true,

            publicaciones: resultado
        });

    } catch (error) {

        console.error("Error al listar publicaciones:", error);

        return res.status(500).json({

            ok: false,

            mensaje: "Error al consultar publicaciones"
        });
    }
}

// -----------------------------------------------------
// CONSULTAR UNA PUBLICACIÓN INDIVIDUAL
// -----------------------------------------------------

async function obtenerPublicacion(req, res) {

    try {

        const { id } = req.params;

        const id_usuario = Number(req.query.id_usuario);

        // 1. Validar identificadores

        if (!ObjectId.isValid(id)) {

            return res.status(400).json({
                ok: false,
                mensaje: "Identificador de publicación inválido"
            });
        }

        if (!Number.isInteger(id_usuario) || id_usuario <= 0) {

            return res.status(400).json({
                ok: false,
                mensaje: "Identificador de usuario inválido"
            });
        }

        const mongo = obtenerMongo();

        // 2. Buscar la publicación

        const publicacion = await mongo
            .collection("publicaciones")
            .findOne({
                _id: new ObjectId(id)
            });

        if (!publicacion) {

            return res.status(404).json({
                ok: false,
                mensaje: "La publicación no existe"
            });
        }

        // 3. Buscar la comunidad

        const comunidad = await mongo
            .collection("comunidades")
            .findOne({
                _id: publicacion.id_comunidad
            });

        if (!comunidad) {

            return res.status(404).json({
                ok: false,
                mensaje: "La comunidad no existe"
            });
        }

        // 4. Verificar pertenencia

        if (!comunidad.miembros.includes(id_usuario)) {

            return res.status(403).json({
                ok: false,
                mensaje: "Debes pertenecer a la comunidad"
            });
        }

        // 5. Obtener los IDs de autores y comentaristas

        const idsUsuarios = [...new Set([
            publicacion.id_usuario,
            ...publicacion.comentarios.map(c => c.id_usuario)
        ])];

        const marcadores = idsUsuarios
            .map(() => "?")
            .join(",");

        const [usuarios] = await db.query(
            `SELECT id_usuario, nombre_usu
             FROM tbl_usuario
             WHERE id_usuario IN (${marcadores})`,
            idsUsuarios
        );

        const mapaUsuarios = new Map(
            usuarios.map(u => [
                u.id_usuario,
                u.nombre_usu
            ])
        );

        // 6. Consultar la canción asociada

        let cancion = null;

        if (publicacion.id_cancion != null) {

            const [canciones] = await db.query(
                `SELECT id_cancion, titulo_can,
                        duracion_can, ruta_audio_can
                 FROM tbl_cancion
                 WHERE id_cancion = ?`,
                [publicacion.id_cancion]
            );

            cancion = canciones[0] || null;
        }

        // 7. Combinar los datos

        const resultado = {

            ...publicacion,

            nombre_usuario:
                mapaUsuarios.get(publicacion.id_usuario)
                || "Usuario eliminado",

            cancion,

            total_likes: publicacion.likes.length,

            total_comentarios: publicacion.comentarios.length,

            liked: publicacion.likes.includes(id_usuario),

            comentarios: publicacion.comentarios.map(c => ({

                ...c,

                nombre_usuario:
                    mapaUsuarios.get(c.id_usuario)
                    || "Usuario eliminado"
            }))
        };

        return res.json({

            ok: true,

            publicacion: resultado
        });

    } catch (error) {

        console.error("Error al obtener publicación:", error);

        return res.status(500).json({

            ok: false,

            mensaje: "Error al consultar la publicación"
        });
    }
}

// -----------------------------------------------------
// ACTUALIZAR PUBLICACIÓN
// -----------------------------------------------------

async function actualizarPublicacion(req, res) {

    try {

        const { id } = req.params;

        const id_usuario = Number(req.body.id_usuario);

        const titulo = String(req.body.titulo ?? "").trim();

        const contenido = String(req.body.contenido ?? "").trim();

        const id_cancion = req.body.id_cancion == null
            ? null
            : Number(req.body.id_cancion);

        // 1. Validar identificadores

        if (!ObjectId.isValid(id)) {

            return res.status(400).json({
                ok: false,
                mensaje: "Identificador de publicación inválido"
            });
        }

        if (!Number.isInteger(id_usuario) || id_usuario <= 0) {

            return res.status(400).json({
                ok: false,
                mensaje: "Identificador de usuario inválido"
            });
        }

        // 2. Validar título y contenido

        if (!titulo || titulo.length > 100) {

            return res.status(400).json({
                ok: false,
                mensaje: "El título debe tener entre 1 y 100 caracteres"
            });
        }

        if (!contenido || contenido.length > 2000) {

            return res.status(400).json({
                ok: false,
                mensaje: "El contenido debe tener entre 1 y 2000 caracteres"
            });
        }

        // 3. Validar identificador de canción

        if (
            id_cancion !== null &&
            (!Number.isInteger(id_cancion) || id_cancion <= 0)
        ) {

            return res.status(400).json({
                ok: false,
                mensaje: "Identificador de canción inválido"
            });
        }

        const mongo = obtenerMongo();

        const publicaciones = mongo.collection("publicaciones");

        const objectIdPublicacion = new ObjectId(id);

        // 4. Buscar publicación

        const publicacion = await publicaciones.findOne({
            _id: objectIdPublicacion
        });

        if (!publicacion) {

            return res.status(404).json({
                ok: false,
                mensaje: "La publicación no existe"
            });
        }

        // 5. Verificar que sea el autor

        if (publicacion.id_usuario !== id_usuario) {

            return res.status(403).json({
                ok: false,
                mensaje: "Solo el autor puede editar la publicación"
            });
        }

        // 6. Verificar que siga perteneciendo a la comunidad

        const comunidad = await mongo
            .collection("comunidades")
            .findOne({
                _id: publicacion.id_comunidad
            });

        if (!comunidad) {

            return res.status(404).json({
                ok: false,
                mensaje: "La comunidad no existe"
            });
        }

        if (!comunidad.miembros.includes(id_usuario)) {

            return res.status(403).json({
                ok: false,
                mensaje: "Debes pertenecer a la comunidad"
            });
        }

        // 7. Verificar usuario en MySQL

        const [usuarios] = await db.query(
            "SELECT id_usuario FROM tbl_usuario WHERE id_usuario = ?",
            [id_usuario]
        );

        if (usuarios.length === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: "El usuario no existe"
            });
        }

        // 8. Verificar canción en MySQL

        if (id_cancion !== null) {

            const [canciones] = await db.query(
                "SELECT id_cancion FROM tbl_cancion WHERE id_cancion = ?",
                [id_cancion]
            );

            if (canciones.length === 0) {

                return res.status(404).json({
                    ok: false,
                    mensaje: "La canción no existe"
                });
            }
        }

        // 9. Actualizar publicación

        const resultado = await publicaciones.updateOne(
            {
                _id: objectIdPublicacion,
                id_usuario
            },
            {
                $set: {
                    titulo,
                    contenido,
                    id_cancion
                }
            }
        );

        if (resultado.matchedCount === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: "La publicación no existe o no tienes permisos"
            });
        }

        return res.json({

            ok: true,

            mensaje: resultado.modifiedCount > 0
                ? "Publicación actualizada correctamente"
                : "La publicación no presenta cambios"
        });

    } catch (error) {

        console.error("Error al actualizar publicación:", error);

        return res.status(500).json({

            ok: false,

            mensaje: "Error al actualizar la publicación"
        });
    }
}

// -----------------------------------------------------
// ELIMINAR PUBLICACIÓN
// -----------------------------------------------------

async function eliminarPublicacion(req, res) {

    try {

        const { id } = req.params;

        const id_usuario = Number(req.query.id_usuario);

        // 1. Validar identificadores

        if (!ObjectId.isValid(id)) {

            return res.status(400).json({
                ok: false,
                mensaje: "Identificador de publicación inválido"
            });
        }

        if (!Number.isInteger(id_usuario) || id_usuario <= 0) {

            return res.status(400).json({
                ok: false,
                mensaje: "Identificador de usuario inválido"
            });
        }

        const mongo = obtenerMongo();

        const publicaciones = mongo.collection("publicaciones");

        const objectIdPublicacion = new ObjectId(id);

        // 2. Buscar publicación

        const publicacion = await publicaciones.findOne({
            _id: objectIdPublicacion
        });

        if (!publicacion) {

            return res.status(404).json({
                ok: false,
                mensaje: "La publicación no existe"
            });
        }

        // 3. Buscar comunidad

        const comunidad = await mongo
            .collection("comunidades")
            .findOne({
                _id: publicacion.id_comunidad
            });

        if (!comunidad) {

            return res.status(404).json({
                ok: false,
                mensaje: "La comunidad no existe"
            });
        }

        // 4. Verificar permisos

        const esAutor = publicacion.id_usuario === id_usuario;

        const esCreador = comunidad.id_creador === id_usuario;

        if (!esAutor && !esCreador) {

            return res.status(403).json({
                ok: false,
                mensaje: "No tienes permisos para eliminar esta publicación"
            });
        }

        // 5. Verificar usuario en MySQL

        const [usuarios] = await db.query(
            "SELECT id_usuario FROM tbl_usuario WHERE id_usuario = ?",
            [id_usuario]
        );

        if (usuarios.length === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: "El usuario no existe"
            });
        }

        // 6. Eliminar publicación

        const resultado = await publicaciones.deleteOne({
            _id: objectIdPublicacion,
            id_comunidad: publicacion.id_comunidad,
            id_usuario: publicacion.id_usuario
        });

        if (resultado.deletedCount === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: "La publicación no existe"
            });
        }

        return res.json({

            ok: true,

            mensaje: "Publicación eliminada correctamente"
        });

    } catch (error) {

        console.error("Error al eliminar publicación:", error);

        return res.status(500).json({

            ok: false,

            mensaje: "Error al eliminar la publicación"
        });
    }
}

// -----------------------------------------------------
// AÑADIR COMENTARIO
// -----------------------------------------------------

async function agregarComentario(req, res) {

    try {

        const { id } = req.params;

        const id_usuario = Number(req.body.id_usuario);

        const texto = typeof req.body.texto === "string"
            ? req.body.texto.trim()
            : "";

        // 1. Validar identificadores

        if (!ObjectId.isValid(id)) {

            return res.status(400).json({
                ok: false,
                mensaje: "Identificador de publicación inválido"
            });
        }

        if (!Number.isInteger(id_usuario) || id_usuario <= 0) {

            return res.status(400).json({
                ok: false,
                mensaje: "Identificador de usuario inválido"
            });
        }

        // 2. Validar contenido del comentario

        if (!texto || texto.length > 500) {

            return res.status(400).json({
                ok: false,
                mensaje: "El comentario debe tener entre 1 y 500 caracteres"
            });
        }

        const mongo = obtenerMongo();

        const publicaciones = mongo.collection("publicaciones");

        const objectIdPublicacion = new ObjectId(id);

        // 3. Buscar publicación

        const publicacion = await publicaciones.findOne({
            _id: objectIdPublicacion
        });

        if (!publicacion) {

            return res.status(404).json({
                ok: false,
                mensaje: "La publicación no existe"
            });
        }

        // 4. Buscar comunidad

        const comunidad = await mongo
            .collection("comunidades")
            .findOne({
                _id: publicacion.id_comunidad
            });

        if (!comunidad) {

            return res.status(404).json({
                ok: false,
                mensaje: "La comunidad no existe"
            });
        }

        // 5. Verificar pertenencia

        if (!comunidad.miembros.includes(id_usuario)) {

            return res.status(403).json({
                ok: false,
                mensaje: "Debes pertenecer a la comunidad para comentar"
            });
        }

        // 6. Verificar usuario en MySQL

        const [usuarios] = await db.query(
            "SELECT id_usuario FROM tbl_usuario WHERE id_usuario = ?",
            [id_usuario]
        );

        if (usuarios.length === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: "El usuario no existe"
            });
        }

        // 7. Construir comentario

        const nuevoComentario = {

            _id: new ObjectId(),

            id_usuario,

            texto,

            fecha: new Date()
        };

        // 8. Insertar comentario en la publicación

        const resultado = await publicaciones.updateOne(
            {
                _id: objectIdPublicacion
            },
            {
                $push: {
                    comentarios: nuevoComentario
                }
            }
        );

        if (resultado.matchedCount === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: "La publicación no existe"
            });
        }

        return res.status(201).json({

            ok: true,

            mensaje: "Comentario agregado correctamente",

            id_comentario: nuevoComentario._id
        });

    } catch (error) {

        console.error("Error al agregar comentario:", error);

        return res.status(500).json({

            ok: false,

            mensaje: "Error al agregar el comentario"
        });
    }
}

// -----------------------------------------------------
// ELIMINAR COMENTARIO
// -----------------------------------------------------

async function eliminarComentario(req, res) {

    try {

        const { id, idComentario } = req.params;

        const id_usuario = Number(req.query.id_usuario);

        // 1. Validar identificadores

        if (!ObjectId.isValid(id)) {

            return res.status(400).json({
                ok: false,
                mensaje: "Identificador de publicación inválido"
            });
        }

        if (!ObjectId.isValid(idComentario)) {

            return res.status(400).json({
                ok: false,
                mensaje: "Identificador de comentario inválido"
            });
        }

        if (!Number.isInteger(id_usuario) || id_usuario <= 0) {

            return res.status(400).json({
                ok: false,
                mensaje: "Identificador de usuario inválido"
            });
        }

        const mongo = obtenerMongo();

        const publicaciones = mongo.collection("publicaciones");

        const objectIdPublicacion = new ObjectId(id);

        const objectIdComentario = new ObjectId(idComentario);

        // 2. Buscar publicación

        const publicacion = await publicaciones.findOne({
            _id: objectIdPublicacion
        });

        if (!publicacion) {

            return res.status(404).json({
                ok: false,
                mensaje: "La publicación no existe"
            });
        }

        // 3. Buscar comentario dentro del arreglo

        const comentario = publicacion.comentarios.find(
            c => c._id.equals(objectIdComentario)
        );

        if (!comentario) {

            return res.status(404).json({
                ok: false,
                mensaje: "El comentario no existe"
            });
        }

        // 4. Buscar comunidad

        const comunidad = await mongo
            .collection("comunidades")
            .findOne({
                _id: publicacion.id_comunidad
            });

        if (!comunidad) {

            return res.status(404).json({
                ok: false,
                mensaje: "La comunidad no existe"
            });
        }

        // 5. Verificar permisos

        const esAutor = comentario.id_usuario === id_usuario;

        const esCreador = comunidad.id_creador === id_usuario;

        if (!esAutor && !esCreador) {

            return res.status(403).json({
                ok: false,
                mensaje: "No tienes permisos para eliminar este comentario"
            });
        }

        // 6. Verificar usuario en MySQL

        const [usuarios] = await db.query(
            "SELECT id_usuario FROM tbl_usuario WHERE id_usuario = ?",
            [id_usuario]
        );

        if (usuarios.length === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: "El usuario no existe"
            });
        }

        // 7. Eliminar comentario del arreglo

        const resultado = await publicaciones.updateOne(
            {
                _id: objectIdPublicacion,
                "comentarios._id": objectIdComentario
            },
            {
                $pull: {
                    comentarios: {
                        _id: objectIdComentario
                    }
                }
            }
        );

        if (resultado.modifiedCount === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: "El comentario o la publicación ya no existe"
            });
        }

        return res.json({

            ok: true,

            mensaje: "Comentario eliminado correctamente"
        });

    } catch (error) {

        console.error("Error al eliminar comentario:", error);

        return res.status(500).json({

            ok: false,

            mensaje: "Error al eliminar el comentario"
        });
    }
}

// -----------------------------------------------------
// DAR LIKE A UNA PUBLICACIÓN
// -----------------------------------------------------

async function agregarLike(req, res) {

    try {

        const { id } = req.params;

        const id_usuario = Number(req.body.id_usuario);

        // 1. Validar identificadores

        if (!ObjectId.isValid(id)) {

            return res.status(400).json({
                ok: false,
                mensaje: "Identificador de publicación inválido"
            });
        }

        if (!Number.isInteger(id_usuario) || id_usuario <= 0) {

            return res.status(400).json({
                ok: false,
                mensaje: "Identificador de usuario inválido"
            });
        }

        const mongo = obtenerMongo();

        const publicaciones = mongo.collection("publicaciones");

        const objectIdPublicacion = new ObjectId(id);

        // 2. Buscar publicación

        const publicacion = await publicaciones.findOne({
            _id: objectIdPublicacion
        });

        if (!publicacion) {

            return res.status(404).json({
                ok: false,
                mensaje: "La publicación no existe"
            });
        }

        // 3. Buscar comunidad

        const comunidad = await mongo
            .collection("comunidades")
            .findOne({
                _id: publicacion.id_comunidad
            });

        if (!comunidad) {

            return res.status(404).json({
                ok: false,
                mensaje: "La comunidad no existe"
            });
        }

        // 4. Verificar pertenencia

        if (!comunidad.miembros.includes(id_usuario)) {

            return res.status(403).json({
                ok: false,
                mensaje: "Debes pertenecer a la comunidad para dar like"
            });
        }

        // 5. Verificar usuario en MySQL

        const [usuarios] = await db.query(
            "SELECT id_usuario FROM tbl_usuario WHERE id_usuario = ?",
            [id_usuario]
        );

        if (usuarios.length === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: "El usuario no existe"
            });
        }

        // 6. Agregar like sin permitir duplicados

        const resultado = await publicaciones.updateOne(
            {
                _id: objectIdPublicacion
            },
            {
                $addToSet: {
                    likes: id_usuario
                }
            }
        );

        if (resultado.matchedCount === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: "La publicación no existe"
            });
        }

        if (resultado.modifiedCount === 0) {

            return res.status(409).json({
                ok: false,
                mensaje: "Ya le diste like a esta publicación"
            });
        }

        return res.json({

            ok: true,

            mensaje: "Like agregado correctamente"
        });

    } catch (error) {

        console.error("Error al agregar like:", error);

        return res.status(500).json({

            ok: false,

            mensaje: "Error al agregar el like"
        });
    }
}

// -----------------------------------------------------
// RETIRAR LIKE DE UNA PUBLICACIÓN
// -----------------------------------------------------

async function eliminarLike(req, res) {

    try {

        const { id } = req.params;

        const id_usuario = Number(req.query.id_usuario);

        // 1. Validar identificadores

        if (!ObjectId.isValid(id)) {

            return res.status(400).json({
                ok: false,
                mensaje: "Identificador de publicación inválido"
            });
        }

        if (!Number.isInteger(id_usuario) || id_usuario <= 0) {

            return res.status(400).json({
                ok: false,
                mensaje: "Identificador de usuario inválido"
            });
        }

        const mongo = obtenerMongo();

        const publicaciones = mongo.collection("publicaciones");

        const objectIdPublicacion = new ObjectId(id);

        // 2. Buscar publicación

        const publicacion = await publicaciones.findOne({
            _id: objectIdPublicacion
        });

        if (!publicacion) {

            return res.status(404).json({
                ok: false,
                mensaje: "La publicación no existe"
            });
        }

        // 3. Verificar usuario en MySQL

        const [usuarios] = await db.query(
            "SELECT id_usuario FROM tbl_usuario WHERE id_usuario = ?",
            [id_usuario]
        );

        if (usuarios.length === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: "El usuario no existe"
            });
        }

        // 4. Retirar like

        const resultado = await publicaciones.updateOne(
            {
                _id: objectIdPublicacion
            },
            {
                $pull: {
                    likes: id_usuario
                }
            }
        );

        if (resultado.matchedCount === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: "La publicación no existe"
            });
        }

        if (resultado.modifiedCount === 0) {

            return res.status(409).json({
                ok: false,
                mensaje: "No le has dado like a esta publicación"
            });
        }

        return res.json({

            ok: true,

            mensaje: "Like retirado correctamente"
        });

    } catch (error) {

        console.error("Error al retirar like:", error);

        return res.status(500).json({

            ok: false,

            mensaje: "Error al retirar el like"
        });
    }
}

// -----------------------------------------------------
// ESTADÍSTICAS DE PUBLICACIONES
// -----------------------------------------------------

async function estadisticasPublicaciones(req, res) {

    try {

        const { id } = req.params;

        const id_usuario = Number(req.query.id_usuario);

        // 1. Validar identificadores

        if (!ObjectId.isValid(id)) {

            return res.status(400).json({
                ok: false,
                mensaje: "Identificador de comunidad inválido"
            });
        }

        if (!Number.isInteger(id_usuario) || id_usuario <= 0) {

            return res.status(400).json({
                ok: false,
                mensaje: "Identificador de usuario inválido"
            });
        }

        const mongo = obtenerMongo();

        const objectIdComunidad = new ObjectId(id);

        // 2. Buscar comunidad

        const comunidad = await mongo
            .collection("comunidades")
            .findOne({
                _id: objectIdComunidad
            });

        if (!comunidad) {

            return res.status(404).json({
                ok: false,
                mensaje: "La comunidad no existe"
            });
        }

        // 3. Verificar pertenencia

        if (!comunidad.miembros.includes(id_usuario)) {

            return res.status(403).json({
                ok: false,
                mensaje: "Debes pertenecer a la comunidad"
            });
        }

        // 4. Ejecutar agregación

        const estadisticas = await mongo
            .collection("publicaciones")
            .aggregate([

                {
                    $match: {
                        id_comunidad: objectIdComunidad
                    }
                },

                {
                    $project: {

                        titulo: 1,

                        fecha: 1,

                        total_likes: {
                            $size: "$likes"
                        },

                        total_comentarios: {
                            $size: "$comentarios"
                        }
                    }
                },

                {
                    $sort: {
                        total_likes: -1,
                        total_comentarios: -1,
                        fecha: -1
                    }
                }

            ])
            .toArray();

        return res.json({

            ok: true,

            estadisticas
        });

    } catch (error) {

        console.error("Error al consultar estadísticas:", error);

        return res.status(500).json({

            ok: false,

            mensaje: "Error al consultar estadísticas"
        });
    }
}

module.exports = {
    crearPublicacion,
    listarPublicaciones,
    obtenerPublicacion,
    actualizarPublicacion,
    eliminarPublicacion,
    agregarComentario,
    eliminarComentario,
    agregarLike,
    eliminarLike,
    estadisticasPublicaciones
};

