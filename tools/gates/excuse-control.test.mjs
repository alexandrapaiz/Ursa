// Tests for excuse-control.mjs.
//
// `classify` is pure and takes one observation, so every class below is
// asserted without spawning anything. The end-to-end discrimination — the
// gate going red on a tree that carries the two defects it was written over
// and green on the tree that fixes them — is not a case here, because it
// needs a second worktree; it is in the pull request, measured, with both
// exit codes.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { classify, rowsToControl, verdict, EXECUTABLE, UNEXECUTED, STRIPPED } from './excuse-control.mjs'
import { KINDS } from './gate-registry.mjs'

test('exit 0 with the credential removed is a false excuse, never a pass', () => {
  const c = classify({ path: 'x.mjs' }, { code: 0, out: 'coverage INCOMPLETE: page 1 answered 401' })
  assert.equal(c.state, 'green-on-nothing')
  // The output names the credential and the row still fails: the words are
  // never what decides this.
  assert.equal(c.names_credential, true)
})

test('a non-zero code the file reserves for a verdict is also a failure', () => {
  const c = classify({ path: 'x.mjs', no_verdict_exit: [3] }, { code: 1, out: 'gh auth login' })
  assert.equal(c.state, 'verdict-without-reach')
  assert.match(c.why, /reserves for a finding about the repository/)
})

test('a row that declares its no-verdict codes passes on one of them', () => {
  assert.equal(classify({ no_verdict_exit: [2, 3] }, { code: 3, out: '' }).state, 'refused')
  assert.equal(classify({ no_verdict_exit: [2, 3] }, { code: 2, out: '' }).state, 'refused')
})

test('a row that declares nothing passes on any non-zero, which is the weaker contract', () => {
  assert.equal(classify({}, { code: 1, out: '' }).state, 'refused')
  assert.equal(classify({}, { code: 7, out: '' }).state, 'refused')
})

test('the credential column is independent of the verdict, because it is not gated on', () => {
  // Ursa/frontend, 2026-11-09: a test that pins an implementation answers
  // `is the shape there`, not `is that why this failed`. On an offline runner
  // these tools refuse in DNS words, so a refusal that names nothing is still
  // a refusal.
  const silent = classify({}, { code: 2, out: 'getaddrinfo ENOTFOUND api.example' })
  assert.equal(silent.state, 'refused')
  assert.equal(silent.names_credential, false)
})

test('a timeout and a missing status are unmeasured, and unmeasured fails the gate', () => {
  assert.equal(classify({}, { code: null, out: '', timedOut: true }).state, 'unmeasured')
  assert.equal(classify({}, { code: null, out: '' }).state, 'unmeasured')
  // The whole subject of this file is that an absence must not read as clean,
  // so its own absences must not either.
  const v = verdict([{ state: 'refused', names_credential: true }, { state: 'unmeasured' }])
  assert.equal(v.exitCode, 1)
  assert.equal(v.failed, 0)
  assert.equal(v.unmeasured, 1)
})

test('a sweep where everything refused exits 0', () => {
  const v = verdict([{ state: 'refused', names_credential: true }, { state: 'refused', names_credential: false }])
  assert.equal(v.exitCode, 0)
  assert.equal(v.named, 1)
})

test('every kind in the registry is either executed here or has a stated reason it is not', () => {
  // The completeness property. A kind added to gate-registry.mjs and to
  // neither list here would be a tenth prose reason that looked executed.
  for (const kind of Object.keys(KINDS)) {
    const covered = EXECUTABLE.includes(kind) || Object.hasOwn(UNEXECUTED, kind)
    assert.ok(covered, `kind "${kind}" is neither executed nor excused in excuse-control.mjs`)
  }
  for (const kind of Object.keys(UNEXECUTED)) {
    assert.ok(KINDS[kind], `UNEXECUTED names "${kind}", which gate-registry.mjs does not have`)
  }
})

test('every executable row in the baseline is of a kind this file can execute', () => {
  const baseline = JSON.parse(readFileSync(new URL('./gate-registry.baseline.json', import.meta.url), 'utf8'))
  const rows = rowsToControl(baseline)
  assert.ok(rows.length > 0, 'the baseline carries no needs-token row, which is exit 2 and not a clean sweep')
  for (const r of rows) assert.ok(EXECUTABLE.includes(r.kind))
  // Declared control argv must be an array, since it is spread into a spawn.
  for (const r of rows) {
    if (r.control !== undefined) assert.ok(Array.isArray(r.control), `${r.path}: control must be an array`)
    if (r.no_verdict_exit !== undefined) {
      assert.ok(Array.isArray(r.no_verdict_exit) && r.no_verdict_exit.every((n) => Number.isInteger(n)),
        `${r.path}: no_verdict_exit must be an array of integers`)
    }
  }
})

test('the stripped set covers both forges and the board, and strips rather than empties', () => {
  for (const v of ['GH_TOKEN', 'GITHUB_TOKEN', 'BOARD_RUNTIME_TOKEN']) assert.ok(STRIPPED.includes(v))
})
