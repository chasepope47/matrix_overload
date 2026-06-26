// ── Issue #4 – Game UI & Performance ──
// HUD refresh, stat/upgrade/offline panels, tab switching
import { CFG, UPGRADE_DEFS, clickDmg, autoDps, upgCost, fmt } from './config.js';
import { state } from './state.js';
import { G } from './globals.js';
import { liveCount } from './enemies.js';
import { fireWaveBurst } from './combat.js';

// ── HUD ──

export function refreshHUD(dt) {
  G.hudAccum += dt;
  if (G.hudAccum < 180) return;
  G.hudAccum = 0;

  document.getElementById('hud-stage-num').textContent = state.stage;
  document.getElementById('hud-resources').textContent = `⬡ ${fmt(Math.floor(state.resources))}`;
  document.getElementById('hud-dps').textContent       = `Auto: ${fmt(autoDps(state.upgrades.auto_tick || 0))}/s`;

  const kilEl = document.getElementById('hud-kills');
  if (G.bossAlive) {
    kilEl.textContent  = `BOSS • ${G.bossRef?.bossName || 'Boss'}`;
    kilEl.style.color  = G.bossRef?.bossStyle?.colors?.[1] || '#ff4400';
    if (G.bossRef) {
      const pct = Math.max(0, G.bossRef.hp / G.bossRef.maxHp * 100);
      document.getElementById('boss-bar-inner').style.width      = `${pct.toFixed(1)}%`;
      document.getElementById('boss-bar-inner').style.background =
        `linear-gradient(90deg, ${G.bossRef.bossStyle?.colors?.[0] || '#aa1100'}, ${G.bossRef.bossStyle?.colors?.[1] || '#ff4400'})`;
    }
  } else {
    kilEl.textContent = `Kills: ${G.stageKills} / ${CFG.KILL_QUOTA}`;
    kilEl.style.color = '';
  }

  refreshStats();
  refreshWaveBurstCooldown();
}

export function refreshStats() {
  const clvl  = state.upgrades.click_power || 0;
  const alvl  = state.upgrades.auto_tick   || 0;
  const crPct = ((state.upgrades.crit_chance || 0) * 6).toFixed(0);
  document.getElementById('panel-stats').innerHTML = `
    <div class="stat-item"><span class="stat-label">Click DMG</span><span class="stat-value">${fmt(clickDmg(clvl))}</span></div>
    <div class="stat-item"><span class="stat-label">Auto DPS</span><span class="stat-value">${fmt(autoDps(alvl))}</span></div>
    <div class="stat-item"><span class="stat-label">Crit</span><span class="stat-value">${crPct}%</span></div>
    <div class="stat-item"><span class="stat-label">Resources</span><span class="stat-value">${fmt(Math.floor(state.resources))}</span></div>
    <div class="stat-item"><span class="stat-label">Enemies</span><span class="stat-value">${liveCount()}</span></div>
    <div class="stat-item"><span class="stat-label">Stage</span><span class="stat-value">${state.stage}</span></div>
  `;
}

// ── Upgrade panel ──

export function buildUpgradePanel() {
  const panel = document.getElementById('panel-upgrades');
  panel.innerHTML = '';
  for (const def of UPGRADE_DEFS) {
    const lvl       = state.upgrades[def.id] || 0;
    const cost      = upgCost(def, lvl);
    const canAfford = state.resources >= cost || def.active;
    const isActive  = def.active;
    const onCD      = isActive && Date.now() < G.wbCooldownEnd;
    const notBought = isActive && !lvl;

    const card = document.createElement('div');
    card.className = 'upg-card'
      + (isActive               ? ' is-active'   : '')
      + (onCD                   ? ' on-cooldown' : '')
      + (!canAfford && !isActive ? ' disabled'   : '')
      + (notBought              ? ' disabled'    : '');
    card.id = `upg-${def.id}`;
    card.innerHTML = `
      <div class="upg-name">${def.name}</div>
      <div class="upg-effect">${def.effect}</div>
      <div class="upg-level">Lv ${lvl}</div>
      <div class="upg-cost">${isActive ? (lvl ? 'Ready' : `⬡ ${fmt(cost)}`) : `⬡ ${fmt(cost)}`}</div>
      ${isActive && lvl ? '<div class="cd-bar" id="cd-bar" style="width:0%"></div>' : ''}
    `;
    card.addEventListener('click', () => {
      if (isActive) { fireWaveBurst(); return; }
      const l = state.upgrades[def.id] || 0;
      const c = upgCost(def, l);
      if (state.resources < c) return;
      state.resources -= c;
      state.upgrades[def.id] = l + 1;
      buildUpgradePanel();
    });
    panel.appendChild(card);
  }
}

export function refreshWaveBurstCooldown() {
  const bar = document.getElementById('cd-bar');
  if (!bar) return;
  const rem = G.wbCooldownEnd - Date.now();
  if (rem <= 0) {
    bar.style.width = '0%';
    const card = document.getElementById('upg-wave_burst');
    if (card) { card.classList.remove('on-cooldown'); card.querySelector('.upg-cost').textContent = 'Ready'; }
  } else {
    bar.style.width = `${(rem / CFG.WAVE_BURST_CD_MS * 100).toFixed(1)}%`;
    const card = document.getElementById('upg-wave_burst');
    if (card) card.classList.add('on-cooldown');
  }
}

// ── Offline / Cache panel ──

export function buildOfflinePanel() {
  const dps = autoDps(state.upgrades.auto_tick || 0);
  const ts  = new Date(state.lastSaved).toLocaleTimeString();
  document.getElementById('panel-offline').innerHTML = `
    <div class="offline-row"><div class="ol-dot"></div><span>Save active — syncs every 10s &amp; on exit</span></div>
    <div class="offline-row"><span>Last save: ${ts}</span></div>
    <div class="offline-row"><span>Offline DPS: ${fmt(dps)}/s &nbsp;|&nbsp; Cap: 12 hours</span></div>
    <div class="offline-row"><span>Prestige slot: reserved (not yet active)</span></div>
  `;
}

// ── Tab switching ──
// buildAccountPanelFn is injected from main.js to avoid a circular import

const TAB_IDS = ['stats', 'upgrades', 'offline', 'account'];

export function initTabs(buildAccountPanelFn) {
  document.getElementById('dock-tabs').addEventListener('click', ev => {
    const btn = ev.target.closest('.tab-btn');
    if (!btn) return;
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    TAB_IDS.forEach(id => {
      document.getElementById(`panel-${id}`).style.display = id === tab ? '' : 'none';
    });
    if (tab === 'upgrades') buildUpgradePanel();
    if (tab === 'offline')  buildOfflinePanel();
    if (tab === 'account')  buildAccountPanelFn();
  });
}
