// ── Issue #1 – Character Development ──
// Damage dealing, kills, loot, wave burst, auto DPS
// Also handles Issue #3 boss phase transitions and loot scaling
import { CFG, autoDps, fmt } from './config.js';
import { state } from './state.js';
import { G } from './globals.js';
import { sfx } from './audio.js';
import { burst, floatText, triggerShake, triggerFlash } from './effects.js';
import { spawnEnemy } from './enemies.js';

// ── Issue #3 – Loot: scaled by boss style lootMul ──
export function resPerkill(type, entity) {
  const base     = type === 'boss' ? 15 : type === 'elite' ? 4 : 1;
  const styleMul = type === 'boss' && entity?.bossStyle?.lootMul ? entity.bossStyle.lootMul : 1;
  return Math.floor(
    (state.stage * 1.2 + base) * Math.pow(1.25, state.upgrades.resource_mul || 0) * styleMul
  );
}

export function killEnemy(e) {
  const type = e.type;
  const gain = resPerkill(type, e);
  state.resources += gain;
  floatText(e.x, e.y - 22, `+${fmt(gain)}`, '#ffcc44');
  burst(e.x, e.y, type === 'boss' ? '#ff4400' : type === 'elite' ? '#ff00cc' : '#00ffcc');
  sfx.kill();
  e.alive = false;

  if (type === 'boss') {
    G.bossAlive = false; G.bossRef = null; G.bossSpawnAccum = 0;
    triggerShake(20, 6);
    triggerFlash(0.4, '#ff4400');
    sfx.boss();
    state.stage++;
    G.stageKills      = 0;
    G.eliteCountdown  = CFG.ELITE_EVERY;
    document.getElementById('hud-boss-wrap').style.display = 'none';
  } else {
    G.stageKills++;
    G.eliteCountdown--;
    if (G.eliteCountdown <= 0) {
      G.eliteCountdown = CFG.ELITE_EVERY;
      spawnEnemy('elite');
    }
    if (G.stageKills >= CFG.KILL_QUOTA && !G.bossAlive) {
      for (const en of G.pool) { if (en.alive && en.type !== 'boss') en.alive = false; }
      spawnEnemy('boss');
      document.getElementById('hud-boss-wrap').style.display = '';
    }
  }
}

export function applyDmg(e, dmg) {
  const critLvl = state.upgrades.crit_chance || 0;
  const isCrit  = Math.random() < critLvl * 0.06;
  const actual  = isCrit ? dmg * 3 : dmg;

  e.hp    -= actual;
  e.flash  = 3;

  if (isCrit) {
    floatText(e.x + (Math.random() - 0.5) * 18, e.y - 12, `CRIT ${fmt(Math.ceil(actual))}`, '#ffff44', true);
    triggerFlash(0.10, '#ffff00');
    sfx.crit();
  } else {
    floatText(e.x + (Math.random() - 0.5) * 14, e.y - 10, fmt(Math.ceil(actual)), '#00ffcc');
    sfx.hit();
  }

  // Issue #3: trigger boss phase 2 at 50% HP
  if (e.type === 'boss' && e.bossPhase === 1 && e.hp / e.maxHp <= CFG.BOSS_PHASE2_HP_PCT) {
    e.bossPhase = 2;
    triggerShake(14, 7);
    triggerFlash(0.45, e.bossStyle?.colors?.[1] || '#ff4400');
    floatText(e.x, e.y - 46, 'ENRAGED!', '#ff2200', true);
    sfx.enrage();
    for (let i = 0; i < 5; i++) spawnEnemy('common');
  }

  if (e.hp <= 0) killEnemy(e);
}

// ── Wave Burst — active ability ──
export function fireWaveBurst() {
  if (!(state.upgrades.wave_burst > 0)) return;
  if (Date.now() < G.wbCooldownEnd) return;
  G.wbCooldownEnd = Date.now() + CFG.WAVE_BURST_CD_MS;

  const alive = G.pool.filter(e => e.alive && e.type !== 'boss');
  const n     = Math.max(1, Math.ceil(alive.length * 0.2));
  for (let i = alive.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [alive[i], alive[j]] = [alive[j], alive[i]];
  }
  for (let i = 0; i < n && i < alive.length; i++) killEnemy(alive[i]);
  triggerFlash(0.22, '#ff9900');
  sfx.burst();
}

// ── Auto DPS tick ──
export function tickAuto(dt) {
  G.autoAccum += dt;
  if (G.autoAccum < 1000) return;
  G.autoAccum -= 1000;
  const dps = autoDps(state.upgrades.auto_tick || 0);
  if (dps <= 0) return;
  const live = G.pool.filter(e => e.alive && e.type !== 'boss');
  if (!live.length) return;
  const per = dps / live.length;
  for (const e of live) {
    e.hp -= per;
    if (e.hp <= 0) killEnemy(e);
  }
}
