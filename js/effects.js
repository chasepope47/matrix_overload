import { CFG } from './config.js';
import { G } from './globals.js';

// ── Particles ──
export function burst(x, y, color, n = 6) {
  for (let i = 0; i < n; i++) {
    if (G.particles.length >= CFG.MAX_PARTICLES) break;
    const a = (Math.PI * 2 * i / n) + Math.random() * 0.8;
    const s = 1.5 + Math.random() * 3;
    G.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1,
                       size: 2 + Math.random() * 3, color, life: 1 });
  }
}

export function updateParticles() {
  for (let i = G.particles.length - 1; i >= 0; i--) {
    const p = G.particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.06;
    p.life -= 0.04;
    if (p.life <= 0) G.particles.splice(i, 1);
  }
}

export function drawParticles() {
  for (const p of G.particles) {
    G.ctx.save();
    G.ctx.globalAlpha = p.life;
    G.ctx.fillStyle   = p.color;
    G.ctx.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
    G.ctx.restore();
  }
}

// ── Floating text ──
export function floatText(x, y, text, color, big = false) {
  if (G.floaters.length >= CFG.MAX_FLOATERS) G.floaters.shift();
  G.floaters.push({ x, y, text, color, op: 1, big });
}

export function updateFloaters() {
  for (let i = G.floaters.length - 1; i >= 0; i--) {
    const f = G.floaters[i];
    f.y  -= 1.3;
    f.op -= 0.03;
    if (f.op <= 0) G.floaters.splice(i, 1);
  }
}

export function drawFloaters() {
  for (const f of G.floaters) {
    G.ctx.save();
    G.ctx.globalAlpha = f.op;
    G.ctx.font        = f.big ? 'bold 17px Courier New' : 'bold 12px Courier New';
    G.ctx.fillStyle   = f.color;
    G.ctx.shadowColor = f.color;
    G.ctx.shadowBlur  = f.big ? 10 : 5;
    G.ctx.fillText(f.text, f.x, f.y);
    G.ctx.restore();
  }
}

// ── Screen effects ──
export function triggerShake(frames, mag) { G.shakeFrames = frames; G.shakeMag = mag; }
export function triggerFlash(alpha, col)  { G.flashAlpha  = alpha;  G.flashCol  = col; }

export function drawFlash() {
  if (G.flashAlpha <= 0) return;
  G.ctx.save();
  G.ctx.globalAlpha = G.flashAlpha;
  G.ctx.fillStyle   = G.flashCol;
  G.ctx.fillRect(0, 0, G.W, G.H);
  G.ctx.restore();
  G.flashAlpha = Math.max(0, G.flashAlpha - 0.022);
}

// ── Background grid ──
export function drawBg() {
  G.ctx.strokeStyle = '#ffffff07';
  G.ctx.lineWidth   = 1;
  const step = 44;
  for (let x = 0; x <= G.W; x += step) {
    G.ctx.beginPath(); G.ctx.moveTo(x, 0); G.ctx.lineTo(x, G.H); G.ctx.stroke();
  }
  for (let y = 0; y <= G.H; y += step) {
    G.ctx.beginPath(); G.ctx.moveTo(0, y); G.ctx.lineTo(G.W, y); G.ctx.stroke();
  }
}
