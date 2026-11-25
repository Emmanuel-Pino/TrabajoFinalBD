// =====================================================
// CONTROLADOR DE AUTENTICACIÓN
// Aquí está la lógica de registro (RF1) y la encriptación (RNF4).
// Tabla usada: tbl_usuario
// =====================================================
const bcrypt = require("bcryptjs");   // encripta contraseñas
const db = require("../config/db");   // conexión a MySQL

// Mismo formato de correo que valida la página
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Hash de mentira, solo para el login: si el correo no existe, igual
// hacemos una comparación con bcrypt. Así la respuesta tarda lo mismo
// exista o no el correo, y nadie puede descubrir qué correos están registrados.
const HASH_FALSO = bcrypt.hashSync("clave-que-nadie-usa", 10);

// -----------------------------------------------------
// registrar: crea un usuario nuevo
// Recibe en el cuerpo de la petición: { nombre, correo, clave }
// Responde siempre con { ok, mensaje, campo? }
//   campo: indica en cuál campo de la página mostrar el error
// -----------------------------------------------------
async function registrar(req, res) {

  // 1) Leer los datos (String() evita fallos si llega algo raro).
  //    "req.body || {}": si la petición llega sin cuerpo, req.body es undefined.
  const datos  = req.body || {};
  const nombre = String(datos.nombre || "").trim();
  const correo = String(datos.correo || "").trim().toLowerCase();
  const clave  = String(datos.clave  || "");

  // 2) Validar. El servidor valida SIEMPRE, aunque la página ya lo haya
  //    hecho, porque cualquiera puede saltarse el JavaScript del navegador.
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
    // 3) Encriptar la contraseña (nunca se guarda tal cual)
    const hash = await bcrypt.hash(clave, 10);

    // 4) Guardar en la base de datos.
    //    Los "?" evitan la inyección SQL: mysql2 escapa los valores.
    const [resultado] = await db.execute(
      "INSERT INTO tbl_usuario (nombre_usu, correo_usu, contrasena_usu) VALUES (?, ?, ?)",
      [nombre, correo, hash]
    );

    // 5) Responder con el usuario creado (sin la contraseña)
    return res.status(201).json({
      ok: true,
      mensaje: "Cuenta creada.",
      usuario: { id: resultado.insertId, nombre }
    });

  } catch (err) {
    // nombre_usu y correo_usu son UNIQUE: si ya existe, MySQL avisa.
    // El mensaje del error dice cuál de los dos se repitió.
    if (err.code === "ER_DUP_ENTRY") {
      const texto = err.sqlMessage || "";
      if (texto.includes("correo_usu")) {
        return res.status(409).json({ ok: false, campo: "correo", mensaje: "Ese correo ya está registrado." });
      }
      if (texto.includes("nombre_usu")) {
        return res.status(409).json({ ok: false, campo: "nombre", mensaje: "Ese nombre de usuario ya está en uso." });
      }
    }

    // Cualquier otro error: lo vemos en la terminal, y al usuario
    // le mostramos un mensaje general (sin datos internos).
    console.error("Error en registrar:", err.message);
    return res.status(500).json({ ok: false, mensaje: "Error del servidor. Intenta de nuevo." });
  }
}

// -----------------------------------------------------
// iniciarSesion: comprueba correo y contraseña
// Recibe en el cuerpo de la petición: { correo, clave }
// Responde { ok, mensaje, usuario? }
// -----------------------------------------------------
async function iniciarSesion(req, res) {

  // 1) Leer los datos (req.body puede ser undefined si no llega cuerpo)
  const datos  = req.body || {};
  const correo = String(datos.correo || "").trim().toLowerCase();
  const clave  = String(datos.clave  || "");

  // 2) Validar lo básico
  if (!REGEX_CORREO.test(correo) || clave.length === 0) {
    return res.status(400).json({ ok: false, mensaje: "Escribe tu correo y tu contraseña." });
  }

  try {
    // 3) Buscar al usuario por su correo
    const [filas] = await db.execute(
      "SELECT id_usuario, nombre_usu, contrasena_usu FROM tbl_usuario WHERE correo_usu = ?",
      [correo]
    );
    const usuario = filas[0];   // undefined si el correo no existe

    // 4) Comparar la contraseña escrita con el hash guardado.
    //    Si no hay usuario, se compara contra el hash falso (ver arriba).
    const coincide = await bcrypt.compare(clave, usuario ? usuario.contrasena_usu : HASH_FALSO);

    // 5) Mismo mensaje si falla el correo o la contraseña: no revela cuál fue
    if (!usuario || !coincide) {
      return res.status(401).json({ ok: false, mensaje: "Correo o contraseña incorrectos." });
    }

    // 6) Todo bien: devolvemos los datos del usuario (sin la contraseña)
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