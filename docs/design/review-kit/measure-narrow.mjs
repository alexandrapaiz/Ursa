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
 *   4. **A full-bleed decorative layer is not clipped content.** This
 *      clause was not foresight. The first version of this file had the
 *      three above and was run against `ursa-minor`, and it reported
 *      content out of reach on 8 of 20 cells, at every width including
 *      390. All eight were `PixelSky`'s canvas, which is `position:
 *      fixed; inset: 0` under `transform: matrix(1.05, …)`: a deliberate
 *      five percent overscan, so a 320px viewport gets a 336px canvas
 *      centred at -8, and 390 gets 409.5 at -9.75. Both numbers are the
 *      scale arithmetic exactly, measured in `data/probe-canvas.mjs`
 *      rather than read off the stylesheet. The sky bleeds past the
 *      viewport on purpose and the reader loses nothing, so a count that
 *      included it could never have reached zero, which is the one thing
 *      L19 says a measurement must not do.
 *
 *   7. **"Past the right edge" is only reachable if the page actually
 *      scrolls there, and a closed drawer is not a defect.** Both found
 *      on Stripe in the same benchmark pass. It reported `fits` while
 *      naming `button.hds-button` reaching 688px in a 320px viewport,
 *      which cannot both be true of a page that scrolls. Neither
 *      `html` nor `body` clips there (`data/probe-root-clip.mjs`), so
 *      the button is `position: fixed`, and a fixed box adds nothing to
 *      `scrollWidth`: no gesture brings it into view. The rule is
 *      therefore the honest one rather than the easy one. A right-hand
 *      offender is reachable only if `scrollWidth` reaches its right
 *      edge, and anything past that joins the unreachable count.
 *
 *      Which immediately exposes the opposite error, because the
 *      commonest fixed box parked off the right of a phone viewport is
 *      an off-canvas menu that is closed. It is unreachable, and that is
 *      the whole design. So the walk now skips what the browser itself
 *      says is not being shown: `checkVisibility`, `[aria-hidden]` and
 *      `[inert]`. A drawer that opens on a press is exempt; a drawer
 *      that is visible, exposed and off the side of the screen is not.
 *
 *   6. **Text hidden for a screen reader is hidden on purpose.** Found
 *      by pointing this at the five sites L5 names, which is what the
 *      benchmark step is for: Stripe and Consensus both came back
 *      "4 of 4 cells put content out of reach", and on every one of the
 *      eight the offender was `p#__next-route-announcer__` or
 *      `div.sr-only`, clipped by exactly 1px. Those are the canonical
 *      visually-hidden affordances, a 1x1 box holding text meant for
 *      assistive technology and for nobody's eyes. An instrument that
 *      calls them a defect would report every Next.js site on the web as
 *      broken.
 *
 *      The gate is the geometry rather than the class name, since
 *      `sr-only`, `visually-hidden` and `screen-reader-text` are three
 *      spellings of one idea and the next site will have a fourth:
 *      2px or less in *both* dimensions is a box nothing legible fits
 *      in. A hairline rule is 1px in one dimension and hundreds in the
 *      other, so it does not match, and neither does anything a reader
 *      was meant to see.
 *
 *   5. **A layout still moving is not a layout.** Also not foresight.
 *      With clause 4 in, two consecutive sweeps of `ursa-minor`
 *      disagreed about the home page: one reported the sky bleeding
 *      -8..328 at 320px and the next reported no offender on that page
 *      at all. Neither was a bad read of the pixels. `data/
 *      probe-canvas-time.mjs` sampled the canvas every 250ms and found
 *      the transform arriving after hydration rather than with the
 *      markup: on the 404 page it is `none` on the first sample and
 *      `matrix(1.05, …)` by the second. `networkidle` had already
 *      fired both times, so the gate the instrument had was not a gate
 *      on this.
 *
 *      A fixed `--settle` would have hidden it rather than fixed it, and
 *      L15 is the entry that says a timeout is not a wait. So the
 *      measurement is taken when the geometry stops changing: the probe
 *      runs, waits, runs again, and only reports when two consecutive
 *      reads of every edge agree. `settledAfterMs` is in the JSON and a
 *      cell that never settles is named rather than reported, because an
 *      unstable layout is itself the finding.
 *
 *      The gate is mechanical rather than a list of selectors to ignore:
 *      an element is decoration if it cannot be pressed
 *      (`pointer-events: none`), contains no text, and contains nothing
 *      focusable. L25's actual defect fails all three of those, because
 *      the box it was about was `main`. Decorative bleed is still
 *      reported, in its own column, so that a sky which starts bleeding
 *      300px is visible; it is just not counted as content put out of
 *      reach.
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

// The page column is as wide as the widest name in this run plus a space,
// never a number somebody guessed. It was 10, and `--pages panel-synced=/`
// printed `320   panel-synced320 at 0`, which runs the width into the name
// and the name into the box. A table whose columns collide is a table that
// gets read wrong, and this instrument's whole job is to be read.
const LABEL_W = Math.max(6, ...PAGES.map(([label]) => label.length)) + 2;

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

  /* Decoration, by three mechanical tests rather than by name: it
     cannot be pressed, it says nothing, and nothing in it can be
     focused. A sky that bleeds 5% past the viewport passes all three.
     `main`, which is what L25 was actually about, fails all three. */
  const isDecoration = (el) => {
    if (getComputedStyle(el).pointerEvents !== "none") return false;
    if ((el.textContent || "").trim().length > 0) return false;
    return !el.querySelector("a, button, input, select, textarea, [tabindex], [contenteditable]");
  };

  const right = [];   // past the right edge, reachable by scrolling the page
  const clipped = []; // left of zero, reachable by nothing
  const contained = new Map(); // offenders a scroll container owns
  const bleed = [];   // decoration deliberately wider than the viewport
  let hidden = 0;     // sr-only and friends: 2px or less in both dimensions

  /* Is the browser showing this to anybody? A closed off-canvas drawer
     is parked off the side of the screen on purpose, and the only
     difference between it and a clipped panel is whether it is being
     presented. Ask the browser rather than guess. */
  const shown = (el) => {
    if (typeof el.checkVisibility === "function" &&
        !el.checkVisibility({ checkVisibilityCSS: true, checkOpacity: true })) return false;
    return !el.closest("[aria-hidden='true'], [inert]");
  };

  for (const el of d.querySelectorAll("*")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const over = r.right > vw + 0.5;
    const under = r.left < -0.5;
    if (!over && !under) continue;
    if (r.width <= 2 && r.height <= 2) { hidden++; continue; }

    const sc = scroller(el);
    if (sc) {
      const k = name(sc);
      contained.set(k, (contained.get(k) || 0) + 1);
      continue;
    }
    // How many characters go off the edge with it. A clipped box that
    // carries no text is a different conversation from one that carries
    // a paragraph, and the row should not make the reader go and look.
    const row = {
      sel: name(el),
      left: +r.left.toFixed(1),
      right: +r.right.toFixed(1),
      w: +r.width.toFixed(1),
      chars: (el.textContent || "").trim().length,
    };
    // Decoration is tested before visibility, not after. Backdrops are
    // very often `aria-hidden`, correctly so, and checking exposure first
    // swallowed every bleed on this site into the hidden bucket: the sky
    // went from 8 cells reported to 0 and the clause above stopped
    // meaning anything.
    if (isDecoration(el)) { bleed.push(row); continue; }
    if (!shown(el)) { hidden++; continue; }
    // A left-hand clip is unreachable outright. A right-hand one is
    // unreachable too unless the page can actually be scrolled to it,
    // which a `position: fixed` box never can.
    if (under || r.right > d.scrollWidth + 0.5) clipped.push(row);
    else if (over) right.push(row);
  }

  /* The deepest offender is the interesting one for a clip and the
     widest for an overflow, but what a reader needs is the outermost box
     that is already wrong, because that is where the fix goes. Sorting
     by left edge ascending puts the worst clip first; by right edge
     descending puts the worst overflow first. */
  clipped.sort((a, b) => a.left - b.left);
  right.sort((a, b) => b.right - a.right);
  bleed.sort((a, b) => a.left - b.left);

  /* The content box, for the one column that says whether the layout is
     tracking the viewport at all. Its name is reported with it: the
     first version fell back to `body.firstElementChild` when there was
     no `<main>`, and on the overlay's dashboard that is a zero-width
     node, so the column read `main 0 at 0` on a page that was laid out
     correctly. A box this instrument could not find has to say so
     rather than print a zero that reads like a measurement. */
  const main = d.querySelector("main, .dash-page, [role=main]");
  const mr = main?.getBoundingClientRect();

  return {
    vw,
    overflow: d.scrollWidth - vw,
    main: mr ? { sel: name(main), w: +mr.width.toFixed(1), left: +mr.left.toFixed(1) } : null,
    clipped: clipped.slice(0, 4),
    clippedCount: clipped.length,
    right: right.slice(0, 4),
    rightCount: right.length,
    bleed: bleed.slice(0, 4),
    bleedCount: bleed.length,
    hiddenCount: hidden,
    contained: [...contained].map(([sel, n]) => `${sel}×${n}`),
  };
};

/* Take the measurement when the page has stopped moving, not after a
   number of milliseconds somebody guessed. Every edge this instrument
   reports goes into the signature, so a transform arriving late, a font
   swapping, or data landing all keep it reading until they are done. */
const SETTLE_STEP = Number(arg("settle-step", 200));
const SETTLE_CAP = Number(arg("settle-cap", 4000));
const sig = (m) =>
  JSON.stringify([m.overflow, m.main, m.clipped, m.right, m.bleed, m.contained, m.hiddenCount]);

async function settle(page) {
  let prev = await page.evaluate(probe);
  for (let waited = SETTLE_STEP; waited <= SETTLE_CAP; waited += SETTLE_STEP) {
    await page.waitForTimeout(SETTLE_STEP);
    const next = await page.evaluate(probe);
    if (sig(next) === sig(prev)) return { ...next, settled: true, settledAfterMs: waited };
    prev = next;
  }
  return { ...prev, settled: false, settledAfterMs: null };
}

const browser = await launch();
const rows = [];
const failures = [];
const unsettled = [];
const json = [];

for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: HEIGHT }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const [label, path] of PAGES) {
    try {
      await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 45000 });
      if (UNTIL) await page.waitForSelector(UNTIL, { timeout: 30000 });
      if (enterState) await enterState(page, label);
      const m = await settle(page);
      json.push({ width: w, page: label, path, ...m });
      if (!m.settled) unsettled.push(`  ${w} ${label} (${path}): edges still moving after ${SETTLE_CAP}ms`);
      // Say which edge, because the fix is in a different place for each:
      // a negative left is a box centred wider than its viewport, and an
      // unreachable right is usually something fixed or absolutely placed.
      const worst = m.clipped[0];
      const verdict = m.clippedCount
        ? worst.left < 0
          ? `CLIPPED ${Math.abs(worst.left).toFixed(0)}px off the left`
          : `${(worst.right - m.vw).toFixed(0)}px off the right, unscrollable`
        : m.overflow > 0
          ? `overflows ${m.overflow}px, scrollable`
          : "fits";
      rows.push(
        `  ${String(w).padEnd(6)}${label.padEnd(LABEL_W)}` +
        `${String(m.main ? `${m.main.w} at ${m.main.left}` : "no content box").padEnd(16)}` +
        `${verdict.padEnd(34)}` +
        (m.clippedCount
          ? `${m.clipped[0].sel} (${m.clipped[0].chars} chars)`
          : m.rightCount
            ? `widest ${m.right[0].sel} to ${m.right[0].right.toFixed(0)}`
            : "") +
        (m.bleedCount ? `  [bleed: ${m.bleed[0].sel} ${m.bleed[0].left}..${m.bleed[0].right.toFixed(0)}${m.bleedCount > 1 ? ` +${m.bleedCount - 1}` : ""}]` : "") +
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
  `  ${"width".padEnd(6)}${"page".padEnd(LABEL_W)}${"content box".padEnd(16)}${"verdict".padEnd(34)}where`,
  ...rows,
  "",
  // The headline names its own denominator, because L23 measured that a
  // denominator of zero reads exactly like a pass, and it refuses to
  // report a pass while any cell is unmeasured.
  failures.length || unsettled.length
    ? `  NOT MEASURED: ${failures.length + unsettled.length} of ${cells} page-by-width cells could not be loaded or never came to rest, so this run makes no claim about them.`
    : `  ${clipped.length} of ${cells} page-by-width cells put content out of reach; ${over.length} overflow reachably; ` +
      `${json.filter((r) => r.bleedCount > 0).length} carry decoration that bleeds on purpose and is not counted.`,
  ...(failures.length ? ["", "  COULD NOT LOAD", ...failures] : []),
  ...(unsettled.length ? ["", "  NEVER CAME TO REST", ...unsettled] : []),
].join("\n");

console.log(out);
writeFileSync(OUT, out + "\n");
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify(json, null, 2) + "\n");
