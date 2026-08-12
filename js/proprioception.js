/**
 * proprioception.js — MÓDULO 8: PROPIOCEPCIÓN
 * Ejercicios guiados por temporizador y autoevaluación subjetiva. El
 * navegador no puede medir postura o movimiento sin sensores externos,
 * así que la app estructura la prueba y registra la autoevaluación
 * del usuario.
 */
const ProprioceptionModule = (() => {

  const meta = {
    id: 'proprioception',
    name: 'Propiocepción',
    description: 'Ejercicios guiados de posición y movimiento con autoevaluación, siempre en modalidad segura.',
    status: 'disponible',
    difficulty: 'Guiado'
  };

  function start(container) {
    container.innerHTML = `
      <div class="exercise-shell">
        <div class="notice"><strong>Seguridad:</strong> realiza estos ejercicios sentado o cerca de una superficie estable. Si el ejercicio implica cerrar los ojos, hazlo solo en una posición segura.</div>
        <div class="instructions-panel">
          <h2>Ejercicio</h2>
          <div class="difficulty-select">
            <button data-ex="A">A · Reposicionamiento con ojos cerrados</button>
            <button data-ex="B">B · Movimiento lento controlado</button>
          </div>
          <button class="btn btn-ghost" id="btn-exit">Volver</button>
        </div>
      </div>`;
    container.querySelector('#btn-exit').addEventListener('click', () => App.showModulePanel());
    container.querySelectorAll('[data-ex]').forEach(btn => btn.addEventListener('click', () => {
      btn.dataset.ex === 'A' ? exerciseA() : exerciseB();
    }));

    function exerciseA() {
      container.innerHTML = `
        <div class="exercise-shell">
          <div class="guided-panel">
            <h2>Ejercicio A — Reposicionamiento</h2>
            <ol>
              <li>Siéntate cómodamente con los ojos abiertos. Levanta un brazo y colócalo en una posición concreta (por ejemplo, extendido al frente a la altura del hombro).</li>
              <li>Baja el brazo. Cierra los ojos.</li>
              <li>Intenta devolver el brazo exactamente a la misma posición, guiándote solo por la sensación corporal.</li>
              <li>Abre los ojos y compara.</li>
            </ol>
            <button class="btn btn-primary" id="btn-timer-a">Iniciar temporizador (20s por intento)</button>
            <div id="timer-a" class="field-hint" style="margin-top:10px;"></div>
          </div>
        </div>`;
      const label = container.querySelector('#timer-a');
      container.querySelector('#btn-timer-a').addEventListener('click', () => {
        Metrics.createCountdown({
          seconds: 20,
          onTick: (r) => label.textContent = r > 0 ? `Tiempo restante: ${r}s` : '',
          onComplete: () => renderSelfReport('A')
        }).start();
      });
    }

    function exerciseB() {
      container.innerHTML = `
        <div class="exercise-shell">
          <div class="guided-panel">
            <h2>Ejercicio B — Movimiento lento controlado</h2>
            <p>Sentado, traza con la mano un círculo lento e imaginario en el aire frente a ti, intentando mantener velocidad y trayectoria constantes durante 20 segundos, sin mirar la mano si te sientes seguro haciéndolo.</p>
            <button class="btn btn-primary" id="btn-timer-b">Iniciar temporizador</button>
            <div id="timer-b" class="field-hint" style="margin-top:10px;"></div>
          </div>
        </div>`;
      const label = container.querySelector('#timer-b');
      container.querySelector('#btn-timer-b').addEventListener('click', () => {
        Metrics.createCountdown({
          seconds: 20,
          onTick: (r) => label.textContent = r > 0 ? `Tiempo restante: ${r}s` : '',
          onComplete: () => renderSelfReport('B')
        }).start();
      });
    }

    function renderSelfReport(exercise) {
      container.innerHTML = `
        <div class="exercise-shell">
          <div class="instructions-panel">
            <h2>Autoevaluación</h2>
            <p>Valora tu propia percepción del ejercicio (esto es subjetivo, no una medición objetiva del sistema).</p>
            <div class="field">
              <label>Precisión percibida</label>
              <input type="range" id="rp-precision" min="0" max="100" value="60">
            </div>
            <div class="field">
              <label>Estabilidad percibida</label>
              <input type="range" id="rp-stability" min="0" max="100" value="60">
            </div>
            <button class="btn btn-primary" id="btn-submit-prop">Guardar</button>
          </div>
        </div>`;
      container.querySelector('#btn-submit-prop').addEventListener('click', () => {
        const precision = Number(container.querySelector('#rp-precision').value);
        const stability = Number(container.querySelector('#rp-stability').value);
        const accuracy = (precision + stability) / 2;
        App.recordSessionResult({ moduleId: meta.id, moduleName: `Propiocepción (ejercicio ${exercise})`, accuracy, level: null });
        Metrics.renderResultPanel(container, {
          items: [
            { label: 'Precisión subjetiva', value: `${precision}/100` },
            { label: 'Estabilidad subjetiva', value: `${stability}/100` }
          ],
          onRetry: () => start(container),
          onExit: () => App.showModulePanel()
        });
      });
    }
  }

  return { meta, start };
})();
