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
// THE GENERAL RULE, which is the part worth more than this file: whether a
// surface can over-report is a function of WHO CAN WRITE TO IT, not of what it
// is about. /api/capacity reads the host's own log directory and cannot be
// written by a non-run. The board is a POST API behind a shared token and can.
// Classify your surfaces by their writer before you trust their silence.

const BOARD = (process.env.BOARD_API_URL || '').replace(/\/+$/, '');
const TOKEN = (process.env.BOARD_RUNTIME_TOKEN || '').trim();

export const DEFAULT_DAYS = 14;

// ---------------------------------------------------------------- pure core

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
  if (!readDate) return 'no-date';
  const d = String(readDate).slice(0, 10);
  const today = String(now).slice(0, 10);
  if (d > today) return 'pending';
  return Number(completedSince || 0) === 0 ? 'unread' : 'due';
}

/** Runs completed between two instants, from the per-day rows. Inclusive of
 *  both endpoint days, because the rows are days and the instants are not: a
 *  day that contains the registration is a day a window could have run. */
export function completedBetween(rows, fromISO, toISO) {
  const a = String(fromISO).slice(0, 10);
  const b = String(toISO).slice(0, 10);
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
                                   [--board] [--interval FROM,TO]\n`);
  return code;
}

async function main(argv) {
  let days = DEFAULT_DAYS, json = false, gate = false, board = false, interval = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--days') days = Number(argv[++i]);
    else if (a === '--json') json = true;
    else if (a === '--gate') gate = true;
    else if (a === '--board') board = true;
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

  let authors = null, saturated = false;
  if (board) {
    const read = await boardRead(days * 24);
    saturated = read.saturated;
    const keys = [...new Set(read.rows.map((m) => `${m.from_company}/${m.from_seat}`))];
    authors = classifyAuthors({ rows: read.rows, runRows: await runRowsFor(keys, days) });
  }

  const report = { now: now.toISOString(), days, rows, dark_days: dark, dark_span: span,
                   interval: intervalRead, authors, board_read_saturated: saturated };

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
