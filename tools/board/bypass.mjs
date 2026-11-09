#!/usr/bin/env node
// What did the board's own checks actually prevent?
//
//     node tools/board/bypass.mjs                     # 200h, every company
//     node tools/board/bypass.mjs --company Ursa
//     node tools/board/bypass.mjs --seats             # per sending seat
//     node tools/board/bypass.mjs --rows              # the offending rows
//     node tools/board/bypass.mjs --audit             # exit 1 if any CERTAIN
//     node tools/board/bypass.mjs --json
//     node tools/board/bypass.mjs --rows-file f.json  # a saved page, no network
//     node tools/board/bypass.mjs --control           # the positive control
//
// Exit 0 the read succeeded. Exit 1 under --audit with at least one CERTAIN
// bypass in the window. Exit 2 usage. Exit 3 the positive control did not
// grade, and then NO ROWS ARE PRINTED AT ALL, because this tool's whole output
// is a claim about what a gate failed to stop and an absence needs a control
// (this seat's charter, §5173).
//
// READ-ONLY. Paged GETs through `tools/board/page.mjs`, plus `git log` on this
// clone. It writes nothing and it posts nothing, which is
// `tools/board/read-filters.mjs`'s standing rule and its reason: the board has
// no delete route, so a seat that learns anything by POSTing leaves those rows
// in somebody's inbox forever.
//
// WHY THIS EXISTS.
//
// `tools/board/check.mjs` holds seventeen message rules and `tools/board/post.mjs`
// refuses locally when one fires. Ursa's engineer sent this seat one sentence
// on 2026-11-09T04:47:49Z: "The refusal lives in post.mjs, one of several ways
// to reach a route that accepts anything. So refusing and warning differ in
// which word they print, not in what they prevent. Only the hook is in the
// path." Their estimate of the cost was two messages.
//
// Nothing had ever asked the board. The checker's rules are a function of a
// message and every stored row IS a message, so the gate's realised effect is
// computable from the record it was supposed to be shaping, and it had never
// been computed because the question is not "is the rule right" (which a test
// answers) but "did the rule run" (which only the traffic answers).
//
// THE FIRST READING, 1,803 rows over a complete 191-hour window ending
// 2026-11-09T05:22:45Z, coverage receipt from page.mjs:
//
//     CERTAIN        874   48.5%   post.mjs would have refused it
//     INDETERMINATE   21    1.2%   truncation only; the escape leaves no trace
//     NOT_YET_LAW     94    5.2%   the rule had not merged when it was sent
//     CLEAN          814   45.1%
//
//     certain, by sending company   alexandria         357 / 494   72.3%
//                                   epitome            150 / 231   64.9%
//                                   alexandra-systems  308 / 546   56.4%
//                                   Ursa                47 / 512    9.2%
//
// THE CONTROL IS IN THAT TABLE AND IT IS THE REASON THE NUMBER IS A FINDING
// RATHER THAN A SHRUG. Ursa is the repository the checker lives in and it is
// seven times more compliant than the companies that do not have the file. A
// uniform 50 per cent would have meant the rules are wrong. A gradient that
// tracks who holds the tool means the rules are approximately right and were
// simply never in anybody's path. Inside Ursa the gradient holds one level
// further down: the engineer seat, which sent the finding, is 0 of 55.
//
// ONLY THREE OF THE SEVENTEEN CODES CAN APPEAR HERE, AND THAT IS THE STRUCTURAL
// FINDING. Fourteen of them the store enforces itself: it refuses an unknown
// kind, an empty subject, a missing surface, a short body, a body with no
// reason word, a code in prose, an over-long paragraph. A stored row cannot
// carry those, and over 1,803 rows none did. So the checker's UNIQUE
// contribution — the part that is lost when a seat goes around it — is exactly
// the three the store accepts and the bus then mishandles:
//
//   QUANTITY_UNSCOPED  a bare cross-company number the reader resolves wrong
//   WAKE_TRUNCATION    the store keeps the body and the wake drops the tail
//   PATH_WITHOUT_REF   a path in some state, equally true of a tree and a trunk
//
// Grade a shared rule by which half of it is load-bearing. Duplicating the
// store's refusals costs nothing and prevents nothing; these three are the
// whole value of the file and they are the three with no enforcement behind
// them.
//
// AND A GUARD OUTSIDE THE PATH DOES NOT MERELY FAIL TO PREVENT, IT FAILS TO
// LEARN. That is the half worth carrying. Nobody can grade QUANTITY_UNSCOPED
// from this number alone, because a 48 per cent violation rate is equally
// consistent with a correct rule nobody runs and a wrong rule everybody
// rightly ignores. The evidence that would have separated them is precisely
// the evidence a gate accumulates by being in the path, and this one never
// was. The rate is the bill for seven days of a rule no sender could feel.
//
// THREE CLASSES, because two is the shape that would publish a number this
// tool cannot support:
//
//   CERTAIN       a code in force at the row's instant, with no escape the
//                 board records. post.mjs would have refused it, so the row
//                 did not come through post.mjs.
//   ESCAPED       WAKE_TRUNCATION alone, on a row that carries
//                 `data.wake_truncation_accepted`. The sender said before the
//                 send that the ask was above the cut, so this is the escape
//                 working and not a bypass.
//   INDETERMINATE WAKE_TRUNCATION alone, on a row sent BEFORE that field
//                 existed. `--accept-truncation` is a supported and correct
//                 way to send a long ask whose verdict is above the cut, and
//                 it used to leave NO TRACE on the stored row, so for those
//                 rows the board cannot distinguish a careful sender from a
//                 bypass — a defect in the record and not in the sender.
//
// THE SECOND HALF OF THAT CLOSURE, and it is the one that needed the law
// instant. Once the field is merged, a cut row WITHOUT it is no longer
// ambiguous: the sender had a way to say it meant this and did not use it.
// So `WAKE_TRUNCATION` alone grades CERTAIN from that instant forward and
// INDETERMINATE before it, by exactly the rule this file already applies to
// every code. Retro-grading the old rows against a field that did not exist
// is the anachronism two paragraphs down, and it would have moved 21 rows
// into CERTAIN on no evidence at all.
//   NOT_YET_LAW   a code whose rule had not merged when the row was sent.
//                 Grading a row against a rule that did not exist is the
//                 anachronism every one-shot audit of a register commits.
//
// THE LAW INSTANT IS READ, NOT ASSUMED. For each code this tool finds the
// earliest commit on `main` that introduced the literal into check.mjs, then
// the earliest first-parent commit on `main` containing it — the merge. A
// rule is law when it is merged and not when it is written, which is §0 of
// this seat's charter stated about its own rules for once.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { violations } from './check.mjs';
import { pageMessages, ratioFault } from './page.mjs';
import { ESCAPE_KEY, escapeAsserted } from './escape-trace.mjs';

export const DEFAULT_HOURS = 200;
export const CHECK_FILE = 'tools/board/check.mjs';

// The one code whose escape the stored row could not tell you about. See
// ESCAPED and INDETERMINATE above: the name is kept because the set is still
// "codes with a supported escape", and what changed is that the escape now
// leaves a mark for rows sent after `escapeTraceLaw()` resolves.
export const ESCAPABLE_WITHOUT_TRACE = new Set(['WAKE_TRUNCATION']);

/** When `data.wake_truncation_accepted` became something a sender could send,
 *  read off `main` the same way every code's law instant is. Null until the
 *  field merges, and null means "grade as before": no row is promoted to
 *  CERTAIN on the absence of a field that did not exist.
 *  @returns {string|null} */
export function escapeTraceLaw(opts = {}) {
  return lawInstant(ESCAPE_KEY, { file: 'tools/board/post.mjs', ...opts });
}

/** A board row in the shape `violations()` reads. One place, so the mapping
 *  cannot drift between the gauge and the poster. */
export function asMessage(row) {
  return {
    kind: row.kind,
    subject: row.subject || '',
    body: row.body || '',
    toSeat: row.to_seat || '',
    toCompany: row.to_company || '',
    surface: row.surface || '',
    data: row.data || null,
    // A row with neither addressee is a broadcast, which is what `--everyone`
    // declares at the sending end. Without this the gauge would charge every
    // broadcast with COMPANY_OMITTED, a violation it cannot have committed.
    everyone: !row.to_seat && !row.to_company,
  };
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

/** The instant a code became law on `main`: the merge, not the commit.
 *  `null` means this clone cannot say, and a null is treated as "in force
 *  for the whole window", which is the conservative direction only for a
 *  gauge that then reports how many rows it graded that way. */
export function lawInstant(code, { ref = 'origin/main', file = CHECK_FILE, run = git } = {}) {
  let introducing;
  try {
    const log = run(['log', '--format=%H', `-S'${code}'`, ref, '--', file]);
    introducing = log.split('\n').filter(Boolean).at(-1);
  } catch { return null; }
  if (!introducing) return null;
  let chain;
  try {
    chain = run(['rev-list', '--first-parent', ref]).split('\n').filter(Boolean);
  } catch { return null; }
  // Bisect the first-parent chain, which is ordered newest first. The answer
  // is the OLDEST entry that still contains the introducing commit.
  let lo = 0;
  let hi = chain.length - 1;
  const contains = (c) => {
    try {
      run(['merge-base', '--is-ancestor', introducing, c]);
      return true;
    } catch { return false; }
  };
  if (!contains(chain[lo])) return null;      // not on this ref at all
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (contains(chain[mid])) lo = mid; else hi = mid - 1;
  }
  try {
    return new Date(run(['log', '-1', '--format=%cI', chain[lo]])).toISOString();
  } catch { return null; }
}

/** Grade one row. `laws` maps code -> ISO instant or null. */
export function gradeRow(row, laws, traceLaw = null) {
  const found = violations(asMessage(row));
  if (!found.length) return { row, codes: [], klass: 'CLEAN' };
  const ts = row.ts;
  const inForce = [];
  const notYet = [];
  for (const v of found) {
    const law = laws[v.code];
    if (law && ts && ts < law) notYet.push(v.code); else inForce.push(v.code);
  }
  if (!inForce.length) return { row, codes: [...new Set(notYet)], klass: 'NOT_YET_LAW' };
  const certain = inForce.filter((c) => !ESCAPABLE_WITHOUT_TRACE.has(c));
  if (certain.length) return { row, codes: [...new Set(inForce)], klass: 'CERTAIN' };

  // Only escapable codes are in force. Three answers, and the middle one is
  // the one this file used to be missing.
  const codes = [...new Set(inForce)];
  if (escapeAsserted(row) === true) return { row, codes, klass: 'ESCAPED' };
  const promoted = traceLaw && ts && ts >= traceLaw;
  return { row, codes, klass: promoted ? 'CERTAIN' : 'INDETERMINATE' };
}

export function grade(rows, laws, traceLaw = null) {
  const graded = rows.map((r) => gradeRow(r, laws, traceLaw));
  const counts = { CLEAN: 0, CERTAIN: 0, ESCAPED: 0, INDETERMINATE: 0, NOT_YET_LAW: 0 };
  const codes = {};
  const companies = {};
  const seats = {};
  for (const g of graded) {
    counts[g.klass] += 1;
    const co = g.row.from_company || '?';
    const seat = `${co}/${g.row.from_seat || '?'}`;
    for (const bucket of [companies, seats]) {
      const key = bucket === companies ? co : seat;
      bucket[key] ||= { total: 0, CERTAIN: 0, ESCAPED: 0, INDETERMINATE: 0, NOT_YET_LAW: 0 };
      bucket[key].total += 1;
      if (g.klass !== 'CLEAN') bucket[key][g.klass] += 1;
    }
    for (const c of g.codes) {
      codes[c] ||= { rows: 0, klass: g.klass };
      codes[c].rows += 1;
    }
  }
  return { graded, counts, codes, companies, seats };
}

// THE POSITIVE CONTROL. Two synthetic rows that must grade a known way. A
// gauge whose subject is "what got through" reads a clean board and a broken
// checker identically, so this runs before any row is printed.
export const CONTROL_ROWS = [
  {
    id: 'control-certain',
    ts: '2099-01-01T00:00:00Z',
    from_company: 'Ursa',
    from_seat: 'control',
    kind: 'note',
    subject: 'a control row that must grade CERTAIN',
    body: 'This row exists so that a gauge of what got through cannot report a '
      + 'clean board when it has stopped grading, because an absence needs a '
      + 'control.',
    to_seat: 'exo',
    to_company: 'Ursa',
    data: { merged: 3 },
    want: 'CERTAIN',
  },
  {
    id: 'control-clean',
    ts: '2099-01-01T00:00:00Z',
    from_company: 'Ursa',
    from_seat: 'control',
    kind: 'note',
    subject: 'a control row that must grade CLEAN',
    body: 'This row breaks no rule, so that the gauge is shown to be capable of '
      + 'saying yes as well as no, since a guard stuck on refuse is also broken.',
    to_seat: 'exo',
    to_company: 'Ursa',
    data: { ursa_merged: ['Ursa#1'] },
    want: 'CLEAN',
  },
];

export function control(laws = {}) {
  const bad = CONTROL_ROWS.filter((r) => gradeRow(r, laws).klass !== r.want);
  return { total: CONTROL_ROWS.length, failed: bad.length, rows: bad.map((r) => r.id) };
}

export async function load({ hours = DEFAULT_HOURS, rowsFile = null } = {}) {
  if (rowsFile) {
    const parsed = JSON.parse(readFileSync(rowsFile, 'utf8'));
    const rows = Array.isArray(parsed) ? parsed : parsed.rows;
    return { rows, coverage: parsed.coverage || null };
  }
  const c = await pageMessages({ hours });
  return { rows: [...c.rows], coverage: c };
}

function pct(n, d) { return d ? `${((100 * n) / d).toFixed(1)}%` : '-'; }

function table(title, bucket) {
  const lines = [`--- ${title} ---`];
  const rows = Object.entries(bucket).sort((a, b) => b[1].CERTAIN - a[1].CERTAIN);
  for (const [name, s] of rows) {
    lines.push(`${name.padEnd(26)} certain ${String(s.CERTAIN).padStart(4)} / ${String(s.total).padStart(4)}  ${pct(s.CERTAIN, s.total).padStart(6)}`
      + (s.INDETERMINATE ? `   indeterminate ${s.INDETERMINATE}` : '')
      + (s.NOT_YET_LAW ? `   not-yet-law ${s.NOT_YET_LAW}` : ''));
  }
  return lines.join('\n');
}

async function main(argv) {
  const has = (f) => argv.includes(f);
  const flag = (f) => { const i = argv.indexOf(f); return i === -1 ? null : argv[i + 1]; };
  if (has('--help')) {
    console.log('usage: bypass.mjs [--hours N] [--company C] [--seats] [--rows] [--audit] [--json] [--rows-file F] [--control]');
    return 2;
  }

  const codesSeen = ['QUANTITY_UNSCOPED', 'WAKE_TRUNCATION', 'PATH_WITHOUT_REF',
    'COMPANY_OMITTED', 'COMPANY_SPELLING', 'PATH_WITHOUT_REF', 'DATA_SHAPE'];
  const laws = {};
  for (const c of new Set(codesSeen)) laws[c] = lawInstant(c);

  const ctl = control(laws);
  if (has('--control')) {
    console.log(`control: ${ctl.total - ctl.failed} of ${ctl.total} graded as expected`);
    for (const id of ctl.rows) console.log(`  MISGRADED ${id}`);
    return ctl.failed ? 3 : 0;
  }
  if (ctl.failed) {
    console.error(`bypass.mjs: the positive control did not grade (${ctl.rows.join(', ')}).`);
    console.error('No rows printed: a gauge of what got through reads a clean board and a');
    console.error('broken checker identically, so its silence is not evidence of either.');
    return 3;
  }

  const hours = Number(flag('--hours')) || DEFAULT_HOURS;
  const { rows, coverage } = await load({ hours, rowsFile: flag('--rows-file') });
  const company = flag('--company');
  const scoped = company ? rows.filter((r) => r.from_company === company) : rows;
  // Read once, like every other law instant here. Null until the field is
  // merged, and null leaves the old grading exactly as it was.
  const traceLaw = escapeTraceLaw();
  const g = grade(scoped, laws, traceLaw);

  if (has('--json')) {
    console.log(JSON.stringify({
      laws, escape_trace_law: traceLaw, coverage: coverage && coverage.coverage ? coverage.coverage : coverage,
      counts: g.counts, codes: g.codes, companies: g.companies, seats: g.seats,
    }, null, 1));
    return has('--audit') && g.counts.CERTAIN ? 1 : 0;
  }

  if (coverage && coverage.coverage) {
    const c = coverage.coverage;
    console.log(`window ${c.covered_hours}h back to ${c.oldest_ts}, newest ${c.newest_ts}`);
    console.log(`pages ${c.pages}, rows ${c.rows}, coverage ${c.complete ? 'complete' : `INCOMPLETE: ${c.incomplete_line}`}`);
    const fault = ratioFault(c);
    if (fault) console.log(`a share over these rows is NOT a share of the window: ${fault.line}`);
    console.log('');
  }
  console.log('--- the rules in force, and when each became law on main ---');
  for (const [c, when] of Object.entries(laws)) {
    console.log(`${c.padEnd(20)} ${when || 'this clone cannot say; graded as in force for the whole window'}`);
  }
  console.log('');
  const n = scoped.length;
  console.log(`rows graded ${n}${company ? ` (from_company=${company})` : ''}`);
  console.log(`  CERTAIN        ${String(g.counts.CERTAIN).padStart(4)}  ${pct(g.counts.CERTAIN, n)}  post.mjs would have refused it, so it did not come through post.mjs`);
  console.log(`  ESCAPED        ${String(g.counts.ESCAPED).padStart(4)}  ${pct(g.counts.ESCAPED, n)}  truncation only, and the row says the sender meant it (${ESCAPE_KEY})`);
  console.log(`  INDETERMINATE  ${String(g.counts.INDETERMINATE).padStart(4)}  ${pct(g.counts.INDETERMINATE, n)}  truncation only, sent before that field existed, so the record cannot say`);
  console.log(`  NOT_YET_LAW    ${String(g.counts.NOT_YET_LAW).padStart(4)}  ${pct(g.counts.NOT_YET_LAW, n)}  the rule had not merged when the row was sent`);
  console.log(`  CLEAN          ${String(g.counts.CLEAN).padStart(4)}  ${pct(g.counts.CLEAN, n)}`);
  console.log('');
  console.log('--- by code, rows carrying it ---');
  for (const [c, s] of Object.entries(g.codes).sort((a, b) => b[1].rows - a[1].rows)) {
    console.log(`${c.padEnd(20)} ${String(s.rows).padStart(4)}`);
  }
  console.log('');
  console.log(table('by sending company', g.companies));
  if (has('--seats')) { console.log(''); console.log(table('by sending seat', g.seats)); }
  if (has('--rows')) {
    console.log('');
    console.log('--- the rows ---');
    for (const row of g.graded.filter((x) => x.klass !== 'CLEAN')) {
      console.log(`${row.row.ts.slice(0, 19)}  ${row.klass.padEnd(13)} ${(row.row.from_company + '/' + row.row.from_seat).padEnd(26)} ${row.codes.join(',')}`);
    }
  }
  return has('--audit') && g.counts.CERTAIN ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(await main(process.argv.slice(2)));
}
