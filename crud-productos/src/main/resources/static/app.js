const API = "/api/productos";

const $ = (id) => document.getElementById(id);
const campos = ["nombre", "categoria", "precio", "cantidad"];

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

        fila.appendChild(celda(p.id, "col-id"));
        fila.appendChild(celda(p.nombre));
        fila.appendChild(celda(p.categoria));
        fila.appendChild(celda(moneda(p.precio), "num"));
        fila.appendChild(celda(p.cantidad, "num"));

        const acciones = document.createElement("td");
        acciones.className = "col-acciones";
        const grupo = document.createElement("div");

        const editar = boton("Editar", "mini");
        editar.onclick = () => llenarFormulario(p);

        const borrar = boton("Eliminar", "mini peligro");
        borrar.onclick = () => confirmarBorrado(p, grupo);

        grupo.append(editar, borrar);
        acciones.appendChild(grupo);
        fila.appendChild(acciones);
        cuerpo.appendChild(fila);
    });

    const vacio = $("vacio");
    vacio.classList.toggle("oculto", productos.length > 0);
    vacio.textContent = texto
        ? `Ningún producto coincide con "${texto}".`
        : "Todavía no hay productos. Registra el primero con el formulario.";

    const unidades = productos.reduce((suma, p) => suma + p.cantidad, 0);
    $("resumen").textContent =
        `${productos.length} producto(s) · ${unidades} unidades en existencia`;

    // sugerencias de categoría para el formulario
    $("categorias").innerHTML = "";
    [...new Set(productos.map((p) => p.categoria))].forEach((c) => {
        const op = document.createElement("option");
        op.value = c;
        $("categorias").appendChild(op);
    });
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
    const respuesta = await fetch(creando ? API : `${API}/${idEnEdicion}`, {
        method: creando ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(producto),
    });

    if (respuesta.status === 400) {
        const errores = await respuesta.json();
        Object.entries(errores).forEach(([campo, mensaje]) => {
            const caja = $(campo);
            if (caja) {
                caja.classList.add("invalido");
                $("error-" + campo).textContent = mensaje;
            }
        });
        avisar("Revisa los campos marcados.", true);
        return;
    }

    if (!respuesta.ok) {
        avisar("No se pudo guardar. Intenta de nuevo.", true);
        return;
    }

    avisar(creando ? "Producto guardado." : "Cambios guardados.");
    limpiarFormulario();
    cargar();
}

function llenarFormulario(p) {
    idEnEdicion = p.id;
    $("nombre").value = p.nombre;
    $("categoria").value = p.categoria;
    $("precio").value = p.precio;
    $("cantidad").value = p.cantidad;

    $("titulo-form").textContent = `Editando el producto ${p.id}`;
    $("btn-guardar").textContent = "Guardar cambios";
    $("btn-cancelar").classList.remove("oculto");
    limpiarErrores();
    $("nombre").focus();
    cargar();
}

function limpiarFormulario() {
    idEnEdicion = null;
    campos.forEach((c) => ($(c).value = ""));
    $("titulo-form").textContent = "Nuevo producto";
    $("btn-guardar").textContent = "Guardar producto";
    $("btn-cancelar").classList.add("oculto");
    limpiarErrores();
}

/* ------------------------------------------------------------- eliminar */
function confirmarBorrado(p, grupo) {
    grupo.innerHTML = "";

    const si = boton("Sí, eliminar", "mini peligro");
    si.onclick = async () => {
        const respuesta = await fetch(`${API}/${p.id}`, { method: "DELETE" });
        if (respuesta.ok) {
            if (idEnEdicion === p.id) limpiarFormulario();
            avisar(`"${p.nombre}" fue eliminado.`);
            cargar();
        } else {
            avisar("No se pudo eliminar el producto.", true);
        }
    };

    const no = boton("No", "mini");
    no.onclick = () => cargar();

    grupo.append(si, no);
    si.focus();
}

/* --------------------------------------------------------------- ayudas */
function celda(valor, clase) {
    const td = document.createElement("td");
    td.textContent = valor;
    if (clase) td.className = clase;
    return td;
}

function boton(texto, clase) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = texto;
    b.className = clase;
    return b;
}

function moneda(valor) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 2,
    }).format(valor);
}

function avisar(mensaje, esError = false) {
    const aviso = $("aviso");
    aviso.textContent = mensaje;
    aviso.classList.toggle("malo", esError);
    setTimeout(() => (aviso.textContent = ""), 4000);
}

function limpiarErrores() {
    campos.forEach((c) => {
        $(c).classList.remove("invalido");
        $("error-" + c).textContent = "";
    });
}

/* ---------------------------------------------------------------- eventos */
$("btn-guardar").onclick = guardar;
$("btn-cancelar").onclick = limpiarFormulario;

$("busqueda").addEventListener("input", () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(cargar, 250);
});

campos.forEach((c) =>
    $(c).addEventListener("keydown", (e) => {
        if (e.key === "Enter") guardar();
    })
);

cargar();
