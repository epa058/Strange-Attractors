// Live strange attractor viewer.
//
// Optional thin lines mode: a few long trajectories are drawn as glowing lines instead (see "Thin lines mode").
//
// A swarm of particles is moved along each attractor's differential equations on the GPU (RK4 steps in a
// fragment shader, positions stored in float textures). Every frame the particles are drawn as single
// points and counted per pixel, the counts are blended into a fading buffer (the trails), and the result is
// tone mapped with brightness = 1 - exp(-glow * density * colour), so busier regions glow brighter.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';
import { ATTRACTORS, derivGLSL } from './attractors.js';

// ---------------------------------------------------------------------------------------------------------
// Settings

const WARM_TRANSIENT_LOOPS = 10; // every particle first follows the trajectory from the starting point for this long (per attractor: transientLoops)
const WARM_WINDOW_LOOPS = 20;    // then stops at a random time within this window (per attractor: windowLoops)
const MAX_SUBSTEPS = 64;         // RK4 steps per compute pass (passes are repeated when more are needed)
const WARM_STEP_BUDGET = 1e8;    // particle-steps per frame while warming up

const settings = {
  attractor: 0,
  side: 512,          // particles = side * side
  speed: 0.5,         // 1 = one loop around the attractor every two seconds
  trails: 0.9,        // fraction of the previous frame kept
  glow: 0.15,
  size: 1,           // point size in CSS pixels (fixed)
  color: '#24a9ae',
  autoRotate: true,
  posterLook: false,  // Halvorsen: coarse Euler steps (a numerical artifact); Liu-Chen: show the start-up transient
  equalAxes: false,   // stretch each axis to the same size, like matplotlib's set_box_aspect([1, 1, 1])
  lines: false,       // thin lines mode: a few long trajectories drawn as glowing lines instead of the particle cloud
  lineCount: 1,       // trajectories drawn in thin lines mode
  paused: false,
};

// ---------------------------------------------------------------------------------------------------------
// Renderer, camera, controls

const canvas = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.autoClear = false;

const gl = renderer.getContext();
if (!gl.getExtension('EXT_color_buffer_float')) {
  fail('This viewer needs WebGL2 with float render targets (EXT_color_buffer_float), which this browser or GPU does not provide.');
}

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.01, 100);
camera.up.set(0, 0, 1); // z is up, as in the matplotlib plots
const CAMERA_DISTANCE = 4.2;
function resetCamera() {
  const elev = THREE.MathUtils.degToRad(25), azim = THREE.MathUtils.degToRad(-60);
  camera.position.set(Math.cos(elev) * Math.cos(azim), Math.cos(elev) * Math.sin(azim), Math.sin(elev)).multiplyScalar(CAMERA_DISTANCE);
  camera.lookAt(0, 0, 0);
  if (controls) { controls.target.set(0, 0, 0); controls.update(); }
}
let controls = null;
resetCamera();
controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.autoRotate = settings.autoRotate;
controls.autoRotateSpeed = 0.6;
controls.minDistance = 0.5;
controls.maxDistance = 20;
let dragging = false;
controls.addEventListener('start', () => { dragging = true; });
controls.addEventListener('end', () => { dragging = false; });

// ---------------------------------------------------------------------------------------------------------
// GPU simulation

let gpu = null, varA = null, varB = null, att = null;
let warm = null;       // { step, total } while warming up, otherwise null
let fadeIn = 0;        // 0..1 brightness ramp after warm-up
let seed = 1;
let N = 0;
let stepDebt = 0;      // fractional fixed-size steps carried between frames (poster look)

function usingEuler() { return !!(att && att.poster && att.poster.dt && settings.posterLook); }
function stepSize() { return usingEuler() ? att.poster.dt : att.dtMax; }
// Continual restarts near the starting point, for a start-up poster look (Liu-Chen), so the transient on the way to
// the attractor stays visible.
function respawnSpec() {
  if (att.poster && att.poster.restartRate && settings.posterLook) return { rate: att.poster.restartRate, fromIC: true };
  return null;
}
function respawning() { return !!respawnSpec(); }
// Camera framing: a poster look may cover a bigger region than the attractor (Liu-Chen's start-up transient).
function framing() {
  const p = settings.posterLook && att.poster && att.poster.center ? att.poster : att;
  return { center: p.center, radius: p.radius, extent: p.extent };
}
// Escape box. With coarse Euler some particles blow up; catch them just outside the attractor so they
// don't draw streaks on their way out.
function boundsA() {
  if (!usingEuler()) return [att.boundLo, att.boundHi];
  const lo = att.boundLo.slice(), hi = att.boundHi.slice();
  for (let c = 0; c < 3; c++) { lo[c] = att.center[c] - 0.65 * att.extent[c]; hi[c] = att.center[c] + 0.65 * att.extent[c]; }
  return [lo, hi];
}

function computeShader(a, output) {
  const usesB = !!a.dxB;
  const escapedB = usesB ? ' || bad4(vec4(B.xyz, 0.0), vec4(uBoundLoB, -1.0), vec4(uBoundHiB, 1.0))' : '';
  return `
uniform float uH;
uniform int uSub;
uniform float uStep0;
uniform int uWarm;
uniform int uEuler;
uniform float uSeed;
uniform float uRespawnProb;
uniform vec4 uIC;
uniform vec4 uICJit;
uniform vec4 uBoundLo;
uniform vec4 uBoundHi;
uniform vec3 uBoundLoB;
uniform vec3 uBoundHiB;
uniform vec4 uJitter;
uniform vec3 uJitterB;

${derivGLSL(a)}

void rk4(inout vec4 A, inout vec4 B, float h) {
  vec4 k1a, k1b, k2a, k2b, k3a, k3b, k4a, k4b;
  deriv(A, B, k1a, k1b);
  deriv(A + 0.5 * h * k1a, B + 0.5 * h * k1b, k2a, k2b);
  deriv(A + 0.5 * h * k2a, B + 0.5 * h * k2b, k3a, k3b);
  deriv(A + h * k3a, B + h * k3b, k4a, k4b);
  A += h / 6.0 * (k1a + 2.0 * k2a + 2.0 * k3a + k4a);
  B.xyz += h / 6.0 * (k1b.xyz + 2.0 * k2b.xyz + 2.0 * k3b.xyz + k4b.xyz);
}

void euler(inout vec4 A, inout vec4 B, float h) {
  vec4 dA, dB;
  deriv(A, B, dA, dB);
  A += h * dA;
  B.xyz += h * dB.xyz;
}

uint hash(uint v) {
  v ^= v >> 16; v *= 0x7feb352dU; v ^= v >> 15; v *= 0x846ca68bU; v ^= v >> 16;
  return v;
}
float rnd(inout uint s) { s = hash(s); return float(s >> 8) / 16777216.0; }
bool bad4(vec4 v, vec4 lo, vec4 hi) {
  return any(isnan(v)) || any(isinf(v)) || any(lessThan(v, lo)) || any(greaterThan(v, hi));
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 A = texture2D(texA, uv);
  vec4 B = texture2D(texB, uv);
  float K = B.w; // warm-up: this particle stops after K steps

  for (int j = 0; j < ${MAX_SUBSTEPS}; j++) {
    if (j >= uSub) break;
    if (uWarm == 1 && uStep0 + float(j) >= K) break;
    if (uEuler == 1) euler(A, B, uH); else rk4(A, B, uH);
  }

  // Both compute shaders draw the same random numbers, so the A and B halves of a particle stay together.
  uint s = hash(uint(gl_FragCoord.x) * 1973u + uint(gl_FragCoord.y) * 9277u + uint(uSeed) * 26699u);
  bool escaped = bad4(A, uBoundLo, uBoundHi)${escapedB};
  if (uRespawnProb > 0.0 && (rnd(s) < uRespawnProb || escaped)) {
    // Continual restarts near the starting point (start-up poster look).
    A = uIC + uICJit * (vec4(rnd(s), rnd(s), rnd(s), rnd(s)) - 0.5);
  } else if (escaped) {
    // Particle blew up or left the attractor: move it next to a random other particle.
    vec2 src = (floor(vec2(rnd(s), rnd(s)) * resolution.xy) + 0.5) / resolution.xy;
    A = texture2D(texA, src) + uJitter * (vec4(rnd(s), rnd(s), rnd(s), rnd(s)) - 0.5);
    B.xyz = texture2D(texB, src).xyz + uJitterB * (vec3(rnd(s), rnd(s), rnd(s)) - 0.5);
  }
  gl_FragColor = ${output === 'A' ? 'A' : 'vec4(B.xyz, K)'};
}`;
}

function gauss() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function buildSimulation() {
  if (gpu) gpu.dispose();
  att = ATTRACTORS[settings.attractor];
  const side = settings.side; N = side * side;
  gpu = new GPUComputationRenderer(side, side, renderer);
  const tA = gpu.createTexture(), tB = gpu.createTexture();
  const A = tA.image.data, B = tB.image.data;
  const h = stepSize();
  const icB = att.icB || [0, 0, 0], jB = att.jitterB || [0, 0, 0];
  let total = 0;
  const rs = respawnSpec();
  for (let i = 0; i < N; i++) {
    let K;
    if (rs) {
      // Start-up poster look: start near the starting point, with random ages as in the steady state
      for (let c = 0; c < 4; c++) A[4 * i + c] = att.ic[c] + att.jitter[c] * gauss();
      K = Math.floor(Math.min(3, -Math.log(1 - Math.random())) / rs.rate / h);
    } else {
      for (let c = 0; c < 4; c++) A[4 * i + c] = att.ic[c] + att.jitter[c] * gauss();
      for (let c = 0; c < 3; c++) B[4 * i + c] = icB[c] + jB[c] * gauss();
      K = Math.floor(((att.transientLoops || WARM_TRANSIENT_LOOPS) + Math.random() * (att.windowLoops || WARM_WINDOW_LOOPS)) * att.period / h);
    }
    B[4 * i + 3] = K;
    if (K > total) total = K;
  }
  varA = gpu.addVariable('texA', computeShader(att, 'A'), tA);
  varB = gpu.addVariable('texB', computeShader(att, 'B'), tB);
  gpu.setVariableDependencies(varA, [varA, varB]);
  gpu.setVariableDependencies(varB, [varA, varB]);
  for (const v of [varA, varB]) {
    Object.assign(v.material.uniforms, {
      uH: { value: h }, uSub: { value: 1 }, uStep0: { value: 0 }, uWarm: { value: 1 }, uEuler: { value: 0 }, uSeed: { value: 0 },
      uRespawnProb: { value: 0 },
      uIC: { value: new THREE.Vector4(...att.ic) },
      uICJit: { value: new THREE.Vector4(...att.jitter.map((j) => 2 * j)) },
      uBoundLo: { value: new THREE.Vector4(...boundsA()[0]) }, uBoundHi: { value: new THREE.Vector4(...boundsA()[1]) },
      uBoundLoB: { value: new THREE.Vector3(...(att.boundLoB || [-1, -1, -1])) },
      uBoundHiB: { value: new THREE.Vector3(...(att.boundHiB || [1, 1, 1])) },
      uJitter: { value: new THREE.Vector4(...att.jitter.map((j) => 0.1 * j)) },
      uJitterB: { value: new THREE.Vector3(...jB.map((j) => 0.1 * j)) },
    });
  }
  const err = gpu.init();
  if (err) fail('GPU simulation could not start: ' + err);
  warm = { step: 0, total };
  stepDebt = 0;
  $('posterRow').hidden = !att.poster;
  $('posterNote').textContent = att.poster ? att.poster.note : '';
  fadeIn = 0;
  buildPoints();
  pointsMat.uniforms.uCenter.value.set(...framing().center);
  updateScale();
  document.getElementById('equations').textContent = att.equations;
  clearAccumulation();
  if (settings.lines) buildLines(); else lines = null;
}

function setSimUniforms(h, sub, step0, warming) {
  seed = (seed + 1) % 16777216;
  for (const v of [varA, varB]) {
    const u = v.material.uniforms;
    u.uH.value = h; u.uSub.value = sub; u.uStep0.value = step0; u.uWarm.value = warming ? 1 : 0; u.uSeed.value = seed;
    u.uEuler.value = usingEuler() ? 1 : 0;
    const rs = respawnSpec();
    u.uRespawnProb.value = (!warming && rs) ? 1 - Math.exp(-rs.rate * h * sub) : 0;
  }
}

function advance(frameSeconds) {
  if (warm) {
    // Warm-up: particles follow the trajectory from the starting point, each stopping after its own K steps.
    const perFrame = Math.max(MAX_SUBSTEPS, Math.min(4000, Math.round(WARM_STEP_BUDGET / N)));
    let done = 0;
    while (done < perFrame && warm.step < warm.total) {
      const sub = Math.min(MAX_SUBSTEPS, warm.total - warm.step);
      setSimUniforms(stepSize(), sub, warm.step, true);
      gpu.compute();
      warm.step += sub; done += sub;
    }
    setStatus(`Settling particles onto the attractor… ${Math.round(100 * warm.step / warm.total)}%`);
    if (warm.step >= warm.total) { warm = null; setStatus(''); }
    return;
  }
  if (settings.paused || settings.speed === 0) return;
  const simTime = settings.speed * att.period / 2 * frameSeconds;
  if (usingEuler()) {
    // The artifact depends on the exact step size, so take whole fixed-size steps and carry the remainder.
    stepDebt += simTime / att.poster.dt;
    let n = Math.floor(stepDebt); stepDebt -= n;
    while (n > 0) { const sub = Math.min(MAX_SUBSTEPS, n); setSimUniforms(att.poster.dt, sub, 0, false); gpu.compute(); n -= sub; }
    return;
  }
  const steps = Math.max(1, Math.ceil(simTime / att.dtMax));
  const passes = Math.ceil(steps / MAX_SUBSTEPS);
  const sub = Math.ceil(steps / passes);
  const h = simTime / (passes * sub);
  for (let p = 0; p < passes; p++) { setSimUniforms(h, sub, 0, false); gpu.compute(); }
}

// ---------------------------------------------------------------------------------------------------------
// Drawing: count points per pixel, blend into a fading buffer, tone map to the screen

const pointsScene = new THREE.Scene();
const pointsMat = new THREE.ShaderMaterial({
  uniforms: {
    texA: { value: null }, uCenter: { value: new THREE.Vector3() }, uScale: { value: new THREE.Vector3(1, 1, 1) }, uSize: { value: 1 },
  },
  vertexShader: `
uniform sampler2D texA;
uniform vec3 uCenter;
uniform vec3 uScale;
uniform float uSize;
void main() {
  vec3 p = (texture2D(texA, position.xy).xyz - uCenter) * uScale;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uSize;
}`,
  fragmentShader: `void main() { gl_FragColor = vec4(1.0); }`,
  blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true,
});
let points = null;

// True proportions: one scale for all axes. Equal axes: each axis scaled to the same size, with the
// bounding box's diagonal kept the same so the attractor still fits the view.
function updateScale() {
  if (!att) return;
  const s = pointsMat.uniforms.uScale.value;
  if (settings.equalAxes) {
    const k = 2 / Math.sqrt(3);
    const ext = framing().extent;
    s.set(k / ext[0], k / ext[1], k / ext[2]);
  } else {
    s.setScalar(1 / framing().radius);
  }
  clearAccumulation();
}
function buildPoints() {
  if (points && points.geometry.userData.side === settings.side) return;
  if (points) { pointsScene.remove(points); points.geometry.dispose(); }
  const side = settings.side, ref = new Float32Array(side * side * 3);
  for (let j = 0; j < side; j++) for (let i = 0; i < side; i++) {
    const k = 3 * (j * side + i);
    ref[k] = (i + 0.5) / side; ref[k + 1] = (j + 0.5) / side;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(ref, 3));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  geo.userData.side = side;
  points = new THREE.Points(geo, pointsMat);
  points.frustumCulled = false;
  pointsScene.add(points);
}

const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const quadGeo = new THREE.PlaneGeometry(2, 2);
const accumMat = new THREE.ShaderMaterial({
  uniforms: { tPrev: { value: null }, tFrame: { value: null }, uKeep: { value: 0.9 } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `
uniform sampler2D tPrev; uniform sampler2D tFrame; uniform float uKeep; varying vec2 vUv;
void main() { gl_FragColor = texture2D(tPrev, vUv) * uKeep + texture2D(tFrame, vUv) * (1.0 - uKeep); }`,
  depthTest: false, depthWrite: false,
});
const toneMat = new THREE.ShaderMaterial({
  uniforms: { tAcc: { value: null }, uGlow: { value: 0.15 }, uNorm: { value: 1 }, uTint: { value: new THREE.Vector3() }, uFade: { value: 1 } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `
uniform sampler2D tAcc; uniform float uGlow; uniform float uNorm; uniform vec3 uTint; uniform float uFade; varying vec2 vUv;
void main() {
  float density = texture2D(tAcc, vUv).r * uNorm;
  gl_FragColor = vec4(1.0 - exp(-uGlow * uFade * density * uTint), 1.0);
}`,
  depthTest: false, depthWrite: false,
});
toneMat.toneMapped = false;
const accumScene = new THREE.Scene(); accumScene.add(new THREE.Mesh(quadGeo, accumMat));
const toneScene = new THREE.Scene(); toneScene.add(new THREE.Mesh(quadGeo, toneMat));

let frameRT = null, lineRT = null, accRT = [null, null], accIndex = 0;
function makeTargets() {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  for (const t of [frameRT, lineRT, ...accRT]) if (t) t.dispose();
  const opts = { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false };
  frameRT = new THREE.WebGLRenderTarget(size.x, size.y, { ...opts, type: THREE.HalfFloatType });
  lineRT = new THREE.WebGLRenderTarget(size.x, size.y, { ...opts, type: THREE.HalfFloatType, samples: 4 }); // antialiased lines
  accRT = [0, 1].map(() => new THREE.WebGLRenderTarget(size.x, size.y, { ...opts, type: THREE.FloatType }));
  clearAccumulation();
}
function clearAccumulation() {
  if (!accRT[0]) return;
  renderer.setClearColor(0x000000, 0);
  for (const t of accRT) { renderer.setRenderTarget(t); renderer.clear(); }
  renderer.setRenderTarget(null);
}

function draw() {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  // 1. count this frame's particles per pixel
  pointsMat.uniforms.texA.value = gpu.getCurrentRenderTarget(varA).texture;
  pointsMat.uniforms.uSize.value = settings.size * renderer.getPixelRatio();
  renderer.setRenderTarget(frameRT);
  renderer.setClearColor(0x000000, 0);
  renderer.clear();
  if (!warm) renderer.render(pointsScene, camera);
  // 2. blend into the fading buffer (no trails while dragging, so the view doesn't smear)
  const prev = accRT[accIndex], next = accRT[1 - accIndex];
  accumMat.uniforms.tPrev.value = prev.texture;
  accumMat.uniforms.tFrame.value = frameRT.texture;
  accumMat.uniforms.uKeep.value = (dragging || warm) ? 0 : settings.trails;
  renderer.setRenderTarget(next);
  renderer.render(accumScene, quadCam);
  accIndex = 1 - accIndex;
  // 3. tone map to the screen. Density is relative to particles spread evenly over the screen, and is
  //    corrected for zoom and point size so the glow stays the same when you change them.
  const zoom = CAMERA_DISTANCE / camera.position.distanceTo(controls.target);
  const ps = pointsMat.uniforms.uSize.value;
  toneMat.uniforms.tAcc.value = next.texture;
  toneMat.uniforms.uNorm.value = (size.x * size.y) / (N * ps * ps) / (zoom * zoom);
  toneMat.uniforms.uGlow.value = settings.glow;
  toneMat.uniforms.uFade.value = fadeIn;
  setTint();
  renderer.setRenderTarget(null);
  renderer.render(toneScene, quadCam);
}
function setTint() {
  const hex = parseInt(settings.color.slice(1), 16);
  toneMat.uniforms.uTint.value.set((hex >> 16 & 255) / 255, (hex >> 8 & 255) / 255, (hex & 255) / 255);
}

// ---------------------------------------------------------------------------------------------------------
// Thin lines mode: a few long trajectories drawn as glowing lines, like a matplotlib line plot.
// These are integrated on the CPU in 64-bit floats (RK4, or Euler for the poster look) and kept as a ring
// buffer of line segments per trajectory, so the history rotates with the view. Older segments fade out
// over the trail length set by the Trails slider.
// Points are taken at equal time steps, but many attractors speed up enormously in places (Dadras, Four-Wing,
// Yu-Wang by about 50x), which would leave long straight segments there. So a step that moves further than
// LINE_MAX_SEGMENT is redone in smaller RK4 steps, giving points about evenly spaced along the curve. In the
// poster look the coarse Euler points are kept and joined by a smooth curve instead.

const LINE_SAMPLES_PER_LOOP = 200;  // time steps per loop around the attractor (more points where it moves fast)
const LINE_MAX_SEGMENT = 0.01;      // longest line segment, as a fraction of the attractor's radius
const LINE_MAX_LOOPS = 100;         // longest trail (Trails slider at maximum)
const LINE_MIN_LOOPS = 2;           // shortest trail (Trails slider at 0)
const LINE_CAPACITY = 60000;        // segments kept per trajectory (very long trails of fast attractors get cut short)
const LINE_MAX_TRAJ = 10;
const LINE_GAIN = 4;                // brightness of one line before the glow tone map

// Turn the GLSL equations into a JavaScript function f(s, out) on the state s = (x, y, z, w, x1, y1, z1).
function derivJS(a) {
  const params = a.params.replace(/const float /g, 'const ');
  const pre = (a.pre || '').replace(/(^|\n)\s*float /g, '$1const ');
  const vec = (v) => v.trim().replace(/^vec4\(/, '').replace(/\)$/, '');
  const body = `
const { abs, exp, sin, cos, tanh, sqrt, pow } = Math;
const step = (edge, v) => (v < edge ? 0 : 1);
${params}
return function (S_, O_) { // odd names so they can't clash with parameter names such as s
  const x = S_[0], y = S_[1], z = S_[2], w = S_[3], x1 = S_[4], y1 = S_[5], z1 = S_[6];
  ${pre}
  const A_ = [${vec(a.dx)}];
  const B_ = ${a.dxB ? `[${vec(a.dxB)}]` : '[0, 0, 0, 0]'};
  O_[0] = A_[0]; O_[1] = A_[1]; O_[2] = A_[2]; O_[3] = A_[3]; O_[4] = B_[0]; O_[5] = B_[1]; O_[6] = B_[2];
};`;
  return new Function(body)();
}

const lineMat = new THREE.ShaderMaterial({
  uniforms: { uCenter: pointsMat.uniforms.uCenter, uScale: pointsMat.uniforms.uScale, uHead: { value: 0 }, uLen: { value: 1 } },
  vertexShader: `
attribute float aIdx;
uniform vec3 uCenter;
uniform vec3 uScale;
uniform float uHead;
uniform float uLen;
varying float vAlpha;
void main() {
  vec3 p = (position - uCenter) * uScale;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  float age = uHead - aIdx;
  vAlpha = (age < 0.0 || age > uLen) ? 0.0 : 1.0 - smoothstep(0.6 * uLen, uLen, age);
}`,
  fragmentShader: `varying float vAlpha; void main() { if (vAlpha <= 0.0) discard; gl_FragColor = vec4(vAlpha); }`,
  blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true,
});
const lineScene = new THREE.Scene();
let lineObj = null;
let lines = null; // { f, traj, n, h, sub, euler, sampleDt, head, debt }

function buildLineGeometry() {
  if (lineObj) return;
  const verts = LINE_MAX_TRAJ * LINE_CAPACITY * 2;
  const geo = new THREE.BufferGeometry();
  const pos = new THREE.BufferAttribute(new Float32Array(verts * 3), 3);
  const idx = new THREE.BufferAttribute(new Float32Array(verts).fill(-1e9), 1);
  pos.setUsage(THREE.DynamicDrawUsage); idx.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('position', pos); geo.setAttribute('aIdx', idx);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  lineObj = new THREE.LineSegments(geo, lineMat);
  lineObj.frustumCulled = false;
  lineScene.add(lineObj);
}

function lineStep(L, s) {
  const f = L.f, k1 = L.k1, k2 = L.k2, k3 = L.k3, k4 = L.k4, t = L.tmp, h = L.h;
  if (L.euler) { f(s, k1); for (let i = 0; i < 7; i++) s[i] += h * k1[i]; return; }
  f(s, k1); for (let i = 0; i < 7; i++) t[i] = s[i] + 0.5 * h * k1[i];
  f(t, k2); for (let i = 0; i < 7; i++) t[i] = s[i] + 0.5 * h * k2[i];
  f(t, k3); for (let i = 0; i < 7; i++) t[i] = s[i] + h * k3[i];
  f(t, k4); for (let i = 0; i < 7; i++) s[i] += h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
}

function lineEscaped(s) {
  const [lo, hi] = boundsA();
  for (let c = 0; c < 4; c++) if (!(s[c] >= lo[c] && s[c] <= hi[c])) return true;
  if (att.dxB) for (let c = 0; c < 3; c++) if (!(s[4 + c] >= att.boundLoB[c] && s[4 + c] <= att.boundHiB[c])) return true;
  return false;
}

// Put a trajectory at a fresh start and let it settle onto the attractor.
function lineStart(L, s) {
  const rs = respawnSpec();
  if (rs) { // start-up poster look: draw from the starting point, transient included
    for (let c = 0; c < 4; c++) s[c] = att.ic[c] + att.jitter[c] * gauss();
    return;
  }
  const icB = att.icB || [0, 0, 0], jB = att.jitterB || [0, 0, 0];
  for (let tries = 0; tries < 5; tries++) {
    for (let c = 0; c < 4; c++) s[c] = att.ic[c] + att.jitter[c] * gauss();
    for (let c = 0; c < 3; c++) s[4 + c] = icB[c] + jB[c] * gauss();
    const steps = Math.floor(((att.transientLoops || WARM_TRANSIENT_LOOPS) + Math.random() * (att.windowLoops || WARM_WINDOW_LOOPS)) * att.period / L.h);
    let ok = true;
    for (let i = 0; i < steps; i++) {
      lineStep(L, s);
      if ((i & 63) === 0 && lineEscaped(s)) { ok = false; break; }
    }
    if (ok && !lineEscaped(s)) return;
  }
}

function buildLines() {
  buildLineGeometry();
  const euler = usingEuler();
  // Sample spacing: about LINE_SAMPLES_PER_LOOP points per loop; Euler takes whole poster-size steps.
  let h, sub;
  if (euler) { h = att.poster.dt; sub = Math.max(1, Math.round(att.period / LINE_SAMPLES_PER_LOOP / h)); }
  else { const sdt = att.period / LINE_SAMPLES_PER_LOOP; sub = Math.ceil(sdt / att.dtMax); h = sdt / sub; }
  const n = settings.lineCount;
  const L = { f: derivJS(att), n, h, sub, euler, sampleDt: h * sub, head: 0, debt: 0, traj: [], maxSeg: LINE_MAX_SEGMENT * att.radius,
              k1: new Float64Array(7), k2: new Float64Array(7), k3: new Float64Array(7), k4: new Float64Array(7), tmp: new Float64Array(7) };
  for (let t = 0; t < n; t++) { const s = new Float64Array(7); lineStart(L, s); L.traj.push({ s, broken: true, wp: 0 }); }
  lines = L;
  // Clear the buffer, then fill the whole history at once so the full trail shows straight away.
  const geo = lineObj.geometry;
  geo.attributes.aIdx.array.fill(-1e9);
  geo.setDrawRange(0, n * LINE_CAPACITY * 2);
  addLineSamples(Math.ceil(LINE_MAX_LOOPS * att.period / L.sampleDt), true);
}

// Write one segment into trajectory t's ring buffer.
function putSegment(tr, t, a, b, idx) {
  const P = lineObj.geometry.attributes.position.array, I = lineObj.geometry.attributes.aIdx.array;
  const v = 2 * (t * LINE_CAPACITY + (tr.wp % LINE_CAPACITY));
  P[3 * v] = a[0]; P[3 * v + 1] = a[1]; P[3 * v + 2] = a[2];
  P[3 * v + 3] = b[0]; P[3 * v + 4] = b[1]; P[3 * v + 5] = b[2];
  I[v] = I[v + 1] = idx;
  tr.wp++;
}

// Advance every trajectory by `count` time steps. Each step writes one segment, or several where it moves fast.
function addLineSamples(count, full = false) {
  const L = lines, geo = lineObj.geometry;
  // Restarts from the starting point at random times (start-up poster look)
  const rs = respawnSpec(), respawnProb = rs ? 1 - Math.exp(-rs.rate * L.sampleDt) : 0;
  const prev = new Float64Array(7), mid = new Float64Array(7), h = L.h;
  // A trajectory that is blowing up (poster look only) takes huge steps before it leaves the escape box; hide those
  // segments so they don't draw straight streaks. (Not too strict, as coarse poster steps can be long; blow-ups
  // grow fast, and hideEscapeTail catches the rest.)
  const maxSeg2 = L.euler ? Math.pow(0.5 * att.radius, 2) : Infinity;
  const starts = [];
  for (let t = 0; t < L.n; t++) {
    const tr = L.traj[t], s = tr.s;
    starts.push(tr.wp);
    for (let m = 0; m < count; m++) {
      const idx = L.head + m + 1;
      prev.set(s);
      for (let i = 0; i < L.sub; i++) lineStep(L, s);
      const d2 = (s[0] - prev[0]) ** 2 + (s[1] - prev[1]) ** 2 + (s[2] - prev[2]) ** 2;
      if (lineEscaped(s)) { hideEscapeTail(tr, t); lineStart(L, s); tr.broken = true; continue; }
      if (tr.broken || d2 > maxSeg2) { putSegment(tr, t, prev, s, -1e9); tr.broken = false; }
      else if (!L.euler && d2 > L.maxSeg * L.maxSeg) {
        // Moving fast: redo this step as k smaller steps (Euler keeps its exact step, as the poster look depends on it).
        const k = Math.min(64, Math.ceil(Math.sqrt(d2) / L.maxSeg));
        s.set(prev); L.h = h / k;
        for (let j = 1; j <= k; j++) {
          mid.set(s);
          for (let i = 0; i < L.sub; i++) lineStep(L, s);
          putSegment(tr, t, mid, s, idx - 1 + j / k);
        }
        L.h = h;
      } else if (L.euler && d2 > L.maxSeg * L.maxSeg) {
        // Poster look: the Euler points themselves must stay, so draw a smooth curve through them instead (a cubic
        // Hermite curve whose end slopes are the derivatives there; for one Euler step the start slope is exact).
        const k = Math.min(64, Math.ceil(Math.sqrt(d2) / L.maxSeg)), H = h * L.sub;
        L.f(prev, L.k1); L.f(s, L.k2);
        let a = prev.slice();
        for (let j = 1; j <= k; j++) {
          const u = j / k, u2 = u * u, u3 = u2 * u;
          const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
          for (let c = 0; c < 3; c++) mid[c] = h00 * prev[c] + h10 * H * L.k1[c] + h01 * s[c] + h11 * H * L.k2[c];
          putSegment(tr, t, a, mid, idx - 1 + u);
          a = mid.slice();
        }
      } else putSegment(tr, t, prev, s, idx);
      if (respawnProb > 0 && Math.random() < respawnProb) { lineStart(L, s); tr.broken = true; }
    }
  }
  // Upload only the slots that changed (one or two runs per trajectory, as the ring buffer wraps). Ranges add up
  // until the next render uploads them, so a rebuild followed by new samples in the same frame uploads both.
  const pos = geo.attributes.position, ia = geo.attributes.aIdx;
  for (let t = 0; t < L.n; t++) {
    const written = L.traj[t].wp - starts[t];
    if (written <= 0) continue;
    let runs;
    if (full || written >= LINE_CAPACITY) runs = [[0, LINE_CAPACITY]];
    else {
      const a = starts[t] % LINE_CAPACITY, b = (L.traj[t].wp - 1) % LINE_CAPACITY;
      runs = a <= b ? [[a, b - a + 1]] : [[a, LINE_CAPACITY - a], [0, b + 1]];
    }
    for (const [start, len] of runs) {
      const v = 2 * (t * LINE_CAPACITY + start);
      pos.addUpdateRange(3 * v, 6 * len); ia.addUpdateRange(v, 2 * len);
    }
  }
  pos.needsUpdate = true; ia.needsUpdate = true;
  L.head += count;
}

// When a trajectory escapes, also hide the run-up of its last segments outside the attractor's usual box.
function hideEscapeTail(tr, t) {
  const P = lineObj.geometry.attributes.position.array, I = lineObj.geometry.attributes.aIdx.array;
  const lo = att.center.map((c, k) => c - 0.5 * att.extent[k]), hi = att.center.map((c, k) => c + 0.5 * att.extent[k]);
  for (let j = tr.wp - 1; j > tr.wp - 1 - 2 * LINE_SAMPLES_PER_LOOP && j >= 0; j--) {
    const v = 2 * (t * LINE_CAPACITY + (j % LINE_CAPACITY));
    let outside = false;
    for (let c = 0; c < 3; c++) { const p = P[3 * (v + 1) + c]; if (!(p >= lo[c] && p <= hi[c])) outside = true; }
    if (!outside) break;
    I[v] = I[v + 1] = -1e9;
  }
  lineObj.geometry.attributes.aIdx.addUpdateRange(2 * t * LINE_CAPACITY, 2 * LINE_CAPACITY);
}

function advanceLines(frameSeconds) {
  if (!lines || settings.paused || settings.speed === 0) return;
  lines.debt += settings.speed * att.period / 2 * frameSeconds / lines.sampleDt;
  const count = Math.min(20000, Math.floor(lines.debt));
  lines.debt -= count;
  if (count > 0) addLineSamples(count);
}

function lineTrailLoops() {
  const f = settings.trails / 0.98;
  return LINE_MIN_LOOPS + (LINE_MAX_LOOPS - LINE_MIN_LOOPS) * f * f;
}

function drawLines() {
  lineMat.uniforms.uHead.value = lines ? lines.head : 0;
  lineMat.uniforms.uLen.value = lines ? lineTrailLoops() * att.period / lines.sampleDt : 1;
  renderer.setRenderTarget(lineRT);
  renderer.setClearColor(0x000000, 0);
  renderer.clear();
  renderer.render(lineScene, camera);
  toneMat.uniforms.tAcc.value = lineRT.texture;
  toneMat.uniforms.uNorm.value = LINE_GAIN;
  toneMat.uniforms.uGlow.value = settings.glow;
  toneMat.uniforms.uFade.value = 1;
  setTint();
  renderer.setRenderTarget(null);
  renderer.render(toneScene, quadCam);
}


// ---------------------------------------------------------------------------------------------------------
// Main loop

const timer = new THREE.Timer();
timer.connect(document); // pauses the clock while the tab is hidden
let fpsFrames = 0, fpsTime = 0;
function frame(timestamp) {
  timer.update(timestamp);
  const dt = Math.min(timer.getDelta(), 0.05);
  controls.autoRotate = settings.autoRotate && !settings.paused;
  controls.update();
  if (settings.lines) {
    advanceLines(dt);
    drawLines();
  } else {
    advance(dt);
    if (!warm && fadeIn < 1) fadeIn = Math.min(1, fadeIn + dt / 0.6);
    draw();
  }
  fpsFrames++; fpsTime += dt;
  if (fpsTime > 1) { document.getElementById('fps').textContent = `${Math.round(fpsFrames / fpsTime)} fps`; fpsFrames = 0; fpsTime = 0; }
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  makeTargets();
});

// ---------------------------------------------------------------------------------------------------------
// Controls panel

function $(id) { return document.getElementById(id); }
function setStatus(text) { $('status').textContent = text; }
function fail(message) {
  $('error').textContent = message; $('error').hidden = false;
  throw new Error(message);
}

function selectAttractor(index) {
  settings.attractor = index;
  $('attractor').value = String(index);
  history.replaceState(null, '', '#' + encodeURIComponent(ATTRACTORS[index].name));
  buildSimulation();
}

function initPanel() {
  const sel = $('attractor');
  ATTRACTORS.forEach((a, i) => sel.add(new Option(a.name, String(i))));
  sel.addEventListener('change', () => selectAttractor(Number(sel.value)));

  $('particles').value = String(settings.side);
  $('particles').addEventListener('change', (e) => { settings.side = Number(e.target.value); buildSimulation(); });

  const bind = (id, key, fmt, toValue = Number, fromValue = (v) => v) => {
    const el = $(id), out = $(id + 'Value');
    el.value = String(fromValue(settings[key]));
    const show = () => { if (out) out.textContent = fmt(settings[key]); };
    el.addEventListener('input', () => { settings[key] = toValue(el.value); show(); });
    show();
  };
  bind('speed', 'speed', (v) => v.toFixed(2) + '×');
  bind('trails', 'trails', trailsLabel);
  bind('glow', 'glow', (v) => v.toPrecision(2), (s) => Math.pow(10, Number(s)), (v) => Math.log10(v));
  $('color').value = settings.color;
  $('color').addEventListener('input', (e) => { settings.color = e.target.value; });
  $('autorotate').checked = settings.autoRotate;
  $('autorotate').addEventListener('change', (e) => { settings.autoRotate = e.target.checked; });
  $('posterlook').checked = settings.posterLook;
  $('posterlook').addEventListener('change', (e) => { settings.posterLook = e.target.checked; buildSimulation(); });
  $('linesmode').checked = settings.lines;
  $('linesmode').addEventListener('change', (e) => {
    settings.lines = e.target.checked; showLinesMode();
    if (settings.lines) buildLines(); else { lines = null; clearAccumulation(); }
  });
  $('lineCount').value = String(settings.lineCount);
  $('lineCount').addEventListener('change', (e) => { settings.lineCount = Number(e.target.value); if (settings.lines) buildLines(); });
  showLinesMode();
  $('equalaxes').checked = settings.equalAxes;
  $('equalaxes').addEventListener('change', (e) => { settings.equalAxes = e.target.checked; updateScale(); });
  $('pause').addEventListener('click', () => {
    settings.paused = !settings.paused;
    $('pause').textContent = settings.paused ? 'Play' : 'Pause';
  });
  $('restart').addEventListener('click', () => buildSimulation());
  $('recenter').addEventListener('click', () => resetCamera());
  $('hide').addEventListener('click', togglePanel);
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.key === 'h' || e.key === 'H') togglePanel();
    if (e.key === ' ') { e.preventDefault(); $('pause').click(); }
  });
}
function trailsLabel(v) {
  if (settings.lines) return Math.round(lineTrailLoops()) + ' loops';
  return v === 0 ? 'off' : v.toFixed(2);
}
function showLinesMode() {
  $('particlesBox').hidden = settings.lines;
  $('lineCount').hidden = !settings.lines;
  $('trailsValue').textContent = trailsLabel(settings.trails);
  if (settings.lines) setStatus('');
}
function togglePanel() {
  const p = $('panel'); p.hidden = !p.hidden;
  $('show').hidden = !p.hidden;
}
$('show').addEventListener('click', togglePanel);

// ---------------------------------------------------------------------------------------------------------
// Start

initPanel();
makeTargets();
const fromHash = ATTRACTORS.findIndex((a) => '#' + encodeURIComponent(a.name) === location.hash);
selectAttractor(fromHash >= 0 ? fromHash : ATTRACTORS.findIndex((a) => a.name === 'Lorenz'));
requestAnimationFrame(frame);

// Small helpers for the browser console, e.g. viewer.select('Thomas')
window.viewer = {
  select: (name) => selectAttractor(typeof name === 'number' ? name : ATTRACTORS.findIndex((a) => a.name === name)),
  settings,
  isSettling: () => !settings.lines && warm !== null,
  lineInfo: () => lines && { head: lines.head, n: lines.n, sampleDt: lines.sampleDt, euler: lines.euler,
                             states: lines.traj.map((t) => Array.from(t.s)) },
  readParticles: (count = 1024) => {
    const rt = gpu.getCurrentRenderTarget(varA), side = settings.side;
    const rows = Math.min(side, Math.ceil(count / side)), buf = new Float32Array(side * rows * 4);
    renderer.readRenderTargetPixels(rt, 0, 0, side, rows, buf);
    return Array.from(buf.subarray(0, 4 * Math.min(count, side * rows)));
  },
};
