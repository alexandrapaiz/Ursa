// Tests for scripts/ci-checks.mjs.
//
// The first group is the one that matters. Finding F73 of
// docs/security/audit-2026-11-02k.md is that a check list can look complete
// while covering none of the product, and go green doing it. These tests are
// written so that reintroducing that shape fails here rather than passing in
// CI for weeks.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { CHECKS, SCOPES, classify, exitCodeFor, parseArgs, toolingSuites } from './ci-checks.mjs'

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'ci-checks.mjs')

test('the check list covers every scope, which is the defect F73 described', () => {
  for (const scope of SCOPES) {
    const inScope = CHECKS.filter((c) => c.scope === scope)
    assert.ok(
      inScope.length > 0,
      `no check covers the ${scope} scope. PWC-15's queued step list covered `
      + 'tooling only, which is why a branch that broke the product passed.',
    )
  }
})

test('the product scope runs the product\'s own test command, not node --test over .mjs', () => {
  const product = CHECKS.filter((c) => c.scope === 'product')
  const argvs = product.map((c) => c.argv().join(' '))
  assert.ok(
    argvs.some((a) => a.includes('vitest')),
    'ursa-major\'s tests run under vitest; a node --test step does not reach them',
  )
  assert.ok(
    argvs.some((a) => a.includes('tsc') && a.includes('--noEmit')),
    'ursa-major\'s npm test is `tsc --noEmit && vitest run`; the typecheck is a '
    + 'separate instrument and a type error can reach main without it',
  )
})

test('the tooling glob really cannot see the product, so the product scope is load-bearing', () => {
  const suites = toolingSuites()
  assert.ok(suites.length > 0, 'expected the tooling glob to find suites')
  assert.ok(
    suites.every((s) => s.endsWith('.test.mjs')),
    'the tooling glob matches .test.mjs only',
  )
  // The measurement behind F73, asserted rather than restated: ursa-major's
  // suites exist and none of them is reachable by the tooling glob.
  const productSuites = execFileSync('git', ['ls-files', 'ursa-major/*.test.ts'], { encoding: 'utf8' })
    .split('\n').filter(Boolean)
  assert.ok(productSuites.length > 0, 'expected ursa-major to carry .test.ts suites')
  for (const p of productSuites) {
    assert.ok(!suites.includes(p), `${p} should not be reachable by the tooling glob`)
  }
})

test('a check whose dependencies are absent is unrunnable, never passing and never silently skipped', () => {
  const check = CHECKS.find((c) => c.needsNodeModules === 'ursa-major')
  assert.ok(check, 'expected at least one check to declare a node_modules dependency')
  const got = classify(check, { installedPackages: [], skip: [], shallow: false })
  assert.equal(got.state, 'unrunnable')
  assert.match(got.why, /node_modules is absent/)
  // And it becomes runnable once the dependency is there, so the gate is not
  // permanently stuck. Both inputs now, because the directory is not the
  // condition: see the next case.
  assert.equal(
    classify(check, {
      installedPackages: ['ursa-major'],
      installedBins: [`ursa-major/${check.needsBin}`],
      skip: [],
      shallow: false,
    }).state,
    'runnable',
  )
})

// A PARTIAL INSTALL IS NOT AN INSTALL, AND npx FILLS THE GAP FROM THE PUBLIC
// REGISTRY (added 2026-11-09, security seat, measured)
//
// `needsNodeModules` tested for the DIRECTORY. A tree where `node_modules/`
// exists and the binary does not passed that test, and the check then ran
// `npx tsc`, which without `--no-install` fetches and executes a registry
// package of that name.
//
// Measured in this check, not reasoned about: it printed `npm warn exec The
// following package was not found and will be installed: tsc@2.0.4` and ran
// it, in a seat sandbox with live tokens in the environment. `npx
// --no-install` refuses instead, with `npx canceled due to missing packages
// and no YES option: ["tsc@2.0.4"]`, which also names what would have been
// fetched.
//
// The partial tree is not hypothetical. `node tools/seat/env-facts.mjs`
// carries it as a measured npm failure mode on this host under
// `npm-cache-is-a-shared-home-path`: `exit 0 with no node_modules/.bin`.
test('a package installed but missing the binary is unrunnable, not attempted against the registry', () => {
  for (const check of CHECKS.filter((c) => c.needsBin)) {
    const got = classify(check, {
      installedPackages: [check.needsNodeModules],
      installedBins: [],
      skip: [],
      shallow: false,
    })
    assert.equal(got.state, 'unrunnable', check.id)
    assert.match(got.why, /\.bin\/\w/)
    // The message has to separate a partial install from a missing one,
    // because the remedy differs and the first one looks like the second.
    assert.match(got.why, /partial rather than missing/)
  }
})

test('every npx check refuses to install, so a missing binary cannot be served by the registry', () => {
  const npxChecks = CHECKS.filter((c) => c.argv().includes('npx'))
  assert.ok(npxChecks.length > 0, 'expected at least one npx check')
  for (const c of npxChecks) {
    assert.ok(c.argv().includes('--no-install'),
      `${c.id} runs npx without --no-install, so a missing binary is fetched and executed`)
    // And it declares which binary it needs, or the guard above cannot fire.
    assert.ok(c.needsBin, `${c.id} runs npx and declares no needsBin`)
  }
})

test('a history-dependent check is unrunnable on a shallow clone rather than blamed on the branch', () => {
  const check = CHECKS.find((c) => c.needsFullClone)
  assert.ok(check, 'expected at least one check to declare a full-clone dependency')
  assert.equal(classify(check, { installedPackages: [], skip: [], shallow: true }).state, 'unrunnable')
  assert.equal(classify(check, { installedPackages: [], skip: [], shallow: false }).state, 'runnable')
})

test('skipping requires naming the check, so the job log records what was not checked', () => {
  const check = CHECKS[0]
  assert.equal(classify(check, { installedPackages: [], skip: [], shallow: false }).state, 'runnable')
  assert.equal(classify(check, { installedPackages: [], skip: [check.id], shallow: false }).state, 'skipped')
})

test('unrunnable outranks failed, because it is not a verdict on the branch', () => {
  assert.equal(exitCodeFor([{ state: 'passed' }, { state: 'passed' }]), 0)
  assert.equal(exitCodeFor([{ state: 'passed' }, { state: 'failed' }]), 1)
  assert.equal(exitCodeFor([{ state: 'failed' }, { state: 'unrunnable' }]), 2)
  assert.equal(exitCodeFor([{ state: 'passed' }, { state: 'skipped' }]), 0)
})

test('every tolerated non-zero exit code is one a check declares deliberately', () => {
  for (const c of CHECKS) {
    assert.ok(Array.isArray(c.passExit) && c.passExit.includes(0), `${c.id} must accept exit 0`)
    for (const code of c.passExit) {
      assert.ok(code === 0 || code === 2, `${c.id} tolerates exit ${code}, which is undeclared`)
    }
  }
  // The one real case, kept explicit so deleting its reason breaks a test:
  // the ledger gate exits 2 on an owner-held violation, which no seat may
  // repair and which main carries today.
  const ledger = CHECKS.find((c) => c.id === 'ledger-contract')
  assert.ok(ledger, 'expected a ledger-contract check')
  assert.deepEqual(ledger.passExit, [0, 2])
})

test('check ids are unique, so --only and --skip address exactly one check each', () => {
  const ids = CHECKS.map((c) => c.id)
  assert.equal(new Set(ids).size, ids.length)
})

test('an unknown check id is an error rather than a silent no-op', () => {
  assert.throws(() => parseArgs(['--skip=no-such-check']), /unknown check id/)
  assert.throws(() => parseArgs(['--only=no-such-check']), /unknown check id/)
  assert.throws(() => parseArgs(['--wat']), /unknown argument/)
  assert.deepEqual(parseArgs(['--list']), { list: true, skip: [], only: [] })
  assert.deepEqual(parseArgs([`--skip=${CHECKS[0].id}`]).skip, [CHECKS[0].id])
})

test('--list exits 0 and names every check under its scope', () => {
  const out = execFileSync('node', [SCRIPT, '--list'], { encoding: 'utf8' })
  for (const scope of SCOPES) assert.match(out, new RegExp(`^${scope} \\(\\d+\\)$`, 'm'))
  for (const c of CHECKS) assert.ok(out.includes(c.id), `--list omitted ${c.id}`)
})

test('a run that could not check the product exits 2 and says so, end to end', () => {
  // The whole point of the file, exercised through the real entrypoint. In
  // this clone ursa-major/node_modules is absent, so both product checks are
  // unrunnable; the run must not report success.
  let status = 0
  let stdout = ''
  try {
    stdout = execFileSync('node', [SCRIPT, '--only=product-suites'], { encoding: 'utf8' })
  } catch (e) {
    status = e.status
    stdout = e.stdout
  }
  if (status === 0) {
    // Dependencies are installed here, so the premise does not hold and
    // there is nothing to assert. Said out loud rather than passing quietly.
    assert.match(stdout, /passed|failed/)
    return
  }
  assert.equal(status, 2, 'a product check that could not run must exit 2, not 0 and not 1')
  assert.match(stdout, /not a verdict on the branch/)
})
