/**
 * Does `measure-focus.mjs` report what it says it reports?
 *
 *     node docs/design/review-kit/selftest/check-focus.mjs
 *
 * WHY THIS EXISTS. Two of that tool's three headline numbers are the kind
 * that are wrong in a way reading them cannot catch.
 *
 * "0 controls the keyboard cannot reach" is produced by a set difference,
 * and a set difference between a set and itself is always empty. A bug
 * that populated the reached set from the declared set would print a
 * perfect score on a page with a focus trap in it. That is L19's rule
 * about the instrument rather than the surface: a check that cannot fail
 * is not a check, so the first assertion below is one the tool fails if
 * its tab walk does nothing at all.
 *
 * "share of the indicator above 3:1" is a ratio over a pixel set the tool
 * discovers for itself. If the frame diff were empty for the wrong
 * reason, every stop would report NO_INDICATOR, which looks like a
 * finding and is a defect. If the diff caught drift, every stop would
 * report a generous share against noise. So the fixture pins the two
 * ratios this house already knows by hand: `--polar` on `--night` is
 * 11.99:1, and `--line` on `--night` is 1.20:1, both measured on the
 * dashboard's provenance legend on 2026-10-26 and recorded in L36. The
 * same two numbers computed here are computed by a different code path
 * over photographed pixels, so agreeing with L36 to two decimals is a
 * real cross-check and not a tautology.
 *
 * The fixture is written under `tmpdir()` and committed nowhere, which is
 * where `check-floor.py`, `check-redaction.mjs` and `check-pin-now.mjs`
 * put theirs. A page that exists only to be measured is not part of the
 * product.
 *
 * WHAT IT ASSERTS, AND WHY EACH ONE IS HERE
 *
 *  1. The tab walk reaches a control. Without this every other assertion
 *     below could pass on a tool that reports an empty ring.
 *  2. A focus trap, meaning an element that swallows Tab, is reported as
 *     unreachable controls behind it rather than as a short clean ring.
 *     This is the assertion the reach headline rests on.
 *  3. A ring in `--polar` on `--night` reports 100% of its pixels above
 *     3:1 and a median of 11.99, the number L36 took by hand.
 *  4. A ring in `--line` on `--night` reports 0% above 3:1 and a median
 *     of 1.22, and the verdict BELOW_FLOOR. Same geometry as 3, so the
 *     only thing that moved is the colour.
 *  5. `outline: none` reports NO_INDICATOR rather than a ratio. A ring
 *     that is not drawn and a ring drawn in its own backdrop's exact
 *     colour are the same pixels, so they are the same verdict, and the
 *     tool says so rather than inventing a distinction it cannot see.
 *  6. A `tabindex="-1"` element is not counted as declared, because it is
 *     focusable by script and not by Tab, and counting it would report an
 *     unreachable control on every page that has a programmatic focus
 *     target.
 *  7. A `disabled` control and a `display:none` control are not counted
 *     as declared either.
 *  8. The 2.4.11 area column is the ratio of the measured indicator to
 *     4w+4h+16, checked against a box whose arithmetic is done here by
 *     hand.
 *  9. The drift gate fires: a stop whose neighbourhood moves between two
 *     identical blurred frames is UNSTABLE rather than carrying a ratio.
 * 10. Exit status is 1 when something is below a floor and 0 when
 *     nothing is, since the caller in a review script reads that and not
 *     the prose.
 * 11. A tall page whose undeclared stops all land at the same viewport
 *     coordinate is walked to the end, rather than stopping at the second
 *     one and reporting everything behind it as unreachable. This is the
 *     assertion for L61, and it fails on the code of 2026-11-02: that walk
 *     reported two of this fixture's six stops and two false unreachables.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dir = mkdtempSync(resolve(tmpdir(), 'focus-selftest-'))

const NIGHT = '#020308'
const POLAR = '#a8c7fa'
const LINE = '#141b2b'

/* Every box is 100x24 at an integer position with no border radius, so a
   3px outline has no antialiased pixel in it anywhere and the share is
   exactly 0% or exactly 100%. A fixture that leaves the tool to cope with
   antialiasing is testing the AA and not the tool. */
const page = (body, extra = '') => `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box }
  body { background: ${NIGHT}; font: 13px/24px Helvetica, Arial, sans-serif }
  a, button { display: block; width: 100px; height: 24px; margin: 20px;
              background: ${NIGHT}; color: ${POLAR}; border: 0;
              border-radius: 0; text-decoration: none; font: inherit }
  :focus-visible { outline: 3px solid ${POLAR}; outline-offset: 3px }
  .faint:focus-visible { outline: 3px solid ${LINE}; outline-offset: 3px }
  .bare:focus-visible { outline: none }
  ${extra}
</style></head><body>${body}</body></html>`

const fixtures = {
  // 1, 3, 4, 5, 6, 7, 8
  'rings.html': page(`
    <a href="#" id="good">good</a>
    <a href="#" id="faint" class="faint">faint</a>
    <a href="#" id="bare" class="bare">bare</a>
    <a href="#" id="script" tabindex="-1">script only</a>
    <button id="off" disabled>disabled</button>
    <a href="#" id="hidden" style="display:none">hidden</a>
  `),
  // 2: the trap. The handler swallows Tab, so the two controls after it
  // are in the DOM, have boxes, and are reachable by no keystroke.
  'trap.html': page(
    `
    <a href="#" id="first">first</a>
    <a href="#" id="trap">trap</a>
    <a href="#" id="behind1">behind one</a>
    <a href="#" id="behind2">behind two</a>
  `,
    '',
  ).replace(
    '</body>',
    `<script>
      document.getElementById('trap').addEventListener('keydown', (e) => {
        if (e.key === 'Tab') e.preventDefault()
      })
    </script></body>`,
  ),
  // 9: a neighbourhood that moves on its own, and specifically one that
  // the freeze cannot pin away, because that is the case the drift gate
  // is for. `freezeInit` pins `requestAnimationFrame`'s TIMESTAMP and
  // leaves the callbacks running, which is the right shape for a
  // starfield that draws from a clock and the wrong shape for one that
  // draws from a counter. Playwright's `animations: 'disabled'` does not
  // reach rAF either. So a rAF loop that paints one more column per frame
  // is a surface that differs from itself between two identical shutters,
  // and no setting in this kit makes it hold still. That is the honest
  // fixture for this gate: a page the freeze does not fix.
  'drift.html': page(
    `<a href="#" id="drifty">drifty</a><div id="noise" style="position:absolute;left:0;top:0"></div>`,
    '',
  ).replace(
    '</body>',
    `<script>
      let n = 0
      const noise = document.getElementById('noise')
      const tick = () => {
        const d = document.createElement('div')
        d.style.cssText = 'position:absolute;left:' + ((n++) % 120) +
          'px;top:0;width:1px;height:70px;background:#fff'
        noise.replaceChildren(d)
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    </script></body>`,
  ),
  // 11: the tall page. Three scrollable <pre> blocks, which Chromium makes
  // keyboard-focusable and the enumeration does not declare, each followed
  // by a button that it does. Tab scrolls a stop into view, so all three
  // pres land at the same VIEWPORT coordinate while sitting 1000px apart in
  // the document: at 800x600 every one of them arrives at 20,289.
  //
  // Until 2026-11-09 the walk identified an undeclared stop by exactly that
  // coordinate, so the second pre read as the first returning, the walk
  // called the ring closed after two stops, and the two buttons behind it
  // were reported as controls the keyboard cannot reach. All three buttons
  // are reachable by Tab and always were. The absolute integer tops are
  // what make the collision exact rather than within a pixel, which is the
  // difference between a fixture that fails on the old code every time and
  // one that fails on it sometimes.
  'tall.html': page(
    [1, 2, 3]
      .map(
        (n) => `<div class="block b${n}">
         <pre>this-is-a-long-command-that-overflows-its-box-number-${n} --flags</pre>
         <button type="button">copy ${n}</button>
       </div>`,
      )
      .join(''),
    `body { height: 4000px; position: relative }
     .block { position: absolute; left: 20px; width: 240px }
     .b1 { top: 1000px } .b2 { top: 2000px } .b3 { top: 3000px }
     pre { width: 200px; height: 22px; overflow-x: auto; white-space: pre;
           font: 12px/22px monospace; margin: 0 }
     button { margin: 12px 0 0 0 }`,
  ),

  // 12: the walk has to start at the top of the DOCUMENT, not wherever the
  // `--state` drive left the focus. Five controls in a row; the state
  // module below clicks the fourth, which is what a real drive does when
  // it presses a button to make a surface exist.
  //
  // `blur()` clears the focused element and does NOT move the sequential
  // focus navigation starting point, which is the thing Tab consults. So
  // on the code of 2026-11-09 the walk began at control four, reached two
  // stops, and reported the three controls above it as controls the
  // keyboard cannot reach. Measured first on the real set view, where it
  // found 3 stops of 11 and five false unreachables.
  'after-drive.html': page(
    [1, 2, 3, 4, 5].map((n) => `<button type="button" id="c${n}">control ${n}</button>`).join(''),
  ),
}
for (const [name, html] of Object.entries(fixtures)) writeFileSync(resolve(dir, name), html)

// The drive for 12, written beside the fixtures for the same reason they
// are written rather than committed: it is an input to the tool under test.
writeFileSync(
  resolve(dir, 'drive-click-fourth.mjs'),
  "export default async function drive(page) { await page.click('#c4') }\n",
)

const run = (file, state = null) => {
  const json = resolve(dir, `${file}.json`)
  let status = 0
  try {
    execFileSync(
      process.execPath,
      [
        resolve(KIT, 'measure-focus.mjs'),
        '--base', `file://${dir}`,
        '--pages', `fx=/${file}`,
        '--viewports', 'one=800x600',
        '--json', json,
        ...(state ? ['--state', resolve(dir, state)] : []),
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    )
  } catch (e) {
    status = e.status
  }
  return { status, ...JSON.parse(readFileSync(json, 'utf8')) }
}

let failed = 0
const ok = (label, cond, got) => {
  if (cond) {
    console.log(`  ok    ${label}`)
  } else {
    console.log(`  FAIL  ${label}${got === undefined ? '' : `  got ${JSON.stringify(got)}`}`)
    failed++
  }
}
const near = (a, b, eps = 0.02) => typeof a === 'number' && Math.abs(a - b) < eps

console.log('rings.html')
const r = run('rings.html')
const note = r.pageNotes[0]
const by = (id) => r.rows.find((x) => x.id?.includes(id) || x.text?.startsWith(id))

ok('1. the tab walk reaches controls', note.stops >= 3, note.stops)
ok('6/7. declared counts only what Tab can reach: 3, not 6', note.declared === 3, note.declared)
ok('   and so nothing is unreachable', note.unreachable.length === 0, note.unreachable)

const good = r.rows.find((x) => x.text === 'good')
const faint = r.rows.find((x) => x.text === 'faint')
const bare = r.rows.find((x) => x.text === 'bare')

ok('3. polar on night: every indicator pixel clears 3:1', good?.share === 1, good?.share)
ok('3. polar on night: median is L36\'s 11.99', near(good?.median, 11.99), good?.median)
ok('3. and the verdict is ok', good?.verdict === 'ok', good?.verdict)
ok('4. line on night: no indicator pixel clears 3:1', faint?.share === 0, faint?.share)
/* L36 printed this one to two figures, as 1.20. The full value is
   1.1985, computed here off photographed pixels by a different code path
   from the probe that took it on 2026-10-26. Agreeing to L36's two
   figures is the cross-check; the third figure is this file's own. */
ok('4. line on night: median is L36\'s 1.20', near(faint?.median, 1.1985, 0.001), faint?.median)
ok('4. and the verdict is BELOW_FLOOR', faint?.verdict === 'BELOW_FLOOR', faint?.verdict)
ok('5. outline:none is NO_INDICATOR, not a ratio', bare?.verdict === 'NO_INDICATOR', bare?.verdict)
ok('5. and it carries no share', bare?.share === undefined, bare?.share)

/* 8. The box is 100x24, so 2.4.11's minimum is 4*100 + 4*24 + 16 = 512.
   The drawn ring is 3px thick at a 3px offset, which is a band between
   the 106x30 box and the 112x36 box: 112*36 - 106*30 = 4032 - 3180 = 852.
   So the area ratio is 852/512 = 1.664. Both numbers by hand. */
ok('8. 2.4.11 minimum for a 100x24 box is 512px', good?.minAreaPx === 512, good?.minAreaPx)
ok('8. a 3px ring at 3px offset measures 852px', good?.indicatorPx === 852, good?.indicatorPx)
ok('8. so the area column reads 1.66', near(good?.areaRatio, 1.664), good?.areaRatio)
ok('10. exit 1, because one stop is below a floor', r.status === 1, r.status)

console.log('trap.html')
const t = run('trap.html')
const tn = t.pageNotes[0]
ok('2. the DOM offers four controls', tn.declared === 4, tn.declared)
ok('2. the walk stops at the trap, two stops', tn.stops === 2, tn.stops)
ok('2. and the two behind it are reported unreachable', tn.unreachable.length === 2, tn.unreachable.map((u) => u.text))
ok('2. exit 1, because unreachable alone fails', t.status === 1, t.status)

console.log('drift.html')
const d = run('drift.html')
const drifty = d.rows.find((x) => x.text === 'drifty')
ok('9. a moving neighbourhood is UNSTABLE, not a ratio', drifty?.verdict === 'UNSTABLE', drifty?.verdict)
ok('9. and it carries no share', drifty?.share === undefined, drifty?.share)

console.log('')

console.log('tall.html')
const tall = run('tall.html')
const tn2 = tall.pageNotes[0]
const pres = tall.rows.filter((x) => x.tag === 'pre')
const copies = tall.rows.filter((x) => x.tag === 'button')

ok('11. the DOM offers three buttons', tn2.declared === 3, tn2.declared)
ok(
  '11. the walk runs to the end of the page, six stops',
  tn2.stops === 6,
  tn2.stops,
)
ok(
  '11. and no button is reported unreachable',
  tn2.unreachable.length === 0,
  tn2.unreachable.map((u) => u.text),
)
ok(
  '11. all three undeclared pre stops get a row, not one',
  pres.length === 3 && pres.every((x) => x.verdict === 'UNDECLARED'),
  pres.map((x) => x.verdict),
)
ok(
  '11. all three buttons are photographed and ringed',
  copies.length === 3 && copies.every((x) => x.verdict === 'ok'),
  copies.map((x) => [x.text, x.verdict]),
)
ok(
  '11. the three stops that collided are three identities',
  new Set(pres.map((x) => x.stop)).size === 3,
  pres.map((x) => x.stop),
)

console.log('')

console.log('after-drive.html')
const ad = run('after-drive.html', 'drive-click-fourth.mjs')
const adn = ad.pageNotes[0]

ok('12. the DOM offers five controls', adn.declared === 5, adn.declared)
ok(
  '12. the walk starts at the top of the document, not where the drive left focus',
  adn.stops === 5,
  adn.stops,
)
ok(
  '12. so nothing above the clicked control reads as unreachable',
  adn.unreachable.length === 0,
  adn.unreachable.map((u) => u.text),
)
ok(
  '12. and the first stop is the first control, in document order',
  ad.rows[0]?.text === 'control 1',
  ad.rows[0]?.text,
)

console.log('')

console.log(failed === 0 ? `all assertions hold (fixtures in ${dir})` : `${failed} assertion(s) failed`)
process.exit(failed === 0 ? 0 : 1)
