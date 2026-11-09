// Tests for tools/seat/duplicate-repair.mjs.
//
// The positive control inside the tool is the live check that it has not
// stopped grading. These are the unit tests for the four parts a reading is
// built from: the entry grammar, the hunk mapping, the append filter, and the
// class assignment. Every git call is injected, so nothing here depends on
// this clone's history — which matters because the motivating instance lives
// on two open pull requests and will leave the object store when they land.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import {
  registers,
  entrySpans,
  entryAt,
  editedEntries,
  repairCommits,
  concurrent,
  messageBetween,
  grade,
  patchId,
  runControl,
  auditVerdict,
  boardCanDecide,
  BOARD_STATES,
  NON_SEAT_AUTHORS,
} from './duplicate-repair.mjs';

// ---------------------------------------------------------------- the control

test('the positive control passes', () => {
  const r = runControl();
  assert.equal(r.failures.join('; '), '');
  assert.equal(r.ok, true);
});

test('the control covers all four classes, so no class is untested', () => {
  const r = runControl();
  assert.ok(r.checked >= 6, `only ${r.checked} control assertions`);
});

// ------------------------------------------------------------ the entry grammar

test('entrySpans keys on the identifier capture when one is declared', () => {
  const text = [
    '# title',
    '## 1. first fact',
    'body',
    '## 2. second fact',
    'body',
  ].join('\n');
  const spans = entrySpans(text, { heading: '^## ', identifier: '^## ([0-9]+[a-z]?)\\.' });
  assert.deepEqual(spans.map((s) => s.id), ['1', '2']);
  assert.deepEqual(spans.map((s) => s.start), [2, 4]);
});

test('a heading that matches the heading pattern but not the identifier is not an entry', () => {
  // runner-facts.md carries prose sections at the same depth as its numbered
  // facts. Counting those as entries would key two unrelated sections to one
  // name and manufacture duplications out of ordinary prose edits.
  const text = ['## 1. a fact', 'a', '## Notes on reading this file', 'b', '## 2. another', 'c'].join('\n');
  const spans = entrySpans(text, { heading: '^## ', identifier: '^## ([0-9]+[a-z]?)\\.' });
  assert.deepEqual(spans.map((s) => s.id), ['1', '2']);
  // and the prose section's lines belong to NO entry. This assertion was the
  // other way round when it was written, on the reasoning that attributing is
  // better than dropping. It is not: two seats editing a shared prose section
  // are not repairing an entry, so crediting the numbered fact above it
  // manufactures a duplication of a fact nobody touched.
  assert.equal(entryAt(spans, 4), null);
  assert.equal(entryAt(spans, 2), '1');
});

test('entrySpans falls back to the normalised heading text when identifier is null', () => {
  const text = ['### 2026-11-02 —  a   spaced   heading ', 'body', '### another', 'b'].join('\n');
  const spans = entrySpans(text, { heading: '^### ', identifier: null });
  assert.deepEqual(spans.map((s) => s.id), ['### 2026-11-02 — a spaced heading', '### another']);
});

test('a span ends at the next heading of its own depth or shallower', () => {
  // Markdown nesting: a ### section cannot contain a ## one. docs/ideas.md
  // declares ^###  as its entry grammar and carries ## blocks above it, so
  // without this every append of a ## block read as an edit to whichever
  // ### entry had just stopped being last.
  const text = ['### E1', 'a', '#### deeper', 'still e1', '## a shallower block', 'not e1', '### E2', 'b'].join('\n');
  const spans = entrySpans(text, { heading: '^### ', identifier: null });
  assert.deepEqual(spans.map((s) => s.id), ['### E1', '### E2']);
  assert.equal(entryAt(spans, 4), '### E1');     // the deeper heading nests
  assert.equal(entryAt(spans, 6), null);         // the shallower one does not
});

test('spans are contiguous and the last one runs to the end of the file', () => {
  const text = ['## A', '1', '2', '## B', '3'].join('\n');
  const spans = entrySpans(text, { heading: '^## ', identifier: null });
  assert.equal(spans[0].end, 3);
  assert.equal(spans[1].start, 4);
  assert.ok(spans[1].end >= 5);
  assert.equal(entryAt(spans, 1), '## A');
  assert.equal(entryAt(spans, 3), '## A');
  assert.equal(entryAt(spans, 5), '## B');
});

test('entryAt returns null above the first heading, which is register preamble', () => {
  const text = ['# register', 'preamble', '## A', 'x'].join('\n');
  const spans = entrySpans(text, { heading: '^## ', identifier: null });
  assert.equal(entryAt(spans, 2), null);
});

test('a file with no headings yields no entries rather than throwing', () => {
  assert.deepEqual(entrySpans('just prose\nmore prose', { heading: '^## ', identifier: null }), []);
});

// ------------------------------------------------------- editedEntries, injected

/** A fake `git` that answers `show` from a table by revision. `editedEntries`
 *  compares the two revisions' content and never shells out to `diff`, so
 *  `show` is the whole surface a stub has to cover. */
function fakeRun(table) {
  return (args) => {
    if (args[0] === 'show') {
      const spec = args[1];
      const [rev, path] = spec.split(':');
      const entry = table[rev];
      if (!entry || entry[path] === undefined) throw new Error(`no ${spec}`);
      return entry[path];
    }
    throw new Error(`unexpected ${args.join(' ')}`);
  };
}

const REG = { path: 'r.md', heading: '^## ', identifier: null };

test('a rewrite inside a pre-existing entry is reported', () => {
  const pre = ['## A', 'old line', '## B', 'b'].join('\n');
  const post = ['## A', 'new line', '## B', 'b'].join('\n');
  const run = fakeRun({
    'sha^1': { 'r.md': pre }, sha: { 'r.md': post },
  });
  assert.deepEqual(editedEntries('sha', REG, { run }), ['## A']);
});

test('a pure append of a NEW entry is not a repair', () => {
  // This is the append filter and it is the difference between a reading and
  // noise: every seat here appends to every register every run.
  const pre = ['## A', 'a'].join('\n');
  const post = ['## A', 'a', '## B', 'b'].join('\n');
  const run = fakeRun({
    'sha^1': { 'r.md': pre }, sha: { 'r.md': post },
  });
  assert.deepEqual(editedEntries('sha', REG, { run }), []);
});

test('an added line INSIDE a pre-existing entry is a repair', () => {
  // The measured instance is exactly this: a contract field written into an
  // entry authored a week earlier. An append filter keyed on "the hunk only
  // adds lines" would have discarded the whole finding.
  const pre = ['## A', 'a', '## B', 'b'].join('\n');
  const post = ['## A', 'a', 'Effect: measured', '## B', 'b'].join('\n');
  const run = fakeRun({
    'sha^1': { 'r.md': pre }, sha: { 'r.md': post },
  });
  assert.deepEqual(editedEntries('sha', REG, { run }), ['## A']);
});

test('a deletion is mapped through the PRE-image, so a removed entry still counts', () => {
  const pre = ['## A', 'stale', '## B', 'b'].join('\n');
  const post = ['## A', '## B', 'b'].join('\n');
  const run = fakeRun({
    'sha^1': { 'r.md': pre }, sha: { 'r.md': post },
  });
  assert.deepEqual(editedEntries('sha', REG, { run }), ['## A']);
});

test('a register that did not exist in the parent yields nothing', () => {
  const run = fakeRun({ sha: { 'r.md': '## A\na' } });
  assert.deepEqual(editedEntries('sha', REG, { run }), []);
});

test('a register deleted by the commit yields nothing rather than throwing', () => {
  const run = fakeRun({ 'sha^1': { 'r.md': '## A\na' } });
  assert.deepEqual(editedEntries('sha', REG, { run }), []);
});

test('two entries edited in one commit are both reported', () => {
  const pre = ['## A', 'a', '## B', 'b'].join('\n');
  const post = ['## A', 'a2', '## B', 'b2'].join('\n');
  const run = fakeRun({
    'sha^1': { 'r.md': pre }, sha: { 'r.md': post },
  });
  assert.deepEqual(editedEntries('sha', REG, { run }).sort(), ['## A', '## B']);
});

// --------------------------------------------------------------- repairCommits

test('repairCommits pairs each commit with the registers it actually touched', () => {
  const regs = [{ path: 'a.md' }, { path: 'b.md' }];
  const log = [
    '\u0001sha1\t2026-11-09T05:00:00+00:00\tursa-skill\tfirst',
    'a.md',
    '',
    '\u0001sha2\t2026-11-09T05:10:00+00:00\tursa-engineer\tsecond',
    'a.md',
    'b.md',
  ].join('\n');
  const got = repairCommits({ regs, run: () => log });
  assert.deepEqual(got.map((c) => [c.sha, c.actor, c.files]), [
    ['sha1', 'ursa-skill', ['a.md']],
    ['sha2', 'ursa-engineer', ['a.md', 'b.md']],
  ]);
});

test('the owner is dropped, and her file lines do not leak onto the next commit', () => {
  // The regression this asserts: skipping the owner AFTER pushing her record
  // left `cur` pointing at a dropped object, and the next lines were silently
  // discarded. Skipping it while leaving `cur` set would attach her merge's
  // files to the previous seat's commit instead.
  assert.ok(NON_SEAT_AUTHORS.has('alexandrapaiz'));
  const log = [
    '\u0001m1\t2026-11-09T05:00:00+00:00\talexandrapaiz\tMerge pull request #1',
    'a.md',
    '\u0001sha2\t2026-11-09T05:10:00+00:00\tursa-engineer\treal work',
    'a.md',
  ].join('\n');
  const got = repairCommits({ regs: [{ path: 'a.md' }], run: () => log });
  assert.deepEqual(got.map((c) => c.sha), ['sha2']);
  assert.deepEqual(got[0].files, ['a.md']);
});

test('a file line that is not a declared register is ignored', () => {
  const log = ['\u0001s\t2026-11-09T05:00:00+00:00\tursa-pm\tx', 'a.md', 'src/other.ts'].join('\n');
  const got = repairCommits({ regs: [{ path: 'a.md' }], run: () => log });
  assert.deepEqual(got[0].files, ['a.md']);
});

test('a subject containing a tab survives, because register subjects are prose', () => {
  const log = ['\u0001s\t2026-11-09T05:00:00+00:00\tursa-pm\ta\tb', 'a.md'].join('\n');
  const got = repairCommits({ regs: [{ path: 'a.md' }], run: () => log });
  assert.equal(got[0].subject, 'a\tb');
});

// ------------------------------------------------------------------ concurrency

test('concurrent is false when either side is an ancestor', () => {
  const run = (args) => {
    if (args[2] === 'x' && args[3] === 'y') return '';
    throw new Error('no');
  };
  assert.equal(concurrent('x', 'y', { run }), false);
  assert.equal(concurrent('y', 'x', { run }), false);
});

test('concurrent is true when neither side is an ancestor', () => {
  const run = () => { throw new Error('no'); };
  assert.equal(concurrent('x', 'y', { run }), true);
});

// -------------------------------------------------------------- messageBetween

const ROWS = [
  { ts: '2026-11-09T05:20:00Z', from_seat: 'skill', to_seat: 'engineer', subject: 'in window' },
  { ts: '2026-11-09T04:00:00Z', from_seat: 'skill', to_seat: 'engineer', subject: 'too early' },
  { ts: '2026-11-09T05:25:00Z', from_seat: 'skill', to_seat: 'pm', subject: 'wrong party' },
];

test('a message between the two actors inside the interval is found', () => {
  const hit = messageBetween(ROWS, 'ursa-skill', 'ursa-engineer', '2026-11-09T05:16:00Z', '2026-11-09T05:33:00Z');
  assert.equal(hit.subject, 'in window');
});

test('the match is direction-agnostic, because either seat telling the other closes the gap', () => {
  const hit = messageBetween(ROWS, 'ursa-engineer', 'ursa-skill', '2026-11-09T05:16:00Z', '2026-11-09T05:33:00Z');
  assert.equal(hit.subject, 'in window');
});

test('a message outside the interval does not count', () => {
  assert.equal(messageBetween(ROWS, 'ursa-skill', 'ursa-engineer', '2026-11-09T05:16:00Z', '2026-11-09T05:19:00Z'), null);
});

test('a message to a third party does not count', () => {
  assert.equal(messageBetween(ROWS, 'ursa-skill', 'ursa-pm', '2026-11-09T05:16:00Z', '2026-11-09T05:19:00Z'), null);
});

test('the ursa- prefix on a git author is stripped to a board seat name', () => {
  // The two surfaces name the same actor differently: git says `ursa-skill`
  // and the board says `skill`. Without the strip, every pair would grade
  // DUPLICATED because no message could ever match.
  const hit = messageBetween(ROWS, 'skill', 'engineer', '2026-11-09T05:16:00Z', '2026-11-09T05:33:00Z');
  assert.equal(hit.subject, 'in window');
});

// ------------------------------------------------------------------------ grade

const C = (sha, ts, actor) => ({ sha, ts, actor, subject: sha });

test('two concurrent actors on one entry with no message grade DUPLICATED', () => {
  const commits = [C('a', '2026-11-09T05:00:00Z', 'ursa-skill'), C('b', '2026-11-09T05:10:00Z', 'ursa-engineer')];
  const edits = new Map([['a', [{ path: 'r.md', id: 'E' }]], ['b', [{ path: 'r.md', id: 'E' }]]]);
  const g = grade(commits, edits, { rows: [], run: () => { throw new Error('no'); } });
  assert.equal(g.counts.DUPLICATED, 1);
  assert.equal(g.pairs[0].gap_seconds, 600);
  assert.equal(g.pairs[0].same_actor, false);
});

test('two actors on DIFFERENT entries are not a pair', () => {
  const commits = [C('a', '2026-11-09T05:00:00Z', 'ursa-skill'), C('b', '2026-11-09T05:10:00Z', 'ursa-engineer')];
  const edits = new Map([['a', [{ path: 'r.md', id: 'E1' }]], ['b', [{ path: 'r.md', id: 'E2' }]]]);
  const g = grade(commits, edits, { rows: [], run: () => { throw new Error('no'); } });
  assert.equal(g.pairs.length, 0);
  assert.equal(g.entries, 2);
});

test('the same entry id in two DIFFERENT registers is two buckets', () => {
  const commits = [C('a', '2026-11-09T05:00:00Z', 'ursa-skill'), C('b', '2026-11-09T05:10:00Z', 'ursa-engineer')];
  const edits = new Map([['a', [{ path: 'x.md', id: 'E' }]], ['b', [{ path: 'y.md', id: 'E' }]]]);
  const g = grade(commits, edits, { rows: [], run: () => { throw new Error('no'); } });
  assert.equal(g.pairs.length, 0);
});

test('a message between them grades COORDINATED instead', () => {
  const commits = [C('a', '2026-11-09T05:00:00Z', 'ursa-skill'), C('b', '2026-11-09T05:10:00Z', 'ursa-engineer')];
  const edits = new Map([['a', [{ path: 'r.md', id: 'E' }]], ['b', [{ path: 'r.md', id: 'E' }]]]);
  const rows = [{ ts: '2026-11-09T05:05:00Z', from_seat: 'skill', to_seat: 'engineer', subject: 'I have this half' }];
  const g = grade(commits, edits, { rows, run: () => { throw new Error('no'); } });
  assert.equal(g.counts.COORDINATED, 1);
  assert.equal(g.pairs[0].message.subject, 'I have this half');
});

test('an ancestor relation grades SEQUENTIAL and is never DUPLICATED', () => {
  const commits = [C('a', '2026-11-09T05:00:00Z', 'ursa-skill'), C('b', '2026-11-09T05:10:00Z', 'ursa-engineer')];
  const edits = new Map([['a', [{ path: 'r.md', id: 'E' }]], ['b', [{ path: 'r.md', id: 'E' }]]]);
  const g = grade(commits, edits, { rows: [], run: () => '' });   // everything an ancestor
  assert.equal(g.counts.SEQUENTIAL, 1);
  assert.equal(g.counts.DUPLICATED, 0);
});

test('no board rows grades INDETERMINATE, never DUPLICATED', () => {
  const commits = [C('a', '2026-11-09T05:00:00Z', 'ursa-skill'), C('b', '2026-11-09T05:10:00Z', 'ursa-engineer')];
  const edits = new Map([['a', [{ path: 'r.md', id: 'E' }]], ['b', [{ path: 'r.md', id: 'E' }]]]);
  const g = grade(commits, edits, { rows: null, run: () => { throw new Error('no'); } });
  assert.equal(g.counts.INDETERMINATE, 1);
  assert.equal(g.counts.DUPLICATED, 0);
});

test('a pair older than the board reach grades INDETERMINATE even with rows present', () => {
  // The anachronism guard. Grading a 2026-10-01 pair against a board read
  // that only reaches 2026-11-02 would call every old pair DUPLICATED, which
  // is a property of the store's retention and not of the two seats.
  const commits = [C('a', '2026-10-01T05:00:00Z', 'ursa-skill'), C('b', '2026-10-01T05:10:00Z', 'ursa-engineer')];
  const edits = new Map([['a', [{ path: 'r.md', id: 'E' }]], ['b', [{ path: 'r.md', id: 'E' }]]]);
  const coverage = { covers: (ts) => ts >= '2026-11-02T00:00:00Z' };
  const g = grade(commits, edits, { rows: [], coverage, run: () => { throw new Error('no'); } });
  assert.equal(g.counts.INDETERMINATE, 1);
});

test('two concurrent commits by ONE actor are a pair and are flagged same_actor', () => {
  // The proposal's sharpest instance: two windows of one seat, which
  // own-prs.mjs cannot see because a sibling window is not a sibling seat.
  const commits = [C('a', '2026-11-09T05:00:00Z', 'ursa-exo'), C('b', '2026-11-09T05:10:00Z', 'ursa-exo')];
  const edits = new Map([['a', [{ path: 'r.md', id: 'E' }]], ['b', [{ path: 'r.md', id: 'E' }]]]);
  const g = grade(commits, edits, { rows: [], run: () => { throw new Error('no'); } });
  assert.equal(g.pairs.length, 1);
  assert.equal(g.pairs[0].same_actor, true);
  assert.equal(g.pairs[0].klass, 'DUPLICATED');
});

test('three sequential commits by one actor on one entry are ONE representative, not three', () => {
  // A seat that touches an entry in three commits of one run did one repair.
  // Counting the commits would inflate every bucket by run length, which is
  // how a gauge reports a busy seat as a colliding one.
  const commits = [
    C('a', '2026-11-09T05:00:00Z', 'ursa-exo'),
    C('b', '2026-11-09T05:05:00Z', 'ursa-exo'),
    C('c', '2026-11-09T05:10:00Z', 'ursa-exo'),
  ];
  const edits = new Map(['a', 'b', 'c'].map((s) => [s, [{ path: 'r.md', id: 'E' }]]));
  const g = grade(commits, edits, { rows: [], run: () => '' });   // all ancestors
  assert.equal(g.pairs.length, 0);
});

test('a sequential run of one actor plus a concurrent other actor is exactly one pair', () => {
  const commits = [
    C('a1', '2026-11-09T05:00:00Z', 'ursa-exo'),
    C('a2', '2026-11-09T05:05:00Z', 'ursa-exo'),
    C('b1', '2026-11-09T05:10:00Z', 'ursa-pm'),
  ];
  const edits = new Map([['a1', [{ path: 'r.md', id: 'E' }]], ['a2', [{ path: 'r.md', id: 'E' }]], ['b1', [{ path: 'r.md', id: 'E' }]]]);
  const run = (args) => {
    const [, , x, y] = args;
    if (x === 'a1' && y === 'a2') return '';
    throw new Error('no');
  };
  const g = grade(commits, edits, { rows: [], run });
  assert.equal(g.pairs.length, 1);
  assert.equal(g.pairs[0].first.actor, 'ursa-exo');
  assert.equal(g.pairs[0].second.actor, 'ursa-pm');
});

test('the earlier commit is always `first`, whatever order the log gave them', () => {
  const commits = [C('b', '2026-11-09T05:10:00Z', 'ursa-engineer'), C('a', '2026-11-09T05:00:00Z', 'ursa-skill')];
  const edits = new Map([['a', [{ path: 'r.md', id: 'E' }]], ['b', [{ path: 'r.md', id: 'E' }]]]);
  const g = grade(commits, edits, { rows: [], run: () => { throw new Error('no'); } });
  assert.equal(g.pairs[0].first.actor, 'ursa-skill');
  assert.ok(g.pairs[0].gap_seconds > 0);
});

test('three concurrent actors on one entry yield three pairs', () => {
  const commits = [
    C('a', '2026-11-09T05:00:00Z', 'ursa-a'),
    C('b', '2026-11-09T05:05:00Z', 'ursa-b'),
    C('c', '2026-11-09T05:10:00Z', 'ursa-c'),
  ];
  const edits = new Map(['a', 'b', 'c'].map((s) => [s, [{ path: 'r.md', id: 'E' }]]));
  const g = grade(commits, edits, { rows: [], run: () => { throw new Error('no'); } });
  assert.equal(g.pairs.length, 3);
  assert.equal(g.counts.DUPLICATED, 3);
});

// -------------------------------------------------------------------- registers

test('registers() reads this repository\'s own table and includes the disabled ones', () => {
  // `enabled` governs which MERGE DRIVER covers a file. The measured instance
  // happened in docs/ideas.md, which is enabled:false, so a gauge that
  // filtered on that flag would be blind to its own motivating case.
  const regs = registers();
  const paths = regs.map((r) => r.path);
  assert.ok(paths.includes('docs/ideas.md'), paths.join(','));
  assert.equal(regs.find((r) => r.path === 'docs/ideas.md').enabled, false);
  assert.ok(paths.includes('docs/agents/runner-facts.md'));
  assert.ok(regs.length >= 8, `only ${regs.length} registers`);
});

test('every declared register has a usable heading pattern', () => {
  for (const r of registers()) {
    assert.doesNotThrow(() => new RegExp(r.heading), r.path);
    if (r.identifier) assert.doesNotThrow(() => new RegExp(r.identifier), r.path);
  }
});

test('the identifier patterns this repository declares capture a group', () => {
  // entrySpans takes m[1] when there is one. A declared identifier with no
  // capture group would silently key every entry on the whole heading line,
  // which is the fallback and not the declared behaviour.
  for (const r of registers()) {
    if (!r.identifier) continue;
    assert.match(r.identifier, /\(/, `${r.path} identifier has no group`);
  }
});

// ------------------------------------------------------------ the event roll-up

test('one commit pair spanning three entries is three pairs and ONE event', () => {
  // The unit that makes the number actionable. The measured instance is one
  // collision between two runs across twelve entries; reporting it as twelve
  // duplicated repairs a day overstates the rate by its entry width.
  const commits = [C('a', '2026-11-09T05:00:00Z', 'ursa-skill'), C('b', '2026-11-09T05:10:00Z', 'ursa-engineer')];
  const three = ['E1', 'E2', 'E3'].map((id) => ({ path: 'r.md', id }));
  const edits = new Map([['a', three], ['b', three]]);
  const g = grade(commits, edits, { rows: [], run: () => { throw new Error('no'); } });
  assert.equal(g.counts.DUPLICATED, 3);
  assert.equal(g.event_counts.DUPLICATED, 1);
  assert.equal(g.events[0].entries, 3);
  assert.deepEqual(g.events[0].registers, ['r.md']);
});

test('an event records every register it spans', () => {
  const commits = [C('a', '2026-11-09T05:00:00Z', 'ursa-skill'), C('b', '2026-11-09T05:10:00Z', 'ursa-engineer')];
  const edits = new Map([
    ['a', [{ path: 'x.md', id: 'E' }, { path: 'y.md', id: 'F' }]],
    ['b', [{ path: 'x.md', id: 'E' }, { path: 'y.md', id: 'F' }]],
  ]);
  const g = grade(commits, edits, { rows: [], run: () => { throw new Error('no'); } });
  assert.equal(g.event_counts.DUPLICATED, 1);
  assert.deepEqual(g.events[0].registers.sort(), ['x.md', 'y.md']);
  assert.equal(g.events[0].entries, 2);
});

test('two separate collisions are two events', () => {
  const commits = [
    C('a', '2026-11-09T05:00:00Z', 'ursa-skill'),
    C('b', '2026-11-09T05:10:00Z', 'ursa-engineer'),
    C('c', '2026-11-09T06:00:00Z', 'ursa-pm'),
    C('d', '2026-11-09T06:10:00Z', 'ursa-frontend'),
  ];
  const edits = new Map([
    ['a', [{ path: 'r.md', id: 'E1' }]], ['b', [{ path: 'r.md', id: 'E1' }]],
    ['c', [{ path: 'r.md', id: 'E2' }]], ['d', [{ path: 'r.md', id: 'E2' }]],
  ]);
  const g = grade(commits, edits, { rows: [], run: () => { throw new Error('no'); } });
  assert.equal(g.event_counts.DUPLICATED, 2);
});

test('event counts never exceed pair counts', () => {
  const commits = [C('a', '2026-11-09T05:00:00Z', 'ursa-a'), C('b', '2026-11-09T05:10:00Z', 'ursa-b')];
  const two = ['E1', 'E2'].map((id) => ({ path: 'r.md', id }));
  const g = grade(commits, new Map([['a', two], ['b', two]]), { rows: [], run: () => { throw new Error('no'); } });
  for (const k of Object.keys(g.event_counts)) assert.ok(g.event_counts[k] <= g.counts[k], k);
});

// ------------------------------------------------------- patch identity

test('patch-identical commits grade SAME_CHANGE, not DUPLICATED', () => {
  // One commit rebased onto a second branch. This seat splits its chain by
  // merge authority and so lands the same change twice by construction, and
  // the first live reading of this gauge charged it nine times for doing it.
  const commits = [C('a', '2026-11-09T04:31:49Z', 'ursa-exo'), C('b', '2026-11-09T04:39:33Z', 'ursa-exo')];
  const edits = new Map([['a', [{ path: 'r.md', id: 'E' }]], ['b', [{ path: 'r.md', id: 'E' }]]]);
  const g = grade(commits, edits, {
    rows: [], run: () => { throw new Error('no'); }, patchOf: () => 'SAME',
  });
  assert.equal(g.counts.SAME_CHANGE, 1);
  assert.equal(g.counts.DUPLICATED, 0);
  assert.equal(g.pairs[0].same_patch, true);
});

test('patch identity is checked BEFORE concurrency, so the graph cannot override it', () => {
  // A cherry-pick is concurrent in the graph by construction. If concurrency
  // were tested first, every cherry-pick would be a duplication.
  const commits = [C('a', '2026-11-09T05:00:00Z', 'ursa-a'), C('b', '2026-11-09T05:10:00Z', 'ursa-b')];
  const edits = new Map([['a', [{ path: 'r.md', id: 'E' }]], ['b', [{ path: 'r.md', id: 'E' }]]]);
  const g = grade(commits, edits, {
    rows: [],
    run: () => { throw new Error('never an ancestor, so concurrent'); },
    patchOf: () => 'SAME',
  });
  assert.equal(g.pairs[0].klass, 'SAME_CHANGE');
});

test('a cross-actor cherry-pick is SAME_CHANGE too, because taking a sibling\'s commit is coordination', () => {
  const commits = [C('a', '2026-11-09T05:00:00Z', 'ursa-skill'), C('b', '2026-11-09T05:10:00Z', 'ursa-engineer')];
  const edits = new Map([['a', [{ path: 'r.md', id: 'E' }]], ['b', [{ path: 'r.md', id: 'E' }]]]);
  const g = grade(commits, edits, { rows: [], run: () => { throw new Error('no'); }, patchOf: () => 'SAME' });
  assert.equal(g.counts.SAME_CHANGE, 1);
  assert.equal(g.pairs[0].same_actor, false);
});

test('different patch-ids leave the verdict to concurrency', () => {
  const commits = [C('a', '2026-11-09T05:00:00Z', 'ursa-a'), C('b', '2026-11-09T05:10:00Z', 'ursa-b')];
  const edits = new Map([['a', [{ path: 'r.md', id: 'E' }]], ['b', [{ path: 'r.md', id: 'E' }]]]);
  const g = grade(commits, edits, {
    rows: [], run: () => { throw new Error('no'); }, patchOf: (s) => `p-${s}`,
  });
  assert.equal(g.pairs[0].klass, 'DUPLICATED');
  assert.equal(g.pairs[0].same_patch, false);
});

test('an UNTAKEABLE patch-id (null) is never read as identity', () => {
  // Two nulls compare equal in JavaScript. A pair of commits whose patch-id
  // could not be taken must not therefore become one change — that would turn
  // every failure of the instrument into a clean verdict, which is this
  // charter's own rule about an output that cannot distinguish its abort
  // from its answer.
  const commits = [C('a', '2026-11-09T05:00:00Z', 'ursa-a'), C('b', '2026-11-09T05:10:00Z', 'ursa-b')];
  const edits = new Map([['a', [{ path: 'r.md', id: 'E' }]], ['b', [{ path: 'r.md', id: 'E' }]]]);
  const g = grade(commits, edits, {
    rows: [], run: () => { throw new Error('no'); }, patchOf: () => null,
  });
  assert.equal(g.counts.SAME_CHANGE, 0);
  assert.equal(g.pairs[0].klass, 'DUPLICATED');
});

test('patchOf is called once per commit however many entries it spans', () => {
  const commits = [C('a', '2026-11-09T05:00:00Z', 'ursa-a'), C('b', '2026-11-09T05:10:00Z', 'ursa-b')];
  const twelve = Array.from({ length: 12 }, (_, i) => ({ path: 'r.md', id: `E${i}` }));
  const calls = [];
  grade(commits, new Map([['a', twelve], ['b', twelve]]), {
    rows: [],
    run: () => { throw new Error('no'); },
    patchOf: (s) => { calls.push(s); return `p-${s}`; },
  });
  assert.deepEqual(calls.sort(), ['a', 'b']);
});

test('patchId on this repository returns a stable hex id for a real commit', () => {
  // The one test that touches the clone, because the shell pipeline in
  // patchId is the part no stub covers.
  const head = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  const id = patchId(head);
  assert.match(id || '', /^[0-9a-f]{40}$/, `got ${id}`);
  assert.equal(patchId(head), id);
});

test('patchId returns null rather than throwing on a commit that does not exist', () => {
  assert.equal(patchId('0000000000000000000000000000000000000000'), null);
});

// ------------------------------------------------- the audit verdict and exit
//
// Added 2026-11-09, hundred-and-thirteenth window. Every case here failed
// against the pre-fix source, where the exit code was the single expression
// `--audit && event_counts.DUPLICATED > 0`, so a window with nothing decided
// exited 0. The measurement that found it is in the file's own header.

const G = (counts) => ({
  event_counts: {
    DUPLICATED: 0, COORDINATED: 0, SAME_CHANGE: 0, SEQUENTIAL: 0, INDETERMINATE: 0, ...counts,
  },
});

test('only complete and partial board halves may decide a pair', () => {
  assert.deepEqual(BOARD_STATES.filter(boardCanDecide), ['complete', 'partial']);
  assert.deepEqual(BOARD_STATES.filter((s) => !boardCanDecide(s)), ['unestablished', 'declined']);
});

test('a declined board half with undecided pairs exits 2, never 0', () => {
  // The measured false green: --hours 48 --no-board --audit printed twelve
  // INDETERMINATE rows and exited 0 because nothing graded DUPLICATED.
  const v = auditVerdict(G({ INDETERMINATE: 1 }), { state: 'declined', note: 'board not read (--no-board)' });
  assert.equal(v.exit, 2);
  assert.equal(v.code, 'UNDECIDED');
  assert.match(v.line, /cannot decide/);
  assert.match(v.line, /declined/);
  // The refusal says the count is a floor, because the count still prints.
  assert.match(v.line, /floor and not a finding/);
});

test('an unestablished board half with undecided pairs exits 2 and names the receipt', () => {
  const v = auditVerdict(
    G({ INDETERMINATE: 3 }),
    { state: 'unestablished', note: 'COVERAGE_READ_FAILED: the read reached no rows at all' },
  );
  assert.equal(v.exit, 2);
  assert.match(v.line, /unestablished/);
  assert.match(v.line, /COVERAGE_READ_FAILED/);
});

test('a found duplication takes precedence over undecided pairs', () => {
  // 1 over 2 on purpose: the duplication is a repair a seat can make today and
  // the undecided pairs are a fact about this run's reach.
  const v = auditVerdict(G({ DUPLICATED: 2, INDETERMINATE: 5 }), { state: 'partial', note: null });
  assert.equal(v.exit, 1);
  assert.equal(v.code, 'DUPLICATED');
  assert.match(v.line, /2 blind duplication/);
});

test('a declined board half with nothing concurrent is clean, not a refusal', () => {
  // The over-refusal this fix had to avoid. The graph decides SEQUENTIAL and
  // SAME_CHANGE with no board call, so a missing board half costs no verdict
  // when no pair was concurrent.
  const v = auditVerdict(G({ SEQUENTIAL: 4, SAME_CHANGE: 1 }), { state: 'declined', note: null });
  assert.equal(v.exit, 0);
  assert.equal(v.code, 'CLEAN');
  assert.match(v.line, /declined board half/);
});

test('a clean window over a complete board half exits 0 and says which half answered', () => {
  const v = auditVerdict(G({ COORDINATED: 1 }), { state: 'complete', note: null });
  assert.equal(v.exit, 0);
  assert.match(v.line, /complete board half/);
  assert.match(v.line, /1 coordinated/);
});

test('an empty row set cannot be graded as no message passed', () => {
  // The second measured fault, at the grader's own boundary. A 401 handed
  // `rows: []` to grade(), which is truthy, so the !rows arm never ran and two
  // concurrent commits were called DUPLICATED from a read that reached nothing.
  // boardRows now hands null for that state; this asserts the arm it reaches.
  const commits = [C('a', '2026-11-09T05:00:00Z', 'ursa-skill'), C('b', '2026-11-09T05:10:00Z', 'ursa-engineer')];
  const edits = new Map([['a', [{ path: 'r.md', id: 'E' }]], ['b', [{ path: 'r.md', id: 'E' }]]]);
  const stub = () => { throw new Error('no'); };
  assert.equal(grade(commits, edits, { rows: [], run: stub }).counts.DUPLICATED, 1);
  assert.equal(grade(commits, edits, { rows: null, run: stub }).counts.INDETERMINATE, 1);
  assert.equal(grade(commits, edits, { rows: null, run: stub }).counts.DUPLICATED, 0);
});
