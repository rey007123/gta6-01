// SOLARIS BAY: GOLDEN HEAT — HUD, Rotating Minimap, Portraits, Garage & City Map UI
import {
 WORLD, DISTRICTS, LANDMARKS, WEAPONS, CHARACTERS,
 PAINT_SWATCHES, GARAGE_UPGRADES, getDistrictAt,
} from './config.js';
import { CAMPAIGN_MISSIONS } from './missions.js';
export class HudManager {
 constructor(callbacks) {
  this.cb = callbacks;
  this.el = {
   hud: document.getElementById('hud'),
   reticle: document.getElementById('reticle'),
   prompt: document.getElementById('action-prompt'),
   banner: document.getElementById('center-banner'),
   bannerKicker: document.getElementById('banner-kicker'),
   bannerTitle: document.getElementById('banner-title'),
   bannerSub: document.getElementById('banner-sub'),
   missionCard: document.getElementById('mission-card'),
   missionTag: document.getElementById('mission-tag'),
   missionTimer: document.getElementById('mission-timer'),
   missionTitle: document.getElementById('mission-title'),
   missionObj: document.getElementById('mission-obj'),
   missionDist: document.getElementById('mission-dist'),
   missionReward: document.getElementById('mission-reward'),
   dispatchPanel: document.getElementById('dispatch-panel'),
   dispatchCount: document.getElementById('dispatch-count'),
   dispatchList: document.getElementById('dispatch-list'),
   clock: document.getElementById('hud-clock'),
   cash: document.getElementById('hud-cash'),
   stars: document.getElementById('wanted-stars'),
   sightBadge: document.getElementById('sight-badge'),
   weaponBar: document.getElementById('weapon-bar'),
   minimap: document.getElementById('minimap-canvas'),
   district: document.getElementById('district-plaque'),
   barHp: document.getElementById('bar-hp'),
   valHp: document.getElementById('val-hp'),
   barAr: document.getElementById('bar-ar'),
   valAr: document.getElementById('val-ar'),
   barRep: document.getElementById('bar-rep'),
   valRep: document.getElementById('val-rep'),
   dialogueBox: document.getElementById('dialogue-box'),
   portrait: document.getElementById('dialogue-portrait'),
   speaker: document.getElementById('dialogue-speaker'),
   role: document.getElementById('dialogue-role'),
   dialogueText: document.getElementById('dialogue-text'),
   radioWidget: document.getElementById('radio-widget'),
   radioStation: document.getElementById('radio-station'),
   radioTrack: document.getElementById('radio-track'),
   eqBars: document.getElementById('eq-bars'),
   vehWidget: document.getElementById('vehicle-widget'),
   speedNum: document.getElementById('speed-num'),
   speedGear: document.getElementById('speed-gear'),
   vehName: document.getElementById('vehicle-name'),
   barBoost: document.getElementById('bar-boost'),
   barHull: document.getElementById('bar-hull'),
   startOverlay: document.getElementById('start-overlay'),
   btnPlay: document.getElementById('btn-play'),
   btnContinue: document.getElementById('btn-continue'),
   btnControlsStart: document.getElementById('btn-controls-start'),
   garageOverlay: document.getElementById('garage-overlay'),
   garageCash: document.getElementById('garage-cash'),
   garageVehName: document.getElementById('garage-veh-name'),
   garageVehStats: document.getElementById('garage-veh-stats'),
   paintGrid: document.getElementById('paint-grid'),
   upgradeList: document.getElementById('upgrade-list'),
   btnRespray: document.getElementById('btn-garage-respray'),
   btnGarageExit: document.getElementById('btn-garage-exit'),
   menuOverlay: document.getElementById('menu-overlay'),
   menuTabs: document.getElementById('menu-tabs'),
   btnResume: document.getElementById('btn-resume'),
   cityMap: document.getElementById('citymap-canvas'),
   districtLegend: document.getElementById('district-legend'),
   playerStats: document.getElementById('player-stats'),
   campaignList: document.getElementById('campaign-list'),
   saveSlots: document.getElementById('save-slots'),
  };
  this.mmCtx = this.el.minimap.getContext('2d');
  this.mapCtx = this.el.cityMap.getContext('2d');
  this.portCtx = this.el.portrait.getContext('2d');
  this.bannerTimer = 0;
  this.lastPortraitKey = null;
  this.selectedPaintIdx = 0;
  this._initStaticUi();
  this._bindEvents();
 }
 _initStaticUi() {
  // Weapon slots
  this.el.weaponBar.innerHTML = WEAPONS.map((w, i) => `
   <div class="w-slot" data-w="${i}">
    <div class="w-num"><span>${i + 1}</span><span>${w.melee ? 'ML' : 'FM'}</span></div>
    <div class="w-name">${w.short}</div>
    <div class="w-ammo" id="w-ammo-${i}">${w.melee ? 'INF' : '90'}</div>
   </div>
  `).join('');
  // District legend in City Map menu
  this.el.districtLegend.innerHTML = DISTRICTS.map((d) => `
   <div class="legend-row">
    <span class="legend-dot" style="background:${d.color}"></span>
    <b>${d.name}</b>
    <span>${d.short}</span>
   </div>
  `).join('');
  // Paint swatches in Solis Customs
  this.el.paintGrid.innerHTML = PAINT_SWATCHES.map((p, i) => `
   <button class="paint-swatch${i === 0 ? ' selected' : ''}" data-paint="${i}" style="background:${p.hex}">${p.name}</button>
  `).join('');
 }
 _bindEvents() {
  this.el.btnPlay.addEventListener('click', () => this.cb.onStart(false));
  this.el.btnContinue.addEventListener('click', () => this.cb.onStart(true));
  this.el.btnControlsStart.addEventListener('click', () => {
   this.cb.onStart(false);
   this.openMenu('controls');
  });
  this.el.btnResume.addEventListener('click', () => this.cb.onCloseMenu());
  this.el.btnGarageExit.addEventListener('click', () => this.cb.onCloseGarage());
  this.el.btnRespray.addEventListener('click', () => this.cb.onRespray(this.selectedPaintIdx));
  this.el.paintGrid.addEventListener('click', (e) => {
   const btn = e.target.closest('.paint-swatch');
   if (!btn) return;
   this.selectedPaintIdx = Number(btn.dataset.paint);
   this.el.paintGrid.querySelectorAll('.paint-swatch').forEach((b, idx) => {
    b.classList.toggle('selected', idx === this.selectedPaintIdx);
   });
   this.cb.onPreviewPaint(this.selectedPaintIdx);
  });
  this.el.menuTabs.addEventListener('click', (e) => {
   const btn = e.target.closest('.tab-btn');
   if (!btn) return;
   this.setMenuTab(btn.dataset.tab);
  });
  this.el.cityMap.addEventListener('click', (e) => {
   const rect = this.el.cityMap.getBoundingClientRect();
   const nx = (e.clientX - rect.left) / rect.width;
   const ny = (e.clientY - rect.top) / rect.height;
   const wx = WORLD.minX + nx * (WORLD.maxX - WORLD.minX);
   const wz = WORLD.minZ + ny * (WORLD.maxZ - WORLD.minZ);
   this.cb.onSetWaypoint(wx, wz);
  });
 }
 showBanner(kicker, title, sub, duration = 2.8) {
  this.el.bannerKicker.textContent = kicker;
  this.el.bannerTitle.textContent = title;
  this.el.bannerSub.textContent = sub;
  this.el.banner.classList.remove('hidden');
  this.bannerTimer = duration;
 }
 setMode(mode, state) {
  this.el.startOverlay.classList.toggle('hidden', mode !== 'start');
  this.el.hud.classList.toggle('hidden', mode !== 'play' && mode !== 'garage');
  this.el.garageOverlay.classList.toggle('hidden', mode !== 'garage');
  this.el.menuOverlay.classList.toggle('hidden', mode !== 'menu');
  if (mode === 'garage' && state) this.refreshGarage(state);
  if (mode === 'menu' && state) this.refreshMenu(state);
 }
 openMenu(tab = 'map', state = null) {
  this.setMenuTab(tab);
  if (state) this.refreshMenu(state);
 }
 setMenuTab(tab) {
  this.el.menuTabs.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-pane').forEach((p) => p.classList.toggle('active', p.id === `tab-${tab}`));
 }
 refreshGarage(state) {
  const pv = state.player.vehicle || state.world.playerStartCar;
  const up = state.player.upgrades;
  this.el.garageCash.textContent = `$${state.player.cash.toLocaleString()}`;
  this.el.garageVehName.textContent = pv ? pv.spec.name.toUpperCase() : 'SOLIS GT';
  const topMph = Math.round(((pv ? pv.spec.topSpeed : 56) * (1 + up.engine * 0.14)) * 2.65);
  this.el.garageVehStats.textContent = `TOP ${topMph} MPH · ARMOR LV.${up.armor} · NITRO LV.${up.nitro}`;
  this.el.upgradeList.innerHTML = GARAGE_UPGRADES.map((u) => {
   const lv = up[u.id] || 0;
   const maxed = lv >= u.maxLevel;
   const cost = maxed ? 0 : u.costs[lv];
   return `
    <div class="upgrade-item">
     <div class="upgrade-info">
      <b>${u.name} (LV.${lv}/${u.maxLevel})</b>
      <span>${u.desc}</span>
     </div>
     <button class="btn btn-sm ${maxed ? 'btn-secondary' : 'btn-primary'}" data-up="${u.id}" ${maxed ? 'disabled' : ''}>
      ${maxed ? 'MAXED' : `$${cost.toLocaleString()}`}
     </button>
    </div>
   `;
  }).join('');
  this.el.upgradeList.querySelectorAll('button[data-up]').forEach((btn) => {
   btn.addEventListener('click', () => this.cb.onBuyUpgrade(btn.dataset.up));
  });
 }
 refreshMenu(state) {
  this._drawCityMap(state);
  this.el.playerStats.innerHTML = `
   <div class="stat-box"><small>CASH</small><strong>$${state.player.cash.toLocaleString()}</strong></div>
   <div class="stat-box"><small>RESPECT</small><strong>${state.player.respect}</strong></div>
   <div class="stat-box"><small>MISSIONS</small><strong>${state.missions.completed.size} / ${CAMPAIGN_MISSIONS.length}</strong></div>
   <div class="stat-box"><small>WANTED</small><strong>${state.police.stars} ★</strong></div>
  `;
  this.el.campaignList.innerHTML = CAMPAIGN_MISSIONS.map((m) => {
   const done = state.missions.completed.has(m.id);
   const active = state.missions.activeMission && state.missions.activeMission.id === m.id;
   return `
    <div class="mission-row-card ${active ? 'active' : done ? 'done' : ''}">
     <div>
      <h4>${m.code}: ${m.title}</h4>
      <p>${m.summary}</p>
      <div class="mission-pill">${m.district} · $${m.rewardCash.toLocaleString()} · +${m.rewardRep} REP</div>
     </div>
     <button class="btn btn-sm ${active ? 'btn-secondary' : 'btn-primary'}" data-mid="${m.id}">
      ${active ? 'ACTIVE' : done ? 'REPLAY' : 'START'}
     </button>
    </div>
   `;
  }).join('');
  this.el.campaignList.querySelectorAll('button[data-mid]').forEach((btn) => {
   btn.addEventListener('click', () => this.cb.onStartMission(Number(btn.dataset.mid)));
  });
  // Save/Load Slots
  this.el.saveSlots.innerHTML = [1, 2, 3].map((slot) => {
   const info = this.cb.getSaveInfo(slot);
   return `
    <div class="save-slot">
     <h4>SLOT 0${slot}</h4>
     <p>${info ? `$${info.cash.toLocaleString()} · ${info.completed}/8 Missions · ${info.district}` : 'Empty Slot'}</p>
     <div class="save-slot-btns">
      <button class="btn btn-sm btn-primary" data-save="${slot}">SAVE</button>
      <button class="btn btn-sm btn-secondary" data-load="${slot}" ${info ? '' : 'disabled'}>LOAD</button>
     </div>
    </div>
   `;
  }).join('');
  this.el.saveSlots.querySelectorAll('button[data-save]').forEach((b) => {
   b.addEventListener('click', () => this.cb.onSaveSlot(Number(b.dataset.save)));
  });
  this.el.saveSlots.querySelectorAll('button[data-load]').forEach((b) => {
   b.addEventListener('click', () => this.cb.onLoadSlot(Number(b.dataset.load)));
  });
 }
 _drawPortrait(key) {
  if (this.lastPortraitKey === key) return;
  this.lastPortraitKey = key;
  const ch = CHARACTERS[key] || CHARACTERS.elena;
  const ctx = this.portCtx;
  const w = 68, h = 68;
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, ch.bg[0]);
  grad.addColorStop(1, ch.bg[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  // Sunburst halo
  ctx.fillStyle = 'rgba(255, 220, 130, 0.22)';
  ctx.beginPath(); ctx.arc(34, 28, 22, 0, Math.PI * 2); ctx.fill();
  // Shoulders & jacket
  ctx.fillStyle = ch.jacket;
  ctx.beginPath(); ctx.roundRect(10, 44, 48, 28, 12); ctx.fill();
  ctx.fillStyle = ch.shirt;
  ctx.beginPath(); ctx.moveTo(26, 44); ctx.lineTo(42, 44); ctx.lineTo(34, 62); ctx.closePath(); ctx.fill();
  // Neck & head
  ctx.fillStyle = ch.skin;
  ctx.fillRect(29, 36, 10, 10);
  ctx.beginPath(); ctx.arc(34, 27, 13, 0, Math.PI * 2); ctx.fill();
  // Hair
  ctx.fillStyle = ch.hair;
  ctx.beginPath(); ctx.arc(34, 22, 13.5, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillRect(21, 18, 26, 6);
  // Stylish sunset sunglasses
  ctx.fillStyle = '#0e111a';
  ctx.fillRect(24, 24, 9, 5);
  ctx.fillRect(35, 24, 9, 5);
  ctx.fillStyle = ch.accent;
  ctx.fillRect(25, 25, 7, 2);
  ctx.fillRect(36, 25, 7, 2);
 }
 _drawMinimap(state, time) {
  const ctx = this.mmCtx;
  const w = 184, h = 184, cx = 92, cy = 92;
  const scale = 0.54;
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 91, 0, Math.PI * 2);
  ctx.clip();
  // Dark coastal map background
  ctx.fillStyle = '#0d1526';
  ctx.fillRect(0, 0, w, h);
  // Rotate around player heading
  ctx.translate(cx, cy);
  ctx.rotate(state.player.angle - Math.PI);
  ctx.translate(-state.player.x * scale, -state.player.z * scale);
  // Beach & Ocean on East side
  ctx.fillStyle = '#5c4b34';
  ctx.fillRect(WORLD.beachX * scale, -400 * scale, 60 * scale, 800 * scale);
  ctx.fillStyle = '#0c4a6e';
  ctx.fillRect(WORLD.oceanX * scale, -400 * scale, 300 * scale, 800 * scale);
  // Road grid
  ctx.strokeStyle = '#36435e';
  ctx.lineWidth = WORLD.roadWidth * scale;
  for (const ax of WORLD.avenuesX) {
   ctx.beginPath(); ctx.moveTo(ax * scale, -340 * scale); ctx.lineTo(ax * scale, 340 * scale); ctx.stroke();
  }
  for (const sz of WORLD.streetsZ) {
   ctx.beginPath(); ctx.moveTo(-310 * scale, sz * scale); ctx.lineTo(132 * scale, sz * scale); ctx.stroke();
  }
  // Center lines
  ctx.strokeStyle = 'rgba(255, 190, 77, 0.45)';
  ctx.lineWidth = 1;
  for (const ax of WORLD.avenuesX) {
   ctx.beginPath(); ctx.moveTo(ax * scale, -340 * scale); ctx.lineTo(ax * scale, 340 * scale); ctx.stroke();
  }
  // Garage & Safehouse markers
  ctx.fillStyle = '#38e8ff';
  ctx.beginPath(); ctx.arc(LANDMARKS.garage.x * scale, LANDMARKS.garage.z * scale, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#43f0a6';
  ctx.beginPath(); ctx.arc(LANDMARKS.safehouse.x * scale, LANDMARKS.safehouse.z * scale, 5, 0, Math.PI * 2); ctx.fill();
  // Mission Waypoint
  if (state.missions.waypoint) {
   const wp = state.missions.waypoint;
   ctx.fillStyle = '#ffbe4d';
   ctx.beginPath(); ctx.arc(wp.x * scale, wp.z * scale, 6.5, 0, Math.PI * 2); ctx.fill();
   ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  // Police units flashing red/blue
  const flash = Math.floor(time * 8) % 2 === 0;
  for (const u of state.police.units) {
   ctx.fillStyle = flash ? '#ff3b5c' : '#3b82f6';
   ctx.beginPath(); ctx.arc(u.x * scale, u.z * scale, 4.5, 0, Math.PI * 2); ctx.fill();
  }
  if (state.police.heli.active) {
   const hl = state.police.heli;
   ctx.fillStyle = 'rgba(255, 240, 160, 0.25)';
   ctx.beginPath(); ctx.arc(hl.spotX * scale, hl.spotZ * scale, 10, 0, Math.PI * 2); ctx.fill();
   ctx.fillStyle = '#fff';
   ctx.beginPath(); ctx.arc(hl.x * scale, hl.z * scale, 4.2, 0, Math.PI * 2); ctx.fill();
  }
  // Hostile enemies
  for (const e of state.combat.enemies) {
   if (e.hp <= 0) continue;
   ctx.fillStyle = '#ff4d6d';
   ctx.beginPath(); ctx.arc(e.x * scale, e.z * scale, 3.8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  // Player chevron in center
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 8);
  ctx.lineTo(cx + 6, cy + 6);
  ctx.lineTo(cx, cy + 3);
  ctx.lineTo(cx - 6, cy + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
 }
 _drawCityMap(state) {
  const ctx = this.mapCtx;
  const w = 640, h = 440;
  const toX = (wx) => ((wx - WORLD.minX) / (WORLD.maxX - WORLD.minX)) * w;
  const toY = (wz) => ((wz - WORLD.minZ) / (WORLD.maxZ - WORLD.minZ)) * h;
  ctx.fillStyle = '#091529';
  ctx.fillRect(0, 0, w, h);
  // District shaded zones
  for (const d of DISTRICTS) {
   const b = d.bounds;
   ctx.fillStyle = d.color + '28';
   ctx.strokeStyle = d.color + '99';
   ctx.lineWidth = 1.5;
   const x = toX(b.x0), y = toY(b.z0), bw = toX(b.x1) - x, bh = toY(b.z1) - y;
   ctx.fillRect(x, y, bw, bh);
   ctx.strokeRect(x, y, bw, bh);
  }
  // Beach & Ocean
  ctx.fillStyle = '#b98b55';
  ctx.fillRect(toX(WORLD.beachX), 0, toX(WORLD.oceanX) - toX(WORLD.beachX), h);
  ctx.fillStyle = '#0a5275';
  ctx.fillRect(toX(WORLD.oceanX), 0, w - toX(WORLD.oceanX), h);
  // Road grid
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 6;
  for (const ax of WORLD.avenuesX) {
   ctx.beginPath(); ctx.moveTo(toX(ax), toY(-310)); ctx.lineTo(toX(ax), toY(310)); ctx.stroke();
  }
  for (const sz of WORLD.streetsZ) {
   ctx.beginPath(); ctx.moveTo(toX(-290), toY(sz)); ctx.lineTo(toX(132), toY(sz)); ctx.stroke();
  }
  // District labels (positioned cleanly away from landmark pins)
  ctx.font = '800 11.5px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  const labelOffsets = { palmetto: [0, -28], docks: [18, 22], malecon: [-8, -14], marina: [0, 26], neon: [0, 0] };
  for (const d of DISTRICTS) {
   const off = labelOffsets[d.id] || [0, 0];
   const mx = toX((d.bounds.x0 + d.bounds.x1) * 0.5) + off[0];
   const my = toY((d.bounds.z0 + d.bounds.z1) * 0.5) + off[1];
   ctx.fillStyle = 'rgba(255,255,255,0.92)';
   ctx.fillText(d.name.toUpperCase(), mx, my);
  }
  // Landmarks
  const drawPin = (lm, col, label, dy = -10) => {
   const x = toX(lm.x), y = toY(lm.z);
   ctx.fillStyle = col;
   ctx.beginPath(); ctx.arc(x, y, 5.5, 0, Math.PI * 2); ctx.fill();
   ctx.strokeStyle = '#0b1020'; ctx.lineWidth = 2; ctx.stroke();
   ctx.fillStyle = '#e2e8f0';
   ctx.font = '700 10px "Segoe UI", sans-serif';
   ctx.fillText(label, x, y + dy);
  };
  drawPin(LANDMARKS.garage, '#38e8ff', 'SOLIS CUSTOMS', -10);
  drawPin(LANDMARKS.safehouse, '#43f0a6', 'PALMETTO VILLA', 17);
  drawPin(LANDMARKS.mateoDock, '#f59e0b', 'PIER 9 DOCKS', -10);
  // Waypoint
  if (state.missions.waypoint) {
   drawPin(state.missions.waypoint, '#ffbe4d', 'OBJECTIVE', -10);
  }
  // Player marker
  const px = toX(state.player.x), py = toY(state.player.z);
  ctx.fillStyle = '#ff5e7e';
  ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
 }
 update(dt, state, time) {
  if (this.bannerTimer > 0) {
   this.bannerTimer -= dt;
   if (this.bannerTimer <= 0) this.el.banner.classList.add('hidden');
  }
  // Clock & Cash
  const mins = Math.floor(18 * 60 + 38 + time * 0.25) % 1440;
  const hh = String(Math.floor(mins / 60)).padStart(2, '0');
  const mm = String(mins % 60).padStart(2, '0');
  this.el.clock.textContent = `${hh}:${mm}`;
  this.el.cash.textContent = `$${Math.floor(state.player.cash).toLocaleString()}`;
  // Wanted Stars + IN SIGHT badge
  const stars = state.police.stars;
  const flash = Math.floor(time * 7) % 2 === 0;
  let starHtml = '';
  for (let i = 1; i <= 5; i++) {
   const cls = i <= stars ? (state.police.inSight ? (flash ? 'star flash-red' : 'star flash-blue') : 'star active') : 'star';
   starHtml += `<span class="${cls}">★</span>`;
  }
  this.el.stars.innerHTML = starHtml;
  this.el.sightBadge.classList.toggle('hidden', stars === 0);
  if (stars > 0) {
   this.el.sightBadge.textContent = state.police.inSight ? 'IN SIGHT' : 'EVADING';
   this.el.sightBadge.classList.toggle('evading', !state.police.inSight);
  }
  // Live SBPD Dispatch Panel
  const roster = state.police.dispatchRoster;
  this.el.dispatchPanel.classList.toggle('hidden', stars === 0 || roster.length === 0);
  if (stars > 0 && roster.length > 0) {
   this.el.dispatchCount.textContent = `${roster.length} UNITS`;
   this.el.dispatchList.innerHTML = roster.map((u) => `
    <div class="dispatch-row">
     <span class="dispatch-id">${u.callsign}</span>
     <span class="dispatch-dist">${u.dist}m</span>
     <span class="badge badge-${u.status}">${u.status}</span>
    </div>
   `).join('');
  }
  // Mission Card
  const m = state.missions.activeMission;
  const stage = state.missions.getCurrentStage();
  if (m && stage) {
   this.el.missionTag.textContent = m.code;
   this.el.missionTitle.textContent = m.title;
   this.el.missionObj.textContent = stage.obj;
   const dist = Math.round(Math.hypot(state.player.x - stage.target.x, state.player.z - stage.target.z));
   this.el.missionDist.textContent = stage.type === 'eliminate'
    ? `${state.combat.enemies.filter((e) => !e.isPolice).length} HOSTILES LEFT`
    : `${dist}m TO TARGET`;
   this.el.missionReward.textContent = `$${m.rewardCash.toLocaleString()} · +${m.rewardRep} REP`;
   const tm = Math.max(0, Math.ceil(state.missions.timer));
   this.el.missionTimer.textContent = `${String(Math.floor(tm / 60)).padStart(2, '0')}:${String(tm % 60).padStart(2, '0')}`;
   this.el.missionTimer.classList.remove('hidden');
  } else {
   this.el.missionTag.textContent = 'FREE ROAM';
   this.el.missionTitle.textContent = 'SOLARIS BAY SANDBOX';
   this.el.missionObj.textContent = 'Open [M] for the 8-Mission Campaign or visit Solis Customs [G]';
   this.el.missionDist.textContent = `${state.missions.completed.size}/8 COMPLETED`;
   this.el.missionReward.textContent = `REP ${state.player.respect}`;
   this.el.missionTimer.classList.add('hidden');
  }
  // Weapon Bar
  this.el.weaponBar.querySelectorAll('.w-slot').forEach((slot, idx) => {
   slot.classList.toggle('active', idx === state.player.weaponIdx);
   const aEl = document.getElementById(`w-ammo-${idx}`);
   if (aEl) aEl.textContent = WEAPONS[idx].melee ? 'INF' : String(state.combat.ammo[idx]);
  });
  // District & Vitals
  const dist = getDistrictAt(state.player.x, state.player.z);
  this.el.district.textContent = dist.name;
  this.el.barHp.style.width = `${Math.max(0, Math.min(100, state.player.hp))}%`;
  this.el.valHp.textContent = String(Math.round(state.player.hp));
  this.el.barAr.style.width = `${Math.max(0, Math.min(100, state.player.armor))}%`;
  this.el.valAr.textContent = String(Math.round(state.player.armor));
  this.el.barRep.style.width = `${Math.min(100, (state.player.respect % 500) / 5)}%`;
  this.el.valRep.textContent = String(state.player.respect);
  // Character Dialogue
  if (state.missions.dialogue) {
   const dlg = state.missions.dialogue;
   const ch = CHARACTERS[dlg.speaker] || CHARACTERS.elena;
   this.el.speaker.textContent = ch.name;
   this.el.role.textContent = ch.role;
   this.el.dialogueText.textContent = dlg.text;
   this._drawPortrait(dlg.speaker);
   this.el.dialogueBox.classList.remove('hidden');
  } else {
   this.el.dialogueBox.classList.add('hidden');
  }
  // Radio & Vehicle Speedometer
  const rad = state.audio.getCurrentRadio();
  this.el.radioStation.textContent = rad.station;
  this.el.radioTrack.textContent = rad.track;
  const eq = this.el.eqBars.children;
  for (let i = 0; i < eq.length; i++) {
   eq[i].style.height = `${4 + Math.round(Math.abs(Math.sin(time * 7 + i * 1.4)) * 8)}px`;
  }
  const pv = state.player.vehicle;
  if (pv) {
   this.el.vehWidget.classList.remove('hidden');
   this.el.reticle.classList.add('hidden');
   const mph = Math.round(Math.abs(pv.speed) * 2.65);
   this.el.speedNum.textContent = String(mph);
   const gear = pv.speed < -0.5 ? 'R' : String(Math.min(6, Math.max(1, Math.floor(mph / 24) + 1)));
   this.el.speedGear.textContent = gear;
   this.el.vehName.textContent = pv.spec.name.toUpperCase();
   this.el.barBoost.style.width = `${Math.round(pv.boost)}%`;
   this.el.barHull.style.width = `${Math.round((pv.hp / pv.maxHp) * 100)}%`;
  } else {
   this.el.vehWidget.classList.add('hidden');
   this.el.reticle.classList.toggle('hidden', state.mode !== 'play');
  }
  // Contextual action prompt
  let promptText = '';
  if (state.mode === 'play') {
   const distGarage = Math.hypot(state.player.x - LANDMARKS.garage.x, state.player.z - LANDMARKS.garage.z);
   const distSafe = Math.hypot(state.player.x - LANDMARKS.safehouse.x, state.player.z - LANDMARKS.safehouse.z);
   if (distGarage < 16) promptText = 'PRESS [G] TO ENTER SOLIS CUSTOMS GARAGE';
   else if (distSafe < 14) promptText = 'PRESS [K] TO SAVE & HEAL AT PALMETTO VILLA';
   else if (!pv) {
    const nearV = state.world.findNearestVehicle(state.player.x, state.player.z, 7.5);
    if (nearV) promptText = `PRESS [E] TO ${nearV.aiMode === 'traffic' ? 'CARJACK' : 'ENTER'} ${nearV.spec.name.toUpperCase()}`;
   }
  }
  this.el.prompt.textContent = promptText;
  this.el.prompt.classList.toggle('hidden', !promptText);
  // Minimap
  this._drawMinimap(state, time);
 }
}
