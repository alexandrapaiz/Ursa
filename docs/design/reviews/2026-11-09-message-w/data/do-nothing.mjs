// The triage Ursa's exo seat sent this seat on 2026-11-09, run as a
// measurement rather than agreed with: ask what each instrument returns
// when it does nothing, and whether that value is in band.
//
//   node do-nothing.mjs --live <url> --dead <url> --out .
//
// Three columns per instrument, because the loud absence and the quiet one
// are different faults and only the second is likely in practice.
//
//   live     the real pages. The reference. Anything here is a real finding.
//   dead     nothing listening. The loud absence. Last window's control.
//   wrong    the server is UP and every requested path 404s. The quiet one:
//            Next renders a not-found page, which has text, tab stops, hit
//            areas and no overflow, so an instrument that never reads the
//            HTTP status measures that page and reports on it as if it were
//            the subject.
//
// What is recorded per cell: the exit status, and whether the instrument's
// own stdout claims a pass. Both, because exo's third note is that a status
// is a single value every wrapper may replace while a printed sentence is
// forwarded by default, so an instrument with only one of the two channels
// is one wrapper away from silence.

import { execFileSync } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`)
  return i === -1 ? d : process.argv[i + 1]
}
const LIVE = arg('live', 'http://127.0.0.1:4871')
const DEAD = arg('dead', 'http://127.0.0.1:4999')
const OUT = arg('out', '.')
const KIT = arg('kit', 'docs/design/review-kit')
const PW = process.env.PW_ROOT || ''

// A path no route can serve, used for the `wrong` column. It has to be a
// path the SERVER answers, which this one does with its 404 page, and not
// a path that throws.
const GONE = '/no-such-route-9d1f'

// Each instrument with the flags that point it at a base and a subject.
// `pages` is the flag name for the page list, because the kit spells it
// three ways and a harness that guesses is measuring itself.
const TOOLS = [
  { id: 'shoot',            cmd: 'shoot.mjs',            base: '--base', pages: '--pages', live: '/,/record', extra: (o) => ['--out', o] },
  { id: 'measure-contrast', cmd: 'measure-contrast.mjs', base: '--base', pages: '--pages', live: '/,/record', extra: (o) => ['--out', o] },
  { id: 'measure-focus',    cmd: 'measure-focus.mjs',    base: '--base', pages: '--pages', live: '/,/record', extra: (o) => ['--out', o] },
  { id: 'measure-hit-areas',cmd: 'measure-hit-areas.mjs',base: '--base', pages: '--pages', live: 'home=/,set=/record', extra: (o) => ['--out', `${o}/hit.txt`] },
  { id: 'measure-narrow',   cmd: 'measure-narrow.mjs',   base: '--base', pages: '--pages', live: 'home=/,set=/record', extra: (o) => ['--out', `${o}/narrow.txt`] },
  { id: 'verify-hover',     cmd: 'verify-hover.mjs',     base: '--base', pages: null,      live: null,        extra: (o) => ['--out', o] },
]

const PASS_WORDS = [
  /no frame overflows/i,
  /\b0 of \d+\b/,
  /all \d+ expectations hold/i,
  /^\s*no (finding|failure)/im,
  /below threshold:\s*0/i,
  /0 findings/i,
]
// A headline that says the instrument measured nothing. If this is present
// the cell is honest in words whatever the status does.
const ABSTAIN_WORDS = [
  /NOT MEASURED/,
  /NOT-REACHED/,
  /makes no claim/i,
  /could not be (loaded|run)/i,
  /unmeasured/i,
]

const rows = []
for (const t of TOOLS) {
  for (const col of ['live', 'dead', 'wrong']) {
    const out = `${OUT}/cells/${t.id}-${col}`
    mkdirSync(out, { recursive: true })
    const argv = [`${KIT}/${t.cmd}`, t.base, col === 'dead' ? DEAD : LIVE, ...t.extra(out)]
    if (t.pages) {
      const spec = col === 'wrong'
        ? t.live.replace(/(^|,)([a-z]+=)?[^,]+/g, (m, p, label) => `${p}${label || ''}${GONE}`)
        : t.live
      argv.push(t.pages, spec)
    }
    let code = 0
    let stdout = ''
    let stderr = ''
    const started = Date.now()
    try {
      stdout = execFileSync('node', argv, {
        encoding: 'utf8',
        timeout: 240000,
        env: { ...process.env, ...(PW ? { NODE_PATH: PW } : {}) },
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    } catch (e) {
      // The status is read off the child and never off this harness, which
      // is the fault being measured. `e.status` is null on a signal, and a
      // null recorded as 0 would be the same lie one level out.
      code = e.status === null || e.status === undefined ? `signal:${e.signal}` : e.status
      stdout = e.stdout || ''
      stderr = e.stderr || ''
    }
    const text = stdout + '\n' + stderr
    rows.push({
      tool: t.id,
      col,
      code,
      seconds: Math.round((Date.now() - started) / 1000),
      claims_pass: PASS_WORDS.some((r) => r.test(stdout)),
      abstains: ABSTAIN_WORDS.some((r) => r.test(text)),
      head: (stdout.trim().split('\n').pop() || stderr.trim().split('\n')[0] || '').slice(0, 120),
    })
    writeFileSync(`${out}/stdout.txt`, stdout)
    writeFileSync(`${out}/stderr.txt`, stderr)
    console.error(`${t.id.padEnd(18)} ${col.padEnd(6)} exit=${String(rows.at(-1).code).padEnd(9)} pass=${rows.at(-1).claims_pass} abstains=${rows.at(-1).abstains}`)
  }
}

const w = (s, n) => String(s).padEnd(n)
const lines = []
lines.push(`# what each kit instrument returns when it does nothing`)
lines.push(`# live=${LIVE}  dead=${DEAD}  wrong=${LIVE}${GONE}`)
lines.push('')
lines.push(`${w('instrument', 18)} ${w('column', 7)} ${w('exit', 9)} ${w('claims-pass', 12)} ${w('abstains', 9)} last line`)
for (const r of rows) {
  lines.push(`${w(r.tool, 18)} ${w(r.col, 7)} ${w(r.code, 9)} ${w(r.claims_pass, 12)} ${w(r.abstains, 9)} ${r.head}`)
}
lines.push('')
// The verdict is computed from the findings and never from the last
// statement that ran, which is runner-facts section 48 and the whole point
// of the exercise.
const bad = rows.filter((r) => r.col !== 'live' && (r.code === 0 || r.claims_pass))
lines.push(bad.length
  ? `${bad.length} of ${rows.filter((r) => r.col !== 'live').length} absence cells are IN BAND: the instrument did nothing and said so with a value a caller reads as success.`
  : `0 absence cells in band.`)
for (const r of bad) lines.push(`  ${r.tool} ${r.col}: exit ${r.code}${r.claims_pass ? ', and prints a passing headline' : ''}`)

const text = lines.join('\n') + '\n'
writeFileSync(`${OUT}/do-nothing.txt`, text)
writeFileSync(`${OUT}/do-nothing.json`, JSON.stringify({ live: LIVE, dead: DEAD, gone: GONE, rows }, null, 2) + '\n')
console.log(text)
process.exit(bad.length ? 2 : 0)
