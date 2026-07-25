/**
 * Mingala Trail — end-to-end suite.
 *
 * Same shape as layout.mjs / gameplay.mjs: a plain Playwright script, no test runner.
 * Screenshots land in e2e-shots/ with a 6x- prefix.
 *
 *   npx serve . -l 3111
 *   BASE_URL=http://localhost:3111 node tests/e2e/mingala.mjs
 *
 * Most of the value here is NOT the click-through — it's the static analysis. This
 * suite is a content linter for a game whose content is 90% data:
 *   · every sprite / backdrop / portrait / dialogue / door / quest target resolves
 *   · every dialogue node is reachable and terminates; both languages present
 *   · every quest's `done` flag is actually settable by something in that chapter
 *   · the economy cannot soft-lock
 *   · every twist is winnable
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const GAME = `${BASE}/games/mingala-trail/`;
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

async function open(browser, width, height, name, mobile = false) {
  const context = await browser.newContext({
    viewport: { width, height }, screen: { width, height },
    deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile,
    ...(mobile && {
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
    }),
  });
  await context.addInitScript(() => { Math.random = () => 0.5; });
  const page = await context.newPage();
  page.on("pageerror", (e) => fail(`[${name}] page error: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") fail(`[${name}] console: ${m.text()}`); });
  return { context, page };
}

const snapshot = (page) => page.evaluate(() => {
  const s = window.TrailDebug.state(), sys = window.TrailDebug.sys();
  return {
    city: s.city && s.city.id, area: s.areaId, mode: s.mode,
    x: Math.round(s.hero.x), y: Math.round(s.hero.y), cam: Math.round(s.cam),
    hours: sys.hours(), kyat: sys.kyat(),
    target: s.target ? s.target.actor.def.id : null,
    objective: document.querySelector("#objective-text .mm")?.textContent || "",
  };
});

/**
 * Stand beside an actor (no pathfinding in-game, so the suite teleports).
 * The engine picks its interaction target on the next frame, so wait for it —
 * pressing in the same tick as the warp would act on the previous target.
 */
async function stand(page, id) {
  const found = await page.evaluate((aid) => {
    const s = window.TrailDebug.state();
    const a = s.actors.find((x) => x.def.id === aid);
    if (!a) return false;
    window.TrailDebug.warpTo(a.def.x - 55, a.def.y);
    return true;
  }, id);
  if (!found) return false;
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(50);
    const t = await page.evaluate(() => {
      const s = window.TrailDebug.state();
      return s.target ? s.target.actor.def.id : null;
    });
    if (t === id) return true;
  }
  return false;
}
const act = async (page) => { await page.keyboard.press("Space"); await page.waitForTimeout(200); };

/** Run a dialogue to its end, always taking choice `pick`. */
async function runDialogue(page, pick = 0, max = 40) {
  for (let i = 0; i < max; i++) {
    const st = await page.evaluate(() => {
      const d = window.TrailDebug.dialogue();
      if (!d) return null;
      return { typing: d.typing, choices: document.querySelectorAll("#dlg-choices .dlg-choice:not([disabled])").length };
    });
    if (!st) return true;
    if (st.typing) { await page.evaluate(() => window.TrailDebug.skipTyping()); await page.waitForTimeout(50); continue; }
    if (st.choices > 0) {
      await page.evaluate((n) => window.TrailDebug.choose(n), Math.min(pick, st.choices - 1));
      await page.waitForTimeout(150);
      continue;
    }
    await page.keyboard.press("Space");
    await page.waitForTimeout(150);
  }
  return false;
}

// ═══════════════════════════════════════════════════════════
// 1 · Hub
// ═══════════════════════════════════════════════════════════
async function testHub(browser) {
  const { context, page } = await open(browser, 1100, 800, "hub");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector(".game-card");
  const card = page.locator('a.game-card[href="./games/mingala-trail/"]');
  if ((await card.count()) !== 1) fail("hub: no live Mingala Trail card");
  else {
    const text = await card.innerText();
    if (!text.includes("Mingala Trail")) fail("hub: card missing title");
    if (!text.includes("မင်္ဂလာခရီး")) fail("hub: card missing Burmese subtitle");
  }
  await shot(page, "60-hub");
  await context.close();
}

// ═══════════════════════════════════════════════════════════
// 2 · Content linter — the big one
// ═══════════════════════════════════════════════════════════
async function testContent(browser) {
  const { context, page } = await open(browser, 1280, 800, "content");
  await page.goto(GAME, { waitUntil: "networkidle" });

  const problems = await page.evaluate(() => {
    const bad = [];
    const CITIES = window.TrailCities;
    const STORY = window.TrailStory;
    const ART = window.TrailArt;
    const TWISTS = window.TrailTwists;

    const bothLangs = (o, where) => {
      if (!o || typeof o.my !== "string" || typeof o.en !== "string" || !o.my || !o.en) {
        bad.push(`${where}: missing my/en text`);
      }
    };

    // ── every flag any effect can set, anywhere
    const settable = new Set();
    const collect = (eff) => {
      if (!eff) return;
      for (const f of [].concat(eff.learn || [])) settable.add(f);
    };
    for (const tree of Object.values(STORY.dialogue)) {
      for (const node of Object.values(tree.nodes)) {
        collect(node.effect);
        for (const c of node.choices || []) collect(c.effect);
      }
    }
    for (const c of CITIES) {
      for (const area of Object.values(c.areas)) {
        for (const t of area.things || []) collect(t.action && t.action.effect);
      }
      settable.add(`done_${c.id}`);
    }

    CITIES.forEach((city, i) => {
      const at = (s) => `${city.id}: ${s}`;
      if (city.num !== i + 1) bad.push(at(`num ${city.num} != position ${i + 1}`));
      bothLangs(city.name, at("name"));
      bothLangs(city.region, at("region"));
      bothLangs(city.intro, at("intro"));
      if (city.map.x < 4 || city.map.x > 96 || city.map.y < 4 || city.map.y > 166) {
        bad.push(at("map node off-frame"));
      }
      if (city.arrive && !STORY.dialogue[city.arrive]) bad.push(at(`arrive dialogue "${city.arrive}" missing`));

      // keepsake
      const ks = city.keepsake;
      if (!ks) bad.push(at("no keepsake"));
      else {
        if (!city.areas[ks.area]) bad.push(at(`keepsake in unknown area "${ks.area}"`));
        if (!ART.has(ks.sprite)) bad.push(at(`keepsake sprite "${ks.sprite}" missing`));
        bothLangs(ks.name, at("keepsake name"));
      }
      if (!city.areas[city.start.area]) bad.push(at(`start area "${city.start.area}" missing`));

      for (const [aid, area] of Object.entries(city.areas)) {
        const aat = (s) => `${city.id}/${aid}: ${s}`;
        bothLangs(area.name, aat("name"));
        if (!(area.w >= 1200)) bad.push(aat(`area width ${area.w} is too small`));
        if (area.walk.top >= area.walk.bottom) bad.push(aat("inverted walk band"));

        for (const L of area.layers || []) {
          if (!ART.hasBackdrop(L.backdrop)) bad.push(aat(`unknown backdrop "${L.backdrop}"`));
        }
        for (const a of area.ambient || []) {
          if (!ART.hasAmbient(a.sprite)) bad.push(aat(`unknown ambient "${a.sprite}"`));
        }
        for (const p of area.props || []) {
          if (!ART.has(p.sprite)) bad.push(aat(`unknown prop sprite "${p.sprite}"`));
          if (p.x < 0 || p.x > area.w) bad.push(aat(`prop "${p.sprite}" outside the area`));
          // no pathfinding: nothing solid may block the front lane
          if (p.solid && p.y > area.walk.bottom - 40) {
            bad.push(aat(`solid "${p.sprite}" at y=${p.y} blocks the walking lane`));
          }
        }
        for (const n of area.npcs || []) {
          if (!ART.hasNpc(n.sprite)) bad.push(aat(`unknown npc sprite "${n.sprite}"`));
          if (!STORY.dialogue[n.dialogue]) bad.push(aat(`npc "${n.id}" → missing dialogue "${n.dialogue}"`));
          if (!STORY.people[n.id]) bad.push(aat(`npc "${n.id}" has no people[] entry`));
          else if (!ART.hasPortrait(STORY.people[n.id].portrait)) {
            bad.push(aat(`npc "${n.id}" portrait "${STORY.people[n.id].portrait}" missing`));
          }
          if (n.x < 0 || n.x > area.w) bad.push(aat(`npc "${n.id}" outside the area`));
        }
        for (const d of area.doors || []) {
          if (!city.areas[d.to]) bad.push(aat(`door "${d.id}" → unknown area "${d.to}"`));
        }
        for (const t of area.things || []) {
          if (!ART.has(t.sprite)) bad.push(aat(`thing "${t.id}" sprite "${t.sprite}" missing`));
          if (t.verb) bothLangs(t.verb, aat(`thing "${t.id}" verb`));
          const a = t.action || {};
          if (a.twist && !TWISTS[a.twist]) bad.push(aat(`thing "${t.id}" → unknown twist "${a.twist}"`));
          if (a.dialogue && !STORY.dialogue[a.dialogue]) bad.push(aat(`thing "${t.id}" → unknown dialogue "${a.dialogue}"`));
          if (a.letter && !STORY.letters[a.letter]) bad.push(aat(`thing "${t.id}" → unknown letter "${a.letter}"`));
        }
      }

      // ── letters
      const L = STORY.letters[city.id];
      if (!L) bad.push(at("no letter"));
      else {
        bothLangs(L.to, at("letter.to"));
        if (!Array.isArray(L.body) || !L.body.length) bad.push(at("letter has no body"));
        (L.body || []).forEach((p, k) => bothLangs(p, at(`letter body[${k}]`)));
        if (L.fragment) bothLangs(L.fragment, at("letter fragment"));
      }

      // ── quests: every `done` flag must be settable by something
      const Q = STORY.quests[city.id];
      if (!Q || !Q.main) bad.push(at("no main quest"));
      else {
        for (const quest of [Q.main, ...(Q.side || [])]) {
          bothLangs(quest.title, at(`quest "${quest.title && quest.title.en}" title`));
          for (const st of quest.steps) {
            bothLangs(st.objective, at("quest step objective"));
            const flags = [].concat(st.done).filter((f) => typeof f === "string").map((f) => f.replace(/^!/, ""));
            for (const f of flags) {
              if (!settable.has(f)) bad.push(at(`quest step needs flag "${f}" that nothing ever sets`));
            }
          }
        }
      }
    });

    // ── dialogue graphs
    for (const [tid, tree] of Object.entries(STORY.dialogue)) {
      const ids = Object.keys(tree.nodes);
      const entries = [].concat(tree.start).map((e) => (typeof e === "string" ? e : e.to));
      for (const e of entries) {
        if (!tree.nodes[e]) bad.push(`dialogue ${tid}: start "${e}" is not a node`);
      }
      // reachability
      const seen = new Set();
      const queue = entries.filter((e) => tree.nodes[e]);
      while (queue.length) {
        const id = queue.pop();
        if (seen.has(id)) continue;
        seen.add(id);
        const n = tree.nodes[id];
        const outs = [n.to, ...(n.choices || []).map((c) => c.to)].filter(Boolean);
        for (const o of outs) {
          if (o === "end") continue;
          if (!tree.nodes[o]) { bad.push(`dialogue ${tid}: node "${id}" → unknown node "${o}"`); continue; }
          queue.push(o);
        }
      }
      for (const id of ids) if (!seen.has(id)) bad.push(`dialogue ${tid}: node "${id}" is unreachable`);

      for (const [id, n] of Object.entries(tree.nodes)) {
        bothLangs(n.text, `dialogue ${tid}/${id}`);
        if (n.who && !STORY.people[n.who]) bad.push(`dialogue ${tid}/${id}: unknown speaker "${n.who}"`);
        if (n.letter && !STORY.letters[n.letter]) bad.push(`dialogue ${tid}/${id}: unknown letter "${n.letter}"`);
        const hasChoices = (n.choices || []).length > 0;
        if (!hasChoices && !n.to) bad.push(`dialogue ${tid}/${id}: dead end (no choices and no "to")`);
        (n.choices || []).forEach((c, k) => {
          bothLangs(c.text, `dialogue ${tid}/${id} choice[${k}]`);
          if (!c.to) bad.push(`dialogue ${tid}/${id}: choice[${k}] has no target`);
        });
      }
    }

    // ── people referenced but never drawable
    for (const [pid, p] of Object.entries(STORY.people)) {
      bothLangs(p.name, `people/${pid} name`);
      if (!ART.hasPortrait(p.portrait)) bad.push(`people/${pid}: portrait "${p.portrait}" missing`);
    }

    return bad;
  });

  problems.forEach(fail);
  log(`content: ${problems.length ? problems.length + " problems" : "every reference resolves"}`);

  // every area of every city builds without throwing
  let areas = 0;
  const cityCount = await page.evaluate(() => window.TrailCities.length);
  for (let i = 0; i < cityCount; i++) {
    const ids = await page.evaluate((n) => {
      window.TrailDebug.unlockAll();
      window.TrailDebug.goCity(n);
      return Object.keys(window.TrailCities[n].areas);
    }, i);
    for (const areaId of ids) {
      await page.evaluate((a) => window.TrailDebug.goArea(a, 300), areaId);
      await page.waitForTimeout(70);
      const built = await page.evaluate(() => ({
        id: window.TrailDebug.state().city.id,
        area: window.TrailDebug.state().areaId,
        layers: document.querySelectorAll("#world .player-layer").length,
        hero: !!document.querySelector("#hero"),
        actors: window.TrailDebug.state().actors.length,
      }));
      if (!built.hero) fail(`content: ${built.id}/${built.area} rendered no hero`);
      if (built.layers < 3) fail(`content: ${built.id}/${built.area} has only ${built.layers} layers`);
      areas++;
    }
  }
  log(`content: ${areas} areas across ${cityCount} cities all build`);
  await context.close();
}

// ═══════════════════════════════════════════════════════════
// 3 · Economy can never soft-lock
// ═══════════════════════════════════════════════════════════
async function testEconomy(browser) {
  const { context, page } = await open(browser, 1280, 800, "economy");
  await page.goto(GAME, { waitUntil: "networkidle" });

  const res = await page.evaluate(() => {
    const SYS = window.TrailSystems, MAP = window.TrailMap;
    const free = MAP.TRANSPORT.filter((t) => t.kyat === 0);
    // worst case: broke, and every leg still has to be affordable somehow
    SYS.reset();
    SYS.restore(Object.assign(SYS.state(), { kyat: 0 }));
    const brokeCanTravel = MAP.TRANSPORT.some((t) => SYS.canAfford(t.kyat));
    // and running the clock out must not end anything
    let slept = 0;
    for (let i = 0; i < 40; i++) if (SYS.spendHours(3).slept) slept++;
    return {
      freeOptions: free.length,
      cheapest: MAP.cheapestFare(),
      brokeCanTravel,
      hoursAfter: SYS.hours(),
      kyatAfter: SYS.kyat(),
      slept,
    };
  });

  if (res.freeOptions < 1) fail("economy: no free transport — a broke player is stranded");
  if (res.cheapest !== 0) fail(`economy: cheapest fare is ${res.cheapest}, should be 0`);
  if (!res.brokeCanTravel) fail("economy: a player with 0 kyat cannot travel at all");
  if (!(res.hoursAfter > 0)) fail("economy: hours went non-positive instead of rolling to a new day");
  if (res.kyatAfter < 0) fail("economy: kyat went negative");
  if (res.slept < 1) fail("economy: running the clock out never triggered a sleep");
  log(`economy: free option present, broke player can still travel, ${res.slept} sleeps survived`);
  await context.close();
}

// ═══════════════════════════════════════════════════════════
// 3b · Every chapter is actually completable
//
// Simulates a thorough player: repeatedly does everything currently available —
// runs every reachable dialogue branch, triggers every visible thing, wins every
// twist — until no new flag appears. Then asserts the main quest is finished.
// This is what catches a chapter gated behind a branch you can never reach.
// ═══════════════════════════════════════════════════════════
async function testCompletable(browser) {
  const { context, page } = await open(browser, 1280, 800, "completable");
  await page.goto(GAME, { waitUntil: "networkidle" });

  const results = await page.evaluate(() => {
    const SYS = window.TrailSystems, STORY = window.TrailStory, CITIES = window.TrailCities;
    const out = [];

    for (const city of CITIES) {
      SYS.reset();
      SYS.restore(Object.assign(SYS.state(), { kyat: 999999 }));   // ignore money here
      const seenNodes = new Set();

      // Walk one dialogue tree, taking every branch whose condition currently holds.
      const runTree = (treeId) => {
        const tree = STORY.dialogue[treeId];
        if (!tree) return;
        const entries = [].concat(tree.start);
        let startId = null;
        for (const e of entries) {
          if (typeof e === "string") { startId = e; break; }
          if (SYS.test(e.if)) { startId = e.to; break; }
        }
        const walk = (id, depth) => {
          if (!id || id === "end" || depth > 24) return;
          const node = tree.nodes[id];
          if (!node) return;
          const key = `${treeId}/${id}`;
          if (seenNodes.has(key)) return;
          seenNodes.add(key);
          if (node.effect) SYS.apply(node.effect);
          const choices = (node.choices || []).filter((c) => SYS.test(c.if));
          if (choices.length) {
            for (const c of choices) {
              if (c.effect) SYS.apply(c.effect);
              walk(c.to, depth + 1);
            }
          } else {
            walk(node.to, depth + 1);
          }
        };
        walk(startId, 0);
      };

      let pass = 0;
      let before = "";
      while (pass < 12) {
        pass++;
        if (city.arrive) runTree(city.arrive);
        for (const area of Object.values(city.areas)) {
          for (const n of area.npcs || []) {
            if (n.if && !SYS.test(n.if)) continue;
            runTree(n.dialogue);
          }
          for (const t of area.things || []) {
            if (t.if && !SYS.test(t.if)) continue;
            const a = t.action || {};
            if (a.effect) SYS.apply(a.effect);           // twists are assumed won
            if (a.dialogue) runTree(a.dialogue);
          }
        }
        const now = Object.keys(SYS.state().flags).sort().join(",");
        if (now === before) break;
        before = now;
        seenNodes.clear();      // conditions changed — earlier branches may reopen
      }

      const Q = STORY.quests[city.id];
      const mainDone = SYS.questDone(Q.main);
      const stuck = mainDone ? null : SYS.activeStep(Q.main);
      out.push({
        id: city.id,
        done: mainDone,
        passes: pass,
        stuckOn: stuck ? stuck.objective.en : null,
        needs: stuck ? JSON.stringify(stuck.done) : null,
        letter: SYS.journal().letters.includes(city.id),
        side: (Q.side || []).map((q) => SYS.questDone(q)),
      });
    }
    SYS.reset();
    return out;
  });

  for (const r of results) {
    if (!r.done) fail(`completable: ${r.id} cannot be finished — stuck on "${r.stuckOn}" (needs ${r.needs})`);
    else {
      const sideDone = r.side.filter(Boolean).length;
      log(`chapter ${r.id}: completable in ${r.passes} passes · letter read · ${sideDone}/${r.side.length} side quests reachable`);
    }
  }
  await context.close();
}

// ═══════════════════════════════════════════════════════════
// 4 · Every twist winnable
// ═══════════════════════════════════════════════════════════
async function testTwists(browser) {
  const { context, page } = await open(browser, 1280, 800, "twists");
  await page.goto(GAME, { waitUntil: "networkidle" });

  const results = await page.evaluate(() => {
    const DT = 1 / 60;
    function run(tid, strategy, maxFrames = 60 * 90) {
      const T = window.TrailTwists[tid];
      const stage = document.querySelector("#twist-stage");
      stage.innerHTML = "";
      let finished = null;
      const ctx = {
        stage, city: window.TrailCities[0],
        sfx: { good() {}, bad() {}, win() {}, step() {} },
        meter() {}, say() {}, done(ok) { if (finished === null) finished = ok; },
      };
      T.start(ctx);
      let f = 0;
      for (; f < maxFrames && finished === null; f++) { strategy(T, f, stage); T.update?.(DT); }
      T.cleanup?.();
      stage.innerHTML = "";
      return { tid, won: finished === true, secs: +(f * DT).toFixed(1) };
    }
    return [
      run("traffic", (T) => {
        const next = T.lanes.filter((l) => l.y < T.y - 6).sort((a, b) => b.y - a.y)[0];
        if (!next) return T.move(0, -1);
        let clear = true;
        for (let t = 0; t <= 0.5; t += 0.05) {
          for (const car of next.cars) {
            const p = (car.p + next.speed * t) % 100;
            const cx = next.dir > 0 ? p : 100 - p;
            if (Math.abs(cx - T.x) < 15) clear = false;
          }
        }
        T.move(0, clear ? -1 : 0);
      }),
      run("balance", (T) => T.move(T.tilt > 0 ? 1 : -1)),
      run("planks", (T, f) => { if (T.zones.some(([a, b]) => T.p >= a + 2 && T.p <= b - 2) && f % 6 === 0) T.press(); }),
      run("spot", (T, f, st) => { if (!(f % 10)) st.querySelector(`.tw-choice[data-slot="${T.answer}"]`)?.click(); }),
      run("rowing", (T) => { if (T.beats.some((b) => !b.dead && Math.abs(b.x - 76) < 4)) T.press(); }),
      run("climb", (T) => { if (T.stamina > 0.35) T.press(); else if (T.stamina < 0.9) T.release(); }),
      run("flowers", (T, f, st) => { if (!(f % 8)) st.querySelector(".tw-bloom.red:not([disabled])")?.click(); }),
      run("fog", (T, f, st) => { if (!(f % 10)) st.querySelector(`.tw-fork.${T.safe}`)?.click(); }),
      run("cave", (T) => { T.move(Math.sign(T.kx - T.x), Math.sign(T.ky - T.y)); if (T.near) T.press(); }),
      run("tide", (T) => { if ((Math.sin(T.phase) + 1) / 2 <= 0.5) T.press(); else T.release(); }),
    ];
  });

  const known = await page.evaluate(() => Object.keys(window.TrailTwists).length);
  if (results.length !== known) fail(`twists: ${known} registered, ${results.length} exercised`);
  for (const r of results) {
    if (!r.won) fail(`twists: "${r.tid}" not winnable in 90s of optimal play`);
    else log(`twist ${r.tid}: won in ${r.secs}s`);
  }
  await context.close();
}

// ═══════════════════════════════════════════════════════════
// 5 · Play chapter one on a phone, for real
// ═══════════════════════════════════════════════════════════
async function testChapter(browser) {
  const { context, page } = await open(browser, 844, 390, "chapter", true);
  await page.goto(GAME, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("mingala-trail-v2"));
  await page.reload({ waitUntil: "networkidle" });

  await page.tap("#btn-start");
  await page.waitForTimeout(350);
  if ((await page.locator(".mm-node").count()) !== 10) fail("chapter: expected 10 map nodes");
  if ((await page.locator(".mm-node.unlocked").count()) !== 1) fail("chapter: more than one city unlocked on a fresh save");
  await shot(page, "61-map");

  await page.tap('.mm-node[data-city="yangon"]');
  await page.waitForTimeout(250);
  if (!(await page.locator("#intro-overlay").isVisible())) fail("chapter: intro did not open");
  await shot(page, "62-intro");
  await page.tap("#btn-intro-go");
  await page.waitForTimeout(900);
  await runDialogue(page);                     // arrival narration
  await shot(page, "63-scene");

  const start = await snapshot(page);
  if (start.city !== "yangon") fail(`chapter: expected yangon, got ${start.city}`);
  if (start.hours !== 12) fail(`chapter: expected a full day, got ${start.hours}h`);

  // -- walking scrolls the camera
  for (let i = 0; i < 3; i++) {
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(600);
    await page.keyboard.up("ArrowRight");
  }
  const walked = await snapshot(page);
  if (walked.x - start.x < 150) fail(`chapter: hero barely moved (${start.x} → ${walked.x})`);
  if (walked.cam <= 0) fail("chapter: camera never scrolled on a 3400-unit street");

  // -- solid scenery blocks
  await page.evaluate(() => window.TrailDebug.warpTo(760, 470));
  await page.keyboard.down("ArrowUp"); await page.waitForTimeout(600); await page.keyboard.up("ArrowUp");
  if ((await snapshot(page)).y < 455) fail("chapter: walked through the solid stall");

  // -- dialogue with a real choice
  if (!(await stand(page, "ko-myint-swe"))) fail("chapter: tea-shop owner missing");
  await act(page);
  if (!(await page.locator("#dialogue").isVisible())) fail("chapter: dialogue did not open");
  if (!(await page.locator("#dlg-portrait svg").count())) fail("chapter: dialogue has no portrait");
  await page.evaluate(() => window.TrailDebug.skipTyping());
  await page.waitForTimeout(150);
  if ((await page.locator("#dlg-choices .dlg-choice").count()) < 2) fail("chapter: expected multiple dialogue choices");
  await shot(page, "64-dialogue");
  await runDialogue(page, 0);
  const afterTalk = await snapshot(page);
  if (afterTalk.objective === start.objective) fail("chapter: objective did not advance after learning where the press is");

  // -- interiors
  if (!(await stand(page, "d-teashop"))) fail("chapter: tea shop door missing");
  await act(page); await page.waitForTimeout(600);
  if ((await snapshot(page)).area !== "teashop") fail("chapter: door did not lead into the tea shop");
  await shot(page, "65-interior");
  if (!(await stand(page, "d-out-teashop"))) fail("chapter: no way back out of the tea shop");
  await act(page); await page.waitForTimeout(600);
  if ((await snapshot(page)).area !== "street") fail("chapter: could not leave the tea shop");

  // -- twist costs an hour
  const beforeTwist = await snapshot(page);
  if (!(await stand(page, "crossing"))) fail("chapter: crossing not available after learning the address");
  await act(page); await page.waitForTimeout(450);
  if (!(await page.locator("#twist-overlay").isVisible())) fail("chapter: twist did not open");
  await shot(page, "66-twist");
  await page.evaluate(() => window.TrailDebug.completeTwist());
  await page.waitForTimeout(350);
  const afterTwist = await snapshot(page);
  if (afterTwist.hours >= beforeTwist.hours) fail("chapter: the twist cost no time");

  // -- deliver, read, finish
  if (!(await stand(page, "d-press"))) fail("chapter: press door did not open after crossing");
  await act(page); await page.waitForTimeout(600);
  if ((await snapshot(page)).area !== "press") fail("chapter: did not reach the press");
  if (!(await stand(page, "u-sein-hla"))) fail("chapter: recipient missing");
  await act(page);
  await runDialogue(page);
  if (!(await page.locator("#letter-overlay").isVisible())) fail("chapter: the letter never opened");
  const letterText = await page.locator("#letter-body").innerText();
  if (letterText.length < 120) fail("chapter: letter body looks empty");
  await shot(page, "67-letter");
  await page.tap("#btn-letter-close");
  await page.waitForTimeout(800);
  if (!(await page.locator("#end-overlay").isVisible())) fail("chapter: chapter-complete never appeared");
  await shot(page, "68-chapter-end");

  // -- journal + persistence
  const j = await page.evaluate(() => window.TrailDebug.sys().journal());
  if (!j.letters.includes("yangon")) fail("chapter: letter not recorded in the route book");
  if (j.people.length < 2) fail("chapter: nobody recorded in the route book");

  await page.tap("#btn-end-menu");
  await page.waitForTimeout(700);
  await page.reload({ waitUntil: "networkidle" });
  await page.tap("#btn-continue");
  await page.waitForTimeout(350);
  if ((await page.locator(".mm-node.unlocked").count()) < 2) fail("chapter: unlock did not survive a reload");
  if ((await page.locator(".mm-node.cleared").count()) !== 1) fail("chapter: postmark did not survive a reload");
  await shot(page, "69-map-after");
  await context.close();
}

// ═══════════════════════════════════════════════════════════
// 5b · Route book
//
// Every tab must render inside the viewport. This exists because the journal's
// `.jentry.keepsake` once collided with the SCENE's `.keepsake` rule and inherited
// position:absolute + a translate, throwing the list across the screen. Generic
// class names are the hazard; this catches the whole family of it.
// ═══════════════════════════════════════════════════════════
async function testJournal(browser) {
  const { context, page } = await open(browser, 1100, 700, "journal");
  await page.goto(GAME, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const S = window.TrailSystems;
    S.reset();
    S.record("letters", "yangon"); S.record("fragments", "yangon");
    S.record("people", "u-ba-nyein"); S.record("people", "u-sein-hla");
    S.record("keepsakes", "ticket");
    window.TrailDebug.unlockAll();
  });
  await page.click("#btn-start");
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const S = window.TrailSystems;
    S.record("letters", "yangon"); S.record("fragments", "yangon");
    S.record("people", "u-ba-nyein"); S.record("people", "u-sein-hla");
    S.record("keepsakes", "ticket");
  });
  await page.click("#btn-map-journal");
  await page.waitForTimeout(300);
  if (!(await page.locator("#journal-screen.active").count())) fail("journal: did not open");

  for (const tab of ["letters", "people", "keepsakes", "fragments"]) {
    await page.click(`.jtab[data-tab="${tab}"]`);
    await page.waitForTimeout(200);
    const m = await page.evaluate(() => {
      const vw = innerWidth, vh = innerHeight;
      const bad = [];
      document.querySelectorAll("#journal-body .jentry").forEach((e, i) => {
        const r = e.getBoundingClientRect();
        const pos = getComputedStyle(e).position;
        if (pos === "absolute" || pos === "fixed") bad.push(`entry ${i} is ${pos} (a scene rule leaked in)`);
        else if (r.left < -1 || r.right > vw + 1 || r.width > vw + 1 || r.height > vh) {
          bad.push(`entry ${i} out of bounds: ${JSON.stringify({ l: r.left | 0, r: r.right | 0, w: r.width | 0, h: r.height | 0 })}`);
        }
      });
      return { count: document.querySelectorAll("#journal-body .jentry").length, bad,
               scrollW: document.documentElement.scrollWidth, vw };
    });
    if (!m.count) fail(`journal/${tab}: rendered no entries`);
    m.bad.forEach((b) => fail(`journal/${tab}: ${b}`));
    if (m.scrollW > m.vw + 1) fail(`journal/${tab}: page scrolls horizontally`);
    if (tab === "keepsakes") await shot(page, "6c-journal-keepsakes");
    log(`journal/${tab}: ${m.count} entries, all in bounds`);
  }
  await context.close();
}

// ═══════════════════════════════════════════════════════════
// 6 · Portrait rotate gate
// ═══════════════════════════════════════════════════════════
async function testRotate(browser) {
  const { context, page } = await open(browser, 390, 844, "rotate", true);
  await page.goto(GAME, { waitUntil: "networkidle" });
  const gated = () => page.evaluate(() => document.body.classList.contains("need-landscape"));

  if (await gated()) fail("rotate: gate engaged on the title screen");
  await page.tap("#btn-start");
  await page.waitForTimeout(250);
  if (await gated()) fail("rotate: gate engaged on the map (menus must work in portrait)");

  await page.tap('.mm-node[data-city="yangon"]');
  await page.waitForTimeout(200);
  await page.tap("#btn-intro-go");
  await page.waitForTimeout(700);
  if (!(await gated())) fail("rotate: gate did NOT engage during a chapter in portrait");
  await shot(page, "6a-portrait-gate");

  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(500);
  if (await gated()) fail("rotate: gate stuck on after rotating to landscape");
  const w = await page.evaluate(() => document.querySelector("#scene").getBoundingClientRect().width);
  if (w < 300) fail(`rotate: scene did not reflow (w=${w})`);
  await context.close();
}

// ═══════════════════════════════════════════════════════════
// 7 · Viewport bounds
// ═══════════════════════════════════════════════════════════
async function testViewports(browser) {
  const sizes = [
    [844, 390, "iphone-13-land"], [667, 375, "iphone-8-land"], [568, 320, "iphone-se-land"],
    [740, 360, "android-small-land"], [1024, 768, "tablet-land"], [1280, 800, "desktop"],
  ];
  for (const [w, h, name] of sizes) {
    const { context, page } = await open(browser, w, h, name, w < 900);
    await page.goto(GAME, { waitUntil: "networkidle" });
    await page.evaluate(() => { window.TrailDebug.unlockAll(); window.TrailDebug.goCity(0); });
    await page.waitForTimeout(400);

    const m = await page.evaluate(() => {
      const rect = (sel) => {
        const e = document.querySelector(sel);
        if (!e) return null;
        const r = e.getBoundingClientRect();
        return { l: +r.left.toFixed(1), t: +r.top.toFixed(1), r: +r.right.toFixed(1), b: +r.bottom.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
      };
      return {
        vw: innerWidth, vh: innerHeight,
        scene: rect("#scene"), stage: rect("#stage"), hud: rect(".hud"),
        dpad: rect("#dpad"), action: rect("#btn-action"),
        scroll: { sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight },
        u: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--u")),
      };
    });

    if (m.scroll.sw > m.vw + 1) fail(`[${name}] page scrolls horizontally`);
    if (m.scroll.sh > m.vh + 1) fail(`[${name}] page scrolls vertically`);
    if (!(m.u > 0)) fail(`[${name}] --u not published`);
    for (const [k, r] of Object.entries({ scene: m.scene, dpad: m.dpad, action: m.action, hud: m.hud })) {
      if (!r) { fail(`[${name}] missing ${k}`); continue; }
      if (r.l < -1 || r.t < -1 || r.r > m.vw + 1 || r.b > m.vh + 1) fail(`[${name}] ${k} is clipped: ${JSON.stringify(r)}`);
    }
    if (m.scene && m.stage && (m.scene.t < m.stage.t - 1 || m.scene.b > m.stage.b + 1)) {
      fail(`[${name}] scene escapes the stage box`);
    }
    if (m.scene && m.scene.w < m.vw * 0.6) fail(`[${name}] scene only uses ${(m.scene.w / m.vw * 100).toFixed(0)}% of the width`);
    if (["iphone-se-land", "desktop"].includes(name)) await shot(page, `6b-vp-${name}`);
    log(`[${name}] scene ${m.scene.w}x${m.scene.h} u=${m.u.toFixed(3)}`);
    await context.close();
  }
}

// ═══════════════════════════════════════════════════════════
const browser = await chromium.launch();
try {
  await testHub(browser);
  await testContent(browser);
  await testEconomy(browser);
  await testCompletable(browser);
  await testTwists(browser);
  await testChapter(browser);
  await testJournal(browser);
  await testRotate(browser);
  await testViewports(browser);
} catch (e) {
  fail(`suite crashed: ${e.stack || e.message}`);
} finally {
  await browser.close();
}

console.log("=== MINGALA TRAIL E2E ===");
for (const line of report) console.log(line);
if (failures.length) {
  console.log("\n=== FAILURES ===");
  for (const f of failures) console.log("✗ " + f);
} else {
  console.log("\nAll checks passed.");
}
process.exit(failures.length ? 1 : 0);
