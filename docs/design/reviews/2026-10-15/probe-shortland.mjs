// Short-landscape budget. The control is sliced by the fold at the smallest
// landscape phone. Measure what each lever buys, at every landscape size.
import { chromium } from "playwright";
const BASE = "http://localhost:3100";
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const SIZES = [[667, 375], [720, 360], [740, 360], [812, 375], [844, 390], [896, 414], [926, 428], [932, 430], [1024, 600], [1024, 768]];
const CASES = {
  shipped: {},
  "hdr 6/4": { pt: 24, pb: 16 },
  "hdr 6/4 + mt-6": { pt: 24, pb: 16, mt: 24 },
  "hdr 8/5 + mt-6": { pt: 32, pb: 20, mt: 24 },
};
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
for (const [w, h] of SIZES) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(BASE, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const rows = await page.evaluate((CASES) => {
    const hdr = document.querySelector("header");
    const cta = document.querySelector("button");
    const hero = document.querySelector("div.relative.z-10 h1");
    const out = {};
    for (const [name, c] of Object.entries(CASES)) {
      hdr.style.paddingTop = c.pt ? c.pt + "px" : "";
      hdr.style.paddingBottom = c.pb ? c.pb + "px" : "";
      cta.style.marginTop = c.mt ? c.mt + "px" : "";
      hdr.offsetHeight;
      const cb = cta.getBoundingClientRect();
      const hb = hero.getBoundingClientRect();
      out[name] = { cta: Math.round(cb.bottom), copy: Math.round(hb.bottom), top: Math.round(hb.top), hdr: Math.round(hdr.getBoundingClientRect().bottom) };
    }
    hdr.style.paddingTop = hdr.style.paddingBottom = cta.style.marginTop = "";
    return out;
  }, CASES);
  console.log(`\n${w}x${h}   viewport height ${h}`);
  for (const [name, v] of Object.entries(rows)) {
    const flag = v.cta > h ? ` CONTROL ${v.cta - h}px BELOW FOLD` : ` clear by ${h - v.cta}px`;
    console.log(`  ${name.padEnd(16)} headerBottom ${String(v.hdr).padStart(3)}  copyTop ${String(v.top).padStart(3)}  copyEnd ${String(v.copy).padStart(3)}  ctaEnd ${String(v.cta).padStart(3)} ${flag}`);
  }
}
await browser.close();
