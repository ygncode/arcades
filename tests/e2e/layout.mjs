import { chromium, devices } from "playwright";
import { mkdirSync } from "fs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = "e2e-shots";
mkdirSync(OUT, { recursive: true });

const errors = [];
const logs = [];

async function shot(page, name) {
  const path = `${OUT}/${name}.png`;
  await page.screenshot({ path, fullPage: false });
  logs.push(`✓ ${path}`);
  return path;
}

async function runDesktop(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("pageerror", (e) => errors.push(`[desktop] ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`[desktop console] ${m.text()}`);
  });

  await page.goto(`${BASE}/games/pagoda-patch/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await shot(page, "01-start-desktop");

  const startCard = await page.evaluate(() => {
    const r = document.querySelector(".start-card")?.getBoundingClientRect();
    return r ? { top: r.top, bottom: r.bottom, height: r.height, vh: innerHeight } : null;
  });
  logs.push(`desktop start card: ${JSON.stringify(startCard)}`);
  if (!startCard || startCard.top < 6 || startCard.bottom > startCard.vh - 6) {
    errors.push(`desktop start card clipped: ${JSON.stringify(startCard)}`);
  }

  // Click Play
  await page.click("#btn-start");
  await page.waitForTimeout(600);
  await shot(page, "02-map-desktop");

  // Click first unlocked level
  const node = page.locator(".map-node.unlocked").first();
  await node.click();
  await page.waitForTimeout(400);
  await shot(page, "03-intro-desktop");

  await page.click("#btn-intro-go");
  await page.waitForTimeout(800);
  await shot(page, "04-game-desktop");

  // Select sunflower and plant
  const sunPkt = page.locator('.seed-packet[data-id="sunflower"]');
  if (await sunPkt.count()) {
    await sunPkt.click();
    await page.waitForTimeout(200);
    // click a lawn cell
    const cell = page.locator('.cell[data-row="2"][data-col="1"]');
    await cell.click({ force: true });
    await page.waitForTimeout(300);
    await shot(page, "05-planted-desktop");
  }

  // Check layout metrics
  const metrics = await page.evaluate(() => {
    const lawn = document.getElementById("lawn")?.getBoundingClientRect();
    const stage = document.getElementById("stage")?.getBoundingClientRect();
    const hud = document.querySelector(".hud")?.getBoundingClientRect();
    const wrap = document.getElementById("lawn-wrap")?.getBoundingClientRect();
    const cs = getComputedStyle(document.documentElement);
    return {
      lawn: lawn && { w: lawn.width, h: lawn.height, t: lawn.top, l: lawn.left },
      stage: stage && { w: stage.width, h: stage.height },
      hud: hud && { h: hud.height },
      wrap: wrap && { w: wrap.width, h: wrap.height },
      colW: cs.getPropertyValue("--col-w").trim(),
      rowH: cs.getPropertyValue("--row-h").trim(),
      bodyOverflow: getComputedStyle(document.body).overflow,
      needLandscape: document.body.classList.contains("need-landscape"),
      plants: document.querySelectorAll(".plant").length,
      cells: document.querySelectorAll(".cell").length,
    };
  });
  logs.push(`desktop metrics: ${JSON.stringify(metrics, null, 2)}`);

  // Validate board fills reasonably
  if (metrics.cells !== 45) errors.push(`expected 45 cells, got ${metrics.cells}`);
  if (!metrics.lawn || metrics.lawn.w < 200) errors.push(`lawn too small: ${JSON.stringify(metrics.lawn)}`);
  if (metrics.lawn && metrics.stage && metrics.lawn.h > metrics.stage.h + 5) {
    errors.push(`lawn taller than stage (overflow)`);
  }

  await page.close();
  return metrics;
}

async function runMobileLandscape(browser) {
  const iPhone = devices["iPhone 13"];
  const page = await browser.newPage({
    ...iPhone,
    viewport: { width: 844, height: 390 }, // landscape iPhone 13
    isMobile: true,
    hasTouch: true,
  });
  page.on("pageerror", (e) => errors.push(`[mobile-land] ${e.message}`));

  await page.goto(`${BASE}/games/pagoda-patch/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await shot(page, "10-start-mobile-land");

  await page.click("#btn-start");
  await page.waitForTimeout(500);
  await shot(page, "11-map-mobile-land");

  await page.locator(".map-node.unlocked").first().click();
  await page.waitForTimeout(300);
  await page.click("#btn-intro-go");
  await page.waitForTimeout(900);
  await shot(page, "12-game-mobile-land");

  const metrics = await page.evaluate(() => {
    const lawn = document.getElementById("lawn")?.getBoundingClientRect();
    const stage = document.getElementById("stage")?.getBoundingClientRect();
    const seedBar = document.getElementById("seed-bar")?.getBoundingClientRect();
    const shovel = document.getElementById("shovel-slot")?.getBoundingClientRect();
    const hud = document.querySelector(".hud")?.getBoundingClientRect();
    const progress = document.getElementById("progress")?.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return {
      vw, vh,
      needLandscape: document.body.classList.contains("need-landscape"),
      lawn: lawn && { w: +lawn.width.toFixed(1), h: +lawn.height.toFixed(1), top: +lawn.top.toFixed(1), bottom: +lawn.bottom.toFixed(1) },
      stage: stage && { w: +stage.width.toFixed(1), h: +stage.height.toFixed(1) },
      seedBar: seedBar && { w: +seedBar.width.toFixed(1), h: +seedBar.height.toFixed(1) },
      shovel: shovel && { bottom: +shovel.bottom.toFixed(1), right: +(vw - shovel.right).toFixed(1), w: +shovel.width.toFixed(1) },
      hudH: hud?.height,
      progressH: progress?.height,
      colW: getComputedStyle(document.documentElement).getPropertyValue("--col-w").trim(),
      rowH: getComputedStyle(document.documentElement).getPropertyValue("--row-h").trim(),
      // overflow checks
      lawnClippedBottom: lawn ? lawn.bottom > vh + 2 : null,
      lawnClippedTop: lawn ? lawn.top < (hud?.bottom || 0) - 2 : null,
      cells: document.querySelectorAll(".cell").length,
    };
  });
  logs.push(`mobile-land metrics: ${JSON.stringify(metrics, null, 2)}`);

  if (metrics.needLandscape) errors.push("landscape mobile incorrectly gated");
  if (metrics.lawnClippedBottom) errors.push("lawn clipped below viewport on mobile landscape");
  if (metrics.cells !== 45) errors.push(`mobile cells ${metrics.cells}`);
  if (metrics.lawn && metrics.lawn.w < 300) errors.push(`mobile lawn too narrow ${metrics.lawn.w}`);

  // Try planting via touch
  const pkt = page.locator('.seed-packet[data-id="sunflower"]');
  if (await pkt.count()) {
    await pkt.tap();
    await page.waitForTimeout(150);
    await page.locator('.cell[data-row="2"][data-col="1"]').tap({ force: true });
    await page.waitForTimeout(250);
    const planted = await page.locator(".plant").count();
    logs.push(`planted count after tap: ${planted}`);
    if (planted < 1) errors.push("touch plant failed on mobile landscape");
    await shot(page, "13-planted-mobile-land");
  }

  await page.close();
  return metrics;
}

async function runMobilePortrait(browser) {
  const page = await browser.newPage({
    ...devices["iPhone 13"],
    viewport: { width: 390, height: 844 },
  });
  page.on("pageerror", (e) => errors.push(`[mobile-port] ${e.message}`));

  await page.goto(`${BASE}/games/pagoda-patch/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await shot(page, "20-start-mobile-port");

  // Start should work in portrait
  await page.click("#btn-start");
  await page.waitForTimeout(500);
  await shot(page, "21-map-mobile-port");

  await page.locator(".map-node.unlocked").first().click();
  await page.waitForTimeout(300);
  await page.click("#btn-intro-go");
  await page.waitForTimeout(700);
  await shot(page, "22-game-mobile-port-should-rotate");

  const gated = await page.evaluate(() => document.body.classList.contains("need-landscape"));
  logs.push(`portrait in-game rotate gate: ${gated}`);
  if (!gated) errors.push("portrait in-game should show rotate gate");

  await page.close();
}

async function runShortDesktop(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 700 } });
  page.on("pageerror", (e) => errors.push(`[short-desktop] ${e.message}`));
  await page.goto(`${BASE}/games/pagoda-patch/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const geometry = await page.evaluate(() => {
    const card = document.querySelector(".start-card")?.getBoundingClientRect();
    const screen = document.querySelector("#start-screen");
    return {
      card: card && { top: card.top, bottom: card.bottom, height: card.height },
      vh: innerHeight,
      scrollHeight: screen?.scrollHeight,
      clientHeight: screen?.clientHeight,
    };
  });
  logs.push(`short desktop start card: ${JSON.stringify(geometry)}`);
  await shot(page, "06-start-short-desktop");
  if (!geometry.card || geometry.card.top < 6 || geometry.card.bottom > geometry.vh - 6) {
    errors.push(`short desktop start card clipped: ${JSON.stringify(geometry)}`);
  }
  await page.close();
}

async function runHub(browser) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  page.on("pageerror", (e) => errors.push(`[hub] ${e.message}`));
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await shot(page, "00-hub");
  const cards = await page.locator(".game-card").count();
  logs.push(`hub cards: ${cards}`);
  if (cards < 1) errors.push("hub has no game cards");
  await page.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await runHub(browser);
  await runDesktop(browser);
  await runShortDesktop(browser);
  await runMobileLandscape(browser);
  await runMobilePortrait(browser);
} finally {
  await browser.close();
}

console.log("\n=== LOGS ===");
logs.forEach((l) => console.log(l));
console.log("\n=== ERRORS ===");
if (errors.length === 0) console.log("none");
else errors.forEach((e) => console.log("✗", e));
console.log(`\nshots in ./${OUT}/`);
process.exit(errors.length ? 1 : 0);
