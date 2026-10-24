#!/usr/bin/env node
// node --test tools/ensure-full-clone.test.mjs
//
// Two kinds of test in here, labelled, because they prove different things.
//
//   `measured:` exercises GIT, not this repository's code. Each one re-performs
//   a claim docs/standards/lessons.md makes about a shallow or single-branch
//   checkout, so that the claim is a fact in this suite rather than a citation.
//   If git changes its behaviour these fail, and that is the point: the repair
//   in tools/ensure-full-clone.sh would then be repairing nothing.
//
//   `repairs:` / `refuses:` exercises the tool.
//
// Hermetic: every fixture is a local bare repository cloned over the file
// transport, so the suite needs no network and no GitHub. `--depth 1
// --single-branch` over file:// produces the same two properties as the clone a
// seat is given; the equality is asserted in the first test rather than assumed.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, execFile } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOL = join(dirname(fileURLToPath(import.meta.url)), 'ensure-full-clone.sh');
let ROOT;

const git = (cwd, ...a) =>
  execFileSync('git', ['-C', cwd, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

// Runs the tool and returns {code, out, err} instead of throwing, because a
// non-zero exit is the subject of half these tests.
const run = (args, cwd) => {
  try {
    const out = execFileSync('bash', [TOOL, ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out, err: '' };
  } catch (e) {
    return { code: e.status, out: e.stdout ?? '', err: e.stderr ?? '' };
  }
};

// Exit status only, without bash's own error text on stderr being treated as
// the command's answer.
const status = (cwd, cmd, args) => {
  try { execFileSync(cmd, args, { cwd, stdio: 'ignore' }); return 0; }
  catch (e) { return e.status ?? -1; }
};

before(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'efc-'));
  // An origin with a main line of 4 commits and a side branch off the FIRST of
  // them, so that main's tip and the side branch share a base that a depth-1
  // clone cannot see. That gap is the whole fault.
  const origin = join(ROOT, 'origin');
  execFileSync('git', ['init', '--quiet', '--bare', '-b', 'main', origin]);
  const seed = join(ROOT, 'seed');
  execFileSync('git', ['clone', '--quiet', origin, seed]);
  git(seed, 'config', 'user.email', 'test@ursa.local');
  git(seed, 'config', 'user.name', 'test');
  writeFileSync(join(seed, 'register.md'), '## Entry 0\nbase\n');
  git(seed, 'add', '-A'); git(seed, 'commit', '-q', '-m', 'c0');
  const base = git(seed, 'rev-parse', 'HEAD');
  for (const n of [1, 2, 3]) {
    appendFileSync(join(seed, 'register.md'), `## Entry ${n}\nmain line\n`);
    git(seed, 'add', '-A'); git(seed, 'commit', '-q', '-m', `c${n}`);
  }
  git(seed, 'push', '-q', 'origin', 'main');
  // The side branch: one commit on the shared base.
  git(seed, 'checkout', '-q', '-b', 'side', base);
  writeFileSync(join(seed, 'side.md'), 'side work\n');
  git(seed, 'add', '-A'); git(seed, 'commit', '-q', '-m', 'side');
  git(seed, 'push', '-q', 'origin', 'side');
  // `contained` is a branch whose tip IS an ancestor of main's tip, so every
  // containment question about it has a known true answer.
  git(seed, 'checkout', '-q', '-B', 'contained', `${base}`);
  git(seed, 'push', '-q', 'origin', 'contained');
});

after(() => rmSync(ROOT, { recursive: true, force: true }));

// A fresh seat-shaped clone per test, so no test can see another's repair.
let seq = 0;
const seatClone = () => {
  const dir = join(ROOT, `seat${seq++}`);
  execFileSync('git', ['clone', '--quiet', '--depth', '1', '--single-branch', '-b', 'main',
    `file://${join(ROOT, 'origin')}`, dir]);
  return dir;
};
const fullClone = () => {
  const dir = join(ROOT, `full${seq++}`);
  execFileSync('git', ['clone', '--quiet', join(ROOT, 'origin'), dir]);
  return dir;
};

describe('the two properties of the clone a seat is given', () => {
  test('measured: a seat-shaped clone is shallow AND single-branch, which is two faults not one', () => {
    const c = seatClone();
    assert.equal(git(c, 'rev-parse', '--is-shallow-repository'), 'true');
    assert.equal(git(c, 'config', '--get-all', 'remote.origin.fetch'),
      '+refs/heads/main:refs/remotes/origin/main');
    // This is the shape this seat's own working clone had on 2026-10-24, which
    // is why the fixture is built this way rather than with --depth alone.
    assert.equal(git(c, 'rev-list', '--count', 'HEAD'), '1');
  });

  test('measured: --is-ancestor exits non-zero on a contained pair, and non-zero means NOT contained', () => {
    const shallow = seatClone();
    const full = fullClone();
    // In the full clone the answer is a fact: `contained` IS contained in main.
    assert.equal(status(full, 'git', ['merge-base', '--is-ancestor', 'origin/contained', 'origin/main']), 0,
      'the fixture must be a pair whose containment is true, or this test proves nothing');
    // The same question, same two commits, in the clone a seat is given. There
    // is no origin/contained at all, so ask by the sha that main's own history
    // reaches, which is the closest the shallow clone can come to the question.
    const sha = git(full, 'rev-parse', 'origin/contained');
    assert.notEqual(status(shallow, 'git', ['merge-base', '--is-ancestor', sha, 'HEAD']), 0,
      'L-A55 claims this answers wrongly in a shallow clone; if it exits 0 the lesson is stale');
  });

  test('measured: an empty $(git merge-base ...) turns `$base:path` into `:path`, which git reads as the INDEX', () => {
    const shallow = seatClone();
    // The substitution empties: no base, nothing on stdout.
    assert.equal(git(shallow, 'rev-parse', '--is-shallow-repository'), 'true');
    let printed = '(threw)';
    try { printed = execFileSync('git', ['-C', shallow, 'merge-base', 'HEAD~0', 'HEAD'], { encoding: 'utf8' }); }
    catch { printed = ''; }
    // And the command it is interpolated into still succeeds, on the wrong input.
    appendFileSync(join(shallow, 'register.md'), '## Entry 99\nthis run\n');
    git(shallow, 'add', 'register.md');
    const viaIndex = execFileSync('git', ['-C', shallow, 'show', ':register.md'], { encoding: 'utf8' });
    const viaCommit = execFileSync('git', ['-C', shallow, 'show', 'HEAD:register.md'], { encoding: 'utf8' });
    assert.match(viaIndex, /Entry 99/, 'git show :path reads the index, which carries this run own edit');
    assert.doesNotMatch(viaCommit, /Entry 99/);
    assert.notEqual(viaIndex, viaCommit,
      'the two differ exactly when the run has touched the file, which is the normal case for a register probe');
  });

  test('measured: merging origin/<branch> in a single-branch clone fails with NO unmerged paths', () => {
    const c = seatClone();
    git(c, 'fetch', '--quiet', 'origin'); // what a tool does before merging
    assert.notEqual(status(c, 'git', ['rev-parse', '--verify', 'refs/remotes/origin/side']), 0,
      'origin/side must not exist, or the single-branch half of the fault is absent');
    let err = '';
    try { execFileSync('git', ['-C', c, 'merge', '--no-edit', '--quiet', 'origin/side'], { stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (e) { err = String(e.stderr); }
    assert.match(err, /not something we can merge/);
    // This is the line that makes it expensive: a caller reading the conflicted
    // file list to report WHICH files collided gets an empty string, so it
    // reports a conflict in no files. tools/stack/integrate.sh did exactly this.
    assert.equal(git(c, 'diff', '--name-only', '--diff-filter=U'), '',
      'no unmerged paths, so a conflicted-file list built from this is empty');
  });

  test('measured: in a DEEP single-branch clone the same merge still fails, so depth alone is not the fix', () => {
    const c = seatClone();
    git(c, 'fetch', '--quiet', '--unshallow', 'origin');
    assert.equal(git(c, 'rev-parse', '--is-shallow-repository'), 'false');
    let err = '';
    try { execFileSync('git', ['-C', c, 'merge', '--no-edit', '--quiet', 'origin/side'], { stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (e) { err = String(e.stderr); }
    assert.match(err, /not something we can merge/,
      'this is why the tool repairs the refspec too, and why it repairs it first');
  });
});

describe('ensure-full-clone.sh', () => {
  test('repairs both properties, and says which ones it repaired', () => {
    const c = seatClone();
    const r = run([], c);
    assert.equal(r.code, 0, r.err);
    assert.equal(git(c, 'rev-parse', '--is-shallow-repository'), 'false');
    assert.equal(git(c, 'config', '--get-all', 'remote.origin.fetch'), '+refs/heads/*:refs/remotes/origin/*');
    assert.match(r.out, /repaired depth/);
    assert.match(r.out, /repaired refspec/);
  });

  test('repairs the thing the repair is FOR: the merge works and the ancestry answer flips to true', () => {
    const c = seatClone();
    assert.equal(run([], c).code, 0);
    assert.equal(status(c, 'git', ['merge', '--no-edit', '--quiet', 'origin/side']), 0,
      'the merge that said "not something we can merge" before the repair');
    assert.equal(status(c, 'git', ['merge-base', '--is-ancestor', 'origin/contained', 'origin/main']), 0,
      'and the containment question now answers with the truth');
  });

  test('repairs a clone that is single-branch but already deep (the refspec half alone)', () => {
    const c = seatClone();
    git(c, 'fetch', '--quiet', '--unshallow', 'origin');
    const r = run([], c);
    assert.equal(r.code, 0, r.err);
    assert.match(r.out, /repaired refspec/);
    assert.doesNotMatch(r.out, /repaired depth/, 'it must not claim a repair it did not make');
    assert.equal(status(c, 'git', ['rev-parse', '--verify', 'refs/remotes/origin/side']), 0);
  });

  test('replaces the narrow refspec rather than adding to it', () => {
    const c = seatClone();
    run([], c);
    assert.equal(git(c, 'config', '--get-all', 'remote.origin.fetch').split('\n').length, 1,
      'a clone carrying both refspecs fetches main twice and still reads as repaired');
  });

  test('is idempotent: a second run repairs nothing and exits 0', () => {
    const c = seatClone();
    run([], c);
    const before = git(c, 'rev-parse', 'origin/main') + git(c, 'config', '--get-all', 'remote.origin.fetch');
    const r = run([], c);
    assert.equal(r.code, 0);
    assert.match(r.out, /clone is complete/);
    assert.doesNotMatch(r.out, /repaired/);
    assert.equal(git(c, 'rev-parse', 'origin/main') + git(c, 'config', '--get-all', 'remote.origin.fetch'), before);
  });

  test('--check reports and repairs NOTHING, exit 1', () => {
    const c = seatClone();
    const r = run(['--check'], c);
    assert.equal(r.code, 1);
    assert.match(r.err, /depth:/);
    assert.match(r.err, /refspec:/);
    assert.match(r.err, /Run: bash tools\/ensure-full-clone\.sh/, 'a refusal names the command that fixes it');
    assert.equal(git(c, 'rev-parse', '--is-shallow-repository'), 'true', '--check must not change the clone');
    assert.equal(git(c, 'config', '--get-all', 'remote.origin.fetch'), '+refs/heads/main:refs/remotes/origin/main');
  });

  test('--check on a complete clone exits 0, so it is usable as a gate', () => {
    const c = seatClone();
    run([], c);
    const r = run(['--check'], c);
    assert.equal(r.code, 0, r.err);
  });

  test('--quiet prints nothing when there is nothing to repair', () => {
    const c = seatClone();
    run([], c);
    assert.equal(run(['--quiet', '--check'], c).out, '');
  });

  test('--repo operates on another checkout and leaves the cwd alone', () => {
    const target = seatClone();
    const here = seatClone();
    const r = run(['--repo', target], here);
    assert.equal(r.code, 0, r.err);
    assert.equal(git(target, 'rev-parse', '--is-shallow-repository'), 'false');
    assert.equal(git(here, 'rev-parse', '--is-shallow-repository'), 'true', 'the cwd clone must be untouched');
  });

  test('refuses a directory that is not a git repository, exit 2', () => {
    const d = mkdtempSync(join(tmpdir(), 'efc-bare-'));
    const r = run([], d);
    assert.equal(r.code, 2);
    assert.match(r.err, /not a git repository/);
    rmSync(d, { recursive: true, force: true });
  });

  test('refuses a repository with no origin, exit 2, because every answer it gives is about what is local', () => {
    const d = mkdtempSync(join(tmpdir(), 'efc-noorigin-'));
    execFileSync('git', ['init', '--quiet', '-b', 'main', d]);
    const r = run([], d);
    assert.equal(r.code, 2);
    assert.match(r.err, /no 'origin' remote/);
    rmSync(d, { recursive: true, force: true });
  });

  test('refuses an unknown argument rather than silently doing the default thing', () => {
    const c = seatClone();
    const r = run(['--deepen'], c);
    assert.equal(r.code, 2);
    assert.match(r.err, /unknown argument/);
    assert.equal(git(c, 'rev-parse', '--is-shallow-repository'), 'true');
  });

  test('this repository own checkout passes --check, so the gate is green where it runs', () => {
    const r = run(['--check'], process.cwd());
    assert.equal(r.code, 0, `${r.err}\nRun: bash tools/ensure-full-clone.sh`);
  });
});
