// Magnify a named region of a frame, so a 6px bar can actually be judged.
//
//   node crop.mjs --in before/dashboard-desktop.png --out data/bar.png \
//     --box 380,1600,700,120 --scale 3
//
// PIL is on the host already (review-kit README, L7: a measurement script
// may use what the host has; the site may not).

import { execFileSync } from 'node:child_process'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1] }
const IN = arg('in')
const OUT = arg('out')
const BOX = arg('box').split(',').map(Number)
const SCALE = Number(arg('scale', 3))

const py = `
from PIL import Image
im = Image.open(${JSON.stringify(IN)})
x, y, w, h = ${JSON.stringify(BOX)}
c = im.crop((x, y, x + w, y + h))
c = c.resize((c.width * ${SCALE}, c.height * ${SCALE}), Image.NEAREST)
c.save(${JSON.stringify(OUT)})
print(f"{${JSON.stringify(IN)}} [{x},{y} {w}x{h}] x${SCALE} -> {${JSON.stringify(OUT)}}")
`
console.log(execFileSync('python3', ['-c', py], { encoding: 'utf8' }).trim())
