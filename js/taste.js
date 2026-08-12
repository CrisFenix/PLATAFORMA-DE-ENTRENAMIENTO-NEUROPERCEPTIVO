/**
 * taste.js — MÓDULO 7: GUSTO
 * Igual que el módulo de olfato, el navegador solo guía la prueba;
 * el usuario prueba alimentos seguros que él mismo proporciona.
 * No se presenta como mejora fisiológica del sentido del gusto.
 */
const TasteModule = (() => {

  const meta = {
    id: 'taste',
    name: 'Gusto (guiado)',
    description: 'Entrenamiento de identificación e intensidad de sabores básicos con alimentos que tú proporcionas.',
    status: 'disponible',
    difficulty: 'Guiado'
  };

  const BASIC_TASTES = ['Dulce', 'Salado', 'Ácido', 'Amargo', 'Umami'];

  function start(container) {
    container.innerHTML = `
      <div class="exercise-shell">
        <div class="notice"><strong>Este módulo requiere alimentos reales.</strong> Prepara entre 3 y 5 muestras pequeñas y seguras (ej. algo dulce, algo salado, un cítrico, café sin azúcar, un caldo). No se afirma ninguna mejora fisiológica del sentido del gusto: es solo entrenamiento de atención e identificación.</div>
        <div class="instructions-panel">
          <h2>Fase</h2>
          <div class="difficulty-select">
            <button data-phase="identify">Identificación de sabores básicos</button>
            <button data-phase="intensity">Comparación de intensidad</button>
          </div>
          <button class="btn btn-ghost" id="btn-exit">Volver</button>
        </div>
      </div>`;
    container.querySelector('#btn-exit').addEventListener('click', () => App.showModulePanel());
    container.querySelectorAll('[data-phase]').forEach(btn => btn.addEventListener('click', () => {
      btn.dataset.phase === 'identify' ? runIdentify() : runIntensity();
    }));

    function runIdentify() {
      const sampleCount = 4;
      let idx = 0;
      const results = [];
      renderSample();

      function renderSample() {
        container.innerHTML = `
          <div class="exercise-shell">
            <div class="exercise-topbar">
              <span class="exercise-title">Gusto · Identificación</span>
              <div class="exercise-hud"><span class="hud-item">Muestra <b>${idx + 1}</b>/${sampleCount}</span></div>
              <button class="btn btn-ghost exercise-exit" id="btn-exit-sub">Salir</button>
            </div>
            <div class="guided-panel">
              <div class="sample-tracker">${Array.from({ length: sampleCount }, (_, i) => `<span class="sample-chip ${i === idx ? 'current' : i < idx ? 'done' : ''}">Muestra ${i + 1}</span>`).join('')}</div>
              <p>Prueba la muestra ${idx + 1} y selecciona el sabor dominante que percibes.</p>
              <div class="option-grid">${BASIC_TASTES.map(t => `<button data-taste="${t}">${t}</button>`).join('')}</div>
            </div>
          </div>`;
        container.querySelector('#btn-exit-sub').addEventListener('click', () => App.showModulePanel());
        container.querySelectorAll('[data-taste]').forEach(btn => btn.addEventListener('click', () => {
          results.push({ sample: idx + 1, chosen: btn.dataset.taste });
          idx++;
          idx >= sampleCount ? verify() : renderSample();
        }));
      }

      function verify() {
        container.innerHTML = `
          <div class="exercise-shell">
            <div class="instructions-panel">
              <h2>Confirma el sabor real de cada muestra</h2>
              <p>Para calcular tu precisión, indica cuál era realmente el sabor dominante de cada muestra que preparaste.</p>
              ${results.map((r, i) => `
                <div class="field-row" style="margin-bottom:10px;">
                  <span class="field-hint">Muestra ${r.sample} — respondiste: <strong style="color:var(--phosphor)">${r.chosen}</strong></span>
                  <select data-i="${i}">${BASIC_TASTES.map(t => `<option ${t === r.chosen ? 'selected' : ''}>${t}</option>`).join('')}</select>
                </div>`).join('')}
              <button class="btn btn-primary" id="btn-check">Calcular precisión</button>
            </div>
          </div>`;
        container.querySelector('#btn-check').addEventListener('click', () => {
          let correct = 0;
          container.querySelectorAll('[data-i]').forEach(sel => {
            const i = Number(sel.dataset.i);
            if (sel.value === results[i].chosen) correct++;
          });
          const accuracy = Metrics.accuracyPct(correct, results.length);
          App.recordSessionResult({ moduleId: meta.id, moduleName: 'Gusto (identificación)', accuracy, level: null });
          Metrics.renderResultPanel(container, {
            items: [{ label: 'Identificaciones correctas', value: `${correct} / ${results.length}` }, { label: 'Precisión', value: Metrics.fmtPct(accuracy) }],
            onRetry: runIdentify, onExit: () => App.showModulePanel()
          });
        });
      }
    }

    function runIntensity() {
      container.innerHTML = `
        <div class="exercise-shell">
          <div class="instructions-panel">
            <h2>Comparación de intensidad</h2>
            <p>Prepara dos muestras del mismo sabor básico con concentración distinta (por ejemplo, agua con poca sal vs. agua con más sal). Pruébalas y registra cuál percibiste más intensa.</p>
            <div class="difficulty-select">
              <button data-r="A">A fue más intensa</button>
              <button data-r="B">B fue más intensa</button>
              <button data-r="=">Percibí las dos iguales</button>
            </div>
          </div>
        </div>`;
      container.querySelectorAll('[data-r]').forEach(btn => btn.addEventListener('click', () => {
        App.recordSessionResult({ moduleId: meta.id, moduleName: 'Gusto (intensidad)', accuracy: null, level: null });
        Metrics.renderResultPanel(container, {
          items: [{ label: 'Respuesta registrada', value: btn.dataset.r === '=' ? 'Percepción igual' : `Muestra ${btn.dataset.r} más intensa` }],
          onRetry: runIntensity, onExit: () => App.showModulePanel()
        });
      }));
    }
  }

  return { meta, start };
})();
