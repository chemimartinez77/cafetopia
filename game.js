// game.js
// ===================================
// 0. CONSTANTES DE VARIEDADES
// ===================================
// Identificadores de tipos de café (NO MODIFICAR - usados en todo el código)
const ROBUSTA = 'A';
const ARABICA = 'B';
const GEISHA = 'E';

// Exportar globalmente para uso en otros archivos
window.ROBUSTA = ROBUSTA;
window.ARABICA = ARABICA;
window.GEISHA = GEISHA;

// ===================================
// 1. ESTADO GLOBAL DEL JUEGO
// ===================================
const gameState = {
    rondaActual: 0,
    partidaIniciada: false,
    precioBaseMercado: 100, // Precio base inicial por saco (Nivel A)
    costeAlmacenamiento: 50, // Coste por saco no vendido/procesado
    puntosVictoriaGanancia: 1, // 1 PV por cada unidad de beneficio (ej. 1000€)
    jugadorActual: 0, // Índice del jugador activo (0 o 1)
    jugadorInicial: 0 // Jugador que inicia la ronda actual
};

// Exportar gameState globalmente
window.gameState = gameState;

// ===================================
// 2. DATOS DE LOS JUGADORES
// ===================================
let jugadores = [
    {
        nombre: "Chemi",
        dinero: 5000,
        puntosVictoria: 0,
        paRestantes: 0,
        inventario: {
            verde_A: 0, // Grano Verde Nivel A (Robusta)
            verde_B: 0, // Grano Verde Nivel B (Arábica)
            verde_E: 0, // Grano Verde Nivel E (Geisha)
            tostado_artesanal_A: 0,
            tostado_artesanal_B: 0,
            tostado_artesanal_E: 0,
            tostado_industrial_A: 0,
            tostado_industrial_B: 0,
            tostado_industrial_E: 0
        },
        parcelas: [],
        activos: {
            tostadoras: {
                A: false,
                B: false,
                E: false
            },
            cafeterias_propias: 0,
            silos: 0  // Número de silos comprados (+15 sacos cada uno)
        },
        almacenamiento: {
            capacidadBase: 20,  // Capacidad gratis inicial
            capacidadTotal: 20  // Se recalcula: base + (silos * 15)
        }
    },
    {
        nombre: "Pablo",
        dinero: 5000,
        puntosVictoria: 0,
        paRestantes: 0,
        inventario: {
            verde_A: 0,
            verde_B: 0,
            verde_E: 0,
            tostado_artesanal_A: 0,
            tostado_artesanal_B: 0,
            tostado_artesanal_E: 0,
            tostado_industrial_A: 0,
            tostado_industrial_B: 0,
            tostado_industrial_E: 0
        },
        parcelas: [],
        activos: {
            tostadoras: {
                A: false,
                B: false,
                E: false
            },
            cafeterias_propias: 0,
            silos: 0  // Número de silos comprados (+15 sacos cada uno)
        },
        almacenamiento: {
            capacidadBase: 20,  // Capacidad gratis inicial
            capacidadTotal: 20  // Se recalcula: base + (silos * 15)
        }
    }
];

// Exportar jugadores globalmente
window.jugadores = jugadores;

// ===================================
// 3. DATOS CONSTANTES (COSTE/TIEMPO)
// ===================================

// Definición de las variedades de grano (Cultivo)
const variedades = {
    [ROBUSTA]: {  // 'A' - Robusta
        nombre: "Robusta",
        costePlantacion: 500,
        tiempoCrecimiento: 1,
        produccionSacos: 5,
        precioVentaEmergencia: 60,  // Antes 100 - Pérdida de 20€/saco
        costeAlmacenamiento: 20  // Coste por saco por ronda
    },
    [ARABICA]: {  // 'B' - Arábica
        nombre: "Arábica",
        costePlantacion: 1000,
        tiempoCrecimiento: 2,
        produccionSacos: 3,
        precioVentaEmergencia: 200,  // Antes 250 - Pérdida de 100€/saco
        costeAlmacenamiento: 30  // Coste por saco por ronda
    },
    [GEISHA]: {  // 'E' - Geisha
        nombre: "Geisha",
        costePlantacion: 3000,
        tiempoCrecimiento: 4,
        produccionSacos: 1,
        precioVentaEmergencia: 400,  // Antes 600 - Pérdida significativa
        costeAlmacenamiento: 50  // Coste por saco por ronda
    }
};

// Exportar variedades globalmente
window.variedades = variedades;

const costeTostadoras = {
    [ROBUSTA]: 1500,  // 'A'
    [ARABICA]: 2000,  // 'B'
    [GEISHA]: 2500    // 'E'
};

// Exportar costeTostadoras globalmente
window.costeTostadoras = costeTostadoras;

// ===================================
// SISTEMA DE ALMACENAMIENTO
// ===================================
const almacenamientoConfig = {
    capacidadBase: 20,        // Capacidad gratis inicial
    costeSilo: 2500,          // Coste de cada silo
    capacidadPorSilo: 15,     // +15 sacos por silo
    limiteSilos: 5,           // Máximo 5 silos por jugador
    excesoMaximoGratis: 10    // Hasta 10 sacos de exceso pagan tarifa, más de 10 → venta forzada
};

// Exportar configuración
window.almacenamientoConfig = almacenamientoConfig;

// Definición de los procesos de transformación
const procesos = {
    TOSTADO_ARTESANAL: {
        nombre: "Tostado Artesanal",
        costeInversion: 2000,  // Comprar tostadora
        costeProcesado: 35,    // Coste por saco procesado (antes 50)
        tiempoProcesado: 1,
        multiplicadorPrecio: 3.0,  // x3 el precio base
        paRequeridos: 1,
        rendimiento: 0.9       // Antes 0.8
    },
    TOSTADO_INDUSTRIAL: { 
        nombre: "Tostado Industrial", 
        costeInversion: 5000, 
        costeProcesado: 30,
        tiempoProcesado: 1, 
        multiplicadorPrecio: 2.0,  // x2 el precio base
        capacidadMaxima: 10,  // Puede procesar hasta 10 sacos a la vez
        paRequeridos: 1,
        rendimiento: 1.25
    }
};
//    CERTIFICADO: { nombre: "Certificado (Extra)", costeInversion: 2000, tiempoProcesado: 1, multiplicadorPrecio: 1.2 }

