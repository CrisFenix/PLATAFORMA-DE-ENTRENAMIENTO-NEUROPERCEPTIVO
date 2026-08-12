/**
 * calibration.js
 * Gestiona el perfil de calibración de la sesión: distancia aproximada,
 * tamaño de pantalla, orientación, brillo/contraste percibido, volumen
 * y condiciones de iluminación ambiental.
 *
 * El perfil se guarda únicamente en memoria (Calibration.profile) y se
 * consulta desde cada módulo antes de iniciar una prueba que lo requiera.
 * No se realiza ninguna medición física exacta: son auto-reportes guiados
 * por el usuario, y así se comunica explícitamente.
 */
const Calibration = (() => {

  const profile = {
    distanceCm: null,
    screenDiagonalIn: null,
    orientation: (screen.orientation && screen.orientation.type) || 'desconocida',
    brightness: 'media',
    contrastOk: null,
    volumeChecked: false,
    environment: 'interior con luz artificial',
    darkModePreferred: window.matchMedia('(prefers-color-scheme: dark)').matches,
    completedFor: new Set() // qué categorías de módulo ya calibraron ('vision','audio','general')
  };

  /**
   * Define qué pasos de calibración aplican según el tipo de módulo.
   */
  const STEP_SETS = {
    vision: ['distance', 'screen', 'brightness', 'environment'],
    audio: ['volume', 'environment'],
    general: ['environment']
  };

  function needsCalibration(category) {
    return !profile.completedFor.has(category);
  }

  /**
   * Renderiza el flujo de calibración dentro de `container` y llama a
   * onDone() cuando el usuario termina. Los pasos son deliberadamente
   * cortos: la app deja claro que los resultados variarán según el
   * dispositivo, no busca precisión de laboratorio real.
   */
  function run(container, category, onDone) {
    const steps = STEP_SETS[category] || STEP_SETS.general;
    let idx = 0;

    function renderProgress() {
      return `<div class="calibration-progress">${steps.map((_, i) =>
        `<span class="${i < idx ? 'done' : ''}"></span>`).join('')}</div>`;
    }

    function renderStep() {
      const step = steps[idx];
      container.innerHTML = `
        <div class="instructions-panel calibration-step">
          ${renderProgress()}
          <h2>Calibración · ${stepTitle(step)}</h2>
          ${stepBody(step)}
          <div class="lab-actions">
            <button class="btn btn-primary" id="cal-next">Continuar</button>
            <button class="btn btn-ghost" id="cal-skip">Omitir calibración</button>
          </div>
        </div>`;
      bindStep(step);
      container.querySelector('#cal-next').addEventListener('click', () => {
        collectStep(step, container);
        idx++;
        if (idx >= steps.length) {
          profile.completedFor.add(category);
          onDone(profile);
        } else {
          renderStep();
        }
      });
      container.querySelector('#cal-skip').addEventListener('click', () => {
        profile.completedFor.add(category);
        onDone(profile);
      });
    }

    renderStep();
  }

  function stepTitle(step) {
    return {
      distance: 'Distancia al dispositivo',
      screen: 'Tamaño de pantalla',
      brightness: 'Brillo y contraste',
      volume: 'Volumen',
      environment: 'Ambiente'
    }[step];
  }

  function stepBody(step) {
    switch (step) {
      case 'distance':
        return `
          <p>Siéntate en una posición cómoda, a la distancia a la que normalmente usas este dispositivo (aprox. brazo extendido en móvil/tablet, o distancia habitual de escritorio en ordenador).</p>
          <div class="field">
            <label for="cal-distance">Distancia aproximada (cm)</label>
            <input type="number" id="cal-distance" min="20" max="150" value="${profile.distanceCm || 50}">
            <span class="field-hint">Estimación aproximada. No es una medición de precisión clínica.</span>
          </div>`;
      case 'screen':
        return `
          <p>Indica el tamaño diagonal aproximado de tu pantalla. Esto ayuda a interpretar los resultados: el mismo estímulo ocupa un ángulo visual distinto según el tamaño de pantalla y la distancia.</p>
          <div class="field">
            <label for="cal-screen">Diagonal aproximada</label>
            <select id="cal-screen">
              <option value="6">Teléfono (≈6")</option>
              <option value="10">Tablet (≈10")</option>
              <option value="14">Portátil (≈14")</option>
              <option value="24">Monitor de escritorio (≈24")</option>
              <option value="32">Pantalla grande (≈32"+)</option>
            </select>
          </div>`;
      case 'brightness':
        return `
          <p>Ajusta el brillo de tu pantalla a un nivel cómodo para uso en interior. Los ejercicios de contraste y adaptación a baja luz son especialmente sensibles al brillo y color de tu pantalla concreta.</p>
          <div class="field">
            <label for="cal-brightness">Nivel de brillo actual</label>
            <select id="cal-brightness">
              <option value="baja">Baja</option>
              <option value="media" selected>Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <p class="field-hint">¿Puedes distinguir claramente estos dos tonos oscuros?</p>
          <div style="display:flex; gap:8px; margin:10px 0;">
            <div style="width:70px;height:44px;background:#111;border-radius:4px;"></div>
            <div style="width:70px;height:44px;background:#1c1c1c;border-radius:4px;"></div>
          </div>
          <div class="difficulty-select">
            <button type="button" data-contrast="si" class="cal-contrast-btn">Sí, los distingo</button>
            <button type="button" data-contrast="no" class="cal-contrast-btn">No los distingo bien</button>
          </div>`;
      case 'volume':
        return `
          <p>Vamos a reproducir un tono de referencia. Ajusta el volumen de tu dispositivo a un nivel audible y cómodo.</p>
          <button class="btn btn-ghost" id="cal-play-tone" type="button">▶ Reproducir tono de referencia</button>`;
      case 'environment':
        return `
          <p>Describe brevemente tu entorno actual. Ruido ambiental y luz externa afectan a pruebas auditivas y visuales.</p>
          <div class="field">
            <label for="cal-env">Entorno</label>
            <select id="cal-env">
              <option value="interior silencioso">Interior silencioso</option>
              <option value="interior con luz artificial" selected>Interior con luz artificial</option>
              <option value="interior ruidoso">Interior con ruido de fondo</option>
              <option value="exterior">Exterior / luz natural intensa</option>
            </select>
          </div>`;
      default: return '';
    }
  }

  function bindStep(step) {
    if (step === 'brightness') {
      document.querySelectorAll('.cal-contrast-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.cal-contrast-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          profile.contrastOk = btn.dataset.contrast === 'si';
        });
      });
    }
    if (step === 'volume') {
      const btn = document.getElementById('cal-play-tone');
      btn.addEventListener('click', () => {
        AudioEngine.playTone({ freq: 440, durationMs: 700, volume: 0.4 });
        profile.volumeChecked = true;
        btn.textContent = '✓ Tono reproducido';
      });
    }
  }

  function collectStep(step, container) {
    switch (step) {
      case 'distance':
        profile.distanceCm = Number(container.querySelector('#cal-distance').value) || profile.distanceCm;
        break;
      case 'screen':
        profile.screenDiagonalIn = Number(container.querySelector('#cal-screen').value);
        break;
      case 'brightness':
        profile.brightness = container.querySelector('#cal-brightness').value;
        break;
      case 'environment':
        profile.environment = container.querySelector('#cal-env').value;
        break;
    }
  }

  function summaryText() {
    const parts = [];
    if (profile.distanceCm) parts.push(`distancia ≈${profile.distanceCm}cm`);
    if (profile.screenDiagonalIn) parts.push(`pantalla ≈${profile.screenDiagonalIn}"`);
    parts.push(`brillo ${profile.brightness}`);
    parts.push(profile.environment);
    return parts.join(' · ');
  }

  return { profile, needsCalibration, run, summaryText };
})();
