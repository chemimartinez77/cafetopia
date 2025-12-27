// contratos.js - Sistema de Contratos (CORREGIDO v2)

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
  
  // Duración INICIAL del contrato (cuántas rondas desde que aparece)
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
    rondasRestantes: rondasIniciales  // Empieza con el mismo valor
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
  let multiplicador = 1.35;
  if (cantidad >= 9) multiplicador = 1.65;
  else if (cantidad >= 5) multiplicador = 1.50;

  // Bonus por tipo de procesado (recompensa la complejidad)
  if (tipo === 'tostado_artesanal') {
    multiplicador += 0.25;  // +25% extra por artesanal
  } else if (tipo === 'tostado_industrial') {
    multiplicador += 0.15;  // +15% extra por industrial
  }

  return Math.round(costeBase * multiplicador);
}

let contratosDisponibles = [];
let contratosCompletados = [];

// ===================================
// GENERAR CONTRATOS PARA LLENAR HUECOS
// ===================================
function generarContratos() {
  const conteo = { pequenos: 0, medianos: 0, grandes: 0 };
  
  // Contar cuántos hay actualmente de cada categoría
  contratosDisponibles.forEach((c) => {
    if (conteo[c.categoria] !== undefined) conteo[c.categoria]++;
  });

  console.log("📊 Estado actual de contratos:", conteo);
  console.log("🎯 Objetivo:", objetivosContratos);

  // Generar los que faltan para cada categoría
  Object.keys(objetivosContratos).forEach((cat) => {
    const faltantes = objetivosContratos[cat] - conteo[cat];
    
    if (faltantes > 0) {
      console.log(`📝 Generando ${faltantes} contratos de categoría ${cat}`);
      
      for (let i = 0; i < faltantes; i++) {
        const nuevoContrato = crearContrato(cat);
        contratosDisponibles.push(nuevoContrato);
        console.log(`✅ Creado: ${nuevoContrato.nombre} (${nuevoContrato.rondasRestantes} rondas)`);
      }
    }
  });

  console.log(`📦 Total contratos disponibles: ${contratosDisponibles.length}/${TOTAL_CONTRATOS_OBJETIVO}`);
}

// ===================================
// ASEGURAR CONTRATOS AL INICIO
// ===================================
async function asegurarContratosCompletos() {
  console.log("🔄 Verificando contratos iniciales...");
  
  if (contratosDisponibles.length < TOTAL_CONTRATOS_OBJETIVO) {
    console.log(`⚠️ Solo hay ${contratosDisponibles.length} contratos, generando hasta ${TOTAL_CONTRATOS_OBJETIVO}`);
    generarContratos();
  }
  
  actualizarUIContratos();
}

window.asegurarContratosCompletos = asegurarContratosCompletos;

// ===================================
// CUMPLIR CONTRATO
// ===================================
async function intentarCumplirContrato(contratoId) {
  const jugador = obtenerJugadorActual();
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
  
  // CUMPLIR CONTRATO
  jugador.inventario[inventarioKey] -= contrato.cantidadRequerida;
  jugador.dinero += contrato.pago;
  jugador.puntosVictoria += contrato.prestigio;

  addLog(
    `✅ CONTRATO CUMPLIDO: "${contrato.nombre}" - Ganancia: ${contrato.pago}€ (+${contrato.prestigio} PV)`,
    'ganancia'
  );

  contratosCompletados.push(contrato);

  actualizarIU();
  
  // Eliminar del array
  const index = contratosDisponibles.findIndex(c => c.id === contratoId);
  if (index >= 0) {
    contratosDisponibles.splice(index, 1);
    console.log(`✅ Contrato cumplido y eliminado. Quedan ${contratosDisponibles.length} contratos`);
  }
  
  // 1️⃣ Primero actualizar UI (desbloquea botones)
  actualizarIU();
  
  // 2️⃣ Aplicar animación a la tarjeta que ya existe
  const card = document.querySelector(`[data-contrato-id="${contratoId}"]`);
  if (card) {
    card.classList.add('contrato-desapareciendo');
    const boton = card.querySelector('button');
    if (boton) boton.setAttribute('disabled', 'disabled');

    // 3️⃣ DESPUÉS de la animación, actualizar contratos (sin bloquear)
    card.addEventListener("animationend", () => {
        card.remove();
    });
    setTimeout(() => {
      actualizarUIContratos();
    }, 2400); // Un poco más que la duración de la animación
  } else {
    // Si no hay tarjeta, actualizar inmediatamente
    actualizarUIContratos();
  }

  // Gastar PA y cambiar de turno automáticamente
  gastarPAyCambiarTurno(jugador, 1);
}

// ===================================
// PROCESAMIENTO DE CAFÉ
// ===================================
async function procesarCafe(tipoGrano, tipoProceso, cantidadForzada = null) {
  const jugador = obtenerJugadorActual();
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

  actualizarIU();
  gastarPAyCambiarTurno(jugador, 1);
  return true;
}

// ===================================
// ACTUALIZACIÓN DE UI DE CONTRATOS
// ===================================
function actualizarUIContratos() {
  const contenedor = document.getElementById('contratos-listado');
  if (!contenedor) {
    console.warn("⚠️ No se encontró el elemento contratos-listado");
    return;
  }
  
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
      
      // Lógica corregida del texto de expiración
      let expiraTexto = '';
      if (contrato.rondasRestantes === 1) {
        expiraTexto = `⏰ Duración del contrato: ${contrato.rondasIniciales} rondas. <strong style="color: #e74c3c;">Expira esta ronda</strong>.`;
      } else {
        expiraTexto = `⏰ Duración del contrato: ${contrato.rondasIniciales} rondas. Expira en ${contrato.rondasRestantes} rondas.`;
      }
      
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

  // Placeholders para contratos que se repondrán
  for (let i = 0; i < huecosPendientes; i++) {
    html += `
      <div class="contrato-card contrato-placeholder">
        <strong>📦 Contrato pendiente</strong><br>
        <small>Se repondrá al comenzar la siguiente ronda.</small>
      </div>
    `;
  }
  
  contenedor.innerHTML = html;
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
// AVANZAR CONTRATOS (se llama al inicio de cada ronda)
// ===================================
async function avanzarContratos() {
  console.log("\n🔄 ========== AVANZAR CONTRATOS ==========");
  console.log(`📦 Contratos al inicio: ${contratosDisponibles.length}`);
  
  const contratosExpirados = [];
  
  // Reducir contador de rondas restantes
  contratosDisponibles.forEach((contrato) => {
    contrato.rondasRestantes--;
    console.log(`⏳ "${contrato.nombre}": ${contrato.rondasRestantes} rondas restantes`);
    
    if (contrato.rondasRestantes <= 0) {
      contratosExpirados.push(contrato);
    }
  });

  // Eliminar los que llegaron a 0
  if (contratosExpirados.length > 0) {
    console.log(`❌ Expirando ${contratosExpirados.length} contrato(s)`);
    
    contratosDisponibles = contratosDisponibles.filter(
      (c) => c.rondasRestantes > 0
    );
    
    const nombresExpirados = contratosExpirados.map(c => c.nombre).join(", ");
    addLog(`❌ Contratos expirados: ${nombresExpirados}`, 'alerta');
  }

  console.log(`📦 Contratos después de expirar: ${contratosDisponibles.length}`);
  
  // REPONER contratos hasta llegar al objetivo
  generarContratos();
  
  console.log(`📦 Contratos después de generar: ${contratosDisponibles.length}`);
  console.log("========================================\n");
  
  actualizarUIContratos();
}

// Exportar funciones
window.intentarCumplirContrato = intentarCumplirContrato;
window.avanzarContratos = avanzarContratos;
window.generarContratos = generarContratos;