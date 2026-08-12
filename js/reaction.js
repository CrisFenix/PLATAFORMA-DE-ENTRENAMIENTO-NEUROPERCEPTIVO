/**
 * reaction.js — MÓDULO 4: TIEMPO DE REACCIÓN
 * Tres submodalidades: visual, auditiva y con distractores (falsos positivos).
 */
const ReactionModule = (() => {

  const meta = {
    id: 'reaction',
    name: 'Tiempo de reacción',
    description: 'Pruebas de reacción visual, auditiva y con distractores.',
    status: 'disponible',
    difficulty: 'Adaptativo'
  };

  const TRIALS = 12;

  function start(container) {
    renderMenu();

    function renderMenu() {
      container.innerHTML = `
        <div class="exercise-shell">
          <div class="instructions-panel">
            <h2>Tiempo de reacción</h2>
            <p>Elige la submodalidad.</p>
            <div class="difficulty-select">
              <button class="btn btn-primary" id="btn-visual">Reacción visual</button>
              <button class="btn btn-primary" id="btn-audio">Reacción auditiva</button>
              <button class="btn btn-primary" id="btn-distract">Con distractores</button>
            </div>
            <button class="btn btn-ghost" id="btn-exit">Volver</button>
          </div>
        </div>`;
      container.querySelector('#btn-visual').addEventListener('click', () => runTrials('visual'));
      container.querySelector('#btn-audio').addEventListener('click', () => runTrials('audio'));
      container.querySelector('#btn-distract').addEventListener('click', () => runTrials('distract'));
      container.querySelector('#btn-exit').addEventListener('click', () => App.showModulePanel());
    }

    function runTrials(kind) {
      const times = [];
      let errors = 0;       // pulsó antes de tiempo
      let falsePositives = 0; // pulsó ante distractor
      let trial = 0;

      renderShell();
      nextTrial();

      function renderShell() {
        container.innerHTML = `
          <div class="exercise-shell">
            <div class="exercise-topbar">
              <span class="exercise-title">${labelFor(kind)}</span>
              <div class="exercise-hud">
                <span class="hud-item">Ensayo <b id="hud-trial">1</b>/${TRIALS}</span>
              </div>
              <button class="btn btn-ghost exercise-exit" id="btn-exit">Salir</button>
            </div>
            <div class="stimulus-stage" id="stage" tabindex="0">
              <p class="stage-instructions" id="stage-msg">Prepárate…</p>
              <button class="big-tap-zone" id="tap-zone" aria-label="Zona de respuesta"></button>
            </div>
          </div>`;
        container.querySelector('#btn-exit').addEventListener('click', () => App.showModulePanel());
        container.querySelector('#tap-zone').addEventListener('click', handleTap);
        window.addEventListener('keydown', spaceHandler);
      }

      function spaceHandler(e) { if (e.code === 'Space') { e.preventDefault(); handleTap(); } }

      let stimulusShownAt = null;
      let waitingForStimulus = false;
      let isDistractorTrial = false;

      function labelFor(k) {
        return { visual: 'Reacción visual', audio: 'Reacción auditiva', distract: 'Reacción con distractores' }[k];
      }

      function nextTrial() {
        if (trial >= TRIALS) return finish();
        document.getElementById('hud-trial') && (document.getElementById('hud-trial').textContent = trial + 1);
        const stage = document.getElementById('stage');
        const msg = document.getElementById('stage-msg');
        stage.style.background = '#000';
        msg.textContent = 'Prepárate…';
        waitingForStimulus = false;
        isDistractorTrial = kind === 'distract' && Math.random() < 0.3;

        const delay = 1200 + Math.random() * 2200;
        setTimeout(() => {
          if (isDistractorTrial) {
            // distractor: cambia color pero NO requiere respuesta
            stage.style.background = '#2a1c1c';
            msg.textContent = 'Distractor — NO respondas';
            stimulusShownAt = null;
            waitingForStimulus = false;
            setTimeout(() => { trial++; nextTrial(); }, 900);
            return;
          }
          waitingForStimulus = true;
          stimulusShownAt = Metrics.now();
          if (kind === 'audio') {
            msg.textContent = '';
            stage.style.background = '#000';
            AudioEngine.playTone({ freq: 700, durationMs: 250, volume: 0.35 });
          } else {
            stage.style.background = 'var(--phosphor-dim)';
            msg.textContent = '¡RESPONDE AHORA!';
          }
        }, delay);
      }

      function handleTap() {
        if (isDistractorTrial) {
          falsePositives++;
          trial++;
          setTimeout(nextTrial, 200);
          return;
        }
        if (!waitingForStimulus) {
          errors++; // respuesta anticipada
          trial++;
          setTimeout(nextTrial, 200);
          return;
        }
        const rt = Metrics.now() - stimulusShownAt;
        times.push(rt);
        waitingForStimulus = false;
        trial++;
        setTimeout(nextTrial, 250);
      }

      function finish() {
        window.removeEventListener('keydown', spaceHandler);
        const m = Metrics.mean(times);
        const md = Metrics.median(times);
        const sd = Metrics.stddev(times);
        const best = times.length ? Math.min(...times) : null;
        const worst = times.length ? Math.max(...times) : null;

        App.recordSessionResult({
          moduleId: meta.id, moduleName: labelFor(kind),
          accuracy: Metrics.accuracyPct(times.length, TRIALS - (kind === 'distract' ? 0 : 0)),
          level: null, reactionMean: m
        });

        Metrics.renderResultPanel(container, {
          items: [
            { label: 'Tiempo medio', value: Metrics.fmtMs(m) },
            { label: 'Mediana', value: Metrics.fmtMs(md) },
            { label: 'Mejor tiempo', value: Metrics.fmtMs(best) },
            { label: 'Peor tiempo', value: Metrics.fmtMs(worst) },
            { label: 'Desviación estándar', value: Metrics.fmtMs(sd) },
            { label: 'Errores (anticipación)', value: errors },
            ...(kind === 'distract' ? [{ label: 'Falsos positivos', value: falsePositives }] : [])
          ],
          onRetry: () => runTrials(kind),
          onExit: () => App.showModulePanel()
        });
      }
    }
  }

  return { meta, start };
})();
