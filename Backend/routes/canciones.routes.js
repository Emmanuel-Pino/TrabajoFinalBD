const express = require("express");
const {
    listarCanciones,
    crearCancion,
    actualizarCancion, 
    eliminarCancion
} = require("../controllers/canciones.controller");

const upload = require("../middlewares/upload");

const router = express.Router();

// GET - Consultar canciones
router.get("/canciones", listarCanciones);

// POST - Registrar canción
router.post("/canciones", upload.single("audio"), crearCancion);

// PUT - Actualizar canción
router.put("/canciones/:id", upload.single("audio"), actualizarCancion);

// DELETE - Eliminar canción
router.delete("/canciones/:id", eliminarCancion);
module.exports = router;