// Tests for the closure-backlink gate.
//
// Every fixture below is a minimal ledger and a minimal document, written
// inline, because the gate's subject is the relation between two files and a
// fixture on disk would hide which half of the pair a failure came from. The
// last two tests run against the real repository, since a gate that passes
// on fixtures and cannot read the real ledger has been tested on the wrong
// file (that is the mistake `block-kinds.mjs`'s header records costing weeks
// of red on `main`).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve as resolvePath } from 'node:path';
import {
  CLOSURE_MARKER,
  checkDocument,
  checkRepository,
  ledgerIndex,
  trackedMarkdown,
} from './check-closures.mjs';

const REPO = resolvePath(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** A ledger with one entry per status, so one index serves every case. */
const LEDGER = [
  '# Ideas',
  '',
  '### 2026-01-01 — An entry the owner never ruled on',
  '- Status: proposed',
  '',
  '### 2026-01-02 — An entry the owner accepted',
  '- Status: accepted',
  '',
  '### 2026-01-03 — An entry a seat called urgent',
  '- Status: urgent',
  '',
  '### 2026-01-04 — An entry that shipped',
  '- Status: built (evidence: a file on main)',
  '',
  '### 2026-01-05 — An entry the owner turned down',
  '- Status: rejected',
  '',
  '### 2026-01-06 (engineer, hook run) — An entry with a seat tag',
  '- Status: urgent',
  '',
  '### 2026-01-07 — An entry that states no status at all',
  '- What: nothing else',
  '',
].join('\n');

const INDEX = ledgerIndex(LEDGER);

/** @param {string} body one document's contents */
const check = (body) =>
  checkDocument({
    docPath: 'docs/design/thing.md',
    docSource: body,
    ledgerPath: 'docs/ideas.md',
    index: INDEX,
  });

const marker = (date, title, path = 'docs/ideas.md') =>
  `<!-- closes: ${path} ${date} "${title}" -->`;

test('the index keys every entry by date and title, and reads its status', () => {
  assert.equal(INDEX.size, 7);
  assert.equal(INDEX.get('2026-01-04\u0000An entry that shipped')?.status, 'built');
  assert.equal(INDEX.get('2026-01-07\u0000An entry that states no status at all')?.status, null);
});

test('a seat tag in the heading is not part of the key', () => {
  // The marker names date and title only. The tag `(engineer, hook run)` is
  // information about who filed the entry, and keying on it would make every
  // marker break when a seat renamed itself.
  const entry = INDEX.get('2026-01-06\u0000An entry with a seat tag');
  assert.notEqual(entry, undefined);
  assert.equal(entry?.status, 'urgent');
});

test('a marker on a built entry is clean', () => {
  const { violations, markers } = check(`Prose. ${marker('2026-01-04', 'An entry that shipped')}`);
  assert.equal(markers, 1);
  assert.deepEqual(violations, []);
});

test('a marker on a rejected entry is clean, because rejected is also closed', () => {
  const { violations } = check(marker('2026-01-05', 'An entry the owner turned down'));
  assert.deepEqual(violations, []);
});

test('a marker on an urgent entry is a seat-held violation', () => {
  const { violations } = check(marker('2026-01-03', 'An entry a seat called urgent'));
  assert.equal(violations.length, 1);
  assert.equal(violations[0].rule, 'CLOSURE_STATUS');
  assert.equal(violations[0].held, 'seat');
  assert.match(violations[0].message, /status "urgent"/);
  assert.match(violations[0].message, /move the entry to "built" with the evidence/);
});

test('a marker on an accepted entry is a seat-held violation', () => {
  const { violations } = check(marker('2026-01-02', 'An entry the owner accepted'));
  assert.equal(violations.length, 1);
  assert.equal(violations[0].held, 'seat');
});

test('a marker on a proposed entry is the owner\'s, not the seat\'s', () => {
  // This is the case that must not be a seat error. pm.md §4 gives only the
  // owner the move out of `proposed`, so a seat that shipped work for an
  // unaccepted idea cannot clear this and should not be told to.
  const { violations } = check(marker('2026-01-01', 'An entry the owner never ruled on'));
  assert.equal(violations.length, 1);
  assert.equal(violations[0].held, 'owner');
  assert.match(violations[0].message, /only her the move out of "proposed"/);
});

test('a marker on an entry with no status is seat-held, not a crash', () => {
  const { violations } = check(marker('2026-01-07', 'An entry that states no status at all'));
  assert.equal(violations.length, 1);
  assert.equal(violations[0].held, 'seat');
  assert.match(violations[0].message, /states no status/);
});

test('a marker that resolves to nothing is reported, with the repair named', () => {
  const { violations } = check(marker('2026-01-04', 'An entry that was renamed last week'));
  assert.equal(violations.length, 1);
  assert.equal(violations[0].rule, 'CLOSURE_RESOLVES');
  assert.equal(violations[0].held, 'seat');
  assert.match(violations[0].message, /heading text after the em dash, verbatim/);
});

test('a marker naming another ledger file is skipped, not guessed at', () => {
  const { violations, markers } = check(
    marker('2026-01-03', 'An entry a seat called urgent', 'docs/standards/lessons.md'),
  );
  assert.equal(markers, 1);
  assert.deepEqual(violations, []);
});

test('a line that tries to be a marker and fails to parse is reported', () => {
  // Single quotes instead of double, which is the typo this shape invites.
  const { violations } = check("<!-- closes: docs/ideas.md 2026-01-04 'An entry that shipped' -->");
  assert.equal(violations.length, 1);
  assert.equal(violations[0].rule, 'CLOSURE_SYNTAX');
  assert.match(violations[0].message, /title double-quoted/);
});

test('a missing date is a syntax violation rather than a silent skip', () => {
  const { violations } = check('<!-- closes: docs/ideas.md "An entry that shipped" -->');
  assert.equal(violations.length, 1);
  assert.equal(violations[0].rule, 'CLOSURE_SYNTAX');
});

test('two markers in one document are both checked', () => {
  const { violations, markers } = check(
    [
      marker('2026-01-04', 'An entry that shipped'),
      marker('2026-01-03', 'An entry a seat called urgent'),
    ].join('\n'),
  );
  assert.equal(markers, 2);
  assert.equal(violations.length, 1);
});

test('a document with no marker contributes nothing', () => {
  const { violations, markers } = check('A design document that closes nothing.');
  assert.equal(markers, 0);
  assert.deepEqual(violations, []);
});

test('the marker regex is global and does not carry state between documents', () => {
  // A `/g` regex reused with `.test()` advances `lastIndex`, which would make
  // every second call miss. `matchAll` resets it; this asserts the property
  // rather than the implementation.
  const body = marker('2026-01-04', 'An entry that shipped');
  assert.equal([...body.matchAll(CLOSURE_MARKER)].length, 1);
  assert.equal([...body.matchAll(CLOSURE_MARKER)].length, 1);
});

test('the real ledger parses into an index with every entry keyed', () => {
  const source = readFileSync(`${REPO}/docs/ideas.md`, 'utf8');
  const index = ledgerIndex(source);
  const headings = source.split('\n').filter((l) => l.startsWith('### ')).length;
  assert.ok(index.size > 200, `expected the real ledger to index, got ${index.size}`);
  assert.equal(
    index.size,
    headings,
    'every `### ` heading in the real ledger is keyable: a heading this gate ' +
      'cannot key is a closure marker nobody can write',
  );
});

test('the real repository is clean under this gate', () => {
  // The gate ships green and is expected to stay green. A failure here is
  // either a closure marker pointing at an entry nobody moved, which is the
  // defect the gate was built for, or a renamed entry whose marker did not
  // follow it.
  const { violations } = checkRepository({ cwd: REPO, ledgerPath: 'docs/ideas.md' });
  assert.deepEqual(
    violations.map((v) => `${v.rule} ${v.message}`),
    [],
  );
});

test('trackedMarkdown lists committed markdown and nothing else', () => {
  const files = trackedMarkdown(REPO);
  assert.ok(files.includes('docs/ideas.md'));
  assert.ok(files.includes('prompts/engineer-agent.md'));
  assert.ok(
    files.every((f) => f.endsWith('.md')),
    'the glob is *.md, so a non-markdown path means the listing changed shape',
  );
  assert.ok(
    !files.some((f) => f.includes('node_modules/')),
    'git ls-files is used precisely so dependency trees are not read',
  );
});
