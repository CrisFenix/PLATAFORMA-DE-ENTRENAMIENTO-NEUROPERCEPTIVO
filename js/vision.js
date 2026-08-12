/**
 * vision.js — MÓDULO 3: VISIÓN
 * El más extenso del prototipo. Ocho subpruebas (7.1 a 7.8).
 * Ninguna subprueba se presenta como diagnóstico clínico; todas dependen
 * del hardware de pantalla del usuario y así se advierte donde aplica.
 */
const VisionModule = (() => {

  const meta = {
    id: 'vision',
    name: 'Visión',
    description: 'Ocho subpruebas: agudeza experimental, contraste, color, periferia, movimiento, seguimiento, memoria visual y adaptación a baja luz.',
    status: 'disponible',
    difficulty: 'Variable'
  };

  const SUBTESTS = [
    { id: 'acuity',       label: '7.1 Agudeza visual experimental' },
    { id: 'contrast',     label: '7.2 Sensibilidad al contraste' },
    { id: 'chromatic',    label: '7.3 Discriminación cromática' },
    { id: 'peripheral',   label: '7.4 Visión periférica' },
    { id: 'motion',       label: '7.5 Detección de movimiento' },
    { id: 'tracking',     label: '7.6 Seguimiento visual' },
    { id: 'visualMemory', label: '7.7 Memoria visual' },
    { id: 'lowlight',     label: '7.8 Adaptación a baja iluminación' }
  ];

  function start(container) {
    renderMenu();

    function renderMenu() {
      container.innerHTML = `
        <div class="exercise-shell">
          <div class="instructions-panel">
            <h2>Visión — selección de subprueba</h2>
            <p>Estas pruebas exploran discriminación y procesamiento visual bajo condiciones controladas por software. No sustituyen un examen optométrico u oftalmológico, y los resultados dependen del panel, brillo y reproducción cromática de tu dispositivo concreto.</p>
            <div class="difficulty-select">
              ${SUBTESTS.map(s => `<button data-sub="${s.id}">${s.label}</button>`).join('')}
            </div>
            <button class="btn btn-ghost" id="btn-exit">Volver al panel</button>
          </div>
        </div>`;
      container.querySelectorAll('[data-sub]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (Calibration.needsCalibration('vision')) {
            Calibration.run(container, 'vision', () => runSubtest(btn.dataset.sub));
          } else {
            runSubtest(btn.dataset.sub);
          }
        });
      });
      container.querySelector('#btn-exit').addEventListener('click', () => App.showModulePanel());
    }

    function runSubtest(id) {
      const fns = { acuity, contrast, chromatic, peripheral, motion, tracking, visualMemory, lowlight };
      fns[id](container, renderMenu);
    }

    /* ---- utilidades compartidas ---- */
    function shellHTML(title, trial, max, bodyHTML) {
      return `
        <div class="exercise-shell">
          <div class="exercise-topbar">
            <span class="exercise-title">Visión · ${title}</span>
            <div class="exercise-hud"><span class="hud-item">Ensayo <b>${trial + 1}</b>/${max}</span></div>
            <button class="btn btn-ghost exercise-exit" id="btn-exit-sub">Salir</button>
          </div>
          ${bodyHTML}
        </div>`;
    }
    function bindExit(container) {
      const btn = container.querySelector('#btn-exit-sub');
      if (btn) btn.addEventListener('click', () => App.showModulePanel());
    }
    function landoltSVG(size, dir) {
      const gapRotation = { right: 0, down: 90, left: 180, up: 270 }[dir];
      return `<svg width="${size * 2}" height="${size * 2}" viewBox="0 0 100 100">
        <g transform="rotate(${gapRotation} 50 50)">
          <path d="M50 10 A40 40 0 1 1 49.9 10" fill="none" stroke="#111" stroke-width="14"
            stroke-dasharray="240 18" stroke-dashoffset="0"/>
        </g>
      </svg>`;
    }

    /* ================= 7.1 AGUDEZA VISUAL EXPERIMENTAL ================= */
    function acuity(container, back) {
      const DIRECTIONS = ['up', 'down', 'left', 'right'];
      let size = 90;
      let trial = 0;
      const MAX_TRIALS = 14;
      let correct = 0;
      const sizesAtCorrect = [];

      renderTrial();
      function renderTrial() {
        const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
        container.innerHTML = shellHTML('7.1 Agudeza visual experimental', trial, MAX_TRIALS, `
          <div class="stimulus-stage stage-light" id="stage">${landoltSVG(size, dir)}</div>
          <p class="stage-instructions" style="position:static;color:var(--text-mid);text-align:center;margin-top:10px;">¿Hacia qué lado apunta la abertura del anillo?</p>
          <div class="difficulty-select" style="justify-content:center;">
            <button data-dir="up">Arriba</button><button data-dir="down">Abajo</button>
            <button data-dir="left">Izquierda</button><button data-dir="right">Derecha</button>
          </div>`);
        bindExit(container);
        container.querySelectorAll('[data-dir]').forEach(btn => btn.addEventListener('click', () => {
          const isCorrect = btn.dataset.dir === dir;
          if (isCorrect) { correct++; sizesAtCorrect.push(size); }
          size = isCorrect ? Math.max(14, size * 0.86) : Math.min(90, size * 1.08);
          trial++;
          trial >= MAX_TRIALS ? finish() : renderTrial();
        }));
      }
      function finish() {
        const accuracy = Metrics.accuracyPct(correct, MAX_TRIALS);
        const minSize = sizesAtCorrect.length ? Math.min(...sizesAtCorrect) : null;
        App.recordSessionResult({ moduleId: 'vision', moduleName: 'Visión · Agudeza experimental', accuracy, level: null });
        Metrics.renderResultPanel(container, {
          items: [
            { label: 'Precisión', value: Metrics.fmtPct(accuracy) },
            { label: 'Tamaño mínimo discriminado', value: minSize ? `${Math.round(minSize)} px` : '—' },
            { label: 'Aciertos', value: `${correct} / ${MAX_TRIALS}` }
          ],
          onRetry: () => runSubtest('acuity'), onExit: back
        });
      }
    }

    /* ================= 7.2 SENSIBILIDAD AL CONTRASTE ================= */
    function contrast(container, back) {
      let luminance = 34;
      let trial = 0;
      const MAX_TRIALS = 12;
      let correct = 0, minDetected = null;
      const reactionTimes = [];

      renderTrial();
      function renderTrial() {
        const x = 15 + Math.random() * 70, y = 15 + Math.random() * 70;
        const shownAt = Metrics.now();
        container.innerHTML = shellHTML('7.2 Sensibilidad al contraste', trial, MAX_TRIALS, `
          <div class="stimulus-stage" id="stage" style="cursor:pointer;">
            <div id="dot" style="position:absolute; top:${y}%; left:${x}%; width:26px; height:26px; border-radius:50%; background:rgb(${luminance},${luminance},${luminance}); transform:translate(-50%,-50%);"></div>
            <p class="stage-instructions">Pulsa en el punto tenue en cuanto lo detectes.</p>
          </div>`);
        bindExit(container);
        const stage = container.querySelector('#stage');
        const dot = container.querySelector('#dot');
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          reactionTimes.push(Metrics.now() - shownAt);
          correct++; minDetected = luminance;
          luminance = Math.max(2, luminance - 4);
          advance();
        });
        stage.addEventListener('click', () => { luminance = Math.min(90, luminance + 6); advance(); });
        function advance() { trial++; trial >= MAX_TRIALS ? finish() : renderTrial(); }
      }
      function finish() {
        const accuracy = Metrics.accuracyPct(correct, MAX_TRIALS);
        App.recordSessionResult({ moduleId: 'vision', moduleName: 'Visión · Contraste', accuracy, level: null });
        Metrics.renderResultPanel(container, {
          items: [
            { label: 'Detecciones correctas', value: `${correct} / ${MAX_TRIALS}` },
            { label: 'Nivel mínimo de luminancia detectado', value: minDetected !== null ? `Δ${minDetected}/255` : '—' },
            { label: 'Tiempo medio de respuesta', value: Metrics.fmtMs(Metrics.mean(reactionTimes)) }
          ],
          onRetry: () => runSubtest('contrast'), onExit: back
        });
      }
    }

    /* ================= 7.3 DISCRIMINACIÓN CROMÁTICA ================= */
    function chromatic(container, back) {
      let deltaHue = 26;
      let trial = 0;
      const MAX_TRIALS = 12;
      let correct = 0, minDelta = null;

      renderTrial();
      function renderTrial() {
        const baseHue = Math.floor(Math.random() * 360);
        const oddIndex = Math.floor(Math.random() * 3);
        const hues = [0, 1, 2].map(i => (i === oddIndex ? baseHue + deltaHue : baseHue));
        container.innerHTML = shellHTML('7.3 Discriminación cromática', trial, MAX_TRIALS, `
          <div class="stimulus-stage stage-light">
            <div class="swatch-row">${hues.map((h, i) => `<button class="color-swatch" data-idx="${i}" style="background:hsl(${h},60%,50%);"></button>`).join('')}</div>
          </div>
          <p class="stage-instructions" style="position:static;color:var(--text-mid);text-align:center;margin-top:10px;">Elige el color que percibes diferente a los otros dos.</p>`);
        bindExit(container);
        container.querySelectorAll('[data-idx]').forEach(btn => btn.addEventListener('click', () => {
          const isCorrect = Number(btn.dataset.idx) === oddIndex;
          if (isCorrect) { correct++; minDelta = deltaHue; deltaHue = Math.max(2, deltaHue - 2); }
          else deltaHue = Math.min(30, deltaHue + 3);
          trial++;
          trial >= MAX_TRIALS ? finish() : renderTrial();
        }));
      }
      function finish() {
        const accuracy = Metrics.accuracyPct(correct, MAX_TRIALS);
        App.recordSessionResult({ moduleId: 'vision', moduleName: 'Visión · Color', accuracy, level: null });
        Metrics.renderResultPanel(container, {
          items: [
            { label: 'Aciertos', value: `${correct} / ${MAX_TRIALS}` },
            { label: 'Precisión', value: Metrics.fmtPct(accuracy) },
            { label: 'Diferencia mínima discriminada', value: minDelta !== null ? `${minDelta}° (HSL)` : '—' }
          ],
          onRetry: () => runSubtest('chromatic'), onExit: back
        });
      }
    }

    /* ================= 7.4 VISIÓN PERIFÉRICA ================= */
    function peripheral(container, back) {
      let eccentricity = 12; // % de distancia desde el centro
      let trial = 0;
      const MAX_TRIALS = 12;
      let correct = 0;
      const reactionTimes = [];
      let maxEccentricityHit = 0;

      renderTrial();
      function renderTrial() {
        const angle = Math.random() * Math.PI * 2;
        const x = 50 + Math.cos(angle) * eccentricity;
        const y = 50 + Math.sin(angle) * eccentricity * 0.6; // elipse por proporción de pantalla
        const shownAt = Metrics.now();
        container.innerHTML = shellHTML('7.4 Visión periférica', trial, MAX_TRIALS, `
          <div class="stimulus-stage" id="stage">
            <div class="fixation-point"></div>
            <div id="peri-dot" style="position:absolute; top:${y}%; left:${x}%; width:14px; height:14px; border-radius:50%; background:var(--phosphor); transform:translate(-50%,-50%); box-shadow:0 0 8px var(--phosphor);"></div>
            <p class="stage-instructions">Mantén la vista en el punto central. Pulsa en cuanto detectes el destello, sin mover la mirada.</p>
          </div>`);
        bindExit(container);
        container.querySelector('#peri-dot').addEventListener('click', (e) => {
          e.stopPropagation();
          reactionTimes.push(Metrics.now() - shownAt);
          correct++;
          maxEccentricityHit = Math.max(maxEccentricityHit, eccentricity);
          eccentricity = Math.min(46, eccentricity + 3);
          advance();
        });
        function advance() { trial++; trial >= MAX_TRIALS ? finish() : renderTrial(); }
      }
      function finish() {
        const accuracy = Metrics.accuracyPct(correct, MAX_TRIALS);
        App.recordSessionResult({ moduleId: 'vision', moduleName: 'Visión · Periférica', accuracy, level: null });
        Metrics.renderResultPanel(container, {
          items: [
            { label: 'Detecciones correctas', value: `${correct} / ${MAX_TRIALS}` },
            { label: 'Excentricidad máx. alcanzada', value: `≈${Math.round(maxEccentricityHit)}% del radio de pantalla` },
            { label: 'Tiempo medio de reacción', value: Metrics.fmtMs(Metrics.mean(reactionTimes)) }
          ],
          onRetry: () => runSubtest('peripheral'), onExit: back
        });
      }
    }

    /* ================= 7.5 DETECCIÓN DE MOVIMIENTO ================= */
    function motion(container, back) {
      let speed = 60; // px/s, decrece = más difícil
      let trial = 0;
      const MAX_TRIALS = 10;
      let correct = 0;
      let minSpeedDetected = null;

      renderTrial();
      function renderTrial() {
        container.innerHTML = shellHTML('7.5 Detección de movimiento', trial, MAX_TRIALS, `
          <div class="stimulus-stage" id="stage">
            <div id="mov-dot" style="position:absolute; top:50%; left:8%; width:10px; height:10px; border-radius:50%; background:var(--phosphor);"></div>
            <p class="stage-instructions">Pulsa en cuanto notes que el punto se mueve.</p>
          </div>`);
        bindExit(container);
        const dot = container.querySelector('#mov-dot');
        const stage = container.querySelector('#stage');
        let pos = 8;
        const start = Metrics.now();
        let responded = false;
        const interval = setInterval(() => {
          const elapsed = (Metrics.now() - start) / 1000;
          pos = 8 + elapsed * speed * 0.05;
          dot.style.left = `${Math.min(92, pos)}%`;
          if (pos >= 92) { clearInterval(interval); if (!responded) advance(false); }
        }, 30);
        stage.addEventListener('click', () => {
          if (responded) return;
          responded = true;
          clearInterval(interval);
          advance(true);
        });
        function advance(wasCorrect) {
          if (wasCorrect) { correct++; minSpeedDetected = speed; speed = Math.max(8, speed - 6); }
          else speed = Math.min(80, speed + 8);
          trial++;
          trial >= MAX_TRIALS ? finish() : renderTrial();
        }
      }
      function finish() {
        const accuracy = Metrics.accuracyPct(correct, MAX_TRIALS);
        App.recordSessionResult({ moduleId: 'vision', moduleName: 'Visión · Movimiento', accuracy, level: null });
        Metrics.renderResultPanel(container, {
          items: [
            { label: 'Detecciones correctas', value: `${correct} / ${MAX_TRIALS}` },
            { label: 'Velocidad mínima detectada', value: minSpeedDetected !== null ? `≈${minSpeedDetected} px/s` : '—' }
          ],
          onRetry: () => runSubtest('motion'), onExit: back
        });
      }
    }

    /* ================= 7.6 SEGUIMIENTO VISUAL ================= */
    function tracking(container, back) {
      const DURATION_MS = 8000;
      container.innerHTML = shellHTML('7.6 Seguimiento visual', 0, 1, `
        <div class="stimulus-stage" id="stage">
          <div id="track-dot" style="position:absolute; width:16px; height:16px; border-radius:50%; background:var(--phosphor); box-shadow:0 0 8px var(--phosphor); top:50%; left:50%;"></div>
          <p class="stage-instructions">Sigue el punto con el cursor o el dedo, sin perderlo, durante 8 segundos.</p>
        </div>`);
      bindExit(container);
      const stage = container.querySelector('#stage');
      const dot = container.querySelector('#track-dot');
      let pointer = { x: 0, y: 0 };
      let samplesTotal = 0, samplesClose = 0;
      const start = Metrics.now();

      function movePointer(e) {
        const rect = stage.getBoundingClientRect();
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        pointer = { x: cx - rect.left, y: cy - rect.top };
      }
      stage.addEventListener('mousemove', movePointer);
      stage.addEventListener('touchmove', movePointer, { passive: true });

      const anim = setInterval(() => {
        const t = (Metrics.now() - start) / 1000;
        const rect = stage.getBoundingClientRect();
        const tx = rect.width * (0.5 + 0.35 * Math.sin(t * 1.3));
        const ty = rect.height * (0.5 + 0.28 * Math.cos(t * 0.9));
        dot.style.left = `${tx}px`; dot.style.top = `${ty}px`;
        samplesTotal++;
        const dist = Math.hypot(pointer.x - tx, pointer.y - ty);
        if (dist < 60) samplesClose++;
        if (Metrics.now() - start >= DURATION_MS) { clearInterval(anim); finish(); }
      }, 40);

      function finish() {
        const accuracy = Metrics.accuracyPct(samplesClose, samplesTotal || 1);
        App.recordSessionResult({ moduleId: 'vision', moduleName: 'Visión · Seguimiento', accuracy, level: null });
        Metrics.renderResultPanel(container, {
          items: [{ label: 'Tiempo de seguimiento preciso', value: Metrics.fmtPct(accuracy) }],
          onRetry: () => runSubtest('tracking'), onExit: back
        });
      }
    }

    /* ================= 7.7 MEMORIA VISUAL ================= */
    function visualMemory(container, back) {
      const COLORS = ['#e0665c', '#6ee7b0', '#6fb3e0', '#e8a33d', '#c084e0'];
      const SHAPES = ['circle', 'square', 'triangle'];
      const n = 5;
      const objects = Array.from({ length: n }, (_, i) => ({
        id: i, x: 10 + Math.random() * 80, y: 10 + Math.random() * 80,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)]
      }));

      container.innerHTML = shellHTML('7.7 Memoria visual', 0, 1, `
        <div class="stimulus-stage stage-light" id="stage">
          ${objects.map(o => shapeSVG(o)).join('')}
        </div>
        <div class="info-box">Memoriza la posición, forma y color de cada objeto. <strong id="cd">6s</strong></div>`);
      bindExit(container);
      let remaining = 6;
      const cd = container.querySelector('#cd');
      const h = setInterval(() => {
        remaining--; if (cd) cd.textContent = `${remaining}s`;
        if (remaining <= 0) { clearInterval(h); recall(); }
      }, 1000);

      function shapeSVG(o) {
        const style = `position:absolute; left:${o.x}%; top:${o.y}%; transform:translate(-50%,-50%);`;
        if (o.shape === 'circle') return `<div style="${style} width:34px;height:34px;border-radius:50%;background:${o.color};"></div>`;
        if (o.shape === 'square') return `<div style="${style} width:30px;height:30px;background:${o.color};"></div>`;
        return `<div style="${style} width:0;height:0;border-left:17px solid transparent;border-right:17px solid transparent;border-bottom:30px solid ${o.color};"></div>`;
      }

      function recall() {
        // pantalla de recuperación: posiciones originales + 3 distractoras, sin color/forma correctos en algunos casos
        const decoys = Array.from({ length: 3 }, () => ({
          x: 10 + Math.random() * 80, y: 10 + Math.random() * 80,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          shape: SHAPES[Math.floor(Math.random() * SHAPES.length)]
        }));
        const candidates = [...objects.map(o => ({ ...o, real: true })), ...decoys.map(o => ({ ...o, real: false }))];
        const shuffled = candidates.sort(() => Math.random() - 0.5);
        let selected = new Set();

        container.innerHTML = shellHTML('7.7 Memoria visual · Recuerda', 0, 1, `
          <div class="stimulus-stage stage-light" id="stage2">
            ${shuffled.map((o, i) => `<button class="recall-obj" data-i="${i}" style="position:absolute; left:${o.x}%; top:${o.y}%; transform:translate(-50%,-50%); border:2px solid transparent; background:transparent; padding:2px; cursor:pointer;">${shapeSVG(o).replace('position:absolute;', '')}</button>`).join('')}
          </div>
          <p class="stage-instructions" style="position:static;color:var(--text-mid);text-align:center;">Selecciona los objetos que formaban parte de la composición original.</p>
          <button class="btn btn-primary" id="btn-check-vm" style="margin-top:10px;">Comprobar</button>`);
        bindExit(container);

        container.querySelectorAll('.recall-obj').forEach(btn => {
          btn.addEventListener('click', () => {
            const i = btn.dataset.i;
            if (selected.has(i)) { selected.delete(i); btn.style.borderColor = 'transparent'; }
            else { selected.add(i); btn.style.borderColor = 'var(--phosphor)'; }
          });
        });
        container.querySelector('#btn-check-vm').addEventListener('click', () => {
          let correct = 0;
          shuffled.forEach((o, i) => {
            const wasSelected = selected.has(String(i));
            if ((wasSelected && o.real) || (!wasSelected && !o.real)) correct++;
          });
          const accuracy = Metrics.accuracyPct(correct, shuffled.length);
          App.recordSessionResult({ moduleId: 'vision', moduleName: 'Visión · Memoria visual', accuracy, level: null });
          Metrics.renderResultPanel(container, {
            items: [{ label: 'Precisión de reconocimiento', value: Metrics.fmtPct(accuracy) }],
            onRetry: () => runSubtest('visualMemory'), onExit: back
          });
        });
      }
    }

    /* ================= 7.8 ADAPTACIÓN A BAJA ILUMINACIÓN ================= */
    function lowlight(container, back) {
      container.innerHTML = `
        <div class="exercise-shell">
          <div class="notice"><strong>Nota experimental:</strong> este ejercicio explora la adaptación perceptiva y la detección de estímulos de bajo contraste en condiciones de poca luz simuladas por software. No genera "visión nocturna" ni modifica la fisiología ocular.</div>
          <div class="instructions-panel">
            <p>La pantalla se oscurecerá progresivamente durante 20 segundos. Deja que tus ojos se adapten. Después aparecerán estímulos muy débiles.</p>
            <button class="btn btn-primary" id="btn-start-ll">Comenzar adaptación</button>
            <button class="btn btn-ghost" id="btn-exit">Volver</button>
          </div>
        </div>`;
      container.querySelector('#btn-exit').addEventListener('click', () => App.showModulePanel());
      container.querySelector('#btn-start-ll').addEventListener('click', adapt);

      function adapt() {
        const ADAPT_MS = 20000;
        container.innerHTML = `
          <div class="exercise-shell">
            <div class="stimulus-stage" id="stage" style="background:#050505;">
              <p class="stage-instructions" id="adapt-msg">Adaptando… <span id="adapt-t">20</span>s</p>
            </div>
          </div>`;
        let remaining = 20;
        const h = setInterval(() => {
          remaining--;
          const el = document.getElementById('adapt-t');
          if (el) el.textContent = remaining;
          if (remaining <= 0) { clearInterval(h); trials(); }
        }, 1000);
      }

      function trials() {
        let level = 8; // luminancia inicial muy baja
        let trial = 0;
        const MAX_TRIALS = 8;
        let correct = 0;
        let minLevel = null;

        renderTrial();
        function renderTrial() {
          const x = 20 + Math.random() * 60, y = 20 + Math.random() * 60;
          const shownAt = Metrics.now();
          container.innerHTML = shellHTML('7.8 Adaptación a baja iluminación', trial, MAX_TRIALS, `
            <div class="stimulus-stage" id="stage" style="background:#050505;">
              <div id="ll-dot" style="position:absolute; top:${y}%; left:${x}%; width:20px; height:20px; border-radius:50%; background:rgb(${level},${level},${level}); transform:translate(-50%,-50%);"></div>
              <p class="stage-instructions">Pulsa en cuanto detectes el estímulo débil.</p>
            </div>`);
          bindExit(container);
          const stage = container.querySelector('#stage');
          container.querySelector('#ll-dot').addEventListener('click', (e) => {
            e.stopPropagation();
            correct++; minLevel = level;
            level = Math.max(2, level - 1);
            advance();
          });
          stage.addEventListener('click', () => { level = Math.min(30, level + 3); advance(); });
          function advance() { trial++; trial >= MAX_TRIALS ? finish() : renderTrial(); }
        }
        function finish() {
          const accuracy = Metrics.accuracyPct(correct, MAX_TRIALS);
          App.recordSessionResult({ moduleId: 'vision', moduleName: 'Visión · Adaptación baja luz', accuracy, level: null });
          Metrics.renderResultPanel(container, {
            items: [
              { label: 'Detecciones correctas', value: `${correct} / ${MAX_TRIALS}` },
              { label: 'Nivel mínimo de luminancia detectado', value: minLevel !== null ? `${minLevel}/255` : '—' }
            ],
            onRetry: () => runSubtest('lowlight'), onExit: back
          });
        }
      }
    }
  }

  return { meta, start };
})();
