// The subject axis, asserted on its classifier and on its floor.
//
// What these tests are FOR, stated because a suite over a gate is easy to
// write as a suite over its happy path: every exit code this tool can return
// and every finding code it can emit is named here. `tools/gates/code-census.mjs`
// enforces that, and it is the reason four of these tests exist -- it found
// ARMS_IDENTICAL, FLOOR_SURFACES_DISAGREE, THIS_BRANCH and PARTLY_THIS_BRANCH
// emitted by a file no test named, which is "a gate whose verdict nobody asks
// for is outside the path" one layer down, at the level of a single code.
//
// The end-to-end control is NOT re-implemented here. `--self-test` builds two
// worktrees and plants a real violation, which is minutes rather than
// milliseconds, so it stays a command and this suite asserts the pure parts.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  NO_ANSWER_EXITS,
  SUBJECT_CLASSES,
  classify,
  findingKeys,
  floorFindings,
  loadSpec,
  verdict,
} from './inherited-finding.mjs'

const reached = (pass, status, findings = []) => ({ reached: true, pass, status, findings })
const floorOk = { baseTree: 'aaa', headTree: 'bbb', files: ['docs/x.md'], commits: 1 }

test('a gate green at the base and red at the tip is this branch\'s own finding', () => {
  const c = classify({
    baseRun: reached(true, 0, []),
    tip1: reached(false, 1, ['docs/mine.md']),
    tip2: reached(false, 1, ['docs/mine.md']),
    gateMoved: false,
  })
  assert.equal(c.cls, 'INTRODUCED')
  assert.deepEqual(c.introduced, ['docs/mine.md'])
})

test('the same finding at both arms is INHERITED and not this branch\'s', () => {
  const c = classify({
    baseRun: reached(false, 1, ['docs/theirs.md']),
    tip1: reached(false, 1, ['docs/theirs.md']),
    tip2: reached(false, 1, ['docs/theirs.md']),
    gateMoved: false,
  })
  assert.equal(c.cls, 'INHERITED')
  assert.deepEqual(c.inherited, ['docs/theirs.md'])
})

test('red at the base and green at the tip is REPAIRED, which is the state that looks like nothing happened', () => {
  const c = classify({
    baseRun: reached(false, 1, ['docs/theirs.md']),
    tip1: reached(true, 0, []),
    tip2: reached(true, 0, []),
    gateMoved: false,
  })
  assert.equal(c.cls, 'REPAIRED')
})

test('red at both arms with an extra finding at the tip is MIXED, partitioned rather than rounded', () => {
  const c = classify({
    baseRun: reached(false, 1, ['docs/theirs.md']),
    tip1: reached(false, 1, ['docs/theirs.md', 'docs/mine.md']),
    tip2: reached(false, 1, ['docs/theirs.md', 'docs/mine.md']),
    gateMoved: false,
  })
  assert.equal(c.cls, 'MIXED')
  assert.deepEqual(c.inherited, ['docs/theirs.md'])
  assert.deepEqual(c.introduced, ['docs/mine.md'])
})

test('red at both arms naming no path is UNATTRIBUTABLE, never INHERITED', () => {
  // The dangerous rounding: INHERITED tells a seat to ignore the finding. A
  // gate that names nothing gives this tool no evidence the two reds are the
  // same red, so it must refuse rather than reassure.
  const c = classify({
    baseRun: reached(false, 1, []),
    tip1: reached(false, 1, []),
    tip2: reached(false, 1, []),
    gateMoved: false,
  })
  assert.equal(c.cls, 'UNATTRIBUTABLE')
})

test('a gate whose own definition moved between the arms is GATE_CHANGED and is not attributed either way', () => {
  const c = classify({
    baseRun: reached(true, 0, []),
    tip1: reached(false, 1, ['docs/mine.md']),
    tip2: reached(false, 1, ['docs/mine.md']),
    gateMoved: true,
  })
  assert.equal(c.cls, 'GATE_CHANGED')
  assert.equal(c.introduced, undefined)
})

test('two tip readings that disagree are UNSTABLE, so no cross-arm comparison is offered', () => {
  const c = classify({
    baseRun: reached(true, 0, []),
    tip1: reached(false, 1, ['docs/a.md']),
    tip2: reached(true, 0, []),
    gateMoved: false,
  })
  assert.equal(c.cls, 'UNSTABLE')
})

test('an arm that did not run is NOT_REACHED and carries the reason', () => {
  const c = classify({
    baseRun: { reached: false, why: 'the arm\'s check list has no gate with id x' },
    tip1: reached(true, 0, []),
    tip2: reached(true, 0, []),
    gateMoved: false,
  })
  assert.equal(c.cls, 'NOT_REACHED')
  assert.match(c.why, /no gate with id/)
})

test('every class classify() can return is described in SUBJECT_CLASSES', () => {
  // Guards the pairing rather than the vocabulary: a class added to the
  // classifier and not to the table is a row whose meaning only its author
  // knows.
  for (const cls of ['CLEAN_BOTH', 'INHERITED', 'INTRODUCED', 'REPAIRED', 'MIXED',
    'GATE_CHANGED', 'UNSTABLE', 'UNATTRIBUTABLE', 'NOT_REACHED']) {
    assert.ok(SUBJECT_CLASSES[cls], `${cls} has no description`)
  }
})

test('ARMS_IDENTICAL fires when the two refs resolve to one tree', () => {
  const f = floorFindings({ baseTree: 'same', headTree: 'same', files: [], commits: 3 })
  assert.equal(f.length, 1)
  assert.equal(f[0].code, 'ARMS_IDENTICAL')
})

test('FLOOR_SURFACES_DISAGREE fires in both directions and resolves neither', () => {
  const a = floorFindings({ baseTree: 'x', headTree: 'y', files: [], commits: 1 })
  assert.deepEqual(a.map((f) => f.code), ['FLOOR_SURFACES_DISAGREE'])
  const b = floorFindings({ baseTree: 'same', headTree: 'same', files: ['docs/x.md'], commits: 1 })
  assert.ok(b.some((f) => f.code === 'FLOOR_SURFACES_DISAGREE'))
  // ARMS_IDENTICAL also fires there, and that is the point: two surfaces
  // disagreeing is reported as its own finding beside the one it contradicts.
  assert.ok(b.some((f) => f.code === 'ARMS_IDENTICAL'))
})

test('a floor failure outranks every gate row and exits 4, making no claim about the branch', () => {
  const rows = [{ id: 'g', cls: 'INTRODUCED', introduced: ['docs/a.md'] }]
  const v = verdict(rows, { baseTree: 's', headTree: 's', files: [], commits: 0 })
  assert.equal(v.exitCode, 4)
  assert.equal(v.classified, 0)
})

test('THIS_BRANCH is the finding code for an introduced row, at exit 1', () => {
  const v = verdict([{ id: 'redaction-tree', cls: 'INTRODUCED', introduced: ['docs/a.md'] }], floorOk)
  assert.equal(v.exitCode, 1)
  assert.deepEqual(v.findings.map((f) => f.code), ['THIS_BRANCH'])
  assert.equal(v.findings[0].gate, 'redaction-tree')
})

test('PARTLY_THIS_BRANCH is the finding code for a MIXED row, and reports only the introduced share', () => {
  const v = verdict([{
    id: 'ledger-attributes',
    cls: 'MIXED',
    inherited: ['docs/theirs.md'],
    introduced: ['docs/mine.md'],
  }], floorOk)
  assert.equal(v.exitCode, 1)
  assert.equal(v.findings[0].code, 'PARTLY_THIS_BRANCH')
  assert.deepEqual(v.findings[0].paths, ['docs/mine.md'])
})

test('an inherited finding is not a claim about the branch, so it exits 0', () => {
  const v = verdict([{ id: 'redaction-tree', cls: 'INHERITED', inherited: ['docs/theirs.md'] }], floorOk)
  assert.equal(v.exitCode, 0)
})

test('nothing classified exits 3 and never 0', () => {
  const v = verdict([
    { id: 'a', cls: 'NOT_REACHED' },
    { id: 'b', cls: 'UNSTABLE' },
    { id: 'c', cls: 'UNATTRIBUTABLE' },
  ], floorOk)
  assert.equal(v.exitCode, 3)
  assert.equal(v.classified, 0)
})

test('the codes that mean "I did not answer" are declared and exclude 1', () => {
  // Ursa/security's rule: a bare non-zero is not a pass, and nothing
  // downstream can tell "I did not answer" from "I answered no" unless the
  // tool says which codes are which.
  assert.deepEqual(NO_ANSWER_EXITS, [2, 3, 4])
  assert.ok(!NO_ANSWER_EXITS.includes(1))
  assert.ok(!NO_ANSWER_EXITS.includes(0))
})

test('findingKeys reads a finding location and not a path cited in prose', () => {
  // The defect this assertion exists for was real and was in the first
  // version: the gate's trailer, "See docs/security/redaction-standard.md and
  // Ursa incident 4", was captured as a path the branch had introduced.
  const text = [
    'error: Full private session or conversation UUID. Truncate it to 8 characters.',
    '  ./docs/agents/pm-2026-11-09-message-29-run.md:17',
    'Redaction gate would fail. See docs/security/redaction-standard.md and Ursa incident 4.',
  ].join('\n')
  assert.deepEqual(findingKeys(text, '/tmp/arm'),
    ['docs/agents/pm-2026-11-09-message-29-run.md'])
})

test('findingKeys strips the arm prefix, so two arms produce comparable keys', () => {
  const a = findingKeys('  /tmp/arm-base/docs/x.md:4\n', '/tmp/arm-base')
  const b = findingKeys('  /tmp/arm-tip/docs/x.md:91\n', '/tmp/arm-tip')
  assert.deepEqual(a, b)
  assert.deepEqual(a, ['docs/x.md'])
})

test('findingKeys drops the line number, so an edit above a violation is not a new finding', () => {
  assert.deepEqual(findingKeys('  docs/x.md:17\n', '/tmp/a'),
    findingKeys('  docs/x.md:204\n', '/tmp/a'))
})

test('the declared population names a reason and a defining file set for every gate', () => {
  const doc = loadSpec()
  assert.ok(doc.gates.length >= 1)
  for (const g of doc.gates) {
    assert.ok(g.id, 'a gate with no id')
    assert.ok(g.why && g.why.length > 20, `${g.id} carries no reason`)
    assert.ok(Array.isArray(g.defines) && g.defines.length,
      `${g.id} declares no defining files, so GATE_CHANGED can never fire for it`)
  }
  assert.ok(Array.isArray(doc.not_swept) && doc.not_swept.length,
    'an unnamed exclusion is how a partial sweep reads as a complete one')
})

test('every declared gate id exists in the repository\'s own check list', () => {
  // The population is declared, so it can name a gate that has been renamed
  // or removed. Then this axis silently sweeps fewer gates than it claims.
  return import('../../scripts/ci-checks.mjs').then(({ CHECKS }) => {
    const ids = new Set(CHECKS.map((c) => c.id))
    for (const g of loadSpec().gates) {
      assert.ok(ids.has(g.id), `${g.id} is declared here and is in no ci-checks entry`)
    }
  })
})

test('every file a declared gate says defines it is present in this checkout', () => {
  // Same failure, one level in: `defines` is how GATE_CHANGED fires, and
  // defineHash() treats an absent file as a hashable absence rather than
  // throwing, so a stale path would simply stop discriminating.
  return Promise.all([import('node:fs'), import('node:path'), import('node:url')])
    .then(([fs, path, url]) => {
      const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..')
      for (const g of loadSpec().gates) {
        for (const rel of g.defines) {
          assert.ok(fs.existsSync(path.join(root, rel)),
            `${g.id} says ${rel} defines it and this checkout has no such file`)
        }
      }
    })
})
