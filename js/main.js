// ── Entry point: canvas, input, game loop, boot ──
import { CFG, clickDmg, autoDps, fmt } from './config.js';
import { state } from './state.js';
import { G } from './globals.js';
import { ensureAudio } from './audio.js';
import { updateParticles, updateFloaters, floatText,
         drawBg, drawParticles, drawFloaters, drawFlash } from './effects.js';
import { spawnEnemy, updateEntities, drawEntities,
         maybeSpawn, tickBossMinions } from './enemies.js';
import { applyDmg, tickAuto } from './combat.js';
import { refreshHUD, refreshStats, buildUpgradePanel,
         buildOfflinePanel, initTabs } from './ui.js';
import { buildAccountPanel, updateAuthScreen, bindAuthScreen } from './cloud.js';

// ── Canvas ──
G.canvas = document.getElementById('game-canvas');
G.ctx    = G.canvas.getContext('2d');

function resizeCanvas() {
  const wrap = document.getElementById('canvas-wrapper');
  G.W = G.canvas.width  = wrap.clientWidth;
  G.H = G.canvas.height = wrap.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ── Issue #1 – Click / Touch input ──
function handleClick(clientX, clientY) {
  ensureAudio();
  const rect = G.canvas.getBoundingClientRect();
  const ex   = (clientX - rect.left) * (G.W / rect.width);
  const ey   = (clientY - rect.top)  * (G.H / rect.height);
  const rad  = CFG.CLICK_RADIUS + (state.upgrades.aoe_radius || 0) * CFG.AOE_RADIUS_STEP;
  const rad2 = rad * rad;
  const dmg  = clickDmg(state.upgrades.click_power || 0);
  let hit = false;
  for (const e of G.pool) {
    if (!e.alive) continue;
    const dx = e.x - ex, dy = e.y - ey;
    if (dx * dx + dy * dy <= rad2) { applyDmg(e, dmg); hit = true; }
  }
  if (!hit) floatText(ex, ey, 'miss', '#333');
}

G.canvas.addEventListener('mousedown', e => { if (e.button === 0) handleClick(e.clientX, e.clientY); });
G.canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  for (const t of e.changedTouches) handleClick(t.clientX, t.clientY);
}, { passive: false });

// ── Issue #4 – Offline earnings on load ──
function calcOffline() {
  const elapsed = Math.min((Date.now() - state.lastSaved) / 1000, CFG.MAX_OFFLINE_SEC);
  const lvl     = state.upgrades.auto_tick || 0;
  if (lvl === 0 || elapsed < 10) return;
  const earned = Math.floor(autoDps(lvl) * elapsed);
  if (earned <= 0) return;
  state.resources += earned;
  const h = Math.floor(elapsed / 3600), m = Math.floor((elapsed % 3600) / 60);
  const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
  document.getElementById('modal-body').textContent   = `You were away for ${timeStr}. The drones kept working...`;
  document.getElementById('modal-earned').textContent = `+ ${fmt(earned)} resources`;
  document.getElementById('offline-modal').classList.add('show');
}
document.getElementById('modal-close-btn').addEventListener('click', () => {
  document.getElementById('offline-modal').classList.remove('show');
});

// ── Main loop ──
function loop(ts) {
  const dt = Math.min(ts - G.lastTs, 100);
  G.lastTs = ts;

  maybeSpawn(dt);
  tickBossMinions(dt);
  updateEntities(dt);
  updateParticles();
  updateFloaters();
  tickAuto(dt);

  G.ctx.save();
  if (G.shakeFrames > 0) {
    G.ctx.translate((Math.random() - 0.5) * G.shakeMag * 2, (Math.random() - 0.5) * G.shakeMag * 2);
    G.shakeFrames--;
    if (G.shakeFrames === 0) G.shakeMag = 0;
  }
  G.ctx.clearRect(-10, -10, G.W + 20, G.H + 20);
  drawBg();
  drawEntities();
  drawParticles();
  drawFloaters();
  drawFlash();
  G.ctx.restore();

  refreshHUD(dt);
  requestAnimationFrame(loop);
}

// ── Boot ──
calcOffline();
refreshStats();
buildUpgradePanel();
buildOfflinePanel();
buildAccountPanel();
bindAuthScreen();
initTabs(buildAccountPanel);

for (let i = 0; i < 22; i++) spawnEnemy('common');

requestAnimationFrame(ts => { G.lastTs = ts; loop(ts); });
