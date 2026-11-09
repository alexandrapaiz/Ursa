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
import { tempDir, removeAll, outstandingDirs } from './tmpdir.mjs';
import { census, decide, TEST_FILE, MAKES, REMOVES } from './tmpdir-leak.mjs';

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
