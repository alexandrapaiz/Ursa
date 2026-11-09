#!/usr/bin/env node
// The gate over `tools/instant.mjs`'s lint, which decides EVERY code that
// lint can emit instead of two of the three.
//
//   node tools/instant-gate.mjs            # the decision, per code
//   node tools/instant-gate.mjs --json
//
// Exit 0 every code the detector can emit has a disposition here and no
// finding violates it. Exit 1 a forbidden finding stands, or a code has no
// disposition, or an allowlist entry no longer matches a line. Exit 2 the
// facts could not be established — not a git checkout, the detector's own
// source unreadable, or the positive control silent — which must not read
// like a clean sweep.
//
// WHY THIS FILE EXISTS. Ursa's security seat measured this on 2026-11-09 and
// filed it as a report rather than a request, which is the reason it is being
// repaired by the seat that owns the gate: **the lint collects three codes and
// the gate asserted over two.** `tools/instant.test.mjs`'s sweep tested
// `TEXTUAL_ORDER` and `TEXTUAL_DROP` and said nothing at all about
// `TEXTUAL_DAY`, which is detected on every run of
// `tools/instant-sweep.mjs` and was asserted on never. Four instances sat in
// non-test source on the trunk — three in `tools/seat/outage.mjs` and one in
// `tools/board/measure-claims.mjs`, all four this seat's own tools — and a
// fifth, one line below one of them, that the lint cannot see at all because
// the variable is named `now`.
//
// The exclusion was not wrong. `utcDay` itself has to slice, so a bare
// assertion over `TEXTUAL_DAY` would fail on the module's own correct line,
// and eight of the remaining findings are product display columns where the
// committer's local day is arguably the day a person would say they did the
// work — `instant-sweep.mjs`'s header has argued that since it was written.
// What was missing was any RECORD that a class the same file calls a defect
// was being dropped on the floor. An exclusion nobody wrote down is
// indistinguishable from an exclusion nobody noticed.
//
// SO THE OBLIGATION IS READ OFF THE DETECTOR, NEVER RESTATED HERE. HQ's
// exo-centralizer adopted the general form into `standards/roles/exo.md` the
// same night, about a different pair of instruments: *"read the exclusion off
// the place that holds it rather than restate it, because a restatement is
// two implementations that agree only on the day they are written."* A list
// of three code names in this file would be exactly that restatement, and the
// next window to add a fourth code to the lint would inherit the defect this
// file was written to close. Instead `emittableCodes()` asks the detector:
// every `code:` literal in its source, unioned with every code it actually
// emits when driven over a corpus of known-defective lines. A code in that
// union with no disposition below is exit 1.
//
// THE ALLOWLIST IS KEYED ON THE LINE'S OWN TEXT, which is the security seat's
// own proposal and it is better than the two alternatives. A line number rots
// on the next edit anywhere above it. A file name clears every future slice in
// that file, which is the hole again at file granularity. The text is the
// thing being argued for, so moving the line keeps it cleared and CHANGING
// the line costs an argument. An entry that matches nothing is exit 1 too: an
// allowlist that outlives its findings is a second place where a defect can
// hide.
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { textualTimestampComparisons } from './instant.mjs'
import { partition } from './instant-sweep.mjs'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DETECTOR = 'tools/instant.mjs'

/**
 * Lines that provably trip each defect the lint names, used as the positive
 * control and as half of the code census. If driving the detector over these
 * returns nothing, the detector is unreachable and this tool reports exit 2
 * rather than a clean tree: an absence is a measurement and it needs a
 * control (this charter's §6, 2026-10-26).
 */
const CORPUS = JSON.parse(readFileSync(resolve(REPO_ROOT, 'tools/instant-gate.json'), 'utf8'))

/**
 * Lines that provably trip each defect the lint names: the positive control,
 * and half of the code census. If driving the detector over these returns
 * nothing, this tool reports exit 2 rather than a clean tree, because an
 * absence is a measurement and it needs a control (charter §6, 2026-10-26).
 *
 * In `tools/instant-gate.json` rather than here, with the reason in that
 * file's own header: every string in it is a line that trips the lint, so
 * holding them as source made this file the largest offender in the tree.
 */
export const PROBES = CORPUS.probes

/**
 * Lines cleared by argument. `file` and `text` must both match a finding
 * exactly, after trimming.
 *
 * KEYED ON THE LINE'S OWN TEXT, which is the security seat's own proposal and
 * better than the two alternatives. A line number rots on the next edit
 * anywhere above it. A file name clears every future slice in that file,
 * which is this hole again at file granularity. The text is the thing being
 * argued for, so moving the line keeps it cleared and CHANGING the line costs
 * a fresh argument.
 *
 * `tools/instant.mjs`'s own `utcDay` is NOT in it, and the first draft of this
 * file put it there. The stale-entry check printed it on the first run: that
 * line carries `toUtcInstant(` and the detector's own caller exemption already
 * clears it, so the entry argued for a finding that does not exist. That is
 * the check working on its author before anything else.
 */
export const ALLOWLIST = CORPUS.allowlist

/**
 * What this repository has decided about each code. `forbidden` outside a test
 * file, with or without an allowlist. Nothing else is a disposition: there is
 * no state here that means "not looked at", which is the state TEXTUAL_DAY was
 * in.
 */
export const DISPOSITIONS = {
  TEXTUAL_ORDER: {
    forbidden: true,
    allowlisted: false,
    why: 'ordering two timestamps by spelling is wrong wherever it appears; git prints an offset and the GitHub API prints Z for the same second'
  },
  TEXTUAL_DROP: {
    forbidden: true,
    allowlisted: false,
    why: 're-suffixing a truncated string discards the offset; this is the defect that read a ten-minute-old verdict as four hours old'
  },
  TEXTUAL_DAY: {
    forbidden: true,
    allowlisted: true,
    why: 'the committer local day is not the UTC day on 143 of this repository 2,134 commits; display columns that mean the local day are argued for by name in the corpus file'
  },
  // Added 2026-11-09 by the seat that wrote this gate's undecided-code check,
  // whose first act on the next run was to trip it. The check earned its keep
  // on its own author, which is the only test of a guard that counts.
  //
  // `allowlisted: false`, and the reason is stronger than for the other
  // three. There is no argued-for case: a comparator inside a sort callback
  // has no reading under which it is correct, because the refusal it returns
  // is indistinguishable from "these two rows are equal". The repair
  // (`sortByDay` / `sortByInstant`) is a drop-in with the same signature, so
  // a site that wanted this shape wanted the repair.
  REFUSAL_AS_ORDER: {
    forbidden: true,
    allowlisted: false,
    why: 'compareDays and compareInstants answer null for a value they will not place; Array.prototype.sort coerces null to 0, so a refused row reads as equal and the array comes back in input order with no error. The hazard is documented twice in tools/instant.mjs as the stated reason sortByDay and sortByInstant exist, and the lint repaired-site exemption cleared it until this code was added'
  },
  // Added 2026-11-09 by this seat, on a measurement Ursa's engineer seat
  // handed over rather than landed. It built the detector as an assertion
  // inside its own new test file, and a detector in a test file emits no
  // `code:` literal and is driven by no probe, so `emittableCodes()` below
  // cannot see it and this table cannot owe a decision about it. The engineer
  // seat said exactly that itself, called its own instrument the weaker one,
  // and declined to write into this file ahead of the seat that owns it.
  //
  // The difference is worth stating because it is the general case: a test
  // asserts over the tree it is run on, and a disposition is decided once
  // here for every tree afterwards. A sweep in a test file is a measurement;
  // a code is a decision.
  //
  // `allowlisted: false`, and unlike REFUSAL_AS_ORDER above it this is a
  // STANDING BET rather than a proof. There is an arguable case — refusing a
  // value BECAUSE it is day-spelled is conservative, and this module's own
  // `parseInstant` does it over two lines — so the first honest instance goes
  // in the corpus file with its argument and this flips to `allowlisted:
  // true`. It starts false because today's tree has no instance to argue
  // about: measured at this commit, one finding, in a test file, zero
  // offenders.
  SHAPE_AS_EXISTENCE: {
    forbidden: true,
    allowlisted: false,
    why: 'timestampShape decides a SPELLING and parseDay decides an EXISTENCE, and they disagree about the days the calendar does not have: 2026-02-30 is day-shaped to the first and null to the second. A caller comparing that shape against the day string to mean "this is a day I can use" has accepted a date that does not exist. Two seats wrote that line in one night, in tools/seat/read-dates.mjs and in the transcription of it on the engineer lane, which is why it is a code and not a review note'
  }
}

/**
 * Test files demonstrate each defect on purpose, next to the instant-aware
 * assertion that contradicts it. Exempt, and COUNTED: the old gate skipped
 * them silently, and a silent skip is the same shape as the hole this file
 * closes.
 */
export const TEST_FILE = /\.test\.(mjs|js|cjs|ts|tsx)$/

/**
 * Every code the detector can emit. Declared ∪ observed, and neither alone:
 *
 *   declared — the `code:` literals in the detector's own source. Catches a
 *              code whose trigger no probe here happens to hit, which is the
 *              exact shape of the defect this gate closes.
 *   observed — what the detector actually returns when driven over the probe
 *              corpus. Catches a code built by expression rather than written
 *              as a literal, and doubles as the positive control.
 *
 * The union is the obligation. A disposition for a code nobody can emit is
 * harmless; a code nobody decided is the hole.
 */
export function emittableCodes (detectorSource, probes = PROBES) {
  const declared = [...detectorSource.matchAll(/\bcode:\s*'([A-Z_]+)'/g)].map((m) => m[1])
  const observed = probes.flatMap((line) => textualTimestampComparisons(line).map((f) => f.code))
  return {
    declared: [...new Set(declared)].sort(),
    observed: [...new Set(observed)].sort(),
    codes: [...new Set([...declared, ...observed])].sort()
  }
}

function cleared (finding) {
  return ALLOWLIST.find((e) => e.file === finding.file && e.text === finding.text.trim()) ?? null
}

/**
 * The whole decision, as data. Takes its file list and its reader as
 * arguments so a test can drive it over a tree it builds rather than over
 * this one.
 */
export function decide ({ files, read, detectorSource }) {
  const { scanned, skipped } = partition(files)
  const census = emittableCodes(detectorSource)
  const undecided = census.codes.filter((c) => !DISPOSITIONS[c])

  const findings = []
  let unreadable = 0
  for (const file of scanned) {
    let source
    try { source = read(file) } catch { unreadable += 1; continue }
    for (const f of textualTimestampComparisons(source)) findings.push({ file, ...f })
  }

  const offenders = []
  const inTests = []
  const clearedBy = []
  for (const f of findings) {
    if (TEST_FILE.test(f.file)) { inTests.push(f); continue }
    const entry = cleared(f)
    if (entry) { clearedBy.push({ ...f, why: entry.why }); continue }
    const d = DISPOSITIONS[f.code]
    if (!d || d.forbidden) offenders.push(f)
  }

  const matched = new Set(clearedBy.map((f) => `${f.file}\u0000${f.text.trim()}`))
  const stale = ALLOWLIST.filter((e) => !matched.has(`${e.file}\u0000${e.text}`))

  const byCode = {}
  for (const c of census.codes) {
    byCode[c] = {
      decided: Boolean(DISPOSITIONS[c]),
      findings: findings.filter((f) => f.code === c).length,
      offenders: offenders.filter((f) => f.code === c).length,
      cleared: clearedBy.filter((f) => f.code === c).length,
      in_tests: inTests.filter((f) => f.code === c).length
    }
  }

  return {
    census,
    undecided,
    scanned: scanned.length,
    skipped: skipped.length,
    unreadable,
    findings,
    offenders,
    cleared: clearedBy,
    in_tests: inTests,
    stale,
    byCode,
    ok: offenders.length === 0 && undecided.length === 0 && stale.length === 0
  }
}

function main (argv) {
  const json = argv.includes('--json')
  let files
  let detectorSource
  try {
    files = execFileSync('git', ['ls-files', '-z', '*.mjs', '*.js', '*.cjs', '*.ts', '*.tsx'], { cwd: REPO_ROOT, encoding: 'utf8' })
      .split('\0').filter(Boolean)
    detectorSource = readFileSync(resolve(REPO_ROOT, DETECTOR), 'utf8')
  } catch (err) {
    console.error(`could not establish the facts, so nothing was measured: ${err.message}`)
    return 2
  }

  const census = emittableCodes(detectorSource)
  if (census.observed.length === 0) {
    console.error('the positive control is silent: the detector returned nothing for lines that provably trip it, so this tree was not measured')
    return 2
  }
  if (files.length < 300) {
    console.error(`only ${files.length} source files listed, which is below any reading this repository has taken; the file list is wrong and nothing was measured`)
    return 2
  }

  const r = decide({ files, read: (f) => readFileSync(resolve(REPO_ROOT, f), 'utf8'), detectorSource })

  if (json) {
    console.log(JSON.stringify({ measured_at: new Date().toISOString(), ...r }, null, 2))
  } else {
    for (const f of r.offenders) console.log(`OFFENDER  ${f.file}:${f.line}  ${f.code}  ${f.text.slice(0, 100)}`)
    for (const e of r.stale) console.log(`STALE-ALLOWLIST  ${e.file}  ${e.text.slice(0, 100)}`)
    for (const c of r.undecided) console.log(`UNDECIDED-CODE  ${c}  the detector can emit it and this gate has no disposition for it`)
    console.log('')
    console.log(`read at ${new Date().toISOString()}`)
    console.log(`codes the detector can emit: ${r.census.codes.join(', ')} (declared ${r.census.declared.length}, observed ${r.census.observed.length})`)
    for (const [code, s] of Object.entries(r.byCode)) {
      const d = DISPOSITIONS[code]
      console.log(`  ${code}  ${s.decided ? (d.allowlisted ? 'forbidden, allowlist' : 'forbidden') : 'NO DISPOSITION'}  findings ${s.findings} = offenders ${s.offenders} + cleared ${s.cleared} + in tests ${s.in_tests}`)
    }
    console.log(`${r.findings.length} findings over ${r.scanned} tracked source files scanned, ${r.skipped} skipped${r.unreadable ? `, ${r.unreadable} unreadable` : ''}`)
    console.log(`${r.offenders.length} offenders, ${r.cleared.length} cleared by argument, ${r.in_tests.length} in test files (exempt: they demonstrate the defect beside the assertion that contradicts it)`)
    console.log(r.ok ? 'clean' : 'red')
  }
  return r.ok ? 0 : 1
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main(process.argv.slice(2)))
}
