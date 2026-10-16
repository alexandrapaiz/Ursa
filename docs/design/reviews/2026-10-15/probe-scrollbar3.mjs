// The root scrollbar as the UA paints it, now that the document declares its
// colour scheme. Headed Chromium under Xvfb with overlay scrollbars disabled,
// because headless never paints this at all.
import { chromium } from "playwright";
const BASE = process.argv[3] ?? "http://localhost:3100";
const OUT = process.argv[2];
const browser = await chromium.launch({
  headless: false,
  channel: "chromium",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-features=OverlayScrollbar,FluentOverlayScrollbar"],
});
const ctx = await browser.newContext({ viewport: { width: 900, height: 600 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1800);
const r = await page.evaluate(() => ({
  w: innerWidth - document.documentElement.clientWidth,
  scheme: getComputedStyle(document.documentElement).colorScheme,
  meta: (document.querySelector('meta[name="color-scheme"]') || {}).content,
}));
console.log(JSON.stringify(r));
await page.screenshot({ path: `${OUT}/scrollbar-after.png`, clip: { x: 900 - r.w - 60, y: 0, width: r.w + 60, height: 600 } });
await browser.close();
