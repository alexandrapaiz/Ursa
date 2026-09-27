// node --test tools/ledger/
// Zero dependencies on purpose: a git merge driver has to run during a merge
// in a checkout where nothing has been installed, so its tests run the same way.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseLedger, renderLedger, mergeLedgers } from './ledger.mjs';

const BASE = [
  '# The Ledger — Ursa',
  '',
  'Contract in docs/standards/pm.md §4.',
  '',
  '### 2026-09-18 — Repo split: Major and Minor',
  '- Trigger: owner at bootstrap',
  '- Status: proposed',
  '',
  '- 2026-09-25 (chair): alexandria MCP queried for Minor.',
  '',
].join('\n');

const withEntry = (base, entry) => base.replace(/\n*$/, '\n') + '\n' + entry + '\n';

const ENGINEER_ENTRY = [
  '### 2026-09-27 — Ledger blocks, not ledger lines',
  '- Trigger: four PRs conflicting in one file',
  '- Status: proposed',
].join('\n');

const MARKET_ENTRY = [
  '### 2026-09-26 — Landscape scan cadence',
  '- Trigger: nine competitors, three categories',
  '- Status: proposed',
].join('\n');

test('parse then render is byte-identical on the real ledger', () => {
  const source = readFileSync(new URL('../../docs/ideas.md', import.meta.url), 'utf8');
  assert.equal(renderLedger(parseLedger(source)), source);
});

test('a dated bullet note is its own block, not part of the entry above it', () => {
  const kinds = parseLedger(BASE).map((b) => b.kind);
  assert.deepEqual(kinds, ['preamble', 'entry', 'note']);
});

test('two seats appending at the end is not a conflict', () => {
  const ours = withEntry(BASE, ENGINEER_ENTRY);
  const theirs = withEntry(BASE, MARKET_ENTRY);
  const { merged, conflicts } = mergeLedgers(BASE, ours, theirs);
  assert.deepEqual(conflicts, []);
  assert.match(merged, /Ledger blocks, not ledger lines/);
  assert.match(merged, /Landscape scan cadence/);
  // Our append stays ahead of theirs; neither is reordered into the preamble.
  assert.ok(merged.indexOf('Ledger blocks') < merged.indexOf('Landscape scan'));
  assert.ok(merged.indexOf('Repo split') < merged.indexOf('Ledger blocks'));
});

test('three seats appending is still not a conflict, applied pairwise', () => {
  const a = withEntry(BASE, ENGINEER_ENTRY);
  const b = withEntry(BASE, MARKET_ENTRY);
  const first = mergeLedgers(BASE, a, b);
  const c = withEntry(BASE, '### 2026-09-27 — Third seat\n- Trigger: x\n- Status: proposed');
  const second = mergeLedgers(BASE, first.merged, c);
  assert.deepEqual(second.conflicts, []);
  for (const needle of ['Ledger blocks', 'Landscape scan', 'Third seat']) {
    assert.match(second.merged, new RegExp(needle));
  }
});

test('an owner status change on one side and an append on the other both survive', () => {
  const ours = BASE.replace('- Status: proposed', '- Status: accepted (owner-directed)');
  const theirs = withEntry(BASE, ENGINEER_ENTRY);
  const { merged, conflicts } = mergeLedgers(BASE, ours, theirs);
  assert.deepEqual(conflicts, []);
  assert.match(merged, /- Status: accepted \(owner-directed\)/);
  assert.match(merged, /Ledger blocks, not ledger lines/);
  // The base entry carries the owner's new status; only the appended entry
  // is still `proposed`.
  assert.match(merged, /Repo split: Major and Minor\n- Trigger: owner at bootstrap\n- Status: accepted \(owner-directed\)/);
  assert.equal((merged.match(/- Status: proposed/g) ?? []).length, 1);
});

test('the same entry edited differently on both sides is a real conflict, not a silent pick', () => {
  const ours = BASE.replace('- Status: proposed', '- Status: accepted');
  const theirs = BASE.replace('- Status: proposed', '- Status: rejected');
  const { merged, conflicts } = mergeLedgers(BASE, ours, theirs);
  assert.equal(conflicts.length, 1);
  assert.match(merged, /<<<<<<< ours/);
  assert.match(merged, /- Status: accepted/);
  assert.match(merged, /- Status: rejected/);
  assert.match(merged, />>>>>>> theirs/);
});

test('conflict marker size honors git %L', () => {
  const ours = BASE.replace('- Status: proposed', '- Status: accepted');
  const theirs = BASE.replace('- Status: proposed', '- Status: rejected');
  const { merged } = mergeLedgers(BASE, ours, theirs, 9);
  assert.match(merged, /<{9} ours/);
});

test('a deletion on one side is honored when the other side left the block alone', () => {
  const ours = BASE.replace(/### 2026-09-18[\s\S]*?- Status: proposed\n/, '');
  const theirs = withEntry(BASE, ENGINEER_ENTRY);
  const { merged, conflicts } = mergeLedgers(BASE, ours, theirs);
  assert.deepEqual(conflicts, []);
  assert.doesNotMatch(merged, /Repo split/);
  assert.match(merged, /Ledger blocks, not ledger lines/);
});

test('heading identity ignores case and inner whitespace drift', () => {
  const ours = withEntry(BASE, ENGINEER_ENTRY);
  const theirs = withEntry(BASE, ENGINEER_ENTRY.replace('### 2026-09-27 — Ledger', '###  2026-09-27 — ledger'));
  const { merged, conflicts } = mergeLedgers(BASE, ours, theirs);
  assert.equal(conflicts.length, 1, 'same idea, different body: a human decides');
  assert.equal((merged.match(/2026-09-27/g) ?? []).length, 2, 'not duplicated into two entries');
});

test('an empty ancestor (both sides added the file) merges both sides', () => {
  const { merged, conflicts } = mergeLedgers('', withEntry(BASE, ENGINEER_ENTRY), withEntry(BASE, MARKET_ENTRY));
  assert.deepEqual(conflicts, []);
  assert.match(merged, /Ledger blocks/);
  assert.match(merged, /Landscape scan/);
});

// The case the first real merge exposed. `main` renamed an entry's heading
// ("Upstream: Linear board-of-record practice to HQ" gained "(WITHDRAWN
// 2026-09-25, ADR-006)"), which under identity merging is a deletion of one
// block plus an addition of another, and the driver reported "1 removed".
// That is correct, and it is only correct while a concurrent edit to the same
// entry still conflicts instead of vanishing with the old heading.
const RENAMED = BASE.replace(
  '### 2026-09-18 — Repo split: Major and Minor',
  '### 2026-09-18 — Repo split: Major and Minor (WITHDRAWN 2026-09-25)',
);

test('a heading renamed on one side replaces the old block, not duplicates it', () => {
  const { merged, conflicts, removed } = mergeLedgers(BASE, withEntry(BASE, ENGINEER_ENTRY), RENAMED);
  assert.deepEqual(conflicts, []);
  assert.equal(removed.length, 1);
  assert.equal((merged.match(/Repo split: Major and Minor/g) ?? []).length, 1);
  assert.match(merged, /\(WITHDRAWN 2026-09-25\)/);
  assert.match(merged, /Ledger blocks, not ledger lines/);
});

test('a body edit does not vanish when the other side renames that heading', () => {
  const ours = BASE.replace('- Status: proposed', '- Status: accepted (owner-directed)');
  const { merged, conflicts } = mergeLedgers(BASE, ours, RENAMED);
  assert.equal(conflicts.length, 1, 'the rename and the edit are a real disagreement');
  assert.match(merged, /- Status: accepted \(owner-directed\)/, 'our edit is still in the file');
  assert.match(merged, /<<<<<<< ours/);
});
