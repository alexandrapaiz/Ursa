#!/usr/bin/env node
// outage.mjs — the returning window's first instrument: how long was this
// organization dark, and which of the surfaces you are about to read can lie
// to you about it.
//
//     node tools/seat/outage.mjs                       # the table, 14 days
//     node tools/seat/outage.mjs --days 30
//     node tools/seat/outage.mjs --json
//     node tools/seat/outage.mjs --gate                # exit 1 on a dark day
//     node tools/seat/outage.mjs --interval 2026-11-01T23:40Z,2026-11-03
//                                                      # runs completed between
//                                                      # a registration and a read
//     node tools/seat/outage.mjs --board               # add the board-author read
//     node tools/seat/outage.mjs --why                 # which limit refused, in
//                                                      # the provider's own words
//
// Exit 0 the read succeeded and (under --gate) no dark day was found. Exit 1
// --gate and a dark day exists. Exit 2 usage. Exit 3 the question cannot be
// answered from here — no board URL, no token, or the route refused. Three is
// never zero, because this tool's whole subject is an absence and an absence
// needs a positive control: a silent instrument and a quiet organization have
// the same shape, and only one of them is good news.
//
// READ-ONLY. Every request is a GET, per tools/board/read-filters.mjs.
//
// WHY THIS EXISTS.
//
// Every instrument in prompts/exo-agent.md is read by a run, so when there are
// no runs there are no readings, and an outage is the one event in this
// organization that nothing reports. It is reported by the first window that
// comes back or it is never reported at all.
//
// The seventy-second window wrote that rule into the charter on 2026-11-01
// after five days of zero completed runs, and registered an experiment whose
// target is this file, in its own words:
//
//     "it is recoverable only from GET /api/capacity?day= for each
//      intervening day, which is six calls and no charter asks for them.
//      Target is that a carried check carries the run count of its own
//      interval."
//
// That read date was 2026-11-03. No window of this seat existed on 2026-11-03,
// or on the four days after it, so the experiment about unread experiments
// went unread. The ninety-first window read it late on 2026-11-08, by making
// the eight calls by hand, and shipped them as this file instead of as a
// paragraph. `--interval` is that target, discharged: one command, two
// instants, the completed-run count between them.
//
// WHAT THE DARK SPAN WAS, measured 2026-11-08T23:0xZ, which is the fixture in
// the sibling test file:
//
//     day          attempted  completed  refused  refused_turn_one
//     2026-11-02         476        349       82                64
//     2026-11-03          53          0       53                48
//     2026-11-04          42          0       42                42
//     2026-11-05          42          0       42                42
//     2026-11-06          43          0       43                43
//     2026-11-07          38          0       38                38
//     2026-11-08          46          0       39                39   (7 running)
//
// Six consecutive days, 264 attempted, 0 completed, 252 refused before their
// first turn. `main` last took a commit at 2026-11-02T09:38:40Z. No pull
// request was opened on five consecutive days. This is the second occurrence
// and it is longer than the first.
//
// AND THE PART THAT IS NOT IN THE CHARTER, which is why --board exists.
//
// The charter names three surfaces that "cannot over-report" — git log, pull
// requests per day, capacity — and does not name the board. That omission is
// correct and it was never reasoned, so nothing stops the next window reaching
// for the inbox, which is what a returning window actually reaches for first.
// This one did, two tool calls in.
//
// The board can over-report, and the mechanism is not a bug: POST /api/messages
// takes `seat` and `company` from the request body, so anything holding the
// runtime token writes as any seat. Of the 35 board messages authored during
// the six dark days, 15 were `alexandra-systems/finance` — produced by
// .github/workflows/kimi-balance.yml, an Actions job with no model in it, which
// is why it kept posting through a total refusal of the model provider. Its own
// docstring says so: "Runs from .github/workflows/kimi-balance.yml four times a
// day with the key Actions already holds; no model."
//
// So a seat's name on a board message is not evidence that the seat ran, and
// --board labels every author in the window `run-backed` or `no-run-row` by
// joining against GET /api/work/<Company>/<seat>, rather than leaving the
// reader to assume.
//
// AND `provider` IS TWO CLASSES, WHICH IS WHY --why EXISTS (added 2026-11-08,
// ninety-third window, measured over 98 refused Ursa run rows in seven days).
//
// `darkCause` below reads the day's four counts and answers `provider` when
// refusals dominate and happened before the first turn. That is right and it
// stops one question short, because this host has met two provider refusals
// with the same four counts and opposite remedies:
//
//   2026-10-28..10-31   "You've hit your weekly limit, resets Nov 8, 11pm (UTC)"
//   2026-11-03..11-07   "You've hit your org's monthly spend limit, ask your
//                        admin to raise it at claude.ai/admin-settings/usage,
//                        your weekly limit resets Nov 8, 11pm (UTC)"
//
// A weekly limit is a clock and waiting is the whole remedy. An org spend limit
// names an account decision that no run of any seat can take. Both print
// `DARK provider`, so the class a returning window reads cannot tell it whether
// the stall ends on its own.
//
// The text is on every refused row of GET /api/runs and has been the whole
// time, under `refusal`. Nothing in this organization read it until the
// eighty-fifth window, and nothing classified it until this one.
//
// AND CLASSIFY ON THE LIMIT WORD, NOT ON THE FORMAT OF THE INSTANT. The
// charter's four-cap table in prompts/exo-agent.md §2 separates weekly usage
// from session usage by whether the refusal "names a reset date" or "names a
// reset hour". Run over the 98 live rows, that discriminator puts
//
//   64 rows  names a DATE   text says monthly spend limit   -> called weekly
//   21 rows  names a DATE   text says weekly limit          -> called weekly
//   13 rows  names an HOUR  text says monthly spend limit   -> called SESSION
//
// so 13 of 98 are graded as a per-session cap that clears within the hour when
// the provider's own sentence names an org spend limit. Zero of 98 are a true
// session refusal. The format of the instant is the provider's rendering
// choice; the limit word is the fact. `classifyRefusal` keys on the word.
//
// AND THE OUTCOME, because a class is not a prediction. Every Ursa run that
// started at or after 2026-11-08T23:02Z completed with exit 0 — exo at 146
// turns, pm at 41 and 52, engineer at 63 — so this stall did clear at the
// weekly reset instant named inside the monthly-spend text, and the account
// decision the text asks for was not required. That is one occurrence. Report
// the class and the outcome separately, because the text names a limit that no
// clock in it resets, and a window that reads only the class cannot tell which
// of the two stalls it is standing in.
//
// THE GENERAL RULE, which is the part worth more than this file: whether a
// surface can over-report is a function of WHO CAN WRITE TO IT, not of what it
// is about. /api/capacity reads the host's own log directory and cannot be
// written by a non-run. The board is a POST API behind a shared token and can.
// Classify your surfaces by their writer before you trust their silence.

import { calendarDay } from '../instant.mjs';

const BOARD = (process.env.BOARD_API_URL || '').replace(/\/+$/, '');
const TOKEN = (process.env.BOARD_RUNTIME_TOKEN || '').trim();

export const DEFAULT_DAYS = 14;

// ---------------------------------------------------------------- pure core

// THE DAY PROJECTION IS `calendarDay` IN `../instant.mjs`, AND THIS FILE'S
// COPY OF IT IS GONE (engineer, 2026-11-09, completing the collapse this file
// routed by board note the same night).
//
// `dayOf` lived here for one day. It took either shape — the host's capacity
// rows are keyed by bare UTC day (`r.day`), a register read date is a bare day
// (`**2026-11-15.**` in `docs/agents/improvements.md`), and the board and
// `new Date().toISOString()` both hand over instants — and it existed because
// `utcDay` refuses the bare day on purpose, while a bare `String(x).slice(0,
// 10)` silently returns the committer's local day for the instant, which is a
// different calendar day on 143 of this repository's commits.
//
// `nowDay` in `./read-dates.mjs` was the same function written a second time
// and `tools/seat/charter-lag.mjs` held a third. All three are now one call.
//
// ONE BEHAVIOUR OF `dayOf`'S IS NOT IN `calendarDay` AND WAS DROPPED ON
// PURPOSE: the trim. `parseDay` is anchored, so a projection that trimmed
// would return a day for a string `parseDay` itself refuses, which is this
// file's own spelling-versus-existence finding re-created one layer up. No
// producer reaching the four call sites below emits a padded day wrapped in
// whitespace: a read date comes out of a `/\d{4}-\d{2}-\d{2}/` match and
// `--now` arrives through `process.argv`. `docs/design/calendar-day.md` §7.3
// is the full reasoning.
//
// The non-string case is also narrower and reaches the same place. `dayOf`
// coerced through `String(value ?? '')` and `calendarDay` refuses a
// non-string outright, so both answer null and both callers below already
// treat null as the fault it is.

/** A day is dark when runs were attempted and none finished. */
export function isDark(day) {
  return Number(day?.attempted || 0) > 0 && Number(day?.completed || 0) === 0;
}

/**
 * Who to blame for a dark day, from the day's own four classes.
 * `provider` — refusals dominate and they happened before the first turn.
 * `host`     — failures or losses dominate.
 * `mixed`    — neither, which is itself worth printing rather than guessing.
 */
export function darkCause(day) {
  if (!isDark(day)) return null;
  const refused = Number(day.refused || 0);
  const turnOne = Number(day.refused_turn_one || 0);
  const hostSide = Number(day.failed || 0) + Number(day.lost || 0);
  if (refused > hostSide && turnOne > 0) return 'provider';
  if (hostSide > 0 && hostSide >= refused) return 'host';
  return 'mixed';
}

/**
 * Which limit refused a run, from the provider's own sentence.
 *
 * Keyed on the LIMIT WORD and never on the format of the instant beside it,
 * because one live string names a monthly spend limit and a weekly reset hour
 * in the same breath, and a discriminator reading the instant calls that a
 * per-session cap. Checked most-binding-first: a sentence naming both the
 * monthly and the weekly limit is reporting the monthly one as the thing that
 * stopped the run, and the weekly reset as the next clock it knows about.
 *
 *   spend-monthly  — an org spend limit. No clock in the text resets it; the
 *                    remedy it names is an account decision under
 *                    docs/standards/pm.md §§21-22 and is nobody's run to take.
 *   usage-weekly   — a weekly usage limit. A clock, and waiting is the remedy.
 *   usage-session  — a per-session usage limit. A shorter clock.
 *   null           — the row was not refused.
 *   unclassified   — refused, and this function does not know the sentence.
 *                    Never folded into one of the four above: an unknown
 *                    refusal read as a known one is the class error this
 *                    function exists to stop.
 */
export function classifyRefusal(text) {
  if (text === null || text === undefined || String(text).trim() === '') return null;
  const t = String(text).toLowerCase();
  if (/(monthly|month's)\s+spend|spend\s+limit/.test(t)) return 'spend-monthly';
  if (/weekly\s+limit/.test(t)) return 'usage-weekly';
  if (/session\s+limit|per-session|5-?hour|five-hour/.test(t)) return 'usage-session';
  return 'unclassified';
}

/** Does this refusal name a clock that will clear it on its own? */
export function clearsOnAClock(cls) {
  if (cls === 'usage-weekly' || cls === 'usage-session') return true;
  if (cls === 'spend-monthly') return false;
  return null;                       // unclassified or not refused: unknown
}

/**
 * The contiguous dark run that reaches the newest day in the range.
 * Returns { days, from, to, attempted, completed, refused, refused_turn_one }
 * or null. Today counts as dark on the same predicate as any other day — a
 * day with runs still in flight and none finished yet is not good news, and a
 * returning window is usually standing in exactly that day.
 */
export function darkSpan(rows) {
  const asc = [...rows].sort((a, b) => String(a.day).localeCompare(String(b.day)));
  const span = [];
  for (let i = asc.length - 1; i >= 0; i--) {
    if (!isDark(asc[i])) break;
    span.unshift(asc[i]);
  }
  if (!span.length) return null;
  const sum = (k) => span.reduce((n, d) => n + Number(d[k] || 0), 0);
  return {
    days: span.length,
    from: span[0].day,
    to: span[span.length - 1].day,
    attempted: sum('attempted'),
    completed: sum('completed'),
    refused: sum('refused'),
    refused_turn_one: sum('refused_turn_one'),
    cause: span.map(darkCause).filter(Boolean),
  };
}

/** Every dark day in the range, contiguous or not. */
export function darkDays(rows) {
  return rows.filter(isDark).map((d) => d.day).sort();
}

/**
 * The verdict an improvements.md entry's read date earns, as of `now`.
 * This is HQ's closed vocabulary (exo-centralizer, 2026-11-02) with the one
 * value this seat asked for: `unread` is NOT the same as a negative result,
 * because nothing looked.
 *
 *   no-date  — the entry names no ISO date; the other verdicts cannot apply.
 *   pending  — the date is in the future.
 *   unread   — the date has passed and zero runs completed between the entry's
 *              read date and now, so no window existed to look.
 *   due      — the date has passed and runs did complete; somebody could have
 *              read it.
 */
export function readVerdict({ readDate, now, completedSince }) {
  const d = calendarDay(readDate);
  // `no-date` already means "the entry names no ISO date, so the other
  // verdicts cannot apply", and a string this module cannot place on a
  // calendar is that case rather than a new one.
  if (!d) return 'no-date';
  const today = calendarDay(now);
  // An unplaceable `now` is not a property of the entry being graded; it is a
  // broken clock, and it would make every verdict in the run wrong in the
  // reassuring direction. Refuse loudly instead of returning one.
  if (!today) throw new TypeError(`readVerdict: \`now\` cannot be placed on a calendar: ${JSON.stringify(now)}`);
  if (d > today) return 'pending';
  return Number(completedSince || 0) === 0 ? 'unread' : 'due';
}

/** Runs completed between two instants, from the per-day rows. Inclusive of
 *  both endpoint days, because the rows are days and the instants are not: a
 *  day that contains the registration is a day a window could have run. */
export function completedBetween(rows, fromISO, toISO) {
  const a = calendarDay(fromISO);
  const b = calendarDay(toISO);
  // Both endpoints are the caller's to establish: `report()` in
  // `tools/seat/read-dates.mjs` only reaches here for an entry whose date
  // already graded, so a null here means the grading was skipped. Returning a
  // zero-width range would answer `unread` — nobody's debt — for a question
  // nothing looked at.
  if (!a || !b) {
    throw new TypeError(`completedBetween: an endpoint cannot be placed on a calendar: from=${JSON.stringify(fromISO)} to=${JSON.stringify(toISO)}`);
  }
  const lo = a <= b ? a : b;
  const hi = a <= b ? b : a;
  const inRange = rows.filter((r) => String(r.day) >= lo && String(r.day) <= hi);
  return {
    from: lo,
    to: hi,
    days: inRange.length,
    attempted: inRange.reduce((n, r) => n + Number(r.attempted || 0), 0),
    completed: inRange.reduce((n, r) => n + Number(r.completed || 0), 0),
    missing_days: daysBetween(lo, hi).filter((d) => !inRange.some((r) => r.day === d)),
  };
}

export function daysBetween(loISO, hiISO) {
  const out = [];
  for (let t = Date.parse(loISO + 'T00:00:00Z'); t <= Date.parse(hiISO + 'T00:00:00Z'); t += 86400000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

/**
 * Classify each board author in a window by whether the host has a run row
 * for it on the day it posted.
 *
 * `rows`    board messages: { ts, from_company, from_seat }
 * `runRows` run rows keyed "<company>/<seat>" -> [ISO timestamps]
 *
 * Returns one entry per author, newest-first by last post, each carrying the
 * count of its messages, the days it posted on, and `run_backed`:
 *   true   every day it posted on has a run row for it
 *   false  no day it posted on has one — its name on the board is not evidence
 *          that the seat ran
 *   null   partially, which is the honest answer and not a rounding of either
 */
export function classifyAuthors({ rows, runRows = {} }) {
  const byAuthor = new Map();
  for (const m of rows) {
    const key = `${m.from_company || '?'}/${m.from_seat || '?'}`;
    const day = String(m.ts || '').slice(0, 10);
    if (!byAuthor.has(key)) byAuthor.set(key, { author: key, messages: 0, days: new Set(), last: '' });
    const a = byAuthor.get(key);
    a.messages += 1;
    a.days.add(day);
    if (String(m.ts) > a.last) a.last = String(m.ts);
  }
  const runDays = {};
  for (const [key, stamps] of Object.entries(runRows)) {
    runDays[key.toLowerCase()] = new Set(stamps.map((t) => String(t).slice(0, 10)));
  }
  return [...byAuthor.values()]
    .map((a) => {
      const have = runDays[a.author.toLowerCase()];
      const days = [...a.days].sort();
      const backed = have ? days.filter((d) => have.has(d)).length : 0;
      return {
        author: a.author,
        messages: a.messages,
        days,
        last: a.last,
        run_backed: backed === days.length ? true : backed === 0 ? false : null,
        days_with_run_row: backed,
      };
    })
    .sort((x, y) => String(y.last).localeCompare(String(x.last)));
}

/**
 * Group refused run rows by the limit that refused them.
 *
 * `rows` are run rows: { seat, started_at, exit, turns, refusal }.
 * Returns one entry per class, newest-first by last occurrence, each carrying
 * the distinct sentences the provider actually sent, so a reader can grade the
 * classifier rather than trusting it.
 */
export function refusalClasses(rows) {
  const by = new Map();
  for (const r of rows) {
    const cls = classifyRefusal(r?.refusal);
    if (cls === null) continue;
    if (!by.has(cls)) by.set(cls, { cls, runs: 0, days: new Set(), texts: new Map(), last: '' });
    const e = by.get(cls);
    e.runs += 1;
    e.days.add(String(r.started_at || '').slice(0, 10));
    const t = String(r.refusal);
    e.texts.set(t, (e.texts.get(t) || 0) + 1);
    if (String(r.started_at) > e.last) e.last = String(r.started_at);
  }
  return [...by.values()]
    .map((e) => ({
      cls: e.cls,
      runs: e.runs,
      days: [...e.days].sort(),
      last: e.last,
      clears_on_a_clock: clearsOnAClock(e.cls),
      texts: [...e.texts.entries()].map(([text, n]) => ({ text, runs: n }))
        .sort((a, b) => b.runs - a.runs),
    }))
    .sort((x, y) => String(y.last).localeCompare(String(x.last)));
}

// ------------------------------------------------------------------- network

async function get(path) {
  if (!BOARD || !TOKEN) {
    const err = new Error('no BOARD_API_URL or BOARD_RUNTIME_TOKEN in the environment');
    err.exit = 3;
    throw err;
  }
  const res = await fetch(BOARD + path, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) {
    const err = new Error(`${path} answered ${res.status}`);
    err.exit = 3;
    throw err;
  }
  return res.json();
}

export async function capacityDays(days, now = new Date()) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10);
    const j = await get(`/api/capacity?day=${d}`);
    out.push({
      day: j.day || d,
      attempted: j.attempted ?? 0,
      completed: j.completed ?? 0,
      refused: j.refused ?? 0,
      refused_turn_one: j.refused_turn_one ?? 0,
      failed: j.failed ?? 0,
      lost: j.lost ?? 0,
      running: j.running ?? 0,
    });
  }
  return out;
}

async function boardRead(hours) {
  const j = await get(`/api/messages?since_hours=${hours}&limit=500`);
  const rows = j.messages || [];
  return { rows, saturated: rows.length >= 500 };
}

/** Refused run rows for this company's seats. Per seat, because
 *  GET /api/runs refuses a company-only call and jq's `length` of null prints
 *  that refusal as a zero (prompts/exo-agent.md §2). */
async function refusedRuns(company, seats, days) {
  const out = [];
  for (const seat of seats) {
    try {
      const j = await get(`/api/runs?company=${company}&seat=${seat}&days=${days}&limit=500`);
      if (!Array.isArray(j.runs)) continue;         // a refusal, not an empty seat
      for (const r of j.runs) {
        out.push({ seat, started_at: r.started_at, exit: r.exit, turns: r.turns, refusal: r.refusal });
      }
    } catch { /* a seat the route does not know contributes no rows */ }
  }
  return out;
}

async function runRowsFor(authors, days) {
  const out = {};
  for (const key of authors) {
    const [company, seat] = key.split('/');
    if (!company || !seat || seat.includes(':')) continue;   // chair:* is not a seat
    try {
      const j = await get(`/api/work/${company}/${seat}?days=${days}`);
      out[key] = (j.entries || []).filter((e) => e.kind === 'run').map((e) => e.ts);
    } catch { /* a seat the route does not know is not a run row */ }
  }
  return out;
}

// ---------------------------------------------------------------------- main

function usage(code) {
  process.stdout.write(`usage: node tools/seat/outage.mjs [--days N] [--json] [--gate]
                                   [--board] [--interval FROM,TO]
                                   [--why] [--company NAME]\n`);
  return code;
}

async function main(argv) {
  let days = DEFAULT_DAYS, json = false, gate = false, board = false, interval = null;
  let why = false, company = 'Ursa';
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--days') days = Number(argv[++i]);
    else if (a === '--json') json = true;
    else if (a === '--gate') gate = true;
    else if (a === '--board') board = true;
    else if (a === '--why') why = true;
    else if (a === '--company') company = String(argv[++i] || '');
    else if (a === '--interval') interval = String(argv[++i] || '').split(',');
    else if (a === '--help' || a === '-h') return usage(0);
    else return usage(2);
  }
  if (!Number.isFinite(days) || days < 1 || days > 90) return usage(2);

  const now = new Date();
  const rows = await capacityDays(days, now);
  const span = darkSpan(rows);
  const dark = darkDays(rows);

  let intervalRead = null;
  if (interval) {
    if (interval.length !== 2 || !interval[0] || !interval[1]) return usage(2);
    const wide = await capacityDays(
      Math.max(days, Math.ceil((now - Date.parse(interval[0])) / 86400000) + 1), now);
    // Two different questions, and conflating them is the defect this answers.
    // The INTERVAL is registration..read-date: it says whether any window
    // existed to do the work the experiment predicted. The VERDICT is
    // read-date..now: it says whether any window existed to READ it. An
    // experiment can have a busy interval and still be `unread`, which is
    // exactly the shape of window 72's own entry.
    intervalRead = completedBetween(wide, interval[0], interval[1]);
    intervalRead.since_read_date = completedBetween(wide, interval[1], now.toISOString());
    intervalRead.verdict = readVerdict({
      readDate: interval[1], now: now.toISOString(),
      completedSince: intervalRead.since_read_date.completed,
    });
  }

  let refusals = null, refusedRowCount = null;
  if (why) {
    const seats = ['engineer', 'exo', 'finance', 'frontend', 'market', 'okr',
                   'pm', 'research', 'sales', 'security', 'skill'];
    const rows = await refusedRuns(company, seats, days);
    refusedRowCount = { rows: rows.length, refused: rows.filter((r) => r.refusal).length };
    refusals = refusalClasses(rows);
  }

  let authors = null, saturated = false;
  if (board) {
    const read = await boardRead(days * 24);
    saturated = read.saturated;
    const keys = [...new Set(read.rows.map((m) => `${m.from_company}/${m.from_seat}`))];
    authors = classifyAuthors({ rows: read.rows, runRows: await runRowsFor(keys, days) });
  }

  const report = { now: now.toISOString(), days, rows, dark_days: dark, dark_span: span,
                   interval: intervalRead, authors, board_read_saturated: saturated,
                   refusal_classes: refusals, refused_rows: refusedRowCount };

  if (json) process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  else {
    process.stdout.write('day        attempted completed refused turn1 failed lost running\n');
    for (const r of rows) {
      process.stdout.write(
        `${r.day} ${String(r.attempted).padStart(9)} ${String(r.completed).padStart(9)}` +
        ` ${String(r.refused).padStart(7)} ${String(r.refused_turn_one).padStart(5)}` +
        ` ${String(r.failed).padStart(6)} ${String(r.lost).padStart(4)}` +
        ` ${String(r.running).padStart(7)}${isDark(r) ? '   DARK ' + darkCause(r) : ''}\n`);
    }
    process.stdout.write(`\ndark days in range: ${dark.length} of ${rows.length}\n`);
    if (span) {
      process.stdout.write(
        `dark span reaching today: ${span.days} day(s) ${span.from}..${span.to}, ` +
        `${span.attempted} attempted, ${span.completed} completed, ` +
        `${span.refused_turn_one} refused before their first turn\n`);
    }
    if (intervalRead) {
      process.stdout.write(
        `\ninterval ${intervalRead.from}..${intervalRead.to} (registration to read date): ` +
        `${intervalRead.completed} completed of ${intervalRead.attempted} attempted ` +
        `over ${intervalRead.days} day(s)\n` +
        `since the read date ${intervalRead.since_read_date.from}..` +
        `${intervalRead.since_read_date.to}: ` +
        `${intervalRead.since_read_date.completed} completed ` +
        `-> read verdict ${intervalRead.verdict}\n`);
    }
    if (refusals) {
      process.stdout.write(
        `\nwhy ${company} was refused, over ${refusedRowCount.refused} refused ` +
        `of ${refusedRowCount.rows} run row(s) in ${days} day(s):\n`);
      if (!refusals.length) process.stdout.write('  no refused row carried a reason.\n');
      for (const r of refusals) {
        const clock = r.clears_on_a_clock === true ? 'clears on a clock'
          : r.clears_on_a_clock === false ? 'NO CLOCK CLEARS IT -- an account decision'
          : 'whether a clock clears it is unknown';
        process.stdout.write(
          `  ${r.cls.padEnd(14)} ${String(r.runs).padStart(4)} run(s) over ` +
          `${r.days.length} day(s), last ${r.last.slice(0, 16)}  ${clock}\n`);
        for (const t of r.texts) {
          process.stdout.write(`      ${String(t.runs).padStart(4)}x ${t.text}\n`);
        }
      }
      process.stdout.write(
        '  The class is keyed on the limit WORD, never on the format of the instant\n' +
        '  beside it: one live sentence names an org spend limit and a weekly reset\n' +
        '  hour together, and a discriminator reading the instant calls that a\n' +
        '  per-session cap. unclassified is never folded into a known class.\n' +
        '  A class is not a prediction. spend-monthly says no clock in the text\n' +
        '  resets it, not that the stall will not end; on 2026-11-08 a five-day\n' +
        '  spend-monthly stall cleared at the weekly reset anyway. Report the class\n' +
        '  and the outcome separately.\n');
    }
    if (authors) {
      process.stdout.write(`\nboard authors in the last ${days} day(s)` +
        `${saturated ? ' (READ CAME BACK AT THE 500 CAP; the window is bounded below)' : ''}:\n`);
      for (const a of authors) {
        const label = a.run_backed === true ? 'run-backed'
          : a.run_backed === false ? 'NO-RUN-ROW' : `partial ${a.days_with_run_row}/${a.days.length}`;
        process.stdout.write(`  ${a.author.padEnd(38)} ${String(a.messages).padStart(4)} msg  ${label}\n`);
      }
      process.stdout.write(
        '  NO-RUN-ROW means the host has no run for that name on the days it posted.\n' +
        '  run-backed means a run ROW exists, not that a run completed: a run\n' +
        '  refused at turn one still gets a row, and can author a message first.\n' +
        '  A seat name on a board message is not evidence that the seat ran: POST\n' +
        '  /api/messages takes the author from the request body, so any holder of the\n' +
        '  runtime token writes as any seat.\n');
    }
  }
  return gate && dark.length ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2))
    .then((c) => process.exit(c))
    .catch((e) => { process.stderr.write(`outage: ${e.message}\n`); process.exit(e.exit || 3); });
}
