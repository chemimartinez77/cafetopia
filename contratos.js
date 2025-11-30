// contratos.js - Sistema de Contratos (CORREGIDO)

const plantillasContratos = {
  pequenos: [
    { cantidad: 1, tipo: "verde", granos: ["A", "B", "E"], nombres: ["Mercado Local", "Cafeteria Vecina", "Comprador Privado"] },
    { cantidad: 2, tipo: "verde", granos: ["A", "B"], nombres: ["Distribuidor Local", "Exportador Pequeño"] },
    { cantidad: 3, tipo: "tostado_artesanal", granos: ["A", "B"], nombres: ["Cafeteria Premium", "Boutique Local"] },
    { cantidad: 4, tipo: "verde", granos: ["A"], nombres: ["Mercado Regional", "Tostador Artesanal"] }
  ],
  medianos: [
    { cantidad: 5, tipo: "verde", granos: ["A", "B"], nombres: ["Exportador Regional", "Distribuidor Nacional"] },
    { cantidad: 6, tipo: "tostado_artesanal", granos: ["B"], nombres: ["Boutiques Europeas", "Cafeterias Premium"] },
    { cantidad: 7, tipo: "tostado_industrial", granos: ["A", "B"], nombres: ["Supermercados Regionales", "Cadenas de Cafeterias"] },
    { cantidad: 8, tipo: "verde", granos: ["A", "B"], nombres: ["Exportacion Internacional", "Tostadores Profesionales"] }
  ],
  grandes: [
    { cantidad: 9, tipo: "tostado_industrial", granos: ["A", "B"], nombres: ["Supermercados Internacionales", "Cadenas Globales"] },
    { cantidad: 10, tipo: "verde", granos: ["A"], nombres: ["Exportacion Masiva", "Distribuidor Mayorista"] },
    { cantidad: 11, tipo: "tostado_artesanal", granos: ["B"], nombres: ["Boutiques Premium", "Exportacion Gourmet"] },
    { cantidad: 12, tipo: "tostado_industrial", granos: ["A"], nombres: ["Supermercados USA", "Cadenas Globales"] }
  ]
};

const objetivosContratos = { pequenos: 2, medianos: 2, grandes: 2 };
const DURACION_ANIMACION_CONTRATO = 2300;
const TOTAL_CONTRATOS_OBJETIVO = Object.values(objetivosContratos).reduce((acc, val) => acc + val, 0);
let contadorContratos = 0;
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function crearContrato(categoria) {
  const plantillas = plantillasContratos[categoria];
  const plantilla = plantillas[Math.floor(Math.random() * plantillas.length)];
  const grano = plantilla.granos[Math.floor(Math.random() * plantilla.granos.length)];
  const nombre = plantilla.nombres[Math.floor(Math.random() * plantilla.nombres.length)];
  const pago = calcularPago(plantilla.cantidad, plantilla.tipo, grano);
  const rondasIniciales = categoria === 'medianos' ? 3 + Math.floor(Math.random() * 2)
                        : categoria === 'grandes' ? 4 + Math.floor(Math.random() * 2)
                        : 2 + Math.floor(Math.random() * 2);
  return {
    id: `contrato_${++contadorContratos}`,
    categoria,
    nombre: `${nombre} - ${variedades[grano].nombre}`,
    tipo: plantilla.tipo,
    grano,
    cantidadRequerida: plantilla.cantidad,
    pago,
    prestigio: plantilla.cantidad <= 2 ? 1 : (categoria === 'grandes' ? 3 + Math.floor(plantilla.cantidad / 4) : 2 + Math.floor(plantilla.cantidad / 3)),
    descripcion: `Contrato de ${plantilla.cantidad} saco${plantilla.cantidad > 1 ? 's' : ''} de ${obtenerNombreTipoCafe(plantilla.tipo, grano)}`,
    rondasIniciales,
    rondasRestantes: rondasIniciales
  };
}

function calcularPago(cantidad, tipo, grano) {
  const variedad = variedades[grano];
  const plantacionesNecesarias = Math.ceil(cantidad / variedad.produccionSacos);
  let costeBase = plantacionesNecesarias * variedad.costePlantacion;
  if (tipo !== 'verde') {
    const proceso = tipo === 'tostado_artesanal' ? procesos.TOSTADO_ARTESANAL : procesos.TOSTADO_INDUSTRIAL;
    costeBase += cantidad * proceso.costeProcesado;
  }
  let multiplicador = 1.15;
  if (cantidad >= 9) multiplicador = 1.30;
  else if (cantidad >= 5) multiplicador = 1.25;
  return Math.round(costeBase * multiplicador);
}

let contratosDisponibles = [];
let contratosCompletados = [];

// ===================================
// FUNCIÓN CORREGIDA: Generar contratos para llenar huecos
// ===================================
function generarContratos() {
  // Contar cuántos contratos hay de cada categoría
  const conteo = { pequenos: 0, medianos: 0, grandes: 0 };
  contratosDisponibles.forEach((c) => {
    if (conteo[c.categoria] !== undefined) conteo[c.categoria]++;
  });

  console.log("📊 Conteo actual de contratos:", conteo);
  console.log("🎯 Objetivo de contratos:", objetivosContratos);

  // Rellenar cada categoría hasta el objetivo
  Object.keys(objetivosContratos).forEach((cat) => {
    const faltantes = objetivosContratos[cat] - conteo[cat];
    console.log(`📝 Categoría ${cat}: faltan ${faltantes} contratos`);
    
    for (let i = 0; i < faltantes; i++) {
      const nuevoContrato = crearContrato(cat);
      contratosDisponibles.push(nuevoContrato);
      console.log(`✅ Creado contrato ${cat}: ${nuevoContrato.nombre}`);
    }
  });

  console.log(`📦 Total de contratos disponibles: ${contratosDisponibles.length}`);
  actualizarUIContratos();
}

// ===================================
// ASEGURAR CONTRATOS COMPLETOS (para inicio de juego)
// ===================================
async function asegurarContratosCompletos() {
  console.log("🔄 Verificando contratos al inicio...");
  if (contratosDisponibles.length < TOTAL_CONTRATOS_OBJETIVO) {
    console.log("⚠️ Faltan contratos, generando...");
    generarContratos();
  } else {
    console.log("✅ Contratos ya completos:", contratosDisponibles.length);
  }
}

window.asegurarContratosCompletos = asegurarContratosCompletos;

// ===================================
// CUMPLIR CONTRATO
// ===================================
async function intentarCumplirContrato(contratoId) {
  const jugador = jugadores[0];
  const contrato = contratosDisponibles.find((c) => c.id === contratoId);
  
  if (!contrato) {
    await mostrarAlerta("Contrato no encontrado", 'error');
    return;
  }
  
  if (jugador.paRestantes < 1) {
    await mostrarAlerta("No tienes PA suficientes!", 'advertencia');
    return;
  }
  
  const inventarioKey = contrato.tipo === 'verde' 
    ? `verde_${contrato.grano}` 
    : `${contrato.tipo}_${contrato.grano}`;
  
  const stockDisponible = jugador.inventario[inventarioKey] || 0;
  
  if (stockDisponible < contrato.cantidadRequerida) {
    await mostrarAlerta(
      `Necesitas ${contrato.cantidadRequerida} sacos de ${obtenerNombreTipoCafe(contrato.tipo, contrato.grano)}. Solo tienes ${stockDisponible}.`, 
      'advertencia'
    );
    return;
  }
  
  // ¡CUMPLIR CONTRATO!
  jugador.paRestantes--;
  jugador.inventario[inventarioKey] -= contrato.cantidadRequerida;
  jugador.dinero += contrato.pago;
  jugador.puntosVictoria += contrato.prestigio;
  
  addLog(
    `✅ CONTRATO CUMPLIDO: "${contrato.nombre}" - Ganancia: ${contrato.pago}€ (+${contrato.prestigio} PV)`, 
    'ganancia'
  );
  
  contratosCompletados.push(contrato);
  
  // Eliminar de disponibles
  contratosDisponibles = contratosDisponibles.filter((c) => c.id !== contratoId);
  
  console.log(`📝 Contrato cumplido. Quedan ${contratosDisponibles.length} contratos`);
  
  const animado = aplicarAnimacionSalidaContrato(contratoId);
  if (animado) {
    await esperar(DURACION_ANIMACION_CONTRATO);
  }
  
  actualizarIU();
  actualizarUIContratos();
}

// ===================================
// PROCESAMIENTO DE CAFÉ
// ===================================
async function procesarCafe(tipoGrano, tipoProceso, cantidadForzada = null) {
  const jugador = jugadores[0];
  const proceso = procesos[tipoProceso];
  
  if (!proceso) {
    await mostrarAlerta(`Error: Proceso ${tipoProceso} no encontrado`, 'error');
    return false;
  }
  
  const tieneTostadora = jugador.activos.tostadoras && jugador.activos.tostadoras[tipoGrano];
  
  if (!tieneTostadora) {
    await mostrarAlerta(
      `Necesitas comprar la tostadora de ${variedades[tipoGrano].nombre} antes de procesar.`, 
      'info'
    );
    return false;
  }
  
  if (jugador.paRestantes < proceso.paRequeridos) {
    await mostrarAlerta("No tienes PA suficientes!", 'advertencia');
    return false;
  }
  
  const inventarioVerdeKey = `verde_${tipoGrano}`;
  const stockVerde = jugador.inventario[inventarioVerdeKey] || 0;
  
  if (stockVerde === 0) {
    await mostrarAlerta(
      `No tienes grano verde ${variedades[tipoGrano].nombre} para procesar`, 
      'info'
    );
    return false;
  }
  
  const capacidad = tipoProceso === 'TOSTADO_INDUSTRIAL' && proceso.capacidadMaxima 
    ? Math.min(stockVerde, proceso.capacidadMaxima) 
    : stockVerde;
  
  let cantidad = cantidadForzada;
  
  if (cantidad === null || Number.isNaN(parseInt(cantidad, 10))) {
    const promptValor = Math.min(capacidad, 1);
    cantidad = parseInt(prompt(`¿Cuántos sacos procesar? (1-${capacidad}):`, promptValor), 10);
  }
  
  cantidad = parseInt(cantidad, 10);
  
  if (!cantidad || cantidad < 1 || cantidad > capacidad) {
    await mostrarAlerta("Cantidad no válida", 'error');
    return false;
  }
  
  const costeTotal = cantidad * proceso.costeProcesado;
  
  if (jugador.dinero < costeTotal) {
    await mostrarAlerta(`No tienes suficiente dinero. Necesitas ${costeTotal}€`, 'error');
    return false;
  }
  
  // PROCESAR
  jugador.paRestantes--;
  jugador.dinero -= costeTotal;
  jugador.inventario[inventarioVerdeKey] -= cantidad;
  
  const rendimiento = proceso.rendimiento ?? 1;
  const produccionSacos = Math.max(1, Math.round(cantidad * rendimiento));
  
  const baseKey = tipoProceso === 'TOSTADO_ARTESANAL' ? 'tostado_artesanal' : 'tostado_industrial';
  const inventarioProcesadoKey = `${baseKey}_${tipoGrano}`;
  
  if (!jugador.inventario[inventarioProcesadoKey]) {
    jugador.inventario[inventarioProcesadoKey] = 0;
  }
  
  jugador.inventario[inventarioProcesadoKey] += produccionSacos;
  
  const etiquetaProceso = tipoProceso === 'TOSTADO_ARTESANAL' ? 'Café Premium' : 'Café Comercial';
  
  addLog(
    `☕ Procesando ${cantidad} sacos de ${variedades[tipoGrano].nombre} (${proceso.nombre}) - Coste: ${costeTotal}€`, 
    'gasto'
  );
  
  addLog(
    `✅ Procesado completado: +${produccionSacos} sacos de ${variedades[tipoGrano].nombre} ${etiquetaProceso}`, 
    'ganancia'
  );
  
  await mostrarAlerta(
    `Se han tostado ${produccionSacos} sacos de ${variedades[tipoGrano].nombre} (${etiquetaProceso}).`, 
    'exito', 
    'Procesado completado'
  );
  
  actualizarIU();
  return true;
}

// ===================================
// ACTUALIZACIÓN DE UI DE CONTRATOS
// ===================================
function actualizarUIContratos() {
  let html = '<h3>📋 Contratos Disponibles</h3>';
  
  const huecosPendientes = Math.max(0, TOTAL_CONTRATOS_OBJETIVO - contratosDisponibles.length);

  if (huecosPendientes > 0) {
    const mensajePlural = huecosPendientes === 1 ? 'contrato se' : 'contratos se';
    const verbo = huecosPendientes === 1 ? 'repondrá' : 'repondrán';
    html += `
      <div class="contrato-alerta">
        <strong>⏳ Reposición en cola</strong><br>
        <small>${huecosPendientes} ${mensajePlural} ${verbo} al comenzar la siguiente ronda.</small>
      </div>
    `;
  }

  if (contratosDisponibles.length === 0) {
    html += '<p style="color: #999;">No hay contratos disponibles esta ronda.</p>';
  } else {
    contratosDisponibles.forEach((contrato) => {
      const nombreCafe = obtenerNombreTipoCafe(contrato.tipo, contrato.grano);
      const colorTipo = contrato.tipo === 'verde' ? '#ffc107' : '#8B4513';
      
      const expiraTexto = contrato.rondasRestantes === 1
        ? `⏰ Duración del contrato: ${contrato.rondasIniciales} rondas. <strong style="color: #e74c3c;">Expira esta ronda</strong>.`
        : `⏰ Duración del contrato: ${contrato.rondasIniciales} rondas. Expira en ${contrato.rondasRestantes} rondas.`;
      
      html += `
        <div class="contrato-card" data-contrato-id="${contrato.id}" style="border-left: 4px solid ${colorTipo};">
          <strong>${contrato.nombre}</strong><br>
          <small>${contrato.descripcion}</small><br>
          📦 Requiere: ${contrato.cantidadRequerida} sacos de ${nombreCafe}<br>
          💰 Pago: <span style="color: #27ae60; font-weight: bold;">${contrato.pago}€</span>
          ${contrato.prestigio > 0 ? ` | ⭐ +${contrato.prestigio} PV` : ''}<br>
          ${expiraTexto}<br>
          <button class="btn-accion" onclick="intentarCumplirContrato('${contrato.id}')" style="margin-top: 8px;">
            Cumplir Contrato (1 PA)
          </button>
        </div>
      `;
    });
  }

  // Mostrar placeholders para contratos que se repondrán
  for (let i = 0; i < huecosPendientes; i++) {
    html += `
      <div class="contrato-card contrato-placeholder">
        <strong>📦 Contrato pendiente</strong><br>
        <small>Se repondrá al comenzar la siguiente ronda.</small>
      </div>
    `;
  }
  
  document.getElementById('contratos-listado').innerHTML = html;
}

function aplicarAnimacionSalidaContrato(contratoId) {
  const card = document.querySelector(`[data-contrato-id="${contratoId}"]`);
  if (!card) return false;
  if (card.classList.contains('contrato-desapareciendo')) return true;
  card.classList.add('contrato-desapareciendo');
  const boton = card.querySelector('button');
  if (boton) boton.setAttribute('disabled', 'disabled');
  return true;
}

function obtenerNombreTipoCafe(tipo, grano) {
  const base = variedades[grano].nombre;
  if (tipo === 'verde') return `${base} Verde`;
  if (tipo === 'tostado_artesanal') return `${base} Café Premium`;
  if (tipo === 'tostado_industrial') return `${base} Café Comercial`;
  return base;
}

// ===================================
// FUNCIÓN CORREGIDA: Avanzar contratos
// ===================================
async function avanzarContratos() {
  console.log("🔄 Avanzando contratos...");
  console.log(`📦 Contratos disponibles al inicio: ${contratosDisponibles.length}`);
  
  const contratosExpirados = [];
  
  // Reducir rondas restantes y marcar expirados
  contratosDisponibles.forEach((contrato) => {
    contrato.rondasRestantes--;
    console.log(`⏳ Contrato "${contrato.nombre}": ${contrato.rondasRestantes} rondas restantes`);
    
    if (contrato.rondasRestantes <= 0) {
      contratosExpirados.push(contrato);
    }
  });

  // Eliminar contratos expirados
  if (contratosExpirados.length > 0) {
    console.log(`❌ Expirando ${contratosExpirados.length} contratos`);
    
    contratosDisponibles = contratosDisponibles.filter(
      (c) => c.rondasRestantes > 0
    );
    
    const nombresExpirados = contratosExpirados.map(c => c.nombre).join(", ");
    addLog(`❌ Contratos expirados: ${nombresExpirados}`, 'alerta');
  }

  console.log(`📦 Contratos disponibles después de expirar: ${contratosDisponibles.length}`);
  
  // AQUÍ ESTÁ LA CLAVE: Generar nuevos contratos para reponer los expirados
  generarContratos();
  
  console.log(`📦 Contratos disponibles después de generar: ${contratosDisponibles.length}`);
  
  actualizarUIContratos();
}

// Exportar funciones necesarias
window.intentarCumplirContrato = intentarCumplirContrato;
window.avanzarContratos = avanzarContratos;
window.generarContratos = generarContratos;