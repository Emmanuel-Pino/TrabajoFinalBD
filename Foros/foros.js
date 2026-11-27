
// =====================================================
// FOROS - COMUNIDADES
// =====================================================

const $ = (id) => document.getElementById(id);

const API = "/api/comunidades";
const API_PUBLICACIONES = "/api/publicaciones";

// -----------------------------------------------------
// 1. USUARIO Y SESIÓN
// -----------------------------------------------------

let usuario;

try {
    usuario = JSON.parse(sessionStorage.getItem("usuario"));
} catch {
    usuario = null;
}

if (!usuario || !Number.isInteger(Number(usuario.id)) || Number(usuario.id) <= 0) {
    window.location.replace(
        "../Login/Inicio_de_sesion/inicio_sesion.html"
    );

    throw new Error("No hay una sesión válida");
}

const idUsuario = Number(usuario.id);

$("nombre-lateral").textContent = usuario.nombre;

$("cerrar-sesion").addEventListener("click", () => {
    sessionStorage.removeItem("usuario");
});

// -----------------------------------------------------
// 2. VARIABLES DE ESTADO
// -----------------------------------------------------

let comunidades = [];
let textoBusqueda = "";
let filtroActual = "todas";
let comunidadActual = null;
let idComunidadEditar = null;
let guardando = false;
let operacionPendiente = false;
let versionCarga = 0;
let publicaciones = [];
let versionPublicaciones = 0;
let idPublicacionEditar = null;
let guardandoPublicacion = false;
let preparandoPublicacion = false;
let eliminandoPublicacion = false;
const comentariosAbiertos = new Set();
let filtroPublicaciones = "recientes";

let interaccionPendiente = false;

const dialogoPublicacion = $("dialogo-publicacion");

const dialogo = $("dialogo");

// -----------------------------------------------------
// 3. FUNCIONES AUXILIARES
// -----------------------------------------------------

function normalizarTexto(texto) {

    return String(texto ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function convertirArreglo(texto) {

    return [...new Set(
        texto.split(",")
            .map(elemento => elemento.trim())
            .filter(Boolean)
    )];
}

function esCreador(comunidad) {

    return comunidad.id_creador === idUsuario;
}

function esMiembro(comunidad) {

    return comunidad.miembros.includes(idUsuario);
}

function textoMiembros(comunidad) {

    const cantidad = comunidad.miembros.length;

    return cantidad + (cantidad === 1 ? " miembro" : " miembros");
}

async function solicitar(url, opciones = {}) {

    const respuesta = await fetch(url, opciones);

    const datos = await respuesta.json();

    if (!respuesta.ok || !datos.ok) {
        throw new Error(datos.mensaje || "Error en la petición");
    }

    return datos;
}

function crearElemento(etiqueta, clase, texto) {

    const elemento = document.createElement(etiqueta);

    if (clase) elemento.className = clase;

    if (texto !== undefined) {
        elemento.textContent = texto;
    }

    return elemento;
}

function crearBoton(texto, clase, accion) {

    const boton = crearElemento("button", clase, texto);

    boton.type = "button";

    boton.addEventListener("click", accion);

    return boton;
}

function dibujarPildoras(contenedor, valores, etiqueta = false) {

    contenedor.replaceChildren();

    valores.forEach(valor => {

        const pildora = crearElemento(
            "span",
            etiqueta ? "pildora etiqueta" : "pildora",
            valor
        );

        contenedor.appendChild(pildora);
    });
}

// -----------------------------------------------------
// 4. CARGAR COMUNIDADES DESDE MONGODB
// -----------------------------------------------------

async function cargarComunidades() {

    const version = ++versionCarga;

    $("lista").textContent = "Cargando comunidades...";

    try {

        let url = API;

        if (filtroActual === "mis") {
            url += "/mis-comunidades?id_usuario=" + idUsuario;
        }

        const datos = await solicitar(url);

        // Evitar que una petición anterior sobrescriba
        // los resultados de un filtro más reciente.
        if (version !== versionCarga) return;

        comunidades = datos.comunidades;

        dibujarComunidades();

    } catch (error) {

        if (version !== versionCarga) return;

        console.error(error);

        comunidades = [];

        $("lista").replaceChildren(
            crearElemento("p", "vacio", error.message)
        );
    }
}

// -----------------------------------------------------
// 5. DIBUJAR LAS COMUNIDADES
// -----------------------------------------------------

function dibujarComunidades() {

    const lista = $("lista");

    lista.replaceChildren();

    const busqueda = normalizarTexto(textoBusqueda);

    const visibles = comunidades.filter(comunidad => {

        const contenido = [
            comunidad.nombre,
            comunidad.descripcion,
            ...comunidad.generos,
            ...comunidad.etiquetas
        ].join(" ");

        return normalizarTexto(contenido).includes(busqueda);
    });

    if (visibles.length === 0) {

        let mensaje = "No hay comunidades que coincidan.";

        if (comunidades.length === 0) {

            mensaje = filtroActual === "mis"
                ? "Aún no perteneces a ninguna comunidad."
                : "Aún no existen comunidades. ¡Crea la primera!";
        }

        lista.appendChild(
            crearElemento("p", "vacio", mensaje)
        );

        return;
    }

    visibles.forEach(comunidad => {

        const tarjeta = crearElemento("article", "foro");

        // Cabecera

        const cabecera = crearElemento("div", "foro-cabecera");

        const icono = crearElemento("div", "foro-icono", "♫");

        icono.setAttribute("aria-hidden", "true");

        const info = crearElemento("div", "foro-info");

        const nombre = crearElemento(
            "h2",
            "foro-nombre",
            comunidad.nombre
        );

        const miembros = crearElemento(
            "p",
            "foro-miembros",
            textoMiembros(comunidad)
        );

        info.append(nombre, miembros);

        cabecera.append(icono, info);

        // Descripción

        const descripcion = crearElemento(
            "p",
            "foro-descripcion",
            comunidad.descripcion
        );

        // Géneros

        const generos = crearElemento("div", "pildoras");

        dibujarPildoras(generos, comunidad.generos);

        // Etiquetas

        const etiquetas = crearElemento("div", "pildoras");

        dibujarPildoras(etiquetas, comunidad.etiquetas, true);

        // Botones

        const acciones = crearElemento("div", "foro-acciones");

        if (esMiembro(comunidad)) {

            acciones.appendChild(
                crearBoton("Entrar", "amarillo", () => {
                    abrirComunidad(comunidad._id);
                })
            );

            if (esCreador(comunidad)) {

                acciones.appendChild(
                    crearBoton("Editar", "btn-secundario", () => {
                        editarComunidad(comunidad);
                    })
                );

                acciones.appendChild(
                    crearBoton("Eliminar", "btn-peligro", () => {
                        eliminarComunidad(comunidad);
                    })
                );

            } else {

                acciones.appendChild(
                    crearBoton("Salir", "btn-peligro", () => {
                        salirComunidad(comunidad);
                    })
                );
            }

        } else {

            acciones.appendChild(
                crearBoton("Unirse", "amarillo", () => {
                    unirseComunidad(comunidad);
                })
            );
        }

        tarjeta.append(
            cabecera,
            descripcion,
            generos,
            etiquetas,
            acciones
        );

        lista.appendChild(tarjeta);
    });
}

// -----------------------------------------------------
// 6. BUSCADOR Y FILTROS
// -----------------------------------------------------

$("buscador").addEventListener("input", (e) => {

    textoBusqueda = e.target.value.trim();

    dibujarComunidades();
});

function cambiarFiltro(filtro) {

    filtroActual = filtro;

    $("btn-explorar").classList.toggle(
        "activo",
        filtro === "todas"
    );

    $("btn-mis-comunidades").classList.toggle(
        "activo",
        filtro === "mis"
    );

    cargarComunidades();
}

$("btn-explorar").addEventListener("click", () => {

    cambiarFiltro("todas");
});

$("btn-mis-comunidades").addEventListener("click", () => {

    cambiarFiltro("mis");
});

// -----------------------------------------------------
// 7. MODAL PARA CREAR Y EDITAR
// -----------------------------------------------------

function limpiarFormulario() {

    $("form-foro").reset();

    $("error-foro").textContent = "";

    $("dialogo-titulo").textContent = "Crear comunidad";

    $("btn-guardar").textContent = "Crear";

    idComunidadEditar = null;
}

$("btn-crear").addEventListener("click", () => {

    limpiarFormulario();

    dialogo.showModal();

    dialogo.scrollTop = 0;

    $("nombre-foro").focus();
});

$("btn-cancelar").addEventListener("click", () => {

    if (!guardando) dialogo.close();
});

dialogo.addEventListener("cancel", (e) => {

    if (guardando) e.preventDefault();
});

dialogo.addEventListener("close", limpiarFormulario);

// Preparar formulario para editar

function editarComunidad(comunidad) {

    limpiarFormulario();

    idComunidadEditar = comunidad._id;

    $("dialogo-titulo").textContent = "Editar comunidad";

    $("btn-guardar").textContent = "Guardar cambios";

    $("nombre-foro").value = comunidad.nombre;

    $("descripcion-foro").value = comunidad.descripcion;

    $("generos-foro").value = comunidad.generos.join(", ");

    $("etiquetas-foro").value = comunidad.etiquetas.join(", ");

    dialogo.showModal();

    dialogo.scrollTop = 0;
}

// -----------------------------------------------------
// 8. CREAR O ACTUALIZAR COMUNIDAD
// -----------------------------------------------------

$("form-foro").addEventListener("submit", async (e) => {

    e.preventDefault();

    if (guardando) return;

    $("error-foro").textContent = "";

    const nombre = $("nombre-foro").value.trim();

    const descripcion = $("descripcion-foro").value.trim();

    const generos = convertirArreglo(
        $("generos-foro").value
    );

    const etiquetas = convertirArreglo(
        $("etiquetas-foro").value
    );

    if (!nombre || nombre.length > 60) {

        $("error-foro").textContent =
            "Escribe un nombre válido de máximo 60 caracteres.";

        return;
    }

    if (!descripcion || descripcion.length > 300) {

        $("error-foro").textContent =
            "Escribe una descripción válida.";

        return;
    }

    if (generos.length === 0) {

        $("error-foro").textContent =
            "Debes ingresar al menos un género musical.";

        return;
    }

    const cuerpo = {
        nombre,
        descripcion,
        generos,
        etiquetas
    };

    let url = API;
    let metodo = "POST";

    if (idComunidadEditar) {

        url += "/" + idComunidadEditar;

        metodo = "PUT";

        cuerpo.id_usuario = idUsuario;

    } else {

        cuerpo.id_creador = idUsuario;
    }

    guardando = true;

    $("btn-guardar").disabled = true;

    $("btn-cancelar").disabled = true;

    try {

        const datos = await solicitar(url, {

            method: metodo,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(cuerpo)
        });

        dialogo.close();

        await cargarComunidades();

        alert(datos.mensaje);

    } catch (error) {

        console.error(error);

        $("error-foro").textContent = error.message;

    } finally {

        guardando = false;

        $("btn-guardar").disabled = false;

        $("btn-cancelar").disabled = false;
    }
});

// -----------------------------------------------------
// 9. ELIMINAR COMUNIDAD
// -----------------------------------------------------

async function eliminarComunidad(comunidad) {

    if (operacionPendiente) return;

    const confirmado = confirm(
        `¿Deseas eliminar "${comunidad.nombre}"?\n\n` +
        "También se eliminarán sus publicaciones y mensajes."
    );

    if (!confirmado) return;

    operacionPendiente = true;

    try {

        const datos = await solicitar(
            `${API}/${comunidad._id}?id_usuario=${idUsuario}`,
            {
                method: "DELETE"
            }
        );

        await cargarComunidades();

        alert(datos.mensaje);

    } catch (error) {

        console.error(error);

        alert(error.message);

    } finally {

        operacionPendiente = false;
    }
}

// -----------------------------------------------------
// 10. UNIRSE A UNA COMUNIDAD
// -----------------------------------------------------

async function unirseComunidad(comunidad) {

    if (operacionPendiente) return;

    operacionPendiente = true;

    try {

        const datos = await solicitar(
            `${API}/${comunidad._id}/unirse`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    id_usuario: idUsuario
                })
            }
        );

        await cargarComunidades();

        alert(datos.mensaje);

    } catch (error) {

        console.error(error);

        alert(error.message);

    } finally {

        operacionPendiente = false;
    }
}

// -----------------------------------------------------
// 11. SALIR DE UNA COMUNIDAD
// -----------------------------------------------------

async function salirComunidad(comunidad) {

    if (operacionPendiente) return;

    const confirmado = confirm(
        `¿Deseas salir de "${comunidad.nombre}"?`
    );

    if (!confirmado) return;

    operacionPendiente = true;

    try {

        const datos = await solicitar(
            `${API}/${comunidad._id}/salir`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    id_usuario: idUsuario
                })
            }
        );

        await cargarComunidades();

        alert(datos.mensaje);

    } catch (error) {

        console.error(error);

        alert(error.message);

    } finally {

        operacionPendiente = false;
    }
}

// -----------------------------------------------------
// 12. ABRIR EL INTERIOR DE UNA COMUNIDAD
// -----------------------------------------------------

async function abrirComunidad(id) {

    if (operacionPendiente) return;

    operacionPendiente = true;

    try {

        const datos = await solicitar(`${API}/${id}`);

        const comunidad = datos.comunidad;

        if (!esMiembro(comunidad)) {

            alert("Debes unirte primero a esta comunidad.");
            // Restablecer filtro de publicaciones

filtroPublicaciones = "recientes";

$("btn-recientes").classList.add("activo");

$("btn-populares").classList.remove("activo");
            await cargarComunidades();

            return;
        }

        comunidadActual = comunidad;

        $("detalle-nombre").textContent = comunidad.nombre;

        $("detalle-descripcion").textContent =
            comunidad.descripcion;

        $("detalle-miembros").textContent =
            textoMiembros(comunidad);

        dibujarPildoras(
            $("detalle-generos"),
            comunidad.generos
        );

        dibujarPildoras(
            $("detalle-etiquetas"),
            comunidad.etiquetas,
            true
        );

        // Ocultar listado

        $("titulo-pagina").hidden = true;

        $("barra-comunidades").hidden = true;

        $("filtros-comunidades").hidden = true;

        $("lista").hidden = true;

        // Mostrar interior

        $("detalle-comunidad").hidden = false;

        document.querySelector(".contenido").scrollTop = 0;

        await cargarPublicaciones();

    } catch (error) {

        console.error(error);

        alert(error.message);

    } finally {

        operacionPendiente = false;
    }
}

// -----------------------------------------------------
// 13. VOLVER AL LISTADO
// -----------------------------------------------------

$("btn-volver").addEventListener("click", () => {

    // Invalidar peticiones pendientes

    versionPublicaciones++;
    comentariosAbiertos.clear();
    // Detener audios y limpiar publicaciones

    $("lista-publicaciones")
        .querySelectorAll("audio")
        .forEach(audio => audio.pause());

    publicaciones = [];

    $("lista-publicaciones").replaceChildren();

    comunidadActual = null;

    $("detalle-comunidad").hidden = true;

    $("titulo-pagina").hidden = false;

    $("barra-comunidades").hidden = false;

    $("filtros-comunidades").hidden = false;

    $("lista").hidden = false;

    cargarComunidades();
});

// -----------------------------------------------------
// 14. INICIALIZAR PÁGINA
// -----------------------------------------------------

async function inicializarForos() {

    await cargarComunidades();

    const parametros = new URLSearchParams(
        window.location.search
    );

    const idComunidad = parametros.get("id");

    if (idComunidad) {

        await abrirComunidad(idComunidad);

        // Limpiar el parámetro de la URL

        window.history.replaceState(
            null,
            "",
            window.location.pathname
        );
    }
}


// -----------------------------------------------------
// 15. CARGAR PUBLICACIONES
// -----------------------------------------------------

async function cargarPublicaciones() {

    if (!comunidadActual) return;

    const idComunidad = comunidadActual._id;

    const version = ++versionPublicaciones;

    const filtro = filtroPublicaciones;

    $("lista-publicaciones").textContent =
        "Cargando publicaciones...";

    try {

        // 1. Obtener publicaciones completas

        const datos = await solicitar(

            `${API_PUBLICACIONES}/comunidad/${idComunidad}?id_usuario=${idUsuario}`
        );

        let resultado = datos.publicaciones;

        // 2. Consultar estadísticas si el filtro es populares

        if (filtro === "populares") {

            const datosEstadisticas = await solicitar(

                `${API_PUBLICACIONES}/comunidad/${idComunidad}/estadisticas?id_usuario=${idUsuario}`
            );

            // Relacionar publicaciones mediante su ID

            const mapaPublicaciones = new Map(

                resultado.map(publicacion => [

                    publicacion._id,

                    publicacion
                ])
            );

            // Respetar el orden devuelto por MongoDB

            resultado = datosEstadisticas.estadisticas

                .map(estadistica =>

                    mapaPublicaciones.get(estadistica._id)
                )

                .filter(Boolean);
        }

        // 3. Evitar mostrar resultados antiguos

        if (
            version !== versionPublicaciones ||
            comunidadActual?._id !== idComunidad
        ) return;

        publicaciones = resultado;

        dibujarPublicaciones();

    } catch (error) {

        if (
            version !== versionPublicaciones ||
            comunidadActual?._id !== idComunidad
        ) return;

        console.error(error);

        publicaciones = [];

        $("lista-publicaciones").replaceChildren(

            crearElemento("p", "vacio", error.message)
        );
    }
}


// -----------------------------------------------------
// 16. FORMATEAR FECHAS
// -----------------------------------------------------

function formatearFecha(fecha) {

    return new Date(fecha).toLocaleString("es-CO", {

        day: "numeric",

        month: "short",

        year: "numeric",

        hour: "2-digit",

        minute: "2-digit"
    });
}


// -----------------------------------------------------
// 17. DIBUJAR PUBLICACIONES
// -----------------------------------------------------

function dibujarPublicaciones() {

    const lista = $("lista-publicaciones");

    lista.replaceChildren();

    if (publicaciones.length === 0) {

        lista.appendChild(

            crearElemento(
                "p",
                "vacio",
                "Todavía no hay publicaciones en esta comunidad."
            )
        );

        return;
    }

    publicaciones.forEach(publicacion => {

        const tarjeta = crearElemento(
            "article",
            "publicacion"
        );

        // 1. Cabecera

        const cabecera = crearElemento(
            "div",
            "publicacion-cabecera"
        );

        const avatar = crearElemento(
            "div",
            "publicacion-avatar",
            publicacion.nombre_usuario.charAt(0).toUpperCase()
        );

        const info = crearElemento(
            "div",
            "publicacion-info"
        );

        const autor = crearElemento(
            "p",
            "publicacion-autor",
            publicacion.nombre_usuario
        );

        const fecha = crearElemento(
            "p",
            "publicacion-fecha",
            formatearFecha(publicacion.fecha)
        );

        info.append(autor, fecha);

        cabecera.append(avatar, info);
        
        // Acciones disponibles para el autor


// Acciones disponibles según los permisos

const acciones = crearElemento(
    "div",
    "publicacion-acciones"
);

const esAutor = publicacion.id_usuario === idUsuario;

const puedeEliminar = esAutor || esCreador(comunidadActual);

// Solo el autor puede editar

if (esAutor) {

    acciones.appendChild(

        crearBoton(
            "Editar",
            "btn-secundario",
            () => abrirModalPublicacion(publicacion)
        )
    );
}

// El autor o el creador de la comunidad pueden eliminar

if (puedeEliminar) {

    acciones.appendChild(

        crearBoton(
            "Eliminar",
            "btn-peligro",
            () => eliminarPublicacion(publicacion)
        )
    );
}

cabecera.appendChild(acciones);

        // 2. Título y contenido

        const titulo = crearElemento(
            "h3",
            "publicacion-titulo",
            publicacion.titulo
        );

        const contenido = crearElemento(
            "p",
            "publicacion-contenido",
            publicacion.contenido
        );

        tarjeta.append(
            cabecera,
            titulo,
            contenido
        );

        // 3. Canción adjunta (opcional)

        if (publicacion.cancion) {

            tarjeta.appendChild(
                dibujarCancionAdjunta(publicacion.cancion)
            );
        }

        // 4. Likes y comentarios

        const interacciones = crearElemento(
            "div",
            "publicacion-interacciones"
        );

        const btnLike = crearElemento(
            "button",
            publicacion.liked ? "btn-like liked" : "btn-like",
            `${publicacion.liked ? "♥" : "♡"} ${publicacion.total_likes} likes`
        );

        btnLike.type = "button";

        btnLike.setAttribute(
    "aria-pressed",
    String(publicacion.liked)
);

btnLike.addEventListener("click", () => {

    alternarLike(publicacion, btnLike);
});

        const btnComentarios = crearElemento(
            "button",
            "btn-comentarios",
            `💬 ${publicacion.total_comentarios} comentarios`
        );

        btnComentarios.type = "button";

        interacciones.append(
            btnLike,
            btnComentarios
        );

        tarjeta.appendChild(interacciones);

        // 5. Listado de comentarios

        const comentarios = dibujarComentarios(publicacion);

comentarios.hidden = !comentariosAbiertos.has(
    publicacion._id
);

btnComentarios.setAttribute(
    "aria-expanded",
    String(!comentarios.hidden)
);

btnComentarios.addEventListener("click", () => {

    comentarios.hidden = !comentarios.hidden;

    if (comentarios.hidden) {

        comentariosAbiertos.delete(publicacion._id);

    } else {

        comentariosAbiertos.add(publicacion._id);
    }

    btnComentarios.setAttribute(
        "aria-expanded",
        String(!comentarios.hidden)
    );
});

tarjeta.appendChild(comentarios);

        lista.appendChild(tarjeta);
    });
}


// -----------------------------------------------------
// 18. DIBUJAR CANCIÓN ADJUNTA
// -----------------------------------------------------

function dibujarCancionAdjunta(cancion) {

    const contenedor = crearElemento(
        "div",
        "publicacion-cancion"
    );

    const titulo = crearElemento(
        "p",
        "cancion-adjunta-titulo",
        "♫ " + cancion.titulo_can
    );

    const duracion = crearElemento(
        "p",
        "cancion-adjunta-duracion",
        "Duración: " + cancion.duracion_can
    );

    const audio = document.createElement("audio");

    audio.controls = true;

    audio.preload = "none";

    audio.src = "/" + cancion.ruta_audio_can.replace(/^\/+/, "");

    // Evitar reproducir varias canciones simultáneamente

    audio.addEventListener("play", () => {

        document
            .querySelectorAll("#lista-publicaciones audio")
            .forEach(otroAudio => {

                if (otroAudio !== audio) {

                    otroAudio.pause();
                }
            });
    });

    contenedor.append(
        titulo,
        duracion,
        audio
    );

    return contenedor;
}


// -----------------------------------------------------
// 19. DIBUJAR COMENTARIOS
// -----------------------------------------------------

function dibujarComentarios(publicacion) {

    const contenedor = crearElemento(
        "div",
        "publicacion-comentarios"
    );

    const comentarios = publicacion.comentarios;

    // 1. Mostrar comentarios existentes

    if (comentarios.length === 0) {

        contenedor.appendChild(

            crearElemento(
                "p",
                "comentario-texto",
                "Todavía no hay comentarios."
            )
        );
    }

    comentarios.forEach(comentario => {

        const tarjeta = crearElemento(
            "div",
            "comentario"
        );

        const cabecera = crearElemento(
            "div",
            "comentario-cabecera"
        );

        const autor = crearElemento(
            "p",
            "comentario-autor",
            comentario.nombre_usuario
        );

        cabecera.appendChild(autor);

        // Permisos para eliminar comentarios

        const esAutor =
            comentario.id_usuario === idUsuario;

        const puedeEliminar =
            esAutor || esCreador(comunidadActual);

        if (puedeEliminar) {

            cabecera.appendChild(

                crearBoton(

                    "Eliminar",

                    "btn-peligro btn-eliminar-comentario",

                    () => eliminarComentario(
                        publicacion,
                        comentario
                    )
                )
            );
        }

        const texto = crearElemento(
            "p",
            "comentario-texto",
            comentario.texto
        );

        const fecha = crearElemento(
            "p",
            "comentario-fecha",
            formatearFecha(comentario.fecha)
        );

        tarjeta.append(
            cabecera,
            texto,
            fecha
        );

        contenedor.appendChild(tarjeta);
    });

    // 2. Formulario para escribir comentarios

    const formulario = crearElemento(
        "form",
        "form-comentario"
    );

    const input = document.createElement("input");

    input.type = "text";

    input.placeholder = "Escribe un comentario...";

    input.maxLength = 500;

    input.required = true;

    input.setAttribute(
        "aria-label",
        "Escribir comentario"
    );

    const boton = crearElemento(
        "button",
        "amarillo",
        "Enviar"
    );

    boton.type = "submit";

    const mensajeError = crearElemento(
        "p",
        "comentario-error"
    );

    mensajeError.setAttribute("role", "alert");

    formulario.append(input, boton);

    formulario.addEventListener("submit", (e) => {

        e.preventDefault();

        agregarComentario(
            publicacion,
            input,
            boton,
            mensajeError
        );
    });

    contenedor.append(
        formulario,
        mensajeError
    );

    return contenedor;
}


// -----------------------------------------------------
// 20. CARGAR CANCIONES PARA PUBLICACIONES
// -----------------------------------------------------

async function cargarCancionesPublicacion() {

    const select = $("cancion-publicacion");

    select.replaceChildren();

    const opcionVacia = crearElemento(
        "option",
        "",
        "Sin canción"
    );

    opcionVacia.value = "";

    select.appendChild(opcionVacia);

    const datos = await solicitar("/api/canciones");

    datos.canciones.forEach(cancion => {

        const nombre = cancion.artistas
            ? `${cancion.titulo_can} - ${cancion.artistas}`
            : cancion.titulo_can;

        const opcion = crearElemento(
            "option",
            "",
            nombre
        );

        opcion.value = cancion.id_cancion;

        select.appendChild(opcion);
    });
}

// -----------------------------------------------------
// 21. MODAL DE PUBLICACIONES
// -----------------------------------------------------

function limpiarFormularioPublicacion() {

    $("form-publicacion").reset();

    $("error-publicacion").textContent = "";

    $("titulo-modal-publicacion").textContent =
        "Crear publicación";

    $("btn-guardar-publicacion").textContent =
        "Publicar";

    idPublicacionEditar = null;
}


// Abrir modal para crear o editar

async function abrirModalPublicacion(publicacion = null) {

    if (
        !comunidadActual ||
        preparandoPublicacion ||
        guardandoPublicacion ||
        dialogoPublicacion.open
    ) return;

    const idComunidad = comunidadActual._id;

    preparandoPublicacion = true;

    limpiarFormularioPublicacion();

    try {

        await cargarCancionesPublicacion();

        if (comunidadActual?._id !== idComunidad) return;

        if (publicacion) {

            idPublicacionEditar = publicacion._id;

            $("titulo-modal-publicacion").textContent =
                "Editar publicación";

            $("btn-guardar-publicacion").textContent =
                "Guardar cambios";

            $("titulo-publicacion").value =
                publicacion.titulo;

            $("contenido-publicacion").value =
                publicacion.contenido;

            $("cancion-publicacion").value =
                publicacion.id_cancion ?? "";
        }

        dialogoPublicacion.showModal();

        dialogoPublicacion.scrollTop = 0;

        $("titulo-publicacion").focus();

    } catch (error) {

        console.error(error);

        alert(error.message);

    } finally {

        preparandoPublicacion = false;
    }
}


// Botón crear

$("btn-crear-publicacion").addEventListener("click", () => {

    abrirModalPublicacion();
});


// Botón cancelar

$("btn-cancelar-publicacion").addEventListener("click", () => {

    if (!guardandoPublicacion) {

        dialogoPublicacion.close();
    }
});


// Evitar cerrar mientras se guarda

dialogoPublicacion.addEventListener("cancel", (e) => {

    if (guardandoPublicacion) {

        e.preventDefault();
    }
});


dialogoPublicacion.addEventListener(
    "close",
    limpiarFormularioPublicacion
);

// -----------------------------------------------------
// 22. CREAR O ACTUALIZAR PUBLICACIÓN
// -----------------------------------------------------

$("form-publicacion").addEventListener("submit", async (e) => {

    e.preventDefault();

    if (guardandoPublicacion || !comunidadActual) return;

    $("error-publicacion").textContent = "";

    const titulo = $("titulo-publicacion").value.trim();

    const contenido = $("contenido-publicacion").value.trim();

    const cancionSeleccionada =
        $("cancion-publicacion").value;

    const id_cancion = cancionSeleccionada
        ? Number(cancionSeleccionada)
        : null;

    // Validaciones

    if (!titulo || titulo.length > 100) {

        $("error-publicacion").textContent =
            "Escribe un título válido.";

        return;
    }

    if (!contenido || contenido.length > 2000) {

        $("error-publicacion").textContent =
            "Escribe un contenido válido.";

        return;
    }

    // Preparar petición

    const cuerpo = {

        id_usuario: idUsuario,

        titulo,

        contenido,

        id_cancion
    };

    let url = API_PUBLICACIONES;

    let metodo = "POST";

    if (idPublicacionEditar) {

        url += "/" + idPublicacionEditar;

        metodo = "PUT";

    } else {

        cuerpo.id_comunidad = comunidadActual._id;
    }

    guardandoPublicacion = true;

    $("btn-guardar-publicacion").disabled = true;

    $("btn-cancelar-publicacion").disabled = true;

    try {

        const datos = await solicitar(url, {

            method: metodo,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(cuerpo)
        });

        dialogoPublicacion.close();

        await cargarPublicaciones();

        alert(datos.mensaje);

    } catch (error) {

        console.error(error);

        $("error-publicacion").textContent =
            error.message;

    } finally {

        guardandoPublicacion = false;

        $("btn-guardar-publicacion").disabled = false;

        $("btn-cancelar-publicacion").disabled = false;
    }
});

// -----------------------------------------------------
// 23. ELIMINAR PUBLICACIÓN
// -----------------------------------------------------

async function eliminarPublicacion(publicacion) {

    if (eliminandoPublicacion || !comunidadActual) return;

    const confirmado = confirm(
        `¿Deseas eliminar "${publicacion.titulo}"?\n\n` +
        "También se eliminarán sus likes y comentarios."
    );

    if (!confirmado) return;

    const idComunidad = comunidadActual._id;

    eliminandoPublicacion = true;

    try {

        const datos = await solicitar(

            `${API_PUBLICACIONES}/${publicacion._id}?id_usuario=${idUsuario}`,

            {
                method: "DELETE"
            }
        );

        if (comunidadActual?._id === idComunidad) {

            await cargarPublicaciones();
        }

        alert(datos.mensaje);

    } catch (error) {

        console.error(error);

        alert(error.message);

    } finally {

        eliminandoPublicacion = false;
    }
}

// -----------------------------------------------------
// 24. DAR O RETIRAR LIKE
// -----------------------------------------------------

async function alternarLike(publicacion, boton) {

    if (interaccionPendiente || !comunidadActual) return;

    const idComunidad = comunidadActual._id;

    interaccionPendiente = true;

    boton.disabled = true;

    try {

        let url =
            `${API_PUBLICACIONES}/${publicacion._id}/likes`;

        if (publicacion.liked) {

            // Retirar like

            url += `?id_usuario=${idUsuario}`;

            await solicitar(url, {

                method: "DELETE"
            });

        } else {

            // Agregar like

            await solicitar(url, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    id_usuario: idUsuario
                })
            });
        }

        // Actualizar publicaciones

        if (comunidadActual?._id === idComunidad) {

            await cargarPublicaciones();
        }

    } catch (error) {

        console.error(error);

        alert(error.message);

    } finally {

        interaccionPendiente = false;

        boton.disabled = false;
    }
}

// -----------------------------------------------------
// 25. AGREGAR COMENTARIO
// -----------------------------------------------------

async function agregarComentario(
    publicacion,
    input,
    boton,
    mensajeError
) {

    if (interaccionPendiente || !comunidadActual) return;

    mensajeError.textContent = "";

    const texto = input.value.trim();

    if (!texto || texto.length > 500) {

        mensajeError.textContent =
            "Escribe un comentario válido.";

        return;
    }

    const idComunidad = comunidadActual._id;

    interaccionPendiente = true;

    boton.disabled = true;

    input.disabled = true;

    try {

        await solicitar(

            `${API_PUBLICACIONES}/${publicacion._id}/comentarios`,

            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    id_usuario: idUsuario,

                    texto
                })
            }
        );

        input.value = "";

        if (comunidadActual?._id === idComunidad) {

            comentariosAbiertos.add(publicacion._id);

            await cargarPublicaciones();
        }

    } catch (error) {

        console.error(error);

        mensajeError.textContent = error.message;

    } finally {

        interaccionPendiente = false;

        boton.disabled = false;

        input.disabled = false;
    }
}

// -----------------------------------------------------
// 26. ELIMINAR COMENTARIO
// -----------------------------------------------------

async function eliminarComentario(
    publicacion,
    comentario
) {

    if (interaccionPendiente || !comunidadActual) return;

    const confirmado = confirm(
        "¿Deseas eliminar este comentario?"
    );

    if (!confirmado) return;

    const idComunidad = comunidadActual._id;

    interaccionPendiente = true;

    try {

        await solicitar(

            `${API_PUBLICACIONES}/${publicacion._id}/comentarios/${comentario._id}?id_usuario=${idUsuario}`,

            {
                method: "DELETE"
            }
        );

        if (comunidadActual?._id === idComunidad) {

            comentariosAbiertos.add(publicacion._id);

            await cargarPublicaciones();
        }

    } catch (error) {

        console.error(error);

        alert(error.message);

    } finally {

        interaccionPendiente = false;
    }
}

// -----------------------------------------------------
// 27. FILTROS DE PUBLICACIONES
// -----------------------------------------------------

function cambiarFiltroPublicaciones(filtro) {

    if (!comunidadActual) return;

    if (filtroPublicaciones === filtro) return;

    filtroPublicaciones = filtro;

    $("btn-recientes").classList.toggle(

        "activo",

        filtro === "recientes"
    );

    $("btn-populares").classList.toggle(

        "activo",

        filtro === "populares"
    );

    cargarPublicaciones();
}


// Botón recientes

$("btn-recientes").addEventListener("click", () => {

    cambiarFiltroPublicaciones("recientes");
});


// Botón populares

$("btn-populares").addEventListener("click", () => {

    cambiarFiltroPublicaciones("populares");
});

inicializarForos();
