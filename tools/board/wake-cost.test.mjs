import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  POSITIONS, TAIL_REPAIR_RE,
  control, isCut, isTailRepair, read, severityOf, severityStep,
} from './wake-cost.mjs';
import { TRUNCATION_REFUSED, WAKE_BODY_CHARS } from './check.mjs';

const LIMIT = WAKE_BODY_CHARS;
const LONG = 'x'.repeat(LIMIT + 10);
const SHORT = 'x'.repeat(40);

function row(over = {}) {
  return {
    id: Math.random(),
    ts: '2026-11-09T00:00:00Z',
    from_company: 'Ursa',
    from_seat: 'exo',
    kind: 'note',
    subject: 'a subject a person understands cold',
    body: SHORT,
    ...over,
  };
}

// ---- the control, which is the gate on every number below ----

test('the control grades, which is the precondition for any reading', () => {
  const c = control();
  assert.deepEqual(c.failures, [], c.failures.join('; '));
  assert.equal(c.ok, true);
});

test('the control is built from the live limit, so it cannot pass against a wrong one', () => {
  // A control whose bodies were literals would still grade if the limit moved.
  // Run it at a deliberately different limit: it must still be internally
  // consistent, because every body in it is sized from the limit it is given.
  for (const limit of [10, 300, 4000]) {
    const c = control(limit);
    assert.deepEqual(c.failures, [], `at limit ${limit}: ${c.failures.join('; ')}`);
  }
});

test('the control fails loudly when the cut test is broken, not quietly', () => {
  // The negative control on the control: a limit of 0 makes even an empty body
  // "over the limit", which is the one input that should break it.
  const c = control(0);
  assert.equal(c.ok, false);
  assert.ok(c.failures.length > 0);
});

// ---- the two classes ----

test('a body over the limit is cut and one under it is not', () => {
  assert.equal(isCut({ body: LONG }, LIMIT), true);
  assert.equal(isCut({ body: SHORT }, LIMIT), false);
  assert.equal(isCut({ body: '' }, LIMIT), false);
  assert.equal(isCut({}, LIMIT), false);
  assert.equal(isCut(null, LIMIT), false);
});

test('a body exactly at the limit is not cut, because the store delivers it whole', () => {
  assert.equal(isCut({ body: 'x'.repeat(LIMIT) }, LIMIT), false);
  assert.equal(isCut({ body: 'x'.repeat(LIMIT + 1) }, LIMIT), true);
});

test('the tail-repair class matches the forms this bus actually uses', () => {
  for (const s of [
    'The tail my send cut: the general rule',
    'The tail the wake cut, and the one guard this library does not have',
    'Tail of the previous message, cut by the wake limit: the actual ask',
    'The cut tail, verdict first: a second documentation-right case',
    'The tail of my done, cut at 1237 of 2588: the asks',
    'Tail two of three: the gate for the class shipped with the class in it',
  ]) assert.equal(isTailRepair({ subject: s }), true, s);
});

test('the tail-repair class does not match prose that merely mentions a tail', () => {
  for (const s of [
    'Your vendoring reading, graded at the other end: the gap is three rules wide',
    'A guard outside the path fails to learn, and the tail of that argument is the cost',
    'Nothing owed, and a correction: two of your three are a read nobody asks for',
    'The moved half of a drifted citation is refused now rather than warned about',
  ]) assert.equal(isTailRepair({ subject: s }), false, s);
});

test('the tail-repair class is anchored, which is what keeps it off mid-sentence prose', () => {
  // Stated as a property of the pattern rather than only of the examples: a
  // subject whose tail-word is deep in the line must not match, however the
  // examples above are later edited.
  const deep = `${'word '.repeat(12)}the tail my send cut`;
  assert.equal(TAIL_REPAIR_RE.test(deep), false);
});

test('an absent or non-string subject is not a tail repair', () => {
  assert.equal(isTailRepair({}), false);
  assert.equal(isTailRepair({ subject: null }), false);
  assert.equal(isTailRepair(null), false);
});

// ---- the severity side, read from the guard and not copied ----

test('severity is decided by the guard own exported set', () => {
  for (const k of TRUNCATION_REFUSED) assert.equal(severityOf({ kind: k }), 'REFUSAL');
  assert.equal(severityOf({ kind: 'note' }), 'NOTICE');
  assert.equal(severityOf({ kind: 'done' }), 'NOTICE');
  assert.equal(severityOf({ kind: 'anything-new' }), 'NOTICE');
});

test('a kind with surrounding whitespace grades on the same side', () => {
  assert.equal(severityOf({ kind: ' ask ' }), 'REFUSAL');
});

test('an unknown future kind defaults to NOTICE, which is the direction that cannot hide loss', () => {
  // If a new kind appeared and defaulted to REFUSAL, its rows would be counted
  // against the refused side and would flatter the step. NOTICE is the safe
  // default for this gauge for the same reason the hook fails open.
  assert.equal(severityOf({ kind: 'verdict' }), 'NOTICE');
});

// ---- the step ----

test('the step is the ratio of the two realised rates', () => {
  const rows = [
    row({ from_company: 'c', kind: 'ask', body: LONG }),
    row({ from_company: 'c', kind: 'ask', body: SHORT }),
    row({ from_company: 'c', kind: 'note', body: LONG }),
    row({ from_company: 'c', kind: 'note', body: LONG }),
  ];
  const s = severityStep(rows, 'c', LIMIT);
  assert.equal(s.refusal_rate, 0.5);
  assert.equal(s.notice_rate, 1);
  assert.equal(s.step, 2);
});

test('the step is null rather than Infinity when the refused side has no cuts', () => {
  const rows = [
    row({ from_company: 'c', kind: 'ask', body: SHORT }),
    row({ from_company: 'c', kind: 'note', body: LONG }),
  ];
  const s = severityStep(rows, 'c', LIMIT);
  assert.equal(s.refusal_rate, 0);
  assert.equal(s.step, null);
});

test('the step is null rather than NaN when a side is empty', () => {
  const s = severityStep([row({ from_company: 'c', kind: 'note', body: LONG })], 'c', LIMIT);
  assert.equal(s.refusal_rate, null);
  assert.equal(s.step, null);
});

test('the step is scoped to one company and ignores every other sender', () => {
  const rows = [
    row({ from_company: 'c', kind: 'note', body: LONG }),
    row({ from_company: 'other', kind: 'note', body: LONG }),
    row({ from_company: 'other', kind: 'note', body: LONG }),
  ];
  const s = severityStep(rows, 'c', LIMIT);
  assert.equal(s.notice.sent, 1);
});

test('the company match is case-insensitive, because the bus spells it both ways', () => {
  const rows = [row({ from_company: 'Ursa', kind: 'note', body: LONG })];
  assert.equal(severityStep(rows, 'ursa', LIMIT).notice.sent, 1);
  assert.equal(severityStep(rows, 'URSA', LIMIT).notice.sent, 1);
});

// ---- the reading ----

test('a tail-repair row is corroborated only by an EARLIER cut row from the same seat', () => {
  const rows = [
    row({ ts: '1', body: LONG, subject: 'an ordinary cut row' }),
    row({ ts: '2', body: SHORT, subject: 'The tail my send cut: the rest' }),
  ];
  const r = read(rows, LIMIT);
  const u = r.companies.find((c) => c.company === 'ursa');
  assert.equal(u.cut, 1);
  assert.equal(u.tail, 1);
  assert.equal(u.corroborated, 1);
});

test('a tail repair with no earlier cut row from that seat is counted and NOT corroborated', () => {
  const r = read([row({ ts: '1', body: SHORT, subject: 'The tail my send cut: the rest' })], LIMIT);
  const u = r.companies.find((c) => c.company === 'ursa');
  assert.equal(u.tail, 1);
  assert.equal(u.corroborated, 0);
});

test('a tail repair cannot corroborate itself by being cut', () => {
  // The one ordering bug this counter can have: if the row's own cut were
  // recorded before the question was asked, every long tail-repair row would
  // corroborate itself and the column would be decoration.
  const r = read([row({ ts: '1', body: LONG, subject: 'The tail my send cut: the rest' })], LIMIT);
  const u = r.companies.find((c) => c.company === 'ursa');
  assert.equal(u.cut, 1);
  assert.equal(u.tail, 1);
  assert.equal(u.corroborated, 0);
});

test('a LATER cut row does not corroborate an earlier tail repair', () => {
  const r = read([
    row({ ts: '2', body: SHORT, subject: 'The tail my send cut: the rest' }),
    row({ ts: '3', body: LONG, subject: 'an ordinary cut row' }),
  ], LIMIT);
  assert.equal(r.companies.find((c) => c.company === 'ursa').corroborated, 0);
});

test('corroboration is per seat, so another seat cut row does not count', () => {
  const r = read([
    row({ ts: '1', from_seat: 'pm', body: LONG, subject: 'an ordinary cut row' }),
    row({ ts: '2', from_seat: 'exo', body: SHORT, subject: 'The tail my send cut: the rest' }),
  ], LIMIT);
  assert.equal(r.companies.find((c) => c.company === 'ursa').corroborated, 0);
});

test('rows are ordered by ts before grading, so an unsorted page reads the same', () => {
  const a = read([
    row({ ts: '2', body: SHORT, subject: 'The tail my send cut: the rest' }),
    row({ ts: '1', body: LONG, subject: 'an ordinary cut row' }),
  ], LIMIT);
  assert.equal(a.companies.find((c) => c.company === 'ursa').corroborated, 1);
});

test('read scoped to one company excludes every other sender from every table', () => {
  const rows = [
    row({ from_company: 'Ursa', kind: 'note', body: LONG }),
    row({ from_company: 'alexandria', kind: 'done', body: LONG }),
  ];
  const r = read(rows, LIMIT, 'ursa');
  assert.equal(r.companies.length, 1);
  assert.equal(r.companies[0].company, 'ursa');
  // The by-kind table must not carry the other company's kinds, or a reader
  // can divide a bus-wide kind count by a one-company step.
  assert.deepEqual(r.kinds.map((k) => k.kind), ['note']);
});

test('a row with no sending company is skipped rather than bucketed under an empty name', () => {
  const r = read([row({ from_company: '' }), row({ from_company: null })], LIMIT);
  assert.deepEqual(r.companies, []);
  assert.equal(r.rows_graded, 2);
});

test('rows_graded is the denominator of the read and not of the printed rows', () => {
  const r = read([row(), row({ body: LONG }), row({ from_company: '' })], LIMIT);
  assert.equal(r.rows_graded, 3);
  assert.equal(r.rows.length, 1);
});

test('every position names where it is, so the json carries its own attribution', () => {
  assert.deepEqual(POSITIONS.map((p) => p.position), ['REFUSAL', 'NOTICE', 'ABSENT']);
  for (const p of POSITIONS) {
    assert.ok(p.where && p.where.length > 10, `${p.position} does not say where it is`);
    assert.ok(p.line && p.line.length > 10, `${p.position} does not say what it is`);
  }
});

test('the kinds table carries each kind severity, so the two halves cannot be confused', () => {
  const r = read([
    row({ kind: 'ask', body: LONG }),
    row({ kind: 'note', body: LONG }),
  ], LIMIT);
  const byKind = Object.fromEntries(r.kinds.map((k) => [k.kind, k.severity]));
  assert.equal(byKind.ask, 'REFUSAL');
  assert.equal(byKind.note, 'NOTICE');
});
