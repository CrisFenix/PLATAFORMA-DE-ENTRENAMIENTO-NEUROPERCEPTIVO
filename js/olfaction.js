/**
 * olfaction.js — MÓDULO 6: OLFATO
 * El navegador no puede generar ni detectar olores. Este módulo funciona
 * como una guía de entrenamiento a ciegas: el usuario huele muestras
 * físicas reales que él mismo prepara, y registra manualmente su propia
 * respuesta. La app solo estructura la prueba y calcula precisión.
 */
const OlfactionModule = (() => {

  const meta = {
    id: 'olfaction',
    name: 'Olfato (guiado)',
    description: 'Entrenamiento de discriminación olfativa a ciegas con aromas físicos que tú mismo preparas.',
    status: 'disponible',
    difficulty: 'Guiado'
  };

  const CATEGORIES = ['Cítrico', 'Floral', 'Especiado', 'Dulce', 'Terroso', 'Mentolado', 'Otro'];

  function start(container) {
    renderIntro();

    function renderIntro() {
      container.innerHTML = `
        <div class="exercise-shell">
          <div class="notice"><strong>Este módulo requiere materiales físicos.</strong> Necesitas entre 3 y 6 recipientes opacos con aromas seguros y no irritantes (por ejemplo: café, canela, menta, cítrico, vainilla). No utilices sustancias tóxicas, irritantes o desconocidas.</div>
          <div class="instructions-panel">
            <h2>Nivel de entrenamiento</h2>
            <p>Elige el nivel. En todos los niveles, la aplicación solo guía la secuencia; tú registras manualmente lo que percibes.</p>
            <div class="difficulty-select">
              <button data-level="1">Nivel 1 — Identificación individual</button>
              <button data-level="2">Nivel 2 — Aromas similares</button>
              <button data-level="3">Nivel 3 — Mezclas de dos aromas</button>
            </div>
            <button class="btn btn-ghost" id="btn-exit">Volver</button>
          </div>
        </div>`;
      container.querySelector('#btn-exit').addEventListener('click', () => App.showModulePanel());
      container.querySelectorAll('[data-level]').forEach(btn => btn.addEventListener('click', () => runLevel(Number(btn.dataset.level))));
    }

    function runLevel(level) {
      const sampleCount = level === 1 ? 4 : level === 2 ? 5 : 4;
      const samples = Array.from({ length: sampleCount }, (_, i) => i + 1);
      let idx = 0;
      const results = [];

      renderSample();

      function renderSample() {
        const s = samples[idx];
        container.innerHTML = `
          <div class="exercise-shell">
            <div class="exercise-topbar">
              <span class="exercise-title">Olfato · Nivel ${level}</span>
              <div class="exercise-hud"><span class="hud-item">Muestra <b>${idx + 1}</b>/${samples.length}</span></div>
              <button class="btn btn-ghost exercise-exit" id="btn-exit-sub">Salir</button>
            </div>
            <div class="guided-panel">
              <div class="sample-tracker">
                ${samples.map((n, i) => `<span class="sample-chip ${i === idx ? 'current' : i < idx ? 'done' : ''}">Muestra ${n}</span>`).join('')}
              </div>
              <p><strong>Muestra ${s}.</strong> ${levelInstruction(level)}</p>
              <p class="field-hint">Huele el recipiente correspondiente ahora mismo antes de responder.</p>
              <div class="option-grid">
                ${CATEGORIES.map(c => `<button data-cat="${c}">${c}</button>`).join('')}
              </div>
              ${level === 3 ? `<p class="field-hint">Si percibes una mezcla, elige la categoría dominante.</p>` : ''}
            </div>
          </div>`;
        container.querySelector('#btn-exit-sub').addEventListener('click', () => App.showModulePanel());
        container.querySelectorAll('[data-cat]').forEach(btn => btn.addEventListener('click', () => {
          results.push({ sample: s, chosen: btn.dataset.cat });
          idx++;
          if (idx >= samples.length) finishReview();
          else renderSample();
        }));
      }

      function levelInstruction(lvl) {
        return {
          1: 'Identifica la categoría que mejor describe el aroma.',
          2: 'Este aroma podría confundirse con otro similar. Elige con atención.',
          3: 'Esta muestra puede combinar dos aromas.'
        }[lvl];
      }

      function finishReview() {
        // Autoevaluación: el propio usuario confirma qué aroma correspondía a qué muestra realmente,
        // ya que la app no puede conocer los aromas físicos usados.
        container.innerHTML = `
          <div class="exercise-shell">
            <div class="instructions-panel">
              <h2>Registro de resultados reales</h2>
              <p>Ahora indica, para cada muestra, cuál era el aroma real que usaste (para calcular tu precisión). Esto queda solo en tu sesión, en memoria.</p>
              <div id="verify-form">
                ${results.map((r, i) => `
                  <div class="field-row" style="margin-bottom:10px;">
                    <span class="field-hint">Muestra ${r.sample} — respondiste: <strong style="color:var(--phosphor)">${r.chosen}</strong></span>
                    <select data-i="${i}">${CATEGORIES.map(c => `<option ${c === r.chosen ? 'selected' : ''}>${c}</option>`).join('')}</select>
                  </div>`).join('')}
              </div>
              <button class="btn btn-primary" id="btn-check-olf">Calcular precisión</button>
            </div>
          </div>`;
        container.querySelector('#btn-check-olf').addEventListener('click', () => {
          let correct = 0;
          container.querySelectorAll('[data-i]').forEach(sel => {
            const i = Number(sel.dataset.i);
            if (sel.value === results[i].chosen) correct++;
          });
          const accuracy = Metrics.accuracyPct(correct, results.length);
          App.recordSessionResult({ moduleId: meta.id, moduleName: `Olfato (nivel ${level})`, accuracy, level: null });
          Metrics.renderResultPanel(container, {
            items: [
              { label: 'Identificaciones correctas', value: `${correct} / ${results.length}` },
              { label: 'Precisión', value: Metrics.fmtPct(accuracy) }
            ],
            onRetry: () => runLevel(level),
            onExit: () => App.showModulePanel()
          });
        });
      }
    }
  }

  return { meta, start };
})();
