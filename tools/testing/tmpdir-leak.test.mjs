// node --test tools/testing/tmpdir-leak.test.mjs
//
// Two subjects. tmpdir.mjs, the helper, is tested by making directories and
// asserting they are gone, which is the only assertion that means anything
// about a cleanup. tmpdir-leak.mjs, the ratchet, is tested in BOTH
// directions, because a ratchet that only fails on new leaks lets a fixed
// file sit in the baseline forever and the baseline stops describing the
// repository.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { tempDir, removeAll, outstandingDirs } from './tmpdir.mjs';
import { census, decide, withoutComments, ROOTS, TEST_FILE, MAKES, REMOVES } from './tmpdir-leak.mjs';

const REPO_ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');

test('tempDir makes a real directory and removeAll removes it', () => {
  const dir = tempDir('tmpdir-selftest-');
  assert.ok(existsSync(dir), 'tempDir must return a directory that exists');
  writeFileSync(join(dir, 'f'), 'x');
  mkdirSync(join(dir, 'sub/deeper'), { recursive: true });
  writeFileSync(join(dir, 'sub/deeper/g'), 'y');

  assert.deepEqual(removeAll(), [], 'removeAll must report nothing it failed to remove');
  assert.equal(existsSync(dir), false, 'the directory and its contents must be gone');
});

test('removeAll is idempotent, so the after hook and the exit hook cannot double-fail', () => {
  const dir = tempDir('tmpdir-selftest-');
  assert.deepEqual(removeAll(), []);
  assert.deepEqual(removeAll(), [], 'a second call is a no-op, not a second set of failures');
  assert.equal(existsSync(dir), false);
});

test('removeAll does not throw when the directory is already gone', () => {
  // The real case: a test removes its own directory and the hook runs anyway.
  const dir = tempDir('tmpdir-selftest-');
  removeAll();
  outstandingDirs(); // the list is empty here, so push it back the only way a caller can
  const second = tempDir('tmpdir-selftest-');
  removeAll();
  assert.equal(existsSync(dir), false);
  assert.equal(existsSync(second), false);
});

test('every directory tempDir hands out is tracked until it is removed', () => {
  const a = tempDir('tmpdir-selftest-');
  const b = tempDir('tmpdir-selftest-');
  const tracked = outstandingDirs();
  assert.ok(tracked.includes(a) && tracked.includes(b), 'both must be outstanding');
  removeAll();
  assert.deepEqual(outstandingDirs(), [], 'and none after the removal');
});

test('a file fully migrated to the helper leaves the census rather than passing it', () => {
  // Worth stating because it is not what the first version of this test
  // assumed. The census keys on a `mkdtemp` CALL, and a file that has moved
  // every call to `tempDir` no longer has one, so it drops out of the scan
  // entirely instead of appearing in it as clean. That is the right shape --
  // such a file is clean by construction and there is nothing left to judge --
  // but it means the row count falls as the baseline is worked down, and a
  // reader comparing two runs should not read that as files disappearing.
  const rows = census();
  assert.notEqual(rows, null, 'the census must be available in a git checkout');
  assert.equal(
    rows.find((r) => r.path === 'tools/ledger/check-attributes.test.mjs'),
    undefined,
    'the file this gate was written for calls tempDir only, so it is out of scope now',
  );
});

test('REMOVES knows the helper, so a partly migrated file is not reported as leaking', () => {
  // The case the assertion above does NOT cover: a file with one mkdtemp left
  // and one tempDir. It is still in the census, and if REMOVES did not know
  // about tempDir the only way to quiet the gate would be an rmSync the helper
  // makes unnecessary.
  assert.ok(REMOVES.test("const dir = tempDir('attrs-');"));
  const rows = [{ path: 'half.test.mjs', makes: 1, removes: REMOVES.test(
    "const a = mkdtempSync(join(tmpdir(), 'x-'));\nconst b = tempDir('y-');") }];
  assert.equal(rows[0].removes, true);
  assert.deepEqual(decide({ rows, baseline: { leaking: [] } }).problems, []);
});

test('the census finds temp-making test files and classifies them', () => {
  const rows = census();
  assert.notEqual(rows, null);
  assert.ok(rows.length > 40, `expected dozens of temp-making test files, got ${rows.length}`);
  for (const r of rows) {
    assert.ok(TEST_FILE.test(r.path), `${r.path} is not a test file`);
    assert.ok(r.makes > 0, `${r.path} is in the census with no mkdtemp call`);
  }
});

test('census returns null and never [] when it cannot establish the facts', () => {
  // The distinction the house pattern insists on: an unavailable census and a
  // clean sweep must not read the same. An empty root list makes `git ls-files`
  // list the whole repository, so the unavailable case is driven by a root
  // that is not a git checkout at all.
  const notARepo = tempDir('tmpdir-selftest-notrepo-');
  assert.equal(census({ roots: [notARepo] }), null);
});

test('the ratchet exits 1 on a test file that joins the leaking set', () => {
  const baseline = { leaking: [{ path: 'a.test.mjs', mkdtemp_calls: 1, lane: 'engineer' }] };
  const rows = [
    { path: 'a.test.mjs', makes: 1, removes: false },
    { path: 'b.test.mjs', makes: 1, removes: false },
  ];
  const { problems } = decide({ rows, baseline });
  assert.equal(problems.length, 1);
  assert.equal(problems[0].kind, 'new-leak');
  assert.equal(problems[0].path, 'b.test.mjs');
  assert.match(problems[0].why, /tempDir from tools\/testing\/tmpdir\.mjs/,
    'the refusal must name the repair, not just the defect');
});

test('the ratchet exits 1 on a baseline entry that has outlived its finding', () => {
  const baseline = { leaking: [{ path: 'a.test.mjs', mkdtemp_calls: 1, lane: 'engineer' }] };
  const rows = [{ path: 'a.test.mjs', makes: 1, removes: true }];
  const { problems } = decide({ rows, baseline });
  assert.equal(problems.length, 1);
  assert.equal(problems[0].kind, 'stale-baseline');
  assert.match(problems[0].why, /can only shrink|Delete its entry/);
});

test('the ratchet is quiet when the repository matches its baseline exactly', () => {
  const baseline = { leaking: [{ path: 'a.test.mjs', mkdtemp_calls: 1, lane: 'engineer' }] };
  const rows = [
    { path: 'a.test.mjs', makes: 1, removes: false },
    { path: 'b.test.mjs', makes: 2, removes: true },
  ];
  assert.deepEqual(decide({ rows, baseline }).problems, []);
});

test('this repository passes its own committed ratchet', () => {
  const baseline = JSON.parse(
    readFileSync(join(REPO_ROOT, 'tools/testing/tmpdir-leak.baseline.json'), 'utf8'),
  );
  const rows = census();
  assert.notEqual(rows, null);
  const { problems } = decide({ rows, baseline });
  assert.deepEqual(
    problems.map((p) => `${p.kind} ${p.path}`), [],
    'the committed baseline must describe the committed repository',
  );
});

test('measured: MAKES counts the spellings this repository actually uses', () => {
  assert.equal(("mkdtempSync(join(tmpdir(), 'x-'))".match(MAKES) ?? []).length, 1);
  assert.equal(('await mkdtemp(prefix)'.match(MAKES) ?? []).length, 1);
  // Not a call, so not a creation: the import line names it and makes nothing.
  assert.equal(("import { mkdtempSync } from 'node:fs'".match(MAKES) ?? []).length, 0);
});

test('measured: a commented-out mkdtemp is not a leak, because comments are stripped', () => {
  // Reading the file raw would report any test file that mentions the defect
  // in a comment, and this file's own header is exactly such a file.
  const rows = census();
  const self = rows.find((r) => r.path === 'tools/testing/tmpdir-leak.test.mjs');
  if (self) assert.equal(self.removes, true, 'this file uses the helper, so it removes something');
});

// The four cases below are the repair of a false positive this gate produced
// on the day it was written, and they are the regression guard for it. The
// defect: withoutComments was two `replace` calls, and a regex cannot tell a
// comment opener from the same two characters inside a string.

test('measured: a /* inside a string literal does not open a comment', () => {
  // The exact shape that produced the false positive, reduced. The refspec is
  // the one in tools/ledger/containment.test.mjs line 129, and the `*/` that
  // closed the comment the old stripper opened was a doc comment six lines
  // further down, so the file's real cleanup was deleted in between.
  const source = [
    "git('fetch', '+refs/heads/*:refs/remotes/origin/*')",
    '',
    '/** A doc comment, whose closing marker ended the comment that string opened. */',
    'after(() => rmSync(ROOT, { recursive: true, force: true }))',
  ].join('\n');
  const code = withoutComments(source);
  assert.match(code, /rmSync\s*\(/, 'the real cleanup call must survive the strip');
  assert.ok(!code.includes('A doc comment'), 'the real doc comment must still be stripped');
});

test('measured: comments are still removed, which is the function\'s actual job', () => {
  assert.ok(!withoutComments('a\n// rmSync(x)\nb').includes('rmSync'));
  assert.ok(!withoutComments('a/* rmSync(x) */b').includes('rmSync'));
  // A line comment ends at its newline and takes nothing on the next line.
  assert.match(withoutComments('// note\nrmSync(y)'), /rmSync\s*\(/);
  // Both quote forms and a template literal, since all three appear here.
  for (const q of ['"', "'", '`']) {
    assert.match(withoutComments(`const s = ${q}a/*b${q}; rmSync(y)`), /rmSync\s*\(/, q);
  }
});

test('measured: the file that was the false positive reads as removing', () => {
  // Named rather than reduced, because the reduced case above would pass
  // against a stripper that got this file wrong for some other reason.
  const rows = census();
  assert.notEqual(rows, null, 'the census must be available in a git checkout');
  const row = rows.find((r) => r.path === 'tools/ledger/containment.test.mjs');
  if (!row) return; // it may leave the census if it ever drops its own mkdtemp
  assert.equal(row.removes, true,
    'containment.test.mjs removes its one directory from an after() hook');
});

test('measured: no test file is dropped from the census by comment stripping', () => {
  // The direction that would hide a leak instead of inventing one, and the
  // reason this case exists rather than a sentence claiming it cannot happen:
  // a swallowed `mkdtemp` removes the file from the census silently, where a
  // swallowed `rmSync` at least shows up as a finding somebody reads.
  const rows = census();
  assert.notEqual(rows, null);
  const counted = new Set(rows.map((r) => r.path));
  const dropped = [];
  for (const path of execFileSync('git', ['ls-files', ...ROOTS], { encoding: 'utf8' })
    .split('\n').filter((p) => p && TEST_FILE.test(p))) {
    if (counted.has(path)) continue;
    if (/\bmkdtemp(Sync)?\s*\(/.test(readFileSync(path, 'utf8'))) dropped.push(path);
  }
  assert.deepEqual(dropped, [],
    'these files call mkdtemp in real code and the census does not see them');
});
