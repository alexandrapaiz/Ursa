// The decision in `tools/gates/gate-registry.mjs`, driven class by class.
//
// WHY THE CASES ARE PURE AND THE LAST TWO ARE NOT. `decide` takes the
// candidate set, the registry, the baseline and two lookups as arguments, so
// every classification below is asserted without a git checkout, a
// subprocess, or this repository's own 61 candidates. That is deliberate: a
// suite that only ran the real sweep would go green on a tree where the sweep
// found nothing, and "found nothing" and "cannot find anything" are the two
// outcomes this whole file exists to separate.
//
// The last two cases do run the real thing, because the pure cases cannot
// reach the one property that matters at the end: that the tool as installed
// says 0 on this tree and would say 1 on a tree with an unreached gate.

import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { KINDS, decide, registeredPaths, verdict } from './gate-registry.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const CANDIDATE = { path: 'tools/x.mjs', lang: 'javascript', exitCalls: 1 }

/** The arguments `decide` needs, with one field overridden per case. */
function args(over = {}) {
  return {
    candidates: [CANDIDATE],
    registered: new Map(),
    baseline: { entries: [] },
    exists: () => true,
    checkIds: ['some-check'],
    ledgerHeadings: ['### 2026-11-09 (security) — a real heading'],
    ...over,
  }
}

test('a candidate a check runs is registered, and names the check', () => {
  const { rows, problems } = decide(args({
    registered: new Map([['tools/x.mjs', ['some-check']]]),
  }))
  assert.equal(rows[0].state, 'registered')
  assert.deepEqual(rows[0].by, ['some-check'])
  assert.deepEqual(problems, [])
})

test('a candidate nothing runs and nothing excuses is a finding', () => {
  const { rows, problems } = decide(args())
  assert.equal(rows[0].state, 'unreached')
  assert.equal(problems.length, 1)
  assert.equal(problems[0].kind, 'unreached')
  // The message has to carry the two ways out, or the next seat has to read
  // this file to learn what the gate wants from it.
  assert.match(problems[0].why, /scripts\/ci-checks\.mjs/)
  assert.match(problems[0].why, /gate-registry\.baseline\.json/)
})

test('an excused candidate with a kind and a reason is clean', () => {
  const { rows, problems } = decide(args({
    baseline: { entries: [{ path: 'tools/x.mjs', kind: 'not-a-gate', why: 'it reports and never fails on anything' }] },
  }))
  assert.equal(rows[0].state, 'excused')
  assert.deepEqual(problems, [])
})

test('a kind outside the table is undecided, not excused', () => {
  const { problems } = decide(args({
    baseline: { entries: [{ path: 'tools/x.mjs', kind: 'because-i-said-so', why: 'a long enough reason to pass the length test' }] },
  }))
  assert.equal(problems[0].kind, 'unknown-kind')
  assert.match(problems[0].why, /because-i-said-so/)
})

test('a kind with no reason a reader could check is undecided', () => {
  // The whole mechanism turns on this. An entry is a path subtracted from a
  // failure set, and a path carries no argument, so the argument is required.
  for (const why of [undefined, '', 'too short']) {
    const { problems } = decide(args({
      baseline: { entries: [{ path: 'tools/x.mjs', kind: 'not-a-gate', why }] },
    }))
    assert.equal(problems[0].kind, 'unreasoned', `why=${JSON.stringify(why)}`)
  }
})

test('covered-by has to name a check that exists', () => {
  const entry = { path: 'tools/x.mjs', kind: 'covered-by', why: 'another check runs it through a wrapper' }
  const bad = decide(args({ baseline: { entries: [{ ...entry, covered_by: 'no-such-check' }] } }))
  assert.equal(bad.problems[0].kind, 'stale-cover')
  const good = decide(args({ baseline: { entries: [{ ...entry, covered_by: 'some-check' }] } }))
  assert.deepEqual(good.problems, [])
})

test('red-on-main has to point at a ledger heading that exists', () => {
  const entry = {
    path: 'tools/x.mjs',
    kind: 'red-on-main',
    why: 'it exits 1 on main today over a backlog no branch caused',
  }
  const none = decide(args({ baseline: { entries: [entry] } }))
  assert.equal(none.problems[0].kind, 'unowned-red')
  const wrong = decide(args({ baseline: { entries: [{ ...entry, ledger: 'a heading nobody wrote' }] } }))
  assert.equal(wrong.problems[0].kind, 'unowned-red')
  const right = decide(args({ baseline: { entries: [{ ...entry, ledger: 'a real heading' }] } }))
  assert.deepEqual(right.problems, [])
})

test('an entry that is no longer a candidate is stale, and says which way', () => {
  const gone = decide(args({
    candidates: [],
    baseline: { entries: [{ path: 'tools/deleted.mjs', kind: 'not-a-gate', why: 'a reason long enough to pass' }] },
    exists: () => false,
  }))
  assert.equal(gone.problems[0].kind, 'stale-entry')
  assert.match(gone.problems[0].why, /is not in this tree/)

  const stillThere = decide(args({
    candidates: [],
    baseline: { entries: [{ path: 'tools/no-longer-exits.mjs', kind: 'not-a-gate', why: 'a reason long enough to pass' }] },
    exists: () => true,
  }))
  assert.equal(stillThere.problems[0].kind, 'stale-entry')
  assert.match(stillThere.problems[0].why, /no longer a gate candidate/)
})

test('a check that invokes a file this tree does not have is a finding', () => {
  const { problems } = decide(args({
    candidates: [],
    registered: new Map([['tools/vanished.mjs', ['some-check']]]),
    exists: () => false,
  }))
  assert.equal(problems[0].kind, 'missing-target')
  assert.match(problems[0].why, /some-check/)
})

test("a check's cwd is part of the path it invokes", () => {
  // Read as written, three of this repository's own site checks pointed at
  // nothing: they run in `ursa-minor` and name `scripts/check-index-contract.mjs`.
  const got = registeredPaths([
    { id: 'site-index-contract', cwd: 'ursa-minor', argv: () => ['node', 'scripts/check-index-contract.mjs'] },
    { id: 'root-entries', argv: () => ['node', 'tools/root-entries.mjs'] },
  ])
  assert.deepEqual([...got.keys()].sort(), ['tools/root-entries.mjs', 'ursa-minor/scripts/check-index-contract.mjs'])
})

test('a candidate sweep that matched nothing is exit 2, never a clean registry', () => {
  const v = verdict({ rows: [], problems: [], candidates: 0 })
  assert.equal(v.exitCode, 2)
  assert.equal(v.cause, 'no-candidates')
  // The clean verdict and the empty verdict must not be confusable.
  assert.notEqual(v.cause, verdict({ rows: [], problems: [], candidates: 1 }).cause)
})

test('every kind in the table carries its own sentence', () => {
  // A kind whose meaning lives only in whichever baseline row used it first
  // is how a classification becomes a habit instead of a decision.
  for (const [kind, sentence] of Object.entries(KINDS)) {
    assert.equal(typeof sentence, 'string', kind)
    assert.ok(sentence.length > 30, `${kind}: ${sentence}`)
  }
})

test('as installed, the gate is green on this tree', () => {
  // Not a tautology beside the next case: this one proves the registry and
  // the baseline together account for every candidate HEAD actually has,
  // which no pure case above can know.
  const out = execFileSync(process.execPath, ['tools/gates/gate-registry.mjs'], { cwd: ROOT, encoding: 'utf8' })
  assert.match(out, /run by a check in scripts\/ci-checks\.mjs/)
  assert.doesNotMatch(out, /UNREACHED|UNOWNED-RED|STALE-ENTRY|MISSING-TARGET/)
})

test('and red on a tree where one excused candidate loses its entry', () => {
  // The discriminating measurement. Driving the real tool with the real
  // baseline minus one row is the closest this can get to the defect the gate
  // exists to catch without committing one.
  const baseline = JSON.parse(
    execFileSync('git', ['-C', ROOT, 'show', 'HEAD:tools/gates/gate-registry.baseline.json'], { encoding: 'utf8' }),
  )
  const dropped = baseline.entries[0]
  const ledgerHeadings = baseline.entries.filter((e) => e.ledger).map((e) => `### ${e.ledger}`)
  const { problems } = decide({
    // Every excused path stays a candidate, so the only change between this
    // tree and the clean one is the single missing row.
    candidates: baseline.entries.map((e) => ({ path: e.path, lang: 'javascript', exitCalls: 1 })),
    registered: new Map(),
    baseline: { entries: baseline.entries.filter((e) => e.path !== dropped.path) },
    exists: () => true,
    checkIds: baseline.entries.filter((e) => e.covered_by).map((e) => e.covered_by),
    ledgerHeadings,
  })
  assert.equal(problems.length, 1)
  assert.equal(problems[0].kind, 'unreached')
  assert.equal(problems[0].path, dropped.path)
  assert.equal(verdict({ rows: [{ state: 'unreached' }], problems, candidates: 1 }).exitCode, 1)
})
