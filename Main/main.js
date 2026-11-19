// =====================================================
// PÁGINA PRINCIPAL: saludo, filtros y foros recomendados
// =====================================================

const $ = (id) => document.getElementById(id);

// -----------------------------------------------------
// 1) USUARIO
// Por ahora es un nombre fijo de prueba.
// Más adelante vendrá de la sesión que devuelva el servidor.
// -----------------------------------------------------
const usuario = "PepitoPerea";

$("nombre-lateral").textContent = usuario;   // nombre bajo el avatar
$("nombre-titulo").textContent  = usuario;   // saludo del título

// -----------------------------------------------------
// 2) DATOS FICTICIOS (simulan lo que luego dará la base de datos)
// Cada foro es una comunidad por nicho (RF6).
// -----------------------------------------------------
const foros = [
  { id: 1, nombre: "Country Roads",     genero: "Country", miembros: 1240, descripcion: "Banjos, guitarras y carreteras largas." },
  { id: 2, nombre: "Nashville Nights",  genero: "Country", miembros: 860,  descripcion: "Lo mejor del country moderno y clásico." },
  { id: 3, nombre: "Pop Latino",        genero: "Pop",     miembros: 2310, descripcion: "Hits, estrenos y colaboraciones del momento." },
  { id: 4, nombre: "Synth Pop Club",    genero: "Pop",     miembros: 540,  descripcion: "Sintetizadores y melodías pegajosas." },
  { id: 5, nombre: "Barrio y Rimas",    genero: "Hip Hop", miembros: 1780, descripcion: "Freestyle, letras y beats de todas las escuelas." },
  { id: 6, nombre: "Boom Bap Society",  genero: "Hip Hop", miembros: 690,  descripcion: "Samples, vinilos y rap de la vieja escuela." }
];

// Géneros disponibles para los filtros
const generos = ["Country", "Pop", "Hip Hop"];

// Estado actual de la pantalla
let generoActivo = generos[0];     // filtro seleccionado
let textoBusqueda = "";            // lo escrito en el buscador
const unidos = new Set();          // ids de foros a los que el usuario se unió

// -----------------------------------------------------
// 3) FILTROS (chips)
// -----------------------------------------------------
function dibujarChips() {
  $("chips").innerHTML = "";
  generos.forEach((g) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = g;
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", g === generoActivo);
    b.addEventListener("click", () => {
      generoActivo = g;      // cambia el filtro
      dibujarChips();        // repinta los chips (para marcar el elegido)
      dibujarForos();        // repinta las tarjetas
    });
    $("chips").appendChild(b);
  });
}

// -----------------------------------------------------
// 4) TARJETAS DE FOROS
// Muestra solo los foros del género elegido que coincidan con la búsqueda.
// -----------------------------------------------------
function dibujarForos() {
  const contenedor = $("tarjetas");
  contenedor.innerHTML = "";

  const lista = foros.filter((f) =>
    f.genero === generoActivo &&
    f.nombre.toLowerCase().includes(textoBusqueda)
  );

  if (lista.length === 0) {
    contenedor.innerHTML = '<p class="vacio">No hay foros que coincidan.</p>';
    return;
  }

  lista.forEach((f) => {
    const yaUnido = unidos.has(f.id);

    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta";
    tarjeta.innerHTML = `
      <h3>${f.nombre}</h3>
      <p>${f.descripcion}</p>
      <div class="pie">
        <span>${f.miembros + (yaUnido ? 1 : 0)} miembros</span>
        <button type="button" class="amarillo ${yaUnido ? "unido" : ""}">
          ${yaUnido ? "Salir" : "Unirse"}
        </button>
      </div>`;

    // Botón Unirse / Salir (RF6)
    tarjeta.querySelector("button").addEventListener("click", () => {
      if (unidos.has(f.id)) unidos.delete(f.id);
      else unidos.add(f.id);
      dibujarForos();
    });

    contenedor.appendChild(tarjeta);
  });
}

// -----------------------------------------------------
// 5) BUSCADOR: filtra los foros mientras se escribe
// -----------------------------------------------------
$("buscador").addEventListener("input", (e) => {
  textoBusqueda = e.target.value.trim().toLowerCase();
  dibujarForos();
});

// -----------------------------------------------------
// 6) BOTÓN "New Playlist" (pendiente)
// Más adelante abrirá el formulario para crear una playlist.
// -----------------------------------------------------
$("btn-playlist").addEventListener("click", () => {
  alert("Próximamente: crear una playlist.");
});

// -----------------------------------------------------
// 7) INICIO
// -----------------------------------------------------
dibujarChips();
dibujarForos();