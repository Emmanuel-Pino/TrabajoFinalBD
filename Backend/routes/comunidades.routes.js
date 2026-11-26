const express = require("express");

const router = express.Router();

const {
    crearComunidad,
    listarComunidades,
    obtenerComunidad,
    actualizarComunidad,
    eliminarComunidad,
    unirseComunidad,
    salirComunidad,
    listarMisComunidades
} = require("../controllers/comunidades.controller");

router.post("/comunidades", crearComunidad);

router.get("/comunidades", listarComunidades);

router.get("/comunidades/mis-comunidades", listarMisComunidades);

router.get("/comunidades/:id", obtenerComunidad);

router.put("/comunidades/:id", actualizarComunidad);

router.delete("/comunidades/:id", eliminarComunidad);

router.post("/comunidades/:id/unirse", unirseComunidad);

router.post("/comunidades/:id/salir", salirComunidad);

module.exports = router;