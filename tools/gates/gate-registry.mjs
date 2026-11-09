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
 *  above, `baseline` is the parsed file, and `exists` answers whether a path
 *  is in the tree.
 */
export function decide({ candidates, registered, baseline, exists, checkIds, ledgerHeadings = [] }) {
  const byPath = new Map((baseline.entries ?? []).map((e) => [e.path, e]))
  const rows = []
  const problems = []

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
    problems.push({
      kind: 'stale-entry',
      path: entry.path,
      why: exists(entry.path)
        ? `${entry.path} is excused by the baseline and is no longer a gate candidate, so `
          + 'the entry decides nothing. Delete it'
        : `${entry.path} is excused by the baseline and is not in this tree. Delete it`,
    })
  }

  for (const [path, checks] of registered) {
    if (exists(path)) continue
    problems.push({
      kind: 'missing-target',
      path,
      why: `check(s) ${checks.join(', ')} in scripts/ci-checks.mjs invoke ${path}, which is `
        + 'not in this tree, so that check cannot be what it says it is',
    })
  }

  return { rows, problems }
}

export function verdict({ rows, problems, candidates }) {
  if (candidates === 0) {
    return {
      exitCode: 2,
      cause: 'no-candidates',
      line: 'gate-registry: the candidate sweep matched no file at all, so this is a tool '
        + 'failure and not a clean registry.',
    }
  }
  const counts = { registered: 0, excused: 0, unreached: 0, undecided: 0 }
  for (const r of rows) counts[r.state] += 1
  if (problems.length === 0) {
    return {
      exitCode: 0,
      cause: 'every-gate-reached-or-excused',
      line: `gate-registry: ${candidates} gate candidate(s), ${counts.registered} run by a `
        + `check in scripts/ci-checks.mjs and ${counts.excused} excused in writing.`,
    }
  }
  const byKind = {}
  for (const p of problems) byKind[p.kind] = (byKind[p.kind] ?? 0) + 1
  const named = Object.entries(byKind).map(([k, n]) => `${n} ${k}`).join(', ')
  return {
    exitCode: 1,
    cause: 'registry-incomplete',
    line: `gate-registry: ${candidates} gate candidate(s) and ${problems.length} finding(s): `
      + `${named}. A gate reached by nothing is a gate we did not build.`,
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

  const tracked = new Set(
    execFileSync('git', ['-C', REPO_ROOT, 'ls-files'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
      .split('\n').filter(Boolean),
  )

  let ledgerHeadings = []
  try {
    ledgerHeadings = readFileSync(join(REPO_ROOT, 'docs', 'ideas.md'), 'utf8')
      .split('\n').filter((l) => l.startsWith('### '))
  } catch (err) {
    console.error(`gate-registry: cannot do its job: docs/ideas.md did not read (${err.message}), `
      + 'so a red-on-main entry\'s ledger pointer could not be checked and this run is not a verdict.')
    return 2
  }

  const { rows, problems } = decide({
    candidates,
    registered: registeredPaths(checks),
    baseline,
    exists: (p) => tracked.has(p),
    checkIds: checks.map((c) => c.id),
    ledgerHeadings,
  })
  const v = verdict({ rows, problems, candidates: candidates.length })

  if (json) {
    console.log(JSON.stringify({ rows, problems, verdict: v }, null, 2))
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
  if (problems.length > 0) console.log('')
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
