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
  readSummary, BASELINE_PATH, SUITE_GLOB, SUITE_ROOT
} from './suite-baseline.mjs'

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
  assert.equal(toRepoPath('/repo/tools/a.test.mjs', '/repo'), 'tools/a.test.mjs')
})

// THE WORKTREE CASE, which is the defect that running the tool found and
// reading it did not. Measuring `main` in the clone and a branch in a
// worktree at /tmp/wt699, then comparing both to one baseline, produced four
// NEW_RED and four GONE for four failures that had not moved. Rehearsed red:
// with stage 2 of `toRepoPath` removed, this test fails and the two below it
// keep passing, because they never leave the root.
test('a test file measured in another checkout normalises to the same key', () => {
  assert.equal(
    toRepoPath('/tmp/wt699/tools/board/read-filters.test.mjs', '/repo'),
    'tools/board/read-filters.test.mjs'
  )
  // And the identity that matters is the key, not the string.
  const here = { file: toRepoPath('/repo/tools/a.test.mjs', '/repo'), name: 'x' }
  const there = { file: toRepoPath('/tmp/wt/tools/a.test.mjs', '/repo'), name: 'x' }
  assert.equal(keyOf(here), keyOf(there))
})

test('a path outside the suite root is left alone rather than given a false form', () => {
  // `relative('/repo', '/elsewhere/x')` is `../elsewhere/x`, which names no
  // file in this repository, and there is no suite root to anchor on either.
  assert.equal(toRepoPath('/elsewhere/x.test.mjs', '/repo'), '/elsewhere/x.test.mjs')
  assert.equal(toRepoPath('tools/a.test.mjs', '/repo'), 'tools/a.test.mjs')
  assert.equal(SUITE_ROOT, 'tools', 'the anchor is read off the glob, not written twice')
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
  const cmp = compare(parseTap(TAP), { minPoints: 1, red: ONE_RED })
  assert.equal(cmp.newRed.length, 0)
  assert.equal(cmp.stillRed.length, 1)
  assert.equal(cmp.stillRed[0].owner, 'security')
  assert.equal(exitCodeFor(cmp, { minPoints: 1, red: ONE_RED }), 0,
    "the trunk's own debt must not block a seat that did not incur it")
})

test('an unrecorded failure is NEW_RED and blocks', () => {
  const baseline = { minPoints: 1, red: [] }
  const cmp = compare(parseTap(TAP), baseline)
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
  const cmp = compare(parseTap(shifted), { minPoints: 1, red: ONE_RED })
  assert.equal(cmp.stillRed.length, 1, 'a renumbered run must not turn a known red into a new one')
  assert.equal(cmp.newRed.length, 0)
})

test('one test file renamed is not the same test, because the key carries the file', () => {
  const moved = TAP.replace('tools/board/read-filters.test.mjs', 'tools/board/filters.test.mjs')
  const cmp = compare(parseTap(moved), { minPoints: 1, red: ONE_RED })
  assert.equal(cmp.newRed.length, 1, 'a failure at a new path is a new failure until somebody says otherwise')
  assert.equal(cmp.vanished.length, 1, 'and the old entry is GONE, not FIXED')
  assert.equal(cmp.fixed.length, 0)
})

test('a baseline entry that now passes is FIXED, and says so without blocking', () => {
  const green = TAP.replace('not ok 149 -', 'ok 149 -')
  const baseline = { minPoints: 1, red: ONE_RED }
  const cmp = compare(parseTap(green), baseline)
  assert.equal(cmp.fixed.length, 1)
  assert.equal(cmp.newRed.length, 0)
  assert.equal(exitCodeFor(cmp, baseline), 0)
  assert.match(formatReport(cmp, baseline), /FIXED {2}1/)
})

// THE POSITIVE CONTROL. An absence is a measurement and needs one.
test('a run that collected nothing is refused, not reported as green', () => {
  const baseline = { minPoints: 380, red: [] }
  const cmp = compare(parseTap('TAP version 13\n1..0\n# tests 0\n'), baseline)
  assert.equal(cmp.newRed.length, 0, 'zero tests really does yield zero failures')
  assert.equal(exitCodeFor(cmp, baseline), 2, 'and that must not be an exit of 0')
})

test('the MODULE_NOT_FOUND shape — one failing point for a bare directory — is refused too', () => {
  // This is verbatim what `node --test tools/` produces: a single point
  // named after the directory. Counting red alone calls it "1 failure";
  // the floor calls it what it is, a suite that never ran.
  const baseline = { minPoints: 380, red: [] }
  const dirRun = 'TAP version 13\nnot ok 1 - tools\n  ---\n  error: |-\n    test failed\n  ...\n1..1\n# tests 1\n# fail 1\n'
  const cmp = compare(parseTap(dirRun), baseline)
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
  const cmp = compare(parseTap(nested), { minPoints: 1, red: [] })
  const names = cmp.newRed.map((p) => p.name)
  assert.ok(names.includes('the inner one that actually broke'), 'the nested failure must not hide')
  assert.equal(cmp.newRed.length, 2, 'the suite point and the inner test are two distinct failures')
  assert.equal(cmp.points, 1, 'but only one of them is a top-level point')
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
  }
  // The glob is the contract with the invocation traps in the header.
  assert.equal(SUITE_GLOB, 'tools/**/*.test.mjs')
})
