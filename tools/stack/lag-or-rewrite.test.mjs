// The suite for tools/stack/base.mjs and tools/stack/lag-or-rewrite.mjs.
//
//   node --test tools/stack/lag-or-rewrite.test.mjs
//
// Every fixture is a throwaway repository built here, so the four classes and
// the three faults are each exercised against a history this file wrote. The
// one measurement that is not synthetic is the last suite, which runs the tool
// on this repository's own open rows and only asserts that it answers.
//
// THE TEST THAT IS THE WHOLE POINT is "the naive arithmetic turns LAGS into
// REWRITES when the base is empty". It reproduces, in a repository it builds
// itself, the false finding this seat published at 07:0xZ on 2026-11-02: four
// of its own open pull requests accused of reverting a security fix they had
// never touched. The accusation came out of `$(git merge-base ...)` returning
// the empty string on a shallow clone, which made `git rev-parse "$MB:path"`
// read `:path`, which is the index. That test asserts the wrong answer the old
// form gives, not just the refusal the new one gives, because a guard whose
// failure mode cannot be exhibited is not evidence that the guard is needed.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, test } from 'node:test';

import { FAULT, blobAt, cloneGaps, mergeBase } from './base.mjs';
import { CLASS, classify, supersededBlobs } from './lag-or-rewrite.mjs';

const made = [];
after(() => { for (const d of made) rmSync(d, { recursive: true, force: true }); });

const tmp = (slug) => {
  const d = mkdtempSync(join(tmpdir(), `lor-${slug}-`));
  made.push(d);
  return d;
};
const g = (repo, ...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim();
const write = (repo, path, text) => writeFileSync(join(repo, path), text);
const commit = (repo, msg) => { g(repo, 'add', '-A'); g(repo, 'commit', '--quiet', '-m', msg); };

/** A repository with a trunk and a branch, both real, shaped like the queue. */
function fixture(slug) {
  const repo = tmp(slug);
  g(repo, 'init', '--quiet', '--initial-branch=main');
  g(repo, 'config', 'user.email', 'suite@example.invalid');
  g(repo, 'config', 'user.name', 'suite');
  write(repo, 'lagged.txt', 'v1\n');
  write(repo, 'rewritten.txt', 'v1\n');
  write(repo, 'both.txt', 'v1\n');
  commit(repo, 'base');
  const base = g(repo, 'rev-parse', 'HEAD');

  g(repo, 'checkout', '--quiet', '-b', 'side');
  write(repo, 'rewritten.txt', 'branch\n');
  write(repo, 'both.txt', 'branch\n');
  write(repo, 'added.txt', 'new\n');
  commit(repo, 'branch work');

  g(repo, 'checkout', '--quiet', 'main');
  write(repo, 'lagged.txt', 'trunk moved after the branch point\n');
  write(repo, 'both.txt', 'trunk\n');
  commit(repo, 'trunk work');
  return { repo, base };
}

describe('mergeBase names the one cause that fired', () => {
  test('a real base in a complete repository', () => {
    const { repo, base } = fixture('base-ok');
    assert.deepEqual(mergeBase(repo, 'main', 'side'), { base });
  });

  test('UNRELATED_HISTORIES in a COMPLETE clone is a fact, not a clone fault', () => {
    const { repo } = fixture('unrelated');
    g(repo, 'checkout', '--quiet', '--orphan', 'island');
    g(repo, 'rm', '--quiet', '-rf', '.');
    write(repo, 'alone.txt', 'no shared ancestor\n');
    commit(repo, 'island');
    const r = mergeBase(repo, 'main', 'island');
    assert.equal(r.fault.code, FAULT.UNRELATED_HISTORIES);
    assert.match(r.fault.repair, /nothing to repair/);
    assert.deepEqual(cloneGaps(repo), [], 'no origin and not shallow, so there is no gap and nothing to repair');
  });

  test('a shallow repository with no origin reports the depth gap ALONE', () => {
    const { repo } = fixture('shallow-no-origin');
    const dest = join(tmp('shallow-no-origin-c'), 'clone');
    execFileSync('git', ['clone', '--quiet', '--depth', '1', '--single-branch', '--branch', 'main', `file://${repo}`, dest]);
    execFileSync('git', ['-C', dest, 'remote', 'remove', 'origin']);
    assert.deepEqual(cloneGaps(dest).map((l) => l.split(':')[0]), ['depth'],
      'the depth is still truncated, and there is no origin whose refspec could be widened');
  });

  test('NO_SUCH_REV names the ref, because a single-branch clone makes this look unrelated', () => {
    const { repo } = fixture('norev');
    const r = mergeBase(repo, 'main', 'origin/never-fetched');
    assert.equal(r.fault.code, FAULT.NO_SUCH_REV);
    assert.match(r.fault.line, /origin\/never-fetched/);
  });

  test('an empty rev is refused by mergeBase before git ever sees it', () => {
    const { repo } = fixture('emptyrev');
    assert.equal(mergeBase(repo, 'main', '').fault.code, FAULT.EMPTY_REV);
    assert.equal(mergeBase(repo, '  ', 'main').fault.code, FAULT.EMPTY_REV);
  });
});

describe('blobAt refuses the one input git answers most happily', () => {
  test('an empty rev is EMPTY_REV and never reaches git', () => {
    const { repo } = fixture('blob-empty');
    const r = blobAt(repo, '', 'lagged.txt');
    assert.equal(r.fault.code, FAULT.EMPTY_REV);
    assert.match(r.fault.line, /index/);
  });

  test('a path absent at that rev is an answer, null, and not a fault', () => {
    const { repo } = fixture('blob-absent');
    assert.deepEqual(blobAt(repo, 'main', 'added.txt'), { oid: null });
  });

  test('measured: git itself reads `:path` as the index and exits 0', () => {
    const { repo } = fixture('index-proof');
    write(repo, 'lagged.txt', 'staged by this run only\n');
    g(repo, 'add', 'lagged.txt');
    const viaIndex = g(repo, 'show', ':lagged.txt');
    const viaCommit = g(repo, 'show', 'main:lagged.txt');
    assert.equal(viaIndex, 'staged by this run only');
    assert.notEqual(viaIndex, viaCommit, 'this is the substitution that laundered the fault');
  });
});

describe('the four classes, each on a history this file wrote', () => {
  const { repo } = fixture('classes');
  const result = classify(repo, 'main', 'side');
  const by = (p) => result.rows.find((r) => r.path === p);

  test('LAGS: the branch never touched it and the trunk moved after the base', () => {
    assert.equal(by('lagged.txt').cls, CLASS.LAGS);
  });
  test('REWRITES: only the branch moved it', () => {
    assert.equal(by('rewritten.txt').cls, CLASS.REWRITES);
    assert.equal(by('rewritten.txt').effect, 'edits');
  });
  test('BOTH_MOVED: both sides moved it since the base', () => {
    assert.equal(by('both.txt').cls, CLASS.BOTH_MOVED);
  });
  test('the existence effect is carried separately from the class', () => {
    assert.equal(by('added.txt').effect, 'adds');
    assert.equal(by('added.txt').cls, CLASS.REWRITES);
  });
});

describe('RESURRECTS, which is the only class that exits 1', () => {
  test('a branch holding a blob the trunk has superseded is named with the commit that replaced it', () => {
    const repo = tmp('resurrect');
    g(repo, 'init', '--quiet', '--initial-branch=main');
    g(repo, 'config', 'user.email', 'suite@example.invalid');
    g(repo, 'config', 'user.name', 'suite');
    write(repo, 'gate.mjs', 'the version that lost\n');
    commit(repo, 'first version');
    const losing = g(repo, 'rev-parse', 'HEAD:gate.mjs');
    write(repo, 'gate.mjs', 'the version that replaced it\n');
    commit(repo, 'replace the first version');
    const replacement = g(repo, 'rev-parse', 'HEAD');

    // A branch cut AFTER the replacement that puts the old text back. This is
    // the shape a stale cherry-pick or a hand conflict resolution produces,
    // and `git diff main..side` shows it as an ordinary hunk.
    g(repo, 'checkout', '--quiet', '-b', 'side');
    write(repo, 'gate.mjs', 'the version that lost\n');
    commit(repo, 'put the old text back');

    const result = classify(repo, 'main', 'side');
    const row = result.rows.find((r) => r.path === 'gate.mjs');
    assert.equal(row.cls, CLASS.RESURRECTS);
    assert.equal(row.branch, losing, 'the branch is holding the exact superseded blob');
    assert.match(row.supersededBy, /replace the first version/);
    assert.match(row.supersededBy, new RegExp(replacement.slice(0, 7)), 'describeCommit uses %h, which is 7 characters here');
  });

  test('supersededBlobs abstains above its cap instead of answering from part of the history', () => {
    const { repo } = fixture('cap');
    for (let i = 0; i < 4; i += 1) { write(repo, 'lagged.txt', `r${i}\n`); commit(repo, `r${i}`); }
    assert.equal(supersededBlobs(repo, 'main', 'lagged.txt', 2).capped, 3);
    assert.equal(supersededBlobs(repo, 'main', 'lagged.txt', 2).superseded, undefined);
  });
});

describe('the fault this file exists for: an incomplete clone', () => {
  /** A clone shaped exactly like the one a seat is handed. */
  function seatClone(slug) {
    const { repo } = fixture(slug);
    const dest = join(tmp(`${slug}-c`), 'clone');
    execFileSync('git', ['clone', '--quiet', '--depth', '1', '--single-branch', '--branch', 'main', `file://${repo}`, dest]);
    return dest;
  }

  test('the clone really is shallow and single-branch, or the rest of this suite proves nothing', () => {
    const c = seatClone('shape');
    const gaps = cloneGaps(c);
    assert.equal(gaps.length, 2, `expected both properties, got: ${gaps.join(' | ')}`);
    assert.match(gaps[0], /^depth:/);
    assert.match(gaps[1], /^refspec:/);
  });

  test('mergeBase reports INCOMPLETE_CLONE and the one command that repairs it', () => {
    const c = seatClone('refuse');
    execFileSync('git', ['-C', c, 'fetch', '--quiet', 'origin', 'side:refs/heads/side']);
    const r = mergeBase(c, 'main', 'side');
    assert.equal(r.fault.code, FAULT.INCOMPLETE_CLONE);
    assert.equal(r.fault.repair, 'bash tools/ensure-full-clone.sh');
    assert.match(r.fault.line, /not the fact that they share nothing/);
  });

  test('classify refuses rather than classifying, so exit 2 and not a table', () => {
    const c = seatClone('classify');
    execFileSync('git', ['-C', c, 'fetch', '--quiet', 'origin', 'side:refs/heads/side']);
    const r = classify(c, 'main', 'side');
    assert.equal(r.fault.code, FAULT.INCOMPLETE_CLONE);
    assert.equal(r.rows, undefined, 'a refusal carries no rows at all');
  });

  test('MEASURED: the naive arithmetic turns LAGS into REWRITES when the base is empty', () => {
    const c = seatClone('manufacture');
    execFileSync('git', ['-C', c, 'fetch', '--quiet', 'origin', 'side:refs/heads/side']);

    // Step 1: `git merge-base` prints nothing here, exactly as the shell saw it.
    let printed = null;
    try { printed = execFileSync('git', ['-C', c, 'merge-base', 'main', 'side'], { encoding: 'utf8' }); }
    catch (e) { printed = e.stdout ?? ''; }
    assert.equal(printed.trim(), '', 'no base, and nothing on stdout to notice');

    // Step 2: the empty substitution. `"$MB:path"` becomes `":path"`.
    const MB = printed.trim();
    const laundered = execFileSync('git', ['-C', c, 'rev-parse', `${MB}:lagged.txt`], { encoding: 'utf8' }).trim();
    const indexBlob = execFileSync('git', ['-C', c, 'rev-parse', ':lagged.txt'], { encoding: 'utf8' }).trim();
    const trunkBlob = execFileSync('git', ['-C', c, 'rev-parse', 'main:lagged.txt'], { encoding: 'utf8' }).trim();
    assert.equal(laundered, indexBlob, 'the leading colon is the index, and git answered at exit 0');
    assert.equal(laundered, trunkBlob, 'and in a seat clone the index is the trunk, so it is the trunk wearing the base name');

    // Step 3: the inversion. `lagged.txt` is a file the branch NEVER touched.
    const branchBlob = execFileSync('git', ['-C', c, 'rev-parse', 'side:lagged.txt'], { encoding: 'utf8' }).trim();
    assert.notEqual(branchBlob, laundered, 'branch != fake base, which the naive arithmetic reads as REWRITES');
    const trueBase = execFileSync('git', ['-C', c, 'rev-parse', 'side~1:lagged.txt'], { encoding: 'utf8' }).trim();
    assert.equal(branchBlob, trueBase, 'against the real base it is LAGS: the branch holds the base blob unchanged');

    // Step 4: and this is why the tool refuses instead.
    assert.equal(classify(c, 'main', 'side').fault.code, FAULT.INCOMPLETE_CLONE);
  });
});

describe('this repository, live', () => {
  const REPO = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();

  test('it either classifies HEAD against origin/main or names its fault, never both and never neither', (t) => {
    if (execFileSync('git', ['-C', REPO, 'rev-parse', '--verify', '--quiet', 'origin/main'], { encoding: 'utf8' }).trim() === '') {
      t.skip('no origin/main in this checkout, so there is nothing to compare against');
      return;
    }
    const r = classify(REPO, 'origin/main', 'HEAD');
    if (r.fault) {
      assert.ok(r.fault.repair, 'a fault always carries the repair for its own cause');
      assert.equal(r.rows, undefined);
      return;
    }
    assert.ok(r.base.length === 40);
    for (const row of r.rows) assert.ok(Object.values(CLASS).includes(row.cls), `${row.path} got ${row.cls}`);
  });
});
