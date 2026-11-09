import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  isInstant, blockFaults, ageHours, agePhrase, citedCounts, undatedQuotations,
  instantClause, boundOf,
} from './measured-citation.mjs';
import { MEASURED, GRADED } from './disposition.mjs';
import { notices } from './check.mjs';

const HERE = new URL('.', import.meta.url).pathname;
const src = (f) => readFileSync(HERE + f, 'utf8');

// A clock exactly a week after the committed block was read. Fixed relative to
// the block rather than written out, for two reasons: the whole point of this
// module is that an age is a function of two instants and not of whenever the
// suite happened to run, and the block is re-derived from a live board, so a
// literal instant here would make every re-derivation a test failure in a file
// whose subject is re-derivation.
const A_WEEK_ON = new Date(Date.parse(MEASURED.read_at) + 168 * 3_600_000);
const LATER = (minutes) => new Date(Date.parse(MEASURED.read_at) + minutes * 60_000);

test('a calendar day is not an instant, which is the granularity the drift outran', () => {
  assert.equal(isInstant('2026-11-02'), false);
  assert.equal(isInstant('2026-11-02T04:17:41Z'), true);
  assert.equal(isInstant('2026-11-02T04:17Z'), true, 'minutes are enough: a seat transcribing by hand writes this');
  assert.equal(isInstant('2026-11-02T04:17:41.123Z'), true, 'the walk receipt prints milliseconds');
  assert.equal(isInstant('2026-11-02T04:17:41'), false, 'no zone is not an instant');
  assert.equal(isInstant('2026-11-02T04:17:41+01:00'), false, 'this board stamps UTC and only UTC');
  assert.equal(isInstant('last night'), false);
  assert.equal(isInstant(undefined), false);
  assert.equal(isInstant('2026-13-02T04:17:41Z'), false, 'shaped right, not a date');
});

test('the committed block can be cited: it has a real instant and the instant is not before its evidence', () => {
  assert.deepEqual(blockFaults(MEASURED), []);
  assert.ok(isInstant(MEASURED.read_at), `read_at is ${MEASURED.read_at}`);
  assert.ok(Date.parse(MEASURED.read_at) >= Date.parse(MEASURED.coverage.newest_ts),
    `read at ${MEASURED.read_at}, newest row ${MEASURED.coverage.newest_ts}`);
});

test('the three ways a block fails to be citable, each one named separately', () => {
  const codes = (b) => blockFaults(b).map((f) => f.code);
  assert.deepEqual(codes({}), ['READ_AT_ABSENT']);
  assert.deepEqual(codes({ read_at: '2026-11-02' }), ['READ_AT_NOT_AN_INSTANT'],
    'the shape the block carried before this module existed');
  assert.deepEqual(
    codes({ read_at: '2026-11-02T02:51:56Z', coverage: { newest_ts: '2026-11-02T04:16:20.852Z' } }),
    ['READ_AT_BEFORE_NEWEST_ROW'],
  );
  assert.deepEqual(codes({ read_at: '2026-11-02T04:17:41Z', coverage: { pages: 9 } }),
    ['COVERAGE_WITHOUT_NEWEST_ROW'],
    'coverage with no newest row is the state in which the guard above cannot fire');
});

test('the back-fill this module exists to refuse, worked on the real numbers', () => {
  // The block this run replaced carried `covered_hours: 717.67` past an
  // `oldest_ts` of 2026-10-03T05:11:44.721Z and no read instant. Deriving one
  // from those two lands on the newest ROW, not on the clock, and the walk
  // ran about twenty-nine minutes later by the reporting seat's reckoning.
  const derived = new Date(Date.parse('2026-10-03T05:11:44.721Z') + 717.67 * 3_600_000);
  assert.equal(derived.toISOString().slice(0, 16), '2026-11-02T02:51');
  const actual = Date.parse('2026-11-02T03:21Z');
  assert.ok(Math.round((actual - derived.getTime()) / 60000) >= 29,
    'the quiet bus before the walk is invisible in covered_hours');
  // And with a newest row recorded, that derivation is now refused rather
  // than accepted as the read instant.
  assert.deepEqual(
    blockFaults({ read_at: derived.toISOString(), coverage: { newest_ts: '2026-11-02T03:00:00Z' } })
      .map((f) => f.code),
    ['READ_AT_BEFORE_NEWEST_ROW'],
  );
});

test('the age is reported at the granularity that makes the drift legible', () => {
  assert.equal(agePhrase(20 / 60), '20 minutes', 'the drift that triggered this file happened in twenty');
  assert.equal(agePhrase(1 / 60), '1 minute');
  assert.equal(agePhrase(1.9), '114 minutes', 'minutes up to two hours');
  assert.equal(agePhrase(3), '3 hours');
  assert.equal(agePhrase(47), '47 hours', 'hours up to two days');
  assert.equal(agePhrase(49), '2 days');
  assert.equal(agePhrase(168), '7 days');
  assert.equal(agePhrase(-2), '2 hours in the future', 'a clock behind the block says so rather than printing a negative');
  assert.equal(agePhrase(NaN), 'an unknown interval');
});

test('ageHours is the difference between two instants and takes any of three clock forms', () => {
  const block = { read_at: '2026-11-02T04:00:00Z' };
  assert.equal(ageHours(block, new Date('2026-11-02T06:00:00Z')), 2);
  assert.equal(ageHours(block, Date.parse('2026-11-02T06:00:00Z')), 2);
  assert.equal(ageHours(block, '2026-11-02T06:00:00Z'), 2);
  assert.equal(ageHours(block, '2026-11-02T03:00:00Z'), -1);
});

test('the cited sentence is past tense, carries its instant, and says how to re-derive it', () => {
  const c = citedCounts(MEASURED, A_WEEK_ON);
  // `measured on <instant>` and not merely the instant somewhere in the
  // sentence. The first version of this assertion was satisfied by the window
  // clause, `in the 720 hours to <instant>`, so deleting the dating clause
  // entirely left the suite green: a mutation rehearsal found it.
  assert.ok(c.sentence.includes(`measured on ${MEASURED.read_at}`),
    `the dating clause itself is missing from: ${c.sentence}`);
  assert.ok(c.sentence.includes('7 days before this check'));
  assert.ok(c.sentence.includes('node tools/board/measure-claims.mjs --hours 720'));
  assert.match(c.sentence, /\bwere\b/, 'past tense');
  assert.doesNotMatch(c.sentence, /\bare\b/, 'a count in the present tense is the defect this file repairs');
  assert.doesNotMatch(c.sentence, /\bis\b/);
  for (const n of [MEASURED.over_limit, MEASURED.by_kind.note, MEASURED.by_kind.done, MEASURED.by_kind.ask]) {
    assert.ok(c.sentence.includes(String(n)), `${n} is quoted`);
  }
  assert.equal(c.age_hours, 168);
});

test('an uncitable block yields no sentence at all, rather than an undated one', () => {
  assert.equal(citedCounts({ ...MEASURED, read_at: '2026-11-02' }, A_WEEK_ON), null);
  assert.equal(citedCounts({}, A_WEEK_ON), null);
});

test('the gate dates its notice against the clock it is handed', () => {
  const body = 'I decided to take the rebase because the branch was unmergeable.\n\n'
    + Array.from({ length: 8 }, () => 'word '.repeat(60).trim()).join('\n\n');
  const lines = notices({ kind: 'note', toSeat: 'pm', toCompany: 'Ursa', subject: 'x', body }, A_WEEK_ON)
    .map((n) => n.line);
  const dated = lines.find((l) => l.includes('travelled in when this was last measured'));
  assert.ok(dated, `no dated clause in: ${lines.join(' | ')}`);
  assert.ok(dated.includes(MEASURED.read_at));
  assert.ok(dated.includes('7 days before this check'), dated);
  assert.doesNotMatch(dated, /over-limit bodies on 2026-11-02,/, 'the undated form this replaced');
});

test('the same notice, same message, reads its age off a different clock', () => {
  const body = 'I decided to take the rebase because the branch was unmergeable.\n\n'
    + Array.from({ length: 8 }, () => 'word '.repeat(60).trim()).join('\n\n');
  const at = (now) => notices({ kind: 'note', toSeat: 'pm', toCompany: 'Ursa', subject: 'x', body }, now)
    .map((n) => n.line).join(' ');
  assert.ok(at(LATER(20)).includes('20 minutes before this check'),
    'the interval the reporting seat measured the drift over');
  assert.ok(at(LATER(30 * 24 * 60)).includes('30 days before this check'));
});

test('notices still works with no clock argument, because post.mjs calls it that way', () => {
  const body = 'I decided to take it because it was mine.\n\n'
    + Array.from({ length: 8 }, () => 'word '.repeat(60).trim()).join('\n\n');
  const lines = notices({ kind: 'note', toSeat: 'pm', toCompany: 'Ursa', subject: 'x', body }).map((n) => n.code);
  assert.ok(lines.includes('WAKE_TRUNCATION_PREDICTED'));
});

test('the lint finds an undated interpolation, and the shipped gate has none', () => {
  const bad = 'const line = `of the ${MEASURED.over_limit} over-limit bodies on ${MEASURED.on}`;';
  const found = undatedQuotations(bad);
  assert.equal(found.length, 1);
  assert.equal(found[0].code, 'UNDATED_COUNT_QUOTED');
  assert.equal(found[0].at, 1);
  assert.ok(found[0].repair.includes('citedCounts'));
  // The regression itself: this is the line check.mjs carried until
  // 2026-11-02, and the file must not carry one like it again.
  for (const f of ['check.mjs', 'disposition.mjs', 'post.mjs', 'measure-claims.mjs']) {
    assert.deepEqual(undatedQuotations(src(f)), [], `${f} interpolates a measured count with no instant`);
  }
});

test('the lint reads the identifier it is given and does not fire on arithmetic', () => {
  assert.equal(undatedQuotations('const n = MEASURED.over_limit + 1;').length, 0,
    'using the number is fine; putting it in a string for a seat to read is not');
  assert.equal(undatedQuotations('`${BLOCK.over_limit}`', 'BLOCK').length, 1);
  assert.equal(undatedQuotations('`${BLOCK.over_limit}`').length, 0, 'a different block is not this one');
});

test('the drift record is a dated series, ascending, and disagrees with itself', () => {
  const d = MEASURED.drift;
  assert.ok(d.length >= 3, 'one reading is not a drift record');
  for (const row of d) {
    assert.ok(isInstant(row.read_at), `${row.read_at} is not an instant`);
    assert.ok(row.by && row.instant_known, 'who read it and how well the instant is known');
  }
  const ts = d.map((r) => Date.parse(r.read_at));
  assert.deepEqual(ts, [...ts].sort((a, b) => a - b), 'oldest first');
  assert.ok(new Set(d.map((r) => r.over_limit)).size > 1,
    'a drift record whose readings all agree is not evidence of drift');
  // THE ASSERTION THIS REPLACED, AND WHY, because the first version of this
  // line asserted the opposite and passed. The reporting seat's note said the
  // over-limit `ask` count was "the one value that held, which is luck rather
  // than design", and for four walks across 57 minutes it did: 51 every time.
  // It went to 52 nine minutes later, while this file was being written. So
  // the claim worth asserting is not that one count is stable, it is that
  // every count the gate quotes has been seen to move.
  for (const field of ['note', 'done', 'ask']) {
    assert.ok(new Set(d.map((r) => r.by_kind[field])).size > 1,
      `${field} never moves in this record, so either the board stopped or the record stopped`);
  }
  const last = d[d.length - 1];
  assert.ok(Date.parse(last.read_at) >= Date.parse(MEASURED.read_at),
    'the block is not older than the newest reading in its own drift record');
  // The headline figures in the block are one of the rows, not an average of
  // them: a mean of four readings of a rolling window is a number nobody read.
  const mine = d.find((r) => r.read_at === MEASURED.read_at);
  assert.ok(mine, 'the block names which reading it is');
  assert.equal(mine.over_limit, MEASURED.over_limit);
  assert.deepEqual(mine.by_kind, MEASURED.by_kind);
});

test('the edge measurement that makes a dated count a floor is stated with both sides', () => {
  const e = MEASURED.edge;
  assert.ok(e.arriving_rows_per_min > e.leaving_rows_per_min * 10,
    'the claim is a ratio, so both halves are measured or neither is quoted');
  assert.equal(e.trailing_5h_over_limit, 0, 'measured with --hours 715 against --hours 720 in the same minute');
});

test('a block whose clock reading was never taken is cited by its bound, not by a chosen number', () => {
  // `GRADED` is the real case: it landed on `main` at 9c3c52dc dated to the
  // calendar day, forty minutes after this module made the block beside it
  // carry a clock reading, and by then its walk was over. An interval two
  // other blocks can be checked against is the most that is true about it.
  assert.deepEqual(blockFaults(GRADED), []);
  assert.equal(GRADED.read_at, null, 'not back-filled');
  const [lo, hi] = boundOf(GRADED);
  const derived = new Date(Date.parse(GRADED.coverage.oldest_ts) + GRADED.coverage.covered_hours * 3_600_000);
  assert.equal(lo.slice(0, 16), derived.toISOString().slice(0, 16),
    'the low end is the newest row the walk saw, because a read cannot precede its own evidence');
  assert.equal(hi, MEASURED.read_at,
    'the high end is a later walk that counted more rows, which this one therefore preceded');
  assert.ok(GRADED.coverage.rows < MEASURED.coverage.rows, 'that ordering is checkable, not asserted');
  const clause = instantClause(GRADED, A_WEEK_ON);
  assert.equal(clause.exact, false);
  assert.ok(clause.text.includes('never recorded'));
  assert.doesNotMatch(clause.text, /before this check/, 'no age is computed off an interval');
});

test('a malformed or reversed bound is a fault, not a clause', () => {
  // Both codes, and that is the intended reading rather than noise: a block
  // with a broken bound and no `read_at` is uncitable for two independent
  // reasons, and a seat repairing it needs to be told both. The bound fault
  // comes first because it is the one whose repair is a one-line edit.
  const codes = (v) => blockFaults({ read_at_bounded_between: v }).map((f) => f.code);
  const both = ['BOUND_NOT_TWO_ORDERED_INSTANTS', 'READ_AT_ABSENT'];
  assert.deepEqual(codes(['2026-11-02T04:28:38Z', '2026-11-02T04:09:56Z']), both, 'high before low');
  assert.deepEqual(codes(['2026-11-02', '2026-11-02']), both, 'two days');
  assert.deepEqual(codes(['2026-11-02T04:09:56Z']), both, 'one end');
  assert.deepEqual(blockFaults({ read_at: '2026-11-02T04:28:38Z', read_at_bounded_between: ['x'] })
    .map((f) => f.code), ['BOUND_NOT_TWO_ORDERED_INSTANTS'],
  'a real instant beside a broken bound leaves only the bound to repair');
  assert.equal(boundOf({}), null);
  assert.equal(instantClause({ on: '2026-11-02' }, A_WEEK_ON), null, 'a day alone yields no clause at all');
});

test('the lint covers every measured block the gate imports, not only the first one', () => {
  // The regression this is for: `check.mjs` on `main` at 9c3c52dc
  // interpolated `${GRADED.on}` into a notice. A lint that only knew the name
  // `MEASURED` read that file as clean.
  for (const name of ['MEASURED', 'GRADED']) {
    assert.deepEqual(undatedQuotations(src('check.mjs'), name), [],
      `check.mjs interpolates ${name} with no instant`);
    assert.deepEqual(undatedQuotations(src('disposition.mjs'), name), []);
  }
  assert.equal(undatedQuotations('`${GRADED.on}`', 'GRADED').length, 1, 'and it still fires when it should');
});
