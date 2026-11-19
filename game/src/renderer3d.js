// SOLARIS BAY: GOLDEN HEAT — Custom WebGL2 3D Engine (Zero Dependencies)
import { WORLD, LANDMARKS, STUNT_RAMPS } from './config.js';
const STRIDE_FLOATS = 10; // x,y,z, nx,ny,nz, r,g,b, mat
const SKY_VS = `#version 300 es
precision highp float;
const vec2 POS[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
out vec2 vUv;
void main() {
 vUv = POS[gl_VertexID] * 0.5 + 0.5;
 gl_Position = vec4(POS[gl_VertexID], 0.9999, 1.0);
}`;
const SKY_FS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform vec3 uCamRight, uCamUp, uCamFwd;
uniform float uTanHalfFov, uAspect, uTime;
uniform vec3 uSunDir;
out vec4 fragColor;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
 vec2 i = floor(p), f = fract(p);
 f = f * f * (3.0 - 2.0 * f);
 return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
       mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main() {
 vec2 ndc = vUv * 2.0 - 1.0;
 vec3 dir = normalize(uCamFwd + uCamRight * (ndc.x * uAspect * uTanHalfFov) + uCamUp * (ndc.y * uTanHalfFov));
 float h = clamp(dir.y, -0.2, 1.0);
 vec3 zenith  = vec3(0.15, 0.09, 0.30);
 vec3 midSky  = vec3(0.76, 0.25, 0.44);
 vec3 lowSky  = vec3(1.00, 0.56, 0.26);
 vec3 horizon = vec3(1.00, 0.80, 0.44);
 vec3 col = mix(horizon, lowSky, smoothstep(0.0, 0.14, h));
 col = mix(col, midSky, smoothstep(0.11, 0.36, h));
 col = mix(col, zenith, smoothstep(0.32, 0.78, h));
 // Sun disc & golden halo
 float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
 col += vec3(1.0, 0.55, 0.22) * pow(sunDot, 7.0) * 0.65;
 col += vec3(1.0, 0.88, 0.58) * pow(sunDot, 48.0) * 0.9;
 float disc = smoothstep(0.9962, 0.9982, sunDot);
 col = mix(col, vec3(1.0, 0.98, 0.86), disc);
 // Sunset cloud bands
 if (dir.y > 0.03) {
  vec2 cp = dir.xz / (dir.y + 0.16) * 1.45 + vec2(uTime * 0.008, 0.0);
  float c = noise(cp * 2.0) * 0.6 + noise(cp * 4.5 + 3.1) * 0.4;
  float cloudMask = smoothstep(0.54, 0.80, c) * smoothstep(0.03, 0.22, dir.y) * (1.0 - smoothstep(0.45, 0.85, dir.y));
  vec3 cloudLit = mix(vec3(0.55, 0.22, 0.42), vec3(1.0, 0.72, 0.40), pow(sunDot, 2.0));
  col = mix(col, cloudLit, cloudMask * 0.68);
 }
 fragColor = vec4(col, 1.0);
}`;
const WORLD_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNorm;
layout(location=2) in vec3 aCol;
layout(location=3) in float aMat;
uniform mat4 uViewProj;
out vec3 vPos, vNorm, vCol;
out float vMat;
void main() {
 vPos = aPos;
 vNorm = aNorm;
 vCol = aCol;
 vMat = aMat;
 gl_Position = uViewProj * vec4(aPos, 1.0);
}`;
const WORLD_FS = `#version 300 es
precision highp float;
in vec3 vPos, vNorm, vCol;
in float vMat;
uniform vec3 uCamPos, uSunDir;
uniform float uTime;
out vec4 fragColor;
void main() {
 vec3 N = normalize(vNorm);
 vec3 V = normalize(uCamPos - vPos);
 vec3 L = normalize(uSunDir);
 float dist = length(uCamPos - vPos);
 vec3 col = vCol;
 if (vMat > 3.5) {
  // Emissive neon / headlights / windows / lightbars
  col = vCol * 1.25;
 } else if (vMat > 1.5 && vMat < 2.5) {
  // Shimmering turquoise ocean
  float w1 = sin(vPos.x * 0.22 + uTime * 1.9 + vPos.z * 0.08) * 0.06;
  float w2 = cos(vPos.z * 0.28 - uTime * 1.4 + vPos.x * 0.11) * 0.05;
  vec3 wn = normalize(vec3(w1, 1.0, w2));
  float shore = smoothstep(205.0, 265.0, vPos.x);
  vec3 baseWater = mix(vec3(0.08, 0.76, 0.78), vec3(0.04, 0.34, 0.56), shore);
  float fres = pow(1.0 - max(dot(wn, V), 0.0), 3.0);
  vec3 skyRefl = vec3(1.0, 0.58, 0.36);
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(wn, H), 0.0), 96.0);
  float sparkle = pow(max(dot(wn, H), 0.0), 18.0) * 0.35;
  col = mix(baseWater, skyRefl, fres * 0.65) + vec3(1.0, 0.85, 0.52) * (spec * 1.4 + sparkle);
 } else {
  float ndl = max(dot(N, L), 0.0);
  float hemi = N.y * 0.5 + 0.5;
  vec3 ambient = mix(vec3(0.24, 0.16, 0.30), vec3(0.56, 0.42, 0.50), hemi);
  vec3 sunLight = vec3(1.05, 0.74, 0.46) * ndl;
  vec3 fillLight = vec3(0.26, 0.36, 0.56) * max(dot(N, normalize(vec3(-0.6, 0.4, 0.7))), 0.0);
  col = vCol * (ambient * 0.78 + sunLight * 0.88 + fillLight * 0.35);
  if (vMat > 0.5 && vMat < 1.5) {
   // Wet asphalt specular reflection
   vec3 H = normalize(L + V);
   float wetSpec = pow(max(dot(N, H), 0.0), 34.0);
   float fres = pow(1.0 - max(dot(N, V), 0.0), 3.2);
   float sheen = 0.55 + 0.45 * sin(vPos.x * 0.18) * cos(vPos.z * 0.14);
   col += vec3(1.0, 0.62, 0.34) * wetSpec * 0.52 * sheen;
   col = mix(col, vec3(0.86, 0.44, 0.42), fres * 0.28 * sheen);
  } else if (vMat > 2.5 && vMat < 3.5) {
   // Metallic glossy vehicle paint
   vec3 H = normalize(L + V);
   float spec = pow(max(dot(N, H), 0.0), 56.0);
   float fres = pow(1.0 - max(dot(N, V), 0.0), 2.8);
   col += vec3(1.0, 0.86, 0.65) * spec * 0.72 + vec3(0.95, 0.52, 0.46) * fres * 0.35;
  }
 }
 // Golden-hour atmospheric haze
 float fog = 1.0 - exp(-pow(dist * 0.0029, 1.55));
 vec3 fogCol = mix(vec3(0.96, 0.55, 0.38), vec3(0.68, 0.32, 0.48), clamp((vPos.y + 4.0) * 0.015, 0.0, 1.0));
 col = mix(col, fogCol, clamp(fog, 0.0, 0.88));
 // Mild filmic tone curve
 col = col / (col + vec3(0.75)) * 1.62;
 fragColor = vec4(col, 1.0);
}`;
const FX_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec4 aCol;
uniform mat4 uViewProj;
out vec4 vCol;
void main() {
 vCol = aCol;
 gl_Position = uViewProj * vec4(aPos, 1.0);
}`;
const FX_FS = `#version 300 es
precision highp float;
in vec4 vCol;
out vec4 fragColor;
void main() {
 fragColor = vCol;
}`;
function compileShader(gl, type, src) {
 const s = gl.createShader(type);
 gl.shaderSource(s, src);
 gl.compileShader(s);
 if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
  throw new Error(gl.getShaderInfoLog(s) || 'Shader compile error');
 }
 return s;
}
function createProgram(gl, vsSrc, fsSrc) {
 const p = gl.createProgram();
 gl.attachShader(p, compileShader(gl, gl.VERTEX_SHADER, vsSrc));
 gl.attachShader(p, compileShader(gl, gl.FRAGMENT_SHADER, fsSrc));
 gl.linkProgram(p);
 if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
  throw new Error(gl.getProgramInfoLog(p) || 'Program link error');
 }
 return p;
}
function mat4Perspective(fovRad, aspect, near, far) {
 const f = 1 / Math.tan(fovRad * 0.5);
 const nf = 1 / (near - far);
 return new Float32Array([
  f / aspect, 0, 0, 0,
  0, f, 0, 0,
  0, 0, (far + near) * nf, -1,
  0, 0, 2 * far * near * nf, 0,
 ]);
}
function mat4LookAt(eye, target) {
 let zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2];
 let zl = Math.hypot(zx, zy, zz) || 1;
 zx /= zl; zy /= zl; zz /= zl;
 let xx = zz, xy = 0, xz = -zx;
 let xl = Math.hypot(xx, xy, xz) || 1;
 xx /= xl; xz /= xl;
 let yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
 return {
  view: new Float32Array([
   xx, yx, zx, 0,
   xy, yy, zy, 0,
   xz, yz, zz, 0,
   -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
   -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
   -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
   1,
  ]),
  right: [xx, xy, xz],
  up: [yx, yy, yz],
  fwd: [-zx, -zy, -zz],
 };
}
function mat4Mul(a, b) {
 const out = new Float32Array(16);
 for (let c = 0; c < 4; c++) {
  for (let r = 0; r < 4; r++) {
   out[c * 4 + r] =
    a[r] * b[c * 4] +
    a[4 + r] * b[c * 4 + 1] +
    a[8 + r] * b[c * 4 + 2] +
    a[12 + r] * b[c * 4 + 3];
  }
 }
 return out;
}
class MeshBuilder {
 constructor(initialFloats = 120000) {
  this.data = new Float32Array(initialFloats);
  this.len = 0;
 }
 reset() { this.len = 0; }
 ensure(extra) {
  if (this.len + extra <= this.data.length) return;
  const next = new Float32Array(Math.max(this.data.length * 2, this.len + extra + 8192));
  next.set(this.data.subarray(0, this.len));
  this.data = next;
 }
 v(x, y, z, nx, ny, nz, r, g, b, mat = 0) {
  const d = this.data, i = this.len;
  d[i] = x; d[i + 1] = y; d[i + 2] = z;
  d[i + 3] = nx; d[i + 4] = ny; d[i + 5] = nz;
  d[i + 6] = r; d[i + 7] = g; d[i + 8] = b;
  d[i + 9] = mat;
  this.len = i + 10;
 }
 quad(p0, p1, p2, p3, n, col, mat = 0) {
  this.ensure(60);
  const [r, g, b] = col, [nx, ny, nz] = n;
  this.v(p0[0], p0[1], p0[2], nx, ny, nz, r, g, b, mat);
  this.v(p1[0], p1[1], p1[2], nx, ny, nz, r, g, b, mat);
  this.v(p2[0], p2[1], p2[2], nx, ny, nz, r, g, b, mat);
  this.v(p0[0], p0[1], p0[2], nx, ny, nz, r, g, b, mat);
  this.v(p2[0], p2[1], p2[2], nx, ny, nz, r, g, b, mat);
  this.v(p3[0], p3[1], p3[2], nx, ny, nz, r, g, b, mat);
 }
 box(cx, cy, cz, sx, sy, sz, col, mat = 0, yaw = 0, topCol = null) {
  const hx = sx * 0.5, hy = sy * 0.5, hz = sz * 0.5;
  const ca = Math.cos(yaw), sa = Math.sin(yaw);
  const rot = (x, y, z) => [cx + x * ca - z * sa, cy + y, cz + x * sa + z * ca];
  const rn = (x, y, z) => [x * ca - z * sa, y, x * sa + z * ca];
  const p = [
   rot(-hx, -hy, -hz), rot(hx, -hy, -hz), rot(hx, hy, -hz), rot(-hx, hy, -hz),
   rot(-hx, -hy, hz),  rot(hx, -hy, hz),  rot(hx, hy, hz),  rot(-hx, hy, hz),
  ];
  this.quad(p[4], p[5], p[6], p[7], rn(0, 0, 1), col, mat);
  this.quad(p[1], p[0], p[3], p[2], rn(0, 0, -1), col, mat);
  this.quad(p[5], p[1], p[2], p[6], rn(1, 0, 0), col, mat);
  this.quad(p[0], p[4], p[7], p[3], rn(-1, 0, 0), col, mat);
  this.quad(p[7], p[6], p[2], p[3], [0, 1, 0], topCol || col, mat);
  this.quad(p[0], p[1], p[5], p[4], [0, -1, 0], col, mat);
 }
}
class FxBuilder {
 constructor(maxFloats = 40000) {
  this.data = new Float32Array(maxFloats);
  this.len = 0;
 }
 reset() { this.len = 0; }
 ensure(extra) {
  if (this.len + extra <= this.data.length) return;
  const next = new Float32Array(this.data.length * 2 + extra);
  next.set(this.data.subarray(0, this.len));
  this.data = next;
 }
 tri(a, b, c, colA, colB = colA, colC = colA) {
  this.ensure(21);
  const d = this.data; let i = this.len;
  d[i++] = a[0]; d[i++] = a[1]; d[i++] = a[2]; d[i++] = colA[0]; d[i++] = colA[1]; d[i++] = colA[2]; d[i++] = colA[3];
  d[i++] = b[0]; d[i++] = b[1]; d[i++] = b[2]; d[i++] = colB[0]; d[i++] = colB[1]; d[i++] = colB[2]; d[i++] = colB[3];
  d[i++] = c[0]; d[i++] = c[1]; d[i++] = c[2]; d[i++] = colC[0]; d[i++] = colC[1]; d[i++] = colC[2]; d[i++] = colC[3];
  this.len = i;
 }
 quad(a, b, c, d, col) {
  this.tri(a, b, c, col);
  this.tri(a, c, d, col);
 }
}
export class Renderer3D {
 constructor(canvas) {
  this.canvas = canvas;
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: false, preserveDrawingBuffer: true });
  if (!gl) throw new Error('WebGL2 unavailable');
  this.gl = gl;
  this.skyProg = createProgram(gl, SKY_VS, SKY_FS);
  this.worldProg = createProgram(gl, WORLD_VS, WORLD_FS);
  this.fxProg = createProgram(gl, FX_VS, FX_FS);
  this.uSky = {
   camRight: gl.getUniformLocation(this.skyProg, 'uCamRight'),
   camUp: gl.getUniformLocation(this.skyProg, 'uCamUp'),
   camFwd: gl.getUniformLocation(this.skyProg, 'uCamFwd'),
   tanHalfFov: gl.getUniformLocation(this.skyProg, 'uTanHalfFov'),
   aspect: gl.getUniformLocation(this.skyProg, 'uAspect'),
   time: gl.getUniformLocation(this.skyProg, 'uTime'),
   sunDir: gl.getUniformLocation(this.skyProg, 'uSunDir'),
  };
  this.uWorld = {
   viewProj: gl.getUniformLocation(this.worldProg, 'uViewProj'),
   camPos: gl.getUniformLocation(this.worldProg, 'uCamPos'),
   sunDir: gl.getUniformLocation(this.worldProg, 'uSunDir'),
   time: gl.getUniformLocation(this.worldProg, 'uTime'),
  };
  this.uFx = {
   viewProj: gl.getUniformLocation(this.fxProg, 'uViewProj'),
  };
  this.skyVao = gl.createVertexArray();
  this.staticVao = gl.createVertexArray();
  this.staticVbo = gl.createBuffer();
  this.staticCount = 0;
  this.dynVao = gl.createVertexArray();
  this.dynVbo = gl.createBuffer();
  this.dynBuilder = new MeshBuilder(140000);
  this.fxVao = gl.createVertexArray();
  this.fxVbo = gl.createBuffer();
  this.fxBuilder = new FxBuilder(45000);
  this._setupWorldVao(this.staticVao, this.staticVbo);
  this._setupWorldVao(this.dynVao, this.dynVbo);
  this._setupFxVao(this.fxVao, this.fxVbo);
  this.sunDir = [0.68, 0.21, -0.70];
  this.camPos = [105, 8, 60];
  this.camTarget = [105, 2, 40];
  this.fov = 58 * Math.PI / 180;
  this.resize();
 }
 _setupWorldVao(vao, vbo) {
  const gl = this.gl;
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  const stride = STRIDE_FLOATS * 4;
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 12);
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, stride, 24);
  gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, stride, 36);
  gl.bindVertexArray(null);
 }
 _setupFxVao(vao, vbo) {
  const gl = this.gl;
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 28, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 28, 12);
  gl.bindVertexArray(null);
 }
 resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.floor(this.canvas.clientWidth * dpr));
  const h = Math.max(1, Math.floor(this.canvas.clientHeight * dpr));
  if (this.canvas.width !== w || this.canvas.height !== h) {
   this.canvas.width = w;
   this.canvas.height = h;
  }
 }
 buildStaticCity(world) {
  const mb = new MeshBuilder(420000);
  // Ground base (city concrete/earth west of beach)
  mb.quad([-420, -0.08, -420], [WORLD.beachX, -0.08, -420], [WORLD.beachX, -0.08, 420], [-420, -0.08, 420], [0, 1, 0], [0.24, 0.22, 0.26], 0);
  // Golden sandy beach
  mb.quad([WORLD.beachX, -0.06, -420], [WORLD.oceanX + 12, -0.35, -420], [WORLD.oceanX + 12, -0.35, 420], [WORLD.beachX, -0.06, 420], [0, 1, 0], [0.92, 0.76, 0.50], 0);
  // Seawall promenade along Malecón del Sol & Coral Marina
  mb.box(139, 0.35, 0, 16, 0.7, 680, [0.88, 0.80, 0.72], 0, 0, [0.92, 0.84, 0.75]);
  mb.box(147.2, 0.9, 0, 0.8, 0.7, 680, [0.22, 0.76, 0.78], 0);
  // Shimmering turquoise ocean (subdivided for wave normals)
  const ox0 = WORLD.oceanX, ox1 = 560, oz0 = -460, oz1 = 460;
  const nx = 14, nz = 20;
  for (let ix = 0; ix < nx; ix++) {
   for (let iz = 0; iz < nz; iz++) {
    const x0 = ox0 + (ox1 - ox0) * (ix / nx), x1 = ox0 + (ox1 - ox0) * ((ix + 1) / nx);
    const z0 = oz0 + (oz1 - oz0) * (iz / nz), z1 = oz0 + (oz1 - oz0) * ((iz + 1) / nz);
    mb.quad([x0, -0.22, z0], [x1, -0.22, z0], [x1, -0.22, z1], [x0, -0.22, z1], [0, 1, 0], [0.1, 0.7, 0.75], 2);
   }
  }
  // Coral Marina wooden piers & yachts
  for (const pz of [125, 170, 215]) {
   mb.box(188, 0.55, pz, 56, 0.45, 5.5, [0.58, 0.39, 0.25], 0);
   // Moored luxury yacht
   mb.box(212, 1.0, pz + 7.5, 13, 1.6, 4.2, [0.95, 0.96, 0.98], 3);
   mb.box(210, 2.2, pz + 7.5, 6.5, 1.3, 3.0, [0.18, 0.78, 0.88], 3);
   mb.box(216, 1.7, pz + 7.5, 2.5, 0.25, 3.6, [0.98, 0.65, 0.25], 4);
  }
  // Wet-asphalt road grid + markings
  const rw = WORLD.roadWidth;
  const roadCol = [0.13, 0.13, 0.17];
  const lineYellow = [0.96, 0.74, 0.22];
  const lineWhite = [0.88, 0.90, 0.94];
  const curbCol = [0.68, 0.64, 0.62];
  for (const ax of WORLD.avenuesX) {
   mb.quad([ax - rw * 0.5, 0.02, -320], [ax + rw * 0.5, 0.02, -320], [ax + rw * 0.5, 0.02, 320], [ax - rw * 0.5, 0.02, 320], [0, 1, 0], roadCol, 1);
   // Sidewalks
   mb.box(ax - rw * 0.5 - 3.2, 0.14, 0, 6.4, 0.28, 640, curbCol, 0);
   mb.box(ax + rw * 0.5 + 3.2, 0.14, 0, 6.4, 0.28, 640, curbCol, 0);
   // Double yellow center line
   mb.quad([ax - 0.32, 0.04, -315], [ax - 0.12, 0.04, -315], [ax - 0.12, 0.04, 315], [ax - 0.32, 0.04, 315], [0, 1, 0], lineYellow, 0);
   mb.quad([ax + 0.12, 0.04, -315], [ax + 0.32, 0.04, -315], [ax + 0.32, 0.04, 315], [ax + 0.12, 0.04, 315], [0, 1, 0], lineYellow, 0);
   // Dashed lane dividers
   for (let z = -305; z < 305; z += 14) {
    mb.quad([ax - 6.0, 0.04, z], [ax - 5.75, 0.04, z], [ax - 5.75, 0.04, z + 6.5], [ax - 6.0, 0.04, z + 6.5], [0, 1, 0], lineWhite, 0);
    mb.quad([ax + 5.75, 0.04, z], [ax + 6.0, 0.04, z], [ax + 6.0, 0.04, z + 6.5], [ax + 5.75, 0.04, z + 6.5], [0, 1, 0], lineWhite, 0);
   }
  }
  for (const sz of WORLD.streetsZ) {
   mb.quad([-300, 0.025, sz - rw * 0.5], [132, 0.025, sz - rw * 0.5], [132, 0.025, sz + rw * 0.5], [-300, 0.025, sz + rw * 0.5], [0, 1, 0], roadCol, 1);
   mb.quad([-295, 0.042, sz - 0.22], [128, 0.042, sz - 0.22], [128, 0.042, sz + 0.22], [-295, 0.042, sz + 0.22], [0, 1, 0], lineYellow, 0);
  }
  // Crosswalks at intersections
  for (const ax of WORLD.avenuesX) {
   for (const sz of WORLD.streetsZ) {
    for (let s = -8; s <= 8; s += 3.2) {
     mb.quad([ax + s - 0.7, 0.048, sz - 14.5], [ax + s + 0.7, 0.048, sz - 14.5], [ax + s + 0.7, 0.048, sz - 11.2], [ax + s - 0.7, 0.048, sz - 11.2], [0, 1, 0], lineWhite, 0);
     mb.quad([ax + s - 0.7, 0.048, sz + 11.2], [ax + s + 0.7, 0.048, sz + 11.2], [ax + s + 0.7, 0.048, sz + 14.5], [ax + s - 0.7, 0.048, sz + 14.5], [0, 1, 0], lineWhite, 0);
    }
   }
  }
  // Art-Deco Buildings, Docks, Villas & Solis Customs Garage
  for (const b of world.buildings) {
   this._addBuilding(mb, b);
  }
  // Solis Customs Open Garage Showcase Bay
  const g = LANDMARKS.garage;
  mb.box(g.x, 0.08, g.z, 22, 0.16, 18, [0.22, 0.24, 0.29], 1);
  mb.box(g.x - 10.5, 3.8, g.z, 1.2, 7.6, 18, [0.95, 0.82, 0.68], 0);
  mb.box(g.x, 3.8, g.z - 8.5, 22, 7.6, 1.2, [0.95, 0.82, 0.68], 0);
  mb.box(g.x, 7.9, g.z, 23, 1.0, 19, [0.16, 0.18, 0.26], 0);
  mb.box(g.x, 8.9, g.z + 9.2, 16, 1.1, 0.6, [1.0, 0.72, 0.20], 4); // Gold neon header
  mb.box(g.x, 7.5, g.z + 9.3, 18, 0.35, 0.4, [0.22, 0.92, 1.0], 4); // Cyan neon strip
  // Garage interior lift posts
  mb.box(g.x - 4.2, 2.2, g.z - 1.5, 0.55, 4.4, 0.55, [0.95, 0.32, 0.42], 3);
  mb.box(g.x + 4.2, 2.2, g.z - 1.5, 0.55, 4.4, 0.55, [0.95, 0.32, 0.42], 3);
  // Curved 3D Palm Trees along Malecón, beach & boulevards
  for (const p of world.palms) {
   this._addPalmTree(mb, p.x, p.z, p.h, p.leanX, p.leanZ);
  }
  // Art-Deco Streetlamps along Malecón & Neon Strip
  for (const ax of [0, 105]) {
   for (let z = -260; z <= 260; z += 36) {
    if (Math.abs(z % 105) < 16) continue;
    for (const side of [-1, 1]) {
     const lx = ax + side * 14.5;
     mb.box(lx, 4.2, z, 0.35, 8.4, 0.35, [0.24, 0.28, 0.36], 3);
     mb.box(lx - side * 1.1, 8.2, z, 2.4, 0.25, 0.25, [0.24, 0.28, 0.36], 3);
     mb.box(lx - side * 2.1, 7.9, z, 0.75, 0.45, 0.55, [1.0, 0.82, 0.42], 4);
    }
   }
  }
  // Stunt Ramps
  for (const r of STUNT_RAMPS) {
   this._addRamp(mb, r);
  }
  const gl = this.gl;
  gl.bindBuffer(gl.ARRAY_BUFFER, this.staticVbo);
  gl.bufferData(gl.ARRAY_BUFFER, mb.data.subarray(0, mb.len), gl.STATIC_DRAW);
  this.staticCount = mb.len / STRIDE_FLOATS;
 }
 _addBuilding(mb, b) {
  const cx = b.x, cz = b.z, w = b.w, d = b.d, h = b.h;
  mb.box(cx, h * 0.5, cz, w, h, d, b.color, 0, 0, [b.color[0] * 0.85, b.color[1] * 0.85, b.color[2] * 0.88]);
  // Art-Deco upper setback & roof trim
  if (h > 14 && b.style !== 'dock') {
   mb.box(cx, h + 1.4, cz, w * 0.74, 2.8, d * 0.74, b.trim, 0);
   mb.box(cx, h + 0.25, cz, w + 0.5, 0.5, d + 0.5, b.neon, 4);
  }
  // Lit window strips on front/back/east/west faces
  const floors = Math.min(9, Math.floor((h - 3) / 3.4));
  const winCol = b.style === 'neon' ? [0.98, 0.86, 0.56] : [1.0, 0.84, 0.54];
  const winAlt = [0.35, 0.88, 1.0];
  for (let f = 0; f < floors; f++) {
   const wy = 3.4 + f * 3.3;
   const wc = (f + b.seed) % 3 === 0 ? winAlt : winCol;
   mb.box(cx, wy, cz + d * 0.5 + 0.08, w * 0.78, 1.25, 0.12, wc, 4);
   mb.box(cx, wy, cz - d * 0.5 - 0.08, w * 0.78, 1.25, 0.12, wc, 4);
   mb.box(cx + w * 0.5 + 0.08, wy, cz, 0.12, 1.25, d * 0.78, wc, 4);
   mb.box(cx - w * 0.5 - 0.08, wy, cz, 0.12, 1.25, d * 0.78, wc, 4);
  }
  // Vertical neon blade sign on high-rises & clubs
  if (b.hasNeon) {
   const nx = cx + w * 0.5 + 0.45;
   mb.box(nx, Math.min(h * 0.65, 16), cz + d * 0.22, 0.35, Math.min(h * 0.45, 9.5), 1.35, b.neon, 4);
   mb.box(cx, 4.4, cz + d * 0.5 + 0.35, w * 0.62, 1.0, 0.3, b.neon, 4);
  }
  // Industrial dock crane boom
  if (b.style === 'dock' && b.seed % 2 === 0) {
   mb.box(cx, h + 6.5, cz, 1.4, 13, 1.4, [0.95, 0.56, 0.14], 0);
   mb.box(cx + 8, h + 12.2, cz, 18, 1.2, 1.2, [0.95, 0.56, 0.14], 0);
  }
 }
 _addPalmTree(mb, x, z, h, leanX, leanZ) {
  const segs = 5;
  let px = x, py = 0, pz = z;
  const trunkCol = [0.46, 0.31, 0.20];
  for (let i = 0; i < segs; i++) {
   const t = (i + 1) / segs;
   const nx = x + leanX * t * t;
   const ny = h * t;
   const nz = z + leanZ * t * t;
   const thick = 0.52 * (1 - t * 0.48);
   mb.box((px + nx) * 0.5, (py + ny) * 0.5, (pz + nz) * 0.5, thick, (ny - py) * 1.08, thick, trunkCol, 0);
   px = nx; py = ny; pz = nz;
  }
  // 7 arching palm fronds
  const frondCol1 = [0.16, 0.56, 0.28];
  const frondCol2 = [0.28, 0.68, 0.30];
  for (let f = 0; f < 7; f++) {
   const a = (f / 7) * Math.PI * 2 + (x * 0.1);
   const dx = Math.cos(a), dz = Math.sin(a);
   const c = f % 2 === 0 ? frondCol1 : frondCol2;
   mb.box(px + dx * 1.7, py + 0.35, pz + dz * 1.7, 3.2, 0.16, 0.72, c, 0, -a);
   mb.box(px + dx * 3.6, py - 0.35, pz + dz * 3.6, 2.5, 0.14, 0.56, c, 0, -a);
  }
 }
 _addRamp(mb, r) {
  const hw = r.w * 0.5, hl = r.len * 0.5;
  const ca = Math.cos(r.angle), sa = Math.sin(r.angle);
  const pt = (lx, ly, lz) => [r.x + lx * ca - lz * sa, ly, r.z + lx * sa + lz * ca];
  const p0 = pt(-hw, 0.06, -hl), p1 = pt(hw, 0.06, -hl), p2 = pt(hw, r.h, hl), p3 = pt(-hw, r.h, hl);
  mb.quad(p0, p1, p2, p3, [0, 0.94, 0.3], [0.95, 0.72, 0.14], 0);
  mb.quad(pt(-hw, 0, hl), pt(hw, 0, hl), p2, p3, [0, 0, 1], [0.16, 0.18, 0.24], 0);
 }
 _addVehicle(mb, v, time) {
  const spec = v.spec;
  const x = v.x, y = v.y, z = v.z, yaw = v.angle;
  const w = spec.width, l = spec.length, h = spec.height;
  const col = v.color || spec.color;
  const ca = Math.cos(yaw), sa = Math.sin(yaw);
  const local = (lx, ly, lz) => [x + lx * ca - lz * sa, y + ly, z + lx * sa + lz * ca];
  // Lower sculpted chassis
  const cPos = local(0, 0.56, 0);
  mb.box(cPos[0], cPos[1], cPos[2], w, 0.62, l, col, 3, yaw);
  // Hood/front nose bevel
  const hood = local(0, 0.72, l * 0.25);
  mb.box(hood[0], hood[1], hood[2], w * 0.92, 0.26, l * 0.42, col, 3, yaw);
  // Upper cabin & dark sunset-reflective windshield
  const cab = local(0, 0.56 + h * 0.44, -l * 0.08);
  mb.box(cab[0], cab[1], cab[2], w * 0.82, h * 0.44, l * 0.48, spec.police ? spec.accent : [0.10, 0.13, 0.20], 3, yaw);
  // Windshield glass tint
  const glass = local(0, 0.56 + h * 0.44, -l * 0.08);
  mb.box(glass[0], glass[1], glass[2], w * 0.84, h * 0.34, l * 0.44, [0.18, 0.26, 0.38], 3, yaw);
  // 4 wheels
  const wheelCol = [0.08, 0.09, 0.11];
  const rimCol = [0.78, 0.82, 0.88];
  for (const sx of [-w * 0.48, w * 0.48]) {
   for (const sz of [-l * 0.31, l * 0.31]) {
    const wp = local(sx, 0.36, sz);
    mb.box(wp[0], wp[1], wp[2], 0.34, 0.70, 0.72, wheelCol, 0, yaw);
    const rp = local(sx * 1.04, 0.36, sz);
    mb.box(rp[0], rp[1], rp[2], 0.30, 0.34, 0.34, rimCol, 3, yaw);
   }
  }
  // Sports rear spoiler (Solis GT)
  if (spec.spoiler) {
   const sp = local(0, 1.15, -l * 0.44);
   mb.box(sp[0], sp[1], sp[2], w * 0.96, 0.10, 0.42, [0.12, 0.13, 0.18], 3, yaw);
   for (const sx of [-w * 0.34, w * 0.34]) {
    const st = local(sx, 0.98, -l * 0.43);
    mb.box(st[0], st[1], st[2], 0.10, 0.30, 0.24, [0.12, 0.13, 0.18], 0, yaw);
   }
  }
  // Headlights (emissive warm white)
  for (const sx of [-w * 0.33, w * 0.33]) {
   const hl = local(sx, 0.62, l * 0.505);
   mb.box(hl[0], hl[1], hl[2], 0.46, 0.20, 0.12, [1.0, 0.94, 0.72], 4, yaw);
   // Crimson brake / taillights
   const tl = local(sx, 0.66, -l * 0.505);
   const brakeGlow = v.braking ? [1.0, 0.12, 0.18] : [0.86, 0.08, 0.16];
   mb.box(tl[0], tl[1], tl[2], 0.52, 0.18, 0.12, brakeGlow, 4, yaw);
  }
  // Police lightbar flashing red/blue
  if (spec.police) {
   const flash = Math.floor(time * 9 + (v.id || 0)) % 2 === 0;
   const lbL = local(-0.42, 0.56 + h * 0.72, -0.1);
   const lbR = local(0.42, 0.56 + h * 0.72, -0.1);
   mb.box(lbL[0], lbL[1], lbL[2], 0.68, 0.22, 0.32, flash ? [1.0, 0.12, 0.22] : [0.18, 0.45, 1.0], 4, yaw);
   mb.box(lbR[0], lbR[1], lbR[2], 0.68, 0.22, 0.32, flash ? [0.18, 0.45, 1.0] : [1.0, 0.12, 0.22], 4, yaw);
   // White police doors
   const door = local(0, 0.58, 0);
   mb.box(door[0], door[1], door[2], w + 0.04, 0.52, l * 0.42, [0.95, 0.96, 0.98], 3, yaw);
  }
  // Nitro exhaust glow
  if (v.boosting) {
   const ex = local(0, 0.38, -l * 0.56);
   mb.box(ex[0], ex[1], ex[2], 0.65, 0.26, 0.95, [0.25, 0.92, 1.0], 4, yaw);
  }
 }
 _addHelicopter(mb, fx, heli, time) {
  const x = heli.x, y = heli.y, z = heli.z, yaw = heli.angle;
  const ca = Math.cos(yaw), sa = Math.sin(yaw);
  const loc = (lx, ly, lz) => [x + lx * ca - lz * sa, y + ly, z + lx * sa + lz * ca];
  // Fuselage & nose cockpit
  mb.box(x, y, z, 2.3, 1.8, 5.2, [0.14, 0.20, 0.32], 3, yaw);
  const nose = loc(0, -0.1, 2.5);
  mb.box(nose[0], nose[1], nose[2], 1.9, 1.3, 1.6, [0.24, 0.52, 0.78], 3, yaw);
  const stripe = loc(0, 0.0, 0.2);
  mb.box(stripe[0], stripe[1], stripe[2], 2.36, 0.32, 4.4, [0.98, 0.80, 0.24], 4, yaw);
  // Tail boom & vertical fin
  const tail = loc(0, 0.3, -4.6);
  mb.box(tail[0], tail[1], tail[2], 0.55, 0.55, 4.8, [0.14, 0.20, 0.32], 3, yaw);
  const fin = loc(0, 1.0, -6.7);
  mb.box(fin[0], fin[1], fin[2], 0.24, 1.6, 1.0, [0.98, 0.80, 0.24], 3, yaw);
  // Landing skids
  for (const sx of [-1.25, 1.25]) {
   const sk = loc(sx, -1.35, 0.3);
   mb.box(sk[0], sk[1], sk[2], 0.18, 0.18, 4.4, [0.2, 0.22, 0.26], 0, yaw);
  }
  // Spinning main rotor
  const rotA = yaw + time * 18.0;
  const hub = loc(0, 1.35, 0.1);
  mb.box(hub[0], hub[1], hub[2], 10.6, 0.10, 0.36, [0.15, 0.16, 0.2], 0, rotA);
  mb.box(hub[0], hub[1], hub[2], 0.36, 0.10, 10.6, [0.15, 0.16, 0.2], 0, rotA);
  // Strobe lights
  const flash = Math.floor(time * 8) % 2 === 0;
  const st = loc(0, -0.95, 1.8);
  mb.box(st[0], st[1], st[2], 0.55, 0.35, 0.55, flash ? [1.0, 0.15, 0.25] : [0.2, 0.55, 1.0], 4, yaw);
  // Translucent volumetric spotlight cone down to target
  const tx = heli.spotX, tz = heli.spotZ;
  const src = loc(0, -0.9, 2.2);
  const segs = 12, rad = 8.2;
  for (let i = 0; i < segs; i++) {
   const a0 = (i / segs) * Math.PI * 2;
   const a1 = ((i + 1) / segs) * Math.PI * 2;
   const b0 = [tx + Math.cos(a0) * rad, 0.12, tz + Math.sin(a0) * rad];
   const b1 = [tx + Math.cos(a1) * rad, 0.12, tz + Math.sin(a1) * rad];
   fx.tri(src, b0, b1, [1.0, 0.96, 0.78, 0.30], [1.0, 0.94, 0.72, 0.04], [1.0, 0.94, 0.72, 0.04]);
  }
 }
 _addCharacter(mb, ch, time) {
  const x = ch.x, y = ch.y || 0, z = ch.z, yaw = ch.angle;
  const ca = Math.cos(yaw), sa = Math.sin(yaw);
  const loc = (lx, ly, lz) => [x + lx * ca - lz * sa, y + ly, z + lx * sa + lz * ca];
  const swing = Math.sin(time * 10 + (ch.phase || 0)) * (ch.moving ? 0.24 : 0.02);
  const pants = ch.pants || [0.16, 0.18, 0.25];
  const torso = ch.torso || [0.95, 0.36, 0.48];
  const skin = ch.skin || [0.84, 0.60, 0.42];
  const hair = ch.hair || [0.12, 0.10, 0.14];
  // Legs
  const lLeg = loc(-0.17, 0.44, swing);
  const rLeg = loc(0.17, 0.44, -swing);
  mb.box(lLeg[0], lLeg[1], lLeg[2], 0.24, 0.88, 0.26, pants, 0, yaw);
  mb.box(rLeg[0], rLeg[1], rLeg[2], 0.24, 0.88, 0.26, pants, 0, yaw);
  // Torso
  const body = loc(0, 1.24, 0);
  mb.box(body[0], body[1], body[2], 0.62, 0.74, 0.34, torso, 0, yaw);
  // Head + hair
  const head = loc(0, 1.82, 0);
  mb.box(head[0], head[1], head[2], 0.38, 0.40, 0.38, skin, 0, yaw);
  const topHair = loc(0, 2.02, -0.02);
  mb.box(topHair[0], topHair[1], topHair[2], 0.40, 0.14, 0.40, hair, 0, yaw);
  // Arms (aiming forward if armed)
  if (ch.aiming) {
   const lArm = loc(-0.34, 1.36, 0.32);
   const rArm = loc(0.32, 1.36, 0.36);
   mb.box(lArm[0], lArm[1], lArm[2], 0.18, 0.20, 0.64, torso, 0, yaw);
   mb.box(rArm[0], rArm[1], rArm[2], 0.18, 0.20, 0.68, torso, 0, yaw);
   // Weapon mesh
   const gun = loc(0.26, 1.38, 0.78);
   mb.box(gun[0], gun[1], gun[2], 0.12, 0.18, 0.78, [0.14, 0.16, 0.20], 3, yaw);
  } else {
   const lArm = loc(-0.42, 1.20, -swing);
   const rArm = loc(0.42, 1.20, swing);
   mb.box(lArm[0], lArm[1], lArm[2], 0.19, 0.64, 0.20, torso, 0, yaw);
   mb.box(rArm[0], rArm[1], rArm[2], 0.19, 0.64, 0.20, torso, 0, yaw);
  }
 }
 _addBeacon(fx, x, z, color, time, radius = 3.2) {
  const segs = 12;
  const h = 26 + Math.sin(time * 3) * 2.5;
  for (let i = 0; i < segs; i++) {
   const a0 = (i / segs) * Math.PI * 2;
   const a1 = ((i + 1) / segs) * Math.PI * 2;
   const b0 = [x + Math.cos(a0) * radius, 0.15, z + Math.sin(a0) * radius];
   const b1 = [x + Math.cos(a1) * radius, 0.15, z + Math.sin(a1) * radius];
   const t0 = [b0[0], h, b0[2]], t1 = [b1[0], h, b1[2]];
   fx.tri(b0, b1, t1, [color[0], color[1], color[2], 0.42], [color[0], color[1], color[2], 0.42], [color[0], color[1], color[2], 0.0]);
   fx.tri(b0, t1, t0, [color[0], color[1], color[2], 0.42], [color[0], color[1], color[2], 0.0], [color[0], color[1], color[2], 0.0]);
  }
 }
 render(state, time) {
  this.resize();
  const gl = this.gl;
  const w = this.canvas.width, h = this.canvas.height;
  gl.viewport(0, 0, w, h);
  const aspect = w / Math.max(1, h);
  const proj = mat4Perspective(this.fov, aspect, 0.5, 950);
  const cam = mat4LookAt(this.camPos, this.camTarget);
  const viewProj = mat4Mul(proj, cam.view);
  gl.clearColor(0.12, 0.08, 0.18, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // 1. Sky Dome
  gl.disable(gl.DEPTH_TEST);
  gl.useProgram(this.skyProg);
  gl.uniform3fv(this.uSky.camRight, cam.right);
  gl.uniform3fv(this.uSky.camUp, cam.up);
  gl.uniform3fv(this.uSky.camFwd, cam.fwd);
  gl.uniform1f(this.uSky.tanHalfFov, Math.tan(this.fov * 0.5));
  gl.uniform1f(this.uSky.aspect, aspect);
  gl.uniform1f(this.uSky.time, time);
  gl.uniform3fv(this.uSky.sunDir, this.sunDir);
  gl.bindVertexArray(this.skyVao);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  // 2. Build dynamic geometry
  const mb = this.dynBuilder;
  const fx = this.fxBuilder;
  mb.reset();
  fx.reset();
  for (const v of state.world.vehicles) {
   if (!v.destroyed) this._addVehicle(mb, v, time);
  }
  if (state.police.heli && state.police.heli.active) {
   this._addHelicopter(mb, fx, state.police.heli, time);
  }
  if (!state.player.vehicle) {
   this._addCharacter(mb, {
    x: state.player.x,
    y: state.player.y,
    z: state.player.z,
    angle: state.player.angle,
    moving: state.player.moving,
    aiming: state.player.weaponIdx > 0,
    torso: [0.96, 0.34, 0.48],
    pants: [0.14, 0.16, 0.24],
    skin: [0.85, 0.60, 0.42],
   }, time);
  }
  for (const p of state.world.peds) {
   if (p.hp > 0) this._addCharacter(mb, p, time);
  }
  for (const e of state.combat.enemies) {
   if (e.hp > 0) this._addCharacter(mb, e, time);
  }
  // Bullet tracers & particles
  for (const tr of state.combat.tracers) {
   const dx = tr.x2 - tr.x1, dz = tr.z2 - tr.z1;
   const len = Math.hypot(dx, dz) || 1;
   const yaw = Math.atan2(dx, dz);
   mb.box((tr.x1 + tr.x2) * 0.5, tr.y, (tr.z1 + tr.z2) * 0.5, 0.12, 0.12, len, tr.color || [1.0, 0.88, 0.32], 4, yaw);
  }
  for (const pt of state.combat.particles) {
   if (pt.kind === 'smoke') {
    const s = pt.size;
    const c = [0.88, 0.84, 0.86, Math.max(0, pt.life * 0.5)];
    fx.quad([pt.x - s, pt.y, pt.z], [pt.x + s, pt.y, pt.z], [pt.x + s, pt.y + s * 1.4, pt.z], [pt.x - s, pt.y + s * 1.4, pt.z], c);
   } else {
    mb.box(pt.x, pt.y, pt.z, pt.size, pt.size, pt.size, pt.color, 4, time * 4);
   }
  }
  // Mission & Garage Beacons (hidden while inside garage showcase)
  if (state.mode !== 'garage') {
   if (state.missions.waypoint) {
    this._addBeacon(fx, state.missions.waypoint.x, state.missions.waypoint.z, [1.0, 0.78, 0.22], time, 3.6);
   }
   this._addBeacon(fx, LANDMARKS.garage.x, LANDMARKS.garage.z + 6, [0.22, 0.92, 1.0], time, 2.4);
  }
  // 3. Draw Static + Dynamic World
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);
  gl.disable(gl.BLEND);
  gl.useProgram(this.worldProg);
  gl.uniformMatrix4fv(this.uWorld.viewProj, false, viewProj);
  gl.uniform3fv(this.uWorld.camPos, this.camPos);
  gl.uniform3fv(this.uWorld.sunDir, this.sunDir);
  gl.uniform1f(this.uWorld.time, time);
  gl.bindVertexArray(this.staticVao);
  gl.drawArrays(gl.TRIANGLES, 0, this.staticCount);
  if (mb.len > 0) {
   gl.bindBuffer(gl.ARRAY_BUFFER, this.dynVbo);
   gl.bufferData(gl.ARRAY_BUFFER, mb.data.subarray(0, mb.len), gl.DYNAMIC_DRAW);
   gl.bindVertexArray(this.dynVao);
   gl.drawArrays(gl.TRIANGLES, 0, mb.len / STRIDE_FLOATS);
  }
  // 4. Translucent Volumetric Spotlight, Beacons, Smoke
  if (fx.len > 0) {
   gl.enable(gl.BLEND);
   gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
   gl.depthMask(false);
   gl.useProgram(this.fxProg);
   gl.uniformMatrix4fv(this.uFx.viewProj, false, viewProj);
   gl.bindBuffer(gl.ARRAY_BUFFER, this.fxVbo);
   gl.bufferData(gl.ARRAY_BUFFER, fx.data.subarray(0, fx.len), gl.DYNAMIC_DRAW);
   gl.bindVertexArray(this.fxVao);
   gl.drawArrays(gl.TRIANGLES, 0, fx.len / 7);
   gl.depthMask(true);
   gl.disable(gl.BLEND);
  }
 }
}
