/**
 * Measure the real tappable area of every interactive control on the site.
 *
 * Reading getBoundingClientRect() is not enough here, because this
 * stylesheet's own established way of enlarging a hit area is an absolutely
 * positioned ::after overlay (.mark-link, 2026-10-12), which does not appear
 * in the element's own box at all. So this probes instead: it walks outward
 * from a point known to be inside the control, one CSS pixel at a time, and
 * asks the browser what is under the point. A pseudo-element is hit-tested
 * as the element that owns it, so the probe sees an overlay without having
 * to parse inset values off a stylesheet.
 *
 * Two things the first version of this file got wrong, both of which
 * produced confident nonsense:
 *
 *   1. It probed from the centre of getBoundingClientRect(). For an inline
 *      link that wraps across two lines, that centre lands in the leading
 *      between the line boxes, where the browser correctly reports the
 *      parent paragraph. Six controls came back "covered" and none of them
 *      was covered by anything. It now probes from inside the element's
 *      first *client* rect, which is one line box.
 *
 *   2. It applied the 44px floor to every target. WCAG 2.5.8 exempts a
 *      target that is inline in a sentence, and the exemption is not a
 *      technicality: an overlay that lifts an inline link to 44px reaches
 *      over the words above and below it and starts swallowing their
 *      clicks. So inline-in-flow targets are measured and reported, and
 *      counted separately from the standalone controls the floor is for.
 *
 *   3. It had two categories where the site has three, so the record
 *      viewer's document spans fell into whichever one their line
 *      wrapping happened to put them in (2026-10-25b). `inlineInFlow`
 *      ends on `getClientRects().length > 1`, which is true of a span
 *      that wraps and false of the same span at a width where it fits,
 *      and the spans in a `<pre>` have no bare text siblings to catch
 *      them on the earlier clause. Measured on the shipped build: of the
 *      same five spans, one was "standalone" at 390, four at 820, one at
 *      1440, and the rest were "inline, exempt" — one element, two
 *      verdicts, decided by the viewport.
 *
 *      The cost was not the misfiling. It was that the headline could
 *      never reach zero. Four consecutive reviews read "6 of 60
 *      standalone controls under the floor" on a site whose standalone
 *      controls were all fine, and a number that is never zero cannot be
 *      read as a pass: the seventh failure, the real one, arrives as a
 *      seven and looks like the six.
 *
 *      So document spans are their own category now, keyed on sitting
 *      inside a `<pre>`, which is what "this is a document rather than a
 *      layout" means in markup. They carry their own check rather than a
 *      pass: a tiled target cannot be made taller, since every overlay
 *      would reach over its neighbours and the topmost one would answer
 *      their presses, but it must still be hittable across the line you
 *      can see, so the check is `hit height >= its own line box`.
 *
 * Read-only. Nothing is clicked.
 *
 * usage: node measure-hit-areas.mjs out.txt [out.json]
 *        URSA_BASE overrides the server, VIEWPORT picks one of the three.
 */
import { launch, VIEWPORTS } from "./lib/browser.mjs";
import { writeFileSync } from "node:fs";

// Promoted into the kit on 2026-10-24g from the review that wrote it,
// `reviews/2026-10-24e/`, because a second surface needed it the same
// day and the kit exists so that the next run finds it instead of
// writing a third copy. The only change is that the three things that
// were hardcoded to ursa-minor are now flags.
//
//   node measure-hit-areas.mjs --base http://127.0.0.1:3000 \
//     --pages dashboard=/dashboard --out hit-areas.txt --json hit-areas.json
//
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1]; };
const BASE = arg("base", process.env.URSA_BASE ?? "http://127.0.0.1:4953");
const OUT = arg("out", "hit-areas.txt");
const JSON_OUT = arg("json", null);
const ONLY = arg("only", process.env.VIEWPORT ?? null);
const MIN = 44;
// Same gate shoot.mjs grew on 2026-10-24g: a surface that fetches after
// hydration has no controls at all until its data lands, and this script
// reported "0 targets seen" rather than failing, which is the worst way
// for a measurement to be wrong.
const UNTIL = arg("until", null);

// `name=/path`, comma separated. The default is ursa-minor's five, which
// is what every run of this script before today measured.
const PAGES = arg(
  "pages",
  "home=/,set=/record,record=/record/mini-fixture,address=/record/at,404=/this-page-does-not-exist",
)
  .split(",")
  .map((p) => {
    const i = p.indexOf("=");
    return [p.slice(0, i), p.slice(i + 1)];
  });

const probe = (MIN) => {
  /* A press "owns" a control if it lands on the control, on something
     inside it, or on the <label> that forwards to it. The third case is
     new on 2026-10-24e and it is a real semantic rather than a
     convenience: a label's activation behaviour runs on its labelled
     control, so a press on a label IS a press on the field, under a
     finger as much as under a mouse. Without this clause the three
     address fields measure as 27px while behaving as 44px, and the
     measurement would be the thing that is wrong. */
  const labelFor = (hit, el) => {
    for (let n = hit; n; n = n.parentElement) {
      if (n.tagName === "LABEL") return n.control === el;
      if (n === el) return false;
    }
    return false;
  };
  const owns = (hit, el) => !!hit && (hit === el || el.contains(hit) || labelFor(hit, el));

  /* Is this target part of a run of preformatted document text, rather
     than a control in a layout? A `<pre>` is the markup for "these bytes
     are a document", and the record viewer segments one edge to edge, so
     every target inside one abuts another target on all four sides. That
     is the thing the 44px floor cannot be applied to, and it is a fact
     about where the element sits rather than about how wide the window
     happens to be. The members of this category are listed in the output
     so that a control arriving inside a `<pre>` for some other reason is
     visible rather than silently exempt. */
  const documentSpan = (el) => !!el.closest("pre");

  /** Is this target inline in a run of text? WCAG 2.5.8's exemption. */
  const inlineInFlow = (el) => {
    const d = getComputedStyle(el).display;
    if (d !== "inline" && d !== "inline-block") return false;
    // a sibling text node with real words in it means we are in a sentence
    for (const n of el.parentElement?.childNodes ?? []) {
      if (n === el) continue;
      if (n.nodeType === 3 && /\S/.test(n.nodeValue ?? "")) return true;
    }
    // or we wrap across more than one line, which only happens in flow
    return el.getClientRects().length > 1;
  };

  const extent = (el, from, axis) => {
    const { x, y } = from;
    if (!owns(document.elementFromPoint(x, y), el)) return null;
    const at = (v) =>
      axis === "y"
        ? document.elementFromPoint(x, v)
        : document.elementFromPoint(v, y);
    const start = axis === "y" ? y : x;
    const limit = axis === "y" ? window.innerHeight : window.innerWidth;
    let lo = start;
    let hi = start;
    for (let v = start - 1; v >= 0 && start - v < 300; v--) {
      if (!owns(at(v), el)) break;
      lo = v;
    }
    for (let v = start + 1; v < limit && v - start < 300; v++) {
      if (!owns(at(v), el)) break;
      hi = v;
    }
    return hi - lo + 1;
  };

  const out = [];
  const sel = 'a[href], button, [role="button"], summary, input, select';
  for (const el of document.querySelectorAll(sel)) {
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    let r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    el.scrollIntoView({ block: "center", behavior: "instant" });

    // probe from inside one line box, not from the middle of a
    // multi-line bounding box
    const rects = [...el.getClientRects()];
    r = el.getBoundingClientRect();
    const line = rects.length ? el.getClientRects()[0] : r;
    const from = {
      x: line.left + line.width / 2,
      y: line.top + line.height / 2,
    };

    const hitH = extent(el, from, "y");
    const hitW = extent(el, from, "x");
    const doc = documentSpan(el);
    const inline = !doc && inlineInFlow(el);
    out.push({
      tag: el.tagName.toLowerCase(),
      cls: el.getAttribute("class")?.split(" ")[0] ?? "",
      label: (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 40),
      display: cs.display,
      lines: rects.length,
      boxW: +r.width.toFixed(1),
      boxH: +r.height.toFixed(1),
      lineH: +line.height.toFixed(1),
      hitW,
      hitH,
      inline,
      doc,
      short: !inline && !doc && hitH !== null && hitH < MIN,
      // a tiled target's own floor: you must be able to hit the line you
      // can read. Null where the question does not apply.
      coversLine: doc && hitH !== null ? hitH >= Math.round(line.height) : null,
      afterPosition: getComputedStyle(el, "::after").position,
    });
  }
  return out;
};

const browser = await launch();
const lines = [];
const all = {};
for (const [vname, w, h] of VIEWPORTS) {
  if (ONLY && ONLY !== vname) continue;
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  for (const [name, path] of PAGES) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    if (UNTIL) await page.waitForSelector(UNTIL, { timeout: 30000 });
    await page.waitForTimeout(250);
    const rows = await page.evaluate(probe, MIN);
    all[`${vname}/${name}`] = rows;
    lines.push(`\n=== ${vname} ${w}x${h} · ${name} ${path} ===`);
    lines.push(
      "  " +
        "box WxH".padEnd(14) +
        "hit WxH".padEnd(13) +
        "lines".padEnd(7) +
        "verdict".padEnd(18) +
        "control",
    );
    for (const r of rows) {
      const verdict = r.hitH === null
        ? "COVERED"
        : r.doc
          ? r.coversLine
            ? "document, exempt"
            : `UNDER LINE by ${Math.round(r.lineH) - r.hitH}`
          : r.inline
            ? "inline, exempt"
            : r.hitH < MIN
              ? `SHORT by ${MIN - r.hitH}`
              : "ok";
      lines.push(
        "  " +
          `${r.boxW}x${r.boxH}`.padEnd(14) +
          `${r.hitW ?? "-"}x${r.hitH ?? "-"}`.padEnd(13) +
          String(r.lines).padEnd(7) +
          verdict.padEnd(18) +
          `${r.tag}.${r.cls} "${r.label}"`,
      );
    }
    const standalone = rows.filter((r) => !r.inline && !r.doc);
    const short = standalone.filter((r) => r.short);
    const docs = rows.filter((r) => r.doc);
    lines.push(
      `  -> ${short.length} of ${standalone.length} standalone controls under ${MIN}px tall` +
        ` (${rows.filter((r) => r.inline).length} inline, exempt;` +
        ` ${docs.length} document spans, ${docs.filter((r) => r.coversLine === false).length} not covering their own line)`,
    );
  }
  await ctx.close();
}
await browser.close();

const rowsAll = Object.values(all).flat();
const sa = rowsAll.filter((r) => !r.inline && !r.doc);
const inl = rowsAll.filter((r) => r.inline);
const dsp = rowsAll.filter((r) => r.doc);
const badDoc = dsp.filter((r) => r.coversLine === false);
lines.push(
  `\n=== total across every page and viewport ===\n  ${sa.filter((r) => r.short).length} short of ${sa.length} standalone, ` +
    `${inl.length} inline and exempt by 2.5.8, ` +
    `${dsp.length} document spans (${badDoc.length} not covering their own line), ` +
    `${rowsAll.length} targets seen`,
);
// The membership of the third category, printed rather than asserted: it
// is exempt from the floor, so a control that lands in it by accident is
// a control nobody is checking. One line per distinct class and page.
const docKeys = [...new Set(dsp.map((r) => `${r.tag}.${r.cls}`))].sort();
lines.push(
  `  document spans are: ${docKeys.join(", ") || "none"}` +
    `, on ${[...new Set(Object.entries(all).filter(([, rs]) => rs.some((r) => r.doc)).map(([k]) => k.split("/")[1]))].sort().join(", ") || "no page"}`,
);

const text = lines.join("\n") + "\n";
writeFileSync(OUT, text);
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify(all, null, 2));
console.log(text);
