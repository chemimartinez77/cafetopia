// contratos.js - Sistema de Contratos (CORREGIDO v2)

const plantillasContratos = {
  pequenos: [
    { cantidad: 1, tipo: "verde", granos: ['A', 'B', 'E'], nombres: ["Mercado Local", "Cafeteria Vecina", "Comprador Privado"] },
    { cantidad: 2, tipo: "verde", granos: ['A', 'B'], nombres: ["Distribuidor Local", "Exportador Pequeño"] },
    { cantidad: 3, tipo: "tostado_artesanal", granos: ['A', 'B'], nombres: ["Boutique Local", "Cafeteria Premium"] },
    { cantidad: 4, tipo: "verde", granos: ['A'], nombres: ["Mercado Local", "Distribuidor Local"] }
  ],
  medianos: [
    { cantidad: 5, tipo: "verde", granos: ['A', 'B', 'E'], nombres: ["Mercado Local", "Distribuidor Local"] },
    { cantidad: 6, tipo: "tostado_artesanal", granos: ['B', 'E'], nombres: ["Boutique Local", "Cafeteria Premium"] },
    { cantidad: 7, tipo: "tostado_industrial", granos: ['A', 'B'], nombres: ["Supermercados Regionales", "Cadenas de Cafeterias"] },
    { cantidad: 8, tipo: "verde", granos: ['A', 'B'], nombres: ["Distribuidor Local", "Mercado Local"] }
  ],
  grandes: [
    { cantidad: 9, tipo: "tostado_industrial", granos: ['A', 'B'], nombres: ["Supermercados Internacionales", "Cadenas Globales"] },
    { cantidad: 10, tipo: "verde", granos: ['A', 'E'], nombres: ["Mercado Local", "Distribuidor Local"] },
    { cantidad: 11, tipo: "tostado_artesanal", granos: ['B', 'E'], nombres: ["Boutique Local", "Exportacion Gourmet"] },
    { cantidad: 12, tipo: "tostado_industrial", granos: ['A'], nombres: ["Supermercados USA", "Cadenas Globales"] }
  ]
};

// Sistema de contratos compartidos: 4 temporales + 2 permanentes
const CONTRATOS_TEMPORALES = 4;
const CONTRATOS_PERMANENTES = 2;
const TOTAL_CONTRATOS_OBJETIVO = CONTRATOS_TEMPORALES + CONTRATOS_PERMANENTES;
const objetivosContratos = { pequenos: 2, medianos: 2, grandes: 2 }; // Distribución inicial
const DURACION_ANIMACION_CONTRATO = 2300;
let contadorContratos = 0;
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function crearContrato(categoria, esPermanente = false) {
  const plantillas = plantillasContratos[categoria];
  const plantilla = plantillas[Math.floor(Math.random() * plantillas.length)];
  const grano = plantilla.granos[Math.floor(Math.random() * plantilla.granos.length)];
  const nombre = plantilla.nombres[Math.floor(Math.random() * plantilla.nombres.length)];
  const pago = calcularPago(plantilla.cantidad, plantilla.tipo, grano);

  // Duración INICIAL del contrato (cuántas rondas desde que aparece)
  // Si es permanente, rondasRestantes es null
  const rondasIniciales = esPermanente ? null : (
    categoria === 'medianos' ? 3 + Math.floor(Math.random() * 2)
    : categoria === 'grandes' ? 4 + Math.floor(Math.random() * 2)
    : 2 + Math.floor(Math.random() * 2)
  );

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
    rondasRestantes: rondasIniciales,  // null para permanentes, número para temporales
    esPermanente  // Flag para identificar contratos permanentes
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

  // Multiplicadores basados en tus IDs: A (Robusta), B (Arábica), E (Geisha)
  const multiplicadoresRareza = {
    "A": 1.15, // Robusta: Margen pequeño, dependes del volumen.
    "B": 1.40, // Arábica: Margen mejorado por la espera de 2 rondas.
    "E": 1.70  // Geisha: Margen alto porque bloqueas una parcela 4 rondas.
  };

  const bonoRareza = multiplicadoresRareza[grano] || 1.0;

  // Multiplicador por VOLUMEN (Premiamos mover mucha cantidad)
  let multiplicadorVolumen = 1.10; 
  if (cantidad >= 9) multiplicadorVolumen = 1.40; 
  else if (cantidad >= 5) multiplicadorVolumen = 1.25;

  // Bonus por PROCESADO (basado en tus multiplicadorPrecio de procesos)
  let bonoProceso = 0;
  if (tipo === 'tostado_artesanal') bonoProceso = 0.30; 
  else if (tipo === 'tostado_industrial') bonoProceso = 0.15;

  return Math.round(costeBase * (multiplicadorVolumen + bonoProceso) * bonoRareza);
}

let contratosDisponibles = [];
let contratosCompletados = [];

// Exportar globalmente para acceso desde la red
window.contratosDisponibles = contratosDisponibles;
window.contratosCompletados = contratosCompletados;

// ===================================
// GENERAR CONTRATOS PARA LLENAR HUECOS
// ===================================
function generarContratos() {
  const conteoTemporales = contratosDisponibles.filter(c => !c.esPermanente).length;
  const conteoPermanentes = contratosDisponibles.filter(c => c.esPermanente).length;

  console.log(`📊 Estado actual: ${conteoTemporales} temporales, ${conteoPermanentes} permanentes`);

  // Generar contratos temporales faltantes (4 total)
  const temporalesFaltantes = CONTRATOS_TEMPORALES - conteoTemporales;
  if (temporalesFaltantes > 0) {
    console.log(`📝 Generando ${temporalesFaltantes} contratos temporales`);

    for (let i = 0; i < temporalesFaltantes; i++) {
      // Distribuir entre categorías
      const categorias = ['pequenos', 'medianos', 'grandes'];
      const categoria = categorias[i % categorias.length];
      const nuevoContrato = crearContrato(categoria, false);
      contratosDisponibles.push(nuevoContrato);
      console.log(`✅ Temporal creado: ${nuevoContrato.nombre} (${nuevoContrato.rondasRestantes} rondas)`);
    }
  }

  // Generar contratos permanentes faltantes (2 total)
  const permanentesFaltantes = CONTRATOS_PERMANENTES - conteoPermanentes;
  if (permanentesFaltantes > 0) {
    console.log(`📝 Generando ${permanentesFaltantes} contratos permanentes`);

    for (let i = 0; i < permanentesFaltantes; i++) {
      // Los permanentes suelen ser de categorías más altas
      const categoria = i === 0 ? 'medianos' : 'grandes';
      const nuevoContrato = crearContrato(categoria, true);
      contratosDisponibles.push(nuevoContrato);
      console.log(`✅ Permanente creado: ${nuevoContrato.nombre} (SIN LIMITE)`);
    }
  }

  console.log(`📦 Total contratos: ${contratosDisponibles.length}/${TOTAL_CONTRATOS_OBJETIVO}`);
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

// Función de validación con alertas (solo para el iniciador)
async function confirmarCumplirContrato(contratoId) {
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

  // Usamos la función de utilidad para obtener la clave exacta
  const inventarioKey = obtenerKeyInventario(contrato.tipo, contrato.grano);
  const stockDisponible = jugador.inventario[inventarioKey] || 0;

  if (stockDisponible < contrato.cantidadRequerida) {
    await mostrarAlerta(
      `Necesitas ${contrato.cantidadRequerida} sacos de ${obtenerNombreTipoCafe(contrato.tipo, contrato.grano)}. Solo tienes ${stockDisponible}.`,
      'advertencia'
    );
    return;
  }

  // Validaciones pasadas - ejecutar el contrato
  await intentarCumplirContrato(contratoId);
}

// Función interna que ejecuta el cumplimiento (sin alertas, se llama desde la red o después de confirmar)
async function intentarCumplirContrato(contratoId) {
  const jugador = obtenerJugadorActual();
  const contrato = contratosDisponibles.find((c) => c.id === contratoId);

  if (!contrato) {
    console.error('❌ Contrato no encontrado:', contratoId);
    return false;
  }

  // Usamos la función de utilidad para obtener la clave exacta
  const inventarioKey = obtenerKeyInventario(contrato.tipo, contrato.grano);

  // CUMPLIR CONTRATO
  jugador.inventario[inventarioKey] -= contrato.cantidadRequerida;
  jugador.dinero += contrato.pago;
  jugador.puntosVictoria += contrato.prestigio;

  // Al acceder a variedades, usamos directamente contrato.grano ('A', 'B' o 'E')
  const infoVariedad = variedades[contrato.grano];

  addLog(
    `✅ CONTRATO CUMPLIDO: "${contrato.nombre}" - ${contrato.cantidadRequerida} sacos de ${infoVariedad.nombre} - ${contrato.pago}€ (+${contrato.prestigio} PV)`,
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
  return true;
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
// GENERACIÓN DE IMAGEN PARA CONTRATOS
// ===================================
/**
 * Genera el nombre de archivo de imagen para un contrato basado en:
 * - Nombre del negocio (ej: "Boutique Local" -> "boutique.local")
 * - Variedad de café (A/B/E -> robusta/arabica/geisha)
 * - Tipo de procesado (verde/tostado_artesanal/tostado_industrial -> verde/premium/comercial)
 *
 * Formato: public/{negocio}.{variedad}.{procesado}.png
 * Ejemplo: public/boutique.local.arabica.premium.png
 */
function generarImagenContrato(contrato) {
  // 1. Extraer solo el nombre del negocio (antes del " - ")
  // Ejemplo: "Boutique Local - Arábica" -> "Boutique Local"
  const nombreCompleto = contrato.nombre;
  const nombreNegocio = nombreCompleto.split(' - ')[0] // Separar por " - " y tomar la primera parte
    .toLowerCase()
    .replace(/\s+/g, '.') // Reemplazar espacios con puntos
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Eliminar acentos

  // 2. Convertir código de variedad a nombre
  const mapaVariedades = {
    'A': 'robusta',
    'B': 'arabica',
    'E': 'geisha'
  };
  const nombreVariedad = mapaVariedades[contrato.grano] || 'robusta';

  // 3. Convertir tipo de procesado
  let tipoProcesado = 'verde';
  if (contrato.tipo === 'tostado_artesanal') {
    tipoProcesado = 'premium';
  } else if (contrato.tipo === 'tostado_industrial') {
    tipoProcesado = 'comercial';
  }

  // 4. Construir nombre de archivo
  const nombreArchivo = `public/${nombreNegocio}.${nombreVariedad}.${tipoProcesado}.png`;

  // 5. Lista de imágenes conocidas (actualizar cuando se añadan más)
  const imagenesDisponibles = [
    'public/boutique.local.arabica.premium.png',
    'public/boutique.local.robusta.premium.png',
    'public/distribuidor.local.arabica.verde.png',
    'public/distribuidor.local.robusta.verde.png',
    'public/mercado.local.arabica.verde.png',
    'public/mercado.local.geisha.verde.png',
    'public/mercado.local.robusta.verde.png'
  ];

  // 6. Debug: mostrar qué archivo se está buscando
  console.log(`🖼️ Buscando imagen para "${nombreCompleto}"`);
  console.log(`   Negocio: "${nombreNegocio}", Variedad: "${nombreVariedad}", Procesado: "${tipoProcesado}"`);
  console.log(`   Archivo generado: "${nombreArchivo}"`);
  console.log(`   ¿Existe? ${imagenesDisponibles.includes(nombreArchivo)}`);

  // 7. Verificar si la imagen existe en la lista
  if (imagenesDisponibles.includes(nombreArchivo)) {
    console.log(`   ✅ Imagen encontrada!`);
    return nombreArchivo;
  }

  // Si no existe, retornar null (no se aplicará imagen de fondo)
  console.log(`   ❌ Imagen no encontrada`);
  return null;
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
      
      // Texto de expiración según tipo de contrato
      let expiraTexto = '';
      if (contrato.esPermanente) {
        expiraTexto = `♾️ <strong style="color: #27ae60;">CONTRATO PERMANENTE</strong> - Sin límite de tiempo`;
      } else if (contrato.rondasRestantes === 1) {
        expiraTexto = `⏰ Duración: ${contrato.rondasIniciales} rondas. <strong style="color: #e74c3c;">Expira esta ronda</strong>.`;
      } else {
        expiraTexto = `⏰ Duración: ${contrato.rondasIniciales} rondas. Expira en ${contrato.rondasRestantes} rondas.`;
      }
      
      // Generar nombre de archivo de imagen basado en nombre del contrato, variedad y tipo
      const imagenFondo = generarImagenContrato(contrato);

      html += `
        <div class="contrato-card ${imagenFondo ? 'contrato-con-fondo' : ''}" data-contrato-id="${contrato.id}" style="border-left: 4px solid ${colorTipo}; ${imagenFondo ? `background-image: url(${imagenFondo});` : ''}">
          <div class="contrato-contenido">
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

// ===================================
// FUNCIONES DE UTILIDAD
// ===================================

// Función para construir la clave del inventario de forma consistente
function obtenerKeyInventario(tipo, grano) {
  // tipo puede ser: 'verde', 'tostado_artesanal' o 'tostado_industrial'
  // grano puede ser: 'A', 'B' o 'E'
  return `${tipo}_${grano}`;
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

  // Reducir contador de rondas restantes SOLO para contratos temporales
  contratosDisponibles.forEach((contrato) => {
    if (contrato.esPermanente) {
      console.log(`♾️ "${contrato.nombre}": PERMANENTE (sin límite)`);
    } else {
      contrato.rondasRestantes--;
      console.log(`⏳ "${contrato.nombre}": ${contrato.rondasRestantes} rondas restantes`);

      if (contrato.rondasRestantes <= 0) {
        contratosExpirados.push(contrato);
      }
    }
  });

  // Eliminar los que llegaron a 0 (solo temporales)
  if (contratosExpirados.length > 0) {
    console.log(`❌ Expirando ${contratosExpirados.length} contrato(s) temporal(es)`);

    const contratosFiltrados = contratosDisponibles.filter(
      (c) => c.esPermanente || c.rondasRestantes > 0
    );

    // Actualizar array in-place para mantener referencia
    contratosDisponibles.length = 0;
    contratosDisponibles.push(...contratosFiltrados);
    window.contratosDisponibles = contratosDisponibles;

    const nombresExpirados = contratosExpirados.map(c => c.nombre).join(", ");
    addLog(`❌ Contratos temporales expirados: ${nombresExpirados}`, 'alerta');
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
window.confirmarCumplirContrato = confirmarCumplirContrato;
window.avanzarContratos = avanzarContratos;
window.generarContratos = generarContratos;
window.obtenerKeyInventario = obtenerKeyInventario; // Función de utilidad para consistencia