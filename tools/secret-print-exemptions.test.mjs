// Ursa's suite for `tools/secret-print-exemptions.py`, the gate that makes a
// secret-print exemption come due.
//
// Written in JavaScript rather than Python, against a Python tool, for one
// reason: `scripts/ci-checks.mjs` resolves its `tooling-suites` check with
// `git ls-files '*.test.mjs'`, so a suite with this name is run by the
// repository's own gate list the moment it is committed, and a suite in any
// other shape needs a registry entry somebody has to remember to write.
// Finding F75's lesson, applied to a new file instead of discovered in an
// old one.
//
// HOW THE FAILURE MODES ARE EXERCISED. The gate resolves every path it reads
// from its own `__file__`, so a copy of `tools/` and `.github/workflows/`
// under a temporary directory is a complete, mutable instance of the guard.
// Each case copies, edits the copy's baseline, and runs the copy. Nothing
// here edits the real tree, and no case asserts against a mutation of the
// vendored checker, which stays byte-identical in every copy.
import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const GATE = 'tools/secret-print-exemptions.py'
const BASELINE = 'tools/secret-print-baseline.txt'

function run(root, args = []) {
  const out = spawnSync('python3', [path.join(root, GATE), ...args], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
  return { code: out.status, stdout: out.stdout || '', stderr: out.stderr || '' }
}

function json(root, args = []) {
  const got = run(root, ['--json', ...args])
  assert.notEqual(got.code, 2, `gate could not run: ${got.stderr}`)
  return { ...got, report: JSON.parse(got.stdout) }
}

// A copy of the guard and of everything the sweep scans that carries a
// suppressed finding today: `tools/` for the markers and the tooling, and
// `.github/workflows/` for the two baseline entries.
function instance() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ursa-exempt-'))
  fs.cpSync(path.join(ROOT, 'tools'), path.join(dir, 'tools'), { recursive: true })
  fs.cpSync(path.join(ROOT, '.github/workflows'), path.join(dir, '.github/workflows'),
    { recursive: true })
  return dir
}

function baselineOf(dir) {
  return fs.readFileSync(path.join(dir, BASELINE), 'utf8')
}

function writeBaseline(dir, text) {
  fs.writeFileSync(path.join(dir, BASELINE), text)
}

function kinds(report) {
  return report.problems.map((p) => p.kind).sort()
}

test('the tree as committed has every exemption decided and in date', () => {
  const got = json(ROOT)
  assert.equal(got.code, 0, got.stdout)
  assert.equal(got.report.clean, true)
  assert.deepEqual(got.report.problems, [])
})

test('the suppressed set is the difference of two checker runs, and conserves', () => {
  const { report } = json(ROOT)
  // Nothing survives suppression on this tree, so every raw finding is a
  // suppressed one. The identity is what matters: the gate never invents a
  // member and never drops one.
  assert.equal(
    report.findings_unsuppressed,
    report.findings_live + report.suppressed,
    'raw findings must partition into live and suppressed',
  )
  assert.equal(
    report.suppressed,
    report.suppressed_by_baseline + report.suppressed_by_marker,
    'every suppression is either the baseline or a marker',
  )
  assert.ok(report.suppressed > 0, 'a tree with no suppression would not test this gate')
})

test('an entry whose review-by has passed is exit 1 and named expired', () => {
  const got = run(ROOT, ['--today', '2027-02-16'])
  assert.equal(got.code, 1)
  assert.match(got.stdout, /EXPIRED/)
  assert.match(got.stdout, /review-by was 2027-02-15/)

  // Off by one, asked per entry rather than on the whole run's exit status.
  // By either of these dates the two test exemptions dated 2026-12-15 are
  // long expired, so the run is red on both days and its exit code cannot
  // answer this. What can: whether the Actions entries are among the
  // expired ones.
  const expiredBaseline = (day) => json(ROOT, ['--today', day]).report.problems
    .filter((p) => p.kind === 'expired' && p.what.includes('add-mask'))
  assert.equal(expiredBaseline('2027-02-15').length, 0, 'in date on the day itself')
  assert.equal(expiredBaseline('2027-02-16').length, 1, 'due the day after')
})

test('the day a test exemption falls due is the day the gate goes red', () => {
  assert.equal(run(ROOT, ['--today', '2026-12-15']).code, 0)
  const got = run(ROOT, ['--today', '2026-12-16'])
  assert.equal(got.code, 1)
  assert.match(got.stdout, /EXPECTED_ABSENT_FIXTURES/)
})

test('an entry with no review-by above it is undecided, not inherited', () => {
  const dir = instance()
  // Append a second entry directly under a dated one. If the date were read
  // as covering a block, this would pass on somebody else's argument.
  writeBaseline(dir, baselineOf(dir)
    + '.github/workflows/agent-*.yml | X5-PRINT | echo "a line nobody dated"\n')
  const { code, report } = json(dir)
  assert.equal(code, 1)
  assert.ok(kinds(report).includes('undecided'), JSON.stringify(report.problems))
  const p = report.problems.find((x) => x.kind === 'undecided')
  assert.match(p.why, /review-by/)
  assert.match(p.what, /a line nobody dated/)
})

test('an entry that accounts for nothing is stale, even while in date', () => {
  const dir = instance()
  writeBaseline(dir, baselineOf(dir)
    + '# review-by: 2099-01-01\n'
    + 'tools/nothing-here.sh | X5-PRINT | echo "$EXO_TOKEN"\n')
  const { code, report } = json(dir)
  assert.equal(code, 1)
  const p = report.problems.find((x) => x.kind === 'stale')
  assert.ok(p, JSON.stringify(report.problems))
  assert.match(p.what, /tools\/nothing-here\.sh/)
  // A date far in the future does not rescue it: staleness is the other
  // direction and is decided first.
  assert.match(p.why, /accounts for no suppressed finding/)
})

test('a specimen declaration that covers nothing is stale too', () => {
  const dir = instance()
  writeBaseline(dir, baselineOf(dir)
    + '# specimen-file: tools/not-a-corpus.py | invented for this test\n')
  const { code, report } = json(dir)
  assert.equal(code, 1)
  const p = report.problems.find(
    (x) => x.kind === 'stale' && x.what.includes('not-a-corpus'))
  assert.ok(p, JSON.stringify(report.problems))
  assert.match(p.why, /outlived its subject/)
})

test('a marker in an undeclared file is undecided, which is the silent case', () => {
  const dir = instance()
  // Drop every specimen declaration. All marker suppressions are then
  // suppressed by something nothing has argued for, which is exactly what
  // this gate exists to refuse.
  //
  // Asserted against the report's own `suppressed_by_marker` rather than
  // against a literal count and a literal path. It was `10` and
  // `tools/tests/test_secret_print.py` until 2026-11-09, which made this
  // test a census of the tree on the day it was written: declaring a second
  // specimen file correctly, which is the supported way to use this
  // mechanism, took the count to 11 and failed the gate's own suite. A test
  // that breaks when the rule is obeyed is testing the wrong thing. The rule
  // is "a marker outside a declared file is undecided", so the set of
  // undecided problems has to be exactly the set of marker suppressions.
  writeBaseline(dir, baselineOf(dir)
    .split('\n')
    .filter((l) => !l.startsWith('# specimen-file:'))
    .join('\n'))
  const { code, report } = json(dir)
  assert.equal(code, 1)
  const undecided = report.problems.filter((x) => x.kind === 'undecided')
  assert.ok(report.suppressed_by_marker > 0, 'there is a marker to be undecided about')
  assert.equal(undecided.length, report.suppressed_by_marker,
    'every marker suppression goes red once no file is declared')
  for (const p of undecided) {
    assert.match(p.why, /declare the file/)
  }
})

test('the gate refuses rather than passes when it and HQ read different entries', () => {
  const dir = instance()
  // An entry whose text contains a `|`. HQ's loader splits on the first two
  // separators only and keeps the rest as the source text; a stricter parser
  // here would drop it, and a dropped entry is an undated exemption no rule
  // in this gate ever looks at. The set-equality check is what catches that,
  // so this asserts the parsers agree rather than that the entry is clean.
  writeBaseline(dir, baselineOf(dir)
    + '# review-by: 2099-01-01\n'
    + 'tools/x.sh | X5-PRINT | echo "$T" | tee /dev/null\n')
  const got = run(dir, ['--json'])
  assert.notEqual(got.code, 2, `parsers disagreed: ${got.stderr}`)
  const report = JSON.parse(got.stdout)
  assert.equal(report.baseline_entries, 3)
})

test('a baseline the vendored loader cannot read is exit 2, not exit 0', () => {
  const dir = instance()
  fs.rmSync(path.join(dir, BASELINE))
  const got = run(dir)
  assert.equal(got.code, 2, got.stdout)
})

test('an EXPECTED_ABSENT_FIXTURES that stops being a dict is exit 2', () => {
  const dir = instance()
  const p = path.join(dir, 'tools/secret-print-tests.py')
  fs.writeFileSync(path.join(dir, 'tools/secret-print-tests.py'),
    fs.readFileSync(p, 'utf8').replace('EXPECTED_ABSENT_FIXTURES = {',
      'EXPECTED_ABSENT_FIXTURES = []\n_UNUSED = {'))
  const got = run(dir)
  assert.equal(got.code, 2, got.stdout)
  assert.match(got.stderr, /will not pretend to/)
})

test('--today rejects a non-date rather than falling back to now', () => {
  const got = run(ROOT, ['--today', 'soon'])
  assert.equal(got.code, 2)
  assert.match(got.stderr, /not a date/)
})
