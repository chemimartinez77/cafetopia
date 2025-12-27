// game.js
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

// ===================================
// 2. DATOS DE LOS JUGADORES
// ===================================
let jugadores = [
    {
        nombre: "Jugador 1",
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
            cafeterias_propias: 0
        }
    },
    {
        nombre: "Jugador 2",
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
            cafeterias_propias: 0
        }
    }
];

// ===================================
// 3. DATOS CONSTANTES (COSTE/TIEMPO)
// ===================================

// Definición de las variedades de grano (Cultivo)
const variedades = {
    A: { 
        nombre: "Robusta", 
        costePlantacion: 500, 
        tiempoCrecimiento: 1, 
        produccionSacos: 5, 
        precioVentaEmergencia: 60  // Antes 100 - Pérdida de 20€/saco
    },
    B: { 
        nombre: "Arábica", 
        costePlantacion: 1000, 
        tiempoCrecimiento: 2, 
        produccionSacos: 3, 
        precioVentaEmergencia: 200  // Antes 250 - Pérdida de 100€/saco
    },
    E: { 
        nombre: "Geisha", 
        costePlantacion: 3000, 
        tiempoCrecimiento: 4, 
        produccionSacos: 1, 
        precioVentaEmergencia: 400  // Antes 600 - Pérdida significativa
    }
};

const costeTostadoras = {
    A: 1500,
    B: 2000,
    E: 2500
};

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

