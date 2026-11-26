const $ = (id) => document.getElementById(id);

// =====================================================
// 1) USUARIO
// =====================================================

const usuario = JSON.parse(sessionStorage.getItem("usuario") || "null");

if (!usuario || !usuario.id) {
    window.location.replace("../Login/Inicio_de_sesion/inicio_sesion.html");
} else {
    $("nombre-lateral").textContent = usuario.nombre;
}

$("cerrar-sesion").addEventListener("click", (e) => {
    e.preventDefault();

    sessionStorage.removeItem("usuario");

    window.location.replace(
        "../Login/Inicio_de_sesion/inicio_sesion.html"
    );
});

// =====================================================
// 2) VARIABLES
// =====================================================

let playlists = [];
let textoBusqueda = "";
let playlistActual = null;
let cancionesPlaylist = [];
let cancionesDisponibles = [];
let idCancionActual = null;

// =====================================================
// 3) CONSULTAR PLAYLISTS
// =====================================================

async function cargarPlaylists() {

    try {

        const respuesta = await fetch(
            `/api/playlists?id_usuario=${usuario.id}`
        );

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.ok) {
            throw new Error(datos.mensaje);
        }

        playlists = datos.playlists;

        dibujarPlaylists();

    } catch (error) {

        console.error(error);

        $("lista").textContent =
            "No se pudieron cargar las playlists.";
    }
}

// =====================================================
// 4) DIBUJAR PLAYLISTS
// =====================================================

function dibujarPlaylists() {

    const lista = $("lista");

    lista.innerHTML = "";

    const visibles = playlists.filter((pl) =>
        normalizarTexto(pl.titulo_play).includes(textoBusqueda) ||
        normalizarTexto(pl.descripcion_play).includes(textoBusqueda)
    );

    if (visibles.length === 0) {

        const mensaje = document.createElement("p");

        mensaje.className = "vacio";

        mensaje.textContent = playlists.length === 0
            ? "Aún no tienes playlists."
            : "No hay playlists que coincidan.";

        lista.appendChild(mensaje);

        return;
    }

    visibles.forEach((pl) => {

        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta-playlist";

        const portada = document.createElement("div");
        portada.className = "portada-playlist";
        portada.textContent = "♫";

        const informacion = document.createElement("div");
        informacion.className = "info-playlist";

        const titulo = document.createElement("h2");
        titulo.textContent = pl.titulo_play;

        const descripcion = document.createElement("p");
        descripcion.textContent =
            pl.descripcion_play || "Sin descripción";

        const cantidad = document.createElement("span");
        cantidad.className = "cantidad-canciones";

        cantidad.textContent = `${pl.total_canciones} ${
            Number(pl.total_canciones) === 1
                ? "canción"
                : "canciones"
        }`;

        informacion.append(titulo, descripcion, cantidad);

        const acciones = document.createElement("div");
        acciones.className = "acciones-playlist";

        const abrir = document.createElement("button");
        abrir.textContent = "▶";
        abrir.title = "Abrir playlist";

        const editar = document.createElement("button");
        editar.textContent = "✎";
        editar.title = "Editar playlist";

        const eliminar = document.createElement("button");
        eliminar.textContent = "✕";
        eliminar.title = "Eliminar playlist";

       abrir.addEventListener("click", () => {
    abrirPlaylist(pl.id_playlist);
});

        editar.addEventListener("click", () => {
        editarPlaylist(pl.id_playlist);
        });

       eliminar.addEventListener("click", () => {
    eliminarPlaylist(pl.id_playlist);
});

        acciones.append(abrir, editar, eliminar);

        tarjeta.append(portada, informacion, acciones);

        lista.appendChild(tarjeta);
    });
}

// =====================================================
// 5) BUSCADOR
// =====================================================

function normalizarTexto(texto) {

    return String(texto ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

$("buscador").addEventListener("input", (e) => {

    textoBusqueda = normalizarTexto(e.target.value.trim());

    dibujarPlaylists();
});

// =====================================================
// 6) MODAL DE PLAYLISTS
// =====================================================

const modalPlaylist = $("modal-playlist");

let idPlaylistEditar = null;

function limpiarFormularioPlaylist() {

    idPlaylistEditar = null;

    $("form-playlist").reset();

    $("titulo-modal-playlist").textContent = "NUEVA PLAYLIST";

    $("guardar-playlist").textContent = "Crear playlist";
}

$("btn-nueva").addEventListener("click", () => {

    limpiarFormularioPlaylist();

    modalPlaylist.showModal();
});

$("cerrar-modal").addEventListener("click", () => {
    modalPlaylist.close();
});

$("cancelar-playlist").addEventListener("click", () => {
    modalPlaylist.close();
});

modalPlaylist.addEventListener("close", () => {
    limpiarFormularioPlaylist();
});
$("form-playlist").addEventListener("submit", async (e) => {

    e.preventDefault();

    const titulo = $("titulo-play").value.trim();
    const descripcion = $("descripcion-play").value.trim();

    if (!titulo) {
        alert("Debes ingresar un título");
        return;
    }

    const editando = idPlaylistEditar !== null;

    const url = editando
        ? `/api/playlists/${idPlaylistEditar}`
        : "/api/playlists";

    const boton = $("guardar-playlist");

    boton.disabled = true;

    try {

        const respuesta = await fetch(url, {

            method: editando ? "PUT" : "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                titulo_play: titulo,
                descripcion_play: descripcion,
                id_usuario: usuario.id
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.ok) {
            throw new Error(datos.mensaje);
        }

        modalPlaylist.close();

        await cargarPlaylists();

        alert(datos.mensaje);

    } catch (error) {

        console.error(error);

        alert(error.message);

    } finally {

        boton.disabled = false;
    }
});

function editarPlaylist(id) {

    const playlist = playlists.find(
        (pl) => pl.id_playlist === id
    );

    if (!playlist) return;

    limpiarFormularioPlaylist();

    idPlaylistEditar = id;

    $("titulo-modal-playlist").textContent = "EDITAR PLAYLIST";

    $("guardar-playlist").textContent = "Guardar cambios";

    $("titulo-play").value = playlist.titulo_play;

    $("descripcion-play").value =
        playlist.descripcion_play || "";

    modalPlaylist.showModal();
}
async function eliminarPlaylist(id) {

    const playlist = playlists.find(
        (pl) => pl.id_playlist === id
    );

    if (!playlist) return;

    const confirmado = confirm(
        `¿Seguro que deseas eliminar "${playlist.titulo_play}"?`
    );

    if (!confirmado) return;

    try {

        const respuesta = await fetch(
            `/api/playlists/${id}?id_usuario=${usuario.id}`,
            {
                method: "DELETE"
            }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.ok) {
            throw new Error(datos.mensaje);
        }

        await cargarPlaylists();

        alert(datos.mensaje);

    } catch (error) {

        console.error(error);

        alert(error.message);
    }
}
// =====================================================
// DETALLE DE PLAYLIST
// =====================================================

async function abrirPlaylist(id) {

    try {

        const respuesta = await fetch(
            `/api/playlists/${id}/canciones?id_usuario=${usuario.id}`
        );

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.ok) {
            throw new Error(datos.mensaje);
        }

        playlistActual = datos.playlist;
        cancionesPlaylist = datos.canciones;

        $("lista").hidden = true;
        $("barra-playlists").hidden = true;
        $("titulo-pagina").hidden = true;

        $("detalle-playlist").hidden = false;

        $("detalle-titulo").textContent =
            playlistActual.titulo_play;

        $("detalle-descripcion").textContent =
            playlistActual.descripcion_play || "Sin descripción";

        dibujarCancionesPlaylist();

    } catch (error) {

        console.error(error);

        alert(error.message);
    }
}
function dibujarCancionesPlaylist() {

    const contenedor = $("canciones-playlist");

    contenedor.innerHTML = "";

    $("detalle-cantidad").textContent =
        `${cancionesPlaylist.length} ${
            cancionesPlaylist.length === 1
                ? "canción"
                : "canciones"
        }`;

    if (cancionesPlaylist.length === 0) {

        contenedor.textContent =
            "Esta playlist todavía no tiene canciones.";

        return;
    }

    cancionesPlaylist.forEach((cancion, index) => {

        const tarjeta = document.createElement("article");
        tarjeta.className = "cancion-playlist";

        const informacion = document.createElement("div");

        const titulo = document.createElement("h3");
        titulo.textContent = cancion.titulo_can;

        const artistas = document.createElement("p");
        artistas.textContent = cancion.artistas || "Sin artista";

        informacion.append(titulo, artistas);

        const album = document.createElement("p");
        album.textContent = cancion.album || "Sencillo";

        const duracion = document.createElement("span");
        duracion.textContent = cancion.duracion_can;

        const acciones = document.createElement("div");
        acciones.className = "acciones-playlist";

        const reproducir = document.createElement("button");
        reproducir.textContent = "▶";
        reproducir.title = "Reproducir canción";

        const quitar = document.createElement("button");
        quitar.textContent = "✕";
        quitar.title = "Quitar de la playlist";

        reproducir.addEventListener("click", () => {
         reproducirCancionPlaylist(cancion.id_cancion);
        });

        quitar.addEventListener("click", () => {
         quitarCancionPlaylist(cancion.id_cancion);
        });

        acciones.append(reproducir, quitar);

        tarjeta.append(
            informacion,
            album,
            duracion,
            acciones
        );

        contenedor.appendChild(tarjeta);
    });
}
$("btn-volver").addEventListener("click", () => {

    detenerReproductor();

    playlistActual = null;
    cancionesPlaylist = [];

    $("detalle-playlist").hidden = true;

    $("lista").hidden = false;
    $("barra-playlists").hidden = false;
    $("titulo-pagina").hidden = false;

    cargarPlaylists();
});

// =====================================================
// AGREGAR CANCIONES A PLAYLIST
// =====================================================

const modalAgregarCancion = $("modal-agregar-cancion");

$("btn-agregar-cancion").addEventListener("click", async () => {

    if (!playlistActual) return;

    try {

        const respuesta = await fetch("/api/canciones");

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.ok) {
            throw new Error(datos.mensaje);
        }

        cancionesDisponibles = datos.canciones;

        $("buscar-cancion-playlist").value = "";

        dibujarCancionesDisponibles();

        modalAgregarCancion.showModal();

    } catch (error) {

        console.error(error);

        alert(error.message);
    }
});

$("cerrar-modal-canciones").addEventListener("click", () => {
    modalAgregarCancion.close();
});

$("finalizar-agregar").addEventListener("click", () => {
    modalAgregarCancion.close();
});

$("buscar-cancion-playlist").addEventListener("input", () => {
    dibujarCancionesDisponibles();
});
function dibujarCancionesDisponibles() {

    const contenedor = $("canciones-disponibles");

    contenedor.innerHTML = "";

    const busqueda = normalizarTexto(
        $("buscar-cancion-playlist").value.trim()
    );

    const idsAgregados = new Set(
        cancionesPlaylist.map(c => c.id_cancion)
    );

    const visibles = cancionesDisponibles.filter(c =>

        !idsAgregados.has(c.id_cancion) && (

            normalizarTexto(c.titulo_can).includes(busqueda) ||

            normalizarTexto(c.artistas).includes(busqueda) ||

            normalizarTexto(c.album).includes(busqueda)
        )
    );

    if (visibles.length === 0) {

        contenedor.textContent =
            "No hay canciones disponibles que coincidan.";

        return;
    }

    visibles.forEach(cancion => {

        const tarjeta = document.createElement("article");

        tarjeta.className = "cancion-disponible";

        const informacion = document.createElement("div");

        const titulo = document.createElement("h3");
        titulo.textContent = cancion.titulo_can;

        const artistas = document.createElement("p");
        artistas.textContent = cancion.artistas || "Sin artista";

        const album = document.createElement("p");
        album.textContent = cancion.album || "Sencillo";

        informacion.append(titulo, artistas, album);

        const agregar = document.createElement("button");

        agregar.textContent = "+";
        agregar.title = "Agregar a la playlist";

        agregar.addEventListener("click", () => {

            agregarCancionPlaylist(cancion.id_cancion);
        });

        tarjeta.append(informacion, agregar);

        contenedor.appendChild(tarjeta);
    });
}
let agregandoCancion = false;

async function agregarCancionPlaylist(idCancion) {

    if (!playlistActual || agregandoCancion) return;

    const idPlaylist = playlistActual.id_playlist;

    agregandoCancion = true;

    const botones = $("canciones-disponibles")
        .querySelectorAll("button");

    botones.forEach(boton => boton.disabled = true);

    try {

        const respuesta = await fetch(
            `/api/playlists/${idPlaylist}/canciones`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    id_cancion: idCancion,
                    id_usuario: usuario.id
                })
            }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.ok) {
            throw new Error(datos.mensaje);
        }

        const cancion = cancionesDisponibles.find(
            c => c.id_cancion === idCancion
        );

        if (playlistActual?.id_playlist === idPlaylist && cancion) {

            cancionesPlaylist.push(cancion);

            cancionesPlaylist.sort((a, b) =>
                a.titulo_can.localeCompare(b.titulo_can)
            );

            dibujarCancionesPlaylist();

            dibujarCancionesDisponibles();
        }

    } catch (error) {

        console.error(error);

        alert(error.message);

    } finally {

        agregandoCancion = false;

        $("canciones-disponibles")
            .querySelectorAll("button")
            .forEach(boton => boton.disabled = false);
    }
}
async function quitarCancionPlaylist(idCancion) {

    if (!playlistActual) return;

    const idPlaylist = playlistActual.id_playlist;

    const cancion = cancionesPlaylist.find(
        c => c.id_cancion === idCancion
    );

    if (!cancion) return;

    const confirmado = confirm(
        `¿Deseas quitar "${cancion.titulo_can}" de esta playlist?`
    );

    if (!confirmado) return;

    try {

        const respuesta = await fetch(
            `/api/playlists/${idPlaylist}/canciones/${idCancion}?id_usuario=${usuario.id}`,
            {
                method: "DELETE"
            }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.ok) {
            throw new Error(datos.mensaje);
        }

        if (playlistActual?.id_playlist === idPlaylist) {

    if (idCancionActual === idCancion) {
        detenerReproductor();
    }

    cancionesPlaylist = cancionesPlaylist.filter(
        c => c.id_cancion !== idCancion
    );

    dibujarCancionesPlaylist();
}

    } catch (error) {

        console.error(error);

        alert(error.message);
    }
}
// =====================================================
// REPRODUCTOR DE PLAYLISTS
// =====================================================

const audio = $("audio");

audio.volume = 0.75;

async function reproducirCancionPlaylist(idCancion) {

    const cancion = cancionesPlaylist.find(
        c => c.id_cancion === idCancion
    );

    if (!cancion) return;

    idCancionActual = idCancion;

    audio.src = "/" + cancion.ruta_audio_can;

    $("reproductor-titulo").textContent = cancion.titulo_can;

    $("reproductor-artista").textContent =
        cancion.artistas || "Sin artista";

    $("reproductor-playlist").hidden = false;

    document.body.classList.add("reproduciendo-playlist");

    $("progreso").value = 0;
    $("tiempo-actual").textContent = "0:00";
    $("tiempo-total").textContent = "0:00";

    try {

        await audio.play();

    } catch (error) {

        console.error(error);

        alert("No se pudo reproducir la canción.");
    }
}
$("btn-reproducir").addEventListener("click", async () => {

    if (idCancionActual === null) return;

    if (audio.paused) {

        try {
            await audio.play();
        } catch (error) {
            console.error(error);
        }

    } else {

        audio.pause();
    }
});

audio.addEventListener("play", () => {
    $("btn-reproducir").textContent = "⏸";
});

audio.addEventListener("pause", () => {
    $("btn-reproducir").textContent = "▶";
});

function cambiarCancion(direccion) {

    if (cancionesPlaylist.length === 0) return;

    const indice = cancionesPlaylist.findIndex(
        c => c.id_cancion === idCancionActual
    );

    const nuevoIndice = indice === -1
        ? 0
        : (indice + direccion + cancionesPlaylist.length)
            % cancionesPlaylist.length;

    reproducirCancionPlaylist(
        cancionesPlaylist[nuevoIndice].id_cancion
    );
}

$("btn-anterior").addEventListener("click", () => {
    cambiarCancion(-1);
});

$("btn-siguiente").addEventListener("click", () => {
    cambiarCancion(1);
});

audio.addEventListener("ended", () => {
    cambiarCancion(1);
});
function formatearTiempo(segundos) {

    if (!Number.isFinite(segundos)) return "0:00";

    const minutos = Math.floor(segundos / 60);

    const resto = Math.floor(segundos % 60)
        .toString()
        .padStart(2, "0");

    return `${minutos}:${resto}`;
}

audio.addEventListener("loadedmetadata", () => {

    $("tiempo-total").textContent =
        formatearTiempo(audio.duration);
});

audio.addEventListener("timeupdate", () => {

    $("tiempo-actual").textContent =
        formatearTiempo(audio.currentTime);

    if (Number.isFinite(audio.duration) && audio.duration > 0) {

        $("progreso").value =
            (audio.currentTime / audio.duration) * 100;
    }
});

$("progreso").addEventListener("input", (e) => {

    if (Number.isFinite(audio.duration) && audio.duration > 0) {

        audio.currentTime =
            (Number(e.target.value) / 100) * audio.duration;
    }
});

$("volumen").addEventListener("input", (e) => {

    audio.volume = Number(e.target.value);
});
function detenerReproductor() {

    audio.pause();

    audio.removeAttribute("src");

    audio.load();

    idCancionActual = null;

    $("reproductor-playlist").hidden = true;

    document.body.classList.remove("reproduciendo-playlist");

    $("reproductor-titulo").textContent = "Selecciona una canción";
    $("reproductor-artista").textContent = "";
    $("btn-reproducir").textContent = "▶";
    $("progreso").value = 0;
    $("tiempo-actual").textContent = "0:00";
    $("tiempo-total").textContent = "0:00";
}
// =====================================================
// 7) INICIO
// =====================================================

if (usuario?.id) {
    cargarPlaylists();
}