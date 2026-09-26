const API = "/api/productos";
const STOCK_BAJO = 5;     // a partir de esta cantidad (exclusive) se considera stock sano

const $ = (id) => document.getElementById(id);
const campos = ["nombre", "categoria", "precio", "cantidad"];

const ICONOS = {
    editar: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    borrar: '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
    ok: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/></svg>',
    error: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>',
};

let idEnEdicion = null;   // null = estamos creando; un número = estamos editando
let temporizador = null;  // para no llamar al servidor en cada tecla

/* ---------------------------------------------------------------- listar */
async function cargar() {
    const texto = $("busqueda").value.trim();
    const url = texto ? `${API}?q=${encodeURIComponent(texto)}` : API;

    try {
        const respuesta = await fetch(url);
        if (!respuesta.ok) throw new Error("El servidor respondió " + respuesta.status);
        pintar(await respuesta.json(), texto);
    } catch (e) {
        avisar("No se pudo conectar con el servidor. Revisa que la aplicación esté corriendo.", true);
    }
}

function pintar(productos, texto) {
    const cuerpo = $("cuerpo-tabla");
    cuerpo.innerHTML = "";

    productos.forEach((p) => {
        const fila = document.createElement("tr");
        if (p.id === idEnEdicion) fila.classList.add("editando");

        fila.appendChild(celda("#" + p.id, "col-id"));
        fila.appendChild(celda(p.nombre, "nombre"));

        const cat = document.createElement("td");
        const etiqueta = document.createElement("span");
        etiqueta.className = "etiqueta";
        etiqueta.textContent = p.categoria;
        cat.appendChild(etiqueta);
        fila.appendChild(cat);

        fila.appendChild(celda(moneda(p.precio), "num"));
        fila.appendChild(celda(numero(p.cantidad), "num"));
        fila.appendChild(celdaEstado(p.cantidad));

        const acciones = document.createElement("td");
        acciones.className = "col-acciones";
        const grupo = document.createElement("div");

        const editar = botonIcono(ICONOS.editar, "Editar " + p.nombre);
        editar.onclick = () => abrirPanel(p);

        const borrar = botonIcono(ICONOS.borrar, "Eliminar " + p.nombre, "peligro");
        borrar.onclick = () => confirmarBorrado(p, grupo);

        grupo.append(editar, borrar);
        acciones.appendChild(grupo);
        fila.appendChild(acciones);
        cuerpo.appendChild(fila);
    });

    $("vacio").classList.toggle("oculto", productos.length > 0);
    $("vacio-texto").textContent = texto
        ? `Ningún producto coincide con "${texto}".`
        : "Todavía no hay productos. Crea el primero con «Nuevo producto».";

    actualizarMetricas(productos);

    // sugerencias de categoría para el formulario
    $("categorias").innerHTML = "";
    [...new Set(productos.map((p) => p.categoria))].forEach((c) => {
        const op = document.createElement("option");
        op.value = c;
        $("categorias").appendChild(op);
    });
}

function actualizarMetricas(productos) {
    const unidades = productos.reduce((suma, p) => suma + p.cantidad, 0);
    const valor = productos.reduce((suma, p) => suma + Number(p.precio) * p.cantidad, 0);
    const bajos = productos.filter((p) => p.cantidad <= STOCK_BAJO).length;

    $("m-productos").textContent = numero(productos.length);
    $("m-unidades").textContent = numero(unidades);
    $("m-valor").textContent = moneda(valor);
    $("m-bajo").textContent = numero(bajos);
    $("resumen").textContent = productos.length;
}

/* --------------------------------------------------------- guardar/editar */
async function guardar() {
    limpiarErrores();

    const producto = {
        nombre: $("nombre").value.trim(),
        categoria: $("categoria").value.trim(),
        precio: $("precio").value === "" ? null : Number($("precio").value),
        cantidad: $("cantidad").value === "" ? null : Number($("cantidad").value),
    };

    const creando = idEnEdicion === null;
    let respuesta;
    try {
        respuesta = await fetch(creando ? API : `${API}/${idEnEdicion}`, {
            method: creando ? "POST" : "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(producto),
        });
    } catch (e) {
        avisar("No se pudo conectar con el servidor.", true);
        return;
    }

    if (respuesta.status === 400) {
        const errores = await respuesta.json();
        Object.entries(errores).forEach(([campo, mensaje]) => {
            const caja = $(campo);
            if (caja) {
                caja.classList.add("invalido");
                $("error-" + campo).textContent = mensaje;
            }
        });
        return;
    }

    if (!respuesta.ok) {
        avisar("No se pudo guardar. Intenta de nuevo.", true);
        return;
    }

    avisar(creando ? "Producto creado correctamente." : "Cambios guardados.");
    cerrarPanel();
    cargar();
}

/* --------------------------------------------------------- panel lateral */
function abrirPanel(p = null) {
    limpiarErrores();
    idEnEdicion = p ? p.id : null;

    $("nombre").value = p ? p.nombre : "";
    $("categoria").value = p ? p.categoria : "";
    $("precio").value = p ? p.precio : "";
    $("cantidad").value = p ? p.cantidad : "";

    $("titulo-form").textContent = p ? "Editar producto" : "Nuevo producto";
    $("sub-form").textContent = p
        ? `Modificando el producto #${p.id}.`
        : "Completa la información del producto.";
    $("btn-guardar").textContent = p ? "Guardar cambios" : "Crear producto";

    document.body.classList.add("panel-abierto");
    $("panel").setAttribute("aria-hidden", "false");
    setTimeout(() => $("nombre").focus(), 150);
    if (p) cargar();
}

function cerrarPanel() {
    const estabaEditando = idEnEdicion !== null;
    idEnEdicion = null;
    document.body.classList.remove("panel-abierto");
    $("panel").setAttribute("aria-hidden", "true");
    limpiarErrores();
    if (estabaEditando) cargar();
}

/* ------------------------------------------------------------- eliminar */
function confirmarBorrado(p, grupo) {
    grupo.innerHTML = "";

    const no = boton("Cancelar", "mini");
    no.onclick = () => cargar();

    const si = boton("Eliminar", "mini peligro");
    si.onclick = async () => {
        const respuesta = await fetch(`${API}/${p.id}`, { method: "DELETE" });
        if (respuesta.ok) {
            if (idEnEdicion === p.id) cerrarPanel();
            avisar(`"${p.nombre}" fue eliminado.`);
            cargar();
        } else {
            avisar("No se pudo eliminar el producto.", true);
        }
    };

    grupo.append(no, si);
    si.focus();
}

/* --------------------------------------------------------------- ayudas */
function celda(valor, clase) {
    const td = document.createElement("td");
    td.textContent = valor;
    if (clase) td.className = clase;
    return td;
}

function celdaEstado(cantidad) {
    const td = document.createElement("td");
    const span = document.createElement("span");
    if (cantidad === 0) {
        span.className = "estado agotado";
        span.textContent = "Agotado";
    } else if (cantidad <= STOCK_BAJO) {
        span.className = "estado bajo";
        span.textContent = "Stock bajo";
    } else {
        span.className = "estado ok";
        span.textContent = "Disponible";
    }
    td.appendChild(span);
    return td;
}

function boton(texto, clase) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = texto;
    b.className = clase;
    return b;
}

function botonIcono(svg, etiqueta, extra = "") {
    const b = document.createElement("button");
    b.type = "button";
    b.className = ("icono " + extra).trim();
    b.innerHTML = svg;
    b.title = etiqueta;
    b.setAttribute("aria-label", etiqueta);
    return b;
}

function moneda(valor) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(valor);
}

function numero(valor) {
    return new Intl.NumberFormat("es-CO").format(valor);
}

function avisar(mensaje, esError = false) {
    const toast = document.createElement("div");
    toast.className = "toast" + (esError ? " malo" : "");
    toast.innerHTML = esError ? ICONOS.error : ICONOS.ok;
    const texto = document.createElement("span");
    texto.textContent = mensaje;
    toast.appendChild(texto);
    $("toasts").appendChild(toast);

    setTimeout(() => {
        toast.classList.add("saliendo");
        setTimeout(() => toast.remove(), 200);
    }, 3500);
}

function limpiarErrores() {
    campos.forEach((c) => {
        $(c).classList.remove("invalido");
        $("error-" + c).textContent = "";
    });
}

/* ---------------------------------------------------------------- eventos */
$("btn-nuevo").onclick = () => abrirPanel();
$("btn-guardar").onclick = guardar;
$("btn-cancelar").onclick = cerrarPanel;
$("btn-cerrar").onclick = cerrarPanel;
$("velo").onclick = cerrarPanel;
$("formulario").addEventListener("submit", (e) => {
    e.preventDefault();
    guardar();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("panel-abierto")) cerrarPanel();
});

$("busqueda").addEventListener("input", () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(cargar, 250);
});

campos.forEach((c) =>
    $(c).addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            guardar();
        }
    })
);

cargar();
