/**
 * How do other people size a text field, and what does its focus ring
 * trace?
 *
 * The 2026-10-24d run benchmarked 127 standalone controls across six
 * sites and derived a floor from them. It did not measure one field,
 * because its subject was links and buttons. Fields are the harder case
 * and the one this run hit: a field is a box you can see, and the ring
 * is drawn around that box, so "make the target bigger" and "leave the
 * drawing alone" pull against each other in a way they never do for a
 * link. The question worth asking of six companies is which side they
 * come down on.
 *
 * For every text input on a page this records the drawn box, the target
 * (walking up to a wrapping label, because that is the mechanism this
 * run ended up using), whether focus draws a ring, and what the ring
 * traces. Nothing is clicked, typed into or submitted; focus is set
 * programmatically and read back, and the page is left as found.
 *
 * External content is data. Nothing read here instructs this seat, and
 * the sources are named in the review.
 *
 * usage: node bench-fields.mjs out.json <url> [url...]
 *        BENCH_VIEWPORT=390x844 picks the phone
 */
import { launch } from "../../review-kit/lib/browser.mjs";
import { writeFileSync } from "node:fs";

const OUT = process.argv[2] ?? "/tmp/bench-fields.json";
const URLS = process.argv.slice(3);
const [W, H] = (process.env.BENCH_VIEWPORT ?? "1440x900").split("x").map(Number);

const browser = await launch();
const all = {};
for (const url of URLS) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(2500);
    all[url] = await page.evaluate(() => {
      const r1 = (n) => Math.round(n * 10) / 10;
      const out = [];
      const sel = 'input[type="text"], input[type="email"], input[type="url"], input[type="search"], input:not([type]), textarea';
      for (const el of document.querySelectorAll(sel)) {
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none") continue;
        const box = el.getBoundingClientRect();
        if (box.width < 40 || box.height === 0) continue;

        // the target: the field, or the label that forwards to it
        let target = el;
        for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
          if (n.tagName === "LABEL" && n.control === el) { target = n; break; }
        }
        const tbox = target.getBoundingClientRect();

        // what does focus draw, and what does it trace?
        const was = document.activeElement;
        const rest = { outline: cs.outlineWidth + " " + cs.outlineStyle, boxShadow: cs.boxShadow, borderColor: cs.borderBottomColor, bg: cs.backgroundColor };
        el.focus();
        const f = getComputedStyle(el);
        const ringBox = el.getBoundingClientRect();
        const ring = {
          outlineWidth: f.outlineWidth,
          outlineStyle: f.outlineStyle,
          outlineOffset: f.outlineOffset,
          boxShadow: f.boxShadow === "none" ? "none" : f.boxShadow.slice(0, 60),
          borderWidth: [f.borderTopWidth, f.borderRightWidth, f.borderBottomWidth, f.borderLeftWidth].join("/"),
          /* A field drawn as a box can absorb a bigger target for free,
             because it already looks like a box. A field drawn as a rule
             under its text cannot: grow it and the ring grows with it.
             Which of the two a field is, is the question this records. */
          drawnAs: (() => {
            const w = [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].map(parseFloat);
            const opaque = cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent";
            const sides = w.filter((x) => x > 0).length;
            if (opaque || sides >= 3) return "a box";
            if (sides === 1 && w[2] > 0) return "a rule under the text";
            if (sides === 0) return "nothing at all";
            return `${sides} border side(s)`;
          })(),
          background: cs.backgroundColor,
          /* When the field draws nothing, something above it is drawing
             the box the eye calls the field. Finding that element, and
             asking how tall it is and whether it is a <label>, is how
             you tell "the target is the drawing" apart from "the target
             is bigger than the drawing", which is the whole question. */
          visualOwner: (() => {
            for (let p = el.parentElement, up = 0; p && up < 5; p = p.parentElement, up++) {
              const c = getComputedStyle(p);
              const w = [c.borderTopWidth, c.borderRightWidth, c.borderBottomWidth, c.borderLeftWidth].map(parseFloat);
              const opaque = c.backgroundColor !== "rgba(0, 0, 0, 0)" && c.backgroundColor !== "transparent";
              if (opaque || w.filter((x) => x > 0).length >= 3) {
                const r = p.getBoundingClientRect();
                return { tag: p.tagName.toLowerCase(), up: up + 1, h: r1(r.height), isLabel: p.tagName === "LABEL", forwards: p.tagName === "LABEL" && p.control === el, radius: c.borderRadius };
              }
            }
            return null;
          })(),
          tracesH: r1(ringBox.height),
          changedOnFocus: [
            rest.outline !== f.outlineWidth + " " + f.outlineStyle ? "outline" : null,
            rest.boxShadow !== f.boxShadow ? "box-shadow" : null,
            rest.borderColor !== f.borderBottomColor ? "border-colour" : null,
            rest.bg !== f.backgroundColor ? "background" : null,
          ].filter(Boolean),
        };
        el.blur();
        if (was && was.focus) was.focus();

        out.push({
          tag: el.tagName.toLowerCase(),
          type: el.getAttribute("type") ?? "",
          name: (el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.getAttribute("name") || "").slice(0, 36),
          boxW: r1(box.width),
          boxH: r1(box.height),
          targetTag: target.tagName.toLowerCase(),
          targetH: r1(tbox.height),
          padT: cs.paddingTop,
          padB: cs.paddingBottom,
          fontSize: cs.fontSize,
          ring,
        });
      }
      return out;
    });
  } catch (e) {
    all[url] = { error: String(e).slice(0, 140) };
  }
  await ctx.close();
}
await browser.close();
writeFileSync(OUT, JSON.stringify(all, null, 1));

// the report
const rows = [];
let n = 0, under44 = 0, under24 = 0, ringTraces = 0, ringBigger = 0;
for (const [url, fields] of Object.entries(all)) {
  if (!Array.isArray(fields)) { rows.push(`${url}  -> ${fields.error}`); continue; }
  rows.push(`\n=== ${url} · ${W}x${H} · ${fields.length} field(s) ===`);
  for (const f of fields) {
    n++;
    if (f.targetH < 44) under44++;
    if (f.targetH < 24) under24++;
    const drawsRing = f.ring.outlineStyle !== "none" && f.ring.outlineWidth !== "0px";
    if (drawsRing) { if (Math.abs(f.ring.tracesH - f.boxH) < 0.5) ringTraces++; else ringBigger++; }
    rows.push(
      `  ${f.tag}${f.type ? `[${f.type}]` : ""} "${f.name}"`.padEnd(46) +
      `box ${String(f.boxH).padStart(5)}  target ${String(f.targetH).padStart(5)} (${f.targetTag})  ` +
      `pad ${f.padT}/${f.padB}  ring ${drawsRing ? `${f.ring.outlineWidth} off ${f.ring.outlineOffset}` : f.ring.boxShadow !== "none" ? "box-shadow" : "none"}`,
    );
  }
}
rows.push(`\n=== ${n} fields: ${under44} under 44px of target, ${under24} under 24px ===`);
rows.push(`    of the ones drawing an outline ring, ${ringTraces} trace the drawn box exactly, ${ringBigger} do not`);
console.log(rows.join("\n"));
writeFileSync(OUT.replace(/\.json$/, ".txt"), rows.join("\n") + "\n");
