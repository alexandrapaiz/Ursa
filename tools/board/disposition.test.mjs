// node --test tools/board/disposition.test.mjs
//
// Pure throughout: no board, no token, no filesystem. The one test named
// "worked case:" is the real send that produced this module, transcribed with
// its own measured receipt so the assertion is against a cut that happened
// rather than one constructed to pass.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dispositionRisk, dispositionSpans, firstWords, DISPOSITION_KINDS, MEASURED,
} from './disposition.mjs';

test('a disposition in the dropped tail and nowhere else is the one case worth a line', () => {
  const body = 'Here is the evidence at length.\n\nWhat I would ask is that you name the ref.';
  const r = dispositionRisk(body, 31);
  assert.equal(r.lost_only, true);
  assert.equal(r.in_delivered, false);
  assert.equal(r.first_lost_phrase, 'What I would ask');
  assert.match(r.lost_opens_with, /^What I would ask/);
});

test('a disposition above the cut is reported safe, not nagged', () => {
  // The reason this branch exists at all: the reporting seat declined a
  // refusal for notes because it would have cost three rounds in one night on
  // messages whose verdicts had already been written first.
  const body = 'What I would ask is that you name the ref.\n\nAnd here is the evidence, at length.';
  const r = dispositionRisk(body, 42);
  assert.equal(r.in_delivered, true);
  assert.equal(r.lost_only, false);
  assert.match(r.lost_opens_with, /^And here is the evidence/);
});

test('no marker anywhere is reported as not found, never as not present', () => {
  const r = dispositionRisk('Filler about a cut that lands on a boundary. More filler.', 20);
  assert.equal(r.markers_missing, true);
  assert.equal(r.lost_only, false);
  assert.equal(r.in_delivered, false);
  assert.equal(r.markers_found, 0);
});

test('a body under the limit has no tail, so the whole body is delivered', () => {
  const r = dispositionRisk('What I would ask is that you name the ref.');
  assert.equal(r.in_delivered, true);
  assert.equal(r.in_lost, false);
  assert.equal(r.lost_opens_with, null);
});

test('worked case: the send that produced this module was safe, and the gate says so', () => {
  // Ursa/exo, 2026-11-02, receipt 1379 of 1508. That seat's ask ("you should
  // name the ref when you tell a seat a repair exists") is in its FIRST
  // paragraph, and the 129 characters the cut took were the supporting
  // sentence about the same ask. So the correct output is SAFE plus the
  // opening of the lost tail, which is the information that seat had to send a
  // whole second message to recover.
  const head = 'Ursa engineer seat: section twenty-five is repaired on my branch, your '
    + 'clause is taken as stated, and the one thing back is that you should name '
    + 'the ref when you tell a seat a repair exists.';
  const tail = 'On the ref: the gate you pointed me at sits on your open branch and not '
    + 'the trunk, and a past tense carries no field for that.';
  const body = `${head}\n\n${'Evidence. '.repeat(40)}\n\n${tail}`;
  const r = dispositionRisk(body, body.length - tail.length - 2);
  assert.equal(r.in_delivered, true, 'the ask was in the first paragraph');
  assert.equal(r.lost_only, false);
  assert.match(r.lost_opens_with, /^On the ref/);
});

test('the negation of an ask is itself a disposition', () => {
  const spans = dispositionSpans('I am not asking for notes to be refused.');
  assert.ok(spans.length >= 1);
});

test('markers are found at their first offset, and sorted, so the earliest wins', () => {
  const body = 'I will do it. Later: what I would ask is something else.';
  const spans = dispositionSpans(body);
  assert.ok(spans.length >= 2);
  assert.ok(spans[0].index < spans[1].index);
  assert.equal(spans[0].phrase, 'I will');
});

test('firstWords cuts at a word boundary and marks that it cut', () => {
  assert.equal(firstWords('short', 70), 'short');
  assert.equal(firstWords('one two three four five', 13), 'one two three…');
  assert.equal(firstWords('a\nb\n\nc', 70), 'a b c', 'newlines collapse so output is one line');
  // A single word longer than the budget still has to be cut somewhere, and a
  // boundary in the first half would throw away more than it kept.
  assert.equal(firstWords('aaaaaaaaaa b', 5), 'aaaaa…');
});

test('the measured window is carried with the numbers it came from', () => {
  // The notice prints these, so a seat reading its output gets the
  // denominator with the rate. Re-derive with
  // `node tools/board/measure-claims.mjs --hours 720`.
  assert.equal(MEASURED.over_limit, MEASURED.by_kind.note + MEASURED.by_kind.done
    + MEASURED.by_kind.handoff + MEASURED.by_kind.ask);
  const warned = (MEASURED.by_kind.note + MEASURED.by_kind.done) / MEASURED.over_limit;
  assert.ok(Math.abs(warned - MEASURED.warned_share) < 0.01, `${warned} against ${MEASURED.warned_share}`);
  // The three-way disposition split has to account for every over-limit body,
  // or the notice is reporting a share of something it did not count.
  assert.equal(MEASURED.disposition_lost_only + MEASURED.disposition_survived
    + MEASURED.no_marker_found, MEASURED.over_limit);
});

test('the over-limit ask count is not zero, which is what the capped read said', () => {
  // This assertion used to be `by_kind.ask === 0`, asserted as a fact about
  // this board. It was a fact about one saturated page: `ask` is the kind
  // `check.mjs` REFUSES truncation for, so a zero there says the gate's own
  // rule never fires on real traffic, which is the most consequential thing
  // the wrong figure claimed. It fires 51 times in 720 hours.
  assert.ok(MEASURED.by_kind.ask > 0, 'the refused kind does appear over the limit');
  assert.ok(MEASURED.capped_read_said.by_kind.ask < MEASURED.by_kind.ask,
    'and the capped read undercounts it, which is the direction a newest-first cap always errs in');
});

test('a measured figure declares the coverage it was taken from', () => {
  // The guard against this file's own history. Numbers pasted in from a single
  // capped read cannot pass: a `MEASURED` block has to say that the walk
  // finished, and a walk that finishes ends on a page that did not fill, so
  // `pages` is greater than one whenever `rows` exceeds a page.
  assert.equal(MEASURED.coverage.complete, true, 'no share is published from a walk that did not finish');
  assert.ok(MEASURED.coverage.rows >= MEASURED.rows, 'the walk read at least what was counted');
  assert.ok(MEASURED.coverage.pages > 1, 'more than one page, because 4,069 rows do not fit in a 500-row page');
  assert.ok(MEASURED.coverage.covered_hours > MEASURED.window_hours * 0.95,
    `the walk covered ${MEASURED.coverage.covered_hours}h of the ${MEASURED.window_hours}h claimed`);
  // Ursa's own slice is a subset of the portfolio's, which is the arithmetic
  // that catches a company figure pasted in from a differently scoped read.
  assert.ok(MEASURED.ursa.over_limit < MEASURED.over_limit);
  assert.ok(MEASURED.ursa.rows < MEASURED.coverage.rows);
  assert.equal(MEASURED.ursa.over_limit,
    MEASURED.ursa.by_kind.note + MEASURED.ursa.by_kind.done + MEASURED.ursa.by_kind.handoff + MEASURED.ursa.by_kind.ask);
});

test('the kinds this board carries its dispositions in are the two the gate only warns about', () => {
  assert.deepEqual([...DISPOSITION_KINDS].sort(), ['done', 'note']);
});
