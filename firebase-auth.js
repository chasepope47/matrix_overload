import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, collection, getDocs,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';

function getFirebaseConfig() {
  if (window.__FIREBASE_CONFIG__) return window.__FIREBASE_CONFIG__;
  return {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_AUTH_DOMAIN',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_STORAGE_BUCKET',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID',
  };
}

const firebaseConfig = getFirebaseConfig();
window.__FIREBASE_CONFIG__ = firebaseConfig;

const fbApp = initializeApp(firebaseConfig);
const fbAuth = getAuth(fbApp);
const fbDb = getFirestore(fbApp);

window.MatrixCloud = {
  user: null,
  listeners: [],
  onChange(cb) { this.listeners.push(cb); },
  signUp(email, password) {
    return createUserWithEmailAndPassword(fbAuth, email, password).then(c => c.user);
  },
  signIn(email, password) {
    return signInWithEmailAndPassword(fbAuth, email, password).then(c => c.user);
  },
  signOutUser() { return signOut(fbAuth); },
  push(state) {
    if (!this.user) return Promise.resolve();
    return setDoc(doc(fbDb, 'saves', this.user.uid), state).catch(() => {});
  },
  pull() {
    if (!this.user) return Promise.resolve(null);
    return getDoc(doc(fbDb, 'saves', this.user.uid))
      .then(snap => snap.exists() ? snap.data() : null)
      .catch(() => null);
  },
  saveProfile(profile) {
    if (!this.user) return Promise.resolve();
    return setDoc(doc(fbDb, 'profiles', this.user.uid), {
      uid: this.user.uid,
      email: this.user.email || '',
      updatedAt: Date.now(),
      ...profile,
    }, { merge: true }).catch(() => {});
  },
  async getProfile(uid) {
    if (!uid) return null;
    try {
      const snap = await getDoc(doc(fbDb, 'profiles', uid));
      return snap.exists() ? snap.data() : null;
    } catch (_) {
      return null;
    }
  },
  async listPublicProfiles() {
    try {
      const snap = await getDocs(collection(fbDb, 'profiles'));
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => p.publicProfile !== false)
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .slice(0, 20);
    } catch (_) {
      return [];
    }
  },
  async createParty() {
    if (!this.user) return null;
    const code = `MTR${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const party = {
      code,
      members: [{ uid: this.user.uid, email: this.user.email || '' }],
      updatedAt: Date.now(),
    };
    await setDoc(doc(fbDb, 'parties', code), party, { merge: true });
    await this.saveProfile({ partyCode: code });
    return code;
  },
  async joinParty(code) {
    if (!this.user || !code) return null;
    const ref = doc(fbDb, 'parties', code);
    try {
      const snap = await getDoc(ref);
      const existing = (snap.exists() ? snap.data().members : []) || [];
      const filtered = existing.filter(member => member.uid !== this.user.uid);
      filtered.push({ uid: this.user.uid, email: this.user.email || '' });
      await setDoc(ref, { code, members: filtered, updatedAt: Date.now() }, { merge: true });
      await this.saveProfile({ partyCode: code });
      return code;
    } catch (_) {
      return null;
    }
  },
  async getParty(code) {
    if (!code) return null;
    try {
      const snap = await getDoc(doc(fbDb, 'parties', code));
      return snap.exists() ? snap.data() : null;
    } catch (_) {
      return null;
    }
  },
};

onAuthStateChanged(fbAuth, user => {
  window.MatrixCloud.user = user;
  for (const cb of window.MatrixCloud.listeners) cb(user);
});
