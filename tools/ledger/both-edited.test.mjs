// node --test 'tools/ledger/*.test.mjs'
//
// These tests build real repositories on disk and run real git merges and
// real `git rev-list`, because every claim the tool makes is a claim about
// what git reports. A fixture that stubbed `git` would test the stub. This is
// the convention pairwise.test.mjs already set in this directory.
//
// The four fixtures are the four states the tool distinguishes:
//
//   1. two seats appending different entries          -> nothing to reread
//   2. two seats editing different lines of ONE entry -> reported, live
//   3. the same pair after the branch forward-merges
//      the trunk, which moves the merge base past the
//      trunk's edit                                   -> reported, hidden_by
//   4. two seats adding the same heading with
//      different bodies                               -> reported as `added`
//
// Fixture 3 is the one the tool exists for. Fixtures 1 and 2 would both be
// visible in a plain `git diff`; fixture 3 would not, and it is the shape
// this repository actually hit on 2026-11-02 (PR #615, commit 744dc12e).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { measureBranch, blocksOf, bothEdited, managedPaths } from './both-edited.mjs';

const REPO_ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
}).trim();

const run = (cwd, args) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1' } });

const write = (root, path, body) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), body);
};

const commit = (root, path, body, message) => {
  write(root, path, body);
  run(root, ['add', '-A']);
  run(root, ['commit', '-q', '-m', message]);
  return run(root, ['rev-parse', 'HEAD']).trim();
};

/**
 * A repository with `.gitattributes` routing docs/ideas.md to the ledger
 * driver and docs/decisions.md to the register driver, and a `trunk` branch
 * standing in for origin/main. The driver itself is registered too, so the
 * merges these tests run are the merges `tools/ledger/requeue.sh` runs.
 */
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'both-edited-'));
  run(root, ['init', '-q', '-b', 'trunk']);
  run(root, ['config', 'user.email', 'test@example.invalid']);
  run(root, ['config', 'user.name', 'test']);
  run(root, ['config', 'merge.ledger.name', 'ledger']);
  run(root, [
    'config',
    'merge.ledger.driver',
    `node ${join(REPO_ROOT, 'tools/ledger/union-merge.mjs')} %O %A %B %L %P`,
  ]);
  write(root, '.gitattributes', 'docs/ideas.md merge=ledger\ndocs/decisions.md merge=register\n');
  return root;
}

const LEDGER_BASE = `# Ideas

### 2026-01-01 — The shared entry

- Trigger: something observed
- What: the original paragraph
- First step: the original step
- Cost: $0
- Status: proposed
`;

/** The same entry with one of its bullets rewritten, leaving the rest alone. */
const edited = (which, text) =>
  LEDGER_BASE.replace(new RegExp(`- ${which}: [^\\n]*`), `- ${which}: ${text}`);

test('two seats appending different entries leaves nothing to reread', () => {
  const root = fixture();
  commit(root, 'docs/ideas.md', LEDGER_BASE, 'base');
  run(root, ['checkout', '-q', '-b', 'branch']);
  commit(root, 'docs/ideas.md', `${LEDGER_BASE}\n### 2026-02-01 — Branch entry\n\n- Status: proposed\n`, 'branch appends');
  run(root, ['checkout', '-q', 'trunk']);
  commit(root, 'docs/ideas.md', `${LEDGER_BASE}\n### 2026-02-02 — Trunk entry\n\n- Status: proposed\n`, 'trunk appends');

  const r = measureBranch({ root, base: 'trunk', branch: 'branch' });
  assert.deepEqual(r.blocks, []);
  assert.equal(r.points.length, 1, 'only the live comparison, no forward merges');
  rmSync(root, { recursive: true, force: true });
});

test('two seats editing different lines of one entry is reported while it is still live', () => {
  const root = fixture();
  commit(root, 'docs/ideas.md', LEDGER_BASE, 'base');
  run(root, ['checkout', '-q', '-b', 'branch']);
  commit(root, 'docs/ideas.md', edited('What', 'the branch paragraph'), 'branch edits What');
  run(root, ['checkout', '-q', 'trunk']);
  commit(root, 'docs/ideas.md', edited('First step', 'the trunk step'), 'trunk edits First step');

  const r = measureBranch({ root, base: 'trunk', branch: 'branch' });
  assert.equal(r.blocks.length, 1);
  assert.equal(r.blocks[0].path, 'docs/ideas.md');
  assert.match(r.blocks[0].key, /the shared entry/);
  assert.equal(r.blocks[0].how, 'edited');
  assert.deepEqual(r.blocks[0].hidden_by, [], 'the merge has not happened yet');
  rmSync(root, { recursive: true, force: true });
});

test('a forward merge hides the pair from the live diff, and the tool recovers it', () => {
  const root = fixture();
  commit(root, 'docs/ideas.md', LEDGER_BASE, 'base');
  run(root, ['checkout', '-q', '-b', 'branch']);
  commit(root, 'docs/ideas.md', edited('What', 'the branch paragraph'), 'branch edits What');
  run(root, ['checkout', '-q', 'trunk']);
  commit(root, 'docs/ideas.md', edited('First step', 'the trunk step'), 'trunk edits First step');
  run(root, ['checkout', '-q', 'branch']);

  // The driver refuses this merge and names the block, which is correct and is
  // not the gap. The gap is what happens next: a seat resolves it by hand,
  // keeping both sides, and commits. From here on the resolution is text like
  // any other text. This is commit 744dc12e on ursa-engineer/2026-11-01-hook,
  // whose own message says it resolved the one real content conflict.
  assert.throws(() => run(root, ['merge', '--no-ff', '-m', 'Merge trunk', 'trunk']), /edited on both sides/);
  write(
    root,
    'docs/ideas.md',
    LEDGER_BASE.replace('- What: the original paragraph', '- What: the branch paragraph').replace(
      '- First step: the original step',
      '- First step: the trunk step',
    ),
  );
  run(root, ['add', '-A']);
  run(root, ['commit', '-q', '-m', 'Merge trunk into branch, resolving the one content conflict']);

  // The premise: after the forward merge the branch contains the trunk, so
  // the live three-dot diff attributes the whole block to the branch alone.
  const trunkSide = run(root, ['diff', 'branch...trunk', '--', 'docs/ideas.md']);
  assert.equal(trunkSide.trim(), '', 'the trunk has nothing the branch lacks, so the pair is invisible');

  const r = measureBranch({ root, base: 'trunk', branch: 'branch' });
  assert.equal(r.points.length, 2, 'the live comparison plus the one forward merge');
  assert.equal(r.blocks.length, 1);
  assert.match(r.blocks[0].key, /the shared entry/);
  assert.equal(r.blocks[0].how, 'edited');
  assert.equal(r.blocks[0].hidden_by.length, 1);
  assert.match(r.blocks[0].hidden_by[0], /resolving the one content conflict/);
  assert.deepEqual(r.blocks[0].at.includes('head'), false, 'not live any more, only recovered');
  rmSync(root, { recursive: true, force: true });
});

test('one heading added on both sides with different bodies is reported as added', () => {
  const root = fixture();
  commit(root, 'docs/ideas.md', LEDGER_BASE, 'base');
  run(root, ['checkout', '-q', '-b', 'branch']);
  commit(root, 'docs/ideas.md', `${LEDGER_BASE}\n### 2026-03-01 — Same heading\n\n- Status: proposed\n`, 'branch adds');
  run(root, ['checkout', '-q', 'trunk']);
  commit(root, 'docs/ideas.md', `${LEDGER_BASE}\n### 2026-03-01 — Same heading\n\n- Status: accepted\n`, 'trunk adds');

  const r = measureBranch({ root, base: 'trunk', branch: 'branch' });
  assert.equal(r.blocks.length, 1);
  assert.equal(r.blocks[0].how, 'added');
  assert.match(r.blocks[0].key, /same heading/);
  rmSync(root, { recursive: true, force: true });
});

test('a register path is read with the register grammar, not the ledger one', () => {
  const root = fixture();
  const REG = '# Decisions\n\n## ADR-1 — First\n\nbody one\n\n## ADR-2 — Second\n\nbody two\n';
  commit(root, 'docs/decisions.md', REG, 'base');
  run(root, ['checkout', '-q', '-b', 'branch']);
  commit(root, 'docs/decisions.md', REG.replace('body one', 'body one, amended by the branch'), 'branch');
  run(root, ['checkout', '-q', 'trunk']);
  commit(root, 'docs/decisions.md', REG.replace('body one\n', 'body one\n\nand a trunk sentence\n'), 'trunk');

  const r = measureBranch({ root, base: 'trunk', branch: 'branch' });
  assert.equal(r.blocks.length, 1);
  assert.equal(r.blocks[0].path, 'docs/decisions.md');
  assert.match(r.blocks[0].key, /adr-1/);
  rmSync(root, { recursive: true, force: true });
});

test('blocksOf keys registers on ## headings and ignores an empty preamble', () => {
  const m = blocksOf('register', '## A — one\n\nx\n\n## B — two\n\ny\n');
  assert.deepEqual([...m.keys()], ['## a — one', '## b — two']);
  const withPreamble = blocksOf('register', 'intro\n\n## A — one\n\nx\n');
  assert.deepEqual([...withPreamble.keys()], ['__preamble__', '## a — one']);
});

test('a block only one side touched is not reported', () => {
  const root = fixture();
  commit(root, 'docs/ideas.md', LEDGER_BASE, 'base');
  run(root, ['checkout', '-q', '-b', 'branch']);
  commit(root, 'docs/ideas.md', edited('What', 'only the branch moved this'), 'branch edits');
  const paths = managedPaths(root, 'trunk');
  assert.deepEqual(
    bothEdited(root, 'trunk', 'branch', 'trunk', paths),
    [],
    'one-sided edits are the normal case and must stay silent',
  );
  rmSync(root, { recursive: true, force: true });
});
