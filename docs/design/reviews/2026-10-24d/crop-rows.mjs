/**
 * Crop the two generation rows out of the before and after desktop frames
 * and magnify them, because the only pixels this change touches are
 * 2688 of them in one 68px band and at 1x the pair is unreadable.
 *
 * The magnification is a nearest-neighbour upscale of the 1x capture, not
 * a 3x render. That is deliberate: the thing being compared IS the 1x
 * rasterisation, so re-rendering at 3x would destroy the evidence by
 * asking the rasteriser a different question.
 *
 * usage: node crop-rows.mjs
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const BOX = { x: 232, y: 1370, w: 500, h: 80 }; // the rows, left half
const SCALE = 3;

const py = `
from PIL import Image
import sys
src, dst, x, y, w, h, s = sys.argv[1], sys.argv[2], *[int(v) for v in sys.argv[3:]]
im = Image.open(src).convert("RGB").crop((x, y, x + w, y + h))
im = im.resize((w * s, h * s), Image.NEAREST)
im.save(dst)
print(dst, im.size)
`;
writeFileSync("/tmp/crop.py", py);
for (const which of ["before", "after"]) {
  console.log(
    execFileSync("python3", [
      "/tmp/crop.py",
      `${which}/record-mini-fixture-desktop.png`,
      `${which}/rows-desktop-3x.png`,
      String(BOX.x), String(BOX.y), String(BOX.w), String(BOX.h), String(SCALE),
    ]).toString().trim(),
  );
}
