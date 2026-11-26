const db = require("../config/db");
const { obtenerMongo } = require("../config/mongo");
const { ObjectId } = require("mongodb");

async function crearComunidad(req, res) {

    try {

        const nombre = String(req.body.nombre ?? "").trim();
        const descripcion = String(req.body.descripcion ?? "").trim();

        const { generos, etiquetas } = req.body;

        const id_creador = Number(req.body.id_creador);

        // Validar los datos recibidos
        if (
            !nombre ||
            nombre.length > 60 ||
            !descripcion ||
            descripcion.length > 300 ||
            !Number.isInteger(id_creador) ||
            id_creador <= 0
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Datos de la comunidad inválidos"
            });
        }

        if (
            !Array.isArray(generos) ||
            generos.length === 0 ||
            !generos.every(g => typeof g === "string" && g.trim()) ||
            !Array.isArray(etiquetas) ||
            !etiquetas.every(e => typeof e === "string" && e.trim())
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Géneros o etiquetas inválidos"
            });
        }

        // Verificar que el usuario existe en MySQL
        const [usuarios] = await db.query(
            "SELECT id_usuario FROM tbl_usuario WHERE id_usuario = ?",
            [id_creador]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "El usuario no existe"
            });
        }

        // Obtener la colección de MongoDB
        const coleccion = obtenerMongo().collection("comunidades");

        // Construir el documento
        const comunidad = {
            nombre,
            descripcion,
            generos: generos.map(g => g.trim()),
            etiquetas: etiquetas.map(e => e.trim()),
            id_creador,
            miembros: [id_creador],
            fecha_creacion: new Date()
        };

        // Insertar el documento en MongoDB
        const resultado = await coleccion.insertOne(comunidad);

        return res.status(201).json({
            ok: true,
            mensaje: "Comunidad creada correctamente",
            id_comunidad: resultado.insertedId
        });

    } catch (error) {

        console.error("Error al crear comunidad:", error);

        return res.status(500).json({
            ok: false,
            mensaje: "Error al crear la comunidad"
        });
    }
}
async function listarComunidades(req, res) {

    try {

        const coleccion = obtenerMongo().collection("comunidades");

        const comunidades = await coleccion
            .find({})
            .sort({ fecha_creacion: -1 })
            .toArray();

        return res.json({
            ok: true,
            comunidades
        });

    } catch (error) {

        console.error("Error al listar comunidades:", error);

        return res.status(500).json({
            ok: false,
            mensaje: "Error al listar las comunidades"
        });
    }
}
async function obtenerComunidad(req, res) {

    try {

        const { id } = req.params;

        // Validar el identificador de MongoDB
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                mensaje: "Identificador inválido"
            });
        }

        const coleccion = obtenerMongo().collection("comunidades");

        const comunidad = await coleccion.findOne({
            _id: new ObjectId(id)
        });

        if (!comunidad) {
            return res.status(404).json({
                ok: false,
                mensaje: "Comunidad no encontrada"
            });
        }

        return res.json({
            ok: true,
            comunidad
        });

    } catch (error) {

        console.error("Error al consultar comunidad:", error);

        return res.status(500).json({
            ok: false,
            mensaje: "Error al consultar la comunidad"
        });
    }
}
async function actualizarComunidad(req, res) {

    try {

        const { id } = req.params;

        const nombre = String(req.body.nombre ?? "").trim();
        const descripcion = String(req.body.descripcion ?? "").trim();

        const { generos, etiquetas } = req.body;

        const id_usuario = Number(req.body.id_usuario);

        // Validar identificador
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                mensaje: "Identificador inválido"
            });
        }

        // Validar datos
        if (
            !nombre ||
            nombre.length > 60 ||
            !descripcion ||
            descripcion.length > 300 ||
            !Number.isInteger(id_usuario) ||
            id_usuario <= 0
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Datos inválidos"
            });
        }

        if (
            !Array.isArray(generos) ||
            generos.length === 0 ||
            !generos.every(g => typeof g === "string" && g.trim()) ||
            !Array.isArray(etiquetas) ||
            !etiquetas.every(e => typeof e === "string" && e.trim())
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Géneros o etiquetas inválidos"
            });
        }

        const coleccion = obtenerMongo().collection("comunidades");

        // Actualizar únicamente si pertenece al creador
        const resultado = await coleccion.updateOne(
            {
                _id: new ObjectId(id),
                id_creador: id_usuario
            },
            {
                $set: {
                    nombre,
                    descripcion,
                    generos: generos.map(g => g.trim()),
                    etiquetas: etiquetas.map(e => e.trim())
                }
            }
        );

        if (resultado.matchedCount === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Comunidad no encontrada o sin permisos"
            });
        }

        return res.json({
            ok: true,
            mensaje: "Comunidad actualizada correctamente"
        });

    } catch (error) {

        console.error("Error al actualizar comunidad:", error);

        return res.status(500).json({
            ok: false,
            mensaje: "Error al actualizar la comunidad"
        });
    }
}
async function eliminarComunidad(req, res) {

    try {

        const { id } = req.params;
        const id_usuario = Number(req.query.id_usuario);

        // Validar identificadores
        if (
            !ObjectId.isValid(id) ||
            !Number.isInteger(id_usuario) ||
            id_usuario <= 0
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Identificadores inválidos"
            });
        }

        const mongo = obtenerMongo();
        const idComunidad = new ObjectId(id);

        // Verificar que la comunidad pertenece al usuario
        const comunidad = await mongo
            .collection("comunidades")
            .findOne({
                _id: idComunidad,
                id_creador: id_usuario
            });

        if (!comunidad) {
            return res.status(404).json({
                ok: false,
                mensaje: "Comunidad no encontrada o sin permisos"
            });
        }

        // Eliminar publicaciones asociadas
        const publicaciones = await mongo
            .collection("publicaciones")
            .deleteMany({
                id_comunidad: idComunidad
            });

        // Eliminar mensajes asociados
        const mensajes = await mongo
            .collection("mensajes")
            .deleteMany({
                id_comunidad: idComunidad
            });

        // Eliminar la comunidad
        await mongo.collection("comunidades").deleteOne({
            _id: idComunidad,
            id_creador: id_usuario
        });

        return res.json({
            ok: true,
            mensaje: "Comunidad eliminada correctamente",
            publicaciones_eliminadas: publicaciones.deletedCount,
            mensajes_eliminados: mensajes.deletedCount
        });

    } catch (error) {

        console.error("Error al eliminar comunidad:", error);

        return res.status(500).json({
            ok: false,
            mensaje: "Error al eliminar la comunidad"
        });
    }
}
async function unirseComunidad(req, res) {

    try {

        const { id } = req.params;
        const id_usuario = Number(req.body.id_usuario);

        // Validar identificadores
        if (
            !ObjectId.isValid(id) ||
            !Number.isInteger(id_usuario) ||
            id_usuario <= 0
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Identificadores inválidos"
            });
        }

        // Verificar que el usuario existe en MySQL
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

        const coleccion = obtenerMongo().collection("comunidades");

        // Agregar al usuario sin duplicarlo
        const resultado = await coleccion.updateOne(
            {
                _id: new ObjectId(id)
            },
            {
                $addToSet: {
                    miembros: id_usuario
                }
            }
        );

        if (resultado.matchedCount === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Comunidad no encontrada"
            });
        }

        if (resultado.modifiedCount === 0) {
            return res.status(409).json({
                ok: false,
                mensaje: "El usuario ya pertenece a la comunidad"
            });
        }

        return res.json({
            ok: true,
            mensaje: "Te has unido a la comunidad correctamente"
        });

    } catch (error) {

        console.error("Error al unirse a comunidad:", error);

        return res.status(500).json({
            ok: false,
            mensaje: "Error al unirse a la comunidad"
        });
    }
}
async function salirComunidad(req, res) {

    try {

        const { id } = req.params;
        const id_usuario = Number(req.body.id_usuario);

        // Validar identificadores
        if (
            !ObjectId.isValid(id) ||
            !Number.isInteger(id_usuario) ||
            id_usuario <= 0
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Identificadores inválidos"
            });
        }

        const coleccion = obtenerMongo().collection("comunidades");

        const comunidad = await coleccion.findOne({
            _id: new ObjectId(id)
        });

        if (!comunidad) {
            return res.status(404).json({
                ok: false,
                mensaje: "Comunidad no encontrada"
            });
        }

        // Impedir que el creador abandone su comunidad
        if (comunidad.id_creador === id_usuario) {
            return res.status(403).json({
                ok: false,
                mensaje: "El creador no puede abandonar su comunidad"
            });
        }

        // Retirar al usuario del arreglo de miembros
        const resultado = await coleccion.updateOne(
            {
                _id: new ObjectId(id),
                id_creador: { $ne: id_usuario },
                miembros: id_usuario
            },
            {
                $pull: {
                    miembros: id_usuario
                }
            }
        );

        if (resultado.modifiedCount === 0) {
            return res.status(409).json({
                ok: false,
                mensaje: "El usuario no pertenece a la comunidad"
            });
        }

        return res.json({
            ok: true,
            mensaje: "Has salido de la comunidad correctamente"
        });

    } catch (error) {

        console.error("Error al salir de comunidad:", error);

        return res.status(500).json({
            ok: false,
            mensaje: "Error al salir de la comunidad"
        });
    }
}
async function listarMisComunidades(req, res) {

    try {

        const id_usuario = Number(req.query.id_usuario);

        // Validar identificador del usuario
        if (
            !Number.isInteger(id_usuario) ||
            id_usuario <= 0
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Identificador de usuario inválido"
            });
        }

        const coleccion = obtenerMongo().collection("comunidades");

        // Buscar comunidades a las que pertenece el usuario
        const comunidades = await coleccion
            .find({
                miembros: id_usuario
            })
            .sort({ fecha_creacion: -1 })
            .toArray();

        return res.json({
            ok: true,
            comunidades
        });

    } catch (error) {

        console.error("Error al listar mis comunidades:", error);

        return res.status(500).json({
            ok: false,
            mensaje: "Error al consultar mis comunidades"
        });
    }
}
module.exports = {
    crearComunidad,
    listarComunidades,
    obtenerComunidad,
    actualizarComunidad,
    eliminarComunidad,
    unirseComunidad,
    salirComunidad,
    listarMisComunidades
};