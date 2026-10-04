// Live strange attractor viewer.
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

const WARM_TRANSIENT_LOOPS = 10; // every particle first follows the trajectory from the starting point for this long
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
  posterLook: false,  // Halvorsen only: coarse Euler steps, which spiral into the centre (a numerical artifact)
  equalAxes: false,   // stretch each axis to the same size, like matplotlib's set_box_aspect([1, 1, 1])
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

function usingEuler() { return !!(att && att.poster && settings.posterLook); }
function stepSize() { return usingEuler() ? att.poster.dt : att.dtMax; }
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
uniform vec3 uBoxLo;
uniform vec3 uBoxHi;
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
    // Systems that are not chaotic: continually restart particles anywhere in a box.
    A = vec4(mix(uBoxLo, uBoxHi, vec3(rnd(s), rnd(s), rnd(s))), 0.0);
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
  for (let i = 0; i < N; i++) {
    let K;
    if (att.respawn) {
      const lo = att.respawn.boxLo, hi = att.respawn.boxHi;
      for (let c = 0; c < 3; c++) A[4 * i + c] = lo[c] + Math.random() * (hi[c] - lo[c]);
      A[4 * i + 3] = 0;
      K = Math.floor(Math.random() / att.respawn.rate / h); // random ages, as in the steady state
    } else {
      for (let c = 0; c < 4; c++) A[4 * i + c] = att.ic[c] + att.jitter[c] * gauss();
      for (let c = 0; c < 3; c++) B[4 * i + c] = icB[c] + jB[c] * gauss();
      K = Math.floor((WARM_TRANSIENT_LOOPS + Math.random() * (att.windowLoops || WARM_WINDOW_LOOPS)) * att.period / h);
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
      uBoxLo: { value: new THREE.Vector3(...(att.respawn ? att.respawn.boxLo : [0, 0, 0])) },
      uBoxHi: { value: new THREE.Vector3(...(att.respawn ? att.respawn.boxHi : [0, 0, 0])) },
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
  fadeIn = 0;
  buildPoints();
  pointsMat.uniforms.uCenter.value.set(...att.center);
  updateScale();
  document.getElementById('equations').textContent = att.equations;
  clearAccumulation();
}

function setSimUniforms(h, sub, step0, warming) {
  seed = (seed + 1) % 16777216;
  for (const v of [varA, varB]) {
    const u = v.material.uniforms;
    u.uH.value = h; u.uSub.value = sub; u.uStep0.value = step0; u.uWarm.value = warming ? 1 : 0; u.uSeed.value = seed;
    u.uEuler.value = usingEuler() ? 1 : 0;
    u.uRespawnProb.value = (!warming && att.respawn) ? 1 - Math.exp(-att.respawn.rate * h * sub) : 0;
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
    s.set(k / att.extent[0], k / att.extent[1], k / att.extent[2]);
  } else {
    s.setScalar(1 / att.radius);
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

let frameRT = null, accRT = [null, null], accIndex = 0;
function makeTargets() {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  for (const t of [frameRT, ...accRT]) if (t) t.dispose();
  const opts = { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false };
  frameRT = new THREE.WebGLRenderTarget(size.x, size.y, { ...opts, type: THREE.HalfFloatType });
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
  const hex = parseInt(settings.color.slice(1), 16);
  toneMat.uniforms.uTint.value.set((hex >> 16 & 255) / 255, (hex >> 8 & 255) / 255, (hex & 255) / 255);
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
  advance(dt);
  if (!warm && fadeIn < 1) fadeIn = Math.min(1, fadeIn + dt / 0.6);
  draw();
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
  bind('trails', 'trails', (v) => v === 0 ? 'off' : v.toFixed(2));
  bind('glow', 'glow', (v) => v.toPrecision(2), (s) => Math.pow(10, Number(s)), (v) => Math.log10(v));
  $('color').value = settings.color;
  $('color').addEventListener('input', (e) => { settings.color = e.target.value; });
  $('autorotate').checked = settings.autoRotate;
  $('autorotate').addEventListener('change', (e) => { settings.autoRotate = e.target.checked; });
  $('posterlook').checked = settings.posterLook;
  $('posterlook').addEventListener('change', (e) => { settings.posterLook = e.target.checked; buildSimulation(); });
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
  isSettling: () => warm !== null,
  readParticles: (count = 1024) => {
    const rt = gpu.getCurrentRenderTarget(varA), side = settings.side;
    const rows = Math.min(side, Math.ceil(count / side)), buf = new Float32Array(side * rows * 4);
    renderer.readRenderTargetPixels(rt, 0, 0, side, rows, buf);
    return Array.from(buf.subarray(0, 4 * Math.min(count, side * rows)));
  },
};
