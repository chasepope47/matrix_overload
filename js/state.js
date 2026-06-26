// ── Issue #4 – Game UI & Performance ──
import { CFG, UPGRADE_DEFS } from './config.js';

const DEFAULT_STATE = {
  stage:       1,
  resources:   0,
  upgrades:    {},
  prestigeMul: 1,
  lastSaved:   Date.now(),
};

export const state = (() => {
  try {
    const s = JSON.parse(localStorage.getItem('matrix_save'));
    if (s) return Object.assign({}, DEFAULT_STATE, s, { upgrades: Object.assign({}, s.upgrades) });
  } catch (_) {}
  return Object.assign({}, DEFAULT_STATE, { upgrades: {} });
})();

export function summarizeBuildForProfile() {
  return {
    stage:       state.stage || 1,
    resources:   state.resources || 0,
    prestigeMul: state.prestigeMul || 1,
    upgrades: Object.fromEntries(
      UPGRADE_DEFS.map(def => [def.id, state.upgrades?.[def.id] || 0])
                  .filter(([, lvl]) => lvl > 0)
    ),
  };
}

export function saveState() {
  state.lastSaved = Date.now();
  try { localStorage.setItem('matrix_save', JSON.stringify(state)); } catch (_) {}
  if (window.MatrixCloud?.user) {
    window.MatrixCloud.push(state);
    window.MatrixCloud.saveProfile({ build: summarizeBuildForProfile() });
  }
}

window.addEventListener('beforeunload', saveState);
setInterval(saveState, CFG.SAVE_INTERVAL_MS);
