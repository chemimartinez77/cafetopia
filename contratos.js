// contratos.js - Sistema de Contratos de Exportación

// ===================================
// DEFINICIÓN DE CONTRATOS
// ===================================

// ===================================
// CÁLCULO DE COSTES BASE
// ===================================
// Arábica: 1000€ → 3 sacos = 333.33€/saco
// Robusta: 500€ → 5 sacos = 100€/saco
// Geisha: 3000€ → 1 saco = 3000€/saco
// Procesamiento Artesanal: +50€/saco
// Procesamiento Industrial: +30€/saco

// ===================================
// PLANTILLAS DE CONTRATOS POR TAMAÑO
// ===================================

// Plantillas para generar contratos balanceados
const plantillasContratos = {
  // CONTRATOS PEQUEÑOS (1-4 sacos) - +15% beneficio
  pequeños: [
    { cantidad: 1, tipo: "verde", granos: ["A", "B", "E"], nombres: ["Mercado Local", "Cafetería Vecina", "Comprador Privado"] },
    { cantidad: 2, tipo: "verde", granos: ["A", "B"], nombres: ["Distribuidor Local", "Exportador Pequeño"] },
    { cantidad: 3, tipo: "tostado_artesanal", granos: ["A", "B"], nombres: ["Cafetería Premium", "Boutique Local"] },
    { cantidad: 4, tipo: "verde", granos: ["A"], nombres: ["Mercado Regional", "Tostador Artesanal"] }
  ],
  // CONTRATOS MEDIANOS (5-8 sacos) - +25% beneficio
  medianos: [
    { cantidad: 5, tipo: "verde", granos: ["A", "B"], nombres: ["Exportador Regional", "Distribuidor Nacional"] },
    { cantidad: 6, tipo: "tostado_artesanal", granos: ["B"], nombres: ["Boutiques Europeas", "Cafeterías Premium"] },
    { cantidad: 7, tipo: "tostado_industrial", granos: ["A", "B"], nombres: ["Supermercados Regionales", "Cadenas de Cafeterías"] },
    { cantidad: 8, tipo: "verde", granos: ["A", "B"], nombres: ["Exportación Internacional", "Tostadores Profesionales"] }
  ],
  // CONTRATOS GRANDES (9-12 sacos) - +30% beneficio
  grandes: [
    { cantidad: 9, tipo: "tostado_industrial", granos: ["A", "B"], nombres: ["Supermercados Internacionales", "Cadenas Globales"] },
    { cantidad: 10, tipo: "verde", granos: ["A"], nombres: ["Exportación Masiva", "Distribuidor Mayorista"] },
    { cantidad: 11, tipo: "tostado_artesanal", granos: ["B"], nombres: ["Boutiques Premium", "Exportación Gourmet"] },
    { cantidad: 12, tipo: "tostado_industrial", granos: ["A"], nombres: ["Supermercados USA", "Cadenas Globales"] }
  ]
};

const objetivosContratos = { pequeños: 2, medianos: 2, grandes: 2 };
const DURACION_ANIMACION_CONTRATO = 2300; // ms para fade/destello al desaparecer
const TOTAL_CONTRATOS_OBJETIVO = Object.values(objetivosContratos).reduce((acc, val) => acc + val, 0);
let contadorContratos = 0;

const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function crearContrato(categoria) {
 const plantillas = plantillasContratos[categoria];
 const plantilla = plantillas[Math.floor(Math.random() * plantillas.length)];
 const grano = plantilla.granos[Math.floor(Math.random() * plantilla.granos.length)];
 const nombre = plantilla.nombres[Math.floor(Math.random() * plantilla.nombres.length)];
 const pago = calcularPago(plantilla.cantidad, plantilla.tipo, grano);
 let rondasIniciales = categoria === 'medianos' ? 3 + Math.floor(Math.random() * 2)
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


// Función para calcular el pago según coste y tamaño
function calcularPago(cantidad, tipo, grano) {
  const variedad = variedades[grano];
  let costeBase = 0;
  
  if (tipo === "verde") {
    // Coste de plantación para obtener la cantidad
    const plantacionesNecesarias = Math.ceil(cantidad / variedad.produccionSacos);
    costeBase = plantacionesNecesarias * variedad.costePlantacion;
  } else {
    // Coste de plantación + procesamiento
    const plantacionesNecesarias = Math.ceil(cantidad / variedad.produccionSacos);
    costeBase = plantacionesNecesarias * variedad.costePlantacion;
    
    // Añadir coste de procesamiento
    const proceso = tipo === "tostado_artesanal" ? procesos.TOSTADO_ARTESANAL : procesos.TOSTADO_INDUSTRIAL;
    costeBase += cantidad * proceso.costeProcesado;
  }
  
  // Aplicar margen según tamaño
  let multiplicador = 1.15; // Pequeño
  if (cantidad >= 9) multiplicador = 1.30; // Grande
  else if (cantidad >= 5) multiplicador = 1.25; // Mediano
  
  return Math.round(costeBase * multiplicador);
}

// ===================================
// ESTADO DE CONTRATOS ACTIVOS
// ===================================

let contratosDisponibles = [];
let contratosCompletados = [];

// Generar contratos balanceados: 2 pequeños, 2 medianos, 2 grandes
function generarContratos() {
 const conteo = { pequeños: 0, medianos: 0, grandes: 0 };
 contratosDisponibles.forEach(c => { if (conteo[c.categoria] !== undefined) conteo[c.categoria]++; });
 Object.keys(objetivosContratos).forEach(cat => {
  while (conteo[cat] < objetivosContratos[cat]) {
   contratosDisponibles.push(crearContrato(cat));
   conteo[cat]++;
  }
 });
 actualizarUIContratos();
}


// ===================================
// VERIFICAR Y CUMPLIR CONTRATOS
// ===================================

async function intentarCumplirContrato(contratoId) {
  const jugador = jugadores[0];
  const contrato = contratosDisponibles.find(c => c.id === contratoId);
  const dineroAntes = jugador.dinero;
  
  if (!contrato) {
    await mostrarAlerta("Contrato no encontrado", 'error');
    return;
  }
  
  if (jugador.paRestantes < 1) {
    await mostrarAlerta("¡No tienes PA suficientes!", 'advertencia');
    return;
  }
  
  // Verificar si tiene el tipo de café requerido
  const inventarioKey = contrato.tipo === "verde" 
    ? `verde_${contrato.grano}` 
    : `${contrato.tipo}_${contrato.grano}`;
  
  const stockDisponible = jugador.inventario[inventarioKey] || 0;
  
  if (stockDisponible < contrato.cantidadRequerida) {
    await mostrarAlerta(`Necesitas ${contrato.cantidadRequerida} sacos de ${obtenerNombreTipoCafe(contrato.tipo, contrato.grano)}. Solo tienes ${stockDisponible}.`, 'advertencia');
    return;
  }
  
  // ¡CUMPLIR CONTRATO!
  jugador.paRestantes--;
  jugador.inventario[inventarioKey] -= contrato.cantidadRequerida;
  jugador.dinero += contrato.pago;
  jugador.puntosVictoria += contrato.prestigio;
  
  addLog(`✅ CONTRATO CUMPLIDO: "${contrato.nombre}" - Ganancia: ${contrato.pago}€ (+${contrato.prestigio} PV)`, 'ganancia');
  
  // Mover a completados y quitar de disponibles
  contratosCompletados.push(contrato);
  contratosDisponibles = contratosDisponibles.filter(c => c.id !== contratoId);
  
  const animado = aplicarAnimacionSalidaContrato(contratoId);

  actualizarIU();
  if (typeof animarCambioDinero === 'function') {
    animarCambioDinero(dineroAntes, jugador.dinero);
  }
  if (animado) {
    await esperar(DURACION_ANIMACION_CONTRATO);
  }
  actualizarUIContratos();
}

// ===================================
// SISTEMA DE PROCESAMIENTO
// ===================================

async function procesarCafe(tipoGrano, tipoProceso, cantidadForzada = null) {
  console.log(`procesarCafe llamado: tipoGrano=${tipoGrano}, tipoProceso=${tipoProceso}`);
  
  const jugador = jugadores[0];
  const proceso = procesos[tipoProceso];
  
  if (!proceso) {
    await mostrarAlerta(`Error: Proceso ${tipoProceso} no encontrado`, 'error');
    console.error(`Proceso no encontrado: ${tipoProceso}`, procesos);
    return false;
  }

  const tieneTostadora = jugador.activos.tostadoras && jugador.activos.tostadoras[tipoGrano];
  if (!tieneTostadora) {
    await mostrarAlerta(`Necesitas comprar la tostadora de ${variedades[tipoGrano].nombre} antes de procesar.`, 'info');
    return false;
  }

  if (jugador.paRestantes < proceso.paRequeridos) {
    await mostrarAlerta("¡No tienes PA suficientes!", 'advertencia');
    return false;
  }

  const inventarioVerdeKey = `verde_${tipoGrano}`;
  const stockVerde = jugador.inventario[inventarioVerdeKey] || 0;
  if (stockVerde === 0) {
    await mostrarAlerta(`No tienes grano verde ${variedades[tipoGrano].nombre} para procesar`, 'info');
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
  addLog(`⚙️ Procesando ${cantidad} sacos de ${variedades[tipoGrano].nombre} (${proceso.nombre}) - Coste: ${costeTotal}€`, 'gasto');
  addLog(`📦 Procesado completado: +${produccionSacos} sacos de ${variedades[tipoGrano].nombre} ${etiquetaProceso}`, 'ganancia');
  await mostrarAlerta(`Se han tostado ${produccionSacos} sacos de ${variedades[tipoGrano].nombre} (${etiquetaProceso}).`, 'exito', 'Procesado completado');
  
  actualizarIU();
  return true;
}

function actualizarUIContratos() {
  let html = '<h3>📄 Contratos Disponibles</h3>';
  const huecosPendientes = Math.max(0, TOTAL_CONTRATOS_OBJETIVO - contratosDisponibles.length);
  
  if (contratosDisponibles.length === 0) {
    html += '<p style="color: #999;">No hay contratos disponibles esta ronda</p>';
  } else {
    contratosDisponibles.forEach(contrato => {
      const nombreCafe = obtenerNombreTipoCafe(contrato.tipo, contrato.grano);
      const colorTipo = contrato.tipo === "verde" ? "#ffc107" : "#8B4513";
      const expiraTexto = contrato.rondasRestantes === 1
        ? `Duración del contrato: ${contrato.rondasIniciales} rondas. Expira esta ronda.`
        : `Duración del contrato: ${contrato.rondasIniciales} rondas. Expira en ${contrato.rondasRestantes}.`;
      
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

  for (let i = 0; i < huecosPendientes; i++) {
    html += `
      <div class="contrato-card contrato-placeholder">
        <strong>Hueco libre</strong><br>
        <small>Se repondrá al iniciar la próxima ronda</small>
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
  if (tipo === "verde") return `${base} Verde`;
  if (tipo === "tostado_artesanal") return `${base} Café Premium`;
  if (tipo === "tostado_industrial") return `${base} Café Comercial`;
  return base;
}

// Reducir rondas restantes de contratos
async function avanzarContratos() {
  const contratosExpirados = [];
  const expiradosIds = [];
  
  contratosDisponibles.forEach(contrato => {
    contrato.rondasRestantes--;
    if (contrato.rondasRestantes <= 0) {
      contratosExpirados.push(contrato.nombre);
      expiradosIds.push(contrato.id);
      contrato._marcarExpira = true;
    }
  });
  
  if (expiradosIds.length > 0) {
    expiradosIds.forEach(aplicarAnimacionSalidaContrato);
    await esperar(DURACION_ANIMACION_CONTRATO);
    contratosDisponibles = contratosDisponibles.filter(c => !c._marcarExpira);
    if (contratosExpirados.length > 0) {
      addLog('⚠️ Contratos expirados: ' + contratosExpirados.join(', '), 'gasto');
    }
  }

  // Rellenar huecos (expirados o completados) tras la animación
  generarContratos();
}