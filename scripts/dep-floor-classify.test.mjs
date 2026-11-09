// node --test scripts/dep-floor-classify.test.mjs
//
// The three properties worth asserting, in the order they cost something:
//   1. Classification is TOTAL. No severity falls through to no kind.
//   2. The remediation hint is reachable from every kind.
//   3. The count line names every severity npm counts.

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { fixHint, classifyAdvisory, severityCounts, SEVERITIES } from './dep-floor-classify.mjs'

const NOW = Date.parse('2026-11-09T00:00:00Z')

// ---------------------------------------------------------------- fixHint

test('fixHint: the boolean true means the repair is inside every declared range', () => {
  assert.equal(fixHint(true), 'npm audit fix')
})

test('fixHint: a named repair inside the range names the package and version', () => {
  assert.equal(fixHint({ name: 'vite', version: '5.4.21', isSemVerMajor: false }), 'vite@5.4.21')
})

test('fixHint: isSemVerMajor is rendered, because it changes whose repair it is', () => {
  // The real object from ursa-minor's three surviving advisories, 2026-11-09.
  assert.equal(
    fixHint({ name: 'shadcn', version: '1.0.0', isSemVerMajor: true }),
    'shadcn@1.0.0 (semver-major)',
  )
})

test('fixHint: no published fix, in all three shapes npm uses for it', () => {
  assert.equal(fixHint(false), 'none published')
  assert.equal(fixHint(undefined), 'none published')
  // An object with no name is not a repair anyone can act on.
  assert.equal(fixHint({ isSemVerMajor: true }), 'none published')
})

// --------------------------------------------------------- classification

test('classifyAdvisory is total: every severity in both scopes returns a kind', () => {
  const kinds = new Set(['violation', 'expired', 'warning'])
  for (const severity of SEVERITIES) {
    for (const inProd of [true, false]) {
      for (const exceptionExpires of [null, '2026-12-01', '2026-01-01']) {
        const got = classifyAdvisory({ severity, inProd, exceptionExpires, nowMs: NOW })
        assert.ok(kinds.has(got.kind), `${severity}/${inProd}/${exceptionExpires} -> ${got.kind}`)
        assert.equal(got.scope, inProd ? 'prod' : 'dev')
      }
    }
  }
})

test('the floor is unchanged: critical anywhere and high in prod are what fail', () => {
  const v = (severity, inProd) =>
    classifyAdvisory({ severity, inProd, exceptionExpires: null, nowMs: NOW })

  assert.equal(v('critical', true).kind, 'violation')
  assert.equal(v('critical', false).kind, 'violation')
  assert.equal(v('high', true).kind, 'violation')

  assert.equal(v('high', false).kind, 'warning')
  assert.equal(v('moderate', true).kind, 'warning')
  assert.equal(v('low', true).kind, 'warning')
  assert.equal(v('info', true).kind, 'warning')
})

test('a low dev advisory is a warning and not a silence', () => {
  // The regression this file exists for. ursa-minor carried three of these on
  // 2026-11-09 and the gate reported them on no line at all.
  const got = classifyAdvisory({
    severity: 'low',
    inProd: false,
    exceptionExpires: null,
    nowMs: NOW,
  })
  assert.deepEqual(got, { kind: 'warning', scope: 'dev', why: 'below-floor' })
})

test('a live exception warns, an elapsed one is its own kind', () => {
  const live = classifyAdvisory({
    severity: 'critical', inProd: true, exceptionExpires: '2026-12-01', nowMs: NOW,
  })
  assert.deepEqual(live, { kind: 'warning', scope: 'prod', why: 'allowed' })

  const gone = classifyAdvisory({
    severity: 'critical', inProd: true, exceptionExpires: '2026-01-01', nowMs: NOW,
  })
  assert.deepEqual(gone, { kind: 'expired', scope: 'prod', why: 'expired' })
})

test('an exception expiring today is still live, matching the gate it came from', () => {
  // `Date.parse(expires) >= now` is the comparison dep-floor.mjs has always
  // used. Pinned here so a refactor cannot quietly make expiry exclusive.
  const got = classifyAdvisory({
    severity: 'critical', inProd: false,
    exceptionExpires: '2026-11-09T00:00:00Z', nowMs: NOW,
  })
  assert.equal(got.kind, 'warning')
})

test('an exception never rescues something that was never above the floor', () => {
  // It stays a below-floor warning, so its reason stays the true one.
  const got = classifyAdvisory({
    severity: 'moderate', inProd: false, exceptionExpires: '2026-01-01', nowMs: NOW,
  })
  assert.deepEqual(got, { kind: 'warning', scope: 'dev', why: 'below-floor' })
})

// ------------------------------------------------------------ count line

test('severityCounts names every severity npm counts, not a chosen three', () => {
  // The literal metadata object from `npm audit --json` in ursa-minor,
  // 2026-11-09. The old line printed critical, high and moderate out of this
  // and so printed all zeros for a package with three advisories.
  const totals = { info: 0, low: 3, moderate: 0, high: 0, critical: 0, total: 3 }
  assert.equal(severityCounts(totals), 'critical=0 high=0 moderate=0 low=3 info=0 total=3')

  for (const key of Object.keys(totals)) {
    assert.match(severityCounts(totals), new RegExp(`\\b${key}=`), `${key} missing from the line`)
  }
})

test('severityCounts sums its own total when npm did not supply one', () => {
  assert.equal(
    severityCounts({ critical: 1, high: 2 }),
    'critical=1 high=2 moderate=0 low=0 info=0 total=3',
  )
})
