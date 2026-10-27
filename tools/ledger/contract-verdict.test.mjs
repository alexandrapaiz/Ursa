// Every line `tools/ledger/check.mjs` prints, pinned against a literal. See
// `closures-verdict.test.mjs` for why literals and not templates.

import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { GATE, verdict } from './contract-verdict.mjs'

const SEEN = { blocks: 375, path: 'docs/ideas.md' }
const seat = () => ({ held: 'seat', rule: 'DUPLICATE_IDEA', message: 'x' })
const owner = () => ({ held: 'owner', rule: 'STATUS_OWNER_HELD', message: 'x' })

describe('ledger contract verdict', () => {
  it('exit 0, clean', () => {
    const v = verdict([], SEEN)
    assert.equal(v.exitCode, 0)
    assert.equal(v.line, 'Ledger contract: 375 blocks in docs/ideas.md, clean.')
    assert.equal(v.stream, 'out')
  })

  it('exit 1 names both counts even when the owner has none', () => {
    const v = verdict([seat()], SEEN)
    assert.equal(v.exitCode, 1)
    assert.equal(v.stream, 'err')
    assert.equal(
      v.line,
      'Ledger contract: 1 violation(s) a seat must repair, 0 the owner must resolve, ' +
        'in 375 blocks in docs/ideas.md.',
    )
  })

  it('exit 1 with both loci present', () => {
    const v = verdict([seat(), owner()], SEEN)
    assert.equal(
      v.line,
      'Ledger contract: 1 violation(s) a seat must repair, 1 the owner must resolve, ' +
        'in 375 blocks in docs/ideas.md.',
    )
    // One cause, not two: the line has a single form and names both actors in
    // all of them.
    assert.equal(v.cause, verdict([seat()], SEEN).cause)
  })

  it('exit 2 when every violation is the owner\'s', () => {
    const v = verdict([owner(), owner()], SEEN)
    assert.equal(v.exitCode, 2)
    assert.equal(v.stream, 'err')
    assert.equal(
      v.line,
      'Ledger contract: 375 blocks in docs/ideas.md, clean as far as a seat can take it. ' +
        '2 violation(s) above need the owner, not a seat. Exit 2.',
    )
  })

  it('returns exit 0 rather than falling off the end, which is the branch no exit-call sweep could see', () => {
    // check.mjs used to end with console.log and no process.exit, so node
    // exited 0 implicitly. A sweep of exit calls cannot find a branch that has
    // no exit call.
    assert.equal(verdict([], SEEN).exitCode, 0)
    assert.equal(GATE.probes.length, 4)
  })
})

describe('the latent unkeyed-finding defect', () => {
  it('a finding with no held field lands on the seat, not the owner', () => {
    // Both filters used to test for equality, so an unkeyed finding joined
    // neither array and the gate exited 2 saying "0 violation(s) above need the
    // owner". See the comment in contract-verdict.mjs.
    const v = verdict([{ rule: 'X', message: 'y' }], SEEN)
    assert.equal(v.exitCode, 1)
    assert.match(v.line, /1 violation\(s\) a seat must repair, 0 the owner must resolve/)
  })
})
