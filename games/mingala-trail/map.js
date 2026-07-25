/**
 * Mingala Trail — map.js
 *
 * The trail map. A hand-drawn Myanmar silhouette (original, drawn by eye — a
 * stylised outline, not survey data), the grandfather's route inked across it, and a
 * transport choice for each leg.
 *
 * Coordinates: city `map` values are in this SVG's own space, 0..100 across and
 * 0..170 down, so they sit on the actual landmass rather than on a bounding box.
 *
 * The transport choice is the map's reason to exist: a cheap bus gets you there with
 * the day half gone, a flight costs real money but you arrive at dawn with a full
 * twelve hours. That's the hours-vs-kyat trade the whole game runs on.
 *
 * Exposes: window.TrailMap
 */
window.TrailMap = (() => {
  "use strict";

  const SYS = window.TrailSystems;
  const ART = window.TrailArt;

  const VB_W = 100;
  const VB_H = 170;

  /** Stylised national outline: broad north, Rakhine coast, delta, Tanintharyi tail. */
  const COUNTRY =
    "M58 4 L66 10 L70 20 L74 30 L69 38 L76 46 L72 56 L79 64 L83 76 L78 86 " +
    "L73 93 L79 106 L84 122 L88 140 L92 158 L90 166 L85 164 L83 148 L79 130 " +
    "L74 114 L69 100 L60 103 L52 105 L44 102 L37 105 L31 98 L27 86 L23 72 " +
    "L19 60 L14 48 L17 36 L25 27 L34 18 L45 10 Z";

  /** The Ayeyarwady, roughly — it reads as a river, which is all it needs to do. */
  const RIVER =
    "M56 22 Q52 38 55 52 Q58 66 51 78 Q46 90 47 101";

  const RANGES = [
    "M22 40 q6 -6 11 2 M20 52 q6 -6 11 2 M18 64 q6 -6 11 2",   // Chin / Rakhine
    "M70 52 q7 -6 12 2 M72 64 q7 -6 12 2 M74 76 q6 -6 11 2",   // Shan plateau
    "M52 14 q7 -7 13 2 M44 20 q7 -7 13 2",                      // Kachin
  ];

  const REGIONS = [
    { my: "ကချင်", en: "Kachin", x: 58, y: 16 },
    { my: "စစ်ကိုင်း", en: "Sagaing", x: 40, y: 42 },
    { my: "ရှမ်း", en: "Shan", x: 72, y: 60 },
    { my: "ရခိုင်", en: "Rakhine", x: 26, y: 78 },
    { my: "ဧရာဝတီ", en: "Ayeyarwady", x: 43, y: 96 },
    { my: "တနင်္သာရီ", en: "Tanintharyi", x: 84, y: 138 },
  ];

  const TRANSPORT = [
    {
      // ALWAYS FREE. This is the anti-soft-lock guarantee: however broke you are,
      // there is always a way to the next town. Your grandfather walked it too.
      id: "walk",
      icon: "🥾",
      name: { my: "ခြေလျင်", en: "On foot" },
      note: { my: "အဖိုးလည်း လျှောက်ခဲ့တာပဲ — ဒါပေမယ့် နေ့ဝက် ကုန်မယ်", en: "He walked it too. It will cost you most of the day." },
      kyat: 0,
      hours: 5,
    },
    {
      id: "bus",
      icon: "🚌",
      name: { my: "ဘတ်စ်ကား", en: "Night bus" },
      note: { my: "ညထွက် — မွန်းတည့်မှ ရောက်မယ်", en: "Overnight — you arrive with the day half gone" },
      kyat: 1500,
      hours: 7,
    },
    {
      id: "train",
      icon: "🚂",
      name: { my: "ရထား", en: "Train" },
      note: { my: "နှေးပေမယ့် အိပ်လို့ရတယ်", en: "Slow, but you sleep on the way" },
      kyat: 4000,
      hours: 10,
    },
    {
      id: "fast",
      icon: "✈️",
      name: { my: "လေယာဉ်", en: "Flight" },
      note: { my: "အရုဏ်တက် ရောက်မယ် — တစ်နေကုန် ရမယ်", en: "In by dawn — the whole day is yours" },
      kyat: 11000,
      hours: 12,
    },
  ];

  let host = null;
  let opts = null;
  let openPanelFor = null;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  /** Fraction of the route that has been inked in, 0..1 over the whole trail. */
  function routePoints(cities) {
    return cities.map((c) => `${c.map.x},${c.map.y}`).join(" ");
  }

  function render(hostEl, options) {
    host = hostEl;
    opts = options;
    openPanelFor = null;
    draw();
  }

  function draw() {
    const cities = opts.cities;
    const save = SYS.state();
    const unlocked = save.unlocked;
    const cleared = save.cleared;

    // route split into "walked" and "ahead"
    const doneCount = cities.filter((c) => cleared[c.id]).length;
    const walked = cities.slice(0, Math.max(1, doneCount + 1));
    const current = Math.min(doneCount, cities.length - 1);

    const svg = `
      <svg class="mm-map" viewBox="0 0 ${VB_W} ${VB_H}" preserveAspectRatio="xMidYMid meet"
           xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <pattern id="mapTone" width="3" height="3" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.5" fill="#e8dcc0" opacity="0.22"/>
          </pattern>
          <filter id="mapShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.2" stdDeviation="1.4" flood-color="#000" flood-opacity="0.45"/>
          </filter>
        </defs>

        <path d="${COUNTRY}" fill="#2a4358" stroke="none" filter="url(#mapShadow)"/>
        <path d="${COUNTRY}" fill="url(#mapTone)" stroke="none"/>
        <path d="${COUNTRY}" fill="none" stroke="#f0e2bd" stroke-width="0.8"
              stroke-linejoin="round" opacity="0.85"/>

        <path d="${RIVER}" fill="none" stroke="#8fc4dd" stroke-width="0.9"
              stroke-linecap="round" opacity="0.75"/>

        <g stroke="#f0e2bd" stroke-width="0.45" fill="none" opacity="0.3">
          ${RANGES.map((d) => `<path d="${d}"/>`).join("")}
        </g>

        <g class="mm-regions" fill="#f0e2bd" opacity="0.4">
          ${REGIONS.map((r) =>
            `<text x="${r.x}" y="${r.y}" font-size="2.6" text-anchor="middle">${esc(r.en)}</text>`
          ).join("")}
        </g>

        <polyline points="${routePoints(cities)}" fill="none" stroke="#f0e2bd"
                  stroke-width="0.55" stroke-dasharray="1.6 1.8" opacity="0.4"/>
        <polyline points="${routePoints(walked)}" fill="none" stroke="#d9a441"
                  stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"
                  class="mm-inked"/>
      </svg>`;

    const nodes = cities.map((c, i) => {
      const isUnlocked = i < unlocked;
      const isCleared = Boolean(cleared[c.id]);
      const isCurrent = i === current && !isCleared;
      return `
        <button type="button"
                class="mm-node${isUnlocked ? " unlocked" : " locked"}${isCleared ? " cleared" : ""}${isCurrent ? " current" : ""}"
                data-city="${c.id}" data-index="${i}"
                ${isUnlocked ? "" : "disabled"}
                style="left:${(c.map.x / VB_W) * 100}%; top:${(c.map.y / VB_H) * 100}%">
          <span class="mm-dot">${isUnlocked ? c.emoji : "🔒"}</span>
          ${isCleared ? `<span class="mm-stamp">${ART.mark("postmark")}</span>` : ""}
          <span class="mm-label">
            <strong>${esc(c.name.my)}</strong>
            <small>${c.num}. ${esc(c.name.en)}</small>
          </span>
        </button>`;
    }).join("");

    const traveller = cities[current]
      ? `<span class="mm-traveller" style="left:${(cities[current].map.x / VB_W) * 100}%;
           top:${(cities[current].map.y / VB_H) * 100}%">${ART.hero("down")}</span>`
      : "";

    host.innerHTML =
      `<div class="mm-frame">${svg}<div class="mm-nodes">${nodes}${traveller}</div></div>` +
      `<div class="mm-panel-host" id="mm-panel-host"></div>`;

    host.querySelectorAll(".mm-node.unlocked").forEach((btn) => {
      btn.addEventListener("click", () => onNodeClick(Number(btn.dataset.index)));
    });
  }

  function onNodeClick(index) {
    const city = opts.cities[index];
    const save = SYS.state();
    const doneCount = opts.cities.filter((c) => save.cleared[c.id]).length;

    // The first chapter, and any chapter you're revisiting, needs no journey.
    if (index === 0 || save.cleared[city.id] || index <= doneCount - 1) {
      SYS.beginChapter(index);
      opts.onPick(index);
      return;
    }
    openPanel(index);
  }

  /** Transport choice for the leg — the map's actual decision. */
  function openPanel(index) {
    const city = opts.cities[index];
    const panelHost = host.querySelector("#mm-panel-host");
    openPanelFor = index;

    const rows = TRANSPORT.map((t) => {
      const afford = SYS.canAfford(t.kyat);
      return `
        <button type="button" class="mm-travel" data-t="${t.id}" ${afford ? "" : "disabled"}>
          <span class="mm-t-icon">${t.icon}</span>
          <span class="mm-t-main">
            <strong>${esc(t.name.my)} · ${esc(t.name.en)}</strong>
            <small>${esc(t.note.my)}</small>
            <small class="en">${esc(t.note.en)}</small>
          </span>
          <span class="mm-t-cost">
            <b>${SYS.formatKyat(t.kyat)} ကျပ်</b>
            <i>⏳ ${t.hours}နာရီ ကျန်မယ်</i>
          </span>
        </button>`;
    }).join("");

    panelHost.innerHTML = `
      <div class="mm-panel">
        <header>
          <div>
            <strong>${esc(city.name.my)} သို့ သွားမယ်</strong>
            <small>Travel to ${esc(city.name.en)}</small>
          </div>
          <span class="mm-purse">${SYS.formatKyat(SYS.kyat())} ကျပ်</span>
        </header>
        ${rows}
        <button type="button" class="btn ghost mm-cancel">မသွားသေးဘူး · Not yet</button>
      </div>`;

    panelHost.querySelectorAll(".mm-travel").forEach((b) => {
      b.addEventListener("click", () => {
        const t = TRANSPORT.find((x) => x.id === b.dataset.t);
        if (!t || !SYS.spend(t.kyat)) return;
        SYS.beginChapter(index, t.hours);
        panelHost.innerHTML = "";
        opts.onPick(index);
      });
    });
    panelHost.querySelector(".mm-cancel").addEventListener("click", () => {
      panelHost.innerHTML = "";
      openPanelFor = null;
    });
  }

  return {
    render,
    redraw: () => { if (host && opts) draw(); },
    TRANSPORT,
    /** exposed for the economy simulation in the E2E suite */
    cheapestFare: () => Math.min(...TRANSPORT.map((t) => t.kyat)),
  };
})();
