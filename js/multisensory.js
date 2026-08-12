/**
 * multisensory.js — MÓDULO 10: INTEGRACIÓN MULTISENSORIAL
 * Combina estímulo visual (posición izquierda/derecha) con estímulo
 * auditivo (canal estéreo izquierdo/derecho). El usuario debe indicar
 * si ambos estímulos son congruentes (mismo lado) o incongruentes.
 */
const MultisensoryModule = (() => {

  const meta = {
    id: 'multisensory',
    name: 'Integración multisensorial',
    description: 'Congruencia entre estímulos visuales y auditivos simultáneos, con dificultad creciente.',
    status: AudioEngine.isSupported ? 'disponible' : 'limitado',
    difficulty: 'Adaptativo'
  };

  function start(container) {
    if (!AudioEngine.isSupported) {
      container.innerHTML = `<div class="notice">Este módulo requiere Web Audio API, no disponible en este navegador.</div>
        <button class="btn btn-ghost" id="btn-exit">Volver</button>`;
      container.querySelector('#btn-exit').addEventListener('click', () => App.showModulePanel());
      return;
    }

    let level = 1;
    let trial = 0;
    const MAX_TRIALS = 12;
    let correct = 0, errors = 0;
    const reactionTimes = [];

    renderTrial();

    function incongruenceRate(lvl) {
      return { 1: 0.35, 2: 0.4, 3: 0.45, 4: 0.5, 5: 0.5 }[lvl];
    }
    function exposureMs(lvl) {
      return { 1: 1400, 2: 1100, 3: 900, 4: 700, 5: 550 }[lvl];
    }

    function renderTrial() {
      const visualLeft = Math.random() < 0.5;
      const incongruent = Math.random() < incongruenceRate(level);
      const audioLeft = incongruent ? !visualLeft : visualLeft;

      container.innerHTML = `
        <div class="exercise-shell">
          <div class="exercise-topbar">
            <span class="exercise-title">Integración multisensorial — Nivel ${level}</span>
            <div class="exercise-hud"><span class="hud-item">Ensayo <b>${trial + 1}</b>/${MAX_TRIALS}</span></div>
            <button class="btn btn-ghost exercise-exit" id="btn-exit-sub">Salir</button>
          </div>
          <div class="stimulus-stage" id="stage">
            <div id="v-stim" style="position:absolute; top:50%; left:${visualLeft ? 20 : 80}%; width:26px; height:26px; border-radius:50%; background:var(--phosphor); transform:translate(-50%,-50%); box-shadow:0 0 10px var(--phosphor); display:none;"></div>
            <p class="stage-instructions">Pulsa el botón según percibas si el sonido y la luz vienen del MISMO lado o de lados DISTINTOS.</p>
          </div>
          <div class="difficulty-select" style="justify-content:center;">
            <button id="btn-congruent">Mismo lado</button>
            <button id="btn-incongruent">Lados distintos</button>
          </div>
        </div>`;
      container.querySelector('#btn-exit-sub').addEventListener('click', () => App.showModulePanel());

      const vStim = container.querySelector('#v-stim');
      const shownAt = Metrics.now();
      vStim.style.display = 'block';
      AudioEngine.playTone({ freq: 500, durationMs: exposureMs(level), volume: 0.3, pan: audioLeft ? -0.8 : 0.8 });
      setTimeout(() => { vStim.style.display = 'none'; }, exposureMs(level));

      let responded = false;
      container.querySelector('#btn-congruent').addEventListener('click', () => answer(false));
      container.querySelector('#btn-incongruent').addEventListener('click', () => answer(true));

      function answer(guessedIncongruent) {
        if (responded) return;
        responded = true;
        const rt = Metrics.now() - shownAt;
        const isCorrect = guessedIncongruent === incongruent;
        if (isCorrect) { correct++; reactionTimes.push(rt); } else errors++;
        trial++;
        if (trial >= MAX_TRIALS) finish(); else setTimeout(renderTrial, 400);
      }
    }

    function finish() {
      const accuracy = Metrics.accuracyPct(correct, MAX_TRIALS);
      const newLevel = Metrics.adaptDifficulty(level, accuracy);
      App.recordSessionResult({ moduleId: meta.id, moduleName: 'Integración multisensorial', accuracy, level: newLevel });
      Metrics.renderResultPanel(container, {
        items: [
          { label: 'Precisión de detección de incongruencias', value: Metrics.fmtPct(accuracy) },
          { label: 'Aciertos', value: `${correct} / ${MAX_TRIALS}` },
          { label: 'Errores', value: errors },
          { label: 'Tiempo medio de reacción', value: Metrics.fmtMs(Metrics.mean(reactionTimes)) },
          { label: 'Nivel alcanzado', value: `${newLevel} · ${Metrics.levelName(newLevel)}` }
        ],
        onRetry: () => start(container),
        onExit: () => App.showModulePanel()
      });
    }
  }

  return { meta, start };
})();
