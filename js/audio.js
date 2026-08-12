/**
 * audio.js
 * Envoltorio ligero sobre Web Audio API. Usado por reaction.js (bip de
 * reacción auditiva), vision.js (feedback), y por los ejercicios de
 * audición (frecuencia, intensidad, localización, separación de fuentes).
 */
const AudioEngine = (() => {

  let ctx = null;

  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  const isSupported = !!(window.AudioContext || window.webkitAudioContext);

  /**
   * Reproduce un tono simple.
   * pan: -1 (izquierda) a 1 (derecha), 0 = centro.
   */
  function playTone({ freq = 440, durationMs = 400, volume = 0.3, pan = 0, type = 'sine' } = {}) {
    const c = getCtx();
    if (!c) return Promise.resolve();
    const scale = (window.App && App.labConfig && App.labConfig.volumeScale) || 1;
    const effectiveVolume = Math.min(1, volume * scale);
    return new Promise(resolve => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      const panner = c.createStereoPanner ? c.createStereoPanner() : null;

      osc.type = type;
      osc.frequency.value = freq;

      const t0 = c.currentTime;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(effectiveVolume, t0 + 0.02);
      gain.gain.linearRampToValueAtTime(0, t0 + durationMs / 1000);

      osc.connect(gain);
      if (panner) {
        panner.pan.value = pan;
        gain.connect(panner);
        panner.connect(c.destination);
      } else {
        gain.connect(c.destination);
      }

      osc.start(t0);
      osc.stop(t0 + durationMs / 1000 + 0.02);
      osc.onended = resolve;
    });
  }

  /** Ruido blanco de fondo, útil para pruebas de separación señal/ruido. */
  function createNoiseSource(volume = 0.1) {
    const c = getCtx();
    if (!c) return null;
    const bufferSize = 2 * c.sampleRate;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = c.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const gain = c.createGain();
    gain.gain.value = volume;
    noise.connect(gain);
    gain.connect(c.destination);

    return {
      start: () => noise.start(),
      stop: () => { try { noise.stop(); } catch (e) {} },
      setVolume: v => { gain.gain.value = v; }
    };
  }

  /** Reproduce dos tonos simultáneos con paneo distinto, para separación de fuentes. */
  function playDualTone({ freqA, freqB, durationMs = 1200, panA = -0.7, panB = 0.7, volume = 0.25 }) {
    playTone({ freq: freqA, durationMs, pan: panA, volume });
    playTone({ freq: freqB, durationMs, pan: panB, volume });
  }

  return { isSupported, playTone, createNoiseSource, playDualTone, getCtx };
})();
