// network-actions-wrapper.js
// Wrapper para interceptar acciones del juego y enrutarlas por la red

// ===================================
// GUARDAR FUNCIONES ORIGINALES
// ===================================

let funcionesOriginales = {};

function guardarFuncionesOriginales() {
    funcionesOriginales.plantar = window.plantar;
    funcionesOriginales.comprarTostadora = window.comprarTostadora;
    funcionesOriginales.procesarCafe = window.procesarCafe;
    funcionesOriginales.ejecutarVenta = window.ejecutarVenta;
    funcionesOriginales.intentarCumplirContrato = window.intentarCumplirContrato;
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
    if (!gameNetwork || gameNetwork.gameMode === 'local') {
        return await funcionesOriginales.comprarTostadora(tipo);
    }

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
    if (!gameNetwork || gameNetwork.gameMode === 'local') {
        return await funcionesOriginales.intentarCumplirContrato(contratoId);
    }

    return await networkAction('CUMPLIR_CONTRATO', { contratoId });
}

async function pasarTurnoWrapper() {
    if (!gameNetwork || gameNetwork.gameMode === 'local') {
        return await funcionesOriginales.pasarTurno();
    }

    return await networkAction('PASAR_TURNO', {});
}

async function iniciarRondaWrapper() {
    if (!gameNetwork || gameNetwork.gameMode === 'local') {
        return await funcionesOriginales.iniciarRonda();
    }

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
