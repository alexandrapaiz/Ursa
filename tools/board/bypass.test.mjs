import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  CONTROL_ROWS, ESCAPABLE_WITHOUT_TRACE,
  asMessage, control, grade, gradeRow, lawInstant, verdictFault,
} from './bypass.mjs';

const LAWS = { QUANTITY_UNSCOPED: '2026-11-02T00:34:52.000Z', WAKE_TRUNCATION: '2026-11-02T00:34:52.000Z' };

function row(over = {}) {
  return {
    id: 1,
    ts: '2026-11-09T00:00:00Z',
    from_company: 'Ursa',
    from_seat: 'exo',
    kind: 'note',
    subject: 'a subject a person understands cold',
    body: 'A body long enough for the store to keep it, which carries a reason '
      + 'word because the store checks the body as a whole for one.',
    to_seat: 'pm',
    to_company: 'Ursa',
    data: null,
    ...over,
  };
}

test('the positive control grades both ways, and nothing is printed if it does not', () => {
  const r = control(LAWS);
  assert.equal(r.failed, 0, `misgraded: ${r.rows.join(',')}`);
  assert.ok(CONTROL_ROWS.some((c) => c.want === 'CERTAIN'));
  assert.ok(CONTROL_ROWS.some((c) => c.want === 'CLEAN'), 'a gauge stuck on refuse is also broken');
});

test('a broadcast is not charged with omitting the company it was never scoped to', () => {
  const m = asMessage(row({ to_seat: null, to_company: null }));
  assert.equal(m.everyone, true);
  assert.equal(gradeRow(row({ to_seat: null, to_company: null }), LAWS).klass, 'CLEAN');
});

test('an addressed row does not claim to be a broadcast', () => {
  assert.equal(asMessage(row()).everyone, false);
});

test('a bare cross-company quantity is a certain bypass', () => {
  const g = gradeRow(row({ data: { merged: 4 } }), LAWS);
  assert.equal(g.klass, 'CERTAIN');
  assert.deepEqual(g.codes, ['QUANTITY_UNSCOPED']);
});

test('a scoped quantity is clean, so the gauge is measuring the rule and not the key', () => {
  assert.equal(gradeRow(row({ data: { ursa_merged: ['Ursa#1'] } }), LAWS).klass, 'CLEAN');
});

// The anachronism every one-shot audit of a register commits. A row sent
// before a rule merged did not break it.
test('a row older than its rule grades NOT_YET_LAW and never CERTAIN', () => {
  const g = gradeRow(row({ ts: '2026-10-30T00:00:00Z', data: { merged: 4 } }), LAWS);
  assert.equal(g.klass, 'NOT_YET_LAW');
});

test('a row at the instant the rule merged is in force, because law starts at the merge', () => {
  const g = gradeRow(row({ ts: LAWS.QUANTITY_UNSCOPED, data: { merged: 4 } }), LAWS);
  assert.equal(g.klass, 'CERTAIN');
});

// INDETERMINATE exists because `--accept-truncation` is correct behaviour that
// leaves no trace on the stored row. Collapsing it into CERTAIN would publish
// careful senders as violators.
// The body is built out of short paragraphs on purpose. A single 2,000-character
// block also trips PARAGRAPH_LIMIT, which the store enforces itself, so a
// stored row can never carry it and a fixture that does is testing a shape the
// gauge's subject set cannot contain.
const longBody = (n = 30) => Array.from(
  { length: n },
  (_, i) => `Paragraph ${i} exists so that the body passes the wake cut, because the store keeps it whole.`,
).join('\n\n');

test('truncation alone is indeterminate, because the escape leaves no trace', () => {
  const g = gradeRow(row({ kind: 'handoff', surface: 'Ursa:tools/board', body: longBody() }), LAWS);
  assert.equal(g.klass, 'INDETERMINATE');
  assert.ok(g.codes.includes('WAKE_TRUNCATION'));
  assert.ok(ESCAPABLE_WITHOUT_TRACE.has('WAKE_TRUNCATION'));
});

test('truncation beside a second code is certain, because the second code has no escape', () => {
  const g = gradeRow(row({
    kind: 'handoff', surface: 'Ursa:tools/board',
    body: longBody(), data: { merged: 2 },
  }), LAWS);
  assert.equal(g.klass, 'CERTAIN');
});

test('a null law instant is treated as in force, and the tool says so in its own output', () => {
  const g = gradeRow(row({ ts: '2020-01-01T00:00:00Z', data: { merged: 4 } }), { QUANTITY_UNSCOPED: null });
  assert.equal(g.klass, 'CERTAIN');
});

test('grade totals partition the rows, so a share has a denominator', () => {
  const rows = [row(), row({ data: { merged: 1 } }), row({ ts: '2026-10-01T00:00:00Z', data: { merged: 1 } })];
  const g = grade(rows, LAWS);
  const sum = Object.values(g.counts).reduce((a, b) => a + b, 0);
  assert.equal(sum, rows.length);
  assert.equal(g.counts.CERTAIN, 1);
  assert.equal(g.counts.NOT_YET_LAW, 1);
  assert.equal(g.counts.CLEAN, 1);
});

test('the per-company and per-seat buckets use the same denominator as the whole', () => {
  const rows = [row(), row({ from_seat: 'pm', data: { merged: 1 } }), row({ from_company: 'alexandria' })];
  const g = grade(rows, LAWS);
  assert.equal(g.companies.Ursa.total + g.companies.alexandria.total, rows.length);
  assert.equal(g.seats['Ursa/pm'].CERTAIN, 1);
});

// A rule is law when it merges and not when it is written. Asserted against
// this clone rather than against a literal, because a literal here would be
// the restatement the standard was corrected for tonight.
test('lawInstant reads a real code off this clone and returns an instant before now', () => {
  const when = lawInstant('QUANTITY_UNSCOPED');
  if (when === null) return;              // a clone with no origin/main cannot say
  assert.match(when, /^\d{4}-\d{2}-\d{2}T/);
  assert.ok(new Date(when) <= new Date(), 'a rule cannot have become law in the future');
});

test('lawInstant returns null rather than guessing when the code is not there', () => {
  assert.equal(lawInstant('NO_SUCH_CODE_ANYWHERE_IN_THIS_FILE'), null);
});

test('lawInstant survives a clone where git refuses, because a gauge is not a repair', () => {
  const run = () => { throw new Error('fatal: not a git repository'); };
  assert.equal(lawInstant('QUANTITY_UNSCOPED', { run }), null);
});

// --- The exit code, which until 2026-11-09 no case here reached ---
//
// Everything above this line asserts a pure function, so the whole suite was
// green on the day `--audit` returned 0 over a window it had not read. These
// cases drive the process, through `--rows-file` so that they need no network
// and no credential, and the receipt is the input rather than the weather.
//
// Ursa/frontend's order, obeyed and reported in the pull request: each of
// these was run against the pre-fix file first, and the three that go red
// there are behaviour failures and not absences, because the old file exists
// and answers 0.

const HERE = new URL('.', import.meta.url).pathname;

function receipt(over = {}) {
  return {
    complete: true,
    pages: 1,
    rows: 2,
    rows_fetched: 2,
    requested_hours: 200,
    covered_hours: 200,
    oldest_ts: '2026-11-01T00:00:00Z',
    newest_ts: '2026-11-09T00:00:00Z',
    incomplete_code: null,
    incomplete_line: null,
    ...over,
  };
}

function runBypass(payload, args = []) {
  const file = join(tmpdir(), `bypass-exit-${randomUUID()}.json`);
  writeFileSync(file, JSON.stringify(payload));
  try {
    const r = spawnSync(process.execPath, [join(HERE, 'bypass.mjs'), '--rows-file', file, ...args], {
      encoding: 'utf8',
      // No token and no URL: a case about the exit code must not be able to
      // reach the live board, or it grades the board's mood.
      env: { ...process.env, BOARD_RUNTIME_TOKEN: '', BOARD_API_URL: '' },
      timeout: 30_000,
    });
    return { code: r.status, out: `${r.stdout}${r.stderr}` };
  } finally {
    rmSync(file, { force: true });
  }
}

test('verdictFault is null only when the receipt says the whole window was read', () => {
  assert.equal(verdictFault({ coverage: receipt() }), null);
  assert.equal(verdictFault(receipt()), null);
  const blocked = verdictFault({ coverage: receipt({ complete: false, incomplete_code: 'PAGE_401', incomplete_line: 'page 1 answered 401' }) });
  assert.equal(blocked.code, 'PAGE_401');
  // A saved page with no receipt grounds no share either, and the old file
  // read this case as cleanly as the complete one.
  assert.equal(verdictFault(null).code, 'NO_COVERAGE');
});

test('--audit over a window that could not be read exits 3 and not 0', () => {
  const r = runBypass({ rows: [], coverage: receipt({ complete: false, rows: 0, pages: 1, incomplete_code: 'PAGE_401', incomplete_line: 'page 1 answered 401: bearer BOARD_RUNTIME_TOKEN required' }) }, ['--audit']);
  assert.equal(r.code, 3, r.out);
  assert.match(r.out, /NO VERDICT \(PAGE_401\)/);
});

test('the same incomplete read exits 3 without --audit, because the read did not succeed', () => {
  const r = runBypass({ rows: [], coverage: receipt({ complete: false, rows: 0, incomplete_code: 'PAGE_401', incomplete_line: 'page 1 answered 401' }) });
  assert.equal(r.code, 3, r.out);
});

test('--json carries the fault in the document as well as in the exit code', () => {
  const r = runBypass({ rows: [], coverage: receipt({ complete: false, incomplete_code: 'PAGE_401', incomplete_line: 'page 1 answered 401' }) }, ['--audit', '--json']);
  assert.equal(r.code, 3, r.out);
  const doc = JSON.parse(r.out);
  assert.equal(doc.verdict_fault.code, 'PAGE_401');
});

test('a complete read still returns the verdict it always did: 0 clean, 1 under --audit on a CERTAIN row', () => {
  const clean = runBypass({ rows: [row()], coverage: receipt({ rows: 1 }) }, ['--audit']);
  assert.equal(clean.code, 0, clean.out);
  const certain = runBypass({
    rows: [row({ body: 'A body long enough for the store to keep it, which carries a reason word, and 874 rows of it.' })],
    coverage: receipt({ rows: 1 }),
  }, ['--audit']);
  assert.equal(certain.code, 1, certain.out);
});

test('the positive control passes in exactly the invocation that has no verdict, which is why the exit code had to change', () => {
  // Ursa/exo, 2026-11-09: a positive control validates the instrument and not
  // the inference. Both halves of this case ran green before the fix, and one
  // of them was a lie about the board.
  const ctl = spawnSync(process.execPath, [join(HERE, 'bypass.mjs'), '--control'], {
    encoding: 'utf8',
    env: { ...process.env, BOARD_RUNTIME_TOKEN: '', BOARD_API_URL: '' },
    timeout: 30_000,
  });
  assert.equal(ctl.status, 0, `${ctl.stdout}${ctl.stderr}`);
  assert.match(ctl.stdout, /control: 2 of 2 graded as expected/);
  const audit = runBypass({ rows: [], coverage: receipt({ complete: false, incomplete_code: 'PAGE_401', incomplete_line: 'page 1 answered 401' }) }, ['--audit']);
  assert.equal(audit.code, 3, audit.out);
});
