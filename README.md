# SOLARIS BAY: GOLDEN HEAT

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/rey007123/gta6-01/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/rey007123/gta6-01/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

Built for the [make.fun `gta6-01` bounty](https://make.fun/bounty/gta6-01).

A 100% original, zero-dependency, offline WebGL2 coastal open-world crime sandbox set in **Solaris Bay** at golden hour.

## World & Original Cast

- **City**: Solaris Bay — five distinct districts:
  - **Malecón del Sol** — Sun-soaked oceanfront Art-Deco promenade, palm-lined wet asphalt, and golden beach.
  - **Coral Marina** — Turquoise piers, luxury yachts, and **Solis Customs** garage & respray bay.
  - **Neon Strip** — Downtown pastel towers, lit window grids, and vibrant nightlife signage.
  - **Industrial Docks** — Cargo cranes, shipping warehouses, and Pier 9.
  - **Palmetto Heights** — Hilltop stucco villas and the Palmetto Villa safehouse.
- **Characters**: **Rafael** (protagonist), **Elena** (driver / fixer), and **Mateo** (docklands contact).
- **Vehicles**: **Solis GT** (sports car), **Corsa Coupe** (street coupe), **SBPD Interceptor** (police cruiser), **Harbor Cruiser** (sedan), and **SBPD Air-1** (police helicopter with volumetric spotlight).
- **Radio Stations** (Web Audio API synth): **SOLARIS 98.7**, **BAYSIDE FM**, and **NEON PULSE 104.3**.
- **Weapons**: Fists, Viper 9mm, Cobra SMG, Breaker Shotgun, and Horizon Rifle.

## Controls

| Input | Action |
|---|---|
| `W / A / S / D` or Arrow Keys | Drive / Move on foot |
| `SPACE` | Handbrake Drift (in car) / Sprint (on foot) |
| `SHIFT` | Nitro Boost |
| `E` or `F` | Enter / Exit / Carjack nearest vehicle |
| `Mouse Move` + `Left Click` (or `J`) | Aim & Fire active weapon |
| `1 – 5` or `Q` | Switch weapon slot |
| `R` | Cycle Radio Station |
| `G` | Enter Solis Customs Garage (when near bay) |
| `K` | Quick-Save to Slot 1 (also restores vitals at Palmetto Villa) |
| `M` or `ESC` | Pause, Interactive City Map, 8-Mission Campaign & Save/Load |

## Architecture

Pure zero-dependency ES modules under `game/` with zero external network requests:

- `game/index.html` & `game/styles.css` — Layout and high-contrast golden-hour HUD, Solis Customs garage, and City Network overlays.
- `game/src/config.js` — Districts, road grid, landmarks, stunt ramps, vehicle specs, weapons, radio stations, character palettes, and Solis Customs upgrades.
- `game/src/renderer3d.js` — Custom WebGL2 3D engine: sunset sky dome with sun disc & clouds, shimmering turquoise ocean, wet-asphalt specular boulevard, Art-Deco buildings with lit windows & neon, curved 3D palm trees, multi-part vehicles with flashing SBPD lightbars, hovering SBPD Air-1 helicopter with spinning rotor & volumetric spotlight cone, articulated characters, tracers, sparks, smoke, and beacons.
- `game/src/world.js` — Procedural city blocks, AABB collisions, civilian traffic AI, sidewalk pedestrians, carjacking, and stunt ramp airtime physics.
- `game/src/police.js` — 5-star wanted escalation, line-of-sight `IN SIGHT` / `EVADING` detection, live SBPD dispatch roster (`RAMMING`, `PURSUIT`, `SPOTLIGHT`, `ROADBLOCK`, `FIRING`), roadblocks, and Air-1 pursuit.
- `game/src/missions.js` — 8-mission original story campaign with staged waypoints, timers, rewards, and character dialogue.
- `game/src/combat.js` — On-foot movement, 5-slot weapon wheel, ballistic hit detection, tracers, particles, hostile/SWAT AI, and health/armor recovery.
- `game/src/audio.js` — Procedural Web Audio API radio sequencer, engine rev, police sirens, gunfire, and chimes.
- `game/src/hud.js` — Circular rotating minimap, live dispatch panel, portrait renderer, garage UI, interactive 2D City Map, and LocalStorage Save/Load slots.
- `game/src/main.js` — Fixed-timestep simulation loop, input handling, LocalStorage persistence, and `?shot=chase|combat|garage|map` live showcase hooks.

## Running Locally

```bash
node serve.ts
# Open http://localhost:8080
```

Build deterministic make.fun output:

```bash
MAKEFUN_OUTPUT_DIR=out node main.ts
```
