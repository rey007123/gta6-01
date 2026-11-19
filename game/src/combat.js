// SOLARIS BAY: GOLDEN HEAT — On-Foot Combat, 5-Slot Weapons, Tracers & Hostile AI
import { WEAPONS } from './config.js';
export class CombatSystem {
 constructor() {
  this.ammo = [Infinity, 90, 180, 32, 150];
  this.cooldown = 0;
  this.enemies = [];
  this.tracers = [];
  this.particles = [];
 }
 spawnHostileSquad(cx, cz, count, isPolice = false) {
  for (let i = 0; i < count; i++) {
   const a = (i / Math.max(1, count)) * Math.PI * 2 + 0.4;
   const r = 7 + (i % 3) * 4.5;
   this.enemies.push({
    x: cx + Math.cos(a) * r,
    y: 0,
    z: cz + Math.sin(a) * r,
    angle: a + Math.PI,
    hp: isPolice ? 95 : 80,
    maxHp: isPolice ? 95 : 80,
    isPolice,
    callsign: isPolice ? `SWAT-0${i + 1}` : null,
    aiming: true,
    moving: false,
    fireCd: 0.6 + i * 0.25,
    phase: i * 1.1,
    torso: isPolice ? [0.16, 0.24, 0.46] : [0.22, 0.20, 0.28],
    pants: isPolice ? [0.10, 0.14, 0.24] : [0.30, 0.22, 0.18],
    skin: [0.80, 0.58, 0.42],
   });
  }
 }
 addParticle(x, y, z, vx, vy, vz, size, life, color, kind = 'spark') {
  this.particles.push({ x, y, z, vx, vy, vz, size, life, color, kind });
  if (this.particles.length > 140) this.particles.shift();
 }
 addDriftSmoke(x, z) {
  this.addParticle(
   x + (Math.random() - 0.5) * 0.8,
   0.3,
   z + (Math.random() - 0.5) * 0.8,
   (Math.random() - 0.5) * 1.2,
   1.1 + Math.random() * 0.9,
   (Math.random() - 0.5) * 1.2,
   0.7 + Math.random() * 0.45,
   0.75,
   [0.9, 0.88, 0.9],
   'smoke'
  );
 }
 firePlayerWeapon(state) {
  if (this.cooldown > 0 || state.player.vehicle) return;
  const idx = state.player.weaponIdx;
  const w = WEAPONS[idx];
  if (!w) return;
  if (!w.melee && this.ammo[idx] <= 0) return;
  this.cooldown = w.fireRate;
  if (!w.melee) this.ammo[idx]--;
  state.audio.playGunshot(idx);
  const px = state.player.x, pz = state.player.z;
  const baseAngle = state.player.angle;
  // Alert nearby pedestrians to flee
  for (const p of state.world.peds) {
   if (Math.hypot(p.x - px, p.z - pz) < 34) p.fleeTimer = 7;
  }
  // Muzzle flash sparks
  if (!w.melee) {
   const mx = px + Math.sin(baseAngle) * 1.1;
   const mz = pz + Math.cos(baseAngle) * 1.1;
   for (let k = 0; k < 4; k++) {
    this.addParticle(mx, 1.38, mz, Math.sin(baseAngle) * 8 + (Math.random() - 0.5) * 4, (Math.random() - 0.3) * 3, Math.cos(baseAngle) * 8 + (Math.random() - 0.5) * 4, 0.16, 0.14, [1.0, 0.82, 0.28], 'spark');
   }
   state.police.addHeat(12, 1);
  }
  for (let p = 0; p < w.pellets; p++) {
   const ang = baseAngle + (Math.random() - 0.5) * w.spread;
   const dx = Math.sin(ang), dz = Math.cos(ang);
   let bestT = w.range;
   let hitEnemy = null;
   let hitVeh = null;
   // Check enemies
   for (const e of this.enemies) {
    if (e.hp <= 0) continue;
    const ex = e.x - px, ez = e.z - pz;
    const proj = ex * dx + ez * dz;
    if (proj > 0 && proj < bestT) {
     const perp = Math.abs(ex * dz - ez * dx);
     if (perp < 1.15) {
      bestT = proj;
      hitEnemy = e;
      hitVeh = null;
     }
    }
   }
   // Check vehicles
   for (const v of state.world.vehicles) {
    if (v.destroyed) continue;
    const vx = v.x - px, vz = v.z - pz;
    const proj = vx * dx + vz * dz;
    if (proj > 1.2 && proj < bestT) {
     const perp = Math.abs(vx * dz - vz * dx);
     if (perp < 1.8) {
      bestT = proj;
      hitVeh = v;
      hitEnemy = null;
     }
    }
   }
   const hx = px + dx * bestT;
   const hz = pz + dz * bestT;
   if (!w.melee) {
    this.tracers.push({ x1: px + dx * 0.9, z1: pz + dz * 0.9, x2: hx, z2: hz, y: 1.38, life: 0.09, color: [1.0, 0.88, 0.32] });
   }
   if (hitEnemy) {
    hitEnemy.hp -= w.damage;
    for (let k = 0; k < 5; k++) {
     this.addParticle(hx, 1.3, hz, (Math.random() - 0.5) * 6, 2 + Math.random() * 3, (Math.random() - 0.5) * 6, 0.14, 0.28, [1.0, 0.38, 0.32], 'spark');
    }
    if (hitEnemy.hp <= 0) {
     state.player.cash += hitEnemy.isPolice ? 350 : 250;
     state.player.respect += 20;
     if (hitEnemy.isPolice) state.police.addHeat(45, 2);
    }
   } else if (hitVeh) {
    hitVeh.hp -= w.damage * 0.65;
    for (let k = 0; k < 5; k++) {
     this.addParticle(hx, 0.9, hz, (Math.random() - 0.5) * 7, 2 + Math.random() * 4, (Math.random() - 0.5) * 7, 0.14, 0.25, [1.0, 0.78, 0.26], 'spark');
    }
    if (hitVeh.isPolice) state.police.addHeat(35, 2);
   }
  }
 }
 damagePlayer(state, amount) {
  if (state.player.armor > 0) {
   const absorb = Math.min(state.player.armor, amount * 0.65);
   state.player.armor -= absorb;
   amount -= absorb;
  }
  state.player.hp = Math.max(0, state.player.hp - amount);
  if (state.player.hp <= 0) {
   // Respawn at Palmetto Villa safehouse
   state.player.hp = 100;
   state.player.armor = 50;
   state.player.cash = Math.max(0, state.player.cash - 500);
   state.player.vehicle = null;
   state.player.x = -162;
   state.player.z = -205;
   state.police.clearWanted(state);
   state.ui.showBanner('WASTED', 'SOLARIS MEDEVAC', 'RECOVERED AT PALMETTO VILLA · -$500', 3.4);
  }
 }
 update(dt, state) {
  if (this.cooldown > 0) this.cooldown -= dt;
  // Update tracers
  for (let i = this.tracers.length - 1; i >= 0; i--) {
   this.tracers[i].life -= dt;
   if (this.tracers[i].life <= 0) this.tracers.splice(i, 1);
  }
  // Update particles
  for (let i = this.particles.length - 1; i >= 0; i--) {
   const p = this.particles[i];
   p.life -= dt;
   p.x += p.vx * dt;
   p.y += p.vy * dt;
   p.z += p.vz * dt;
   if (p.kind === 'spark') p.vy -= 12 * dt;
   if (p.kind === 'smoke') p.size += dt * 0.9;
   if (p.life <= 0) this.particles.splice(i, 1);
  }
  // Hostile AI
  const px = state.player.x, pz = state.player.z;
  for (const e of this.enemies) {
   if (e.hp <= 0) continue;
   const dx = px - e.x, dz = pz - e.z;
   const dist = Math.hypot(dx, dz);
   e.angle = Math.atan2(dx, dz);
   if (dist > 22 && dist < 85) {
    e.moving = true;
    e.x += (dx / dist) * 4.2 * dt;
    e.z += (dz / dist) * 4.2 * dt;
   } else {
    e.moving = false;
   }
   e.fireCd -= dt;
   if (dist < 48 && e.fireCd <= 0) {
    e.fireCd = 0.85 + Math.random() * 0.65;
    const spread = (Math.random() - 0.5) * 0.16;
    const ang = e.angle + spread;
    const tx = e.x + Math.sin(ang) * Math.min(dist, 44);
    const tz = e.z + Math.cos(ang) * Math.min(dist, 44);
    this.tracers.push({ x1: e.x, z1: e.z, x2: tx, z2: tz, y: 1.38, life: 0.11, color: [1.0, 0.36, 0.28] });
    if (Math.abs(spread) < 0.065 && dist < 42) {
     this.damagePlayer(state, state.player.vehicle ? 4 : 7);
    }
   }
  }
  this.enemies = this.enemies.filter((e) => e.hp > 0);
 }
}
