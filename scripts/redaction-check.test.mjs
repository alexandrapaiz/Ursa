#!/usr/bin/env node
// node --test scripts/redaction-check.test.mjs
//
// Every violating string in this suite is BUILT AT RUNTIME, never written
// as a literal. A test file containing a literal full session id or a
// literal home path with a username in it would be caught by the very
// gate it is testing, and the suite would fail the build it is defending.
// That is not a style choice, it is the one constraint this file has.
//
// Hermetic: each case is a temporary directory. Nothing reads or writes
// the repository tree, and the only thing taken from the repository is the
// gate's own rules, which is the point of the script under test.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, 'redaction-check.mjs');
const REAL_WORKFLOW = resolve(HERE, '..', '.github', 'workflows', 'redaction-gate.yml');

const hex = (n) => Array.from({ length: n }, (_, i) => '0123456789abcdef'[(i * 7 + 3) % 16]).join('');
// Assembled from parts so that no full-UUID-shaped literal exists in this file.
const fakeSessionId = [hex(8), hex(4), hex(4), hex(4), hex(12)].join('-');
// Likewise: '/home/' + a name + '/' never appears as one literal.
const fakeHomePath = ['', 'home', 'somebody', 'notes.md'].join('/');

function runCheck(root, extra = []) {
  try {
    const stdout = execFileSync('node', [SCRIPT, `--root=${root}`, ...extra], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, stdout, stderr: '' };
  } catch (err) {
    return { code: err.status, stdout: err.stdout ?? '', stderr: err.stderr ?? '' };
  }
}

function sandbox(files) {
  const dir = mkdtempSync(join(tmpdir(), 'redaction-check-'));
  for (const [name, body] of Object.entries(files)) {
    const path = join(dir, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, body);
  }
  return dir;
}

// A sandbox that is a real git work tree, because the file set the script
// scans there comes from git and not from walking the directory. Nothing is
// committed: `--cached --others --exclude-standard` is meant to answer about
// what the branch will carry, so an uncommitted file that is not ignored has
// to be in scope, and an ignored one has to be out.
function gitSandbox(files) {
  const dir = sandbox(files);
  const git = (...args) =>
    execFileSync('git', args, { cwd: dir, stdio: ['ignore', 'ignore', 'ignore'] });
  git('init', '-q');
  git('config', 'user.email', 'seat@example.invalid');
  git('config', 'user.name', 'seat');
  return dir;
}

describe('redaction-check', () => {
  test('passes a clean tree, and says how many patterns it read', () => {
    const dir = sandbox({ 'notes.md': 'Nothing private here.\n' });
    try {
      const { code, stdout } = runCheck(dir);
      assert.equal(code, 0);
      assert.match(stdout, /clean \(3 patterns, read from the workflow\)/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('catches a full session id and names the file and line', () => {
    const dir = sandbox({ 'audit.md': `line one\nid: ${fakeSessionId}\n` });
    try {
      const { code, stderr } = runCheck(dir);
      assert.equal(code, 1);
      assert.match(stderr, /session or conversation UUID/);
      assert.match(stderr, /audit\.md:2/);
      // The whole reason this script prints file:line instead of the
      // matched line: a CI log that reprints the value has published it.
      assert.ok(!stderr.includes(fakeSessionId), 'must not reprint the value it caught');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('catches an absolute home path carrying a username', () => {
    const dir = sandbox({ 'doc.md': `see ${fakeHomePath}\n` });
    try {
      const { code, stderr } = runCheck(dir);
      assert.equal(code, 1);
      assert.match(stderr, /Absolute home path/);
      assert.match(stderr, /doc\.md:1/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("honours the gate's own allowance for the runner's own home", () => {
    const dir = sandbox({ 'doc.md': `log at ${['', 'home', 'runner', 'work'].join('/')}/x\n` });
    try {
      const { code } = runCheck(dir);
      assert.equal(code, 0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('reports every pattern that fires, not just the first', () => {
    const dir = sandbox({
      'a.md': `id: ${fakeSessionId}\n`,
      'b.md': `path: ${fakeHomePath}\n`,
    });
    try {
      const { code, stdout } = runCheck(dir, ['--json']);
      assert.equal(code, 1);
      const out = JSON.parse(stdout);
      assert.equal(out.clean, false);
      assert.equal(out.findings.length, 2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // The failure mode this script must never have: the gate changes shape,
  // the patterns stop being found, and a checker that scans nothing
  // reports clean. Exit 2 is "I could not do my job", not "you are clean".
  test('refuses, with exit 2, a workflow it cannot find rules in', () => {
    const dir = sandbox({
      'audit.md': `id: ${fakeSessionId}\n`,
      'fake/gate.yml': 'name: redaction-gate\njobs:\n  scan:\n    steps: []\n',
    });
    try {
      const { code, stderr } = runCheck(dir, [`--workflow=${join(dir, 'fake/gate.yml')}`]);
      assert.equal(code, 2);
      assert.match(stderr, /found no `scan/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('refuses, with exit 2, a workflow that is not there', () => {
    const dir = sandbox({ 'notes.md': 'clean\n' });
    try {
      const { code, stderr } = runCheck(dir, [`--workflow=${join(dir, 'nope.yml')}`]);
      assert.equal(code, 2);
      assert.match(stderr, /the file is missing/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // The 2026-10-26 regression, in both directions. Before the fix the
  // script walked the directory, so an ignored file could turn it red and
  // it would report that the gate "would fail" about a file the gate is
  // never shown. `.scratch/` is the live case: the repository tells runs to
  // put scratch there and the next run's board read failed this script.
  test('ignores a gitignored file, because the gate will never see one', () => {
    const dir = gitSandbox({
      '.gitignore': '.scratch/\n',
      '.scratch/board.json': `{"id":"${fakeSessionId}"}\n`,
      'notes.md': 'Nothing private here.\n',
    });
    try {
      const { code, stdout } = runCheck(dir);
      assert.equal(code, 0);
      assert.match(stdout, /ignored paths out/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // The other direction, which is the one that would make the fix a
  // loophole: not ignored means in scope, committed or not.
  test('still catches a violation in a file that is merely uncommitted', () => {
    const dir = gitSandbox({
      '.gitignore': '.scratch/\n',
      'audit.md': `id: ${fakeSessionId}\n`,
    });
    try {
      const { code, stderr } = runCheck(dir);
      assert.equal(code, 1);
      assert.match(stderr, /session or conversation UUID/);
      assert.match(stderr, /audit\.md:1/);
      assert.ok(!stderr.includes(fakeSessionId), 'must not reprint the value it caught');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // grep drops the filename prefix when it is handed exactly one file, and
  // the reporter splits on the first colon, so a one-file scan used to be
  // reportable as a line number in the filename column.
  test('names the file even when the whole scan is one file', () => {
    const dir = gitSandbox({ 'only.md': `line one\nid: ${fakeSessionId}\n` });
    try {
      const { code, stderr } = runCheck(dir);
      assert.equal(code, 1);
      assert.match(stderr, /only\.md:2/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // Same rule as a gate it cannot parse: a scan over nothing is exit 2, not
  // a clean bill. An empty work tree is the only way to reach it.
  test('refuses, with exit 2, a work tree git reports no files for', () => {
    const dir = gitSandbox({});
    try {
      const { code, stderr } = runCheck(dir);
      assert.equal(code, 2);
      assert.match(stderr, /no files to scan/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // Guards the claim in the script's header: the rules are the workflow's.
  test('reads its three patterns out of the real gate, not out of itself', () => {
    const yml = execFileSync('cat', [REAL_WORKFLOW], { encoding: 'utf8' });
    const pairs = [...yml.matchAll(/scan\s+"([^"]+)"\s*\\\s*\n\s*'([^']+)'/g)];
    assert.equal(pairs.length, 3, 'the gate should still declare three scans');
    const self = execFileSync('cat', [SCRIPT], { encoding: 'utf8' });
    for (const [, , pattern] of pairs) {
      assert.ok(!self.includes(pattern), `pattern is duplicated into the script: ${pattern}`);
    }
  });
});
