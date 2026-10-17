// Does text-balance still reach the hero? Chromium stops balancing above a
// line limit, and the hero crosses it at several real sizes. For each size,
// re-render the same paragraph under three text-wrap values and report the
// line count and the rag (the width of each rendered line).
import { chromium } from "playwright";
const BASE = "http://localhost:3100";
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const SIZES = [[320, 700], [390, 844], [414, 896], [667, 375], [820, 1180], [1024, 768], [1180, 820], [1366, 768], [1440, 900], [1920, 1080]];
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
for (const [w, h] of SIZES) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(BASE, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const out = await page.evaluate(() => {
    const hero = document.querySelector("div.relative.z-10 h1");
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
      return keys.map((k) => Math.round(byLine.get(k).r - byLine.get(k).l));
    };
    const res = {};
    for (const v of ["balance", "pretty", "auto"]) {
      hero.style.textWrap = v;
      hero.offsetHeight;
      res[v] = read();
    }
    hero.style.textWrap = "";
    res.boxW = Math.round(hero.getBoundingClientRect().width);
    return res;
  });
  console.log(`\n${w}x${h}  box ${out.boxW}px`);
  for (const v of ["balance", "pretty", "auto"]) {
    const rag = out[v];
    const last = rag[rag.length - 1];
    console.log(`  ${v.padEnd(8)} ${String(rag.length).padStart(2)} lines  last ${String(last).padStart(4)}px (${Math.round((last / out.boxW) * 100)}% of box)  rag [${rag.join(", ")}]`);
  }
}
await browser.close();
