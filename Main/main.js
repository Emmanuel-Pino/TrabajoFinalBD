// =====================================================
// PÁGINA PRINCIPAL: saludo, filtros y foros recomendados
// =====================================================

const $ = (id) => document.getElementById(id);

// -----------------------------------------------------
// 1) USUARIO (sesión)
// El login guardó { id, nombre } en sessionStorage (ver
// inicio_sesion.js). Aquí lo leemos. Si no hay sesión, o el dato
// está dañado, mandamos a la persona de vuelta al login.
// -----------------------------------------------------
const LOGIN_URL = "/Login/Inicio_de_sesion/inicio_sesion.html";

function leerSesion() {
  try {
    const u = JSON.parse(sessionStorage.getItem("usuario"));
    // Comprobamos que tenga la forma esperada
    if (u && Number.isInteger(u.id) && typeof u.nombre === "string") return u;
  } catch (err) { /* JSON dañado: se trata como "sin sesión" */ }
  return null;
}

const usuario = leerSesion();
if (!usuario) {
  window.location.replace(LOGIN_URL);   // replace: no deja esta página en el historial
  throw new Error("Sin sesión");        // detiene el resto del script
}

// textContent (no innerHTML): el nombre nunca se interpreta como código
$("nombre-lateral").textContent = usuario.nombre;   // nombre bajo el avatar
$("nombre-titulo").textContent = usuario.nombre;   // saludo del título

// Cerrar sesión: borra el usuario guardado y vuelve al login
$("cerrar-sesion").addEventListener("click", (e) => {
  e.preventDefault();
  sessionStorage.removeItem("usuario");
  window.location.href = LOGIN_URL;
});

// -----------------------------------------------------
// 2) DATOS FICTICIOS (simulan lo que luego dará la base de datos)
// Cada foro es una comunidad por nicho (RF6).
// -----------------------------------------------------
const foros = [
  { id: 1, nombre: "Country Roads", genero: "Country", miembros: 1240, descripcion: "Banjos, guitarras y carreteras largas." },
  { id: 2, nombre: "Nashville Nights", genero: "Country", miembros: 860, descripcion: "Lo mejor del country moderno y clásico." },
  { id: 3, nombre: "Pop Latino", genero: "Pop", miembros: 2310, descripcion: "Hits, estrenos y colaboraciones del momento." },
  { id: 4, nombre: "Synth Pop Club", genero: "Pop", miembros: 540, descripcion: "Sintetizadores y melodías pegajosas." },
  { id: 5, nombre: "Barrio y Rimas", genero: "Hip Hop", miembros: 1780, descripcion: "Freestyle, letras y beats de todas las escuelas." },
  { id: 6, nombre: "Boom Bap Society", genero: "Hip Hop", miembros: 690, descripcion: "Samples, vinilos y rap de la vieja escuela." }
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
  dibujarCanciones();
});

// -----------------------------------------------------
// 6) BOTÓN "New Playlist" (pendiente)
// Más adelante abrirá el formulario para crear una playlist.
// -----------------------------------------------------
$("btn-playlist").addEventListener("click", () => {
  alert("Próximamente: crear una playlist.");
});
// -----------------------------------------------------
// CANCIONES: consultar datos desde MySQL mediante la API
// -----------------------------------------------------

let canciones = [];

async function cargarCanciones() {
  try {
    const respuesta = await fetch("http://localhost:3000/api/canciones");
    const datos = await respuesta.json();

    if (!respuesta.ok || !datos.ok) {
      throw new Error("Error al consultar canciones");
    }

    canciones = datos.canciones;
    dibujarCanciones();

  } catch (error) {
    console.error(error);
    $("lista-canciones").textContent =
      "No se pudieron cargar las canciones.";
  }
}
function normalizarTexto(texto) {
  return String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function dibujarCanciones() {
  const contenedor = $("lista-canciones");
  contenedor.innerHTML = "";

  const busqueda = normalizarTexto(textoBusqueda);

  const cancionesFiltradas = canciones
    .map((c, index) => ({ c, index }))
    .filter(({ c }) =>
      normalizarTexto(c.titulo_can).includes(busqueda) ||
      normalizarTexto(c.artistas).includes(busqueda) ||
      normalizarTexto(c.album).includes(busqueda)
    );

  if (cancionesFiltradas.length === 0) {
    contenedor.textContent = "No se encontraron canciones.";
    return;
  }

  cancionesFiltradas.forEach(({ c, index }) => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "cancion";

    const informacion = document.createElement("div");

    const titulo = document.createElement("h3");
    titulo.textContent = c.titulo_can;

    const artistas = document.createElement("p");
    artistas.textContent = c.artistas || "Artista desconocido";

    const album = document.createElement("p");
    album.className = "album-cancion";
    album.textContent = c.album;

    const duracion = document.createElement("span");
    duracion.className = "duracion-cancion";
    duracion.textContent = c.duracion_can;

    informacion.append(titulo, artistas);
    tarjeta.append(informacion, album, duracion);

    contenedor.appendChild(tarjeta);
    tarjeta.style.cursor = "pointer";

    tarjeta.addEventListener("click", () => {
      reproducirCancion(index);
    });
  });
}
// -----------------------------------------------------
// REPRODUCTOR DE MÚSICA
// -----------------------------------------------------

const audio = $("audio");
let indiceActual = -1;

audio.volume = 0.75;

async function reproducirCancion(index) {

  if (index < 0 || index >= canciones.length) return;

  indiceActual = index;

  const cancion = canciones[index];

  audio.src = "/" + cancion.ruta_audio_can;

  $("reproductor-titulo").textContent = cancion.titulo_can;
  $("reproductor-artista").textContent = cancion.artistas;

  $("progreso").value = 0;
  $("tiempo-actual").textContent = "0:00";
  $("tiempo-total").textContent = "0:00";

  try {
    await audio.play();
  } catch (error) {
    console.error("Error al reproducir:", error);
  }
}
// Reproducir o pausar
$("btn-reproducir").addEventListener("click", async () => {

  if (canciones.length === 0) return;

  if (indiceActual === -1) {
    await reproducirCancion(0);
    return;
  }

  if (audio.paused) {
    await audio.play().catch(console.error);
  } else {
    audio.pause();
  }
});

// Actualizar el icono del botón
audio.addEventListener("play", () => {
  $("btn-reproducir").textContent = "⏸";
  $("btn-reproducir").setAttribute("aria-label", "Pausar");
});

audio.addEventListener("pause", () => {
  $("btn-reproducir").textContent = "▶";
  $("btn-reproducir").setAttribute("aria-label", "Reproducir");
});

// Siguiente canción
$("btn-siguiente").addEventListener("click", () => {
  if (canciones.length === 0) return;

  const siguiente = (indiceActual + 1) % canciones.length;
  reproducirCancion(siguiente);
});

// Canción anterior
$("btn-anterior").addEventListener("click", () => {
  if (canciones.length === 0) return;

  const anterior = indiceActual <= 0
    ? canciones.length - 1
    : indiceActual - 1;

  reproducirCancion(anterior);
});

// Reproducir automáticamente la siguiente canción
audio.addEventListener("ended", () => {
  $("btn-siguiente").click();
});

// Convertir segundos al formato minutos:segundos
function formatearTiempo(segundos) {
  if (!Number.isFinite(segundos)) return "0:00";

  const minutos = Math.floor(segundos / 60);
  const restantes = Math.floor(segundos % 60);

  return `${minutos}:${String(restantes).padStart(2, "0")}`;
}

// Obtener la duración real del MP3
audio.addEventListener("loadedmetadata", () => {
  $("tiempo-total").textContent = formatearTiempo(audio.duration);
});

// Actualizar el progreso durante la reproducción
audio.addEventListener("timeupdate", () => {
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;

  $("tiempo-actual").textContent = formatearTiempo(audio.currentTime);

  $("progreso").value =
    (audio.currentTime / audio.duration) * 100;
});

// Adelantar o retroceder la canción
$("progreso").addEventListener("input", (e) => {
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;

  audio.currentTime =
    (e.target.value / 100) * audio.duration;
});
// Sincronizar el volumen inicial
$("volumen").value = audio.volume;

// Cambiar el volumen
$("volumen").addEventListener("input", (e) => {
  audio.volume = Number(e.target.value);
});
// -----------------------------------------------------
// MODAL PARA REGISTRAR CANCIONES
// -----------------------------------------------------

const modalCancion = $("modal-cancion");

$("btn-cancion").addEventListener("click", () => {
  modalCancion.showModal();
  modalCancion.scrollTop = 0;
});

$("cerrar-modal").addEventListener("click", () => {
  modalCancion.close();
});

$("cancelar-cancion").addEventListener("click", () => {
  modalCancion.close();
});

// -----------------------------------------------------
// OBTENER DURACIÓN DEL ARCHIVO MP3
// -----------------------------------------------------

$("audio-can").addEventListener("change", (e) => {

  const archivo = e.target.files[0];

  $("duracion-can").value = "";

  if (!archivo) return;

  // Validar extensión
  if (!archivo.name.toLowerCase().endsWith(".mp3")) {
    alert("Solo se permiten archivos MP3.");
    e.target.value = "";
    return;
  }

  // Validar tamaño máximo
  if (archivo.size > 20 * 1024 * 1024) {
    alert("El archivo no puede superar los 20 MB.");
    e.target.value = "";
    return;
  }

  const audioTemporal = new Audio();
  const url = URL.createObjectURL(archivo);

  audioTemporal.preload = "metadata";

  audioTemporal.addEventListener("loadedmetadata", () => {

    if (e.target.files[0] === archivo) {
      if (Number.isFinite(audioTemporal.duration) &&
        audioTemporal.duration > 0) {

        const segundos = Math.floor(audioTemporal.duration);

        $("duracion-can").value = new Date(segundos * 1000)
          .toISOString()
          .slice(11, 19);

      } else {
        alert("No se pudo obtener la duración.");
        e.target.value = "";
      }
    }

    URL.revokeObjectURL(url);
  });

  audioTemporal.addEventListener("error", () => {
    URL.revokeObjectURL(url);

    if (e.target.files[0] === archivo) {
      alert("No se pudo leer el archivo MP3.");
      e.target.value = "";
    }
  });

  audioTemporal.src = url;
});
// -----------------------------------------------------
// AUTOCOMPLETADO DE ARTISTAS
// -----------------------------------------------------

let temporizadorArtistas;
let artistasSeleccionados = [];

$("buscar-artista").addEventListener("input", () => {

  clearTimeout(temporizadorArtistas);

  const busqueda = $("buscar-artista").value.trim();

  $("resultados-artistas").innerHTML = "";

  if (busqueda.length < 2) return;

  temporizadorArtistas = setTimeout(() => {
    buscarArtistas(busqueda);
  }, 300);
});

async function buscarArtistas(busqueda) {
  try {
    const respuesta = await fetch(
      `/api/artistas/buscar?q=${encodeURIComponent(busqueda)}`
    );

    const datos = await respuesta.json();

    if (!respuesta.ok || !datos.ok) {
      throw new Error("Error al buscar artistas");
    }

    // Ignorar respuestas de búsquedas anteriores
    if ($("buscar-artista").value.trim() !== busqueda) return;

    const contenedor = $("resultados-artistas");

    contenedor.innerHTML = "";

    datos.artistas.forEach((artista) => {

      const boton = document.createElement("button");

      boton.type = "button";
      boton.className = "opcion-resultado";
      boton.textContent = artista.nombre_art;

      boton.addEventListener("click", () => {
        seleccionarArtista(artista);
      });

      contenedor.appendChild(boton);
    });
const existeArtista = datos.artistas.some(
    artista => normalizarTexto(artista.nombre_art) ===
               normalizarTexto(busqueda)
);

if (!existeArtista) {

    const botonCrear = document.createElement("button");

    botonCrear.type = "button";
    botonCrear.className = "opcion-resultado crear-resultado";
    botonCrear.textContent = `+ Registrar artista: ${busqueda}`;

    botonCrear.addEventListener("click", () => {
        registrarArtista(busqueda);
    });

    contenedor.appendChild(botonCrear);
}
  } catch (error) {
    console.error(error);
  }
}
async function registrarArtista(nombre) {

    try {

        const respuesta = await fetch("/api/artistas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nombre_art: nombre
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.ok) {
            alert(datos.mensaje || "No se pudo registrar el artista");
            return;
        }

        seleccionarArtista(datos.artista);

    } catch (error) {

        console.error(error);
        alert("Error al registrar el artista");

    }
}
function seleccionarArtista(artista) {

  const existe = artistasSeleccionados.some(
    a => a.id_artista === artista.id_artista
  );

  if (existe) {
    alert("Este artista ya está seleccionado.");
    return;
  }

  artistasSeleccionados.push(artista);

  $("buscar-artista").value = "";
  $("resultados-artistas").innerHTML = "";

  dibujarArtistasSeleccionados();
}

function dibujarArtistasSeleccionados() {

  const contenedor = $("artistas-seleccionados");
  contenedor.innerHTML = "";

  artistasSeleccionados.forEach((artista, index) => {

    const etiqueta = document.createElement("div");
    etiqueta.className = "artista-seleccionado";

    const nombre = document.createElement("span");
    nombre.textContent = artista.nombre_art;

    if (index === 0) {
      nombre.textContent += " (Principal)";
    }

    const boton = document.createElement("button");
    boton.type = "button";
    boton.textContent = "✕";

    boton.addEventListener("click", () => {

      artistasSeleccionados.splice(index, 1);

      if (index === 0) {
        $("buscar-album").value = "";
        $("album-can").value = "";
        $("resultados-albumes").innerHTML = "";
      }

      dibujarArtistasSeleccionados();
    });

    etiqueta.append(nombre, boton);
    contenedor.appendChild(etiqueta);
  });

  $("buscar-album").disabled = artistasSeleccionados.length === 0;

  $("buscar-album").placeholder = artistasSeleccionados.length > 0
    ? "Buscar o registrar álbum..."
    : "Selecciona primero un artista";
}
// -----------------------------------------------------
// AUTOCOMPLETADO DE ÁLBUMES
// -----------------------------------------------------

let temporizadorAlbumes;

$("buscar-album").addEventListener("input", () => {

    clearTimeout(temporizadorAlbumes);

    $("album-can").value = "";
    $("resultados-albumes").innerHTML = "";

    if (artistasSeleccionados.length === 0) return;

    const busqueda = $("buscar-album").value.trim();
    const idArtista = artistasSeleccionados[0].id_artista;

    temporizadorAlbumes = setTimeout(() => {
        buscarAlbumes(busqueda, idArtista);
    }, 300);
});
async function buscarAlbumes(busqueda, idArtista) {

    try {

        const respuesta = await fetch(
            `/api/albumes/buscar?id_artista=${idArtista}&q=${encodeURIComponent(busqueda)}`
        );

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.ok) {
            throw new Error("Error al buscar álbumes");
        }

        // Evitar mostrar resultados de búsquedas anteriores
        if (
            $("buscar-album").value.trim() !== busqueda ||
            artistasSeleccionados[0]?.id_artista !== idArtista ||
            $("album-can").value !== ""
        ) return;

        const contenedor = $("resultados-albumes");

        contenedor.innerHTML = "";

        datos.albumes.forEach((album) => {

            const boton = document.createElement("button");

            boton.type = "button";
            boton.className = "opcion-resultado";
            boton.textContent = album.titulo_alb;

            boton.addEventListener("click", () => {
                seleccionarAlbum(album);
            });

            contenedor.appendChild(boton);
        });

    } catch (error) {
        console.error(error);
    }
}
function seleccionarAlbum(album) {

    $("buscar-album").value = album.titulo_alb;

    $("album-can").value = album.id_album;

    $("resultados-albumes").innerHTML = "";
}
$("buscar-album").addEventListener("focus", () => {

    if (artistasSeleccionados.length === 0) return;
    if ($("album-can").value !== "") return;

    buscarAlbumes(
        $("buscar-album").value.trim(),
        artistasSeleccionados[0].id_artista
    );
});
// -----------------------------------------------------
// 7) INICIO
// -----------------------------------------------------
dibujarChips();
cargarCanciones();
dibujarForos();