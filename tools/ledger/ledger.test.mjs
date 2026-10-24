// node --test tools/ledger/
// Zero dependencies on purpose: a git merge driver has to run during a merge
// in a checkout where nothing has been installed, so its tests run the same way.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

/**
 * Where two strings first differ, as a line number and the lines around it.
 *
 * WHY THIS EXISTS. The assertion below used to be a bare `assert.equal` on two
 * 630,000-character strings, and `node:assert` renders that failure as
 * `'   wire dom'... 633582 more characters` against `633581`. That tells a
 * reader the file is wrong by one byte and nothing about which byte, on a file
 * where the cause is a single missing blank line. It cost an hour on
 * 2026-10-24 (the ledger entry "The ledger's own contract gate has been red on
 * main for long enough that nobody is reading it"), and then the same drift
 * reappeared at a different line the same day and would have cost it again.
 * The invariant is unchanged; only its failure message is.
 *
 * @param {string} actual
 * @param {string} expected
 * @param {string} label the file the expected side came from, for the report
 * @returns {string | null} null when equal, else a multi-line report
 */
function firstDifference(actual, expected, label = 'docs/ideas.md') {
  if (actual === expected) return null;
  let i = 0;
  while (i < actual.length && i < expected.length && actual[i] === expected[i]) i += 1;
  const line = expected.slice(0, i).split('\n').length;
  const window = (s) => JSON.stringify(s.slice(Math.max(0, i - 120), i + 80));
  return [
    `first difference at byte ${i}, ${label} line ${line}`,
    `  expected (the file on disk): ${window(expected)}`,
    `  actual (what the renderer writes): ${window(actual)}`,
    '',
    'Run `node tools/ledger/check.mjs <file>`: rule BLOCK_SEPARATION reports',
    'this class of drift by line number, which is almost always what this is.',
  ].join('\n');
}

test('parse then render is byte-identical on the real ledger', () => {
  const source = readFileSync(new URL('../../docs/ideas.md', import.meta.url), 'utf8');
  const diff = firstDifference(renderLedger(parseLedger(source)), source);
  assert.equal(diff, null, `docs/ideas.md does not survive its own round trip.\n${diff}`);
});

test('the round-trip report names the line a dropped blank line is on', () => {
  // The diagnosis is itself tested, because a failure message is only worth
  // writing if it is right, and this one is only ever read while something
  // else is already broken.
  const source = ['# The Ledger', '', '### 2026-09-27 — One', '- Status: proposed', ''].join('\n');
  const dropped = source.replace('\n\n### 2026-09-27', '\n### 2026-09-27');
  const diff = firstDifference(renderLedger(parseLedger(dropped)), dropped, 'fixture.md');
  // Line 2 and not line 3: the bytes agree through `# The Ledger\n`, and the
  // first that differ are the heading's own line, which is where the blank
  // line should have been. That is the line a reader needs to open.
  assert.match(diff, /first difference at byte 13, fixture\.md line 2/);
  assert.match(diff, /BLOCK_SEPARATION/);
  assert.equal(firstDifference(source, source), null);
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

// --- Refusals, added 2026-10-24 -------------------------------------------
// This driver used to merge any file it was handed. The exo seat asked whether
// it could be pointed at docs/agents/incidents.md, a register whose entries are
// `## ` headings; the answer measured below is that doing so corrupts the file
// without saying so, which is worse than the conflict it would replace. These
// tests pin the refusal that now stands in the way.

test('a side holding one block key twice is refused rather than merged', () => {
  // The mechanism, isolated. `index()` keeps only the last block under a
  // repeated key while the emit loop still visits every one, so the merge
  // duplicates one block and drops the others.
  const base = ['# L', '', '### 2026-09-18 — a', '- Status: proposed', ''].join('\n');
  const dup = [
    '# L',
    '',
    '### 2026-09-18 — a',
    '- Status: proposed',
    '',
    '### 2026-09-18 — a',
    '- Status: proposed',
    '- a second block under the same heading',
    '',
  ].join('\n');
  const r = mergeLedgers(base, dup, base, 7);
  assert.ok(r.refusal, 'it must refuse');
  assert.match(r.refusal, /more than once/);
  assert.match(r.refusal, /2026-09-18 — a/);
  assert.equal(r.merged, dup, 'and leave our side untouched for the caller to fall back on');
});

test('the duplicate refusal names the side that holds the duplicate', () => {
  const base = ['# L', '', '### 2026-09-18 — a', '- Status: proposed', ''].join('\n');
  const dup = [base.replace(/\n$/, ''), '', '### 2026-09-18 — a', '- again', ''].join('\n');
  assert.match(mergeLedgers(base, dup, base, 7).refusal, /^ours holds/);
  assert.match(mergeLedgers(base, base, dup, 7).refusal, /^theirs holds/);
});

test('a file that parses to no entries at all is refused, not resolved by picking a side', () => {
  // A driver pointed at a file with no `### ` heading and no dated note bullet
  // sees one preamble block. Merging that is choosing a side for the whole
  // file, which is how a real disagreement disappears.
  const base = '# Some document\n\nA paragraph.\n';
  const r = mergeLedgers(base, `${base}\nOur sentence.\n`, `${base}\nTheir sentence.\n`, 7);
  assert.ok(r.refusal, 'it must refuse');
  assert.match(r.refusal, /no entries at all/);
  assert.match(r.refusal, /tools\/registers\/registers\.json/, 'and point at where the other grammars are');
});

test('the real incidents register is refused by this grammar, with its duplicate keys named', () => {
  // The measurement the exo seat's note asked about, as an assertion against
  // the real file rather than a fixture. Before this refusal existed, merging
  // two clean appends to this register produced 75 `## ` entries out of two
  // sides holding at most 42, and 372,901 bytes out of 183,353 and 209,366.
  const register = readFileSync(new URL('../../docs/agents/incidents.md', import.meta.url), 'utf8');
  const blocks = parseLedger(register);
  assert.ok(blocks.length > 1, 'this grammar does see blocks in it, which is the trap');
  const keys = blocks.map((b) => b.key);
  assert.notEqual(new Set(keys).size, keys.length, 'and they are not unique');

  const ours = `${register}\n## INC-2026-10-24-ours — a\n\n**Status:** open.\n`;
  const theirs = `${register}\n## INC-2026-10-24-theirs — b\n\n**Status:** open.\n`;
  const r = mergeLedgers(register, ours, theirs, 7);
  assert.ok(r.refusal, 'the real file must be refused');
  assert.match(r.refusal, /more than once/);
  assert.match(r.refusal, /what happened/i, 'the sub-heading it wrongly keyed on is named');
});

test('the ideas ledger itself still merges two concurrent appends with no refusal', () => {
  // The guard must not cost the thing it guards. Asserted on the real ledger.
  const ledger = readFileSync(new URL('../../docs/ideas.md', import.meta.url), 'utf8');
  const ours = `${ledger}\n### 2026-10-24 — ours\n- Trigger: t\n- Status: proposed\n`;
  const theirs = `${ledger}\n### 2026-10-24 — theirs\n- Trigger: t\n- Status: proposed\n`;
  const r = mergeLedgers(ledger, ours, theirs, 7);
  assert.equal(r.refusal, null);
  assert.equal(r.conflicts.length, 0);
  assert.ok(r.merged.includes('### 2026-10-24 — ours'));
  assert.ok(r.merged.includes('### 2026-10-24 — theirs'));
});

test('a clean merge still reports refusal: null, so a caller can test one field', () => {
  const base = ['# L', '', '### 2026-09-18 — a', '- Status: proposed', ''].join('\n');
  const r = mergeLedgers(base, base, base, 7);
  assert.equal(r.refusal, null);
});

test('union-merge.mjs turns a refusal into a conflicted file and a non-zero exit', () => {
  // The driver, not the function. git takes %A as the working-tree copy
  // whatever the exit status, so a driver that refuses and leaves our version
  // in place hands back a file that reads clean. This asserts the fallback.
  const dir = mkdtempSync(join(tmpdir(), 'ursa-ledger-driver-'));
  const base = '# Some document\n\nA paragraph.\n';
  const o = join(dir, 'o');
  const a = join(dir, 'a');
  const b = join(dir, 'b');
  writeFileSync(o, base);
  writeFileSync(a, `${base}\nOur sentence.\n`);
  writeFileSync(b, `${base}\nTheir sentence.\n`);

  let status = 0;
  let stderr = '';
  try {
    execFileSync('node', [join(import.meta.dirname, 'union-merge.mjs'), o, a, b, '7', 'docs/not-a-ledger.md'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    status = err.status;
    stderr = err.stderr ?? '';
  }
  const left = readFileSync(a, 'utf8');
  rmSync(dir, { recursive: true, force: true });

  assert.equal(status, 1, 'git must be told this needs a human');
  assert.match(stderr, /refusing to merge docs\/not-a-ledger\.md/);
  assert.match(stderr, /no entries at all/);
  assert.ok(left.includes('<<<<<<<'), 'the working-tree copy carries conflict markers');
  assert.ok(left.includes('Our sentence.') && left.includes('Their sentence.'), 'both sides survive for the human');
});
