// node --test tools/board/sender.test.mjs
//
// The poster was the untested side of its own split: `./check.mjs` had 31
// tests and `./post.mjs`, where the sender is decided, had no test file at
// all. These are the cases for the field that had none.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { declarationOf, senderFault, senderOf, DECLARATION_PATH } from './sender.mjs'

/** The roster as `company.yaml` declares it, so the cases below do not depend
 *  on that file staying still. The real file is read in its own test. */
const DECL = { company: 'Ursa', seats: ['pm', 'exo', 'engineer', 'security', 'frontend'] }

test('the defect itself: no flag and no variable is refused, not defaulted', () => {
  const f = senderFault({ env: {}, declaration: DECL })
  assert.equal(f?.code, 'SENDER_SEAT_UNNAMED')
  // The old behaviour, stated as a test so a regression is named rather than
  // just red: this input used to resolve to `engineer` and post.
  assert.notEqual(senderOf({ env: {}, declaration: DECL }).seat, 'engineer')
  assert.equal(senderOf({ env: {}, declaration: DECL }).seat, '')
})

test('the environment of a GitHub runner is the refused case', () => {
  // Measured: ASC_SEAT is set by the resident host runtime and absent on a
  // runner, which is where every seat in this repository runs.
  const runner = { GITHUB_ACTIONS: 'true', BOARD_API_URL: 'https://board.example' }
  assert.equal(senderFault({ env: runner, declaration: DECL })?.code, 'SENDER_SEAT_UNNAMED')
})

test('--seat names the sender and the flag beats the variable', () => {
  assert.equal(senderFault({ seatFlag: 'security', env: {}, declaration: DECL }), null)
  assert.equal(senderOf({ seatFlag: 'security', env: {}, declaration: DECL }).seat, 'security')
  assert.equal(
    senderOf({ seatFlag: 'security', env: { ASC_SEAT: 'engineer' }, declaration: DECL }).seat,
    'security',
  )
})

test('ASC_SEAT alone is enough, which is the host runtime case', () => {
  assert.equal(senderFault({ env: { ASC_SEAT: 'pm' }, declaration: DECL }), null)
  assert.equal(senderOf({ env: { ASC_SEAT: 'pm' }, declaration: DECL }).seat, 'pm')
})

test('whitespace is not a seat name', () => {
  assert.equal(senderFault({ seatFlag: '   ', env: {}, declaration: DECL })?.code, 'SENDER_SEAT_UNNAMED')
  assert.equal(senderFault({ env: { ASC_SEAT: '\t' }, declaration: DECL })?.code, 'SENDER_SEAT_UNNAMED')
})

test('a case-only miss is refused, and the repair names the spelling and the cost', () => {
  const f = senderFault({ seatFlag: 'Engineer', env: {}, declaration: DECL })
  assert.equal(f?.code, 'SENDER_SEAT_SPELLING')
  assert.match(f.line, /"Engineer" differs from "engineer" only in case/)
  // The cost is the read route's exact match on this field, measured against
  // the live board: from_seat=Engineer returned 0 rows where from_seat=engineer
  // returned 20 over the same window.
  assert.match(f.repair, /from_seat=engineer will miss the row/)
})

test('a seat the roster does not hold at all is accepted, deliberately', () => {
  // The board carries senders no product roster lists, and this repository's
  // own roster was eleven days stale while seven activated seats ran. An
  // unlisted name is new or foreign; a case variant is a typo.
  assert.equal(senderFault({ seatFlag: 'chair:asc-host', env: {}, declaration: DECL }), null)
  assert.equal(senderFault({ seatFlag: 'exo-centralizer', env: {}, declaration: DECL }), null)
})

test('the company comes from the declaration, not from a literal', () => {
  assert.equal(senderOf({ seatFlag: 'pm', declaration: DECL }).company, 'Ursa')
  assert.equal(senderOf({ seatFlag: 'pm', companyFlag: 'atelier', declaration: DECL }).company, 'atelier')
})

test('an undeclared company is refused once the seat is named', () => {
  const bare = { company: '', seats: [] }
  const f = senderFault({ seatFlag: 'pm', declaration: bare })
  assert.equal(f?.code, 'SENDER_COMPANY_UNDECLARED')
  // The absolute path this module resolves is not in the line, because a
  // tool's output goes further than an artifact does.
  assert.ok(!f.line.includes('/'), `line names a path: ${f.line}`)
  assert.equal(senderFault({ seatFlag: 'pm', companyFlag: 'Ursa', declaration: bare }), null)
})

test('the seat is reported before the company, because it is the field with no source at all', () => {
  const bare = { company: '', seats: [] }
  assert.equal(senderFault({ declaration: bare })?.code, 'SENDER_SEAT_UNNAMED')
})

test('declarationOf reads this repository own company.yaml', () => {
  const d = declarationOf()
  assert.equal(d.company, 'Ursa')
  // Every seat the charter roster names, so a seat dropped from the manifest
  // shows up here rather than in a refused post.
  for (const seat of ['pm', 'exo', 'okr', 'engineer', 'frontend', 'security', 'skill', 'research', 'market', 'finance', 'sales']) {
    assert.ok(d.seats.includes(seat), `company.yaml seats: block is missing ${seat}`)
  }
  assert.match(DECLARATION_PATH, /company\.yaml$/)
})

test('declarationOf on a missing file reports empty fields rather than throwing', () => {
  const d = declarationOf(join(tmpdir(), 'ursa-no-such-company-file.yaml'))
  assert.deepEqual(d, { company: '', seats: [] })
})

test('declarationOf takes name: only from the seats block', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-sender-'))
  const path = join(dir, 'company.yaml')
  try {
    writeFileSync(
      path,
      [
        'company: alexandra-systems',
        'product: Ursa',
        'surfaces:',
        '  - { name: not-a-seat, path: docs/ }',
        'seats:',
        '  - { name: pm,       cadence: daily }',
        '  - { name: engineer, cadence: daily }',
        'standards:',
        '  - { name: also-not-a-seat }',
        '',
      ].join('\n'),
    )
    assert.deepEqual(declarationOf(path), { company: 'Ursa', seats: ['pm', 'engineer'] })
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('a commented product key is not a declaration', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-sender-'))
  const path = join(dir, 'company.yaml')
  try {
    writeFileSync(path, '# product: Ursa\ncompany: alexandra-systems\n')
    assert.equal(declarationOf(path).company, '')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
