// =====================================================
// CONTROLADOR DE AUTENTICACIÓN
// =====================================================
const bcrypt = require("bcryptjs");   // encripta contraseñas
const db = require("../config/db");   // conexión a MySQL

// Mismo formato de correo que valida la página
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const HASH_FALSO = bcrypt.hashSync("clave-que-nadie-usa", 10);

// -----------------------------------------------------
// registrar: crea un usuario nuevo
// -----------------------------------------------------
async function registrar(req, res) {


  const datos  = req.body || {};
  const nombre = String(datos.nombre || "").trim();
  const correo = String(datos.correo || "").trim().toLowerCase();
  const clave  = String(datos.clave  || "");


  if (nombre.length < 2 || nombre.length > 50) {
    return res.status(400).json({
      ok: false, campo: "nombre",
      mensaje: "El nombre debe tener entre 2 y 50 caracteres."
    });
  }
  if (!REGEX_CORREO.test(correo) || correo.length > 100) {
    return res.status(400).json({
      ok: false, campo: "correo",
      mensaje: "Escribe un correo válido."
    });
  }
  if (clave.length < 6 || clave.length > 72) {   // 72 = límite de bcrypt
    return res.status(400).json({
      ok: false, campo: "clave",
      mensaje: "La contraseña debe tener entre 6 y 72 caracteres."
    });
  }

  try {
    // Encriptar la contraseña (nunca se guarda tal cual)
    const hash = await bcrypt.hash(clave, 10);

    // Guardar en la base de datos.
    //    Los "?" evitan la inyección SQL: mysql2 escapa los valores.
    const [resultado] = await db.execute(
      "INSERT INTO tbl_usuario (nombre_usu, correo_usu, contrasena_usu) VALUES (?, ?, ?)",
      [nombre, correo, hash]
    );

    //  Responder con el usuario creado (sin la contraseña)
    return res.status(201).json({
      ok: true,
      mensaje: "Cuenta creada.",
      usuario: { id: resultado.insertId, nombre }
    });

  } catch (err) {
    
    if (err.code === "ER_DUP_ENTRY") {
      const texto = err.sqlMessage || "";
      if (texto.includes("correo_usu")) {
        return res.status(409).json({ ok: false, campo: "correo", mensaje: "Ese correo ya está registrado." });
      }
      if (texto.includes("nombre_usu")) {
        return res.status(409).json({ ok: false, campo: "nombre", mensaje: "Ese nombre de usuario ya está en uso." });
      }
    }

   
    console.error("Error en registrar:", err.message);
    return res.status(500).json({ ok: false, mensaje: "Error del servidor. Intenta de nuevo." });
  }
}

// -----------------------------------------------------
// iniciarSesion: inicia sesión con correo y contraseña
// -----------------------------------------------------
async function iniciarSesion(req, res) {

 
  const datos  = req.body || {};
  const correo = String(datos.correo || "").trim().toLowerCase();
  const clave  = String(datos.clave  || "");


  if (!REGEX_CORREO.test(correo) || clave.length === 0) {
    return res.status(400).json({ ok: false, mensaje: "Escribe tu correo y tu contraseña." });
  }

  try {
   
    const [filas] = await db.execute(
      "SELECT id_usuario, nombre_usu, contrasena_usu FROM tbl_usuario WHERE correo_usu = ?",
      [correo]
    );
    const usuario = filas[0];   // undefined si el correo no existe

  
    const coincide = await bcrypt.compare(clave, usuario ? usuario.contrasena_usu : HASH_FALSO);

    
    if (!usuario || !coincide) {
      return res.status(401).json({ ok: false, mensaje: "Correo o contraseña incorrectos." });
    }

    
    return res.json({
      ok: true,
      mensaje: "Bienvenido.",
      usuario: { id: usuario.id_usuario, nombre: usuario.nombre_usu }
    });

  } catch (err) {
    console.error("Error en iniciarSesion:", err.message);
    return res.status(500).json({ ok: false, mensaje: "Error del servidor. Intenta de nuevo." });
  }
}

module.exports = { registrar, iniciarSesion };