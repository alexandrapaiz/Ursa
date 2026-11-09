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

// `spawnSync` reports two classes of outcome through two different channels,
// and only one of them is an exit status. A process that RAN and refused sets
// `status` to 2, which is the channel every case below reads. A process that
// never ran, or that was killed, sets `status` to null and puts the cause in
// `error`: ENOENT when `python3` is not on the path, ENOBUFS when the gate's
// output passes `maxBuffer`, and a signal name when something killed it.
//
// Added 2026-11-09 by Ursa's security seat, measured. This helper read only
// `status`, so the whole second channel was dropped, and the drop landed
// inside the one guard written to catch it: `json()`'s
// `assert.notEqual(got.code, 2, 'gate could not run')` compares null against
// 2, which passes. The case then reached `JSON.parse('')` and the suite's
// report for an absent interpreter was `Unexpected end of JSON input`. The
// interpolated `got.stderr` was `undefined` in that case too, so even had
// the guard fired it would have named nothing.
//
// Why that is a security defect and not a tidiness one. This suite is the
// only thing asserting that `tools/secret-print-exemptions.py` makes a
// secret-print exemption come due. An environment where it cannot run must
// say so in those words, because a guard suite that fails with a JSON parse
// error reads as a broken test, and the ordinary response to a broken test
// nobody can reproduce is to skip it — which retires the staleness gate over
// every secret-print exemption without one line saying that is what happened.
// Finding F110 of the run before this one was the same shape one layer down:
// an exemption whose premise nothing read.
//
// The vendored side already does this correctly, which is what made the
// omission visible. `run_checker` in the gate itself raises `CannotRun` on
// both a refusing exit status and an unparseable document. Only the
// JavaScript helper trusted the status alone.
function run(root, args = [], opts = {}) {
  const interpreter = opts.interpreter || 'python3'
  const out = spawnSync(interpreter, [path.join(root, GATE), ...args], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: opts.maxBuffer || 32 * 1024 * 1024,
  })
  if (out.error || out.status === null) {
    const why = out.error ? `${out.error.code || out.error.name}: ${out.error.message}`
      : `killed by ${out.signal}`
    throw new Error(
      `the gate could not run (${interpreter} ${GATE}): ${why}. `
      + 'This is not a verdict about the exemptions; it is the suite being '
      + 'unable to ask. Do not skip or exempt this case on it.',
    )
  }
  return { code: out.status, stdout: out.stdout || '', stderr: out.stderr || '' }
}

function json(root, args = [], opts = {}) {
  const got = run(root, ['--json', ...args], opts)
  assert.notEqual(got.code, 2, `gate refused to run: ${got.stderr}`)
  return { ...got, report: JSON.parse(got.stdout) }
}

// A copy of the guard and of everything the sweep scans that carries a
// suppressed finding today: `tools/` for the markers and the tooling, and
// `.github/workflows/` for the two baseline entries.
// Every instance is removed when the process exits, and the prefix carries
// this process's pid.
//
// Both halves were added 2026-11-09 by Ursa's security seat, measured. There
// are 17 calls to `instance()` in this file and nothing deleted any of them,
// so each run of this suite left about 49 MB under `os.tmpdir()` for good.
// `node tools/seat/env-facts.mjs` carries two facts that make that expensive
// rather than untidy. `bootstrap-allocates-and-a-full-disk-is-silent`: every
// repair in a seat's bootstrap acquires something, so on a full disk the
// clone stays shallow and no error names the disk. And `tmp-is-shared-
// between-seats`: `/tmp` is one filesystem for every seat on this host, so
// the cost is not paid by the run that leaked it.
//
// This host was at 97 per cent with 1.5 GB free while that was measured, and
// the tasks filesystem of the run doing the measuring filled and started
// losing command output mid-sweep.
//
// The pid is in the prefix for the second fact rather than the first. A bare
// `ursa-exempt-` glob is every concurrent seat's path too, so a cleanup
// written for this suite reaches another run's live instance. The run that
// measured this did exactly that, with `rm -rf /tmp/ursa-exempt-*`, before
// noticing that the prefix it was clearing was not only its own.
const INSTANCES = []
process.on('exit', () => {
  for (const dir of INSTANCES) {
    try {
      fs.rmSync(dir, { recursive: true, force: true })
    } catch {
      // A teardown that throws would report a disk fault as a test failure.
    }
  }
})

function instance() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `ursa-exempt-${process.pid}-`))
  INSTANCES.push(dir)
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

// ---------------------------------------------------------------------------
// THE THIRD DIRECTION: a marker that suppresses nothing.
//
// The two cases above walk the suppressed set, and that is why neither of
// them can reach this one. A marker suppressing nothing produces no
// suppressed finding, so there is no member to arrive at; it has to be
// enumerated from the tree. Ursa's exo seat named the shape on 2026-11-09
// after hitting all three directions in its own gate as three unrelated
// accidents, and the run before this one wrote five markers of which one
// suppressed anything and removed the other four by hand.
//
// `fixture()` writes a file under the instance's `tools/`, which the sweep
// picks up by suffix, so these cases exercise an ordinary scanned file rather
// than a declared specimen.

function fixture(dir, name, lines) {
  fs.writeFileSync(path.join(dir, 'tools', name), lines.join('\n') + '\n')
}

const IDIOM = 'echo "$EXO_TOKEN"'

test('a claim that suppresses nothing is inert, and inert is exit 1', () => {
  const dir = instance()
  fixture(dir, 'inert-case.sh', [
    '# L-X5-ALLOW: written for a line that has since been fixed',
    'echo "nothing here trips the scan"',
  ])
  const { code, report } = json(dir)
  assert.equal(code, 1)
  const p = report.problems.find(
    (x) => x.kind === 'inert' && x.where.includes('inert-case.sh'))
  assert.ok(p, JSON.stringify(report.problems))
  assert.match(p.why, /standing permission with nothing under it/)
})

test('the same marker over a line that does trip is not inert', () => {
  // The control for the case above, and the half that matters: a file
  // listing only what is broken cannot tell a fix from a deletion. One
  // character of difference in the line below the marker decides it.
  //
  // It is not clean either, and that is the pre-existing direction rather
  // than this one: a marker that suppresses in an undeclared file is
  // `undecided`. The two verdicts partition the undeclared case, which is
  // what makes `inert` the only state that surface could not already see.
  const dir = instance()
  fixture(dir, 'live-case.sh', [
    '# L-X5-ALLOW: the shape this file is about',
    IDIOM,
  ])
  const { report } = json(dir)
  const mine = report.problems.filter((x) => x.where.includes('live-case.sh'))
  assert.equal(mine.length, 1, got_stdout(report))
  assert.equal(mine[0].kind, 'undecided')
  assert.ok(report.markers_live > 0)
})

function got_stdout(report) {
  return JSON.stringify(report.problems, null, 2)
}

test('a marker that suppresses with no reason is counted, not a verdict', () => {
  // The checker honours a bare marker, and line 137 of the checker documents
  // the marker as carrying "a reason". This is the distance between the two.
  //
  // It is a count and not a red, and the gate's own comment says why: in an
  // undeclared file `undecided` already fires, and in a declared one the red
  // could not be cleared without editing HQ's vendored suite. So what this
  // asserts is that the gap is visible and attributed to the right surface.
  const dir = instance()
  const before = json(dir).report.markers_reasonless_live
  fixture(dir, 'reasonless-case.sh', [
    '# L-X5-ALLOW',
    IDIOM,
  ])
  const { report } = json(dir)
  assert.equal(report.markers_reasonless_live, before + 1)
  const mine = report.problems.filter(
    (x) => x.where.includes('reasonless-case.sh'))
  assert.equal(mine.length, 1, got_stdout(report))
  assert.equal(mine[0].kind, 'undecided', 'the pre-existing direction, not a new one')
})

test('a line that only names the token is counted and never red', () => {
  // The population this gate must NOT go red on. The checker's marker test
  // is `re.compile(r"L-X5-ALLOW")`, a bare substring, so prose describing
  // the marker is a marker to it -- including the checker's own source and
  // this gate's own docstring. Going red on these would require that no file
  // in the repository explain how the mechanism works. The repair is to
  // narrow the regex upstream, so here it is a count that moves.
  const dir = instance()
  const before = json(dir).report.markers_incidental
  fixture(dir, 'mention-case.sh', [
    '# the marker token this guard honours is spelled L-X5-ALLOW',
    'echo "nothing here trips the scan"',
  ])
  const { code, report } = json(dir)
  assert.equal(code, 0, got_stdout(report))
  assert.equal(report.markers_incidental, before + 1,
    'an incidental marker is counted')
  assert.equal(
    report.problems.filter((x) => x.where.includes('mention-case.sh')).length, 0,
    'and it is not a problem',
  )
})

test('an incidental mention still suppresses, which is why it is counted', () => {
  // Proof that the count is not cosmetic. The mention is identical in both
  // files; only the line below it differs. In the second the comment clears a
  // real finding that nobody decided to clear, which is what makes the
  // bare-substring test worth reporting upstream rather than tolerating.
  const dir = instance()
  fixture(dir, 'mention-harmless.sh', [
    '# the token is spelled L-X5-ALLOW',
    'echo "nothing here trips the scan"',
  ])
  assert.equal(json(dir).code, 0)
  fixture(dir, 'mention-covering.sh', [
    '# the token is spelled L-X5-ALLOW',
    IDIOM,
  ])
  const { report } = json(dir)
  // It suppressed a finding, so it is live rather than incidental, and a
  // suppression in an undeclared file is `undecided`. The point of the case
  // is the comparison: the same comment text is silent over one line and
  // clears a real finding over the other, and nobody decided either.
  assert.equal(
    report.problems.filter((x) => x.where.includes('mention-harmless.sh')).length,
    0, 'the harmless one stays silent')
  const p = report.problems.find(
    (x) => x.kind === 'undecided' && x.where.includes('mention-covering.sh'))
  assert.ok(p, got_stdout(report))
  assert.ok(report.markers_reasonless_live > 0,
    'and it is counted as suppressing with no reason written on it')
})

test('markers inside a declared specimen file are the declaration\'s business', () => {
  // HQ's vendored suite carries markers that suppress nothing, because a
  // fixture table is marked row by row and only some rows trip the scan.
  // Those are not defects and the file's first line reads "do not edit
  // here". The declaration is the unit of decision for such a file, and it
  // has its own liveness check two cases up.
  const { report } = json(ROOT)
  assert.ok(report.markers_inert > 0, 'the tree has inert markers today')
  assert.equal(report.problems.length, 0,
    'and none of them is a problem, because every one is in a declared file')
  for (const f of report.specimen_files) {
    assert.equal(report.problems.filter((p) => p.where.startsWith(f)).length, 0)
  }
})

test('two markers covering one finding leave neither of them inert', () => {
  // Why attribution restores one marker at a time instead of deleting one at
  // a time. Deleting leaves the other marker standing, so both read as
  // suppressing nothing and the gate demands both be deleted -- which would
  // un-suppress the line. Adding one at a time makes each verdict
  // independent of every other marker in the file.
  const dir = instance()
  fixture(dir, 'double-case.sh', [
    '# L-X5-ALLOW: the marker above the line',
    IDIOM + '  # L-X5-ALLOW: and the marker on it',
  ])
  const { report } = json(dir)
  const mine = report.problems.filter((x) => x.where.includes('double-case.sh'))
  assert.equal(mine.filter((x) => x.kind === 'inert').length, 0,
    'neither marker is inert, though deleting one at a time would say both are')
  // Both markers are live, so the file's only verdict is the undeclared one,
  // and there is one of it because there is one suppressed finding.
  assert.deepEqual(mine.map((x) => x.kind), ['undecided'], got_stdout(report))
})

test('the marker census conserves, so a marker cannot go uncounted', () => {
  const { report } = json(ROOT)
  assert.equal(report.markers, report.markers_live + report.markers_inert,
    'every marker line is either suppressing or not')
  assert.ok(report.markers_incidental <= report.markers_inert,
    'an incidental marker is a kind of inert one')
  assert.ok(report.markers > 0, 'a tree with no markers would not test this')
})

// ---------------------------------------------------------------------------
// THE FOURTH DIRECTION: an exemption whose premise has gone false.
//
// The three directions above are all about an exemption's SUBJECT. Undecided,
// expired, stale and inert each ask whether the thing the exemption was
// written over is still there. This one asks a different question, and the
// surface it asks it on is the one surface where the exemption is not keyed
// on the tree at all.
//
// `EXPECTED_ABSENT_FIXTURES` is keyed on a test NAME, and its reason is a
// claim that a path does not exist. Nothing read the claim until 2026-11-09.
// Measured that day, before the repair: a file created at
// `standards/lessons.md` made the exempted test fail for a reason that was
// not absence, `tools/secret-print-tests.py` printed `2 exempt as absent
// fixtures, 0 unexpected` and then `the vendored checker passes every test
// that is about the checker`, and exited 0. This gate was green beside it,
// because the only direction it read on that surface was the `review_by`
// date, which was a month away.
//
// The NOW GREEN check in the runner does not cover it. That fires when an
// exempted test starts PASSING, so it catches the fixture arriving clean and
// cannot catch the fixture arriving broken. For the first of the two entries
// that is the serious case: `tools/check-actions-reach.sh` is the standing
// false-positive reference for all four safe shapes at once, so if Ursa
// vendors it and it genuinely prints a value, the test goes red for exactly
// the reason the suite exists and the runner calls it an absent fixture.
//
// `standards/lessons.md` is used as the fixture here rather than the other
// entry's path, because it sits outside `tools/` and `.github/workflows/` and
// so is not on the sweep's file list. The case therefore moves the premise
// and nothing else.

function claimedAbsent(dir, rel) {
  fs.mkdirSync(path.join(dir, path.dirname(rel)), { recursive: true })
  fs.writeFileSync(path.join(dir, rel),
    '# Lessons\n\nA placeholder register with no idiom in it.\n')
}

test('an exemption whose claimed-absent path now exists is stale', () => {
  // One gate run per case, deliberately. Finding F108 of 2026-11-09 is that
  // this suite already takes 4m27s for 20 cases, so the "copy is green
  // first" pre-check that belongs here is left to the committed-tree case
  // above rather than paid for twice.
  const dir = instance()
  claimedAbsent(dir, 'standards/lessons.md')
  const { code, report } = json(dir)
  assert.equal(code, 1)
  const p = report.problems.find(
    (x) => x.kind === 'stale' && x.what.includes('EXPECTED_ABSENT_FIXTURES'))
  assert.ok(p, JSON.stringify(report.problems))
  assert.match(p.why, /standards\/lessons\.md exists/)
  // Stale and not expired. The date is still in the future, which is exactly
  // why the date direction could not reach this.
  assert.equal(report.problems.filter((x) => x.kind === 'expired').length, 0)
})

test('an exemption that names no absent_path is undecided, not trusted', () => {
  const dir = instance()
  const p = path.join(dir, 'tools', 'secret-print-tests.py')
  // Drop the key from both entries without touching anything else, which is
  // what an edit to this dict that forgets the premise would look like.
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8')
    .replace(/^\s*"absent_path": .*$/gm, ''))
  const { code, report } = json(dir)
  assert.equal(code, 1)
  const mine = report.problems.filter(
    (x) => x.kind === 'undecided' && x.what.includes('EXPECTED_ABSENT_FIXTURES'))
  assert.equal(mine.length, 2, JSON.stringify(report.problems))
  assert.match(mine[0].why, /cannot be read/)
})

// The runner is the thing that actually absorbed the failure, so it is
// asserted directly rather than through the gate that reads it. Its
// `premise_failures()` is called instead of running all 74 vendored tests,
// because the classification is the subject and the suite takes 40 seconds.
function premiseFailures(dir) {
  const out = spawnSync('python3', ['-c', [
    'import importlib.util, json, sys',
    'spec = importlib.util.spec_from_file_location("w", sys.argv[1])',
    'm = importlib.util.module_from_spec(spec)',
    'spec.loader.exec_module(m)',
    'print(json.dumps(m.premise_failures()))',
  ].join('\n'), path.join(dir, 'tools', 'secret-print-tests.py')],
  { cwd: dir, encoding: 'utf8' })
  assert.equal(out.status, 0, out.stderr)
  return JSON.parse(out.stdout)
}

test('the runner reads its premise off the filesystem, both ways', () => {
  const dir = instance()
  assert.deepEqual(premiseFailures(dir), [],
    'both fixtures are absent in a fresh copy, so both exemptions apply')
  claimedAbsent(dir, 'standards/lessons.md')
  const got = premiseFailures(dir)
  assert.equal(got.length, 1, JSON.stringify(got))
  assert.match(got[0][0], /test_the_register_is_still_scannable/)
  assert.match(got[0][1], /standards\/lessons\.md exists/)
})

test('the two entries name paths, and this tree really lacks both', () => {
  // The exemptions are only honest while this holds, and if a later run
  // vendors either fixture it should find this case red rather than discover
  // the entry by reading it.
  const got = premiseFailures(ROOT)
  assert.deepEqual(got, [], JSON.stringify(got))
})

// THE SUITE'S OWN INABILITY TO RUN, ASSERTED RATHER THAN RECOMMENDED
//
// Three cases, added 2026-11-09 by Ursa's security seat. Each drives `run()`
// into one of `spawnSync`'s non-status outcomes and asserts the suite says
// which one, in words naming the gate. The third is the one that was leaking:
// it goes through `json()`, which is where the old guard lived.

test('an interpreter that is not there is named, not parsed as a verdict', () => {
  assert.throws(
    () => run(ROOT, [], { interpreter: 'python3-not-installed-here' }),
    (err) => {
      assert.match(err.message, /could not run/)
      assert.match(err.message, /ENOENT/)
      assert.match(err.message, /secret-print-exemptions\.py/)
      assert.ok(!/Unexpected end of JSON/.test(err.message),
        'the old report for this case was a JSON parse error')
      return true
    },
  )
})

test('output past maxBuffer is a refusal to answer, not a truncated answer', () => {
  // The gate prints a multi-line verdict, so 8 bytes cannot hold it. ENOBUFS
  // leaves `stdout` populated but cut, which is the dangerous shape: the
  // bytes look like an answer.
  assert.throws(
    () => run(ROOT, [], { maxBuffer: 8 }),
    (err) => {
      assert.match(err.message, /could not run/)
      assert.match(err.message, /ENOBUFS/)
      return true
    },
  )
})

test('the json path refuses too, which is where the old guard let it through', () => {
  // `assert.notEqual(got.code, 2)` was the guard, and a process that never
  // ran has `code === null`, so it passed on every one of these inputs.
  assert.throws(
    () => json(ROOT, [], { interpreter: 'python3-not-installed-here' }),
    /could not run/,
  )
  // The healthy path is NOT re-asserted here. `json(ROOT)` is the suite's
  // first case already, and a second copy would cost a full 12.93s gate
  // invocation to learn nothing. Run 8 dropped a redundant pre-check for the
  // same reason, and F114 of run 9 is the measurement that reason rests on.
})
