// Every line `tools/board/post.mjs` prints as a verdict, pinned against a
// literal.
//
// WHY LITERALS AND NOT A TEMPLATE. The extraction's claim is that no output
// string changed, so a test that rebuilt the expected string from the module's
// own template would pass on any reword and prove nothing. These literals were
// copied out of `git show <pre-extraction>:tools/board/post.mjs`, and the
// branch's differential check ran the poster at both commits over twelve
// invocations -- including a stub board on 127.0.0.1 for the exit-3 and exit-0
// live branches -- and diffed stdout, stderr and exit status. That check is a
// one-off. This suite is what keeps the claim true tomorrow.
//
// WHAT IS NOT TESTED HERE, and why that is not a gap. `post.mjs` itself awaits
// a `fetch` at module scope, so importing it posts a message; that is why
// `./live-target.mjs` and now this file exist at all. The CLI's own wiring is
// covered by the differential check in the pull request rather than by a unit
// test, because a unit test of it would have to either post or stub `fetch`.

import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { renderVerdict } from '../gates/verdict-shape.mjs'
import { liveTargetFault } from './live-target.mjs'
import { GATE, unreachable, verdict } from './post-verdict.mjs'
import { senderFault } from './sender.mjs'

/** The roster as a fixture, so these cases do not move when company.yaml does. */
const ROSTER = { company: 'Ursa', seats: ['pm', 'engineer', 'security'] }

const message = (code = 'SUBJECT_EMPTY') => ({
  locus: 'reader',
  scope: 'message',
  code,
  line: 'the message has no subject, and the store refuses that outright',
  repair: 'give it one sentence a person understands cold',
})

// Every field the two bus keys and the sender key are read from. `fromSeat`
// and `fromCompany` were added 2026-10-27, when the receipt began naming the
// field that had been wrong in seven rows without ever being printed.
const POSTING = { kind: 'note', toCompany: 'Ursa', toSeat: 'pm', fromCompany: 'Ursa', fromSeat: 'engineer' }

/** A sender-scope finding as `post.mjs` collects it: the code is passed
 *  explicitly, because `verdict` names the cause after it. */
const sender = (f) => ({ locus: 'reader', scope: 'sender', ...f })

describe('post verdict, the branches over findings', () => {
  it('exit 1 when the message is refused locally, counting only what it printed', () => {
    const v = verdict([message()], {})
    assert.equal(v.exitCode, 1)
    assert.equal(v.stream, 'err')
    assert.equal(v.cause, 'MESSAGE_REFUSED_LOCALLY')
    assert.equal(
      v.line,
      '1 violation(s). Nothing was posted, so there is no row to live with.',
    )
    assert.equal(
      verdict([message(), message('KIND_UNKNOWN'), message('BODY_MINIMUM')], {}).line,
      '3 violation(s). Nothing was posted, so there is no row to live with.',
    )
  })

  it('exit 1 on the sender company, with the field name rewritten by the caller', () => {
    const v = verdict([sender({
      code: 'SENDER_COMPANY_SPELLING',
      line: 'company "ursa minor" is not one the bus routes',
      repair: 'use one of: Ursa, Atelier',
    })], POSTING)
    assert.equal(v.exitCode, 1)
    assert.equal(v.position, 'before')
    assert.equal(v.cause, 'SENDER_COMPANY_SPELLING')
    assert.deepEqual(renderVerdict(v), [
      'SENDER_COMPANY_SPELLING: company "ursa minor" is not one the bus routes',
      '  repair: use one of: Ursa, Atelier',
    ])
  })

  it('exit 3 when the store refuses what the local checks passed, quoting the response', () => {
    const v = verdict([{
      locus: 'committed',
      scope: 'store',
      status: 422,
      body: '{"error":"a message needs a subject"}',
    }], POSTING)
    assert.equal(v.exitCode, 3)
    assert.equal(v.cause, 'STORE_REFUSED_WHAT_CHECKER_PASSED')
    // The locus is the repository and not the reader: the repair is a rule
    // transcribed into a tracked file, which every clone and CI then has.
    assert.deepEqual(v.cites, ['committed'])
    assert.deepEqual(renderVerdict(v), [
      'The board refused it with 422: {"error":"a message needs a subject"}',
      '  This checker passed a message the store rejected, which means a rule here is',
      '  out of date. Transcribe the failing rule from runtime/board/store.py into',
      '  tools/board/check.mjs so the next seat is told locally instead of by the board.',
    ])
    // 422 is the board's number, not this gate's count, and it says so.
    assert.ok(v.quoted.includes('422'))
  })

  it('exit 0 under --dry-run, naming who would be woken', () => {
    const v = verdict([], { dryRun: true, ...POSTING })
    assert.equal(v.exitCode, 0)
    assert.equal(v.cause, 'CHECKED_CLEAN_DRY_RUN')
    assert.equal(
      v.line,
      'Checked clean. Ursa/pm would be woken, and the row would say it came from Ursa/engineer.',
    )
  })

  it('keeps both fallbacks, because an unaddressed message really does reach everyone', () => {
    const v = verdict([], { dryRun: true, kind: 'note' })
    assert.equal(
      v.line,
      'Checked clean. (all companies)/(everyone) would be woken, and the row would say it came from (no company)/(no seat).',
    )
  })

  it('exit 0 when posted, truncating the id to eight characters', () => {
    const v = verdict([], { ...POSTING, id: '0123456789abcdef0123456789abcdef' })
    assert.equal(v.exitCode, 0)
    assert.equal(v.cause, 'POSTED')
    assert.equal(v.line, 'Posted note from Ursa/engineer to Ursa/pm, id 01234567.')
    // The digits in the id are observed, not counted, so they are declared.
    assert.deepEqual(v.quoted, ['01234567'])
  })

  it('names the id-less success separately, which is the branch with no clause and no exit call', () => {
    const v = verdict([], POSTING)
    assert.equal(v.exitCode, 0)
    assert.equal(v.line, 'Posted note from Ursa/engineer to Ursa/pm.')
    assert.equal(v.cause, 'POSTED_ID_UNREADABLE')
    assert.notEqual(v.cause, verdict([], { ...POSTING, id: 'abcdef12' }).cause)
    // The clause this branch did not print until 2026-10-27, which is why its
    // receipt was indistinguishable from the readable-id one.
    assert.deepEqual(v.trailer, [
      '  The board accepted it and answered with no readable id, so nothing downstream can quote this row.',
    ])
    assert.deepEqual(verdict([], { ...POSTING, id: 'abcdef12' }).trailer, [])
  })

  // The three branches the sender half added on 2026-10-27. Driven through
  // the real `senderFault`, so a reworded condition in that file fails here
  // rather than passing against a copy of its prose.
  const refusals = [
    ['SENDER_SEAT_UNNAMED', { env: {}, declaration: ROSTER }],
    ['SENDER_SEAT_SPELLING', { seatFlag: 'Engineer', env: {}, declaration: ROSTER }],
    ['SENDER_COMPANY_UNDECLARED', { seatFlag: 'pm', declaration: { company: '', seats: [] } }],
  ]

  for (const [code, inputs] of refusals) {
    it(`exit 1 with cause ${code}, which the hardcoded cause could not have named`, () => {
      const fault = senderFault(inputs)
      assert.equal(fault.code, code)
      const v = verdict([sender(fault)], POSTING)
      assert.equal(v.exitCode, 1)
      assert.equal(v.stream, 'err')
      assert.equal(v.position, 'before')
      assert.equal(v.cause, code)
      assert.deepEqual(renderVerdict(v), [`${code}: ${fault.line}`, `  repair: ${fault.repair}`])
      // The one thing every refusal has to say, because the alternative to
      // refusing was a row nobody could attribute.
      assert.ok(GATE.loci.reader.noun.test(v.line), `${code} names no locus`)
    })
  }

  it('keeps the four sender conditions four causes', () => {
    const causes = new Set([
      ...refusals.map(([, inputs]) => verdict([sender(senderFault(inputs))], POSTING).cause),
      verdict([sender({ code: 'SENDER_COMPANY_SPELLING', line: 'x', repair: 'y' })], POSTING).cause,
    ])
    assert.equal(causes.size, 4)
  })

  it('names a cause even for a sender finding that carries no code, rather than printing undefined', () => {
    // The hardcoded cause used to supply this. A code-less finding is a
    // caller bug and not a reachable state in post.mjs, and a verdict line
    // reading "undefined: ..." is the one outcome worse than a wrong name.
    const v = verdict([sender({ line: 'x', repair: 'y' })], POSTING)
    assert.equal(v.cause, 'SENDER_REFUSED_UNNAMED_CODE')
    assert.doesNotMatch(v.line, /undefined/)
  })

  it('reports whichever check actually stopped the run, in post.mjs own order', () => {
    const both = verdict([
      message(),
      sender({ code: 'SENDER_SEAT_UNNAMED', line: 'x', repair: 'y' }),
    ], POSTING)
    assert.equal(both.cause, 'MESSAGE_REFUSED_LOCALLY')
  })
})

describe('post verdict, the ground branches', () => {
  // Driven through the real `liveTargetFault`, so a reworded or renamed
  // condition in that file fails here instead of staying invisible behind a
  // fixture.
  const cases = [
    ['BOARD_ENV_ABSENT', {}],
    ['BOARD_URL_ABSENT', { token: 't' }],
    ['BOARD_URL_SCHEMELESS', { apiUrl: 'board.example/api', token: 't' }],
    ['BOARD_TOKEN_ABSENT', { apiUrl: 'https://board.example' }],
  ]

  for (const [code, env] of cases) {
    it(`exit 2, derived from ground, cause ${code}`, () => {
      const fault = liveTargetFault(env)
      assert.equal(fault.code, code)
      const v = unreachable(fault)
      assert.equal(v.exitCode, 2)
      assert.equal(v.derivedFrom, 'ground')
      assert.equal(v.cause, code)
      assert.equal(v.line, `${code}: ${fault.line}`)
      assert.equal(
        v.trailer.at(-1),
        '  Nothing was sent, and nothing about the message itself is wrong.',
      )
    })
  }

  it('keeps the four conditions four causes, which is the defect this gate was repaired for', () => {
    const causes = new Set(cases.map(([, env]) => unreachable(liveTargetFault(env)).cause))
    assert.equal(causes.size, 4)
  })

  it('tells a seat its schemeless url is set rather than telling it to set it', () => {
    const v = unreachable(liveTargetFault({ apiUrl: 'board.example/api', token: 't' }))
    assert.match(v.line, /It is set; it is not usable\./)
    assert.doesNotMatch(v.line, /must both be set/)
  })
})

describe('post verdict, the gate spec', () => {
  it('declares ten findings probes and four ground probes', () => {
    assert.equal(GATE.probes.length, 10)
    assert.equal(GATE.groundProbes.length, 4)
    assert.equal(GATE.id, 'tools/board/post.mjs')
  })

  it('declares a noun pattern that matches its own real prose for each locus', () => {
    assert.ok(GATE.loci.reader.noun.test(
      '1 violation(s). Nothing was posted, so there is no row to live with.',
    ))
    assert.ok(GATE.loci.committed.noun.test(
      '  tools/board/check.mjs so the next seat is told locally instead of by the board.',
    ))
  })

  it('reaches thirteen distinct causes, where a sweep of exit calls finds four', () => {
    const causes = new Set([
      ...GATE.probes.map((p) => GATE.verdict(p.findings, p.seen ?? {}).cause),
      ...GATE.groundProbes.map((p) => p.call().cause),
    ])
    assert.equal(causes.size, 13)
  })
})
