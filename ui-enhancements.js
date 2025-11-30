(function enhanceLogSystem() {
    const colorPorTipo = {
        ronda: '#0056b3',
        ganancia: '#28a745',
        gasto: '#dc3545',
        accion: '#2c3e50'
    };

    const iconoPorTipo = {
        ronda: '\uD83D\uDDD3',
        ganancia: '\uD83D\uDCB0',
        gasto: '\uD83D\uDCB8',
        accion: '\u2699\uFE0F'
    };

    const detectarIcono = (mensaje) => {
        const texto = mensaje.toLowerCase();
        if (texto.includes('plantado')) {
            return { icono: '\uD83E\uDEB4\uD83E\uDEB4', color: '#dc3545' };
        }
        if (texto.includes('cosecha')) {
            return { icono: '\uD83C\uDF3E', color: '#16a085' };
        }
        if (texto.includes('procesamiento completado')) {
            return { icono: '\uD83D\uDD25', color: '#28a745' };
        }
        if (texto.includes('contrato cumplido')) {
            return { icono: '\uD83C\uDF43', color: '#1abc9c' };
        }
        if (texto.includes('advertencia')) {
            return { icono: '\u26A0\uFE0F', color: '#e67e22' };
        }
        if (texto.includes('tostadora comprada')) {
            return { icono: '\uD83D\uDEE0\uFE0F', color: '#dc3545' };
        }
        if (texto.includes('vendido')) {
            return { icono: '\uD83D\uDCB5', color: '#28a745' };
        }
        return null;
    };

    window.addLog = function addLog(mensaje, tipo = 'accion', iconoPersonalizado = null) {
        const logContainer = document.getElementById('game-log');
        if (!logContainer) return;

        const item = document.createElement('p');
        item.classList.add('log-item');

        const colorBase = colorPorTipo[tipo] || '#2c3e50';
        let icono = iconoPersonalizado || iconoPorTipo[tipo] || '\u270F\uFE0F';
        let color = colorBase;
        const detectado = iconoPersonalizado ? null : detectarIcono(mensaje);
        if (detectado) {
            icono = detectado.icono;
            color = detectado.color;
        }

        item.style.color = color;
        item.innerHTML = `<span class="log-icon">${icono}</span><span>[R${gameState.rondaActual}] ${mensaje}</span>`;
        logContainer.prepend(item);
    };
})();

(function enhanceContratoPlaceholders() {
    const aplicarMensaje = () => {
        const contenedores = document.querySelectorAll('#contratos-listado .contrato-placeholder');
        contenedores.forEach(card => {
            const strong = card.querySelector('strong');
            const small = card.querySelector('small');
            if (strong) strong.textContent = 'Contrato pendiente';
            if (small) small.textContent = 'Se repondrá al comenzar la siguiente ronda.';
        });
    };

    const contenedor = document.getElementById('contratos-listado');
    if (!contenedor) {
        window.addEventListener('load', enhanceContratoPlaceholders);
        return;
    }

    aplicarMensaje();
    const observer = new MutationObserver(aplicarMensaje);
    observer.observe(contenedor, { childList: true, subtree: true });
})();
