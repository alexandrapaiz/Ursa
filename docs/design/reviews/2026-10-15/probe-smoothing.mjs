// The sky's two smoothed responses (mouse parallax, scroll darkening) advance
// by a fixed fraction PER FRAME. If that is so, the feel is tied to the
// display's refresh rate rather than to time, and every 120Hz screen gets an
// animation twice as fast as the one that was tuned. Measured by driving
// requestAnimationFrame at 60Hz and at 120Hz and timing the settle.
import { chromium } from "playwright";
const BASE = "http://localhost:3100";
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

for (const hz of [60, 120]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  // drive rAF on a fixed synthetic cadence so the rate is the only variable
  await page.addInitScript((hz) => {
    const step = 1000 / hz;
    let t = 0;
    const queue = [];
    window.requestAnimationFrame = (cb) => { queue.push(cb); return queue.length; };
    window.cancelAnimationFrame = () => {};
    window.__pump = (frames) => {
      for (let i = 0; i < frames; i++) {
        t += step;
        const batch = queue.splice(0, queue.length);
        for (const cb of batch) { try { cb(t); } catch {} }
      }
      return t;
    };
  }, hz);
  await page.goto(BASE, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.__pump(5));
  // a pointer at the far corner: the parallax target is its maximum
  await page.evaluate(() => {
    dispatchEvent(new MouseEvent("mousemove", { clientX: innerWidth, clientY: innerHeight }));
  });
  const trace = await page.evaluate((hz) => {
    const cv = document.querySelector("canvas");
    const out = [];
    const target = 0.5 * 14; // mouseS.x -> 0.5, transform uses *14
    for (let ms = 0; ms <= 1200; ms += 1000 / hz) {
      window.__pump(1);
      const m = /translate\(([-\d.]+)px/.exec(cv.style.transform || "");
      out.push({ ms: Math.round(ms), x: m ? parseFloat(m[1]) : 0 });
    }
    const settle = out.find((p) => p.x >= target * 0.9);
    return { target, settle, frames: out.length, last: out[out.length - 1] };
  }, hz);
  console.log(`rAF at ${hz}Hz: parallax reaches 90% of its target at ${trace.settle ? trace.settle.ms + "ms (frame " + Math.round(trace.settle.ms / (1000 / hz)) + ")" : "never within 1200ms"}; target ${trace.target.toFixed(2)}px, last ${trace.last.x}px`);
  await ctx.close();
}
await browser.close();
