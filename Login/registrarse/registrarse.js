// =====================================================
// REGISTRO: validación del formulario
// =====================================================

// Atajo para no escribir document.getElementById cada vez
const $ = (id) => document.getElementById(id);

// Guardamos el formulario en una variable
const formulario = $("formulario");

// -----------------------------------------------------
// limpiar(): borra errores y mensajes de la vez anterior
// -----------------------------------------------------
function limpiar() {
  ["nombre", "correo", "clave"].forEach((campo) => {
    $(campo).classList.remove("invalido");   // quita el borde rojo
    $("e-" + campo).textContent = "";        // borra el texto de error
  });
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
formulario.addEventListener("submit", (e) => {
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

  // Aquí iría la conexión con el backend, por ejemplo con fetch().
  // Por ahora solo mostramos un mensaje de éxito.
  $("exito").textContent = "¡Cuenta creada, " + nombre + "!";
  formulario.reset();   // vacía los campos
});