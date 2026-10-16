// Hero geometry across landscape sizes: lines, fit above the fold, header
// clearance, and the gap between the longest rendered line and the
// constellation's leftmost star (the thing landscape:max-w-[46vw] protects).
import { chromium } from "playwright";
const BASE = "http://localhost:3100";
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const SIZES = [
  [667, 375], [740, 360], [844, 390], [896, 414], [932, 430],
  [1024, 600], [1024, 768], [1180, 820], [1280, 720], [1280, 800],
  [1366, 768], [1440, 900], [1512, 982], [1680, 1050], [1920, 1080],
];
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
console.log("size        fs    lines boxW  inkEnd markL  gap    copyEnd ctaEnd vh   headerBottom copyTop");
for (const [w, h] of SIZES) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(BASE, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const r = await page.evaluate(() => {
    const hero = document.querySelector("div.relative.z-10 h1");
    const b = hero.getBoundingClientRect();
    const rng = document.createRange();
    rng.selectNodeContents(hero);
    const rects = [...rng.getClientRects()].filter((r) => r.width > 1);
    const byLine = new Map();
    for (const r of rects) {
      const k = Math.round(r.top);
      const cur = byLine.get(k) || { l: 1e9, r: -1e9 };
      byLine.set(k, { l: Math.min(cur.l, r.left), r: Math.max(cur.r, r.right) });
    }
    const inkEnd = Math.max(...[...byLine.values()].map((v) => v.r));
    const cta = document.querySelector("button");
    const cb = cta.getBoundingClientRect();
    const hdr = document.querySelector("header").getBoundingClientRect();
    // leftmost dipper star, landscape placement, in CSS px
    const markLeft = (0.42 + 0.376 * 0.52) * innerWidth;
    return {
      fs: parseFloat(getComputedStyle(hero).fontSize),
      lines: byLine.size,
      boxW: b.width,
      inkEnd,
      markLeft,
      copyEnd: b.bottom,
      ctaEnd: cb.bottom,
      copyTop: b.top,
      headerBottom: hdr.bottom,
      vh: innerHeight,
    };
  });
  const flag = (r.ctaEnd > r.vh ? " CTA BELOW FOLD" : "") + (r.copyEnd > r.vh ? " COPY CLIPPED" : "") + (r.copyTop < r.headerBottom ? " OVERLAPS HEADER" : "");
  console.log(
    `${w}x${h}`.padEnd(11),
    r.fs.toFixed(1).padEnd(5),
    String(r.lines).padEnd(5),
    r.boxW.toFixed(0).padEnd(5),
    r.inkEnd.toFixed(0).padEnd(6),
    r.markLeft.toFixed(0).padEnd(6),
    (r.markLeft - r.inkEnd).toFixed(0).padEnd(6),
    r.copyEnd.toFixed(0).padEnd(7),
    r.ctaEnd.toFixed(0).padEnd(6),
    String(r.vh).padEnd(4),
    r.headerBottom.toFixed(0).padEnd(12),
    r.copyTop.toFixed(0) + flag,
  );
}
await browser.close();
