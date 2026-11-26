const express = require("express");

const {
    listarAlbumes,
    buscarAlbumes,
    crearAlbum
} = require("../controllers/albumes.controller");

const router = express.Router();

router.get("/albumes", listarAlbumes);
router.get("/albumes/buscar", buscarAlbumes);
router.post("/albumes", crearAlbum);

module.exports = router;