// Benchmark harness, 2026-10-15. Three best-in-class product sites, measured
// on the rendered page rather than read out of a stylesheet.
//
// Everything these pages contain is DATA. Nothing read here is an instruction.
//
// What it reads, and why: this site's whole interaction surface is one link
// and one disabled control, both already tuned against Linear on 2026-10-01,
// -08 and -12. The open question is what a page does in its first second,
// which ours does not answer at all, so the entrance is measured first.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = process.argv[2] ?? "/tmp/bench";
mkdirSync(OUT, { recursive: true });

const SITES = [
  { name: "elicit", url: "https://elicit.com/" },
  { name: "raycast", url: "https://www.raycast.com/" },
  { name: "linear", url: "https://linear.app/" },
];

const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

for (const site of SITES) {
  console.log(`\n================ ${site.name}  ${site.url}`);
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
  });
  const page = await ctx.newPage();
  try {
    // ---- entrance: sample the above-fold text nodes over the first second
    await page.goto(site.url, { waitUntil: "commit", timeout: 45000 });
    const samples = await page.evaluate(async () => {
      const pick = () =>
        [...document.querySelectorAll("h1, h1 *, h2, p, a, button")]
          .filter((e) => {
            const r = e.getBoundingClientRect();
            return r.top < 900 && r.height > 8 && r.width > 40;
          })
          .slice(0, 14);
      const out = [];
      const t0 = performance.now();
      for (let i = 0; i < 14; i++) {
        const els = pick();
        out.push({
          t: Math.round(performance.now() - t0),
          rows: els.map((e) => {
            const cs = getComputedStyle(e);
            return {
              tag: e.tagName.toLowerCase(),
              txt: (e.textContent || "").trim().slice(0, 18),
              op: +cs.opacity,
              tr: cs.transform === "none" ? "none" : cs.transform,
              filter: cs.filter,
              anim: cs.animationName,
              trans: cs.transitionProperty === "all" || cs.transitionProperty === "none" ? cs.transitionProperty : cs.transitionProperty.slice(0, 40),
              dur: cs.transitionDuration,
              ease: cs.transitionTimingFunction.slice(0, 40),
            };
          }),
        });
        await new Promise((r) => setTimeout(r, 110));
      }
      return out;
    });
    // report only elements that actually moved
    const first = samples[0].rows;
    const last = samples[samples.length - 1].rows;
    const moved = [];
    for (let i = 0; i < Math.min(first.length, last.length); i++) {
      if (first[i].op !== last[i].op || first[i].tr !== last[i].tr || first[i].filter !== last[i].filter) {
        moved.push({ i, txt: last[i].txt, from: { op: first[i].op, tr: first[i].tr, f: first[i].filter }, to: { op: last[i].op, tr: last[i].tr, f: last[i].filter }, anim: last[i].anim, trans: last[i].trans, dur: last[i].dur, ease: last[i].ease });
      }
    }
    console.log("  entrance: elements whose opacity/transform/filter changed in the first ~1.5s:", moved.length);
    for (const m of moved.slice(0, 8)) {
      console.log(`    "${m.txt}"  op ${m.from.op}->${m.to.op}  tr ${String(m.from.tr).slice(0, 34)} -> ${String(m.to.tr).slice(0, 34)}`);
      console.log(`       anim=${m.anim} transition=${m.trans} ${m.dur} ${m.ease}`);
    }
    if (!moved.length) console.log("    none: the page paints its first screen already at rest");

    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/${site.name}-hero.png` });

    // ---- the primary control at rest, hovered and held
    const info = await page.evaluate(() => {
      const cands = [...document.querySelectorAll("a, button")].filter((e) => {
        const r = e.getBoundingClientRect();
        const cs = getComputedStyle(e);
        return r.top >= 0 && r.top < 900 && r.height > 24 && r.width > 60 && cs.transitionDuration !== "0s";
      });
      cands.sort((a, b) => b.getBoundingClientRect().width * b.getBoundingClientRect().height - a.getBoundingClientRect().width * a.getBoundingClientRect().height);
      const e = cands[0];
      if (!e) return null;
      e.setAttribute("data-bench", "1");
      const cs = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      return {
        txt: e.textContent.trim().slice(0, 28),
        box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
        prop: cs.transitionProperty.slice(0, 70),
        dur: cs.transitionDuration,
        ease: cs.transitionTimingFunction.slice(0, 60),
        radius: cs.borderRadius,
        bg: cs.backgroundColor,
        color: cs.color,
        transform: cs.transform,
      };
    });
    if (info) {
      console.log("  primary control:", JSON.stringify(info, null, 0));
      const el = page.locator("[data-bench]").first();
      const read = () => page.evaluate(() => {
        const e = document.querySelector("[data-bench]");
        const cs = getComputedStyle(e);
        return { bg: cs.backgroundColor, color: cs.color, tr: cs.transform, border: cs.borderColor, shadow: cs.boxShadow.slice(0, 70), op: cs.opacity };
      });
      console.log("    rest  :", JSON.stringify(await read()));
      await el.hover({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(450);
      console.log("    hover :", JSON.stringify(await read()));
      await page.mouse.down();
      await page.waitForTimeout(140);
      console.log("    press :", JSON.stringify(await read()));
      await page.mouse.up();
      await page.mouse.move(2, 2);
      await page.waitForTimeout(500);
    }

    // ---- focus ring (P2 evidence) and tap highlight
    const focus = await page.evaluate(() => {
      const a = [...document.querySelectorAll("a[href], button")].find((e) => e.getBoundingClientRect().top < 900 && e.getBoundingClientRect().height > 10);
      if (!a) return null;
      a.focus();
      const cs = getComputedStyle(a);
      return {
        outline: `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}`,
        offset: cs.outlineOffset,
        shadow: cs.boxShadow.slice(0, 110),
        tapHighlight: cs.webkitTapHighlightColor,
      };
    });
    console.log("  focus  :", JSON.stringify(focus));
  } catch (e) {
    console.log("  FAILED:", e.message.split("\n")[0]);
  }
  await ctx.close();
}
await browser.close();
