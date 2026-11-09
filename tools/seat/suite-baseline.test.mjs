// Tests for the trunk-red baseline.
//
// Every fixture here is TAP text rather than a live suite run, so this file
// is fast and does not depend on the very thing it is measuring. The one
// assertion that DOES read the committed baseline is the last one, and it
// checks the file's shape and not its contents, because its contents are a
// measurement that is supposed to change.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  parseTap, toRepoPath, keyOf, compare, formatReport, exitCodeFor,
  readSummary, BASELINE_PATH, RETIRED_SUITE_GLOB, suiteRoots, canonicalSuites,
  resetSuitesCache, whyRefused, whyUntrusted, freeMB, flipLines
} from './suite-baseline.mjs'

// The set every path assertion below resolves against, pinned so this file
// stays a unit test: the live set comes from `git ls-files` and grows every
// time any seat adds a suite, and a test that asserts on it would be
// measuring the repository rather than this tool. The three roots are the
// real ones as of 2026-11-02.
const SET = [
  'tools/board/read-filters.test.mjs',
  'tools/seat/own-prs.test.mjs',
  'skills/library-dirs.test.mjs',
  'scripts/ci-checks.test.mjs'
]

// Real `node --test` output, trimmed: a pass, a fail with its YAML block,
// and a pass after it. The indented `# Subtest:` line is here on purpose —
// it is the shape that makes a naive line filter double-count.
const TAP = `TAP version 13
# Subtest: equal counts on rows that carry no company field
ok 148 - transcribed: the message read honours exactly the filters this tool probes
  ---
  duration_ms: 1.1
  ...
# Subtest: transcribed: the events read refuses unknown filters
not ok 149 - transcribed: the events read refuses unknown filters, so the INERT finding was acted on
  ---
  duration_ms: 2.5
  location: '/tmp/epito-ursa-exo-zu0Wpr/tools/board/read-filters.test.mjs:234:1'
  failureType: 'testCodeFailure'
  error: |-
    the events read no longer refuses unknown filters
  ...
ok 150 - transcribed: store.events takes a company
  ---
  duration_ms: 0.4
  ...
1..3
# tests 3
# pass 2
# fail 1
`

const ONE_RED = [{
  file: 'tools/board/read-filters.test.mjs',
  name: 'transcribed: the events read refuses unknown filters, so the INERT finding was acted on',
  since: '2026-11-02',
  owner: 'security',
  ref: 'https://github.com/alexandrapaiz/Ursa/pull/709'
}]

test('parseTap reads each point once, and anchors to column 0', () => {
  const points = parseTap(TAP)
  assert.equal(points.length, 3)
  assert.deepEqual(points.map((p) => p.ok), [true, false, true])
  assert.deepEqual(points.map((p) => p.number), [148, 149, 150])
})

test('a failure carries its own site, and a neighbouring pass does not inherit it', () => {
  const [pass, fail, after] = parseTap(TAP)
  assert.equal(fail.file, 'tools/board/read-filters.test.mjs')
  assert.equal(fail.line, 234)
  // The pass BEFORE the failure has no location line of its own, and the
  // pass AFTER it must not pick up the failure's. Both are null, and the
  // second is the one that would regress if the scan stopped at the next
  // `location:` instead of the next point.
  assert.equal(pass.file, null)
  assert.equal(after.file, null)
})

test('an absolute path inside the repository becomes repo-relative', () => {
  assert.equal(toRepoPath('/repo/tools/a.test.mjs', '/repo', SET), 'tools/a.test.mjs')
})

// THE WORKTREE CASE, which is the defect that running the tool found and
// reading it did not. Measuring `main` in the clone and a branch in a
// worktree at /tmp/wt699, then comparing both to one baseline, produced four
// NEW_RED and four GONE for four failures that had not moved. Rehearsed red:
// with stage 2 of `toRepoPath` removed, this test fails and the two below it
// keep passing, because they never leave the root.
test('a test file measured in another checkout normalises to the same key', () => {
  assert.equal(
    toRepoPath('/tmp/wt699/tools/board/read-filters.test.mjs', '/repo', SET),
    'tools/board/read-filters.test.mjs'
  )
  // And the identity that matters is the key, not the string.
  const here = { file: toRepoPath('/repo/tools/a.test.mjs', '/repo', SET), name: 'x' }
  const there = { file: toRepoPath('/tmp/wt/tools/a.test.mjs', '/repo', SET), name: 'x' }
  assert.equal(keyOf(here), keyOf(there))
})

// THE WIDENING CASE, which is the blocker window 88 named rather than fixed.
// The set used to be this tool's own `tools/**/*.test.mjs` and the worktree
// anchor was the single segment read off it, so the suites the canonical set
// ADDS — six under `skills/`, four under `scripts/` — were exactly the ones
// whose worktree paths could not be keyed. Measured before the fix, both
// non-`tools` rows below came back unchanged and absolute.
//
// POSITIVE CONTROL, because an absence is a measurement. The second half
// rehearses the old behaviour by passing a `tools`-only set: with no
// `skills/` path to match and no `skills` root to anchor on, the path is
// handed back absolute. That is the defect, reproduced on demand, so a
// future edit that narrows the set again fails here instead of going quiet.
test('a suite outside tools/ normalises too, and the old tools-only set is why it did not', () => {
  assert.equal(
    toRepoPath('/tmp/wt699/skills/library-dirs.test.mjs', '/repo', SET),
    'skills/library-dirs.test.mjs'
  )
  assert.equal(
    toRepoPath('/tmp/wt699/scripts/ci-checks.test.mjs', '/repo', SET),
    'scripts/ci-checks.test.mjs'
  )
  const toolsOnly = SET.filter((f) => f.startsWith('tools/'))
  assert.equal(
    toRepoPath('/tmp/wt699/skills/library-dirs.test.mjs', '/repo', toolsOnly),
    '/tmp/wt699/skills/library-dirs.test.mjs',
    'the pre-fix behaviour, kept as the control: unplaceable, so handed back as it came'
  )
})

// Stage 3, which is the only reason the root anchor survives the rewrite.
// A sibling branch measured in a worktree may add a suite this checkout's
// index does not carry, so the file is real, keyable, and absent from the
// set. Stage 2 cannot match it and stage 2 alone would hand it back absolute.
test('a suite a sibling branch added, absent from this index, still keys off its root', () => {
  assert.equal(
    toRepoPath('/tmp/wt699/tools/added-over-there.test.mjs', '/repo', SET),
    'tools/added-over-there.test.mjs'
  )
  assert.equal(
    toRepoPath('/tmp/wt699/skills/added-over-there.test.mjs', '/repo', SET),
    'skills/added-over-there.test.mjs'
  )
})

// THE NESTED WORKTREE, which is the defect the widening fix introduced and
// running it found within the hour. Stage 1 used to accept any `relative()`
// result that did not escape the root, and a worktree INSIDE the root does
// not escape it. `.scratch/` is where this repository's own .gitignore
// directs run scratch, so the sanctioned place to put a worktree was exactly
// the place that defeated the normaliser.
//
// Measured on a real trunk worktree at `.scratch/wt-main`: the report came
// out NEW_RED 1 *and* GONE 1 for one failure that had not moved — the same
// double count stage 2 was written to kill, revived from the other side. It
// accuses the branch of breaking a test and writes off the trunk's debt in
// one breath, and both halves point the expensive way.
//
// Rehearsed red: put the stage-1 clause back ahead of the exact match and
// this test fails while every other path test here keeps passing, because
// they all use a worktree OUTSIDE the root.
test('a worktree nested inside the repository root still normalises', () => {
  assert.equal(
    toRepoPath('/repo/.scratch/wt-main/tools/board/read-filters.test.mjs', '/repo', SET),
    'tools/board/read-filters.test.mjs'
  )
  // And for a suite that checkout does not carry, stage 3 has to anchor past
  // the nested prefix rather than accepting it.
  assert.equal(
    toRepoPath('/repo/.scratch/wt-main/tools/added-over-there.test.mjs', '/repo', SET),
    'tools/added-over-there.test.mjs'
  )
  // The key is the point: one failure, two checkouts, one identity.
  const outer = { file: toRepoPath('/repo/tools/board/read-filters.test.mjs', '/repo', SET), name: 'x' }
  const nested = { file: toRepoPath('/repo/.scratch/wt-main/tools/board/read-filters.test.mjs', '/repo', SET), name: 'x' }
  assert.equal(keyOf(outer), keyOf(nested))
})

test('the longest match wins, so a nested copy of a suite path is not mistaken for it', () => {
  const set = ['a/b.test.mjs', 'x/a/b.test.mjs']
  assert.equal(toRepoPath('/tmp/wt/x/a/b.test.mjs', '/repo', set), 'x/a/b.test.mjs')
})

test('a path outside every suite root is left alone rather than given a false form', () => {
  // `relative('/repo', '/elsewhere/x')` is `../elsewhere/x`, which names no
  // file in this repository, and there is no suite root to anchor on either.
  assert.equal(toRepoPath('/elsewhere/x.test.mjs', '/repo', SET), '/elsewhere/x.test.mjs')
  assert.equal(toRepoPath('tools/a.test.mjs', '/repo', SET), 'tools/a.test.mjs')
  assert.deepEqual(
    suiteRoots(SET).sort(),
    ['scripts', 'skills', 'tools'],
    'the roots are derived from the set, so widening the set widens them'
  )
})

// A LOAD CHECK AND NOT A PARSE CHECK. Ursa's engineer measured this class on
// 2026-11-02: git merged an import of a name on one side with a new export of
// the same name on the other, in one file, with no conflict marker anywhere,
// and `node --check` passes a duplicate binding because it is a link error
// and not a parse error. This tool now imports `toolingSuites` across a lane
// boundary, which is where that class lives, so the import is asserted rather
// than assumed. The rest of this file would still pass with the import broken
// in that way; node resolves the module graph before any test runs only
// because this suite imports it at the top, and a seat that later moves to a
// dynamic import loses that for free.
test('the canonical set resolves, and resolving it is a load of another lane\'s module', () => {
  resetSuitesCache()
  const set = canonicalSuites()
  assert.ok(Array.isArray(set) && set.length > 0, 'an empty set is a failed resolve, never a green suite')
  assert.ok(set.every((f) => f.endsWith('.test.mjs')), 'every member is a suite file')
  assert.deepEqual(set, [...set].sort(), 'sorted, because the invocation order is the report order')
  assert.ok(
    suiteRoots(set).includes('tools') && suiteRoots(set).length > 1,
    'the live set reaches past tools/, which is the whole point of widening it'
  )
  resetSuitesCache()
})

test('the set is cached, because toRepoPath consults it once per path', () => {
  resetSuitesCache()
  let calls = 0
  const resolver = () => { calls += 1; return ['tools/a.test.mjs'] }
  canonicalSuites(resolver)
  canonicalSuites(resolver)
  assert.equal(calls, 1, 'one git ls-files per process, not one per TAP point')
  resetSuitesCache()
})

test('the real worktree comparison that failed now agrees', () => {
  // The exact shape of the run that caught this: one baseline entry recorded
  // from the clone, the same failure reported from a worktree.
  const fromWorktree = [
    'TAP version 13',
    'not ok 1 - transcribed: the events read refuses unknown filters, so the INERT finding was acted on',
    '  ---',
    "  location: '/tmp/wt699/tools/board/read-filters.test.mjs:234:1'",
    '  ...',
    '1..1'
  ].join('\n')
  const cmp = compare(parseTap(fromWorktree), { minPoints: 1, red: ONE_RED }, readSummary(fromWorktree))
  assert.equal(cmp.stillRed.length, 1, 'the same failure from a worktree is the same failure')
  assert.equal(cmp.newRed.length, 0)
  assert.equal(cmp.vanished.length, 0, 'and nothing vanished, because nothing did')
})

test("the floor prefers node's own plan line to our count of it", () => {
  const sum = readSummary(TAP)
  assert.equal(sum.plan, 3)
  assert.equal(sum.fail, 1)
  assert.equal(sum.pass, 2)
  const cmp = compare(parseTap(TAP), { minPoints: 1, red: ONE_RED }, sum)
  assert.equal(cmp.points, 3)
  assert.equal(cmp.planFromProducer, true)
})

test('a TAP with no plan line falls back to counting, and says so', () => {
  const truncated = 'TAP version 13\nok 1 - a\nok 2 - b\n'
  const sum = readSummary(truncated)
  assert.equal(sum.plan, null)
  const baseline = { minPoints: 1, red: [] }
  const cmp = compare(parseTap(truncated), baseline, sum)
  assert.equal(cmp.points, 2)
  assert.equal(cmp.planFromProducer, false)
  assert.match(formatReport(cmp, baseline), /counted, no plan line/)
})

test('a recorded failure is STILL_RED and carries its owner through', () => {
  const cmp = compare(parseTap(TAP), { minPoints: 1, red: ONE_RED }, readSummary(TAP))
  assert.equal(cmp.newRed.length, 0)
  assert.equal(cmp.stillRed.length, 1)
  assert.equal(cmp.stillRed[0].owner, 'security')
  assert.equal(exitCodeFor(cmp, { minPoints: 1, red: ONE_RED }), 0,
    "the trunk's own debt must not block a seat that did not incur it")
})

test('an unrecorded failure is NEW_RED and blocks', () => {
  const baseline = { minPoints: 1, red: [] }
  const cmp = compare(parseTap(TAP), baseline, readSummary(TAP))
  assert.equal(cmp.newRed.length, 1)
  assert.equal(cmp.stillRed.length, 0)
  assert.equal(exitCodeFor(cmp, baseline), 1)
})

// THE RENUMBERING TEST, which is the whole reason this is keyed on the name.
// Rehearsed red rather than asserted: with `keyOf` changed to return
// `String(point.number)`, this test fails — and so do three others (5, 9,
// 13), because a number-keyed baseline also loses the owner lookup and the
// FIXED verdict. Four red from one substitution is the honest figure; an
// earlier draft of this comment claimed one, which would have told the next
// reader this test was load-bearing alone. It is not. It is the only one of
// the four that fails for the renumbering reason specifically, which is why
// it is still worth having beside them.
test('inserting a test file upstream renumbers the run and changes no verdict', () => {
  const shifted = TAP
    .replace('ok 148 -', 'ok 348 -')
    .replace('not ok 149 -', 'not ok 349 -')
    .replace('ok 150 -', 'ok 350 -')
  const cmp = compare(parseTap(shifted), { minPoints: 1, red: ONE_RED }, readSummary(shifted))
  assert.equal(cmp.stillRed.length, 1, 'a renumbered run must not turn a known red into a new one')
  assert.equal(cmp.newRed.length, 0)
})

test('one test file renamed is not the same test, because the key carries the file', () => {
  const moved = TAP.replace('tools/board/read-filters.test.mjs', 'tools/board/filters.test.mjs')
  const cmp = compare(parseTap(moved), { minPoints: 1, red: ONE_RED }, readSummary(moved))
  assert.equal(cmp.newRed.length, 1, 'a failure at a new path is a new failure until somebody says otherwise')
  assert.equal(cmp.vanished.length, 1, 'and the old entry is GONE, not FIXED')
  assert.equal(cmp.fixed.length, 0)
})

test('a baseline entry that now passes is FIXED, and says so without blocking', () => {
  // THIS FIXTURE IS NOT THE REALISTIC SHAPE, and saying so is the point of
  // the comment. Rewriting `not ok 149` to `ok 149` keeps the failure's
  // `location:` line, so this exercises the exact file+name match — a path
  // real `node --test` output never takes for a pass, because it prints no
  // location for one. The test is kept, because the exact match is still the
  // match for a point that does carry a file; it is no longer the only one.
  // See REAL_GREEN at the end of this file for the shape that was missing,
  // and `compare`'s own header for what its absence cost.
  const green = TAP.replace('not ok 149 -', 'ok 149 -')
  const baseline = { minPoints: 1, red: ONE_RED }
  const cmp = compare(parseTap(green), baseline, readSummary(green))
  assert.equal(cmp.fixed.length, 1)
  assert.equal(cmp.newRed.length, 0)
  assert.equal(exitCodeFor(cmp, baseline), 0)
  assert.match(formatReport(cmp, baseline), /FIXED {2}1/)
})

// THE POSITIVE CONTROL. An absence is a measurement and needs one.
test('a run that collected nothing is refused, not reported as green', () => {
  const baseline = { minPoints: 380, red: [] }
  const complete = 'TAP version 13\n1..0\n# tests 0\n'
  const cmp = compare(parseTap(complete), baseline, readSummary(complete))
  assert.equal(cmp.newRed.length, 0, 'zero tests really does yield zero failures')
  assert.equal(exitCodeFor(cmp, baseline), 2, 'and that must not be an exit of 0')
})

// THE PARTIAL RUN, which the floor cannot see and which happened for real.
// A trunk run on this host was cut off at 435 of 516 points on 2026-11-02:
// it cleared the 380 floor, found none of the baseline's entries because it
// never reached them, and reported the trunk's one standing debt as GONE at
// exit 0. Ursa's engineer lost a whole suite run's output file the same day
// on the same volume, and the salvaged half reported eight failures where the
// complete re-run reported one. So the shape is the host's, not a fixture's.
//
// Rehearsed red: with the `planFromProducer` clause removed from
// `whyRefused`, this test fails and the two floor tests above keep passing,
// because 435 is over the floor and the floor is the only control they have.
test('a run that stopped before the end is refused, even well over the floor', () => {
  const baseline = { minPoints: 380, red: ONE_RED }
  // 435 points, no `1..N`, no `# tests` — the exact shape of a lost output
  // file, and well clear of the floor.
  const partial = 'TAP version 13\n'
    + Array.from({ length: 435 }, (_, i) => `ok ${i + 1} - t${i}`).join('\n') + '\n'
  const cmp = compare(parseTap(partial), baseline, readSummary(partial))
  assert.equal(cmp.points, 435, 'counted, since there is no plan to prefer')
  assert.equal(cmp.planFromProducer, false)
  assert.ok(cmp.points > baseline.minPoints, 'the floor is cleared, which is the whole problem')
  assert.equal(cmp.vanished.length, 1, 'and the baseline entry reads as GONE, which is the harm')
  assert.equal(exitCodeFor(cmp, baseline), 2, 'so completeness has to be its own control')
  assert.match(whyRefused(cmp, baseline), /did not finish/)
})

test('a plan with no summary is incomplete too, because node prints both last', () => {
  const baseline = { minPoints: 1, red: [] }
  const planOnly = 'TAP version 13\nok 1 - t\n1..1\n'
  const cmp = compare(parseTap(planOnly), baseline, readSummary(planOnly))
  assert.equal(exitCodeFor(cmp, baseline), 2)
  assert.match(whyRefused(cmp, baseline), /# tests/)
})

test('the floor still answers first, so its message is not replaced by the newer one', () => {
  const baseline = { minPoints: 380, red: [] }
  const complete = 'TAP version 13\n1..0\n# tests 0\n'
  const cmp = compare(parseTap(complete), baseline, readSummary(complete))
  assert.match(whyRefused(cmp, baseline), /floor is 380/)
})

test('the MODULE_NOT_FOUND shape — one failing point for a bare directory — is refused too', () => {
  // This is verbatim what `node --test tools/` produces: a single point
  // named after the directory. Counting red alone calls it "1 failure";
  // the floor calls it what it is, a suite that never ran.
  const baseline = { minPoints: 380, red: [] }
  const dirRun = 'TAP version 13\nnot ok 1 - tools\n  ---\n  error: |-\n    test failed\n  ...\n1..1\n# tests 1\n# fail 1\n'
  const cmp = compare(parseTap(dirRun), baseline, readSummary(dirRun))
  assert.equal(exitCodeFor(cmp, baseline), 2)
})

test('the report names both counts and the floor, in the floor\'s own units', () => {
  // The header line has to distinguish the two quantities, because the whole
  // reason the floor misfired on its first real run was a reader — this seat
  // — taking `# tests 707` for the number `1..421` reports.
  const baseline = { minPoints: 380, red: ONE_RED }
  const out = formatReport(compare(parseTap(TAP), baseline, readSummary(TAP)), baseline)
  assert.match(out, /3 top-level points/)
  assert.match(out, /3 collected/)
  assert.match(out, /floor 380 points/)
})

test('the floor counts top-level points and ignores nested repeats', () => {
  // `node --test` prints a nested subtest at its own indent AND flat, so a
  // floor that counted every indent would read 2 where `1..N` reads 1.
  const nested = 'TAP version 13\nok 1 - outer\n    ok 1 - inner\n1..1\n'
  const cmp = compare(parseTap(nested), { minPoints: 1, red: [] }, readSummary(nested))
  assert.equal(cmp.points, 1, 'the floor\'s quantity is node\'s 1..N')
})

test('a failure that appears only nested is still caught, and counted once', () => {
  // Today no failure in this repository is nested. This asserts the guard
  // does not DEPEND on that staying true.
  const nested = [
    'TAP version 13',
    'not ok 1 - tools/x.test.mjs',
    '  ---',
    "  location: '/repo/tools/x.test.mjs:1:1'",
    '  ...',
    '    not ok 1 - the inner one that actually broke',
    '      ---',
    "      location: '/repo/tools/x.test.mjs:42:1'",
    '      ...',
    '1..1'
  ].join('\n')
  const cmp = compare(parseTap(nested), { minPoints: 1, red: [] }, readSummary(nested))
  const names = cmp.newRed.map((p) => p.name)
  assert.ok(names.includes('the inner one that actually broke'), 'the nested failure must not hide')
  assert.equal(cmp.newRed.length, 2, 'the suite point and the inner test are two distinct failures')
  assert.equal(cmp.points, 1, 'but only one of them is a top-level point')
})

// SKIPPED IS A THIRD STATE, and this is the defect that made it one.
// `tools/board/read-filters.test.mjs` keys on /srv/asc/hq/runtime/board/api.py,
// a host path outside this repository, and skips when it is absent. Its red
// is therefore not a property of `main`, and on a host without HQ's checkout
// an earlier draft of this tool reported the trunk's debt as GONE and offered
// to drop it. Rehearsed red: with `point.skipped` forced to false, both tests
// below fail.
const SKIP_TAP = [
  'TAP version 13',
  'ok 26 - transcribed: the events read refuses unknown filters, so the INERT finding was acted on # SKIP no board source on this host',
  '  ---',
  "  location: '/repo/tools/board/read-filters.test.mjs:234:1'",
  '  ...',
  '1..1',
  // `# tests` is here because node prints it and a fixture that omits it is
  // modelling a run that stopped, which `whyRefused` now refuses. Four
  // fixtures in this file omitted it and read as complete until that landed.
  '# tests 1'
].join('\n')

test('a TAP directive comes off the name, so a changed skip reason is the same test', () => {
  const [p] = parseTap(SKIP_TAP)
  assert.equal(p.name, 'transcribed: the events read refuses unknown filters, so the INERT finding was acted on')
  assert.equal(p.directive, 'SKIP')
  assert.equal(p.directiveReason, 'no board source on this host')
  assert.equal(p.skipped, true)
  assert.equal(p.ok, true, "node really does print a skip as `ok`; that is the trap")
})

test('a baseline entry that skips is UNRUNNABLE, never FIXED and never GONE', () => {
  const baseline = { minPoints: 1, red: ONE_RED }
  const cmp = compare(parseTap(SKIP_TAP), baseline, readSummary(SKIP_TAP))
  assert.equal(cmp.unrunnable.length, 1, 'the debt stays open')
  assert.equal(cmp.fixed.length, 0, 'a skip is not a pass')
  assert.equal(cmp.vanished.length, 0, 'and it was collected, so it did not vanish')
  assert.equal(cmp.stillRed.length, 0)
  assert.equal(exitCodeFor(cmp, baseline), 0, 'an unrunnable test is not the running seat\'s fault')
  const out = formatReport(cmp, baseline)
  assert.match(out, /UNRUNNABLE {2}1/)
  assert.match(out, /no board source on this host/)
})

test('a skipped test is not counted as a pass elsewhere either', () => {
  const mixed = 'TAP version 13\nok 1 - a\nok 2 - b # SKIP nope\nnot ok 3 - c\n1..3\n'
  const cmp = compare(parseTap(mixed), { minPoints: 1, red: [] }, readSummary(mixed))
  assert.equal(cmp.skipped, 1)
  assert.equal(cmp.newRed.length, 1, 'the real failure is still the only failure')
  assert.equal(cmp.newRed[0].name, 'c')
})

test('keyOf separates name from file with a character neither can contain', () => {
  assert.equal(keyOf({ file: 'a', name: 'b' }), 'a\u0000b')
  // A test whose location was never printed still gets a stable key rather
  // than colliding with every other locationless failure's file.
  assert.equal(keyOf({ file: null, name: 'b' }), '?\u0000b')
})

test('the committed baseline is well formed, and every entry is attributable', () => {
  const b = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
  assert.ok(Number.isInteger(b.minPoints) && b.minPoints > 0, 'the floor is the positive control; it has to exist')
  assert.ok(Array.isArray(b.red))
  for (const e of b.red) {
    assert.ok(e.file && e.name, 'an entry with no file or no name cannot be matched to a run')
    assert.match(e.since, /^\d{4}-\d{2}-\d{2}$/, 'a standing failure needs the day it started standing')
    assert.ok(e.owner, 'every entry names an owner or says UNOWNED; it never omits the question')
    assert.ok(e.note, 'and says what it measured, so the next run need not re-derive it')
    assert.ok(e.dependsOn, 'and what its colour is a function of, so green is read correctly')
    // The 2026-11-08 field, on the claim it was REDUCED to on 2026-11-09.
    // A row keyed on a string any seat may edit needs something that decides
    // its current state. This file originally said that something had to be
    // `flipQuery`, because `measuredOn` could not detect a rename. exo
    // corrected that: `measuredOn` plus the commits to the tip can, and
    // `tools/seat/baseline-drift.mjs` does it for every row at once. So the
    // field is still required, for the narrower reason that survives -- a row
    // whose colour is not a function of the tree is one no commit-walk can
    // settle, and that is the case a hand-authored query is for.
    assert.ok(e.flipQuery, 'every entry carries the one command that decides whether it still holds')
  }
  // The retired glob is kept as a named constant, not invoked, because the
  // baseline's recorded history cites the numbers it produced and a reader
  // comparing them against today's needs to know they came off a smaller set.
  assert.equal(RETIRED_SUITE_GLOB, 'tools/**/*.test.mjs')
  assert.ok(b.suiteSet && b.suiteSet.source, 'the baseline names the set it was measured over')
  assert.ok(b.suiteSet.suites > 0 && b.suiteSet.points > 0, 'with its size, so a count is comparable')
})

test('every resolved row says which commit resolved it, and `repaired` is checked as hard as `red`', () => {
  // NOTHING ASSERTED OVER `repaired` UNTIL 2026-11-09, and on that day it
  // became the larger half of the file: the trunk went green, `red` emptied,
  // and all eleven rows this baseline has ever held moved across. A block the
  // tool does not read and no test checks is a block that decays, and the one
  // thing every reader of it needs is the same thing `flipQuery` gives a red
  // row -- the evidence that decides whether the row is still resolved.
  //
  // `repairedOnTrunk` is allowed to be null ON PURPOSE. Five of these rows
  // were resolved by their tests being MOVED OFF the trunk rather than by a
  // commit repairing them, so there is no repairing commit to name and
  // inventing one would be the lie this field exists to prevent. What is
  // required is that `resolution` says which of the two happened.
  const b = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
  assert.ok(Array.isArray(b.repaired) && b.repaired.length > 0)
  for (const e of b.repaired) {
    assert.ok(e.file && e.name, `${e.name}: a row with no file or name cannot be matched to a run`)
    assert.ok(e.owner, `${e.name}: a resolved row still names who owned it`)
    assert.ok(e.dependsOn, `${e.name}: and what its colour was a function of`)
    assert.ok(e.verifiedGreen, `${e.name}: and the measurement that says it is resolved`)
    assert.ok(
      e.repairedOnTrunk || e.resolution,
      `${e.name}: a row with no repairing commit must say in \`resolution\` why there is none`
    )
  }
})

test('a red row and a resolved row are never both present for the same test', () => {
  // The failure mode this guards is the one the 2026-11-09 window was sent to
  // settle one level up: two records of the same subject, each honest on its
  // own, disagreeing. Here it would read as a debt that is simultaneously
  // standing and paid, and `compare` only consults `red`, so the resolved
  // copy would be the one nobody saw.
  const b = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
  const resolved = new Set(b.repaired.map((e) => keyOf(e)))
  for (const e of b.red) {
    assert.ok(!resolved.has(keyOf(e)), `${e.file} ${e.name} is in both \`red\` and \`repaired\``)
  }
})

// THE STARVED RUN, which is the bound on the control added beside it rather
// than an extension of it. Measured on this seat's own branch on 2026-11-02:
// the canonical set reported 68 NEW_RED across five suites with the shared
// volume at 20 MB free, and zero on the same commit twenty minutes later
// with 2.0 GB free. Both runs printed `1..600` and `# tests 933`.
//
// So the point of these tests is the pair: `whyRefused` sees a run that
// stopped, `whyUntrusted` sees a run that finished in a starved environment,
// and neither can see the other's case.
test('a run on a starved volume is refused even though it finished', () => {
  const baseline = { minPoints: 1, minFreeMB: 512, red: [] }
  assert.match(whyUntrusted(20, baseline), /20 MB free/)
  assert.equal(whyUntrusted(2048, baseline), null, '2.0 GB is the reading that produced zero false red')
  assert.equal(whyUntrusted(512, baseline), null, 'the floor itself is not under the floor')
  assert.match(whyUntrusted(511, baseline), /512 MB floor/)
})

test('an unreadable volume is reported unknown, never trusted', () => {
  const baseline = { minPoints: 1, minFreeMB: 512, red: [] }
  assert.match(whyUntrusted(NaN, baseline), /could not be read/)
  // A failed statfs is NaN and not 0. Zero would read as a starved volume,
  // which is the right verdict by luck and the wrong reason in the report:
  // "fell to 0 MB free" is a measurement, and this is an absent one.
  assert.ok(Number.isNaN(freeMB('/no/such/path/at/all')))
  // Injected, because the throwing branch is the one a real path will not take.
  assert.ok(Number.isNaN(freeMB('/', () => { throw new Error('EIO') })))
})

test('a baseline with no minFreeMB opts out rather than refusing everything', () => {
  // The field is this file's and a caller may legitimately not have it, e.g.
  // an older committed baseline. Absent means unchecked, not zero.
  assert.equal(whyUntrusted(20, { minPoints: 1, red: [] }), null)
})

test('the live volume reads as a positive number, so the probe is wired to a real syscall', () => {
  const mb = freeMB()
  assert.ok(Number.isFinite(mb) && mb >= 0, 'statfs on the repository root answers')
})

test('the committed baseline carries the environment floor it documents', () => {
  const b = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
  assert.ok(Number.isInteger(b.minFreeMB) && b.minFreeMB > 0)
})

// THE RENAME, which is the case `measuredOn` ALONE cannot see and this seat
// caused. Alone is the 2026-11-09 correction: see suite-baseline.mjs.
// This tool keys on file and name because the TAP number renumbers on any new
// suite, and that is right. The cost is a dependence on a string a sibling
// seat may edit, and on 2026-11-02 the sibling was this seat: it renamed the
// test its own row was keyed on at 08:56:44Z, ten minutes before the row was
// written at 09:06:00Z, and the rename reached the trunk at 09:38:40Z. The
// row then described a real failure under a key nothing collected.
//
// The verdict was already right — GONE, never FIXED, so the debt was not
// written off. What was missing was any way to ANSWER it. GONE asks "deleted
// or renamed?" and six days passed without a reply.
test('GONE names the row\'s owner and the query that answers it', () => {
  const baseline = {
    minPoints: 1,
    red: [{
      file: 'tools/stack/repair-pending.test.mjs',
      name: 'a name no run collects any more',
      since: '2026-11-02',
      owner: 'security',
      dependsOn: 'forge-queue',
      flipQuery: "git log -L 252,252:tools/stack/repair-pending.test.mjs origin/main",
      note: 'the measured row'
    }]
  }
  // A complete run that simply does not contain the row's key.
  const tap = 'TAP version 13\nok 1 - something else entirely\n1..1\n# tests 1\n'
  const cmp = compare(parseTap(tap), baseline, readSummary(tap))
  assert.equal(cmp.vanished.length, 1)
  assert.equal(cmp.fixed.length, 0, 'a vanished row is not a paid one')
  const out = formatReport(cmp, baseline)
  assert.match(out, /GONE {2}1/)
  assert.match(out, /owner: security — theirs to resolve/)
  assert.match(out, /flips on: git log -L 252,252/)
  // And it is still not the running seat's fault, so it still does not block.
  assert.equal(exitCodeFor(cmp, baseline), 0)
})

test('STILL_RED carries the flip query too, so a stale row is checkable in place', () => {
  const baseline = {
    minPoints: 1,
    red: [{
      file: 'tools/board/read-filters.test.mjs',
      name: 'the test that fails',
      since: '2026-11-02',
      owner: 'security',
      dependsOn: 'tree',
      flipQuery: 'node --test tools/board/read-filters.test.mjs',
      flipExpect: 'the assertion still names the spelling and not the property',
      note: 'the measured row'
    }]
  }
  const tap = 'TAP version 13\nnot ok 1 - the test that fails\n  ---\n  location: \'/x/tools/board/read-filters.test.mjs:3:1\'\n  ...\n1..1\n# tests 1\n'
  const cmp = compare(parseTap(tap), baseline, readSummary(tap))
  assert.equal(cmp.stillRed.length, 1)
  const out = formatReport(cmp, baseline)
  assert.match(out, /flips on: node --test/)
  assert.match(out, /still red while: the assertion still names the spelling/)
})

test('a row with no flip query is reported as lacking one, never silently', () => {
  // The absence is the finding. A row nobody can check without archaeology
  // is how this tool's own standing row went six days unresolved.
  assert.deepEqual(flipLines({ owner: 'security' }),
    ['      flipQuery: NONE — this row cannot be checked without archaeology'])
  // And the optional half stays optional.
  assert.deepEqual(flipLines({ flipQuery: 'git log' }), ['      flips on: git log'])
})

// FIXED WAS UNREACHABLE AGAINST REAL OUTPUT, which is the defect underneath
// the stale key above. `node --test` (v22.23.2, measured 2026-11-08) prints
// `location:` in a point's YAML block for FAILURES ONLY, so a passing point
// has no file, `keyOf` gives it `?\0<name>`, and no baseline row naming a real
// path could ever match one. Every repaired row therefore reported GONE.
//
// It survived the suite because the FIXED fixture was made by rewriting
// `not ok 149` to `ok 149`, which KEEPS the failure's `location:` line. The
// two real passes in that same fixture carry none. So the fixture was
// self-contradictory and the only realistic shape was the untested one.
//
// This is the realistic shape: a pass with duration and type and no location.
const REAL_GREEN = [
  'TAP version 13',
  '# Subtest: transcribed: the events read refuses unknown filters',
  'ok 149 - transcribed: the events read refuses unknown filters, so the INERT finding was acted on',
  '  ---',
  '  duration_ms: 2.5',
  "  type: 'test'",
  '  ...',
  '1..1',
  '# tests 1',
  '# pass 1',
  '# fail 0'
].join('\n')

test('a real passing point carries no file, which is the trap', () => {
  const [p] = parseTap(REAL_GREEN)
  assert.equal(p.ok, true)
  assert.equal(p.file, null, 'node prints `location:` for failures only')
  assert.equal(keyOf(p), `?\u0000${ONE_RED[0].name}`, 'so its key can never equal a row naming a path')
})

test('a baseline row whose test now passes is FIXED and not GONE', () => {
  const baseline = { minPoints: 1, red: ONE_RED }
  const cmp = compare(parseTap(REAL_GREEN), baseline, readSummary(REAL_GREEN))
  assert.equal(cmp.fixed.length, 1, 'this is the assertion that failed before the name fallback')
  assert.equal(cmp.vanished.length, 0, 'a collected, passing test has not vanished')
  assert.equal(cmp.fixed[0].matchedBy, 'name')
  const out = formatReport(cmp, baseline)
  assert.match(out, /FIXED {2}1/)
  assert.match(out, /matched on the name/)
})

test('an ambiguous name says how many files it matched', () => {
  // The cost of the fallback, stated in the report rather than hidden. Two
  // files may legitimately hold "the happy path".
  const two = REAL_GREEN.replace('1..1', 'ok 150 - transcribed: the events read refuses unknown filters, so the INERT finding was acted on\n1..2')
  const cmp = compare(parseTap(two), { minPoints: 1, red: ONE_RED }, readSummary(two))
  assert.equal(cmp.fixed[0].nameMatches, 2)
  assert.match(formatReport(cmp, { minPoints: 1, red: ONE_RED }), /matched on the NAME in 2 files/)
})

test('the name fallback does not resurrect a row whose failure merely moved file', () => {
  // The fallback consults PASSING points only. A failure at a new path is
  // still a new failure and the old row is still GONE, which is the property
  // the file-keyed test above asserts and this must not undo.
  const moved = TAP.replace('tools/board/read-filters.test.mjs', 'tools/board/filters.test.mjs')
  const cmp = compare(parseTap(moved), { minPoints: 1, red: ONE_RED }, readSummary(moved))
  assert.equal(cmp.fixed.length, 0)
  assert.equal(cmp.vanished.length, 1)
  assert.equal(cmp.newRed.length, 1)
})

test('a skip with no location is UNRUNNABLE, not GONE', () => {
  // Same absent-location trap in the other verdict: a skip is printed as `ok`
  // and carries no location either, so without the fallback a debt that
  // merely cannot be run here would read as one no longer collected.
  const realSkip = REAL_GREEN.replace(
    'ok 149 - transcribed: the events read refuses unknown filters, so the INERT finding was acted on',
    'ok 149 - transcribed: the events read refuses unknown filters, so the INERT finding was acted on # SKIP no board source on this host')
  const baseline = { minPoints: 1, red: ONE_RED }
  const cmp = compare(parseTap(realSkip), baseline, readSummary(realSkip))
  assert.equal(cmp.unrunnable.length, 1, 'the debt stays open')
  assert.equal(cmp.fixed.length, 0, 'a skip is not a pass')
  assert.equal(cmp.vanished.length, 0)
  assert.match(formatReport(cmp, baseline), /no board source on this host/)
})

test('FIXED on a row that is not a function of the tree still refuses to be a repair', () => {
  // The 2026-11-02 rule, now printed at the point of temptation rather than
  // only in the baseline's header. `tools/doc-model/check.test.mjs` went green
  // on the trunk while its fix was an open pull request, because the content
  // it reads changed under it.
  const row = [{ ...ONE_RED[0], dependsOn: 'repo-content', note: 'x', flipQuery: 'q' }]
  const cmp = compare(parseTap(REAL_GREEN), { minPoints: 1, red: row }, readSummary(REAL_GREEN))
  const out = formatReport(cmp, { minPoints: 1, red: row })
  assert.match(out, /NOT CURRENTLY REPRODUCIBLE/)
  // And a tree-dependent row gets no such caveat, so the warning means something.
  const treeRow = [{ ...ONE_RED[0], dependsOn: 'tree', note: 'x', flipQuery: 'q' }]
  assert.doesNotMatch(formatReport(
    compare(parseTap(REAL_GREEN), { minPoints: 1, red: treeRow }, readSummary(REAL_GREEN)),
    { minPoints: 1, red: treeRow }), /NOT CURRENTLY REPRODUCIBLE/)
})
