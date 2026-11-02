// Does `shoot.mjs --pin-now` actually pin the page's clock, and does it
// refuse the two ways it can be asked for something it cannot do?
//
//   node docs/design/review-kit/selftest/check-pin-now.mjs
//
// WHY THIS NEEDS A FIXTURE AND NOT A PRODUCT PAGE. Neither Ursa product
// reads the wall clock client-side, which is the measurement in
// reviews/2026-11-02 §3. So there is no page in this repository whose frame
// the page-side pin changes, and a flag with no page to prove it on is a
// flag nobody can tell is working. The fixture below is the missing page:
// three lines that print `new Date()` into the DOM, served from this
// process. It is written at run time under `tmpdir()` and committed nowhere,
// the way `check-redaction.mjs` writes its fixtures, so the repository does
// not carry a page that exists only to be photographed.
//
// WHAT IT ASSERTS, AND WHY EACH ONE IS HERE
//
//   1. Unpinned, two shoots of the fixture differ. Without this the next
//      three assertions could all pass on a page that was already
//      deterministic, which is exactly the trap L19 names: a check that
//      cannot fail is not a check.
//   2. Pinned, two shoots of the fixture are byte-identical.
//   3. Pinned, the frame shows the instant that was asked for, read back out
//      of the DOM. Identical frames only prove the clock stopped; this
//      proves it stopped where the caller said.
//   4. An unparseable instant exits 2 and writes nothing.
//   5. `--pin-now` with `--live` exits 2, because `--live` applies no init
//      script and the pin would be accepted and then be inert.
//   6. The two halves that were already there still work. Adding `now` to
//      `freezeInit` meant touching the branch that pins `requestAnimationFrame`
//      (`window.` became `globalThis.`, which is the same object in a page but
//      is not the same line), and nothing in this repository asserted what
//      that branch promises. The starfield those two halves exist for is in
//      `ursa-minor`, and building that site to check them costs a great deal
//      more than asking the browser directly what a rAF callback receives.

import { createServer } from 'node:http'
import { mkdtempSync, readFileSync, existsSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

// `execFile` and not `execFileSync`, awaited. The fixture is served from this
// process, and a synchronous child blocks this process's event loop, so the
// server cannot answer the request the child is making: the first version of
// this file deadlocked and the symptom was `page.goto: Timeout 30000ms`,
// which reads exactly like a server that was never started.
const run = promisify(execFile)

const KIT = fileURLToPath(new URL('..', import.meta.url))
const SHOOT = join(KIT, 'shoot.mjs')
const WORK = mkdtempSync(join(tmpdir(), 'pin-now-'))
const PIN = '2026-11-02T00:00:00.000Z'

// The fixture. `monospace` and a flat background rather than anything from
// the site's stylesheet: this page's whole job is that one run of text moves
// when the clock moves, so nothing else on it should be able to.
const FIXTURE = `<!doctype html><html><head><meta charset="utf-8"><title>clock</title>
<style>html{background:#000;color:#fff;font:16px/1.4 monospace;margin:0}
p{margin:0;padding:24px}</style></head><body>
<p id="t">…</p>
<script>document.getElementById('t').textContent = new Date().toISOString()</script>
</body></html>`

const server = createServer((_req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
  res.end(FIXTURE)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${server.address().port}`

const fails = []
const check = (ok, label, detail) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`)
  if (!ok) fails.push(label)
}

const args = (out, extra) => [SHOOT, '--base', base, '--pages', '/', '--only', 'phone', '--out', out, ...extra]

/** One shoot of the fixture into its own directory. Returns the frame bytes. */
async function shoot(dir, extra = []) {
  const out = join(WORK, dir)
  await run(process.execPath, args(out, extra))
  return readFileSync(join(out, 'home-phone.png'))
}

/** A call that is supposed to be refused. Returns its status and stderr. */
async function refuse(dir, extra) {
  const out = join(WORK, dir)
  try {
    await run(process.execPath, args(out, extra))
    return { code: 0, err: '', out }
  } catch (e) {
    return { code: e.code, err: String(e.stderr), out }
  }
}

// 1. the control: unpinned, this page differs from itself.
const liveA = await shoot('live-a')
const liveB = await shoot('live-b')
check(!liveA.equals(liveB), 'unpinned, two shoots of the fixture differ', `${liveA.length}B vs ${liveB.length}B`)

// 2. pinned, they do not.
const pinA = await shoot('pin-a', ['--pin-now', PIN])
const pinB = await shoot('pin-b', ['--pin-now', PIN])
check(pinA.equals(pinB), 'pinned, two shoots are byte-identical', `${pinA.length}B`)

// 3. pinned at the instant that was asked for, read back out of the page.
//    The frame cannot be read for text, so the same navigation is repeated
//    with the pin applied and the DOM is asked directly. This is the claim
//    the header of a frame set makes, so it is the one worth checking twice.
const { launch } = await import(join(KIT, 'lib/browser.mjs'))
const { freezeContext, PINNED_MS } = await import(join(KIT, 'lib/freeze.mjs'))
const browser = await launch()
const ctx = await freezeContext(await browser.newContext(), { now: Date.parse(PIN) })
const page = await ctx.newPage()
await page.goto(base, { waitUntil: 'networkidle' })
const shown = await page.textContent('#t')
await browser.close()
check(shown === PIN, 'the pinned page shows the instant it was given', `showed ${shown}`)

// 4. an instant Date.parse cannot read is a refusal, not a silent fallback.
const bad = await refuse('bad', ['--pin-now', 'the day before yesterday'])
check(bad.code === 2, 'an unparseable --pin-now exits 2', `exit ${bad.code}`)
check(/the day before yesterday/.test(bad.err), 'the refusal names the value it was given')
check(!existsSync(join(bad.out, 'home-phone.png')), 'the refused call wrote no frame')

// 5. --pin-now with --live is a contradiction, not a preference.
const both = await refuse('both', ['--pin-now', PIN, '--live'])
check(both.code === 2, '--pin-now with --live exits 2', `exit ${both.code}`)
check(/no init script/.test(both.err), 'the refusal says why the pin could not apply')

// 6. the two older halves of the freeze, unchanged by this run and now
//    asserted for the first time. Defaults, no `now` at all.
const ctx2 = await freezeContext(await (await launch()).newContext())
const page2 = await ctx2.newPage()
await page2.goto(base, { waitUntil: 'networkidle' })
const old = await page2.evaluate(
  () =>
    new Promise((res) => {
      requestAnimationFrame((t) => res({ t, r: [Math.random(), Math.random()] }))
    }),
)
await page2.context().browser().close()
check(old.t === PINNED_MS, 'the default freeze still pins the rAF timestamp', `callback got ${old.t}`)
check(old.r[0] !== old.r[1] && old.r[0] >= 0 && old.r[0] < 1, 'seeded Math.random still returns distinct values in range', `${old.r[0].toFixed(6)}, ${old.r[1].toFixed(6)}`)

server.close()
writeFileSync(join(WORK, 'base.txt'), base)
console.log(fails.length ? `\n${fails.length} check(s) failed` : '\nall checks passed')
process.exit(fails.length ? 1 : 0)
