// SOLARIS BAY: GOLDEN HEAT — 5-Star Wanted System, Live SBPD Dispatch & Air-1 Helicopter
import { createVehicle } from './world.js';
const CALLSIGNS = ['SBPD-04', 'SBPD-11', 'SBPD-19', 'SBPD-27', 'SBPD-33'];
export class PoliceSystem {
 constructor() {
  this.stars = 0;
  this.heat = 0;
  this.inSight = false;
  this.evadeTimer = 0;
  this.units = [];
  this.roadblocks = [];
  this.dispatchRoster = [];
  this.heli = {
   active: false,
   x: 115,
   y: 24,
   z: 30,
   angle: Math.PI,
   spotX: 105,
   spotZ: 20,
   orbitPhase: 0,
   callsign: 'AIR-1',
  };
  this.spawnTimer = 0;
 }
 addHeat(amount, minStars = 0) {
  this.heat = Math.min(500, this.heat + amount);
  const calc = Math.min(5, Math.ceil(this.heat / 100));
  this.stars = Math.max(this.stars, minStars, calc);
  this.inSight = true;
  this.evadeTimer = 0;
 }
 setWanted(stars, state) {
  this.stars = Math.max(0, Math.min(5, stars));
  this.heat = this.stars * 95;
  if (this.stars === 0) {
   this.clearWanted(state);
  } else {
   this.inSight = true;
   this.evadeTimer = 0;
  }
 }
 clearWanted(state) {
  this.stars = 0;
  this.heat = 0;
  this.inSight = false;
  this.evadeTimer = 0;
  this.heli.active = false;
  this.dispatchRoster = [];
  if (state) {
   state.world.vehicles = state.world.vehicles.filter((v) => v.aiMode !== 'police' && v.aiMode !== 'roadblock');
  }
  this.units = [];
  this.roadblocks = [];
 }
 _spawnPursuitUnit(state, idx) {
  const px = state.player.x, pz = state.player.z;
  const ang = state.player.angle + (idx % 2 === 0 ? 0.55 : -0.55) + Math.PI;
  const dist = 48 + idx * 14;
  const sx = Math.max(-280, Math.min(126, px + Math.sin(ang) * dist));
  const sz = Math.max(-280, Math.min(280, pz + Math.cos(ang) * dist));
  const v = createVehicle('sbpd_interceptor', sx, sz, Math.atan2(px - sx, pz - sz), {
   aiMode: 'police',
   callsign: CALLSIGNS[idx % CALLSIGNS.length],
   status: 'PURSUIT',
   speed: 24,
  });
  state.world.vehicles.push(v);
  this.units.push(v);
  return v;
 }
 _spawnRoadblock(state) {
  const px = state.player.x, pz = state.player.z;
  const fwdX = Math.sin(state.player.angle), fwdZ = Math.cos(state.player.angle);
  const rx = Math.max(-260, Math.min(118, px + fwdX * 72));
  const rz = Math.max(-260, Math.min(260, pz + fwdZ * 72));
  const v = createVehicle('sbpd_interceptor', rx, rz, state.player.angle + Math.PI * 0.5, {
   aiMode: 'roadblock',
   callsign: 'RDBLK-A',
   status: 'ROADBLOCK',
   speed: 0,
  });
  state.world.vehicles.push(v);
  this.roadblocks.push(v);
 }
 update(dt, state) {
  this.units = this.units.filter((u) => !u.destroyed && state.world.vehicles.includes(u));
  this.roadblocks = this.roadblocks.filter((u) => !u.destroyed && state.world.vehicles.includes(u));
  if (this.stars <= 0) {
   this.heli.active = false;
   this.dispatchRoster = [];
   return;
  }
  const px = state.player.x, pz = state.player.z;
  const desiredUnits = Math.min(4, this.stars + (this.stars >= 4 ? 1 : 0));
  this.spawnTimer -= dt;
  if (this.units.length < desiredUnits && this.spawnTimer <= 0) {
   this._spawnPursuitUnit(state, this.units.length);
   this.spawnTimer = 2.6;
  }
  if (this.stars >= 3 && this.roadblocks.length < 1 && state.player.vehicle) {
   this._spawnRoadblock(state);
  }
  // Activate SBPD Air-1 helicopter at 3+ stars
  if (this.stars >= 3) {
   if (!this.heli.active) {
    this.heli.active = true;
    this.heli.x = px + 36;
    this.heli.y = 22;
    this.heli.z = pz - 32;
   }
   this.heli.orbitPhase += dt * 0.65;
   const targetX = px + Math.cos(this.heli.orbitPhase) * 20;
   const targetZ = pz + Math.sin(this.heli.orbitPhase) * 20;
   this.heli.x += (targetX - this.heli.x) * Math.min(1, dt * 1.8);
   this.heli.z += (targetZ - this.heli.z) * Math.min(1, dt * 1.8);
   this.heli.y = 19 + Math.sin(this.heli.orbitPhase * 1.7) * 2.2;
   this.heli.angle = Math.atan2(px - this.heli.x, pz - this.heli.z);
   this.heli.spotX += (px - this.heli.spotX) * Math.min(1, dt * 3.5);
   this.heli.spotZ += (pz - this.heli.spotZ) * Math.min(1, dt * 3.5);
  } else {
   this.heli.active = false;
  }
  // Update each SBPD Interceptor pursuit AI
  let anySight = false;
  const roster = [];
  for (const u of this.units) {
   const dx = px - u.x, dz = pz - u.z;
   const dist = Math.hypot(dx, dz);
   const desiredAngle = Math.atan2(dx, dz);
   let diff = desiredAngle - u.angle;
   while (diff > Math.PI) diff -= Math.PI * 2;
   while (diff < -Math.PI) diff += Math.PI * 2;
   u.angle += Math.max(-2.6 * dt, Math.min(2.6 * dt, diff * 3.5 * dt));
   const targetSpd = dist < 12 ? 32 : Math.min(u.spec.topSpeed, 30 + this.stars * 4.5);
   u.speed += (targetSpd - u.speed) * Math.min(1, dt * 2.8);
   u.x += Math.sin(u.angle) * u.speed * dt;
   u.z += Math.cos(u.angle) * u.speed * dt;
   const col = state.world.resolveBuildingCollision(u.x, u.z, 2.0);
   u.x = col.x; u.z = col.z;
   if (col.hit) u.speed *= 0.45;
   // Ramming collision with player vehicle
   if (state.player.vehicle && dist < 4.4) {
    state.player.vehicle.hp = Math.max(0, state.player.vehicle.hp - 12 * dt);
    const push = 8 * dt;
    state.player.vehicle.x += (dx / (dist || 1)) * push;
    state.player.vehicle.z += (dz / (dist || 1)) * push;
   }
   if (dist < 78) anySight = true;
   u.status = dist < 18 ? 'RAMMING' : 'PURSUIT';
   roster.push({ callsign: u.callsign, dist: Math.round(dist), status: u.status });
  }
  // Roadblocks
  for (const rb of this.roadblocks) {
   const dist = Math.hypot(px - rb.x, pz - rb.z);
   if (dist < 62) anySight = true;
   if (dist > 165) {
    rb.destroyed = true;
   } else {
    roster.push({ callsign: rb.callsign, dist: Math.round(dist), status: 'ROADBLOCK' });
   }
  }
  // Air-1 entry in dispatch roster
  if (this.heli.active) {
   const hDist = Math.hypot(px - this.heli.x, pz - this.heli.z);
   if (hDist < 95) anySight = true;
   roster.push({ callsign: 'AIR-1', dist: Math.round(hDist), status: 'SPOTLIGHT' });
  }
  // Active police/hostile gunfire on foot
  for (const e of state.combat.enemies) {
   if (e.hp > 0 && e.isPolice) {
    const d = Math.hypot(px - e.x, pz - e.z);
    if (d < 65) anySight = true;
    roster.push({ callsign: e.callsign || 'SWAT-02', dist: Math.round(d), status: 'FIRING' });
   }
  }
  roster.sort((a, b) => a.dist - b.dist);
  this.dispatchRoster = roster.slice(0, 5);
  this.inSight = anySight;
  if (anySight) {
   this.evadeTimer = 0;
  } else {
   this.evadeTimer += dt;
   if (this.evadeTimer > 16) {
    this.stars = Math.max(0, this.stars - 1);
    this.heat = this.stars * 90;
    this.evadeTimer = 8;
    if (this.stars === 0) this.clearWanted(state);
   }
  }
 }
}
