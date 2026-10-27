// node --test tools/ledger/attributes-verdict.test.mjs
//
// The unit under test is the failing exit branch, not the file. There are
// three of them and the point of each test below is that the branch names the
// condition that actually fired and the place its repair lives, rather than
// summing disjoint conditions into one count.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { verdict, COMMITTED, CLONE } from './attributes-verdict.mjs'

const committed = (message = 'a tracked file is wrong') => ({ locus: COMMITTED, message })
const clone = (message = 'this clone has no merge.ledger.driver') => ({ locus: CLONE, message })

test('no findings: exit 0, and the clean line counts what was looked at', () => {
  const r = verdict([], { declared: 6, drivers: ['ledger', 'register'], checkedClone: true })
  assert.equal(r.exitCode, 0)
  assert.equal(r.stream, 'out')
  assert.match(r.line, /6 declarations over 2 drivers \(ledger, register\)/)
  assert.match(r.line, /all registered in this clone/)
})

test('the clone claim is only made when the clone was actually checked', () => {
  // Without --clone the run has no evidence either way, so it must not say so.
  const r = verdict([], { declared: 6, drivers: ['ledger'], checkedClone: false })
  assert.doesNotMatch(r.line, /registered in this clone/)
})

test('committed only: exit 1, and the repair named is a pull request', () => {
  const r = verdict([committed(), committed()], {})
  assert.equal(r.exitCode, 1)
  assert.equal(r.stream, 'err')
  assert.match(r.line, /2 violations in tracked files/)
  assert.match(r.line, /CI does too/)
  assert.match(r.line, /which is a pull request/)
  assert.doesNotMatch(r.line, /this clone/)
})

test('clone only: exit 2, and it says the committed state is correct', () => {
  const r = verdict([clone()], {})
  assert.equal(r.exitCode, 2)
  assert.equal(r.stream, 'err')
  assert.match(r.line, /the committed state is correct/)
  assert.match(r.line, /nothing here needs a pull request/)
  assert.match(r.line, /per-clone and never committed/)
  // The consequence, which is the half that was missing on 2026-10-26: not
  // only "you are unconfigured" but "so your measurements are wrong".
  assert.match(r.line, /measures as a conflict that is not one/)
  assert.doesNotMatch(r.line, /violation/)
})

test('clone only never reports the word violation, at any count', () => {
  for (const n of [1, 2, 7]) {
    const r = verdict(Array.from({ length: n }, () => clone()), {})
    assert.equal(r.exitCode, 2, `n=${n}`)
    assert.doesNotMatch(r.line, /violation/, `n=${n}`)
  }
})

test('both: the committed finding owns the verdict, and the clone one is named as separate', () => {
  const r = verdict([clone(), committed()], {})
  assert.equal(r.exitCode, 1)
  assert.match(r.line, /1 violation in tracked files/)
  assert.match(r.line, /Separately, 1 declaration is not registered in this clone/)
  assert.match(r.line, /is not committed and is not part of that repair/)
})

test('counts are singular and plural correctly, since the line is read by a person', () => {
  assert.match(verdict([committed()], {}).line, /1 violation in tracked files, so every checkout of this commit has it/)
  assert.match(verdict([committed(), committed()], {}).line, /has them/)
  assert.match(verdict([clone()], {}).line, /1 declaration names a driver/)
  assert.match(verdict([clone(), clone()], {}).line, /2 declarations name drivers/)
})

test('the verdict is derived from the findings and cannot contradict them', () => {
  // The property the whole file exists to hold. There is no argument by which
  // a caller can report a committed count the findings do not contain, because
  // the counts are not passed in -- they are filtered out of the same array
  // whose entries were printed one per line above the verdict.
  const findings = [committed(), clone(), clone()]
  const r = verdict(findings, { declared: 99, drivers: ['ledger'], checkedClone: true })
  assert.match(r.line, /1 violation in tracked files/)
  assert.match(r.line, /2 declarations are not registered/)
  assert.equal(verdict([], { declared: 99, drivers: [] }).exitCode, 0)
})

test('an unknown locus is not silently counted as clean', () => {
  // Defensive: a future finding added with no locus, or a typo in one, must
  // not fall through to exit 0 and report the repository healthy.
  const r = verdict([{ locus: 'typo', message: 'x' }], {})
  assert.equal(r.exitCode, 1, 'it lands on the committed branch, not the clone one')
  assert.match(r.line, /1 violation in tracked files/)
  assert.doesNotMatch(r.line, /nothing here needs a pull request/)
})
