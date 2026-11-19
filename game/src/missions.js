// SOLARIS BAY: GOLDEN HEAT — 8-Mission Original Story Campaign
import { LANDMARKS } from './config.js';
export const CAMPAIGN_MISSIONS = [
 {
  id: 1,
  code: 'MISSION 01',
  title: 'GOLDEN ARRIVAL',
  giver: 'elena',
  district: 'Malecón del Sol',
  rewardCash: 3500,
  rewardRep: 120,
  timeLimit: 120,
  summary: 'Meet Elena at Coral Marina Pier and tune the Solis GT at Solis Customs.',
  stages: [
   {
    type: 'goto',
    target: { x: LANDMARKS.marinaPier.x - 24, z: LANDMARKS.marinaPier.z },
    radius: 18,
    obj: 'Drive the Solis GT down Malecón del Sol to Coral Marina Pier',
    dialogue: { speaker: 'elena', text: 'Welcome back to Solaris Bay, Rafael. Bring the Solis GT to Coral Marina before dusk.' },
   },
   {
    type: 'goto',
    target: { x: LANDMARKS.garage.x, z: LANDMARKS.garage.z + 8 },
    radius: 16,
    obj: 'Pull into Solis Customs for a fresh coat and ECU tune',
    dialogue: { speaker: 'elena', text: 'Clean run! Roll into Solis Customs — I already cleared the bay for your respray.' },
   },
  ],
 },
 {
  id: 2,
  code: 'MISSION 02',
  title: 'SUNSET BOOST',
  giver: 'elena',
  district: 'Malecón del Sol',
  rewardCash: 4800,
  rewardRep: 160,
  timeLimit: 135,
  wantedOnStart: 2,
  summary: 'Run hot down the Malecón under 2-star pursuit and reach Neon Plaza.',
  stages: [
   {
    type: 'goto',
    target: { x: LANDMARKS.maleconArch.x, z: LANDMARKS.maleconArch.z },
    radius: 18,
    obj: 'Tear north up Malecón del Sol past the Solis Promenade',
    dialogue: { speaker: 'elena', text: 'SBPD Interceptors just tagged our plates! Punch the throttle up the Malecón!' },
   },
   {
    type: 'goto',
    target: { x: LANDMARKS.neonPlaza.x, z: LANDMARKS.neonPlaza.z },
    radius: 18,
    obj: 'Shake the cruisers and drop the package at Neon Plaza',
    dialogue: { speaker: 'rafael', text: 'Let them eat wet asphalt. Cutting west into Neon Strip now.' },
   },
  ],
 },
 {
  id: 3,
  code: 'MISSION 03',
  title: 'DOCKSIDE MANIFEST',
  giver: 'mateo',
  district: 'Industrial Docks',
  rewardCash: 6200,
  rewardRep: 200,
  timeLimit: 180,
  summary: 'Eliminate cartel enforcers at Pier 9 Warehouse and secure Mateo\'s ledger.',
  stages: [
   {
    type: 'goto',
    target: { x: LANDMARKS.mateoDock.x + 22, z: LANDMARKS.mateoDock.z },
    radius: 20,
    obj: 'Drive to Pier 9 Warehouse in Industrial Docks',
    dialogue: { speaker: 'mateo', text: 'Rafael, armed crew locked down Pier 9. Bring heavy iron and clear the yard.' },
   },
   {
    type: 'eliminate',
    target: { x: LANDMARKS.mateoDock.x, z: LANDMARKS.mateoDock.z },
    count: 4,
    obj: 'Eliminate the 4 dockside enforcers at Pier 9',
    dialogue: { speaker: 'mateo', text: 'Four hostiles by the cranes! Switch to the Cobra SMG or Horizon Rifle!' },
   },
  ],
 },
 {
  id: 4,
  code: 'MISSION 04',
  title: 'NEON DEBT',
  giver: 'elena',
  district: 'Neon Strip',
  rewardCash: 5500,
  rewardRep: 185,
  timeLimit: 110,
  summary: 'Collect three high-roller payouts across Neon Strip before the clock runs out.',
  stages: [
   {
    type: 'goto',
    target: { x: 0, z: -105 },
    radius: 18,
    obj: 'Collect Club Mirage payout on North Neon Strip (1/3)',
    dialogue: { speaker: 'elena', text: 'Three clubs owe us before midnight. Hit Mirage first — keep your foot down.' },
   },
   {
    type: 'goto',
    target: { x: -105, z: 0 },
    radius: 18,
    obj: 'Collect Velvet Lounge payout on West Neon Strip (2/3)',
    dialogue: { speaker: 'rafael', text: 'Cash secured. Heading to Velvet Lounge next.' },
   },
   {
    type: 'goto',
    target: { x: 0, z: 105 },
    radius: 18,
    obj: 'Deliver the full ledger to South Neon Strip (3/3)',
    dialogue: { speaker: 'elena', text: 'Last drop is hot — watch for traffic at the intersection!' },
   },
  ],
 },
 {
  id: 5,
  code: 'MISSION 05',
  title: 'PIER PRESSURE',
  giver: 'mateo',
  district: 'Coral Marina',
  rewardCash: 7400,
  rewardRep: 240,
  timeLimit: 180,
  wantedOnStart: 2,
  summary: 'Break a syndicate ambush at Coral Marina and clear the waterfront.',
  stages: [
   {
    type: 'eliminate',
    target: { x: 112, z: 135 },
    count: 5,
    obj: 'Neutralize the 5 ambush shooters at Coral Marina',
    dialogue: { speaker: 'mateo', text: 'Ambush on the marina deck! Take cover and drop all five shooters!' },
   },
   {
    type: 'goto',
    target: { x: LANDMARKS.safehouse.x, z: LANDMARKS.safehouse.z },
    radius: 18,
    obj: 'Escape north to the Palmetto Heights Villa safehouse',
    dialogue: { speaker: 'elena', text: 'Sirens inbound! Burn rubber up to Palmetto Heights!' },
   },
  ],
 },
 {
  id: 6,
  code: 'MISSION 06',
  title: 'HILLTOP SIGNAL',
  giver: 'elena',
  district: 'Palmetto Heights',
  rewardCash: 8200,
  rewardRep: 260,
  timeLimit: 150,
  wantedOnStart: 3,
  summary: 'Outrun a 3-star SBPD Air-1 sweep from Palmetto Heights to Coral Marina.',
  stages: [
   {
    type: 'goto',
    target: { x: -105, z: -210 },
    radius: 18,
    obj: 'Tap the relay tower in Palmetto Heights',
    dialogue: { speaker: 'elena', text: 'Relay is live — Air-1 just scrambled! Hit the ridge and dive south!' },
   },
   {
    type: 'goto',
    target: { x: LANDMARKS.garage.x, z: LANDMARKS.garage.z + 8 },
    radius: 18,
    obj: 'Reach Solis Customs to scramble SBPD transponders',
    dialogue: { speaker: 'dispatch', text: 'All units: suspect fleeing Palmetto Heights. Air-1 spotlight locked!' },
   },
  ],
 },
 {
  id: 7,
  code: 'MISSION 07',
  title: 'HEAT WAVE',
  giver: 'mateo',
  district: 'Malecón del Sol',
  rewardCash: 9800,
  rewardRep: 310,
  timeLimit: 145,
  wantedOnStart: 4,
  summary: 'Survive a 4-star coastal blitz down the Malecón with Air-1 overhead.',
  stages: [
   {
    type: 'goto',
    target: { x: 105, z: -210 },
    radius: 20,
    obj: 'Smash through the north Malecón checkpoint under 4-star heat',
    dialogue: { speaker: 'mateo', text: 'Four stars on the scanner! Keep the Solis GT pinned on the wet strip!' },
   },
   {
    type: 'goto',
    target: { x: LANDMARKS.garage.x, z: LANDMARKS.garage.z + 8 },
    radius: 18,
    obj: 'Dive into Solis Customs to dump the 4-star tail',
    dialogue: { speaker: 'rafael', text: 'Interceptors on my bumper, Air-1 overhead — making the turn for Solis Customs!' },
   },
  ],
 },
 {
  id: 8,
  code: 'MISSION 08',
  title: 'SOLARIS CROWN',
  giver: 'elena',
  district: 'Solaris Bay',
  rewardCash: 18000,
  rewardRep: 500,
  timeLimit: 210,
  wantedOnStart: 5,
  summary: 'The grand finale: hit the Palmetto vault and extract at Pier 9 under 5-star lockdown.',
  stages: [
   {
    type: 'eliminate',
    target: { x: -52, z: -105 },
    count: 5,
    obj: 'Breach the Neon Strip vault guards (5 hostiles)',
    dialogue: { speaker: 'elena', text: 'This is it, Rafael — the Solaris Crown score. Clear the vault security!' },
   },
   {
    type: 'goto',
    target: { x: LANDMARKS.mateoDock.x, z: LANDMARKS.mateoDock.z },
    radius: 20,
    obj: 'Deliver the vault haul to Mateo at Industrial Docks under 5-star heat',
    dialogue: { speaker: 'mateo', text: 'Boat is idling at Pier 9! Bring the gold home, king of Solaris Bay!' },
   },
  ],
 },
];
export class MissionManager {
 constructor() {
  this.completed = new Set();
  this.activeMission = null;
  this.stageIndex = 0;
  this.timer = 0;
  this.waypoint = null;
  this.customWaypoint = null;
  this.dialogue = null;
  this.dialogueTimer = 0;
 }
 startMission(missionId, state) {
  const m = CAMPAIGN_MISSIONS.find((x) => x.id === missionId);
  if (!m) return;
  this.activeMission = m;
  this.stageIndex = 0;
  this.timer = m.timeLimit;
  if (m.wantedOnStart) {
   state.police.setWanted(m.wantedOnStart, state);
  }
  this._setupStage(state);
 }
 _setupStage(state) {
  const stage = this.getCurrentStage();
  if (!stage) return;
  this.waypoint = { x: stage.target.x, z: stage.target.z, label: stage.obj };
  if (stage.dialogue) {
   this.showDialogue(stage.dialogue.speaker, stage.dialogue.text, 7.5);
  }
  if (stage.type === 'eliminate') {
   state.combat.spawnHostileSquad(stage.target.x, stage.target.z, stage.count, false);
  }
 }
 getCurrentStage() {
  if (!this.activeMission) return null;
  return this.activeMission.stages[this.stageIndex] || null;
 }
 showDialogue(speaker, text, duration = 6) {
  this.dialogue = { speaker, text };
  this.dialogueTimer = duration;
 }
 setCustomWaypoint(x, z) {
  this.customWaypoint = { x, z, label: 'GPS WAYPOINT' };
  if (!this.activeMission) this.waypoint = this.customWaypoint;
 }
 update(dt, state) {
  if (this.dialogueTimer > 0) {
   this.dialogueTimer -= dt;
   if (this.dialogueTimer <= 0) this.dialogue = null;
  }
  if (!this.activeMission) {
   this.waypoint = this.customWaypoint;
   return;
  }
  const stage = this.getCurrentStage();
  if (!stage) return;
  this.timer -= dt;
  if (this.timer <= 0) {
   state.ui.showBanner('MISSION FAILED', this.activeMission.title, 'TIME EXPIRED — RETRY FROM CAMPAIGN MENU', 3.2);
   this.activeMission = null;
   this.waypoint = this.customWaypoint;
   return;
  }
  let stageDone = false;
  if (stage.type === 'goto') {
   const dist = Math.hypot(state.player.x - stage.target.x, state.player.z - stage.target.z);
   if (dist <= (stage.radius || 18)) stageDone = true;
  } else if (stage.type === 'eliminate') {
   const alive = state.combat.enemies.filter((e) => e.hp > 0 && !e.isPolice).length;
   if (alive === 0) stageDone = true;
  }
  if (stageDone) {
   this.stageIndex++;
   if (this.stageIndex >= this.activeMission.stages.length) {
    const m = this.activeMission;
    this.completed.add(m.id);
    state.player.cash += m.rewardCash;
    state.player.respect += m.rewardRep;
    state.audio.playChime();
    state.ui.showBanner('MISSION PASSED', m.title, `+$${m.rewardCash.toLocaleString()} · +${m.rewardRep} RESPECT`, 3.6);
    this.activeMission = null;
    this.waypoint = this.customWaypoint;
    // Queue next uncompleted mission automatically after a short beat
    const next = CAMPAIGN_MISSIONS.find((x) => !this.completed.has(x.id));
    if (next) {
     this.showDialogue(next.giver, `Nice work! Open Campaign [M] when ready for ${next.title}.`, 6);
    }
   } else {
    state.audio.playChime();
    this._setupStage(state);
   }
  }
 }
}
