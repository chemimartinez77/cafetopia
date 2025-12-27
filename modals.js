// modals.js - Sistema de Modales Personalizados

// ===================================
// MODAL DE ALERTA
// ===================================

function mostrarAlerta(mensaje, tipo = 'info', titulo = null) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modalAlerta');
        const icono = document.getElementById('modal-alerta-icono');
        const tituloEl = document.getElementById('modal-alerta-titulo');
        const mensajeEl = document.getElementById('modal-alerta-mensaje');
        const btnAceptar = document.getElementById('modal-alerta-aceptar');
        const btnCancelar = document.getElementById('modal-alerta-cancelar');
        const contenido = document.querySelector('.modal-alerta-contenido');
        
        // Ocultar botón cancelar para alertas simples
        btnCancelar.style.display = 'none';
        
        // Configurar según tipo
        let emoji = 'ℹ️';
        let tituloTexto = titulo || 'Información';
        
        switch(tipo) {
            case 'error':
                emoji = '❌';
                tituloTexto = titulo || 'Error';
                contenido.className = 'modal-alerta-contenido tipo-error';
                break;
            case 'advertencia':
                emoji = '⚠️';
                tituloTexto = titulo || 'Advertencia';
                contenido.className = 'modal-alerta-contenido tipo-advertencia';
                break;
            case 'info':
                emoji = 'ℹ️';
                tituloTexto = titulo || 'Información';
                contenido.className = 'modal-alerta-contenido tipo-info';
                break;
            case 'exito':
                emoji = '✅';
                tituloTexto = titulo || 'Éxito';
                contenido.className = 'modal-alerta-contenido tipo-info';
                break;
            default:
                contenido.className = 'modal-alerta-contenido tipo-info';
        }
        
        icono.textContent = emoji;
        tituloEl.textContent = tituloTexto;
        mensajeEl.textContent = mensaje;
        
        // Limpiar listeners anteriores
        const nuevoBtnAceptar = btnAceptar.cloneNode(true);
        btnAceptar.parentNode.replaceChild(nuevoBtnAceptar, btnAceptar);
        
        nuevoBtnAceptar.onclick = () => {
            modal.classList.remove('mostrar');
            setTimeout(() => {
                if (!modal.classList.contains('mostrar')) {
                    modal.style.display = "none";
                }
            }, 300); // Esperar a que termine la animación
            resolve(true);
        };


        // Mostrar modal
        modal.style.display = "flex";
        modal.classList.add('mostrar');

        // Cerrar al hacer clic fuera del modal
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('mostrar');
                setTimeout(() => {
                    if (!modal.classList.contains('mostrar')) {
                        modal.style.display = "none";
                    }
                }, 300); // Esperar a que termine la animación
                resolve(false);
            }
        };
    });
}

// ===================================
// MODAL DE CONFIRMACIÓN
// ===================================

function mostrarConfirmacion(mensaje, titulo = 'Confirmar') {
    return new Promise((resolve) => {
        const modal = document.getElementById('modalAlerta');
        const icono = document.getElementById('modal-alerta-icono');
        const tituloEl = document.getElementById('modal-alerta-titulo');
        const mensajeEl = document.getElementById('modal-alerta-mensaje');
        const btnAceptar = document.getElementById('modal-alerta-aceptar');
        const btnCancelar = document.getElementById('modal-alerta-cancelar');
        const contenido = document.querySelector('.modal-alerta-contenido');
        
        // Mostrar ambos botones
        btnCancelar.style.display = 'inline-block';
        
        // Configurar como pregunta
        icono.textContent = '❓';
        tituloEl.textContent = titulo;
        mensajeEl.textContent = mensaje;
        contenido.className = 'modal-alerta-contenido tipo-pregunta';
        
        // Limpiar listeners anteriores
        const nuevoBtnAceptar = btnAceptar.cloneNode(true);
        const nuevoBtnCancelar = btnCancelar.cloneNode(true);
        btnAceptar.parentNode.replaceChild(nuevoBtnAceptar, btnAceptar);
        btnCancelar.parentNode.replaceChild(nuevoBtnCancelar, btnCancelar);
        
        nuevoBtnAceptar.onclick = () => {
            modal.classList.remove('mostrar');
            setTimeout(() => {
                if (!modal.classList.contains('mostrar')) {
                    modal.style.display = "none";
                }
            }, 300); // Esperar a que termine la animación
            resolve(true);
        };

        nuevoBtnCancelar.onclick = () => {
            modal.classList.remove('mostrar');
            setTimeout(() => {
                if (!modal.classList.contains('mostrar')) {
                    modal.style.display = "none";
                }
            }, 300); // Esperar a que termine la animación
            resolve(false);
        };

        // Mostrar modal
        modal.style.display = "flex";
        modal.classList.add('mostrar');

        // Cerrar al hacer clic fuera del modal (cancelar)
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('mostrar');
                setTimeout(() => {
                    if (!modal.classList.contains('mostrar')) {
                        modal.style.display = "none";
                    }
                }, 300); // Esperar a que termine la animación
                resolve(false);
            }
        };
    });
}

// ===================================
// FUNCIONES DE REEMPLAZO
// ===================================

// Reemplazar alert() nativo
function alertPersonalizado(mensaje, tipo = 'info') {
    return mostrarAlerta(mensaje, tipo);
}

// Reemplazar confirm() nativo
function confirmPersonalizado(mensaje) {
    return mostrarConfirmacion(mensaje);
}

