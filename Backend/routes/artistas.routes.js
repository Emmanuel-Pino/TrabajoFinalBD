const express = require("express");

const {
    listarArtistas,
    buscarArtistas,
    crearArtista
} = require("../controllers/artistas.controller");

const router = express.Router();

router.get("/artistas", listarArtistas);
router.get("/artistas/buscar", buscarArtistas);
router.post("/artistas", crearArtista);

module.exports = router;