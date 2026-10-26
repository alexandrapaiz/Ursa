/**
 * The benchmark this run's finding asks for.
 *
 * Today the hit-area instrument reported "0 of 0 standalone controls
 * under 44px" on the overlay's dashboard, because every control on that
 * page is a button sitting inside a sentence and therefore exempt under
 * WCAG 2.5.8. That exemption is load-bearing: it is the reason the page
 * reads as a pass. So the question worth asking the field is whether a
 * control inside a sentence is a pattern design-led products actually
 * ship, and if so how tall they let it be.
 *
 * The probe is the one in `measure-hit-areas.mjs`, cut down: walk
 * outward from a point inside the control and ask the browser what is
 * under it, so a padding target and an invisible overlay are both
 * counted, and classify inline-in-flow the same way the instrument does
 * — an inline display with a bare text sibling that has words in it.
 *
 * Read-only. Nothing is clicked, typed into, submitted or followed, and
 * everything these pages say is data rather than instruction.
 *
 *   node data/bench-inline-controls.mjs data/bench-inline.json <url> [url ...]
 */
import { launch } from "../../../review-kit/lib/browser.mjs";
import { writeFileSync } from "node:fs";

const OUT = process.argv[2];
const URLS = process.argv.slice(3);

const probe = () => {
  const owns = (hit, el) => !!hit && (hit === el || el.contains(hit));
  const inlineInFlow = (el) => {
    const d = getComputedStyle(el).display;
    if (d !== "inline" && d !== "inline-block") return false;
    for (const n of el.parentElement?.childNodes ?? []) {
      if (n === el) continue;
      if (n.nodeType === 3 && /\S/.test(n.nodeValue ?? "")) return true;
    }
    return false;
  };
  const extent = (el, from) => {
    const { x, y } = from;
    if (!owns(document.elementFromPoint(x, y), el)) return null;
    let lo = y, hi = y;
    for (let v = y - 1; v >= 0 && y - v < 200; v--) { if (!owns(document.elementFromPoint(x, v), el)) break; lo = v; }
    for (let v = y + 1; v < window.innerHeight && v - y < 200; v++) { if (!owns(document.elementFromPoint(x, v), el)) break; hi = v; }
    return hi - lo + 1;
  };
  const out = [];
  for (const el of document.querySelectorAll('a[href], button, [role="button"]')) {
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (!inlineInFlow(el)) continue;
    el.scrollIntoView({ block: "center", behavior: "instant" });
    const rects = [...el.getClientRects()];
    const line = rects.length ? el.getClientRects()[0] : el.getBoundingClientRect();
    const hitH = extent(el, { x: line.left + line.width / 2, y: line.top + line.height / 2 });
    out.push({
      label: (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 36),
      boxH: +line.height.toFixed(1),
      hitH,
      lineHeight: cs.lineHeight,
      fontSize: cs.fontSize,
      padded: hitH !== null && Math.round(hitH) > Math.round(line.height) + 1,
    });
    if (out.length >= 25) break;
  }
  return out;
};

const browser = await launch();
const all = {};
for (const url of URLS) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(3500);
    all[url] = { ok: true, rows: await page.evaluate(probe) };
  } catch (err) {
    // L5's rule: a run that got nothing owes a row saying so, which is
    // not the same as a zero.
    all[url] = { ok: false, why: String(err).split("\n")[0].slice(0, 160), rows: [] };
  }
  await ctx.close();
}
await browser.close();
writeFileSync(OUT, JSON.stringify(all, null, 2));
for (const [url, r] of Object.entries(all)) {
  if (!r.ok) { console.log(`${url.padEnd(28)} NOTHING: ${r.why}`); continue; }
  const hs = r.rows.map((x) => x.hitH).filter((x) => x !== null).sort((a, b) => a - b);
  const padded = r.rows.filter((x) => x.padded).length;
  console.log(
    `${url.padEnd(28)} ${String(r.rows.length).padStart(2)} inline controls  ` +
      (hs.length
        ? `hit height min ${hs[0]} median ${hs[Math.floor(hs.length / 2)]} max ${hs[hs.length - 1]}  ` +
          `under 24px: ${hs.filter((h) => h < 24).length}  under 44px: ${hs.filter((h) => h < 44).length}  ` +
          `given extra height: ${padded}`
        : "none found"),
  );
}
