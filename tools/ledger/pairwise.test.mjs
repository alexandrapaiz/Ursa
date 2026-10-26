// node --test 'tools/ledger/*.test.mjs'
//
// These tests build a real repository on disk and measure real git merges,
// because every claim this tool makes is a claim about what git does. A
// fixture that stubbed `git` would test the stub.
//
// The three fixtures are the three classes the tool reports:
//
//   1. two seats appending ledger entries        -> driver-resolvable
//   2. two seats editing the same line of a file
//      no driver owns                            -> needs-human
//   3. two seats touching disjoint paths          -> filtered out before any
//                                                   merge runs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { measurePairs, classify } from './pairwise.mjs';

const REPO_ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
}).trim();

const run = (dir, ...args) =>
  execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' });

/** A ledger entry in the shape docs/standards/pm.md §4 requires. */
const entry = (name, seat) =>
  [
    '',
    `### 2026-10-26 — ${name}`,
    `- Trigger: the ${seat} seat's fixture for tools/ledger/pairwise.test.mjs`,
    '- What: one entry, appended at the tail of the ledger like every other.',
    '- First step: none, this entry exists only inside a temp repository.',
    '- Cost: $0',
    '- Status: proposed',
    '',
  ].join('\n');

/**
 * A local clone of this repository, plus three plain files the fixtures edit.
 *
 * A hand-built repository was tried first and rejected: copying a subset of
 * `tools/` into a fresh `git init` made `.gitattributes` and
 * `tools/registers/registers.json` disagree, and
 * `tools/registers/install-drivers.sh` correctly refuses that state with five
 * violations. The agreement those two files keep is a property of the
 * repository as a whole, so the fixture has to be the repository. A local
 * clone hardlinks the object database, so this costs no meaningful disk.
 */
function fixture() {
  const parent = mkdtempSync(join(tmpdir(), 'pairwise-fixture-'));
  const dir = join(parent, 'repo');
  execFileSync('git', ['clone', '--local', '--quiet', REPO_ROOT, dir], { encoding: 'utf8' });
  run(dir, 'config', 'user.email', 'fixture@example.invalid');
  run(dir, 'config', 'user.name', 'pairwise fixture');
  run(dir, 'checkout', '--quiet', '-B', 'main');
  writeFileSync(join(dir, 'shared.txt'), 'one\ntwo\nthree\n');
  writeFileSync(join(dir, 'only-a.txt'), 'a\n');
  writeFileSync(join(dir, 'only-b.txt'), 'b\n');
  run(dir, 'add', '-A');
  run(dir, 'commit', '--quiet', '-m', 'pairwise fixture base');
  return { dir, parent };
}

function branch(dir, name, mutate) {
  run(dir, 'checkout', '--quiet', '-b', name, 'main');
  mutate();
  run(dir, 'add', '-A');
  run(dir, 'commit', '--quiet', '-m', name);
  run(dir, 'checkout', '--quiet', 'main');
  return `refs/heads/${name}`;
}

test('two ledger appends are driver-resolvable in both orders, and need no human', () => {
  const { dir, parent } = fixture();
  try {
    branch(dir, 'seat-a', () => appendFileSync(join(dir, 'docs/ideas.md'), entry('A entry', 'first')));
    branch(dir, 'seat-b', () => appendFileSync(join(dir, 'docs/ideas.md'), entry('B entry', 'second')));

    const r = measurePairs({
      root: dir,
      base: 'refs/heads/main',
      heads: [
        { id: 'a', ref: 'refs/heads/seat-a' },
        { id: 'b', ref: 'refs/heads/seat-b' },
      ],
    });

    assert.equal(r.stuckOnBase.length, 0, 'both heads are clean against the trunk');
    assert.equal(r.candidates, 1, 'one pair shares a changed path');
    assert.equal(r.sequences, 2, 'both orders are measured');
    assert.equal(r.findings.length, 2, 'the pair collides under the default merge both ways');
    for (const f of r.findings) {
      assert.deepEqual(f.conflictedUnderDefault, ['docs/ideas.md']);
      assert.deepEqual(f.conflictedUnderDriver, []);
      assert.equal(f.className, 'driver-resolvable');
    }
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test('a collision in a file no driver owns is needs-human', () => {
  const { dir, parent } = fixture();
  try {
    branch(dir, 'seat-a', () => writeFileSync(join(dir, 'shared.txt'), 'one\nA-two\nthree\n'));
    branch(dir, 'seat-b', () => writeFileSync(join(dir, 'shared.txt'), 'one\nB-two\nthree\n'));

    const r = measurePairs({
      root: dir,
      base: 'refs/heads/main',
      heads: [
        { id: 'a', ref: 'refs/heads/seat-a' },
        { id: 'b', ref: 'refs/heads/seat-b' },
      ],
    });

    assert.equal(r.findings.length, 2);
    for (const f of r.findings) {
      assert.deepEqual(f.conflictedUnderDefault, ['shared.txt']);
      assert.deepEqual(f.conflictedUnderDriver, ['shared.txt'], 'no driver owns this path');
      assert.equal(f.className, 'needs-human');
    }
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test('heads with disjoint changed paths are filtered out before any merge runs', () => {
  const { dir, parent } = fixture();
  try {
    branch(dir, 'seat-a', () => writeFileSync(join(dir, 'only-a.txt'), 'a changed\n'));
    branch(dir, 'seat-b', () => writeFileSync(join(dir, 'only-b.txt'), 'b changed\n'));

    const r = measurePairs({
      root: dir,
      base: 'refs/heads/main',
      heads: [
        { id: 'a', ref: 'refs/heads/seat-a' },
        { id: 'b', ref: 'refs/heads/seat-b' },
      ],
    });

    assert.equal(r.candidates, 0, 'the prefilter removes the pair');
    assert.equal(r.sequences, 0, 'so no merge is attempted');
    assert.equal(r.findings.length, 0);
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test('a head that conflicts with the trunk is excluded from every pair', () => {
  const { dir, parent } = fixture();
  try {
    // `seat-a` lands on the trunk, so `seat-b`'s competing edit of the same
    // line now conflicts with the trunk itself. That is requeue.sh's lane.
    branch(dir, 'seat-a', () => writeFileSync(join(dir, 'shared.txt'), 'one\nA-two\nthree\n'));
    branch(dir, 'seat-b', () => writeFileSync(join(dir, 'shared.txt'), 'one\nB-two\nthree\n'));
    branch(dir, 'seat-c', () => appendFileSync(join(dir, 'docs/ideas.md'), entry('C entry', 'third')));
    run(dir, 'merge', '--quiet', '--no-edit', 'refs/heads/seat-a');

    const r = measurePairs({
      root: dir,
      base: 'refs/heads/main',
      heads: [
        { id: 'b', ref: 'refs/heads/seat-b' },
        { id: 'c', ref: 'refs/heads/seat-c' },
      ],
    });

    assert.deepEqual(r.stuckOnBase.map((s) => s.id), ['b']);
    assert.deepEqual(r.stuckOnBase[0].paths, ['shared.txt']);
    assert.equal(r.candidates, 0, 'a trunk-conflicting head forms no pair');
    assert.equal(r.findings.length, 0);
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test('classify reads the two arms and nothing else', () => {
  assert.equal(classify({ status: 0, paths: [] }, null), 'independent');
  assert.equal(
    classify({ status: 1, paths: ['docs/ideas.md'] }, { status: 0, paths: [] }),
    'driver-resolvable',
  );
  assert.equal(
    classify({ status: 1, paths: ['x'] }, { status: 1, paths: ['x'] }),
    'needs-human',
  );
  // A driver arm that was never run cannot license `driver-resolvable`.
  assert.equal(classify({ status: 1, paths: ['x'] }, null), 'needs-human');
});
