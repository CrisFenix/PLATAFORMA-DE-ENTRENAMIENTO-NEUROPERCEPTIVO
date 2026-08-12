/**
 * attention.js — MÓDULO 1: ATENCIÓN SOSTENIDA
 * Tarea de ejecución continua (estilo CPT): se muestran estímulos
 * neutros y, ocasionalmente, un estímulo objetivo al que el usuario
 * debe responder. Mide aciertos, errores, falsos positivos y tiempo
 * de reacción.
 */
const AttentionModule = (() => {

  const meta = {
    id: 'attention',
    name: 'Atención sostenida',
    description: 'Mantén el foco sobre un flujo de estímulos y detecta el objetivo cuando aparezca.',
    status: 'disponible',
    difficulty: 'Adaptativo'
  };

  const NEUTRAL_SHAPES = ['■', '▲', '●', '◆'];
  const TARGET_SHAPE = '★';

  function start(container, opts = {}) {
    const mode = opts.mode || 'entrenamiento'; // 'corto' | 'entrenamiento'
    const durationSec = mode === 'corto' ? 45 : 120;
    let level = opts.level || 2;

    const state = {
      running: false,
      hits: 0, misses: 0, falsePositives: 0,
      reactionTimes: [],
      stimulusIsTarget: false,
      stimulusShownAt: 0,
      responded: false,
      totalStimuli: 0,
      timerHandle: null,
      stimHandle: null
    };

    function speedForLevel(lvl) {
      // ms entre estímulos: más rápido = más difícil
      return { 1: 1600, 2: 1300, 3: 1000, 4: 800, 5: 600 }[lvl];
    }
    function exposureForLevel(lvl) {
      // ms que el estímulo permanece visible
      return { 1: 900, 2: 750, 3: 600, 4: 480, 5: 380 }[lvl];
    }
    function targetProbability(lvl) {
      return 0.22; // constante: la dificultad se ajusta por velocidad/exposición
    }

    render();

    function render() {
      container.innerHTML = `
        <div class="exercise-shell">
          <div class="exercise-topbar">
            <span class="exercise-title">Atención sostenida — Nivel ${level} (${Metrics.levelName(level)})</span>
            <div class="exercise-hud">
              <span class="hud-item">Tiempo <b id="hud-time">${durationSec}s</b></span>
              <span class="hud-item">Aciertos <b id="hud-hits">0</b></span>
              <span class="hud-item">Errores <b id="hud-miss">0</b></span>
              <span class="hud-item">Falsos+ <b id="hud-fp">0</b></span>
            </div>
            <button class="btn btn-ghost exercise-exit" id="btn-exit">Salir</button>
          </div>
          <div class="stimulus-stage" id="stage" tabindex="0">
            <div class="fixation-point" id="fixation" style="display:none;"></div>
            <span id="stim-glyph" style="font-size:64px;color:#e7f1ee;display:none;"></span>
            <p class="stage-instructions">Pulsa la pantalla o la BARRA ESPACIADORA solo cuando veas <strong>★</strong>. Ignora el resto de formas.</p>
          </div>
          <div class="info-box">Modo: ${mode === 'corto' ? 'prueba corta (45s)' : 'entrenamiento (120s)'}. La dificultad aumenta la velocidad y reduce el tiempo de exposición del estímulo.</div>
        </div>`;

      document.getElementById('btn-exit').addEventListener('click', () => App.showModulePanel());
      const stage = document.getElementById('stage');
      stage.addEventListener('click', handleResponse);
      window.addEventListener('keydown', keyHandler);
      stage.focus();

      beginCountdown();
    }

    function keyHandler(e) {
      if (e.code === 'Space') { e.preventDefault(); handleResponse(); }
    }

    function beginCountdown() {
      state.running = true;
      let remaining = durationSec;
      state.timerHandle = setInterval(() => {
        remaining--;
        const el = document.getElementById('hud-time');
        if (el) el.textContent = `${remaining}s`;
        if (remaining <= 0) finish();
      }, 1000);
      scheduleNextStimulus();
    }

    function scheduleNextStimulus() {
      if (!state.running) return;
      const delay = speedForLevel(level) + Math.random() * 400;
      state.stimHandle = setTimeout(showStimulus, delay);
    }

    function showStimulus() {
      if (!state.running) return;
      const glyph = document.getElementById('stim-glyph');
      const isTarget = Math.random() < targetProbability(level);
      state.stimulusIsTarget = isTarget;
      state.responded = false;
      state.totalStimuli++;
      glyph.textContent = isTarget ? TARGET_SHAPE : NEUTRAL_SHAPES[Math.floor(Math.random() * NEUTRAL_SHAPES.length)];
      glyph.style.color = isTarget ? 'var(--phosphor)' : '#e7f1ee';
      glyph.style.display = 'block';
      state.stimulusShownAt = Metrics.now();

      const exposure = exposureForLevel(level);
      state.stimHandle = setTimeout(() => {
        glyph.style.display = 'none';
        if (isTarget && !state.responded) {
          state.misses++;
          updateHud();
        }
        scheduleNextStimulus();
      }, exposure);
    }

    function handleResponse() {
      if (!state.running || state.responded) return;
      state.responded = true;
      const rt = Metrics.now() - state.stimulusShownAt;
      if (state.stimulusIsTarget) {
        state.hits++;
        state.reactionTimes.push(rt);
      } else {
        state.falsePositives++;
      }
      updateHud();
    }

    function updateHud() {
      document.getElementById('hud-hits').textContent = state.hits;
      document.getElementById('hud-miss').textContent = state.misses;
      document.getElementById('hud-fp').textContent = state.falsePositives;
    }

    function finish() {
      state.running = false;
      clearInterval(state.timerHandle);
      clearTimeout(state.stimHandle);
      window.removeEventListener('keydown', keyHandler);

      const targetsShown = state.hits + state.misses;
      const accuracy = Metrics.accuracyPct(state.hits, targetsShown || 1);
      const newLevel = Metrics.adaptDifficulty(level, accuracy);

      const summary = {
        moduleId: meta.id, moduleName: meta.name,
        accuracy, level: newLevel,
        reactionMean: Metrics.mean(state.reactionTimes),
        hits: state.hits, misses: state.misses, falsePositives: state.falsePositives
      };
      App.recordSessionResult(summary);

      Metrics.renderResultPanel(container, {
        items: [
          { label: 'Precisión sobre objetivos', value: Metrics.fmtPct(accuracy) },
          { label: 'Tiempo medio de reacción', value: Metrics.fmtMs(summary.reactionMean) },
          { label: 'Aciertos', value: state.hits },
          { label: 'Omisiones (objetivo no detectado)', value: state.misses },
          { label: 'Falsos positivos', value: state.falsePositives },
          { label: 'Nivel alcanzado', value: `${newLevel} · ${Metrics.levelName(newLevel)}` }
        ],
        onRetry: () => start(container, { mode, level: newLevel }),
        onExit: () => App.showModulePanel()
      });
    }
  }

  return { meta, start };
})();
