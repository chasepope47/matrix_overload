// ── Issue #4 – Game UI & Performance ──
export const CFG = {
  BASE_HP:                 8,
  HP_SCALE:                1.12,
  BASE_CLICK:              1,
  BASE_AUTO:               0.5,
  CLICK_SCALE:             1.14,
  AUTO_SCALE:              1.14,
  COST_SCALE:              1.15,
  CLICK_RADIUS:            48,
  AOE_RADIUS_STEP:         8,
  KILL_QUOTA:              12,
  ELITE_EVERY:             10,
  MAX_PARTICLES:           120,
  MAX_FLOATERS:            30,
  MAX_OFFLINE_SEC:         43200,
  SAVE_INTERVAL_MS:        10000,
  SPAWN_INTERVAL_MS:       700,
  TARGET_DENSITY:          55,
  POOL_SIZE:               150,
  WAVE_BURST_CD_MS:        15000,
  BOSS_MINION_INTERVAL_MS: 8000,
  BOSS_PHASE2_HP_PCT:      0.50,
};

// ── Issue #1 – Character Development ──
export const UPGRADE_DEFS = [
  { id: 'click_power', name: 'Click Force',  effect: '×1.14 per tier',        baseCost: 10,   active: false },
  { id: 'auto_tick',   name: 'Auto Drone',   effect: '×1.14 per tier',        baseCost: 50,   active: false },
  { id: 'aoe_radius',  name: 'Blast Zone',   effect: '+8px radius/tier',       baseCost: 200,  active: false },
  { id: 'crit_chance', name: 'Critical Hit', effect: '+6% crit/tier (3× dmg)', baseCost: 500,  active: false },
  { id: 'wave_burst',  name: 'Wave Burst',   effect: 'ACTIVE — clear 20%',     baseCost: 1000, active: true  },
  { id: 'resource_mul',name: 'Loot Boost',   effect: '×1.25 per tier',        baseCost: 2000, active: false },
];

export const enemyHp  = s   => CFG.BASE_HP    * Math.pow(CFG.HP_SCALE,    s - 1);
export const clickDmg = lvl => CFG.BASE_CLICK * Math.pow(CFG.CLICK_SCALE, lvl);
export const autoDps  = lvl => lvl === 0 ? 0 : CFG.BASE_AUTO * Math.pow(CFG.AUTO_SCALE, lvl - 1);
export const upgCost  = (def, lvl) => Math.floor(def.baseCost * Math.pow(CFG.COST_SCALE, lvl));

export function fmt(n) {
  n = +n;
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return (n / 1e9).toFixed(2)  + 'B';
  if (n >= 1e6)  return (n / 1e6).toFixed(2)  + 'M';
  if (n >= 1e3)  return (n / 1e3).toFixed(1)  + 'K';
  if (n < 10 && n !== Math.floor(n)) return n.toFixed(2);
  return Math.floor(n).toString();
}
