/**
 * Mingala Trail — cities.js
 *
 * WORLD LAYOUT only. Nobody speaks in this file — every line of dialogue, every
 * quest and every letter lives in story.js. This file says where things stand.
 *
 * GEOMETRY
 *   The visible band is 562 units tall; an area is `w` units wide (2800–4200 = three
 *   to four screens). Everything is anchored BOTTOM-CENTRE at (x, y), y from the top.
 *   `groundY` is the horizon; the walk band sits below it. Parallax layers are placed
 *   from the BOTTOM of the scene, so a layer standing on the horizon has y = 562 - groundY.
 *
 * RULES the E2E content linter enforces
 *   · solid props must sit at y <= walk.bottom - 40 — there is no pathfinding, so
 *     nothing may block a lane; the player must always be able to walk in front of it
 *   · every sprite / backdrop / ambient name must exist in art.js
 *   · every npc `dialogue`, door `to` and thing action target must resolve
 *   · keepsakes must sit in an area that exists
 *
 * Exposes: window.TrailCities
 */
window.TrailCities = (() => {
  "use strict";

  const GROUND = 300;
  const HORIZON = 562 - GROUND;          // 262 — where backdrops stand
  const WALK = { top: 352, bottom: 528 };
  const IN_WALK = { top: 392, bottom: 520 };

  /** Three parallax layers: distant, middle, near. */
  const layers = (far, mid, near, tweak = {}) => [
    { backdrop: far, depth: 0.16, y: HORIZON - 6, h: 210, opacity: tweak.farOp != null ? tweak.farOp : 0.45 },
    { backdrop: mid, depth: 0.40, y: HORIZON - 4, h: 165, opacity: tweak.midOp != null ? tweak.midOp : 0.7 },
    { backdrop: near, depth: 0.68, y: HORIZON - 2, h: 128, opacity: tweak.nearOp != null ? tweak.nearOp : 0.9 },
  ];

  /** Interiors get one shallow backdrop — you're indoors, there is no distance. */
  const interiorLayers = (near) => [
    { backdrop: near, depth: 0.5, y: HORIZON + 40, h: 120, opacity: 0.32 },
  ];

  return [
    // ══════════════════════════════════════════════════════ 1 · YANGON
    {
      id: "yangon", num: 1,
      name: { my: "ရန်ကုန်", en: "Yangon" },
      region: { my: "ရန်ကုန်တိုင်း", en: "Yangon Region" },
      emoji: "🏙", theme: "town",
      map: { x: 50, y: 103 },
      palette: { sky: "#cfe0ea", far: "#93a9b8", mid: "#a8b4b4", ground: "#b9ab92", accent: "#3b5c73" },
      intro: {
        my: "မိုးတိတ်ခါစ ရန်ကုန်မြို့လယ်။ အဖိုးရဲ့ စာအိတ် ဆယ်စောင်ထဲက ပထမဆုံးစောင်။",
        en: "Downtown Yangon, just after the rain. The first of ten envelopes.",
      },
      arrive: "yangon_arrive",
      keepsake: {
        id: "ticket", area: "street", x: 2430, y: 466, sprite: "ticket", w: 58,
        name: { my: "ဘတ်စ်ကားလက်မှတ်", en: "A bus ticket stub" },
      },
      start: { area: "street", x: 240 },
      areas: {
        street: {
          name: { my: "ဗိုလ်ချုပ်လမ်း", en: "Bogyoke Road" },
          w: 3400, groundY: GROUND, walk: WALK,
          layers: layers("skyline", "rooftops", "treeline"),
          props: [
            { sprite: "lamppost", x: 140, y: 470, w: 92, solid: true, cw: 0.16 },
            { sprite: "shophouse", x: 420, y: 452, w: 300 },
            { sprite: "stall", x: 760, y: 462, w: 200, solid: true, cw: 0.6 },
            { sprite: "shophouse", x: 1120, y: 448, w: 320 },
            { sprite: "banyan", x: 1480, y: 434, w: 250 },
            { sprite: "bench", x: 1720, y: 474, w: 150, solid: true, cw: 0.8 },
            { sprite: "postbox", x: 1960, y: 470, w: 90, solid: true, cw: 0.5 },
            { sprite: "shophouse", x: 2300, y: 446, w: 330 },
            { sprite: "lamppost", x: 2620, y: 470, w: 92, solid: true, cw: 0.16 },
            { sprite: "shophouse", x: 3020, y: 450, w: 310 },
            { sprite: "trishaw", x: 3260, y: 472, w: 160, solid: true, cw: 0.6 },
          ],
          ambient: [
            { sprite: "bus", y: 372, w: 300, speed: 96, dir: 1, count: 2 },
            { sprite: "cyclist", y: 392, w: 130, speed: -58, dir: -1, count: 2 },
            { sprite: "crow", y: 190, w: 52, speed: 42, dir: 1, count: 3, bob: 8 },
            { sprite: "cloud", y: 150, w: 240, speed: 9, dir: 1, count: 2 },
          ],
          npcs: [
            { id: "ko-myint-swe", sprite: "teashop", x: 900, y: 512, w: 106, dialogue: "yangon_teashop" },
            { id: "daw-khin-khin", sprite: "vendor", x: 1640, y: 514, w: 104, dialogue: "yangon_vendor" },
            { id: "maung-tint", sprite: "kid", x: 2180, y: 516, w: 90, dialogue: "yangon_kid" },
            { id: "ko-bo", sprite: "driver", x: 3180, y: 512, w: 106, dialogue: "yangon_driver" },
          ],
          doors: [
            { id: "d-teashop", x: 1020, y: 470, w: 112, to: "teashop", entry: 200 },
            { id: "d-press", x: 2860, y: 468, w: 112, to: "press", entry: 200, if: "yangon_crossed" },
          ],
          things: [
            {
              id: "notice", sprite: "signpost", x: 1300, y: 468, w: 96,
              verb: { my: "ဖတ်မယ်", en: "Read" },
              action: { dialogue: "yangon_notice", who: "phoe-chit" },
            },
            {
              id: "crossing", sprite: "postbox", x: 2740, y: 466, w: 62,
              verb: { my: "ဖြတ်ကူးမယ်", en: "Cross" },
              if: ["yangon_knows_press", "!yangon_crossed"],
              hours: 1,
              action: { twist: "traffic", effect: { learn: "yangon_crossed" } },
            },
          ],
        },
        teashop: {
          name: { my: "လက်ဖက်ရည်ဆိုင်", en: "The tea shop" },
          interior: true,
          w: 1400, groundY: GROUND + 40, walk: IN_WALK,
          palette: { sky: "#e6d6b4", far: "#c9b489", mid: "#bda87d", ground: "#a8916a", accent: "#6a4526" },
          layers: interiorLayers("rooftops"),
          props: [
            { sprite: "shelf", x: 220, y: 460, w: 200 },
            { sprite: "lowtable", x: 520, y: 464, w: 200, solid: true, cw: 0.8 },
            { sprite: "stool", x: 660, y: 478, w: 100 },
            { sprite: "lowtable", x: 940, y: 464, w: 200, solid: true, cw: 0.8 },
            { sprite: "kettle", x: 1180, y: 456, w: 120, solid: true, cw: 0.6 },
          ],
          ambient: [],
          npcs: [
            { id: "daw-nilar", sprite: "clerk", x: 800, y: 508, w: 104, dialogue: "yangon_clerk" },
          ],
          doors: [{ id: "d-out-teashop", x: 140, y: 466, w: 108, to: "street", entry: 1020 }],
          things: [
            {
              id: "tea", sprite: "teacup", x: 1080, y: 496, w: 62,
              verb: { my: "သောက်မယ်", en: "Drink" },
              once: true,
              action: {
                effect: { kyat: -300, learn: "had_tea" },
                toast: { my: "လက်ဖက်ရည် တစ်ခွက်။ ခေါင်းရှင်းသွားတယ်", en: "One cup. Your head clears." },
              },
            },
          ],
        },
        press: {
          name: { my: "ပုံနှိပ်တိုက်", en: "The print works" },
          interior: true,
          w: 1500, groundY: GROUND + 40, walk: IN_WALK,
          palette: { sky: "#d9d2c2", far: "#b3ab99", mid: "#a49b88", ground: "#8f8674", accent: "#3a352c" },
          layers: interiorLayers("rooftops"),
          props: [
            { sprite: "press", x: 460, y: 460, w: 300, solid: true, cw: 0.7 },
            { sprite: "shelf", x: 1000, y: 456, w: 210 },
            { sprite: "lowtable", x: 1300, y: 464, w: 190, solid: true, cw: 0.8 },
          ],
          ambient: [],
          npcs: [
            { id: "u-sein-hla", sprite: "printer", x: 780, y: 508, w: 108, dialogue: "yangon_recipient" },
          ],
          doors: [{ id: "d-out-press", x: 150, y: 466, w: 108, to: "street", entry: 2860 }],
          things: [],
        },
      },
    },

    // ══════════════════════════════════════════════════════ 2 · BAGO
    {
      id: "bago", num: 2,
      name: { my: "ပဲခူး", en: "Bago" },
      region: { my: "ပဲခူးတိုင်း", en: "Bago Region" },
      emoji: "🛕", theme: "town",
      map: { x: 60, y: 97 },
      palette: { sky: "#f2e0bd", far: "#cdb389", mid: "#c0a476", ground: "#c3a475", accent: "#8a5a2b" },
      intro: {
        my: "မနက်စောစော ဆွမ်းခံလှည့်ချိန်။ ဒုတိယစာက ကျောင်းတိုက်တစ်ခုဆီ။",
        en: "Dawn, and the alms line is already moving. The second letter is for a monastery.",
      },
      arrive: "bago_arrive",
      keepsake: {
        id: "fan", area: "monastery", x: 1200, y: 470, sprite: "fan", w: 60,
        name: { my: "ဘုန်းကြီးယပ်တောင်", en: "A monk's palm fan" },
      },
      start: { area: "street", x: 220 },
      areas: {
        street: {
          name: { my: "ဆွမ်းခံလမ်း", en: "The alms road" },
          w: 3200, groundY: GROUND, walk: WALK,
          layers: layers("templefield", "treeline", "palmline"),
          props: [
            { sprite: "stupa", x: 380, y: 440, w: 200 },
            { sprite: "stall", x: 700, y: 460, w: 190, solid: true, cw: 0.6 },
            { sprite: "waterpot", x: 1000, y: 470, w: 80, solid: true, cw: 0.7 },
            { sprite: "temple", x: 1420, y: 424, w: 340 },
            { sprite: "banyan", x: 1820, y: 430, w: 240 },
            { sprite: "bench", x: 2100, y: 474, w: 150, solid: true, cw: 0.8 },
            { sprite: "stupa", x: 2460, y: 442, w: 180 },
            { sprite: "oxcart", x: 2860, y: 470, w: 210, solid: true, cw: 0.6 },
            { sprite: "palm", x: 3100, y: 436, w: 190 },
          ],
          ambient: [
            { sprite: "crow", y: 176, w: 50, speed: 36, dir: -1, count: 3, bob: 7 },
            { sprite: "oxcart", y: 384, w: 220, speed: 34, dir: 1, count: 1 },
            { sprite: "cloud", y: 140, w: 260, speed: 7, dir: 1, count: 2 },
            { sprite: "dog", y: 500, w: 110, speed: 26, dir: 1, count: 1 },
          ],
          npcs: [
            { id: "ma-nu", sprite: "woman", x: 860, y: 514, w: 104, dialogue: "bago_donor" },
            { id: "ko-htay", sprite: "vendor", x: 1740, y: 514, w: 104, dialogue: "bago_vendor" },
            { id: "novice-thu", sprite: "monk", x: 2380, y: 512, w: 100, dialogue: "bago_novice" },
          ],
          doors: [
            { id: "d-monastery", x: 1560, y: 466, w: 114, to: "monastery", entry: 200 },
          ],
          things: [
            {
              id: "almsline", sprite: "bowl", x: 1160, y: 494, w: 66,
              verb: { my: "ကူညီမယ်", en: "Help" },
              if: ["bago_offered_help", "!bago_carried"],
              hours: 1,
              action: { twist: "balance", effect: { learn: "bago_carried" } },
            },
          ],
        },
        monastery: {
          name: { my: "ကျောင်းတိုက်", en: "The monastery" },
          interior: true,
          w: 1600, groundY: GROUND + 40, walk: IN_WALK,
          palette: { sky: "#efe0c0", far: "#c7ab7e", mid: "#b99b6c", ground: "#a68a5e", accent: "#7d4f22" },
          layers: interiorLayers("treeline"),
          props: [
            { sprite: "shrine", x: 420, y: 452, w: 260, solid: true, cw: 0.7 },
            { sprite: "lowtable", x: 880, y: 464, w: 200, solid: true, cw: 0.8 },
            { sprite: "shelf", x: 1440, y: 456, w: 200 },
          ],
          ambient: [],
          npcs: [
            { id: "sayadaw-u-kaythara", sprite: "monk", x: 700, y: 508, w: 110, dialogue: "bago_recipient" },
          ],
          doors: [{ id: "d-out-monastery", x: 150, y: 466, w: 108, to: "street", entry: 1560 }],
          things: [],
        },
      },
    },

    // ══════════════════════════════════════════════════════ 3 · MANDALAY
    {
      id: "mandalay", num: 3,
      name: { my: "မန္တလေး", en: "Mandalay" },
      region: { my: "မန္တလေးတိုင်း", en: "Mandalay Region" },
      emoji: "🌉", theme: "town",
      map: { x: 52, y: 46 },
      palette: { sky: "#f3d2a0", far: "#c19468", mid: "#b3875a", ground: "#a9884f", accent: "#7a3f1d" },
      intro: {
        my: "ဦးပိန်တံတားပေါ်မှာ နေဝင်ချိန်။ တတိယစာက ရွှေချသမား တစ်ယောက်ဆီ။",
        en: "Sunset on U Bein bridge. The third letter is for a gold-leaf beater.",
      },
      arrive: "mandalay_arrive",
      keepsake: {
        id: "goldleaf", area: "workshop", x: 1260, y: 470, sprite: "goldleaf", w: 56,
        name: { my: "ရွှေစက္ကူတစ်ရွက်", en: "A single leaf of gold" },
      },
      start: { area: "street", x: 240 },
      areas: {
        street: {
          name: { my: "ဦးပိန်တံတား", en: "U Bein bridge" },
          w: 3600, groundY: GROUND, walk: WALK,
          layers: layers("hills", "palmline", "treeline"),
          props: [
            { sprite: "palm", x: 300, y: 436, w: 190 },
            { sprite: "signpost", x: 560, y: 470, w: 96, solid: true, cw: 0.2 },
            { sprite: "stilthouse", x: 940, y: 428, w: 280 },
            { sprite: "boat", x: 1380, y: 462, w: 240 },
            { sprite: "rock", x: 1760, y: 472, w: 140, solid: true, cw: 0.8 },
            { sprite: "stall", x: 2100, y: 460, w: 190, solid: true, cw: 0.6 },
            { sprite: "banyan", x: 2500, y: 430, w: 240 },
            { sprite: "pagoda", x: 2960, y: 424, w: 240 },
            { sprite: "bench", x: 3380, y: 474, w: 150, solid: true, cw: 0.8 },
          ],
          ambient: [
            { sprite: "ferry", y: 388, w: 230, speed: 22, dir: 1, count: 1, bob: 4 },
            { sprite: "crow", y: 168, w: 50, speed: -34, dir: -1, count: 3, bob: 8 },
            { sprite: "cyclist", y: 396, w: 130, speed: 52, dir: 1, count: 1 },
            { sprite: "cloud", y: 146, w: 250, speed: 8, dir: -1, count: 2 },
          ],
          npcs: [
            { id: "ko-zaw", sprite: "fisherman", x: 1220, y: 514, w: 108, dialogue: "mandalay_fisherman" },
            { id: "daw-tin-mya", sprite: "elder", x: 1980, y: 514, w: 104, dialogue: "mandalay_elder" },
            { id: "ma-phyu", sprite: "woman", x: 2760, y: 514, w: 104, dialogue: "mandalay_daughter" },
          ],
          doors: [
            { id: "d-workshop", x: 3160, y: 468, w: 112, to: "workshop", entry: 200, if: "mandalay_crossed" },
          ],
          things: [
            {
              id: "planks", sprite: "signpost", x: 2320, y: 468, w: 80,
              verb: { my: "ဖြတ်မယ်", en: "Cross" },
              if: ["mandalay_knows_shop", "!mandalay_crossed"],
              hours: 1,
              action: { twist: "planks", effect: { learn: "mandalay_crossed" } },
            },
          ],
        },
        workshop: {
          name: { my: "ရွှေထုစက်ရုံ", en: "The gold-beaters' shed" },
          interior: true,
          w: 1500, groundY: GROUND + 40, walk: IN_WALK,
          palette: { sky: "#e8d3a8", far: "#c0a271", mid: "#ad8d5c", ground: "#9c7f52", accent: "#6b3f16" },
          layers: interiorLayers("rooftops"),
          props: [
            { sprite: "press", x: 480, y: 460, w: 280, solid: true, cw: 0.7 },
            { sprite: "lowtable", x: 920, y: 464, w: 200, solid: true, cw: 0.8 },
            { sprite: "shelf", x: 1380, y: 456, w: 200 },
          ],
          ambient: [],
          npcs: [
            { id: "u-tun-yin", sprite: "elderman", x: 760, y: 508, w: 108, dialogue: "mandalay_recipient" },
          ],
          doors: [{ id: "d-out-workshop", x: 150, y: 466, w: 108, to: "street", entry: 3160 }],
          things: [],
        },
      },
    },

    // ══════════════════════════════════════════════════════ 4 · BAGAN
    {
      id: "bagan", num: 4,
      name: { my: "ပုဂံ", en: "Bagan" },
      region: { my: "မန္တလေးတိုင်း", en: "Mandalay Region" },
      emoji: "🏯", theme: "town",
      map: { x: 40, y: 58 },
      palette: { sky: "#e9c88c", far: "#c39a63", mid: "#bb9059", ground: "#c2a172", accent: "#6d4423" },
      intro: {
        my: "အရုဏ်တက်ချိန် ပုဂံလွင်ပြင်။ စတုတ္ထစာအိတ်မှာ လိပ်စာ မပါဘူး — စေတီတစ်ခုရဲ့ ပုံကြမ်းလေးပဲ ပါတယ်။",
        en: "Sunrise on the Bagan plain. The fourth envelope has no address — only a sketch of one stupa.",
      },
      arrive: "bagan_arrive",
      keepsake: {
        id: "shard", area: "street", x: 2680, y: 476, sprite: "shard", w: 56,
        name: { my: "ယွန်းအိုးအစ", en: "A shard of lacquerware" },
      },
      start: { area: "street", x: 220 },
      areas: {
        street: {
          name: { my: "စေတီလွင်ပြင်", en: "The temple plain" },
          w: 3800, groundY: GROUND, walk: WALK,
          layers: layers("templefield", "palmline", "treeline"),
          props: [
            { sprite: "stupa", x: 340, y: 440, w: 200 },
            { sprite: "oxcart", x: 700, y: 470, w: 210, solid: true, cw: 0.6 },
            { sprite: "temple", x: 1180, y: 420, w: 340 },
            { sprite: "palm", x: 1560, y: 436, w: 180 },
            { sprite: "stupa", x: 1900, y: 442, w: 180 },
            { sprite: "stupa", x: 2260, y: 446, w: 160 },
            { sprite: "rock", x: 2540, y: 472, w: 130, solid: true, cw: 0.8 },
            { sprite: "stupa", x: 2960, y: 438, w: 210 },
            { sprite: "stall", x: 3320, y: 460, w: 190, solid: true, cw: 0.6 },
            { sprite: "stupa", x: 3620, y: 448, w: 150 },
          ],
          ambient: [
            { sprite: "oxcart", y: 384, w: 220, speed: 28, dir: 1, count: 1 },
            { sprite: "crow", y: 172, w: 50, speed: 38, dir: 1, count: 4, bob: 9 },
            { sprite: "cloud", y: 138, w: 270, speed: 6, dir: 1, count: 3 },
          ],
          npcs: [
            { id: "daw-hla", sprite: "elder", x: 900, y: 514, w: 104, dialogue: "bagan_elder" },
            { id: "ko-nyi", sprite: "guide", x: 1720, y: 514, w: 106, dialogue: "bagan_guide" },
            { id: "ma-ei-mon", sprite: "vendor", x: 3160, y: 514, w: 104, dialogue: "bagan_lacquer" },
          ],
          doors: [
            { id: "d-shrine", x: 2760, y: 466, w: 112, to: "shrine", entry: 200, if: "bagan_found_stupa" },
          ],
          things: [
            {
              id: "spotting", sprite: "sketch", x: 2400, y: 468, w: 70,
              verb: { my: "ရှာမယ်", en: "Search" },
              if: ["bagan_has_sketch", "!bagan_found_stupa"],
              hours: 1,
              action: { twist: "spot", effect: { learn: "bagan_found_stupa" } },
            },
          ],
        },
        shrine: {
          name: { my: "စေတီအတွင်း", en: "Inside the stupa" },
          interior: true,
          w: 1300, groundY: GROUND + 40, walk: IN_WALK,
          palette: { sky: "#d8c6a4", far: "#a8956f", mid: "#9c8763", ground: "#8b7857", accent: "#4c3418" },
          layers: interiorLayers("templefield"),
          props: [
            { sprite: "shrine", x: 660, y: 452, w: 280, solid: true, cw: 0.7 },
            { sprite: "lamp", x: 980, y: 490, w: 70 },
          ],
          ambient: [],
          npcs: [
            { id: "u-thaung", sprite: "elderman", x: 380, y: 508, w: 108, dialogue: "bagan_recipient" },
          ],
          doors: [{ id: "d-out-shrine", x: 140, y: 466, w: 108, to: "street", entry: 2760 }],
          things: [],
        },
      },
    },

    // ══════════════════════════════════════════════════════ 5 · INLE
    {
      id: "inle", num: 5,
      name: { my: "အင်းလေး", en: "Inle" },
      region: { my: "ရှမ်းပြည်နယ်", en: "Shan State" },
      emoji: "🛶", theme: "water",
      map: { x: 70, y: 62 },
      palette: { sky: "#cfe6e4", far: "#8fb5b3", mid: "#83a8a4", ground: "#93b0a8", accent: "#2f5f5c" },
      intro: {
        my: "အင်းလေးကန်။ ပဉ္စမစာက ကြာချည်ရက်တဲ့ အမျိုးသမီးတစ်ယောက်ဆီ — ဒါပေမယ့် သူမ ရွာမှာ မရှိတော့ဘူး။",
        en: "Inle lake. The fifth letter is for a lotus-thread weaver — who no longer lives in the village.",
      },
      arrive: "inle_arrive",
      keepsake: {
        id: "spool", area: "weaving", x: 1180, y: 468, sprite: "spool", w: 58,
        name: { my: "ကြာချည်လုံး", en: "A spool of lotus thread" },
      },
      start: { area: "street", x: 220 },
      areas: {
        street: {
          name: { my: "ရေပေါ်ရွာ", en: "The floating village" },
          w: 3400, groundY: GROUND, walk: WALK,
          layers: layers("hills", "lakeshore", "palmline"),
          props: [
            { sprite: "stilthouse", x: 380, y: 428, w: 280 },
            { sprite: "boat", x: 760, y: 466, w: 230 },
            { sprite: "waterpot", x: 1060, y: 470, w: 76, solid: true, cw: 0.7 },
            { sprite: "stilthouse", x: 1440, y: 424, w: 300 },
            { sprite: "boat", x: 1880, y: 468, w: 220 },
            { sprite: "stall", x: 2240, y: 460, w: 190, solid: true, cw: 0.6 },
            { sprite: "stilthouse", x: 2680, y: 430, w: 270 },
            { sprite: "palm", x: 3080, y: 436, w: 180 },
            { sprite: "wave", x: 1700, y: 552, w: 3400, h: 110 },
          ],
          ambient: [
            { sprite: "boat", y: 402, w: 200, speed: 30, dir: 1, count: 2, bob: 5 },
            { sprite: "crow", y: 178, w: 48, speed: -30, dir: -1, count: 2, bob: 7 },
            { sprite: "cloud", y: 142, w: 250, speed: 7, dir: 1, count: 2 },
          ],
          npcs: [
            { id: "ko-nyunt", sprite: "fisherman", x: 980, y: 514, w: 108, dialogue: "inle_fisherman" },
            { id: "daw-mya-yee", sprite: "elder", x: 2060, y: 514, w: 104, dialogue: "inle_elder" },
            { id: "maung-oo", sprite: "kid", x: 2900, y: 516, w: 90, dialogue: "inle_kid" },
          ],
          doors: [
            { id: "d-weaving", x: 1600, y: 466, w: 112, to: "weaving", entry: 200, if: "inle_rowed" },
          ],
          things: [
            {
              id: "rowing", sprite: "boat", x: 2480, y: 468, w: 150,
              verb: { my: "လှော်မယ်", en: "Row" },
              if: ["inle_knows_where", "!inle_rowed"],
              hours: 1,
              action: { twist: "rowing", effect: { learn: "inle_rowed" } },
            },
          ],
        },
        weaving: {
          name: { my: "ရက်ကန်းစင်", en: "The weaving shed" },
          interior: true,
          w: 1400, groundY: GROUND + 40, walk: IN_WALK,
          palette: { sky: "#dce8e4", far: "#a8c0ba", mid: "#96b0a8", ground: "#8fa89e", accent: "#2c4f4c" },
          layers: interiorLayers("lakeshore"),
          props: [
            { sprite: "press", x: 460, y: 460, w: 270, solid: true, cw: 0.7 },
            { sprite: "shelf", x: 920, y: 456, w: 200 },
            { sprite: "lowtable", x: 1300, y: 464, w: 190, solid: true, cw: 0.8 },
          ],
          ambient: [],
          npcs: [
            { id: "daw-sein", sprite: "elder", x: 740, y: 508, w: 104, dialogue: "inle_recipient" },
          ],
          doors: [{ id: "d-out-weaving", x: 150, y: 466, w: 108, to: "street", entry: 1600 }],
          things: [],
        },
      },
    },

    // ══════════════════════════════════════════════════════ 6 · KALAW
    {
      id: "kalaw", num: 6,
      name: { my: "ကလော", en: "Kalaw" },
      region: { my: "ရှမ်းပြည်နယ်", en: "Shan State" },
      emoji: "⛰", theme: "hill",
      map: { x: 57, y: 67 },
      palette: { sky: "#dbe7ee", far: "#8fa89a", mid: "#88a08e", ground: "#9aa886", accent: "#3f5a3a" },
      intro: {
        my: "ကလောတောင်ကုန်း၊ မြူထဲမှာ ထင်းရှူးတွေ။ ဆဋ္ဌမစာက တောင်ပေါ်ရွာက ဆရာမတစ်ယောက်ဆီ။",
        en: "Pine and mist above Kalaw. The sixth letter is for a schoolteacher up the ridge.",
      },
      arrive: "kalaw_arrive",
      keepsake: {
        id: "sprig", area: "street", x: 3080, y: 476, sprite: "sprig", w: 54,
        name: { my: "ထင်းရှူးခက်လေး", en: "A pressed pine sprig" },
      },
      start: { area: "street", x: 220 },
      areas: {
        street: {
          name: { my: "တောင်တက်လမ်း", en: "The ridge path" },
          w: 3400, groundY: GROUND, walk: WALK,
          layers: layers("range", "hills", "treeline"),
          props: [
            { sprite: "pine", x: 320, y: 434, w: 200 },
            { sprite: "pine", x: 560, y: 424, w: 220 },
            { sprite: "signpost", x: 840, y: 470, w: 96, solid: true, cw: 0.2 },
            { sprite: "shophouse", x: 1240, y: 448, w: 290 },
            { sprite: "bench", x: 1620, y: 474, w: 150, solid: true, cw: 0.8 },
            { sprite: "pine", x: 2000, y: 428, w: 210 },
            { sprite: "rock", x: 2340, y: 472, w: 140, solid: true, cw: 0.8 },
            { sprite: "pine", x: 2720, y: 430, w: 200 },
            { sprite: "waterpot", x: 3260, y: 470, w: 76, solid: true, cw: 0.7 },
          ],
          ambient: [
            { sprite: "crow", y: 170, w: 50, speed: 34, dir: 1, count: 3, bob: 9 },
            { sprite: "cloud", y: 134, w: 280, speed: 5, dir: 1, count: 3 },
            { sprite: "dog", y: 502, w: 108, speed: -22, dir: -1, count: 1 },
          ],
          npcs: [
            { id: "ko-aung", sprite: "guide", x: 1040, y: 514, w: 106, dialogue: "kalaw_guide" },
            { id: "daw-shwe", sprite: "vendor", x: 1820, y: 514, w: 104, dialogue: "kalaw_vendor" },
            { id: "maung-kyaw", sprite: "kid", x: 2540, y: 516, w: 90, dialogue: "kalaw_kid" },
          ],
          doors: [
            { id: "d-school", x: 3160, y: 466, w: 112, to: "school", entry: 200, if: "kalaw_climbed" },
          ],
          things: [
            {
              id: "climbing", sprite: "signpost", x: 2900, y: 468, w: 84,
              verb: { my: "တက်မယ်", en: "Climb" },
              if: ["kalaw_knows_way", "!kalaw_climbed"],
              hours: 2,
              action: { twist: "climb", effect: { learn: "kalaw_climbed" } },
            },
          ],
        },
        school: {
          name: { my: "တောင်ပေါ်ကျောင်း", en: "The ridge school" },
          interior: true,
          w: 1400, groundY: GROUND + 40, walk: IN_WALK,
          palette: { sky: "#e2ead9", far: "#a9bd9c", mid: "#9bb08d", ground: "#94a682", accent: "#3a5233" },
          layers: interiorLayers("treeline"),
          props: [
            { sprite: "shelf", x: 380, y: 456, w: 210 },
            { sprite: "lowtable", x: 780, y: 464, w: 200, solid: true, cw: 0.8 },
            { sprite: "stool", x: 1000, y: 480, w: 100 },
            { sprite: "lowtable", x: 1260, y: 464, w: 190, solid: true, cw: 0.8 },
          ],
          ambient: [],
          npcs: [
            { id: "saya-ma-khin", sprite: "woman", x: 600, y: 508, w: 104, dialogue: "kalaw_recipient" },
          ],
          doors: [{ id: "d-out-school", x: 150, y: 466, w: 108, to: "street", entry: 3160 }],
          things: [],
        },
      },
    },

    // ══════════════════════════════════════════════════════ 7 · PYIN OO LWIN
    {
      id: "pyin-oo-lwin", num: 7,
      name: { my: "ပြင်ဦးလွင်", en: "Pyin Oo Lwin" },
      region: { my: "မန္တလေးတိုင်း", en: "Mandalay Region" },
      emoji: "🌸", theme: "hill",
      map: { x: 65, y: 40 },
      palette: { sky: "#e6eedd", far: "#a8bf94", mid: "#9cb488", ground: "#a9bd8b", accent: "#4a6b33" },
      intro: {
        my: "ပန်းခြံမြို့။ သတ္တမစာကို လက်ခံမယ့်သူက… စာပေးသူနာမည် ကြားတာနဲ့ လက်မခံဘူးလို့ ပြောလိုက်တယ်။",
        en: "Garden town. The seventh recipient hears whose letter it is, and says no.",
      },
      arrive: "pol_arrive",
      keepsake: {
        id: "jamlabel", area: "conservatory", x: 1120, y: 470, sprite: "jamlabel", w: 54,
        name: { my: "ယိုဘူးတံဆိပ်", en: "A jam-jar label" },
      },
      start: { area: "street", x: 220 },
      areas: {
        street: {
          name: { my: "ပန်းခြံလမ်း", en: "The garden road" },
          w: 3400, groundY: GROUND, walk: WALK,
          layers: layers("hills", "treeline", "rooftops"),
          props: [
            { sprite: "flowerbed", x: 340, y: 500, w: 230 },
            { sprite: "banyan", x: 640, y: 428, w: 250 },
            { sprite: "shophouse", x: 1040, y: 448, w: 300 },
            { sprite: "flowerbed", x: 1420, y: 504, w: 210 },
            { sprite: "bench", x: 1720, y: 474, w: 150, solid: true, cw: 0.8 },
            { sprite: "oxcart", x: 2080, y: 470, w: 210, solid: true, cw: 0.6 },
            { sprite: "flowerbed", x: 2460, y: 502, w: 220 },
            { sprite: "pine", x: 2760, y: 430, w: 200 },
            { sprite: "shophouse", x: 3180, y: 450, w: 290 },
          ],
          ambient: [
            { sprite: "oxcart", y: 386, w: 220, speed: 32, dir: -1, count: 1 },
            { sprite: "crow", y: 172, w: 48, speed: 32, dir: 1, count: 2, bob: 8 },
            { sprite: "cloud", y: 140, w: 260, speed: 6, dir: 1, count: 2 },
          ],
          npcs: [
            { id: "ma-thida", sprite: "vendor", x: 880, y: 514, w: 104, dialogue: "pol_vendor" },
            { id: "u-maung-gale", sprite: "driver", x: 1900, y: 512, w: 106, dialogue: "pol_driver" },
            { id: "daw-yin-nwe", sprite: "elder", x: 2620, y: 514, w: 104, dialogue: "pol_recipient" },
          ],
          doors: [
            { id: "d-conservatory", x: 3060, y: 466, w: 112, to: "conservatory", entry: 200 },
          ],
          things: [
            {
              id: "gathering", sprite: "basket", x: 1560, y: 490, w: 66,
              verb: { my: "ကောက်မယ်", en: "Gather" },
              if: ["pol_asked_flowers", "!pol_gathered"],
              hours: 2,
              action: { twist: "flowers", effect: { learn: "pol_gathered", give: "bouquet" } },
            },
          ],
        },
        conservatory: {
          name: { my: "ဖန်လုံအိမ်", en: "The glasshouse" },
          interior: true,
          w: 1400, groundY: GROUND + 40, walk: IN_WALK,
          palette: { sky: "#eef4e6", far: "#b4c9a3", mid: "#a7bd96", ground: "#a3b78d", accent: "#3f5b30" },
          layers: interiorLayers("treeline"),
          props: [
            { sprite: "flowerbed", x: 420, y: 500, w: 220 },
            { sprite: "shelf", x: 840, y: 456, w: 200 },
            { sprite: "flowerbed", x: 1260, y: 502, w: 200 },
          ],
          ambient: [],
          npcs: [
            { id: "ko-lwin", sprite: "clerk", x: 640, y: 508, w: 104, dialogue: "pol_gardener" },
          ],
          doors: [{ id: "d-out-conservatory", x: 150, y: 466, w: 108, to: "street", entry: 3060 }],
          things: [],
        },
      },
    },

    // ══════════════════════════════════════════════════════ 8 · MRAUK U
    {
      id: "mrauk-u", num: 8,
      name: { my: "မြောက်ဦး", en: "Mrauk U" },
      region: { my: "ရခိုင်ပြည်နယ်", en: "Rakhine State" },
      emoji: "🌫", theme: "mist",
      map: { x: 26, y: 73 },
      palette: { sky: "#d6dde0", far: "#9aa7ac", mid: "#8e9ba0", ground: "#93a08f", accent: "#3d4f52" },
      intro: {
        my: "မြူထူတဲ့ မြောက်ဦး။ အဋ္ဌမစာကို လက်ခံမယ့်သူ မရှိတော့ဘူး — မနှစ်က ဆုံးသွားပြီ။",
        en: "Mrauk U under thick mist. The eighth recipient died last year.",
      },
      arrive: "mrauk_arrive",
      keepsake: {
        id: "rubbing", area: "street", x: 1340, y: 476, sprite: "rubbing", w: 56,
        name: { my: "ကျောက်စာပွတ်ပုံ", en: "A stone rubbing" },
      },
      start: { area: "street", x: 220 },
      areas: {
        street: {
          name: { my: "မြူထဲက စေတီများ", en: "Temples in the mist" },
          w: 3400, groundY: GROUND, walk: WALK,
          layers: layers("range", "templefield", "treeline", { farOp: 0.3, midOp: 0.5, nearOp: 0.7 }),
          props: [
            { sprite: "temple", x: 460, y: 424, w: 320 },
            { sprite: "rock", x: 820, y: 472, w: 140, solid: true, cw: 0.8 },
            { sprite: "stupa", x: 1180, y: 440, w: 190 },
            { sprite: "banyan", x: 1560, y: 430, w: 240 },
            { sprite: "signpost", x: 1880, y: 470, w: 96, solid: true, cw: 0.2 },
            { sprite: "temple", x: 2260, y: 428, w: 300 },
            { sprite: "stupa", x: 3200, y: 444, w: 180 },
          ],
          ambient: [
            { sprite: "crow", y: 182, w: 50, speed: -28, dir: -1, count: 3, bob: 6 },
            { sprite: "cloud", y: 200, w: 320, speed: 4, dir: 1, count: 3 },
          ],
          npcs: [
            { id: "u-thila", sprite: "monk", x: 900, y: 512, w: 108, dialogue: "mrauk_monk" },
            { id: "ma-hla-nu", sprite: "woman", x: 1700, y: 514, w: 104, dialogue: "mrauk_daughter" },
            { id: "ko-san-shwe", sprite: "guide", x: 2440, y: 514, w: 106, dialogue: "mrauk_guide" },
          ],
          doors: [],
          things: [
            {
              id: "fogwalk", sprite: "signpost", x: 2080, y: 468, w: 84,
              verb: { my: "လမ်းရှာမယ်", en: "Find the way" },
              if: ["mrauk_knows_grave", "!mrauk_walked"],
              hours: 1,
              action: { twist: "fog", effect: { learn: "mrauk_walked" } },
            },
            {
              id: "graveside", sprite: "grave", x: 2880, y: 470, w: 140,
              verb: { my: "စာဖတ်ပြမယ်", en: "Read aloud" },
              if: "mrauk_walked",
              action: { dialogue: "mrauk_graveside", who: "phoe-chit" },
            },
          ],
        },
      },
    },

    // ══════════════════════════════════════════════════════ 9 · HPA-AN
    {
      id: "hpa-an", num: 9,
      name: { my: "ဘားအံ", en: "Hpa-An" },
      region: { my: "ကရင်ပြည်နယ်", en: "Kayin State" },
      emoji: "🕯", theme: "town",
      map: { x: 73, y: 110 },
      palette: { sky: "#dfe8d8", far: "#8ba07e", mid: "#829678", ground: "#9db183", accent: "#33482c" },
      intro: {
        my: "ကျောက်တောင်တွေကြား ဘားအံ။ နဝမစာကို လက်ခံမယ့်သူက အဖိုးကို ဒေါသထွက်နေဆဲ။",
        en: "Hpa-An, under the karsts. The ninth recipient is still angry at your grandfather.",
      },
      arrive: "hpaan_arrive",
      keepsake: {
        id: "pebble", area: "cave", x: 1120, y: 476, sprite: "pebble", w: 52,
        name: { my: "ဂူထဲက ကျောက်စရစ်", en: "A pebble from the cave" },
      },
      start: { area: "street", x: 220 },
      areas: {
        street: {
          name: { my: "ကျောက်တောင်ခြေ", en: "Below the karsts" },
          w: 3400, groundY: GROUND, walk: WALK,
          layers: layers("karsts", "treeline", "palmline"),
          props: [
            { sprite: "palm", x: 320, y: 436, w: 190 },
            { sprite: "shophouse", x: 720, y: 450, w: 290 },
            { sprite: "waterpot", x: 1080, y: 470, w: 76, solid: true, cw: 0.7 },
            { sprite: "karst", x: 1500, y: 414, w: 380 },
            { sprite: "rock", x: 1900, y: 472, w: 140, solid: true, cw: 0.8 },
            { sprite: "bench", x: 2240, y: 474, w: 150, solid: true, cw: 0.8 },
            { sprite: "banyan", x: 2620, y: 430, w: 240 },
            { sprite: "cave", x: 3120, y: 442, w: 300 },
          ],
          ambient: [
            { sprite: "crow", y: 168, w: 50, speed: 36, dir: 1, count: 3, bob: 8 },
            { sprite: "cyclist", y: 394, w: 130, speed: -50, dir: -1, count: 1 },
            { sprite: "cloud", y: 138, w: 260, speed: 6, dir: 1, count: 2 },
          ],
          npcs: [
            { id: "maung-lay", sprite: "kid", x: 980, y: 516, w: 90, dialogue: "hpaan_kid" },
            { id: "daw-aye", sprite: "elder", x: 1740, y: 514, w: 104, dialogue: "hpaan_elder" },
            { id: "u-po-thin", sprite: "elderman", x: 2440, y: 514, w: 108, dialogue: "hpaan_recipient" },
          ],
          doors: [
            { id: "d-cave", x: 3120, y: 468, w: 118, to: "cave", entry: 200, if: "hpaan_has_torch" },
          ],
          things: [],
        },
        cave: {
          name: { my: "ဂူအတွင်း", en: "Inside the cave" },
          interior: true,
          w: 1400, groundY: GROUND + 40, walk: IN_WALK,
          palette: { sky: "#7f8a7a", far: "#5d685a", mid: "#4e584c", ground: "#4a5346", accent: "#20281e" },
          layers: interiorLayers("karsts"),
          props: [
            { sprite: "rock", x: 420, y: 476, w: 160, solid: true, cw: 0.8 },
            { sprite: "shrine", x: 800, y: 456, w: 240, solid: true, cw: 0.7 },
            { sprite: "rock", x: 1300, y: 476, w: 150, solid: true, cw: 0.8 },
          ],
          ambient: [],
          npcs: [],
          doors: [{ id: "d-out-cave", x: 150, y: 466, w: 108, to: "street", entry: 3120 }],
          things: [
            {
              id: "searching", sprite: "torch", x: 620, y: 484, w: 64,
              verb: { my: "ရှာမယ်", en: "Search" },
              if: "!hpaan_found_box",
              hours: 1,
              action: { twist: "cave", effect: { learn: "hpaan_found_box", give: "tinbox" } },
            },
          ],
        },
      },
    },

    // ══════════════════════════════════════════════════════ 10 · NGAPALI
    {
      id: "ngapali", num: 10,
      name: { my: "ငပလီ", en: "Ngapali" },
      region: { my: "ရခိုင်ပြည်နယ်", en: "Rakhine State" },
      emoji: "🌊", theme: "water",
      map: { x: 33, y: 89 },
      palette: { sky: "#d8ecf2", far: "#9ac9d4", mid: "#8dbfca", ground: "#e0d3ae", accent: "#1f5f72" },
      intro: {
        my: "ငပလီကမ်းခြေ။ နောက်ဆုံးစာအိတ်ပေါ်မှာ… မင်းရဲ့နာမည် ရေးထားတယ်။",
        en: "Ngapali beach. The last envelope has your own name on it.",
      },
      arrive: "ngapali_arrive",
      keepsake: {
        id: "shell", area: "street", x: 2740, y: 486, sprite: "shell", w: 54,
        name: { my: "ခရုခွံ", en: "A scallop shell" },
      },
      start: { area: "street", x: 220 },
      areas: {
        street: {
          name: { my: "ကမ်းခြေ", en: "The shore" },
          w: 3400, groundY: GROUND, walk: WALK,
          layers: layers("sea", "palmline", "treeline"),
          props: [
            { sprite: "palm", x: 340, y: 434, w: 200 },
            { sprite: "palm", x: 560, y: 442, w: 170 },
            { sprite: "boat", x: 940, y: 466, w: 240 },
            { sprite: "stall", x: 1360, y: 460, w: 190, solid: true, cw: 0.6 },
            { sprite: "rock", x: 1720, y: 472, w: 130, solid: true, cw: 0.8 },
            { sprite: "boat", x: 2100, y: 468, w: 230 },
            { sprite: "palm", x: 2480, y: 438, w: 190 },
            { sprite: "bench", x: 3040, y: 474, w: 150, solid: true, cw: 0.8 },
            { sprite: "wave", x: 1700, y: 556, w: 3400, h: 110 },
          ],
          ambient: [
            { sprite: "boat", y: 398, w: 210, speed: 22, dir: -1, count: 2, bob: 6 },
            { sprite: "crow", y: 174, w: 48, speed: 30, dir: 1, count: 3, bob: 9 },
            { sprite: "cloud", y: 136, w: 270, speed: 5, dir: 1, count: 3 },
          ],
          npcs: [
            { id: "u-hla-win", sprite: "fisherman", x: 1180, y: 514, w: 108, dialogue: "ngapali_fisherman" },
            { id: "daw-thein-yi", sprite: "elder", x: 1980, y: 514, w: 104, dialogue: "ngapali_keeper" },
            { id: "ma-su", sprite: "woman", x: 2900, y: 514, w: 104, dialogue: "ngapali_daughter" },
          ],
          doors: [],
          things: [
            {
              id: "tidewalk", sprite: "signpost", x: 2320, y: 468, w: 84,
              verb: { my: "ဖြတ်မယ်", en: "Cross" },
              if: ["ngapali_knows_spot", "!ngapali_crossed"],
              hours: 1,
              action: { twist: "tide", effect: { learn: "ngapali_crossed" } },
            },
            {
              id: "lastletter", sprite: "sealedletter", x: 3240, y: 486, w: 70,
              verb: { my: "ဖွင့်မယ်", en: "Open" },
              if: "ngapali_crossed",
              action: { dialogue: "ngapali_final", who: "phoe-chit" },
            },
          ],
        },
      },
    },
  ];
})();
