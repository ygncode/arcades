/**
 * Mingala Trail — art.js
 *
 * Original inline-SVG art. Everything is drawn from scratch in the black-line /
 * halftone idiom of mid-century Burmese newsprint comics; nothing is traced from or
 * copied out of any published work.
 *
 * Four families:
 *   sprite(name)    scenery props, furniture and carryable items (square, 100x100)
 *   npc(kind)       walking characters, feet at y=96
 *   portrait(id)    dialogue busts (square, framed)
 *   backdrop(name)  wide parallax silhouettes, stretched across a layer
 *   ambient(name)   things that drift through the background
 *
 * World sprites are drawn "feet at y=96" so the engine can anchor anything by its
 * bottom edge regardless of which sprite it is.
 *
 * Exposes: window.TrailArt
 */
window.TrailArt = (() => {
  "use strict";

  const INK = "#171310";
  const PAPER = "#fdf6e4";

  let uid = 0;

  /**
   * Wrap sprite markup in a sized, non-interactive svg.
   *
   * Pattern ids are rewritten per sprite. Many of these SVGs share a page and
   * `url(#tone)` resolves against the WHOLE document — without scoping, every sprite
   * points at the first one's pattern and the halftone silently disappears.
   */
  function svg(body, opts = {}) {
    const n = ++uid;
    const scoped = body
      .replace(/id="tone-lite"/g, `id="tone-lite${n}"`)
      .replace(/url\(#tone-lite\)/g, `url(#tone-lite${n})`)
      .replace(/id="tone"/g, `id="tone${n}"`)
      .replace(/url\(#tone\)/g, `url(#tone${n})`);
    const vb = opts.viewBox || "0 0 100 100";
    const cls = opts.cls ? ` class="${opts.cls}"` : "";
    const par = opts.keepAspect ? "" : ` preserveAspectRatio="none"`;
    return `<svg${cls} viewBox="${vb}" xmlns="http://www.w3.org/2000/svg"${par} ` +
      `fill="none" stroke="${INK}" stroke-width="3" ` +
      `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${scoped}</svg>`;
  }

  const TONE_DEFS = `
    <defs>
      <pattern id="tone" width="6" height="6" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="1.15" fill="${INK}" stroke="none" opacity="0.55"/>
      </pattern>
      <pattern id="tone-lite" width="8" height="8" patternUnits="userSpaceOnUse">
        <circle cx="4" cy="4" r="1" fill="${INK}" stroke="none" opacity="0.32"/>
      </pattern>
    </defs>`;

  // ═══════════════════════════════════════════════════════════
  // HERO — Phoe Chit (ဖိုးချစ်)
  // ═══════════════════════════════════════════════════════════

  function heroLegs() {
    return `
      <g class="leg leg-a">
        <path d="M44 70 L41 90"/>
        <path d="M41 90 L35 92" stroke-width="4"/>
      </g>
      <g class="leg leg-b">
        <path d="M56 70 L59 90"/>
        <path d="M59 90 L65 92" stroke-width="4"/>
      </g>`;
  }

  /** The leather satchel — the object the whole game hangs on. */
  function satchel(front) {
    const strap = front ? `<path d="M40 44 L62 66"/>` : `<path d="M60 44 L38 66"/>`;
    return `${strap}
      <path d="M63 58 q11 4 10 15 q-1 9 -10 9 q-9 0 -10 -9" fill="url(#tone)"/>
      <path d="M63 58 q11 4 10 15 q-1 9 -10 9 q-9 0 -10 -9"/>
      <path d="M55 66 q9 -3 17 0" stroke-width="2"/>`;
  }

  function heroTorso(front) {
    return `
      <path d="M38 44 Q50 40 62 44 L64 72 Q50 76 36 72 Z" fill="${PAPER}"/>
      <path d="M38 44 Q50 40 62 44 L64 72 Q50 76 36 72 Z"/>
      ${satchel(front)}`;
  }

  const HERO = {
    down: () => svg(TONE_DEFS + `
      ${heroLegs()}
      <path d="M38 48 L26 66" class="arm"/>
      <path d="M62 48 L74 66" class="arm"/>
      ${heroTorso(true)}
      <circle cx="50" cy="27" r="16" fill="${PAPER}"/>
      <circle cx="50" cy="27" r="16"/>
      <path d="M34 24 q16 -14 32 0 z" fill="${INK}" stroke="none"/>
      <path d="M34 24 q16 -14 32 0"/>
      <path d="M66 22 q10 1 11 7 q-6 2 -11 0" fill="${INK}" stroke="none"/>
      <path d="M66 22 q10 1 11 7 q-6 2 -11 0"/>
      <circle cx="44" cy="31" r="2.4" fill="${INK}" stroke="none"/>
      <circle cx="56" cy="31" r="2.4" fill="${INK}" stroke="none"/>
      <path d="M45 38 q5 4 10 0"/>`, { keepAspect: true }),

    up: () => svg(TONE_DEFS + `
      ${heroLegs()}
      <path d="M38 48 L26 66" class="arm"/>
      <path d="M62 48 L74 66" class="arm"/>
      ${heroTorso(false)}
      <circle cx="50" cy="27" r="16" fill="${PAPER}"/>
      <circle cx="50" cy="27" r="16"/>
      <path d="M34 27 q16 -18 32 0 q-16 6 -32 0 z" fill="${INK}" stroke="none"/>
      <path d="M34 27 q16 -18 32 0"/>
      <path d="M39 20 q-10 2 -11 8 q6 2 11 -1" fill="${INK}" stroke="none"/>`, { keepAspect: true }),

    right: () => svg(TONE_DEFS + `
      ${heroLegs()}
      <path d="M52 48 L68 62" class="arm"/>
      <path d="M40 46 Q50 42 60 46 L62 72 Q50 76 38 72 Z" fill="${PAPER}"/>
      <path d="M40 46 Q50 42 60 46 L62 72 Q50 76 38 72 Z"/>
      <path d="M42 46 L58 66"/>
      <path d="M35 58 q-10 4 -9 15 q1 9 9 9 q9 0 9 -9" fill="url(#tone)"/>
      <path d="M35 58 q-10 4 -9 15 q1 9 9 9 q9 0 9 -9"/>
      <circle cx="52" cy="27" r="16" fill="${PAPER}"/>
      <circle cx="52" cy="27" r="16"/>
      <path d="M36 24 q16 -14 32 0 z" fill="${INK}" stroke="none"/>
      <path d="M36 24 q16 -14 32 0"/>
      <path d="M36 22 q-10 1 -11 7 q6 2 11 0" fill="${INK}" stroke="none"/>
      <path d="M36 22 q-10 1 -11 7 q6 2 11 0"/>
      <circle cx="61" cy="31" r="2.4" fill="${INK}" stroke="none"/>
      <path d="M58 38 q6 3 9 -1"/>
      <path d="M66 26 q4 3 0 6"/>`, { keepAspect: true }),

    // same drawing, mirrored by CSS — one less sprite to keep in sync
    left: () => HERO.right().replace("<svg ", '<svg class="flip" '),
  };

  // ═══════════════════════════════════════════════════════════
  // WALKING NPCs
  // ═══════════════════════════════════════════════════════════

  function npcBase(hair, extra = "", robe = PAPER, legs = "") {
    return `
      ${legs || `
      <path d="M40 92 L40 70" stroke-width="4"/>
      <path d="M60 92 L60 70" stroke-width="4"/>
      <path d="M34 92 L44 92" stroke-width="4"/>
      <path d="M56 92 L66 92" stroke-width="4"/>`}
      <path d="M36 46 Q50 41 64 46 L67 74 Q50 79 33 74 Z" fill="${robe}"/>
      <path d="M36 46 Q50 41 64 46 L67 74 Q50 79 33 74 Z"/>
      <path d="M36 50 L27 68"/>
      <path d="M64 50 L73 68"/>
      <circle cx="50" cy="28" r="15" fill="${PAPER}"/>
      <circle cx="50" cy="28" r="15"/>
      ${hair}
      <circle cx="45" cy="30" r="2.2" fill="${INK}" stroke="none"/>
      <circle cx="55" cy="30" r="2.2" fill="${INK}" stroke="none"/>
      ${extra}`;
  }

  const HAIR = {
    bun: `<path d="M35 26 q15 -16 30 0 q-15 5 -30 0 z" fill="${INK}" stroke="none"/>
          <circle cx="50" cy="10" r="6" fill="${INK}" stroke="none"/>`,
    crop: `<path d="M35 25 q15 -15 30 0 q-15 5 -30 0 z" fill="${INK}" stroke="none"/>`,
    bowl: `<path d="M34 28 q16 -18 32 0 q-16 6 -32 0 z" fill="${INK}" stroke="none"/>`,
    shaved: ``,
    conical: `<path d="M50 6 L74 26 L26 26 Z" fill="url(#tone-lite)"/>
              <path d="M50 6 L74 26 L26 26 Z"/><path d="M26 26 L74 26"/>`,
    cap: `<path d="M34 24 q16 -14 32 0 z" fill="${INK}" stroke="none"/>
          <path d="M34 24 q16 -14 32 0"/>
          <path d="M66 21 q11 2 11 8 q-6 2 -11 -1" fill="${INK}" stroke="none"/>`,
    tail: `<path d="M35 26 q15 -16 30 0 q-15 5 -30 0 z" fill="${INK}" stroke="none"/>
           <path d="M64 24 q12 10 8 26" stroke-width="5"/>`,
  };

  const THANAKA = `
    <circle cx="40" cy="35" r="3.5" fill="url(#tone)" stroke="none"/>
    <circle cx="60" cy="35" r="3.5" fill="url(#tone)" stroke="none"/>`;

  const NPCS = {
    elder: () => svg(TONE_DEFS + npcBase(HAIR.bun, `
      ${THANAKA}
      <path d="M45 37 q5 3 10 0"/>
      <path d="M33 74 L67 74"/>
      <path d="M38 80 L62 80" stroke-dasharray="4 4"/>`), { keepAspect: true }),

    elderman: () => svg(TONE_DEFS + npcBase(HAIR.crop, `
      <path d="M44 37 q6 2 12 -1"/>
      <path d="M40 20 q10 -6 20 0" stroke-width="2"/>
      <path d="M33 74 L67 74"/>
      <path d="M36 80 q14 5 28 0" stroke-dasharray="4 4"/>`), { keepAspect: true }),

    monk: () => svg(TONE_DEFS + `
      <path d="M40 92 L40 76" stroke-width="4"/>
      <path d="M60 92 L60 76" stroke-width="4"/>
      <path d="M34 92 L46 92" stroke-width="4"/>
      <path d="M54 92 L66 92" stroke-width="4"/>
      <path d="M33 48 Q50 42 67 48 L71 78 Q50 84 29 78 Z" fill="url(#tone)"/>
      <path d="M33 48 Q50 42 67 48 L71 78 Q50 84 29 78 Z"/>
      <path d="M50 48 L50 80"/>
      <path d="M33 54 L26 70"/>
      <circle cx="50" cy="28" r="15" fill="${PAPER}"/>
      <circle cx="50" cy="28" r="15"/>
      <circle cx="45" cy="30" r="2.2" fill="${INK}" stroke="none"/>
      <circle cx="55" cy="30" r="2.2" fill="${INK}" stroke="none"/>
      <path d="M45 37 q5 3 10 0"/>`, { keepAspect: true }),

    nun: () => svg(TONE_DEFS + npcBase(`
      <path d="M34 28 q16 -14 32 0 q-16 5 -32 0 z" fill="url(#tone-lite)"/>
      <path d="M34 28 q16 -14 32 0"/>`, `
      <path d="M45 37 q5 3 10 0"/>
      <path d="M33 62 L67 62" stroke-width="2"/>`, "url(#tone-lite)"), { keepAspect: true }),

    vendor: () => svg(TONE_DEFS + npcBase(HAIR.crop + `
      <path d="M30 22 q20 -14 40 0" stroke-width="4"/>`, `
      ${THANAKA}
      <path d="M45 37 q5 4 10 0"/>
      <rect x="28" y="66" width="44" height="9" rx="3" fill="url(#tone-lite)"/>
      <rect x="28" y="66" width="44" height="9" rx="3"/>
      <circle cx="38" cy="64" r="3" fill="${INK}" stroke="none"/>
      <circle cx="50" cy="64" r="3" fill="${INK}" stroke="none"/>
      <circle cx="62" cy="64" r="3" fill="${INK}" stroke="none"/>`), { keepAspect: true }),

    fisherman: () => svg(TONE_DEFS + npcBase(HAIR.conical, `
      <path d="M45 37 q5 3 10 0"/>
      <path d="M64 50 L86 30"/>
      <path d="M86 30 L88 58" stroke-dasharray="3 5"/>`), { keepAspect: true }),

    kid: () => svg(TONE_DEFS + `
      <path d="M43 92 L43 72" stroke-width="4"/>
      <path d="M57 92 L57 72" stroke-width="4"/>
      <path d="M38 92 L48 92" stroke-width="4"/>
      <path d="M52 92 L62 92" stroke-width="4"/>
      <path d="M40 50 Q50 46 60 50 L62 74 Q50 78 38 74 Z" fill="${PAPER}"/>
      <path d="M40 50 Q50 46 60 50 L62 74 Q50 78 38 74 Z"/>
      <path d="M40 54 L31 68"/>
      <path d="M60 54 L69 68"/>
      <circle cx="50" cy="32" r="14" fill="${PAPER}"/>
      <circle cx="50" cy="32" r="14"/>
      <path d="M36 30 q14 -16 28 0 q-14 5 -28 0 z" fill="${INK}" stroke="none"/>
      <path d="M36 30 q-6 -2 -6 6 M64 30 q6 -2 6 6" fill="${INK}" stroke="none"/>
      <circle cx="45" cy="34" r="2.2" fill="${INK}" stroke="none"/>
      <circle cx="55" cy="34" r="2.2" fill="${INK}" stroke="none"/>
      <path d="M45 40 q5 4 10 0"/>`, { keepAspect: true }),

    driver: () => svg(TONE_DEFS + npcBase(HAIR.crop, `
      <path d="M44 38 q6 4 12 -1"/>
      <path d="M62 44 L74 52 L70 70" fill="url(#tone-lite)"/>
      <path d="M62 44 L74 52 L70 70"/>`), { keepAspect: true }),

    guide: () => svg(TONE_DEFS + npcBase(HAIR.cap, `
      <path d="M45 37 q5 3 10 0"/>
      <path d="M74 34 L74 92" stroke-width="4"/>`), { keepAspect: true }),

    clerk: () => svg(TONE_DEFS + npcBase(HAIR.crop, `
      <path d="M44 37 q6 2 12 -1"/>
      <circle cx="45" cy="30" r="5.5"/><circle cx="57" cy="30" r="5.5"/>
      <path d="M50.5 30 L51.5 30"/>
      <rect x="40" y="56" width="20" height="14" rx="2" fill="${PAPER}"/>
      <rect x="40" y="56" width="20" height="14" rx="2"/>`), { keepAspect: true }),

    teashop: () => svg(TONE_DEFS + npcBase(HAIR.crop, `
      <path d="M44 38 q6 3 12 -1"/>
      <path d="M64 50 q12 2 12 10" />
      <path d="M72 60 q8 2 6 10 q-6 3 -10 -2 Z" fill="url(#tone-lite)"/>
      <path d="M72 60 q8 2 6 10 q-6 3 -10 -2 Z"/>`), { keepAspect: true }),

    printer: () => svg(TONE_DEFS + npcBase(HAIR.crop, `
      <path d="M44 37 q6 3 12 -1"/>
      <path d="M33 62 L67 62" stroke-dasharray="3 3"/>
      <path d="M28 56 q6 4 4 12 M72 56 q-6 4 -4 12" stroke-width="2"/>`, "url(#tone-lite)"), { keepAspect: true }),

    woman: () => svg(TONE_DEFS + npcBase(HAIR.tail, `
      ${THANAKA}
      <path d="M45 38 q5 3 10 0"/>
      <path d="M33 68 L67 68" stroke-width="2"/>`), { keepAspect: true }),
  };

  // ═══════════════════════════════════════════════════════════
  // DIALOGUE PORTRAITS — bust framed in a rounded panel
  // ═══════════════════════════════════════════════════════════

  function portraitFrame(inner, tone = "url(#tone-lite)") {
    return svg(TONE_DEFS + `
      <rect x="3" y="3" width="94" height="94" rx="10" fill="${PAPER}"/>
      <rect x="3" y="3" width="94" height="94" rx="10" stroke-width="4"/>
      <path d="M14 88 q36 -30 72 0 L86 94 L14 94 Z" fill="${tone}"/>
      <path d="M14 88 q36 -30 72 0" stroke-width="3"/>
      ${inner}`, { keepAspect: true });
  }

  /** Shared head. `feat` adds eyes/mouth/extras drawn on top. */
  function head(hair, feat, opts = {}) {
    const cy = opts.cy || 46;
    return `
      <ellipse cx="50" cy="${cy}" rx="24" ry="27" fill="${PAPER}"/>
      <ellipse cx="50" cy="${cy}" rx="24" ry="27" stroke-width="3.5"/>
      ${hair}
      ${feat}`;
  }

  const EYES = (y = 46) => `
    <circle cx="41" cy="${y}" r="3" fill="${INK}" stroke="none"/>
    <circle cx="59" cy="${y}" r="3" fill="${INK}" stroke="none"/>`;

  const PORTRAITS = {
    // The boy
    "phoe-chit": () => portraitFrame(head(
      `<path d="M27 40 q23 -22 46 0 z" fill="${INK}" stroke="none"/>
       <path d="M27 40 q23 -22 46 0" stroke-width="3.5"/>
       <path d="M72 36 q14 2 15 11 q-9 3 -16 -1" fill="${INK}" stroke="none"/>
       <path d="M72 36 q14 2 15 11 q-9 3 -16 -1" stroke-width="3"/>`,
      `${EYES(48)}<path d="M43 60 q7 6 14 0" stroke-width="3"/>`)),

    // The grandfather — only ever seen in letters and memory
    "u-ba-nyein": () => portraitFrame(head(
      `<path d="M27 38 q23 -18 46 0 q-23 6 -46 0 z" fill="url(#tone)" stroke="none"/>
       <path d="M27 38 q23 -18 46 0" stroke-width="3.5"/>`,
      `${EYES(46)}
       <path d="M33 36 q8 -5 15 -1 M52 35 q8 -4 15 1" stroke-width="2.5"/>
       <path d="M42 60 q8 4 16 -1" stroke-width="3"/>
       <path d="M34 52 q4 6 8 5 M66 52 q-4 6 -8 5" stroke-width="2" opacity=".7"/>`), "url(#tone)"),

    elder: () => portraitFrame(head(
      `<path d="M27 38 q23 -20 46 0 q-23 6 -46 0 z" fill="${INK}" stroke="none"/>
       <circle cx="50" cy="16" r="9" fill="${INK}" stroke="none"/>`,
      `${EYES(46)}
       <circle cx="34" cy="55" r="6" fill="url(#tone)" stroke="none"/>
       <circle cx="66" cy="55" r="6" fill="url(#tone)" stroke="none"/>
       <path d="M43 62 q7 4 14 0" stroke-width="3"/>
       <path d="M32 40 q6 4 10 3 M68 40 q-6 4 -10 3" stroke-width="2" opacity=".65"/>`)),

    elderman: () => portraitFrame(head(
      `<path d="M27 37 q23 -18 46 0 q-23 5 -46 0 z" fill="url(#tone)" stroke="none"/>
       <path d="M27 37 q23 -18 46 0" stroke-width="3.5"/>`,
      `${EYES(46)}<path d="M42 61 q8 3 16 -1" stroke-width="3"/>
       <path d="M33 35 q8 -4 14 0 M53 35 q8 -4 14 0" stroke-width="2.5"/>`)),

    monk: () => portraitFrame(`
      <path d="M12 92 q38 -34 76 0 L88 94 L12 94 Z" fill="url(#tone)"/>
      <path d="M12 92 q38 -34 76 0" stroke-width="3"/>
      <path d="M50 68 L50 94" stroke-width="2.5"/>
      ${head("", `${EYES(46)}<path d="M43 61 q7 4 14 0" stroke-width="3"/>`)}`, "url(#tone)"),

    nun: () => portraitFrame(head(
      `<path d="M26 44 q24 -22 48 0 q-24 6 -48 0 z" fill="url(#tone-lite)" stroke="none"/>
       <path d="M26 44 q24 -22 48 0" stroke-width="3.5"/>`,
      `${EYES(48)}<path d="M43 62 q7 4 14 0" stroke-width="3"/>`)),

    vendor: () => portraitFrame(head(
      `<path d="M27 39 q23 -20 46 0 z" fill="${INK}" stroke="none"/>
       <path d="M20 34 q30 -20 60 0" stroke-width="4"/>`,
      `${EYES(47)}
       <circle cx="34" cy="55" r="5.5" fill="url(#tone)" stroke="none"/>
       <circle cx="66" cy="55" r="5.5" fill="url(#tone)" stroke="none"/>
       <path d="M42 62 q8 6 16 0" stroke-width="3"/>`)),

    fisherman: () => portraitFrame(head(
      `<path d="M50 8 L86 40 L14 40 Z" fill="url(#tone-lite)"/>
       <path d="M50 8 L86 40 L14 40 Z" stroke-width="3.5"/>
       <path d="M14 40 L86 40" stroke-width="3"/>`,
      `${EYES(52)}<path d="M43 64 q7 4 14 0" stroke-width="3"/>`, { cy: 50 })),

    kid: () => portraitFrame(head(
      `<path d="M28 42 q22 -22 44 0 z" fill="${INK}" stroke="none"/>
       <path d="M28 42 q-8 -2 -8 8 M72 42 q8 -2 8 8" fill="${INK}" stroke="none"/>`,
      `${EYES(50)}<path d="M42 62 q8 7 16 0" stroke-width="3"/>`, { cy: 48 })),

    driver: () => portraitFrame(head(
      `<path d="M27 39 q23 -19 46 0 z" fill="${INK}" stroke="none"/>`,
      `${EYES(46)}<path d="M41 60 q9 6 18 -2" stroke-width="3"/>
       <path d="M74 44 L86 52 L82 74" stroke-width="3"/>`)),

    guide: () => portraitFrame(head(
      `<path d="M27 40 q23 -20 46 0 z" fill="${INK}" stroke="none"/>
       <path d="M27 40 q23 -20 46 0" stroke-width="3.5"/>
       <path d="M72 36 q14 3 15 11 q-9 3 -16 -1" fill="${INK}" stroke="none"/>`,
      `${EYES(48)}<path d="M43 61 q7 4 14 0" stroke-width="3"/>`)),

    clerk: () => portraitFrame(head(
      `<path d="M27 38 q23 -18 46 0 z" fill="${INK}" stroke="none"/>`,
      `<circle cx="41" cy="46" r="9" stroke-width="2.5"/>
       <circle cx="59" cy="46" r="9" stroke-width="2.5"/>
       <path d="M50 46 L52 46" stroke-width="2.5"/>
       <circle cx="41" cy="46" r="2.6" fill="${INK}" stroke="none"/>
       <circle cx="59" cy="46" r="2.6" fill="${INK}" stroke="none"/>
       <path d="M43 63 L57 63" stroke-width="3"/>`)),

    teashop: () => portraitFrame(head(
      `<path d="M27 38 q23 -18 46 0 z" fill="${INK}" stroke="none"/>`,
      `${EYES(46)}<path d="M40 59 q10 8 20 -1" stroke-width="3"/>
       <path d="M76 62 q10 3 8 12 q-7 3 -12 -3 Z" fill="url(#tone-lite)"/>
       <path d="M76 62 q10 3 8 12 q-7 3 -12 -3 Z" stroke-width="2.5"/>`)),

    printer: () => portraitFrame(head(
      `<path d="M27 38 q23 -18 46 0 z" fill="${INK}" stroke="none"/>`,
      `${EYES(46)}<path d="M43 61 L57 61" stroke-width="3"/>
       <circle cx="33" cy="58" r="2" fill="${INK}" stroke="none" opacity=".6"/>
       <circle cx="68" cy="54" r="1.6" fill="${INK}" stroke="none" opacity=".6"/>`), "url(#tone)"),

    woman: () => portraitFrame(head(
      `<path d="M27 39 q23 -20 46 0 q-23 6 -46 0 z" fill="${INK}" stroke="none"/>
       <path d="M71 38 q16 14 11 38" stroke-width="7"/>`,
      `${EYES(47)}
       <circle cx="34" cy="56" r="5" fill="url(#tone)" stroke="none"/>
       <circle cx="66" cy="56" r="5" fill="url(#tone)" stroke="none"/>
       <path d="M43 63 q7 4 14 0" stroke-width="3"/>`)),
  };

  // ═══════════════════════════════════════════════════════════
  // SCENERY PROPS + INTERIOR FURNITURE
  // ═══════════════════════════════════════════════════════════

  const PROPS = {
    stupa: () => svg(TONE_DEFS + `
      <path d="M50 4 L50 14"/>
      <path d="M42 20 L50 12 L58 20 Z" fill="${INK}" stroke="none"/>
      <path d="M38 34 Q50 16 62 34 Z" fill="url(#tone-lite)"/>
      <path d="M38 34 Q50 16 62 34"/>
      <path d="M32 50 Q50 30 68 50 Z" fill="url(#tone-lite)"/>
      <path d="M32 50 Q50 30 68 50"/>
      <path d="M26 68 L74 68 L68 50 L32 50 Z" fill="${PAPER}"/>
      <path d="M26 68 L74 68 L68 50 L32 50 Z"/>
      <path d="M20 96 L80 96 L74 68 L26 68 Z" fill="${PAPER}"/>
      <path d="M20 96 L80 96 L74 68 L26 68 Z"/>
      <path d="M44 96 L44 80 Q50 74 56 80 L56 96" fill="${INK}" stroke="none"/>`),

    temple: () => svg(TONE_DEFS + `
      <path d="M50 6 L58 18 L42 18 Z" fill="${INK}" stroke="none"/>
      <path d="M30 40 L50 16 L70 40 Z" fill="url(#tone-lite)"/>
      <path d="M30 40 L50 16 L70 40 Z"/>
      <path d="M22 62 L50 36 L78 62 Z" fill="url(#tone-lite)"/>
      <path d="M22 62 L50 36 L78 62 Z"/>
      <rect x="20" y="62" width="60" height="34" fill="${PAPER}"/>
      <rect x="20" y="62" width="60" height="34"/>
      <path d="M42 96 L42 76 Q50 68 58 76 L58 96" fill="${INK}" stroke="none"/>
      <path d="M28 70 L34 70 M66 70 L72 70"/>`),

    pagoda: () => svg(TONE_DEFS + `
      <path d="M50 2 L50 12"/>
      <path d="M34 26 Q50 8 66 26 Z" fill="url(#tone)"/>
      <path d="M34 26 Q50 8 66 26"/>
      <path d="M28 44 Q50 24 72 44 Z" fill="url(#tone)"/>
      <path d="M28 44 Q50 24 72 44"/>
      <path d="M22 64 Q50 42 78 64 Z" fill="url(#tone-lite)"/>
      <path d="M22 64 Q50 42 78 64"/>
      <path d="M16 96 L84 96 L78 64 L22 64 Z" fill="${PAPER}"/>
      <path d="M16 96 L84 96 L78 64 L22 64 Z"/>
      <path d="M44 96 L44 78 Q50 72 56 78 L56 96" fill="${INK}" stroke="none"/>`),

    palm: () => svg(TONE_DEFS + `
      <path d="M50 96 Q46 60 52 26" stroke-width="4"/>
      <path d="M50 78 q-4 -6 -8 -6 M50 62 q5 -6 9 -5" stroke-width="1.6" opacity=".7"/>
      <g fill="url(#tone-lite)" stroke="${INK}" stroke-width="2.4">
        <path d="M52 26 Q28 6 6 16 Q26 18 34 26 Q26 30 22 38 Q40 34 52 26 Z"/>
        <path d="M52 26 Q40 2 20 -4 Q34 12 38 22 Q30 24 26 32 Q44 32 52 26 Z"/>
        <path d="M52 26 Q64 2 84 -4 Q70 12 66 22 Q74 24 78 32 Q60 32 52 26 Z"/>
        <path d="M52 26 Q76 6 98 16 Q78 18 70 26 Q78 30 82 38 Q64 34 52 26 Z"/>
        <path d="M52 26 Q60 44 50 56 Q48 42 44 34 Q46 30 52 26 Z"/>
      </g>
      <circle cx="52" cy="27" r="4" fill="${INK}" stroke="none"/>`),

    pine: () => svg(TONE_DEFS + `
      <path d="M50 96 L50 74" stroke-width="4"/>
      <path d="M50 8 L32 40 L68 40 Z" fill="url(#tone-lite)"/>
      <path d="M50 8 L32 40 L68 40 Z"/>
      <path d="M50 26 L26 60 L74 60 Z" fill="url(#tone-lite)"/>
      <path d="M50 26 L26 60 L74 60 Z"/>
      <path d="M50 44 L20 78 L80 78 Z" fill="url(#tone-lite)"/>
      <path d="M50 44 L20 78 L80 78 Z"/>`),

    banyan: () => svg(TONE_DEFS + `
      <path d="M50 96 L50 56" stroke-width="5"/>
      <path d="M50 72 q-10 4 -16 12 M50 66 q12 6 18 14" stroke-width="3"/>
      <path d="M62 60 q4 14 2 22 M38 62 q-4 12 -2 20" stroke-width="1.6" opacity=".7"/>
      <g fill="${PAPER}">
        <circle cx="28" cy="46" r="15"/><circle cx="48" cy="34" r="19"/>
        <circle cx="70" cy="46" r="15"/><circle cx="38" cy="56" r="13"/>
        <circle cx="62" cy="56" r="13"/>
      </g>
      <g fill="url(#tone-lite)">
        <circle cx="28" cy="46" r="15"/><circle cx="48" cy="34" r="19"/>
        <circle cx="70" cy="46" r="15"/><circle cx="38" cy="56" r="13"/>
        <circle cx="62" cy="56" r="13"/>
      </g>`),

    bus: () => svg(TONE_DEFS + `
      <rect x="6" y="34" width="88" height="42" rx="6" fill="${PAPER}"/>
      <rect x="6" y="34" width="88" height="42" rx="6"/>
      <rect x="12" y="40" width="20" height="16" rx="2" fill="url(#tone-lite)"/>
      <rect x="12" y="40" width="20" height="16" rx="2"/>
      <rect x="38" y="40" width="20" height="16" rx="2" fill="url(#tone-lite)"/>
      <rect x="38" y="40" width="20" height="16" rx="2"/>
      <rect x="64" y="40" width="20" height="16" rx="2" fill="url(#tone-lite)"/>
      <rect x="64" y="40" width="20" height="16" rx="2"/>
      <path d="M6 64 L94 64"/>
      <circle cx="26" cy="80" r="9" fill="${INK}" stroke="none"/>
      <circle cx="26" cy="80" r="4" fill="${PAPER}" stroke="none"/>
      <circle cx="72" cy="80" r="9" fill="${INK}" stroke="none"/>
      <circle cx="72" cy="80" r="4" fill="${PAPER}" stroke="none"/>`),

    trishaw: () => svg(TONE_DEFS + `
      <circle cx="26" cy="74" r="16"/>
      <circle cx="26" cy="74" r="3" fill="${INK}" stroke="none"/>
      <circle cx="74" cy="76" r="14"/>
      <circle cx="74" cy="76" r="3" fill="${INK}" stroke="none"/>
      <path d="M26 74 L44 46 L62 46 L74 76"/>
      <path d="M44 46 L34 34"/>
      <path d="M58 40 L78 40 L82 62 L58 62 Z" fill="url(#tone-lite)"/>
      <path d="M58 40 L78 40 L82 62 L58 62 Z"/>
      <path d="M56 34 L86 34" stroke-width="4"/>`),

    stall: () => svg(TONE_DEFS + `
      <path d="M8 34 L50 12 L92 34 Z" fill="url(#tone)"/>
      <path d="M8 34 L50 12 L92 34 Z"/>
      <path d="M8 34 L92 34"/>
      <path d="M16 34 L16 92 M84 34 L84 92" stroke-width="4"/>
      <rect x="20" y="58" width="60" height="10" rx="2" fill="${PAPER}"/>
      <rect x="20" y="58" width="60" height="10" rx="2"/>
      <circle cx="32" cy="52" r="5" fill="url(#tone-lite)"/>
      <circle cx="32" cy="52" r="5"/>
      <circle cx="50" cy="52" r="5" fill="url(#tone-lite)"/>
      <circle cx="50" cy="52" r="5"/>
      <circle cx="68" cy="52" r="5" fill="url(#tone-lite)"/>
      <circle cx="68" cy="52" r="5"/>`),

    stilthouse: () => svg(TONE_DEFS + `
      <path d="M10 44 L50 18 L90 44 Z" fill="url(#tone)"/>
      <path d="M10 44 L50 18 L90 44 Z"/>
      <rect x="20" y="44" width="60" height="28" fill="${PAPER}"/>
      <rect x="20" y="44" width="60" height="28"/>
      <rect x="42" y="54" width="16" height="18" fill="url(#tone-lite)"/>
      <rect x="42" y="54" width="16" height="18"/>
      <path d="M26 72 L26 94 M46 72 L46 94 M66 72 L66 94 M78 72 L78 94" stroke-width="3"/>`),

    shophouse: () => svg(TONE_DEFS + `
      <rect x="8" y="12" width="84" height="84" fill="${PAPER}"/>
      <rect x="8" y="12" width="84" height="84"/>
      <path d="M4 12 L96 12 L92 4 L8 4 Z" fill="url(#tone)"/>
      <path d="M4 12 L96 12 L92 4 L8 4 Z"/>
      <rect x="18" y="24" width="20" height="22" fill="url(#tone-lite)"/>
      <rect x="18" y="24" width="20" height="22"/>
      <rect x="62" y="24" width="20" height="22" fill="url(#tone-lite)"/>
      <rect x="62" y="24" width="20" height="22"/>
      <path d="M8 56 L92 56"/>
      <path d="M40 96 L40 66 Q50 58 60 66 L60 96" fill="url(#tone)" stroke="none"/>
      <path d="M40 96 L40 66 Q50 58 60 66 L60 96"/>
      <path d="M12 62 L34 62 M66 62 L88 62" stroke-width="2"/>`),

    boat: () => svg(TONE_DEFS + `
      <path d="M6 62 Q50 84 94 62 L88 72 Q50 92 12 72 Z" fill="${PAPER}"/>
      <path d="M6 62 Q50 84 94 62 L88 72 Q50 92 12 72 Z"/>
      <path d="M50 62 L50 30" stroke-width="4"/>
      <path d="M50 32 L76 52 L50 56 Z" fill="url(#tone-lite)"/>
      <path d="M50 32 L76 52 L50 56 Z"/>`),

    oxcart: () => svg(TONE_DEFS + `
      <circle cx="66" cy="76" r="16"/>
      <path d="M50 76 L82 76 M66 60 L66 92 M55 65 L77 87 M55 87 L77 65" stroke-width="2"/>
      <path d="M28 52 L84 52 L80 68 L32 68 Z" fill="url(#tone-lite)"/>
      <path d="M28 52 L84 52 L80 68 L32 68 Z"/>
      <path d="M28 56 L8 48"/>
      <path d="M8 48 q-6 -8 2 -12 q8 -2 10 6 L22 60 L10 62 Z" fill="${PAPER}"/>
      <path d="M8 48 q-6 -8 2 -12 q8 -2 10 6 L22 60 L10 62 Z"/>
      <path d="M14 62 L14 84 M20 62 L22 84" stroke-width="3"/>`),

    karst: () => svg(TONE_DEFS + `
      <path d="M4 96 L22 40 L34 56 L48 18 L64 52 L78 34 L96 96 Z" fill="url(#tone-lite)"/>
      <path d="M4 96 L22 40 L34 56 L48 18 L64 52 L78 34 L96 96 Z"/>
      <path d="M22 40 L28 62 M48 18 L52 44 M78 34 L72 60" stroke-width="2"/>`),

    cave: () => svg(TONE_DEFS + `
      <path d="M2 96 L8 52 Q50 8 92 52 L98 96 Z" fill="url(#tone-lite)"/>
      <path d="M2 96 L8 52 Q50 8 92 52 L98 96 Z"/>
      <path d="M30 96 Q30 52 50 50 Q70 52 70 96 Z" fill="${INK}" stroke="none"/>
      <path d="M38 50 L42 62 M52 48 L50 60 M62 52 L58 64" stroke="${PAPER}" stroke-width="2"/>`),

    rock: () => svg(TONE_DEFS + `
      <path d="M10 92 Q6 62 30 54 Q48 38 68 52 Q94 58 90 92 Z" fill="url(#tone-lite)"/>
      <path d="M10 92 Q6 62 30 54 Q48 38 68 52 Q94 58 90 92 Z"/>
      <path d="M30 56 L44 74 M68 54 L56 76" stroke-width="2"/>`),

    flowerbed: () => svg(TONE_DEFS + `
      <path d="M6 92 Q50 76 94 92 Z" fill="url(#tone)"/>
      <path d="M6 92 Q50 76 94 92"/>
      <g stroke-width="2.5">
        <path d="M22 84 L22 66"/><circle cx="22" cy="60" r="7" fill="${PAPER}"/>
        <path d="M50 86 L50 62"/><circle cx="50" cy="56" r="8" fill="${PAPER}"/>
        <path d="M76 84 L76 68"/><circle cx="76" cy="62" r="7" fill="${PAPER}"/>
      </g>
      <circle cx="22" cy="60" r="2.4" fill="${INK}" stroke="none"/>
      <circle cx="50" cy="56" r="2.6" fill="${INK}" stroke="none"/>
      <circle cx="76" cy="62" r="2.4" fill="${INK}" stroke="none"/>`),

    lamppost: () => svg(TONE_DEFS + `
      <path d="M50 96 L50 26" stroke-width="4"/>
      <path d="M38 96 L62 96" stroke-width="4"/>
      <path d="M40 26 L60 26 L56 10 L44 10 Z" fill="url(#tone-lite)"/>
      <path d="M40 26 L60 26 L56 10 L44 10 Z"/>
      <path d="M44 6 L56 6"/>`),

    bench: () => svg(TONE_DEFS + `
      <rect x="10" y="52" width="80" height="10" rx="3" fill="${PAPER}"/>
      <rect x="10" y="52" width="80" height="10" rx="3"/>
      <rect x="10" y="38" width="80" height="8" rx="3" fill="${PAPER}"/>
      <rect x="10" y="38" width="80" height="8" rx="3"/>
      <path d="M20 62 L20 88 M80 62 L80 88" stroke-width="4"/>`),

    signpost: () => svg(TONE_DEFS + `
      <path d="M50 96 L50 24" stroke-width="4"/>
      <path d="M18 24 L74 24 L82 34 L74 44 L18 44 Z" fill="${PAPER}"/>
      <path d="M18 24 L74 24 L82 34 L74 44 L18 44 Z"/>
      <path d="M26 32 L62 32 M26 38 L54 38" stroke-width="2"/>`),

    postbox: () => svg(TONE_DEFS + `
      <path d="M30 96 L30 34 Q50 20 70 34 L70 96 Z" fill="url(#tone)"/>
      <path d="M30 96 L30 34 Q50 20 70 34 L70 96 Z"/>
      <rect x="38" y="42" width="24" height="5" rx="2" fill="${INK}" stroke="none"/>
      <path d="M36 60 L64 60" stroke-width="2"/>
      <circle cx="50" cy="74" r="6" fill="${PAPER}"/>
      <circle cx="50" cy="74" r="6"/>
      <path d="M22 96 L78 96" stroke-width="4"/>`),

    waterpot: () => svg(TONE_DEFS + `
      <path d="M32 44 Q50 34 68 44 Q78 66 50 88 Q22 66 32 44 Z" fill="url(#tone-lite)"/>
      <path d="M32 44 Q50 34 68 44 Q78 66 50 88 Q22 66 32 44 Z"/>
      <ellipse cx="50" cy="42" rx="18" ry="6" fill="${PAPER}"/>
      <ellipse cx="50" cy="42" rx="18" ry="6"/>`),

    // ── interiors ───────────────────────────────────────────
    lowtable: () => svg(TONE_DEFS + `
      <rect x="8" y="52" width="84" height="9" rx="3" fill="${PAPER}"/>
      <rect x="8" y="52" width="84" height="9" rx="3"/>
      <path d="M18 61 L18 92 M82 61 L82 92" stroke-width="4"/>
      <path d="M18 84 L82 84" stroke-width="2"/>`),

    stool: () => svg(TONE_DEFS + `
      <rect x="24" y="56" width="52" height="8" rx="3" fill="url(#tone-lite)"/>
      <rect x="24" y="56" width="52" height="8" rx="3"/>
      <path d="M32 64 L28 92 M68 64 L72 92" stroke-width="4"/>
      <path d="M30 78 L70 78" stroke-width="2"/>`),

    kettle: () => svg(TONE_DEFS + `
      <path d="M28 52 Q50 44 72 52 Q78 78 50 86 Q22 78 28 52 Z" fill="url(#tone)"/>
      <path d="M28 52 Q50 44 72 52 Q78 78 50 86 Q22 78 28 52 Z"/>
      <path d="M72 58 q14 4 12 16" stroke-width="4"/>
      <path d="M36 46 q14 -10 28 0" stroke-width="4"/>
      <path d="M44 40 L56 40" stroke-width="3"/>`),

    shelf: () => svg(TONE_DEFS + `
      <rect x="10" y="14" width="80" height="80" fill="${PAPER}"/>
      <rect x="10" y="14" width="80" height="80"/>
      <path d="M10 40 L90 40 M10 66 L90 66" stroke-width="3"/>
      <rect x="18" y="20" width="10" height="18" fill="url(#tone-lite)"/>
      <rect x="32" y="22" width="10" height="16" fill="url(#tone)"/>
      <rect x="60" y="46" width="12" height="18" fill="url(#tone-lite)"/>
      <circle cx="30" cy="76" r="8" fill="url(#tone)"/>
      <circle cx="30" cy="76" r="8"/>`),

    press: () => svg(TONE_DEFS + `
      <rect x="12" y="34" width="76" height="46" rx="4" fill="url(#tone)"/>
      <rect x="12" y="34" width="76" height="46" rx="4"/>
      <path d="M12 52 L88 52" stroke-width="3"/>
      <circle cx="30" cy="42" r="7" fill="${PAPER}"/><circle cx="30" cy="42" r="7"/>
      <circle cx="70" cy="42" r="7" fill="${PAPER}"/><circle cx="70" cy="42" r="7"/>
      <path d="M50 34 L50 18 L74 18" stroke-width="4"/>
      <path d="M20 80 L20 94 M80 80 L80 94" stroke-width="4"/>
      <path d="M24 62 L76 62 M24 70 L60 70" stroke-width="2"/>`),

    shrine: () => svg(TONE_DEFS + `
      <path d="M14 40 L50 14 L86 40 Z" fill="url(#tone)"/>
      <path d="M14 40 L50 14 L86 40 Z"/>
      <rect x="22" y="40" width="56" height="52" fill="${PAPER}"/>
      <rect x="22" y="40" width="56" height="52"/>
      <path d="M50 48 q-10 12 0 26 q10 -14 0 -26 Z" fill="url(#tone)"/>
      <path d="M50 48 q-10 12 0 26 q10 -14 0 -26 Z"/>
      <path d="M34 84 L34 74 M66 84 L66 74" stroke-width="3"/>
      <circle cx="34" cy="70" r="3" fill="${INK}" stroke="none"/>
      <circle cx="66" cy="70" r="3" fill="${INK}" stroke="none"/>`),

    doorway: () => svg(TONE_DEFS + `
      <rect x="18" y="16" width="64" height="80" rx="4" fill="url(#tone-lite)"/>
      <rect x="18" y="16" width="64" height="80" rx="4"/>
      <path d="M28 96 L28 30 Q50 18 72 30 L72 96" fill="${INK}" stroke="none" opacity=".78"/>
      <path d="M28 96 L28 30 Q50 18 72 30 L72 96"/>`),

    grave: () => svg(TONE_DEFS + `
      <path d="M28 96 L28 40 Q50 20 72 40 L72 96 Z" fill="url(#tone-lite)"/>
      <path d="M28 96 L28 40 Q50 20 72 40 L72 96 Z"/>
      <path d="M38 52 L62 52 M38 62 L62 62 M42 72 L58 72" stroke-width="2"/>
      <path d="M16 96 L84 96" stroke-width="4"/>`),

    wave: () => svg(
      `<path d="M0 5 q6 -4 12 0 q6 4 12 0 q6 -4 12 0 q6 4 12 0 q6 -4 12 0 q6 4 12 0 q6 -4 12 0 q6 4 12 0"
             stroke-width="0.7"/>
       <path d="M0 9 q6 -3 12 0 q6 3 12 0 q6 -3 12 0 q6 3 12 0 q6 -3 12 0 q6 3 12 0 q6 -3 12 0 q6 3 12 0"
             stroke-width="0.5" opacity="0.5"/>`,
      { viewBox: "0 0 100 12" }
    ),
  };

  // ═══════════════════════════════════════════════════════════
  // CARRYABLE ITEMS + KEEPSAKES
  // ═══════════════════════════════════════════════════════════

  const ITEMS = {
    letter: () => svg(TONE_DEFS + `
      <rect x="14" y="30" width="72" height="46" rx="3" fill="${PAPER}"/>
      <rect x="14" y="30" width="72" height="46" rx="3"/>
      <path d="M14 32 L50 58 L86 32"/>
      <path d="M24 68 L46 68" stroke-width="2"/>`),

    sealedletter: () => svg(TONE_DEFS + `
      <rect x="12" y="28" width="76" height="48" rx="3" fill="${PAPER}"/>
      <rect x="12" y="28" width="76" height="48" rx="3"/>
      <path d="M12 30 L50 56 L88 30"/>
      <circle cx="50" cy="60" r="9" fill="url(#tone)"/>
      <circle cx="50" cy="60" r="9"/>
      <path d="M46 60 L54 60 M50 56 L50 64" stroke-width="2"/>`),

    routebook: () => svg(TONE_DEFS + `
      <path d="M18 18 L82 18 L82 88 L18 88 Z" fill="url(#tone)"/>
      <path d="M18 18 L82 18 L82 88 L18 88 Z"/>
      <path d="M28 18 L28 88" stroke-width="3"/>
      <path d="M38 34 L72 34 M38 46 L72 46 M38 58 L64 58" stroke-width="2"/>
      <path d="M60 18 L60 52 L68 44 L76 52 L76 18" fill="${PAPER}"/>
      <path d="M60 18 L60 52 L68 44 L76 52 L76 18"/>`),

    lamp: () => svg(TONE_DEFS + `
      <path d="M34 40 L66 40 L74 82 L26 82 Z" fill="url(#tone-lite)"/>
      <path d="M34 40 L66 40 L74 82 L26 82 Z"/>
      <path d="M40 40 L40 26 Q50 16 60 26 L60 40"/>
      <path d="M44 62 q6 -14 12 0 q-6 10 -12 0" fill="${INK}" stroke="none"/>`),

    bowl: () => svg(TONE_DEFS + `
      <path d="M18 46 Q50 38 82 46 Q76 84 50 88 Q24 84 18 46 Z" fill="url(#tone-lite)"/>
      <path d="M18 46 Q50 38 82 46 Q76 84 50 88 Q24 84 18 46 Z"/>
      <ellipse cx="50" cy="46" rx="32" ry="8" fill="${PAPER}"/>
      <ellipse cx="50" cy="46" rx="32" ry="8"/>`),

    teacup: () => svg(TONE_DEFS + `
      <path d="M30 44 L70 44 L64 78 L36 78 Z" fill="${PAPER}"/>
      <path d="M30 44 L70 44 L64 78 L36 78 Z"/>
      <ellipse cx="50" cy="44" rx="20" ry="5" fill="url(#tone-lite)"/>
      <ellipse cx="50" cy="44" rx="20" ry="5"/>
      <path d="M28 82 L72 82" stroke-width="3"/>
      <path d="M42 34 q4 -8 0 -14 M56 34 q4 -8 0 -14" stroke-width="2" opacity=".6"/>`),

    flower: () => svg(TONE_DEFS + `
      <path d="M50 90 L50 52" stroke-width="3"/>
      <path d="M50 68 q-14 -6 -18 6 q14 6 18 -6" fill="url(#tone-lite)"/>
      <g fill="${PAPER}">
        <ellipse cx="50" cy="20" rx="7" ry="11"/><ellipse cx="66" cy="36" rx="11" ry="7"/>
        <ellipse cx="50" cy="52" rx="7" ry="11"/><ellipse cx="34" cy="36" rx="11" ry="7"/>
      </g>
      <ellipse cx="50" cy="20" rx="7" ry="11"/><ellipse cx="66" cy="36" rx="11" ry="7"/>
      <ellipse cx="50" cy="52" rx="7" ry="11"/><ellipse cx="34" cy="36" rx="11" ry="7"/>
      <circle cx="50" cy="36" r="5" fill="url(#tone)" stroke="none"/>`),

    fish: () => svg(TONE_DEFS + `
      <path d="M14 56 Q42 28 70 56 Q42 84 14 56 Z" fill="url(#tone-lite)"/>
      <path d="M14 56 Q42 28 70 56 Q42 84 14 56 Z"/>
      <path d="M70 56 L90 40 L90 72 Z" fill="${PAPER}"/>
      <path d="M70 56 L90 40 L90 72 Z"/>
      <circle cx="28" cy="52" r="3" fill="${INK}" stroke="none"/>`),

    umbrella: () => svg(TONE_DEFS + `
      <path d="M10 52 Q50 6 90 52 Z" fill="url(#tone-lite)"/>
      <path d="M10 52 Q50 6 90 52"/>
      <path d="M10 52 q10 10 20 0 q10 10 20 0 q10 10 20 0 q10 10 20 0"/>
      <path d="M50 20 L50 86" stroke-width="3"/>
      <path d="M50 86 q10 4 10 -6"/>`),

    basket: () => svg(TONE_DEFS + `
      <path d="M20 42 L80 42 L72 86 L28 86 Z" fill="url(#tone)"/>
      <path d="M20 42 L80 42 L72 86 L28 86 Z"/>
      <path d="M30 26 q20 -18 40 0" stroke-width="3"/>
      <path d="M24 58 L76 58 M26 72 L74 72" stroke-width="2"/>`),

    key: () => svg(TONE_DEFS + `
      <circle cx="30" cy="50" r="16" fill="${PAPER}"/>
      <circle cx="30" cy="50" r="16"/>
      <circle cx="30" cy="50" r="6" fill="${INK}" stroke="none"/>
      <path d="M46 50 L86 50" stroke-width="5"/>
      <path d="M74 50 L74 66 M84 50 L84 62" stroke-width="4"/>`),

    torch: () => svg(TONE_DEFS + `
      <path d="M44 92 L44 44 L56 44 L56 92 Z" fill="url(#tone-lite)"/>
      <path d="M44 92 L44 44 L56 44 L56 92 Z"/>
      <path d="M50 42 q-16 -8 -8 -22 q4 8 10 4 q-4 -12 8 -18 q-2 14 8 20 q6 12 -18 16 Z" fill="${PAPER}"/>
      <path d="M50 42 q-16 -8 -8 -22 q4 8 10 4 q-4 -12 8 -18 q-2 14 8 20 q6 12 -18 16 Z"/>`),

    sketch: () => svg(TONE_DEFS + `
      <rect x="16" y="20" width="68" height="62" rx="3" fill="${PAPER}"/>
      <rect x="16" y="20" width="68" height="62" rx="3"/>
      <path d="M34 68 Q50 34 66 68 Z" fill="url(#tone-lite)"/>
      <path d="M34 68 Q50 34 66 68 Z"/>
      <path d="M50 34 L50 24"/>
      <path d="M26 74 L74 74" stroke-width="2"/>`),

    // ── the ten keepsakes ───────────────────────────────────
    ticket: () => svg(TONE_DEFS + `
      <path d="M14 34 L86 34 L86 50 q-8 6 0 12 L86 76 L14 76 L14 62 q8 -6 0 -12 Z" fill="${PAPER}"/>
      <path d="M14 34 L86 34 L86 50 q-8 6 0 12 L86 76 L14 76 L14 62 q8 -6 0 -12 Z"/>
      <path d="M26 46 L60 46 M26 58 L52 58 M26 68 L44 68" stroke-width="2"/>
      <circle cx="72" cy="60" r="8" fill="url(#tone)" stroke="none" opacity=".5"/>`),

    fan: () => svg(TONE_DEFS + `
      <path d="M50 84 Q18 56 22 26 Q50 12 78 26 Q82 56 50 84 Z" fill="url(#tone-lite)"/>
      <path d="M50 84 Q18 56 22 26 Q50 12 78 26 Q82 56 50 84 Z"/>
      <path d="M50 84 L50 16 M50 80 L28 32 M50 80 L72 32" stroke-width="2"/>
      <path d="M50 84 L50 94" stroke-width="4"/>`),

    goldleaf: () => svg(TONE_DEFS + `
      <rect x="24" y="26" width="52" height="52" rx="2" fill="url(#tone)"/>
      <rect x="24" y="26" width="52" height="52" rx="2"/>
      <path d="M32 34 L68 34 M32 44 L68 44 M32 54 L68 54 M32 64 L68 64" stroke-width="1.5" opacity=".6"/>
      <path d="M70 22 L82 26 L78 38" stroke-width="2"/>`),

    shard: () => svg(TONE_DEFS + `
      <path d="M22 72 Q28 34 56 24 L78 44 Q66 74 44 82 Z" fill="url(#tone)"/>
      <path d="M22 72 Q28 34 56 24 L78 44 Q66 74 44 82 Z"/>
      <path d="M34 62 q12 -18 30 -22" stroke-width="2" opacity=".7"/>
      <path d="M40 74 q10 -14 26 -18" stroke-width="2" opacity=".5"/>`),

    spool: () => svg(TONE_DEFS + `
      <ellipse cx="50" cy="34" rx="24" ry="8" fill="${PAPER}"/>
      <ellipse cx="50" cy="34" rx="24" ry="8"/>
      <path d="M26 34 L26 70 M74 34 L74 70"/>
      <ellipse cx="50" cy="70" rx="24" ry="8" fill="url(#tone-lite)"/>
      <ellipse cx="50" cy="70" rx="24" ry="8"/>
      <path d="M30 44 q20 6 40 0 M30 54 q20 6 40 0 M30 62 q20 6 40 0" stroke-width="1.6"/>`),

    sprig: () => svg(TONE_DEFS + `
      <path d="M50 88 Q46 56 52 24" stroke-width="3"/>
      <g stroke-width="2">
        <path d="M50 74 L32 66 M50 66 L68 58 M50 58 L32 50 M51 48 L69 40 M52 38 L36 30"/>
      </g>
      <circle cx="52" cy="24" r="3" fill="${INK}" stroke="none"/>`),

    jamlabel: () => svg(TONE_DEFS + `
      <rect x="20" y="24" width="60" height="56" rx="4" fill="${PAPER}"/>
      <rect x="20" y="24" width="60" height="56" rx="4"/>
      <circle cx="50" cy="46" r="12" fill="url(#tone)"/>
      <circle cx="50" cy="46" r="12"/>
      <path d="M50 34 q4 -6 10 -4" stroke-width="2"/>
      <path d="M30 66 L70 66 M34 74 L66 74" stroke-width="2"/>`),

    rubbing: () => svg(TONE_DEFS + `
      <rect x="16" y="20" width="68" height="64" rx="2" fill="${PAPER}"/>
      <rect x="16" y="20" width="68" height="64" rx="2"/>
      <path d="M32 66 Q50 30 68 66 Z" fill="url(#tone)"/>
      <path d="M32 66 Q50 30 68 66 Z" stroke-width="2"/>
      <path d="M24 76 L76 76" stroke-width="1.6" opacity=".6"/>
      <path d="M20 26 q10 6 4 14" stroke-width="1.4" opacity=".5"/>`),

    pebble: () => svg(TONE_DEFS + `
      <path d="M22 66 Q20 42 44 34 Q70 28 78 52 Q82 76 56 82 Q30 86 22 66 Z" fill="url(#tone)"/>
      <path d="M22 66 Q20 42 44 34 Q70 28 78 52 Q82 76 56 82 Q30 86 22 66 Z"/>
      <path d="M36 56 q14 -10 28 -4" stroke-width="1.8" opacity=".6"/>`),

    shell: () => svg(TONE_DEFS + `
      <path d="M50 84 Q16 62 22 34 Q50 20 78 34 Q84 62 50 84 Z" fill="url(#tone-lite)"/>
      <path d="M50 84 Q16 62 22 34 Q50 20 78 34 Q84 62 50 84 Z"/>
      <path d="M50 84 L50 22 M50 82 L26 38 M50 82 L74 38 M50 80 L36 28 M50 80 L64 28" stroke-width="1.8"/>`),
  };

  // ═══════════════════════════════════════════════════════════
  // PARALLAX BACKDROPS — wide silhouettes stretched across a layer
  // ═══════════════════════════════════════════════════════════

  const VB_WIDE = "0 0 400 120";

  const BACKDROPS = {
    hills: () => svg(TONE_DEFS + `
      <path d="M0 120 L0 78 Q30 46 62 70 Q92 40 124 66 Q150 44 182 72 Q214 40 246 68
               Q276 44 308 70 Q338 46 368 72 Q386 60 400 74 L400 120 Z" fill="currentColor"/>
      <path d="M0 78 Q30 46 62 70 Q92 40 124 66 Q150 44 182 72 Q214 40 246 68
               Q276 44 308 70 Q338 46 368 72 Q386 60 400 74" stroke-width="2"/>`,
      { viewBox: VB_WIDE }),

    range: () => svg(TONE_DEFS + `
      <path d="M0 120 L0 90 L34 44 L58 74 L86 30 L120 78 L152 50 L186 86 L214 40
               L250 82 L286 46 L318 80 L352 38 L384 76 L400 58 L400 120 Z" fill="currentColor"/>
      <path d="M0 90 L34 44 L58 74 L86 30 L120 78 L152 50 L186 86 L214 40
               L250 82 L286 46 L318 80 L352 38 L384 76 L400 58" stroke-width="2"/>`,
      { viewBox: VB_WIDE }),

    skyline: () => svg(TONE_DEFS + `
      <path d="M0 120 L0 84 L22 84 L22 58 L44 58 L44 76 L70 76 L70 40 L96 40 L96 72
               L124 72 L124 54 L150 54 L150 82 L178 82 L178 46 L206 46 L206 74
               L236 74 L236 60 L262 60 L262 86 L292 86 L292 50 L320 50 L320 78
               L348 78 L348 64 L376 64 L376 84 L400 84 L400 120 Z" fill="currentColor"/>
      <path d="M0 84 L22 84 L22 58 L44 58 L44 76 L70 76 L70 40 L96 40 L96 72
               L124 72 L124 54 L150 54 L150 82 L178 82 L178 46 L206 46 L206 74
               L236 74 L236 60 L262 60 L262 86 L292 86 L292 50 L320 50 L320 78
               L348 78 L348 64 L376 64 L376 84 L400 84" stroke-width="2"/>
      <g fill="${INK}" opacity=".28" stroke="none">
        <rect x="28" y="64" width="4" height="6"/><rect x="36" y="64" width="4" height="6"/>
        <rect x="76" y="48" width="4" height="6"/><rect x="84" y="48" width="4" height="6"/>
        <rect x="184" y="54" width="4" height="6"/><rect x="192" y="54" width="4" height="6"/>
        <rect x="298" y="58" width="4" height="6"/><rect x="306" y="58" width="4" height="6"/>
      </g>`, { viewBox: VB_WIDE }),

    templefield: () => svg(TONE_DEFS + `
      <path d="M0 120 L0 98 L400 98 L400 120 Z" fill="currentColor"/>
      <g fill="currentColor" stroke="${INK}" stroke-width="2">
        <path d="M22 98 L22 76 Q38 52 54 76 L54 98 Z"/>
        <path d="M74 98 L74 82 Q86 62 98 82 L98 98 Z"/>
        <path d="M126 98 L126 68 Q148 34 170 68 L170 98 Z"/>
        <path d="M196 98 L196 80 Q208 60 220 80 L220 98 Z"/>
        <path d="M244 98 L244 72 Q262 44 280 72 L280 98 Z"/>
        <path d="M306 98 L306 84 Q316 66 326 84 L326 98 Z"/>
        <path d="M348 98 L348 74 Q366 48 384 74 L384 98 Z"/>
      </g>
      <g stroke-width="2">
        <path d="M38 54 L38 44 M148 36 L148 24 M262 46 L262 36 M366 50 L366 40"/>
      </g>`, { viewBox: VB_WIDE }),

    karsts: () => svg(TONE_DEFS + `
      <path d="M0 120 L0 96 L18 52 L32 74 L48 30 L66 68 L84 46 L104 86 L126 40
               L148 78 L168 34 L190 72 L212 50 L236 88 L258 42 L282 76 L304 36
               L328 74 L350 54 L374 84 L400 62 L400 120 Z" fill="currentColor"/>
      <path d="M0 96 L18 52 L32 74 L48 30 L66 68 L84 46 L104 86 L126 40
               L148 78 L168 34 L190 72 L212 50 L236 88 L258 42 L282 76 L304 36
               L328 74 L350 54 L374 84 L400 62" stroke-width="2"/>`, { viewBox: VB_WIDE }),

    lakeshore: () => svg(TONE_DEFS + `
      <path d="M0 120 L0 92 Q60 80 120 90 Q190 78 250 90 Q320 80 400 92 L400 120 Z"
            fill="currentColor"/>
      <path d="M0 92 Q60 80 120 90 Q190 78 250 90 Q320 80 400 92" stroke-width="2"/>
      <g stroke-width="2" fill="currentColor">
        <path d="M40 90 L40 76 L58 68 L76 76 L76 90 Z"/>
        <path d="M180 88 L180 74 L198 66 L216 74 L216 88 Z"/>
        <path d="M300 90 L300 78 L316 70 L332 78 L332 90 Z"/>
      </g>`, { viewBox: VB_WIDE }),

    sea: () => svg(TONE_DEFS + `
      <path d="M0 120 L0 88 L400 88 L400 120 Z" fill="currentColor"/>
      <path d="M0 88 L400 88" stroke-width="2"/>
      <g stroke-width="1.4" opacity=".55">
        <path d="M20 98 q10 -5 20 0 q10 5 20 0"/>
        <path d="M120 104 q10 -5 20 0 q10 5 20 0"/>
        <path d="M240 96 q10 -5 20 0 q10 5 20 0"/>
        <path d="M320 106 q10 -5 20 0 q10 5 20 0"/>
      </g>`, { viewBox: VB_WIDE }),

    treeline: () => svg(TONE_DEFS + `
      <path d="M0 120 L0 96 L400 96 L400 120 Z" fill="currentColor"/>
      <g fill="currentColor" stroke="${INK}" stroke-width="2">
        <circle cx="26" cy="84" r="20"/><circle cx="62" cy="90" r="16"/>
        <circle cx="102" cy="80" r="22"/><circle cx="146" cy="88" r="17"/>
        <circle cx="188" cy="82" r="20"/><circle cx="230" cy="90" r="15"/>
        <circle cx="272" cy="80" r="21"/><circle cx="316" cy="88" r="17"/>
        <circle cx="358" cy="84" r="19"/><circle cx="394" cy="90" r="15"/>
      </g>`, { viewBox: VB_WIDE }),

    palmline: () => svg(TONE_DEFS + `
      <g stroke-width="2.4">
        <path d="M40 120 Q36 92 42 70 M42 70 q-16 -10 -28 -4 M42 70 q16 -12 30 -6 M42 70 q-6 -16 -16 -18 M42 70 q10 -14 22 -14"/>
        <path d="M140 120 Q136 96 142 76 M142 76 q-14 -9 -26 -3 M142 76 q15 -11 28 -5 M142 76 q-5 -14 -15 -16"/>
        <path d="M250 120 Q246 90 252 68 M252 68 q-17 -10 -29 -3 M252 68 q17 -12 31 -5 M252 68 q11 -15 23 -15"/>
        <path d="M350 120 Q346 94 352 74 M352 74 q-15 -9 -27 -3 M352 74 q16 -11 29 -5 M352 74 q-6 -15 -16 -17"/>
      </g>`, { viewBox: VB_WIDE }),

    rooftops: () => svg(TONE_DEFS + `
      <g fill="currentColor" stroke="${INK}" stroke-width="2">
        <path d="M0 120 L0 92 L30 74 L60 92 L60 120 Z"/>
        <path d="M70 120 L70 86 L104 66 L138 86 L138 120 Z"/>
        <path d="M150 120 L150 94 L176 78 L202 94 L202 120 Z"/>
        <path d="M212 120 L212 84 L248 62 L284 84 L284 120 Z"/>
        <path d="M292 120 L292 90 L322 72 L352 90 L352 120 Z"/>
        <path d="M360 120 L360 96 L382 82 L400 94 L400 120 Z"/>
      </g>`, { viewBox: VB_WIDE }),
  };

  // ═══════════════════════════════════════════════════════════
  // AMBIENT ACTORS — drift through the background on loops
  // ═══════════════════════════════════════════════════════════

  const AMBIENT = {
    bus: () => PROPS.bus(),
    trishaw: () => PROPS.trishaw(),
    boat: () => PROPS.boat(),
    oxcart: () => PROPS.oxcart(),

    dog: () => svg(TONE_DEFS + `
      <path d="M22 68 Q30 52 50 52 Q70 52 76 66 L76 80 L68 80 L68 70 L34 70 L34 80 L26 80 Z"
            fill="url(#tone-lite)"/>
      <path d="M22 68 Q30 52 50 52 Q70 52 76 66 L76 80 L68 80 L68 70 L34 70 L34 80 L26 80 Z"/>
      <path d="M76 62 q10 -6 14 2 q-4 8 -12 6" fill="${PAPER}"/>
      <path d="M76 62 q10 -6 14 2 q-4 8 -12 6"/>
      <path d="M84 58 q4 -10 -2 -12" stroke-width="2"/>
      <circle cx="84" cy="64" r="1.8" fill="${INK}" stroke="none"/>
      <path d="M22 66 q-8 -6 -6 -16" stroke-width="3"/>`),

    crow: () => svg(`
      <path d="M20 56 q18 -18 30 -2 q12 -16 30 2 q-16 6 -30 4 q-14 2 -30 -4 Z"
            fill="${INK}" stroke="none"/>`),

    cyclist: () => svg(TONE_DEFS + `
      <circle cx="28" cy="76" r="14"/><circle cx="74" cy="76" r="14"/>
      <path d="M28 76 L48 52 L66 52 L74 76 M48 52 L42 40"/>
      <path d="M56 52 L58 34" stroke-width="3"/>
      <circle cx="58" cy="26" r="8" fill="${PAPER}"/><circle cx="58" cy="26" r="8"/>
      <path d="M58 34 L48 44 M58 34 L70 42" stroke-width="3"/>`),

    ferry: () => svg(TONE_DEFS + `
      <path d="M4 60 L96 60 L88 78 L12 78 Z" fill="${PAPER}"/>
      <path d="M4 60 L96 60 L88 78 L12 78 Z"/>
      <rect x="24" y="38" width="52" height="22" fill="url(#tone-lite)"/>
      <rect x="24" y="38" width="52" height="22"/>
      <path d="M32 44 L44 44 M56 44 L68 44" stroke-width="2"/>
      <path d="M50 38 L50 24" stroke-width="3"/>
      <path d="M50 24 q10 4 0 8" fill="${INK}" stroke="none"/>`),

    cloud: () => svg(`
      <g fill="${PAPER}" stroke="${INK}" stroke-width="2.5" opacity=".85">
        <circle cx="30" cy="56" r="16"/><circle cx="52" cy="46" r="21"/>
        <circle cx="74" cy="56" r="15"/>
      </g>`),

    laundry: () => svg(TONE_DEFS + `
      <path d="M2 20 q50 14 96 0" stroke-width="2"/>
      <g fill="url(#tone-lite)" stroke="${INK}" stroke-width="2">
        <path d="M14 26 L30 26 L32 56 L12 56 Z"/>
        <path d="M42 30 L58 30 L60 62 L40 62 Z"/>
        <path d="M70 28 L86 28 L88 54 L68 54 Z"/>
      </g>`),
  };

  // ═══════════════════════════════════════════════════════════
  // MARKS
  // ═══════════════════════════════════════════════════════════

  const MARKS = {
    ping: () => svg(`
      <path d="M18 14 L82 14 Q92 14 92 26 L92 56 Q92 68 82 68 L58 68 L46 86 L42 68 L18 68
               Q8 68 8 56 L8 26 Q8 14 18 14 Z" fill="${PAPER}"/>
      <path d="M18 14 L82 14 Q92 14 92 26 L92 56 Q92 68 82 68 L58 68 L46 86 L42 68 L18 68
               Q8 68 8 56 L8 26 Q8 14 18 14 Z"/>
      <path d="M50 26 L50 46" stroke-width="7"/>
      <circle cx="50" cy="57" r="4" fill="${INK}" stroke="none"/>`, { keepAspect: true }),

    talk: () => svg(`
      <path d="M18 14 L82 14 Q92 14 92 26 L92 56 Q92 68 82 68 L58 68 L46 86 L42 68 L18 68
               Q8 68 8 56 L8 26 Q8 14 18 14 Z" fill="${PAPER}"/>
      <path d="M18 14 L82 14 Q92 14 92 26 L92 56 Q92 68 82 68 L58 68 L46 86 L42 68 L18 68
               Q8 68 8 56 L8 26 Q8 14 18 14 Z"/>
      <circle cx="32" cy="41" r="4.5" fill="${INK}" stroke="none"/>
      <circle cx="50" cy="41" r="4.5" fill="${INK}" stroke="none"/>
      <circle cx="68" cy="41" r="4.5" fill="${INK}" stroke="none"/>`, { keepAspect: true }),

    door: () => svg(`
      <path d="M20 12 L80 12 L80 88 L20 88 Z" fill="${PAPER}"/>
      <path d="M20 12 L80 12 L80 88 L20 88 Z"/>
      <path d="M50 34 L50 66 M50 66 L40 56 M50 66 L60 56" stroke-width="6"/>`, { keepAspect: true }),

    postmark: () => svg(`
      <circle cx="50" cy="50" r="42" stroke-width="4" stroke-dasharray="7 5"/>
      <circle cx="50" cy="50" r="31" stroke-width="2.4"/>
      <path d="M22 50 L78 50" stroke-width="2.4"/>`, { keepAspect: true }),
  };

  const WORLD = { ...PROPS, ...ITEMS };

  return {
    INK,
    PAPER,

    hero: (dir) => (HERO[dir] || HERO.down)(),
    npc: (kind) => (NPCS[kind] || NPCS.kid)(),
    portrait: (id) => (PORTRAITS[id] || PORTRAITS.kid)(),
    sprite: (name) => (WORLD[name] ? WORLD[name]() : PROPS.rock()),
    backdrop: (name) => (BACKDROPS[name] ? BACKDROPS[name]() : BACKDROPS.hills()),
    ambient: (name) => (AMBIENT[name] ? AMBIENT[name]() : AMBIENT.crow()),
    mark: (name) => (MARKS[name] || MARKS.ping)(),

    has: (name) => Boolean(WORLD[name]),
    hasPortrait: (id) => Boolean(PORTRAITS[id]),
    hasNpc: (kind) => Boolean(NPCS[kind]),
    hasBackdrop: (name) => Boolean(BACKDROPS[name]),
    hasAmbient: (name) => Boolean(AMBIENT[name]),

    names: () => ({
      heroes: Object.keys(HERO),
      npcs: Object.keys(NPCS),
      portraits: Object.keys(PORTRAITS),
      props: Object.keys(PROPS),
      items: Object.keys(ITEMS),
      backdrops: Object.keys(BACKDROPS),
      ambient: Object.keys(AMBIENT),
    }),
  };
})();
