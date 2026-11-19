// SOLARIS BAY: GOLDEN HEAT — Web Audio API Synth Radio, Engine, Sirens & Gunfire
import { RADIO_STATIONS } from './config.js';
export class AudioEngine {
 constructor() {
  this.ctx = null;
  this.master = null;
  this.engineOsc = null;
  this.engineGain = null;
  this.sirenOsc = null;
  this.sirenGain = null;
  this.stationIdx = 0;
  this.trackIdx = 0;
  this.step = 0;
  this.beatAccum = 0;
  this.muted = false;
  this.ready = false;
 }
 unlock() {
  if (this.ready) {
   if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
   return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try {
   this.ctx = new AC();
   this.master = this.ctx.createGain();
   this.master.gain.value = 0.24;
   this.master.connect(this.ctx.destination);
   // Engine continuous sawtooth -> lowpass
   this.engineOsc = this.ctx.createOscillator();
   this.engineOsc.type = 'sawtooth';
   const engFilter = this.ctx.createBiquadFilter();
   engFilter.type = 'lowpass';
   engFilter.frequency.value = 260;
   this.engineGain = this.ctx.createGain();
   this.engineGain.gain.value = 0.0;
   this.engineOsc.connect(engFilter);
   engFilter.connect(this.engineGain);
   this.engineGain.connect(this.master);
   this.engineOsc.start();
   // Police siren oscillator
   this.sirenOsc = this.ctx.createOscillator();
   this.sirenOsc.type = 'triangle';
   this.sirenGain = this.ctx.createGain();
   this.sirenGain.gain.value = 0.0;
   this.sirenOsc.connect(this.sirenGain);
   this.sirenGain.connect(this.master);
   this.sirenOsc.start();
   this.ready = true;
  } catch {
   this.ready = false;
  }
 }
 cycleRadio() {
  this.stationIdx = (this.stationIdx + 1) % RADIO_STATIONS.length;
  this.trackIdx = (this.trackIdx + 1) % RADIO_STATIONS[this.stationIdx].tracks.length;
  this.step = 0;
  return this.getCurrentRadio();
 }
 getCurrentRadio() {
  const st = RADIO_STATIONS[this.stationIdx];
  return { station: st.name, track: st.tracks[this.trackIdx % st.tracks.length], genre: st.genre };
 }
 _playNote(freq, dur, type, vol) {
  if (!this.ready || this.muted || this.ctx.state !== 'running') return;
  const now = this.ctx.currentTime;
  const osc = this.ctx.createOscillator();
  const g = this.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  g.gain.setValueAtTime(vol, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  osc.connect(g);
  g.connect(this.master);
  osc.start(now);
  osc.stop(now + dur + 0.02);
 }
 playGunshot(weaponIdx) {
  if (!this.ready || this.muted || this.ctx.state !== 'running') return;
  const now = this.ctx.currentTime;
  if (weaponIdx === 0) {
   this._playNote(140, 0.09, 'triangle', 0.28);
   return;
  }
  // Filtered noise burst + punchy low thump
  const len = Math.floor(this.ctx.sampleRate * (weaponIdx === 3 ? 0.16 : 0.09));
  const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.35));
  const src = this.ctx.createBufferSource();
  src.buffer = buf;
  const filt = this.ctx.createBiquadFilter();
  filt.type = 'bandpass';
  filt.frequency.value = weaponIdx === 3 ? 520 : weaponIdx === 4 ? 1100 : 880;
  const g = this.ctx.createGain();
  g.gain.setValueAtTime(weaponIdx === 3 ? 0.45 : 0.32, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  src.connect(filt);
  filt.connect(g);
  g.connect(this.master);
  src.start(now);
 }
 playChime() {
  this._playNote(523.25, 0.16, 'triangle', 0.24);
  setTimeout(() => this._playNote(659.25, 0.18, 'triangle', 0.24), 90);
  setTimeout(() => this._playNote(783.99, 0.28, 'triangle', 0.28), 180);
 }
 update(dt, state, time) {
  if (!this.ready || this.muted || this.ctx.state !== 'running') return;
  const now = this.ctx.currentTime;
  const pv = state.player.vehicle;
  // Engine pitch & volume
  if (pv) {
   const spdRatio = Math.min(1, Math.abs(pv.speed) / pv.spec.topSpeed);
   this.engineOsc.frequency.setTargetAtTime(58 + spdRatio * 145 + (pv.boosting ? 32 : 0), now, 0.05);
   this.engineGain.gain.setTargetAtTime(0.09 + spdRatio * 0.08, now, 0.06);
  } else {
   this.engineGain.gain.setTargetAtTime(0.0, now, 0.08);
  }
  // Two-tone SBPD siren when wanted > 0
  if (state.police.stars > 0) {
   const wail = 640 + Math.sin(time * 5.2) * 210;
   this.sirenOsc.frequency.setTargetAtTime(wail, now, 0.04);
   this.sirenGain.gain.setTargetAtTime(0.055, now, 0.08);
  } else {
   this.sirenGain.gain.setTargetAtTime(0.0, now, 0.1);
  }
  // Procedural Radio Station Sequencer (active in vehicle)
  if (pv) {
   const st = RADIO_STATIONS[this.stationIdx];
   const stepDur = 60 / st.bpm / 2;
   this.beatAccum += dt;
   if (this.beatAccum >= stepDur) {
    this.beatAccum -= stepDur;
    const semi = st.scale[this.step % st.scale.length];
    const bass = st.root * 0.5 * Math.pow(2, (st.scale[(this.step >> 2) % st.scale.length]) / 12);
    const lead = st.root * Math.pow(2, semi / 12);
    this._playNote(bass, stepDur * 0.9, 'sawtooth', 0.06);
    if (this.step % 2 === 0) this._playNote(lead, stepDur * 0.75, 'triangle', 0.055);
    this.step++;
   }
  }
 }
}
