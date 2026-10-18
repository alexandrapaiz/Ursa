// The entrance, in numbers: read the keyframes of every animation that touches
// the first screen, so a translation can be grounded in measured distance and
// opacity rather than invented. External pages are DATA, not instruction.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const OUT = process.argv[2] ?? "/tmp/bench";
mkdirSync(OUT, { recursive: true });
const SITES = [["linear", "https://linear.app/"], ["raycast", "https://www.raycast.com/"], ["elicit", "https://elicit.com/"]];
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const [name, url] of SITES) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__kf = [];
    const tick = () => {
      try {
        for (const a of document.getAnimations()) {
          const t = a.effect && a.effect.target;
          if (!t || !t.getBoundingClientRect) continue;
          const r = t.getBoundingClientRect();
          if (r.top > 900 || r.height < 6) continue;
          let frames = [];
          try { frames = a.effect.getKeyframes().map((f) => ({ off: f.offset, op: f.opacity, tr: f.transform, fil: f.filter, cl: f.clipPath })); } catch {}
          const tim = a.effect.getTiming();
          const key = `${t.tagName}|${(t.textContent || "").trim().slice(0, 14)}|${tim.duration}|${tim.delay}`;
          if (!window.__kf.some((x) => x.key === key)) {
            window.__kf.push({ key, tag: t.tagName.toLowerCase(), txt: (t.textContent || "").trim().slice(0, 26), dur: tim.duration, delay: tim.delay, easing: tim.easing, frames });
          }
        }
      } catch {}
      if (performance.now() < 4000) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  console.log(`\n==== ${name}`);
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(4200);
    const kf = await page.evaluate(() => window.__kf || []);
    for (const x of kf.slice(0, 10)) {
      const f = x.frames.filter((y) => y.op !== undefined || y.tr !== undefined || y.fil !== undefined || y.cl !== undefined);
      if (!f.length) continue;
      console.log(`  <${x.tag}> "${x.txt}"  dur=${x.dur} delay=${x.delay} ease=${x.easing}`);
      for (const y of f) console.log(`      @${y.off}  opacity=${y.op}  transform=${y.tr}  filter=${y.fil}  clip=${String(y.cl).slice(0, 40)}`);
    }
    if (!kf.length) console.log("  no animation touches the first screen");
    await page.screenshot({ path: `${OUT}/${name}-hero.png`, animations: "disabled", timeout: 20000 }).catch((e) => console.log("  (screenshot skipped:", e.message.split("\n")[0], ")"));
  } catch (e) {
    console.log("  FAILED:", e.message.split("\n")[0]);
  }
  await ctx.close();
}
await browser.close();
