/* E2E for Upstream (games/upstream)
   Part lint, part playthrough — mirrors the mingala.mjs approach:
   static checks run in-page against window.UpstreamLegs / UpstreamStory,
   live checks drive the engine through window.UpstreamDebug. */
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const URL = `${BASE}/games/upstream/`;
const OUT = "e2e-shots";
mkdirSync(OUT, { recursive: true });

const failures = [];
const report = [];
const fail = (m) => failures.push(m);
const log = (m) => report.push(m);

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  log(`✓ ${name}.png`);
}

async function newPage(browser, { width = 1280, height = 800, mobile = false } = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    screen: { width, height },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => fail(`page error: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") fail(`console error: ${m.text()}`);
  });
  return { context, page };
}

const waitState = (page, pred, timeout = 8000) =>
  page.waitForFunction(pred, null, { timeout });

async function dbg(page, expr) {
  return page.evaluate(expr);
}

async function run() {
  const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] });

  /* ---------- 1. boot + data lint ---------- */
  {
    const { context, page } = await newPage(browser);
    await page.goto(URL, { waitUntil: "networkidle" });
    await waitState(page, () => !!window.UpstreamDebug && !!document.querySelector("#stage canvas"));
    log("boot: canvas + debug hooks present");

    const lint = await page.evaluate(() => {
      const errs = [];
      const L = window.UpstreamLegs, S = window.UpstreamStory;
      if (!L || L.legs.length !== 10) errs.push(`expected 10 legs, got ${L && L.legs.length}`);
      const KNOWN = new Set(["log", "raft", "barge", "ferry", "fisher", "whirlpool", "sandbar", "net", "lantern", "debris", "rock", "shoal", "rapids", "buoySafe"]);
      const townIds = new Set(Object.keys(S.scenes));
      L.legs.forEach((leg, i) => {
        for (const k of ["id", "from", "to", "distance", "baseSpeed", "riverWidth", "theme", "intro", "sky", "water", "fog", "light", "hazards"])
          if (leg[k] == null) errs.push(`leg ${i} (${leg.id}) missing ${k}`);
        if (!leg.intro.mm || !leg.intro.en) errs.push(`leg ${i} intro not bilingual`);
        for (const hz of Object.keys(leg.hazards)) if (!KNOWN.has(hz)) errs.push(`leg ${i} unknown hazard ${hz}`);
        if (!townIds.has(leg.to.id)) errs.push(`leg ${i} destination ${leg.to.id} has no story scene`);
        if (i > 0 && leg.from.id !== L.legs[i - 1].to.id) errs.push(`leg ${i} from ${leg.from.id} != previous to ${L.legs[i - 1].to.id}`);
      });
      // story lint
      const checkLines = (lines, label) => {
        if (!Array.isArray(lines) || !lines.length) { errs.push(`${label}: no lines`); return; }
        lines.forEach((ln, j) => {
          if (!ln.mm || !ln.en) errs.push(`${label} line ${j} not bilingual`);
          if (ln.who && !S.cast[ln.who]) errs.push(`${label} line ${j} unknown cast ${ln.who}`);
        });
      };
      checkLines(S.prologue.lines, "prologue");
      for (const id of Object.keys(S.scenes)) checkLines(S.scenes[id].lines, `scene ${id}`);
      if (!S.scenes.myitsone.epilogue || !S.scenes.myitsone.epilogue.length) errs.push("myitsone missing epilogue");
      if (!S.scenes.pakokku.home) errs.push("pakokku scene not marked home");
      if (!S.scenes.pakokku.gift) errs.push("pakokku scene missing the compass gift");
      // upgrade lint
      for (const [k, up] of Object.entries(L.upgrades)) {
        if (!up.levels || !up.levels.length) errs.push(`upgrade ${k} has no prices`);
        if (up.availableFrom == null || up.availableFrom < 0 || up.availableFrom > 9) errs.push(`upgrade ${k} bad availableFrom`);
      }
      // pakokku present and is leg 4's destination
      if (L.legs[3].to.id !== "pakokku") errs.push("leg 4 must end at Pakokku");
      if (!L.legs[3].home) errs.push("leg 4 must be flagged home");
      return errs;
    });
    lint.forEach((e) => fail(`lint: ${e}`));
    log(`data lint: ${lint.length === 0 ? "clean" : lint.length + " problems"}`);

    /* spawn-plan lint: every leg generates a sane, in-bounds, hazard+coin plan */
    for (let i = 0; i < 10; i++) {
      const res = await page.evaluate((idx) => {
        window.UpstreamDebug.startLeg(idx);
        const leg = window.UpstreamLegs.legs[idx];
        const plan = window.UpstreamDebug.plan();
        const half = leg.riverWidth / 2;
        const out = { n: plan.length, coins: 0, hazards: 0, oob: 0, newHazardSeen: false };
        for (const p of plan) {
          if (p.type === "coin" || p.type === "padauk") out.coins++;
          else if (p.type !== "buoySafe") out.hazards++;
          if (Math.abs(p.x) > half + 0.01 && p.type !== "rapids") out.oob++;
          if (p.type === leg.newHazard || (leg.newHazard === "rapids" && p.type === "rapids")) out.newHazardSeen = true;
        }
        return out;
      }, i);
      if (res.n < 20) fail(`leg ${i}: plan too small (${res.n})`);
      if (res.coins < 5) fail(`leg ${i}: too few coins (${res.coins})`);
      if (res.hazards < 8) fail(`leg ${i}: too few hazards (${res.hazards})`);
      if (res.oob > 0) fail(`leg ${i}: ${res.oob} spawns outside the river`);
      if (!res.newHazardSeen && LEG_HAS_SELF_HAZARD[i] !== false) fail(`leg ${i}: signature hazard never spawns`);
    }
    log("spawn plans: all 10 legs generate in-bounds hazards + coins");

    /* determinism: same leg twice → identical plan */
    const planA = await page.evaluate(() => { window.UpstreamDebug.startLeg(2); return JSON.stringify(window.UpstreamDebug.plan()); });
    const planB = await page.evaluate(() => { window.UpstreamDebug.startLeg(2); return JSON.stringify(window.UpstreamDebug.plan()); });
    if (planA !== planB) fail("spawn plan is not deterministic for the same leg");
    else log("spawn plans: deterministic per leg");

    await shot(page, "upstream-leg3-bagan");
    await context.close();
  }

  /* ---------- 2. core loop playthrough ---------- */
  {
    const { context, page } = await newPage(browser);
    await page.goto(URL, { waitUntil: "networkidle" });
    await waitState(page, () => !!window.UpstreamDebug);

    // fresh save → prologue
    await page.evaluate(() => window.UpstreamDebug.wipeSave());
    await page.click("#btn-new");
    await waitState(page, () => !document.getElementById("town-overlay").classList.contains("hidden"));
    log("prologue: overlay opened");
    // click through prologue lines
    for (let i = 0; i < 20; i++) {
      const done = await page.evaluate(() => document.getElementById("btn-dlg-next").hidden);
      if (done) break;
      await page.$eval("#btn-dlg-next", (b) => b.click());
    }
    await page.click("#btn-town-continue");
    await waitState(page, () => window.UpstreamDebug.state.mode === "playing");
    log("leg 1: started via prologue → board");

    // steering: hold right, boat moves right
    const x0 = (await dbg(page, "window.UpstreamDebug.state")).boatX;
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(700);
    await page.keyboard.up("ArrowRight");
    const x1 = (await dbg(page, "window.UpstreamDebug.state")).boatX;
    if (!(x1 > x0 + 1)) fail(`steering: boatX did not move right (${x0} → ${x1})`);
    else log(`steering works (${x0} → ${x1})`);

    // pause stops distance
    await page.keyboard.press("Escape");
    const d0 = (await dbg(page, "window.UpstreamDebug.state")).dist;
    await page.waitForTimeout(500);
    const d1 = (await dbg(page, "window.UpstreamDebug.state")).dist;
    if (d1 !== d0) fail(`pause: dist advanced while paused (${d0} → ${d1})`);
    else log("pause freezes the sim");
    await page.click("#btn-resume");
    await waitState(page, () => window.UpstreamDebug.state.paused === false);

    // damage
    const h0 = (await dbg(page, "window.UpstreamDebug.state")).hearts;
    await page.evaluate(() => window.UpstreamDebug.damage());
    const h1 = (await dbg(page, "window.UpstreamDebug.state")).hearts;
    if (h1 !== h0 - 1) fail(`damage: hearts ${h0} → ${h1}`);
    else log("damage reduces hearts");

    // coins + finish → town
    await page.evaluate(() => { window.UpstreamDebug.addCoins(200); window.UpstreamDebug.finishLeg(); });
    await waitState(page, () => !document.getElementById("town-overlay").classList.contains("hidden"));
    const townTitle = await page.textContent("#town-sub");
    if (!/Pyay/.test(townTitle)) fail(`expected Pyay town scene, got "${townTitle}"`);
    else log("leg 1 finish → Pyay story scene");
    await shot(page, "upstream-town-pyay");

    // advance dialogue to reveal shop
    for (let i = 0; i < 20; i++) {
      const done = await page.evaluate(() => document.getElementById("btn-dlg-next").hidden);
      if (done) break;
      await page.$eval("#btn-dlg-next", (b) => b.click());
    }
    await waitState(page, () => !document.getElementById("shop").classList.contains("hidden"));
    // buy engine upgrade
    const coinsBefore = (await dbg(page, "window.UpstreamDebug.state")).coins;
    const bought = await page.evaluate(() => {
      const btn = document.querySelector('.shop-item[data-upgrade="engine"]');
      if (!btn || btn.disabled) return false;
      btn.click();
      return true;
    });
    if (!bought) fail("shop: engine upgrade not purchasable with 200 coins");
    else {
      const st = await dbg(page, "window.UpstreamDebug.state");
      if (st.save.upgrades.engine !== 1) fail("shop: engine level not applied");
      if (!(st.coins < coinsBefore)) fail("shop: coins not deducted");
      log("shop: bought engine Lv1, coins deducted");
    }
    await page.click("#btn-town-continue");
    await waitState(page, () => document.getElementById("map-screen").classList.contains("active"));
    log("town → route map");
    await shot(page, "upstream-route-map");

    // save persists across reload
    await page.reload({ waitUntil: "networkidle" });
    await waitState(page, () => !!window.UpstreamDebug);
    const persisted = (await dbg(page, "window.UpstreamDebug.state")).save;
    if (persisted.leg !== 1) fail(`persistence: save.leg = ${persisted.leg}, expected 1`);
    if (persisted.upgrades.engine !== 1) fail("persistence: engine upgrade lost on reload");
    const contVisible = await page.evaluate(() => !document.getElementById("btn-continue").hidden);
    if (!contVisible) fail("persistence: Continue button not shown");
    else log("save persists across reload; Continue offered");
    await context.close();
  }

  /* ---------- 3. sinking, Pakokku homecoming, finale ---------- */
  {
    const { context, page } = await newPage(browser);
    await page.goto(URL, { waitUntil: "networkidle" });
    await waitState(page, () => !!window.UpstreamDebug);

    // sink and retry
    await page.evaluate(() => {
      window.UpstreamDebug.wipeSave();
      window.UpstreamDebug.startLeg(0);
      for (let i = 0; i < 6; i++) window.UpstreamDebug.damage();
    });
    await waitState(page, () => !document.getElementById("over-overlay").classList.contains("hidden"), 6000);
    log("sinking → game-over overlay");
    await page.click("#btn-over-retry");
    await waitState(page, () => window.UpstreamDebug.state.mode === "playing" && window.UpstreamDebug.state.hearts >= 3);
    log("retry restores the leg");

    // Pakokku homecoming: finish leg 4 grants the compass (charm >= 1)
    await page.evaluate(() => {
      window.UpstreamDebug.grantSave({ leg: 3, prologueSeen: true, coins: 10, seenTowns: ["pyay", "magway", "bagan"] });
      window.UpstreamDebug.startLeg(3);
      window.UpstreamDebug.finishLeg();
    });
    await waitState(page, () => !document.getElementById("town-overlay").classList.contains("hidden"));
    const pk = await page.textContent("#town-title");
    if (!/ပခုက္ကူ/.test(pk)) fail(`expected Pakokku scene title, got "${pk}"`);
    const pkSave = (await dbg(page, "window.UpstreamDebug.state")).save;
    if (!pkSave.compass) fail("Pakokku: compass not granted");
    if (pkSave.upgrades.charm < 1) fail("Pakokku: charm level not granted with compass");
    else log("Pakokku homecoming grants grandfather's compass (charm Lv1)");
    await shot(page, "upstream-pakokku-home");

    // finale
    await page.evaluate(() => {
      document.getElementById("town-overlay").classList.add("hidden");
      window.UpstreamDebug.grantSave({ leg: 9, prologueSeen: true, coins: 40, seenTowns: [] });
      window.UpstreamDebug.startLeg(9);
      window.UpstreamDebug.finishLeg();
    });
    await waitState(page, () => !document.getElementById("finale-overlay").classList.contains("hidden"));
    log("leg 10 finish → finale overlay");
    for (let i = 0; i < 20; i++) {
      const open = await page.evaluate(() => !document.getElementById("finale-overlay").classList.contains("hidden"));
      if (!open) break;
      await page.$eval("#btn-finale-next", (b) => b.click());
      await page.waitForTimeout(80);
    }
    await waitState(page, () => document.getElementById("map-screen").classList.contains("active"));
    const finSave = (await dbg(page, "window.UpstreamDebug.state")).save;
    if (!finSave.finished) fail("finale: save.finished not set");
    const departTxt = await page.textContent("#btn-depart");
    if (!/Free run/.test(departTxt)) fail(`finale: free-run mode not offered ("${departTxt}")`);
    else log("journey complete → free-run unlocked");
    await context.close();
  }

  /* ---------- 4. night leg visuals + viewport bounds ---------- */
  {
    const { context, page } = await newPage(browser);
    await page.goto(URL, { waitUntil: "networkidle" });
    await waitState(page, () => !!window.UpstreamDebug);
    await page.evaluate(() => { window.UpstreamDebug.wipeSave(); window.UpstreamDebug.startLeg(4); });
    await page.waitForTimeout(900);
    await shot(page, "upstream-night-leg");

    for (const [w, h] of [[1280, 800], [844, 390], [740, 360]]) {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(350);
      const m = await page.evaluate(() => {
        const r = (sel) => {
          const e = document.querySelector(sel);
          if (!e || e.hidden) return null;
          const b = e.getBoundingClientRect();
          return { l: b.left, t: b.top, r: b.right, b: b.bottom };
        };
        return {
          vw: innerWidth, vh: innerHeight,
          hud: r("#hud"),
          scroll: { w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight },
          canvas: (() => { const c = document.querySelector("#stage canvas"); return c ? { w: c.clientWidth, h: c.clientHeight } : null; })(),
        };
      });
      if (!m.canvas || m.canvas.w < m.vw - 2 || m.canvas.h < m.vh - 2) fail(`${w}x${h}: canvas does not fill viewport`);
      if (m.hud && (m.hud.l < -1 || m.hud.r > m.vw + 1)) fail(`${w}x${h}: HUD out of bounds`);
      if (m.scroll.w > m.vw + 1 || m.scroll.h > m.vh + 1) fail(`${w}x${h}: page scrolls (${m.scroll.w}x${m.scroll.h})`);
    }
    log("viewport bounds ok at 3 sizes");
    await context.close();
  }

  /* ---------- 5. rotate gate on phones ---------- */
  {
    const { context, page } = await newPage(browser, { width: 390, height: 844, mobile: true });
    await page.goto(URL, { waitUntil: "networkidle" });
    await waitState(page, () => !!window.UpstreamDebug);
    // title in portrait: no gate
    let gate = await page.evaluate(() => document.body.classList.contains("need-landscape"));
    if (gate) fail("rotate gate shown on title screen (should be gameplay-only)");
    await page.evaluate(() => window.UpstreamDebug.startLeg(0));
    await page.waitForTimeout(300);
    gate = await page.evaluate(() => document.body.classList.contains("need-landscape"));
    if (!gate) fail("rotate gate missing during portrait gameplay");
    else log("portrait gameplay → rotate gate");
    await shot(page, "upstream-rotate-gate");
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(400);
    gate = await page.evaluate(() => document.body.classList.contains("need-landscape"));
    if (gate) fail("rotate gate stuck after going landscape");
    else log("landscape clears the gate");
    // sim frozen while gated? ensure dist stops in portrait
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    const da = (await dbg(page, "window.UpstreamDebug.state")).dist;
    await page.waitForTimeout(500);
    const db = (await dbg(page, "window.UpstreamDebug.state")).dist;
    if (db !== da) fail(`sim advanced while rotate-gated (${da} → ${db})`);
    else log("sim freezes while rotate-gated");
    await context.close();
  }

  await browser.close();

  console.log("\n=== Upstream E2E ===");
  report.forEach((r) => console.log("  " + r));
  if (failures.length) {
    console.error(`\n${failures.length} FAILURE(S):`);
    failures.forEach((f) => console.error("  ✗ " + f));
    process.exit(1);
  }
  console.log("\nAll Upstream checks passed.");
}

/* legs whose signature hazard is spawned via special-case plan entries —
   all currently spawn under their own type name, so no exceptions. */
const LEG_HAS_SELF_HAZARD = {};

run().catch((e) => {
  console.error("Upstream E2E crashed:", e);
  process.exit(1);
});
