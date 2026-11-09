// node --test tools/board/measure-claims.test.mjs
//
// `measure()` is split out of the network call so the arithmetic can be tested
// against hand-built rows. The live number lives in the pull request that
// added this file and is re-derived by running the tool, not by this test: the
// board has no replay, so a test that fetched its own corpus would assert a
// different number every day.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { measure, measuredBlock } from './measure-claims.mjs';
import { blockFaults, citedCounts } from './measured-citation.mjs';

const row = (over) => ({
  kind: over.kind || 'note',
  body: over.body || 'a short body',
  data: over.data,
  from_company: over.from_company || 'Ursa',
  from_seat: over.from_seat || 'engineer',
});

test('the warned share is the complement of the two refused kinds, over the over-limit set', () => {
  const long = (kind) => row({ kind, body: `${'x'.repeat(1600)}` });
  const out = measure([long('note'), long('note'), long('done'), long('handoff')], 720);
  assert.equal(out.over_limit, 4);
  assert.deepEqual(out.over_limit_by_kind, { note: 2, done: 1, handoff: 1 });
  assert.equal(out.over_limit_warned_share, 0.75);
});

test('a body under the limit is in the kind count and not in the over-limit count', () => {
  const out = measure([row({ kind: 'note' }), row({ kind: 'ask' })], 48);
  assert.deepEqual(out.by_kind, { note: 1, ask: 1 });
  assert.equal(out.over_limit, 0);
  assert.equal(out.over_limit_warned_share, 0, 'no division by zero on an empty over-limit set');
});

test('the window is carried into the result, because limit is not the denominator', () => {
  assert.equal(measure([], 720).since_hours, 720);
  assert.equal(measure([], 48).since_hours, 48);
});

test('an unreffed claim is counted once per body, and attributed', () => {
  const out = measure([
    row({ body: 'the gate is tools/doc-model/check.mjs and tools/doc-model/corpus.mjs is beside it', from_seat: 'engineer' }),
    row({ body: 'the gate is tools/doc-model/check.mjs on ursa-engineer/2026-11-02-message-2' }),
  ], 720);
  assert.equal(out.unreffed_claim_fires, 1, 'the reffed one does not fire');
  assert.deepEqual(out.unreffed_by_sender, { 'Ursa/engineer': 1 });
  assert.deepEqual(out.unreffed_by_kind, { note: 1 });
});

test('a path cited without a state claim is counted as a citation and not as a fire', () => {
  const out = measure([row({ body: 'please write docs/security/redaction-standard.md' })], 720);
  assert.equal(out.bodies_with_a_repo_path, 1);
  assert.equal(out.bodies_with_a_state_claim, 0);
  assert.equal(out.unreffed_claim_fires, 0);
});

test('the disposition split is three-way and the three are exclusive', () => {
  const filler = 'Evidence that goes on. '.repeat(70);          // over the limit
  const lostOnly = `${filler}\n\nWhat I would ask is that you name the ref.`;
  const safe = `What I would ask is that you name the ref.\n\n${filler}`;
  const out = measure([row({ body: lostOnly }), row({ body: safe }), row({ body: filler })], 720);
  assert.equal(out.over_limit, 3);
  assert.equal(out.disposition_lost_only, 1);
  assert.equal(out.disposition_survived_the_cut, 1);
  assert.equal(out.over_limit - out.disposition_lost_only - out.disposition_survived_the_cut, 1,
    'the third is the no-marker case, which is neither');
});

test('a share is withheld when the walk that produced the rows did not finish', () => {
  // The whole point of threading coverage into `measure`: the counts and the
  // shares travel together, so a `--json` blob pasted into a pull request
  // cannot be quoted without its coverage. Three cases, because the middle one
  // is the one that bit this seat.
  const long = (kind) => row({ kind, body: 'x'.repeat(1600) });
  const rows = [long('note'), long('note'), long('done'), long('handoff')];

  const complete = measure(rows, 720, { complete: true, pages: 9, rows: 4069, requested_hours: 720, covered_hours: 717, oldest_ts: '2026-10-03T05:11:44.721Z' });
  assert.equal(complete.over_limit_warned_share, 0.75);
  assert.equal(complete.counts_are_floors, false);
  assert.equal(complete.shares_withheld, null);

  const capped = measure(rows, 720, { complete: false, incomplete_reason: 'PAGE_BUDGET', incomplete_code: 'COVERAGE_PAGE_BUDGET', incomplete_line: 'stopped after 1 page with the last one still full', requested_hours: 720, covered_hours: 145.3, oldest_ts: '2026-10-27T01:35:16.509Z' });
  assert.equal(capped.over_limit_warned_share, null, 'no ratio is published from a saturated page');
  assert.equal(capped.counts_are_floors, true);
  assert.equal(capped.shares_withheld, 'COVERAGE_PAGE_BUDGET');
  assert.match(capped.shares_withheld_line, /145\.3 of the 720 hours/);
  assert.equal(capped.over_limit, 4, 'the count still prints, as a floor');

  // No coverage argument at all means no board read was involved, which is
  // what every other test in this file does. It is a different thing from a
  // read whose coverage is unknown, and an explicit null is the second.
  assert.equal(measure(rows, 720).over_limit_warned_share, 0.75);
  assert.equal(measure(rows, 720, null).over_limit_warned_share, null);
  assert.equal(measure(rows, 720, null).shares_withheld, 'NO_COVERAGE');

  // A receipt from a walk older than `incomplete_code`, which `ratioFault`
  // forwards rather than builds (`tools/board/page.mjs`). This branch is the
  // only way to reach `COVERAGE_UNKNOWN`, and before 2026-11-09 no test named
  // any code in this family except `COVERAGE_PAGE_BUDGET`: the other five were
  // assembled from `incomplete_reason` inside a template literal, so they
  // appeared nowhere in the source and nothing could have asserted them.
  const stale = measure(rows, 720, { complete: false, incomplete_reason: 'PAGE_BUDGET', incomplete_line: 'a receipt with no code field', requested_hours: 720, covered_hours: 145.3, oldest_ts: '2026-10-27T01:35:16.509Z' });
  assert.equal(stale.shares_withheld, 'COVERAGE_UNKNOWN');
  assert.match(stale.shares_withheld_line, /does not say which check stopped the walk/);
});

test('the emitted block is citable by construction, which is the point of emitting it', () => {
  // The defect this closes, concretely: the `MEASURED` constant in
  // `tools/board/disposition.mjs` is quoted to seats by
  // `tools/board/check.mjs`, and the version of it committed on 2026-11-02 at
  // 04:17Z was nine fields retyped out of a `--json` receipt. The field a
  // receipt cannot supply is the clock, so the block carried a calendar day,
  // and a day could not hold a count that moved in twenty minutes. An emitter
  // that is handed the clock cannot produce that block.
  const long = (kind) => row({ kind, body: 'x'.repeat(1600) });
  const rows = [long('note'), long('note'), long('done'), long('handoff'), long('ask')];
  const coverage = {
    complete: true, pages: 9, rows: rows.length, requested_hours: 720,
    oldest_ts: '2026-10-03T05:11:44.721Z', newest_ts: '2026-11-02T04:28:29.212Z', covered_hours: 719.28,
  };
  const { block, faults } = measuredBlock(measure(rows, 720, coverage), '2026-11-02T04:28:38Z');
  assert.deepEqual(faults, []);
  assert.deepEqual(blockFaults(block), [], 'the gate will quote it');
  assert.ok(citedCounts(block, '2026-11-02T04:48:38Z').sentence.includes('20 minutes before this check'));
  assert.equal(block.on, '2026-11-02', 'the day is kept, as a convenience, never as the instant');
  assert.deepEqual(block.by_kind, { note: 2, done: 1, handoff: 1, ask: 1 });
  assert.equal(block.no_marker_found,
    block.over_limit - block.disposition_lost_only - block.disposition_survived,
    'the third bucket is stated so the three partition the over-limit set');
});

test('a clock earlier than the walk it dates is refused rather than emitted', () => {
  const coverage = {
    complete: true, pages: 9, rows: 1, requested_hours: 720,
    oldest_ts: '2026-10-03T05:11:44.721Z', newest_ts: '2026-11-02T04:28:29.212Z', covered_hours: 719.28,
  };
  // 02:51:56Z is what back-filling the instant from `covered_hours` produced
  // on the real block: the newest row, not the clock, 29 minutes early.
  const { faults } = measuredBlock(measure([], 720, coverage), '2026-11-02T02:51:56Z');
  assert.deepEqual(faults.map((f) => f.code), ['READ_AT_BEFORE_NEWEST_ROW']);
});

test('an incomplete walk emits with its fault named, so no share of it is pasted into a gate', () => {
  const coverage = {
    complete: false, pages: 1, rows: 500, requested_hours: 720,
    oldest_ts: '2026-10-27T01:35:16.509Z', newest_ts: '2026-11-02T04:28:29.212Z', covered_hours: 147.9,
  };
  const { block, faults } = measuredBlock(measure([row({ kind: 'note' })], 720, coverage), '2026-11-02T04:28:38Z');
  assert.deepEqual(faults.map((f) => f.code), ['WALK_INCOMPLETE']);
  assert.equal(block.warned_share, null, 'the share is withheld by `measure`, not by the emitter');
  assert.ok(faults[0].line.includes('147.9h of the 720h'));
});

test('the nested company slice is a subset of the block it sits in, off one walk', () => {
  const long = (kind, from) => row({ kind, body: 'x'.repeat(1600), from_company: from });
  const rows = [long('note', 'Ursa'), long('note', 'alexandria'), long('done', 'ursa')];
  const coverage = {
    complete: true, pages: 9, rows: 3, requested_hours: 720,
    oldest_ts: '2026-10-03T05:11:44.721Z', newest_ts: '2026-11-02T04:28:29.212Z', covered_hours: 719.28,
  };
  const ursa = measure(rows.filter((m) => m.from_company.toLowerCase() === 'ursa'), 720, coverage);
  const { block } = measuredBlock(measure(rows, 720, coverage), '2026-11-02T04:28:38Z', { company: 'Ursa', out: ursa });
  assert.equal(block.over_limit, 3);
  assert.equal(block.ursa.over_limit, 2, 'the lowercase spelling is this company too, which is worth 17 rows live');
  assert.ok(block.ursa.over_limit < block.over_limit);
  assert.deepEqual(block.ursa.by_kind, { note: 1, done: 1 });
});
