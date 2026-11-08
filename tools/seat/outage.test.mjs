// node --test tools/seat/outage.test.mjs
//
// Five kinds of test, and the "control:" ones are the only ones that can fail
// for the right reason on their own.
//
// "exact:"   the dark span actually measured on 2026-11-08T23:0xZ, with the
//            real per-day counts, asserting the reading this tool was shipped
//            to produce.
// "control:" the positive and negative controls this directory requires
//            (runner-facts: "an absence is a measurement, and it needs a
//            positive control"). A tool whose whole subject is an absence can
//            pass every assertion about an outage by calling everything an
//            outage, so each claim here is paired with the fixture that must
//            NOT trip it. The two cannot stand in for each other.
// "bound:"   the verdict vocabulary is HQ's and closed (exo-centralizer,
//            2026-11-02: read, unread, due, pending, no-date, no-measure).
//            These bind this file's spelling to that set so a seat cannot
//            invent a sixth value by accident, which is the 27-spelling defect
//            restated inside one function.
// "shape:"   a range the route could not answer must be visible as missing
//            days rather than summed into a flattering zero. A gap in the
//            denominator and a quiet week have the same total.
// "regress:" window 72's own entry, read late. The verdict it earns is the
//            single fact this file exists to make cheap.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isDark, darkCause, darkSpan, darkDays, readVerdict,
  completedBetween, daysBetween, classifyAuthors,
} from './outage.mjs';

// The measurement, from GET /api/capacity?day= for each day, taken
// 2026-11-08T23:0xZ. Today's row moved during that run (46 attempted / 7
// running at 23:0x, 49 / 10 twelve minutes later), so the row is dated rather
// than called stable — this register's own rule about a number that moves
// while you are reading it.
const MEASURED = [
  { day: '2026-11-01', attempted: 114, completed: 45, refused: 63, refused_turn_one: 62, failed: 2, lost: 4, running: 0 },
  { day: '2026-11-02', attempted: 476, completed: 349, refused: 82, refused_turn_one: 64, failed: 12, lost: 33, running: 0 },
  { day: '2026-11-03', attempted: 53, completed: 0, refused: 53, refused_turn_one: 48, failed: 0, lost: 0, running: 0 },
  { day: '2026-11-04', attempted: 42, completed: 0, refused: 42, refused_turn_one: 42, failed: 0, lost: 0, running: 0 },
  { day: '2026-11-05', attempted: 42, completed: 0, refused: 42, refused_turn_one: 42, failed: 0, lost: 0, running: 0 },
  { day: '2026-11-06', attempted: 43, completed: 0, refused: 43, refused_turn_one: 43, failed: 0, lost: 0, running: 0 },
  { day: '2026-11-07', attempted: 38, completed: 0, refused: 38, refused_turn_one: 38, failed: 0, lost: 0, running: 0 },
  { day: '2026-11-08', attempted: 46, completed: 0, refused: 39, refused_turn_one: 39, failed: 0, lost: 0, running: 7 },
];

test('exact: the dark span is the six days to 2026-11-08, 264 attempted and none finished', () => {
  const span = darkSpan(MEASURED);
  assert.equal(span.days, 6);
  assert.equal(span.from, '2026-11-03');
  assert.equal(span.to, '2026-11-08');
  assert.equal(span.attempted, 264);
  assert.equal(span.completed, 0);
  assert.equal(span.refused_turn_one, 252);
  assert.deepEqual(darkDays(MEASURED), ['2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08']);
});

test('exact: the cause is the provider on every one of the six, and it is read off the four classes', () => {
  assert.deepEqual(darkSpan(MEASURED).cause, Array(6).fill('provider'));
  // failed+lost dominating names the host instead, and those route to a
  // different seat. The two causes must be distinguishable from the row alone.
  assert.equal(darkCause({ attempted: 20, completed: 0, refused: 1, refused_turn_one: 1, failed: 15, lost: 4 }), 'host');
  assert.equal(darkCause({ attempted: 20, completed: 0, refused: 0, refused_turn_one: 0, failed: 0, lost: 0 }), 'mixed');
});

test('control: a day that completed work is not dark, and the span stops at it', () => {
  // The negative control. Without this, isDark() returning true always would
  // satisfy every "exact:" assertion above.
  assert.equal(isDark(MEASURED[0]), false);           // 45 completed
  assert.equal(isDark(MEASURED[1]), false);           // 349 completed
  assert.equal(darkCause(MEASURED[1]), null);
  const healthy = MEASURED.slice(0, 2);
  assert.equal(darkSpan(healthy), null);
  assert.deepEqual(darkDays(healthy), []);
});

test('control: a day the host attempted nothing is not an outage', () => {
  // The other direction, and it is the one a naive predicate gets wrong.
  // completed==0 is true of a day with no schedule, a Sunday with the clocks
  // off, and a day the capacity route itself could not read. Calling that an
  // outage would make this tool cry wolf on the quietest days in the year.
  assert.equal(isDark({ day: '2026-12-25', attempted: 0, completed: 0, refused: 0 }), false);
  assert.equal(darkSpan([...MEASURED.slice(0, 2), { day: '2026-11-03', attempted: 0, completed: 0 }]), null);
});

test('control: the span reaches today only when today is dark, so a recovery is visible the hour it happens', () => {
  const recovered = [...MEASURED.slice(0, 7),
    { day: '2026-11-08', attempted: 46, completed: 3, refused: 39, refused_turn_one: 39, failed: 0, lost: 0, running: 7 }];
  assert.equal(darkSpan(recovered), null, 'one completion today ends the span');
  assert.equal(darkDays(recovered).length, 5, 'and the five historical dark days are still counted');
});

test('bound: readVerdict emits only values in HQ\'s closed vocabulary', () => {
  const ALLOWED = new Set(['read', 'unread', 'due', 'pending', 'no-date', 'no-measure']);
  const cases = [
    { readDate: null, now: '2026-11-08', completedSince: 0 },
    { readDate: '2026-11-09', now: '2026-11-08', completedSince: 0 },
    { readDate: '2026-11-03', now: '2026-11-08', completedSince: 0 },
    { readDate: '2026-10-25', now: '2026-11-08', completedSince: 394 },
  ];
  for (const c of cases) assert.ok(ALLOWED.has(readVerdict(c)), `${readVerdict(c)} is not in the vocabulary`);
  assert.equal(readVerdict(cases[0]), 'no-date');
  assert.equal(readVerdict(cases[1]), 'pending');
  assert.equal(readVerdict(cases[2]), 'unread');
  assert.equal(readVerdict(cases[3]), 'due');
});

test('control: unread and due are separated by the run count and by nothing else', () => {
  // The whole reason the sixth verdict was asked for: `unread` and a negative
  // result have opposite next actions (re-register with a fresh date, against
  // conclude and move on), and the only thing that tells them apart is whether
  // a run existed. Same date, same clock, one number different.
  const base = { readDate: '2026-11-03', now: '2026-11-08T23:00Z' };
  assert.equal(readVerdict({ ...base, completedSince: 0 }), 'unread');
  assert.equal(readVerdict({ ...base, completedSince: 1 }), 'due');
});

test('regress: window 72\'s experiment, registered 2026-11-01T23:40Z to be read 2026-11-03, is unread', () => {
  // Its interval was busy — 2026-11-02 completed 349 runs — and it is still
  // unread, because nothing has completed since its read date. A tool that
  // graded the interval instead of the read window would have called this
  // `due` and sent a window off to re-measure a property nobody had looked at.
  const interval = completedBetween(MEASURED, '2026-11-01T23:40Z', '2026-11-03');
  assert.equal(interval.completed, 394);
  const since = completedBetween(MEASURED, '2026-11-03', '2026-11-08T23:00Z');
  assert.equal(since.completed, 0);
  assert.equal(since.days, 6);
  assert.equal(readVerdict({ readDate: '2026-11-03', now: '2026-11-08T23:00Z', completedSince: since.completed }), 'unread');
});

test('shape: a range the route could not answer reports its missing days instead of summing to zero', () => {
  const gapped = MEASURED.filter((r) => r.day !== '2026-11-05' && r.day !== '2026-11-06');
  const r = completedBetween(gapped, '2026-11-03', '2026-11-08');
  assert.equal(r.completed, 0);
  assert.deepEqual(r.missing_days, ['2026-11-05', '2026-11-06']);
  // and a complete range says so, which is what makes the field readable
  assert.deepEqual(completedBetween(MEASURED, '2026-11-03', '2026-11-08').missing_days, []);
  assert.deepEqual(daysBetween('2026-11-06', '2026-11-08'), ['2026-11-06', '2026-11-07', '2026-11-08']);
});

// The board rows actually authored during the six dark days, and the run rows
// the host holds for their authors. 36 messages, six authors, one of them with
// a run row. This is the fixture for the finding the --board flag exists for.
const spread = (n, seat, company, hhmm) => Array.from({ length: n }, (_, i) => ({
  ts: `2026-11-0${3 + (i % 6)}T${hhmm}:00Z`, from_company: company, from_seat: seat,
}));
const DARK_BOARD = [
  ...spread(15, 'finance', 'alexandra-systems', '06:00'),
  ...spread(7, 'chair:asc-host', 'alexandra-systems', '08:58'),
  ...spread(6, 'brief', 'alexandra-systems', '12:00'),
  ...spread(4, 'chair:hq-console', 'alexandra-systems', '13:00'),
  ...spread(2, 'chair:ursa', 'asc', '00:10'),
  { ts: '2026-11-03T00:23:54Z', from_company: 'alexandra-systems', from_seat: 'engineer' },
];
const DARK_RUNS = {
  // The engineer seat was launched every day and refused at turn one every
  // day, so the host holds run rows for it. Nothing holds a row for finance,
  // the brief renderer or either chair identity.
  'alexandra-systems/engineer': ['2026-11-03T00:25:00Z', '2026-11-03T08:58:00Z', '2026-11-04T00:06:00Z'],
};

test('exact: fifteen board messages in the dark span carry a seat name with no run behind it', () => {
  const authors = classifyAuthors({ rows: DARK_BOARD, runRows: DARK_RUNS });
  const finance = authors.find((a) => a.author === 'alexandra-systems/finance');
  assert.equal(finance.messages, 15);
  assert.equal(finance.run_backed, false, 'kimi-balance.yml is an Actions job with no model in it');
  assert.equal(finance.days_with_run_row, 0);
});

test('control: the classifier is not answering NO-RUN-ROW to everything', () => {
  // The positive control, and the only one that matters here. The assertion
  // above is satisfied by a function that returns false unconditionally, and
  // that function would tell a returning window that no seat ran when one did.
  const authors = classifyAuthors({ rows: DARK_BOARD, runRows: DARK_RUNS });
  const eng = authors.find((a) => a.author === 'alexandra-systems/engineer');
  assert.equal(eng.run_backed, true);
  assert.equal(eng.days_with_run_row, 1);
  assert.equal(authors.length, 6, 'six authors wrote to the board across the six dark days');
  assert.equal(authors.filter((a) => a.run_backed === false).length, 5);
  assert.equal(authors.filter((a) => a.run_backed === true).length, 1);
  assert.equal(DARK_BOARD.length, 35, 'and 35 messages, one of which has a run behind it');
});

test('control: a partially backed author is null and not rounded to either answer', () => {
  // Three states, not two. An author with a run row on some of the days it
  // posted is the ambiguous case, and flattening it in either direction is
  // how a reader ends up with a verdict the data does not carry.
  const rows = [
    { ts: '2026-11-03T01:00:00Z', from_company: 'Ursa', from_seat: 'pm' },
    { ts: '2026-11-05T01:00:00Z', from_company: 'Ursa', from_seat: 'pm' },
  ];
  const [a] = classifyAuthors({ rows, runRows: { 'ursa/pm': ['2026-11-03T02:00:00Z'] } });
  assert.equal(a.run_backed, null);
  assert.equal(a.days_with_run_row, 1);
  assert.deepEqual(a.days, ['2026-11-03', '2026-11-05']);
});

test('shape: the join is case-insensitive on the company, because the bus is not', () => {
  // The wake fan-out is case-sensitive and the read path is not, which has
  // already cost this seat one dropped message (sixty-first window). The same
  // company arrives spelled `Ursa` and `ursa` on the same board, so a join
  // keyed on the raw string silently reports every lower-cased row as having
  // no run.
  const rows = [{ ts: '2026-11-03T01:00:00Z', from_company: 'ursa', from_seat: 'security' }];
  const [a] = classifyAuthors({ rows, runRows: { 'Ursa/security': ['2026-11-03T02:00:00Z'] } });
  assert.equal(a.run_backed, true);
});
