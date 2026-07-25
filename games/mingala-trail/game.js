/**
 * Mingala Trail — game.js
 *
 * The engine. It knows nothing about any particular city, person or letter:
 *   cities.js   world layout (areas, parallax layers, props, npc placement, ambient)
 *   story.js    all writing (dialogue trees, quests, letters, fragments)
 *   systems.js  rules (hours, kyat, flags, inventory, route book)
 *   twists.js   minigames
 *   art.js      sprites, portraits, backdrops
 *   map.js      the trail map screen
 *
 * COORDINATES
 *   Scene space is virtual: the visible band is always 562 units tall, and an area is
 *   as many units wide as it likes (2800–4200 is typical — 3 to 4 screens). `--u` is
 *   px-per-unit, written on <html> by fitLayout(), so a resize or rotation reflows the
 *   whole world without touching any state. Everything is anchored bottom-centre.
 *
 * CAMERA
 *   Horizontal only, soft-follow with lookahead, clamped to the area. Layers translate
 *   by -camera * depth, which is the whole parallax system.
 */
(() => {
  "use strict";

  // ═══════════════════════════════════════════════════════════
  // CONSTANTS
  // ═══════════════════════════════════════════════════════════
  const SCENE_H = 562;
  const TILE = 1000;             // width of one backdrop tile, in scene units

  const HERO_W = 84;
  const HERO_SPEED = 250;
  const REACH = 105;
  const FOOT_H = 16;

  const CAM_EASE = 6.5;          // higher = snappier follow
  const CAM_LOOKAHEAD = 150;

  const TYPE_SPEED = 44;         // characters per second

  const CITIES = window.TrailCities || [];
  const STORY = window.TrailStory || { dialogue: {}, quests: {}, letters: {}, people: {} };
  const TWISTS = window.TrailTwists || {};
  const ART = window.TrailArt;
  const SYS = window.TrailSystems;
  const MAP = window.TrailMap;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const $ = (s) => document.querySelector(s);
  const lerp = (a, b, t) => a + (b - a) * t;

  const VERBS = {
    npc: { my: "စကားပြော", en: "Talk" },
    door: { my: "ဝင်မယ်", en: "Enter" },
    thing: { my: "ကြည့်မယ်", en: "Look" },
    keepsake: { my: "ကောက်ယူ", en: "Take" },
    twist: { my: "စတင်", en: "Begin" },
  };

  // ═══════════════════════════════════════════════════════════
  // DOM
  // ═══════════════════════════════════════════════════════════
  const els = {
    startScreen: $("#start-screen"),
    mapScreen: $("#map-screen"),
    gameScreen: $("#game-screen"),
    journalScreen: $("#journal-screen"),

    btnStart: $("#btn-start"),
    btnContinue: $("#btn-continue"),
    btnMuteMenu: $("#btn-mute-menu"),
    saveHint: $("#save-hint"),
    logoHero: $("#logo-hero"),

    btnMapBack: $("#btn-map-back"),
    btnMapJournal: $("#btn-map-journal"),
    mapHost: $("#map-host"),
    mapTitle: $("#map-title"),

    introOverlay: $("#intro-overlay"),
    introEmoji: $("#intro-emoji"),
    introChapter: $("#intro-chapter"),
    introTitle: $("#intro-title"),
    introRegion: $("#intro-region"),
    introDesc: $("#intro-desc"),
    introTask: $("#intro-task"),
    btnIntroGo: $("#btn-intro-go"),
    btnIntroBack: $("#btn-intro-back"),

    hudPlace: $("#hud-place"),
    hudArea: $("#hud-area"),
    hudClock: $("#hud-clock"),
    hudHours: $("#hud-hours"),
    hudTime: $("#hud-time"),
    hudKyat: $("#hud-kyat"),
    objectiveText: $("#objective-text"),
    objectiveTag: $("#objective-tag"),
    satchel: $("#satchel"),
    btnJournal: $("#btn-journal"),
    btnMute: $("#btn-mute"),
    btnPause: $("#btn-pause"),

    stage: $("#stage"),
    scene: $("#scene"),
    world: $("#world"),
    tint: $("#scene-tint"),
    vignette: $("#scene-vignette"),

    dialogue: $("#dialogue"),
    dlgPortrait: $("#dlg-portrait"),
    dlgWho: $("#dlg-who"),
    dlgMm: $("#dlg-mm"),
    dlgEn: $("#dlg-en"),
    dlgChoices: $("#dlg-choices"),
    dlgNext: $("#dlg-next"),

    letterOverlay: $("#letter-overlay"),
    letterTo: $("#letter-to"),
    letterBody: $("#letter-body"),
    btnLetterClose: $("#btn-letter-close"),

    controls: $("#controls"),
    dpad: $("#dpad"),
    btnAction: $("#btn-action"),
    actionVerb: $("#action-verb"),

    twistOverlay: $("#twist-overlay"),
    twistTitle: $("#twist-title"),
    twistHint: $("#twist-hint"),
    twistStage: $("#twist-stage"),
    twistFill: $("#twist-fill"),
    btnTwistQuit: $("#btn-twist-quit"),

    pauseOverlay: $("#pause-overlay"),
    pauseHint: $("#pause-hint"),
    btnResume: $("#btn-resume"),
    btnRestart: $("#btn-restart"),
    btnMenu: $("#btn-menu"),

    endOverlay: $("#end-overlay"),
    endEmoji: $("#end-emoji"),
    endTitle: $("#end-title"),
    endMsg: $("#end-msg"),
    endFragment: $("#end-fragment"),
    btnNext: $("#btn-next"),
    btnEndMenu: $("#btn-end-menu"),

    journalBody: $("#journal-body"),
    btnJournalBack: $("#btn-journal-back"),
    journalTabs: $("#journal-tabs"),

    wipe: $("#wipe"),
    toast: $("#toast"),
  };

  // ═══════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════
  const state = {
    mode: "idle",        // idle | dialogue | twist | letter
    running: false,
    paused: false,
    city: null,
    area: null,
    areaId: null,
    hero: { x: 200, y: 480, dir: "right", moving: false },
    input: { x: 0, y: 0 },
    cam: 0,
    camTarget: 0,
    solids: [],
    actors: [],          // { def, el, kind }
    ambient: [],
    layers: [],
    target: null,
    ping: null,
    heroEl: null,
    dlg: null,           // { tree, node, typing, shown, full, onEnd }
    twist: null,
    twistCtx: null,
    twistStep: null,
    journalTab: "letters",
  };

  let layout = { u: 1, viewW: 1000 };
  let lastTs = 0;

  // ═══════════════════════════════════════════════════════════
  // AUDIO
  // ═══════════════════════════════════════════════════════════
  const A = () => window.TrailAudio;
  const ensureAudio = () => A()?.unlock();
  const sfx = new Proxy({}, {
    get: (_, k) => () => { try { A()?.sfx[k]?.(); } catch (_) {} },
  });
  function playTheme(name) {
    ensureAudio();
    A()?.setTheme(name);
    A()?.startMusic(name);
  }
  function syncMuteButtons() {
    const muted = A()?.isMuted();
    if (els.btnMuteMenu) els.btnMuteMenu.textContent = muted ? "🔇 အသံ Off" : "🔊 အသံ On";
    if (els.btnMute) els.btnMute.textContent = muted ? "🔇" : "🔊";
  }

  // ═══════════════════════════════════════════════════════════
  // LAYOUT
  // ═══════════════════════════════════════════════════════════
  function fitLayout() {
    if (!els.stage || !els.scene) return;
    const stage = els.stage.getBoundingClientRect();
    if (stage.width < 40 || stage.height < 40) return;

    // fit the CONTENT box; the border box would spill through the padding
    const cs = getComputedStyle(els.stage);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const availW = Math.max(40, stage.width - padX);
    const availH = Math.max(40, stage.height - padY);

    // The scene is a WINDOW onto a wider world: height decides the scale, width is
    // whatever the stage allows (wider viewport = you simply see more of the street).
    const u = availH / SCENE_H;
    layout.u = u;
    layout.viewW = availW / u;

    els.scene.style.width = `${availW}px`;
    els.scene.style.height = `${availH}px`;
    document.documentElement.style.setProperty("--u", `${u}px`);

    if (state.area) {
      sizeLayers();
      updateCamera(0, true);
    }
  }

  function place(node, x, y, w, h) {
    node.style.left = `calc(var(--u) * ${x})`;
    node.style.top = `calc(var(--u) * ${y})`;
    if (w != null) {
      node.style.width = `calc(var(--u) * ${w})`;
      node.style.height = `calc(var(--u) * ${h != null ? h : w})`;
    }
    node.style.zIndex = String(Math.round(clamp(y, 0, 999)));
  }

  function updateOrientationGate() {
    const overlay = document.getElementById("rotate-overlay");
    if (!overlay) return;
    const portrait = window.matchMedia("(orientation: portrait)").matches;
    const narrow = Math.min(window.innerWidth, window.innerHeight) <= 700;
    const playing =
      els.gameScreen.classList.contains("active") &&
      !els.startScreen.classList.contains("active");
    const need = portrait && narrow && playing;
    document.body.classList.toggle("need-landscape", need);
    overlay.hidden = !need;
    if (!need) requestAnimationFrame(() => fitLayout());
  }

  const onViewportChange = () => { fitLayout(); updateOrientationGate(); };

  // ═══════════════════════════════════════════════════════════
  // SCREENS + TRANSITIONS
  // ═══════════════════════════════════════════════════════════
  function showScreen(name) {
    els.startScreen.classList.toggle("active", name === "start");
    els.mapScreen.classList.toggle("active", name === "map");
    els.gameScreen.classList.toggle("active", name === "game");
    els.journalScreen.classList.toggle("active", name === "journal");
    if (name === "start") playTheme("menu");
    else if (name === "map") playTheme("map");
    updateOrientationGate();
    if (name === "game") requestAnimationFrame(fitLayout);
  }

  /** Ink wipe. `fn` runs while the screen is covered. */
  function wipe(fn) {
    els.wipe.classList.add("on");
    setTimeout(() => {
      try { fn(); } catch (e) { console.error(e); }
      requestAnimationFrame(() => els.wipe.classList.remove("on"));
    }, 260);
  }

  let toastTimer = null;
  function toast(my, en) {
    els.toast.innerHTML = `<span class="mm">${my}</span><span class="en">${en}</span>`;
    els.toast.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("on"), 2200);
  }

  // ═══════════════════════════════════════════════════════════
  // HUD
  // ═══════════════════════════════════════════════════════════
  function renderHud() {
    if (!state.city) return;
    const hours = SYS.hours();
    const t = SYS.timeLabel();
    els.hudHours.textContent = hours.toFixed(hours % 1 ? 1 : 0);
    els.hudTime.textContent = t.my;
    els.hudClock.classList.toggle("low", hours <= 3);
    els.hudKyat.textContent = SYS.formatKyat(SYS.kyat());
    els.hudPlace.textContent = state.city.name.my;
    els.hudArea.textContent = state.area?.name?.my || "";

    const quests = STORY.quests[state.city.id] || {};
    const step = SYS.activeStep(quests.main);
    if (step) {
      els.objectiveTag.textContent = "လုပ်ရန်";
      els.objectiveText.innerHTML =
        `<span class="mm">${step.objective.my}</span><span class="en">${step.objective.en}</span>`;
    } else {
      els.objectiveTag.textContent = "ပြီးပြီ";
      els.objectiveText.innerHTML =
        `<span class="mm">စာပို့ပြီးပါပြီ</span><span class="en">Letter delivered</span>`;
    }
    renderSatchel();
  }

  function renderSatchel() {
    const ids = SYS.bagIds();
    els.satchel.innerHTML = ids.length
      ? ids.slice(-5).map((id) => {
          const item = STORY.items?.[id];
          const sprite = item?.sprite || id;
          const label = item ? `${item.name.my} · ${item.name.en}` : id;
          return `<span class="sat-item" data-id="${id}" title="${label}">` +
            `${ART.sprite(ART.has(sprite) ? sprite : "letter")}</span>`;
        }).join("")
      : `<span class="sat-empty">အိတ်လွတ်</span>`;
  }

  // ═══════════════════════════════════════════════════════════
  // AREA BUILDING
  // ═══════════════════════════════════════════════════════════
  function sizeLayers() {
    const areaW = state.area.w;
    for (const L of state.layers) {
      L.el.style.width = `calc(var(--u) * ${areaW})`;
    }
    els.world.style.width = `calc(var(--u) * ${areaW})`;
  }

  function buildArea(city, areaId, entryX) {
    const area = city.areas[areaId];
    state.city = city;
    state.area = area;
    state.areaId = areaId;
    state.solids = [];
    state.actors = [];
    state.ambient = [];
    state.layers = [];
    state.target = null;
    state.ping = null;

    els.world.innerHTML = "";

    // ── palette
    const p = Object.assign({}, city.palette, area.palette || {});
    for (const [k, v] of Object.entries(p)) els.scene.style.setProperty(`--${k}`, v);
    els.scene.classList.toggle("interior", Boolean(area.interior));

    // ── parallax layers (far → near)
    // Backdrop art fills with currentColor, so each band takes a different palette
    // slot — that colour separation is what actually reads as distance.
    // progressively darker toward the viewer — the oldest depth trick there is
    const BAND = [
      "var(--far)",
      "color-mix(in srgb, var(--mid) 80%, var(--ink))",
      "color-mix(in srgb, var(--mid) 52%, var(--ink))",
    ];
    (area.layers || []).forEach((def, i) => {
      const L = document.createElement("div");
      L.className = "player-layer";
      L.dataset.backdrop = def.backdrop;
      L.style.color = def.color || BAND[Math.min(i, BAND.length - 1)];
      L.style.bottom = `calc(var(--u) * ${def.y || 0})`;
      L.style.height = `calc(var(--u) * ${def.h || 200})`;
      if (def.opacity != null) L.style.opacity = String(def.opacity);
      // repeat the backdrop tile across the whole area
      const tiles = Math.ceil(area.w / TILE) + 1;
      let inner = "";
      for (let i = 0; i < tiles; i++) {
        inner += `<div class="bd-tile" style="left:calc(var(--u) * ${i * TILE});` +
          `width:calc(var(--u) * ${TILE})">${ART.backdrop(def.backdrop)}</div>`;
      }
      L.innerHTML = inner;
      els.world.appendChild(L);
      state.layers.push({ el: L, depth: def.depth != null ? def.depth : 1 });
    });

    // ── ground plate
    const ground = document.createElement("div");
    ground.className = "ground-plate";
    ground.style.height = `calc(var(--u) * ${SCENE_H - (area.groundY || 300)})`;
    els.world.appendChild(ground);
    state.layers.push({ el: ground, depth: 1 });

    // ── ambient actors
    const ambientLayer = document.createElement("div");
    ambientLayer.className = "player-layer ambient-layer";
    els.world.appendChild(ambientLayer);
    state.layers.push({ el: ambientLayer, depth: 1 });
    for (const def of area.ambient || []) {
      const count = def.count || 2;
      for (let i = 0; i < count; i++) {
        const node = document.createElement("div");
        node.className = "ambient";
        node.innerHTML = ART.ambient(def.sprite);
        ambientLayer.appendChild(node);
        state.ambient.push({
          el: node,
          x: (def.from != null ? def.from : 0) + (i * area.w) / count,
          y: def.y,
          w: def.w,
          speed: def.speed * (def.dir || 1),
          dir: def.dir || 1,
          bob: def.bob || 0,
          t: i * 1.7,
        });
      }
    }

    // ── static props
    const propLayer = document.createElement("div");
    propLayer.className = "player-layer prop-layer";
    els.world.appendChild(propLayer);
    state.layers.push({ el: propLayer, depth: 1 });
    for (const def of area.props || []) {
      if (def.if && !SYS.test(def.if)) continue;
      const node = document.createElement("div");
      node.className = "prop" + (def.flip ? " flip" : "");
      node.dataset.sprite = def.sprite;
      node.innerHTML = ART.sprite(def.sprite);
      place(node, def.x, def.y, def.w, def.h);
      propLayer.appendChild(node);
      if (def.solid) {
        const halfW = (def.w * (def.cw || 0.55)) / 2;
        state.solids.push({ x1: def.x - halfW, x2: def.x + halfW, y1: def.y - FOOT_H, y2: def.y + 4 });
      }
    }

    // ── interactables live in one layer so depth sorting works between them
    const actorLayer = document.createElement("div");
    actorLayer.className = "player-layer actor-layer";
    actorLayer.id = "actors";
    els.world.appendChild(actorLayer);
    state.layers.push({ el: actorLayer, depth: 1 });

    const addActor = (kind, def, html, w, h) => {
      const node = document.createElement("div");
      node.className = kind;
      node.dataset.id = def.id;
      node.innerHTML = html;
      place(node, def.x, def.y, w, h);
      actorLayer.appendChild(node);
      state.actors.push({ kind, def, el: node });
      return node;
    };

    for (const def of area.doors || []) {
      if (def.if && !SYS.test(def.if)) continue;
      addActor("door", def, ART.sprite("doorway"), def.w || 110);
    }

    for (const def of area.npcs || []) {
      if (def.if && !SYS.test(def.if)) continue;
      addActor("npc", def, ART.npc(def.sprite), def.w || 104);
      const halfW = ((def.w || 104) * 0.34) / 2;
      state.solids.push({ x1: def.x - halfW, x2: def.x + halfW, y1: def.y - FOOT_H, y2: def.y + 4 });
    }

    for (const def of area.things || []) {
      if (def.if && !SYS.test(def.if)) continue;
      if (def.once && SYS.flag(`used_${def.id}`)) continue;
      addActor("thing", def, ART.sprite(def.sprite), def.w || 70);
    }

    // ── the hidden keepsake
    const ks = city.keepsake;
    if (ks && ks.area === areaId && !SYS.recorded("keepsakes", ks.id)) {
      addActor("keepsake", { id: ks.id, x: ks.x, y: ks.y }, ART.sprite(ks.sprite), ks.w || 56);
    }

    // ── hero
    const hero = document.createElement("div");
    hero.className = "hero";
    hero.id = "hero";
    hero.innerHTML = ART.hero(state.hero.dir);
    actorLayer.appendChild(hero);
    state.heroEl = hero;

    // ── fx layer for the ping
    const fx = document.createElement("div");
    fx.className = "player-layer fx-layer";
    fx.id = "fx";
    els.world.appendChild(fx);
    state.layers.push({ el: fx, depth: 1 });
    state.fxLayer = fx;

    state.hero.x = clamp(entryX, 60, area.w - 60);
    state.hero.y = (area.walk.top + area.walk.bottom) / 2;
    state.cam = state.camTarget = clamp(state.hero.x - layout.viewW / 2, 0, Math.max(0, area.w - layout.viewW));

    sizeLayers();
    place(state.heroEl, state.hero.x, state.hero.y, HERO_W);
    updateCamera(0, true);
    updateTint();
    renderHud();
    state.worldSig = worldSignature();
  }

  // dawn warm → midday clear → late gold → dusk amber → night blue
  const TINT_STOPS = [
    [0.00, [255, 206, 150, 0.46]],
    [0.30, [255, 248, 228, 0.10]],
    [0.58, [255, 226, 160, 0.24]],
    [0.80, [246, 150, 74, 0.44]],
    [1.00, [34, 52, 92, 0.72]],
  ];

  function updateTint() {
    const f = clamp(SYS.dayFraction(), 0, 1);
    let a = TINT_STOPS[0], b = TINT_STOPS[TINT_STOPS.length - 1];
    for (let i = 0; i < TINT_STOPS.length - 1; i++) {
      if (f >= TINT_STOPS[i][0] && f <= TINT_STOPS[i + 1][0]) {
        a = TINT_STOPS[i]; b = TINT_STOPS[i + 1];
        break;
      }
    }
    const span = b[0] - a[0] || 1;
    const t = clamp((f - a[0]) / span, 0, 1);
    const c = a[1].map((v, i) => lerp(v, b[1][i], t));
    els.tint.style.background =
      `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${c[3].toFixed(3)})`;
    els.scene.style.setProperty("--night", String(clamp((f - 0.6) / 0.4, 0, 1)));
  }

  // ═══════════════════════════════════════════════════════════
  // CAMERA
  // ═══════════════════════════════════════════════════════════
  function updateCamera(dt, snap) {
    const area = state.area;
    if (!area) return;
    const maxCam = Math.max(0, area.w - layout.viewW);
    const look = state.hero.dir === "left" ? -CAM_LOOKAHEAD : CAM_LOOKAHEAD;
    state.camTarget = clamp(state.hero.x + look * 0.5 - layout.viewW / 2, 0, maxCam);
    state.cam = snap ? state.camTarget : lerp(state.cam, state.camTarget, clamp(dt * CAM_EASE, 0, 1));

    for (const L of state.layers) {
      L.el.style.transform = `translate3d(calc(var(--u) * ${-state.cam * L.depth}), 0, 0)`;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // MOVEMENT
  // ═══════════════════════════════════════════════════════════
  function blocked(x, y) {
    const halfW = HERO_W * 0.22;
    const x1 = x - halfW, x2 = x + halfW;
    const y1 = y - FOOT_H * 0.7, y2 = y + 6;
    for (const s of state.solids) {
      if (x2 > s.x1 && x1 < s.x2 && y2 > s.y1 && y1 < s.y2) return true;
    }
    return false;
  }

  function updateHero(dt) {
    const h = state.hero;
    let vx = state.input.x, vy = state.input.y;
    const len = Math.hypot(vx, vy);
    if (len > 1) { vx /= len; vy /= len; }
    const moving = len > 0.01;
    const band = state.area.walk;

    if (moving) {
      const nx = clamp(h.x + vx * HERO_SPEED * dt, 50, state.area.w - 50);
      if (!blocked(nx, h.y)) h.x = nx;
      const ny = clamp(h.y + vy * HERO_SPEED * 0.62 * dt, band.top, band.bottom);
      if (!blocked(h.x, ny)) h.y = ny;

      let dir = h.dir;
      if (Math.abs(vx) >= Math.abs(vy)) dir = vx > 0 ? "right" : "left";
      else dir = vy > 0 ? "down" : "up";
      if (dir !== h.dir) { h.dir = dir; state.heroEl.innerHTML = ART.hero(dir); }

      state.stepT = (state.stepT || 0) + dt;
      if (state.stepT > 0.34) { state.stepT = 0; sfx.step(); }
    }
    if (moving !== h.moving) {
      h.moving = moving;
      state.heroEl.classList.toggle("walking", moving);
    }
    place(state.heroEl, h.x, h.y, HERO_W);
  }

  function updateAmbient(dt) {
    const w = state.area.w;
    for (const a of state.ambient) {
      a.t += dt;
      a.x += a.speed * dt;
      if (a.speed > 0 && a.x > w + 200) a.x = -200;
      if (a.speed < 0 && a.x < -200) a.x = w + 200;
      const y = a.y + (a.bob ? Math.sin(a.t * 1.6) * a.bob : 0);
      place(a.el, a.x, y, a.w);
      a.el.style.zIndex = "1";
      a.el.style.transform = `translate(-50%, -100%) scaleX(${a.dir < 0 ? -1 : 1})`;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // INTERACTION
  // ═══════════════════════════════════════════════════════════
  function findTarget() {
    let best = null, bestD = Infinity;
    for (const a of state.actors) {
      const d = Math.hypot(state.hero.x - a.def.x, (state.hero.y - a.def.y) * 0.7);
      if (d < bestD) { bestD = d; best = a; }
    }
    if (!best || bestD > REACH) return null;
    return { actor: best, dist: bestD, inRange: true };
  }

  function verbFor(actor) {
    if (actor.kind === "npc") return VERBS.npc;
    if (actor.kind === "door") return VERBS.door;
    if (actor.kind === "keepsake") return VERBS.keepsake;
    const def = actor.def;
    if (def.verb) return def.verb;
    if (def.action?.twist) return VERBS.twist;
    return VERBS.thing;
  }

  function updateTargetUi() {
    const t = findTarget();
    state.target = t;
    const ready = Boolean(t) && state.mode === "idle";
    els.btnAction.disabled = !ready;
    els.btnAction.classList.toggle("ready", ready);
    if (t) els.actionVerb.textContent = verbFor(t.actor).my;

    // floating marker over the nearest interactable
    if (!t) {
      if (state.ping) { state.ping.remove(); state.ping = null; }
      return;
    }
    if (!state.ping) {
      state.ping = document.createElement("div");
      state.ping.className = "ping";
      state.fxLayer.appendChild(state.ping);
    }
    const mark = t.actor.kind === "npc" ? "talk" : t.actor.kind === "door" ? "door" : "ping";
    if (state.ping.dataset.mark !== mark) {
      state.ping.dataset.mark = mark;
      state.ping.innerHTML = ART.mark(mark);
    }
    const w = t.actor.def.w || (t.actor.kind === "npc" ? 104 : 70);
    place(state.ping, t.actor.def.x, t.actor.def.y - w * 0.95, 44);
    state.ping.style.zIndex = "950";
  }

  function doAction() {
    if (state.mode !== "idle" || !state.target) return;
    const { actor } = state.target;
    const def = actor.def;

    if (actor.kind === "npc") {
      sfx.talk();
      startDialogue(def.dialogue, def.id);
      return;
    }
    if (actor.kind === "door") {
      sfx.door();
      wipe(() => buildArea(state.city, def.to, def.entry != null ? def.entry : 200));
      return;
    }
    if (actor.kind === "keepsake") {
      const ks = state.city.keepsake;
      sfx.pick();
      SYS.record("keepsakes", ks.id);
      actor.el.remove();
      state.actors = state.actors.filter((a) => a !== actor);
      toast(`မှတ်တမ်း — ${ks.name.my}`, `Keepsake — ${ks.name.en}`);
      renderHud();
      return;
    }
    // generic thing
    const act = def.action || {};
    if (act.effect && !SYS.apply(act.effect)) {
      sfx.bad();
      toast("ပိုက်ဆံ မလောက်ဘူး", "Not enough kyat");
      return;
    }
    if (def.once) SYS.setFlag(`used_${def.id}`, true);
    if (act.twist) { openTwist(act.twist, def); return; }
    if (act.dialogue) { startDialogue(act.dialogue, act.who); return; }
    if (act.letter) { openLetter(act.letter); return; }
    sfx.pick();
    if (def.once) { actor.el.remove(); state.actors = state.actors.filter((a) => a !== actor); }
    if (act.toast) toast(act.toast.my, act.toast.en);
    refreshWorld();
  }

  /**
   * Which conditional world objects *should* exist right now. Rebuilding the area on
   * every interaction flickers and resets the camera, so we only do it when this
   * signature actually changes.
   */
  function worldSignature() {
    const area = state.area;
    if (!area) return "";
    const parts = [];
    for (const d of area.props || []) if (!d.if || SYS.test(d.if)) parts.push(`p${d.sprite}${d.x}`);
    for (const d of area.doors || []) if (!d.if || SYS.test(d.if)) parts.push(`d${d.id}`);
    for (const d of area.npcs || []) if (!d.if || SYS.test(d.if)) parts.push(`n${d.id}`);
    for (const d of area.things || []) {
      if (d.if && !SYS.test(d.if)) continue;
      if (d.once && SYS.flag(`used_${d.id}`)) continue;
      parts.push(`t${d.id}`);
    }
    const ks = state.city.keepsake;
    if (ks && ks.area === state.areaId && !SYS.recorded("keepsakes", ks.id)) parts.push("k");
    return parts.join("|");
  }

  /** Re-evaluate conditional world objects after flags change. */
  function refreshWorld() {
    renderHud();
    updateTint();
    checkChapterComplete();
    if (!state.city || !state.areaId) return;
    const sig = worldSignature();
    if (sig === state.worldSig) return;
    const { x, y } = state.hero;
    buildArea(state.city, state.areaId, x);
    state.hero.y = y;
    place(state.heroEl, x, y, HERO_W);
  }

  // ═══════════════════════════════════════════════════════════
  // DIALOGUE RUNNER
  // ═══════════════════════════════════════════════════════════
  function speakerOf(node, fallback) {
    const id = node.who || fallback;
    const person = STORY.people[id];
    return {
      id,
      name: person ? person.name : { my: "", en: "" },
      portrait: person ? person.portrait : null,
    };
  }

  function startDialogue(treeId, fallbackWho, onEnd) {
    const tree = STORY.dialogue[treeId];
    if (!tree) { console.warn("missing dialogue", treeId); return; }
    state.mode = "dialogue";
    state.dlg = { tree, treeId, who: fallbackWho, onEnd: onEnd || null };
    els.dialogue.classList.remove("hidden");
    els.btnAction.disabled = true;
    // pick the first entry whose condition passes
    const entries = [].concat(tree.start);
    let startNode = null;
    for (const e of entries) {
      if (typeof e === "string") { startNode = e; break; }
      if (SYS.test(e.if)) { startNode = e.to; break; }
    }
    showNode(startNode || "greet");
  }

  function showNode(id) {
    const d = state.dlg;
    if (!d) return;
    const node = d.tree.nodes[id];
    if (!node || id === "end") { endDialogue(); return; }
    d.node = node;
    d.nodeId = id;

    if (node.effect) SYS.apply(node.effect);
    if (node.letter) { d.pendingLetter = node.letter; }

    const sp = speakerOf(node, d.who);
    els.dlgWho.textContent = sp.name.my ? `${sp.name.my} · ${sp.name.en}` : "";
    els.dlgWho.classList.toggle("narration", !sp.name.my);
    els.dlgPortrait.innerHTML = sp.portrait ? ART.portrait(sp.portrait) : "";
    els.dlgPortrait.classList.toggle("empty", !sp.portrait);

    d.full = node.text.my;
    d.shown = 0;
    d.typing = true;
    els.dlgMm.textContent = "";
    els.dlgEn.textContent = node.text.en;
    els.dlgEn.style.visibility = "hidden";
    els.dlgChoices.innerHTML = "";
    els.dlgChoices.classList.add("hidden");
    els.dlgNext.classList.add("hidden");
    renderHud();
  }

  function finishTyping() {
    const d = state.dlg;
    if (!d) return;
    d.typing = false;
    d.shown = d.full.length;
    els.dlgMm.textContent = d.full;
    els.dlgEn.style.visibility = "visible";

    const node = d.node;
    const choices = (node.choices || []).filter((c) => SYS.test(c.if));
    if (choices.length) {
      els.dlgChoices.innerHTML = "";
      choices.forEach((c, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "dlg-choice";
        b.dataset.index = String(i);
        const cost = c.effect && c.effect.kyat != null && c.effect.kyat < 0 ? -c.effect.kyat : 0;
        const hours = c.effect && c.effect.hours ? c.effect.hours : 0;
        const afford = !cost || SYS.canAfford(cost);
        b.disabled = !afford;
        b.innerHTML =
          `<span class="ch-mm">${c.text.my}</span>` +
          `<span class="ch-en">${c.text.en}</span>` +
          (cost || hours
            ? `<span class="ch-cost">${cost ? `${SYS.formatKyat(cost)} ကျပ်` : ""}` +
              `${cost && hours ? " · " : ""}${hours ? `${hours}နာရီ` : ""}</span>`
            : "");
        b.addEventListener("click", () => pickChoice(c));
        els.dlgChoices.appendChild(b);
      });
      els.dlgChoices.classList.remove("hidden");
    } else {
      els.dlgNext.classList.remove("hidden");
    }
  }

  function pickChoice(choice) {
    if (choice.effect && !SYS.apply(choice.effect)) {
      sfx.bad();
      return;
    }
    sfx.click();
    if (choice.letter) { state.dlg.pendingLetter = choice.letter; }
    showNode(choice.to || "end");
  }

  function advanceDialogue() {
    const d = state.dlg;
    if (!d) return;
    if (d.typing) { finishTyping(); return; }
    if (d.node.choices && d.node.choices.some((c) => SYS.test(c.if))) return; // must choose
    showNode(d.node.to || "end");
  }

  function endDialogue() {
    const d = state.dlg;
    els.dialogue.classList.add("hidden");
    state.mode = "idle";
    state.dlg = null;
    if (d && d.pendingLetter) { openLetter(d.pendingLetter); return; }
    if (d && d.onEnd) d.onEnd();
    refreshWorld();
  }

  function typeTick(dt) {
    const d = state.dlg;
    if (!d || !d.typing) return;
    d.shown += TYPE_SPEED * dt;
    if (d.shown >= d.full.length) { finishTyping(); return; }
    els.dlgMm.textContent = d.full.slice(0, Math.floor(d.shown));
  }

  // ═══════════════════════════════════════════════════════════
  // LETTERS
  // ═══════════════════════════════════════════════════════════
  function openLetter(letterId) {
    const letter = STORY.letters[letterId];
    if (!letter) { refreshWorld(); return; }
    state.mode = "letter";
    els.letterTo.innerHTML =
      `<span class="mm">${letter.to.my}</span><span class="en">${letter.to.en}</span>`;
    els.letterBody.innerHTML = letter.body
      .map((p) => `<p><span class="mm">${p.my}</span><span class="en">${p.en}</span></p>`)
      .join("");
    els.letterOverlay.classList.remove("hidden");
    SYS.record("letters", letterId);
    if (letter.fragment) SYS.record("fragments", letterId);
    sfx.letter();
  }

  function closeLetter() {
    els.letterOverlay.classList.add("hidden");
    state.mode = "idle";
    sfx.click();
    refreshWorld();
  }

  // ═══════════════════════════════════════════════════════════
  // TWIST HOST
  // ═══════════════════════════════════════════════════════════
  function openTwist(twistId, thingDef) {
    const twist = TWISTS[twistId];
    if (!twist) return;
    state.mode = "twist";
    state.twist = twist;
    state.twistStep = thingDef || {};
    els.twistTitle.textContent = `${twist.title.my} · ${twist.title.en}`;
    els.twistHint.textContent = `${twist.hint.my} · ${twist.hint.en}`;
    els.twistFill.style.width = "0%";
    els.twistStage.innerHTML = "";
    els.twistOverlay.classList.remove("hidden");

    const ctx = {
      stage: els.twistStage,
      city: state.city,
      sfx: { good: sfx.good, bad: sfx.bad, win: sfx.win, step: sfx.step },
      meter: (f) => { els.twistFill.style.width = `${clamp(f, 0, 1) * 100}%`; },
      say: (my, en) => { els.twistHint.textContent = `${my} · ${en}`; },
      done: (ok) => finishTwist(ok),
    };
    state.twistCtx = ctx;
    twist.start(ctx);
  }

  function closeTwistUi() {
    state.twist?.cleanup?.();
    els.twistOverlay.classList.add("hidden");
    els.twistStage.innerHTML = "";
    state.twist = null;
    state.twistCtx = null;
    state.mode = "idle";
  }

  function finishTwist(ok) {
    const def = state.twistStep || {};
    closeTwistUi();
    // an attempt costs an hour either way — that's the pressure
    const cost = def.hours != null ? def.hours : 1;
    const res = SYS.spendHours(cost);
    if (res.slept) {
      toast("မိုးချုပ်သွားပြီ — တစ်ညအိပ်လိုက်တယ်", "Night fell — you slept over");
    }
    updateTint();
    if (!ok) {
      toast("ထပ်ကြိုးစားကြည့်ပါ", "Try again");
      renderHud();
      return;
    }
    sfx.good();
    if (def.action?.effect) SYS.apply(def.action.effect);
    if (def.action?.dialogue) { startDialogue(def.action.dialogue, def.action.who); return; }
    refreshWorld();
  }

  function quitTwist() { closeTwistUi(); sfx.click(); }

  // ═══════════════════════════════════════════════════════════
  // CHAPTER FLOW
  // ═══════════════════════════════════════════════════════════
  function openIntro(idx) {
    const city = CITIES[idx];
    state.pendingCity = idx;
    els.introEmoji.textContent = city.emoji;
    els.introChapter.textContent = `အခန်း ${city.num} · Chapter ${city.num}`;
    els.introTitle.textContent = `${city.name.my} · ${city.name.en}`;
    els.introRegion.textContent = `${city.region.my} · ${city.region.en}`;
    els.introDesc.innerHTML =
      `<span class="mm">${city.intro.my}</span><span class="en">${city.intro.en}</span>`;
    const quests = STORY.quests[city.id] || {};
    const step = quests.main?.steps?.[0];
    els.introTask.innerHTML = step
      ? `<span class="task-label">စာလက်ခံသူ · Recipient</span>` +
        `<span class="task-body">${step.objective.my} · ${step.objective.en}</span>`
      : "";
    els.introOverlay.classList.remove("hidden");
  }

  function startChapter(idx) {
    const city = CITIES[idx];
    SYS.beginChapter(idx);
    SYS.clearFlagsWithPrefix(`${city.id}_`);
    state.paused = false;
    state.mode = "idle";
    state.input.x = state.input.y = 0;
    state.hero.dir = "right";

    buildArea(city, city.start.area, city.start.x);
    showScreen("game");
    playTheme(city.theme || "town");
    state.running = true;
    lastTs = 0;
    requestAnimationFrame(loop);

    if (city.arrive) {
      setTimeout(() => {
        if (state.mode === "idle") startDialogue(city.arrive, null);
      }, 420);
    }
  }

  function checkChapterComplete() {
    if (!state.city) return;
    const quests = STORY.quests[state.city.id] || {};
    if (!quests.main || !SYS.questDone(quests.main)) return;
    if (SYS.flag(`done_${state.city.id}`)) return;
    SYS.setFlag(`done_${state.city.id}`, true);
    setTimeout(finishChapter, 500);
  }

  function finishChapter() {
    state.running = false;
    const city = state.city;
    SYS.clearChapter(city.id, city.num - 1, CITIES.length);
    const last = city.num >= CITIES.length;
    const letter = STORY.letters[city.id];

    els.endEmoji.textContent = last ? "🏆" : "✉";
    els.endTitle.textContent = last ? "ခရီးဆုံးပါပြီ" : "စာပို့ပြီးပါပြီ";
    els.endMsg.innerHTML =
      `<span class="mm">${city.name.my} — အခန်း ${city.num} ပြီးပါပြီ။</span>` +
      `<span class="en">${city.name.en} — chapter ${city.num} complete.</span>`;
    els.endFragment.innerHTML = letter?.fragment
      ? `<span class="frag-label">မှတ်တမ်း · Route book</span>` +
        `<span class="mm">${letter.fragment.my}</span>` +
        `<span class="en">${letter.fragment.en}</span>`
      : "";
    els.btnNext.hidden = last;
    els.endOverlay.classList.remove("hidden");
    sfx.chapter();
  }

  // ═══════════════════════════════════════════════════════════
  // JOURNAL
  // ═══════════════════════════════════════════════════════════
  const TABS = [
    { id: "letters", my: "စာများ", en: "Letters" },
    { id: "people", my: "လူများ", en: "People" },
    { id: "keepsakes", my: "အမှတ်တရ", en: "Keepsakes" },
    { id: "fragments", my: "အဖိုးအကြောင်း", en: "Grandfather" },
  ];

  function openJournal() {
    renderJournal();
    showScreen("journal");
    sfx.click();
  }

  function renderJournal() {
    els.journalTabs.innerHTML = TABS.map(
      (t) => `<button type="button" class="jtab${t.id === state.journalTab ? " on" : ""}" ` +
        `data-tab="${t.id}"><strong>${t.my}</strong><small>${t.en}</small></button>`
    ).join("");
    els.journalTabs.querySelectorAll(".jtab").forEach((b) =>
      b.addEventListener("click", () => { state.journalTab = b.dataset.tab; renderJournal(); sfx.click(); })
    );

    const j = SYS.journal();
    const tab = state.journalTab;
    let html = "";

    if (tab === "letters") {
      html = CITIES.map((c) => {
        const L = STORY.letters[c.id];
        const got = j.letters.includes(c.id);
        if (!L) return "";
        return `<article class="jentry${got ? "" : " locked"}">
          <header><span class="jnum">${c.num}</span>
            <div><strong>${got ? L.to.my : "မသိရသေး"}</strong>
            <small>${got ? L.to.en : "undelivered"} · ${c.name.en}</small></div></header>
          ${got ? `<div class="jbody">${L.body.map((p) =>
            `<p><span class="mm">${p.my}</span><span class="en">${p.en}</span></p>`).join("")}</div>` : ""}
        </article>`;
      }).join("");
    } else if (tab === "people") {
      const met = j.people;
      html = met.length
        ? met.map((id) => {
            const p = STORY.people[id];
            if (!p) return "";
            return `<article class="jentry person">
              <div class="jportrait">${ART.portrait(p.portrait)}</div>
              <div><strong>${p.name.my}</strong><small>${p.name.en}</small>
              <p><span class="mm">${p.note?.my || ""}</span><span class="en">${p.note?.en || ""}</span></p></div>
            </article>`;
          }).join("")
        : emptyNote("တွေ့ဆုံသူ မရှိသေးပါ", "No one recorded yet");
    } else if (tab === "keepsakes") {
      html = CITIES.map((c) => {
        const ks = c.keepsake;
        if (!ks) return "";
        const got = j.keepsakes.includes(ks.id);
        return `<article class="jentry keepsake${got ? "" : " locked"}">
          <div class="jsprite">${got ? ART.sprite(ks.sprite) : ART.mark("ping")}</div>
          <div><strong>${got ? ks.name.my : "???"}</strong>
          <small>${got ? ks.name.en : `hidden in ${c.name.en}`}</small></div>
        </article>`;
      }).join("");
    } else {
      const frags = j.fragments;
      html = frags.length
        ? frags.map((id) => {
            const L = STORY.letters[id];
            const c = CITIES.find((x) => x.id === id);
            if (!L?.fragment) return "";
            return `<article class="jentry frag">
              <header><strong>${c ? c.name.my : ""}</strong><small>${c ? c.name.en : ""}</small></header>
              <p><span class="mm">${L.fragment.my}</span><span class="en">${L.fragment.en}</span></p>
            </article>`;
          }).join("")
        : emptyNote("အဖိုးအကြောင်း မသိရသေးပါ", "You don't know him yet");
    }
    els.journalBody.innerHTML = html || emptyNote("ဘာမှ မရှိသေးပါ", "Nothing here yet");
  }

  const emptyNote = (my, en) =>
    `<p class="jempty"><span class="mm">${my}</span><span class="en">${en}</span></p>`;

  // ═══════════════════════════════════════════════════════════
  // LOOP
  // ═══════════════════════════════════════════════════════════
  function loop(ts) {
    if (!state.running || state.paused) return;
    if (!lastTs) lastTs = ts;
    const dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;

    if (state.mode === "twist") {
      state.twist?.update?.(dt);
    } else {
      if (state.mode === "idle") {
        updateHero(dt);
        updateTargetUi();
      }
      if (state.mode === "dialogue") typeTick(dt);
      updateAmbient(dt);
      updateCamera(dt);
    }
    requestAnimationFrame(loop);
  }

  function pauseGame() {
    if (!state.running || state.paused) return;
    state.paused = true;
    els.pauseHint.innerHTML = state.city
      ? `<span class="mm">${state.city.name.my} · အခန်း ${state.city.num}</span>` +
        `<span class="en">${state.city.name.en} · Chapter ${state.city.num}</span>`
      : "";
    els.pauseOverlay.classList.remove("hidden");
    sfx.click();
  }
  function resumeGame() {
    if (!state.paused) return;
    state.paused = false;
    els.pauseOverlay.classList.add("hidden");
    lastTs = 0;
    sfx.click();
    requestAnimationFrame(loop);
  }

  // ═══════════════════════════════════════════════════════════
  // INPUT
  // ═══════════════════════════════════════════════════════════
  const keys = new Set();
  const KEY_DIRS = {
    ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1],
    ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0],
  };

  function setInput(x, y) {
    state.input.x = x;
    state.input.y = y;
    if (state.mode === "twist") state.twist?.move?.(x, y);
  }
  function recomputeKeys() {
    let x = 0, y = 0;
    for (const c of keys) { const d = KEY_DIRS[c]; if (d) { x += d[0]; y += d[1]; } }
    setInput(clamp(x, -1, 1), clamp(y, -1, 1));
  }

  document.addEventListener("keydown", (e) => {
    if (e.repeat) return;
    if (KEY_DIRS[e.code]) { keys.add(e.code); recomputeKeys(); e.preventDefault(); return; }
    if (e.code === "Space" || e.code === "Enter" || e.code === "KeyE") { e.preventDefault(); pressAction(); return; }
    if (e.code === "KeyJ" && state.mode === "idle" && state.running) { openJournal(); return; }
    if (/^Digit[1-4]$/.test(e.code) && state.mode === "dialogue") {
      const i = Number(e.code.slice(5)) - 1;
      const b = els.dlgChoices.querySelectorAll(".dlg-choice")[i];
      if (b && !b.disabled) b.click();
      return;
    }
    if (e.code === "Escape") {
      if (els.journalScreen.classList.contains("active")) { showScreen("game"); return; }
      if (state.mode === "letter") { closeLetter(); return; }
      if (state.twist) quitTwist();
      else if (state.paused) resumeGame();
      else pauseGame();
    }
  });
  document.addEventListener("keyup", (e) => {
    if (KEY_DIRS[e.code]) { keys.delete(e.code); recomputeKeys(); return; }
    if (e.code === "Space" || e.code === "Enter" || e.code === "KeyE") releaseAction();
  });

  function pressAction() {
    if (state.mode === "letter") { closeLetter(); return; }
    if (state.mode === "dialogue") { advanceDialogue(); return; }
    if (state.mode === "twist") { state.twist?.press?.(); return; }
    doAction();
  }
  const releaseAction = () => { if (state.mode === "twist") state.twist?.release?.(); };

  const dpadHeld = new Map();
  function recomputeDpad() {
    let x = 0, y = 0;
    for (const v of dpadHeld.values()) { x += v[0]; y += v[1]; }
    setInput(clamp(x, -1, 1), clamp(y, -1, 1));
  }
  els.dpad.querySelectorAll(".dpad-btn").forEach((btn) => {
    const dir = btn.dataset.dir;
    const vec = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    const on = (e) => { e.preventDefault(); btn.classList.add("held"); dpadHeld.set(dir, vec); recomputeDpad(); };
    const off = (e) => { e.preventDefault(); btn.classList.remove("held"); dpadHeld.delete(dir); recomputeDpad(); };
    btn.addEventListener("pointerdown", on);
    btn.addEventListener("pointerup", off);
    btn.addEventListener("pointercancel", off);
    btn.addEventListener("pointerleave", off);
  });

  els.btnAction.addEventListener("pointerdown", (e) => { e.preventDefault(); pressAction(); });
  els.btnAction.addEventListener("pointerup", (e) => { e.preventDefault(); releaseAction(); });
  els.dialogue.addEventListener("click", (e) => {
    if (e.target.closest(".dlg-choice")) return;
    advanceDialogue();
  });
  els.twistStage.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    state.twist?.press?.();
  });
  els.twistStage.addEventListener("pointerup", () => state.twist?.release?.());

  // ═══════════════════════════════════════════════════════════
  // WIRING
  // ═══════════════════════════════════════════════════════════
  function refreshMenu() {
    const j = SYS.journal();
    const done = j.letters.length;
    els.saveHint.innerHTML = done
      ? `<span class="mm">စာ ${done}/${CITIES.length} စောင် ပို့ပြီးပြီ</span>` +
        `<span class="en">${done} of ${CITIES.length} letters delivered</span>`
      : `<span class="mm">အဖိုးရဲ့ လမ်းကြောင်း — ရန်ကုန်ကနေ စပါ</span>` +
        `<span class="en">Your grandfather's route begins in Yangon</span>`;
    els.btnContinue.hidden = done === 0 && SYS.state().unlocked <= 1;
  }

  function goMap() {
    MAP.render(els.mapHost, {
      cities: CITIES,
      onPick: (idx) => openIntro(idx),
    });
    showScreen("map");
  }

  els.btnStart.addEventListener("click", () => {
    sfx.click();
    SYS.reset();
    refreshMenu();
    goMap();
  });
  els.btnContinue.addEventListener("click", () => { sfx.click(); goMap(); });
  els.btnMapBack.addEventListener("click", () => { sfx.click(); showScreen("start"); });
  els.btnMapJournal.addEventListener("click", openJournal);
  els.btnJournal.addEventListener("click", openJournal);
  els.btnJournalBack.addEventListener("click", () => {
    sfx.click();
    showScreen(state.running ? "game" : "map");
  });
  els.btnMuteMenu.addEventListener("click", () => { ensureAudio(); A()?.toggleMute(); syncMuteButtons(); });
  els.btnMute.addEventListener("click", () => { ensureAudio(); A()?.toggleMute(); syncMuteButtons(); });
  els.btnPause.addEventListener("click", pauseGame);
  els.btnResume.addEventListener("click", resumeGame);
  els.btnRestart.addEventListener("click", () => {
    els.pauseOverlay.classList.add("hidden");
    state.paused = false;
    wipe(() => startChapter(SYS.state().chapter));
  });
  els.btnMenu.addEventListener("click", () => {
    els.pauseOverlay.classList.add("hidden");
    state.paused = false;
    state.running = false;
    wipe(goMap);
  });
  els.btnIntroGo.addEventListener("click", () => {
    sfx.click();
    els.introOverlay.classList.add("hidden");
    wipe(() => startChapter(state.pendingCity));
  });
  els.btnIntroBack.addEventListener("click", () => {
    sfx.click();
    els.introOverlay.classList.add("hidden");
  });
  els.btnLetterClose.addEventListener("click", closeLetter);
  els.btnTwistQuit.addEventListener("click", quitTwist);
  els.btnNext.addEventListener("click", () => {
    els.endOverlay.classList.add("hidden");
    const next = Math.min(SYS.state().chapter + 1, CITIES.length - 1);
    wipe(() => { goMap(); openIntro(next); });
  });
  els.btnEndMenu.addEventListener("click", () => {
    els.endOverlay.classList.add("hidden");
    wipe(goMap);
  });

  window.addEventListener("resize", onViewportChange);
  window.addEventListener("orientationchange", () => {
    setTimeout(onViewportChange, 120);
    setTimeout(onViewportChange, 350);
  });
  if (screen.orientation) {
    screen.orientation.addEventListener("change", () => setTimeout(onViewportChange, 80));
  }
  document.addEventListener("gesturestart", (e) => e.preventDefault());

  const bootAudio = () => {
    ensureAudio();
    if (els.startScreen.classList.contains("active")) playTheme("menu");
    syncMuteButtons();
    document.removeEventListener("pointerdown", bootAudio);
  };
  document.addEventListener("pointerdown", bootAudio, { once: true });

  SYS.subscribe(() => { if (state.city) renderHud(); });

  // ═══════════════════════════════════════════════════════════
  // DEV / TEST SURFACE — see README
  // ═══════════════════════════════════════════════════════════
  window.TrailDebug = {
    state: () => state,
    sys: () => SYS,
    save: () => SYS.state(),
    goCity: (i) => startChapter(clamp(i, 0, CITIES.length - 1)),
    goArea: (id, x) => buildArea(state.city, id, x != null ? x : 200),
    warpTo: (x, y) => {
      state.hero.x = x;
      if (y != null) state.hero.y = y;
      place(state.heroEl, state.hero.x, state.hero.y, HERO_W);
      updateCamera(0, true);
    },
    unlockAll: () => { SYS.state().unlocked = CITIES.length; SYS.save(); },
    reset: () => { SYS.reset(); refreshMenu(); },
    completeTwist: () => finishTwist(true),
    say: (id, who) => startDialogue(id, who),
    letter: (id) => openLetter(id),
    dialogue: () => state.dlg,
    choose: (i) => {
      const b = els.dlgChoices.querySelectorAll(".dlg-choice")[i];
      if (b && !b.disabled) b.click();
      return Boolean(b);
    },
    skipTyping: finishTyping,
    finishChapter: () => { SYS.setFlag(`done_${state.city.id}`, true); finishChapter(); },
    targets: () => state.actors.map((a) => ({ kind: a.kind, id: a.def.id, x: a.def.x, y: a.def.y })),
  };

  // ═══════════════════════════════════════════════════════════
  // BOOT
  // ═══════════════════════════════════════════════════════════
  SYS.load();
  if (els.logoHero) els.logoHero.innerHTML = ART.hero("down");
  refreshMenu();
  renderSatchel();
  syncMuteButtons();
  fitLayout();
  updateOrientationGate();
})();
