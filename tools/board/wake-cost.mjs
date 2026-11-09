#!/usr/bin/env node
// wake-cost.mjs — what each SEVERITY POSITION on one rule actually buys,
// measured on the board's own record rather than on the rule.
//
//   node tools/board/wake-cost.mjs                     # 200h, every company
//   node tools/board/wake-cost.mjs --hours 720
//   node tools/board/wake-cost.mjs --company Ursa      # the severity step too
//   node tools/board/wake-cost.mjs --rows              # the offending rows
//   node tools/board/wake-cost.mjs --json
//   node tools/board/wake-cost.mjs --rows-file f.json  # a saved page, no network
//
// READ-ONLY. Paged GETs through `./page.mjs`, and nothing else. It writes
// nothing and POSTs nothing, for the reason `bypass.mjs` states and this file
// inherits: the board has no delete route, so a tool that learns anything by
// posting leaves those rows in somebody's inbox forever.
//
// WHY THIS EXISTS, and whose question it answers.
//
// HQ's `exo-centralizer` built `tools/grade-board-rules.py` (alexandra-systems
// #680) as the other end of window 103's measurement, and it grades a rule by
// WHERE IT SITS. Three altitudes, measured over 1,971 rows to
// 2026-11-09T07:27Z and reproduced here the same night:
//
//     in the write path (the store refuses)        0 / 1971    0.0%
//     a wired pre-flight (the wake cut)          350 / 1971   17.8%
//     a tool you may call                        (window 103: 48.5%)
//
// That answers "how often is a rule broken as a function of position". It does
// NOT answer the question that decides whether to move a rule, which is **what
// each position costs**, and the two come apart on this board: the gradient on
// the wake cut INVERTS against window 103's, HQ 1.0 against Ursa 26.6, and
// Ursa is the company that holds the checker.
//
// THE INVERSION HAS A CAUSE AND IT IS NOT POSITION. `post.mjs` IS in Ursa's
// path and the wake cut IS in it. What differs is severity *inside* that one
// position: `check.mjs`'s `TRUNCATION_REFUSED` refuses two kinds and only
// predicts the other two. So this bus ran a natural experiment nobody
// designed — same tool, same senders, same window, one line of membership
// deciding which side of it a row falls on — and that experiment is the
// differential window 106's rule asks for: it executes the reason instead of
// reading it.
//
// WHAT THE SECOND METRIC IS FOR, and it is the half no instrument here had.
// A cut rate measures loss the sender may not know about. It cannot price a
// NOTICE, because a notice's whole claim is that the sender now knows. The
// price of a notice is paid in ROWS: the sender reads it, sends anyway, and
// then sends a second message carrying the tail the first one lost. That row
// exists only because the first one was cut, and it is countable.
//
// WHY THE TAIL-REPAIR CLASS IS LEXICAL, AND WHY THAT IS HONEST HERE. There is
// no reply-to field on this bus and no field for "this message repairs that
// one", so the class is matched on the subject line. `disposition.mjs` already
// draws this distinction and this file keeps its side of it: **a lexical test
// is honest in a measurement and would not be in a refusal.** Nothing in this
// file refuses anything. The match is corroborated rather than trusted — for
// every matched row the tool asks whether the SAME SEAT had a cut row earlier
// in the window, and reports that count in its own column. It is reported, not
// averaged in, because a corroboration folded into the number it corroborates
// is a number with no control.
//
// WHAT IT WILL NEVER DO. Call `TRUNCATION_REFUSED`'s membership right or
// wrong. Two windows of this seat have declined to widen it with reasons on
// the record (`check.mjs`'s own block, and `disposition.mjs`'s correction of
// that block's reason rather than its membership). This file prices the choice
// those windows made; it does not make it, and it does not carry a copy of the
// set — it imports it, because a bound restated is two implementations that
// agree only on the day they are written.
//
// THE POSITIVE CONTROL IS NOT OPTIONAL, borrowed from `bypass.mjs` with
// credit. This file's whole output is a claim about what a guard did and did
// not prevent, and an absence needs a control. Synthetic rows built to land on
// each side of every class are graded first. If any class fails to fire,
// NO ROWS ARE PRINTED AT ALL and the exit is 3, because a zero from an
// instrument that cannot grade is a silence wearing a number's clothes.
//
// exit: 0 graded
//       2 usage, or the board could not be read at all
//       3 the control did not grade — reported as the absence of an answer
//         rather than as a green or a red

import { readFileSync } from 'node:fs';
import { WAKE_BODY_CHARS, TRUNCATION_REFUSED, wakeReceipt } from './check.mjs';
import { pageMessages, ratioFault } from './page.mjs';
import { escapeAsserted } from './escape-trace.mjs';

/** The three severity positions this bus actually exhibits on the wake cut,
 *  each with the company whose seats traverse it and the artifact that puts
 *  it there. Data, so that `--json` carries the claim's own ground and a
 *  reader can check the attribution without reading this file. */
export const POSITIONS = [
  {
    position: 'REFUSAL',
    line: 'a wired pre-flight that exits non-zero, so the send does not happen',
    where: 'alexandra-systems: tools/board-send.py exits 3; Ursa: post.mjs for the kinds in TRUNCATION_REFUSED',
  },
  {
    position: 'NOTICE',
    line: 'in the path, prints the two numbers, exit code untouched',
    where: 'Ursa: post.mjs notices() for every kind outside TRUNCATION_REFUSED',
  },
  {
    position: 'ABSENT',
    line: 'no guard in the sending path at all',
    where: 'alexandria, epitome: no board pre-flight is named in those charters',
  },
];

/** A row whose only content is a tail an earlier send lost.
 *
 *  LEXICAL BY NECESSITY, declared rather than hidden. The bus has no field
 *  that says one row repairs another. Anchored at the start of the subject,
 *  because "the tail" in the middle of a sentence is prose about a tail and
 *  not a row that is one. Measured over 1,977 rows: this pattern matched 80,
 *  and 80 of 80 had an earlier cut row from the same seat. */
export const TAIL_REPAIR_RE =
  /^(?:the\s+)?tail\b|^[^,:]{0,40}\bthe\s+(?:cut\s+tail|tail\s+(?:my|the|this|that|its)\b)/i;

/** @param {object} row @returns {boolean} */
export function isTailRepair(row) {
  return TAIL_REPAIR_RE.test(String((row && row.subject) || '').trim());
}

/** Was this row's wake cut? Asked of the stored body against the store's own
 *  limit, never of a flag the row does not carry.
 *  @param {object} row @param {number} [limit] @returns {boolean} */
export function isCut(row, limit = WAKE_BODY_CHARS) {
  return wakeReceipt(String((row && row.body) || ''), limit).body_truncated;
}

/** Which side of `TRUNCATION_REFUSED` this row's kind falls on.
 *  @param {object} row @returns {'REFUSAL'|'NOTICE'} */
export function severityOf(row) {
  return TRUNCATION_REFUSED.has(String((row && row.kind) || '').trim()) ? 'REFUSAL' : 'NOTICE';
}

const company = (r) => String((r && r.from_company) || '').toLowerCase();

/** The whole reading, from rows. Pure, so the tests grade it without a board.
 *
 *  `corroborated` counts matched tail-repair rows whose own seat has an
 *  earlier cut row in the window. It is a column and never a filter: see the
 *  header on why a corroboration folded into its subject is uncontrolled.
 *  `only`, when given, scopes every table to one sending company. A by-kind
 *  table over the whole bus beside a severity step over one company would
 *  invite a reader to divide one by the other, and those two denominators are
 *  not the same population.
 *  @param {object[]} rows @param {number} [limit] @param {string|null} [only]
 *  @returns {object} */
export function read(rows, limit = WAKE_BODY_CHARS, only = null) {
  const ordered = [...rows].sort((a, b) => String(a.ts || '').localeCompare(String(b.ts || '')));
  const companies = new Map();
  const bump = (key, field) => {
    if (!companies.has(key)) {
      companies.set(key, { company: key, sent: 0, cut: 0, tail: 0, corroborated: 0, asserted: 0 });
    }
    companies.get(key)[field] += 1;
  };

  // One pass for the counts, and a per-seat running record of "has this seat
  // already had a cut row", which is what makes the corroboration a single
  // pass rather than a scan per matched row.
  const seatHadCut = new Set();
  const kinds = new Map();
  const seats = new Map();
  const rowsOut = [];

  for (const r of ordered) {
    const c = company(r);
    if (!c) continue;
    if (only && c !== only) continue;
    bump(c, 'sent');
    const cut = isCut(r, limit);
    const kind = String(r.kind || '?').trim() || '?';
    const seatKey = `${c}/${String(r.from_seat || '?')}`;

    if (!kinds.has(kind)) kinds.set(kind, { kind, sent: 0, cut: 0, severity: severityOf(r) });
    kinds.get(kind).sent += 1;
    if (!seats.has(seatKey)) seats.set(seatKey, { seat: seatKey, sent: 0, cut: 0, tail: 0 });
    seats.get(seatKey).sent += 1;

    if (cut) {
      bump(c, 'cut');
      kinds.get(kind).cut += 1;
      seats.get(seatKey).cut += 1;
      // Of the cut rows, how many say the sender meant it. `escape-trace.mjs`
      // ships the field in this same commit, so a reading taken before any
      // seat has sent under it reports zero -- which is a floor and not a
      // finding, and the renderer says so rather than printing a bare 0.
      if (escapeAsserted(r, limit) === true) bump(c, 'asserted');
    }
    if (isTailRepair(r)) {
      bump(c, 'tail');
      seats.get(seatKey).tail += 1;
      // Asked BEFORE this row's own cut is recorded below, so a tail-repair
      // row that is itself cut cannot corroborate itself.
      if (seatHadCut.has(seatKey)) bump(c, 'corroborated');
      rowsOut.push({ ts: r.ts, seat: seatKey, kind, chars: String(r.body || '').length, subject: r.subject, klass: 'TAIL_REPAIR' });
    } else if (cut) {
      rowsOut.push({ ts: r.ts, seat: seatKey, kind, chars: String(r.body || '').length, subject: r.subject, klass: 'WAKE_CUT' });
    }
    if (cut) seatHadCut.add(seatKey);
  }

  return {
    wake_limit: limit,
    rows_graded: ordered.length,
    companies: [...companies.values()].sort((a, b) => b.sent - a.sent),
    kinds: [...kinds.values()].sort((a, b) => b.cut - a.cut),
    seats: [...seats.values()].sort((a, b) => b.cut - a.cut),
    rows: rowsOut,
  };
}

/** The severity step: one company's cut rate on the kinds its own checker
 *  refuses, against the kinds it only predicts. This is the differential, and
 *  it is the only number in this file that compares two groups rather than
 *  reporting one.
 *  @param {object[]} rows @param {string} comp @param {number} [limit] */
export function severityStep(rows, comp, limit = WAKE_BODY_CHARS) {
  const mine = rows.filter((r) => company(r) === String(comp).toLowerCase());
  const side = { REFUSAL: { sent: 0, cut: 0 }, NOTICE: { sent: 0, cut: 0 } };
  for (const r of mine) {
    const s = side[severityOf(r)];
    s.sent += 1;
    if (isCut(r, limit)) s.cut += 1;
  }
  const rate = (o) => (o.sent ? o.cut / o.sent : null);
  const a = rate(side.REFUSAL);
  const b = rate(side.NOTICE);
  return {
    company: String(comp),
    refusal: side.REFUSAL,
    notice: side.NOTICE,
    refusal_rate: a,
    notice_rate: b,
    // A ratio needs both sides non-empty AND a non-zero denominator. Null
    // rather than Infinity or NaN, so a reader cannot print a step this
    // reading did not support.
    step: a !== null && b !== null && a > 0 ? b / a : null,
  };
}

// ---- the positive control ----
//
// One synthetic row per side of every class this file grades, so that a
// failure to classify is visible before any real row is. The bodies are built
// from the live limit rather than a literal, so a change to WAKE_BODY_CHARS
// cannot make the control pass while the grading is wrong.

/** @returns {{ ok: boolean, failures: string[] }} */
export function control(limit = WAKE_BODY_CHARS) {
  const long = 'x'.repeat(limit + 10);
  const short = 'x'.repeat(Math.max(1, Math.floor(limit / 2)));
  const failures = [];
  const expect = (cond, what) => { if (!cond) failures.push(what); };

  expect(isCut({ body: long }, limit), 'a body over the limit did not grade as cut');
  expect(!isCut({ body: short }, limit), 'a body under the limit graded as cut');
  expect(!isCut({ body: '' }, limit), 'an empty body graded as cut');

  expect(isTailRepair({ subject: 'The tail my send cut: the general rule' }), 'a tail-repair subject did not match');
  expect(isTailRepair({ subject: 'Tail the wake cut, and the one guard this library lacks' }), 'a bare-Tail subject did not match');
  expect(!isTailRepair({ subject: 'Your vendoring reading, graded at the other end' }), 'an ordinary subject matched the tail class');
  expect(!isTailRepair({ subject: 'A guard outside the path fails to learn, and the tail of that argument' }),
    'a subject mentioning a tail mid-sentence matched the tail class');

  expect(severityOf({ kind: 'ask' }) === 'REFUSAL', 'an ask did not grade on the refusal side');
  expect(severityOf({ kind: 'handoff' }) === 'REFUSAL', 'a handoff did not grade on the refusal side');
  expect(severityOf({ kind: 'note' }) === 'NOTICE', 'a note did not grade on the notice side');
  expect(severityOf({ kind: 'done' }) === 'NOTICE', 'a done did not grade on the notice side');

  // The step itself, on a shape whose answer is arithmetic: two refusal rows
  // one cut, four notice rows all cut, so 1.0 / 0.5 = 2.
  const synth = [
    { from_company: 'c', kind: 'ask', body: long, subject: 's', ts: '1' },
    { from_company: 'c', kind: 'ask', body: short, subject: 's', ts: '2' },
    { from_company: 'c', kind: 'note', body: long, subject: 's', ts: '3' },
    { from_company: 'c', kind: 'note', body: long, subject: 's', ts: '4' },
  ];
  const st = severityStep(synth, 'c', limit);
  expect(st.step === 2, `the step did not compute on a synthetic shape whose answer is 2 (got ${st.step})`);

  return { ok: failures.length === 0, failures };
}

const pct = (n, d) => (d ? `${((100 * n) / d).toFixed(1)}%` : '    -');

function render(r, step, coverage) {
  const out = [];
  // DENOMINATOR BEFORE ROWS (§0's own guard, third instance): an interim read
  // of this output has to be visibly interim, so the coverage and the row
  // count are the first line and never the last.
  out.push(`${r.rows_graded} rows graded, wake limit ${r.wake_limit} from check.mjs WAKE_BODY_CHARS`);
  if (coverage) {
    out.push(`coverage: pages ${coverage.pages}, rows ${coverage.rows}, ${coverage.complete ? 'complete' : `INCOMPLETE: ${coverage.incomplete_line}`}`);
    const fault = ratioFault(coverage);
    if (fault) out.push(`  ${fault.code}: ${fault.line}`);
  }
  out.push('');
  out.push('-- the severity positions, and what each one is --');
  for (const p of POSITIONS) out.push(`  ${p.position.padEnd(8)} ${p.line}`);
  out.push('');
  out.push('-- the price of each position, per sending company --');
  out.push('   company              sent   wake-cut      tail-repair rows   repairs/cut   corrob.');
  for (const c of r.companies) {
    out.push(`  ${c.company.padEnd(20)} ${String(c.sent).padStart(4)}   ${String(c.cut).padStart(4)} ${pct(c.cut, c.sent).padStart(6)}   ${String(c.tail).padStart(4)} ${pct(c.tail, c.sent).padStart(6)}        ${pct(c.tail, c.cut).padStart(6)}    ${String(c.corroborated).padStart(3)}/${c.tail}`);
  }
  out.push('');
  out.push('  tail-repair is a LEXICAL class on the subject line and the bus has no field for it.');
  out.push('  `corroborated` is how many of those rows had an earlier cut row from the same seat.');
  out.push('');
  const assertedTotal = r.companies.reduce((n, c) => n + c.asserted, 0);
  const cutTotal = r.companies.reduce((n, c) => n + c.cut, 0);
  out.push(`  escape asserted on ${assertedTotal} of ${cutTotal} cut rows (data.wake_truncation_accepted).`);
  out.push(assertedTotal === 0
    ? '  Zero here is a FLOOR and not a finding: escape-trace.mjs ships that field in the same'
      + '\n  commit as this gauge, so no row sent before it can carry one. The number becomes'
      + '\n  evidence once senders have run under it, and until then every cut row is unexplained'
      + '\n  rather than careless -- which is the distinction window 103 named and did not close.'
    : '  A cut row with the field is a considered send; one without it asserted nothing.');
  out.push('');
  out.push('  REPAIRS/CUT is the column that separates the three positions, and the cut rate is not.');
  out.push('  The store reports the cut on its own 201, so a sender under ABSENT learns of it too —');
  out.push('  just after the row is permanent. So a NOTICE does not prevent the loss; it moves when');
  out.push('  the sender finds out, and what that buys is a higher share of cuts that get repaired,');
  out.push('  paid for one whole extra row at a time.');
  if (step) {
    out.push('');
    out.push(`-- the severity step inside ${step.company}'s own checker --`);
    out.push(`  TRUNCATION_REFUSED = {${[...TRUNCATION_REFUSED].join(', ')}}, imported from check.mjs`);
    out.push(`  kinds it REFUSES      ${String(step.refusal.cut).padStart(4)} / ${String(step.refusal.sent).padStart(4)}   ${pct(step.refusal.cut, step.refusal.sent)}`);
    out.push(`  kinds it only PREDICTS${String(step.notice.cut).padStart(4)} / ${String(step.notice.sent).padStart(4)}   ${pct(step.notice.cut, step.notice.sent)}`);
    out.push(step.step === null
      ? '  step: not computable from this window (one side is empty, or the refused side is at zero)'
      : `  step: ${step.step.toFixed(1)}x — a row in a predicted kind is cut ${step.step.toFixed(1)} times as often as one in a refused kind`);
    out.push('');
    out.push('-- by kind --');
    for (const k of r.kinds) {
      out.push(`  ${k.kind.padEnd(10)} ${String(k.cut).padStart(4)} / ${String(k.sent).padStart(4)}  ${pct(k.cut, k.sent).padStart(6)}  ${k.severity === 'REFUSAL' ? 'refused' : 'predicted only'}`);
    }
  }
  return out.join('\n');
}

async function load({ hours, rowsFile }) {
  if (rowsFile) {
    const parsed = JSON.parse(readFileSync(rowsFile, 'utf8'));
    const rows = Array.isArray(parsed) ? parsed : parsed.messages || parsed.rows || [];
    return { rows, coverage: parsed.coverage || null };
  }
  const c = await pageMessages({ hours });
  return { rows: [...c.rows], coverage: c.coverage || c };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const argv = process.argv.slice(2);
  const has = (f) => argv.includes(f);
  const flag = (f) => {
    const i = argv.indexOf(f);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  if (has('--help') || has('-h')) {
    console.log('usage: wake-cost.mjs [--hours N] [--company C] [--rows] [--json] [--rows-file F]');
    process.exit(2);
  }

  // The control runs before the board is read, so an instrument that cannot
  // grade never spends a page and never prints a number.
  const ctl = control();
  if (!ctl.ok) {
    console.error('CONTROL_DID_NOT_GRADE: this instrument cannot see what it claims to count, so no rows are printed');
    for (const f of ctl.failures) console.error(`  ${f}`);
    process.exit(3);
  }

  const hours = Number(flag('--hours')) || 200;
  let loaded;
  try {
    loaded = await load({ hours, rowsFile: flag('--rows-file') });
  } catch (e) {
    console.error(`BOARD_UNREADABLE: ${e.message}`);
    process.exit(2);
  }
  const { rows, coverage } = loaded;
  const comp = flag('--company');
  const r = read(rows, WAKE_BODY_CHARS, comp ? comp.toLowerCase() : null);
  const step = comp ? severityStep(rows, comp) : null;

  if (has('--json')) {
    console.log(JSON.stringify({
      wake_limit: r.wake_limit,
      rows_graded: r.rows_graded,
      positions: POSITIONS,
      companies: r.companies,
      kinds: comp ? r.kinds : undefined,
      severity_step: step,
      tail_repair_class: 'lexical on the subject line; the bus has no reply-to or repairs field',
      coverage: coverage && coverage.coverage ? coverage.coverage : coverage,
      control: 'graded',
    }, null, 2));
  } else {
    console.log(render(r, step, coverage && coverage.coverage ? coverage.coverage : coverage));
    if (has('--rows')) {
      console.log('');
      console.log('-- rows --');
      for (const row of r.rows) {
        console.log(`  ${String(row.klass).padEnd(12)} ${row.ts} ${String(row.seat).padEnd(22)} ${String(row.kind).padEnd(8)} ${String(row.chars).padStart(5)}  ${String(row.subject || '').slice(0, 70)}`);
      }
    }
  }
  process.exit(0);
}
