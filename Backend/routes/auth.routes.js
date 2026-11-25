// =====================================================
// RUTAS DE AUTENTICACIÓN
// Solo relaciona cada dirección web con la función que la atiende.
// La lógica está en controllers/auth.controller.js
// =====================================================
const express = require("express");
const { registrar, iniciarSesion } = require("../controllers/auth.controller");

const router = express.Router();

// POST /api/registro  ->  crea un usuario nuevo
// POST /api/login     ->  comprueba correo y contraseña
// (el "/api" lo agrega server.js)
router.post("/registro", registrar);
router.post("/login", iniciarSesion);

module.exports = router;