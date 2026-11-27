// =====================================================
// REGISTRO: validación del formulario y envío al servidor
// =====================================================

// Dirección de la API (el servidor debe estar encendido con npm start)
const API_URL = "http://localhost:3000/api";

// Atajo para no escribir document.getElementById cada vez
const $ = (id) => document.getElementById(id);

// Guardamos el formulario en una variable
const formulario = $("formulario");
const boton = $("boton");

// -----------------------------------------------------
// limpiar(): borra errores y mensajes de la vez anterior
// -----------------------------------------------------
function limpiar() {
  ["nombre", "correo", "clave"].forEach((campo) => {
    $(campo).classList.remove("invalido");   // quita el borde rojo
    $("e-" + campo).textContent = "";        // borra el texto de error
  });
  $("e-general").textContent = "";   // error general (ej: servidor apagado)
  $("exito").textContent = "";
}

// -----------------------------------------------------
// error(): marca un campo como inválido y muestra el motivo
// -----------------------------------------------------
function error(campo, texto) {
  $(campo).classList.add("invalido");
  $("e-" + campo).textContent = texto;
}

// -----------------------------------------------------
// Evento "submit": se ejecuta al presionar el botón
// -----------------------------------------------------
formulario.addEventListener("submit", async (e) => {   // async: espera la respuesta del servidor
  e.preventDefault();   // evita que la página se recargue
  limpiar();

  // Leemos lo que escribió el usuario
  const nombre = $("nombre").value.trim();   // trim() quita espacios sobrantes
  const correo = $("correo").value.trim();
  const clave  = $("clave").value;

  let todoBien = true;

  // Regla 1: el nombre debe tener al menos 2 caracteres
  if (nombre.length < 2) {
    error("nombre", "Escribe tu nombre.");
    todoBien = false;
  }

  // Regla 2: el correo debe tener formato texto@dominio.algo
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    error("correo", "Escribe un correo válido.");
    todoBien = false;
  }

  // Regla 3: la contraseña debe tener mínimo 6 caracteres
  if (clave.length < 6) {
    error("clave", "Mínimo 6 caracteres.");
    todoBien = false;
  }

  // Si algo falló, nos detenemos aquí
  if (!todoBien) return;

  // ---------------------------------------------------
  // Enviar los datos al servidor
  // ---------------------------------------------------
  boton.disabled = true;               // evita doble clic mientras espera
  boton.textContent = "Creando...";

  try {
    const respuesta = await fetch(API_URL + "/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },   // enviamos JSON
      body: JSON.stringify({ nombre, correo, clave })
    });
    const datos = await respuesta.json();   // { ok, mensaje, campo?, usuario? }

    if (datos.ok) {
      // Todo salió bien: avisamos y llevamos al inicio de sesión
      $("exito").textContent = "¡Cuenta creada, " + nombre + "! Redirigiendo...";
      formulario.reset();
      setTimeout(() => {
        window.location.href = "/Login/Inicio_de_sesion/inicio_sesion.html";   // redirige a la pantalla de inicio de sesión
      }, 1500);
      return;
    }

    // El servidor rechazó los datos: "campo" dice dónde mostrar el error
    if (datos.campo) error(datos.campo, datos.mensaje);
    else $("e-general").textContent = datos.mensaje || "No se pudo crear la cuenta.";

  } catch (err) {
    // No hubo respuesta: el servidor está apagado o la dirección es otra
    $("e-general").textContent = "No se pudo conectar con el servidor.";
  }

  // Si llegamos aquí hubo un error: devolvemos el botón a la normalidad
  boton.disabled = false;
  boton.textContent = "Registrarse";
});