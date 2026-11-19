// =====================================================
// INICIO DE SESIÓN: validación del formulario
// =====================================================

// Atajo para no escribir document.getElementById cada vez
const $ = (id) => document.getElementById(id);

// Guardamos el formulario en una variable
const formulario = $("formulario");

// -----------------------------------------------------
// limpiar(): borra errores y mensajes de la vez anterior
// -----------------------------------------------------
function limpiar() {
  ["correo", "clave"].forEach((campo) => {
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
  const correo = $("correo").value.trim();   // trim() quita espacios sobrantes
  const clave  = $("clave").value;

  let todoBien = true;

  // Regla 1: el correo debe tener formato texto@dominio.algo
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    error("correo", "Escribe un correo válido.");
    todoBien = false;
  }

  // Regla 2: la contraseña no puede estar vacía
  // (aquí no exigimos 6 caracteres: eso lo decide el backend al comparar)
  if (clave.length === 0) {
    error("clave", "Escribe tu contraseña.");
    todoBien = false;
  }

  // Si algo falló, nos detenemos aquí
  if (!todoBien) return;

  // Aquí iría la conexión con el backend, por ejemplo con fetch(),
  // para comprobar que el correo y la contraseña son correctos.
  // Por ahora solo mostramos un mensaje de éxito.
  $("exito").textContent = "¡Bienvenido de nuevo!";
  formulario.reset();   // vacía los campos
});