const express = require("express");

const router = express.Router();

const {
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
} = require("../controllers/publicaciones.controller");

router.post("/publicaciones", crearPublicacion);

router.get(
    "/publicaciones/comunidad/:id/estadisticas",
    estadisticasPublicaciones
);

router.get("/publicaciones/comunidad/:id", listarPublicaciones);

router.get("/publicaciones/:id", obtenerPublicacion);

router.put("/publicaciones/:id", actualizarPublicacion);

router.delete("/publicaciones/:id", eliminarPublicacion);

router.post("/publicaciones/:id/comentarios", agregarComentario);

router.delete(
    "/publicaciones/:id/comentarios/:idComentario",
    eliminarComentario
);

router.post("/publicaciones/:id/likes", agregarLike);

router.delete("/publicaciones/:id/likes", eliminarLike);

module.exports = router;