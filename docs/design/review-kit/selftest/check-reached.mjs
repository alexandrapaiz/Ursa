/**
 * Prove that an instrument pointed at a server that is UP, over paths that
 * answer 404, reports its own blindness in the exit status and in words.
 *
 * WHY THIS EXISTS, and why `check-narrow.mjs` beside it is not enough. That
 * file proves the LOUD absence: nothing listening, `page.goto` throws, every
 * cell fails to load. It was written on 2026-11-09 and it was the whole of
 * the repair that morning.
 *
 * The quiet absence went straight through it. Measured the same day in
 * `../../reviews/2026-11-09-message-w/data/do-nothing.txt`, three columns
 * per instrument: the real pages, a dead port, and a live server whose every
 * requested path answers 404. Four of six instruments were indistinguishable
 * between column one and column three, exit 0 and a passing headline, over
 * Next's not-found page. That page has text runs with real contrast, real
 * tab stops, real hit areas and no overflow, so every instrument measured it
 * happily and reported on it as though it were the subject.
 *
 * The quiet one is also the one that happens. A dead port is loud and
 * immediate and a run notices in its first minute. A renamed route is
 * silent, and the instrument keeps answering.
 *
 * Three cases, and the third is the one that stops the repair from being
 * "exit non-zero on any 404", which would satisfy the second and be worth
 * nothing, because this site's not-found page IS a page under review and
 * ships in four of the kit's default page lists.
 *
 *   1. A path that is really there.      exit 0, passing headline.
 *   2. A path that answers 404,
 *      not declared.                     exit 2, NOT MEASURED, no headline.
 *   3. The same 404, declared with
 *      --expect-404.                     exit 0, passing headline.
 *
 * Plus the unit cases for lib/reached.mjs, which cost no browser.
 *
 * usage: node check-reached.mjs [port]
 * exit 0 on pass, 1 on fail, and it says which expectation missed.
 */
import { spawn } from 'node:child_process'
import { rmSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tracker, UNREACHED } from '../lib/reached.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const port = Number(process.argv[2] ?? '4976')
const dir = mkdtempSync(join(tmpdir(), 'reached-selftest-'))
const out = join(dir, 'narrow.txt')

// Nothing in this page can produce a finding of its own, because case 1 and
// case 3 are about the instrument having RUN and not about the page.
writeFileSync(
  join(dir, 'plain.html'),
  '<!doctype html><meta charset=utf-8>' +
    "<meta name=viewport content='width=device-width,initial-scale=1'>" +
    '<style>html,body{margin:0;background:#000;color:#fff;font:14px system-ui}' +
    'main{padding:16px}</style><main>reached selftest</main>\n',
)

const resp = (status) => ({ status: () => status })

// ---- unit, no browser ----
const u1 = tracker({ expect404: [] })
u1.saw('/gone', resp(404))
const u2 = tracker({ expect404: ['/gone'] })
u2.saw('/gone', resp(404))
const u3 = tracker({})
u3.saw('/same-doc', null)
const u4 = tracker({ expect404: ['/gone'] })
u4.saw('/gone', resp(200))
const u5 = tracker({})
u5.saw('/boom', resp(500))

const run = (extra) =>
  new Promise((resolve) => {
    const p = spawn(
      process.execPath,
      [join(here, '..', 'measure-narrow.mjs'), '--widths', '320,390', '--out', out, ...extra],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    )
    let text = ''
    p.stdout.on('data', (d) => (text += d))
    p.stderr.on('data', (d) => (text += d))
    p.on('exit', (code) => resolve({ code, text }))
  })

let server = null
const stop = () => {
  if (server) server.kill()
  try { rmSync(dir, { recursive: true, force: true }) } catch {}
}

try {
  // One server for all three cases, so the only thing that differs between
  // them is the path and the declaration. `http.server` answers a missing
  // file with 404 and a body, which is the shape Next's not-found page has.
  server = spawn('python3', ['-m', 'http.server', String(port), '-d', dir], { stdio: 'ignore' })
  const base = `http://127.0.0.1:${port}`
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${base}/plain.html`)).ok) break } catch {}
    await new Promise((r) => setTimeout(r, 250))
    if (i === 59) throw new Error(`fixture never answered at ${base}/plain.html`)
  }
  const gone = await fetch(`${base}/no-such-file.html`)

  const seeing = await run(['--base', base, '--pages', 'plain=/plain.html'])
  const blind = await run(['--base', base, '--pages', 'gone=/no-such-file.html'])
  const declared = await run(['--base', base, '--pages', 'gone=/no-such-file.html', '--expect-404', '/no-such-file.html'])

  const want = [
    ['(unit) an undeclared 404 is unreached', u1.unreached().length, 1],
    ['(unit) and the code is the instrument code', u1.code(), UNREACHED],
    ['(unit) and it says NOT MEASURED in words', /NOT MEASURED/.test(u1.lines().join('\n')), true],
    ['(unit) a declared 404 is reached', u2.code(), 0],
    ['(unit) a null response is not an absence', u3.code(), 0],
    ['(unit) and it is named as same-document', /same-document/.test(u3.lines().join('\n')), true],
    ['(unit) a declared path answering 200 is reported', /REPORTED, not a failure/.test(u4.lines().join('\n')), true],
    ['(unit) and reporting it does not gate', u4.code(), 0],
    ['(unit) a 500 is unreached too', u5.code(), UNREACHED],

    ['(0) the fixture really serves 404 for the missing path', gone.status, 404],

    ['(1) a path that is there exits 0', seeing.code, 0],
    ['(1) and prints the passing headline', /0 of 2 page-by-width cells put content out of reach/.test(seeing.text), true],
    ['(1) and claims nothing unmeasured', /NOT MEASURED/.test(seeing.text), false],

    ['(2) an undeclared 404 exits 2', blind.code, UNREACHED],
    ['(2) and says so in words', /NOT MEASURED/.test(blind.text), true],
    ['(2) and names the status it got', /HTTP 404/.test(blind.text), true],
    ['(2) and never prints the passing headline', /put content out of reach/.test(blind.text), false],

    ['(3) the same 404 declared exits 0', declared.code, 0],
    ['(3) and prints the passing headline', /0 of 2 page-by-width cells put content out of reach/.test(declared.text), true],
    ['(3) and claims nothing unmeasured', /NOT MEASURED/.test(declared.text), false],
  ]

  let bad = 0
  for (const [what, got, exp] of want) {
    const ok = got === exp
    if (!ok) bad++
    console.log(`${ok ? 'ok  ' : 'FAIL'}  ${String(got).padStart(18)} (want ${exp})  ${what}`)
  }
  console.log(bad ? `\n${bad} of ${want.length} expectations failed` : `\nall ${want.length} expectations hold`)
  stop()
  process.exit(bad ? 1 : 0)
} catch (err) {
  console.error(String(err))
  stop()
  process.exit(1)
}
