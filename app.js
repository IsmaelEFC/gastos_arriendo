// --- VARIABLES GLOBALES ---
let productos = []; 
let totalEfectivo = parseFloat(localStorage.getItem('totalEfectivo')) || 0;
let totalTransferencia = parseFloat(localStorage.getItem('totalTransferencia')) || 0;
let detalleVentas = JSON.parse(localStorage.getItem('detalleVentas')) || {};
let ventaActual = null;

// --- ELEMENTOS DEL DOM ---
const productosGrid = document.querySelector('.grid-productos');
const totalEfectivoSpan = document.getElementById('total-efectivo');
const totalTransferenciaSpan = document.getElementById('total-transferencia');
const fechaActualSpan = document.getElementById('fecha-actual');
const modalPago = document.getElementById('modal-pago');
const montoModalSpan = document.getElementById('monto-modal');
const pagoEfectivoBtn = document.getElementById('pago-efectivo');
const pagoTransferenciaBtn = document.getElementById('pago-transferencia');
const pagoCombinadoBtn = document.getElementById('pago-combinado');
const pagoCombinadoForm = document.getElementById('pago-combinado-form');
const montoEfectivoInput = document.getElementById('monto-efectivo');
const montoTransferenciaInput = document.getElementById('monto-transferencia');
const confirmarCombinadoBtn = document.getElementById('confirmar-combinado');
const cancelarCombinadoBtn = document.getElementById('cancelar-combinado');
const reiniciarDiaBtn = document.getElementById('reiniciar-dia');
const verTotalDetalleBtn = document.getElementById('ver-total-detalle');
const modalDetalle = document.getElementById('modal-detalle');
const totalGeneradoSpan = document.getElementById('total-generado');
const detalleListaUl = document.getElementById('detalle-lista');
const generarPdfBtn = document.getElementById('generar-pdf-btn'); // Nuevo botón

const agregarProductoBtn = document.getElementById('agregar-producto-btn');
const modalAgregarProducto = document.getElementById('modal-agregar-producto');
const formNuevoProducto = document.getElementById('form-nuevo-producto');
const nombreProductoInput = document.getElementById('nombre-producto');
const precioProductoInput = document.getElementById('precio-producto');
const categoriaProductoSelect = document.getElementById('categoria-producto');

// --- FUNCIONES ---

async function inicializarApp() {
    try {
        console.log('Inicializando aplicación...');
        
        // Configurar la fecha actual
        const hoy = new Date();
        const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        if (fechaActualSpan) {
            fechaActualSpan.textContent = hoy.toLocaleDateString('es-CL', opcionesFecha);
        } else {
            console.error('Elemento fechaActualSpan no encontrado en el DOM');
        }
        
        // Cargar productos
        await cargarProductos();
        
        // Generar botones de productos
        generarBotonesProductos();

        // Llenar el select de categorías
        llenarSelectCategorias();
        
        // Cargar totales desde localStorage
        const savedEfectivo = parseFloat(localStorage.getItem('totalEfectivo')) || 0;
        const savedTransferencia = parseFloat(localStorage.getItem('totalTransferencia')) || 0;
        const savedDetalle = JSON.parse(localStorage.getItem('detalleVentas') || '{}');
        
        // Actualizar variables globales
        totalEfectivo = savedEfectivo;
        totalTransferencia = savedTransferencia;
        detalleVentas = savedDetalle;
        
        // Actualizar la interfaz
        actualizarResumen();
        
        console.log('Aplicación inicializada correctamente');
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
    }
}

async function cargarProductos() {
    try {
        // Primero intentar cargar desde el archivo JSON
        const response = await fetch('./productos.json');
        if (response.ok) {
            const data = await response.json();
            // Verificar si la estructura tiene categorías
            if (data.categorias && Array.isArray(data.categorias)) {
                productos = data.categorias;
                // Guardar en localStorage para uso posterior
                localStorage.setItem('productos', JSON.stringify({ categorias: data.categorias }));
                return;
            } else if (Array.isArray(data)) {
                // Si es un array plano, convertirlo a estructura de categorías
                const categorias = {};
                data.forEach(producto => {
                    const categoria = producto.categoria || 'General';
                    if (!categorias[categoria]) {
                        categorias[categoria] = [];
                    }
                    categorias[categoria].push({
                        nombre: producto.nombre,
                        precio: Number(producto.precio) || 0
                    });
                });
                
                productos = Object.entries(categorias).map(([nombre, productosCategoria]) => ({
                    nombre,
                    productos: productosCategoria
                }));
                
                // Guardar la estructura convertida en localStorage
                localStorage.setItem('productos', JSON.stringify({ categorias: productos }));
                return;
            }
        }
    } catch (error) {
        console.error('Error al cargar productos.json:', error);
    }
    
    try {
        // Si falla, intentar cargar desde localStorage
        const productosGuardados = localStorage.getItem('productos');
        if (productosGuardados) {
            const data = JSON.parse(productosGuardados);
            if (data.categorias && Array.isArray(data.categorias)) {
                productos = data.categorias;
                return;
            } else if (Array.isArray(data)) {
                // Manejar estructura antigua si es necesario
                const categorias = {};
                data.forEach(producto => {
                    const categoria = producto.categoria || 'General';
                    if (!categorias[categoria]) {
                        categorias[categoria] = [];
                    }
                    categorias[categoria].push({
                        nombre: producto.nombre,
                        precio: Number(producto.precio) || 0
                    });
                });
                
                productos = Object.entries(categorias).map(([nombre, productosCategoria]) => ({
                    nombre,
                    productos: productosCategoria
                }));
                
                // Guardar la estructura convertida en localStorage
                localStorage.setItem('productos', JSON.stringify({ categorias: productos }));
                return;
            }
        }
    } catch (error) {
        console.error('Error al cargar productos desde localStorage:', error);
    }
    
    // Si todo falla, usar datos por defecto
    productos = [{
        nombre: 'General',
        productos: [
            { nombre: 'Producto de ejemplo', precio: 1000 }
        ]
    }];
    
    // Guardar la estructura por defecto en localStorage
    localStorage.setItem('productos', JSON.stringify({ categorias: productos }));
}

function generarBotonesProductos() {
    const categoriasContainer = document.getElementById('categorias-container');
    categoriasContainer.innerHTML = '';

    // Verificar si los productos están en el formato de categorías
    if (productos.length > 0 && productos[0].productos) {
        // Recorrer cada categoría
        productos.forEach((categoria, index) => {
            // Crear contenedor de categoría
            const categoriaDiv = document.createElement('div');
            categoriaDiv.className = 'categoria' + (index === 0 ? ' activa' : '');
            
            // Crear encabezado de categoría
            const header = document.createElement('div');
            header.className = 'categoria-header';
            header.innerHTML = `
                <span>${categoria.nombre}</span>
                <span class="toggle-icon">${index === 0 ? '▼' : '▶'}</span>
            `;
            
            // Crear contenedor de productos
            const contenido = document.createElement('div');
            contenido.className = 'categoria-contenido' + (index === 0 ? ' activo' : '');
            
            // Verificar si hay productos en la categoría
            if (Array.isArray(categoria.productos) && categoria.productos.length > 0) {
                // Ordenar productos alfabéticamente
                const productosOrdenados = [...categoria.productos].sort((a, b) => 
                    a.nombre.localeCompare(b.nombre)
                );
                
                // Agregar productos
                productosOrdenados.forEach(producto => {
                    const btn = document.createElement('button');
                    btn.className = 'producto-btn';
                    btn.innerHTML = `
                        <span class="nombre">${producto.nombre}</span>
                        <span class="precio">$${producto.precio.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                    `;
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        abrirModalPago(producto);
                    });
                    contenido.appendChild(btn);
                });
            } else {
                // Mostrar mensaje si no hay productos
                const mensaje = document.createElement('div');
                mensaje.className = 'sin-productos';
                mensaje.textContent = 'No hay productos en esta categoría';
                contenido.appendChild(mensaje);
            }
            
            // Manejar clic en el encabezado de la categoría
            header.addEventListener('click', () => {
                // Cerrar todas las categorías primero
                document.querySelectorAll('.categoria').forEach(cat => {
                    if (cat !== categoriaDiv) {
                        cat.classList.remove('activa');
                        cat.querySelector('.toggle-icon').textContent = '▶';
                    }
                });
                
                // Alternar la categoría actual
                const isActive = categoriaDiv.classList.toggle('activa');
                const icon = header.querySelector('.toggle-icon');
                icon.textContent = isActive ? '▼' : '▶';
                
                // Asegurar que el contenedor de contenido esté configurado correctamente
                const contenido = categoriaDiv.querySelector('.categoria-contenido');
                if (isActive) {
                    contenido.style.display = 'grid';
                    // Forzar un reflow para que la animación funcione
                    void contenido.offsetHeight;
                    contenido.style.maxHeight = contenido.scrollHeight + 'px';
                } else {
                    contenido.style.maxHeight = '0';
                    // Esperar a que termine la animación antes de ocultar
                    setTimeout(() => {
                        if (!categoriaDiv.classList.contains('activa')) {
                            contenido.style.display = 'none';
                        }
                    }, 300);
                }
            });
            
            // Agregar elementos al DOM
            categoriaDiv.appendChild(header);
            categoriaDiv.appendChild(contenido);
            categoriasContainer.appendChild(categoriaDiv);
        });
    } else {
        // Si no hay categorías, mostrar un mensaje
        const mensaje = document.createElement('div');
        mensaje.className = 'sin-categorias';
        mensaje.textContent = 'No hay categorías disponibles';
        categoriasContainer.appendChild(mensaje);
    }
}

function llenarSelectCategorias() {
    categoriaProductoSelect.innerHTML = '';
    productos.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.nombre;
        option.textContent = categoria.nombre;
        categoriaProductoSelect.appendChild(option);
    });
}

function abrirModalPago(producto) {
    ventaActual = producto;
    montoModalSpan.textContent = formatearPrecio(ventaActual.precio);
    modalPago.style.display = 'flex';
    
    // Ocultar el formulario de pago combinado al abrir el modal
    pagoCombinadoForm.style.display = 'none';
    
    // Restablecer los valores de los inputs
    if (montoEfectivoInput && montoTransferenciaInput) {
        montoEfectivoInput.value = '';
        montoTransferenciaInput.value = '';
    }
}

function abrirModalAgregarProducto() {
    modalAgregarProducto.style.display = 'flex';
    llenarSelectCategorias();
}

function cerrarModal(modal) {
    modal.style.display = 'none';
}

function formatearPrecio(monto) {
    return `$${monto.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`;
}

function actualizarResumen() {
    try {
        console.log('Actualizando resumen...', { totalEfectivo, totalTransferencia });
        
        // Asegurarse de que los elementos del DOM existen
        if (!totalEfectivoSpan || !totalTransferenciaSpan) {
            console.error('Elementos del resumen no encontrados en el DOM');
            return;
        }
        
        // Formatear y mostrar los totales
        totalEfectivoSpan.textContent = formatearPrecio(totalEfectivo || 0);
        totalTransferenciaSpan.textContent = formatearPrecio(totalTransferencia || 0);
        
        // Guardar en localStorage
        localStorage.setItem('totalEfectivo', totalEfectivo);
        localStorage.setItem('totalTransferencia', totalTransferencia);
        localStorage.setItem('detalleVentas', JSON.stringify(detalleVentas || {}));
        localStorage.setItem('productos', JSON.stringify({ categorias: productos || [] }));
        
        console.log('Resumen actualizado correctamente');
    } catch (error) {
        console.error('Error al actualizar el resumen:', error);
    }
}

function registrarVenta(metodo) {
    const nombreProducto = ventaActual.nombre;
    const precioProducto = ventaActual.precio;
    if (metodo === 'efectivo') {
        totalEfectivo += precioProducto;
    } else if (metodo === 'transferencia') {
        totalTransferencia += precioProducto;
    }
    if (!detalleVentas[nombreProducto]) {
        detalleVentas[nombreProducto] = { cantidad: 0, total: 0 };
    }
    detalleVentas[nombreProducto].cantidad++;
    detalleVentas[nombreProducto].total += precioProducto;
    actualizarResumen();
    cerrarModal(modalPago);
}

// Ahora, el botón de reiniciar caja llama a esta función para mostrar el detalle primero
function prepararCierreDeCaja() {
    mostrarDetalle();
}

// Genera el reporte PDF y luego reinicia la caja
async function generarPDFyReiniciar() {
    const { jsPDF } = window.jspdf;
    
    if (Object.keys(detalleVentas).length === 0) {
        alert('No hay ventas para generar un reporte. Reiniciando caja.');
        reiniciarCaja();
        return;
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    let y = 15; // Posición vertical inicial
    
    // --- Título del Reporte ---
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Reporte de Cierre de Caja', 105, y, null, null, 'center');
    y += 10;

    // --- Totales ---
    const totalGenerado = totalEfectivo + totalTransferencia;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total Generado: ${formatearPrecio(totalGenerado)}`, 15, y);
    y += 7;
    pdf.text(`Ventas Efectivo: ${formatearPrecio(totalEfectivo)}`, 15, y);
    y += 7;
    pdf.text(`Ventas Transferencia: ${formatearPrecio(totalTransferencia)}`, 15, y);
    y += 15;

    // --- Título de la lista de ventas ---
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Detalle de Ventas:', 15, y);
    y += 8;

    // --- Detalle de Ventas ---
    const detalleArray = Object.keys(detalleVentas).map(key => ({
        nombre: key,
        ...detalleVentas[key]
    }));
    detalleArray.sort((a, b) => a.nombre.localeCompare(b.nombre));

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');

    detalleArray.forEach(item => {
        const precioUnitario = item.total / item.cantidad;
        const linea = `${item.nombre} - ${item.cantidad} x ${formatearPrecio(precioUnitario)} = ${formatearPrecio(item.total)}`;
        
        // Salto de página si la línea no cabe
        if (y > 280) {
            pdf.addPage();
            y = 15; // Restablecer la posición vertical
        }
        
        pdf.text(linea, 15, y);
        y += 7;
    });

    // --- Lógica para descargar o compartir el PDF ---
    const today = new Date().toISOString().slice(0, 10);
    const filename = `Reporte_Caja_${today}.pdf`;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile && navigator.share) {
        try {
            const pdfBlob = pdf.output('blob');
            await navigator.share({
                files: [new File([pdfBlob], filename, { type: 'application/pdf' })],
                title: 'Reporte de Caja',
                text: 'Aquí está el reporte de cierre de caja.'
            });
            reiniciarCaja();
        } catch (error) {
            console.error('Error al compartir:', error);
            // Fallback de descarga si la compartición falla
            const pdfBlob = pdf.output('blob');
            const a = document.createElement('a');
            a.href = URL.createObjectURL(pdfBlob);
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            reiniciarCaja();
        }
    } else {
        // Opción de descarga para escritorio y navegadores sin 'share'
        pdf.save(filename);
        reiniciarCaja();
    }
}

// Reinicia los totales para el cierre de caja (función de reinicio real)
function reiniciarCaja() {
    // Agrega una confirmación para evitar borrados accidentales
    if (confirm('¿Estás seguro de que quieres reiniciar la caja? Esta acción eliminará los totales y el detalle de ventas del día.')) {
        totalEfectivo = 0;
        totalTransferencia = 0;
        detalleVentas = {};
        actualizarResumen();
        cerrarModal(modalDetalle);
        alert('Caja reiniciada. ¡Día cerrado!');
    }
}

function mostrarDetalle() {
    const totalGenerado = totalEfectivo + totalTransferencia;
    totalGeneradoSpan.textContent = formatearPrecio(totalGenerado);
    detalleListaUl.innerHTML = '';
    
    const detalleArray = Object.keys(detalleVentas).map(key => ({
        nombre: key,
        ...detalleVentas[key]
    }));
    detalleArray.sort((a, b) => a.nombre.localeCompare(b.nombre));

    if (detalleArray.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No hay ventas registradas para hoy.';
        detalleListaUl.appendChild(li);
        generarPdfBtn.style.display = 'none'; // Oculta el botón si no hay ventas
    } else {
        detalleArray.forEach(item => {
            const li = document.createElement('li');
            const precioUnitario = item.total / item.cantidad;
            li.innerHTML = `
                <span>${item.nombre}</span>
                <span>${item.cantidad} x ${formatearPrecio(precioUnitario)} = ${formatearPrecio(item.total)}</span>
            `;
            detalleListaUl.appendChild(li);
        });
        generarPdfBtn.style.display = 'block'; // Muestra el botón si hay ventas
    }
    modalDetalle.style.display = 'flex';
}

function manejarNuevoProducto(event) {
    event.preventDefault();
    const nombre = nombreProductoInput.value.trim();
    const precio = parseFloat(precioProductoInput.value);
    const categoriaNombre = categoriaProductoSelect.value;
    
    if (nombre && !isNaN(precio) && precio >= 0) {
        const categoriaExistente = productos.find(c => c.nombre === categoriaNombre);
        if (categoriaExistente) {
            const productoExistente = categoriaExistente.productos.find(p => 
                p.nombre.toLowerCase() === nombre.toLowerCase()
            );
            if (productoExistente) {
                alert(`El producto "${nombre}" ya existe en la categoría "${categoriaNombre}".`);
                return;
            }
            categoriaExistente.productos.push({ nombre, precio });
        } else {
            // Esto no debería pasar si el select se llena correctamente, pero es una buena práctica
            productos.push({
                nombre: categoriaNombre,
                productos: [{ nombre, precio }]
            });
        }

        actualizarResumen();
        generarBotonesProductos();
        alert(`Producto "${nombre}" agregado con éxito a la categoría "${categoriaNombre}".`);
        formNuevoProducto.reset();
        cerrarModal(modalAgregarProducto);
    } else {
        alert('Por favor, ingresa un nombre y un precio válido.');
    }
}

function registrarServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js');
        });
    }
}

// --- FUNCIONES DE PAGO COMBINADO ---
function mostrarFormularioCombinado() {
    pagoCombinadoForm.style.display = 'block';
    // Establecer el valor total en el input de efectivo por defecto
    if (ventaActual) {
        montoEfectivoInput.value = ventaActual.precio;
        montoTransferenciaInput.value = 0;
    }
}

function ocultarFormularioCombinado() {
    pagoCombinadoForm.style.display = 'none';
}

function validarMontoCombinado() {
    if (!ventaActual) return false;
    
    const montoEfectivo = parseFloat(montoEfectivoInput.value) || 0;
    const montoTransferencia = parseFloat(montoTransferenciaInput.value) || 0;
    const totalIngresado = montoEfectivo + montoTransferencia;
    const diferencia = Math.abs(totalIngresado - ventaActual.precio);
    
    // Permitir pequeñas diferencias por redondeo
    if (diferencia > 1) {
        alert(`La suma de los montos (${formatearPrecio(totalIngresado)}) no coincide con el total a pagar (${formatearPrecio(ventaActual.precio)})`);
        return false;
    }
    
    return { montoEfectivo, montoTransferencia };
}

function registrarPagoCombinado() {
    const montos = validarMontoCombinado();
    if (!montos) return;
    
    // Registrar la venta con los montos correspondientes
    if (montos.montoEfectivo > 0) {
        totalEfectivo += montos.montoEfectivo;
    }
    
    if (montos.montoTransferencia > 0) {
        totalTransferencia += montos.montoTransferencia;
    }
    
    // Registrar el detalle de la venta
    const nombreProducto = ventaActual.nombre;
    if (!detalleVentas[nombreProducto]) {
        detalleVentas[nombreProducto] = { cantidad: 0, total: 0 };
    }
    detalleVentas[nombreProducto].cantidad++;
    detalleVentas[nombreProducto].total += ventaActual.precio;
    
    actualizarResumen();
    cerrarModal(modalPago);
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', inicializarApp);

// Eventos de botones de pago
pagoEfectivoBtn.addEventListener('click', () => registrarVenta('efectivo'));
pagoTransferenciaBtn.addEventListener('click', () => registrarVenta('transferencia'));
pagoCombinadoBtn.addEventListener('click', mostrarFormularioCombinado);
cancelarCombinadoBtn.addEventListener('click', ocultarFormularioCombinado);
confirmarCombinadoBtn.addEventListener('click', registrarPagoCombinado);

// Evento para el botón de cancelar pago
document.getElementById('cancelar-pago').addEventListener('click', () => {
    cerrarModal(modalPago);
    ocultarFormularioCombinado();
});

// Otros eventos
reiniciarDiaBtn.addEventListener('click', reiniciarCaja);
verTotalDetalleBtn.addEventListener('click', mostrarDetalle);
generarPdfBtn.addEventListener('click', generarPDFyReiniciar);
agregarProductoBtn.addEventListener('click', abrirModalAgregarProducto);
formNuevoProducto.addEventListener('submit', manejarNuevoProducto);

document.querySelectorAll('.close-button').forEach(btn => {
    btn.addEventListener('click', (event) => {
        const modalId = event.target.getAttribute('data-modal');
        const modal = document.getElementById(modalId);
        if (modal) {
            cerrarModal(modal);
        }
    });
});

window.addEventListener('click', (event) => {
    if (event.target === modalPago) {
        cerrarModal(modalPago);
    }
    if (event.target === modalDetalle) {
        cerrarModal(modalDetalle);
    }
    if (event.target === modalAgregarProducto) {
        cerrarModal(modalAgregarProducto);
    }
});