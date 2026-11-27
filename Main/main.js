// =====================================================
// PÁGINA PRINCIPAL: saludo, filtros y foros recomendados
// =====================================================

const $ = (id) => document.getElementById(id);

// -----------------------------------------------------
// 1) USUARIO (sesión)
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
// 2) COMUNIDADES REALES DE MONGODB
// -----------------------------------------------------

let foros = [];

let generos = ["Todos"];

let generoActivo = "Todos";

let textoBusqueda = "";

let uniendoComunidad = false;

async function cargarForos() {

    try {

        const respuesta = await fetch("/api/comunidades");

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.ok) {
            throw new Error(
                datos.mensaje || "Error al consultar comunidades"
            );
        }

        foros = datos.comunidades;

        // Obtener los géneros existentes sin repetirlos

        const generosUnicos = new Map();

        foros.forEach(foro => {

            foro.generos.forEach(genero => {

                const clave = normalizarTexto(genero);

                if (clave !== "todos" && !generosUnicos.has(clave)) {
                    generosUnicos.set(clave, genero);
                }
            });
        });

        generos = [
            "Todos",
            ...Array.from(generosUnicos.values())
                .sort((a, b) => a.localeCompare(b))
        ];

        if (!generos.includes(generoActivo)) {
            generoActivo = "Todos";
        }

        dibujarChips();

        dibujarForos();

    } catch (error) {

        console.error(error);

        foros = [];

        $("tarjetas").textContent =
            "No se pudieron cargar las comunidades.";
    }
}

// -----------------------------------------------------
// 3) FILTROS POR GÉNERO
// -----------------------------------------------------

function dibujarChips() {

    const contenedor = $("chips");

    contenedor.replaceChildren();

    generos.forEach(genero => {

        const boton = document.createElement("button");

        boton.type = "button";

        boton.className = "chip";

        boton.textContent = genero;

        boton.setAttribute("role", "tab");

        boton.setAttribute(
            "aria-selected",
            genero === generoActivo
        );

        boton.addEventListener("click", () => {

            generoActivo = genero;

            dibujarChips();

            dibujarForos();
        });

        contenedor.appendChild(boton);
    });
}

// -----------------------------------------------------
// 4) TARJETAS DE COMUNIDADES
// -----------------------------------------------------

function dibujarForos() {

    const contenedor = $("tarjetas");

    contenedor.replaceChildren();

    const busqueda = normalizarTexto(textoBusqueda);

    const lista = foros.filter(foro => {

        const coincideGenero =
            generoActivo === "Todos" ||
            foro.generos.some(genero =>
                normalizarTexto(genero) ===
                normalizarTexto(generoActivo)
            );

        const contenido = [
            foro.nombre,
            foro.descripcion,
            ...foro.generos,
            ...foro.etiquetas
        ].join(" ");

        const coincideBusqueda =
            normalizarTexto(contenido).includes(busqueda);

        return coincideGenero && coincideBusqueda;
    });

    if (lista.length === 0) {

        const mensaje = document.createElement("p");

        mensaje.className = "vacio";

        mensaje.textContent =
            "No hay comunidades que coincidan.";

        contenedor.appendChild(mensaje);

        return;
    }

    lista.forEach(foro => {

        const yaUnido = foro.miembros.includes(usuario.id);

        const tarjeta = document.createElement("article");

        tarjeta.className = "tarjeta";

        // Nombre

        const nombre = document.createElement("h3");

        nombre.textContent = foro.nombre;

        // Descripción

        const descripcion = document.createElement("p");

        descripcion.textContent = foro.descripcion;

        // Géneros musicales

        const generosForo = document.createElement("p");

        generosForo.textContent = foro.generos.join(" · ");

        // Pie de tarjeta

        const pie = document.createElement("div");

        pie.className = "pie";

        const miembros = document.createElement("span");

        const cantidad = foro.miembros.length;

        miembros.textContent =
            cantidad + (cantidad === 1 ? " miembro" : " miembros");

        const boton = document.createElement("button");

        boton.type = "button";

        boton.className = "amarillo";

        boton.textContent = yaUnido ? "Entrar" : "Unirse";

        boton.addEventListener("click", () => {

            if (yaUnido) {

                window.location.href =
                    "/Foros/foros.html?id=" +
                    encodeURIComponent(foro._id);

            } else {

                unirseForo(foro._id, boton);
            }
        });

        pie.append(miembros, boton);

        tarjeta.append(
            nombre,
            descripcion,
            generosForo,
            pie
        );

        contenedor.appendChild(tarjeta);
    });
}

// -----------------------------------------------------
// UNIRSE A UNA COMUNIDAD DESDE MAIN
// -----------------------------------------------------

async function unirseForo(id, boton) {

    if (uniendoComunidad) return;

    uniendoComunidad = true;

    boton.disabled = true;

    try {

        const respuesta = await fetch(
            `/api/comunidades/${id}/unirse`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    id_usuario: usuario.id
                })
            }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.ok) {

            throw new Error(
                datos.mensaje || "No se pudo unir a la comunidad"
            );
        }

        await cargarForos();

        alert(datos.mensaje);

    } catch (error) {

        console.error(error);

        alert(error.message);

    } finally {

        uniendoComunidad = false;

        boton.disabled = false;
    }
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

    window.location.href = "/Playlist/playlist.html";

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

    const idActual = canciones[indiceActual]?.id_cancion;

    canciones = datos.canciones;

    indiceActual = canciones.findIndex(
      c => c.id_cancion === idActual
    );

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
// Comprobar si la canción pertenece al usuario conectado

function esPropietarioCancion(cancion) {

    return cancion.id_usuario === usuario.id;
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
    album.textContent = c.album || "Sencillo";

    const duracion = document.createElement("span");
    duracion.className = "duracion-cancion";
    duracion.textContent = c.duracion_can;

    
const acciones = document.createElement("div");

acciones.className = "acciones-cancion";

// Mostrar acciones únicamente al propietario

if (esPropietarioCancion(c)) {

    // Botón editar

    const botonEditar = document.createElement("button");

    botonEditar.type = "button";
    botonEditar.className = "btn-editar-cancion";
    botonEditar.textContent = "✎";
    botonEditar.title = "Editar canción";

    botonEditar.addEventListener("click", (e) => {

        e.stopPropagation();

        editarCancion(c.id_cancion);
    });

    // Botón eliminar

    const botonEliminar = document.createElement("button");

    botonEliminar.type = "button";
    botonEliminar.className = "btn-eliminar-cancion";
    botonEliminar.textContent = "✕";
    botonEliminar.title = "Eliminar canción";

    botonEliminar.addEventListener("click", (e) => {

        e.stopPropagation();

        eliminarCancion(c.id_cancion);
    });

    acciones.append(botonEditar, botonEliminar);
}


    informacion.append(titulo, artistas);
    tarjeta.append(informacion, album, duracion, acciones);

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
let idCancionEditar = null;
let duracionOriginal = "";
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

  $("duracion-can").value = duracionOriginal;

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
    const existeAlbum = datos.albumes.some(
      album => normalizarTexto(album.titulo_alb) ===
        normalizarTexto(busqueda)
    );

    if (busqueda.length > 0 && !existeAlbum) {

      const botonCrear = document.createElement("button");

      botonCrear.type = "button";
      botonCrear.className = "opcion-resultado crear-resultado";
      botonCrear.textContent = `+ Registrar álbum: ${busqueda}`;

      botonCrear.addEventListener("click", () => {
        registrarAlbum(busqueda, idArtista);
      });

      contenedor.appendChild(botonCrear);
    }
  } catch (error) {
    console.error(error);
  }
}
function seleccionarAlbum(album) {

  $("buscar-album").value = album.titulo_alb;

  $("album-can").value = album.id_album;

  $("resultados-albumes").innerHTML = "";
}
async function registrarAlbum(titulo, idArtista) {

  try {

    const respuesta = await fetch("/api/albumes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        titulo_alb: titulo,
        id_artista: idArtista
      })
    });

    const datos = await respuesta.json();

    if (!respuesta.ok || !datos.ok) {
      alert(datos.mensaje || "No se pudo registrar el álbum");
      return;
    }

    // Verificar que el artista principal no haya cambiado
    if (artistasSeleccionados[0]?.id_artista === idArtista) {
      seleccionarAlbum(datos.album);
    }

  } catch (error) {

    console.error(error);
    alert("Error al registrar el álbum");

  }
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
// REGISTRAR CANCIONES
// -----------------------------------------------------

$("form-cancion").addEventListener("submit", async (e) => {

  e.preventDefault();

  if (artistasSeleccionados.length === 0) {
    alert("Debes seleccionar al menos un artista.");
    return;
  }

  if ($("buscar-album").value.trim() !== "" &&
    $("album-can").value === "") {

    alert("Debes seleccionar o registrar el álbum.");
    return;
  }

  if (!$("duracion-can").value) {
    alert("No se ha obtenido la duración del MP3.");
    return;
  }

  const formulario = e.target;
  const formData = new FormData(formulario);
  formData.set("id_usuario", usuario.id);

  formData.set(
    "artistas",
    JSON.stringify(
      artistasSeleccionados.map(a => a.id_artista)
    )
  );

  const botonGuardar = formulario.querySelector(
    'button[type="submit"]'
  );

  botonGuardar.disabled = true;

  try {

    const editando = idCancionEditar !== null;

    const url = editando
      ? `/api/canciones/${idCancionEditar}`
      : "/api/canciones";

    const respuesta = await fetch(url, {
      method: editando ? "PUT" : "POST",
      body: formData
    });

    const datos = await respuesta.json();

    if (!respuesta.ok || !datos.ok) {
      throw new Error(
        datos.mensaje || "No se pudo registrar la canción"
      );
    }

    alert(
      editando
        ? "Canción actualizada correctamente."
        : "Canción registrada correctamente."
    );

    limpiarFormularioCancion();
    modalCancion.close();

    await cargarCanciones();

  } catch (error) {

    console.error(error);
    alert(error.message);

  } finally {

    botonGuardar.disabled = false;

  }
});
function limpiarFormularioCancion() {
  idCancionEditar = null;
  duracionOriginal = "";

  $("titulo-modal-cancion").textContent = "AÑADIR CANCIÓN";
  $("guardar-cancion").textContent = "Guardar canción";
  $("audio-can").required = true;
  $("form-cancion").reset();

  clearTimeout(temporizadorArtistas);
  clearTimeout(temporizadorAlbumes);

  artistasSeleccionados = [];

  $("duracion-can").value = "";
  $("album-can").value = "";
  $("buscar-artista").value = "";
  $("buscar-album").value = "";

  $("resultados-artistas").innerHTML = "";
  $("resultados-albumes").innerHTML = "";

  dibujarArtistasSeleccionados();
}
modalCancion.addEventListener("close", () => {
  limpiarFormularioCancion();
});
// -----------------------------------------------------
// ELIMINAR CANCIONES
// -----------------------------------------------------

async function eliminarCancion(id) {

  const cancion = canciones.find(c => c.id_cancion === id);

  if (!cancion) return;
if (!esPropietarioCancion(cancion)) {

    alert("No tienes permisos para eliminar esta canción.");

    return;
}
  const confirmar = confirm(
    `¿Estás seguro de eliminar "${cancion.titulo_can}"?`
  );

  if (!confirmar) return;

  try {

    const respuesta = await fetch(

    `/api/canciones/${id}?id_usuario=${usuario.id}`,

    {
        method: "DELETE"
    }
);

    const datos = await respuesta.json();

    if (!respuesta.ok || !datos.ok) {
      throw new Error(
        datos.mensaje || "No se pudo eliminar la canción"
      );
    }

    // Detener el reproductor si se elimina la canción actual
    if (canciones[indiceActual]?.id_cancion === id) {

      audio.pause();
      audio.removeAttribute("src");
      audio.load();

      indiceActual = -1;

      $("reproductor-titulo").textContent = "Sin canción";
      $("reproductor-artista").textContent = "";
      $("progreso").value = 0;
      $("tiempo-actual").textContent = "0:00";
      $("tiempo-total").textContent = "0:00";
    }

    await cargarCanciones();

    alert("Canción eliminada correctamente.");

  } catch (error) {

    console.error(error);
    alert(error.message);

  }
}
// -----------------------------------------------------
// EDITAR CANCIONES
// -----------------------------------------------------

async function editarCancion(id) {

  const cancion = canciones.find(c => c.id_cancion === id);

  if (!cancion) return;
  if (!esPropietarioCancion(cancion)) {

    alert("No tienes permisos para editar esta canción.");

    return;
}

  try {

    const respuesta = await fetch("/api/artistas");
    const datos = await respuesta.json();

    if (!respuesta.ok || !datos.ok) {
      throw new Error("No se pudieron consultar los artistas");
    }

    limpiarFormularioCancion();

    idCancionEditar = id;
    duracionOriginal = cancion.duracion_can;

    $("titulo-modal-cancion").textContent = "EDITAR CANCIÓN";
    $("guardar-cancion").textContent = "Actualizar canción";

    $("titulo-can").value = cancion.titulo_can;
    $("duracion-can").value = cancion.duracion_can;

    // El MP3 es opcional al editar
    $("audio-can").required = false;

    // Recuperar los artistas asociados
    const idsArtistas = String(cancion.ids_artistas || "")
      .split(",")
      .filter(Boolean)
      .map(Number);

    artistasSeleccionados = idsArtistas
      .map(id => datos.artistas.find(a => a.id_artista === id))
      .filter(Boolean);

    // Colocar al artista principal primero
    artistasSeleccionados.sort((a, b) =>
      Number(b.id_artista === cancion.id_artista_principal) -
      Number(a.id_artista === cancion.id_artista_principal)
    );

    dibujarArtistasSeleccionados();

    // Recuperar el álbum
    $("buscar-album").value = cancion.album || "";
    $("album-can").value = cancion.id_album || "";

    modalCancion.showModal();
    modalCancion.scrollTop = 0;

  } catch (error) {

    console.error(error);
    alert(error.message);

  }
}
// -----------------------------------------------------
// 7) INICIO
// -----------------------------------------------------
cargarCanciones();

cargarForos();