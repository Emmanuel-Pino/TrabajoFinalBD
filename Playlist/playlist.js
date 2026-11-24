// =====================================================
// PLAYLISTS: lista de playlists del usuario y búsqueda
// (maqueta: aún sin crear ni explorar playlists)
// =====================================================

const $ = (id) => document.getElementById(id);

// -----------------------------------------------------
// 1) USUARIO (nombre fijo de prueba, igual que en las otras pantallas)
// -----------------------------------------------------
const usuario = "PepitoPerea";
$("nombre-lateral").textContent = usuario;

// -----------------------------------------------------
// 2) DATOS FICTICIOS (luego vendrán de la base de datos)
// Cada playlist tiene un nombre y sus etiquetas.
// Las etiquetas corresponden a tbl_playlist_etiqueta.
// "activa" decide si la etiqueta se ve resaltada en rosa.
// -----------------------------------------------------
const playlists = [
  { id: 1, nombre: "MMM", etiquetas: [
      { texto: "Country", activa: true },
      { texto: "Pop",     activa: false },
      { texto: "Hip Hop", activa: false } ] },
  { id: 2, nombre: "Heartline", etiquetas: [
      { texto: "Rock",       activa: true },
      { texto: "Reggae",     activa: true },
      { texto: "Pop Latino", activa: true } ] },
  { id: 3, nombre: "Chillhood", etiquetas: [
      { texto: "Chill",   activa: true },
      { texto: "Estudiar", activa: true },
      { texto: "Lo-fi",   activa: false } ] }
];

let textoBusqueda = "";   // lo escrito en el buscador

// -----------------------------------------------------
// 3) IMAGEN DE LA PLAYLIST
// Mientras no haya portadas reales, se dibuja un paisaje con SVG.
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
// Se arma con createElement + textContent (no innerHTML) para que
// un texto escrito por el usuario nunca pueda inyectar código.
// -----------------------------------------------------
function dibujarPlaylists() {
  const lista = $("lista");
  lista.innerHTML = "";

  const visibles = playlists.filter((p) =>
    p.nombre.toLowerCase().includes(textoBusqueda)
  );

  if (visibles.length === 0) {
    const p = document.createElement("p");
    p.className = "vacio";
    p.textContent = playlists.length === 0
      ? "Aún no tienes playlists."
      : "No hay playlists que coincidan.";
    lista.appendChild(p);
    return;
  }

  visibles.forEach((pl) => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "foro";                 // misma tarjeta que en Foros
    tarjeta.tabIndex = 0;                       // se puede enfocar con teclado
    tarjeta.setAttribute("role", "button");
    tarjeta.setAttribute("aria-label", "Abrir playlist " + pl.nombre);

    const nombre = document.createElement("h2");
    nombre.className = "foro-nombre";
    nombre.textContent = pl.nombre;

    const etiquetas = document.createElement("div");
    etiquetas.className = "pildoras";
    pl.etiquetas.slice(0, 3).forEach((e) => {   // máximo 3 etiquetas
      const span = document.createElement("span");
      span.className = "pildora" + (e.activa ? " activa" : "");
      span.textContent = e.texto;
      etiquetas.appendChild(span);
    });

    tarjeta.append(crearImagen(), nombre, etiquetas);

    // Abrir la playlist (pendiente: pantalla con sus canciones)
    const abrir = () => alert("Próximamente: abrir la playlist " + pl.nombre);
    tarjeta.addEventListener("click", abrir);
    tarjeta.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); abrir(); }
    });

    lista.appendChild(tarjeta);
  });
}

// -----------------------------------------------------
// 5) BUSCADOR
// -----------------------------------------------------
$("buscador").addEventListener("input", (e) => {
  textoBusqueda = e.target.value.trim().toLowerCase();
  dibujarPlaylists();
});

// -----------------------------------------------------
// 6) BOTONES (pendientes)
// "New Playlist" y "Explorar Playlist" se harán más adelante.
// -----------------------------------------------------
$("btn-nueva").addEventListener("click", () => {
  alert("Próximamente: crear una playlist.");
});
$("btn-explorar").addEventListener("click", () => {
  alert("Próximamente: explorar playlists.");
});

// -----------------------------------------------------
// 7) INICIO
// -----------------------------------------------------
dibujarPlaylists();