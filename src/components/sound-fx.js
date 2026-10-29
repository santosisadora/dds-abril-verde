/**
 * src/components/sound-fx.js
 * Sintetizador Web Audio API leve para bips de confirmação do Checklist,
 * alertas de scanner e som de conquista (sem depender de arquivos MP3 extras).
 */

let audioCtx = null;

function getCtx() {
  if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playBeep(freq = 880, durationMs = 90, type = 'sine', gainVal = 0.14) {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch (_) {}
}

export function playSuccessChord() {
  playBeep(660, 100, 'triangle', 0.14);
  setTimeout(() => playBeep(880, 120, 'triangle', 0.15), 90);
  setTimeout(() => playBeep(1320, 220, 'sine', 0.18), 190);
}
