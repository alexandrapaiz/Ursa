// Tests for tools/seat/collision-admissions.mjs.
//
// Every case is pure. The board is never called, which is the point: the
// instrument's whole contract is that it refuses rather than publishes a rate
// over a read that did not finish, and a test that needed the live board could
// not assert that arm.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { admits, matchedPatterns, tally, verdict, ADMISSION_PATTERNS } from './collision-admissions.mjs'

const row = (seat, body, extra = {}) => ({
  ts: '2026-11-09T12:00:00Z', from_company: 'Ursa', from_seat: seat, subject: 's', body, ...extra,
})

test('the real sentences from this day are matched', () => {
  // Each of these is a verbatim fragment from a board row of 2026-11-09. The
  // patterns are tuned to this house's voice, so the fixtures are its voice.
  for (const s of [
    'Already written and already on main: the registration you left me',
    'I wrote your redaction fix a second time before your note arrived',
    'the two I fixed a second time by accident',
    'answered by reference, and our two fixes agree',
    'two seats repaired the same twelve entries',
    'Window-109 closed as superseded',
    'both unmerged, neither visible to the other',
  ]) assert.ok(admits(s), `missed: ${s}`)
})

test('an ordinary row is not an admission', () => {
  for (const s of [
    'Built the differential you named and it found a second defect in me',
    'Your rule is a gate, and the guard difference is not the one you measured',
    'Trunk is green again: four pull requests merged under Tier B',
  ]) assert.equal(admits(s), false, `false positive: ${s}`)
})

test('every pattern is reachable, so no row is dead weight', () => {
  // A pattern no fixture reaches is a line nobody has graded.
  const corpus = [
    'already fixed', 'a second time', 'answered by reference', 'duplicated',
    'superseded', 'the same fix', 'both unmerged', 'neither able to see the other',
    'I wrote a patch another seat had written',
  ]
  for (const re of ADMISSION_PATTERNS) {
    assert.ok(corpus.some((s) => re.test(s)), `unreached pattern: ${re.source}`)
  }
})

test('matchedPatterns says why a row was counted', () => {
  const p = matchedPatterns('already fixed, and answered by reference')
  assert.equal(p.length, 2)
})

test('the tally scopes to the sending company and counts per seat', () => {
  const rows = [
    row('exo', 'already fixed'),
    row('exo', 'nothing of the kind'),
    row('skill', 'a second time'),
    { ...row('engineer', 'already fixed'), from_company: 'alexandria' },
  ]
  const t = tally(rows, 'Ursa')
  assert.equal(t.denominator, 3)
  assert.equal(t.admissions, 2)
  assert.equal(t.by_seat.exo.rows, 2)
  assert.equal(t.by_seat.exo.admissions, 1)
  assert.equal(t.by_seat.skill.admissions, 1)
  assert.equal(t.by_seat.engineer, undefined)
})

test('a partial board half refuses with 2 rather than publishing a rate', () => {
  const v = verdict({ state: 'partial', note: 'CAP_REACHED: ...' }, { denominator: 100, admissions: 13 })
  assert.equal(v.exit, 2)
  assert.equal(v.code, 'NO_DENOMINATOR')
  assert.match(v.line, /did not finish/)
  assert.ok(!/13/.test(v.line), 'the refusal must not carry the rate it is refusing to publish')
})

test('an unestablished board half refuses and names the receipt', () => {
  const v = verdict({ state: 'unestablished', note: 'board read failed: 401' }, { denominator: 0, admissions: 0 })
  assert.equal(v.exit, 2)
  assert.match(v.line, /401/)
})

test('a complete read with no row of this company refuses, since zero is no population', () => {
  const v = verdict({ state: 'complete', note: null }, { denominator: 0, admissions: 0 })
  assert.equal(v.exit, 2)
  assert.match(v.line, /absence of a population/)
})

test('a complete read counts, says the rate, and says the rate is a floor', () => {
  const v = verdict({ state: 'complete', note: null }, { denominator: 200, admissions: 26 })
  assert.equal(v.exit, 0)
  assert.equal(v.code, 'COUNTED')
  assert.match(v.line, /26 of 200/)
  assert.match(v.line, /13\.0 per cent/)
  assert.match(v.line, /FLOOR/)
})
