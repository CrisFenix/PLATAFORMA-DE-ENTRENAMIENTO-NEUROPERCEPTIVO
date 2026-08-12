/**
 * audition.js — MÓDULO 5: AUDICIÓN
 * Usa AudioEngine (audio.js) para generar los estímulos sonoros.
 * Cuatro subpruebas: frecuencia, intensidad, localización estéreo,
 * separación de fuentes sonoras.
 */
const AuditionModule = (() => {

  const meta = {
    id: 'audition',
    name: 'Audición',
    description: 'Discriminación de frecuencia, intensidad, localización estéreo y separación de fuentes sonoras.',
    status: AudioEngine.isSupported ? 'disponible' : 'limitado',
    difficulty: 'Variable'
  };

  const SUBTESTS = [
    { id: 'frequency', label: '9.1 Discriminación de frecuencia' },
    { id: 'intensity', label: '9.2 Discriminación de intensidad' },
    { id: 'localization', label: '9.3 Localización sonora' },
    { id: 'separation', label: '9.4 Separación de sonidos' }
  ];

  function start(container) {
    if (!AudioEngine.isSupported) {
      container.innerHTML = `
        <div class="notice"><strong>Web Audio API no disponible en este navegador.</strong> Este módulo requiere reproducción de tonos generados por software y no puede ejecutarse en este dispositivo/navegador.</div>
        <button class="btn btn-ghost" id="btn-exit">Volver</button>`;
      container.querySelector('#btn-exit').addEventListener('click', () => App.showModulePanel());
      return;
    }
    renderMenu();

    function renderMenu() {
      container.innerHTML = `
        <div class="exercise-shell">
          <div class="instructions-panel">
            <h2>Audición — selección de subprueba</h2>
            <p>Usa auriculares si es posible, especialmente para la prueba de localización sonora, que depende de un canal estéreo real.</p>
            <div class="difficulty-select">${SUBTESTS.map(s => `<button data-sub="${s.id}">${s.label}</button>`).join('')}</div>
            <button class="btn btn-ghost" id="btn-exit">Volver al panel</button>
          </div>
        </div>`;
      container.querySelectorAll('[data-sub]').forEach(btn => btn.addEventListener('click', () => {
        if (Calibration.needsCalibration('audio')) {
          Calibration.run(container, 'audio', () => runSubtest(btn.dataset.sub));
        } else runSubtest(btn.dataset.sub);
      }));
      container.querySelector('#btn-exit').addEventListener('click', () => App.showModulePanel());
    }

    function runSubtest(id) {
      ({ frequency, intensity, localization, separation }[id])(container, renderMenu);
    }

    function shell(title, trial, max, body) {
      return `<div class="exercise-shell">
        <div class="exercise-topbar">
          <span class="exercise-title">Audición · ${title}</span>
          <div class="exercise-hud"><span class="hud-item">Ensayo <b>${trial + 1}</b>/${max}</span></div>
          <button class="btn btn-ghost exercise-exit" id="btn-exit-sub">Salir</button>
        </div>${body}</div>`;
    }
    function bindExit(container) {
      container.querySelector('#btn-exit-sub').addEventListener('click', () => App.showModulePanel());
    }

    /* ================= 9.1 FRECUENCIA ================= */
    function frequency(container, back) {
      let deltaHz = 30;
      let trial = 0; const MAX_TRIALS = 10;
      let correct = 0, minDelta = null;
      renderTrial();
      function renderTrial() {
        const base = 400 + Math.random() * 300;
        const oddIndex = Math.floor(Math.random() * 3);
        const tones = [0, 1, 2].map(i => i === oddIndex ? base + deltaHz : base);
        container.innerHTML = shell('9.1 Discriminación de frecuencia', trial, MAX_TRIALS, `
          <div class="guided-panel">
            <p>Reproduce los tres tonos y elige cuál percibes distinto.</p>
            <div class="difficulty-select">
              ${tones.map((_, i) => `<button data-play="${i}">▶ Tono ${i + 1}</button>`).join('')}
            </div>
            <div class="option-grid" style="max-width:340px;">
              ${tones.map((_, i) => `<button data-guess="${i}">Elegir tono ${i + 1}</button>`).join('')}
            </div>
          </div>`);
        bindExit(container);
        container.querySelectorAll('[data-play]').forEach(btn => btn.addEventListener('click', () => {
          AudioEngine.playTone({ freq: tones[Number(btn.dataset.play)], durationMs: 500, volume: 0.3 });
        }));
        container.querySelectorAll('[data-guess]').forEach(btn => btn.addEventListener('click', () => {
          const isCorrect = Number(btn.dataset.guess) === oddIndex;
          if (isCorrect) { correct++; minDelta = deltaHz; deltaHz = Math.max(2, deltaHz - 3); }
          else deltaHz = Math.min(40, deltaHz + 4);
          trial++;
          trial >= MAX_TRIALS ? finish() : renderTrial();
        }));
      }
      function finish() {
        const accuracy = Metrics.accuracyPct(correct, MAX_TRIALS);
        App.recordSessionResult({ moduleId: 'audition', moduleName: 'Audición · Frecuencia', accuracy, level: null });
        Metrics.renderResultPanel(container, {
          items: [
            { label: 'Aciertos', value: `${correct} / ${MAX_TRIALS}` },
            { label: 'Diferencia mínima discriminada', value: minDelta !== null ? `≈${Math.round(minDelta)} Hz` : '—' }
          ], onRetry: () => runSubtest('frequency'), onExit: back
        });
      }
    }

    /* ================= 9.2 INTENSIDAD ================= */
    function intensity(container, back) {
      let deltaVol = 0.22;
      let trial = 0; const MAX_TRIALS = 10;
      let correct = 0, minDelta = null;
      renderTrial();
      function renderTrial() {
        const base = 0.25;
        const highIndex = Math.floor(Math.random() * 2);
        const vols = [0, 1].map(i => i === highIndex ? base + deltaVol : base);
        container.innerHTML = shell('9.2 Discriminación de intensidad', trial, MAX_TRIALS, `
          <div class="guided-panel">
            <p>Escucha ambos sonidos y elige cuál percibes más intenso (más alto en volumen).</p>
            <div class="difficulty-select">
              <button data-play="0">▶ Sonido A</button><button data-play="1">▶ Sonido B</button>
            </div>
            <div class="option-grid" style="max-width:260px;">
              <button data-guess="0">A es más intenso</button><button data-guess="1">B es más intenso</button>
            </div>
          </div>`);
        bindExit(container);
        container.querySelectorAll('[data-play]').forEach(btn => btn.addEventListener('click', () => {
          AudioEngine.playTone({ freq: 500, durationMs: 500, volume: vols[Number(btn.dataset.play)] });
        }));
        container.querySelectorAll('[data-guess]').forEach(btn => btn.addEventListener('click', () => {
          const isCorrect = Number(btn.dataset.guess) === highIndex;
          if (isCorrect) { correct++; minDelta = deltaVol; deltaVol = Math.max(0.02, deltaVol - 0.03); }
          else deltaVol = Math.min(0.3, deltaVol + 0.03);
          trial++;
          trial >= MAX_TRIALS ? finish() : renderTrial();
        }));
      }
      function finish() {
        const accuracy = Metrics.accuracyPct(correct, MAX_TRIALS);
        App.recordSessionResult({ moduleId: 'audition', moduleName: 'Audición · Intensidad', accuracy, level: null });
        Metrics.renderResultPanel(container, {
          items: [
            { label: 'Aciertos', value: `${correct} / ${MAX_TRIALS}` },
            { label: 'Diferencia mínima discriminada', value: minDelta !== null ? `≈${Math.round(minDelta * 100)}% de ganancia` : '—' }
          ], onRetry: () => runSubtest('intensity'), onExit: back
        });
      }
    }

    /* ================= 9.3 LOCALIZACIÓN SONORA ================= */
    function localization(container, back) {
      let trial = 0; const MAX_TRIALS = 10;
      let correct = 0;
      renderTrial();
      function renderTrial() {
        const options = [-0.85, 0, 0.85];
        const idx = Math.floor(Math.random() * 3);
        const pan = options[idx];
        container.innerHTML = shell('9.3 Localización sonora', trial, MAX_TRIALS, `
          <div class="notice">La percepción de dirección aquí se basa en paneo estéreo simple, no en un modelo binaural realista; no reproduce localización espacial real con precisión.</div>
          <div class="guided-panel">
            <p>Reproduce el sonido y elige de dónde parece provenir (usa auriculares si puedes).</p>
            <button class="btn btn-primary" id="btn-play-loc">▶ Reproducir</button>
            <div class="option-grid" style="max-width:340px;">
              <button data-guess="0">Izquierda</button><button data-guess="1">Centro</button><button data-guess="2">Derecha</button>
            </div>
          </div>`);
        bindExit(container);
        container.querySelector('#btn-play-loc').addEventListener('click', () => {
          AudioEngine.playTone({ freq: 500, durationMs: 700, volume: 0.35, pan });
        });
        container.querySelectorAll('[data-guess]').forEach(btn => btn.addEventListener('click', () => {
          if (Number(btn.dataset.guess) === idx) correct++;
          trial++;
          trial >= MAX_TRIALS ? finish() : renderTrial();
        }));
      }
      function finish() {
        const accuracy = Metrics.accuracyPct(correct, MAX_TRIALS);
        App.recordSessionResult({ moduleId: 'audition', moduleName: 'Audición · Localización', accuracy, level: null });
        Metrics.renderResultPanel(container, {
          items: [{ label: 'Aciertos', value: `${correct} / ${MAX_TRIALS}` }, { label: 'Precisión', value: Metrics.fmtPct(accuracy) }],
          onRetry: () => runSubtest('localization'), onExit: back
        });
      }
    }

    /* ================= 9.4 SEPARACIÓN DE SONIDOS ================= */
    function separation(container, back) {
      let noiseVol = 0.03;
      let trial = 0; const MAX_TRIALS = 8;
      let correct = 0, maxNoiseHandled = 0;
      renderTrial();
      function renderTrial() {
        const targetFreq = 600 + Math.random() * 200;
        const otherFreq = 300 + Math.random() * 150;
        const targetFirst = Math.random() < 0.5;
        container.innerHTML = shell('9.4 Separación de sonidos', trial, MAX_TRIALS, `
          <div class="guided-panel">
            <p>Se reproducirán dos tonos simultáneos junto con ruido de fondo. Identifica si el tono AGUDO sonó en el canal IZQUIERDO o DERECHO.</p>
            <button class="btn btn-primary" id="btn-play-sep">▶ Reproducir mezcla</button>
            <div class="option-grid" style="max-width:260px;">
              <button data-guess="left">Agudo a la izquierda</button><button data-guess="right">Agudo a la derecha</button>
            </div>
          </div>`);
        bindExit(container);
        const highOnLeft = Math.random() < 0.5;
        container.querySelector('#btn-play-sep').addEventListener('click', () => {
          const noise = AudioEngine.createNoiseSource(noiseVol);
          if (noise) noise.start();
          AudioEngine.playDualTone({
            freqA: highOnLeft ? targetFreq : otherFreq,
            freqB: highOnLeft ? otherFreq : targetFreq,
            panA: -0.8, panB: 0.8, durationMs: 1300
          });
          if (noise) setTimeout(() => noise.stop(), 1400);
        });
        container.querySelectorAll('[data-guess]').forEach(btn => btn.addEventListener('click', () => {
          const guessLeft = btn.dataset.guess === 'left';
          const isCorrect = guessLeft === highOnLeft;
          if (isCorrect) { correct++; maxNoiseHandled = Math.max(maxNoiseHandled, noiseVol); noiseVol = Math.min(0.25, noiseVol + 0.025); }
          else noiseVol = Math.max(0.01, noiseVol - 0.02);
          trial++;
          trial >= MAX_TRIALS ? finish() : renderTrial();
        }));
      }
      function finish() {
        const accuracy = Metrics.accuracyPct(correct, MAX_TRIALS);
        App.recordSessionResult({ moduleId: 'audition', moduleName: 'Audición · Separación de fuentes', accuracy, level: null });
        Metrics.renderResultPanel(container, {
          items: [
            { label: 'Aciertos', value: `${correct} / ${MAX_TRIALS}` },
            { label: 'Nivel de ruido máx. tolerado', value: maxNoiseHandled ? `${Math.round(maxNoiseHandled * 100)}%` : '—' }
          ], onRetry: () => runSubtest('separation'), onExit: back
        });
      }
    }
  }

  return { meta, start };
})();
