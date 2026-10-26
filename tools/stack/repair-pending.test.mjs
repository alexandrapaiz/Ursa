// Tests for the repair-pending gate.
//
// Every fixture drives `assess` with a fake `read` and a fake `mergeBase`,
// because the subject of this tool is the relation between three refs and a
// fixture built out of real commits would hide which of the three a wrong
// class came from. The last test runs against this repository's real queue,
// since a gate that passes on fixtures and cannot read the real `main` has
// been tested on the wrong file — that is the mistake `block-kinds.mjs`'s
// header records costing weeks of red.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assess, classify, countAt, occurrences, REPAIRING, git } from './repair-pending.mjs';

const DEAD = 'INC-2026-10-25-x';

/** A tree keyed `ref:path`; a missing key is a missing file, which is the
 *  distinction `file-gone` turns on and so cannot be faked with ''. */
function reader(tree) {
  return (ref, path) => (Object.prototype.hasOwnProperty.call(tree, `${ref}:${path}`) ? tree[`${ref}:${path}`] : null);
}

const head = (number, extra = {}) => ({ number, ref: `refs/prs/${number}`, isDraft: false, ...extra });

test('occurrences counts a literal, non-overlapping, and never compiles it', () => {
  assert.equal(occurrences('a-b-c a-b-c', 'a-b-c'), 2);
  assert.equal(occurrences('aaa', 'aa'), 1, 'non-overlapping');
  // The strings this tool is pointed at are identifiers full of `-` and `.`.
  // A regexp implementation would match 'axbxc' here.
  assert.equal(occurrences('axbxc', 'a.b.c'), 0);
  assert.equal(occurrences('anything', ''), 0);
});

test('countAt returns null for a missing path and a number for a present one', () => {
  const read = reader({ 'r:f.md': `${DEAD}\n${DEAD}\n` });
  assert.equal(countAt('r', 'f.md', DEAD, read), 2);
  assert.equal(countAt('r', 'gone.md', DEAD, read), null);
});

test('classify: a head that removed the string is repaired', () => {
  assert.equal(classify({ forkCount: 2, headCount: 0 }), 'repaired');
});

test('classify: a head that never had the string is stale-root, not repaired', () => {
  // The whole reason this tool compares against the merge-base. Both pairs
  // read `headCount: 0`; only one of them is a fix.
  assert.equal(classify({ forkCount: 0, headCount: 0 }), 'stale-root');
  assert.notEqual(classify({ forkCount: 0, headCount: 0 }), classify({ forkCount: 2, headCount: 0 }));
  assert.ok(!REPAIRING.has('stale-root'));
});

test('classify: a deleted file is not an edit', () => {
  assert.equal(classify({ forkCount: 2, headCount: null }), 'file-gone');
  assert.ok(!REPAIRING.has('file-gone'));
});

test('classify: half a repair is partial, and partial still counts as repairing', () => {
  assert.equal(classify({ forkCount: 2, headCount: 1 }), 'partial');
  assert.ok(REPAIRING.has('partial'), 'a merge of it removes one occurrence, so it is not a dangling citation');
});

test('classify: a head that merely inherits the string is unchanged', () => {
  assert.equal(classify({ forkCount: 2, headCount: 2 }), 'unchanged');
  assert.equal(classify({ forkCount: 2, headCount: 3 }), 'unchanged', 'more than the fork is still not a repair');
});

test('classify: an unreachable merge-base cannot manufacture a repair', () => {
  // mergeBase() returned null, so forkCount is null. Calling that `repaired`
  // would be the shallow-clone failure mode (runner-facts §9) wearing a
  // different hat: an instrument whose missing input reads as good news.
  assert.equal(classify({ forkCount: null, headCount: 0 }), 'stale-root');
  assert.equal(classify({ forkCount: null, headCount: 1 }), 'unchanged');
});

test('assess: the draft flag changes no verdict, which is the correction this tool exists for', () => {
  const tree = {
    'main:f.md': `${DEAD}\n${DEAD}\n`,
    'mb:f.md': `${DEAD}\n${DEAD}\n`,
    'refs/prs/1:f.md': 'clean\n',
  };
  const run = (isDraft) => assess({
    base: 'main', paths: ['f.md'], text: DEAD,
    heads: [head(1, { isDraft })], read: reader(tree), mergeBase: () => 'mb',
  });
  const asDraft = run(true);
  const asReady = run(false);
  assert.equal(asDraft[0].verdict, 'pending');
  assert.equal(asReady[0].verdict, 'pending');
  assert.deepEqual(asDraft[0].repairedBy, asReady[0].repairedBy);
  assert.equal(asDraft[0].heads[0].klass, asReady[0].heads[0].klass);
});

test('assess: stale-root heads do not make an unrepaired citation look pending', () => {
  const tree = {
    'main:f.md': `${DEAD}\n`,
    // Both heads forked before the string existed and both read zero.
    'old:f.md': 'nothing here\n',
    'refs/prs/7:f.md': 'nothing here\n',
    'refs/prs/8:f.md': 'nothing here\n',
  };
  const got = assess({
    base: 'main', paths: ['f.md'], text: DEAD,
    heads: [head(7), head(8)], read: reader(tree), mergeBase: () => 'old',
  });
  assert.equal(got[0].verdict, 'unrepaired', 'two heads reading zero, zero repairs');
  assert.deepEqual(got[0].repairedBy, []);
  assert.deepEqual(got[0].heads.map((h) => h.klass), ['stale-root', 'stale-root']);
});

test('assess: one real repair among stale-root heads is still pending, and names only the real one', () => {
  const tree = {
    'main:f.md': `${DEAD}\n${DEAD}\n`,
    'old:f.md': '',
    'recent:f.md': `${DEAD}\n${DEAD}\n`,
    'refs/prs/447:f.md': '',
    'refs/prs/511:f.md': 'fixed\n',
  };
  const got = assess({
    base: 'main', paths: ['f.md'], text: DEAD,
    heads: [head(447), head(511)], read: reader(tree),
    mergeBase: (_b, h) => (h === 'refs/prs/447' ? 'old' : 'recent'),
  });
  assert.equal(got[0].verdict, 'pending');
  assert.deepEqual(got[0].repairedBy, [511], 'the stale-root head is not credited');
});

test('assess: a string absent from the base yields no finding at all', () => {
  const got = assess({
    base: 'main', paths: ['f.md'], text: DEAD,
    heads: [head(1)], read: reader({ 'main:f.md': 'clean\n' }), mergeBase: () => 'mb',
  });
  assert.deepEqual(got, [], 'nothing on the base is nothing to repair');
});

test('assess: a path missing from the base is skipped, not reported as repaired', () => {
  const got = assess({
    base: 'main', paths: ['absent.md'], text: DEAD,
    heads: [head(1)], read: reader({}), mergeBase: () => 'mb',
  });
  assert.deepEqual(got, []);
});

test('the real queue: the dead identifier on main is pending, and some zero-reading head is stale-root', () => {
  // The measurement of 2026-10-26, run against the repository rather than a
  // fixture. Skipped rather than failed once the repair merges, because the
  // string leaving `main` is the success condition, not a regression.
  const REAL = 'INC-2026-10-25-githubs-mergeable-field-computes-a-different-merge-from-the-one-this-repository-declares';
  if (git('rev-parse', '--verify', '--quiet', 'origin/main') === null) return;
  const onMain = countAt('origin/main', 'docs/ideas.md', REAL);
  if (!onMain) return; // merged; the finding is closed
  assert.equal(onMain, 2, 'two occurrences, as reported to the board at 10:58:49Z');
  const refs = (git('for-each-ref', '--format=%(refname)', 'refs/prs/') ?? '').split('\n').filter(Boolean);
  if (refs.length < 2) return; // bootstrap refspec not fetched; nothing to measure
  const got = assess({
    base: 'origin/main', paths: ['docs/ideas.md'], text: REAL,
    heads: refs.map((ref) => ({ ref, number: ref, isDraft: null })),
    read: (r, p) => git('show', `${r}:${p}`),
    mergeBase: (a, b) => (git('merge-base', a, b) ?? '').trim() || null,
  });
  assert.equal(got[0].verdict, 'pending', 'the repair is open and unmerged, so this is not a dangling citation');
  const zero = got[0].heads.filter((h) => h.headCount === 0);
  assert.ok(zero.some((h) => h.klass === 'stale-root'),
    'at least one head reads zero without repairing anything — the class a bare count credits');
  assert.ok(zero.some((h) => h.klass === 'repaired'));
});
