// Landscape and laptop sizes outside the charter's three viewports.
//   node shots-landscape.mjs <outDir> <prefix>
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const OUT = process.argv[2];
const PRE = process.argv[3] ?? "";
const BASE = "http://localhost:3100";
const SIZES = [[667, 375], [740, 360], [896, 414], [932, 430], [1024, 600], [1024, 768], [1280, 800], [1366, 768]];
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
for (const [w, h] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${OUT}/${PRE}home-hero__landscape-${w}x${h}.png` });
  console.log("  shot", `${PRE}home-hero__landscape-${w}x${h}`);
  await ctx.close();
}
await browser.close();
