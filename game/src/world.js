// SOLARIS BAY: GOLDEN HEAT — City Layout, Collisions, Traffic AI, Pedestrians & Vehicles
import { WORLD, VEHICLES, LANDMARKS, STUNT_RAMPS, getDistrictAt } from './config.js';
function seeded(n) {
 const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
 return x - Math.floor(x);
}
const ART_DECO_PALETTES = [
 [0.98, 0.74, 0.66], // coral peach
 [0.98, 0.86, 0.70], // warm cream
 [0.64, 0.90, 0.84], // mint pastel
 [0.86, 0.74, 0.94], // sunset lavender
 [0.98, 0.64, 0.72], // flamingo pink
 [0.64, 0.84, 0.96], // sky turquoise
];
const NEON_COLORS = [
 [1.0, 0.25, 0.62], // hot pink
 [0.18, 0.92, 1.0], // electric cyan
 [1.0, 0.78, 0.22], // solaris gold
 [0.32, 0.98, 0.68], // mint neon
];
let nextVehId = 1;
export function createVehicle(typeId, x, z, angle, opts = {}) {
 const spec = VEHICLES[typeId] || VEHICLES.corsa_coupe;
 return {
  id: nextVehId++,
  typeId: spec.id,
  spec,
  x,
  y: 0,
  vy: 0,
  z,
  angle,
  speed: opts.speed || 0,
  steerAngle: 0,
  hp: spec.maxHp,
  maxHp: spec.maxHp,
  color: opts.color ? [...opts.color] : [...spec.color],
  isPlayerOwned: !!opts.isPlayerOwned,
  isPolice: !!spec.police,
  aiMode: opts.aiMode || 'traffic', // 'player' | 'traffic' | 'parked' | 'police' | 'roadblock' | 'mission'
  braking: false,
  drifting: false,
  boosting: false,
  boost: 100,
  destroyed: false,
  laneAxis: opts.laneAxis || 'z',
  laneDir: opts.laneDir || 1,
  callsign: opts.callsign || null,
  status: opts.status || 'PURSUIT',
  airTime: 0,
 };
}
export class World {
 constructor() {
  this.buildings = [];
  this.palms = [];
  this.vehicles = [];
  this.peds = [];
  this._generateCity();
  this._spawnInitialEntities();
 }
 _generateCity() {
  let seed = 1;
  const xs = [-262, -157, -52, 52];
  const zs = [-262, -157, -52, 52, 157, 262];
  for (const bx of xs) {
   for (const bz of zs) {
    // Reserve space around Solis Customs garage and Palmetto safehouse
    if (Math.hypot(bx - LANDMARKS.garage.x, bz - LANDMARKS.garage.z) < 44) continue;
    if (Math.hypot(bx - LANDMARKS.safehouse.x, bz - LANDMARKS.safehouse.z) < 38) continue;
    const dist = getDistrictAt(bx, bz).id;
    // 2x2 sub-buildings per city block
    const offsets = [[-19, -19], [19, -19], [-19, 19], [19, 19]];
    for (const [ox, oz] of offsets) {
     seed++;
     const cx = bx + ox;
     const cz = bz + oz;
     if (Math.hypot(cx - LANDMARKS.garage.x, cz - LANDMARKS.garage.z) < 28) continue;
     const r1 = seeded(seed), r2 = seeded(seed + 19), r3 = seeded(seed + 41);
     let w = 22 + r1 * 11;
     let d = 22 + r2 * 11;
     let h = 14 + r3 * 24;
     let color = ART_DECO_PALETTES[seed % ART_DECO_PALETTES.length];
     let trim = [0.98, 0.94, 0.88];
     let neon = NEON_COLORS[seed % NEON_COLORS.length];
     let style = 'deco';
     let hasNeon = r1 > 0.35;
     if (dist === 'neon') {
      h = 24 + r3 * 34;
      hasNeon = true;
      style = 'neon';
     } else if (dist === 'malecon' || dist === 'marina') {
      h = 16 + r3 * 26;
      hasNeon = r2 > 0.25;
      style = 'deco';
     } else if (dist === 'docks') {
      w = 26 + r1 * 8;
      d = 18 + r2 * 10;
      h = 9 + r3 * 9;
      color = seed % 2 === 0 ? [0.42, 0.46, 0.52] : [0.76, 0.44, 0.24];
      style = 'dock';
      hasNeon = false;
     } else if (dist === 'palmetto') {
      w = 20 + r1 * 8;
      d = 18 + r2 * 8;
      h = 8 + r3 * 7;
      color = [0.96, 0.91, 0.84];
      trim = [0.84, 0.42, 0.28];
      style = 'villa';
      hasNeon = false;
     }
     this.buildings.push({ x: cx, z: cz, w, d, h, color, trim, neon, style, hasNeon, seed });
    }
   }
  }
  // Curved 3D Palm Trees along Malecón del Sol, beach, Coral Marina & boulevards
  let pSeed = 200;
  for (let z = -290; z <= 270; z += 24) {
   if (Math.abs(z % 105) < 16) continue;
   pSeed++;
   // East side of Malecón Blvd
   this.palms.push({
    x: 122 + (seeded(pSeed) - 0.5) * 3,
    z,
    h: 9.5 + seeded(pSeed + 5) * 4.5,
    leanX: 1.6 + seeded(pSeed + 9) * 1.4,
    leanZ: (seeded(pSeed + 13) - 0.5) * 1.6,
   });
   // Beach palms
   this.palms.push({
    x: 156 + seeded(pSeed + 21) * 18,
    z: z + 9,
    h: 8.5 + seeded(pSeed + 29) * 4.0,
    leanX: 2.0 + seeded(pSeed + 33) * 1.4,
    leanZ: (seeded(pSeed + 37) - 0.5) * 1.8,
   });
   // West side of Malecón Blvd
   if (z % 48 === 0) {
    this.palms.push({
     x: 88,
     z,
     h: 9.0 + seeded(pSeed + 45) * 3.5,
     leanX: -1.2,
     leanZ: 0.6,
    });
   }
  }
  // Neon Strip & Palmetto palms
  for (const ax of [-105, 0]) {
   for (let z = -250; z <= 250; z += 44) {
    if (Math.abs(z % 105) < 18) continue;
    this.palms.push({ x: ax + 16.5, z, h: 9.2, leanX: 0.9, leanZ: 0.5 });
   }
  }
 }
 _spawnInitialEntities() {
  // Player's signature Solis GT parked on Malecón del Sol
  this.playerStartCar = createVehicle('solis_gt', 108, 42, Math.PI, {
   isPlayerOwned: true,
   aiMode: 'parked',
  });
  this.vehicles.push(this.playerStartCar);
  // Extra parked cars at landmarks
  this.vehicles.push(createVehicle('corsa_coupe', 94, 152, Math.PI * 0.5, { aiMode: 'parked' }));
  this.vehicles.push(createVehicle('harbor_cruiser', -154, -196, 0, { aiMode: 'parked' }));
  this.vehicles.push(createVehicle('solis_gt', -8, 18, Math.PI, { aiMode: 'parked', color: [0.16, 0.84, 0.94] }));
  // Civilian traffic cars along avenues & streets
  const civTypes = ['corsa_coupe', 'harbor_cruiser', 'solis_gt'];
  const civColors = [
   [0.20, 0.82, 0.92], [0.98, 0.72, 0.24], [0.95, 0.96, 0.98],
   [0.86, 0.34, 0.88], [0.24, 0.88, 0.62], [0.96, 0.44, 0.32],
  ];
  for (let i = 0; i < 16; i++) {
   const onAve = i % 2 === 0;
   const type = civTypes[i % civTypes.length];
   const col = civColors[i % civColors.length];
   if (onAve) {
    const ax = WORLD.avenuesX[i % WORLD.avenuesX.length];
    const dir = i % 4 < 2 ? 1 : -1;
    const z = -220 + ((i * 53) % 440);
    this.vehicles.push(createVehicle(type, ax + dir * 5.2, z, dir > 0 ? 0 : Math.PI, {
     color: col,
     laneAxis: 'z',
     laneDir: dir,
     speed: 14,
     aiMode: 'traffic',
    }));
   } else {
    const sz = WORLD.streetsZ[i % WORLD.streetsZ.length];
    const dir = i % 4 < 2 ? 1 : -1;
    const x = -220 + ((i * 61) % 320);
    this.vehicles.push(createVehicle(type, x, sz - dir * 5.2, dir > 0 ? Math.PI * 0.5 : -Math.PI * 0.5, {
     color: col,
     laneAxis: 'x',
     laneDir: dir,
     speed: 13,
     aiMode: 'traffic',
    }));
   }
  }
  // Sidewalk pedestrians
  const shirts = [
   [0.98, 0.52, 0.42], [0.22, 0.86, 0.88], [0.98, 0.84, 0.32],
   [0.88, 0.42, 0.92], [0.96, 0.96, 0.98], [0.32, 0.88, 0.56],
  ];
  for (let i = 0; i < 24; i++) {
   const ax = WORLD.avenuesX[i % WORLD.avenuesX.length];
   const side = i % 2 === 0 ? 15.2 : -15.2;
   const z = -240 + ((i * 39) % 480);
   this.peds.push({
    x: ax + side,
    y: 0,
    z,
    angle: i % 2 === 0 ? 0 : Math.PI,
    speed: 2.3 + (i % 3) * 0.5,
    hp: 40,
    moving: true,
    fleeTimer: 0,
    phase: i * 0.9,
    torso: shirts[i % shirts.length],
    pants: [0.18, 0.22, 0.30],
    skin: [0.82, 0.58, 0.42],
   });
  }
 }
 resolveBuildingCollision(x, z, radius) {
  let rx = x, rz = z, hit = false;
  // Clamp to Solaris Bay bounds (west edge & ocean edge)
  if (rx < WORLD.minX + 10) { rx = WORLD.minX + 10; hit = true; }
  if (rx > WORLD.oceanX - 6) { rx = WORLD.oceanX - 6; hit = true; }
  if (rz < WORLD.minZ + 10) { rz = WORLD.minZ + 10; hit = true; }
  if (rz > WORLD.maxZ - 10) { rz = WORLD.maxZ - 10; hit = true; }
  for (const b of this.buildings) {
   const hw = b.w * 0.5 + radius;
   const hd = b.d * 0.5 + radius;
   const dx = rx - b.x;
   const dz = rz - b.z;
   if (Math.abs(dx) < hw && Math.abs(dz) < hd) {
    hit = true;
    const ox = hw - Math.abs(dx);
    const oz = hd - Math.abs(dz);
    if (ox < oz) rx += dx >= 0 ? ox : -ox;
    else rz += dz >= 0 ? oz : -oz;
   }
  }
  return { x: rx, z: rz, hit };
 }
 findNearestVehicle(x, z, maxDist = 7.5) {
  let best = null, bestD = maxDist;
  for (const v of this.vehicles) {
   if (v.destroyed) continue;
   const d = Math.hypot(v.x - x, v.z - z);
   if (d < bestD) { bestD = d; best = v; }
  }
  return best;
 }
 update(dt, state) {
  // Update civilian traffic AI
  for (const v of this.vehicles) {
   if (v.destroyed || v.aiMode !== 'traffic') continue;
   const fx = Math.sin(v.angle), fz = Math.cos(v.angle);
   let blocked = false;
   // Check obstacle ahead (player or other vehicles)
   for (const o of this.vehicles) {
    if (o === v || o.destroyed) continue;
    const dx = o.x - v.x, dz = o.z - v.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 11 && (dx * fx + dz * fz) > 2) { blocked = true; break; }
   }
   const targetSpd = blocked ? 0 : 14.5;
   v.speed += (targetSpd - v.speed) * Math.min(1, dt * 4);
   v.braking = blocked;
   v.x += fx * v.speed * dt;
   v.z += fz * v.speed * dt;
   // Wrap smoothly at city edges
   if (v.laneAxis === 'z') {
    if (v.z > 295) v.z = -295;
    if (v.z < -295) v.z = 295;
   } else {
    if (v.x > 118) v.x = -270;
    if (v.x < -275) v.x = 112;
   }
  }
  // Update pedestrians
  for (const p of this.peds) {
   if (p.hp <= 0) continue;
   if (p.fleeTimer > 0) {
    p.fleeTimer -= dt;
    const dx = p.x - state.player.x, dz = p.z - state.player.z;
    p.angle = Math.atan2(dx, dz);
    p.x += Math.sin(p.angle) * 5.8 * dt;
    p.z += Math.cos(p.angle) * 5.8 * dt;
   } else {
    p.z += Math.cos(p.angle) * p.speed * dt;
    if (p.z > 280) p.angle = Math.PI;
    if (p.z < -280) p.angle = 0;
   }
   const col = this.resolveBuildingCollision(p.x, p.z, 0.7);
   p.x = col.x; p.z = col.z;
  }
  // Stunt ramp check for player's vehicle
  const pv = state.player.vehicle;
  if (pv) {
   let onRamp = false;
   for (const r of STUNT_RAMPS) {
    const dx = pv.x - r.x, dz = pv.z - r.z;
    const ca = Math.cos(-r.angle), sa = Math.sin(-r.angle);
    const lx = dx * ca - dz * sa, lz = dx * sa + dz * ca;
    if (Math.abs(lx) < r.w * 0.55 && Math.abs(lz) < r.len * 0.52) {
     onRamp = true;
     const t = (lz + r.len * 0.5) / r.len;
     const rampY = Math.max(0, t * r.h);
     if (pv.y < rampY) pv.y = rampY;
     if (t > 0.78 && Math.abs(pv.speed) > 22 && pv.vy < 4) {
      pv.vy = Math.min(13, Math.abs(pv.speed) * 0.24);
     }
    }
   }
   if (!onRamp || pv.vy > 0) {
    if (pv.y > 0 || pv.vy > 0) {
     pv.vy -= 22 * dt;
     pv.y += pv.vy * dt;
     pv.airTime += dt;
     if (pv.y <= 0) {
      pv.y = 0;
      pv.vy = 0;
      if (pv.airTime > 0.65) {
       const bonus = Math.round(pv.airTime * 450);
       state.player.cash += bonus;
       state.player.respect += 35;
       state.ui.showBanner('STUNT JUMP', `+$${bonus} BONUS`, `${pv.airTime.toFixed(1)}s AIRTIME · +35 REP`, 2.4);
      }
      pv.airTime = 0;
     }
    }
   }
  }
 }
}
