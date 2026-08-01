/* E2E for Tea for Two (games/tea-for-two)
   Part lint, part playthrough — checks the game-theory data is sound,
   every lesson is playable to completion, badges persist, and the
   tournament result matches the lesson (nice-but-retaliatory wins). */
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const URL = `${BASE}/games/tea-for-two/`;
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

async function newPage(browser, { width = 1280, height = 900, mobile = false } = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    screen: { width, height },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => fail(`page error: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") fail(`console error: ${m.text()}`); });
  return { context, page };
}

async function run() {
  const browser = await chromium.launch();

  /* ---------- 1. data lint ---------- */
  {
    const { page } = await newPage(browser);
    await page.goto(URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const lint = await page.evaluate(() => {
      const issues = [];
      // every lesson exists and has a mount
      for (const id of ["l1", "l2", "l3", "l4"]) {
        if (!LESSONS[id] || typeof LESSONS[id].mount !== "function") issues.push(`lesson ${id} missing mount`);
      }
      // theory has 10 cards with all fields
      if (THEORY.length !== 10) issues.push(`theory length ${THEORY.length}`);
      for (const t of THEORY) {
        if (!t.mm || !t.en || !t.body || !t.take || !t.emoji) issues.push(`theory card incomplete: ${t.en}`);
      }
      // quizzes cover all lessons, each with one correct answer
      for (const id of ["l1", "l2", "l3", "l4"]) {
        const q = QUIZZES[id];
        if (!q || q.options.filter((o) => o.ok).length !== 1) issues.push(`quiz ${id} must have exactly one correct option`);
      }
      // every character referenced by AI exists in CHARS
      for (const id of Object.keys(AI)) if (!CHARS[id]) issues.push(`missing portrait for ${id}`);
      // tournament determinism: same seed → same order
      const a = tournament(42).map((x) => x.short).join(",");
      const b = tournament(42).map((x) => x.short).join(",");
      if (a !== b) issues.push("tournament not deterministic");
      // allD must NOT win the tournament (the lesson's whole point)
      const winner = tournament(42)[0];
      if (winner.kind === "allD") issues.push("always-defect must not win the tournament");
      if (tournament(42).findIndex((x) => x.kind === "allD") < 3) issues.push("always-defect should be mid/lower table");
      // payoff sanity: fair/fair beats disc/disc for both
      const [ff, dd] = [PD.payoff("fair", "fair"), PD.payoff("disc", "disc")];
      if (ff[0] <= dd[0] || ff[1] <= dd[1]) issues.push("payoff matrix should reward mutual cooperation");
      return issues;
    });
    if (lint.length) fail("lint: " + lint.join(" | "));
    log("lint ok · theory 10 cards · lessons 4 · quizzes 4");
    await page.close();
  }

  /* ---------- 2. full lesson playthrough ---------- */
  {
    const { page } = await newPage(browser);
    await page.goto(URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    if ((await page.locator(".lesson-card").count()) !== 5) fail("start screen: expected 5 lesson cards");
    await shot(page, "tft-01-start");

    // ---- Lesson 1: The Price War ----
    await page.locator('.lesson-card[data-lesson="l1"]').click();
    await page.waitForTimeout(400);
    await page.locator(".choice").first().click(); // fair
    await page.waitForTimeout(300);
    const reveal = (await page.locator(".reveal").textContent()).replace(/\s+/g, " ");
    if (!reveal.includes("0") || !reveal.includes("50")) fail("l1: fair-vs-discount should reveal 0 vs 50");
    await shot(page, "tft-02-l1-reveal");
    await page.locator(".btn.next").click();
    await page.waitForTimeout(300);
    if (!(await page.locator(".matrix").count())) fail("l1: payoff matrix missing");
    await shot(page, "tft-03-l1-matrix");
    await page.locator(".btn.next").click();
    await page.waitForTimeout(200);
    await page.locator("[data-explore]").first().click();
    await page.waitForTimeout(200);
    if (!(await page.locator("#explore-note .note-mm").textContent())) fail("l1: explorer note missing");
    await page.locator(".quiz-start").click();
    await page.waitForTimeout(200);
    await page.locator(".quiz-opt").nth(1).click(); // Nash = both discount
    await page.waitForTimeout(200);
    if (!(await page.locator("#btn-quiz-next").isVisible())) fail("l1: quiz feedback missing");
    await page.locator("#btn-quiz-next").click();
    await page.waitForTimeout(300);
    if (!(await page.locator(".shelf-item.earned").count())) fail("l1: badge not earned");
    log("lesson 1 playthrough ok");

    // ---- Lesson 2: The Week, vs Always Fair Daw Khin Ma ----
    await page.locator("#btn-lesson-back").click();
    await page.waitForTimeout(300);
    await page.locator('.lesson-card[data-lesson="l2"]').click();
    await page.waitForTimeout(300);
    await shot(page, "tft-04-l2-rivals");
    await page.locator('.rival-card[data-rival="khinma"]').click();
    await page.waitForTimeout(300);
    await page.locator(".btn.next").click();
    await page.waitForTimeout(200);
    for (let d = 0; d < 10; d++) {
      await page.locator(".choice").first().click(); // fair every day
      await page.waitForTimeout(50);
      await page.locator(".btn.next").click();
      await page.waitForTimeout(40);
    }
    const l2 = (await page.locator(".week-result").textContent()).replace(/\s+/g, " ");
    if (!l2.includes("300") || !l2.includes("300")) fail("l2: all-fair vs allC should be 300/300");
    log("lesson 2 playthrough ok (300/300 vs always-fair)");

    // tournament from the duel screen
    await page.locator(".btn", { hasText: "AI တိုက်ပွဲ" }).click();
    await page.waitForTimeout(300);
    await page.locator('.t-card[data-t="tft"]').click();
    await page.waitForTimeout(100);
    await page.locator('.t-card[data-t="allD"]').click();
    await page.waitForTimeout(400);
    await page.locator(".btn", { hasText: "Full tournament" }).click();
    await page.waitForTimeout(400);
    const order = await page.locator(".trow-name").allTextContents();
    if (!order[0].includes("Generous")) fail(`l2: expected a generous/tit-for-tat strategy on top, got ${order[0]}`);
    log(`tournament winner: ${order[0]} · always-defect at rank ${order.findIndex((n) => n.includes("Always Defect")) + 1}/8`);
    await shot(page, "tft-05-tournament");
    await page.locator(".btn", { hasText: "Finish" }).click();
    await page.waitForTimeout(300);
    await page.locator("#btn-lesson-back").click();
    await page.waitForTimeout(200);

    // ---- Lesson 3: The Shared Pond, moderate play ----
    await page.locator('.lesson-card[data-lesson="l3"]').click();
    await page.waitForTimeout(300);
    await page.locator(".btn.next").click();
    await page.waitForTimeout(200);
    for (let d = 0; d < 10; d++) {
      await page.locator(".choice").nth(1).click(); // 2 fish
      await page.waitForTimeout(50);
      await page.locator(".btn.next").click();
      await page.waitForTimeout(40);
    }
    const l3 = (await page.locator(".week-result").textContent()).replace(/\s+/g, " ");
    if (!l3.includes("20")) fail("l3: moderate play should yield 20 fish");
    const pondMeter = await page.locator(".pm-fill").getAttribute("style");
    if (!pondMeter || !pondMeter.includes("50%")) fail(`l3: moderate pond should end ~50%, got ${pondMeter}`);
    log("lesson 3 playthrough ok (20 fish, pond at 10/20)");
    await shot(page, "tft-06-l3-results");
    await page.locator(".quiz-start").click();
    await page.waitForTimeout(200);
    await page.locator(".quiz-opt").nth(1).click();
    await page.locator("#btn-quiz-next").click();
    await page.waitForTimeout(300);
    await page.locator("#btn-lesson-back").click();
    await page.waitForTimeout(200);

    // ---- Lesson 4: The Split ----
    await page.locator('.lesson-card[data-lesson="l4"]').click();
    await page.waitForTimeout(300);
    await page.locator(".btn.next").click();
    await page.waitForTimeout(200);
    await shot(page, "tft-07-l4-round");
    const plan = [
      ["accept", 0],   // R1 khinma 5-5 accept
      ["split5", 0],   // R2 you propose 5-5 to utu
      ["reject", 1],   // R3 utu 9-1 reject
      ["split7", 2],   // R4 you propose 7-3 to usein
      ["accept", 0],   // R5 usein 6-4 accept
      ["split5", 0],   // R6 you propose 5-5 to khinma
    ];
    for (const [kind, idx] of plan) {
      if (kind === "accept") await page.locator(".choice").first().click();
      else if (kind === "reject") await page.locator(".choice").nth(1).click();
      else await page.locator(".choice").nth(idx).click();
      await page.waitForTimeout(120);
      await page.locator(".btn.next").click();
      await page.waitForTimeout(120);
    }
    const l4 = (await page.locator(".week-result").textContent()).replace(/\s+/g, " ");
    if (!l4.includes("26")) fail(`l4: expected 26 coins for this line, got ${l4}`);
    log("lesson 4 playthrough ok (26 coins)");
    await shot(page, "tft-08-l4-results");
    await page.locator(".quiz-start").click();
    await page.waitForTimeout(200);
    await page.locator(".quiz-opt").nth(1).click();
    await page.locator("#btn-quiz-next").click();
    await page.waitForTimeout(300);

    // ---- badges persist across reload ----
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const earned = await page.locator(".shelf-item.earned").count();
    if (earned !== 4) fail(`badges should persist (4/4), got ${earned}`);
    log(`badges persist: ${earned}/4`);

    // ---- theory room ----
    await page.locator('.lesson-card[data-lesson="theory"]').click();
    await page.waitForTimeout(300);
    const th = await page.locator(".theory-card").count();
    if (th !== 10) fail(`theory room: expected 10 cards, got ${th}`);
    await page.locator(".theory-head").nth(4).click();
    await page.waitForTimeout(200);
    if (!(await page.locator(".theory-card.open").count())) fail("theory card did not open");
    await shot(page, "tft-09-theory");
    await page.close();
  }

  /* ---------- 3. mobile portrait ---------- */
  {
    const { page } = await newPage(browser, { width: 390, height: 844, mobile: true });
    await page.goto(URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2);
    if (overflow) fail("mobile: horizontal overflow on start screen");
    await page.locator('.lesson-card[data-lesson="l1"]').tap();
    await page.waitForTimeout(300);
    await page.locator(".choice").first().tap();
    await page.waitForTimeout(300);
    const mReveal = (await page.locator(".reveal").textContent()).replace(/\s+/g, " ");
    if (!mReveal.includes("0")) fail("mobile: lesson 1 reveal broken");
    await shot(page, "tft-10-mobile-portrait");
    await page.close();
  }

  await browser.close();
}

await run();

console.log("\n=== LOGS ===");
report.forEach((l) => console.log(l));
console.log("\n=== ERRORS ===");
if (failures.length === 0) console.log("none");
else failures.forEach((e) => console.log("✗", e));
console.log(`\nshots in ./${OUT}/`);
process.exit(failures.length ? 1 : 0);
