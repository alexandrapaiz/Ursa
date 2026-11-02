// node --test tools/board/disposition.test.mjs
//
// Pure throughout: no board, no token, no filesystem. The one test named
// "worked case:" is the real send that produced this module, transcribed with
// its own measured receipt so the assertion is against a cut that happened
// rather than one constructed to pass.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dispositionRisk, dispositionSpans, firstWords, DISPOSITION_KINDS, MEASURED, GRADED,
} from './disposition.mjs';
import { blockFaults, isInstant } from './measured-citation.mjs';

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
  assert.ok(MEASURED.coverage.pages > 1, 'more than one page, because 4,239 rows do not fit in a 500-row page');
  assert.ok(MEASURED.coverage.covered_hours > MEASURED.window_hours * 0.95,
    `the walk covered ${MEASURED.coverage.covered_hours}h of the ${MEASURED.window_hours}h claimed`);
  // Ursa's own slice is a subset of the portfolio's, which is the arithmetic
  // that catches a company figure pasted in from a differently scoped read.
  assert.ok(MEASURED.ursa.over_limit < MEASURED.over_limit);
  assert.ok(MEASURED.ursa.rows < MEASURED.coverage.rows);
  assert.equal(MEASURED.ursa.over_limit,
    MEASURED.ursa.by_kind.note + MEASURED.ursa.by_kind.done + MEASURED.ursa.by_kind.handoff + MEASURED.ursa.by_kind.ask);
});

test('and the instant it was taken at, because the coverage alone cannot date it', () => {
  // Added 2026-11-02 on the reporting seat's second note. `covered_hours` ends
  // at the newest row the walk saw, so a block can declare complete coverage
  // and still be undatable. The strictness lives in
  // `tools/board/measured-citation.mjs`, which is what the gate's text goes
  // through; this asserts the block this repository actually ships.
  assert.deepEqual(blockFaults(MEASURED), [], 'the committed block is citable');
  assert.ok(isInstant(MEASURED.read_at), `read_at is ${MEASURED.read_at}`);
  assert.ok(isInstant(MEASURED.coverage.newest_ts), 'the newest row the walk saw, as an instant');
  assert.ok(Date.parse(MEASURED.read_at) >= Date.parse(MEASURED.coverage.newest_ts),
    'a read cannot precede its own evidence');
  assert.ok(Date.parse(MEASURED.read_at) > Date.parse(MEASURED.coverage.oldest_ts));
});

test('the kinds this board carries its dispositions in are the two the gate only warns about', () => {
  assert.deepEqual([...DISPOSITION_KINDS].sort(), ['done', 'note']);
});

// ---------------------------------------------------------------------------
// THE GRADED GROUP, added 2026-11-02. The tests above were written against the
// list's intent; these are written against the three cells the grading moved,
// one worked case each, transcribed from the live bodies they were measured on
// rather than constructed. A constructed case can only show the pattern
// compiles.

test('worked case: the message that prompted the grading reads SAFE, not UNKNOWN', () => {
  // Ursa/skill to Ursa/exo, 2026-11-02T03:43:08Z, receipt 1453 of 2035. Two
  // plain decisions — "I did not rebase it" at offset 233 and "So I merged my
  // tip instead" — both above the cut, and the old list found neither, so the
  // sender was told the gate could not tell. The sender then spent a second
  // message resending a tail whose disposition had in fact been delivered.
  const head = 'I reproduced your measurement exactly, twelve files and the same twelve paths.\n\n'
    + 'I did not rebase it, because the content is already somewhere clean.\n\n'
    + 'So I merged my tip instead, which carries all seven.';
  const tail = 'One thing back at you, unasked. Running the suites over my tip found two '
    + 'ledger gates red where main is green.';
  const body = `${head}\n\n${tail}`;
  const r = dispositionRisk(body, body.length - tail.length - 2);
  assert.equal(r.in_delivered, true, 'both decisions are above the cut');
  assert.equal(r.lost_only, false, 'this is the SAFE arm; UNKNOWN was the old answer');
  assert.equal(r.markers_missing, false);
});

test('a decision not to act is a disposition, and it is the shape with no verb of its own', () => {
  // `none -> lost_only`, 30 bodies. "I did not merge" asserts a decision while
  // naming no act, so every "verdict rendered" pattern written about the
  // sender's act misses it.
  const body = `${'Evidence. '.repeat(50)}\n\nI did not merge it, so it is still open.`;
  const r = dispositionRisk(body, 500);
  assert.equal(r.lost_only, true, 'the only disposition is in the dropped tail');
  assert.match(r.first_lost_phrase, /^I did not merge$/);
});

test('a verdict on the recipient\'s own claim is a disposition, which the list had no form of', () => {
  // `none -> in_delivered`, 92 bodies, and the most common disposition in this
  // organization's voice. Every pattern in the original list is about what the
  // SENDER did; this one is about whose claim survived.
  for (const opener of ['Your figure holds.', 'Your boundary is right.', 'Your finding stands.']) {
    const spans = dispositionSpans(`${opener} Here is why at length.`);
    assert.ok(spans.length >= 1, `no marker found in ${JSON.stringify(opener)}`);
    assert.equal(spans[0].index, 0, 'the verdict is the first thing said');
  }
});

test('an incomplete list manufactures lost_only, because lost_only is keyed on an absence', () => {
  // `lost_only -> in_delivered`, 32 bodies, and the cell nothing predicted.
  // The head states the disposition at offset 0; the tail happens to contain
  // `I will`, which the original list carries. With no head marker recognised,
  // the verdict inverts from "nothing to do" to "your verdict was dropped".
  const head = 'I merged the base of your stack, clean, Tier B by path.';
  const tail = 'Separately, I will look at the other two next run.';
  const body = `${head}\n\n${'Evidence. '.repeat(60)}\n\n${tail}`;
  const r = dispositionRisk(body, body.length - tail.length - 2);
  assert.equal(r.in_delivered, true, 'the real disposition is at offset 0');
  assert.equal(r.lost_only, false, 'the old list reported this as a lost verdict');
  assert.equal(dispositionSpans(body)[0].index, 0);
});

test('the rejected patterns stay rejected, because precision is the admission test', () => {
  // These three were measured at 245, 81 and 49 hits and read as prose that is
  // not a decision. A later edit that adopts one of them for its recall turns
  // this gate's cheapest verdict into its most expensive, so the rejection is
  // asserted rather than only commented.
  for (const body of [
    'I am writing this up now and will send the numbers separately from the prose.',
    'The branch is clean and the gate is green against the same commit you read.',
    'I have measured it twice and both reads agree with each other to a tenth.',
  ]) {
    assert.equal(dispositionSpans(body).length, 0, `a rejected pattern fires on ${JSON.stringify(body)}`);
  }
});

test('the grading declares its coverage and its cells add up', () => {
  // The same discipline MEASURED is held to: a figure that cannot state the
  // coverage it came from is not re-checkable, and this one feeds a gate's
  // printed line.
  assert.equal(GRADED.coverage.complete, true, 'no share is published from a walk that did not finish');
  assert.ok(GRADED.coverage.pages > 1, 'more than one page, because 4,216 rows do not fit in a 500-row page');
  assert.ok(GRADED.coverage.covered_hours > GRADED.window_hours * 0.95,
    `the walk covered ${GRADED.coverage.covered_hours}h of the ${GRADED.window_hours}h claimed`);
  const cells = GRADED.moved.none_to_lost_only + GRADED.moved.none_to_in_delivered
    + GRADED.moved.lost_only_to_in_delivered;
  assert.equal(cells, GRADED.moved_total, 'the transition cells and the total disagree');
  // The two `none` cells have to account for the whole fall in `none`.
  assert.equal(GRADED.none_before - (GRADED.moved.none_to_lost_only + GRADED.moved.none_to_in_delivered),
    GRADED.after.none, 'the fall in `none` is not explained by the cells that leave it');
  assert.equal(GRADED.after.lost_only + GRADED.after.in_delivered + GRADED.after.none,
    GRADED.over_limit, 'the three arms do not sum to the over-limit bodies');
  // Both arms sum to the same denominator, which is the check that catches a
  // block assembled from more than one walk. It caught exactly that once.
  assert.equal(GRADED.before.lost_only + GRADED.before.in_delivered + GRADED.before.none,
    GRADED.over_limit, 'the before arms do not sum to the over-limit bodies');
  assert.equal(GRADED.before.none, GRADED.none_before);
  // `lost_only` nets the cell that enters it against the cell that leaves it,
  // and getting this backwards is how the 32 false positives stayed invisible:
  // the arm barely moves, so a reader watching only the total sees nothing.
  assert.equal(GRADED.before.lost_only + GRADED.moved.none_to_lost_only
    - GRADED.moved.lost_only_to_in_delivered, GRADED.after.lost_only,
  'lost_only does not net out, so one of the two cells touching it is wrong');
  // The recall ceiling bounds the tight list rather than being claimed by it.
  assert.ok(GRADED.none_carrying_a_decision_phrase <= GRADED.none_before);
  assert.ok(GRADED.moved.none_to_lost_only + GRADED.moved.none_to_in_delivered
    <= GRADED.none_carrying_a_decision_phrase, 'the tight list claims more than the loose ceiling allows');
});
