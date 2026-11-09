/**
 * Prove that the hydration gate fires on a page that was served and never
 * ran, and stays silent on a page that was never a Next app.
 *
 * The second half is the load-bearing one and it is the reason this file is
 * not just "refuse when there is no fiber". Every other selftest in this
 * directory drives hand-written HTML over `file://`, where no framework
 * loads and no fiber will ever exist. A gate that refused there would turn
 * ten working selftests into ten non-answers, which is the too-wide-refusal
 * trap `check-reached.mjs` already states as an expectation one layer up.
 *
 * Four cases:
 *
 *   1. runtime shipped, body hydrated       exit 0, a passing line.
 *   2. runtime shipped, body not hydrated   exit 2, NOT HYDRATED, no claim.
 *   3. no runtime at all (a fixture)        exit 0, and it says the question
 *                                           did not arise.
 *   4. one of each                          exit 2, because a run that
 *                                           measured one dead page cannot
 *                                           report a clean sweep.
 *
 * Plus one end-to-end case over a real file:// fixture, which is case 3 with
 * a real browser rather than a synthesised reading, because the whole claim
 * is about what `PROBE` returns on a page nobody hydrated.
 *
 * usage: node check-hydrated.mjs
 * exit 0 on pass, 1 on fail, and it says which expectation missed.
 */
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gate, probe, NOT_HYDRATED } from '../lib/hydrated.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const dir = mkdtempSync(join(tmpdir(), 'hydrated-selftest-'))

const alive = { runtime: true, body: true, root: true, fibers: 88, els: 103 }
const dead = { runtime: true, body: false, root: false, fibers: 3, els: 114 }
const plain = { runtime: false, body: false, root: false, fibers: 0, els: 12 }

const g1 = gate(); g1.saw('/', alive)
const g2 = gate(); g2.saw('/', dead)
const g3 = gate(); g3.saw('/fixture.html', plain)
const g4 = gate(); g4.saw('/', alive); g4.saw('/record', dead)

let failed = 0
const want = []
const ok = (label, got, expected) => {
  const pass = JSON.stringify(got) === JSON.stringify(expected)
  want.push(label)
  if (!pass) { failed++; console.log(`  FAIL  ${label}  got ${JSON.stringify(got)} want ${JSON.stringify(expected)}`) }
  else console.log(`  ok    ${label}`)
}

ok('(1) a hydrated page does not gate', g1.code(), 0)
ok('(1) and says so', /had hydrated/.test(g1.lines().join('\n')), true)
ok('(2) a served-but-dead page gates', g2.code(), NOT_HYDRATED)
ok('(2) and the code is 2, not 1', NOT_HYDRATED, 2)
ok('(2) the refusal is in the slot a reader scans', /NOT HYDRATED/.test(g2.lines().join('\n')), true)
ok('(2) and it names the denominator rather than a bare count', /3 of 114 elements/.test(g2.lines().join('\n')), true)
ok('(2) nothingRan is true when every load was dead', g2.nothingRan(), true)
ok('(2) and refused() withholds the headline', /NO VERDICT/.test(g2.refused()), true)
// The one that keeps this gate from eating the rest of the kit.
ok('(3) a page with no client runtime does NOT gate', g3.code(), 0)
ok('(3) and it says the question did not arise', /not a question/.test(g3.lines().join('\n')), true)
ok('(3) a fixture is not counted as dead', g3.dead().length, 0)
ok('(4) one dead page among live ones still gates', g4.code(), NOT_HYDRATED)
ok('(4) and only the dead one is named', g4.dead().map((r) => r.path), ['/record'])

// ---- end to end: what PROBE really returns on a page nobody hydrated ----
writeFileSync(
  join(dir, 'plain.html'),
  '<!doctype html><meta charset=utf-8><title>t</title><main>no framework here</main>\n',
)
let browser = null
try {
  const { launch } = await import('../lib/browser.mjs')
  browser = await launch()
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } })
  await page.goto(`file://${join(dir, 'plain.html')}`, { waitUntil: 'load' })
  const read = await probe(page)
  const g5 = gate(); g5.saw('/plain.html', read)
  ok('(e2e) a real plain page reports no client runtime', read.runtime, false)
  ok('(e2e) and the gate stays at 0 over it', g5.code(), 0)
} catch (e) {
  // A browser this host cannot launch is not a failed expectation about the
  // gate. Same distinction lib/subject.mjs draws, applied to this file's own
  // premise: say so and exit 2 rather than report a miss.
  console.log(`\nNO VERDICT: the end-to-end case could not launch a browser (${String(e.message).split('\n')[0]}), so 2 of this file's expectations were not asserted.`)
  console.log(`The ${want.length} unit expectations above did run; ${failed} missed.`)
  if (browser) await browser.close().catch(() => {})
  rmSync(dir, { recursive: true, force: true })
  process.exit(failed ? 1 : 2)
}
await browser.close()
rmSync(dir, { recursive: true, force: true })

console.log(`\n${want.length - failed} of ${want.length} expectations held.`)
process.exit(failed ? 1 : 0)
