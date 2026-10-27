// node --test tools/ledger/check-attributes.test.mjs
//
// check-attributes.mjs is a CLI, so it is tested as one: a real git repository
// built on disk, exit code and stderr out. Two of these tests do not exercise
// the gate at all; they measure the git behaviour the gate's refusal messages
// claim, because a refusal whose reason is only cited is a refusal nobody can
// check. They are named "measured:" and they would fail if git ever changed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const GATE = new URL('./check-attributes.mjs', import.meta.url).pathname;
const REPO_ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
const REAL_REGISTRY = join(REPO_ROOT, 'tools/ledger/drivers.json');

const git = (cwd, ...args) =>
  execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });

function gate(cwd, ...extra) {
  const r = spawnSync(process.execPath, [GATE, '--repo', cwd, ...extra], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

/** A throwaway repository with a `.gitattributes` and a driver registry of our
 *  choosing. `registry` null means copy this repository's real one. */
function fixture({ attributes, registry = null, table = null }) {
  const dir = mkdtempSync(join(tmpdir(), 'attrs-'));
  git(dir, 'init', '-q', '-b', 'main', '.');
  git(dir, 'config', 'user.email', 'seat@ursa.invalid');
  git(dir, 'config', 'user.name', 'test');
  mkdirSync(join(dir, 'tools/ledger'), { recursive: true });
  mkdirSync(join(dir, 'docs/agents'), { recursive: true });
  writeFileSync(join(dir, '.gitattributes'), attributes);
  writeFileSync(
    join(dir, 'tools/ledger/drivers.json'),
    registry === null ? readFileSync(REAL_REGISTRY, 'utf8') : JSON.stringify(registry, null, 2),
  );
  if (table) {
    mkdirSync(join(dir, 'tools/registers'), { recursive: true });
    writeFileSync(join(dir, 'tools/registers/registers.json'), JSON.stringify(table, null, 2));
  }
  writeFileSync(join(dir, 'docs/ideas.md'), '# Ledger\n\n### An entry\n- Status: proposed\n');
  writeFileSync(join(dir, 'docs/agents/incidents.md'), '# Register\n\n## Incident 1\nbody\n');
  writeFileSync(join(dir, 'docs/decisions.md'), '# Decisions\n\n## ADR-001\nbody\n');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-qm', 'fixture');
  return dir;
}

const ONE_DRIVER = {
  drivers: {
    ledger: {
      installer: 'tools/registers/install-drivers.sh',
      config_key: 'merge.ledger.driver',
      command: 'tools/ledger/union-merge.mjs',
      merges: 'docs/ideas.md',
    },
  },
  builtin_allowed: ['text', 'binary'],
  refused: { union: 'it loses records' },
};

test('a declaration whose driver is in the registry passes the committed check', () => {
  const dir = fixture({ attributes: 'docs/ideas.md merge=ledger\n', registry: ONE_DRIVER });
  const r = gate(dir);
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /docs\/ideas\.md -> ledger/);
});

test('merge=union is refused by name, in both modes', () => {
  const dir = fixture({ attributes: 'docs/ideas.md merge=union\n', registry: ONE_DRIVER });
  for (const extra of [[], ['--clone']]) {
    const r = gate(dir, ...extra);
    assert.equal(r.code, 1);
    assert.match(r.err, /declares merge=union, which this repository refuses by name/);
  }
});

test('a driver name no committed script registers is refused', () => {
  const dir = fixture({ attributes: 'docs/ideas.md merge=mystery\n', registry: ONE_DRIVER });
  const r = gate(dir);
  assert.equal(r.code, 1);
  assert.match(r.err, /no script in this repository registers a driver by that name/);
});

test('a built-in that is not union is allowed', () => {
  const dir = fixture({
    attributes: 'docs/ideas.md merge=text\nursa-major/dist/ursa.cjs merge=binary\n',
    registry: ONE_DRIVER,
  });
  assert.equal(gate(dir).code, 0);
});

test('--clone refuses a declared driver this clone has not registered, and names the installer', () => {
  const dir = fixture({ attributes: 'docs/ideas.md merge=ledger\n', registry: ONE_DRIVER });
  assert.equal(gate(dir).code, 0, 'the committed state is fine');
  const before = gate(dir, '--clone');
  // Exit 2, not 1, since 2026-10-26: nothing committed is wrong here and the
  // repair is one command in one working copy rather than a pull request. The
  // assertion was `1` until the day three seats read a clone-only finding as a
  // repository defect; see tools/ledger/attributes-verdict.mjs.
  assert.equal(before.code, 2);
  assert.match(before.err, /this clone has no merge\.ledger\.driver/);
  assert.match(before.err, /Run: bash tools\/registers\/install-drivers\.sh/);
  git(dir, 'config', 'merge.ledger.driver', 'node /dev/null %O %A %B');
  const after = gate(dir, '--clone');
  assert.equal(after.code, 0, after.err);
  assert.match(after.out, /all registered in this clone/);
});

test('a clone-only finding never claims the committed state is wrong', () => {
  // The defect the locus split exists for. One command repairs this and it
  // produces no diff, so the verdict must not send the reader to a tracked
  // file, must not call for a pull request, and must not be an ::error:: a
  // reviewer reads as a defect in the branch.
  const dir = fixture({ attributes: 'docs/ideas.md merge=ledger\n', registry: ONE_DRIVER });
  const r = gate(dir, '--clone');
  assert.equal(r.code, 2);
  assert.match(r.err, /the committed state is correct and nothing here needs a pull request/);
  assert.match(r.err, /per-clone and never committed/);
  assert.match(r.err, /measures as a conflict that is not one/);
  assert.match(r.err, /^::warning::/m);
  assert.doesNotMatch(r.err, /^::error::/m);
});

test('a committed violation and a clone finding together report the committed one, at exit 1', () => {
  // Precedence, and the reason for it: the pull-request-shaped repair is the
  // one that outlives this working copy, so it owns the verdict. The clone
  // finding is still named, and is named as separate from that repair.
  // Both paths are tracked in the fixture, because `git check-attr` is fed
  // from `git ls-files` and an attribute on an untracked path is never read.
  const dir = fixture({
    attributes: 'docs/ideas.md merge=ledger\ndocs/decisions.md merge=union\n',
    registry: ONE_DRIVER,
  });
  const r = gate(dir, '--clone');
  assert.equal(r.code, 1);
  assert.match(r.err, /violation in tracked files/);
  assert.match(r.err, /which is a pull request/);
  assert.match(r.err, /Separately, 1 declaration is not registered in this clone/);
});

test('a path sent to a driver its own table does not enable is refused', () => {
  const registry = JSON.parse(JSON.stringify(ONE_DRIVER));
  registry.drivers.register = {
    installer: 'tools/registers/install-drivers.sh',
    config_key: 'merge.register.driver',
    command: 'tools/registers/merge-driver.mjs',
    merges: 'the enabled registers',
    table: { path: 'tools/registers/registers.json' },
  };
  const dir = fixture({
    attributes: 'docs/agents/incidents.md merge=register\n',
    registry,
    table: { registers: [{ path: 'docs/agents/incidents.md', enabled: false }] },
  });
  const r = gate(dir);
  assert.equal(r.code, 1);
  assert.match(r.err, /does not enable it, so the driver refuses the path by name/);
});

test('a register its table enables but no attribute sends there is refused', () => {
  const registry = JSON.parse(JSON.stringify(ONE_DRIVER));
  registry.drivers.register = {
    installer: 'tools/registers/install-drivers.sh',
    config_key: 'merge.register.driver',
    command: 'tools/registers/merge-driver.mjs',
    merges: 'the enabled registers',
    table: { path: 'tools/registers/registers.json' },
  };
  const dir = fixture({
    attributes: 'docs/ideas.md merge=ledger\n',
    registry,
    table: { registers: [{ path: 'docs/decisions.md', enabled: true }] },
  });
  const r = gate(dir);
  assert.equal(r.code, 1);
  assert.match(r.err, /no \.gitattributes line sends it to merge=register/);
});

test('this repository passes its own committed check', () => {
  const r = gate(REPO_ROOT);
  assert.equal(r.code, 0, r.err);
});

test('the registry cannot lie: every driver it lists is set by the installer it names', () => {
  const registry = JSON.parse(readFileSync(REAL_REGISTRY, 'utf8'));
  const dir = mkdtempSync(join(tmpdir(), 'clone-'));
  const clone = join(dir, 'repo');
  // A real clone, not a worktree: a linked worktree shares .git/config with the
  // clone that made it, so installing into one would mutate the caller's config
  // and the assertion would pass on config this test did not write.
  execFileSync('git', ['clone', '--quiet', '--shared', REPO_ROOT, clone]);

  // Every key unset first, in one pass. Checking each key just before running
  // its own installer proves nothing when two drivers share an installer: the
  // first run sets both, and the second driver's precondition is already false.
  const entries = Object.entries(registry.drivers);
  for (const [name, entry] of entries) {
    assert.equal(
      spawnSync('git', ['-C', clone, 'config', '--get', entry.config_key], { encoding: 'utf8' })
        .stdout.trim(),
      '',
      `${name}: ${entry.config_key} must start unset in a fresh clone, or this proves nothing`,
    );
  }

  for (const installer of new Set(entries.map(([, e]) => e.installer))) {
    const r = spawnSync('bash', [join(clone, installer)], { cwd: clone, encoding: 'utf8' });
    assert.equal(r.status, 0, `${installer} failed: ${r.stderr}`);
  }

  for (const [name, entry] of entries) {
    const got = git(clone, 'config', '--get', entry.config_key).trim();
    assert.ok(got.includes(entry.command), `${name}: ${entry.config_key} is ${got || '(unset)'}`);
  }
});

test('measured: git says nothing when a declared driver is not registered', () => {
  // The claim in check-attributes.mjs's header and in L-A49. git 2.43.0.
  const dir = fixture({ attributes: 'docs/ideas.md merge=mystery\n', registry: ONE_DRIVER });
  git(dir, 'checkout', '-qb', 'a');
  writeFileSync(join(dir, 'docs/ideas.md'),
    readFileSync(join(dir, 'docs/ideas.md'), 'utf8') + '\n### Entry A\n- Status: proposed\n');
  git(dir, 'commit', '-qam', 'a');
  git(dir, 'checkout', '-q', 'main');
  git(dir, 'checkout', '-qb', 'b');
  writeFileSync(join(dir, 'docs/ideas.md'),
    readFileSync(join(dir, 'docs/ideas.md'), 'utf8') + '\n### Entry B\n- Status: proposed\n');
  git(dir, 'commit', '-qam', 'b');
  git(dir, 'checkout', '-q', 'a');
  const r = spawnSync('git', ['-C', dir, 'merge', 'b', '-m', 'm'], { encoding: 'utf8' });
  assert.equal(r.status, 1, 'the default line merge conflicts on two appends');
  const streams = `${r.stdout}${r.stderr}`;
  assert.match(streams, /CONFLICT \(content\)/);
  assert.ok(
    !/mystery/.test(streams),
    `git named the unregistered driver, so the silent-fallback premise is stale: ${streams}`,
  );
});

test('measured: merge=union merges two register entries into one and a half, at exit 0', () => {
  // The reason text in drivers.json's `refused` table, re-performed here.
  const dir = fixture({ attributes: 'docs/ideas.md merge=union\n', registry: ONE_DRIVER });
  const entry = (name) => `\n### Entry ${name}\n- Cost: $0\n- Status: proposed\n`;
  git(dir, 'checkout', '-qb', 'a');
  writeFileSync(join(dir, 'docs/ideas.md'),
    readFileSync(join(dir, 'docs/ideas.md'), 'utf8') + entry('A'));
  git(dir, 'commit', '-qam', 'a');
  git(dir, 'checkout', '-q', 'main');
  git(dir, 'checkout', '-qb', 'b');
  writeFileSync(join(dir, 'docs/ideas.md'),
    readFileSync(join(dir, 'docs/ideas.md'), 'utf8') + entry('B'));
  git(dir, 'commit', '-qam', 'b');
  git(dir, 'checkout', '-q', 'a');
  const r = spawnSync('git', ['-C', dir, 'merge', 'b', '-m', 'm'], { encoding: 'utf8' });

  assert.equal(r.status, 0, 'union reports success, which is the whole problem');
  const merged = readFileSync(join(dir, 'docs/ideas.md'), 'utf8');
  assert.equal((merged.match(/^<<<<<<</gm) ?? []).length, 0, 'and leaves no marker');
  // Both headings survive, so a count of entries says the merge was fine.
  assert.ok(merged.includes('### Entry A'));
  assert.ok(merged.includes('### Entry B'));
  // Only one body does. Entry A's `- Cost:` and `- Status:` lines were aligned
  // with Entry B's identical ones as shared context, so what is left reads as
  // Entry A having Entry B's body: a false record, not merely a lost one.
  assert.equal((merged.match(/^- Status: proposed$/gm) ?? []).length, 2,
    'the base entry plus ONE of the two appended entries');
  assert.match(merged, /### Entry A\n### Entry B\n- Cost: \$0\n- Status: proposed/,
    'the two headings end up adjacent with a single shared body under them');
});
