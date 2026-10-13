// Measurements behind the 2026-10-08 review.
//   node probe.mjs            # all three probes against next start -p 3100
// 1. rules   — width and left edge of every hairline on each route
// 2. credits — the vertical gap between footer credits vs inside one credit
// 3. mark    — horizontal clearance between the hero copy and the dipper
import { chromium } from "playwright";

const BASE = "http://localhost:3100";
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});

const at = async (w, h, path, fn) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(BASE + path, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const out = await fn(page);
  await ctx.close();
  return out;
};

const rulesAt = (page) =>
  page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("*")) {
      const cs = getComputedStyle(el);
      if (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none") {
        const b = el.getBoundingClientRect();
        if (b.width < 40) continue;
        out.push({ tag: el.tagName.toLowerCase(), cls: (el.className || "").toString().slice(0, 28), left: +b.left.toFixed(1), width: +b.width.toFixed(1) });
      }
    }
    return out;
  });

console.log("\n=== 1. hairline widths ===");
for (const [w, h] of [[390, 844], [820, 1180], [1440, 900], [1920, 1080]]) {
  for (const path of ["/", "/no-such-page"]) {
    const rules = await at(w, h, path, rulesAt);
    const widths = [...new Set(rules.map((r) => `${r.left}+${r.width}`))];
    console.log(`${w}px ${path.padEnd(14)} ${widths.join("   ")}`);
  }
}

console.log("\n=== 2. footer credit spacing (home) ===");
for (const [w, h] of [[320, 700], [375, 700], [390, 844], [414, 700], [820, 1180], [1440, 900]]) {
  const r = await at(w, h, "/", (page) =>
    page.evaluate(() => {
      const spans = [...document.querySelectorAll("footer > div > span")];
      const lines = [];
      for (const s of spans) {
        const rects = [...s.getClientRects()].map((r) => ({ top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1) }));
        // one entry per visual line, grouped by top
        const tops = [...new Set(rects.map((r) => r.top))].sort((a, b) => a - b);
        lines.push({ tops, bottom: Math.max(...rects.map((r) => r.bottom)) });
      }
      const within = [];
      for (const l of lines) for (let i = 1; i < l.tops.length; i++) within.push(+(l.tops[i] - l.tops[i - 1]).toFixed(1));
      const between = [];
      for (let i = 1; i < lines.length; i++) between.push(+(lines[i].tops[0] - lines[i - 1].tops.at(-1)).toFixed(1));
      return { within, between };
    }),
  );
  console.log(`${String(w).padStart(4)}px  within-credit ${JSON.stringify(r.within).padEnd(22)} between-credit ${JSON.stringify(r.between)}`);
}

console.log("\n=== 3. hero copy vs the dipper, landscape ===");
// the canvas is 2 screen px per canvas px; landscape maps x -> (0.42 + X*0.52)*w
// leftmost star is gamma Pherkad at X=0.376
for (const [w, h] of [[844, 390], [960, 540], [1024, 600], [1180, 700], [1280, 720], [1440, 900], [1920, 1080]]) {
  const r = await at(w, h, "/", (page) =>
    page.evaluate(() => {
      const p = document.querySelector("div.relative.z-10 p");
      const rects = [...p.getClientRects()];
      return { right: +Math.max(...rects.map((r) => r.right)).toFixed(1), left: +Math.min(...rects.map((r) => r.left)).toFixed(1), lines: rects.length };
    }),
  );
  const markLeft = (0.42 + 0.376 * 0.52) * w - 36; // minus Polaris' glow radius in screen px
  const gap = +(markLeft - r.right).toFixed(1);
  console.log(`${String(w).padStart(5)}x${h}  copy ${r.left}..${r.right} (${r.lines} lines)   mark starts ${markLeft.toFixed(1)}   clearance ${gap > 0 ? gap : "OVERLAP " + gap}`);
}

await browser.close();
