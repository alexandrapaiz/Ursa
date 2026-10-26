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
import { assess, classify, cloneState, countAt, occurrences, openHeads, REPAIRING, UNDECIDED, git } from './repair-pending.mjs';

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
});

test('classify: an unreachable merge-base manufactures no class at all', () => {
  // The correction of 2026-10-26. mergeBase() returned null, so there is no
  // comparand. The first version of this test asserted `stale-root` here, on
  // the sound half of the reasoning: calling it `repaired` would be an
  // instrument whose missing input reads as good news. But `stale-root` is
  // documented as "merging it may revert what added it", which is a published
  // claim about a branch derived from nothing. Both directions are refused.
  assert.equal(classify({ forkCount: null, headCount: 0 }), 'base-unknown');
  assert.equal(classify({ forkCount: null, headCount: 1 }), 'base-unknown');
  assert.ok(!REPAIRING.has('base-unknown'), 'it may not credit a repair');
  assert.ok(UNDECIDED.has('base-unknown'));
  // And it is not quietly folded into either confident neighbour.
  assert.notEqual(classify({ forkCount: null, headCount: 0 }), classify({ forkCount: 0, headCount: 0 }));
  assert.notEqual(classify({ forkCount: null, headCount: 1 }), classify({ forkCount: 1, headCount: 1 }));
});

test('classify: a head carrying MORE than the fork point grew, and growing is not repairing', () => {
  // A register entry that performs a rename has to quote the name it retired,
  // so this seat's own register lane reads +3 and +2 while being the branch
  // that removes the string. Conflating that with `unchanged` is what let a
  // signed delta read a quotation as a new citation.
  assert.equal(classify({ forkCount: 2, headCount: 3 }), 'grew');
  assert.equal(classify({ forkCount: 2, headCount: 2 }), 'unchanged');
  assert.ok(!REPAIRING.has('grew'));
  assert.ok(!UNDECIDED.has('grew'), 'it was measured; it just is not a repair');
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

test('assess: an unmeasured head makes the verdict indeterminate, never unrepaired', () => {
  // The whole point. `unrepaired` is the finding this gate publishes, and one
  // head whose merge-base was empty is enough to make the finding unsound.
  const tree = { 'main:f.md': `${DEAD}\n`, 'refs/prs/9:f.md': 'nothing here\n' };
  const got = assess({
    base: 'main', paths: ['f.md'], text: DEAD,
    heads: [head(9)], read: reader(tree), mergeBase: () => null,
  });
  assert.equal(got[0].verdict, 'indeterminate');
  assert.deepEqual(got[0].repairedBy, []);
  assert.deepEqual(got[0].undecidedBy, [9], 'the report names which head it could not read');
  assert.equal(got[0].heads[0].klass, 'base-unknown');
  assert.equal(got[0].heads[0].delta, null, 'a delta against a missing comparand is not 0');
});

test('assess: a measured repair settles the question even beside an unmeasured head', () => {
  // `pending` outranks `indeterminate`: an unread head cannot unsettle a
  // repair that was read. Only the finding direction needs full measurement.
  const tree = {
    'main:f.md': `${DEAD}\n${DEAD}\n`,
    'mb:f.md': `${DEAD}\n${DEAD}\n`,
    'refs/prs/1:f.md': 'clean\n',
    'refs/prs/2:f.md': 'nothing here\n',
  };
  const got = assess({
    base: 'main', paths: ['f.md'], text: DEAD,
    heads: [head(1), head(2)], read: reader(tree),
    mergeBase: (_b, h) => (h === 'refs/prs/1' ? 'mb' : null),
  });
  assert.equal(got[0].verdict, 'pending');
  assert.deepEqual(got[0].repairedBy, [1]);
  assert.deepEqual(got[0].undecidedBy, [2]);
});

test('assess: a register lane that quotes the dead name is grew, not a repair and not a finding', () => {
  const tree = {
    'main:reg.md': `${DEAD}\n`,
    'mb:reg.md': `${DEAD}\n`,
    // The entry performing the rename quotes what it renamed, three times.
    'refs/prs/513:reg.md': `${DEAD}\n${DEAD}\n${DEAD}\n${DEAD}\n`,
  };
  const got = assess({
    base: 'main', paths: ['reg.md'], text: DEAD,
    heads: [head(513)], read: reader(tree), mergeBase: () => 'mb',
  });
  assert.equal(got[0].heads[0].klass, 'grew');
  assert.equal(got[0].heads[0].delta, 3, 'the sign is reported, and it is reported as a quotation');
  assert.equal(got[0].verdict, 'unrepaired', 'measured, and it genuinely does not repair the base');
  assert.deepEqual(got[0].undecidedBy, []);
});

test('assess: a fork point without the file is a measured zero, not an unmeasurable base', () => {
  // The distinction the real-queue run taught on 526 refs. Both of these
  // produce a null raw fork count and they are not the same thing: one head
  // forked before `f.md` existed, which is measurable and means `stale-root`;
  // the other has no merge-base at all, which is not measurable.
  const tree = {
    'main:f.md': `${DEAD}\n`,
    // 'old:f.md' deliberately absent: the file postdates this fork point.
    'refs/prs/3:f.md': 'nothing here\n',
    'refs/prs/4:f.md': 'nothing here\n',
  };
  const got = assess({
    base: 'main', paths: ['f.md'], text: DEAD,
    heads: [head(3), head(4)], read: reader(tree),
    mergeBase: (_b, h) => (h === 'refs/prs/3' ? 'old' : null),
  });
  const [forkedEarly, noBase] = got[0].heads;
  assert.equal(forkedEarly.klass, 'stale-root', 'the file was not there, so there was nothing to remove');
  assert.equal(forkedEarly.forkCount, 0);
  assert.equal(forkedEarly.forkFileAbsent, true, 'and the report says which kind of zero it was');
  assert.equal(noBase.klass, 'base-unknown');
  assert.equal(noBase.forkCount, null);
  assert.equal(noBase.forkFileAbsent, false);
  assert.equal(got[0].verdict, 'indeterminate', 'one unmeasured head is still enough to withhold the finding');
  assert.deepEqual(got[0].undecidedBy, [4]);
});

test('cloneState names the two clone properties this tool abstains on', () => {
  const fake = (...a) => {
    if (a[0] === 'rev-parse') return 'true\n';
    if (a[0] === 'config') return '+refs/heads/main:refs/remotes/origin/main\n';
    return null;
  };
  const st = cloneState(fake);
  assert.equal(st.shallow, true);
  assert.equal(st.singleBranch, true, 'no refs/heads/* in the refspec');
  const wide = cloneState((...a) => (a[0] === 'rev-parse' ? 'false\n' : '+refs/heads/*:refs/remotes/origin/*\n'));
  assert.equal(wide.shallow, false);
  assert.equal(wide.singleBranch, false);
});

test('the real queue: measured on a complete clone, or skipped with the reason named', (t) => {
  // The measurement of 2026-10-26, run against the repository rather than a
  // fixture. Skipped rather than failed once the repair merges, because the
  // string leaving `main` is the success condition, not a regression.
  //
  // This test used to run the same tree twice and assert the two runs agreed.
  // Both runs shared one clone, so on the shallow single-branch clone this
  // host hands a seat they were wrong together and identically and the
  // assertion passed green — and it passed BECAUSE of the defect, since an
  // empty merge-base manufactured the very `stale-root` class it asserted the
  // existence of. So the clone is now checked first and the assertions are
  // absolute.
  const REAL = 'INC-2026-10-25-githubs-mergeable-field-computes-a-different-merge-from-the-one-this-repository-declares';
  if (git('rev-parse', '--verify', '--quiet', 'origin/main') === null) {
    return t.skip('no origin/main in this clone');
  }
  const clone = cloneState();
  if (clone.shallow || clone.singleBranch) {
    // Not a failure: the environment cannot answer the question. But never a
    // silent pass, because that is the whole finding this test now carries.
    return t.skip(`clone is ${clone.shallow ? 'shallow ' : ''}${clone.singleBranch ? 'single-branch' : ''}; merge-base is unreliable here, run tools/ensure-full-clone.sh`);
  }
  const onMain = countAt('origin/main', 'docs/ideas.md', REAL);
  if (!onMain) return t.skip('the string has left main; the finding is closed');
  assert.equal(onMain, 2, 'two occurrences, as reported to the board at 10:58:49Z');
  // The OPEN heads, which is what the tool reads in production. The first
  // version of this test swept every `refs/prs/*` in the clone, 526 of them,
  // which took 92 seconds and measured hundreds of long-merged pull requests
  // that the gate never asks about.
  let heads;
  try {
    heads = openHeads().filter((h) => h.readable);
  } catch {
    return t.skip('gh is not available in this environment');
  }
  if (heads.length < 2) return t.skip('bootstrap refspec not fetched; nothing to measure');
  const got = assess({
    base: 'origin/main', paths: ['docs/ideas.md'], text: REAL,
    heads,
    read: (r, p) => git('show', `${r}:${p}`),
    mergeBase: (a, b) => (git('merge-base', a, b) ?? '').trim() || null,
  });
  assert.equal(got[0].verdict, 'pending', 'the repair is open and unmerged, so this is not a dangling citation');
  // The assertion that makes the green mean something: on a complete clone
  // every head is measurable, so no head may abstain. On the clone this test
  // used to run in, this line is what would have failed.
  assert.deepEqual(got[0].undecidedBy, [],
    'a complete clone must measure every head; any base-unknown here is the clone, not the queue');
  const zero = got[0].heads.filter((h) => h.headCount === 0);
  assert.ok(zero.some((h) => h.klass === 'stale-root'),
    'at least one head reads zero without repairing anything — the class a bare count credits');
  assert.ok(zero.some((h) => h.klass === 'repaired'));
});
