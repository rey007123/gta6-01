// SOLARIS BAY: GOLDEN HEAT — Main Simulation Loop, Controls, Save/Load & Showcase Hooks
import {
 LANDMARKS, PAINT_SWATCHES, GARAGE_UPGRADES, getDistrictAt,
} from './config.js';
import { Renderer3D } from './renderer3d.js';
import { World, createVehicle } from './world.js';
import { PoliceSystem } from './police.js';
import { MissionManager } from './missions.js';
import { CombatSystem } from './combat.js';
import { AudioEngine } from './audio.js';
import { HudManager } from './hud.js';
const SAVE_PREFIX = 'solaris_bay_save_';
const FIXED_DT = 1 / 60;
const world = new World();
const police = new PoliceSystem();
const missions = new MissionManager();
const combat = new CombatSystem();
const audio = new AudioEngine();
const renderer = new Renderer3D(document.getElementById('gl-canvas'));
renderer.buildStaticCity(world);
const state = {
 mode: 'start', // 'start' | 'play' | 'garage' | 'menu'
 time: 0,
 world,
 police,
 missions,
 combat,
 audio,
 ui: null,
 player: {
  x: 108,
  y: 0,
  z: 42,
  angle: Math.PI,
  hp: 100,
  armor: 80,
  cash: 14500,
  respect: 240,
  weaponIdx: 1,
  moving: false,
  vehicle: world.playerStartCar,
  upgrades: { engine: 1, armor: 1, nitro: 1, tires: 0 },
 },
 keys: Object.create(null),
 mouseDown: false,
 camYawOffset: 0,
 cameraOverride: null,
};
world.playerStartCar.aiMode = 'player';
function readSave(slot) {
 try {
  const raw = localStorage.getItem(SAVE_PREFIX + slot);
  return raw ? JSON.parse(raw) : null;
 } catch {
  return null;
 }
}
function writeSave(slot) {
 const pv = state.player.vehicle || world.playerStartCar;
 const payload = {
  cash: Math.floor(state.player.cash),
  respect: state.player.respect,
  hp: state.player.hp,
  armor: state.player.armor,
  x: state.player.x,
  z: state.player.z,
  angle: state.player.angle,
  upgrades: { ...state.player.upgrades },
  paint: pv ? [...pv.color] : [...PAINT_SWATCHES[0].rgb],
  completed: [...missions.completed],
  district: getDistrictAt(state.player.x, state.player.z).name,
  savedAt: Date.now(),
 };
 try {
  localStorage.setItem(SAVE_PREFIX + slot, JSON.stringify(payload));
 } catch {}
 return payload;
}
function loadSave(slot) {
 const data = readSave(slot);
 if (!data) return false;
 state.player.cash = data.cash ?? 14500;
 state.player.respect = data.respect ?? 240;
 state.player.hp = data.hp ?? 100;
 state.player.armor = data.armor ?? 80;
 state.player.x = data.x ?? 108;
 state.player.z = data.z ?? 42;
 state.player.angle = data.angle ?? Math.PI;
 state.player.upgrades = { engine: 0, armor: 0, nitro: 0, tires: 0, ...(data.upgrades || {}) };
 missions.completed = new Set(data.completed || []);
 if (state.player.vehicle) {
  state.player.vehicle.x = state.player.x;
  state.player.vehicle.z = state.player.z;
  state.player.vehicle.angle = state.player.angle;
  if (data.paint) state.player.vehicle.color = [...data.paint];
 }
 police.clearWanted(state);
 return true;
}
const ui = new HudManager({
 onStart(useContinue) {
  audio.unlock();
  if (useContinue) loadSave(1);
  state.mode = 'play';
  ui.setMode('play', state);
  if (!missions.activeMission) missions.startMission(1, state);
 },
 onCloseMenu() {
  state.mode = 'play';
  ui.setMode('play', state);
 },
 onCloseGarage() {
  state.mode = 'play';
  state.cameraOverride = null;
  ui.setMode('play', state);
 },
 onPreviewPaint(idx) {
  const pv = state.player.vehicle || world.playerStartCar;
  if (pv && PAINT_SWATCHES[idx]) pv.color = [...PAINT_SWATCHES[idx].rgb];
 },
 onRespray(idx) {
  if (state.player.cash < 400) {
   ui.showBanner('SOLIS CUSTOMS', 'INSUFFICIENT CASH', 'NEED $400 FOR RESPRAY', 2.0);
   return;
  }
  state.player.cash -= 400;
  const pv = state.player.vehicle || world.playerStartCar;
  if (pv) {
   pv.color = [...PAINT_SWATCHES[idx].rgb];
   pv.hp = pv.maxHp;
  }
  police.clearWanted(state);
  audio.playChime();
  ui.refreshGarage(state);
  ui.showBanner('SOLIS CUSTOMS', 'FRESH COAT APPLIED', 'WANTED LEVEL CLEARED · HULL REPAIRED', 2.4);
 },
 onBuyUpgrade(id) {
  const spec = GARAGE_UPGRADES.find((u) => u.id === id);
  if (!spec) return;
  const lv = state.player.upgrades[id] || 0;
  if (lv >= spec.maxLevel) return;
  const cost = spec.costs[lv];
  if (state.player.cash < cost) {
   ui.showBanner('SOLIS CUSTOMS', 'INSUFFICIENT CASH', `NEED $${cost.toLocaleString()}`, 2.0);
   return;
  }
  state.player.cash -= cost;
  state.player.upgrades[id] = lv + 1;
  const pv = state.player.vehicle || world.playerStartCar;
  if (pv && id === 'armor') {
   pv.maxHp = Math.round(pv.spec.maxHp * (1 + state.player.upgrades.armor * 0.35));
   pv.hp = pv.maxHp;
  }
  audio.playChime();
  ui.refreshGarage(state);
 },
 onStartMission(mid) {
  missions.startMission(mid, state);
  state.mode = 'play';
  ui.setMode('play', state);
 },
 onSetWaypoint(wx, wz) {
  missions.setCustomWaypoint(wx, wz);
  ui.refreshMenu(state);
 },
 getSaveInfo(slot) {
  const d = readSave(slot);
  if (!d) return null;
  return { cash: d.cash, completed: (d.completed || []).length, district: d.district || 'Solaris Bay' };
 },
 onSaveSlot(slot) {
  writeSave(slot);
  audio.playChime();
  ui.refreshMenu(state);
  ui.showBanner('GAME SAVED', `SLOT 0${slot} UPDATED`, 'STORED IN LOCAL BROWSER STORAGE', 2.0);
 },
 onLoadSlot(slot) {
  if (loadSave(slot)) {
   audio.playChime();
   state.mode = 'play';
   ui.setMode('play', state);
   ui.showBanner('GAME LOADED', `SLOT 0${slot} RESTORED`, 'WELCOME BACK TO SOLARIS BAY', 2.2);
  }
 },
});
state.ui = ui;
if (readSave(1)) {
 document.getElementById('btn-continue').classList.remove('hidden');
}
function toggleVehicle() {
 const p = state.player;
 if (p.vehicle) {
  const v = p.vehicle;
  v.aiMode = 'parked';
  v.speed *= 0.4;
  p.x = v.x - Math.cos(v.angle) * 2.6;
  p.z = v.z + Math.sin(v.angle) * 2.6;
  p.y = 0;
  p.vehicle = null;
 } else {
  const near = world.findNearestVehicle(p.x, p.z, 7.8);
  if (!near) return;
  if (near.aiMode === 'traffic' || near.isPolice) {
   police.addHeat(near.isPolice ? 90 : 35, near.isPolice ? 2 : 1);
   ui.showBanner('CARJACKED', near.spec.name.toUpperCase(), near.isPolice ? 'SBPD CRUISER STOLEN · 2★ HEAT' : 'VEHICLE ACQUIRED', 2.0);
  }
  near.aiMode = 'player';
  p.vehicle = near;
 }
}
function openGarage() {
 const pv = state.player.vehicle || world.playerStartCar;
 if (pv) {
  pv.x = LANDMARKS.garage.x;
  pv.z = LANDMARKS.garage.z;
  pv.angle = 0.42;
  pv.speed = 0;
  state.player.x = pv.x;
  state.player.z = pv.z;
 }
 state.mode = 'garage';
 state.cameraOverride = {
  pos: [LANDMARKS.garage.x + 5.8, 2.6, LANDMARKS.garage.z + 8.6],
  target: [LANDMARKS.garage.x + 1.9, 1.0, LANDMARKS.garage.z - 0.2],
 };
 ui.setMode('garage', state);
}
// Input listeners
window.addEventListener('keydown', (e) => {
 const code = e.code;
 state.keys[code] = true;
 if (state.mode === 'start') return;
 if (code === 'Escape' || code === 'KeyM') {
  if (state.mode === 'garage') {
   state.mode = 'play';
   state.cameraOverride = null;
   ui.setMode('play', state);
  } else if (state.mode === 'menu') {
   state.mode = 'play';
   ui.setMode('play', state);
  } else {
   state.mode = 'menu';
   ui.setMode('menu', state);
   ui.openMenu('map', state);
  }
  return;
 }
 if (state.mode !== 'play') return;
 if (code === 'KeyE' || code === 'KeyF') toggleVehicle();
 if (code === 'KeyR') {
  const rad = audio.cycleRadio();
  ui.showBanner('RADIO TUNED', rad.station, rad.track, 1.8);
 }
 if (code === 'KeyG') {
  const dg = Math.hypot(state.player.x - LANDMARKS.garage.x, state.player.z - LANDMARKS.garage.z);
  if (dg < 22) openGarage();
 }
 if (code === 'KeyK') {
  const ds = Math.hypot(state.player.x - LANDMARKS.safehouse.x, state.player.z - LANDMARKS.safehouse.z);
  if (ds < 20) { state.player.hp = 100; state.player.armor = 100; }
  writeSave(1);
  audio.playChime();
  ui.showBanner('QUICK SAVED', 'SLOT 01 UPDATED', ds < 20 ? 'VITALS RESTORED AT PALMETTO VILLA' : 'PROGRESS STORED', 2.0);
 }
 if (code === 'KeyQ') state.player.weaponIdx = (state.player.weaponIdx + 1) % 5;
 if (code >= 'Digit1' && code <= 'Digit5') state.player.weaponIdx = Number(code.slice(5)) - 1;
});
window.addEventListener('keyup', (e) => { state.keys[e.code] = false; });
window.addEventListener('mousedown', (e) => {
 if (e.button === 0 && state.mode === 'play') {
  audio.unlock();
  state.mouseDown = true;
  combat.firePlayerWeapon(state);
 }
});
window.addEventListener('mouseup', () => { state.mouseDown = false; });
window.addEventListener('mousemove', (e) => {
 if (state.mode === 'play' && !state.player.vehicle) {
  state.player.angle -= e.movementX * 0.0045;
 }
});
function updatePlayer(dt) {
 const k = state.keys;
 const p = state.player;
 const fwd = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
 const turn = (k.KeyA || k.ArrowLeft ? 1 : 0) - (k.KeyD || k.ArrowRight ? 1 : 0);
 if (p.vehicle) {
  const v = p.vehicle;
  const up = p.upgrades;
  const topSpd = v.spec.topSpeed * (1 + up.engine * 0.14);
  const accel = v.spec.accel * (1 + up.engine * 0.14);
  const steerRate = v.spec.steer * (1 + up.tires * 0.12);
  const drift = !!k.Space;
  const boost = !!(k.ShiftLeft || k.ShiftRight) && v.boost > 2 && fwd > 0;
  v.drifting = drift && Math.abs(v.speed) > 14;
  v.boosting = boost;
  v.braking = fwd < 0 && v.speed > 2;
  if (boost) {
   v.boost = Math.max(0, v.boost - 32 * dt);
   v.speed += accel * 0.85 * dt;
  } else {
   v.boost = Math.min(100, v.boost + (10 + up.nitro * 5) * dt);
  }
  if (fwd > 0) v.speed += accel * dt;
  else if (fwd < 0) v.speed -= (v.speed > 0 ? v.spec.brake : accel * 0.65) * dt;
  else v.speed *= Math.pow(0.28, dt);
  const maxV = boost ? topSpd * 1.24 : topSpd;
  v.speed = Math.max(-topSpd * 0.38, Math.min(maxV, v.speed));
  const speedFactor = Math.min(1, Math.abs(v.speed) / 9);
  const dirSign = v.speed >= 0 ? 1 : -1;
  v.angle += turn * steerRate * (v.drifting ? 1.38 : 1.0) * speedFactor * dirSign * dt;
  v.x += Math.sin(v.angle) * v.speed * dt;
  v.z += Math.cos(v.angle) * v.speed * dt;
  const col = world.resolveBuildingCollision(v.x, v.z, 2.0);
  v.x = col.x; v.z = col.z;
  if (col.hit) {
   v.speed *= -0.25;
   v.hp = Math.max(10, v.hp - 6);
  }
  if (v.drifting) {
   combat.addDriftSmoke(v.x - Math.sin(v.angle) * 2.1, v.z - Math.cos(v.angle) * 2.1);
  }
  p.x = v.x; p.y = v.y; p.z = v.z; p.angle = v.angle;
 } else {
  const sprint = k.Space ? 1.55 : 1.0;
  const strafe = (k.KeyA || k.ArrowLeft ? 1 : 0) - (k.KeyD || k.ArrowRight ? 1 : 0);
  const spd = 7.4 * sprint;
  const fx = Math.sin(p.angle), fz = Math.cos(p.angle);
  const rx = Math.cos(p.angle), rz = -Math.sin(p.angle);
  const mx = fx * fwd + rx * strafe;
  const mz = fz * fwd + rz * strafe;
  const ml = Math.hypot(mx, mz);
  p.moving = ml > 0.05;
  if (p.moving) {
   p.x += (mx / ml) * spd * dt;
   p.z += (mz / ml) * spd * dt;
   const col = world.resolveBuildingCollision(p.x, p.z, 0.75);
   p.x = col.x; p.z = col.z;
  }
  if (state.mouseDown || k.KeyJ) combat.firePlayerWeapon(state);
 }
}
function updateCamera(dt) {
 if (state.cameraOverride) {
  renderer.camPos = state.cameraOverride.pos;
  renderer.camTarget = state.cameraOverride.target;
  return;
 }
 const p = state.player;
 if (state.mode === 'start') {
  const a = state.time * 0.14;
  renderer.camPos = [115 + Math.cos(a) * 34, 20, -10 + Math.sin(a) * 34];
  renderer.camTarget = [90, 6, -40];
  return;
 }
 if (p.vehicle) {
  const v = p.vehicle;
  const dist = 10.6 + Math.min(3.5, Math.abs(v.speed) * 0.06);
  const desiredPos = [
   v.x - Math.sin(v.angle) * dist,
   v.y + 4.3,
   v.z - Math.cos(v.angle) * dist,
  ];
  const desiredTgt = [
   v.x + Math.sin(v.angle) * 8,
   v.y + 1.5,
   v.z + Math.cos(v.angle) * 8,
  ];
  for (let i = 0; i < 3; i++) {
   renderer.camPos[i] += (desiredPos[i] - renderer.camPos[i]) * Math.min(1, dt * 8);
   renderer.camTarget[i] += (desiredTgt[i] - renderer.camTarget[i]) * Math.min(1, dt * 10);
  }
 } else {
  const fx = Math.sin(p.angle), fz = Math.cos(p.angle);
  const rx = Math.cos(p.angle), rz = -Math.sin(p.angle);
  const desiredPos = [p.x - fx * 5.2 + rx * 1.15, p.y + 2.45, p.z - fz * 5.2 + rz * 1.15];
  const desiredTgt = [p.x + fx * 12, p.y + 1.55, p.z + fz * 12];
  for (let i = 0; i < 3; i++) {
   renderer.camPos[i] += (desiredPos[i] - renderer.camPos[i]) * Math.min(1, dt * 11);
   renderer.camTarget[i] += (desiredTgt[i] - renderer.camTarget[i]) * Math.min(1, dt * 12);
  }
 }
}
// ---------------- LIVE SHOWCASE HOOKS (?shot=chase|combat|garage|map) ----------------
function applyShowcaseHook() {
 const shot = new URLSearchParams(window.location.search).get('shot');
 if (!shot) return;
 state.player.cash = 42850;
 state.player.respect = 760;
 missions.completed = new Set([1, 2, 3, 4]);
 if (shot === 'chase') {
  state.mode = 'play';
  const car = world.playerStartCar;
  car.x = 106; car.z = 24; car.angle = Math.PI - 0.14; car.speed = 46;
  car.boosting = true; car.drifting = true; car.boost = 82; car.hp = 128;
  car.color = [...PAINT_SWATCHES[0].rgb];
  state.player.vehicle = car;
  state.player.x = car.x; state.player.z = car.z; state.player.angle = car.angle;
  state.player.weaponIdx = 2;
  missions.startMission(7, state);
  missions.timer = 104;
  missions.showDialogue('elena', 'Keep the Solis GT pinned on Malecón del Sol! Air-1 has spotlight lock — cut west to Solis Customs!', 20);
  police.clearWanted(state);
  police.stars = 4; police.heat = 390; police.inSight = true;
  const p1 = createVehicle('sbpd_interceptor', 99.5, 31.5, Math.PI - 0.14, { aiMode: 'police', callsign: 'SBPD-04', status: 'RAMMING', speed: 44 });
  const p2 = createVehicle('sbpd_interceptor', 112.2, 33.0, Math.PI - 0.18, { aiMode: 'police', callsign: 'SBPD-11', status: 'PURSUIT', speed: 43 });
  const p3 = createVehicle('sbpd_interceptor', 105, -24, Math.PI * 0.45, { aiMode: 'roadblock', callsign: 'RDBLK-A', status: 'ROADBLOCK', speed: 0 });
  world.vehicles.push(p1, p2, p3);
  police.units.push(p1, p2);
  police.roadblocks.push(p3);
  police.heli = { active: true, x: 117, y: 15.0, z: -2, angle: Math.PI + 0.4, spotX: 106, spotZ: 20, orbitPhase: 0.4, callsign: 'AIR-1' };
  police.dispatchRoster = [
   { callsign: 'SBPD-04', dist: 14, status: 'RAMMING' },
   { callsign: 'SBPD-11', dist: 19, status: 'PURSUIT' },
   { callsign: 'AIR-1', dist: 28, status: 'SPOTLIGHT' },
   { callsign: 'RDBLK-A', dist: 58, status: 'ROADBLOCK' },
  ];
  for (let i = 0; i < 4; i++) combat.addDriftSmoke(106.5 + i * 0.25, 26.8 + i * 0.9);
  renderer.sunDir = [0.42, 0.20, -0.88];
  state.cameraOverride = { pos: [102.0, 5.4, 44.5], target: [108.5, 3.0, 6.0] };
  ui.setMode('play', state);
 } else if (shot === 'combat') {
  state.mode = 'play';
  state.player.vehicle = null;
  state.player.x = 96; state.player.z = 52; state.player.angle = Math.PI + 0.12;
  state.player.hp = 88; state.player.armor = 64; state.player.weaponIdx = 4;
  world.playerStartCar.x = 89; world.playerStartCar.z = 47; world.playerStartCar.angle = Math.PI + 0.45;
  world.playerStartCar.aiMode = 'parked';
  missions.startMission(5, state);
  missions.timer = 142;
  missions.showDialogue('mateo', 'Syndicate shooters on the promenade, Rafael! Use the Horizon Rifle and push through to the marina!', 20);
  police.clearWanted(state);
  police.stars = 3; police.heat = 285; police.inSight = true;
  const copCar = createVehicle('sbpd_interceptor', 110, 26, Math.PI - 0.55, { aiMode: 'police', callsign: 'SBPD-19', status: 'FIRING', speed: 0 });
  world.vehicles.push(copCar);
  police.units.push(copCar);
  police.heli = { active: true, x: 118, y: 17, z: 14, angle: Math.PI + 0.3, spotX: 102, spotZ: 34, orbitPhase: 0.2, callsign: 'AIR-1' };
  combat.enemies = [
   { x: 99, y: 0, z: 33, angle: 0.1, hp: 65, maxHp: 80, isPolice: false, aiming: true, moving: false, fireCd: 1, phase: 0.2, torso: [0.22, 0.20, 0.28], pants: [0.3, 0.22, 0.18], skin: [0.8, 0.58, 0.42] },
   { x: 105, y: 0, z: 29, angle: -0.2, hp: 75, maxHp: 80, isPolice: false, aiming: true, moving: false, fireCd: 1, phase: 1.4, torso: [0.24, 0.18, 0.28], pants: [0.22, 0.2, 0.26], skin: [0.78, 0.54, 0.40] },
   { x: 109, y: 0, z: 31, angle: -0.35, hp: 90, maxHp: 95, isPolice: true, callsign: 'SWAT-01', aiming: true, moving: false, fireCd: 1, phase: 2.1, torso: [0.16, 0.24, 0.46], pants: [0.1, 0.14, 0.24], skin: [0.82, 0.60, 0.44] },
  ];
  combat.tracers = [
   { x1: 96.2, z1: 50.8, x2: 99.0, z2: 33.4, y: 1.38, life: 5, color: [1.0, 0.88, 0.30] },
   { x1: 105.0, z1: 29.6, x2: 97.5, z2: 48.0, y: 1.38, life: 5, color: [1.0, 0.34, 0.28] },
  ];
  for (let k = 0; k < 6; k++) {
   combat.addParticle(96.1 + k * 0.08, 1.38 + (k % 2) * 0.1, 50.4 - k * 0.12, 0, 0, 0, 0.18, 5, [1.0, 0.84, 0.28], 'spark');
   combat.addParticle(99.0 + (k - 3) * 0.12, 1.35 + (k % 3) * 0.12, 33.4, 0, 0, 0, 0.16, 5, [1.0, 0.42, 0.24], 'spark');
  }
  police.dispatchRoster = [
   { callsign: 'SWAT-01', dist: 24, status: 'FIRING' },
   { callsign: 'SBPD-19', dist: 29, status: 'PURSUIT' },
   { callsign: 'AIR-1', dist: 44, status: 'SPOTLIGHT' },
  ];
  renderer.sunDir = [0.46, 0.20, -0.86];
  state.cameraOverride = { pos: [93.4, 2.55, 57.6], target: [101.8, 1.5, 32.0] };
  ui.setMode('play', state);
 } else if (shot === 'garage') {
  const car = world.playerStartCar;
  car.color = [...PAINT_SWATCHES[2].rgb]; // gleaming Turquoise Solis GT
  state.player.vehicle = car;
  state.player.upgrades = { engine: 2, armor: 2, nitro: 1, tires: 1 };
  missions.startMission(1, state);
  missions.stageIndex = 1;
  missions.showDialogue('elena', 'Turquoise metallic looks lethal under Solaris sunset. Upgrade the Twin-Turbo ECU before we hit the strip.', 20);
  renderer.sunDir = [0.55, 0.22, -0.80];
  openGarage();
  ui.selectedPaintIdx = 2;
  document.querySelectorAll('.paint-swatch').forEach((b, i) => b.classList.toggle('selected', i === 2));
  ui.refreshGarage(state);
 } else if (shot === 'map') {
  missions.startMission(6, state);
  state.mode = 'menu';
  renderer.sunDir = [0.55, 0.22, -0.80];
  state.cameraOverride = { pos: [148, 36, 92], target: [40, 8, -20] };
  ui.setMode('menu', state);
  ui.openMenu('map', state);
 }
}
applyShowcaseHook();
const isShowcase = new URLSearchParams(window.location.search).has('shot');
let lastTs = performance.now();
let accum = 0;
function frame(now) {
 const dt = Math.min(0.05, (now - lastTs) / 1000);
 lastTs = now;
 state.time += dt;
 if (!isShowcase) {
  accum += dt;
  while (accum >= FIXED_DT) {
   if (state.mode === 'play') {
    updatePlayer(FIXED_DT);
    world.update(FIXED_DT, state);
    police.update(FIXED_DT, state);
    combat.update(FIXED_DT, state);
    missions.update(FIXED_DT, state);
    audio.update(FIXED_DT, state, state.time);
   }
   accum -= FIXED_DT;
  }
 }
 updateCamera(dt);
 ui.update(dt, state, state.time);
 renderer.render(state, state.time);
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
