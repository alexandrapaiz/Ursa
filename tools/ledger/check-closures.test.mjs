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
  stripFences,
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
  assert.match(violations[0].message, /the title is double-quoted/);
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

// The two false-positive classes below were not predicted. The gate found
// them by failing on its own design document the first time that document was
// tracked: four CLOSURE_SYNTAX violations, from a diagram node, a JSDoc line,
// and two table rows, every one of them prose about the marker rather than an
// attempt at one. These tests are that failure, kept.

test('stripFences empties fenced lines and preserves the line count', () => {
  const body = ['a', '```', 'b', 'c', '```', 'd'].join('\n');
  assert.equal(stripFences(body), ['a', '', '', '', '', 'd'].join('\n'));
});

test('stripFences handles a fence with an info string, and tildes', () => {
  assert.equal(stripFences(['```markdown', 'x', '```'].join('\n')), '\n\n');
  assert.equal(stripFences(['~~~', 'x', '~~~'].join('\n')), '\n\n');
});

test('a marker quoted inside a fenced block is an illustration, not a claim', () => {
  // docs/design/ledger-closure-backlinks.md §7.2 quotes a real marker as its
  // on-disk payload. Counting it would double-count, and a tutorial quoting a
  // made-up entry would fail CLOSURE_RESOLVES, which would make the mechanism
  // impossible to document.
  const body = ['```markdown', marker('2026-01-03', 'An entry a seat called urgent'), '```'].join(
    '\n',
  );
  const { violations, markers } = check(body);
  assert.equal(markers, 0);
  assert.deepEqual(violations, []);
});

test('a table row describing the marker syntax is not a syntax violation', () => {
  // The literal row from the design document that first failed.
  const body =
    '| `CLOSURE_SYNTAX` | a line contains the literal `<!-- closes:` and does ' +
    'not parse as a marker | seat | failing loudly is the point |';
  assert.deepEqual(check(body).violations, []);
});

test('a diagram line and a JSDoc line mentioning the marker are not violations', () => {
  const body = [
    '\u2502 <!-- closes: <path>        \u2502           \u2502',
    '/** `<!-- closes: <ledger-path> <YYYY-MM-DD> "<title>" -->`, global. */',
  ].join('\n');
  assert.deepEqual(check(body).violations, []);
});

test('a typo in a marker written on its own line is still caught', () => {
  // The restriction to lines opening an HTML comment must not cost the rule
  // its subject, which is a marker a seat meant to write and mistyped.
  const { violations } = check(
    "   <!-- closes: docs/ideas.md 2026-01-04 'An entry that shipped' -->",
  );
  assert.equal(violations.length, 1);
  assert.equal(violations[0].rule, 'CLOSURE_SYNTAX');
});

test('a typo inside a fence is not caught, which is the known limitation', () => {
  // Stated as a test rather than left to be rediscovered: a mistyped marker
  // inside a fenced block is unread, and this gate will not say so. The
  // trade is in docs/design/ledger-closure-backlinks.md §9.
  const body = ['```', "<!-- closes: docs/ideas.md 'bad' -->", '```'].join('\n');
  assert.deepEqual(check(body).violations, []);
});

test('the design document for this gate is clean under this gate', () => {
  // The document explains the syntax, quotes a real marker in a fence, draws
  // the marker in an ASCII diagram and tabulates the rule that reads it. If
  // any of those four shapes trips the gate, the gate forbids its own
  // explanation, which is the defect this block of tests exists for.
  const docPath = 'docs/design/ledger-closure-backlinks.md';
  const docSource = readFileSync(`${REPO}/${docPath}`, 'utf8');
  const index = ledgerIndex(readFileSync(`${REPO}/docs/ideas.md`, 'utf8'));
  const { violations, markers } = checkDocument({
    docPath,
    docSource,
    ledgerPath: 'docs/ideas.md',
    index,
  });
  assert.deepEqual(
    violations.map((v) => `${v.rule}: ${v.message}`),
    [],
  );
  assert.equal(markers, 1, 'exactly one live marker: the fenced payload is not one');
});

// Detection is wider than acceptance, which is this run's craft scan applied:
// GitHub accepts nine closing-keyword spellings in any case with an optional
// colon, and the first draft of this gate accepted one and DETECTED one, so a
// near-miss was silently unread. See CLOSURE_ATTEMPT's comment for the source.

test('a near-miss marker is reported rather than silently unread', () => {
  for (const verb of ['fixes', 'resolves', 'closed', 'Closes', 'FIX']) {
    const body = `<!-- ${verb}: docs/ideas.md 2026-01-04 "An entry that shipped" -->`;
    const { violations, markers } = check(body);
    assert.equal(markers, 0, `${verb} must not be accepted as a marker`);
    assert.equal(violations.length, 1, `${verb} must be reported`);
    assert.equal(violations[0].rule, 'CLOSURE_SYNTAX');
    assert.match(violations[0].message, /The one accepted shape is/);
  }
});

test('a missing colon after the verb is reported', () => {
  const { violations } = check('<!-- closes docs/ideas.md 2026-01-04 "An entry that shipped" -->');
  assert.equal(violations.length, 1);
  assert.equal(violations[0].rule, 'CLOSURE_SYNTAX');
});

test('an unrelated HTML comment is not an attempt', () => {
  // The widened detector must not claim every comment in the repository.
  for (const body of [
    '<!-- prettier-ignore -->',
    '<!-- markdownlint-disable MD013 -->',
    '<!-- a note to the next reader about what this section closes over -->',
    '<!-- closeness is not a verb here -->',
  ]) {
    assert.deepEqual(check(body).violations, [], `claimed: ${body}`);
  }
});

test('the canonical spelling is still the only one accepted', () => {
  const { violations, markers } = check(marker('2026-01-04', 'An entry that shipped'));
  assert.equal(markers, 1);
  assert.deepEqual(violations, []);
});
