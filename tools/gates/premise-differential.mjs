#!/usr/bin/env node
// Does a tool that cannot establish its facts SAY SO IN ITS EXIT STATUS?
// Asked by removing the facts and reading the colour, rather than by reading
// the tool's prose about what it would do.
//
//   node tools/gates/premise-differential.mjs            # the table
//   node tools/gates/premise-differential.mjs --json
//   node tools/gates/premise-differential.mjs --only <substr>
//
// Exit 0 every graded candidate either codes its missing ground or is
// baselined with a reason that still holds. Exit 1 a candidate reports clean
// over removed ground and is in neither place, or a baseline entry has
// outlived its finding. Exit 2 the candidate list could not be obtained, or it
// came back empty, which must not read like a clean sweep.
//
// WHY THIS FILE EXISTS, and whose measurement it generalises. On 2026-11-09
// two Ursa seats found the same defect in their own lanes, hours apart, and
// neither could see how wide it was.
//
//   Ursa/frontend: `measure-narrow.mjs` caught its own navigation failures,
//   printed `NOT MEASURED: 20 of 20 ... makes no claim about them`, and exited
//   0. The kit's other four measuring tools exit 1 against the same dead port
//   -- and they are right BY ACCIDENT, because they let the error escape and
//   node sets the status for them. The careful instrument was the broken one.
//   Their rule: error handling converts a crash into a pass unless the handler
//   also owns the exit status.
//
//   Ursa/security: `tools/board/bypass.mjs --audit` exited 0 over a window
//   that answered 401, printing `coverage INCOMPLETE` directly above the
//   green, while its own positive control passed in the same invocation
//   because the control grades synthetic rows and never reaches the route.
//   Two of fourteen `needs-token` excuses in
//   `tools/gates/gate-registry.baseline.json` were false when the credential
//   was actually removed.
//
// This repository already has the vocabulary for the answer: a GROUND verdict
// -- "I could not establish the facts" -- as against a FINDINGS verdict, with
// exit 2 reserved for it (`tools/gates/verdict-shape.mjs`). Driven by
// `tools/gates/enumerate-verdicts.mjs`, 56 of 56 branches across the 12
// EXTRACTED gates hold that convention. The class both seats found lives in
// the 38 that are not extracted. So the convention is not the gap. Reach is.
//
// THE THIRD READING, which is this file's own contribution and the reason it
// is not just a loop around `timeout`. A differential has two readings in the
// rule as it was written: change the premise, read the colour. Run over a real
// tree, two readings grade rows that were never measured:
//
//   UNMOVED. Nine of this repository's tools resolve their inputs against the
//   script's own directory rather than against the working directory, so
//   moving the working directory removes nothing. `tools/seat/read-dates.mjs`
//   run from an empty directory still printed `222 entries in
//   /tmp/.../docs/agents/improvements.md` and exited 0. A two-reading
//   differential scores that row CLEAN. It is UNMEASURED, and the difference
//   is the whole value of the run.
//
//   UNSTABLE. A tool whose output moves between two runs at the SAME premise
//   cannot be graded by comparing outputs across premises at all.
//
// So the premise-present arm is read TWICE and the absent arm once, and a row
// is graded only where the pair agrees with itself and disagrees with the
// absent arm. That is the generalisable half: a differential needs a reading
// that proves the premise moved, and the cheapest one is the control compared
// against itself.
//
// WHICH PREMISE THIS REMOVES, said plainly because an unnamed premise is how
// the UNMOVED rows would have been scored clean. One axis: THE REPOSITORY.
// Both arms run with the board credential and the forge token stripped, in
// both arms, so no row's answer depends on a secret and nothing this tool
// spawns can write anywhere. The variable is the working directory: the
// repository root, against an empty directory that is not a git checkout.
// Tools whose ground is a credential rather than a tree therefore come back
// UNMOVED here, correctly: this run does not measure them, and says so.
//
// THE APPROXIMATE PART, named because the sweep it replaces went wrong by not
// naming one. Deciding whether a non-zero exit carries the tool's OWN named
// verdict or a runtime's accident is lexical: this repository writes its
// causes as SCREAMING_SNAKE_CASE followed by a colon
// (`BOARD_ENV_ABSENT:`, `GH_UNREACHABLE:`), and a stack trace, a `fatal:` from
// git, a `Command failed:` from execFile or a bare `usage:` is not one. That
// classification is reported in its own column, never averaged into the
// verdict, and only GREEN_ON_NOTHING -- an exit 0 with the ground removed and
// the output provably moved -- can fail this gate. An exit code cannot be
// mistaken for a different exit code, so the half that fails is exact and the
// half that is lexical is advisory.

import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const BASELINE = join(REPO_ROOT, 'tools', 'gates', 'premise-differential.baseline.json')

/** Per-arm timeout. Three arms per candidate over ~60 candidates, so this is
 *  the number that decides whether the tool is minutes or tens of minutes. A
 *  tool that has not answered in this long is NO_VERDICT, which is honest:
 *  this run did not establish what it does. */
/** Per-arm timeout, and the default is 25 seconds because 12 was wrong in a
 *  way that cost this tool's own author a false claim to another seat. At 12s
 *  NINE of 61 rows came back NO_VERDICT, one of them the only
 *  GREEN_ON_NOTHING in the tree, and this window read `0 GREEN_ON_NOTHING` as
 *  a verdict over 61 candidates when it was a verdict over 52 -- with the
 *  summary line directly below it saying `16 of 62 were graded at all`. A
 *  count over a population with ungraded rows is not a verdict about the
 *  population, so the ungraded total is printed beside every count below and
 *  the default arm is long enough that the ungraded set is small. */
export const ARM_TIMEOUT_MS = Number(
  process.env.PREMISE_ARM_TIMEOUT_MS || 25_000,
)

/** Stripped in BOTH arms. Not part of the differential: present here so that
 *  no candidate can reach a credentialed service, and so that a tool whose
 *  ground is a token answers identically in both arms and is graded UNMOVED
 *  rather than silently attributed to the working directory. */
export const STRIPPED_ENV = [
  'BOARD_API_URL',
  'BOARD_RUNTIME_TOKEN',
  'GH_TOKEN',
  'GITHUB_TOKEN',
  'ANTHROPIC_API_KEY',
]

/** The code this repository's twelve EXTRACTED gates reserve for "I could not
 *  establish the facts": 56 of 56 branches driven by
 *  `tools/gates/enumerate-verdicts.mjs` put every GROUND verdict at 2 and no
 *  FINDINGS verdict there. It is a convention and not a law -- `seat/outage.mjs`
 *  and `seat/answered.mjs` use 3 for an unreadable board -- so a row outside it
 *  is reported in its own class and never fails this gate. */
export const GROUND_EXIT = 2

export const CLASSES = {
  GROUND_CODED: 'ground removed, output moved, exited 2 naming its own cause',
  CODED_OFF_BAND: 'ground removed, output moved, named its own cause, and exited a non-zero '
    + 'code other than 2 -- so the code is shared with whatever else that number means here, '
    + "which is Ursa/security's verdict-without-reach",
  UNCODED_NONZERO: 'ground removed, output moved, exited non-zero from a runtime or a '
    + 'subprocess rather than from its own verdict -- right by accident',
  GREEN_ON_NOTHING: 'ground removed, output moved, exited 0',
  UNMOVED: 'output and exit identical with the premise removed, so this axis removed '
    + 'nothing this tool reads: unmeasured, not clean',
  UNSTABLE: 'two readings at the same premise disagree, so no cross-premise comparison '
    + 'is available for this row',
  NO_VERDICT: 'an arm timed out or was killed, so this run did not establish what it does',
}

/** Did the tool name the cause ITSELF, as against a runtime or a subprocess
 *  naming it for the tool?
 *
 *  Two tests, and both are DERIVED rather than guessed, which is the whole
 *  reason this is not a word list. The first version of this function tested
 *  only `SCREAMING_SNAKE:` and called 4 of its own 13 graded rows foreign:
 *  `ensure-full-clone: . is not a git repository`, `prompt-slots: cannot do
 *  its job`, `check-attributes: no driver registry at ...` and `Refusing to
 *  judge containment`. Three of those four open with the tool's OWN BASENAME,
 *  which is a fact about the row and not a vocabulary, so it is the second
 *  test. The fourth is prose this function cannot decide, and it returns
 *  false and is reported as `unnamed` -- which claims nothing, rather than
 *  claiming foreign authorship.
 *
 *  Widening a word list was the wrong repair here for a reason this seat
 *  wrote down the same day (window 107): the fix for a verdict resting on the
 *  absence of a match is to split the decidable case from the undecidable
 *  one, never to add words. */
export function namesOwnCause(text, basename = '') {
  const first = String(text).split('\n').map((l) => l.trim()).find((l) => l) || ''
  if (/^[A-Z][A-Z0-9_]{3,}:/.test(first)) return true
  const stem = String(basename).replace(/\.(mjs|js|py|sh)$/, '')
  if (stem && first.startsWith(`${stem}:`)) return true
  return false
}

/** What a non-zero exit came from, when it did not name its own cause. Column
 *  only: never an input to the verdict. */
export function foreignShape(text) {
  const first = String(text).split('\n').map((l) => l.trim()).find((l) => l) || ''
  if (/^node:internal|^\s*at |^(Error|TypeError|ReferenceError|SyntaxError):/.test(first)) {
    return 'runtime-throw'
  }
  if (/^fatal:/.test(first)) return 'git-fatal'
  if (/Command failed:/.test(first)) return 'subprocess'
  if (/^Traceback/.test(first)) return 'python-traceback'
  if (/^usage/i.test(first)) return 'usage'
  return 'unnamed'
}

/** Absolute paths, instants and object names differ between arms for reasons
 *  that are not the premise. Normalise exactly those three and nothing else:
 *  normalising digits in general would hide a count that moved, which is the
 *  signal. */
export function normalise(text, paths) {
  let out = String(text)
  for (const p of paths) {
    if (p) out = out.split(p).join('<PATH>')
  }
  return out
    .replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z?/g, '<INSTANT>')
    .replace(/\b[0-9a-f]{7,40}\b/g, '<OBJECT>')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .trim()
}

function runArm(abs, cwd) {
  const env = { ...process.env }
  for (const key of STRIPPED_ENV) delete env[key]
  const interp = abs.endsWith('.py') ? 'python3' : abs.endsWith('.sh') ? 'bash' : 'node'
  const r = spawnSync(interp, [abs], {
    cwd,
    env,
    timeout: ARM_TIMEOUT_MS,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 8 * 1024 * 1024,
  })
  return {
    status: r.status,
    signal: r.signal,
    text: `${r.stdout || ''}${r.stderr || ''}`,
  }
}

/** The three readings and the grade. Exported so the suite drives this
 *  function over fixture tools it writes itself, rather than re-implementing
 *  the comparison -- `tools/gates/code-census.test.mjs` records why. */
export function grade({ present1, present2, absent, paths, basename = '' }) {
  const n = (arm) => normalise(arm.text, paths)
  for (const arm of [present1, present2, absent]) {
    if (arm.signal || arm.status === null) return { cls: 'NO_VERDICT', shape: 'killed' }
  }
  if (n(present1) !== n(present2) || present1.status !== present2.status) {
    return { cls: 'UNSTABLE', shape: 'self-disagreement' }
  }
  if (n(present1) === n(absent) && present1.status === absent.status) {
    return { cls: 'UNMOVED', shape: 'identical' }
  }
  if (absent.status === 0) return { cls: 'GREEN_ON_NOTHING', shape: foreignShape(absent.text) }
  if (namesOwnCause(absent.text, basename)) {
    return absent.status === GROUND_EXIT
      ? { cls: 'GROUND_CODED', shape: 'own-cause' }
      : { cls: 'CODED_OFF_BAND', shape: `own-cause-at-${absent.status}` }
  }
  return { cls: 'UNCODED_NONZERO', shape: foreignShape(absent.text) }
}

/** The candidate list is NOT re-derived here. `tools/gates/gate-registry.mjs`
 *  maintains it as a gate over its own completeness, so taking it from that
 *  tool means this one cannot disagree with the registry about what a gate is.
 *  If it cannot be driven, this tool exits 2 and reports nothing. */
export function candidates() {
  // `spawnSync` and not `execFileSync`, and the codes are read rather than
  // their sign. The registry documents three: 0 every candidate is reached or
  // excused, 1 a candidate is reached by nothing, 2 the facts could not be
  // established. Only 2 means there is no row set. 1 means the row set is
  // complete AND the registry has something to say about it.
  //
  // This was `execFileSync`, which throws on any non-zero, so from the moment
  // any sibling seat merged an unregistered gate onto `main` this tool printed
  // REGISTRY_UNDRIVABLE and exited 2 -- over a subprocess that had just
  // written the complete, valid row set to stdout. Measured on 2026-11-09 at
  // 11:0xZ: `scripts/uuid-shape-census.mjs` arrived UNREACHED, the registry
  // exited 1 with 65 rows in `--json`, and both differentials went dark.
  //
  // This is the charter's own rule -- "an exit code with more than two
  // meanings cannot be read as a boolean; name the code, not its sign" --
  // firing on the tool that was written to catch exactly this family, one
  // window after it shipped. The failure direction was honest, which is why it
  // survived a suite: it exits 2 and claims nothing. It was still blind, and it
  // went blind precisely when its dependency had a finding.
  const r = spawnSync('node', [join(REPO_ROOT, 'tools/gates/gate-registry.mjs'), '--json'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  })
  if (r.error) throw r.error
  if (r.signal) throw new Error(`gate-registry.mjs was killed by ${r.signal}`)
  if (![0, 1].includes(r.status)) {
    throw new Error(
      `gate-registry.mjs exited ${r.status}, which is not one of its two row-set-bearing codes `
      + `(0 clean, 1 findings): ${String(r.stderr || '').split('\n')[0]}`,
    )
  }
  return JSON.parse(r.stdout).rows
    // This file is itself a candidate the registry tracks, and driving it
    // would drive every other candidate again inside one arm: 62 nested
    // subprocesses that the arm timeout then kills, leaving the row
    // NO_VERDICT by construction and teaching nothing. A gate over every gate
    // has to exclude itself explicitly, because the registry is right to
    // include it.
    .filter((r) => resolve(REPO_ROOT, r.path) !== fileURLToPath(import.meta.url))
    .map((r) => ({ path: r.path, state: r.state, kind: r.entry?.kind }))
}

export function loadBaseline() {
  try {
    return JSON.parse(readFileSync(BASELINE, 'utf8'))
  } catch {
    return { entries: [] }
  }
}

/** `presentCwd` is a parameter so that the suite can drive this function over
 *  fixture tools in a directory it controls, instead of re-implementing the
 *  three-arm collection -- which is the half of this tool that can be wrong. */
export function measure(rows, sandbox, presentCwd = REPO_ROOT) {
  const results = []
  for (const row of rows) {
    // resolve, not join: a row may carry an absolute path (the suite's fixtures
    // do), and join would concatenate it onto the repository root.
    const abs = resolve(REPO_ROOT, row.path)
    const present1 = runArm(abs, presentCwd)
    const present2 = runArm(abs, presentCwd)
    const absent = runArm(abs, sandbox)
    const paths = [presentCwd, REPO_ROOT, sandbox]
    const basename = row.path.split('/').pop()
    const { cls, shape } = grade({ present1, present2, absent, paths, basename })
    results.push({
      ...row,
      cls,
      shape,
      presentExit: present1.status,
      absentExit: absent.status,
      firstLine: (absent.text.split('\n').find((l) => l.trim()) || '').trim().slice(0, 96),
    })
  }
  return results
}

export function verdict(results, baseline) {
  const excused = new Map((baseline.entries || []).map((e) => [e.path, e]))
  const findings = []
  for (const r of results) {
    if (r.cls !== 'GREEN_ON_NOTHING') continue
    if (!excused.has(r.path)) {
      findings.push({ code: 'CLEAN_OVER_REMOVED_GROUND', path: r.path, why: r.firstLine })
    }
  }
  // A baseline entry that has outlived its finding. Same direction as
  // `code-census.baseline.json`: the file can only shrink.
  const byPath = new Map(results.map((r) => [r.path, r]))
  for (const [path, entry] of excused) {
    const r = byPath.get(path)
    if (!r) {
      findings.push({ code: 'BASELINE_NAMES_NO_CANDIDATE', path, why: entry.why })
    } else if (r.cls !== 'GREEN_ON_NOTHING' && r.cls !== 'NO_VERDICT') {
      findings.push({
        code: 'BASELINE_ENTRY_STALE',
        path,
        why: `now ${r.cls}, so the reason recorded here no longer describes it`,
      })
    }
  }
  return { findings, exitCode: findings.length ? 1 : 0 }
}

function main() {
  const argv = process.argv.slice(2)
  const only = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null
  let rows
  try {
    rows = candidates()
  } catch (err) {
    console.error(
      `REGISTRY_UNDRIVABLE: tools/gates/gate-registry.mjs --json could not be driven, so this `
      + `tool has no candidate list and must not report a clean sweep: ${err.message}`,
    )
    process.exit(2)
  }
  if (only) rows = rows.filter((r) => r.path.includes(only))
  if (!rows.length) {
    console.error(
      'CANDIDATE_SWEEP_EMPTY: the registry returned no candidate matching this run, which is '
      + 'not the same fact as every candidate coding its ground.',
    )
    process.exit(2)
  }

  const sandbox = mkdtempSync(join(tmpdir(), 'premise-differential-'))
  let results
  try {
    results = measure(rows, sandbox)
  } finally {
    rmSync(sandbox, { recursive: true, force: true })
  }
  const baseline = loadBaseline()
  const { findings, exitCode } = verdict(results, baseline)

  if (argv.includes('--json')) {
    console.log(JSON.stringify({ axis: 'repository', results, findings, exitCode }, null, 2))
    process.exit(exitCode)
  }

  const order = ['GREEN_ON_NOTHING', 'UNCODED_NONZERO', 'CODED_OFF_BAND', 'GROUND_CODED',
    'UNMOVED', 'UNSTABLE', 'NO_VERDICT']
  results.sort((a, b) => order.indexOf(a.cls) - order.indexOf(b.cls) || a.path.localeCompare(b.path))
  for (const r of results) {
    console.log(
      `${r.cls.padEnd(17)} ${String(r.presentExit).padStart(3)}->${String(r.absentExit).padEnd(4)} `
      + `${r.shape.padEnd(17)} ${r.path.padEnd(36)} ${r.firstLine}`,
    )
  }
  const counts = {}
  for (const r of results) counts[r.cls] = (counts[r.cls] || 0) + 1
  console.log('')
  console.log(
    `Premise differential, axis = the repository: ${results.length} candidate(s), `
    + order.filter((c) => counts[c]).map((c) => `${counts[c]} ${c}`).join(', ') + '.',
  )
  const graded = (counts.GROUND_CODED || 0) + (counts.CODED_OFF_BAND || 0)
    + (counts.UNCODED_NONZERO || 0) + (counts.GREEN_ON_NOTHING || 0)
  const unmovedZero = results.filter((r) => r.cls === 'UNMOVED' && r.absentExit === 0).length
  console.log(
    `${graded} of ${results.length} were graded at all; the rest are UNMOVED, UNSTABLE or `
    + `NO_VERDICT on this axis and this run makes no claim about them.`,
  )
  console.log(
    `${unmovedZero} of the UNMOVED rows exited 0 with the premise removed. A differential with `
    + `two readings instead of three publishes every one of them as a green-on-nothing finding, `
    + `and every one would be false: the output did not move, so the premise did not either.`,
  )
  for (const f of findings) console.log(`${f.code}: ${f.path} -- ${f.why}`)
  process.exit(exitCode)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main()
}
