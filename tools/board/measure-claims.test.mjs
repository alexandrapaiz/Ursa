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
