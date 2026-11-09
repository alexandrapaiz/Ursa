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
  classifyRefusal, clearsOnAClock, refusalClasses,
} from './outage.mjs';

// The three distinct refusal sentences this host actually sent, counted over
// 98 refused Ursa run rows on GET /api/runs?days=7, read 2026-11-08T23:5xZ.
// Verbatim, including the middle dots, because the classifier's whole subject
// is the provider's own wording and a paraphrased fixture grades the paraphrase.
const SPEND_DATED =
  "You've hit your org's monthly spend limit \u00b7 ask your admin to raise it at " +
  "claude.ai/admin-settings/usage \u00b7 your weekly limit resets Nov 8, 11pm (UTC)";
const SPEND_HOUR =
  "You've hit your org's monthly spend limit \u00b7 ask your admin to raise it at " +
  "claude.ai/admin-settings/usage \u00b7 your weekly limit resets 11pm (UTC)";
const WEEKLY = "You've hit your weekly limit \u00b7 resets Nov 8, 11pm (UTC)";

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

// --------------------------------------------------------- the refusal class
//
// `darkCause` answers `provider` for both of this host's two stalls, and they
// have opposite remedies. These bind the discriminator to the limit word.

test('exact: the three live sentences classify as two limits, not as three', () => {
  assert.equal(classifyRefusal(SPEND_DATED), 'spend-monthly');
  assert.equal(classifyRefusal(SPEND_HOUR), 'spend-monthly');
  assert.equal(classifyRefusal(WEEKLY), 'usage-weekly');
});

test('regress: the charter\'s date-versus-hour discriminator calls SPEND_HOUR a session cap', () => {
  // prompts/exo-agent.md §2's four-cap table separates weekly usage from
  // session usage by whether the refusal names a reset date or a reset hour.
  // This is that rule, written out, so the defect is asserted and not argued.
  const byInstantFormat = (t) =>
    /resets [A-Z][a-z][a-z] \d+,/.test(t) ? 'usage-weekly'
      : /resets \d+(am|pm)/.test(t) ? 'usage-session' : 'unclassified';
  assert.equal(byInstantFormat(SPEND_HOUR), 'usage-session');
  assert.equal(classifyRefusal(SPEND_HOUR), 'spend-monthly');
  // and the two agree on the one sentence that names only its own limit
  assert.equal(byInstantFormat(WEEKLY), classifyRefusal(WEEKLY));
});

test('control: a run that was not refused classifies as null, not as a limit', () => {
  // The positive control is the test above; this is its pair. A classifier
  // that answered a limit for everything would pass every assertion about a
  // refusal, which is this directory's standing rule about an absence.
  assert.equal(classifyRefusal(null), null);
  assert.equal(classifyRefusal(undefined), null);
  assert.equal(classifyRefusal(''), null);
  assert.equal(classifyRefusal('   '), null);
});

test('bound: a sentence this function does not know is unclassified and never folded into a known class', () => {
  assert.equal(classifyRefusal('the model is overloaded, try again'), 'unclassified');
  assert.equal(classifyRefusal('upstream connect error'), 'unclassified');
  assert.equal(clearsOnAClock('unclassified'), null);
  assert.equal(clearsOnAClock(null), null);
});

test('exact: only a usage limit names a clock that clears it', () => {
  assert.equal(clearsOnAClock('usage-weekly'), true);
  assert.equal(clearsOnAClock('usage-session'), true);
  assert.equal(clearsOnAClock('spend-monthly'), false);
});

test('shape: a sentence naming both limits reports the monthly one, because that is what stopped the run', () => {
  // SPEND_DATED contains the literal "weekly limit", so an order-insensitive
  // classifier would answer usage-weekly on the string that names the spend
  // limit first. The order of the checks is load-bearing and is asserted here.
  assert.match(SPEND_DATED, /weekly limit/);
  assert.equal(classifyRefusal(SPEND_DATED), 'spend-monthly');
});

test('exact: the seven-day grouping is 77 spend-monthly over six days and 21 usage-weekly over one', () => {
  const rows = [
    ...Array.from({ length: 64 }, (_, i) => ({
      seat: 'pm', started_at: `2026-11-0${3 + (i % 5)}T12:00`, exit: 1, turns: 1, refusal: SPEND_DATED })),
    ...Array.from({ length: 13 }, () => ({
      seat: 'exo', started_at: '2026-11-08T18:20', exit: 1, turns: 1, refusal: SPEND_HOUR })),
    ...Array.from({ length: 21 }, () => ({
      seat: 'pm', started_at: '2026-11-02T23:26', exit: 1, turns: 1, refusal: WEEKLY })),
    { seat: 'exo', started_at: '2026-11-08T23:02', exit: 0, turns: 146, refusal: null },
  ];
  const out = refusalClasses(rows);
  assert.equal(out.length, 2);
  const spend = out.find((r) => r.cls === 'spend-monthly');
  const weekly = out.find((r) => r.cls === 'usage-weekly');
  assert.equal(spend.runs, 77);
  assert.equal(spend.days.length, 6);
  assert.equal(spend.clears_on_a_clock, false);
  assert.equal(spend.texts.length, 2);          // both spellings, kept distinct
  assert.equal(spend.texts[0].runs, 64);        // and ordered by how often they came
  assert.equal(weekly.runs, 21);
  assert.equal(weekly.clears_on_a_clock, true);
});

test('control: a completed run contributes no row to any class, so the grouping cannot over-report', () => {
  const out = refusalClasses([
    { seat: 'exo', started_at: '2026-11-08T23:02', exit: 0, turns: 146, refusal: null },
    { seat: 'pm', started_at: '2026-11-08T23:07', exit: 0, turns: 41, refusal: null },
  ]);
  assert.deepEqual(out, []);
});

test('regress: the class is not the outcome, and this stall cleared despite its class', () => {
  // Every Ursa run that started at or after 2026-11-08T23:02Z completed, so a
  // spend-monthly span ended at the weekly reset named inside its own text.
  // The tool must keep saying `false` for clears_on_a_clock anyway: the claim
  // is about what the sentence names, not a forecast. A class that quietly
  // became a prediction is the defect the charter's own payload-class rule
  // exists to stop.
  const after = [
    { seat: 'exo', started_at: '2026-11-08T23:02', exit: 0, turns: 146, refusal: null },
    { seat: 'pm', started_at: '2026-11-08T23:07', exit: 0, turns: 41, refusal: null },
    { seat: 'pm', started_at: '2026-11-08T23:23', exit: 0, turns: 52, refusal: null },
    { seat: 'engineer', started_at: '2026-11-08T23:07', exit: 0, turns: 63, refusal: null },
  ];
  assert.equal(refusalClasses(after).length, 0);
  assert.equal(clearsOnAClock(classifyRefusal(SPEND_HOUR)), false);
});
