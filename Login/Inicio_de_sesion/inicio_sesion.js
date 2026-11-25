// =====================================================
// INICIO DE SESIÓN: validación del formulario y envío al servidor
// Ruta del backend: POST /api/login  (backend/routes/auth.routes.js)
// =====================================================

// Dirección de la API 
const API_URL = "http://localhost:3000/api";

// protip para no escribir document.getElementById cada vez
const $ = (id) => document.getElementById(id);

// Guardamos el formulario en una variable
const formulario = $("formulario");
const boton = $("boton");

// -----------------------------------------------------
// limpiar(): borra errores y mensajes de la vez anterior
// -----------------------------------------------------
function limpiar() {
  ["correo", "clave"].forEach((campo) => {
    $(campo).classList.remove("invalido");   // quita el borde rojo
    $("e-" + campo).textContent = "";        // borra el texto de error
  });
  $("e-general").textContent = "";   // error general (ej: servidor apagado)
  $("exito").textContent = "";
}

// error(): marca un campo como inválido y muestra el motivo
function error(campo, texto) {
  $(campo).classList.add("invalido");
  $("e-" + campo).textContent = texto;
}

// Evento "submit": se ejecuta al presionar el botón
formulario.addEventListener("submit", async (e) => {   // async: espera la respuesta del servidor
  e.preventDefault();   // evita que la página se recargue
  limpiar();

  // Leemos lo que escribió el usuario
  const correo = $("correo").value.trim();   // trim() quita espacios sobrantes
  const clave  = $("clave").value;

  let todoBien = true;

  // Regla 1: el correo debe tener formato texto@dominio.algo
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    error("correo", "Escribe un correo válido.");
    todoBien = false;
  }

  // Regla 2: la contraseña no puede estar vacía
  if (clave.length === 0) {
    error("clave", "Escribe tu contraseña.");
    todoBien = false;
  }

  // Si algo falló, nos detenemos aquí
  if (!todoBien) return;

  // Enviar los datos al servidor
  boton.disabled = true;               // evita doble clic mientras espera
  boton.textContent = "Entrando...";

  try {
    const respuesta = await fetch(API_URL + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },   // enviamos JSON
      body: JSON.stringify({ correo, clave })
    });
    const datos = await respuesta.json();   // { ok, mensaje, usuario? }

    if (datos.ok) {
      // Guardamos quién inició sesión para usarlo en las otras pantallas.
      // sessionStorage dura mientras la pestaña esté abierta.
      sessionStorage.setItem("usuario", JSON.stringify(datos.usuario));

      $("exito").textContent = "¡Bienvenido, " + datos.usuario.nombre + "!";
      formulario.reset();
      window.location.href = "../../Main/main.html";   // pantalla principal
      return;
    }

    // El servidor rechazó los datos (correo o contraseña incorrectos, etc.)
    $("e-general").textContent = datos.mensaje || "No se pudo iniciar sesión.";

  } catch (err) {
    // No hubo respuesta: el servidor está apagado o la dirección es otra
    $("e-general").textContent = "No se pudo conectar con el servidor.";
  }

  // Si llegamos aquí hubo un error: devolvemos el botón a la normalidad
  boton.disabled = false;
  boton.textContent = "Iniciar sesión";
});