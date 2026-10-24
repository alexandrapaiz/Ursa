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
 * Read-only. Nothing is clicked.
 *
 * usage: node measure-hit-areas.mjs out.txt [out.json]
 *        URSA_BASE overrides the server, VIEWPORT picks one of the three.
 */
import { launch, VIEWPORTS } from "../../review-kit/lib/browser.mjs";
import { writeFileSync } from "node:fs";

const BASE = process.env.URSA_BASE ?? "http://127.0.0.1:4953";
const OUT = process.argv[2] ?? "hit-areas.txt";
const JSON_OUT = process.argv[3] ?? null;
const ONLY = process.env.VIEWPORT ?? null;
const MIN = 44;

const PAGES = [
  ["home", "/"],
  ["set", "/record"],
  ["record", "/record/mini-fixture"],
  ["address", "/record/at"],
  ["404", "/this-page-does-not-exist"],
];

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
    const inline = inlineInFlow(el);
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
      short: !inline && hitH !== null && hitH < MIN,
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
      const verdict = r.inline
        ? "inline, exempt"
        : r.hitH === null
          ? "COVERED"
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
    const standalone = rows.filter((r) => !r.inline);
    const short = standalone.filter((r) => r.short);
    lines.push(
      `  -> ${short.length} of ${standalone.length} standalone controls under ${MIN}px tall` +
        ` (${rows.length - standalone.length} inline, exempt)`,
    );
  }
  await ctx.close();
}
await browser.close();

const rowsAll = Object.values(all).flat();
const sa = rowsAll.filter((r) => !r.inline);
lines.push(
  `\n=== total across every page and viewport ===\n  ${sa.filter((r) => r.short).length} short of ${sa.length} standalone, ` +
    `${rowsAll.length - sa.length} inline and exempt, ${rowsAll.length} targets seen`,
);

const text = lines.join("\n") + "\n";
writeFileSync(OUT, text);
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify(all, null, 2));
console.log(text);
