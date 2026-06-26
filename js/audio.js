import { G } from './globals.js';

export function ensureAudio() {
  if (G.audioCtx) return;
  try { G.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) {}
}

export function beep(freq, dur, vol = 0.1, type = 'square') {
  if (!G.audioCtx) return;
  try {
    const o = G.audioCtx.createOscillator();
    const g = G.audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, G.audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, G.audioCtx.currentTime + dur);
    o.connect(g); g.connect(G.audioCtx.destination);
    o.start(); o.stop(G.audioCtx.currentTime + dur);
  } catch (_) {}
}

export const sfx = {
  hit()    { beep(520, 0.05, 0.07); },
  kill()   { beep(200, 0.1,  0.10); },
  crit()   { beep(880, 0.07, 0.14); },
  boss()   { beep(110, 0.35, 0.16, 'sawtooth'); setTimeout(() => beep(165, 0.25, 0.12, 'sawtooth'), 140); },
  burst()  { beep(330, 0.2,  0.12, 'sawtooth'); },
  // [Issue #3] played when boss enters phase 2
  enrage() { beep(80, 0.5, 0.18, 'sawtooth'); setTimeout(() => beep(55, 0.4, 0.14, 'sawtooth'), 220); },
};
