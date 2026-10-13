// Contrast of every text run against the sky actually rendered behind it, and
// hit-target sizes. The sky is a live WebGL gradient, so the background is
// sampled from the canvas pixels under each text box rather than assumed.
import { chromium } from "playwright";
const BASE = "http://localhost:3100";
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const l1 = L(a), l2 = L(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
const parse = (s) => s.match(/[\d.]+/g).slice(0, 3).map(Number);

const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const [route, label] of [["/", "home"], ["/no-such-page", "404"]]) {
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    await p.goto(BASE + route, { waitUntil: "load" });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(1200);
    const runs = await p.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll("p, span, button, a, div")) {
        const t = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(" ");
        if (!t) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        const cs = getComputedStyle(el);
        out.push({ t: t.slice(0, 34), color: cs.color, fs: parseFloat(cs.fontSize), fw: cs.fontWeight,
          x: Math.round(r.x + 2), y: Math.round(r.y + r.height / 2), w: Math.round(r.width), h: Math.round(r.height),
          tag: el.tagName, op: cs.opacity, disabled: el.disabled === true });
      }
      return out;
    });
    const buf = await p.screenshot();
    const { createCanvas, loadImage } = await import("node:module").then(() => ({ createCanvas: null, loadImage: null })).catch(() => ({}));
    // sample the background by reading pixels via the page itself
    for (const r of runs) {
      const bg = await p.evaluate(({ x, y, w }) => {
        const c = document.querySelector("canvas");
        const rect = c.getBoundingClientRect();
        const g = c.getContext("webgl") ? null : null;
        return null;
      }, r).catch(() => null);
    }
    // simpler: decode the screenshot in-page
    const b64 = buf.toString("base64");
    const sampled = await p.evaluate(async ({ b64, runs }) => {
      const img = new Image();
      img.src = "data:image/png;base64," + b64;
      await img.decode();
      const cv = document.createElement("canvas");
      cv.width = img.width; cv.height = img.height;
      const g = cv.getContext("2d");
      g.drawImage(img, 0, 0);
      return runs.map((r) => {
        // sample a band just left of the text start, same row: pure background
        const px = g.getImageData(Math.max(0, r.x - 6), Math.min(cv.height - 1, r.y), 4, 4).data;
        let s = [0, 0, 0];
        for (let i = 0; i < 16; i++) { s[0] += px[i * 4]; s[1] += px[i * 4 + 1]; s[2] += px[i * 4 + 2]; }
        return s.map((v) => Math.round(v / 16));
      });
    }, { b64, runs });
    console.log(`\n== ${label} ${w}x${h} ==`);
    for (let i = 0; i < runs.length; i++) {
      const r = runs[i];
      let fg = parse(r.color);
      const op = parseFloat(r.op);
      const bg = sampled[i];
      if (op < 1) fg = fg.map((c, k) => c * op + bg[k] * (1 - op));
      const cr = ratio(fg, bg);
      const large = r.fs >= 24 || (r.fs >= 18.66 && +r.fw >= 700);
      const floor = large ? 3 : 4.5;
      const flag = r.disabled ? "(disabled, exempt)" : cr < floor ? "  <-- BELOW AA" : "";
      console.log(`${cr.toFixed(2).padStart(6)} : ${String(r.fs).padStart(5)}px ${r.tag.padEnd(6)} ${JSON.stringify(r.t).padEnd(38)} ${flag}`);
    }
    // tap targets
    const taps = await p.evaluate(() => [...document.querySelectorAll("a, button")].map((e) => {
      const r = e.getBoundingClientRect();
      return { t: e.textContent.trim().slice(0, 24), w: Math.round(r.width), h: Math.round(r.height) };
    }));
    for (const t of taps) console.log(`  tap: ${t.w}x${t.h} ${JSON.stringify(t.t)} ${t.h < 44 ? "<-- under 44px" : ""}`);
    await ctx.close();
  }
}
await b.close();
