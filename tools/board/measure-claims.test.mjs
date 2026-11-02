// node --test tools/board/measure-claims.test.mjs
//
// `measure()` is split out of the network call so the arithmetic can be tested
// against hand-built rows. The live number lives in the pull request that
// added this file and is re-derived by running the tool, not by this test: the
// board has no replay, so a test that fetched its own corpus would assert a
// different number every day.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { measure } from './measure-claims.mjs';

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

  const capped = measure(rows, 720, { complete: false, incomplete_reason: 'PAGE_BUDGET', incomplete_line: 'stopped after 1 page with the last one still full', requested_hours: 720, covered_hours: 145.3, oldest_ts: '2026-10-27T01:35:16.509Z' });
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
});
