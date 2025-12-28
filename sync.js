// sync.js - Validación y sincronización de acciones del juego

class GameSync {
    constructor(networkInstance) {
        this.network = networkInstance;
    }

    // ===================================
    // VALIDACIÓN DE ACCIONES
    // ===================================

    validateAction(actionType, actionData, playerIndex) {
        // INICIAR_RONDA no requiere validación de jugador (el juego aún no está inicializado)
        if (actionType === 'INICIAR_RONDA') {
            return true;
        }

        const jugador = window.jugadores?.[playerIndex];

        if (!jugador) {
            console.error('❌ Jugador no encontrado:', playerIndex);
            return false;
        }

        switch (actionType) {
            case 'PLANTAR':
                return this.validatePlantar(jugador, actionData);

            case 'VENDER':
                return this.validateVender(jugador, actionData);

            case 'COMPRAR_TOSTADORA':
                return this.validateComprarTostadora(jugador, actionData);

            case 'PROCESAR_CAFE':
                return this.validateProcesarCafe(jugador, actionData);

            case 'CUMPLIR_CONTRATO':
                return this.validateCumplirContrato(jugador, actionData);

            case 'PASAR_TURNO':
                return true; // Siempre válido

            case 'INICIAR_RONDA':
                return true; // El host siempre puede iniciar

            default:
                console.warn('⚠️ Tipo de acción desconocido para validación:', actionType);
                return true; // Por defecto permitir
        }
    }

    // ===================================
    // VALIDACIONES ESPECÍFICAS
    // ===================================

    validatePlantar(jugador, data) {
        const { tipo } = data;
        const variedad = window.variedades?.[tipo];

        if (!variedad) {
            console.error('❌ Tipo de variedad no encontrado:', tipo);
            return false;
        }

        // Verificar dinero
        if (jugador.dinero < variedad.costePlantacion) {
            console.warn('⚠️ Dinero insuficiente para plantar');
            return false;
        }

        // Verificar PA
        if (jugador.paRestantes < 1) {
            console.warn('⚠️ PA insuficientes');
            return false;
        }

        return true;
    }

    validateVender(jugador, data) {
        const { tipo, cantidad } = data;

        // Verificar inventario
        const inventarioKey = `verde${tipo}`;
        const inventarioDisponible = jugador.inventario?.[inventarioKey] || 0;

        if (inventarioDisponible < cantidad) {
            console.warn('⚠️ Inventario insuficiente para vender');
            return false;
        }

        // Verificar PA
        if (jugador.paRestantes < 1) {
            console.warn('⚠️ PA insuficientes');
            return false;
        }

        return true;
    }

    validateComprarTostadora(jugador, data) {
        const { tipo } = data;

        // Verificar si ya tiene la tostadora
        if (jugador.tostadoras?.[tipo]) {
            console.warn('⚠️ Ya tiene esta tostadora');
            return false;
        }

        // Verificar dinero (las tostadoras cuestan según el tipo)
        const costes = { 'A': 2000, 'B': 4000, 'E': 8000 };
        const coste = costes[tipo] || 2000;

        if (jugador.dinero < coste) {
            console.warn('⚠️ Dinero insuficiente para comprar tostadora');
            return false;
        }

        // Verificar PA
        if (jugador.paRestantes < 1) {
            console.warn('⚠️ PA insuficientes');
            return false;
        }

        return true;
    }

    validateProcesarCafe(jugador, data) {
        const { tipoGrano, tipoProceso, cantidad } = data;

        // Verificar que tenga la tostadora
        if (!jugador.tostadoras?.[tipoGrano]) {
            console.warn('⚠️ No tiene tostadora para este tipo de grano');
            return false;
        }

        // Verificar inventario de grano verde
        const inventarioKey = `verde${tipoGrano}`;
        const inventarioDisponible = jugador.inventario?.[inventarioKey] || 0;

        if (inventarioDisponible < cantidad) {
            console.warn('⚠️ Grano verde insuficiente');
            return false;
        }

        // Verificar dinero para el procesamiento
        const costeProceso = cantidad * 100; // Ejemplo: 100€ por saco
        if (jugador.dinero < costeProceso) {
            console.warn('⚠️ Dinero insuficiente para procesar');
            return false;
        }

        // Verificar PA
        if (jugador.paRestantes < 1) {
            console.warn('⚠️ PA insuficientes');
            return false;
        }

        return true;
    }

    validateCumplirContrato(jugador, data) {
        const { contratoId } = data;

        // Verificar que el contrato existe
        const contrato = window.contratosDisponibles?.find(c => c.id === contratoId);

        if (!contrato) {
            console.warn('⚠️ Contrato no encontrado');
            return false;
        }

        // Verificar inventario según requisitos del contrato
        // (La validación detallada se hace en la función de cumplir contrato)

        // Verificar PA
        if (jugador.paRestantes < 1) {
            console.warn('⚠️ PA insuficientes');
            return false;
        }

        return true;
    }

    // ===================================
    // CHECKSUM PARA DETECCIÓN DE DESINCRONIZACIÓN
    // ===================================

    generateChecksum(gameState, jugadores) {
        // Crear un hash simple del estado del juego
        const stateString = JSON.stringify({
            ronda: gameState?.rondaActual,
            dineros: jugadores?.map(j => j.dinero),
            pvs: jugadores?.map(j => j.pv)
        });

        // Hash simple (en producción usar algo más robusto)
        let hash = 0;
        for (let i = 0; i < stateString.length; i++) {
            const char = stateString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }

        return hash.toString(16);
    }

    verifyChecksum(remoteChecksum) {
        const localChecksum = this.generateChecksum(window.gameState, window.jugadores);

        if (localChecksum !== remoteChecksum) {
            console.warn('⚠️ Checksums no coinciden - posible desincronización');
            console.log('Local:', localChecksum, 'Remoto:', remoteChecksum);
            return false;
        }

        return true;
    }
}

// Exportar globalmente
window.GameSync = GameSync;
