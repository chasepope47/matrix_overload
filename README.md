# Matrix Overload

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

Progress saves automatically every 10 seconds and on tab close via localStorage.

## Running

Open index.html in any modern browser — no build step, no npm, no internet required.