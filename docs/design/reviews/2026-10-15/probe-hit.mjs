// The 404 word-mark's hit area, which 2026-10-12 took from 24px to 44px with
// an ::after overlay tuned against a 112px header. The header is now 64px in
// phone landscape, so re-walk the centre line and ask elementFromPoint what
// is actually there, and check the overlay covers nothing it should not.
import { chromium } from "playwright";
const BASE = "http://localhost:3100";
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const SIZES = [[320, 700], [390, 844], [820, 1180], [1440, 900], [667, 375], [844, 390], [932, 430]];
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
console.log("viewport     link box                hit top  hit bottom  height  covers the tag");
for (const [w, h] of SIZES) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(BASE + "/no-such-page", { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  const r = await page.evaluate(() => {
    const link = document.querySelector("header a");
    const b = link.getBoundingClientRect();
    const x = b.x + b.width / 2;
    const inside = (y) => { const e = document.elementFromPoint(x, y); return e === link || link.contains(e); };
    let top = b.y, bottom = b.y + b.height;
    for (let y = b.y; y > 0; y -= 0.5) { if (inside(y)) top = y; else break; }
    for (let y = b.y + b.height; y < innerHeight; y += 0.5) { if (inside(y)) bottom = y; else break; }
    const tag = [...document.querySelectorAll("header span")].find((s) => s.textContent.includes("frontier"));
    const tb = tag.getBoundingClientRect();
    const tagCovered = inside(tb.y + tb.height / 2) && Math.abs(tb.x + tb.width / 2 - x) < b.width / 2;
    return { box: `${b.width.toFixed(1)}x${b.height.toFixed(1)} at y ${b.y.toFixed(0)}`, top, bottom, tagCovered };
  });
  console.log(`${w}x${h}`.padEnd(12), r.box.padEnd(23), r.top.toFixed(1).padEnd(8), r.bottom.toFixed(1).padEnd(11), (r.bottom - r.top).toFixed(1).padEnd(7), r.tagCovered ? "YES" : "no");
}
await browser.close();
