// Every line `check-closures.mjs` prints, pinned against a literal.
//
// WHY LITERALS AND NOT A TEMPLATE. The extraction's whole claim is that no
// output string changed. A test that rebuilt the expected string from the same
// template the module uses would pass on any reword and prove nothing. These
// literals were copied out of `git show pr555:tools/ledger/check-closures.mjs`
// and the branch's own differential check ran the gate at both commits and
// diffed the bytes; this suite is what keeps it true tomorrow.

import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { GATE, verdict } from './closures-verdict.mjs'

const SEEN = { markers: 12, docs: 3, ledgerPath: 'docs/ideas.md' }
const COUNTED = '12 closure marker(s) in 3 document(s), against docs/ideas.md'
const seat = () => ({ held: 'seat', rule: 'CLOSURE_UNRESOLVED', message: 'x' })
const owner = () => ({ held: 'owner', rule: 'STATUS_HELD', message: 'x' })

describe('closures verdict', () => {
  it('exit 0, all closed', () => {
    const v = verdict([], SEEN)
    assert.equal(v.exitCode, 0)
    assert.equal(v.line, `Closure backlinks: ${COUNTED}, all resolved and all closed. Exit 0.`)
    assert.equal(v.stream, 'out')
    assert.equal(v.cause, 'ALL_CLOSED')
  })

  it('exit 1, a seat can repair it', () => {
    const v = verdict([seat()], SEEN)
    assert.equal(v.exitCode, 1)
    assert.equal(
      v.line,
      `Closure backlinks: ${COUNTED}, 1 violation(s) a seat can repair. Exit 1.`,
    )
  })

  it('exit 2, the owner holds all of it', () => {
    const v = verdict([owner()], SEEN)
    assert.equal(v.exitCode, 2)
    assert.equal(
      v.line,
      `Closure backlinks: ${COUNTED}, clean as far as a seat can take it. ` +
        '1 violation(s) above need the owner, not a seat. Exit 2.',
    )
  })

  it('exit 1 with the owner clause, which is the fourth branch behind two exit calls', () => {
    const v = verdict([seat(), owner(), owner()], SEEN)
    assert.equal(v.exitCode, 1)
    assert.equal(
      v.line,
      `Closure backlinks: ${COUNTED}, 1 violation(s) a seat can repair and 2 the owner holds. Exit 1.`,
    )
    // Distinct cause from the plain exit-1 branch, because a reader handed the
    // other form has no way to learn a remainder exists.
    assert.equal(v.cause, 'SEAT_REPAIRABLE_WITH_OWNER_REMAINDER')
    assert.notEqual(v.cause, verdict([seat()], SEEN).cause)
  })

  it('a finding with no held field lands on the seat, not the owner', () => {
    // Guessing `owner` would file a seat's own defect under "not yours to
    // repair", which is the louder failure.
    const v = verdict([{ rule: 'X', message: 'y' }], SEEN)
    assert.equal(v.exitCode, 1)
    assert.match(v.line, /a seat can repair/)
  })

  it('declares four probes and a locus pattern for each locus', () => {
    assert.equal(GATE.probes.length, 4)
    assert.ok(GATE.loci.seat.noun.test('1 violation(s) a seat can repair'))
    assert.ok(GATE.loci.owner.noun.test('2 the owner holds'))
  })
})
