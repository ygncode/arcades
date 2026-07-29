/* =============================================================
   Upstream — engine
   Three.js river-runner: Yangon → Myitsone in ten legs.
   World is metric: boat sits at z≈0 facing -z; obstacles are
   positioned each frame from (traveled distance − spawn mark),
   so the sim is deterministic, pause-safe and framerate-safe.
   All game-flow timing runs on sim time — no setTimeout flow.
   window.UpstreamDebug exposes hooks for the E2E suite.
   ============================================================= */
import * as THREE from "three";

const LEGS = window.UpstreamLegs.legs;
const UPGRADES = window.UpstreamLegs.upgrades;
const STORY = window.UpstreamStory;
const AUDIO = window.UpstreamAudio;

/* ---------- helpers ---------- */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const REDUCED_MOTION = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- save ---------- */
const SAVE_KEY = "upstream-v1";
function defaultSave() {
  return {
    version: 1,
    leg: 0,                 // next leg index to run (10 = journey done)
    coins: 0,
    upgrades: { hull: 0, engine: 0, charm: 0, lantern: 0 },
    compass: false,
    finished: false,
    prologueSeen: false,
    seenTowns: [],
  };
}
let save = defaultSave();
try {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      const d = defaultSave();
      save = {
        ...d, ...parsed,
        upgrades: { ...d.upgrades, ...(parsed.upgrades || {}) },
        seenTowns: Array.isArray(parsed.seenTowns) ? parsed.seenTowns : [],
      };
      save.leg = clamp(save.leg | 0, 0, LEGS.length);
      save.coins = Math.max(0, save.coins | 0);
    }
  }
} catch (e) { save = defaultSave(); }
function writeSave() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* private mode */ }
}

/* ---------- dom ---------- */
const $ = (id) => document.getElementById(id);
const els = {
  app: $("app"), stage: $("stage"),
  title: $("title-screen"), map: $("map-screen"),
  btnNew: $("btn-new"), btnContinue: $("btn-continue"), btnMuteMenu: $("btn-mute-menu"),
  saveHint: $("save-hint"),
  routeList: $("route-list"), btnDepart: $("btn-depart"), btnMapBack: $("btn-map-back"), mapCoins: $("map-coins"),
  hud: $("hud"), hearts: $("hearts"), hudCoins: $("hud-coins"),
  legLabel: $("leg-label"), progressFill: $("progress-fill"), progressBoat: $("progress-boat"),
  btnMute: $("btn-mute"), btnPause: $("btn-pause"),
  touchUi: $("touch-ui"), btnBoost: $("btn-boost"),
  banner: $("hazard-banner"), hzMm: $("hz-mm"), hzEn: $("hz-en"),
  town: $("town-overlay"), townEmoji: $("town-emoji"), townTitle: $("town-title"), townSub: $("town-sub"),
  dlgPortrait: $("dlg-portrait"), dlgWho: $("dlg-who"), dlgMm: $("dlg-mm"), dlgEn: $("dlg-en"),
  btnDlgNext: $("btn-dlg-next"), shop: $("shop"), shopGrid: $("shop-grid"), btnTownContinue: $("btn-town-continue"),
  pause: $("pause-overlay"), pauseLeg: $("pause-leg"),
  btnResume: $("btn-resume"), btnRetry: $("btn-retry"), btnQuit: $("btn-quit"),
  over: $("over-overlay"), btnOverRetry: $("btn-over-retry"), btnOverMap: $("btn-over-map"),
  finale: $("finale-overlay"), finaleTitle: $("finale-title"), finaleBody: $("finale-body"), btnFinaleNext: $("btn-finale-next"),
  toast: $("toast"), fader: $("fader"), rotate: $("rotate-overlay"),
};

/* ---------- state ---------- */
const state = {
  mode: "title",        // title | map | town | playing | sinking | over | finale
  paused: false,
  rotateBlocked: false,
  legIdx: 0,
  leg: null,
  dist: 0,
  speed: 0,
  runCoins: 0,
  hearts: 3,
  invuln: 0,
  shake: 0,
  bannerT: 0,
  sinkT: 0,
  dockT: 0,             // end-of-leg glide
  boatX: 0,
  boatVX: 0,
  boost: false,
  slowT: 0,             // grounding / snag slowdown
  time: 0,
  townId: null,
  townLineIdx: 0,
  townScene: null,
  finaleStep: 0,
  replay: false,
};

let rng = mulberry32(1);

/* ---------- three setup ---------- */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
} catch (e) {
  document.body.innerHTML = "<p style='color:#fff;font-family:sans-serif;padding:40px'>WebGL is not available in this browser.</p>";
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
els.stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 2, 0.1, 400);
camera.position.set(0, 7.4, 12);

const hemi = new THREE.HemisphereLight(0xffffff, 0x334444, 0.8);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2d9, 1.1);
sun.position.set(-40, 60, -30);
scene.add(sun);
let boatLight = null;

function applyLegAtmosphere(leg) {
  scene.background = new THREE.Color(leg.sky[0]);
  scene.fog = new THREE.Fog(leg.fog.color, leg.fog.near, lanternFar(leg));
  sun.color.set(leg.light.sun);
  sun.intensity = leg.light.sunI;
  hemi.color.set(leg.light.amb);
  hemi.intensity = leg.light.ambI;
  if (boatLight) boatLight.visible = !!(leg.night || leg.storm) && save.upgrades.lantern > 0;
}
function lanternFar(leg) {
  const bonus = save.upgrades.lantern > 0 ? 55 : 0;
  return leg.fog.far + ((leg.night || leg.storm) ? bonus : 0);
}

/* ---------- water ---------- */
const WATER_LEN = 260, WATER_SEGS_X = 40, WATER_SEGS_Z = 52;
let waterGeo, waterMesh, waterBaseW = 120;
{
  waterGeo = new THREE.PlaneGeometry(waterBaseW, WATER_LEN, WATER_SEGS_X, WATER_SEGS_Z);
  waterGeo.rotateX(-Math.PI / 2);
  const count = waterGeo.attributes.position.count;
  waterGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  waterMesh = new THREE.Mesh(waterGeo, mat);
  waterMesh.position.z = -WATER_LEN / 2 + 40;
  scene.add(waterMesh);
}
const _cNear = new THREE.Color(), _cFar = new THREE.Color(), _cNmai = new THREE.Color(0x2e7d5e), _cMali = new THREE.Color(0x8a6a3e), _cTmp = new THREE.Color(), _cGlint = new THREE.Color(0xf2f8f0);
function updateWater(dt) {
  const leg = state.leg || LEGS[0];
  _cNear.set(leg.water[0]); _cFar.set(leg.water[1]);
  const pos = waterGeo.attributes.position;
  const col = waterGeo.attributes.color;
  const t = state.time;
  const flow = state.dist * 0.35;
  const confl = leg.confluence ? clamp((state.dist - (leg.distance - 320)) / 320, 0, 1) : 0;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i) + waterMesh.position.z;
    const w =
      Math.sin(x * 0.28 + t * 1.6) * 0.22 +
      Math.sin(z * 0.22 - flow * 0.9 + t * 0.7) * 0.3 +
      Math.sin((x + z) * 0.13 + t * 1.1) * 0.16;
    pos.setY(i, w * (leg.storm ? 1.9 : 1));
    const depth = clamp((-z) / 180, 0, 1);
    _cTmp.copy(_cNear).lerp(_cFar, depth);
    // moving glints so the surface reads as water, not road
    const glint = Math.sin(x * 1.35 + z * 0.8 - flow * 1.8 + t * 2.1) + Math.sin(x * 0.6 - z * 1.1 + t * 1.3);
    const sparkle = Math.max(0, glint - 1.25) * (leg.night ? 0.32 : 0.55);
    if (sparkle > 0) _cTmp.lerp(_cGlint, Math.min(0.5, sparkle));
    if (confl > 0) {
      const side = clamp(x / 14 + Math.sin(z * 0.08) * 0.4, -1, 1);
      const mix = side > 0 ? _cNmai : _cMali;
      _cTmp.lerp(mix, confl * 0.75 * Math.min(1, Math.abs(side) + 0.2));
    }
    col.setXYZ(i, _cTmp.r, _cTmp.g, _cTmp.b);
  }
  pos.needsUpdate = true;
  col.needsUpdate = true;
}

/* ---------- materials (shared) ---------- */
const M = {
  wood: new THREE.MeshLambertMaterial({ color: 0x7a4a28 }),
  woodDark: new THREE.MeshLambertMaterial({ color: 0x53301a }),
  woodLight: new THREE.MeshLambertMaterial({ color: 0xa8743e }),
  gold: new THREE.MeshLambertMaterial({ color: 0xe8b23a, emissive: 0x6a4a08 }),
  white: new THREE.MeshLambertMaterial({ color: 0xf2ede0 }),
  red: new THREE.MeshLambertMaterial({ color: 0xb03a2e }),
  leaf: new THREE.MeshLambertMaterial({ color: 0x2e7d52 }),
  leafDark: new THREE.MeshLambertMaterial({ color: 0x1d5c3a }),
  sand: new THREE.MeshLambertMaterial({ color: 0xd9c48a }),
  rock: new THREE.MeshLambertMaterial({ color: 0x5e6a70 }),
  rockDark: new THREE.MeshLambertMaterial({ color: 0x39454c }),
  cloth: new THREE.MeshLambertMaterial({ color: 0x2e86ab }),
  skin: new THREE.MeshLambertMaterial({ color: 0xc98a5a }),
  lanternGold: new THREE.MeshLambertMaterial({ color: 0xffc95e, emissive: 0xcf8a1a }),
  lanternRed: new THREE.MeshLambertMaterial({ color: 0xff5e4a, emissive: 0xc0281a }),
  foam: new THREE.MeshLambertMaterial({ color: 0xeef6f2 }),
  pot: new THREE.MeshLambertMaterial({ color: 0x9a5a32 }),
};

/* ---------- boat ---------- */
const boat = new THREE.Group();
{
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.7, 5.4), M.wood);
  hull.position.y = 0.35;
  const bow = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.7, 4), M.wood);
  bow.rotation.x = -Math.PI / 2;
  bow.rotation.y = Math.PI / 4;
  bow.scale.set(1, 1, 0.72);
  bow.position.set(0, 0.35, -3.4);
  const rim = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.16, 5.5), M.woodDark);
  rim.position.y = 0.72;
  const canopy = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 2.0, 10, 1, false, 0, Math.PI), M.red);
  canopy.rotation.z = Math.PI / 2;
  canopy.rotation.y = Math.PI / 2;
  canopy.scale.set(1, 1, 0.8);
  canopy.position.set(0, 1.15, 0.6);
  const man = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.85, 8), M.cloth);
  body.position.y = 1.0;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), M.skin);
  head.position.y = 1.62;
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.28, 10), M.sand);
  hat.position.y = 1.82;
  man.add(body, head, hat);
  man.position.set(0, 0.3, 1.9);
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.4, 6), M.rockDark);
  motor.rotation.x = Math.PI / 2.6;
  motor.position.set(0.3, 0.9, 3.2);
  boatLight = new THREE.PointLight(0xffc95e, 0, 42, 1.6);
  boatLight.position.set(0, 2.4, -1.5);
  const lampMesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), M.lanternGold);
  lampMesh.position.copy(boatLight.position);
  boat.add(hull, bow, rim, canopy, man, motor, boatLight, lampMesh);
  scene.add(boat);
}

/* ---------- spray particles ---------- */
const SPRAY_N = 90;
const spray = { idx: 0, life: new Float32Array(SPRAY_N), vel: [] };
{
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SPRAY_N * 3), 3));
  spray.geo = g;
  spray.points = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xf4fbf8, size: 0.55, transparent: true, opacity: 0.85, depthWrite: false }));
  scene.add(spray.points);
  for (let i = 0; i < SPRAY_N; i++) { spray.vel.push(new THREE.Vector3()); spray.geo.attributes.position.setXYZ(i, 0, -30, 0); }
}
function emitSpray(x, y, z, n, spread, up) {
  for (let i = 0; i < n; i++) {
    const k = spray.idx = (spray.idx + 1) % SPRAY_N;
    spray.life[k] = 0.6 + Math.random() * 0.3;
    spray.geo.attributes.position.setXYZ(k, x + (Math.random() - 0.5) * spread, y, z + (Math.random() - 0.5) * spread);
    spray.vel[k].set((Math.random() - 0.5) * 3, up + Math.random() * 2, 1 + Math.random() * 2);
  }
}
function updateSpray(dt) {
  const p = spray.geo.attributes.position;
  for (let i = 0; i < SPRAY_N; i++) {
    if (spray.life[i] <= 0) continue;
    spray.life[i] -= dt;
    spray.vel[i].y -= 9 * dt;
    p.setXYZ(i,
      p.getX(i) + spray.vel[i].x * dt,
      Math.max(-30, p.getY(i) + spray.vel[i].y * dt),
      p.getZ(i) + spray.vel[i].z * dt);
    if (spray.life[i] <= 0) p.setY(i, -30);
  }
  p.needsUpdate = true;
}

/* ---------- rain ---------- */
const RAIN_N = 380;
let rainPts = null;
{
  const g = new THREE.BufferGeometry();
  const arr = new Float32Array(RAIN_N * 3);
  for (let i = 0; i < RAIN_N; i++) {
    arr[i * 3] = (Math.random() - 0.5) * 90;
    arr[i * 3 + 1] = Math.random() * 40;
    arr[i * 3 + 2] = -Math.random() * 120 + 15;
  }
  g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  rainPts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xaac4d4, size: 0.22, transparent: true, opacity: 0.65, depthWrite: false }));
  rainPts.visible = false;
  scene.add(rainPts);
}
function updateRain(dt) {
  if (!rainPts.visible) return;
  const p = rainPts.geometry.attributes.position;
  for (let i = 0; i < RAIN_N; i++) {
    let y = p.getY(i) - 34 * dt;
    if (y < 0) { y = 38; emitNothing(); }
    p.setY(i, y);
  }
  p.needsUpdate = true;
}
function emitNothing() {}

/* ---------- scenery ---------- */
const sceneryGroup = new THREE.Group();
scene.add(sceneryGroup);
let scenerySlots = [];
let groundL = null, groundR = null, landmarkGroup = null;

function makeTree(scale, mat) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 2.4, 6), M.woodDark);
  trunk.position.y = 1.2;
  const crown = new THREE.Mesh(new THREE.SphereGeometry(1.7, 8, 6), mat || M.leaf);
  crown.position.y = 3.2;
  crown.scale.y = 0.85;
  g.add(trunk, crown);
  g.scale.setScalar(scale);
  return g;
}
function makePalm(scale) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.3, 4.4, 6), M.woodLight);
  trunk.position.y = 2.2;
  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.6, 4), M.leaf);
    leaf.position.y = 4.5;
    leaf.rotation.z = Math.PI / 2.4;
    leaf.rotation.y = (i / 5) * Math.PI * 2;
    leaf.translateY(1.0);
    g.add(leaf);
  }
  g.add(trunk);
  g.scale.setScalar(scale);
  return g;
}
function makeStupa(scale, golden) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.0, 1.0, 8), golden ? M.gold : M.white);
  base.position.y = 0.5;
  const bell = new THREE.Mesh(new THREE.SphereGeometry(1.35, 10, 8), golden ? M.gold : M.white);
  bell.position.y = 1.8;
  bell.scale.y = 1.15;
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.6, 8), M.gold);
  spire.position.y = 3.6;
  g.add(base, bell, spire);
  g.scale.setScalar(scale);
  return g;
}
function makeStiltHouse(scale) {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 1.8), M.woodLight);
  box.position.y = 1.9;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.2, 4), M.woodDark);
  roof.position.y = 3.2;
  roof.rotation.y = Math.PI / 4;
  for (const sx of [-0.9, 0.9]) for (const sz of [-0.6, 0.6]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.4, 5), M.woodDark);
    post.position.set(sx, 0.6, sz);
    g.add(post);
  }
  g.add(box, roof);
  g.scale.setScalar(scale);
  return g;
}
function makeCliff(scale, h) {
  const g = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.BoxGeometry(8, h, 22), M.rock);
  slab.position.y = h / 2 - 0.5;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(7, 2, 18), M.leafDark);
  cap.position.y = h + 0.4;
  g.add(slab, cap);
  g.scale.setScalar(scale);
  return g;
}
function makePine(scale) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 1.6, 5), M.woodDark);
  trunk.position.y = 0.8;
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.5 - i * 0.4, 1.6, 7), M.leafDark);
    cone.position.y = 1.8 + i * 1.05;
    g.add(cone);
  }
  g.add(trunk);
  g.scale.setScalar(scale);
  return g;
}
function makePotStack(scale) {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const pot = new THREE.Mesh(new THREE.SphereGeometry(0.9 - i * 0.15, 8, 6), M.pot);
    pot.position.y = 0.7 + i * 1.1;
    pot.scale.y = 1.1;
    g.add(pot);
  }
  g.scale.setScalar(scale);
  return g;
}
function makeHill(scale) {
  const g = new THREE.Group();
  const h = new THREE.Mesh(new THREE.SphereGeometry(9, 8, 6), M.leafDark);
  h.position.y = -3.5;
  h.scale.set(1.4, 0.55, 1);
  g.add(h);
  g.scale.setScalar(scale);
  return g;
}

function themeItem(theme, r) {
  const pick = r();
  switch (theme) {
    case "delta": return pick < 0.4 ? makePalm(1 + r()) : pick < 0.7 ? makeStiltHouse(0.9 + r() * 0.5) : makeStupa(0.6 + r() * 0.5, true);
    case "dry": return pick < 0.6 ? makePalm(0.8 + r() * 0.7) : makeHill(0.5 + r() * 0.4);
    case "bagan": return pick < 0.65 ? makeStupa(0.8 + r() * 1.1, r() < 0.35) : makeTree(0.8 + r() * 0.6);
    case "thanaka": return pick < 0.6 ? makeTree(0.7 + r() * 0.5, M.leaf) : pick < 0.85 ? makeStiltHouse(0.9 + r() * 0.4) : makeStupa(0.7, true);
    case "night": return pick < 0.5 ? makeTree(0.8 + r() * 0.6, M.leafDark) : makeStupa(0.7 + r() * 0.6, true);
    case "storm": return pick < 0.6 ? makeTree(0.8 + r() * 0.7, M.leafDark) : makePotStack(0.9 + r() * 0.6);
    case "teak": return pick < 0.7 ? makeTree(1.1 + r() * 0.9) : makePotStack(0.8);
    case "defile": return makeCliff(0.9 + r() * 0.3, 16 + r() * 14);
    case "north": return pick < 0.75 ? makePine(1 + r() * 0.9) : makeHill(0.6 + r() * 0.5);
    case "myitsone": return pick < 0.5 ? makePine(0.9 + r() * 0.8) : pick < 0.8 ? makeHill(0.7 + r() * 0.5) : makeStupa(0.7, true);
    default: return makeTree(1);
  }
}

function makeBridge(width) {
  const g = new THREE.Group();
  const span = new THREE.Mesh(new THREE.BoxGeometry(width + 44, 1.4, 5), M.rockDark);
  span.position.y = 10;
  g.add(span);
  const n = 7;
  for (let i = 0; i < n; i++) {
    const x = -(width + 36) / 2 + i * ((width + 36) / (n - 1));
    const pier = new THREE.Mesh(new THREE.BoxGeometry(2.2, 11, 3.4), M.rock);
    pier.position.set(x, 4.6, 0);
    g.add(pier);
    const arch = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.6, 4.6), M.rockDark);
    arch.position.set(x, 11.6, 0);
    g.add(arch);
  }
  return g;
}

const SLOT_SPACING = 22, SLOTS_PER_SIDE = 13;
function buildScenery(leg) {
  sceneryGroup.clear();
  scenerySlots = [];
  const r = mulberry32(0xBEEF + LEGS.indexOf(leg) * 131);
  const half = leg.riverWidth / 2;
  const isDefile = leg.theme === "defile";
  // ground strips
  const groundMat = new THREE.MeshLambertMaterial({ color: leg.theme === "dry" ? 0xc4a86a : leg.night ? 0x16281e : leg.theme === "defile" ? 0x4a565c : 0x3e6e48 });
  groundL = new THREE.Mesh(new THREE.BoxGeometry(60, 2, WATER_LEN), groundMat);
  groundR = groundL.clone();
  groundL.position.set(-(half + 30.5), 0.55, -WATER_LEN / 2 + 40);
  groundR.position.set(half + 30.5, 0.55, -WATER_LEN / 2 + 40);
  sceneryGroup.add(groundL, groundR);
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < SLOTS_PER_SIDE; i++) {
      const item = themeItem(leg.theme, r);
      const lateral = side * (half + (isDefile ? 4.5 : 4 + r() * 18));
      item.position.x = lateral;
      item.position.y = isDefile ? 0.4 : 1.1;
      item.rotation.y = r() * Math.PI * 2;
      sceneryGroup.add(item);
      scenerySlots.push({ obj: item, at: i * SLOT_SPACING + r() * 8, side });
    }
  }
  // landmark bridge
  landmarkGroup = null;
  if (leg.landmark === "bridge" || leg.landmark === "avabridge") {
    landmarkGroup = makeBridge(leg.riverWidth);
    if (leg.landmark === "avabridge") {
      for (let i = 0; i < 6; i++) {
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 5), M.lanternGold);
        lamp.position.set(-leg.riverWidth / 2 + i * (leg.riverWidth / 5), 11.4, 0);
        landmarkGroup.add(lamp);
      }
    }
    landmarkGroup.userData.at = leg.distance - 110;
    sceneryGroup.add(landmarkGroup);
  }
  rainPts.visible = !!leg.storm;
}
function updateScenery() {
  const total = SLOTS_PER_SIDE * SLOT_SPACING;
  for (const s of scenerySlots) {
    let rel = s.at - (state.dist % total);
    if (rel < -SLOT_SPACING * 1.5) rel += total;
    s.obj.position.z = -rel + 20;
    s.obj.visible = s.obj.position.z < 30;
  }
  if (landmarkGroup) {
    const rel = landmarkGroup.userData.at - state.dist;
    landmarkGroup.position.z = -rel;
    landmarkGroup.visible = rel > -40 && rel < 240;
  }
}

/* ---------- obstacles ---------- */
const obstacleGroup = new THREE.Group();
scene.add(obstacleGroup);
let obstacles = [];   // active
let spawnPlan = [];   // {at, type, x, ...}
let planCursor = 0;

function makeObstacleMesh(type, o) {
  const g = new THREE.Group();
  switch (type) {
    case "log": {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 6.5, 8), M.wood);
      log.rotation.z = Math.PI / 2;
      log.position.y = 0.3;
      g.add(log);
      o.hx = 3.4; o.hz = 0.9;
      break;
    }
    case "raft": {
      for (let i = 0; i < 5; i++) {
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 8.5, 7), M.woodLight);
        log.rotation.x = Math.PI / 2;
        log.position.set(-2.2 + i * 1.1, 0.3, 0);
        g.add(log);
      }
      const hut = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.3, 4), M.sand);
      hut.position.y = 1.2;
      g.add(hut);
      o.hx = 3.1; o.hz = 4.4;
      break;
    }
    case "barge": {
      const hull = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.6, 13), M.rockDark);
      hull.position.y = 0.8;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.6, 3.4), M.white);
      cabin.position.set(0, 2.2, 4);
      const cargo = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.3, 6), M.pot);
      cargo.position.set(0, 1.9, -1.5);
      g.add(hull, cabin, cargo);
      o.hx = 2.4; o.hz = 6.8;
      break;
    }
    case "ferry": {
      const hull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.2, 9), M.white);
      hull.position.y = 0.7;
      const deck = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.4, 6.5), M.cloth);
      deck.position.y = 1.9;
      g.add(hull, deck);
      o.hx = 1.9; o.hz = 4.8;
      break;
    }
    case "fisher": {
      const hull = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 3.6), M.woodDark);
      hull.position.y = 0.35;
      const man = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.8, 6), M.cloth);
      man.position.y = 1.0;
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.25, 8), M.sand);
      hat.position.y = 1.5;
      g.add(hull, man, hat);
      o.hx = 0.8; o.hz = 2.1;
      break;
    }
    case "whirlpool": {
      const disc = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.5, 8, 20), new THREE.MeshLambertMaterial({ color: 0x1d4a52, transparent: true, opacity: 0.85 }));
      disc.rotation.x = -Math.PI / 2;
      disc.position.y = 0.12;
      const disc2 = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.35, 8, 16), M.foam);
      disc2.rotation.x = -Math.PI / 2;
      disc2.position.y = 0.2;
      g.add(disc, disc2);
      o.hx = 1.5; o.hz = 1.5; o.spin = true; o.pull = 8.5;
      break;
    }
    case "sandbar": {
      const mound = new THREE.Mesh(new THREE.SphereGeometry(3.4, 10, 7), M.sand);
      mound.scale.set(1.5, 0.28, 1);
      mound.position.y = 0.1;
      g.add(mound);
      o.hx = 4.3; o.hz = 2.6; o.soft = true;
      break;
    }
    case "net": {
      // two bamboo poles + net between (the gap is elsewhere in the row)
      for (const px of [-3.2, 3.2]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 3.4, 6), M.woodLight);
        pole.position.set(px, 1.4, 0);
        g.add(pole);
      }
      const net = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.6), new THREE.MeshLambertMaterial({ color: 0x8fb5a8, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
      net.position.y = 1.2;
      g.add(net);
      const floats = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.18, 0.3), M.red);
      floats.position.y = 0.35;
      g.add(floats);
      o.hx = 3.3; o.hz = 0.6; o.soft = true;
      break;
    }
    case "lantern": {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 2.6, 6), M.woodDark);
      post.position.y = 1.1;
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.62, 8, 6), o.red ? M.lanternRed : M.lanternGold);
      lamp.position.y = 2.6;
      const halo = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 6), new THREE.MeshBasicMaterial({ color: o.red ? 0xff5e4a : 0xffc95e, transparent: true, opacity: 0.16, depthWrite: false }));
      halo.position.y = 2.6;
      g.add(halo);
      g.add(post, lamp);
      if (o.red) {
        const snag = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 0), M.rockDark);
        snag.position.y = -0.2;
        g.add(snag);
        o.hx = 1.5; o.hz = 1.5;
      } else {
        o.hx = 0; o.hz = 0; // safe marker
      }
      break;
    }
    case "debris": {
      for (let i = 0; i < 4; i++) {
        const piece = new THREE.Mesh(new THREE.BoxGeometry(0.8 + Math.random(), 0.5, 0.8 + Math.random()), i % 2 ? M.woodDark : M.wood);
        piece.position.set((Math.random() - 0.5) * 2.4, 0.3, (Math.random() - 0.5) * 2.4);
        piece.rotation.y = Math.random() * 3;
        g.add(piece);
      }
      o.hx = 1.8; o.hz = 1.8; o.wobble = true;
      break;
    }
    case "rock": {
      const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7, 0), M.rock);
      rock.position.y = 0.5;
      rock.rotation.set(0.4, 1.1, 0.2);
      const foam = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.3, 6, 14), M.foam);
      foam.rotation.x = -Math.PI / 2;
      foam.position.y = 0.1;
      g.add(rock, foam);
      o.hx = 1.7; o.hz = 1.7;
      break;
    }
    case "shoal": {
      for (let i = 0; i < 4; i++) {
        const rk = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 0), M.rockDark);
        rk.position.set(i * 1.7 - 2.5, 0.25, (i % 2) * 1.2 - 0.6);
        g.add(rk);
      }
      const foam = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.15, 2.4), M.foam);
      foam.position.y = 0.05;
      g.add(foam);
      o.hx = 3.7; o.hz = 1.4;
      break;
    }
    case "rapids": {
      const band = new THREE.Mesh(new THREE.BoxGeometry(40, 0.18, 7), new THREE.MeshLambertMaterial({ color: 0xdfeeea, transparent: true, opacity: 0.8 }));
      band.position.y = 0.08;
      g.add(band);
      for (let i = 0; i < 3; i++) {
        const rk = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 0), M.rock);
        rk.position.set(o.rockXs[i], 0.35, (i - 1) * 1.8);
        g.add(rk);
      }
      o.hx = 99; o.hz = 3.5; o.band = true;
      break;
    }
    case "coin": {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.14, 14), M.gold);
      c.rotation.x = Math.PI / 2;
      c.position.y = 1.0;
      g.add(c);
      o.hx = 1.15; o.hz = 1.15; o.pickup = "coin"; o.spinY = true;
      break;
    }
    case "padauk": {
      for (let i = 0; i < 5; i++) {
        const petal = new THREE.Mesh(new THREE.SphereGeometry(0.32, 6, 5), M.gold);
        const a = (i / 5) * Math.PI * 2;
        petal.position.set(Math.cos(a) * 0.42, 1.0, Math.sin(a) * 0.42);
        g.add(petal);
      }
      o.hx = 1.3; o.hz = 1.3; o.pickup = "padauk"; o.spinY = true;
      break;
    }
    case "buoySafe": {
      const b = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.6, 8), M.red);
      b.position.y = 0.8;
      g.add(b);
      o.hx = 0; o.hz = 0;
      break;
    }
  }
  return g;
}

function generatePlan(leg, legIdx) {
  rng = mulberry32(0xA5EED + legIdx * 977);
  const plan = [];
  const half = leg.riverWidth / 2 - 2.2;
  const types = Object.keys(leg.hazards);
  const weights = types.map((t) => leg.hazards[t]);
  const totalW = weights.reduce((a, b) => a + b, 0);
  const pickType = () => {
    let v = rng() * totalW;
    for (let i = 0; i < types.length; i++) { v -= weights[i]; if (v <= 0) return types[i]; }
    return types[0];
  };
  let at = 130;
  while (at < leg.distance - 160) {
    const ramp = lerp(0.8, 1.35, at / leg.distance);
    const type = pickType();
    if (type === "net") {
      // a row of nets across the river with one gap
      const cols = Math.max(2, Math.round(leg.riverWidth / 8));
      const gap = Math.floor(rng() * cols);
      for (let c = 0; c < cols; c++) {
        if (c === gap) continue;
        const x = -half + 2 + (c + 0.5) * ((half * 2 - 4) / cols);
        plan.push({ at, type: "net", x });
      }
    } else if (type === "lantern") {
      const safeX = (rng() * 2 - 1) * (half - 4);
      plan.push({ at, type: "lantern", x: safeX, red: false });
      const redX = safeX + (rng() < 0.5 ? -1 : 1) * (6 + rng() * 5);
      plan.push({ at, type: "lantern", x: clamp(redX, -half, half), red: true });
      plan.push({ at: at + 10, type: "coin", x: safeX });
      plan.push({ at: at + 16, type: "coin", x: safeX });
    } else if (type === "rapids") {
      plan.push({ at, type: "rapids", x: 0, rockXs: [(rng() * 2 - 1) * half, (rng() * 2 - 1) * half, (rng() * 2 - 1) * half] });
    } else if (type === "sandbar") {
      const side = rng() < 0.5 ? -1 : 1;
      plan.push({ at, type, x: side * (half - 1.5 - rng() * 3) });
    } else if (type === "barge" || type === "ferry") {
      plan.push({ at, type, x: (rng() * 2 - 1) * (half - 3), down: true, vz: type === "barge" ? 4.5 + rng() * 2 : 3.5, vx: type === "ferry" ? (rng() < 0.5 ? -1 : 1) * 1.6 : 0 });
    } else if (type === "log" || type === "debris" || type === "raft") {
      plan.push({ at, type, x: (rng() * 2 - 1) * (half - 2), down: true, vz: leg.current * (0.8 + rng() * 0.5) });
    } else {
      plan.push({ at, type, x: (rng() * 2 - 1) * (half - 1.5) });
    }
    at += (46 + rng() * 34) / ramp;
    // coins between hazards
    if (rng() < 0.75 * leg.coinRate) {
      const cx = (rng() * 2 - 1) * (half - 2.5);
      const n = 3 + Math.floor(rng() * 3);
      const isPadauk = rng() < 0.12;
      for (let i = 0; i < n; i++) {
        plan.push({ at: at + i * 7, type: i === Math.floor(n / 2) && isPadauk ? "padauk" : "coin", x: cx + Math.sin(i * 0.9) * 2.2 });
      }
      at += n * 7 + 14;
    }
  }
  plan.sort((a, b) => a.at - b.at);
  return plan;
}

const SPAWN_AHEAD = 185, DESPAWN_BEHIND = 26;
function spawnFromPlan() {
  while (planCursor < spawnPlan.length && spawnPlan[planCursor].at < state.dist + SPAWN_AHEAD) {
    const def = spawnPlan[planCursor++];
    const o = { ...def, drift: 0, taken: false };
    o.mesh = makeObstacleMesh(o.type, o);
    o.mesh.position.set(o.x, 0, -(o.at - state.dist));
    obstacleGroup.add(o.mesh);
    obstacles.push(o);
  }
}
function clearObstacles() {
  for (const o of obstacles) obstacleGroup.remove(o.mesh);
  obstacles = [];
  planCursor = 0;
}

const BOAT_HW = 1.15, BOAT_HL = 2.6;
function updateObstacles(dt) {
  const leg = state.leg;
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    if (o.down) o.drift += o.vz * dt;
    if (o.vx) {
      o.x += o.vx * dt;
      const half = leg.riverWidth / 2 - 2;
      if (Math.abs(o.x) > half) o.vx *= -1;
    }
    if (o.wobble) o.x += Math.sin(state.time * 2 + o.at) * dt * 1.2;
    const z = state.dist - o.at + o.drift;
    o.mesh.position.set(o.x, 0, z);
    if (o.spin) o.mesh.rotation.y += dt * 2.4;
    if (o.spinY) o.mesh.rotation.z += dt * 3;
    if (o.type === "log") o.mesh.children[0].rotation.x += dt * 1.5;
    if (z > DESPAWN_BEHIND) {
      obstacleGroup.remove(o.mesh);
      obstacles.splice(i, 1);
      continue;
    }
    if (o.taken) continue;

    // --- interactions near the boat ---
    if (o.pull && !state.paused) {
      const dx = o.x - state.boatX, dz = -z;
      const d2 = dx * dx + dz * dz;
      if (d2 < 90) {
        const d = Math.sqrt(d2) || 1;
        state.boatX += (dx / d) * o.pull * dt * (1 - d / 9.6);
        if (d2 < 20 && Math.floor(state.time * 3) % 4 === 0) AUDIO.sfx("whirl");
      }
    }
    // collision window on z
    if (Math.abs(z) > (o.hz + BOAT_HL)) continue;
    if (o.pickup) {
      const magnet = save.upgrades.charm > 0 ? (save.upgrades.charm > 1 ? 6.5 : 4.2) : 0;
      const dx = o.x - state.boatX;
      if (magnet && Math.abs(dx) < magnet && Math.abs(z) < magnet + 2) {
        o.x -= dx * dt * 6;
      }
      if (Math.abs(dx) < o.hx + BOAT_HW && Math.abs(z) < o.hz + BOAT_HL) {
        o.taken = true;
        o.mesh.visible = false;
        const v = o.pickup === "padauk" ? window.UpstreamLegs.padaukValue : window.UpstreamLegs.coinValue;
        state.runCoins += v;
        AUDIO.sfx(o.pickup);
        updateHudCoins();
      }
      continue;
    }
    if (o.band) {
      // rapids band: slow + shake unless boosting; rocks handled below via their own entries? rocks are part of mesh: approximate with rockXs
      if (Math.abs(z) < o.hz + BOAT_HL) {
        if (!state.boost) state.slowT = Math.max(state.slowT, 0.25);
        state.shake = Math.max(state.shake, 0.18);
        if (Math.floor(state.time * 10) % 3 === 0) emitSpray(state.boatX, 0.4, -2, 2, 1.6, 2.4);
        for (const rx of o.rockXs) {
          if (Math.abs(rx - state.boatX) < 1.6 + BOAT_HW && Math.abs(z) < 1.8) hitBoat(o);
        }
      }
      continue;
    }
    if (o.hx > 0 && Math.abs(o.x - state.boatX) < o.hx + BOAT_HW && Math.abs(z) < o.hz + BOAT_HL) {
      if (o.soft) {
        state.slowT = Math.max(state.slowT, 0.9);
        hitBoat(o);
        o.taken = true;
      } else {
        hitBoat(o);
      }
    }
  }
}

function hitBoat(o) {
  if (state.invuln > 0 || state.mode !== "playing") return;
  state.hearts -= 1;
  state.invuln = 1.8;
  state.shake = REDUCED_MOTION ? 0 : 0.5;
  AUDIO.sfx("hit");
  emitSpray(state.boatX, 0.4, 0, 14, 2.4, 3.4);
  els.app.classList.remove("hit-flash");
  void els.app.offsetWidth;
  els.app.classList.add("hit-flash");
  renderHearts();
  if (state.hearts <= 0) {
    state.mode = "sinking";
    state.sinkT = 1.5;
    AUDIO.setRiver(0.05);
  }
}

/* ---------- HUD ---------- */
function maxHearts() { return window.UpstreamLegs.baseHearts + save.upgrades.hull; }
function renderHearts() {
  let html = "";
  for (let i = 0; i < maxHearts(); i++) html += `<span class="${i < state.hearts ? "" : "lost"}">❤️</span>`;
  els.hearts.innerHTML = html;
}
function updateHudCoins() {
  els.hudCoins.textContent = save.coins + state.runCoins;
}
function updateProgress() {
  const pct = state.leg ? clamp((state.dist / state.leg.distance) * 100, 0, 100) : 0;
  els.progressFill.style.width = pct + "%";
  els.progressBoat.style.left = pct + "%";
}
let toastTimer = null;
function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2600);
}

/* ---------- flow ---------- */
function setScreen(id) {
  els.title.classList.toggle("active", id === "title");
  els.map.classList.toggle("active", id === "map");
}
function overlay(el, show) { el.classList.toggle("hidden", !show); }

function startLeg(idx, { replay = false } = {}) {
  state.legIdx = idx;
  state.leg = LEGS[idx];
  state.replay = replay;
  state.dist = 0;
  state.runCoins = 0;
  state.hearts = maxHearts();
  state.invuln = 0;
  state.shake = 0;
  state.slowT = 0;
  state.boatX = 0;
  state.boatVX = 0;
  state.boost = false;
  state.dockT = 0;
  state.sinkT = 0;
  state.paused = false;
  state.mode = "playing";
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  boat.rotation.set(0, 0, 0);
  boat.position.set(0, 0, 0);
  spawnPlan = generatePlan(state.leg, idx);
  clearObstacles();
  buildScenery(state.leg);
  applyLegAtmosphere(state.leg);
  setScreen(null);
  overlay(els.town, false); overlay(els.pause, false); overlay(els.over, false); overlay(els.finale, false);
  els.hud.hidden = false;
  els.touchUi.hidden = !("ontouchstart" in window);
  els.legLabel.textContent = `${state.leg.from.mm} → ${state.leg.to.mm} · ${state.leg.from.en} → ${state.leg.to.en}`;
  renderHearts();
  updateHudCoins();
  updateProgress();
  // hazard banner (sim-timed)
  els.hzMm.textContent = state.leg.intro.mm;
  els.hzEn.textContent = state.leg.intro.en;
  els.banner.hidden = false;
  state.bannerT = 4.2;
  AUDIO.setMood(state.leg.night ? "night" : state.leg.storm ? "storm" : state.leg.finale ? "finale" : state.leg.home ? "home" : "day", state.leg.storm ? 0.2 : 0.12);
  AUDIO.setRiver(state.leg.storm ? 0.22 : 0.12);
  updateRotateGate();
}

function finishLeg() {
  save.coins += state.runCoins;
  state.runCoins = 0;
  const townId = state.leg.to.id;
  const first = !state.replay && save.leg === state.legIdx;
  if (first) {
    save.leg = state.legIdx + 1;
    if (state.leg.home) {
      // Pakokku gift: grandfather's compass = charm level 1
      save.compass = true;
      if (save.upgrades.charm < 1) save.upgrades.charm = 1;
    }
  }
  writeSave();
  els.hud.hidden = true;
  els.touchUi.hidden = true;
  els.banner.hidden = true;
  AUDIO.sfx("chime");
  if (state.leg.finale && first) {
    save.finished = true;
    save.leg = LEGS.length;
    writeSave();
    startFinale();
    return;
  }
  if (first || !save.seenTowns.includes(townId)) {
    if (!save.seenTowns.includes(townId)) { save.seenTowns.push(townId); writeSave(); }
    showTown(townId);
  } else {
    state.mode = "map";
    showMap();
  }
}

function retryLeg() {
  if (state.runCoins > 0) toast(`◉ ${state.runCoins} — မြစ်ထဲ ပြန်ကျသွားပြီ · coins lost to the river`);
  startLeg(state.legIdx, { replay: state.replay });
}
function quitToMap() {
  state.mode = "map";
  state.paused = false;
  els.hud.hidden = true;
  els.touchUi.hidden = true;
  els.banner.hidden = true;
  overlay(els.pause, false); overlay(els.over, false);
  showMap();
}

/* ---------- town / story ---------- */
function showTown(townId, { prologue = false } = {}) {
  state.mode = "town";
  state.townId = townId;
  state.townLineIdx = 0;
  const scn = prologue
    ? { arrive: STORY.prologue.title, lines: STORY.prologue.lines }
    : STORY.scenes[townId];
  state.townScene = scn;
  state.townIsPrologue = prologue;
  const legOfTown = LEGS.find((l) => l.to.id === townId);
  els.townEmoji.textContent = prologue ? "✉️" : (scn.home ? "🏠" : scn.finale ? "🏞️" : "🏘️");
  els.townTitle.textContent = scn.arrive.mm;
  els.townSub.textContent = scn.arrive.en;
  overlay(els.town, true);
  els.shop.classList.add("hidden");
  els.btnTownContinue.hidden = true;
  renderTownLine();
  AUDIO.setMood(scn.home ? "home" : "day", 0.06);
  setScreen(null);
}
function renderTownLine() {
  const scn = state.townScene;
  const line = scn.lines[state.townLineIdx];
  const who = STORY.cast[line.who] || STORY.cast.hero;
  els.dlgPortrait.textContent = who.emoji;
  els.dlgWho.textContent = `${who.mm} · ${who.en}`;
  els.dlgMm.textContent = line.mm;
  let extra = "";
  if (scn.gift && state.townLineIdx === scn.lines.length - 1) {
    extra = `<span class="gift-note">🧭 ${scn.gift.mm} · ${scn.gift.en} — ${scn.gift.note.mm} ${scn.gift.note.en}</span>`;
  }
  els.dlgEn.innerHTML = escapeHtml(line.en) + extra;
  els.btnDlgNext.hidden = false;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function advanceTownLine() {
  AUDIO.sfx("ui");
  const scn = state.townScene;
  if (state.townLineIdx < scn.lines.length - 1) {
    state.townLineIdx++;
    renderTownLine();
    return;
  }
  els.btnDlgNext.hidden = true;
  if (!state.townIsPrologue && !scn.finale) {
    renderShop();
    els.shop.classList.remove("hidden");
  }
  els.btnTownContinue.hidden = false;
  els.btnTownContinue.textContent = state.townIsPrologue ? "လှေပေါ်တက်မယ် · Board the boat" : "ဆက်သွားမယ် · Onward";
}
function townContinue() {
  overlay(els.town, false);
  if (state.townIsPrologue) {
    save.prologueSeen = true;
    writeSave();
    startLeg(0);
  } else {
    state.mode = "map";
    showMap();
  }
}

/* ---------- shop ---------- */
function townIndexOf(townId) { return LEGS.findIndex((l) => l.to.id === townId); }
function renderShop() {
  const tIdx = townIndexOf(state.townId);
  els.shopGrid.innerHTML = "";
  for (const key of Object.keys(UPGRADES)) {
    const up = UPGRADES[key];
    if (tIdx < up.availableFrom) continue;
    const lvl = save.upgrades[key] || 0;
    const maxed = lvl >= up.levels.length;
    const price = maxed ? null : up.levels[lvl];
    const btn = document.createElement("button");
    btn.className = "shop-item" + (maxed ? " owned-max" : "");
    btn.dataset.upgrade = key;
    btn.innerHTML =
      `<span class="si-top">${up.icon} ${escapeHtml(up.en)} <span class="si-lvl">Lv ${lvl}/${up.levels.length}</span></span>` +
      `<span class="si-mm">${escapeHtml(up.mm)} — ${escapeHtml(up.desc.mm)}</span>` +
      `<span class="si-desc">${escapeHtml(up.desc.en)}</span>` +
      `<span class="si-price">${maxed ? "အပြည့် · MAX" : "◉ " + price}</span>`;
    if (!maxed) {
      btn.disabled = save.coins < price;
      btn.addEventListener("click", () => {
        if (save.coins < price) { AUDIO.sfx("deny"); return; }
        save.coins -= price;
        save.upgrades[key] = lvl + 1;
        writeSave();
        AUDIO.sfx("buy");
        toast(`${up.icon} ${up.mm} — Lv ${lvl + 1}`);
        renderShop();
        updateHudCoins();
      });
    } else {
      btn.disabled = true;
    }
    els.shopGrid.appendChild(btn);
  }
  els.mapCoins.textContent = save.coins;
  updateHudCoins();
}

/* ---------- finale ---------- */
function startFinale() {
  state.mode = "finale";
  state.finaleStep = 0;
  overlay(els.finale, true);
  AUDIO.sfx("finale");
  AUDIO.setMood("finale", 0.08);
  renderFinaleStep();
}
function renderFinaleStep() {
  const scn = STORY.scenes.myitsone;
  const steps = scn.lines.length + scn.epilogue.length + 1;
  const i = state.finaleStep;
  els.finaleBody.innerHTML = "";
  if (i < scn.lines.length) {
    els.finaleTitle.textContent = scn.arrive.mm;
    const line = scn.lines[i];
    const who = STORY.cast[line.who];
    els.finaleBody.innerHTML = `<p class="ep-mm">${who.emoji} ${escapeHtml(line.mm)}</p><p class="ep-en">${escapeHtml(line.en)}</p>`;
    els.btnFinaleNext.textContent = "▼";
  } else if (i < scn.lines.length + scn.epilogue.length) {
    els.finaleTitle.textContent = "နိဂုံး · Epilogue";
    const ep = scn.epilogue[i - scn.lines.length];
    els.finaleBody.innerHTML = `<p class="ep-mm">${escapeHtml(ep.mm)}</p><p class="ep-en">${escapeHtml(ep.en)}</p>`;
    els.btnFinaleNext.textContent = "▼";
  } else {
    els.finaleTitle.textContent = "ခရီးပြီးပြီ · Journey Complete";
    els.finaleBody.innerHTML =
      `<p class="ep-mm">မြစ်ဆုံရေ တစ်ဗူး — ဘွားဆီ ရောက်သွားပြီ။ 🏺</p>` +
      `<div class="finale-stats"><span>◉ ${save.coins}</span><span>🛶 ${LEGS.length}/${LEGS.length}</span></div>` +
      `<p class="ep-en">Every leg is open for a free run — the river is yours now.</p>`;
    els.btnFinaleNext.textContent = "မြေပုံသို့ · Route map";
  }
  state.finaleSteps = steps;
}
function advanceFinale() {
  AUDIO.sfx("ui");
  state.finaleStep++;
  if (state.finaleStep >= state.finaleSteps) {
    overlay(els.finale, false);
    state.mode = "map";
    showMap();
    return;
  }
  renderFinaleStep();
}

/* ---------- route map ---------- */
let selectedLeg = null;
function showMap() {
  setScreen("map");
  state.mode = "map";
  els.mapCoins.textContent = save.coins;
  selectedLeg = save.finished ? (selectedLeg ?? 0) : save.leg;
  els.routeList.innerHTML = "";
  const stops = [{ id: "yangon", en: "Yangon", mm: "ရန်ကုန်" }, ...LEGS.map((l) => l.to)];
  stops.forEach((stop, i) => {
    // stop i is reached after finishing leg i-1
    const li = document.createElement("li");
    const legIdx = i; // leg leaving this stop
    const done = save.leg > i || save.finished;
    const isNext = !save.finished && save.leg === i && i < LEGS.length;
    const locked = !done && !isNext;
    li.className = "route-stop" +
      (done && i < LEGS.length ? " done" : "") +
      (isNext || (save.finished && selectedLeg === i) ? " next" : "") +
      (locked ? " locked" : "") +
      (stop.id === "pakokku" ? " home-stop" : "");
    const leg = LEGS[i];
    const tag = stop.id === "pakokku" ? "🏠 အိမ် · home" :
      stop.id === "myitsone" ? "🏁 မြစ်ဆုံ" :
      leg ? `${leg.distance} m` : "";
    li.innerHTML =
      `<span class="stop-dot">${done && i < LEGS.length + 1 && i !== 0 ? "✓" : i === 0 ? "⚓" : i}</span>` +
      `<span class="stop-names"><span class="stop-mm">${stop.mm}</span><br/><span class="stop-en">${stop.en}</span></span>` +
      `<span class="stop-tag">${tag}</span>`;
    if (save.finished && i < LEGS.length) {
      li.style.cursor = "pointer";
      li.addEventListener("click", () => { selectedLeg = i; showMap(); });
    }
    els.routeList.appendChild(li);
  });
  const departIdx = save.finished ? selectedLeg : save.leg;
  els.btnDepart.disabled = departIdx >= LEGS.length && !save.finished;
  if (save.finished) {
    const l = LEGS[selectedLeg];
    els.btnDepart.textContent = `ပြန်မောင်းမယ် · Free run: ${l.from.en} → ${l.to.en}`;
  } else {
    const l = LEGS[save.leg];
    els.btnDepart.textContent = l ? `ထွက်မယ် · Cast off: ${l.from.en} → ${l.to.en}` : "ပြီးပြီ";
  }
}

/* ---------- title ---------- */
function showTitle() {
  setScreen("title");
  state.mode = "title";
  els.hud.hidden = true;
  els.touchUi.hidden = true;
  const hasSave = save.leg > 0 || save.coins > 0 || save.prologueSeen;
  els.btnContinue.hidden = !hasSave;
  if (hasSave) {
    const next = LEGS[Math.min(save.leg, LEGS.length - 1)];
    els.saveHint.textContent = save.finished
      ? `ခရီးပြီးပြီ — free run · ◉ ${save.coins}`
      : `Next: ${next.from.en} → ${next.to.en} · ◉ ${save.coins}`;
  } else {
    els.saveHint.textContent = "";
  }
  newConfirmArmed = false;
  els.btnNew.textContent = "ခရီးစမယ် · New Journey";
  // idle title backdrop: gentle water
  if (!state.leg) {
    state.leg = LEGS[0];
    buildScenery(state.leg);
    applyLegAtmosphere(state.leg);
    boat.position.set(0, 0, 0);
  }
}

let newConfirmArmed = false;
els.btnNew.addEventListener("click", () => {
  const meaningful = save.leg > 0 || save.coins > 20;
  if (meaningful && !newConfirmArmed) {
    newConfirmArmed = true;
    els.btnNew.textContent = "တကယ် အစကပြန်စမလား? · Erase save & restart?";
    AUDIO.sfx("deny");
    return;
  }
  save = defaultSave();
  writeSave();
  AUDIO.unlock(); AUDIO.sfx("ui");
  showTown("yangon", { prologue: true });
});
els.btnContinue.addEventListener("click", () => {
  AUDIO.unlock(); AUDIO.sfx("ui");
  if (!save.prologueSeen) { showTown("yangon", { prologue: true }); return; }
  showMap();
});
els.btnMapBack.addEventListener("click", () => { AUDIO.sfx("ui"); showTitle(); });
els.btnDepart.addEventListener("click", () => {
  AUDIO.unlock(); AUDIO.sfx("ui");
  fadeThen(() => {
    if (save.finished) startLeg(selectedLeg ?? 0, { replay: true });
    else if (save.leg < LEGS.length) startLeg(save.leg);
  });
});
els.btnDlgNext.addEventListener("click", advanceTownLine);
els.btnTownContinue.addEventListener("click", () => { AUDIO.sfx("ui"); townContinue(); });
els.btnFinaleNext.addEventListener("click", advanceFinale);

els.btnPause.addEventListener("click", () => togglePause(true));
els.btnResume.addEventListener("click", () => togglePause(false));
els.btnRetry.addEventListener("click", () => { overlay(els.pause, false); retryLeg(); });
els.btnQuit.addEventListener("click", quitToMap);
els.btnOverRetry.addEventListener("click", () => { overlay(els.over, false); retryLeg(); });
els.btnOverMap.addEventListener("click", quitToMap);

function togglePause(on) {
  if (state.mode !== "playing") return;
  state.paused = on;
  overlay(els.pause, on);
  els.pauseLeg.textContent = `${state.leg.from.en} → ${state.leg.to.en} · ${Math.round((state.dist / state.leg.distance) * 100)}%`;
  AUDIO.sfx("ui");
}

function fadeThen(fn) {
  els.fader.classList.add("on");
  const tid = setTimeout(() => {
    els.fader.classList.remove("on");
    fn();
  }, 420);
  // fader is cosmetic; a second fade cancels the first
  fadeThen._t && clearTimeout(fadeThen._t);
  fadeThen._t = tid;
}

/* ---------- mute ---------- */
function syncMuteUi() {
  const m = AUDIO.muted;
  els.btnMute.textContent = m ? "🔇" : "🔊";
  els.btnMuteMenu.textContent = m ? "🔇 အသံ Off" : "🔊 အသံ On";
}
els.btnMute.addEventListener("click", () => { AUDIO.setMuted(!AUDIO.muted); syncMuteUi(); });
els.btnMuteMenu.addEventListener("click", () => { AUDIO.unlock(); AUDIO.setMuted(!AUDIO.muted); syncMuteUi(); });

/* ---------- input ---------- */
const keys = new Set();
let steerTarget = 0;       // -1..1
let touchSteer = null;     // active pointer steering
addEventListener("keydown", (e) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(e.code) && state.mode === "playing") e.preventDefault();
  if (e.repeat) return;
  keys.add(e.code);
  if (e.code === "Escape") {
    if (state.mode === "playing") togglePause(!state.paused);
  }
  AUDIO.unlock();
});
addEventListener("keyup", (e) => keys.delete(e.code));
addEventListener("blur", () => { keys.clear(); touchSteer = null; state.boost = false; els.btnBoost.classList.remove("held"); });
document.addEventListener("visibilitychange", () => { if (document.hidden) { keys.clear(); touchSteer = null; state.boost = false; } });

// drag steering on the stage
els.stage.addEventListener("pointerdown", (e) => {
  if (state.mode !== "playing" || state.paused) return;
  touchSteer = { id: e.pointerId, x: e.clientX, boatX: state.boatX };
  AUDIO.unlock();
});
addEventListener("pointermove", (e) => {
  if (!touchSteer || e.pointerId !== touchSteer.id) return;
  const dx = (e.clientX - touchSteer.x) / innerWidth;
  const half = state.leg ? state.leg.riverWidth / 2 - 1.6 : 12;
  state.boatX = clamp(touchSteer.boatX + dx * half * 3.2, -half, half);
});
addEventListener("pointerup", (e) => { if (touchSteer && e.pointerId === touchSteer.id) touchSteer = null; });
addEventListener("pointercancel", (e) => { if (touchSteer && e.pointerId === touchSteer.id) touchSteer = null; });

for (const evt of ["pointerdown", "touchstart"]) {
  els.btnBoost.addEventListener(evt, (e) => { e.preventDefault(); state.boost = true; els.btnBoost.classList.add("held"); AUDIO.unlock(); AUDIO.sfx("boost"); }, { passive: false });
}
for (const evt of ["pointerup", "pointercancel", "pointerleave", "touchend"]) {
  els.btnBoost.addEventListener(evt, () => { state.boost = false; els.btnBoost.classList.remove("held"); });
}

/* ---------- resize & rotate gate ---------- */
function fitLayout() {
  const w = els.stage.clientWidth || innerWidth;
  const h = els.stage.clientHeight || innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  updateRotateGate();
}
function updateRotateGate() {
  const portrait = innerHeight > innerWidth && Math.min(innerWidth, innerHeight) < 620;
  const block = portrait && (state.mode === "playing" || state.mode === "sinking");
  state.rotateBlocked = block;
  els.rotate.hidden = !block;
  document.body.classList.toggle("need-landscape", block);
}
let resizeRaf = 0;
addEventListener("resize", () => {
  cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(fitLayout);
});
addEventListener("orientationchange", () => {
  cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(() => { fitLayout(); requestAnimationFrame(fitLayout); });
});

/* ---------- main loop ---------- */
let lastT = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  state.time += dt;

  const playing = state.mode === "playing" && !state.paused && !state.rotateBlocked;

  if (playing) {
    state.boost = keys.has("ArrowUp") || keys.has("KeyW") || keys.has("Space") || touchBoostHeld();
    // speed
    const engineLvl = save.upgrades.engine;
    let target = state.leg.baseSpeed * (1 + engineLvl * 0.07);
    if (state.boost) target *= 1.45;
    if (state.slowT > 0) { target *= 0.4; state.slowT -= dt; }
    state.speed = lerp(state.speed, target, Math.min(1, dt * 2.2));
    state.dist += state.speed * dt;

    // steering
    const left = keys.has("ArrowLeft") || keys.has("KeyA");
    const right = keys.has("ArrowRight") || keys.has("KeyD");
    steerTarget = (right ? 1 : 0) - (left ? 1 : 0);
    const maxV = 10.5 + engineLvl * 1.2;
    if (!touchSteer) {
      const targetV = steerTarget * maxV;
      state.boatVX = lerp(state.boatVX, targetV, Math.min(1, dt * 7));
      state.boatX += state.boatVX * dt;
    } else {
      state.boatVX = 0;
    }
    if (state.leg.crosswind) state.boatX += Math.sin(state.dist * 0.02) * state.leg.crosswind * dt;
    const half = state.leg.riverWidth / 2 - 1.6;
    state.boatX = clamp(state.boatX, -half, half);

    spawnFromPlan();
    updateObstacles(dt);

    // invuln + banner timers (sim time)
    if (state.invuln > 0) state.invuln -= dt;
    if (state.bannerT > 0) { state.bannerT -= dt; if (state.bannerT <= 0) els.banner.hidden = true; }

    // wake spray
    if (Math.floor(state.time * 20) % (state.boost ? 2 : 4) === 0) {
      emitSpray(state.boatX + (Math.random() - 0.5), 0.25, 3.2, 1, 0.8, state.boost ? 2.2 : 1.2);
    }

    updateProgress();
    if (state.dist >= state.leg.distance) {
      state.mode = "docking";
      state.dockT = 1.1;
      AUDIO.setRiver(0.05);
    }
  }

  if (state.mode === "docking") {
    state.dockT -= dt;
    state.dist += state.speed * dt * 0.4;
    state.speed = lerp(state.speed, 4, dt * 2);
    if (state.dockT <= 0) finishLeg();
  }

  if (state.mode === "sinking") {
    state.sinkT -= dt;
    boat.rotation.z += dt * 0.5;
    boat.position.y -= dt * 0.7;
    if (state.sinkT <= 0) {
      state.mode = "over";
      overlay(els.over, true);
    }
  }

  // boat visuals
  if (state.mode === "playing" || state.mode === "docking") {
    boat.position.x = lerp(boat.position.x, state.boatX, Math.min(1, dt * 12));
    boat.position.y = Math.sin(state.time * 2.1) * 0.09 + (state.leg && state.leg.storm ? Math.sin(state.time * 3.7) * 0.12 : 0);
    const lean = touchSteer ? clamp((state.boatX - boat.position.x) * 0.6, -0.4, 0.4) : -state.boatVX * 0.028;
    boat.rotation.z = lerp(boat.rotation.z, lean, Math.min(1, dt * 8));
    boat.rotation.x = lerp(boat.rotation.x, state.boost ? -0.06 : 0, Math.min(1, dt * 4));
    if (state.invuln > 0) {
      boat.visible = Math.floor(state.time * 12) % 2 === 0;
    } else boat.visible = true;
  }

  // camera
  const shake = state.shake > 0 ? state.shake : 0;
  if (state.shake > 0) state.shake -= dt;
  camera.position.x = boat.position.x * 0.55 + (shake ? (Math.random() - 0.5) * shake * 1.6 : 0);
  camera.position.y = 7.4 + (shake ? (Math.random() - 0.5) * shake : 0);
  camera.fov = lerp(camera.fov, state.boost && playing ? 61 : 55, Math.min(1, dt * 3));
  camera.updateProjectionMatrix();
  camera.lookAt(boat.position.x * 0.75, 1.0, -18);

  if (!document.hidden) {
    updateWater(dt);
    updateScenery();
    updateSpray(dt);
    updateRain(dt);
    renderer.render(scene, camera);
  }
}
function touchBoostHeld() { return els.btnBoost.classList.contains("held"); }

/* ---------- debug hooks (for E2E) ---------- */
window.UpstreamDebug = {
  get state() {
    return {
      mode: state.mode, paused: state.paused, legIdx: state.legIdx,
      dist: Math.round(state.dist), distance: state.leg ? state.leg.distance : 0,
      hearts: state.hearts, coins: save.coins, runCoins: state.runCoins,
      boatX: +state.boatX.toFixed(2), speed: +state.speed.toFixed(2),
      obstacles: obstacles.length, save: JSON.parse(JSON.stringify(save)),
    };
  },
  startLeg(i) { startLeg(clamp(i | 0, 0, LEGS.length - 1)); },
  skipTo(frac) { if (state.leg) { state.dist = state.leg.distance * clamp(frac, 0, 1); clearObstacles(); planCursor = spawnPlan.findIndex((p) => p.at > state.dist); if (planCursor < 0) planCursor = spawnPlan.length; } },
  finishLeg() { if (state.mode === "playing") { state.dist = state.leg.distance; state.mode = "docking"; state.dockT = 0.01; } },
  damage() { state.invuln = 0; hitBoat({}); },
  addCoins(n) { state.runCoins += n | 0; updateHudCoins(); },
  setBoatX(x) { state.boatX = x; boat.position.x = x; },
  plan() { return spawnPlan.map((p) => ({ at: Math.round(p.at), type: p.type, x: +p.x.toFixed(1) })); },
  wipeSave() { save = defaultSave(); try { localStorage.removeItem(SAVE_KEY); } catch (e) {} },
  grantSave(s) { save = { ...defaultSave(), ...s }; writeSave(); showTitle(); },
};

/* ---------- boot ---------- */
syncMuteUi();
fitLayout();
showTitle();
requestAnimationFrame(frame);
