// Structural and metric audit for the 2026-10-15 review.
//   node probe-audit.mjs
// Everything it prints is read off the rendered page at localhost:3100.
import { chromium } from "playwright";

const BASE = "http://localhost:3100";
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});

const WIDTHS = [320, 360, 375, 390, 414, 480, 600, 639, 640, 660, 700, 767, 768, 820, 900, 1023, 1024, 1180, 1440, 1920];

const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

// --- document structure, both routes
for (const route of ["/", "/no-such-page"]) {
  await page.goto(BASE + route, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const s = await page.evaluate(() => {
    const heads = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => h.tagName + ": " + h.textContent.trim().slice(0, 40));
    const landmarks = [...document.querySelectorAll("main,nav,header,footer,[role]")].map((e) => e.tagName.toLowerCase() + (e.getAttribute("role") ? `[role=${e.getAttribute("role")}]` : ""));
    const focusables = [...document.querySelectorAll("a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex='-1'])")].map((e) => e.tagName.toLowerCase() + " " + e.textContent.trim().slice(0, 30));
    const main = document.querySelector("main");
    return { heads, landmarks, focusables, mainText: main ? main.textContent.trim().slice(0, 50) : null, lang: document.documentElement.lang, title: document.title };
  });
  console.log(`\n=== ${route} ===`);
  console.log("  headings   :", s.heads.length ? s.heads : "NONE");
  console.log("  landmarks  :", s.landmarks.join(", ") || "none");
  console.log("  <main>     :", s.mainText === null ? "ABSENT" : `present, starts "${s.mainText}"`);
  console.log("  focusables :", s.focusables.length ? s.focusables : "NONE");
}

// --- width sweep: overflow and reading measure
console.log("\n=== width sweep (home) ===");
console.log("width  docOverflow  keyCol  textCol  cpl   heroW  heroLines");
for (const w of WIDTHS) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.goto(BASE, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  const r = await page.evaluate(() => {
    const over = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const li = document.querySelector("main li");
    const key = li.children[0].getBoundingClientRect();
    const txt = li.children[1].getBoundingClientRect();
    // characters per line: longest rendered line in the longest body span
    const spans = [...document.querySelectorAll("main li > span:last-child")];
    let cpl = 0;
    for (const sp of spans) {
      const range = document.createRange();
      const node = sp.firstChild;
      // walk to find line breaks by client rects
      range.selectNodeContents(sp);
      const rects = [...range.getClientRects()];
      if (!rects.length) continue;
      const lineW = Math.max(...rects.map((r) => r.width));
      const chars = Math.round((sp.textContent.length / rects.length));
      cpl = Math.max(cpl, chars);
      void lineW; void node;
    }
    const hero = document.querySelector("h1");
    const hr = hero.getBoundingClientRect();
    const range2 = document.createRange();
    range2.selectNodeContents(hero);
    const lines = new Set([...range2.getClientRects()].map((r) => Math.round(r.top))).size;
    return { over, key: Math.round(key.width), txt: Math.round(txt.width), cpl, heroW: Math.round(hr.width), lines };
  });
  console.log(
    String(w).padEnd(6),
    String(r.over).padEnd(12),
    String(r.key).padEnd(7),
    String(r.txt).padEnd(8),
    String(r.cpl).padEnd(5),
    String(r.heroW).padEnd(6),
    r.lines,
  );
}

// --- 404 sweep
console.log("\n=== width sweep (404) ===");
console.log("width  docOverflow  linkW  linkH  contentW");
for (const w of WIDTHS) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.goto(BASE + "/no-such-page", { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  const r = await page.evaluate(() => {
    const over = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const link = [...document.querySelectorAll("a")].find((a) => a.textContent.includes("Back"));
    const b = link.getBoundingClientRect();
    const box = link.parentElement.getBoundingClientRect();
    return { over, lw: Math.round(b.width), lh: Math.round(b.height), cw: Math.round(box.width) };
  });
  console.log(String(w).padEnd(6), String(r.over).padEnd(12), String(r.lw).padEnd(6), String(r.lh).padEnd(6), r.cw);
}

await browser.close();
