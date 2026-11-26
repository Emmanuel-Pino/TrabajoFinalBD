
// =====================================================
// FOROS - COMUNIDADES
// Integración con MySQL y MongoDB mediante la API
// =====================================================

const $ = (id) => document.getElementById(id);

const API = "/api/comunidades";

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

        // Aquí cargaremos las publicaciones y el chat
        // en las siguientes fases del proyecto.

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

cargarComunidades();
