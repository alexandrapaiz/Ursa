/**
 * Magnify one generation row so the only pixels this change touches can
 * be looked at. The change moves nothing; it swaps the text rasteriser
 * on one viewport, 2688 pixels in a 68px band, and at 1x that pair is
 * two identical-looking smudges.
 *
 * Two deliberate choices, both of which a later run could undo by
 * accident:
 *
 *   - The magnification is a nearest-neighbour upscale of a 1x capture,
 *     never a 3x render. The thing under comparison IS the 1x
 *     rasterisation, so asking the browser for 3x would answer a
 *     different question and destroy the evidence.
 *   - These two crops are the only images in this review that are NOT
 *     quantised to a 128-colour palette. Every full frame here is, to
 *     keep the repo light, and that quantisation lands on exactly the
 *     subpixel-fringe pixels this pair exists to show. Measuring colour
 *     off the quantised frames would produce confident nonsense.
 *
 * The "before" crop is produced by injecting `position: static` over the
 * shipped build rather than by rebuilding, so that both crops come from
 * one browser in one state and differ only in the declaration under test.
 *
 * usage: node crop-rows.mjs      (writes {before,after}/row-desktop-3x.png)
 */
import { launch } from "../../review-kit/lib/browser.mjs";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const BASE = process.env.URSA_BASE ?? "http://127.0.0.1:4947";
const STATIC =
  ".rec-hit{position:static !important}.rec-hit::after{content:none !important}";

const browser = await launch();
for (const [name, css] of [["before", STATIC], ["after", ""]]) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/record/mini-fixture`, { waitUntil: "networkidle" });
  if (css) await page.addStyleTag({ content: css });
  await page.waitForTimeout(200);
  const row = page.locator("button.rec-action").first();
  await row.scrollIntoViewIfNeeded();
  const b = await row.boundingBox();
  await page.screenshot({
    path: `/tmp/row-${name}.png`,
    clip: { x: b.x, y: b.y, width: 330, height: Math.ceil(b.height) },
  });
  await ctx.close();
}
await browser.close();

writeFileSync(
  "/tmp/up.py",
  `from PIL import Image
import sys
im = Image.open(sys.argv[1]).convert("RGB")
im = im.resize((im.width * 3, im.height * 3), Image.NEAREST)
im.save(sys.argv[2], optimize=True)
print(sys.argv[2], im.size)
`,
);
for (const n of ["before", "after"])
  console.log(
    execFileSync("python3", ["/tmp/up.py", `/tmp/row-${n}.png`, `${n}/row-desktop-3x.png`])
      .toString()
      .trim(),
  );
