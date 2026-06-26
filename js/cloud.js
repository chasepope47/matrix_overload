// ── Issue #4 – Game UI & Performance ──
// Firebase authentication, cloud save sync, account & community panels
import { state, saveState, summarizeBuildForProfile } from './state.js';

export function friendlyAuthError(e) {
  const code = (e && e.code) || '';
  if (code.includes('email-already-in-use'))
    return 'That email is already registered — try logging in.';
  if (code.includes('invalid-email'))
    return 'Enter a valid email address.';
  if (code.includes('weak-password'))
    return 'Password must be at least 6 characters.';
  if (code.includes('wrong-password') || code.includes('invalid-credential'))
    return 'Wrong email or password.';
  if (code.includes('user-not-found'))
    return 'No account with that email — try signing up.';
  return 'Something went wrong. Try again.';
}

export async function syncFromCloud() {
  const cloud = await window.MatrixCloud.pull();
  if (cloud && (cloud.lastSaved || 0) > (state.lastSaved || 0)) {
    try { localStorage.setItem('matrix_save', JSON.stringify(cloud)); } catch (_) {}
    location.reload();
  } else {
    saveState();
  }
}

export function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function renderCommunityProfiles() {
  const listEl = document.getElementById('acct-community-list');
  if (!listEl) return;
  const profiles = await window.MatrixCloud.listPublicProfiles();
  if (!profiles.length) {
    listEl.innerHTML = '<div class="profile-empty">No public profiles yet. Save yours to appear here.</div>';
    return;
  }
  listEl.innerHTML = profiles.map(profile => {
    const build    = profile.build || {};
    const upgrades = Object.entries(build.upgrades || {})
      .slice(0, 4)
      .map(([id, lvl]) => `<span class="profile-tag">${escapeHtml(id.replace(/_/g, ' '))} ${lvl}</span>`)
      .join('');
    return `
      <div class="profile-card">
        <div class="profile-name">${escapeHtml(profile.displayName || profile.email || 'Builder')}</div>
        <div class="profile-meta">Stage ${escapeHtml(build.stage || 1)} • ${escapeHtml(build.resources || 0)} resources</div>
        <div class="profile-bio">${escapeHtml(profile.bio || 'No bio yet')}</div>
        <div class="profile-tags">${upgrades || '<span class="profile-tag">Fresh recruit</span>'}</div>
      </div>
    `;
  }).join('');
}

export async function renderPartyMembers(code) {
  const partyEl = document.getElementById('acct-party-members');
  if (!partyEl) return;
  if (!code) {
    partyEl.innerHTML = '<div class="profile-empty">Create or join a party to team up.</div>';
    return;
  }
  const party   = await window.MatrixCloud.getParty(code);
  const members = party?.members || [];
  if (!members.length) {
    partyEl.innerHTML = '<div class="profile-empty">Your party is waiting for a teammate.</div>';
    return;
  }
  partyEl.innerHTML = members.map(m =>
    `<div class="profile-card"><div class="profile-name">${escapeHtml(m.email || 'Builder')}</div><div class="profile-meta">Party member</div></div>`
  ).join('');
}

export function buildAccountPanel() {
  const panel = document.getElementById('panel-account');
  const user  = window.MatrixCloud.user;
  if (user) {
    panel.innerHTML = `
      <div class="acct-row"><span class="acct-label">Signed in as</span><span class="acct-value">${escapeHtml(user.email || 'player')}</span></div>
      <div class="acct-row"><span style="color:#666">Progress syncs to the cloud automatically and your build shows up for other players.</span></div>
      <label class="acct-label" for="acct-display-name">Display name</label>
      <input class="acct-input" id="acct-display-name" maxlength="24" placeholder="Your alias">
      <label class="acct-label" for="acct-bio">Bio</label>
      <textarea class="acct-textarea" id="acct-bio" maxlength="140" placeholder="Tell the crew about your build"></textarea>
      <label class="acct-check-row"><input type="checkbox" id="acct-public"> Show my profile publicly</label>
      <div class="acct-btn-row">
        <button class="modal-btn" id="acct-save-profile">Save Profile</button>
        <button class="modal-btn" id="acct-signout-btn">Sign Out</button>
      </div>
      <div class="acct-error" id="acct-error"></div>
      <div class="party-row">
        <input class="acct-input" id="acct-party-code" maxlength="12" placeholder="Party code">
        <button class="modal-btn" id="acct-create-party">Create Party</button>
        <button class="modal-btn" id="acct-join-party">Join Party</button>
      </div>
      <div class="community-section">
        <div class="acct-label">Current party</div>
        <div id="acct-party-members"></div>
      </div>
      <div class="community-section">
        <div class="acct-label">Community builds</div>
        <div id="acct-community-list" class="community-list"></div>
      </div>
    `;
    const displayNameEl = document.getElementById('acct-display-name');
    const bioEl         = document.getElementById('acct-bio');
    const publicEl      = document.getElementById('acct-public');
    const errEl         = document.getElementById('acct-error');
    const partyCodeEl   = document.getElementById('acct-party-code');

    window.MatrixCloud.getProfile(user.uid).then(profile => {
      if (!profile) return;
      displayNameEl.value  = profile.displayName || '';
      bioEl.value          = profile.bio || '';
      publicEl.checked     = profile.publicProfile !== false;
      partyCodeEl.value    = profile.partyCode || '';
      renderPartyMembers(profile.partyCode || '');
    });

    document.getElementById('acct-save-profile').addEventListener('click', async () => {
      errEl.textContent = '';
      try {
        await window.MatrixCloud.saveProfile({
          displayName:   displayNameEl.value.trim(),
          bio:           bioEl.value.trim(),
          publicProfile: publicEl.checked,
          build:         summarizeBuildForProfile(),
        });
        errEl.textContent = 'Profile saved.';
        await renderCommunityProfiles();
      } catch (_) {
        errEl.textContent = 'Could not save your profile.';
      }
    });

    document.getElementById('acct-signout-btn').addEventListener('click', () =>
      window.MatrixCloud.signOutUser()
    );
    document.getElementById('acct-create-party').addEventListener('click', async () => {
      const code = await window.MatrixCloud.createParty();
      if (code) { partyCodeEl.value = code; await renderPartyMembers(code); }
    });
    document.getElementById('acct-join-party').addEventListener('click', async () => {
      const code = partyCodeEl.value.trim().toUpperCase();
      if (!code) return;
      const joined = await window.MatrixCloud.joinParty(code);
      if (joined) { partyCodeEl.value = joined; await renderPartyMembers(joined); }
    });

    renderCommunityProfiles();
  } else {
    panel.innerHTML = `
      <div class="acct-form">
        <input type="email"    id="acct-email"    placeholder="email"    autocomplete="email">
        <input type="password" id="acct-password" placeholder="password" autocomplete="current-password">
        <div class="acct-btn-row">
          <button class="modal-btn" id="acct-signin-btn">Log In</button>
          <button class="modal-btn" id="acct-signup-btn">Sign Up</button>
        </div>
      </div>
      <div class="acct-error" id="acct-error"></div>
    `;
    const emailEl = document.getElementById('acct-email');
    const passEl  = document.getElementById('acct-password');
    const errEl   = document.getElementById('acct-error');
    document.getElementById('acct-signin-btn').addEventListener('click', async () => {
      errEl.textContent = '';
      try { await window.MatrixCloud.signIn(emailEl.value.trim(), passEl.value); }
      catch (e) { errEl.textContent = friendlyAuthError(e); }
    });
    document.getElementById('acct-signup-btn').addEventListener('click', async () => {
      errEl.textContent = '';
      try { await window.MatrixCloud.signUp(emailEl.value.trim(), passEl.value); }
      catch (e) { errEl.textContent = friendlyAuthError(e); }
    });
  }
}

export function updateAuthScreen(user) {
  const authScreen = document.getElementById('auth-screen');
  if (!authScreen) return;
  authScreen.classList.toggle('hidden', !!user);
}

export function bindAuthScreen() {
  const emailEl = document.getElementById('auth-email');
  const passEl  = document.getElementById('auth-password');
  const errEl   = document.getElementById('auth-error');
  document.getElementById('auth-signin-btn').addEventListener('click', async () => {
    errEl.textContent = '';
    try { await window.MatrixCloud.signIn(emailEl.value.trim(), passEl.value); }
    catch (e) { errEl.textContent = friendlyAuthError(e); }
  });
  document.getElementById('auth-signup-btn').addEventListener('click', async () => {
    errEl.textContent = '';
    try { await window.MatrixCloud.signUp(emailEl.value.trim(), passEl.value); }
    catch (e) { errEl.textContent = friendlyAuthError(e); }
  });
  document.getElementById('auth-guest-btn').addEventListener('click', () => updateAuthScreen(null));
}

// Wire up Firebase auth state listener
window.MatrixCloud.onChange(user => {
  buildAccountPanel();
  updateAuthScreen(user);
  if (user) syncFromCloud();
});
