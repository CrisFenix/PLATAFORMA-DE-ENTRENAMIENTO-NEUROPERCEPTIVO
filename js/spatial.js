/**
 * spatial.js — MÓDULO 9: ORIENTACIÓN ESPACIAL
 * Dos ejercicios: memoria de un mapa simple (dirección/distancia/ruta) y
 * rotación mental de figuras.
 */
const SpatialModule = (() => {

  const meta = {
    id: 'spatial',
    name: 'Orientación espacial',
    description: 'Memoria de rutas sobre un mapa simple y ejercicios de rotación mental.',
    status: 'disponible',
    difficulty: 'Progresivo'
  };

  function start(container) {
    container.innerHTML = `
      <div class="exercise-shell">
        <div class="instructions-panel">
          <h2>Orientación espacial</h2>
          <div class="difficulty-select">
            <button id="btn-map">Memoria de mapa y ruta</button>
            <button id="btn-rotation">Rotación mental</button>
          </div>
          <button class="btn btn-ghost" id="btn-exit">Volver</button>
        </div>
      </div>`;
    container.querySelector('#btn-exit').addEventListener('click', () => App.showModulePanel());
    container.querySelector('#btn-map').addEventListener('click', runMapExercise);
    container.querySelector('#btn-rotation').addEventListener('click', runRotationExercise);

    /* ============ MAPA Y RUTA ============ */
    function runMapExercise() {
      const nodes = [
        { id: 'A', x: 15, y: 20 }, { id: 'B', x: 70, y: 15 }, { id: 'C', x: 85, y: 60 },
        { id: 'D', x: 40, y: 75 }, { id: 'E', x: 12, y: 55 }
      ];
      const routeLen = 3 + Math.floor(Math.random() * 2);
      const route = [];
      let pool = [...nodes];
      for (let i = 0; i < routeLen; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        route.push(pool[idx]);
        pool = pool.filter((_, j) => j !== idx);
      }

      container.innerHTML = `
        <div class="exercise-shell">
          <div class="stimulus-stage stage-light" id="stage">
            ${nodes.map(n => `<div style="position:absolute; left:${n.x}%; top:${n.y}%; transform:translate(-50%,-50%); width:34px; height:34px; border-radius:50%; background:#ddd; border:2px solid #888; display:flex; align-items:center; justify-content:center; font-family:var(--font-display); color:#333;">${n.id}</div>`).join('')}
            ${route.map((n, i) => i < route.length - 1 ? line(n, route[i + 1]) : '').join('')}
          </div>
          <div class="info-box">Memoriza la ruta resaltada: <strong>${route.map(n => n.id).join(' → ')}</strong>. <span id="cd">5s</span></div>
        </div>`;
      let remaining = 5;
      const cd = container.querySelector('#cd');
      const h = setInterval(() => {
        remaining--; if (cd) cd.textContent = `${remaining}s`;
        if (remaining <= 0) { clearInterval(h); recall(); }
      }, 1000);

      function line(a, b) {
        const x1 = a.x, y1 = a.y, x2 = b.x, y2 = b.y;
        const len = Math.hypot(x2 - x1, y2 - y1);
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        return `<div style="position:absolute; left:${x1}%; top:${y1}%; width:${len}%; height:2px; background:var(--phosphor); transform-origin:0 0; transform:rotate(${angle}deg);"></div>`;
      }

      function recall() {
        container.innerHTML = `
          <div class="exercise-shell">
            <div class="stimulus-stage stage-light" id="stage2">
              ${nodes.map(n => `<div style="position:absolute; left:${n.x}%; top:${n.y}%; transform:translate(-50%,-50%); width:34px; height:34px; border-radius:50%; background:#ddd; border:2px solid #888; display:flex; align-items:center; justify-content:center; font-family:var(--font-display); color:#333;">${n.id}</div>`).join('')}
            </div>
            <p class="stage-instructions" style="position:static;color:var(--text-mid);text-align:center;">Reconstruye la ruta escribiendo los nodos en orden, separados por espacios (ej: A B C).</p>
            <div class="field"><input type="text" id="route-input" placeholder="A B C"></div>
            <button class="btn btn-primary" id="btn-check-route">Comprobar</button>
          </div>`;
        container.querySelector('#btn-check-route').addEventListener('click', () => {
          const answer = container.querySelector('#route-input').value.trim().toUpperCase().split(/\s+/);
          const correctSeq = route.map(n => n.id);
          let correctSteps = 0;
          for (let i = 0; i < correctSeq.length; i++) if (answer[i] === correctSeq[i]) correctSteps++;
          const accuracy = Metrics.accuracyPct(correctSteps, correctSeq.length);
          App.recordSessionResult({ moduleId: meta.id, moduleName: 'Orientación espacial (ruta)', accuracy, level: null });
          Metrics.renderResultPanel(container, {
            items: [
              { label: 'Ruta correcta', value: correctSeq.join(' → ') },
              { label: 'Pasos correctos en orden', value: `${correctSteps} / ${correctSeq.length}` },
              { label: 'Precisión', value: Metrics.fmtPct(accuracy) }
            ],
            onRetry: runMapExercise, onExit: () => App.showModulePanel()
          });
        });
      }
    }

    /* ============ ROTACIÓN MENTAL ============ */
    function runRotationExercise() {
      let trial = 0; const MAX_TRIALS = 8;
      let correct = 0;
      renderTrial();

      function renderTrial() {
        const baseRotation = Math.floor(Math.random() * 4) * 90;
        const matchIndex = Math.floor(Math.random() * 3);
        const rotations = [0, 1, 2].map(i => i === matchIndex ? baseRotation : (baseRotation + 90 + Math.floor(Math.random() * 2) * 90) % 360);
        // figura asimétrica simple (letra F) para que la rotación sea detectable
        const shapeSVG = (rot) => `<svg width="70" height="70" viewBox="0 0 70 70" style="transform:rotate(${rot}deg);">
          <rect x="18" y="10" width="10" height="50" fill="#0a0d0e"/>
          <rect x="18" y="10" width="34" height="10" fill="#0a0d0e"/>
          <rect x="18" y="30" width="26" height="10" fill="#0a0d0e"/>
        </svg>`;

        container.innerHTML = `
          <div class="exercise-shell">
            <div class="exercise-topbar">
              <span class="exercise-title">Orientación espacial · Rotación mental</span>
              <div class="exercise-hud"><span class="hud-item">Ensayo <b>${trial + 1}</b>/${MAX_TRIALS}</span></div>
            </div>
            <div class="stimulus-stage stage-light">
              <div style="text-align:center;">
                <p style="color:#555;font-family:var(--font-data);font-size:12px;">Figura de referencia</p>
                ${shapeSVG(baseRotation)}
              </div>
            </div>
            <p class="stage-instructions" style="position:static;color:var(--text-mid);text-align:center;margin-top:10px;">¿Cuál de estas opciones es la MISMA figura, solo rotada (no reflejada)?</p>
            <div class="swatch-row">
              ${rotations.map((r, i) => `<button data-idx="${i}" style="background:#fdfdfb;border:1px solid #ccc;border-radius:6px;padding:10px;cursor:pointer;">${shapeSVG(r)}</button>`).join('')}
            </div>
          </div>`;
        container.querySelectorAll('[data-idx]').forEach(btn => btn.addEventListener('click', () => {
          if (Number(btn.dataset.idx) === matchIndex) correct++;
          trial++;
          trial >= MAX_TRIALS ? finish() : renderTrial();
        }));
      }
      function finish() {
        const accuracy = Metrics.accuracyPct(correct, MAX_TRIALS);
        App.recordSessionResult({ moduleId: meta.id, moduleName: 'Orientación espacial (rotación)', accuracy, level: null });
        Metrics.renderResultPanel(container, {
          items: [{ label: 'Aciertos', value: `${correct} / ${MAX_TRIALS}` }, { label: 'Precisión', value: Metrics.fmtPct(accuracy) }],
          onRetry: runRotationExercise, onExit: () => App.showModulePanel()
        });
      }
    }
  }

  return { meta, start };
})();
