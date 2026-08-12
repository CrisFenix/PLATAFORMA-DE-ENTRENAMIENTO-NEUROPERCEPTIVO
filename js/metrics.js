/**
 * metrics.js
 * Utilidades transversales usadas por todos los módulos:
 *  - estadística descriptiva (media, mediana, desviación estándar)
 *  - sistema de dificultad adaptativa (niveles 1-5)
 *  - construcción del panel de resultados
 *  - temporizadores reutilizables
 *
 * No depende de ningún otro archivo del proyecto.
 */
const Metrics = (() => {

  const LEVEL_NAMES = ['', 'Fácil', 'Básico', 'Intermedio', 'Avanzado', 'Experto'];

  /* ---------------- estadística descriptiva ---------------- */

  function mean(arr) {
    if (!arr.length) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  function median(arr) {
    if (!arr.length) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }

  function stddev(arr) {
    if (arr.length < 2) return 0;
    const m = mean(arr);
    const variance = arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length - 1);
    return Math.sqrt(variance);
  }

  function accuracyPct(correct, total) {
    if (total === 0) return 0;
    return Math.round((correct / total) * 1000) / 10;
  }

  /* ---------------- dificultad adaptativa ---------------- */
  // Regla del proyecto:
  //  >=90%  -> subir nivel
  //  60-89% -> mantener
  //  <60%   -> bajar nivel
  function adaptDifficulty(currentLevel, accuracyPercent) {
    let level = currentLevel;
    if (accuracyPercent >= 90) level = Math.min(5, level + 1);
    else if (accuracyPercent < 60) level = Math.max(1, level - 1);
    return level;
  }

  function levelName(level) {
    return LEVEL_NAMES[level] || '—';
  }

  /* ---------------- temporizadores ---------------- */

  /** Cuenta atrás simple con callback en cada tick y al finalizar. */
  function createCountdown({ seconds, onTick, onComplete }) {
    let remaining = seconds;
    let handle = null;
    return {
      start() {
        onTick && onTick(remaining);
        handle = setInterval(() => {
          remaining -= 1;
          if (onTick) onTick(remaining);
          if (remaining <= 0) {
            clearInterval(handle);
            onComplete && onComplete();
          }
        }, 1000);
      },
      stop() { if (handle) clearInterval(handle); }
    };
  }

  /** Devuelve un timestamp de alta resolución. */
  function now() {
    return performance.now();
  }

  /* ---------------- resultados ---------------- */

  /**
   * Construye el contenido del panel de resultados a partir de una plantilla
   * clonada del <template id="tpl-result-panel">.
   * items: [{label, value}]
   */
  function renderResultPanel(container, { items, onRetry, onExit }) {
    const tpl = document.getElementById('tpl-result-panel');
    const node = tpl.content.cloneNode(true);
    const grid = node.querySelector('.result-grid');
    items.forEach(({ label, value }) => {
      const el = document.createElement('div');
      el.className = 'result-item';
      el.innerHTML = `<span class="r-label"></span><span class="r-value"></span>`;
      el.querySelector('.r-label').textContent = label;
      el.querySelector('.r-value').textContent = value;
      grid.appendChild(el);
    });
    node.querySelector('[data-action="retry"]').addEventListener('click', onRetry);
    node.querySelector('[data-action="exit"]').addEventListener('click', onExit);
    container.innerHTML = '';
    container.appendChild(node);
  }

  /** Formatea milisegundos con precisión de lectura de instrumento. */
  function fmtMs(ms) {
    if (ms === null || ms === undefined || Number.isNaN(ms)) return '—';
    return `${Math.round(ms)} ms`;
  }

  function fmtPct(p) {
    if (p === null || p === undefined || Number.isNaN(p)) return '—';
    return `${p.toFixed(1)}%`;
  }

  return {
    mean, median, stddev, accuracyPct,
    adaptDifficulty, levelName,
    createCountdown, now,
    renderResultPanel, fmtMs, fmtPct
  };
})();
