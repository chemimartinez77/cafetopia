// network-socketio.js - Cliente Socket.io para CAFETOPIA

class GameNetworkSocketIO {
    constructor() {
        this.socket = null;
        this.isHost = false;
        this.gameId = null;
        this.playerName = '';
        this.gameMode = 'local'; // 'local' | 'hosting' | 'client'
        this.isActionInitiator = true;

        // Callbacks
        this.onGameCreatedCallback = null;
        this.onGameJoinedCallback = null;
        this.onPlayerJoinedCallback = null;
        this.onGameActionCallback = null;
        this.onStateSyncCallback = null;
        this.onOpponentDisconnectedCallback = null;
        this.onErrorCallback = null;
    }

    // ===================================
    // CONEXIÓN AL SERVIDOR
    // ===================================

    connect(serverUrl = 'http://localhost:3000') {
        this.socket = io(serverUrl);

        this.socket.on('connect', () => {
            console.log('✅ Conectado al servidor');
        });

        this.socket.on('game-created', (data) => {
            console.log('🎮 Partida creada:', data.gameId);
            this.gameId = data.gameId;
            this.isHost = true;
            this.gameMode = 'hosting';

            if (this.onGameCreatedCallback) {
                this.onGameCreatedCallback(data);
            }
        });

        this.socket.on('player-joined', (data) => {
            console.log('👤 Jugador unido:', data.playerName);

            if (this.onPlayerJoinedCallback) {
                this.onPlayerJoinedCallback(data);
            }
        });

        this.socket.on('game-joined', (data) => {
            console.log('✅ Unido a partida:', data.gameId);
            this.gameId = data.gameId;
            this.isHost = false;
            this.gameMode = 'client';

            if (this.onGameJoinedCallback) {
                this.onGameJoinedCallback(data);
            }
        });

        this.socket.on('game-action', (data) => {
            console.log('📨 Acción recibida:', data.actionType);

            if (this.onGameActionCallback) {
                this.onGameActionCallback(data);
            }
        });

        this.socket.on('state-sync', (state) => {
            console.log('🔄 Estado sincronizado');

            if (this.onStateSyncCallback) {
                this.onStateSyncCallback(state);
            }
        });

        this.socket.on('opponent-disconnected', () => {
            console.log('👋 Oponente desconectado');

            if (this.onOpponentDisconnectedCallback) {
                this.onOpponentDisconnectedCallback();
            }
        });

        this.socket.on('error', (message) => {
            console.error('❌ Error:', message);

            if (this.onErrorCallback) {
                this.onErrorCallback(message);
            }
        });

        this.socket.on('disconnect', () => {
            console.log('🔌 Desconectado del servidor');
        });
    }

    // ===================================
    // CREAR/UNIRSE A PARTIDA
    // ===================================

    createGame(playerName) {
        this.playerName = playerName;
        this.socket.emit('create-game', playerName);
    }

    joinGame(gameId, playerName) {
        this.playerName = playerName;
        this.socket.emit('join-game', { gameId, playerName });
    }

    // ===================================
    // ENVIAR DATOS
    // ===================================

    sendAction(actionType, actionData, snapshot = {}) {
        const message = {
            actionType,
            actionData,
            snapshot: {
                rondaActual: snapshot.rondaActual || 0,
                jugadorActual: snapshot.jugadorActual || 0,
                paRestantes: snapshot.paRestantes || 0
            },
            timestamp: Date.now()
        };

        this.socket.emit('game-action', message);
    }

    sendStateSync(fullState) {
        this.socket.emit('state-sync', fullState);
    }

    // ===================================
    // CALLBACKS
    // ===================================

    onGameCreated(callback) {
        this.onGameCreatedCallback = callback;
    }

    onGameJoined(callback) {
        this.onGameJoinedCallback = callback;
    }

    onPlayerJoined(callback) {
        this.onPlayerJoinedCallback = callback;
    }

    onGameAction(callback) {
        this.onGameActionCallback = callback;
    }

    onStateSync(callback) {
        this.onStateSyncCallback = callback;
    }

    onOpponentDisconnected(callback) {
        this.onOpponentDisconnectedCallback = callback;
    }

    onError(callback) {
        this.onErrorCallback = callback;
    }

    // ===================================
    // DESCONEXIÓN
    // ===================================

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        this.gameMode = 'local';
        this.isActionInitiator = true;
    }
}

// Exportar
window.GameNetworkSocketIO = GameNetworkSocketIO;
