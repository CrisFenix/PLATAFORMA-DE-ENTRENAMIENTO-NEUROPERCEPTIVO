/**
 * app.js
 * Núcleo de la Plataforma de Entrenamiento Neuroperceptivo.
 * Gestiona navegación entre vistas, el registro de módulos, el estado
 * de sesión (solo en memoria) y las vistas de Panel, Laboratorio,
 * Dashboard y Evaluación Inicial.
 *
 * No existe backend, login ni almacenamiento permanente: todo el estado
 * vive en `App.session` mientras la pestaña permanece abierta.
 */
const App = (() => {

  const viewRoot = document.getElementById('view-root');

  /* ---------------- registro de módulos ---------------- */
  const MODULES = [
    AttentionModule, MemoryModule, VisionModule, ReactionModule,
    AuditionModule, OlfactionModule, TasteModule,
    ProprioceptionModule, SpatialModule, MultisensoryModule
  ];

  /* ---------------- estado de sesión (solo memoria) ---------------- */
  const session = {
    results: [],       // { moduleId, moduleName, accuracy, level, reactionMean, timestamp }
    startedAt: Date.now()
  };

  const labConfig = {
    startDifficulty: 2,
    volumeScale: 1,
    stimulusSizeScale: 1,
    reduceMotion: false
  };

  function recordSessionResult(entry) {
    session.results.push({ ...entry, timestamp: Date.now() });
    updateStatusBar();
  }

  function updateStatusBar() {
    const el = document.getElementById('status-left');
    if (el) el.textContent = `Sesión activa · ${session.results.length} prueba(s) completadas`;
  }

  /* ---------------- navegación ---------------- */
  function setActiveNav(name) {
    document.querySelectorAll('.rail-btn[data-nav]').forEach(b => b.classList.toggle('active', b.dataset.nav === name));
  }

  function navigate(view) {
    setActiveNav(view);
    if (view === 'panel') showModulePanel();
    else if (view === 'baseline') showBaseline();
    else if (view === 'lab') showLaboratory();
    else if (view === 'dashboard') showDashboard();
  }

  /* ---------------- vista: PANEL PRINCIPAL ---------------- */
  function showModulePanel() {
    viewRoot.innerHTML = `
      <section class="view-section">
        <div class="hero">
          <p class="hero-eyebrow">Panel principal</p>
          <h1>Plataforma de Entrenamiento Neuroperceptivo</h1>
          <p>Sistema experimental para entrenamiento y evaluación de capacidades perceptivas, cognitivas y sensoriomotoras.</p>
        </div>
        <div class="section-head">
          <h2>Módulos disponibles</h2>
          <span class="section-note">${MODULES.length} módulos registrados</span>
        </div>
        <div class="module-grid" id="module-grid"></div>
      </section>`;

    const grid = document.getElementById('module-grid');
    MODULES.forEach(mod => {
      const tpl = document.getElementById('tpl-module-card');
      const node = tpl.content.cloneNode(true);
      node.querySelector('.module-name').textContent = mod.meta.name;
      node.querySelector('.module-desc').textContent = mod.meta.description;
      node.querySelector('.module-difficulty').textContent = mod.meta.difficulty;
      node.querySelector('.module-status-label').textContent = mod.meta.status;
      const dot = node.querySelector('.module-status-dot');
      dot.dataset.state = mod.meta.status === 'disponible' ? 'ok' : mod.meta.status === 'limitado' ? 'parcial' : 'planificado';
      node.querySelector('.module-start').addEventListener('click', () => openModule(mod));
      grid.appendChild(node);
    });
    setActiveNav('panel');
  }

  function openModule(mod) {
    viewRoot.innerHTML = `<section class="view-section" id="module-container"></section>`;
    const container = document.getElementById('module-container');
    mod.start(container, { level: labConfig.startDifficulty });
  }

  /* ---------------- vista: DASHBOARD DE SESIÓN ---------------- */
  function showDashboard() {
    const results = session.results;
    const completedCount = results.length;
    const avgAccuracy = Metrics.mean(results.filter(r => r.accuracy !== null && r.accuracy !== undefined).map(r => r.accuracy));
    const elapsedMin = Math.round((Date.now() - session.startedAt) / 60000);

    viewRoot.innerHTML = `
      <section class="view-section">
        <div class="hero">
          <p class="hero-eyebrow">Sesión actual</p>
          <h1>Dashboard experimental</h1>
          <p>Datos de la sesión en curso. No se almacena ningún historial permanente: al cerrar o recargar la página, este registro se pierde.</p>
        </div>
        <div class="session-grid">
          <div class="stat-card"><span class="stat-label">Pruebas completadas</span><span class="stat-value">${completedCount}</span></div>
          <div class="stat-card"><span class="stat-label">Precisión media</span><span class="stat-value">${avgAccuracy ? avgAccuracy.toFixed(1) + '%' : '—'}</span></div>
          <div class="stat-card"><span class="stat-label">Tiempo de sesión</span><span class="stat-value">${elapsedMin}<span class="stat-sub">minutos</span></span></div>
          <div class="stat-card"><span class="stat-label">Módulos distintos usados</span><span class="stat-value">${new Set(results.map(r => r.moduleId)).size}</span></div>
        </div>
        <div class="section-head"><h2>Registro de la sesión</h2></div>
        <div class="session-log">
          ${completedCount === 0 ? `<div class="session-log-empty">Aún no se ha completado ninguna prueba en esta sesión.</div>` : `
          <table>
            <thead><tr><th>Hora</th><th>Módulo</th><th>Precisión</th><th>Nivel</th></tr></thead>
            <tbody>
              ${[...results].reverse().map(r => `
                <tr>
                  <td>${new Date(r.timestamp).toLocaleTimeString()}</td>
                  <td>${r.moduleName}</td>
                  <td>${r.accuracy !== null && r.accuracy !== undefined ? r.accuracy.toFixed(1) + '%' : '—'}</td>
                  <td>${r.level !== null && r.level !== undefined ? r.level : '—'}</td>
                </tr>`).join('')}
            </tbody>
          </table>`}
        </div>
      </section>`;
    setActiveNav('dashboard');
  }

  /* ---------------- vista: LABORATORIO ---------------- */
  function showLaboratory() {
    viewRoot.innerHTML = `
      <section class="view-section">
        <div class="hero">
          <p class="hero-eyebrow">Modo laboratorio</p>
          <h1>Parámetros experimentales</h1>
          <p>Ajusta parámetros globales sin editar código. Estos valores se aplican como puntos de partida en los módulos compatibles (nivel inicial de dificultad, volumen y tamaño relativo de estímulo).</p>
        </div>
        <div class="lab-grid">
          <div class="lab-form">
            <div class="field">
              <div class="field-row"><label for="lab-level">Nivel de dificultad inicial</label><span class="field-value" id="lab-level-val">${labConfig.startDifficulty}</span></div>
              <input type="range" id="lab-level" min="1" max="5" value="${labConfig.startDifficulty}">
            </div>
            <div class="field">
              <div class="field-row"><label for="lab-volume">Volumen relativo</label><span class="field-value" id="lab-volume-val">${Math.round(labConfig.volumeScale * 100)}%</span></div>
              <input type="range" id="lab-volume" min="20" max="150" value="${Math.round(labConfig.volumeScale * 100)}">
            </div>
            <div class="field">
              <div class="field-row"><label for="lab-size">Tamaño relativo de estímulo visual</label><span class="field-value" id="lab-size-val">${Math.round(labConfig.stimulusSizeScale * 100)}%</span></div>
              <input type="range" id="lab-size" min="50" max="150" value="${Math.round(labConfig.stimulusSizeScale * 100)}">
            </div>
            <div class="field">
              <label><input type="checkbox" id="lab-reduce-motion" ${labConfig.reduceMotion ? 'checked' : ''}> Reducir animaciones (accesibilidad)</label>
            </div>
            <div class="lab-actions">
              <button class="btn btn-primary" id="btn-apply-lab">Aplicar configuración</button>
              <button class="btn btn-ghost" id="btn-reset-lab">Restaurar valores</button>
            </div>
          </div>
          <div class="lab-preview">
            <h3>Configuración activa</h3>
            <pre id="lab-json" style="font-family:var(--font-data);font-size:12.5px;color:var(--phosphor);white-space:pre-wrap;">${JSON.stringify(labConfig, null, 2)}</pre>
            <p class="field-hint">Estos parámetros afectan a las pruebas que los consultan explícitamente (nivel inicial en Atención, Integración multisensorial; volumen base en Audición; tamaño inicial en Agudeza visual). El resto de módulos mantiene su propia calibración interna adaptativa.</p>
          </div>
        </div>
      </section>`;
    setActiveNav('lab');

    const levelInput = document.getElementById('lab-level');
    const volumeInput = document.getElementById('lab-volume');
    const sizeInput = document.getElementById('lab-size');
    levelInput.addEventListener('input', () => document.getElementById('lab-level-val').textContent = levelInput.value);
    volumeInput.addEventListener('input', () => document.getElementById('lab-volume-val').textContent = `${volumeInput.value}%`);
    sizeInput.addEventListener('input', () => document.getElementById('lab-size-val').textContent = `${sizeInput.value}%`);

    document.getElementById('btn-apply-lab').addEventListener('click', () => {
      labConfig.startDifficulty = Number(levelInput.value);
      labConfig.volumeScale = Number(volumeInput.value) / 100;
      labConfig.stimulusSizeScale = Number(sizeInput.value) / 100;
      labConfig.reduceMotion = document.getElementById('lab-reduce-motion').checked;
      applyAccessibility();
      showLaboratory();
    });
    document.getElementById('btn-reset-lab').addEventListener('click', () => {
      labConfig.startDifficulty = 2; labConfig.volumeScale = 1; labConfig.stimulusSizeScale = 1; labConfig.reduceMotion = false;
      applyAccessibility();
      showLaboratory();
    });
  }

  function applyAccessibility() {
    document.documentElement.classList.toggle('reduce-motion', labConfig.reduceMotion);
  }

  /* ---------------- vista: EVALUACIÓN INICIAL (BASELINE) ---------------- */
  function showBaseline() {
    viewRoot.innerHTML = `
      <section class="view-section">
        <div class="hero">
          <p class="hero-eyebrow">Evaluación inicial</p>
          <h1>Batería breve de referencia</h1>
          <p>Nueve pruebas cortas que generan un perfil de sesión. Estos índices son métricas internas de la aplicación, no puntuaciones clínicas ni diagnósticas.</p>
        </div>
        <div class="instructions-panel">
          <p>Duración aproximada: 6-8 minutos. Requiere sonido activado para las pruebas auditivas.</p>
          <button class="btn btn-primary" id="btn-start-baseline">Comenzar evaluación inicial</button>
        </div>
      </section>`;
    setActiveNav('baseline');
    document.getElementById('btn-start-baseline').addEventListener('click', runBaselineSequence);
  }

  function runBaselineSequence() {
    const domains = [
      { key: 'atencion', label: 'Atención', run: baselineAttention },
      { key: 'memoria', label: 'Memoria', run: baselineMemory },
      { key: 'reaccion', label: 'Reacción', run: baselineReactionVisual },
      { key: 'reaccionAud', label: 'Reacción auditiva', run: baselineReactionAudio },
      { key: 'contraste', label: 'Contraste', run: baselineContrast },
      { key: 'color', label: 'Color', run: baselineColor },
      { key: 'periferia', label: 'Visión periférica', run: baselinePeripheral },
      { key: 'audicion', label: 'Audición', run: baselineAudition },
      { key: 'espacial', label: 'Orientación espacial', run: baselineSpatial }
    ];
    const scores = {};
    let i = 0;
    step();

    function step() {
      if (i >= domains.length) return showProfile(scores, domains);
      const d = domains[i];
      const container = viewRoot;
      container.innerHTML = `<section class="view-section"><div class="exercise-topbar" style="margin-bottom:20px;">
          <span class="exercise-title">Evaluación inicial · ${d.label}</span>
          <div class="exercise-hud"><span class="hud-item">Prueba <b>${i + 1}</b>/${domains.length}</span></div>
        </div><div id="baseline-slot"></div></section>`;
      d.run(document.getElementById('baseline-slot'), (score) => {
        scores[d.key] = score;
        i++;
        step();
      });
    }
  }

  function showProfile(scores, domains) {
    viewRoot.innerHTML = `
      <section class="view-section">
        <div class="hero">
          <p class="hero-eyebrow">Resultado</p>
          <h1>Perfil de sesión</h1>
          <p>Índices internos de la aplicación (0-100) por dominio evaluado. No representan un diagnóstico clínico.</p>
        </div>
        <div class="profile-bars">
          ${domains.map(d => `
            <div class="profile-row">
              <span class="profile-label">${d.label}</span>
              <div class="profile-track"><div class="profile-fill" style="width:${scores[d.key] || 0}%;"></div></div>
              <span class="profile-score">${Math.round(scores[d.key] || 0)}</span>
            </div>`).join('')}
        </div>
        <div class="lab-actions" style="margin-top:24px;">
          <button class="btn btn-primary" id="btn-baseline-panel">Ir al panel de módulos</button>
        </div>
      </section>`;
    document.getElementById('btn-baseline-panel').addEventListener('click', showModulePanel);
    App.recordSessionResult({ moduleId: 'baseline', moduleName: 'Evaluación inicial (perfil completo)', accuracy: Metrics.mean(Object.values(scores)), level: null });
  }

  /* ------- mini-pruebas de la evaluación inicial (autocontenidas) ------- */

  function baselineAttention(container, done) {
    container.innerHTML = `<div class="stimulus-stage" id="stage" tabindex="0"><span id="glyph" style="font-size:56px;color:#fff;display:none;"></span>
      <p class="stage-instructions">Pulsa solo cuando veas ★. Dura 20 segundos.</p></div>`;
    const stage = container.querySelector('#stage');
    const glyph = container.querySelector('#glyph');
    let hits = 0, targets = 0, responded = false, running = true;
    stage.addEventListener('click', () => { if (isTargetVisible) { hits++; responded = true; } });
    let isTargetVisible = false;
    const timer = setInterval(() => {
      const isTarget = Math.random() < 0.25;
      isTargetVisible = isTarget; responded = false;
      if (isTarget) targets++;
      glyph.textContent = isTarget ? '★' : ['■','▲','●'][Math.floor(Math.random()*3)];
      glyph.style.display = 'block';
      setTimeout(() => { glyph.style.display = 'none'; isTargetVisible = false; }, 500);
    }, 900);
    setTimeout(() => { clearInterval(timer); running = false; done(Metrics.accuracyPct(hits, targets || 1)); }, 20000);
  }

  function baselineMemory(container, done) {
    const words = ['linterna','montaña','tetera','violín','cometa'];
    container.innerHTML = `<div class="stimulus-stage stage-light"><div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;padding:20px;">
      ${words.map(w => `<span style="font-family:var(--font-display);background:#fff;border:1px solid #ccc;padding:8px 14px;border-radius:6px;color:#111;">${w}</span>`).join('')}
    </div></div><div class="info-box">Memoriza. <span id="cd">5s</span></div>`;
    let r = 5;
    const cd = container.querySelector('#cd');
    const h = setInterval(() => { r--; cd.textContent = `${r}s`; if (r <= 0) { clearInterval(h); recall(); } }, 1000);
    function recall() {
      container.innerHTML = `<div class="instructions-panel"><p>Escribe los que recuerdes, separados por comas.</p>
        <input type="text" id="mem-in" style="width:100%;padding:10px;background:var(--bg-0);border:1px solid var(--line);color:var(--text-hi);border-radius:4px;">
        <button class="btn btn-primary" style="margin-top:12px;" id="mem-check">Comprobar</button></div>`;
      container.querySelector('#mem-check').addEventListener('click', () => {
        const answered = container.querySelector('#mem-in').value.toLowerCase().split(',').map(s => s.trim());
        const correct = words.filter(w => answered.includes(w)).length;
        done(Metrics.accuracyPct(correct, words.length));
      });
    }
  }

  function baselineReactionVisual(container, done) {
    const times = [];
    let trial = 0;
    render();
    function render() {
      container.innerHTML = `<div class="stimulus-stage" id="stage"><p class="stage-instructions">Espera el destello y pulsa lo antes posible. (${trial+1}/5)</p></div>`;
      const stage = container.querySelector('#stage');
      let waiting = false, shownAt = 0;
      setTimeout(() => { stage.style.background = 'var(--phosphor-dim)'; waiting = true; shownAt = Metrics.now(); }, 800 + Math.random()*1500);
      stage.addEventListener('click', () => {
        if (!waiting) return;
        times.push(Metrics.now() - shownAt);
        trial++;
        trial >= 5 ? finish() : render();
      });
    }
    function finish() {
      const m = Metrics.mean(times);
      // conversión heurística: 200ms->100, 500ms->0
      const score = Math.max(0, Math.min(100, 100 - ((m - 200) / 3)));
      done(score);
    }
  }

  function baselineReactionAudio(container, done) {
    if (!AudioEngine.isSupported) { container.innerHTML = `<div class="notice">Web Audio no disponible.</div>`; return done(0); }
    const times = [];
    let trial = 0;
    render();
    function render() {
      container.innerHTML = `<div class="stimulus-stage" id="stage"><p class="stage-instructions">Pulsa en cuanto escuches el tono. (${trial+1}/5)</p></div>`;
      const stage = container.querySelector('#stage');
      let waiting = false, shownAt = 0;
      setTimeout(() => { AudioEngine.playTone({ freq:700, durationMs:300, volume:0.35 }); waiting = true; shownAt = Metrics.now(); }, 800 + Math.random()*1500);
      stage.addEventListener('click', () => {
        if (!waiting) return;
        times.push(Metrics.now() - shownAt);
        trial++;
        trial >= 5 ? finish() : render();
      });
    }
    function finish() {
      const m = Metrics.mean(times);
      const score = Math.max(0, Math.min(100, 100 - ((m - 200) / 3)));
      done(score);
    }
  }

  function baselineContrast(container, done) {
    let luminance = 30, trial = 0, correct = 0;
    render();
    function render() {
      const x = 20 + Math.random()*60, y = 20 + Math.random()*60;
      container.innerHTML = `<div class="stimulus-stage" id="stage"><div id="dot" style="position:absolute;top:${y}%;left:${x}%;width:24px;height:24px;border-radius:50%;background:rgb(${luminance},${luminance},${luminance});transform:translate(-50%,-50%);"></div>
        <p class="stage-instructions">Pulsa el punto tenue. (${trial+1}/6)</p></div>`;
      container.querySelector('#dot').addEventListener('click', (e) => { e.stopPropagation(); correct++; luminance = Math.max(2, luminance-4); advance(); });
      container.querySelector('#stage').addEventListener('click', () => { luminance = Math.min(80, luminance+6); advance(); });
      function advance(){ trial++; trial>=6 ? done(Metrics.accuracyPct(correct,6)) : render(); }
    }
  }

  function baselineColor(container, done) {
    let delta = 24, trial = 0, correct = 0;
    render();
    function render() {
      const base = Math.floor(Math.random()*360);
      const odd = Math.floor(Math.random()*3);
      const hues = [0,1,2].map(i => i===odd ? base+delta : base);
      container.innerHTML = `<div class="stimulus-stage stage-light"><div class="swatch-row">
        ${hues.map((h,i)=>`<button class="color-swatch" data-i="${i}" style="background:hsl(${h},60%,50%);"></button>`).join('')}
      </div></div><p class="stage-instructions" style="position:static;text-align:center;color:var(--text-mid);">Elige el color distinto. (${trial+1}/6)</p>`;
      container.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => {
        if (Number(b.dataset.i)===odd) { correct++; delta = Math.max(3,delta-3); } else delta = Math.min(30,delta+3);
        trial++; trial>=6 ? done(Metrics.accuracyPct(correct,6)) : render();
      }));
    }
  }

  function baselinePeripheral(container, done) {
    let ecc = 14, trial = 0, correct = 0;
    render();
    function render() {
      const angle = Math.random()*Math.PI*2;
      const x = 50 + Math.cos(angle)*ecc, y = 50 + Math.sin(angle)*ecc*0.6;
      container.innerHTML = `<div class="stimulus-stage" id="stage"><div class="fixation-point"></div>
        <div id="dot" style="position:absolute;top:${y}%;left:${x}%;width:13px;height:13px;border-radius:50%;background:var(--phosphor);transform:translate(-50%,-50%);"></div>
        <p class="stage-instructions">Mira el centro y pulsa al detectar el destello. (${trial+1}/6)</p></div>`;
      container.querySelector('#dot').addEventListener('click', (e) => { e.stopPropagation(); correct++; ecc = Math.min(44, ecc+3); advance(); });
      function advance(){ trial++; trial>=6 ? done(Metrics.accuracyPct(correct,6)) : render(); }
    }
  }

  function baselineAudition(container, done) {
    if (!AudioEngine.isSupported) { container.innerHTML = `<div class="notice">Web Audio no disponible.</div>`; return done(0); }
    let delta = 30, trial = 0, correct = 0;
    render();
    function render() {
      const base = 400 + Math.random()*300;
      const odd = Math.floor(Math.random()*3);
      const tones = [0,1,2].map(i => i===odd ? base+delta : base);
      container.innerHTML = `<div class="guided-panel">
        <p>Reproduce y elige el tono distinto. (${trial+1}/5)</p>
        <div class="difficulty-select">${tones.map((_,i)=>`<button data-play="${i}">▶ ${i+1}</button>`).join('')}</div>
        <div class="option-grid" style="max-width:300px;">${tones.map((_,i)=>`<button data-g="${i}">Elegir ${i+1}</button>`).join('')}</div>
      </div>`;
      container.querySelectorAll('[data-play]').forEach(b => b.addEventListener('click', () => AudioEngine.playTone({freq:tones[Number(b.dataset.play)],durationMs:450,volume:0.3})));
      container.querySelectorAll('[data-g]').forEach(b => b.addEventListener('click', () => {
        if (Number(b.dataset.g)===odd) { correct++; delta = Math.max(4,delta-4); } else delta = Math.min(40,delta+4);
        trial++; trial>=5 ? done(Metrics.accuracyPct(correct,5)) : render();
      }));
    }
  }

  function baselineSpatial(container, done) {
    let trial = 0, correct = 0;
    render();
    function render() {
      const rot = Math.floor(Math.random()*4)*90;
      const match = Math.floor(Math.random()*3);
      const opts = [0,1,2].map(i => i===match ? rot : (rot+90+Math.floor(Math.random()*2)*90)%360);
      const svg = (r) => `<svg width="60" height="60" viewBox="0 0 70 70" style="transform:rotate(${r}deg);"><rect x="18" y="10" width="10" height="50" fill="#0a0d0e"/><rect x="18" y="10" width="34" height="10" fill="#0a0d0e"/></svg>`;
      container.innerHTML = `<div class="stimulus-stage stage-light"><div style="text-align:center;">${svg(rot)}</div></div>
        <p class="stage-instructions" style="position:static;text-align:center;color:var(--text-mid);">¿Cuál es la misma figura rotada? (${trial+1}/5)</p>
        <div class="swatch-row">${opts.map((r,i)=>`<button data-i="${i}" style="background:#fdfdfb;border:1px solid #ccc;border-radius:6px;padding:8px;">${svg(r)}</button>`).join('')}</div>`;
      container.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => {
        if (Number(b.dataset.i)===match) correct++;
        trial++; trial>=5 ? done(Metrics.accuracyPct(correct,5)) : render();
      }));
    }
  }

  /* ---------------- ajustes de accesibilidad ---------------- */
  function showSettings() {
    viewRoot.innerHTML = `
      <section class="view-section">
        <div class="hero">
          <p class="hero-eyebrow">Preferencias</p>
          <h1>Accesibilidad</h1>
        </div>
        <div class="instructions-panel">
          <div class="field"><label><input type="checkbox" id="settings-motion" ${labConfig.reduceMotion ? 'checked' : ''}> Reducir animaciones</label></div>
          <p class="field-hint">La navegación es accesible por teclado (Tab / Enter / Espacio) en todos los ejercicios. Los controles de audio incluyen ajuste de volumen relativo en el modo Laboratorio.</p>
        </div>
      </section>`;
    document.getElementById('settings-motion').addEventListener('change', (e) => {
      labConfig.reduceMotion = e.target.checked;
      applyAccessibility();
    });
  }

  /* ---------------- inicialización ---------------- */
  function init() {
    document.querySelectorAll('.rail-btn[data-nav]').forEach(btn => {
      btn.addEventListener('click', () => navigate(btn.dataset.nav));
    });
    document.getElementById('btn-settings').addEventListener('click', showSettings);
    showModulePanel();
  }

  document.addEventListener('DOMContentLoaded', init);

  return { showModulePanel, recordSessionResult, session, labConfig };
})();
