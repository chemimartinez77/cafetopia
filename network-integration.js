// network-integration.js - Integración Socket.io con el juego

let gameNetwork = null;
let gameSync = null;

// ===================================
// INICIALIZACIÓN
// ===================================

function initializeNetwork() {
    console.log('🌐 Inicializando Socket.io...');

    // Crear instancia de red
    gameNetwork = new GameNetworkSocketIO();

    // Conectar al servidor
    gameNetwork.connect('http://localhost:3000');

    // Configurar callbacks
    gameNetwork.onGameCreated((data) => {
        console.log('🎮 Partida creada:', data.gameId);
        mostrarPantallaEspera(data.gameId);
    });

    gameNetwork.onPlayerJoined((data) => {
        console.log('👤 Jugador unido:', data.playerName);
        iniciarPartidaMultijugador(data.playerName, false);
    });

    gameNetwork.onGameJoined((data) => {
        console.log('✅ Unido a partida');
        iniciarPartidaMultijugador(data.opponentName, true);
    });

    gameNetwork.onGameAction((data) => {
        aplicarAccionRecibida(data);
    });

    gameNetwork.onStateSync((state) => {
        aplicarSincronizacionEstado(state);
    });

    gameNetwork.onOpponentDisconnected(() => {
        manejarDesconexion();
    });

    gameNetwork.onError((message) => {
        alert(`Error: ${message}`);
    });

    // Crear instancia de sync (reutilizamos el existente)
    if (window.GameSync) {
        gameSync = new GameSync(gameNetwork);
    }

    // Exportar globalmente
    window.gameNetwork = gameNetwork;
    window.gameSync = gameSync;

    // Mostrar lobby
    mostrarLobby();

    console.log('✅ Sistema de red listo');
}

// ===================================
// FUNCIONES DE LOBBY
// ===================================

function mostrarLobby() {
    const lobbyHTML = `
        <div id="lobby-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;">
            <div style="background: white; padding: 40px; border-radius: 15px; max-width: 500px; text-align: center;">
                <h2 style="margin-bottom: 30px;">CAFETOPIA - Multijugador</h2>
                <div id="lobby-menu">
                    <button onclick="iniciarModoLocal()" style="width: 100%; padding: 15px; margin: 10px 0; font-size: 16px; cursor: pointer;">
                        🖥️ Jugar Local (2 jugadores, mismo PC)
                    </button>
                    <button onclick="crearPartida()" style="width: 100%; padding: 15px; margin: 10px 0; font-size: 16px; cursor: pointer;">
                        🌐 Crear Partida Online
                    </button>
                    <button onclick="unirsePartida()" style="width: 100%; padding: 15px; margin: 10px 0; font-size: 16px; cursor: pointer;">
                        🔗 Unirse a Partida
                    </button>
                </div>
                <div id="lobby-espera" style="display: none;">
                    <h3>Esperando jugador...</h3>
                    <p>Comparte este código:</p>
                    <div style="font-family: monospace; font-size: 32px; font-weight: bold; padding: 20px; background: #f0f0f0; border-radius: 8px; margin: 20px 0;" id="codigo-partida">---</div>
                    <button onclick="copiarCodigo()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
                        📋 Copiar Código
                    </button>
                    <br><br>
                    <button onclick="cancelarEspera()" style="padding: 10px 20px; font-size: 14px; cursor: pointer;">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', lobbyHTML);
}

function ocultarLobby() {
    const lobby = document.getElementById('lobby-overlay');
    if (lobby) {
        lobby.remove();
    }
}

function mostrarPantallaEspera(gameId) {
    document.getElementById('lobby-menu').style.display = 'none';
    document.getElementById('lobby-espera').style.display = 'block';
    document.getElementById('codigo-partida').textContent = gameId;
}

function copiarCodigo() {
    const codigo = document.getElementById('codigo-partida').textContent;
    navigator.clipboard.writeText(codigo).then(() => {
        alert('✅ Código copiado al portapapeles');
    }).catch(() => {
        alert('📋 Código: ' + codigo);
    });
}

function cancelarEspera() {
    gameNetwork.disconnect();
    ocultarLobby();
    mostrarLobby();
}

// ===================================
// ACCIONES DEL USUARIO
// ===================================

function iniciarModoLocal() {
    gameNetwork.gameMode = 'local';
    gameNetwork.isActionInitiator = true;
    ocultarLobby();

    if (typeof window.iniciarJuego === 'function') {
        window.iniciarJuego();
    }

    alert('Modo local activado. Ambos jugadores comparten el mismo teclado.');
}

function crearPartida() {
    const nombre = prompt('Tu nombre (Jugador 1):');
    if (!nombre) return;

    gameNetwork.createGame(nombre.trim());
}

function unirsePartida() {
    const gameId = prompt('Código de partida:');
    if (!gameId) return;

    const nombre = prompt('Tu nombre (Jugador 2):');
    if (!nombre) return;

    gameNetwork.joinGame(gameId.trim().toUpperCase(), nombre.trim());
}

// ===================================
// INICIO DE PARTIDA MULTIJUGADOR
// ===================================

function iniciarPartidaMultijugador(nombreOponente, esCliente) {
    ocultarLobby();

    // Iniciar juego
    if (typeof window.iniciarJuego === 'function') {
        window.iniciarJuego();
    }

    // Configurar nombres
    setTimeout(() => {
        const miIndice = gameNetwork.isHost ? 0 : 1;
        const oponenteIndice = gameNetwork.isHost ? 1 : 0;

        if (window.jugadores && window.jugadores[miIndice]) {
            window.jugadores[miIndice].nombre = gameNetwork.playerName;
            window.jugadores[oponenteIndice].nombre = nombreOponente;

            if (typeof window.actualizarIU === 'function') {
                window.actualizarIU();
            }

            // Actualizar estado de turno inicial
            actualizarEstadoTurno();
            bloquearBotonesHost();

            alert(`¡Partida iniciada!\n\nTú: ${gameNetwork.playerName}\nOponente: ${nombreOponente}\n\n${gameNetwork.isHost ? '¡Tú eres el host! Puedes iniciar la partida.' : 'Esperando a que el host inicie la partida...'}`);
        }
    }, 100);
}

// ===================================
// NETWORK ACTION (WRAPPER)
// ===================================

async function networkAction(actionType, actionData) {
    console.log(`🌐 networkAction - tipo: ${actionType}, datos:`, actionData);

    // Modo local: ejecutar directamente
    if (!gameNetwork || gameNetwork.gameMode === 'local') {
        console.log('→ Modo local detectado');
        return executeActionLocally(actionType, actionData);
    }

    // Verificar que gameSync esté inicializado
    if (!gameSync) {
        console.error('❌ gameSync no está inicializado');
        return executeActionLocally(actionType, actionData);
    }

    // Obtener índice del jugador actual
    const miIndice = gameNetwork.isHost ? 0 : 1;
    const jugadorActual = window.gameState?.jugadorActual ?? 0;

    console.log(`→ Mi índice: ${miIndice}, Jugador actual: ${jugadorActual}`);

    // Validar que es mi turno
    if (actionType !== 'INICIAR_RONDA' && miIndice !== jugadorActual) {
        console.warn('⚠️ No es mi turno');
        await mostrarAlerta('No es tu turno', 'advertencia');
        return;
    }

    // Validar acción
    if (!gameSync.validateAction(actionType, actionData, miIndice)) {
        console.warn('⚠️ Validación de acción falló');
        await mostrarAlerta('No puedes realizar esta acción', 'advertencia');
        return;
    }

    console.log('✅ Validación pasada, ejecutando localmente...');

    // Marcar que SOY el iniciador
    gameNetwork.isActionInitiator = true;

    // Ejecutar localmente
    const success = await executeActionLocally(actionType, actionData);

    if (success) {
        // Enviar al peer
        const snapshot = {
            rondaActual: window.gameState?.rondaActual ?? 0,
            jugadorActual: window.gameState?.jugadorActual ?? 0,
            paRestantes: window.jugadores[miIndice]?.paRestantes ?? 0
        };

        console.log('📤 Enviando acción al peer:', snapshot);
        gameNetwork.sendAction(actionType, actionData, snapshot);
    } else {
        console.error('❌ La acción falló localmente');
    }
}

async function executeActionLocally(actionType, actionData) {
    try {
        // Usar funciones originales (sin wrapper) para evitar bucle infinito
        const funciones = window.funcionesOriginales || window;

        switch (actionType) {
            case 'PLANTAR':
                if (typeof funciones.plantar === 'function') {
                    await funciones.plantar(actionData.tipo);
                }
                return true;

            case 'VENDER':
                window.tipoVentaActual = actionData.tipo;
                const selectCantidad = document.getElementById('cantidadVenta');
                if (selectCantidad) {
                    selectCantidad.value = actionData.cantidad;
                }
                if (typeof funciones.ejecutarVenta === 'function') {
                    await funciones.ejecutarVenta();
                }
                return true;

            case 'COMPRAR_TOSTADORA':
                if (typeof funciones.comprarTostadora === 'function') {
                    await funciones.comprarTostadora(actionData.tipo);
                }
                return true;

            case 'PROCESAR_CAFE':
                if (typeof funciones.procesarCafe === 'function') {
                    await funciones.procesarCafe(
                        actionData.tipoGrano,
                        actionData.tipoProceso,
                        actionData.cantidad
                    );
                }
                return true;

            case 'CUMPLIR_CONTRATO':
                if (typeof funciones.intentarCumplirContrato === 'function') {
                    await funciones.intentarCumplirContrato(actionData.contratoId);
                }
                return true;

            case 'PASAR_TURNO':
                if (typeof funciones.pasarTurno === 'function') {
                    await funciones.pasarTurno();
                }
                return true;

            case 'INICIAR_RONDA':
                if (typeof funciones.iniciarRonda === 'function') {
                    await funciones.iniciarRonda();
                }
                return true;

            default:
                console.warn('⚠️ Tipo de acción desconocido:', actionType);
                return false;
        }
    } catch (error) {
        console.error('❌ Error al ejecutar acción:', error);
        return false;
    }
}

// ===================================
// APLICAR ACCIONES RECIBIDAS
// ===================================

async function aplicarAccionRecibida(message) {
    const { actionType, actionData } = message;

    console.log(`📥 Aplicando acción recibida: ${actionType}`);

    // Marcar que NO somos el iniciador
    gameNetwork.isActionInitiator = false;

    // Ejecutar la acción
    await executeActionLocally(actionType, actionData);

    // Restaurar flag
    gameNetwork.isActionInitiator = true;

    // Actualizar estado de turno después de recibir acción
    setTimeout(() => {
        actualizarEstadoTurno();
    }, 100);
}

function aplicarSincronizacionEstado(state) {
    console.log('🔄 Aplicando sincronización de estado');

    if (state.gameState) {
        Object.assign(window.gameState, state.gameState);
    }

    if (state.jugadores) {
        window.jugadores = JSON.parse(JSON.stringify(state.jugadores));
    }

    if (state.contratosDisponibles) {
        window.contratosDisponibles = JSON.parse(JSON.stringify(state.contratosDisponibles));
    }

    if (state.contratosCompletados) {
        window.contratosCompletados = JSON.parse(JSON.stringify(state.contratosCompletados));
    }

    if (typeof window.actualizarIU === 'function') {
        window.actualizarIU();
    }

    if (typeof window.actualizarUIContratos === 'function') {
        window.actualizarUIContratos();
    }

    alert('Estado sincronizado con el oponente');
}

function manejarDesconexion() {
    const continuar = confirm('Se perdió la conexión. ¿Continuar en modo local?');

    if (continuar) {
        gameNetwork.gameMode = 'local';
        gameNetwork.isActionInitiator = true;
        alert('Modo local activado. Puedes controlar ambos jugadores.');
    }
}

// ===================================
// GESTIÓN DE TURNOS Y OVERLAY
// ===================================

function actualizarEstadoTurno() {
    const overlay = document.getElementById('turn-overlay');
    if (!overlay) return;

    // En modo local, nunca bloquear
    if (!gameNetwork || gameNetwork.gameMode === 'local') {
        overlay.classList.remove('active');
        return;
    }

    const miIndice = gameNetwork.isHost ? 0 : 1;
    const jugadorActual = window.gameState?.jugadorActual ?? 0;
    const esMiTurno = miIndice === jugadorActual;

    if (esMiTurno) {
        overlay.classList.remove('active');
    } else {
        overlay.classList.add('active');
    }
}

function bloquearBotonesHost() {
    const btnIniciarRonda = document.getElementById('btn-iniciar-ronda');

    // Solo el host puede iniciar ronda y nueva ronda
    if (gameNetwork && gameNetwork.gameMode !== 'local' && !gameNetwork.isHost) {
        if (btnIniciarRonda) {
            btnIniciarRonda.disabled = true;
            btnIniciarRonda.style.opacity = '0.5';
            btnIniciarRonda.style.cursor = 'not-allowed';
            btnIniciarRonda.title = 'Solo el host puede iniciar la ronda';
        }
    }
}

// Sobrescribir actualizarIU original para incluir actualización de turno
const actualizarIUOriginal = window.actualizarIU;
window.actualizarIU = function() {
    if (actualizarIUOriginal) {
        actualizarIUOriginal();
    }
    actualizarEstadoTurno();
    bloquearBotonesHost();
};

// ===================================
// EXPORTAR GLOBALMENTE
// ===================================

window.networkAction = networkAction;
window.initializeNetwork = initializeNetwork;
window.iniciarModoLocal = iniciarModoLocal;
window.crearPartida = crearPartida;
window.unirsePartida = unirsePartida;
window.copiarCodigo = copiarCodigo;
window.cancelarEspera = cancelarEspera;
window.actualizarEstadoTurno = actualizarEstadoTurno;

// Inicializar al cargar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNetwork);
} else {
    initializeNetwork();
}
