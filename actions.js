// actions.js
// Función para actualizar el DOM (la interfaz HTML)
function actualizarIU() {
    const jugador = jugadores[0]; // Usamos solo el primer jugador
    const rondaEl = document.getElementById('ronda-actual');
    if (rondaEl) rondaEl.textContent = gameState.rondaActual;
    document.getElementById('dinero').textContent = jugador.dinero.toFixed(2);
    document.getElementById('pv').textContent = jugador.puntosVictoria;
    document.getElementById('pa-restantes').textContent = jugador.paRestantes;
    document.getElementById('inv-verde-A').textContent = jugador.inventario.verde_A ?? 0;
    if (document.getElementById('inv-verde-B'))
        document.getElementById('inv-verde-B').textContent = jugador.inventario.verde_B ?? 0;
    if (document.getElementById('inv-verde-E'))
        document.getElementById('inv-verde-E').textContent = jugador.inventario.verde_E ?? 0;
    
    // Actualizar inventarios de café procesado
    const invTostadoArtA = document.getElementById('inv-tostado_artesanal-A');
    if (invTostadoArtA) invTostadoArtA.textContent = jugador.inventario.tostado_artesanal_A ?? 0;
    
    const invTostadoArtB = document.getElementById('inv-tostado_artesanal-B');
    if (invTostadoArtB) invTostadoArtB.textContent = jugador.inventario.tostado_artesanal_B ?? 0;
    
    const invTostadoArtE = document.getElementById('inv-tostado_artesanal-E');
    if (invTostadoArtE) invTostadoArtE.textContent = jugador.inventario.tostado_artesanal_E ?? 0;
    
    const invTostadoIndA = document.getElementById('inv-tostado_industrial-A');
    if (invTostadoIndA) invTostadoIndA.textContent = jugador.inventario.tostado_industrial_A ?? 0;
    
    const invTostadoIndB = document.getElementById('inv-tostado_industrial-B');
    if (invTostadoIndB) invTostadoIndB.textContent = jugador.inventario.tostado_industrial_B ?? 0;

    // === Lógica de Bloqueo de Botones ===
    const botonesAccion = document.querySelectorAll('.btn-accion');
    const btnIniciarRonda = document.getElementById('btn-iniciar-ronda');
    const btnPasarTurno = document.getElementById('btn-pasar-turno');
    const paRestantes = jugador.paRestantes;

    // Bloquear/Desbloquear botones de acción
    botonesAccion.forEach(btn => {
        if (paRestantes > 0) {
            btn.removeAttribute('disabled');
            btnIniciarRonda.classList.remove('btn-ronda-pendiente');
        } else {
            btn.setAttribute('disabled', 'disabled');
            btnIniciarRonda.classList.add('btn-ronda-pendiente'); // Pinta de verde
        }
    });
    
    // Habilitar/Deshabilitar botón pasar turno
    if (btnPasarTurno) {
        if (paRestantes > 0) {
            btnPasarTurno.removeAttribute('disabled');
        } else {
            btnPasarTurno.setAttribute('disabled', 'disabled');
        }
    }

    const stockA = jugador.inventario['verde_A'];
    const btnVenderA = document.getElementById('btn-vender-A');
    
    if (btnVenderA) {
        if (stockA > 0 && paRestantes > 0) {
            btnVenderA.removeAttribute('disabled');
        } else {
            btnVenderA.setAttribute('disabled', 'disabled');
        }
    }

    const stockB = jugador.inventario["verde_B"];
    const btnVenderB = document.getElementById("btn-vender-B");
    if (btnVenderB) {
        if (stockB > 0 && paRestantes > 0) {
            btnVenderB.removeAttribute("disabled");
        } else {
            btnVenderB.setAttribute("disabled", "disabled");
        }
    }

    const stockE = jugador.inventario["verde_E"];
    const btnVenderE = document.getElementById("btn-vender-E");
    if (btnVenderE) {
        if (stockE > 0 && paRestantes > 0) {
            btnVenderE.removeAttribute("disabled");
        } else {
            btnVenderE.setAttribute("disabled", "disabled");
        }
    }

    // Actualizar botones de procesamiento
    const botonesProcesar = document.querySelectorAll('.btn-procesar');
    botonesProcesar.forEach(btn => {
        const tipoGrano = btn.getAttribute('data-grano');
        const inventarioKey = `verde_${tipoGrano}`;
        const stockVerde = jugador.inventario[inventarioKey] || 0;
        
        // Habilitar si tiene PA y grano verde suficiente
        if (paRestantes > 0 && stockVerde > 0) {
            btn.removeAttribute('disabled');
        } else {
            btn.setAttribute('disabled', 'disabled');
        }
    });

    // Actualizar listado de parcelas
    let parcelasHTML = '<h4>Parcelas en Crecimiento:</h4>';
    if (jugador.parcelas.length === 0) {
        parcelasHTML += '<p style="color: #999;">No hay cultivos activos</p>';
    } else {
        jugador.parcelas.forEach((p, index) => {
            const progreso = '🌱'.repeat(Math.max(1, 4 - p.rondasRestantes));
            const nombreVariedad = variedades[p.tipo].nombre;
            parcelasHTML += `
                <div class="parcela-item">
                    ${progreso} <strong>${nombreVariedad}</strong> - 
                    ${p.rondasRestantes} ronda${p.rondasRestantes !== 1 ? 's' : ''} restante${p.rondasRestantes !== 1 ? 's' : ''} - 
                    Cosecha: ${p.produccionSacos} sacos
                </div>`;
        });
    }
    document.getElementById('parcelas-listado').innerHTML = parcelasHTML;
}

// ===================================
// A. FLUJO PRINCIPAL DEL JUEGO
// ===================================

function iniciarJuego() {
    console.log("Juego iniciado. Estado inicial:", jugadores[0]);
    actualizarIU();
    // Mostrar etiqueta inicial del botón
    const btnIniciar = document.getElementById('btn-iniciar-ronda');
    if (btnIniciar) btnIniciar.textContent = 'INICIAR PARTIDA';
}

// ===================================
// PASAR TURNO (pierde 1 PA)
// ===================================

async function pasarTurno() {
    console.log("pasarTurno llamado");
    const jugador = jugadores[0];
    
    if (jugador.paRestantes < 1) {
        await mostrarAlerta("No tienes PA suficientes para pasar turno. Usa 'INICIAR NUEVA RONDA' para obtener más PA.", 'advertencia');
        return;
    }
    
    // Pasar turno: pierde 1 PA y avanza el tiempo
    jugador.paRestantes--;
    
    // Avanzar cultivos (los contratos solo cambian al final de la ronda)
    avanzarCultivos(jugador);
    
    addLog(`⏱️ Turno pasado. PA restantes: ${jugador.paRestantes}`, 'accion');
    actualizarIU();
}

// Asegurar que la función esté disponible globalmente
window.pasarTurno = pasarTurno;

async function iniciarRonda() {
    const jugador = jugadores[0];
    
    // Si la partida no ha comenzado, inicializar
    if (!gameState.partidaIniciada) {
        gameState.partidaIniciada = true;
        gameState.rondaActual = 1;
        jugador.paRestantes = 3;
        generarContratos(); // Generar 6 contratos iniciales

        const btnIniciar = document.getElementById('btn-iniciar-ronda');
        if (btnIniciar) btnIniciar.textContent = 'NUEVA RONDA';

        addLog(`--- RONDA ${gameState.rondaActual} INICIADA. Recibes 3 PA. ---`, 'ronda');
        actualizarIU();
        return;
    }
    
    if (jugador.paRestantes > 0) {
        const confirmar = await mostrarConfirmacion(
            `Aún te quedan ${jugador.paRestantes} PA sin gastar. ¿Seguro que quieres pasar a la siguiente ronda?`
        );
        if (!confirmar) return;
    }

    gameState.rondaActual++;
    jugador.paRestantes = 3;
    
    pagarMantenimiento(jugador);
    avanzarCultivos(jugador);
    avanzarContratos();  // Reducir rondas y eliminar expirados (solo una vez por ronda)
    generarContratos(); // Rellenar hasta 6 contratos tras expiraciones/cumplidos
    
    addLog(`--- RONDA ${gameState.rondaActual} INICIADA. Recibes 3 PA. ---`, 'ronda');
    actualizarIU();
}

// Las funciones avanzarCultivos y pagarMantenimiento no necesitan cambios en su contenido.
// Su lógica ya es correcta para lo que hacen, solo fallaba el orden de llamada.

// ===================================
// B. LÓGICA DE MANTENIMIENTO
// ===================================

function avanzarCultivos(jugador) {
    const nuevasParcelas = [];
    jugador.parcelas.forEach(parcela => {
        if (parcela.rondasRestantes > 0) {
            parcela.rondasRestantes--;
            if (parcela.rondasRestantes === 0) {
                // Verificar si es procesamiento o cultivo
                if (parcela.esProcesamiento) {
                    // Procesamiento completado
                    // Convertir "TOSTADO_ARTESANAL_A" a "tostado_artesanal_A"
                    const partes = parcela.tipo.split('_');
                    const inventarioKey = partes.slice(0, -1).join('_').toLowerCase() + '_' + partes[partes.length - 1];
                    if (!jugador.inventario[inventarioKey]) {
                        jugador.inventario[inventarioKey] = 0;
                    }
                    jugador.inventario[inventarioKey] += parcela.produccionSacos;
                    // Obtener nombre legible para el log
                    const tipoProceso = partes.slice(0, -1).join('_').toLowerCase();
                    const tipoGrano = partes[partes.length - 1];
                    const nombreVariedad = variedades[tipoGrano].nombre;
                    const nombreProceso = tipoProceso === 'tostado_artesanal' ? 'Tostado Artesanal' : 'Tostado Industrial';
                    addLog(`☕ Procesamiento completado: +${parcela.produccionSacos} sacos de ${nombreVariedad} ${nombreProceso}`, 'ganancia');
                } else {
                    // Cosecha lista!
                    jugador.inventario[`verde_${parcela.tipo}`] += parcela.produccionSacos;
                    const nombreVariedad = variedades[parcela.tipo].nombre;
                    addLog(`¡Cosecha lista! ${nombreVariedad}: +${parcela.produccionSacos} sacos.`, 'ganancia');
                    console.log(`¡COSECHA LISTA! ${nombreVariedad}: +${parcela.produccionSacos} sacos.`);
                }
            } else {
                nuevasParcelas.push(parcela);
            }
        }
    });
    // Solo quedan las parcelas que siguen en crecimiento
    jugador.parcelas = nuevasParcelas; 
}

function pagarMantenimiento(jugador) {
    let costeTotal = 0;
    for (const tipo in jugador.inventario) {
        if (tipo.startsWith('verde_')) {
            costeTotal += jugador.inventario[tipo] * gameState.costeAlmacenamiento;
        }
    }
    
    // Advertir si no tiene suficiente dinero
    if (jugador.dinero < costeTotal) {
        addLog(`⚠️ ADVERTENCIA: Deuda de ${(costeTotal - jugador.dinero).toFixed(2)}€ en almacenamiento`, 'gasto');
    }
    
    jugador.dinero -= costeTotal;
    
    if (costeTotal > 0) {
        addLog(`Costo de Almacenamiento pagado: ${costeTotal.toFixed(2)}€`, 'gasto');
    }
}

// ===================================
// C. ACCIONES DEL JUGADOR (GASTAN PA)
// ===================================

async function plantar(tipoGrano) {
    const jugador = jugadores[0];
    const variedad = variedades[tipoGrano];
    
    if (jugador.paRestantes < 1) {
        await mostrarAlerta("¡No tienes Puntos de Acción (PA) suficientes!", 'advertencia');
        return;
    }
    if (jugador.dinero < variedad.costePlantacion) {
        await mostrarAlerta("¡No tienes dinero suficiente para plantar esta variedad!", 'error');
        return;
    }

    // 1. Ejecutar acción
    jugador.paRestantes--;
    jugador.dinero -= variedad.costePlantacion;

    // 2. Crear la parcela y añadirla al array
    const nuevaParcela = {
        tipo: tipoGrano,
        rondasRestantes: variedad.tiempoCrecimiento,
        produccionSacos: variedad.produccionSacos
    };
    jugador.parcelas.push(nuevaParcela);

    console.log(`Plantado ${variedad.nombre}. Coste: ${variedad.costePlantacion}€.`);
    addLog(`Plantado ${variedad.nombre}. Coste: ${variedad.costePlantacion}€.`, 'gasto');
    actualizarIU();
}

async function venderMercadoLocal(tipoGrano) {
    const jugador = jugadores[0];
    const inventarioKey = `verde_${tipoGrano}`;
    const precioUnitario = variedades[tipoGrano].precioVentaEmergencia;
    const cantidadVender = jugador.inventario[inventarioKey]; // Vender todo el stock

    if (jugador.paRestantes < 1) {
        await mostrarAlerta("¡No tienes Puntos de Acción (PA) suficientes para vender!", 'advertencia');
        return;
    }
    if (cantidadVender === 0) {
        await mostrarAlerta("No tienes sacos de este tipo para vender.", 'info');
        return;
    }
    
    // 1. Ejecutar acción
    jugador.paRestantes--;

    // 2. Cálculo
    const ganancia = cantidadVender * precioUnitario;
    jugador.dinero += ganancia;
    jugador.inventario[inventarioKey] = 0; // Vaciar inventario vendido

    const nombreVariedad = variedades[tipoGrano].nombre;
    console.log(`Vendido ${cantidadVender} sacos de ${nombreVariedad}. Ganancia: ${ganancia}€.`);
    addLog(`Vendido ${cantidadVender} sacos de ${nombreVariedad}. Ganancia: ${ganancia}€.`, 'ganancia');
    actualizarIU();
}

function addLog(mensaje, tipo = 'accion') {
    const logContainer = document.getElementById('game-log');
    const item = document.createElement('p');
    item.classList.add('log-item');
    
    let color = '';
    if (tipo === 'ronda') color = '#0056b3'; // Azul para el inicio de ronda
    if (tipo === 'ganancia') color = '#28a745'; // Verde para el dinero
    if (tipo === 'gasto') color = '#dc3545'; // Rojo para los gastos
    
    item.style.color = color;
    item.innerHTML = `[R${gameState.rondaActual}] ${mensaje}`;
    
    // Añadir el mensaje al inicio del log (los más recientes arriba)
    logContainer.prepend(item); 
}

// ===================================
// D. MODAL DE VENTA PARCIAL
// ===================================

let tipoVentaActual = null;

async function abrirModalVenta(tipoGrano) {
    const jugador = jugadores[0];
    tipoVentaActual = tipoGrano;
    const inventarioKey = `verde_${tipoGrano}`;
    const stock = jugador.inventario[inventarioKey];
    const precioUnitario = variedades[tipoGrano].precioVentaEmergencia;

    if (stock <= 0) {
        await mostrarAlerta("No tienes grano disponible para vender.", 'info');
        return;
    }

    // Mostrar modal
    document.getElementById('modalVenta').classList.add('mostrar');
    document.getElementById('modal-tipo-grano').textContent = variedades[tipoGrano].nombre;
    document.getElementById('modal-stock').textContent = stock;

    // Rellenar desplegable de 1 hasta stock
    const select = document.getElementById('cantidadVenta');
    select.innerHTML = '';
    for (let i = 1; i <= stock; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = i;
        select.appendChild(opt);
    }

    // Calcular ganancia estimada inicial
    document.getElementById('modal-ganancia-estimada').textContent = (1 * precioUnitario).toFixed(2) + '€';

    // Actualizar ganancia al cambiar selección
    select.onchange = () => {
        const cantidad = parseInt(select.value);
        const ganancia = cantidad * precioUnitario;
        document.getElementById('modal-ganancia-estimada').textContent = ganancia.toFixed(2) + '€';
    };
}

function cerrarModalVenta() {
    document.getElementById('modalVenta').classList.remove('mostrar');
}

async function ejecutarVenta() {
    const jugador = jugadores[0];
    const select = document.getElementById('cantidadVenta');
    const cantidad = parseInt(select.value);
    const inventarioKey = `verde_${tipoVentaActual}`;
    const precioUnitario = variedades[tipoVentaActual].precioVentaEmergencia;

    if (jugador.paRestantes < 1) {
        await mostrarAlerta("¡No tienes PA suficientes para vender!", 'advertencia');
        return;
    }

    if (cantidad <= 0 || cantidad > jugador.inventario[inventarioKey]) {
        await mostrarAlerta("Cantidad no válida.", 'error');
        return;
    }

    // Calcular ganancia
    const ganancia = cantidad * precioUnitario;
    jugador.inventario[inventarioKey] -= cantidad;
    jugador.dinero += ganancia;
    jugador.paRestantes--;

    const nombreVariedad = variedades[tipoVentaActual].nombre;
    addLog(`Vendido ${cantidad} sacos de ${nombreVariedad}. Ganancia: ${ganancia}€.`, 'ganancia');

    cerrarModalVenta();
    actualizarIU();
}


// Iniciar la UI al cargar la página
window.onload = iniciarJuego;
