// The sky's scroll darkening, 200ms into a scroll, on a 120Hz display.
//   node shots-smoothing.mjs <outDir> <prefix>
// requestAnimationFrame is driven on a synthetic 120Hz cadence so the refresh
// rate is the only variable and the frame is reproducible.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const OUT = process.argv[2];
const PRE = process.argv[3];
const BASE = "http://localhost:3100";
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const hz of [60, 120]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.addInitScript((hz) => {
    const step = 1000 / hz;
    let t = 0;
    const q = [];
    window.requestAnimationFrame = (cb) => { q.push(cb); return q.length; };
    window.cancelAnimationFrame = () => {};
    window.__pump = (frames) => { for (let i = 0; i < frames; i++) { t += step; for (const cb of q.splice(0, q.length)) { try { cb(t); } catch {} } } };
    window.__hz = hz;
  }, hz);
  await page.goto(BASE, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.__pump(3));
  // scroll half a viewport, then advance exactly 200ms of frames
  await page.evaluate(() => window.scrollTo({ top: innerHeight * 0.5, behavior: "instant" }));
  await page.evaluate((hz) => window.__pump(Math.round(200 / (1000 / hz))), hz);
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}/${PRE}sky-200ms-${hz}hz.png`, clip: { x: 0, y: 0, width: 720, height: 420 } });
  console.log("  shot", `${PRE}sky-200ms-${hz}hz`);
  await ctx.close();
}
await browser.close();
