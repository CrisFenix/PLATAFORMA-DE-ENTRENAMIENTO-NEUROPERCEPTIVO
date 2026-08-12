/**
 * memory.js — MÓDULO 2: MEMORIA
 * Ejercicio A: lista de elementos con longitud progresiva (5→7→10→12→15).
 * Ejercicio B: palacio de la memoria (asociación objeto-ubicación guiada).
 */
const MemoryModule = (() => {

  const meta = {
    id: 'memory',
    name: 'Memoria',
    description: 'Lista progresiva de elementos y ejercicio guiado de palacio de la memoria.',
    status: 'disponible',
    difficulty: 'Progresivo'
  };

  const WORD_BANK = [
    'linterna','montaña','tetera','violín','cometa','sendero','brújula','ámbar',
    'cristal','farol','tambor','ancla','molino','ceniza','jarra','puente',
    'roble','faro','cesta','vela','estanque','trineo','pluma','yunque',
    'cascada','telar','laúd','nube','sauce','pergamino'
  ];

  const PALACE_LOCATIONS = ['Entrada', 'Sala principal', 'Cocina', 'Pasillo', 'Estudio', 'Jardín'];

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function start(container, opts = {}) {
    renderMenu();

    function renderMenu() {
      container.innerHTML = `
        <div class="exercise-shell">
          <div class="instructions-panel">
            <h2>Memoria</h2>
            <p>Elige el ejercicio.</p>
            <div class="difficulty-select">
              <button class="btn btn-primary" id="btn-list">A · Lista de elementos</button>
              <button class="btn btn-primary" id="btn-palace">B · Palacio de la memoria</button>
            </div>
            <button class="btn btn-ghost" id="btn-exit">Volver</button>
          </div>
        </div>`;
      container.querySelector('#btn-list').addEventListener('click', () => runListExercise(5));
      container.querySelector('#btn-palace').addEventListener('click', () => runPalaceExercise());
      container.querySelector('#btn-exit').addEventListener('click', () => App.showModulePanel());
    }

    /* ============ EJERCICIO A: LISTA PROGRESIVA ============ */
    function runListExercise(count) {
      const words = shuffle(WORD_BANK).slice(0, count);
      const memorizeMs = 3000 + count * 700;

      container.innerHTML = `
        <div class="exercise-shell">
          <div class="exercise-topbar">
            <span class="exercise-title">Memoria · Lista (${count} elementos)</span>
            <button class="btn btn-ghost exercise-exit" id="btn-exit">Salir</button>
          </div>
          <div class="stimulus-stage stage-light" style="min-height:300px;">
            <div style="display:flex;flex-wrap:wrap;gap:14px;justify-content:center;padding:20px;">
              ${words.map(w => `<span style="font-family:var(--font-display);font-size:20px;color:#0a0d0e;background:#fff;border:1px solid #ccc;padding:10px 16px;border-radius:6px;">${w}</span>`).join('')}
            </div>
          </div>
          <div class="info-box" id="countdown-box">Memoriza esta lista. Tiempo restante: <strong id="cd">${Math.ceil(memorizeMs/1000)}s</strong></div>
        </div>`;
      container.querySelector('#btn-exit').addEventListener('click', () => App.showModulePanel());

      let remaining = Math.ceil(memorizeMs / 1000);
      const cdEl = container.querySelector('#cd');
      const cdHandle = setInterval(() => {
        remaining--;
        if (cdEl) cdEl.textContent = `${remaining}s`;
        if (remaining <= 0) { clearInterval(cdHandle); renderRecall(); }
      }, 1000);

      function renderRecall() {
        container.innerHTML = `
          <div class="exercise-shell">
            <div class="exercise-topbar">
              <span class="exercise-title">Memoria · Recuerda los elementos</span>
            </div>
            <div class="instructions-panel">
              <p>Escribe los elementos que recuerdes, uno por línea, en el orden que quieras.</p>
              <textarea id="recall-input" rows="8" style="width:100%;background:var(--bg-0);border:1px solid var(--line);color:var(--text-hi);padding:12px;border-radius:4px;font-family:var(--font-data);font-size:13px;"></textarea>
              <button class="btn btn-primary" id="btn-check" style="margin-top:14px;">Comprobar</button>
            </div>
          </div>`;
        container.querySelector('#btn-check').addEventListener('click', () => {
          const raw = container.querySelector('#recall-input').value.toLowerCase();
          const recalled = raw.split('\n').map(s => s.trim()).filter(Boolean);
          const correctSet = new Set(words.map(w => w.toLowerCase()));
          const correctRecalled = recalled.filter(r => correctSet.has(r));
          const uniqueCorrect = [...new Set(correctRecalled)];

          // orden correcto: cuántos de los recordados-correctos mantienen el orden relativo original
          let orderMatches = 0;
          let lastIdx = -1;
          uniqueCorrect.forEach(w => {
            const idx = words.findIndex(orig => orig.toLowerCase() === w);
            if (idx > lastIdx) { orderMatches++; lastIdx = idx; }
          });

          const accuracy = Metrics.accuracyPct(uniqueCorrect.length, words.length);
          const nextCount = accuracy >= 90 ? nextListLevel(count) : (accuracy < 60 ? prevListLevel(count) : count);

          App.recordSessionResult({ moduleId: meta.id, moduleName: 'Memoria (lista)', accuracy, level: null });

          Metrics.renderResultPanel(container, {
            items: [
              { label: 'Elementos correctos', value: `${uniqueCorrect.length} / ${words.length}` },
              { label: 'Porcentaje de recuerdo', value: Metrics.fmtPct(accuracy) },
              { label: 'Orden mantenido (aprox.)', value: `${orderMatches} / ${uniqueCorrect.length || 1}` },
              { label: 'Errores (no pertenecen a la lista)', value: recalled.length - correctRecalled.length }
            ],
            onRetry: () => runListExercise(nextCount),
            onExit: () => App.showModulePanel()
          });
        });
      }
    }

    function nextListLevel(count) {
      const seq = [5, 7, 10, 12, 15];
      const idx = seq.indexOf(count);
      return seq[Math.min(seq.length - 1, idx + 1)];
    }
    function prevListLevel(count) {
      const seq = [5, 7, 10, 12, 15];
      const idx = seq.indexOf(count);
      return seq[Math.max(0, idx - 1)];
    }

    /* ============ EJERCICIO B: PALACIO DE LA MEMORIA ============ */
    function runPalaceExercise() {
      const items = shuffle(WORD_BANK).slice(0, 6);
      const pairs = items.map((word, i) => ({ word, location: PALACE_LOCATIONS[i] }));

      container.innerHTML = `
        <div class="exercise-shell">
          <div class="instructions-panel">
            <h2>Palacio de la memoria</h2>
            <p>Esta técnica clásica consiste en asociar mentalmente cada elemento con un lugar familiar y recorrerlo en tu imaginación. A continuación se te presentará cada objeto junto a una ubicación de una casa imaginaria: visualízalo colocado allí con el mayor detalle posible.</p>
            <button class="btn btn-primary" id="btn-start-palace">Comenzar asociación</button>
          </div>
        </div>`;
      container.querySelector('#btn-start-palace').addEventListener('click', showPairs);

      function showPairs(i = 0) {
        if (i >= pairs.length) return recallPhase();
        const p = pairs[i];
        container.innerHTML = `
          <div class="exercise-shell">
            <div class="stimulus-stage stage-light">
              <div style="text-align:center;">
                <div style="font-family:var(--font-data);color:#666;font-size:12px;letter-spacing:.1em;text-transform:uppercase;">${p.location}</div>
                <div style="font-family:var(--font-display);font-size:30px;color:#0a0d0e;margin-top:10px;">${p.word}</div>
              </div>
            </div>
            <div class="info-box">Imagina "${p.word}" colocado vívidamente en "${p.location}". (${i + 1}/${pairs.length})</div>
            <button class="btn btn-primary" id="btn-next-pair">Siguiente</button>
          </div>`;
        container.querySelector('#btn-next-pair').addEventListener('click', () => showPairs(i + 1));
      }

      function recallPhase() {
        container.innerHTML = `
          <div class="exercise-shell">
            <div class="instructions-panel">
              <h2>Recorre el palacio</h2>
              <p>Para cada ubicación, escribe qué objeto asociaste.</p>
              <div id="palace-form">
                ${PALACE_LOCATIONS.slice(0, pairs.length).map((loc, i) => `
                  <div class="field">
                    <label>${loc}</label>
                    <input type="text" data-loc-idx="${i}" placeholder="Objeto recordado">
                  </div>`).join('')}
              </div>
              <button class="btn btn-primary" id="btn-check-palace">Comprobar</button>
            </div>
          </div>`;
        container.querySelector('#btn-check-palace').addEventListener('click', () => {
          let correct = 0;
          container.querySelectorAll('[data-loc-idx]').forEach(input => {
            const idx = Number(input.dataset.locIdx);
            const answer = input.value.trim().toLowerCase();
            if (answer === pairs[idx].word.toLowerCase()) correct++;
          });
          const accuracy = Metrics.accuracyPct(correct, pairs.length);
          App.recordSessionResult({ moduleId: meta.id, moduleName: 'Memoria (palacio)', accuracy, level: null });
          Metrics.renderResultPanel(container, {
            items: [
              { label: 'Ubicaciones correctas', value: `${correct} / ${pairs.length}` },
              { label: 'Porcentaje de recuerdo', value: Metrics.fmtPct(accuracy) }
            ],
            onRetry: () => runPalaceExercise(),
            onExit: () => App.showModulePanel()
          });
        });
      }
    }
  }

  return { meta, start };
})();
