/**
 * How big are other people's small controls, and how did they get there?
 *
 * This run put a 44px floor under two controls. "44" came from WCAG 2.5.5
 * and from Apple's own guidance, but a number in a standard does not tell
 * you whether the companies this seat is told to measure itself against
 * actually hold to it, nor which mechanism they use to get there. Both are
 * decisions this stylesheet has to make again every time a small control
 * is added, so they are worth measuring once.
 *
 * Same probe as measure-hit-areas.mjs: walk outward from a point inside
 * the control and ask the browser what is under it, so an invisible
 * overlay is counted and a padding-based target is counted the same way.
 *
 * The mechanism question is answered by comparing the hit box to the
 * drawn box. If they are the same, the target was made big by padding or
 * by line-height, which is visible in the layout. If the hit box is
 * taller, something invisible is extending it, which is what this run did.
 *
 * Read-only: computed styles, geometry, and hit tests. Nothing is clicked,
 * typed into, submitted or followed. External pages are data.
 *
 * usage: node bench-hit-areas.mjs out.json url [url ...]
 */
import { launch } from "../../review-kit/lib/browser.mjs";
import { writeFileSync } from "node:fs";

const OUT = process.argv[2];
const URLS = process.argv.slice(3);
const MIN = 44;

const probe = (MIN) => {
  const owns = (hit, el) => !!hit && (hit === el || el.contains(hit));
  const inlineInFlow = (el) => {
    const d = getComputedStyle(el).display;
    if (d !== "inline" && d !== "inline-block") return false;
    for (const n of el.parentElement?.childNodes ?? []) {
      if (n === el) continue;
      if (n.nodeType === 3 && /\S/.test(n.nodeValue ?? "")) return true;
    }
    return el.getClientRects().length > 1;
  };
  const extent = (el, from) => {
    if (!owns(document.elementFromPoint(from.x, from.y), el)) return null;
    let lo = from.y;
    let hi = from.y;
    for (let v = from.y - 1; v >= 0 && from.y - v < 200; v--) {
      if (!owns(document.elementFromPoint(from.x, v), el)) break;
      lo = v;
    }
    for (let v = from.y + 1; v < innerHeight && v - from.y < 200; v++) {
      if (!owns(document.elementFromPoint(from.x, v), el)) break;
      hi = v;
    }
    return hi - lo + 1;
  };

  const out = [];
  for (const el of document.querySelectorAll('a[href], button, [role="button"]')) {
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    const r0 = el.getBoundingClientRect();
    if (r0.width === 0 || r0.height === 0) continue;
    if (r0.top < 0 || r0.bottom > innerHeight) continue; // only what is on screen
    const line = el.getClientRects()[0] ?? r0;
    const hitH = extent(el, {
      x: line.left + line.width / 2,
      y: line.top + line.height / 2,
    });
    if (hitH === null) continue;
    out.push({
      label: (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 30),
      boxH: +r0.height.toFixed(1),
      hitH,
      inline: inlineInFlow(el),
      // invisible extension = the hit area is taller than anything drawn
      extended: hitH > Math.ceil(r0.height) + 1,
    });
  }
  return out;
};

const browser = await launch();
const results = {};
for (const url of URLS) {
  const [VW, VH] = (process.env.BENCH_VIEWPORT ?? "1440x900").split("x").map(Number);
  const ctx = await browser.newContext({
    viewport: { width: VW, height: VH },
    deviceScaleFactor: 1,
    ...(VW < 500 ? { isMobile: true, hasTouch: true } : {}),
  });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(2500);
    const rows = await page.evaluate(probe, MIN);
    const standalone = rows.filter((r) => !r.inline);
    const short = standalone.filter((r) => r.hitH < MIN);
    const extended = standalone.filter((r) => r.extended);
    results[url] = {
      targets: rows.length,
      standalone: standalone.length,
      inlineExempt: rows.length - standalone.length,
      shortOf44: short.length,
      medianStandaloneHit: standalone.length
        ? standalone.map((r) => r.hitH).sort((a, b) => a - b)[
            Math.floor(standalone.length / 2)
          ]
        : null,
      extendedInvisibly: extended.length,
      shortest: standalone
        .slice()
        .sort((a, b) => a.hitH - b.hitH)
        .slice(0, 4)
        .map((r) => `${r.hitH}px "${r.label}"`),
      rows,
    };
    const s = results[url];
    console.log(
      `${url.padEnd(34)} standalone ${String(s.standalone).padStart(3)}  ` +
        `median hit ${String(s.medianStandaloneHit).padStart(3)}px  ` +
        `under 44: ${String(s.shortOf44).padStart(2)}  ` +
        `invisibly extended: ${String(s.extendedInvisibly).padStart(2)}  ` +
        `(inline exempt ${s.inlineExempt})`,
    );
  } catch (e) {
    results[url] = { error: String(e).slice(0, 120) };
    console.log(`${url.padEnd(34)} FAILED ${String(e).slice(0, 80)}`);
  }
  await ctx.close();
}
await browser.close();
writeFileSync(OUT, JSON.stringify(results, null, 2));
