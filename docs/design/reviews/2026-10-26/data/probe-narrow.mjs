/**
 * `main` in the overlay's globals.css is `width: 380px`, a fixed number.
 * The three review viewports are 390, 820 and 1440, so every frame this
 * seat has ever shot of this surface is at or above that number and the
 * question has never been asked. It is asked here at the widths of
 * phones that are still in the field.
 *
 * usage: node probe-narrow.mjs <base>
 */
import { launch } from "../../../review-kit/lib/browser.mjs";

const BASE = process.argv[2] ?? "http://127.0.0.1:4960";
const WIDTHS = [320, 360, 375, 390];
const PAGES = [["panel", "/", "input[type=password]"], ["dashboard", "/dashboard?port=7831", ".dash-bar"]];

const browser = await launch();
const rows = [];
for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const [name, path, until] of PAGES) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.waitForSelector(until, { timeout: 30000 });
    const m = await page.evaluate(() => {
      const d = document.documentElement;
      const over = d.scrollWidth - d.clientWidth;
      let worst = null;
      if (over > 0) {
        for (const el of document.querySelectorAll("*")) {
          const r = el.getBoundingClientRect();
          if (r.right > d.clientWidth + 0.5 && (!worst || r.right > worst.right)) {
            worst = { right: r.right, sel: `${el.tagName.toLowerCase()}.${el.getAttribute("class")?.split(" ")[0] ?? ""}` };
          }
        }
      }
      const main = document.querySelector("main, .dash-page");
      const mr = main?.getBoundingClientRect();
      return { over, worst, mainW: mr ? +mr.width.toFixed(1) : null, left: mr ? +mr.left.toFixed(1) : null };
    });
    rows.push(`  ${String(w).padEnd(6)}${name.padEnd(11)}main ${String(m.mainW).padEnd(7)}left ${String(m.left).padEnd(8)}overflow ${String(m.over).padEnd(6)}${m.worst ? `widest ${m.worst.sel} at ${Math.round(m.worst.right)}` : ""}`);
  }
  await ctx.close();
}
await browser.close();
console.log(["  width page       main box   left    horizontal", ...rows].join("\n"));
