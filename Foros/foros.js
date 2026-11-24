// =====================================================
// FOROS: lista de foros del usuario, búsqueda y creación
// =====================================================

const $ = (id) => document.getElementById(id);

// -----------------------------------------------------
// 1) USUARIO (nombre fijo de prueba, igual que en main.js)
// -----------------------------------------------------
const usuario = "PepitoPerea";
$("nombre-lateral").textContent = usuario;

// -----------------------------------------------------
// 2) DATOS FICTICIOS (luego vendrán de la base de datos)
// Cada foro tiene un nombre y los artistas que se destacan en él.
// -----------------------------------------------------
const foros = [
  { id: 1, nombre: "MMM",       artistas: ["Lana del Rey", "Mon Laferte", "Nathalia Lafourcade"] },
  { id: 2, nombre: "Heartline", artistas: ["Mitski", "DoblePorción", "Buhodermia"] },
  { id: 3, nombre: "Chillhood", artistas: ["Clairo", "Rex Orange County", "Beach House"] }
];

let textoBusqueda = "";   // lo escrito en el buscador

// -----------------------------------------------------
// 3) IMAGEN DEL FORO
// Mientras no haya fotos reales, se dibuja un paisaje con SVG.
// -----------------------------------------------------
function crearImagen() {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 66 66");
  svg.setAttribute("class", "foro-img");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = `
    <rect width="66" height="66" fill="#bfe3f7"/>
    <ellipse cx="22" cy="14" rx="9" ry="5" fill="#fff"/>
    <ellipse cx="30" cy="12" rx="7" ry="5" fill="#fff"/>
    <path d="M0 40 Q22 28 44 38 T66 34 V66 H0 Z" fill="#a8c800"/>
    <path d="M0 50 Q24 40 66 48 V66 H0 Z" fill="#7a9a00"/>`;
  return svg;
}

// -----------------------------------------------------
// 4) DIBUJAR LA LISTA
// Se arma con createElement + textContent (y no con innerHTML)
// para que un nombre escrito por el usuario nunca pueda
// inyectar código en la página.
// -----------------------------------------------------
function dibujarForos() {
  const lista = $("lista");
  lista.innerHTML = "";

  const visibles = foros.filter((f) =>
    f.nombre.toLowerCase().includes(textoBusqueda)
  );

  if (visibles.length === 0) {
    const p = document.createElement("p");
    p.className = "vacio";
    p.textContent = foros.length === 0
      ? "Aún no tienes foros. ¡Crea el primero!"
      : "No hay foros que coincidan.";
    lista.appendChild(p);
    return;
  }

  visibles.forEach((f) => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "foro";
    tarjeta.tabIndex = 0;                          // se puede enfocar con teclado
    tarjeta.setAttribute("role", "button");
    tarjeta.setAttribute("aria-label", "Abrir foro " + f.nombre);

    const nombre = document.createElement("h2");
    nombre.className = "foro-nombre";
    nombre.textContent = f.nombre;

    const pildoras = document.createElement("div");
    pildoras.className = "pildoras";
    f.artistas.slice(0, 3).forEach((a) => {        // máximo 3 artistas
      const span = document.createElement("span");
      span.className = "pildora";
      span.textContent = a;
      span.title = a;                              // nombre completo al pasar el mouse
      pildoras.appendChild(span);
    });

    tarjeta.append(crearImagen(), nombre, pildoras);

    // Abrir el foro (pendiente: página con blog y chat, RF7 y RF8)
    const abrir = () => alert("Próximamente: abrir el foro " + f.nombre);
    tarjeta.addEventListener("click", abrir);
    tarjeta.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(); }
    });

    lista.appendChild(tarjeta);
  });
}

// -----------------------------------------------------
// 5) BUSCADOR
// -----------------------------------------------------
$("buscador").addEventListener("input", (e) => {
  textoBusqueda = e.target.value.trim().toLowerCase();
  dibujarForos();
});

// -----------------------------------------------------
// 6) CREAR UN FORO (ventana emergente)
// -----------------------------------------------------
const dialogo = $("dialogo");
const campoNombre = $("nombre-foro");

function limpiarErrorForo() {
  campoNombre.classList.remove("invalido");
  $("e-nombre-foro").textContent = "";
}

$("btn-crear").addEventListener("click", () => {
  limpiarErrorForo();
  campoNombre.value = "";
  dialogo.showModal();           // abre la ventana
  campoNombre.focus();
});

$("btn-cancelar").addEventListener("click", () => dialogo.close());

$("form-foro").addEventListener("submit", (e) => {
  e.preventDefault();
  limpiarErrorForo();

  const nombre = campoNombre.value.trim();

  // Reglas: entre 2 y 40 caracteres y que no exista ya
  if (nombre.length < 2) {
    campoNombre.classList.add("invalido");
    $("e-nombre-foro").textContent = "Escribe un nombre (mínimo 2 caracteres).";
    return;
  }
  if (foros.some((f) => f.nombre.toLowerCase() === nombre.toLowerCase())) {
    campoNombre.classList.add("invalido");
    $("e-nombre-foro").textContent = "Ya tienes un foro con ese nombre.";
    return;
  }

  // Aquí iría el envío al servidor para guardarlo en la base de datos.
  // Por ahora solo se agrega a la lista en pantalla.
  foros.unshift({ id: Date.now(), nombre, artistas: [] });
  dialogo.close();
  dibujarForos();
});

// -----------------------------------------------------
// 7) INICIO
// -----------------------------------------------------
dibujarForos();