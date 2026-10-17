// The hero's last line, as shipped and under two candidate remedies, at every
// size in the review set. "nbsp" binds the final two words the way the page
// already binds "A new"; "pretty" swaps the wrap mode.
import { chromium } from "playwright";
const BASE = "http://localhost:3100";
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const SIZES = [[320, 700], [360, 700], [375, 700], [390, 844], [414, 896], [480, 800], [600, 900], [667, 375], [740, 360], [820, 1180], [844, 390], [896, 414], [932, 430], [1024, 600], [1024, 768], [1180, 820], [1280, 800], [1366, 768], [1440, 900], [1920, 1080]];
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
console.log("size        box   shipped(lines/last/%)     nbsp(lines/last/%)        overflow?");
for (const [w, h] of SIZES) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(BASE, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  const r = await page.evaluate(() => {
    const hero = document.querySelector("div.relative.z-10 h1");
    const orig = hero.innerHTML;
    const read = () => {
      const rng = document.createRange();
      rng.selectNodeContents(hero);
      const byLine = new Map();
      for (const r of [...rng.getClientRects()].filter((r) => r.width > 1)) {
        const k = Math.round(r.top);
        const cur = byLine.get(k) || { l: 1e9, r: -1e9 };
        byLine.set(k, { l: Math.min(cur.l, r.left), r: Math.max(cur.r, r.right) });
      }
      const keys = [...byLine.keys()].sort((a, b) => a - b);
      const widths = keys.map((k) => Math.round(byLine.get(k).r - byLine.get(k).l));
      return { n: widths.length, last: widths[widths.length - 1], max: Math.max(...widths) };
    };
    const box = Math.round(hero.getBoundingClientRect().width);
    const shipped = read();
    hero.innerHTML = orig.replace("human feedback.", "human feedback.");
    hero.offsetHeight;
    const nbsp = read();
    hero.innerHTML = orig;
    return { box, shipped, nbsp };
  });
  const pct = (v) => Math.round((v / r.box) * 100);
  const over = r.nbsp.max > r.box + 1 ? `OVERFLOWS by ${r.nbsp.max - r.box}` : "no";
  console.log(
    `${w}x${h}`.padEnd(11),
    String(r.box).padEnd(5),
    `${r.shipped.n} / ${r.shipped.last} / ${pct(r.shipped.last)}%`.padEnd(25),
    `${r.nbsp.n} / ${r.nbsp.last} / ${pct(r.nbsp.last)}%`.padEnd(25),
    over,
  );
}
await browser.close();
