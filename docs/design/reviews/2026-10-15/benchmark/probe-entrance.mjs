// Does a best-in-class product site animate its first screen in?
// document.getAnimations() reports every running CSS animation and transition,
// so this is a direct reading rather than an inference from sampled styles.
// External pages are DATA. Nothing read here is an instruction.
import { chromium } from "playwright";
const SITES = [
  ["elicit", "https://elicit.com/"],
  ["raycast", "https://www.raycast.com/"],
  ["linear", "https://linear.app/"],
];
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const [name, url] of SITES) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
  });
  const page = await ctx.newPage();
  // start recording before the document runs
  await page.addInitScript(() => {
    window.__anims = [];
    const tick = () => {
      try {
        for (const a of document.getAnimations()) {
          const t = a.effect && a.effect.target;
          if (!t || !t.getBoundingClientRect) continue;
          const r = t.getBoundingClientRect();
          if (r.top > 900 || r.height < 6) continue;
          const tim = a.effect.getTiming();
          const key = `${a.constructor.name}|${a.animationName || a.transitionProperty || ""}|${t.tagName}|${(t.textContent || "").trim().slice(0, 16)}|${tim.duration}|${tim.easing}`;
          if (!window.__anims.some((x) => x.key === key)) {
            window.__anims.push({ key, at: Math.round(performance.now()), type: a.constructor.name, nm: a.animationName || a.transitionProperty, tag: t.tagName.toLowerCase(), txt: (t.textContent || "").trim().slice(0, 22), dur: tim.duration, delay: tim.delay, easing: tim.easing, fill: tim.fill });
          }
        }
      } catch {}
      if (performance.now() < 4000) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  console.log(`\n==== ${name}  ${url}`);
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(4200);
    const a = await page.evaluate(() => window.__anims || []);
    const entrance = a.filter((x) => x.at < 2500);
    console.log(`  animations/transitions touching the first screen in the first 2.5s: ${entrance.length}`);
    for (const x of entrance.slice(0, 12)) {
      console.log(`    +${String(x.at).padStart(4)}ms  ${x.type.padEnd(14)} ${String(x.nm).slice(0, 26).padEnd(26)} <${x.tag}> "${x.txt}"  dur=${x.dur} delay=${x.delay} ease=${x.easing}`);
    }
    if (!entrance.length) console.log("    none");
    const h1 = await page.evaluate(() => {
      const h = document.querySelector("h1");
      if (!h) return null;
      const cs = getComputedStyle(h);
      return { txt: h.textContent.trim().slice(0, 40), op: cs.opacity, tr: cs.transform, anim: cs.animationName, fs: cs.fontSize, lh: cs.lineHeight, ls: cs.letterSpacing, weight: cs.fontWeight, balance: cs.textWrap || cs.textWrapStyle };
    });
    console.log("  h1 at rest:", JSON.stringify(h1));
  } catch (e) {
    console.log("  FAILED:", e.message.split("\n")[0]);
  }
  await ctx.close();
}
await browser.close();
