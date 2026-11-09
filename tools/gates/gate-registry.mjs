#!/usr/bin/env node
// Every gate this repository has built, and whether anything would run it
// before a change reaches the default branch.
//
//   node tools/gates/gate-registry.mjs            # the decision, per candidate
//   node tools/gates/gate-registry.mjs --json
//   node tools/gates/gate-registry.mjs --list     # every candidate and its state
//
// Exit 0 every candidate gate is either named by `scripts/ci-checks.mjs` or
// carries a baseline entry saying why it is not. Exit 1 a candidate is reached
// by nothing and excused by nothing, or a baseline entry has outlived its
// reason, or a registered check names a file this tree does not have. Exit 2
// the facts could not be established, meaning not a git checkout, or the
// candidate sweep matched nothing, which must not read like a clean sweep.
//
// WHY THIS FILE EXISTS. The board item behind `scripts/ci-checks.mjs` asks
// that every test and gate we have built run before a change can reach the
// default branch, and that file is the list which makes it true. The list is
// maintained by hand, and four of its entries record the same history in their
// own comments: a gate was built, nobody registered it, and the only thing
// that ever ran it was a seat who remembered. `register-ids` says two register
// gates existed and were named in no gate list. `secret-print-tree` says this
// seat landed a vendored checker with three runners beside it and registered
// none of them. `code-census` was registered by the seat that wrote it on the
// same day and did not register it. Each was found by a person reading the
// tree, which is a method that works exactly as often as somebody looks.
//
// So the list's own completeness becomes a gate. A gate whose rules are
// tested and whose verdict nobody asks for is outside the path, which is
// Ursa/exo's sentence from 2026-11-09, and a registry nobody compares against
// the tree is the same thing one layer up.
//
// MEASURED WHEN THIS WAS WRITTEN, at the merge of #816 into this branch: 58
// candidates, 20 named by a check, and 38 reached by nothing. Six of the 38
// were real tree gates that run clean and offline in under six seconds, and
// they are registered in `scripts/ci-checks.mjs` by the same commit that adds
// this file: `tools/doc-model/check.mjs`, `tools/instant-gate.mjs`,
// `tools/registers/check-vendored.mjs`, and the three ledger gates
// `check-attributes`, `check-blockers` and `check-closures`, which
// `tools/ledger/ci/ledger-gate.yml` has been queueing with HQ instead.
//
// WHAT THIS DOES NOT CLAIM, named because an unnamed approximation is how the
// sweep before this one went wrong. "Named by a check" is not "run before a
// merge": nothing runs `scripts/ci-checks.mjs` on a pull request today, because
// `.github/workflows/` is HQ's under docs/standards/pm.md §15 and PWC-15 is
// still queued there. This gate measures the half that is Ursa's to fix. The
// other half is one workflow file and it is not a seat's to write.
//
// Nor is a check's presence in the list proof that it decides anything. That
// question is `tools/gates/enumerate-verdicts.mjs`'s, which drives each gate's
// verdict, and `tools/gates/code-census.mjs`'s, which asks whether each code a
// detector emits is watched. The three compose: this one says a gate is
// reached, the second says its verdict is coherent, the third says its findings
// are watched.
//
// DISCOVERY IS SHARED WITH `enumerate-verdicts.mjs` ON PURPOSE. Its census and
// this registry ask opposite questions of the same candidate set, so the set
// has one definition, `gateCandidatePaths`, and this file extends its language
// table with Python and shell rather than restating the JavaScript half. Two
// copies of a discovery rule is the defect this file exists to catch.

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { CANDIDATE_LANGS, gateCandidatePaths } from './enumerate-verdicts.mjs'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const BASELINE = join(REPO_ROOT, 'tools', 'gates', 'gate-registry.baseline.json')

// Python and shell carry gates here too, and the JavaScript-only census could
// not see them: `tools/secret-print-tests.py` was reachable by nothing for
// exactly that reason, which its own entry in `ci-checks.mjs` records.
//
// `stripComments` is deliberately absent for both. A `#` comment mentioning
// `sys.exit(1)` makes a file a candidate it should not be, and the cost of
// that is one baseline row on a to-do list. Dropping a real gate costs a
// silent false clean, so the bias runs toward over-collecting.
export const LANGS = [
  ...CANDIDATE_LANGS,
  {
    name: 'python',
    file: /\.py$/,
    testFile: /(^|\/)(test_[^/]*|[^/]*\.test)\.py$/,
    anyExit: /sys\.exit\s*\(/,
    failingExit: /sys\.exit\s*\(\s*[1-9]/g,
  },
  {
    name: 'shell',
    file: /\.sh$/,
    testFile: /\.test\.sh$/,
    anyExit: /\bexit\s+[0-9"$]/,
    failingExit: /\bexit\s+[1-9]/g,
  },
]

/** The kinds a baseline entry may claim, and what each one asserts.
 *
 *  A kind is not a severity. It says why no pull request gate runs this file,
 *  and each one is falsifiable by a different observation, which is what makes
 *  a stale entry findable.
 */
export const KINDS = {
  'not-a-gate': 'reports or measures, and has no verdict about the tree to fail on',
  'needs-network': 'cannot answer without reaching a service, so it belongs on a schedule',
  'needs-token': 'needs a credential a pull request gate is not given',
  'write-action': 'changes the repository when run, which a gate must never do',
  'merge-driver': 'invoked by git during a merge, not by a gate list',
  'the-runner': 'is the gate list itself, and a list cannot be one of its own entries',
  'schedule-only': 'its work is minutes long, so a per-change gate is the wrong place for it',
  'host-dependent': 'its verdict is about the host it runs on rather than about the branch, '
    + 'so two runners would answer differently about an unchanged tree',
  'red-on-main': 'it is a real gate and it is RED on main today, so registering it would turn '
    + 'every branch red for a backlog that branch did not cause. Carries a ledger pointer',
  'covered-by': 'another registered check runs it',
}

/** `red-on-main` is the kind that can rot into an excuse, so it is the one
 *  kind whose reason this gate executes rather than reads.
 *
 *  The entry names a ledger heading, and the heading has to be in
 *  `docs/ideas.md`. That is the difference between "we know and somebody owns
 *  the repair" and "we know", and run 10 of this seat spent its window on
 *  exactly this distinction in `EXPECTED_ABSENT_FIXTURES`: an exemption that
 *  states a premise nobody can check is a name subtracted from a failure set.
 */
export const KIND_NEEDS_LEDGER = 'red-on-main'

/** Which tracked files each registered check invokes, repository-relative.
 *
 *  `check.cwd` is load-bearing and was not at first. A check that runs in
 *  `ursa-minor` names `scripts/check-index-contract.mjs`, which is a real file
 *  one directory down and no file at the root, so reading the token as written
 *  reported three of this list's own site checks as pointing at nothing. A
 *  gate that cries wolf about the gate list is worse than no gate about it.
 */
export function registeredPaths(checks) {
  const out = new Map()
  for (const check of checks) {
    let argv
    try {
      argv = check.argv()
    } catch (err) {
      throw new Error(`check ${check.id} could not state its argv: ${err.message}`)
    }
    for (const token of argv) {
      if (!/[/.]/.test(token) || !/\.(mjs|js|ts|py|sh)$/.test(token)) continue
      const rel = check.cwd ? `${check.cwd}/${token}` : token
      if (!out.has(rel)) out.set(rel, [])
      out.get(rel).push(check.id)
    }
  }
  return out
}

/** The decision for every candidate, plus the findings about the baseline.
 *
 *  Pure, so the suite can assert each class without a git checkout or a
 *  subprocess. `candidates` is the discovered set, `registered` is the map
 *  above, `baseline` is the parsed file.
 *
 *  WHY `locate` RETURNS THREE WORDS AND NOT A BOOLEAN. It did return a
 *  boolean, named `exists`, and the boolean was the defect. Two of this
 *  function's arms ask "is this path in the tree", and the question has a
 *  third answer: the path is on disk and the sweep that finds candidates
 *  cannot see it yet, because discovery reads `HEAD` and a file being written
 *  is not at `HEAD` yet. Both arms used to call that case gone, and the
 *  sentence they printed told the reader to delete the row -- at the one
 *  moment deleting it is wrong. Measured on a clean worktree of
 *  `53d1e933` on 2026-11-09, with a three-line file whose only exit is
 *  `process.exit(v.exit)` and a baseline row naming it:
 *
 *    untracked  STALE-ENTRY "is not in this tree. Delete it"  and the file is
 *               on disk, so the sentence is false and not merely unhelpful
 *    staged     STALE-ENTRY "is no longer a gate candidate"   and it has never
 *               been one, so "no longer" is false too
 *    committed  clean, and the candidate count goes 66 to 67
 *
 *  The same probe on the gate-list arm fires MISSING-TARGET while the file is
 *  untracked and goes quiet at `git add`, because the old `exists` read the
 *  INDEX while discovery read `HEAD`. So the two arms cleared at two different
 *  instants and neither cleared when the file was written. Ursa/exo lost a
 *  correct baseline row to the staged case within an hour of writing the tool
 *  it described, which is the cost this third state exists to stop paying.
 *
 *  `locate(path)` returns `'committed'`, `'uncommitted'` or `'absent'`, and
 *  `uncommitted` is reported as `pending` rather than as a problem: it is
 *  unreachable in CI, where the tree under test is always committed, so it
 *  cannot hide a real stale row from the only reader that blocks a merge.
 */
export function decide({ candidates, registered, baseline, locate, checkIds, ledgerHeadings = [] }) {
  if (typeof locate !== 'function') {
    throw new TypeError('decide() needs locate(path) -> committed|uncommitted|absent. It took a '
      + 'boolean `exists` until 2026-11-09, and the two cases that boolean merged are the '
      + 'reason this throws instead of defaulting.')
  }
  const byPath = new Map((baseline.entries ?? []).map((e) => [e.path, e]))
  const rows = []
  const problems = []
  const pending = []

  for (const c of candidates) {
    const checks = registered.get(c.path) ?? []
    if (checks.length > 0) {
      rows.push({ ...c, state: 'registered', by: checks })
      continue
    }
    const entry = byPath.get(c.path)
    if (!entry) {
      rows.push({ ...c, state: 'unreached' })
      problems.push({
        kind: 'unreached',
        path: c.path,
        why: `${c.path} looks like a gate and no check in scripts/ci-checks.mjs runs it. `
          + 'Register it there, or add an entry to tools/gates/gate-registry.baseline.json '
          + `saying which of these it is: ${Object.keys(KINDS).join(', ')}`,
      })
      continue
    }
    if (!KINDS[entry.kind]) {
      rows.push({ ...c, state: 'undecided', entry })
      problems.push({
        kind: 'unknown-kind',
        path: c.path,
        why: `its baseline entry claims kind "${entry.kind}", which is not one of `
          + Object.keys(KINDS).join(', '),
      })
      continue
    }
    if (!entry.why || entry.why.trim().length < 20) {
      rows.push({ ...c, state: 'undecided', entry })
      problems.push({
        kind: 'unreasoned',
        path: c.path,
        why: 'its baseline entry carries no reason a reader could check. A kind without a '
          + 'reason is the exemption shape this seat repaired in EXPECTED_ABSENT_FIXTURES '
          + 'on 2026-11-09: a name subtracted from a failure set, carrying no argument',
      })
      continue
    }
    if (entry.kind === KIND_NEEDS_LEDGER) {
      if (!entry.ledger || !ledgerHeadings.some((h) => h.includes(entry.ledger))) {
        rows.push({ ...c, state: 'undecided', entry })
        problems.push({
          kind: 'unowned-red',
          path: c.path,
          why: `it is excused as red on main and points at ledger entry `
            + `"${entry.ledger ?? '(none named)'}", which no heading in docs/ideas.md carries. `
            + 'A gate nobody can run and nobody owns repairing is not excused, it is dropped',
        })
        continue
      }
    }
    if (entry.kind === 'covered-by') {
      if (!entry.covered_by || !checkIds.includes(entry.covered_by)) {
        rows.push({ ...c, state: 'undecided', entry })
        problems.push({
          kind: 'stale-cover',
          path: c.path,
          why: `it claims to be covered by check "${entry.covered_by ?? '(none named)'}", `
            + 'which scripts/ci-checks.mjs does not have',
        })
        continue
      }
    }
    rows.push({ ...c, state: 'excused', entry })
  }

  const discovered = new Set(candidates.map((c) => c.path))
  for (const entry of baseline.entries ?? []) {
    if (discovered.has(entry.path)) continue
    const where = locate(entry.path)
    if (where === 'uncommitted') {
      pending.push({
        kind: 'pending-entry',
        path: entry.path,
        why: `${entry.path} is excused by the baseline and is on disk but not committed, so the `
          + 'candidate sweep cannot see it yet: discovery reads HEAD. Commit the file and this '
          + 'entry goes live. Do NOT delete the entry',
      })
      continue
    }
    problems.push({
      kind: 'stale-entry',
      path: entry.path,
      why: where === 'committed'
        ? `${entry.path} is excused by the baseline, is committed, and is no longer a gate `
          + 'candidate, so the entry decides nothing. Delete it'
        : `${entry.path} is excused by the baseline and is not in this tree. Delete it`,
    })
  }

  for (const [path, checks] of registered) {
    const where = locate(path)
    if (where === 'committed') continue
    if (where === 'uncommitted') {
      pending.push({
        kind: 'pending-target',
        path,
        why: `check(s) ${checks.join(', ')} in scripts/ci-checks.mjs invoke ${path}, which is on `
          + 'disk but not committed. The check is right and the commit has not happened yet. Do '
          + 'NOT delete the check',
      })
      continue
    }
    problems.push({
      kind: 'missing-target',
      path,
      why: `check(s) ${checks.join(', ')} in scripts/ci-checks.mjs invoke ${path}, which is `
        + 'not in this tree, so that check cannot be what it says it is',
    })
  }

  return { rows, problems, pending }
}

/** `pending` never moves the exit code, and it is in the summary line anyway.
 *
 *  A pending row means a file is written and not yet committed, which is a
 *  state of the author's working tree and not of this repository. CI tests a
 *  committed tree, so the count is 0 there by construction; the line carries
 *  it so that the local reader who is mid-write is told why a row they just
 *  added is not doing anything yet, instead of reading a clean sweep and
 *  concluding the row works.
 */
export function verdict({ rows, problems, candidates, pending = [] }) {
  if (candidates === 0) {
    return {
      exitCode: 2,
      cause: 'no-candidates',
      line: 'gate-registry: the candidate sweep matched no file at all, so this is a tool '
        + 'failure and not a clean registry.',
    }
  }
  const counts = { registered: 0, excused: 0, unreached: 0, undecided: 0 }
  // `?? 0` and not `+= 1`: a row state this function has no counter for used to
  // make the summary line read `NaN excused`, which is a number a reader
  // believes. Adding a state to `decide` is exactly how that would happen.
  for (const r of rows) counts[r.state] = (counts[r.state] ?? 0) + 1
  const waiting = pending.length > 0 ? ` ${pending.length} row(s) pending a commit.` : ''
  if (problems.length === 0) {
    return {
      exitCode: 0,
      cause: 'every-gate-reached-or-excused',
      line: `gate-registry: ${candidates} gate candidate(s), ${counts.registered} run by a `
        + `check in scripts/ci-checks.mjs and ${counts.excused} excused in writing.${waiting}`,
    }
  }
  const byKind = {}
  for (const p of problems) byKind[p.kind] = (byKind[p.kind] ?? 0) + 1
  const named = Object.entries(byKind).map(([k, n]) => `${n} ${k}`).join(', ')
  return {
    exitCode: 1,
    cause: 'registry-incomplete',
    line: `gate-registry: ${candidates} gate candidate(s) and ${problems.length} finding(s): `
      + `${named}. A gate reached by nothing is a gate we did not build.${waiting}`,
  }
}

function main(argv) {
  const json = argv.includes('--json')
  const list = argv.includes('--list')

  const candidates = gateCandidatePaths({ langs: LANGS })
  if (candidates === null) {
    const line = 'gate-registry: cannot do its job: this is not a git checkout, so the set of '
      + 'tracked candidate gates is unavailable rather than empty.'
    console.error(line)
    return 2
  }

  let checks
  try {
    ;({ CHECKS: checks } = require_checks())
  } catch (err) {
    console.error(`gate-registry: cannot do its job: scripts/ci-checks.mjs did not load (${err.message}).`)
    return 2
  }

  let baseline = { entries: [] }
  if (existsSync(BASELINE)) {
    try {
      baseline = JSON.parse(readFileSync(BASELINE, 'utf8'))
    } catch (err) {
      console.error(`gate-registry: cannot do its job: ${BASELINE} is not readable JSON (${err.message}).`)
      return 2
    }
  }

  // THREE SETS AND NOT ONE. `ls-files` is the INDEX and `ls-tree HEAD` is the
  // commit, and `gateCandidatePaths` discovers off `git show HEAD:`, so the
  // index is the wrong authority for "the sweep can see this". Reading both,
  // plus the disk, is what lets `locate` tell a file being written from a file
  // that is gone. The disk read is last because it is the only one that can be
  // true for a path git has never heard of.
  const atHead = new Set(
    execFileSync('git', ['-C', REPO_ROOT, 'ls-tree', '-r', '--name-only', 'HEAD'],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
      .split('\n').filter(Boolean),
  )
  const inIndex = new Set(
    execFileSync('git', ['-C', REPO_ROOT, 'ls-files'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
      .split('\n').filter(Boolean),
  )
  const locate = (p) => {
    if (atHead.has(p)) return 'committed'
    if (inIndex.has(p) || existsSync(join(REPO_ROOT, p))) return 'uncommitted'
    return 'absent'
  }

  let ledgerHeadings = []
  try {
    ledgerHeadings = readFileSync(join(REPO_ROOT, 'docs', 'ideas.md'), 'utf8')
      .split('\n').filter((l) => l.startsWith('### '))
  } catch (err) {
    console.error(`gate-registry: cannot do its job: docs/ideas.md did not read (${err.message}), `
      + 'so a red-on-main entry\'s ledger pointer could not be checked and this run is not a verdict.')
    return 2
  }

  const { rows, problems, pending } = decide({
    candidates,
    registered: registeredPaths(checks),
    baseline,
    locate,
    checkIds: checks.map((c) => c.id),
    ledgerHeadings,
  })
  const v = verdict({ rows, problems, candidates: candidates.length, pending })

  if (json) {
    console.log(JSON.stringify({ rows, problems, pending, verdict: v }, null, 2))
    return v.exitCode
  }

  if (list) {
    for (const r of [...rows].sort((a, b) => a.state.localeCompare(b.state) || a.path.localeCompare(b.path))) {
      const tail = r.state === 'registered' ? r.by.join(', ') : r.entry ? `${r.entry.kind}: ${r.entry.why}` : ''
      console.log(`${r.state.padEnd(11)} ${r.path.padEnd(40)} ${tail}`)
    }
    console.log('')
  }

  for (const p of problems) {
    const line = `${p.kind.toUpperCase()}: ${p.path}: ${p.why}`
    console.log(process.env.GITHUB_ACTIONS === 'true' ? `::error::${line}` : line)
  }
  // `::notice::` and not `::error::`: a pending row is not a finding and must
  // not annotate a pull request as one. It is 0 on any committed tree anyway,
  // so this branch is for the author's own terminal.
  for (const p of pending) {
    const line = `${p.kind.toUpperCase()}: ${p.path}: ${p.why}`
    console.log(process.env.GITHUB_ACTIONS === 'true' ? `::notice::${line}` : line)
  }
  if (problems.length > 0 || pending.length > 0) console.log('')
  console.log(v.line)
  return v.exitCode
}

// `ci-checks.mjs` is ESM and `decide` has to stay synchronous for the suite, so
// the import is deferred into a helper rather than taken at module load: this
// file is imported by its own test suite, which must not pay for loading the
// gate list to assert a pure function.
function require_checks() {
  const url = new URL('../../scripts/ci-checks.mjs', import.meta.url)
  // Node has no synchronous ESM import, so read the one export this needs
  // through a child process that prints it.
  const out = execFileSync(process.execPath, ['-e',
    `import(${JSON.stringify(url.href)}).then((m) => {`
    + 'console.log(JSON.stringify(m.CHECKS.map((c) => ({ id: c.id, cwd: c.cwd, argv: c.argv() }))))'
    + '})',
  ], { encoding: 'utf8', cwd: REPO_ROOT })
  const raw = JSON.parse(out)
  return { CHECKS: raw.map((c) => ({ id: c.id, cwd: c.cwd, argv: () => c.argv })) }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main(process.argv.slice(2)))
}
