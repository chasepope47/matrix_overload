// ── Issue #3 – Boss Development ──
// Covers: shape, size, color, phase reactions, loot, attacks, spawning
import { G } from './globals.js';

// Boss character definitions — one entry per stage (stage 10+ holds at Omega Breach)
export const BOSS_STYLES = [
  { name: 'Rupture Core',        shape: 'hex',     colors: ['#3a0800', '#ff4400', '#ff9966'], glow: '#ff7744', lootMul: 1.0, svg: 'rupture-core.svg',        category: 'machine'  },
  { name: 'Vortex Brute',        shape: 'oct',     colors: ['#0b1630', '#00b7ff', '#8ce6ff'], glow: '#5ad7ff', lootMul: 1.2, svg: 'vortex-brute.svg',         category: 'organic'  },
  { name: 'Crucible Sentinel',   shape: 'cross',   colors: ['#261100', '#ffaa00', '#ffe08a'], glow: '#ffcc55', lootMul: 1.4, svg: 'crucible-sentinel.svg',    category: 'machine'  },
  { name: 'Nova Warden',         shape: 'diamond', colors: ['#180824', '#b13cff', '#f3b6ff'], glow: '#d97bff', lootMul: 1.6, svg: 'nova-warden.svg',          category: 'hybrid'   },
  { name: 'Apex Harbinger',      shape: 'star',    colors: ['#09120c', '#00ff99', '#99ffdd'], glow: '#4effc1', lootMul: 1.8, svg: 'apex-harbinger.svg',       category: 'organic'  },
  { name: 'Void Fracture',       shape: 'hex',     colors: ['#0a0014', '#ff00ff', '#ff99ff'], glow: '#ff55ff', lootMul: 2.0, svg: 'void-fracture.svg',        category: 'hybrid'   },
  { name: 'Crimson Annihilator', shape: 'oct',     colors: ['#1a0000', '#ff0022', '#ff8899'], glow: '#ff2244', lootMul: 2.2, svg: 'crimson-annihilator.svg',  category: 'machine'  },
  { name: 'Stellar Colossus',    shape: 'star',    colors: ['#000818', '#44aaff', '#aaddff'], glow: '#66ccff', lootMul: 2.5, svg: 'stellar-colossus.svg',     category: 'machine'  },
  { name: 'Abyssal Dread',       shape: 'diamond', colors: ['#060606', '#aaaaaa', '#eeeeee'], glow: '#cccccc', lootMul: 2.8, svg: 'abyssal-dread.svg',        category: 'organic'  },
  { name: 'Omega Breach',        shape: 'cross',   colors: ['#0f0000', '#ff6600', '#ffcc99'], glow: '#ff8833', lootMul: 3.2, svg: 'omega-breach.svg',         category: 'hybrid'   },
];

// Preloaded SVG images keyed by boss name
const bossImages = new Map();

export function loadBossImages() {
  for (const style of BOSS_STYLES) {
    if (!style.svg) continue;
    const img = new Image();
    img.src = `./assets/bosses/${style.svg}`;
    bossImages.set(style.name, img);
  }
}

export function getBossStyle(stage) {
  const idx = Math.min(Math.max(stage, 1) - 1, BOSS_STYLES.length - 1);
  return BOSS_STYLES[idx];
}

export function drawBoss(e) {
  const ctx   = G.ctx;
  const style = e.bossStyle || getBossStyle(1);
  const r     = 32 + Math.sin(e.pulseT) * 2.5;

  ctx.rotate(e.rot);

  const img = bossImages.get(style.name);
  if (img && img.complete && img.naturalWidth) {
    // Flash white on hit
    if (e.flash > 0) {
      ctx.filter = 'brightness(10) saturate(0)';
    } else if (e.bossPhase === 2) {
      ctx.filter = 'saturate(3) brightness(1.1) hue-rotate(-15deg)';
    }
    ctx.drawImage(img, -r, -r, r * 2, r * 2);
    ctx.filter = 'none';
  } else {
    // Procedural fallback while SVG loads
    _drawBossProc(e, ctx, style, r);
  }

  ctx.rotate(-e.rot);

  // Phase 2 animated glow ring (drawn un-rotated, on top of image)
  if (e.bossPhase === 2) {
    ctx.beginPath();
    ctx.arc(0, 0, r + 6 + Math.sin(e.pulseT * 2) * 3, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff2200';
    ctx.lineWidth   = 2;
    ctx.globalAlpha = 0.55 + Math.sin(e.pulseT * 3) * 0.2;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // HP bar
  const bw = r * 2;
  ctx.fillStyle = '#111';
  ctx.fillRect(-r, r + 4, bw, 4);
  ctx.fillStyle = `hsl(${(e.hp / e.maxHp) * 60},100%,50%)`;
  ctx.fillRect(-r, r + 4, bw * (e.hp / e.maxHp), 4);

  // Boss name label
  const nameLabel = style.name + (e.bossPhase === 2 ? ' ★' : '');
  ctx.font        = 'bold 10px Courier New';
  ctx.textAlign   = 'center';
  ctx.shadowColor = e.bossPhase === 2 ? '#ff2200' : (style.glow || '#ff4400');
  ctx.shadowBlur  = 10;
  ctx.fillStyle   = e.bossPhase === 2 ? '#ff4422' : (style.glow || '#ff4400');
  ctx.fillText(nameLabel, 0, -(r + 10));
  ctx.textAlign   = 'left';
  ctx.shadowBlur  = 0;
}

// Procedural fallback (used while SVG images are loading)
function _drawBossProc(e, ctx, style, r) {
  const coreColor = e.flash > 0 ? '#fff' : style.colors[1];
  const edgeColor = e.flash > 0 ? '#fff' : style.colors[2];

  ctx.rotate(e.rot);

  if (style.shape === 'oct') {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a  = Math.PI * 2 * i / 8;
      const rr = i % 2 === 0 ? r : r * 0.7;
      i === 0 ? ctx.moveTo(rr * Math.cos(a), rr * Math.sin(a))
              : ctx.lineTo(rr * Math.cos(a), rr * Math.sin(a));
    }
    ctx.closePath();
  } else if (style.shape === 'cross') {
    ctx.beginPath();
    ctx.rect(-r * 0.18, -r * 1.15, r * 0.36, r * 2.3);
    ctx.rect(-r * 1.15, -r * 0.18, r * 2.3,  r * 0.36);
    ctx.closePath();
  } else if (style.shape === 'diamond') {
    ctx.beginPath();
    ctx.moveTo(0, -r); ctx.lineTo(r * 0.8, 0);
    ctx.lineTo(0,  r); ctx.lineTo(-r * 0.8, 0);
    ctx.closePath();
  } else if (style.shape === 'star') {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = (Math.PI / 5) * i;
      const rr  = i % 2 === 0 ? r : r * 0.45;
      i === 0 ? ctx.moveTo(rr * Math.cos(ang - Math.PI / 2), rr * Math.sin(ang - Math.PI / 2))
              : ctx.lineTo(rr * Math.cos(ang - Math.PI / 2), rr * Math.sin(ang - Math.PI / 2));
    }
    ctx.closePath();
  } else {
    // hex (default)
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = Math.PI * 2 * i / 6;
      i === 0 ? ctx.moveTo(r * Math.cos(a), r * Math.sin(a))
              : ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
    }
    ctx.closePath();
  }

  ctx.fillStyle   = e.flash > 0 ? '#fff' : style.colors[0];
  ctx.strokeStyle = e.flash > 0 ? '#fff' : edgeColor;
  ctx.lineWidth   = 3;
  ctx.fill(); ctx.stroke();

  // Counter-rotating inner core
  ctx.rotate(-e.rot * 3);
  ctx.beginPath(); ctx.arc(0, 0, r * 0.48, 0, Math.PI * 2);
  ctx.fillStyle = coreColor;
  ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = e.flash > 0 ? '#fff' : style.colors[2];
  ctx.fill();

  if (style.shape === 'cross') {
    ctx.beginPath(); ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = e.flash > 0 ? '#fff' : '#222';
    ctx.fill();
  }

  ctx.rotate(e.rot * 3);
  ctx.rotate(-e.rot); // back to un-rotated — HP bar/name drawn by drawBoss
}
