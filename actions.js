// actions.js

// ===================================
// FUNCIONES DE GESTIÓN DE TURNOS
// ===================================

// Obtener el jugador activo actual
function obtenerJugadorActual() {
    return jugadores[gameState.jugadorActual];
}

// Pasar al siguiente jugador
function cambiarTurno() {
    gameState.jugadorActual = (gameState.jugadorActual + 1) % jugadores.length;
    addLog(`--- Turno de ${jugadores[gameState.jugadorActual].nombre} ---`, 'info');
    actualizarIU();
}

// Gastar PA y cambiar automáticamente de turno
function gastarPAyCambiarTurno(jugador, cantidad = 1) {
    jugador.paRestantes -= cantidad;

    // Si el jugador se quedó sin PA, verificar si todos terminaron
    if (jugador.paRestantes === 0) {
        addLog(`${jugador.nombre} ha gastado todos sus PA.`, 'info');

        if (todosJugadoresHanTerminado()) {
            addLog("Todos los jugadores han terminado sus PA. Inicia una nueva ronda.", 'alerta');
            actualizarIU();
        } else {
            // Cambiar al siguiente jugador automáticamente
            setTimeout(() => cambiarTurno(), 500);
        }
    } else {
        // Cambiar de turno automáticamente después de cada acción
        setTimeout(() => cambiarTurno(), 500);
    }
}

// Exportar función para uso global
window.cambiarTurno = cambiarTurno;
window.gastarPAyCambiarTurno = gastarPAyCambiarTurno;

// Verificar si todos los jugadores han terminado sus PA
function todosJugadoresHanTerminado() {
    return jugadores.every(j => j.paRestantes === 0);
}

// ===================================
// FUNCIONES DE ACTUALIZACIÓN DE UI
// ===================================

// Función para actualizar el DOM (la interfaz HTML)
function actualizarIU() {
    const jugador = obtenerJugadorActual();

    // Actualizar nombre del jugador activo
    const nombreEl = document.getElementById('jugador-nombre');
    if (nombreEl) {
        nombreEl.textContent = `Panel de ${jugador.nombre}`;
        nombreEl.style.color = gameState.jugadorActual === 0 ? '#e74c3c' : '#3498db';
    }

    // Actualizar indicador de turno
    const indicadorTurno = document.getElementById('indicador-turno');
    if (indicadorTurno) {
        const esJugadorInicial = gameState.jugadorActual === gameState.jugadorInicial;
        indicadorTurno.textContent = `⭐ ES TU TURNO ${esJugadorInicial ? '(Jugador Inicial)' : ''} ⭐`;
        indicadorTurno.style.background = gameState.jugadorActual === 0 ? '#e74c3c' : '#3498db';
    }

    const rondaEl = document.getElementById('ronda-actual');
    if (rondaEl) rondaEl.textContent = gameState.rondaActual;
    document.getElementById('dinero').textContent = jugador.dinero.toFixed(2);
    document.getElementById('pv').textContent = jugador.puntosVictoria;
    document.getElementById('pa-restantes').textContent = jugador.paRestantes;

    // Actualizar paneles superiores y inventarios de AMBOS jugadores
    jugadores.forEach((j, idx) => {
        const jugadorNum = idx + 1;
        const esActivo = idx === gameState.jugadorActual;

        // Actualizar panel superior de stats (dinero, PV, PA)
        const panelSuperior = document.getElementById(`jugador-panel-${jugadorNum}`);
        if (panelSuperior) {
            panelSuperior.className = `panel-jugador ${esActivo ? 'activo' : 'inactivo'}`;
            panelSuperior.style.opacity = esActivo ? '1' : '0.5';
        }

        const dineroEl = document.getElementById(`dinero-${jugadorNum}`);
        if (dineroEl) dineroEl.textContent = j.dinero.toFixed(0);

        const pvEl = document.getElementById(`pv-${jugadorNum}`);
        if (pvEl) pvEl.textContent = j.puntosVictoria;

        const paEl = document.getElementById(`pa-${jugadorNum}`);
        if (paEl) paEl.textContent = j.paRestantes;

        // Actualizar clases de panel de inventario (activo/inactivo)
        const panelInv = document.querySelector(`.jugador-${jugadorNum}-inv`);
        if (panelInv) {
            panelInv.className = `panel-inventario jugador-${jugadorNum}-inv ${esActivo ? 'activo' : 'inactivo'}`;
        }

        // Actualizar grano verde
        const invVerdeA = document.getElementById(`inv-verde-A-${jugadorNum}`);
        if (invVerdeA) invVerdeA.textContent = j.inventario.verde_A ?? 0;

        const invVerdeB = document.getElementById(`inv-verde-B-${jugadorNum}`);
        if (invVerdeB) invVerdeB.textContent = j.inventario.verde_B ?? 0;

        const invVerdeE = document.getElementById(`inv-verde-E-${jugadorNum}`);
        if (invVerdeE) invVerdeE.textContent = j.inventario.verde_E ?? 0;

        // Actualizar café procesado
        const invTostadoArtA = document.getElementById(`inv-tostado_artesanal-A-${jugadorNum}`);
        if (invTostadoArtA) invTostadoArtA.textContent = j.inventario.tostado_artesanal_A ?? 0;

        const invTostadoArtB = document.getElementById(`inv-tostado_artesanal-B-${jugadorNum}`);
        if (invTostadoArtB) invTostadoArtB.textContent = j.inventario.tostado_artesanal_B ?? 0;

        const invTostadoArtE = document.getElementById(`inv-tostado_artesanal-E-${jugadorNum}`);
        if (invTostadoArtE) invTostadoArtE.textContent = j.inventario.tostado_artesanal_E ?? 0;

        const invTostadoIndA = document.getElementById(`inv-tostado_industrial-A-${jugadorNum}`);
        if (invTostadoIndA) invTostadoIndA.textContent = j.inventario.tostado_industrial_A ?? 0;

        const invTostadoIndB = document.getElementById(`inv-tostado_industrial-B-${jugadorNum}`);
        if (invTostadoIndB) invTostadoIndB.textContent = j.inventario.tostado_industrial_B ?? 0;

        const invTostadoIndE = document.getElementById(`inv-tostado_industrial-E-${jugadorNum}`);
        if (invTostadoIndE) invTostadoIndE.textContent = j.inventario.tostado_industrial_E ?? 0;

        // Actualizar parcelas de este jugador
        let parcelasHTML = '<h4>🌱 Parcelas en Crecimiento:</h4>';
        if (j.parcelas.length === 0) {
            parcelasHTML += '<p style="color: #999;">No hay cultivos activos</p>';
        } else {
            j.parcelas.forEach((p) => {
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
        const parcelasListado = document.getElementById(`parcelas-listado-${jugadorNum}`);
        if (parcelasListado) parcelasListado.innerHTML = parcelasHTML;
    });

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

    // Actualizar paneles de tostadoras
    const mapaTostadoras = jugador.activos.tostadoras || {};
    ['A', 'B', 'E'].forEach(grano => {
        const tieneTostadora = !!mapaTostadoras[grano];
        const stockVerde = jugador.inventario[`verde_${grano}`] || 0;
        const btnComprar = document.getElementById(`btn-comprar-tostadora-${grano}`);
        const btnUsar = document.getElementById(`btn-usar-tostadora-${grano}`);
        const estado = document.getElementById(`tostadora-status-${grano}`);

        if (btnComprar) {
            if (tieneTostadora) {
                btnComprar.textContent = `Tostadora ${variedades[grano].nombre} adquirida`;
                btnComprar.setAttribute('disabled', 'disabled');
            } else {
                btnComprar.textContent = `Comprar Tostadora ${variedades[grano].nombre} (1 PA)`;
                // Deshabilitar si no hay PA
                if (paRestantes > 0) {
                    btnComprar.removeAttribute('disabled');
                } else {
                    btnComprar.setAttribute('disabled', 'disabled');
                }
            }
        }

        if (btnUsar) {
            if (tieneTostadora && paRestantes > 0 && stockVerde > 0) {
                btnUsar.removeAttribute('disabled');
            } else {
                btnUsar.setAttribute('disabled', 'disabled');
            }
        }

        if (estado) {
            estado.textContent = tieneTostadora ? `Lista · ${stockVerde} sacos verdes` : 'Sin máquina';
            estado.classList.toggle('tostadora-disponible', tieneTostadora);
        }
    });

    // Actualizar resumen de todos los jugadores
    actualizarResumenJugadores();
}

// Función para actualizar el resumen de jugadores
function actualizarResumenJugadores() {
    const resumenEl = document.getElementById('resumen-jugadores');
    if (!resumenEl) return;

    let html = '';
    jugadores.forEach((j, index) => {
        const esActual = index === gameState.jugadorActual;
        const esInicial = index === gameState.jugadorInicial;
        const color = index === 0 ? '#e74c3c' : '#3498db';
        const borderStyle = esActual ? `3px solid ${color}` : '1px solid #ddd';
        const bgColor = esActual ? 'rgba(52, 152, 219, 0.1)' : 'white';

        html += `
            <div style="border: ${borderStyle}; padding: 10px; margin-bottom: 10px; border-radius: 5px; background: ${bgColor};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h4 style="margin: 0; color: ${color};">
                        ${j.nombre} ${esActual ? '⭐' : ''} ${esInicial ? '(Inicial)' : ''}
                    </h4>
                    <span style="font-weight: bold; color: ${j.paRestantes > 0 ? '#27ae60' : '#95a5a6'};">
                        ${j.paRestantes} PA
                    </span>
                </div>
                <div style="font-size: 0.9em; margin-top: 5px; color: #555;">
                    💰 ${j.dinero.toFixed(0)}€ | ⭐ ${j.puntosVictoria} PV
                </div>
            </div>
        `;
    });

    resumenEl.innerHTML = html;
}

// ===================================
// A. FLUJO PRINCIPAL DEL JUEGO
// ===================================

function iniciarJuego() {
    console.log("Juego iniciado. Estado inicial:", jugadores[0]);
    actualizarIU();
    // Mostrar etiqueta inicial del botón
    const btnIniciar = document.getElementById('btn-iniciar-ronda');
    if (btnIniciar) btnIniciar.textContent = 'Empezar partida';
}

// ===================================
// PASAR TURNO (pierde 1 PA)
// ===================================

async function pasarTurno() {
    console.log("pasarTurno llamado");
    const jugador = obtenerJugadorActual();

    if (jugador.paRestantes < 1) {
        await mostrarAlerta("No tienes PA suficientes para pasar turno.", 'advertencia');
        return;
    }

    // Avanzar cultivos (los contratos solo cambian al final de la ronda)
    avanzarCultivos(jugador);

    addLog(`${jugador.nombre} pasa turno.`, 'accion');

    // Gastar PA y cambiar de turno automáticamente
    gastarPAyCambiarTurno(jugador, 1);
}

window.pasarTurno = pasarTurno;

async function iniciarRonda() {
    const btnIniciar = document.getElementById('btn-iniciar-ronda');
    const textoNuevaRonda = 'Nueva ronda';

    if (!gameState.partidaIniciada) {
        gameState.partidaIniciada = true;
        gameState.rondaActual = 1;
        gameState.jugadorActual = 0;
        gameState.jugadorInicial = 0;

        // Dar PA a todos los jugadores
        jugadores.forEach(j => j.paRestantes = 3);

        if (btnIniciar) btnIniciar.textContent = textoNuevaRonda;
        addLog(`--- RONDA ${gameState.rondaActual} INICIADA ---`, 'ronda');
        addLog(`Todos los jugadores reciben 3 PA.`, 'info');
        addLog(`Comienza ${jugadores[gameState.jugadorInicial].nombre}`, 'info');
        await asegurarContratosCompletos();
        actualizarIU();
        return;
    }

    if (btnIniciar) btnIniciar.textContent = textoNuevaRonda;

    // Verificar que todos los jugadores hayan terminado
    const jugadoresConPA = jugadores.filter(j => j.paRestantes > 0);
    if (jugadoresConPA.length > 0) {
        const nombres = jugadoresConPA.map(j => `${j.nombre} (${j.paRestantes} PA)`).join(', ');
        const confirmar = await mostrarConfirmacion(`Aún quedan jugadores con PA: ${nombres}. ¿Seguro que quieres pasar a la siguiente ronda?`);
        if (!confirmar) return;
    }

    gameState.rondaActual++;

    // Alternar jugador inicial
    gameState.jugadorInicial = (gameState.jugadorInicial + 1) % jugadores.length;
    gameState.jugadorActual = gameState.jugadorInicial;

    // Dar PA a todos los jugadores y aplicar mantenimiento
    jugadores.forEach(jugador => {
        jugador.paRestantes = 3;
        pagarMantenimiento(jugador);
        avanzarCultivos(jugador);
    });

    addLog(`--- RONDA ${gameState.rondaActual} INICIADA ---`, 'ronda');
    addLog(`Todos los jugadores reciben 3 PA.`, 'info');
    addLog(`Comienza ${jugadores[gameState.jugadorInicial].nombre}`, 'info');
    actualizarIU();

    await avanzarContratos();
}

// ===================================
// B. LÓGICA DE MANTENIMIENTO
// ===================================

function avanzarCultivos(jugador) {
    const nuevasParcelas = [];
    jugador.parcelas.forEach(parcela => {
        if (parcela.rondasRestantes > 0) {
            parcela.rondasRestantes--;
            if (parcela.rondasRestantes === 0) {
                if (parcela.esProcesamiento) {
                    const partes = parcela.tipo.split('_');
                    const inventarioKey = partes.slice(0, -1).join('_').toLowerCase() + '_' + partes[partes.length - 1];
                    if (!jugador.inventario[inventarioKey]) {
                        jugador.inventario[inventarioKey] = 0;
                    }
                    jugador.inventario[inventarioKey] += parcela.produccionSacos;
                    const tipoProceso = partes.slice(0, -1).join('_').toLowerCase();
                    const tipoGrano = partes[partes.length - 1];
                    const nombreVariedad = variedades[tipoGrano].nombre;
                    const nombreProceso = tipoProceso === 'tostado_artesanal' ? 'Café Premium' : 'Café Comercial';
                    addLog(`Procesamiento completado: +${parcela.produccionSacos} sacos de ${nombreVariedad} ${nombreProceso}`, 'ganancia');
                } else {
                    jugador.inventario[`verde_${parcela.tipo}`] += parcela.produccionSacos;
                    const nombreVariedad = variedades[parcela.tipo].nombre;
                    addLog(`Cosecha lista: ${nombreVariedad} +${parcela.produccionSacos} sacos.`, 'cosecha');
                    console.log(`COSECHA LISTA! ${nombreVariedad}: +${parcela.produccionSacos} sacos.`);
                }
            } else {
                nuevasParcelas.push(parcela);
            }
        }
    });
    jugador.parcelas = nuevasParcelas;
}

function pagarMantenimiento(jugador) {
    let costeTotal = 0;
    for (const tipo in jugador.inventario) {
        if (tipo.startsWith('verde_')) {
            costeTotal += jugador.inventario[tipo] * gameState.costeAlmacenamiento;
        }
    }

    if (jugador.dinero < costeTotal) {
        addLog(`ADVERTENCIA: Deuda de ${(costeTotal - jugador.dinero).toFixed(2)} EUR en almacenamiento`, 'alerta');
    }

    jugador.dinero -= costeTotal;

    if (costeTotal > 0) {
        addLog(`Costo de almacenamiento pagado: ${costeTotal.toFixed(2)} EUR`, 'gasto');
    }
}

async function plantar(tipoGrano) {
    const jugador = obtenerJugadorActual();
    const variedad = variedades[tipoGrano];
    
    if (jugador.paRestantes < 1) {
        await mostrarAlerta("¡No tienes Puntos de Acción (PA) suficientes!", 'advertencia');
        return;
    }
    if (jugador.dinero < variedad.costePlantacion) {
        await mostrarAlerta("¡No tienes dinero suficiente para plantar esta variedad!", 'error');
        return;
    }

    jugador.dinero -= variedad.costePlantacion;

    const nuevaParcela = {
        tipo: tipoGrano,
        rondasRestantes: variedad.tiempoCrecimiento,
        produccionSacos: variedad.produccionSacos
    };
    jugador.parcelas.push(nuevaParcela);

    console.log(`Plantado ${variedad.nombre}. Coste: ${variedad.costePlantacion} €. `);
    addLog(`Plantado ${variedad.nombre}. Coste: ${variedad.costePlantacion} €.`, 'gasto');

    actualizarIU();
    gastarPAyCambiarTurno(jugador, 1);
}

async function venderMercadoLocal(tipoGrano) {
    const jugador = obtenerJugadorActual();
    const inventarioKey = `verde_${tipoGrano}`;
    const precioUnitario = variedades[tipoGrano].precioVentaEmergencia;
    const cantidadVender = jugador.inventario[inventarioKey];

    if (jugador.paRestantes < 1) {
        await mostrarAlerta("¡No tienes Puntos de Acción (PA) suficientes para vender!", 'advertencia');
        return;
    }
    if (cantidadVender === 0) {
        await mostrarAlerta("No tienes sacos de este tipo para vender.", 'info');
        return;
    }
    
    const ganancia = cantidadVender * precioUnitario;
    jugador.dinero += ganancia;
    jugador.inventario[inventarioKey] = 0;

    const nombreVariedad = variedades[tipoGrano].nombre;
    console.log(`Vendido ${cantidadVender} sacos de ${nombreVariedad}. Ganancia: ${ganancia} €. `);
    addLog(`Vendido ${cantidadVender} sacos de ${nombreVariedad}. Ganancia: ${ganancia} €.`, 'ganancia');

    actualizarIU();
    gastarPAyCambiarTurno(jugador, 1);
}

function addLog(mensaje, tipo = 'accion', iconoPersonalizado = null) {
    const logContainer = document.getElementById('game-log');
    if (!logContainer) return;

    const item = document.createElement('p');
    item.classList.add('log-item');
    item.style.color = '';

    item.innerHTML = `<span class="log-icon">${iconoPersonalizado || ''}</span><span>[R${gameState.rondaActual}] ${mensaje}</span>`;
    logContainer.prepend(item);
}

let tipoVentaActual = null;

async function abrirModalVenta(tipoGrano) {
    const jugador = obtenerJugadorActual();
    tipoVentaActual = tipoGrano;
    const inventarioKey = `verde_${tipoGrano}`;
    const stock = jugador.inventario[inventarioKey];
    const precioUnitario = variedades[tipoGrano].precioVentaEmergencia;

    if (stock <= 0) {
        await mostrarAlerta("No tienes grano disponible para vender.", 'info');
        return;
    }

    document.getElementById('modalVenta').classList.add('mostrar');
    document.getElementById('modal-tipo-grano').textContent = variedades[tipoGrano].nombre;
    document.getElementById('modal-stock').textContent = stock;

    const select = document.getElementById('cantidadVenta');
    select.innerHTML = '';
    for (let i = 1; i <= stock; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = i;
        select.appendChild(opt);
    }

    document.getElementById('modal-ganancia-estimada').textContent = (1 * precioUnitario).toFixed(2) + ' €';

    select.onchange = () => {
        const cantidad = parseInt(select.value);
        const ganancia = cantidad * precioUnitario;
        document.getElementById('modal-ganancia-estimada').textContent = ganancia.toFixed(2) + ' €';
    };
}

function cerrarModalVenta() {
    document.getElementById('modalVenta').classList.remove('mostrar');
}

async function ejecutarVenta() {
    const jugador = obtenerJugadorActual();
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

    const ganancia = cantidad * precioUnitario;
    jugador.inventario[inventarioKey] -= cantidad;
    jugador.dinero += ganancia;

    const nombreVariedad = variedades[tipoVentaActual].nombre;
    addLog(`Vendido ${cantidad} sacos de ${nombreVariedad}. Ganancia: ${ganancia} €.`, 'ganancia');

    cerrarModalVenta();
    actualizarIU();
    gastarPAyCambiarTurno(jugador, 1);
}

// ===================================
// E. TOSTADORAS Y PROCESAMIENTO
// ===================================

let granoSeleccionadoTostadora = null;

async function comprarTostadora(tipoGrano) {
    const jugador = obtenerJugadorActual();

    // Verificar PA
    if (jugador.paRestantes < 1) {
        await mostrarAlerta('No tienes PA suficientes para comprar la tostadora.', 'advertencia');
        return;
    }

    const estado = jugador.activos.tostadoras || {};
    if (!jugador.activos.tostadoras) {
        jugador.activos.tostadoras = estado;
    }
    if (estado[tipoGrano]) {
        await mostrarAlerta(`Ya tienes la tostadora de ${variedades[tipoGrano].nombre}.`, 'info');
        return;
    }
    const coste = costeTostadoras[tipoGrano];
    const confirmar = await mostrarConfirmacion(
        `Comprar Tostadora de ${variedades[tipoGrano].nombre} por ${coste} €? (Coste: 1 PA)`,
        'Comprar Tostadora'
    );
    if (!confirmar) return;
    if (jugador.dinero < coste) {
        await mostrarAlerta('No tienes suficiente dinero para esta máquina.', 'error');
        return;
    }
    jugador.dinero -= coste;
    estado[tipoGrano] = true;
    addLog(`Tostadora comprada: ${variedades[tipoGrano].nombre} (${coste} €)`, 'gasto');

    actualizarIU();
    gastarPAyCambiarTurno(jugador, 1);
}

async function abrirTostadora(tipoGrano) {
    const jugador = obtenerJugadorActual();
    const estado = jugador.activos.tostadoras || {};
    if (!estado[tipoGrano]) {
        await mostrarAlerta('Compra la tostadora primero.', 'info');
        return;
    }
    const stockVerde = jugador.inventario[`verde_${tipoGrano}`] || 0;
    if (stockVerde === 0) {
        await mostrarAlerta(`No tienes grano verde ${variedades[tipoGrano].nombre} para procesar.`, 'info');
        return;
    }
    granoSeleccionadoTostadora = tipoGrano;
    const modal = document.getElementById('modalTostado');
    document.getElementById('modal-tostado-variedad').textContent = variedades[tipoGrano].nombre;
    document.getElementById('modal-tostado-stock').textContent = stockVerde;
    const inputCantidad = document.getElementById('modal-tostado-cantidad');
    inputCantidad.value = 1;
    inputCantidad.min = 1;
    document.querySelectorAll('input[name="metodo-tostado"]').forEach(radio => {
        radio.checked = radio.value === 'TOSTADO_ARTESANAL';
    });
    modal.classList.add('mostrar');
    actualizarCosteTostadoModal();
}

function cerrarModalTostado() {
    const modal = document.getElementById('modalTostado');
    if (modal) modal.classList.remove('mostrar');
    granoSeleccionadoTostadora = null;
}

function actualizarCosteTostadoModal() {
    if (!granoSeleccionadoTostadora) return;
    const jugador = obtenerJugadorActual();
    const metodoSeleccionado = document.querySelector('input[name="metodo-tostado"]:checked');
    const metodo = metodoSeleccionado ? metodoSeleccionado.value : 'TOSTADO_ARTESANAL';
    const proceso = procesos[metodo];
    const stockVerde = jugador.inventario[`verde_${granoSeleccionadoTostadora}`] || 0;
    const inputCantidad = document.getElementById('modal-tostado-cantidad');
    const maxPermitido = metodo === 'TOSTADO_INDUSTRIAL'
        ? Math.min(stockVerde, proceso.capacidadMaxima)
        : stockVerde;
    inputCantidad.max = Math.max(1, maxPermitido);
    if (parseInt(inputCantidad.value, 10) > maxPermitido) {
        inputCantidad.value = maxPermitido;
    }
    if (!inputCantidad.value || parseInt(inputCantidad.value, 10) < 1) {
        inputCantidad.value = Math.min(1, Math.max(1, maxPermitido));
    }
    const cantidad = Math.min(maxPermitido, parseInt(inputCantidad.value, 10) || 0);
    const coste = cantidad * proceso.costeProcesado;
    const rendimiento = proceso.rendimiento ?? 1;
    const produccion = cantidad ? Math.max(1, Math.round(cantidad * rendimiento)) : 0;
    document.getElementById('modal-tostado-coste').textContent = `${coste.toFixed(2)} €`;
    document.getElementById('modal-tostado-produccion').textContent = cantidad
        ? `${produccion} sacos (${metodo === 'TOSTADO_ARTESANAL' ? 'premium' : 'comerciales'})`
        : '--';
}

async function confirmarTostado() {
    if (!granoSeleccionadoTostadora) return;
    const cantidad = parseInt(document.getElementById('modal-tostado-cantidad').value, 10);
    const metodoSeleccionado = document.querySelector('input[name="metodo-tostado"]:checked');
    const metodo = metodoSeleccionado ? metodoSeleccionado.value : null;
    if (!metodo || !cantidad) return;
    const exito = await procesarCafe(granoSeleccionadoTostadora, metodo, cantidad);
    if (exito) {
        cerrarModalTostado();
    }
}

(function configurarModalTostadoListeners() {
    const inputCantidad = document.getElementById('modal-tostado-cantidad');
    if (inputCantidad) {
        inputCantidad.addEventListener('input', actualizarCosteTostadoModal);
    }
    document.querySelectorAll('input[name="metodo-tostado"]').forEach(radio => {
        radio.addEventListener('change', actualizarCosteTostadoModal);
    });
})();

window.comprarTostadora = comprarTostadora;
window.abrirTostadora = abrirTostadora;
window.cerrarModalTostado = cerrarModalTostado;
window.confirmarTostado = confirmarTostado;

// ===================================
// F. ANIMACIÓN DE DINERO
// ===================================

function animarCambioDinero(valorInicial, valorFinal, duracion = 2000) {
    const dineroEl = document.getElementById('dinero');
    if (!dineroEl) return;
    if (dineroEl._animFrame) {
        cancelAnimationFrame(dineroEl._animFrame);
        dineroEl._animFrame = null;
    }
    const inicio = performance.now();
    dineroEl.classList.add('dinero-animando');

    const actualizarValor = (ahora) => {
        const progreso = Math.min((ahora - inicio) / duracion, 1);
        const valor = valorInicial + (valorFinal - valorInicial) * progreso;
        dineroEl.textContent = valor.toFixed(2);
        if (progreso < 1) {
            dineroEl._animFrame = requestAnimationFrame(actualizarValor);
        } else {
            dineroEl.textContent = valorFinal.toFixed(2);
            dineroEl.classList.remove('dinero-animando');
            dineroEl._animFrame = null;
        }
    };

    dineroEl._animFrame = requestAnimationFrame(actualizarValor);
}

window.animarCambioDinero = animarCambioDinero;

// Iniciar la UI al cargar la página
window.onload = iniciarJuego;
