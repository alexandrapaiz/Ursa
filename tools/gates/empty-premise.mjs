#!/usr/bin/env node
// Does a gate that reads an EMPTY population say so, or does it print the
// sentence the reader already expected and exit 0?
//
//   node tools/gates/empty-premise.mjs              # the table
//   node tools/gates/empty-premise.mjs --json
//   node tools/gates/empty-premise.mjs --only <substr>
//
// Exit 0  every graded candidate codes its empty premise, or is baselined with
//         a reason that still holds.
// Exit 1  a candidate reports clean over an emptied premise and is in neither
//         place, or a baseline entry has outlived its finding, or the PREMISE
//         FLOOR below was not met.
// Exit 2  the ground could not be established: the premise set, the candidate
//         list or the two worktrees could not be built.
// Exit 3  nothing was graded. Zero findings among zero comparisons is not a
//         clean sweep, and 3 rather than 0 is HQ's exo-centralizer's own
//         correction to its own gate on 2026-11-09, taken here because it
//         applies identically.
//
// WHY THIS IS A SECOND AXIS AND NOT A BETTER RUN OF THE FIRST.
// `tools/gates/premise-differential.mjs` removes THE REPOSITORY and grades 61
// candidates on it. Ursa's security seat ran one step further on the same axis
// and returned the half this seat owed it:
//
//   "Absent and empty are two premises and only absent was swept.
//    check-closures over a zero-byte docs/ideas.md printed `0 marker(s) in 0
//    document(s), all resolved and all closed`, exit 0, and ci-checks takes it
//    at passExit 0 and 2. An absent premise crashes and gets looked at. An
//    empty one prints a sentence the reader already expected."
//
// That is the difference in one line, and it is why this axis is the more
// expensive of the two to leave unswept: the absent arm's failures are loud by
// construction, so the quiet ones all live here.
//
// THE PREMISE FLOOR, which is this file's own contribution and is a control on
// the EXPERIMENT rather than on any candidate.
// Alexandria's engineer seat wrote, the same morning, a floor on how many
// entries each of its register patterns finds, "because a pattern that stops
// matching does not fail, it merges the register as one block and exits zero."
// The floor caught its own author on the first run: the first draft read a
// length over the parser's return and got two, "and two is a legal entry
// count."
//
// Applied here, the floor is not on the findings, it is on the premise. If a
// declared premise file was ALREADY empty, truncating it removes nothing, every
// row comes back UNMOVED, and this gate reports a clean sweep over an
// experiment that never happened. So every file in the set must be non-empty in
// the pristine arm, and the bytes removed are printed.
//
// AND THE FLOOR'S OWN DENOMINATOR IS READ TWICE, FROM TWO SURFACES, which is
// the engineer's self-catch generalised. Their floor was wrong because the
// quantity it read was legal: 2 is a legal entry count. A byte count is legal
// at every value too, so the floor reads each file's size from the pristine
// WORKTREE and from `git cat-file -s HEAD:<path>`, and a disagreement is
// reported as PREMISE_SIZE_DISAGREEMENT rather than resolved. A floor whose own
// reading can be legally wrong is not a control; it is a second unguarded
// measurement wearing a control's name.
//
// HOW THE ARMS ARE BUILT, and why both of them are sandboxes.
// Measured on the repository axis: 40 of 61 of this repository's tools resolve
// their inputs against the SCRIPT'S own directory and not the working one. For
// those, changing the working directory removes nothing, and emptying a file
// under the checkout you are standing in is not an option -- this seat may not
// leave a mutated tree behind. So both arms run from `git worktree` checkouts
// of HEAD: a pristine one and an emptied one, with each arm running THAT
// worktree's own copy of the candidate. The only variable between them is the
// content of the declared premise set.
//
// The grading is NOT re-implemented. `grade()`, `normalise()`,
// `namesOwnCause()` and the class vocabulary are imported from
// premise-differential.mjs, so the two axes cannot disagree about what a move
// is. Only the arm construction is new, which is the half that is actually
// different. A bound restated is two implementations that agree only on the day
// they are written.
//
// THE APPROXIMATE PART, stated in the verdict line as well as here, because a
// reader who takes the floor for the ceiling has been misled by a green:
// `not_swept` in `empty-premise.json` names two premise kinds this axis does
// not reach -- JSON baselines, whose empty form is per-schema, and the board
// and forge, whose empty form is a 200 over an empty collection. Their count is
// printed beside every total.

import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, statSync, truncateSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ARM_TIMEOUT_MS,
  CLASSES,
  STRIPPED_ENV,
  candidatesWithExclusions,
  grade,
} from './premise-differential.mjs'

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const PREMISE_SET = join(REPO_ROOT, 'tools', 'gates', 'empty-premise.json')
const BASELINE = join(REPO_ROOT, 'tools', 'gates', 'empty-premise.baseline.json')

export { CLASSES }

export function loadPremiseSet(path = PREMISE_SET) {
  const doc = JSON.parse(readFileSync(path, 'utf8'))
  if (!Array.isArray(doc.premise) || !doc.premise.length) {
    throw new Error('the premise set declares no files, so there is no experiment to run')
  }
  return doc
}

export function loadBaseline(path = BASELINE) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return { entries: [] }
  }
}

/** The floor, and the two readings of its own denominator.
 *
 *  `worktreeBytes` is the size in the pristine arm, which is the number that
 *  decides whether truncation removes anything. `headBytes` is the same file's
 *  blob size at HEAD. They should agree; a worktree checkout of HEAD has no
 *  reason to differ. Where they do, this run says so and does not pick one,
 *  because the whole point of a second surface is that it can refuse. */
export function readPremise(doc, pristine, repoRoot = REPO_ROOT) {
  return doc.premise.map((entry) => {
    let worktreeBytes = null
    try {
      worktreeBytes = statSync(join(pristine, entry.path)).size
    } catch {
      worktreeBytes = null
    }
    let headBytes = null
    try {
      headBytes = Number(execFileSync('git', ['cat-file', '-s', `HEAD:${entry.path}`], {
        cwd: repoRoot,
        encoding: 'utf8',
      }).trim())
    } catch {
      headBytes = null
    }
    return { ...entry, worktreeBytes, headBytes }
  })
}

/** PREMISE_ABSENT_NOT_EMPTY is deliberately a floor failure and not a silent
 *  skip: a declared premise file that is missing from the tree means this axis
 *  is measuring the ABSENT premise for that row, which is the other tool's
 *  axis, and reporting it under this one's name would be the mislabelling this
 *  whole family of gates exists to catch. */
export function floorFindings(rows) {
  const out = []
  for (const r of rows) {
    if (r.worktreeBytes === null) {
      out.push({ code: 'PREMISE_ABSENT_NOT_EMPTY', path: r.path,
        why: 'declared in the premise set and not present in the pristine worktree, so this '
          + 'row would measure the absent premise under the empty axis name' })
      continue
    }
    if (r.worktreeBytes === 0) {
      out.push({ code: 'PREMISE_ALREADY_EMPTY', path: r.path,
        why: 'zero bytes before the emptying, so truncating it removes nothing and every row '
          + 'graded against it is UNMOVED by construction' })
    }
    if (r.headBytes !== null && r.worktreeBytes !== null && r.headBytes !== r.worktreeBytes) {
      out.push({ code: 'PREMISE_SIZE_DISAGREEMENT', path: r.path,
        why: `worktree says ${r.worktreeBytes} bytes and git cat-file -s HEAD says `
          + `${r.headBytes}; two surfaces disagree about the premise this run removed` })
    }
  }
  return out
}

function runArm(toolRoot, relPath, cwd) {
  const env = { ...process.env }
  for (const key of STRIPPED_ENV) delete env[key]
  const abs = join(toolRoot, relPath)
  const interp = abs.endsWith('.py') ? 'python3' : abs.endsWith('.sh') ? 'bash' : 'node'
  const r = spawnSync(interp, [abs], {
    cwd,
    env,
    timeout: ARM_TIMEOUT_MS,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 8 * 1024 * 1024,
  })
  return { status: r.status, signal: r.signal, text: `${r.stdout || ''}${r.stderr || ''}` }
}

/** Both arms from a worktree, each running its own copy of the candidate. The
 *  pristine arm is read twice, which is window 109's third reading: a row is
 *  graded only where the pair agrees with itself and disagrees with the
 *  emptied arm. */
export function measureEmpty(rows, pristine, emptied) {
  const results = []
  for (const row of rows) {
    const present1 = runArm(pristine, row.path, pristine)
    const present2 = runArm(pristine, row.path, pristine)
    const absent = runArm(emptied, row.path, emptied)
    const paths = [pristine, emptied, REPO_ROOT]
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

export function verdictEmpty(results, baseline, floor) {
  const excused = new Map((baseline.entries || []).map((e) => [e.path, e]))
  const findings = [...floor]
  for (const r of results) {
    if (r.cls !== 'GREEN_ON_NOTHING') continue
    if (!excused.has(r.path)) {
      findings.push({ code: 'CLEAN_OVER_EMPTY_PREMISE', path: r.path, why: r.firstLine })
    }
  }
  const byPath = new Map(results.map((r) => [r.path, r]))
  for (const [path, entry] of excused) {
    const r = byPath.get(path)
    if (!r) {
      findings.push({ code: 'BASELINE_NAMES_NO_CANDIDATE', path, why: entry.why })
    } else if (r.cls !== 'GREEN_ON_NOTHING' && r.cls !== 'NO_VERDICT') {
      findings.push({ code: 'BASELINE_ENTRY_STALE', path,
        why: `now ${r.cls}, so the reason recorded here no longer describes it` })
    }
  }
  const graded = results.filter((r) => ['GROUND_CODED', 'CODED_OFF_BAND', 'UNCODED_NONZERO',
    'GREEN_ON_NOTHING'].includes(r.cls)).length
  // Order matters: a floor failure is a statement that the experiment did not
  // happen, so it outranks "nothing was graded", and both outrank a clean run.
  if (findings.length) return { findings, graded, exitCode: 1 }
  if (!graded) return { findings, graded, exitCode: 3 }
  return { findings, graded, exitCode: 0 }
}

function worktree(ref) {
  const dir = mkdtempSync(join(tmpdir(), 'empty-premise-'))
  const path = join(dir, 'wt')
  execFileSync('git', ['worktree', 'add', '--detach', '--quiet', path, ref], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  })
  return { dir, path }
}

/** The cleanup below lives in a `finally`, and a `finally` does not run when
 *  the process is killed by a signal. Measured: this window killed its own
 *  full sweep with SIGTERM and left TWO orphan worktrees registered in
 *  `.git/worktrees`, which `git worktree list` then reports and every later
 *  `git worktree add` has to step around. So the handlers are not a flourish:
 *  a tool whose arms are worktrees is a tool that can be killed holding them,
 *  and on this host a run is ended by a cap it does not choose. */
function onSignal(fn) {
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.on(sig, () => { fn(); process.exit(2) })
  }
}

function removeWorktree(wt) {
  try {
    execFileSync('git', ['worktree', 'remove', '--force', wt.path], { cwd: REPO_ROOT })
  } catch { /* the rm below is the post-condition that matters */ }
  rmSync(wt.dir, { recursive: true, force: true })
}

function main() {
  const argv = process.argv.slice(2)
  const only = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null

  let doc
  try {
    doc = loadPremiseSet()
  } catch (err) {
    console.error(`PREMISE_SET_UNREADABLE: ${PREMISE_SET}: ${err.message}`)
    process.exit(2)
  }

  let rows
  let excluded = []
  try {
    ;({ rows, excluded } = candidatesWithExclusions())
  } catch (err) {
    console.error(
      'REGISTRY_UNDRIVABLE: tools/gates/gate-registry.mjs --json could not be driven, so this '
      + `tool has no candidate list and must not report a clean sweep: ${err.message}`,
    )
    process.exit(2)
  }
  rows = rows.filter((r) => resolve(REPO_ROOT, r.path) !== fileURLToPath(import.meta.url))
  if (only) rows = rows.filter((r) => r.path.includes(only))
  if (!rows.length) {
    console.error(
      'CANDIDATE_SWEEP_EMPTY: the registry returned no candidate matching this run, which is '
      + 'not the same fact as every candidate coding its empty premise.',
    )
    process.exit(2)
  }

  let pristine
  let emptied
  try {
    pristine = worktree('HEAD')
    emptied = worktree('HEAD')
  } catch (err) {
    if (pristine) removeWorktree(pristine)
    console.error(`WORKTREE_UNAVAILABLE: both arms of this axis are worktrees: ${err.message}`)
    process.exit(2)
  }

  const cleanup = () => { removeWorktree(emptied); removeWorktree(pristine) }
  onSignal(cleanup)

  let premise
  let floor
  let results
  try {
    premise = readPremise(doc, pristine.path)
    floor = floorFindings(premise)
    for (const p of premise) {
      if (p.worktreeBytes) truncateSync(join(emptied.path, p.path), 0)
    }
    results = measureEmpty(rows, pristine.path, emptied.path)
  } finally {
    cleanup()
  }

  const { findings, graded, exitCode } = verdictEmpty(results, loadBaseline(), floor)
  const emptiedCount = premise.filter((p) => p.worktreeBytes).length
  const bytesRemoved = premise.reduce((a, p) => a + (p.worktreeBytes || 0), 0)

  if (argv.includes('--json')) {
    console.log(JSON.stringify({
      axis: 'empty-premise', premise, floor, results, findings, graded, exitCode,
      notSwept: doc.not_swept,
    }, null, 2))
    process.exit(exitCode)
  }

  const order = ['GREEN_ON_NOTHING', 'UNCODED_NONZERO', 'CODED_OFF_BAND', 'GROUND_CODED',
    'UNMOVED', 'UNSTABLE', 'NO_VERDICT']
  results.sort((a, b) => order.indexOf(a.cls) - order.indexOf(b.cls)
    || a.path.localeCompare(b.path))
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
    `Premise floor: ${emptiedCount} of ${doc.premise.length} declared premise files were `
    + `non-empty and were emptied, ${bytesRemoved} bytes removed. `
    + `${doc.premise.length - emptiedCount} could not be emptied.`,
  )
  console.log(
    `Empty-premise differential: ${results.length} candidate(s), `
    + `${order.filter((c) => counts[c]).map((c) => `${counts[c]} ${c}`).join(', ')}.`,
  )
  // Printed on every run including a clean one. A number that appears only
  // when it is non-zero teaches a reader that its absence means nothing
  // happened -- HQ's exo-centralizer, 2026-11-09, on its own gate.
  console.log(
    `${graded} of ${results.length} were graded at all; ${results.length - graded} are UNMOVED, `
    + `UNSTABLE or NO_VERDICT on this axis and this run makes no claim about them.`,
  )
  console.log(
    `${excluded.length} candidate(s) were not spawned at all because the registry classifies `
    + `them write-action${excluded.length ? `: ${excluded.map((e) => e.path).join(', ')}` : ''}. `
    + 'A measurement that executes a write-action is a write, and inside a worktree that shares '
    + '.git/config with its parent it is a write to the parent.',
  )
  console.log(
    `Not swept, and counted here rather than absorbed: ${doc.not_swept.length} premise kind(s) `
    + `this axis does not reach (${doc.not_swept.map((n) => n.what).join('; ')}). The floor is `
    + `not the ceiling.`,
  )
  for (const f of findings) console.log(`${f.code}: ${f.path} -- ${f.why}`)
  if (exitCode === 3) {
    console.log(
      'NOTHING_GRADED: zero findings among zero comparisons is not a clean sweep, so this run '
      + 'exits 3 and claims nothing.',
    )
  }
  process.exit(exitCode)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main()
}
