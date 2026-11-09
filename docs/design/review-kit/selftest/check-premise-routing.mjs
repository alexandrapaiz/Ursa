// Does every page-driving instrument in this kit route every premise to the
// reserved refusal code, and does it say so where a reader looks.
//
// WHY THIS IS A CHECK AND NOT A PARAGRAPH. Ursa's exo seat, 2026-11-09, on
// its own file: "a status channel needs a code RESERVED for the refusal, and
// reserving one is necessary and not sufficient. Each premise has to be
// routed to it, and the premise added last is the one that is not." That is
// not a bug in one file, it is the shape of how premises arrive, so the
// remedy that holds is one that fails when the NEXT premise is added and not
// routed. A paragraph in a README is a fact every run re-learns at its own
// expense, which is the argument lib/hydrated.mjs already makes about itself.
//
// WHAT IT CHECKS. For each instrument that drives a browser page:
//   routed    it acquires every premise in lib/verdict.mjs's PREMISES and
//             reads each one's status before it exits.
//   exempt    it declares an exemption for a named premise in its own source,
//             with a reason, on a line beginning `// PREMISE-EXEMPT:`.
//   UNROUTED  it acquires the premise and never reads it. A finding.
//
// Exemptions live in the instrument and not in a list here on purpose. A
// central allowlist is edited by whoever is annoyed by the gate; an in-file
// line is read by whoever next edits the code that depends on the premise.
//
// Usage:  node selftest/check-premise-routing.mjs [--json out.json]
// Exits:  0 every premise routed or exempted
//         1 at least one premise acquired and never read
//         2 this check could not look, so it makes no claim
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const KIT = dirname(dirname(fileURLToPath(import.meta.url)))
const JSON_OUT = (() => { const i = process.argv.indexOf('--json'); return i === -1 ? null : process.argv[i + 1] })()

// This check's own premises, routed to its own reserved code before anything
// else runs. Two of them, and the second is the one that would have been
// missed: a check that reads the premise list from a module can be given a
// module that exports no list, and "0 of 0 premises unrouted" is in band.
const CANNOT_ANSWER = 2
const refuse = (why) => {
  console.log(`NO VERDICT: ${why}, so this check makes no claim about premise routing in this kit.`)
  process.exit(CANNOT_ANSWER)
}

let files
try {
  files = readdirSync(KIT).filter((f) => f.endsWith('.mjs') && statSync(join(KIT, f)).isFile())
} catch (err) {
  refuse(`the kit directory ${KIT} could not be read (${err.message})`)
}
if (!files.length) refuse(`no .mjs instrument was found in ${KIT}`)

let PREMISES
try {
  ;({ PREMISES } = await import(new URL('../lib/verdict.mjs', import.meta.url).href))
} catch (err) {
  refuse(`lib/verdict.mjs would not load (${err.message})`)
}
if (!Array.isArray(PREMISES) || !PREMISES.length) {
  refuse('lib/verdict.mjs exports no non-empty PREMISES list, so there is nothing to check routing against')
}

// How each premise is acquired and how it is read. `acquired` is the evidence
// that the instrument depends on the premise at all; a file that never
// navigates does not acquire either of these and is not in the table.
// `read` is the evidence that its status reaches the process's own exit.
const SIGNALS = {
  reached: {
    what: 'the subject was reached',
    acquired: [/\.goto\s*\(/, /\breach\.visit\s*\(/, /\bpremises\s*\(/],
    read: [/\breach\.code\s*\(\)/, /\bpremises\b[\s\S]*\.decide\s*\(/, /\bgates\.(code|decide)\s*\(/],
  },
  hydrated: {
    what: 'the subject ran',
    acquired: [/\.goto\s*\(/, /\breach\.visit\s*\(/, /\bpremises\s*\(/],
    read: [/\bhydration\.code\s*\(\)/, /\bwaitForHydration\s*\(/, /\bgates\.(code|decide)\s*\(/],
  },
}

const rows = []
for (const f of files.sort()) {
  const src = readFileSync(join(KIT, f), 'utf8')
  // A file that never opens a page has no page premises. `crop.mjs` resizes
  // a PNG and `make-spring.mjs` prints numbers; neither is in this table and
  // neither should be excused, because an excuse implies a premise.
  // Quote-agnostic, because this kit is written in both and the first
  // version of this line was not: `measure-hit-areas.mjs` imports the
  // browser with double quotes and navigates only through `reach.visit`, so
  // it matched neither half and dropped out of the table entirely. A check
  // whose subject list is built by a regex can be given a denominator that
  // is quietly short, which is the same in-band fault one level up.
  const drives = /\.goto\s*\(/.test(src)
    || /from\s*['"]\.\/lib\/browser\.mjs['"]/.test(src)
    || /\breach\.visit\s*\(/.test(src)
  if (!drives) continue
  for (const p of PREMISES) {
    const sig = SIGNALS[p]
    if (!sig) {
      // A premise was added to the list and this check does not know how to
      // see it. That is this check's own premise failing, and the honest
      // answer is a refusal rather than a clean table that silently skips it.
      refuse(`PREMISES names "${p}" and this check has no signal for it, so it cannot tell whether ${f} routes it`)
    }
    const exempt = new RegExp(`^\\s*//\\s*PREMISE-EXEMPT:\\s*${p}\\b(.*)$`, 'm').exec(src)
    const acquired = sig.acquired.some((re) => re.test(src))
    const read = sig.read.some((re) => re.test(src))
    rows.push({
      file: relative(KIT, join(KIT, f)),
      premise: p,
      acquired,
      read,
      exempt: exempt ? (exempt[1] || '').trim() : null,
      verdict: !acquired ? 'n/a' : exempt ? 'exempt' : read ? 'routed' : 'UNROUTED',
    })
  }
}

if (!rows.length) refuse('no instrument in this kit drives a browser page')

const bad = rows.filter((r) => r.verdict === 'UNROUTED')
const L = []
L.push(`# premise routing, ${rows.length} rows over ${new Set(rows.map((r) => r.file)).size} page-driving instruments`)
L.push(`# premises from lib/verdict.mjs: ${PREMISES.join(', ')}`)
L.push('')
// The headline first, and it is the refusal count or a pass, never both.
L.push(bad.length
  ? `UNROUTED: ${bad.length} of ${rows.length} premise/instrument pairs acquire a premise and never read its status, so each of those instruments can exit 0 over a subject it could not measure.`
  : `every one of the ${rows.length} premise/instrument pairs either routes its premise to the reserved code or declares an exemption with a reason.`)
L.push('')
const pad = Math.max(...rows.map((r) => r.file.length))
for (const r of rows) {
  const note = r.exempt ? `  ${r.exempt}` : ''
  L.push(`  ${r.file.padEnd(pad)}  ${r.premise.padEnd(9)} ${r.verdict}${note}`)
}
const text = L.join('\n')
console.log(text)
if (JSON_OUT) writeFileSync(JSON_OUT, `${JSON.stringify({ premises: PREMISES, rows }, null, 1)}\n`)
// 1 and not 2: this check reached its subject and has an answer. The answer
// is that the kit is wrong, which is a finding somebody can repair today.
// Same precedence exo's auditVerdict settled on, for the same reason.
process.exit(bad.length ? 1 : 0)
