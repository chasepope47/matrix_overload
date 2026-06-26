# Matrix Overload
https://matrix-overload.web.app/


A browser-based, offline-capable horde clicker game. No server, no dependencies — open `index.html` directly.

## How to Play

- **Click / tap** enemies on the canvas to deal damage. Your click hits all enemies within the blast radius.
- Kill **12 common enemies** per stage to spawn the boss. Kill the boss to advance.
- **Elites** spawn every 10 common kills as mid-stage threats.
- Earn resources per kill and spend them in the **Upgrades** tab.

## Controls

| Input | Action |
|-------|--------|
| Click / tap canvas | AoE damage in radius |
| Upgrades tab → buy card | Spend resources on a permanent upgrade |
| Wave Burst card (orange) | Active ability — clears 20% of enemies; 15 s cooldown |

## Upgrades

| Upgrade | Effect |
|---------|--------|
| Click Force | Multiplies click damage x1.14 per tier |
| Auto Drone | Passive DPS, x1.14 per tier (also earns while offline) |
| Blast Zone | +8 px AoE radius per tier |
| Critical Hit | +6% crit chance per tier (crits deal 3x damage) |
| Wave Burst | Active ability — buy once to unlock, then press to use |
| Loot Boost | Resources per kill x1.25 per tier |

## Offline Progress

Close the tab and return later. The Auto Drone upgrade earns resources while you are away (capped at 12 hours). An earnings modal appears on your next visit.

Progress always saves to localStorage every 10 seconds and on tab close, so the game works fully offline with no account.

## Accounts & Cloud Saves

The **Account** tab lets a player sign up / log in with email + password to back up their save to the cloud (Firebase Auth + Firestore) and pick it up on another device. Playing as a guest (no account) still works exactly as before — it's purely additive.

To enable it, you need your own Firebase project:

1. Go to the [Firebase console](https://console.firebase.google.com/), click **Add project**, and create one (the free Spark plan is enough).
2. In the project, go to **Build → Authentication → Get started**, and enable the **Email/Password** sign-in provider.
3. Go to **Build → Firestore Database → Create database**, and start it in production mode (any region).
4. Once created, open the Firestore **Rules** tab and replace the default rules with:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /saves/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
       match /profiles/{uid} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.uid == uid;
       }
       match /parties/{partyId} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```
   This ensures a player can only read/write their own save document while allowing public profile and party visibility.
5. Go to **Project settings → General → Your apps**, click the web icon (`</>`) to register a web app, and copy the `firebaseConfig` object it gives you.
6. Paste those values into the `firebaseConfig` object near the top of the first `<script type="module">` block in `index.html`.

Once configured, signing up stores the player's current progress in Firestore under `saves/{uid}`, and it auto-syncs every 10 seconds and on tab close — same cadence as the local save.

## Running

Open index.html in any modern browser — no build step, no npm. An internet connection is only needed for the optional cloud-account features; the core game runs entirely offline.