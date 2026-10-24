#!/usr/bin/env node
// node --test tools/stack/integrate.test.mjs
//
// Does integrate.sh tell the three results apart: merged, a real content
// conflict, and a merge git refused to attempt at all?
//
// This matters because until 2026-10-24 it told only two apart, by asking
// whether the conflicted-file list was empty. A merge git refuses leaves no
// unmerged paths, so it landed in the conflict bucket on the console and in the
// MERGED bucket in --json and --report, in the same run. Measured in a clone
// shaped like this seat's: `--json` carried `"result": "merged"` for all three
// branches and `"merged": 0, "conflicted": 3` in the summary of the same file.
//
// Hermetic. A local bare origin over the file transport and a stub `gh` first on
// PATH, so the suite needs no network and no GitHub account. The refused-merge
// case is built from a branch with an UNRELATED ROOT rather than by narrowing
// the refspec, because integrate.sh now repairs a narrow refspec before it
// merges anything, and the point of this suite is the classification that runs
// after that repair.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, copyFileSync, chmodSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..');
let ROOT, clone, binDir;

const git = (cwd, ...a) =>
  execFileSync('git', ['-C', cwd, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

before(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'integ-'));
  const origin = join(ROOT, 'origin');
  execFileSync('git', ['init', '--quiet', '--bare', '-b', 'main', origin]);
  const seed = join(ROOT, 'seed');
  execFileSync('git', ['clone', '--quiet', origin, seed]);
  git(seed, 'config', 'user.email', 'test@ursa.local');
  git(seed, 'config', 'user.name', 'test');

  // The fixture repo carries the two real scripts under test, at their real
  // paths, so the test runs the committed bytes rather than a copy of the logic.
  mkdirSync(join(seed, 'tools', 'stack'), { recursive: true });
  copyFileSync(join(REPO, 'tools', 'ensure-full-clone.sh'), join(seed, 'tools', 'ensure-full-clone.sh'));
  copyFileSync(join(REPO, 'tools', 'stack', 'integrate.sh'), join(seed, 'tools', 'stack', 'integrate.sh'));
  writeFileSync(join(seed, 'shared.md'), 'line one\nline two\nline three\n');
  git(seed, 'add', '-A'); git(seed, 'commit', '-q', '-m', 'base');
  git(seed, 'push', '-q', 'origin', 'main');
  const base = git(seed, 'rev-parse', 'HEAD');

  // 1. merges clean: touches a file main does not.
  git(seed, 'checkout', '-q', '-b', 'feat/clean', base);
  writeFileSync(join(seed, 'clean.md'), 'new file\n');
  git(seed, 'add', '-A'); git(seed, 'commit', '-q', '-m', 'clean');
  git(seed, 'push', '-q', 'origin', 'feat/clean');

  // 2. a real content conflict: both sides rewrite line two.
  git(seed, 'checkout', '-q', 'main');
  writeFileSync(join(seed, 'shared.md'), 'line one\nMAIN rewrote this\nline three\n');
  git(seed, 'add', '-A'); git(seed, 'commit', '-q', '-m', 'main rewrites line two');
  git(seed, 'push', '-q', 'origin', 'main');
  git(seed, 'checkout', '-q', '-b', 'feat/conflict', base);
  writeFileSync(join(seed, 'shared.md'), 'line one\nBRANCH rewrote this\nline three\n');
  git(seed, 'add', '-A'); git(seed, 'commit', '-q', '-m', 'branch rewrites line two');
  git(seed, 'push', '-q', 'origin', 'feat/conflict');

  // 3. a merge git refuses to attempt: an unrelated root. This is the same
  //    refusal class a shallow clone produces, reached without shallowness.
  git(seed, 'checkout', '-q', '--orphan', 'feat/unrelated');
  execFileSync('git', ['-C', seed, 'rm', '-rqf', '.'], { stdio: 'ignore' });
  writeFileSync(join(seed, 'elsewhere.md'), 'no common history\n');
  git(seed, 'add', '-A'); git(seed, 'commit', '-q', '-m', 'unrelated root');
  git(seed, 'push', '-q', 'origin', 'feat/unrelated');

  // The clone under test, shaped like a seat's.
  clone = join(ROOT, 'clone');
  execFileSync('git', ['clone', '--quiet', '--depth', '1', '--single-branch', '-b', 'main',
    `file://${origin}`, clone]);
  git(clone, 'config', 'user.email', 'test@ursa.local');
  git(clone, 'config', 'user.name', 'test');

  // Stub gh. integrate.sh makes exactly one gh call: `gh pr list --state open`.
  binDir = join(ROOT, 'bin');
  mkdirSync(binDir);
  const gh = join(binDir, 'gh');
  writeFileSync(gh, `#!/usr/bin/env bash
echo "1 feat/clean"
echo "2 feat/conflict"
echo "3 feat/unrelated"
`);
  chmodSync(gh, 0o755);
});

after(() => rmSync(ROOT, { recursive: true, force: true }));

const integrate = (...args) => {
  const env = { ...process.env, PATH: `${binDir}:${process.env.PATH}` };
  try {
    return { code: 0, out: execFileSync('bash', ['tools/stack/integrate.sh', '--no-tests', ...args],
      { cwd: clone, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }), err: '' };
  } catch (e) {
    return { code: e.status, out: e.stdout ?? '', err: e.stderr ?? '' };
  }
};

describe('integrate.sh tells three results apart', () => {
  let r, report;
  before(() => {
    report = join(ROOT, 'out.json');
    r = integrate('--json', report, '1', '2', '3');
  });

  test('it repairs the clone before merging, and says so', () => {
    assert.match(r.out, /clone completed/, r.out + r.err);
    assert.equal(git(clone, 'rev-parse', '--is-shallow-repository'), 'false');
  });

  test('the clean branch merges', () => {
    assert.match(r.out, /#1\s+feat\/clean\s+merged/);
  });

  test('a real content conflict is reported as a conflict, WITH the file in it', () => {
    assert.match(r.out, /#2\s+feat\/conflict\s+CONFLICT\s+shared\.md/);
  });

  test('a merge git refuses is reported as a tool failure, not as a conflict', () => {
    assert.match(r.out, /#3\s+feat\/unrelated\s+TOOL FAILURE/);
    assert.match(r.out, /refusing to merge unrelated histories/);
    assert.doesNotMatch(r.out, /#3\s+feat\/unrelated\s+CONFLICT/);
  });

  test('the summary counts the three separately and the tool failure is named', () => {
    assert.match(r.out, /merged 1 of 3;\s+conflicted: 2;\s+tool failures: 3/);
    assert.match(r.out, /A tool failure is NOT a conflict\. These branches were never compared:/);
  });

  test('exit is non-zero, because a branch that was never compared is not a pass', () => {
    assert.equal(r.code, 1);
  });

  test('--json agrees with the console instead of contradicting it, which is the bug this fixes', () => {
    const d = JSON.parse(readFileSync(report, 'utf8'));
    const byPr = Object.fromEntries(d.branches.map((b) => [b.pr, b]));
    assert.equal(byPr[1].result, 'merged');
    assert.equal(byPr[2].result, 'conflict');
    assert.deepEqual(byPr[2].conflictedFiles, ['shared.md']);
    // Before the fix this said "merged", in the same file as `"conflicted": 3`.
    assert.equal(byPr[3].result, 'tool_failure');
    assert.match(byPr[3].why, /unrelated histories/);
    assert.equal(d.merged, 1);
    assert.equal(d.conflicted, 1);
    assert.equal(d.toolFailures, 1);
    assert.equal(d.green, false);
    // The per-branch results and the summary counts are two statements of the
    // same fact, and nothing in the emitter forces them to agree, so check it.
    const tally = (k) => d.branches.filter((b) => b.result === k).length;
    assert.equal(tally('merged'), d.merged);
    assert.equal(tally('conflict'), d.conflicted);
    assert.equal(tally('tool_failure'), d.toolFailures);
  });

  test('--report names the tool failure as never compared rather than as merged', () => {
    const md = join(ROOT, 'out.md');
    integrate('--report', md, '1', '2', '3');
    const text = readFileSync(md, 'utf8');
    assert.match(text, /\| #3 \| `feat\/unrelated` \| tool failure, never compared \|/);
    assert.match(text, /\| #2 \| `feat\/conflict` \| conflict \| shared\.md/);
  });
});
