# Matrix Overload
https://matrix-overload.web.app/


A browser-based, offline-capable horde clicker game. No server, no dependencies — open `index.html` directly.

## How to Play

- A square **follows your cursor (or finger)** over the canvas and automatically ticks damage into any enemy inside it — no clicking required, just hover over the fight.
- **You are the circle at the center of the screen.** Enemies that reach you deal damage to your HP bar for as long as they're touching you — keep the hover-square on them to clear them off before your HP runs out.
- If your HP hits 0, the current wave resets (enemies clear, HP refills) — you never lose resources, upgrades, or gear.
- Kill **12 common enemies** per stage to spawn the boss. Kill the boss to advance.
- **Elites** spawn every 10 common kills as mid-stage threats.
- Earn resources per kill and spend them in the **Upgrades** tab.
- Kills have a chance to drop **Weapons and Armor** — the item lands on the field where the enemy died, and you have to hover your square over it to pick it up. Open the **Gear** tab to manage your collection.

## Controls

| Input | Action |
|-------|--------|
| Move mouse / drag finger over canvas | Square follows and ticks damage into anything inside it |
| Upgrades tab → buy card | Spend resources on a permanent upgrade |
| Wave Burst card (orange) | Active ability — clears 20% of enemies; 15 s cooldown |

## Upgrades

| Upgrade | Effect |
|---------|--------|
| Turret Speed | Faster damage ticks per tier (shorter interval between hits) |
| Auto Drone | Passive DPS, x1.14 per tier (also earns while offline) |
| Square Size | +6 px per tier to the hover square's side length |
| Critical Hit | +6% crit chance per tier (crits deal 3x damage) |
| Wave Burst | Active ability — buy once to unlock, then press to use |
| Loot Boost | Resources per kill x1.25 per tier |

## Equipment

Killing enemies has a chance to drop gear. The item drops on the ground at the kill location as a small rarity-colored diamond — hover your square over it like you would an enemy to pick it up into your inventory (if your inventory is full, it stays on the ground until you make room). Open the **Gear** tab to manage what you've collected. There are 5 slots: **Weapon**, Helmet, Chest, Gloves, Boots.

- **Rarity** (Common → Rare → Epic → Legendary → Mythic) determines how strong an item's rolled stats are, and how likely it is to drop. Boss kills are guaranteed to drop something, with much better odds at the higher tiers (plus a 35% chance of a second bonus drop). Mythic is intentionally rare — only about 0.5% of common-kill drops (1.5% from elites, 3% from bosses) — so getting one feels like an event: the screen flashes and shakes, and a bigger announcement plays. Legendary drops get a smaller version of the same treatment.
- **Weapons** roll a damage bonus added on top of your base hit damage — this fully replaces the old "Impact Force" upgrade, so gear is now your only source of more damage. Epic+ weapons can also roll elemental effects:
  - **Lightning** — chains a hit to a nearby enemy.
  - **Fire** — applies a burn that keeps ticking damage for a few seconds.
  - **Lifesteal** — heals you for a percentage of damage dealt.
  
  Epic rolls 1 effect, Legendary rolls 1 stronger effect, Mythic rolls 2.
- **Armor** rolls +Max HP and +Defense (a flat reduction to incoming damage). Every armor piece belongs to one of three sets — **Neon Wraith**, **Chrome Sentinel**, or **Volt Circuit** — each with its own 2-piece and 4-piece bonus, shown in the Gear tab when active.
- **Leveling up gear**: collect 5 copies of the exact same item (same name and level) and hit **Combine All** in the Gear tab to merge them into one item at the next level, boosting its stats. Combining is per-stack — keep feeding it 5 more to level it again.
- **Inventory** is capped at 36 items.
  - **Sort** arranges your inventory by rarity (and level).
  - **Recycle All** salvages every unequipped, unlocked item at once for resources scaled by rarity; you can still salvage a single item one at a time from its detail view.
  - **Shift+click** an item in the grid to lock it — locked items are skipped by both Recycle All and Combine All, so you won't accidentally feed or sell something you're saving up.

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