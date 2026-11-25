
const express = require("express");
const { listarCanciones } = require("../controllers/canciones.controller");

const router = express.Router();

// GET /api/canciones
router.get("/canciones", listarCanciones);

module.exports = router;
