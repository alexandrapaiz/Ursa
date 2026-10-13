// Does the hero fit the viewport, and is the only control reachable?
// Measures the hero block (header + copy + CTA) against the viewport height at
// every landscape size a phone or small tablet actually reports.
import { chromium } from "playwright";
const BASE = "http://localhost:3100";
const SIZES = [
  [667, 375, "iPhone SE landscape"],
  [740, 360, "small Android landscape"],
  [844, 390, "iPhone 14 landscape (charter)"],
  [896, 414, "iPhone XR landscape"],
  [932, 430, "iPhone 15 Pro Max landscape"],
  [1024, 600, "small tablet landscape"],
  [1024, 768, "iPad landscape"],
  [1180, 820, "iPad Air landscape"],
  [1440, 900, "desktop (charter)"],
];
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
console.log("w x h".padEnd(12), "lines", "copyBottom".padEnd(11), "ctaBottom".padEnd(10), "overflow", " verdict");
for (const [w, h, label] of SIZES) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(400);
  const m = await p.evaluate(() => {
    const copy = document.querySelector("main") ? document.querySelector("p") : document.querySelector("p");
    const cta = document.querySelector("button");
    const cs = getComputedStyle(copy);
    const lines = Math.round(copy.getBoundingClientRect().height / parseFloat(cs.lineHeight));
    return {
      lines,
      copyBottom: +copy.getBoundingClientRect().bottom.toFixed(1),
      ctaBottom: +cta.getBoundingClientRect().bottom.toFixed(1),
      fs: +parseFloat(cs.fontSize).toFixed(1),
      cueShown: !!document.querySelector('[class*="portrait:block"]') &&
        getComputedStyle(document.querySelector('[class*="portrait:block"]')).display !== "none",
    };
  });
  const over = +(m.ctaBottom - h).toFixed(1);
  const verdict = m.copyBottom > h ? "COPY CLIPPED" : over > 0 ? `CTA ${over}px below fold${m.cueShown ? "" : ", no cue"}` : "fits";
  console.log(
    `${w}x${h}`.padEnd(12),
    String(m.lines).padEnd(5),
    String(m.copyBottom).padEnd(11),
    String(m.ctaBottom).padEnd(10),
    String(over).padEnd(8),
    verdict,
    `(${m.fs}px, ${label})`,
  );
  await ctx.close();
}
await b.close();
