// Runtime mutable state shared across all modules.
// Import G and mutate its properties — never reassign G itself.

import { CFG } from './config.js';

const pool = [];
for (let i = 0; i < CFG.POOL_SIZE; i++) pool.push({ alive: false });

export const G = {
  // Canvas
  canvas: null,
  ctx:    null,
  W:      0,
  H:      0,

  // Audio
  audioCtx: null,

  // Entity pool
  pool,
  stageKills:     0,
  eliteCountdown: CFG.ELITE_EVERY,
  bossAlive:      false,
  bossRef:        null,
  bossSpawnAccum: 0,
  spawnAccum:     0,

  // Player ability
  wbCooldownEnd: 0,

  // Auto DPS
  autoAccum: 0,

  // Visual effects
  particles:   [],
  floaters:    [],
  shakeFrames: 0,
  shakeMag:    0,
  flashAlpha:  0,
  flashCol:    '#fff',

  // Loop timing
  hudAccum: 0,
  lastTs:   0,
};
