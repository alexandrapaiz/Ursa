// node --test tools/board/page.test.mjs
//
// The walk is tested with an injected `fetchPage` and a frozen clock, which is
// the whole reason `pageMessages` takes both. The defect this file exists for
// was not in any arithmetic a live read would have exposed: it was a tool that
// asked for 2000 rows, was handed 500, and never looked at the `saturated`
// flag sitting in the same response. So the cases that matter are the ones a
// board in a good mood will never produce — a page that fills, a cursor that
// cannot advance, a walk that repeats itself — and none of them can be
// provoked on demand against a live store.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pageMessages, pageFilled, nextBeforeHours, oldestTs, ratioFault, PAGE_CEILING, OVERLAP_SECONDS } from './page.mjs';

const NOW = Date.parse('2026-11-02T03:00:00.000Z');
const clock = () => NOW;
const at = (msAgo) => new Date(NOW - msAgo).toISOString();

/** A store of rows, served the way the board serves them: newest first,
 *  clamped to `PAGE_CEILING`, `saturated` true when the page filled, and
 *  `before_hours` an exclusive upper bound on `ts`. */
function storeServer(rows, { ceiling = PAGE_CEILING } = {}) {
  const calls = [];
  const sorted = [...rows].sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts));
  return {
    calls,
    async fetchPage({ sinceHours, beforeHours }) {
      calls.push({ sinceHours, beforeHours });
      const upper = NOW - beforeHours * 3_600_000;
      const lower = NOW - sinceHours * 3_600_000;
      const inWindow = sorted.filter((r) => Date.parse(r.ts) < upper && Date.parse(r.ts) >= lower);
      const page = inWindow.slice(0, ceiling);
      return { status: 200, rows: page, limit: ceiling, saturated: page.length >= ceiling, error: '' };
    },
  };
}

const spread = (n, startMsAgo, stepMs) =>
  Array.from({ length: n }, (_, i) => ({ id: `m${i}`, ts: at(startMsAgo + i * stepMs), body: 'x', kind: 'note' }));

test('a window smaller than one page is one call and complete', async () => {
  const s = storeServer(spread(12, 1000, 60_000));
  const { rows, coverage } = await pageMessages({ hours: 720, fetchPage: s.fetchPage, now: clock });
  assert.equal(rows.length, 12);
  assert.equal(coverage.pages, 1);
  assert.equal(coverage.complete, true);
  assert.equal(coverage.saturated_pages, 0);
  assert.equal(ratioFault(coverage), null);
});

test('a store larger than the ceiling is walked to the end and every row is reached exactly once', async () => {
  // 1,700 rows one minute apart is 28 hours of traffic and four pages.
  const all = spread(1700, 1000, 60_000);
  const s = storeServer(all);
  const { rows, coverage } = await pageMessages({ hours: 720, fetchPage: s.fetchPage, now: clock });
  assert.equal(coverage.complete, true);
  assert.equal(rows.length, 1700, 'every row reached');
  assert.equal(new Set(rows.map((r) => r.id)).size, 1700, 'and none of them twice in the result');
  assert.equal(coverage.pages, 4);
  assert.equal(coverage.saturated_pages, 3);
  // The receipt must say the walk covered the traffic and not the 720 hours
  // asked for, because the span a cap hands back is a fact about traffic.
  assert.ok(coverage.covered_hours > 28 && coverage.covered_hours < 29, `covered ${coverage.covered_hours}h`);
});

test('the deliberate overlap re-reads rows rather than skipping them', async () => {
  const s = storeServer(spread(1100, 1000, 60_000));
  const { coverage } = await pageMessages({ hours: 720, fetchPage: s.fetchPage, now: clock });
  assert.equal(coverage.rows, 1100);
  assert.ok(coverage.rows_fetched > coverage.rows, 'fetched more than it kept, which is the overlap');
  assert.ok(coverage.rows_fetched - coverage.rows <= coverage.pages * 2, 'and the overlap is a minute, not a page');
});

test('the single capped read this seat actually published from is reported as incomplete, not as an answer', async () => {
  // One call only, which is what `measure-claims.mjs` did: ask for everything,
  // take the first response, publish a share of it.
  const all = spread(4000, 1000, 60_000);
  const s = storeServer(all);
  const { coverage } = await pageMessages({ hours: 720, maxPages: 1, fetchPage: s.fetchPage, now: clock });
  assert.equal(coverage.complete, false);
  assert.equal(coverage.incomplete_reason, 'PAGE_BUDGET');
  const fault = ratioFault(coverage);
  assert.match(fault.code, /^COVERAGE_PAGE_BUDGET$/);
  assert.match(fault.line, /no share is published/);
  assert.match(fault.line, /NEWEST rows/);
});

test('more rows than a page inside one instant is reported as unreachable rather than counted as a floor', async () => {
  // Every row shares a timestamp, so no cursor value can get past them. This
  // is the one case the cursor cannot solve, and the contract is that it says
  // so instead of returning a number that looks like an answer.
  const same = Array.from({ length: 900 }, (_, i) => ({ id: `s${i}`, ts: at(5000), body: 'x', kind: 'note' }));
  const s = storeServer(same);
  const { coverage } = await pageMessages({ hours: 720, fetchPage: s.fetchPage, now: clock });
  assert.equal(coverage.complete, false);
  assert.equal(coverage.incomplete_reason, 'CURSOR_STUCK');
  assert.equal(coverage.incomplete_code, 'COVERAGE_CURSOR_STUCK');
  assert.equal(ratioFault(coverage).code, 'COVERAGE_CURSOR_STUCK');
  assert.ok(ratioFault(coverage).line.includes('counts from this read are floors'));
});

test('a page that errors stops the walk and names the page', async () => {
  const s = {
    async fetchPage() { return { status: 500, rows: [], limit: null, saturated: false, error: "AttributeError: 'Handler' object has no attribute" }; },
  };
  const { coverage } = await pageMessages({ hours: 720, fetchPage: s.fetchPage, now: clock });
  assert.equal(coverage.complete, false);
  assert.equal(coverage.incomplete_reason, 'READ_FAILED');
  assert.equal(ratioFault(coverage).code, 'COVERAGE_READ_FAILED');
  assert.match(coverage.incomplete_line, /page 1 answered 500/);
  assert.match(ratioFault(coverage).line, /reached no rows at all/);
});

test('the walk stops at the window it was asked for and does not page past it', async () => {
  // 1,200 rows one minute apart is 20 hours; the window is 6.
  const s = storeServer(spread(1200, 1000, 60_000));
  const { rows, coverage } = await pageMessages({ hours: 6, fetchPage: s.fetchPage, now: clock });
  assert.equal(coverage.complete, true);
  assert.ok(rows.every((r) => Date.parse(r.ts) >= NOW - 6 * 3_600_000), 'nothing older than the window');
  assert.ok(coverage.covered_hours <= 6.01, `covered ${coverage.covered_hours}h`);
});

test('a walk that repeats itself is NO_PROGRESS and not an infinite loop', async () => {
  // A server that ignores `before_hours` entirely, which is what an INERT
  // filter looks like from the caller's side.
  const page = spread(PAGE_CEILING, 1000, 60_000);
  let calls = 0;
  const fetchPage = async () => { calls += 1; return { status: 200, rows: page, limit: PAGE_CEILING, saturated: true, error: '' }; };
  const { coverage } = await pageMessages({ hours: 720, fetchPage, now: clock });
  assert.equal(coverage.incomplete_reason, 'NO_PROGRESS');
  assert.equal(ratioFault(coverage).code, 'COVERAGE_NO_PROGRESS');
  assert.equal(calls, 2, 'one page, one confirmation, then stop');
});

test('a full page carrying no parseable timestamp is NO_TIMESTAMP, which no test named before today', async () => {
  // The fifth of the six refusals this walk can make, and until 2026-11-09
  // the only evidence it existed was one `reason:` literal: `ratioFault` built
  // its code out of a template, so `COVERAGE_NO_TIMESTAMP` was a string no
  // file in the repository contained. `tools/gates/code-census.mjs` is what
  // made the gap countable.
  const undated = Array.from({ length: PAGE_CEILING }, (_, i) => ({ id: `u${i}`, ts: 'not a timestamp', body: 'x', kind: 'note' }));
  const fetchPage = async () => ({ status: 200, rows: undated, limit: PAGE_CEILING, saturated: true, error: '' });
  const { coverage } = await pageMessages({ hours: 720, fetchPage, now: clock });
  assert.equal(coverage.complete, false);
  assert.equal(coverage.incomplete_reason, 'NO_TIMESTAMP');
  assert.equal(coverage.incomplete_code, 'COVERAGE_NO_TIMESTAMP');
  assert.equal(ratioFault(coverage).code, 'COVERAGE_NO_TIMESTAMP');
  assert.match(coverage.incomplete_line, /carried no parseable ts/);
});

test('nextBeforeHours walks strictly below the oldest row, by the overlap', () => {
  const h = nextBeforeHours({ oldestTs: at(10 * 3_600_000), now: NOW });
  assert.ok(Math.abs(h - (10 - OVERLAP_SECONDS / 3600)) < 1e-9, `got ${h}`);
});

test('nextBeforeHours never returns a negative cursor for a row in the future', () => {
  assert.equal(nextBeforeHours({ oldestTs: at(-60_000), now: NOW }), 0);
});

test('nextBeforeHours refuses an unparseable timestamp instead of returning NaN', () => {
  assert.throws(() => nextBeforeHours({ oldestTs: 'whenever', now: NOW }), /unparseable timestamp/);
});

test('oldestTs does not assume the route returned rows newest first', () => {
  const rows = [{ ts: at(1000) }, { ts: at(9_000_000) }, { ts: at(500) }];
  assert.equal(oldestTs(rows), at(9_000_000));
  assert.equal(oldestTs([]), null);
  assert.equal(oldestTs([{ ts: 'nope' }]), null);
});

test('ratioFault with no coverage at all refuses rather than passing null through', () => {
  assert.equal(ratioFault(undefined).code, 'NO_COVERAGE');
});

// ---------------------------------------------------------------------------
// The route's own scope flag, which until 2026-11-02 was the only thing that
// stopped this walk. Every fake above computes `saturated` honestly from
// `page.length >= ceiling`, so the case where the route is wrong about its
// own page was covered by no test and no line of code: `limit` was captured
// in the fetch result and read by nothing. These are that case.

test('a full page whose saturated flag is false is still treated as full', async () => {
  // The route's flag says the walk is over; the row count says the page held
  // its entire limit. Trusting the flag would stop after one page and report
  // `complete`, which is a published ratio over a truncated read.
  const store = spread(900, 1000, 60_000);
  const sorted = [...store].sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts));
  const fetchPage = async ({ sinceHours, beforeHours }) => {
    const upper = NOW - beforeHours * 3_600_000;
    const lower = NOW - sinceHours * 3_600_000;
    const page = sorted.filter((r) => Date.parse(r.ts) < upper && Date.parse(r.ts) >= lower).slice(0, PAGE_CEILING);
    return { status: 200, rows: page, limit: PAGE_CEILING, saturated: false, error: '' };
  };
  const { rows, coverage } = await pageMessages({ hours: 720, fetchPage, now: clock });
  assert.equal(rows.length, 900, 'every row is read despite the flag saying page one was the end');
  assert.equal(coverage.complete, true);
  // Page one fills at 500 and contradicts the flag; page two holds the
  // remaining 400 and honestly does not fill, so there is one disagreement.
  assert.equal(coverage.saturation_disagreements, 1, 'the full page contradicted the flag');
  assert.equal(coverage.page_log[0].saturated_by_count, true);
  assert.equal(coverage.page_log[0].saturated_by_flag, false);
});

test('a page with no saturated field at all is read from its row count', async () => {
  // `fetchMessagePage` used `Boolean(body.saturated)`, so a route that drops
  // the field degrades to `false`: the unsafe direction. The derivation has
  // to survive the field being absent rather than merely wrong.
  let calls = 0;
  const fetchPage = async () => {
    calls += 1;
    if (calls === 1) return { status: 200, rows: spread(PAGE_CEILING, 1000, 60_000), limit: PAGE_CEILING };
    return { status: 200, rows: [], limit: PAGE_CEILING };
  };
  const { coverage } = await pageMessages({ hours: 720, fetchPage, now: clock });
  assert.equal(calls, 2, 'the walk continued past a page that named no flag');
  assert.equal(coverage.saturated_pages, 1);
});

test('an honest route produces no disagreement and the same receipt as before', async () => {
  const s = storeServer(spread(900, 1000, 60_000));
  const { coverage } = await pageMessages({ hours: 720, fetchPage: s.fetchPage, now: clock });
  assert.equal(coverage.saturation_disagreements, 0);
  assert.equal(coverage.page_log[0].saturated_by_count, undefined, 'no extra keys on the common page');
  assert.equal(coverage.complete, true);
});

test('pageFilled: the four combinations, and which of them is a disagreement', () => {
  const full = { rows: new Array(PAGE_CEILING).fill({}), limit: PAGE_CEILING };
  const part = { rows: new Array(3).fill({}), limit: PAGE_CEILING };
  assert.deepEqual(pageFilled({ ...full, saturated: true }), { filled: true, byCount: true, byFlag: true, disagreed: false });
  assert.deepEqual(pageFilled({ ...full, saturated: false }), { filled: true, byCount: true, byFlag: false, disagreed: true });
  assert.deepEqual(pageFilled({ ...part, saturated: true }), { filled: true, byCount: false, byFlag: true, disagreed: true });
  assert.deepEqual(pageFilled({ ...part, saturated: false }), { filled: false, byCount: false, byFlag: false, disagreed: false });
  // A missing or nonsense limit falls back to the ceiling rather than making
  // every page look full, which `limit: 0` would do under a bare `>=`.
  assert.equal(pageFilled({ rows: new Array(3).fill({}), limit: 0 }).byCount, false);
  assert.equal(pageFilled({ rows: new Array(PAGE_CEILING).fill({}), limit: null }).byCount, true);
  assert.equal(pageFilled(undefined).filled, false);
});
