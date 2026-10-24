/**
 * The three address forms, photographed close enough to argue about.
 *
 * A full-page frame at 1x puts a 27px field in about 30 pixels of a
 * 1943px image, which is not a picture anyone can review. So this crops
 * the band around each form and renders it at 3x.
 *
 * Two states per form, because this change touches a field and a field
 * has a state that matters: at rest, and focused. Focus is the one thing
 * the field draws differently (`focus:border-[var(--polar)]`), and
 * `focus:outline-none` means the recoloured rule is the ONLY sign the
 * field has focus. If 17px of new padding had moved that rule away from
 * its text, this is the pair that would show it.
 *
 * The crop is taken from the form's own box, grown by the margin above it
 * so the gap to the paragraph is in frame, since that gap is where the
 * new padding lives.
 *
 * usage: node crop-forms.mjs <outdir>
 */
import { launch, VIEWPORTS } from "../../review-kit/lib/browser.mjs";
import { mkdirSync } from "node:fs";

const BASE = process.env.URSA_BASE ?? "http://127.0.0.1:4953";
const OUT = process.argv[2] ?? "before";
const SCALE = 3;
const PAGES = [["set", "/record"], ["address", "/record/at"]];

mkdirSync(OUT, { recursive: true });
const browser = await launch();
for (const [vname, w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: SCALE });
  const page = await ctx.newPage();
  for (const [pname, path] of PAGES) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    const forms = page.locator("form");
    const n = await forms.count();
    for (let i = 0; i < n; i++) {
      const f = forms.nth(i);
      await f.scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      // the band: 40px above the form (where the new padding sits) and
      // 16px below it, clamped into the viewport
      const r = await f.evaluate((el) => {
        const b = el.getBoundingClientRect();
        return { x: b.left, y: b.top, w: b.width, h: b.height };
      });
      const clip = {
        x: Math.max(0, Math.floor(r.x - 8)),
        y: Math.max(0, Math.floor(r.y - 40)),
        width: Math.min(w, Math.ceil(r.w + 16)),
        height: Math.ceil(r.h + 56),
      };
      clip.height = Math.min(clip.height, h - clip.y);
      clip.width = Math.min(clip.width, w - clip.x);

      await page.screenshot({ path: `${OUT}/form-${pname}${i}-${vname}-rest.png`, clip });
      await f.locator("input:not([type=file])").focus();
      await page.waitForTimeout(220);
      await page.screenshot({ path: `${OUT}/form-${pname}${i}-${vname}-focus.png`, clip });
      await page.evaluate(() => document.activeElement?.blur());
      await page.waitForTimeout(120);
      console.log(`${OUT}/form-${pname}${i}-${vname}  clip ${clip.width}x${clip.height} at ${clip.x},${clip.y}`);
    }
  }
  await ctx.close();
}
await browser.close();
