// node --test tools/ledger/block-kinds.test.mjs
// Unit tests for the contract classifier, plus three assertions against the
// real docs/ideas.md. The real-file assertions are deliberate: the defect this
// module was written to fix survived for weeks underneath a passing unit test
// whose fixture did not resemble any block in the file, so the fixtures below
// are copied from real blocks and the file itself is also measured.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseLedger } from './ledger.mjs';
import { classifyBlock, presentIdeaFields } from './block-kinds.mjs';

const LEDGER = new URL('../../docs/ideas.md', import.meta.url).pathname;

/** One `### ` block, as parseLedger would hand it over. */
function entry(text) {
  const blocks = parseLedger(text);
  const e = blocks.filter((b) => b.kind === 'entry');
  assert.equal(e.length, 1, `fixture must parse to exactly one entry, got ${e.length}`);
  return e[0];
}

const IDEA = [
  '### 2026-10-24 — A well-formed idea',
  '- Trigger: an observation',
  '- What: one concrete paragraph',
  '- First step: a day-sized unit of work',
  '- Cost: $0',
  '- Status: proposed',
].join('\n');

// The field shape of the real `### 2026-10-08 — Craft scan: Mem0, and memory
// history as a user-facing surface`: a Trigger, two bespoke headings of its
// own, a Cost and a Status. Three of §4's five names appear in it, which is
// why the old `present.length > 0` exemption did not fire and why this note
// was one of the twelve violations.
const SCAN_WITH_FIELDS = [
  '### 2026-10-08 — Craft scan: Mem0, and memory history as a user-facing surface',
  '- Trigger: the daily craft scan, rotating onto Category 3 of the landscape',
  '- Worth stealing: memory history, a per-memory record of how it changed',
  '- Where Ursa is ahead, concretely: `forget` is tested against derived data',
  '- Cost: $0',
  '- Status: proposed',
].join('\n');

test('an idea carrying all five fields is an idea', () => {
  const c = classifyBlock(entry(IDEA));
  assert.equal(c.kind, 'idea');
  assert.equal(c.date, '2026-10-24');
  assert.equal(c.seatTag, null);
  assert.equal(c.title, 'A well-formed idea');
  assert.equal(c.headingWellFormed, true);
});

test('a seat tag after the date is parsed out, not rejected', () => {
  const c = classifyBlock(entry(IDEA.replace('2026-10-24 —', '2026-10-24 (engineer) —')));
  assert.equal(c.kind, 'idea');
  assert.equal(c.seatTag, '(engineer)');
});

test('a scan note is a scan even when it uses three of the five field names', () => {
  const block = entry(SCAN_WITH_FIELDS);
  // The precondition that made this the live defect: the old exemption was
  // `presentIdeaFields(text).length === 0`, and this real note has three.
  assert.deepEqual(presentIdeaFields(block.text), ['Trigger', 'Cost', 'Status']);
  assert.equal(classifyBlock(block).kind, 'scan');
});

test('both spellings seats use are recognised, and the parenthetical one', () => {
  const titles = [
    'Craft scan: Vercel preview deployments',
    'Competitive scan: Arena (arena.ai)',
    "Competitive scan (engineer's craft scan): LangSmith and the feedback join",
    'CRAFT SCAN: case is not the discriminator',
  ];
  for (const t of titles) {
    const c = classifyBlock(entry(`### 2026-10-24 — ${t}\n- Worth stealing: something`));
    assert.equal(c.kind, 'scan', `expected a scan for ${JSON.stringify(t)}`);
  }
});

test('a scan heading that commits a day of work is an idea, not a scan', () => {
  const c = classifyBlock(
    entry(
      [
        '### 2026-10-24 — Craft scan: a competitor, and the thing Ursa should build',
        '- Trigger: the daily scan',
        '- First step: write the module',
      ].join('\n'),
    ),
  );
  assert.equal(c.kind, 'idea', 'a `- First step:` line is the commitment that makes it an idea');
});

test('a heading that merely mentions scanning is not a scan note', () => {
  const titles = [
    'The redaction scan should run before a seat readies',
    'Scanning every blob reachable from every ref',
  ];
  for (const t of titles) {
    const c = classifyBlock(entry(`### 2026-10-24 — ${t}\n- Trigger: x`));
    assert.equal(c.kind, 'idea', `expected an idea for ${JSON.stringify(t)}`);
  }
});

test('a malformed heading is an idea, so it is reported rather than exempted', () => {
  const c = classifyBlock(entry('### Craft scan: no date at all\n- Worth stealing: something'));
  assert.equal(c.headingWellFormed, false);
  assert.equal(c.kind, 'idea', 'guessing the looser contract here would hide the defect');
  assert.equal(c.title, null);
});

test('the preamble and the chair’s dated note bullets owe no field contract', () => {
  const blocks = parseLedger(
    ['# The Ledger', '', '- 2026-09-25 (chair): overlay S0 shipped and verified', ''].join('\n'),
  );
  for (const b of blocks) assert.equal(classifyBlock(b).kind, 'other');
});

// ---------------------------------------------------------------------------
// Measured against the real file. These are the assertions that would have
// caught the original defect, because the original defect was a property of
// the file and not of any fixture.
// ---------------------------------------------------------------------------

const realBlocks = parseLedger(readFileSync(LEDGER, 'utf8'));
const classified = realBlocks.map((b) => ({ block: b, c: classifyBlock(b) }));

test('every real heading that announces a scan is classified as one', () => {
  // A sweep for the failure that matters: a seat invents a spelling of the
  // scan heading that SCAN_TITLE does not know, the block silently becomes an
  // `idea`, and the gate goes red on a note that owes nothing.
  //
  // The sweep has to be looser than SCAN_TITLE or it tests nothing, and it
  // cannot be as loose as "the title mentions a scan" or it sweeps in ideas
  // ABOUT scanning. The 2026-10-24 entry `Eight of the fourteen craft scans
  // in the ledger name nothing they read` is the real block that proved the
  // looser version wrong: a 24-word title using `craft scans` as a plural
  // noun in the middle of a sentence. An announcement is short and sits
  // before a colon (`Craft scan:`, `Competitive scan (engineer's craft
  // scan):`, the longest real one being six words), so the sweep is "the
  // segment before the first colon mentions a scan AND is at most eight
  // words", which admits two words of slack for a spelling nobody has used
  // yet and excludes every sentence-length title in the file.
  const ANNOUNCEMENT_MAX_WORDS = 8;
  const named = classified.filter(({ c }) => {
    if (c.title === null) return false;
    const head = c.title.split(':')[0];
    return /\bscans?\b/i.test(head) && head.trim().split(/\s+/).length <= ANNOUNCEMENT_MAX_WORDS;
  });
  assert.ok(named.length >= 14, `expected at least the 14 known scan notes, found ${named.length}`);
  const missed = named.filter(({ c }) => c.kind !== 'scan').map(({ c }) => c.heading);
  assert.deepEqual(
    missed,
    [],
    'a scan note the classifier does not recognise owes §4’s five fields and will go red; ' +
      'either the heading needs the standard spelling or SCAN_TITLE needs the new one',
  );
});

test('exempting scan notes costs no checking that was happening before', () => {
  // The zero-regression claim in block-kinds.mjs, as a test. Measured at
  // 2026-10-24: no scan note in the file carried all five §4 fields, so every
  // block that moves from `idea` to `scan` was already failing or already
  // exempt, and none of them was passing the five-field check.
  const scansThatWerePassing = classified
    .filter(({ c }) => c.kind === 'scan')
    .filter(({ block }) => presentIdeaFields(block.text).length === 5)
    .map(({ c }) => c.heading);
  assert.deepEqual(
    scansThatWerePassing,
    [],
    'this scan note satisfies §4 in full, so exempting it loses a check that was passing',
  );
});

test('no scan note in the real file commits a day of work it has not filed as an idea', () => {
  const offenders = classified
    .filter(({ c }) => c.kind === 'scan')
    .filter(({ block }) => /^-\s+First step:/m.test(block.text));
  assert.deepEqual(offenders, [], 'COMMITS_WORK should have reclassified these as ideas');
});
