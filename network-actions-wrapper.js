// network-actions-wrapper.js
// Wrapper para interceptar acciones del juego y enrutarlas por la red

// ===================================
// GUARDAR FUNCIONES ORIGINALES
// ===================================

let funcionesOriginales = {};

function guardarFuncionesOriginales() {
    funcionesOriginales.plantar = window.plantar;
    funcionesOriginales.comprarTostadora = window.comprarTostadora; // Función interna sin modal
    funcionesOriginales.confirmarCompraTostadora = window.confirmarCompraTostadora; // Función con modal
    funcionesOriginales.procesarCafe = window.procesarCafe;
    funcionesOriginales.ejecutarVenta = window.ejecutarVenta;
    funcionesOriginales.intentarCumplirContrato = window.intentarCumplirContrato; // Función interna sin alertas
    funcionesOriginales.confirmarCumplirContrato = window.confirmarCumplirContrato; // Función con alertas
    funcionesOriginales.pasarTurno = window.pasarTurno;
    funcionesOriginales.iniciarRonda = window.iniciarRonda;
}

// ===================================
// WRAPPERS DE ACCIONES
// ===================================

async function plantarWrapper(tipo) {
    console.log(`🌱 plantarWrapper llamado - tipo: ${tipo}, modo: ${gameNetwork?.gameMode}`);

    if (!gameNetwork || gameNetwork.gameMode === 'local') {
        console.log('→ Ejecutando localmente (modo local)');
        return await funcionesOriginales.plantar(tipo);
    }

    console.log('→ Enrutando a través de networkAction');
    return await networkAction('PLANTAR', { tipo });
}

async function comprarTostadoraWrapper(tipo) {
    console.log(`🏭 comprarTostadoraWrapper llamado - tipo: ${tipo}, modo: ${gameNetwork?.gameMode}`);

    if (!gameNetwork || gameNetwork.gameMode === 'local') {
        console.log('→ Modo local: usando función con modal');
        return await funcionesOriginales.confirmarCompraTostadora(tipo);
    }

    console.log('→ Modo online: mostrando confirmación y luego enviando por red');

    // Mostrar confirmación primero
    const jugador = window.jugadores[gameNetwork.isHost ? 0 : 1];

    // Verificaciones básicas
    if (jugador.paRestantes < 1) {
        await mostrarAlerta('No tienes PA suficientes para comprar la tostadora.', 'advertencia');
        return;
    }

    const estado = jugador.activos.tostadoras || {};
    if (estado[tipo]) {
        await mostrarAlerta(`Ya tienes la tostadora de ${window.variedades[tipo].nombre}.`, 'info');
        return;
    }

    const coste = window.costeTostadoras?.[tipo] || { A: 1500, B: 2000, E: 2500 }[tipo];

    // Mostrar confirmación
    const confirmar = await mostrarConfirmacion(
        `Comprar Tostadora de ${window.variedades[tipo].nombre} por ${coste} €? (Coste: 1 PA)`,
        'Comprar Tostadora'
    );

    if (!confirmar) {
        console.log('→ Usuario canceló la compra');
        return; // Usuario canceló - no hacer nada, no consumir PA
    }

    if (jugador.dinero < coste) {
        await mostrarAlerta('No tienes suficiente dinero para esta máquina.', 'error');
        return;
    }

    // Usuario aceptó - enviar por red
    console.log('→ Usuario aceptó, enviando por networkAction');
    return await networkAction('COMPRAR_TOSTADORA', { tipo });
}

async function procesarCafeWrapper(tipoGrano, tipoProceso, cantidad) {
    if (!gameNetwork || gameNetwork.gameMode === 'local') {
        return await funcionesOriginales.procesarCafe(tipoGrano, tipoProceso, cantidad);
    }

    return await networkAction('PROCESAR_CAFE', { tipoGrano, tipoProceso, cantidad });
}

async function ejecutarVentaWrapper() {
    if (!gameNetwork || gameNetwork.gameMode === 'local') {
        return await funcionesOriginales.ejecutarVenta();
    }

    // Obtener datos del modal de venta
    const tipo = window.tipoVentaActual;
    const cantidad = parseInt(document.getElementById('cantidadVenta')?.value || 1);

    return await networkAction('VENDER', { tipo, cantidad });
}

async function intentarCumplirContratoWrapper(contratoId) {
    console.log(`📋 intentarCumplirContratoWrapper llamado - contratoId: ${contratoId}, modo: ${gameNetwork?.gameMode}`);

    if (!gameNetwork || gameNetwork.gameMode === 'local') {
        console.log('→ Modo local: usando función con validaciones');
        return await funcionesOriginales.confirmarCumplirContrato(contratoId);
    }

    console.log('→ Modo online: validando y luego enviando por red');

    const jugador = window.jugadores[gameNetwork.isHost ? 0 : 1];
    const contrato = window.contratosDisponibles?.find(c => c.id === contratoId);

    // Validaciones básicas (con alertas)
    if (!contrato) {
        await mostrarAlerta("Contrato no encontrado", 'error');
        return;
    }

    if (jugador.paRestantes < 1) {
        await mostrarAlerta("No tienes PA suficientes!", 'advertencia');
        return;
    }

    // Usamos la función de utilidad para obtener la clave exacta del inventario
    const obtenerKeyInventario = (tipo, grano) => `${tipo}_${grano}`;
    const inventarioKey = obtenerKeyInventario(contrato.tipo, contrato.grano);

    const stockDisponible = jugador.inventario[inventarioKey] || 0;

    if (stockDisponible < contrato.cantidadRequerida) {
        // Accedemos directamente a variedades con el grano ('A', 'B' o 'E')
        const infoVariedad = window.variedades[contrato.grano];
        const nombreCafe = contrato.tipo === 'verde'
            ? `${infoVariedad.nombre} Verde`
            : `${infoVariedad.nombre} ${contrato.tipo.includes('artesanal') ? 'Premium' : 'Comercial'}`;

        await mostrarAlerta(
            `Necesitas ${contrato.cantidadRequerida} sacos de ${nombreCafe}. Solo tienes ${stockDisponible}.`,
            'advertencia'
        );
        return;
    }

    // Validaciones pasadas - enviar por red
    console.log('→ Validaciones pasadas, enviando por networkAction');
    return await networkAction('CUMPLIR_CONTRATO', { contratoId });
}

async function pasarTurnoWrapper() {
    if (!gameNetwork || gameNetwork.gameMode === 'local') {
        return await funcionesOriginales.pasarTurno();
    }

    return await networkAction('PASAR_TURNO', {});
}

async function iniciarRondaWrapper() {
    console.log('🔄 iniciarRondaWrapper() llamado');
    console.log('📡 gameNetwork:', gameNetwork ? `modo: ${gameNetwork.gameMode}` : 'undefined');
    console.log('📝 funcionesOriginales.iniciarRonda:', typeof funcionesOriginales.iniciarRonda);

    if (!gameNetwork || gameNetwork.gameMode === 'local') {
        console.log('→ Ejecutando en modo local, llamando a función original');
        if (typeof funcionesOriginales.iniciarRonda === 'function') {
            return await funcionesOriginales.iniciarRonda();
        } else {
            console.error('❌ ERROR: funcionesOriginales.iniciarRonda NO ES UNA FUNCIÓN');
            console.error('funcionesOriginales:', funcionesOriginales);
            return;
        }
    }

    console.log('→ Ejecutando en modo online, enviando por red');
    return await networkAction('INICIAR_RONDA', {});
}

// ===================================
// APLICAR WRAPPERS
// ===================================

function aplicarWrappersDeRed() {
    // Primero guardar las originales
    guardarFuncionesOriginales();

    // Luego reemplazarlas con los wrappers
    window.plantar = plantarWrapper;
    window.comprarTostadora = comprarTostadoraWrapper;
    window.procesarCafe = procesarCafeWrapper;
    window.ejecutarVenta = ejecutarVentaWrapper;
    window.intentarCumplirContrato = intentarCumplirContratoWrapper;
    window.pasarTurno = pasarTurnoWrapper;
    window.iniciarRonda = iniciarRondaWrapper;

    console.log('✅ Wrappers de red aplicados');
}

// Exportar para acceso desde executeActionLocally
window.funcionesOriginales = funcionesOriginales;
window.aplicarWrappersDeRed = aplicarWrappersDeRed;

// Aplicar wrappers al cargar - DESPUÉS de que todo esté listo
function inicializarWrappers() {
    // Esperar a que todas las funciones originales estén cargadas
    const esperarFunciones = setInterval(() => {
        if (window.plantar && window.comprarTostadora && window.ejecutarVenta) {
            clearInterval(esperarFunciones);
            aplicarWrappersDeRed();
            console.log('✅ Wrappers de red aplicados y listos');
        }
    }, 100);

    // Timeout de seguridad
    setTimeout(() => {
        clearInterval(esperarFunciones);
        if (!window.funcionesOriginales?.plantar) {
            console.warn('⚠️ Timeout esperando funciones - aplicando wrappers de todos modos');
            aplicarWrappersDeRed();
        }
    }, 3000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarWrappers);
} else {
    inicializarWrappers();
}

// Exportar para llamada manual si es necesario
window.inicializarWrappers = inicializarWrappers;
