// ── Issue #2 – Enemy Development ──
// Common and elite enemies: spawn, AI movement, rendering
import { CFG, enemyHp } from './config.js';
import { state } from './state.js';
import { G } from './globals.js';
import { getBossStyle, drawBoss } from './bosses.js';

export function getFreeSlot() {
  for (const e of G.pool) if (!e.alive) return e;
  const e = { alive: false };
  G.pool.push(e);
  return e;
}

export function spawnEnemy(type) {
  const e      = getFreeSlot();
  const hp     = enemyHp(state.stage) * (type === 'boss' ? 12 : type === 'elite' ? 4 : 1);
  const margin = 40;
  const side   = Math.floor(Math.random() * 4);
  let x, y;
  if      (side === 0) { x = Math.random() * G.W;  y = -margin; }
  else if (side === 1) { x = G.W + margin;          y = Math.random() * G.H; }
  else if (side === 2) { x = Math.random() * G.W;  y = G.H + margin; }
  else                 { x = -margin;               y = Math.random() * G.H; }

  const bossStyle = type === 'boss' ? getBossStyle(state.stage) : null;

  Object.assign(e, {
    alive: true, type,
    x, y,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    hp, maxHp: hp,
    flash:     0,
    pulseT:    Math.random() * Math.PI * 2,
    rot:       Math.random() * Math.PI * 2,
    bossStyle,
    bossName:  bossStyle ? bossStyle.name : '',
    bossPhase: type === 'boss' ? 1 : 0, // 1=normal, 2=enraged (Issue #3)
  });

  if (type === 'boss') { G.bossAlive = true; G.bossRef = e; }
  return e;
}

export function liveCount() {
  let n = 0;
  for (const e of G.pool) if (e.alive) n++;
  return n;
}

export function updateEntities(dt) {
  const dt16 = dt / 16;
  const cx   = G.W * 0.5, cy = G.H * 0.5;
  for (const e of G.pool) {
    if (!e.alive) continue;
    const dx   = cx - e.x, dy = cy - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    // Issue #3: phase 2 boss moves faster
    const spd  = e.type === 'boss'  ? (e.bossPhase === 2 ? 0.46 : 0.28)
               : e.type === 'elite' ? 0.48 : 0.44;
    e.vx += (dx / dist) * 0.025 + (Math.random() - 0.5) * 0.05;
    e.vy += (dy / dist) * 0.025 + (Math.random() - 0.5) * 0.05;
    const v = Math.sqrt(e.vx * e.vx + e.vy * e.vy);
    if (v > spd) { e.vx = e.vx / v * spd; e.vy = e.vy / v * spd; }
    e.x += e.vx * dt16;
    e.y += e.vy * dt16;
    if (e.flash > 0) e.flash--;
    e.pulseT += 0.07;
    e.rot    += e.type === 'boss' ? 0.009 : 0.018;
  }
}

export function maybeSpawn(dt) {
  if (G.bossAlive) return;
  G.spawnAccum += dt;
  if (G.spawnAccum < CFG.SPAWN_INTERVAL_MS) return;
  G.spawnAccum -= CFG.SPAWN_INTERVAL_MS;
  const live  = liveCount();
  if (live < CFG.TARGET_DENSITY) {
    const batch = Math.min(4, CFG.TARGET_DENSITY - live);
    for (let i = 0; i < batch; i++) spawnEnemy('common');
  }
}

// Issue #3: boss periodically summons minions; doubles in phase 2
export function tickBossMinions(dt) {
  if (!G.bossAlive) { G.bossSpawnAccum = 0; return; }
  G.bossSpawnAccum += dt;
  if (G.bossSpawnAccum < CFG.BOSS_MINION_INTERVAL_MS) return;
  G.bossSpawnAccum -= CFG.BOSS_MINION_INTERVAL_MS;
  const count = G.bossRef?.bossPhase === 2 ? 4 : 2;
  for (let i = 0; i < count; i++) spawnEnemy('common');
}

// ── Draw functions ──

function drawCommon(e) {
  const ctx = G.ctx;
  const r   = 12 * (1 + Math.sin(e.pulseT) * 0.05);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = e.flash > 0 ? '#fff' : '#bb2244';
  ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.52, 0, Math.PI * 2);
  ctx.fillStyle = e.flash > 0 ? '#fff' : '#ff4488';
  ctx.fill();
  const bw = r * 2;
  ctx.fillStyle = '#111';
  ctx.fillRect(-r, r + 3, bw, 3);
  ctx.fillStyle = `hsl(${(e.hp / e.maxHp) * 110},100%,50%)`;
  ctx.fillRect(-r, r + 3, bw * (e.hp / e.maxHp), 3);
}

function drawElite(e) {
  const ctx   = G.ctx;
  const r     = 18 * (1 + Math.sin(e.pulseT) * 0.09);
  const sides = 8;
  ctx.rotate(e.rot);
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = (Math.PI * 2 * i / sides) - Math.PI / sides;
    i === 0 ? ctx.moveTo(r * Math.cos(a), r * Math.sin(a))
            : ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
  }
  ctx.closePath();
  ctx.fillStyle   = e.flash > 0 ? '#fff' : '#aa00dd';
  ctx.strokeStyle = e.flash > 0 ? '#fff' : '#ee44ff';
  ctx.lineWidth   = 2;
  ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
  ctx.fillStyle = e.flash > 0 ? '#fff' : '#ff99ff';
  ctx.fill();
  ctx.rotate(-e.rot);
  const bw = r * 2;
  ctx.fillStyle = '#111';
  ctx.fillRect(-r, r + 3, bw, 3);
  ctx.fillStyle = `hsl(${(e.hp / e.maxHp) * 110},100%,50%)`;
  ctx.fillRect(-r, r + 3, bw * (e.hp / e.maxHp), 3);
}

export function drawEntities() {
  for (const e of G.pool) {
    if (!e.alive) continue;
    G.ctx.save();
    G.ctx.translate(Math.round(e.x), Math.round(e.y));
    if      (e.type === 'common') drawCommon(e);
    else if (e.type === 'elite')  drawElite(e);
    else                          drawBoss(e);
    G.ctx.restore();
  }
}
