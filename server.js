// server.js - Servidor Socket.io para CAFETOPIA
const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const socketIO = require('socket.io');
const path = require('path');

const app = express();

// Intentar cargar certificados SSL si existen
let server;
const sslKeyPath = path.join(__dirname, 'ssl', 'key.pem');
const sslCertPath = path.join(__dirname, 'ssl', 'cert.pem');

if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
    const options = {
        key: fs.readFileSync(sslKeyPath),
        cert: fs.readFileSync(sslCertPath)
    };
    server = https.createServer(options, app);
    console.log('🔒 Servidor HTTPS habilitado');
} else {
    server = http.createServer(app);
    console.log('⚠️ Servidor HTTP (sin SSL)');
}
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = 3000;

// Servir archivos estáticos
app.use(express.static(__dirname));

// Estado de las partidas
const games = new Map();

io.on('connection', (socket) => {
    console.log(`🎮 Cliente conectado: ${socket.id}`);

    // Crear nueva partida
    socket.on('create-game', (playerName) => {
        const gameId = generateGameId();

        games.set(gameId, {
            host: socket.id,
            hostName: playerName,
            client: null,
            clientName: null
        });

        socket.join(gameId);
        socket.gameId = gameId;
        socket.isHost = true;

        console.log(`📝 Partida creada: ${gameId} por ${playerName}`);

        socket.emit('game-created', { gameId, playerName });
    });

    // Unirse a partida
    socket.on('join-game', ({ gameId, playerName }) => {
        const game = games.get(gameId);

        if (!game) {
            socket.emit('error', 'Partida no encontrada');
            return;
        }

        if (game.client) {
            socket.emit('error', 'Partida llena');
            return;
        }

        game.client = socket.id;
        game.clientName = playerName;

        socket.join(gameId);
        socket.gameId = gameId;
        socket.isHost = false;

        console.log(`🔗 ${playerName} se unió a partida ${gameId}`);

        // Notificar a ambos jugadores
        io.to(game.host).emit('player-joined', {
            playerName,
            opponentName: game.hostName
        });

        socket.emit('game-joined', {
            gameId,
            playerName,
            opponentName: game.hostName
        });
    });

    // Reenviar acción al oponente
    socket.on('game-action', (data) => {
        const game = games.get(socket.gameId);
        if (!game) return;

        const targetId = socket.isHost ? game.client : game.host;

        if (targetId) {
            io.to(targetId).emit('game-action', data);
            console.log(`📨 Acción reenviada: ${data.actionType}`);
        }
    });

    // Sincronización de estado
    socket.on('state-sync', (state) => {
        const game = games.get(socket.gameId);
        if (!game) return;

        const targetId = socket.isHost ? game.client : game.host;

        if (targetId) {
            io.to(targetId).emit('state-sync', state);
            console.log(`🔄 Estado sincronizado`);
        }
    });

    // Desconexión
    socket.on('disconnect', () => {
        console.log(`👋 Cliente desconectado: ${socket.id}`);

        if (socket.gameId) {
            const game = games.get(socket.gameId);
            if (game) {
                const opponentId = socket.isHost ? game.client : game.host;

                if (opponentId) {
                    io.to(opponentId).emit('opponent-disconnected');
                }

                // Limpiar partida si ambos se desconectaron
                if (socket.isHost) {
                    games.delete(socket.gameId);
                    console.log(`🗑️ Partida ${socket.gameId} eliminada`);
                }
            }
        }
    });
});

function generateGameId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

server.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
});
