#!/usr/bin/env node
// node --test tools/secret-scan.test.mjs
//
// WHY THIS SUITE IS THE POINT OF THE TOOL, and not an accessory to it. A
// credential scanner's normal output is a zero, and a zero is also what a
// broken scanner returns. The 2026-10-25 audit's clean history result is
// only meaningful because that run planted canaries in a throwaway
// repository first and watched its scanner find them, and that proof died
// with the session. This file is that proof, kept.
//
// Every canary value is assembled at runtime from pieces rather than
// written as a literal, for two reasons that are both real. A committed
// file carrying credential-shaped literals is exactly what the scanner and
// the redaction gate exist to find, so the literals would make this repo
// permanently dirty by its own instruments. And a reader skimming the
// suite should not have to decide whether a string in it is a real secret.
//
// Hermetic: a local repository in a temp directory, no network, no GitHub.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOL = join(dirname(fileURLToPath(import.meta.url)), 'secret-scan.mjs');

// Assembled, never literal. See the header.
const CANARIES = {
  'aws-access-key-id': `AKIA${'Q7BX2WLMN4KPDR5T'}`,
  'github-classic-pat': `ghp${'_'}${'a1b2c3d4e5'.repeat(3)}f6g7h8`,
  'database-url-with-password': `postgres${'://'}scanner${':'}${'hunter2hunter2'}@db.invalid:5432/x`,
};

const git = (cwd, ...a) =>
  execFileSync('git', ['-C', cwd, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

// Exit code and streams both, because this tool distinguishes three codes
// and the suite asserts on all three.
function run(repo, ...args) {
  try {
    const stdout = execFileSync('node', [TOOL, `--repo=${repo}`, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, stdout, stderr: '' };
  } catch (e) {
    return { code: e.status, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
  }
}

let ROOT;
let PLANTED_COMMIT;
let BASELINE_COMMIT;

before(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'secret-scan-'));
  git(ROOT, 'init', '-q', '-b', 'main');
  git(ROOT, 'config', 'user.email', 'suite@invalid');
  git(ROOT, 'config', 'user.name', 'suite');

  writeFileSync(join(ROOT, 'README.md'), '# a repository with nothing to hide\n');
  git(ROOT, 'add', '-A');
  git(ROOT, 'commit', '-qm', 'clean baseline');
  BASELINE_COMMIT = git(ROOT, 'rev-parse', 'HEAD');

  writeFileSync(
    join(ROOT, 'deploy.env'),
    Object.entries(CANARIES)
      .map(([name, value], i) => `# line for ${name}\nVALUE_${i}=${value}\n`)
      .join('')
  );
  git(ROOT, 'add', '-A');
  git(ROOT, 'commit', '-qm', 'the mistake');
  PLANTED_COMMIT = git(ROOT, 'rev-parse', 'HEAD');

  unlinkSync(join(ROOT, 'deploy.env'));
  git(ROOT, 'add', '-A');
  git(ROOT, 'commit', '-qm', 'the deletion that does not delete');
});

after(() => rmSync(ROOT, { recursive: true, force: true }));

describe('the scanner can fail, which is what makes its zero mean something', () => {
  test('finds every planted class in history after the file was deleted', () => {
    const r = run(ROOT, '--history', '--json');
    assert.equal(r.code, 1, 'a repository with canaries in history must not exit 0');
    const out = JSON.parse(r.stdout);
    const found = new Set(out.hits.map((h) => h.class));
    for (const name of Object.keys(CANARIES)) {
      assert.ok(found.has(name), `class ${name} was planted and not found`);
    }
    assert.ok(out.hits.every((h) => h.where === 'deploy.env'));
    assert.ok(out.hits.every((h) => typeof h.line === 'number' && h.line > 0));
  });

  test('the tree is clean while history is not, which is the whole hazard', () => {
    const tree = run(ROOT);
    assert.equal(tree.code, 0, 'the file is deleted, so the tree is clean');
    assert.equal(run(ROOT, '--history').code, 1, 'history still carries it');
  });

  test('--since scopes to what arrived after a clean baseline', () => {
    const before = run(ROOT, `--since=${BASELINE_COMMIT}`, '--json');
    assert.equal(before.code, 1, 'the canaries arrived after the baseline');
    const after_ = run(ROOT, `--since=${PLANTED_COMMIT}`, '--json');
    assert.equal(after_.code, 0, 'nothing credential-shaped arrived after the plant');
    assert.equal(JSON.parse(after_.stdout).hits.length, 0);
  });
});

describe('the value is never printed, which the charter requires absolutely', () => {
  test('no canary value appears in any stream, in either output mode', () => {
    for (const args of [['--history'], ['--history', '--json']]) {
      const r = run(ROOT, ...args);
      const everything = `${r.stdout}${r.stderr}`;
      for (const [name, value] of Object.entries(CANARIES)) {
        assert.ok(!everything.includes(value), `${name}'s value was printed by ${args.join(' ')}`);
      }
      // Not even a prefix long enough to be useful to a reader of the log.
      for (const value of Object.values(CANARIES)) {
        assert.ok(!everything.includes(value.slice(0, 12)), 'a usable prefix of a value was printed');
      }
    }
  });

  test('it still says enough to act on: the path, the line and the class', () => {
    const r = run(ROOT, '--history');
    assert.match(r.stdout, /deploy\.env:\d+/);
    assert.match(r.stdout, /aws-access-key-id/);
    assert.match(r.stdout, /rotation is the owner/);
  });
});

describe('a scanner that cannot do its job never reports clean', () => {
  test('refuses a history scan in a shallow clone, exit 2', () => {
    const shallow = mkdtempSync(join(tmpdir(), 'secret-scan-shallow-'));
    rmSync(shallow, { recursive: true, force: true });
    execFileSync('git', ['clone', '-q', '--depth', '1', '--single-branch', `file://${ROOT}`, shallow]);
    try {
      const r = run(shallow, '--history');
      assert.equal(r.code, 2, 'exit 1 or 0 here would be a truncated graph reported as a verdict');
      assert.match(r.stderr, /shallow/);
      assert.match(r.stderr, /ensure-full-clone/);
      const j = run(shallow, '--history', '--json');
      assert.equal(JSON.parse(j.stdout).usable, false);
    } finally {
      rmSync(shallow, { recursive: true, force: true });
    }
  });

  test('measured: this is not a hypothetical, a shallow clone hides the plant', () => {
    const shallow = mkdtempSync(join(tmpdir(), 'secret-scan-shallow2-'));
    rmSync(shallow, { recursive: true, force: true });
    execFileSync('git', ['clone', '-q', '--depth', '1', '--single-branch', `file://${ROOT}`, shallow]);
    try {
      // Git itself, not this tool: one commit of history, so the plant is
      // not in the graph at all. This is why the refusal above exists.
      const objects = execFileSync('git', ['-C', shallow, 'rev-list', '--objects', '--all'], {
        encoding: 'utf8',
      });
      assert.ok(!objects.includes('deploy.env'), 'the plant is invisible in a depth-1 clone');
    } finally {
      rmSync(shallow, { recursive: true, force: true });
    }
  });
});

describe('the class table is the tool\'s declared surface', () => {
  test('--patterns prints every class and nothing else', () => {
    const r = run(ROOT, '--patterns', '--json');
    assert.equal(r.code, 0);
    const names = JSON.parse(r.stdout);
    assert.equal(new Set(names).size, names.length, 'a duplicated class double-counts');
    for (const name of Object.keys(CANARIES)) assert.ok(names.includes(name));
  });

  test('the class count has a floor, so a silent removal is visible', () => {
    const names = JSON.parse(run(ROOT, '--patterns', '--json').stdout);
    assert.ok(names.length >= 16, 'a class was removed without lowering this floor on purpose');
  });
});

// Both regressions below were live defects found by the 2026-10-26 run in
// the version of this tool merged that morning. Each is the same shape: the
// scanner detected a credential and then reported clean, which is the one
// failure mode a scanner must not have.
describe('a credential this tool already detected is never reported clean', () => {
  test('finds an assignment written across two lines, not only on one', () => {
    // `["'\s]*[=:]["'\s]*` glues key to value in three classes, and `\s`
    // matches a newline, so this is in range of the pattern. The scanner
    // used to gate on the whole text and then search line by line, so the
    // gate said yes, the per-line pass said no, and classify returned
    // nothing. Ordinary YAML, not a contrived input.
    const repo = mkdtempSync(join(tmpdir(), 'secret-scan-multiline-'));
    try {
      git(repo, 'init', '-q', '-b', 'main');
      git(repo, 'config', 'user.email', 'suite@invalid');
      git(repo, 'config', 'user.name', 'suite');
      const value = `${'z9'.repeat(14)}`; // assembled, never literal
      writeFileSync(join(repo, 'config.yml'), `client${'_'}secret:\n  "${value}"\n`);
      git(repo, 'add', '-A');
      git(repo, 'commit', '-qm', 'the two-line form');

      const r = run(repo, '--json');
      assert.equal(r.code, 1, 'a credential split over two lines must not exit 0');
      const out = JSON.parse(r.stdout);
      assert.ok(
        out.hits.some((h) => h.class === 'secret-shaped-assignment'),
        'the class whose own pattern matches this text must be the class reported'
      );
      assert.ok(!`${r.stdout}${r.stderr}`.includes(value), 'the value must not be printed');
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  test('scans a file that is tracked but not yet committed', () => {
    // The tree scan read `git show HEAD:<path>`. A staged file does not
    // exist at HEAD, so `git ls-files` listed it, the read threw, and the
    // catch turned it into a clean result. That is the moment the scan is
    // most worth running, because nothing has been pushed yet.
    const repo = mkdtempSync(join(tmpdir(), 'secret-scan-staged-'));
    try {
      git(repo, 'init', '-q', '-b', 'main');
      git(repo, 'config', 'user.email', 'suite@invalid');
      git(repo, 'config', 'user.name', 'suite');
      writeFileSync(join(repo, 'README.md'), '# nothing here\n');
      git(repo, 'add', '-A');
      git(repo, 'commit', '-qm', 'clean baseline');

      writeFileSync(join(repo, 'staged.env'), `KEY=${CANARIES['aws-access-key-id']}\n`);
      git(repo, 'add', 'staged.env'); // staged, deliberately never committed

      const r = run(repo, '--json');
      assert.equal(r.code, 1, 'a staged credential must not exit 0');
      const out = JSON.parse(r.stdout);
      assert.ok(out.hits.some((h) => h.where === 'staged.env'));
      assert.ok(
        !`${r.stdout}${r.stderr}`.includes(CANARIES['aws-access-key-id']),
        'the value must not be printed'
      );
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  test('a file it could not read is counted, never silently dropped', () => {
    // The symmetry with skipped_oversize in history mode: a hole in the
    // measurement is reported so the reader owns it.
    const r = run(ROOT, '--json');
    const out = JSON.parse(r.stdout);
    assert.equal(typeof out.skipped_unreadable, 'number');
  });
});
