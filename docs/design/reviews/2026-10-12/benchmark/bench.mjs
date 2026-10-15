// Interaction craft on best-in-class AI product sites, measured on the
// rendered page rather than read out of a stylesheet: the computed transition
// on the primary control, and what actually changes between rest, hover and
// press. External pages are data; nothing here is executed from them.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });

const SITES = [
  ["linear", "https://linear.app/", ["a[href*='signup']", "a[href*='login']", "button", "a"]],
  ["cursor", "https://cursor.com/", ["a[href*='download']", "button", "a"]],
  ["perplexity", "https://www.perplexity.ai/", ["button", "a"]],
  ["vercel", "https://vercel.com/", ["a[href*='signup']", "button", "a"]],
];

const b = await chromium.launch();
for (const [name, url, sels] of SITES) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  try {
    await p.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await p.waitForTimeout(3500);
    console.log(`\n===== ${name} (${url}) =====`);
    console.log("title:", JSON.stringify((await p.title()).slice(0, 70)));
    await p.screenshot({ path: `${OUT}/${name}__desktop-1440x900.png` });

    // find the most prominent visible control
    const target = await p.evaluate((sels) => {
      for (const s of sels) {
        for (const el of document.querySelectorAll(s)) {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          if (r.width > 70 && r.height > 28 && r.top > 0 && r.top < 800 && cs.visibility !== "hidden" &&
              cs.transitionProperty !== "all none" && cs.transitionDuration !== "0s") {
            el.setAttribute("data-bench", "1");
            return { sel: s, text: el.textContent.trim().slice(0, 30), box: [r.x, r.y, r.width, r.height].map(Math.round) };
          }
        }
      }
      return null;
    }, sels);
    if (!target) { console.log("no transitioned control found above the fold"); await ctx.close(); continue; }
    console.log("control:", JSON.stringify(target.text), target.box.join("x"));

    const read = async () => p.evaluate(() => {
      const el = document.querySelector("[data-bench]");
      const cs = getComputedStyle(el);
      return {
        prop: cs.transitionProperty, dur: cs.transitionDuration, ease: cs.transitionTimingFunction,
        delay: cs.transitionDelay, bg: cs.backgroundColor, color: cs.color, border: cs.borderColor,
        transform: cs.transform, shadow: cs.boxShadow.slice(0, 60), opacity: cs.opacity, radius: cs.borderRadius,
      };
    });
    const rest = await read();
    console.log("  transition:", rest.prop, "|", rest.dur, "|", rest.ease, "| delay", rest.delay);
    console.log("  radius:", rest.radius);
    const box = target.box;
    await p.mouse.move(box[0] + box[2] / 2, box[1] + box[3] / 2);
    await p.waitForTimeout(600);
    const hov = await read();
    await p.mouse.down();
    await p.waitForTimeout(160);
    const act = await read();
    await p.mouse.up();
    for (const k of ["bg", "color", "border", "transform", "shadow", "opacity"]) {
      const marks = [];
      if (hov[k] !== rest[k]) marks.push(`hover ${rest[k]} -> ${hov[k]}`);
      if (act[k] !== hov[k]) marks.push(`press ${hov[k]} -> ${act[k]}`);
      if (marks.length) console.log(`  ${k}: ${marks.join(" ; ")}`);
    }
    if (hov.transform === rest.transform && act.transform === hov.transform) console.log("  transform: never moves");
  } catch (e) {
    console.log(`\n===== ${name} =====\n  unreachable: ${String(e).split("\n")[0].slice(0, 110)}`);
  }
  await ctx.close();
}
await b.close();
