// node --test tools/board/live-target.test.mjs
//
// The unit under test is the failing exit branch, not the file. The line this
// replaces had one message for three disjoint conditions, so the test asserts
// that each condition is reported as itself and that the one which used to be
// described falsely is now described truly.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { liveTargetFault } from './live-target.mjs'

test('both variables present and the url has a scheme: no fault', () => {
  assert.equal(liveTargetFault({ apiUrl: 'https://board.example/', token: 'tok' }), null)
  assert.equal(liveTargetFault({ apiUrl: 'http://localhost:8080', token: 'tok' }), null)
})

test('each of the four conditions is reported as itself', () => {
  const code = (env) => liveTargetFault(env)?.code
  assert.equal(code({}), 'BOARD_ENV_ABSENT')
  assert.equal(code({ token: 'tok' }), 'BOARD_URL_ABSENT')
  assert.equal(code({ apiUrl: 'https://board.example/' }), 'BOARD_TOKEN_ABSENT')
  assert.equal(code({ apiUrl: 'board.example', token: 'tok' }), 'BOARD_URL_SCHEMELESS')
})

test('a set but schemeless url is never reported as unset', () => {
  // The defect this file exists for. The old line said "BOARD_API_URL and
  // BOARD_RUNTIME_TOKEN must both be set" for this case, which is false: it is
  // set, and a seat that goes to set it again finds it already there.
  const f = liveTargetFault({ apiUrl: 'example.com/board', token: 'tok' })
  assert.equal(f.code, 'BOARD_URL_SCHEMELESS')
  assert.match(f.line, /It is set; it is not usable\./)
  assert.doesNotMatch(f.line, /is not set/)
  assert.match(f.line, /example\.com\/board/)
})

test('whitespace is not a value, for either variable', () => {
  assert.equal(liveTargetFault({ apiUrl: '   ', token: '  ' })?.code, 'BOARD_ENV_ABSENT')
  assert.equal(liveTargetFault({ apiUrl: 'https://b/', token: ' ' })?.code, 'BOARD_TOKEN_ABSENT')
})

test('every fault names a repair, and the repair differs by condition', () => {
  const cases = [{}, { token: 't' }, { apiUrl: 'https://b/' }, { apiUrl: 'b.example', token: 't' }]
  const repairs = cases.map((e) => liveTargetFault(e).repair)
  for (const r of repairs) assert.ok(r.length > 0)
  // The schemeless case is the one whose repair is not "run under the runtime",
  // because the runtime IS supplying a value and the value is the problem.
  assert.doesNotMatch(repairs[3], /run under the seat runtime/)
  assert.match(repairs[0], /run under the seat runtime/)
})

test('no fault mentions a token value, ever', () => {
  const f = liveTargetFault({ apiUrl: 'b.example', token: 'sk-secret-value' })
  assert.doesNotMatch(JSON.stringify(f), /sk-secret-value/)
})
