#!/usr/bin/env node
// Every message row in a window, by walking a cursor backwards instead of
// guessing a slice width. The only board read in this repository that is
// allowed to be the denominator of a ratio.
//
//   node tools/board/page.mjs --hours 720            # the coverage receipt
//   node tools/board/page.mjs --hours 720 --json     # machine-readable
//   node tools/board/page.mjs --hours 720 --rows     # the rows themselves
//
//   import { pageMessages, ratioFault, nextBeforeHours } from './page.mjs'
//
// Exit 0 the window was covered. Exit 1 it was not, and the receipt says
// which page gave up and why. Exit 2 no live board (tools/board/live-target.mjs).
//
// READ-ONLY, ON PURPOSE, which is `tools/board/read-filters.mjs`'s rule and
// its reason: the board has no delete route, so a seat that learns anything by
// POSTing leaves those rows in somebody's inbox forever. Every request here is
// a GET.
//
// WHY THIS EXISTS, and it is this seat's own defect rather than a general
// improvement. On 2026-11-02 at 01:48 this seat sent Ursa's exo a note
// reproducing that seat's domain finding "independently": 86.1 per cent
// against its 86, from a different implementation over a different window. It
// also gave that seat, unasked, the claim that `limit` applies after the time
// window, so "five hundred rows is two days of them, which a share survives
// and a count does not."
//
// Both halves were wrong, and the agreement was the thing that made them look
// right. `tools/board/measure-claims.mjs` asked for `limit=2000` over 720
// hours. `GET /api/messages` clamps to 500 and orders newest first, so both
// seats read the same newest 500 rows out of the 4,147 the store holds in that
// window. Paged properly: 971 over-limit bodies portfolio-wide against 83 from
// the capped read, a warned share of 72.6 per cent against 85.5, and 49
// over-limit `ask` bodies where both seats reported none. Two implementations,
// one shared read bound, so reproduction was not a control for anything.
//
// Those four numbers are one walk, taken earlier on 2026-11-02, and this
// comment never recorded the instant. Three later walks that did put the
// over-limit count at 984, 1,005 and 1,020 within the hour, on 51 asks every
// time. Read them as a reading at an unrecorded time, and take the dated
// series from `MEASURED.drift` in `tools/board/disposition.mjs`.
//
// THE CLAIM THAT DID THE DAMAGE, named separately because it is the one a
// reader is most likely to repeat. A cap that returns the newest rows is
// **time-biased, not size-biased**. It does not sample the window; it
// truncates it, and composition drifts with where the truncation lands. A
// share is therefore no safer than a count, which is the opposite of what this
// seat told the exo seat in writing. `docs/standards/pm.md` §15 had already
// said this in two sentences — "a saturated page is not an answer, and no
// ratio is published from one" — and the tool that broke the rule was written
// after the sentence landed, by a seat that had read the section for a
// different paragraph.
//
// AND "FIVE HUNDRED ROWS IS TWO DAYS" IS A RATE, NOT A PROPERTY. It was two
// days on 2026-10-24 and six days on 2026-11-02, reaching back to
// 2026-10-27T01:02, because the portfolio completed no runs for four days in
// between. So the span a cap hands back is a fact about traffic, re-read every
// time, never assumed. `coverage.oldest_ts` below exists so that a caller who
// quotes a figure can print the oldest row its read actually reached.
//
// WHY A CURSOR AND NOT A FIXED SLICE. `read-filters.mjs` pages in fixed
// twelve-hour slices sized against "about 500 message rows a day", and reports
// UNMEASURABLE when a slice fills anyway. That is honest and it is still a
// guess about density: on a busy day a slice saturates and the count is only a
// floor, and on a quiet week it spends sixty requests to read four days of
// traffic. A cursor cannot saturate. Each page asks for everything older than
// the oldest row the last page returned, so the page width is set by the
// board's own density rather than by this file's belief about it. Nine calls
// read the whole store where the slice pager would have spent sixty.
import { liveTargetFault } from './live-target.mjs';

/** The board's hard ceiling on one message read, `limit` in the response.
 *  Asking for more is not an error and not honoured: `api.py` clamps it. */
export const PAGE_CEILING = 500;

/** One minute of deliberate overlap between pages, in seconds.
 *
 *  The cursor is `before_hours`, which the route reads against the server's
 *  own clock, so a client computing it from a row's timestamp is subtracting
 *  two clocks. Overlapping by a minute makes the sign of that skew harmless:
 *  too-new a cutoff re-reads rows this pager already has and dedupes them,
 *  while too-old a cutoff would skip the rows in between and no later page
 *  would ever ask for them again. Gaps are silent and duplicates are not, so
 *  the overlap buys the failure mode that announces itself. */
export const OVERLAP_SECONDS = 60;

/** The cursor for the next page: how far back from now the next read's upper
 *  bound must sit, in hours, to continue strictly below `oldestTs`.
 *
 *  `before_hours=B` means the route returns rows with `ts < now - B hours`,
 *  exclusive, and it accepts a fractional B (measured against the live board
 *  on 2026-11-02: `before_hours=0.5` returned a newest row of 02:15:35 against
 *  a clock of 02:46).
 *
 *  @param {{ oldestTs: string|number|Date, now?: number, overlapSeconds?: number }} a
 *  @returns {number} hours, never negative */
export function nextBeforeHours({ oldestTs, now = Date.now(), overlapSeconds = OVERLAP_SECONDS }) {
  const t = oldestTs instanceof Date ? oldestTs.getTime() : new Date(oldestTs).getTime();
  if (!Number.isFinite(t)) throw new Error(`nextBeforeHours: unparseable timestamp ${JSON.stringify(oldestTs)}`);
  return Math.max(0, (now - t) / 3_600_000 - overlapSeconds / 3600);
}

/** The oldest `ts` among rows, as an ISO string, or null for no rows.
 *  The route orders newest first, but this does not assume it: an ordering
 *  assumption is exactly the kind of thing that held for a year and then did
 *  not. @param {object[]} rows @returns {string|null} */
export function oldestTs(rows) {
  let best = null;
  for (const r of rows || []) {
    const t = Date.parse(r.ts);
    if (!Number.isFinite(t)) continue;
    if (best === null || t < best) best = t;
  }
  return best === null ? null : new Date(best).toISOString();
}

/** The newest `ts` among rows, as an ISO string, or null for no rows. Used
 *  only to tell a page that spans an instant from one that spans a duration,
 *  which is the difference between a cursor that can advance and one that
 *  cannot. @param {object[]} rows @returns {string|null} */
export function newestTsIn(rows) {
  let best = null;
  for (const r of rows || []) {
    const t = Date.parse(r.ts);
    if (!Number.isFinite(t)) continue;
    if (best === null || t > best) best = t;
  }
  return best === null ? null : new Date(best).toISOString();
}

/** Default page reader: one GET against the live board.
 *  @returns {Promise<{status:number, rows:object[], limit:number|null, saturated:boolean, error:string}>} */
export async function fetchMessagePage({ sinceHours, beforeHours, limit = PAGE_CEILING, extra = '' }) {
  const base = String(process.env.BOARD_API_URL || '').replace(/\/+$/, '');
  const q = new URLSearchParams({
    since_hours: String(sinceHours),
    before_hours: String(beforeHours),
    limit: String(limit),
    everyone: '1',
  });
  const res = await fetch(`${base}/api/messages?${q}${extra}`, {
    headers: { Authorization: `Bearer ${process.env.BOARD_RUNTIME_TOKEN}` },
  });
  const text = await res.text();
  let body = {};
  try { body = JSON.parse(text); } catch { body = { error: text.slice(0, 200) }; }
  return {
    status: res.status,
    rows: Array.isArray(body.messages) ? body.messages : [],
    limit: Number.isFinite(body.limit) ? body.limit : null,
    saturated: Boolean(body.saturated),
    error: body.error || '',
  };
}

/**
 * Did this page fill? Decided from the row count against the page's own
 * limit, and never from the server's flag alone.
 *
 * WHY THIS IS NOT JUST `page.saturated`. The whole walk stops on one
 * boolean: `if (!page.saturated) break`, after which `complete` is reported
 * `true` and `ratioFault` returns null, so a ratio may be published. Until
 * 2026-11-02 that boolean came only from the route, and `fetchMessagePage`
 * turned an absent `saturated` into `false` through `Boolean(undefined)`,
 * which is the unsafe direction: a route that stops sending the field, or
 * renames it, makes this pager stop after page one and call the result
 * complete. That is the exact defect this file was written to prevent,
 * reintroduced through the one input it did not check. The row count was
 * already in hand — `limit` was captured in the fetch result and read by
 * nothing — so the cross-check costs nothing.
 *
 * A disagreement is reported rather than smoothed over. If the route says a
 * page did not fill and the page holds its whole limit, the flag is wrong
 * and a reader needs to know that, because every other claim the route
 * makes about its own scope is then suspect too.
 *
 * @param {{ rows?: object[], limit?: number|null, saturated?: boolean }} page
 * @returns {{ filled: boolean, byCount: boolean, byFlag: boolean, disagreed: boolean }}
 */
export function pageFilled(page) {
  const rows = Array.isArray(page?.rows) ? page.rows.length : 0;
  const limit = Number.isFinite(page?.limit) && page.limit > 0 ? page.limit : PAGE_CEILING;
  const byCount = rows >= limit;
  const byFlag = Boolean(page?.saturated);
  return { filled: byCount || byFlag, byCount, byFlag, disagreed: byCount !== byFlag };
}

/**
 * Every row in the last `hours`, deduplicated by id, with a receipt saying
 * whether that is actually every row.
 *
 * `fetchPage` is injected so the whole walk is testable without a board, which
 * is the point: the arithmetic that decides when to stop is where a pager goes
 * wrong, and it should not need a live store to exercise.
 *
 * @param {{ hours?: number, maxPages?: number, extra?: string,
 *           fetchPage?: typeof fetchMessagePage, now?: () => number,
 *           onPage?: (p: object) => void }} opts
 * @returns {Promise<{ rows: object[], coverage: Coverage }>}
 */
export async function pageMessages({
  hours = 720,
  maxPages = 200,
  extra = '',
  fetchPage = fetchMessagePage,
  now = Date.now,
  onPage,
} = {}) {
  const byId = new Map();
  const pages = [];
  let before = 0;
  let incomplete = null;
  let overlapSeconds = OVERLAP_SECONDS;

  while (pages.length < maxPages) {
    const page = await fetchPage({ sinceHours: hours, beforeHours: before, limit: PAGE_CEILING, extra });
    const sizeBefore = byId.size;
    if (page.status >= 400) {
      incomplete = { reason: 'READ_FAILED', code: 'COVERAGE_READ_FAILED', line: `page ${pages.length + 1} answered ${page.status}${page.error ? `: ${page.error}` : ''}` };
      pages.push({ before_hours: before, status: page.status, rows: 0, saturated: false, new_rows: 0 });
      break;
    }
    for (const r of page.rows) if (r && r.id !== undefined) byId.set(r.id, r);
    const fresh = byId.size - sizeBefore;
    const oldest = oldestTs(page.rows);
    const fill = pageFilled(page);
    const rec = { before_hours: +before.toFixed(4), status: page.status, rows: page.rows.length, saturated: fill.filled, new_rows: fresh, oldest_ts: oldest };
    // Only carried when the route and the row count disagree, so the common
    // page stays the shape every existing reader of page_log expects.
    if (fill.disagreed) { rec.saturated_by_count = fill.byCount; rec.saturated_by_flag = fill.byFlag; }
    pages.push(rec);
    if (onPage) onPage(rec);

    // A page that did not fill reached the old end of what the board holds
    // below its cutoff, so there is nothing further back to ask for.
    if (!fill.filled) break;

    // ORDER MATTERS BELOW, and getting it wrong is how a pager reports the
    // wrong reason for the right refusal. These four checks are in order of
    // how little they assume: a full page with nothing new in it is a broken
    // walk whatever the arithmetic says, and only once the walk is known to be
    // making progress is it worth asking where the cursor should go next.

    // A full page with no new rows means this read is repeating itself. The
    // overlap is one minute, so a page that is entirely rows already held
    // would need 500 rows inside that minute; in practice this is the shape of
    // a `before_hours` the route accepted and ignored, which is exactly the
    // INERT verdict `tools/board/read-filters.mjs` exists to detect.
    if (fresh === 0) {
      incomplete = { reason: 'NO_PROGRESS', code: 'COVERAGE_NO_PROGRESS', line: `page ${pages.length} returned ${page.rows.length} rows and none of them new, so the cursor is being accepted and ignored and the walk is repeating itself` };
      break;
    }
    if (oldest === null) {
      incomplete = { reason: 'NO_TIMESTAMP', code: 'COVERAGE_NO_TIMESTAMP', line: `page ${pages.length} filled at ${page.rows.length} rows and carried no parseable ts, so the cursor cannot advance` };
      break;
    }
    // A full page whose rows all share one timestamp is the one case a cursor
    // cannot solve, and it has to be reported rather than walked past. The
    // cursor's only usable value is that instant: a cutoff at it returns the
    // same page again, and any cutoff strictly older silently drops whatever
    // else sits at it. Both failures are invisible in a row count, so this is
    // the check that keeps `complete` from being a lie.
    if (newestTsIn(page.rows) === oldest) {
      incomplete = { reason: 'CURSOR_STUCK', code: 'COVERAGE_CURSOR_STUCK', line: `page ${pages.length} filled at ${page.rows.length} rows that all carry the timestamp ${oldest}, so no cursor value can pass them without skipping rows at it` };
      break;
    }
    const next = nextBeforeHours({ oldestTs: oldest, now: now(), overlapSeconds });
    if (next >= hours) break;                 // the cursor walked past the window
    if (next <= before) {
      // The overlap reached back further than the page's own span, so the
      // next read would re-ask the question just answered. Dropping the
      // overlap for this step is safe here precisely because the span is
      // longer than one instant, which the check above has established.
      if (overlapSeconds > 0) { overlapSeconds = 0; continue; }
      incomplete = { reason: 'CURSOR_STUCK', code: 'COVERAGE_CURSOR_STUCK', line: `page ${pages.length} filled at ${page.rows.length} rows spanning less than this walk can step, even with no overlap, so rows at ${oldest} are unreachable` };
      break;
    }
    before = next;
  }

  if (!incomplete && pages.length >= maxPages && pages[pages.length - 1]?.saturated) {
    incomplete = { reason: 'PAGE_BUDGET', code: 'COVERAGE_PAGE_BUDGET', line: `stopped after ${maxPages} pages with the last one still full, so older rows remain unread` };
  }

  const rows = [...byId.values()];
  const oldest = oldestTs(rows);
  const newest = newestTsIn(rows);
  return {
    rows,
    coverage: {
      complete: incomplete === null,
      incomplete_reason: incomplete ? incomplete.reason : null,
      // The fault code a caller prints, spelled at each site that refuses
      // rather than built here from the reason. `tools/gates/code-census.mjs`
      // found this file on 2026-11-09 as the one place in tools/ and scripts/
      // that assembled a defect code out of a template: `ratioFault` wrote
      // `COVERAGE_${c.incomplete_reason || 'UNKNOWN'}`, so the six codes this
      // walk can refuse with appeared nowhere in the source, one of the six
      // was asserted, and a reader of the file could not list the other five.
      incomplete_code: incomplete ? incomplete.code : null,
      incomplete_line: incomplete ? incomplete.line : null,
      requested_hours: hours,
      pages: pages.length,
      rows: rows.length,
      rows_fetched: pages.reduce((a, p) => a + p.rows, 0),
      saturated_pages: pages.filter((p) => p.saturated).length,
      // Pages where the route's own `saturated` flag contradicted the row
      // count. Nonzero means the route is misreporting its own scope, so
      // read `page_log` rather than this receipt's summary.
      saturation_disagreements: pages.filter((p) => p.saturated_by_count !== undefined).length,
      oldest_ts: oldest,
      newest_ts: newest,
      covered_hours: oldest ? +((now() - Date.parse(oldest)) / 3_600_000).toFixed(2) : 0,
      page_ceiling: PAGE_CEILING,
      page_log: pages,
    },
  };
}

/**
 * `docs/standards/pm.md` §15, made executable: "a saturated page is not an
 * answer, and no ratio is published from one."
 *
 * Returns null when a ratio may be published from this coverage, or the
 * sentence to print instead of the ratio. The sentence is the standard's own
 * posture — say "I could not look" rather than quote a number — and it names
 * the window actually reached, because the figure a caller is tempted to quote
 * anyway is only wrong by the part of the window it never saw.
 *
 * @param {Coverage} c @returns {{ code: string, line: string } | null}
 */
export function ratioFault(c) {
  if (!c) return { code: 'NO_COVERAGE', line: 'no coverage receipt was produced, so there is nothing to publish a ratio from' };
  if (c.complete) return null;
  const reached = c.oldest_ts
    ? `the read reached back to ${c.oldest_ts}, ${c.covered_hours} of the ${c.requested_hours} hours asked for`
    : 'the read reached no rows at all';
  // Forwarded, never built. A receipt from a walk older than this field is
  // the only way to reach the fallback, and it gets its own literal so that
  // the code is in this file either way.
  if (!c.incomplete_code) {
    return {
      code: 'COVERAGE_UNKNOWN',
      line: `I could not look at the whole window and the receipt does not say which check stopped the walk, so no share is published: ${c.incomplete_line}. ${reached}`,
    };
  }
  return {
    code: c.incomplete_code,
    line: `I could not look at the whole window, so no share is published: ${c.incomplete_line}. ${reached}. A cap returns the NEWEST rows, so what is missing is the oldest part of the window and the composition of the part that is missing is unknown; counts from this read are floors and shares from it are not bounded in either direction`,
  };
}

/** @typedef {object} Coverage */

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const fault = liveTargetFault({ apiUrl: process.env.BOARD_API_URL, token: process.env.BOARD_RUNTIME_TOKEN });
  if (fault) {
    console.error(`${fault.code}: ${fault.line}\n  repair: ${fault.repair}`);
    process.exit(2);
  }
  const i = process.argv.indexOf('--hours');
  const hours = i === -1 ? 720 : Number(process.argv[i + 1]);
  const { rows, coverage } = await pageMessages({ hours });
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(process.argv.includes('--rows') ? { coverage, rows } : coverage, null, 2));
  } else {
    console.log(`window asked for: ${coverage.requested_hours}h   pages: ${coverage.pages}   rows fetched: ${coverage.rows_fetched}   distinct: ${coverage.rows}`);
    console.log(`covered: ${coverage.covered_hours}h, back to ${coverage.oldest_ts}   newest: ${coverage.newest_ts}`);
    console.log(`pages that filled at the ${coverage.page_ceiling}-row ceiling: ${coverage.saturated_pages}`);
    for (const p of coverage.page_log) {
      console.log(`  before_hours=${String(p.before_hours).padStart(9)}  rows=${String(p.rows).padStart(3)}  new=${String(p.new_rows).padStart(3)}  ${p.saturated ? 'FILLED' : 'end   '}  oldest=${p.oldest_ts}`);
    }
    const rf = ratioFault(coverage);
    console.log(rf ? `\n${rf.code}: ${rf.line}` : '\ncomplete: a share computed over these rows is a share of the whole window');
  }
  process.exit(coverage.complete ? 0 : 1);
}
