/**
 * What every surface does below the narrowest viewport this seat reviews.
 *
 * The charter fixes three viewports and the narrowest is 390. L25 is the
 * entry that cost: `main` in the overlay's stylesheet was `width: 380px`
 * with `margin: 0 auto`, and centring a box that does not fit drives the
 * left margin negative, so below 380 that panel overflowed on the right
 * AND was cut off on the left at the same time. Six reviews of that
 * surface never found it, not through carelessness but because a defect
 * that only exists below 390 is invisible to every instrument this seat
 * owns. The one-off probe that found it lived in that review's own data
 * directory (`reviews/2026-10-26/data/probe-narrow.mjs`) and measured
 * two surfaces. This is that probe promoted, generalised and taught the
 * three things it got away with not knowing.
 *
 *   1. **Overflow on the right is not the same defect as a clipped left
 *      edge.** A page wider than its viewport can be scrolled to; the
 *      reader is annoyed. A box whose left edge is at -16px cannot be
 *      reached by any gesture, because there is nothing to the left of
 *      scroll offset zero. That is content deleted from the reader's
 *      point of view, and it is what L25 actually found. The old probe
 *      printed both numbers in adjacent columns and left the reader to
 *      know which one mattered. This one separates them by name and the
 *      headline counts only the unreachable kind.
 *
 *   2. **Some overflow is a feature and the page says so.** `.rec-cmd`
 *      in `ursa-minor/app/globals.css` is `white-space: pre` with
 *      `overflow-x: auto` on purpose, with eleven lines of comment
 *      explaining that a command must break where the command breaks.
 *      Its content is wider than the viewport at every width and that is
 *      correct. So an offender is attributed to the nearest ancestor that
 *      scrolls, and anything held inside one is reported as contained
 *      rather than counted as a defect. Without this clause the
 *      instrument would report the record viewer as broken at every width
 *      and be wrong, which is the failure mode L19 and L23 are both about.
 *
 *   3. **A page that did not load is not a page that passed.** The old
 *      probe gated on a selector and would have thrown, but it counted
 *      nothing, so a surface missing from the output read as a surface
 *      with no findings. Every page×width cell is accounted for here:
 *      measured, or named in a `COULD NOT LOAD` list that the headline
 *      refuses to call a pass.
 *
 * Read-only. Nothing is clicked. Geometry is the only thing taken.
 *
 * usage:
 *   node measure-narrow.mjs --base http://127.0.0.1:4953 \
 *     --pages home=/,set=/record --widths 320,360,375,390 \
 *     --until ".rec-head" --out narrow.txt --json narrow.json
 */
import { launch } from "./lib/browser.mjs";
import { writeFileSync } from "node:fs";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1]; };
const BASE = arg("base", process.env.URSA_BASE ?? "http://127.0.0.1:4953");
const OUT = arg("out", "narrow.txt");
const JSON_OUT = arg("json", null);
const UNTIL = arg("until", null);
const HEIGHT = Number(arg("height", 844));

// 320 is an iPhone SE first generation and the cover screen of a folding
// phone. 360 is the single commonest Android width in the field. 375 is
// an iPhone SE second and third generation and an iPhone 8, which are
// still sold and still in hands. 390 is the charter's own narrowest
// review viewport, included so that every run of this instrument carries
// its own control: a finding at 390 is a finding the standard matrix
// should already have caught, and a finding only below it is the class
// L25 named.
const WIDTHS = arg("widths", "320,360,375,390").split(",").map(Number);

// Same `--state` contract as shoot.mjs and measure-hit-areas.mjs: a
// module whose default export is `async (page, name) => {}`, run after
// the navigation and after `--until`. A surface is not a path.
const STATE = arg("state", null);
const enterState = STATE
  ? (await import(new URL(STATE, `file://${process.cwd()}/`).href)).default
  : null;

const PAGES = arg(
  "pages",
  "home=/,set=/record,record=/record/mini-fixture,address=/record/at,404=/this-page-does-not-exist",
)
  .split(",")
  .map((p) => { const i = p.indexOf("="); return [p.slice(0, i), p.slice(i + 1)]; });

const probe = () => {
  const d = document.documentElement;
  const vw = d.clientWidth;

  const name = (el) => {
    const cls = (el.getAttribute("class") || "").split(/\s+/).filter(Boolean)[0];
    return el.tagName.toLowerCase() + (cls ? `.${cls}` : el.id ? `#${el.id}` : "");
  };

  /* The nearest ancestor that scrolls horizontally, if any. `hidden`
     counts: a box that clips its own children on purpose has made the
     same decision as one that scrolls them, and in both cases the
     child's width is not a claim about the viewport. `visible` and
     `clip` do not: those let the child push the page. */
  const scroller = (el) => {
    for (let n = el.parentElement; n && n !== d; n = n.parentElement) {
      const ox = getComputedStyle(n).overflowX;
      if (ox === "auto" || ox === "scroll" || ox === "hidden") return n;
    }
    return null;
  };

  const right = [];   // past the right edge, reachable by scrolling the page
  const clipped = []; // left of zero, reachable by nothing
  const contained = new Map(); // offenders a scroll container owns

  for (const el of d.querySelectorAll("*")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const over = r.right > vw + 0.5;
    const under = r.left < -0.5;
    if (!over && !under) continue;

    const sc = scroller(el);
    if (sc) {
      const k = name(sc);
      contained.set(k, (contained.get(k) || 0) + 1);
      continue;
    }
    const row = { sel: name(el), left: +r.left.toFixed(1), right: +r.right.toFixed(1), w: +r.width.toFixed(1) };
    if (under) clipped.push(row);
    if (over) right.push(row);
  }

  /* The deepest offender is the interesting one for a clip and the
     widest for an overflow, but what a reader needs is the outermost box
     that is already wrong, because that is where the fix goes. Sorting
     by left edge ascending puts the worst clip first; by right edge
     descending puts the worst overflow first. */
  clipped.sort((a, b) => a.left - b.left);
  right.sort((a, b) => b.right - a.right);

  const main = d.querySelector("main") || document.body.firstElementChild;
  const mr = main?.getBoundingClientRect();

  return {
    vw,
    overflow: d.scrollWidth - vw,
    main: mr ? { w: +mr.width.toFixed(1), left: +mr.left.toFixed(1) } : null,
    clipped: clipped.slice(0, 4),
    clippedCount: clipped.length,
    right: right.slice(0, 4),
    rightCount: right.length,
    contained: [...contained].map(([sel, n]) => `${sel}×${n}`),
  };
};

const browser = await launch();
const rows = [];
const failures = [];
const json = [];

for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: HEIGHT }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const [label, path] of PAGES) {
    try {
      await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 45000 });
      if (UNTIL) await page.waitForSelector(UNTIL, { timeout: 30000 });
      if (enterState) await enterState(page, label);
      const m = await page.evaluate(probe);
      json.push({ width: w, page: label, path, ...m });
      const verdict = m.clippedCount
        ? `CLIPPED ${Math.abs(m.clipped[0].left).toFixed(0)}px out of reach`
        : m.overflow > 0
          ? `overflows ${m.overflow}px, scrollable`
          : "fits";
      rows.push(
        `  ${String(w).padEnd(6)}${label.padEnd(10)}` +
        `main ${String(m.main ? `${m.main.w} at ${m.main.left}` : "none").padEnd(16)}` +
        `${verdict.padEnd(30)}` +
        (m.clippedCount ? m.clipped[0].sel : m.rightCount ? `widest ${m.right[0].sel} to ${m.right[0].right.toFixed(0)}` : "") +
        (m.contained.length ? `  [contained: ${m.contained.join(" ")}]` : ""),
      );
    } catch (e) {
      failures.push(`  ${w} ${label} (${path}): ${String(e.message).split("\n")[0]}`);
      json.push({ width: w, page: label, path, error: String(e.message).split("\n")[0] });
    }
  }
  await ctx.close();
}
await browser.close();

const cells = WIDTHS.length * PAGES.length;
const clipped = json.filter((r) => r.clippedCount > 0);
const over = json.filter((r) => !r.clippedCount && r.overflow > 0);

const out = [
  `  base ${BASE}   widths ${WIDTHS.join(", ")}   height ${HEIGHT}` + (STATE ? `   state ${STATE}` : ""),
  "",
  "  width page      main box at left  verdict                       where",
  ...rows,
  "",
  // The headline names its own denominator, because L23 measured that a
  // denominator of zero reads exactly like a pass, and it refuses to
  // report a pass while any cell is unmeasured.
  failures.length
    ? `  NOT MEASURED: ${failures.length} of ${cells} page-by-width cells could not be loaded, so this run makes no claim about them.`
    : `  ${clipped.length} of ${cells} page-by-width cells put content out of reach; ${over.length} overflow reachably.`,
  ...(failures.length ? ["", "  COULD NOT LOAD", ...failures] : []),
].join("\n");

console.log(out);
writeFileSync(OUT, out + "\n");
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify(json, null, 2) + "\n");
