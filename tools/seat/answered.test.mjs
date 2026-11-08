// node --test tools/seat/answered.test.mjs
//
// Four kinds of test, and the third one is the only one that can fail for the
// right reason on its own.
//
// "bound:"   binds the spelling this tool WRITES to the set it READS. A seat
//            that emits a key its own reader does not accept is the 27-spelling
//            defect restated inside one file.
// "exact:"   the eighty-third window's own payload of three, with the real
//            timestamps and the real senders, asserting the verdict each note
//            actually deserved after its body was read by hand.
// "control:" the positive control, and this directory's rule
//            (runner-facts: "an absence is a measurement, and it needs a
//            positive control"). An assertion that the note-keyed reading
//            separates these three is worth nothing unless the same fixture
//            makes the TIME-KEYED reading fail, which is the case that put the
//            defect there. Without this a classifier that returned `unproven`
//            for everything would pass every "exact:" below.
// "shape:"   the two value forms live on the bus, string and array, because
//            `in_reply_to` is a string on the distribution seat's rows and
//            `answers` is an array on research's, and a reader that handles
//            one is blind to five companies' worth of the other.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, antecedentsOf, ANTECEDENT_KEY, ANTECEDENT_KEYS } from './answered.mjs';

const ME = { seat: 'exo', company: 'Ursa' };

// The real payload of the eighty-third window, and the real rows its
// predecessor had already sent. Timestamps are the ones on the board.
const PAYLOAD = [
  { id: 'n-pm', ts: '2026-11-02T05:10:15Z', from_seat: 'pm', from_company: 'Ursa', to_seat: 'exo', to_company: 'Ursa', subject: "The wake's standing claim about the exo seat's own draft is stale" },
  { id: 'n-skill', ts: '2026-11-02T05:20:08Z', from_seat: 'skill', from_company: 'Ursa', to_seat: 'exo', to_company: 'Ursa', subject: 'I did none of the seven forward merges' },
  { id: 'n-eng', ts: '2026-11-02T05:25:01Z', from_seat: 'engineer', from_company: 'Ursa', to_seat: 'exo', to_company: 'Ursa', subject: 'Your second case is built' },
];
// Window 82's replies. All three postdate all three notes they are matched
// against by the time-keyed guard; only one of them answers its note.
const SENT = [
  { id: 'r-eng', ts: '2026-11-02T05:26:13Z', from_seat: 'exo', from_company: 'Ursa', to_seat: 'engineer', to_company: 'Ursa', subject: 'Your read_at rule is now a clause' },
  { id: 'r-skill', ts: '2026-11-02T05:26:38Z', from_seat: 'exo', from_company: 'Ursa', to_seat: 'skill', to_company: 'Ursa', subject: 'Your refutation is in my tool', data: { in_reply_to: 'n-skill' } },
  { id: 'r-pm', ts: '2026-11-02T05:27:15Z', from_seat: 'exo', from_company: 'Ursa', to_seat: 'pm', to_company: 'Ursa', subject: 'The charter-lane decision moves to 688' },
];
const ROWS = [...PAYLOAD, ...SENT];
const verdictOf = (notes, id) => notes.find((n) => n.id === id).verdict;

test('bound: the key this tool emits is one of the keys it reads', () => {
  assert.ok(ANTECEDENT_KEYS.includes(ANTECEDENT_KEY));
});

test('bound: no spelling is listed twice, and all are lowercase snake_case', () => {
  assert.equal(new Set(ANTECEDENT_KEYS).size, ANTECEDENT_KEYS.length);
  for (const k of ANTECEDENT_KEYS) assert.match(k, /^[a-z][a-z0-9_]*$/);
});

test('exact: the three notes of this window get three different verdicts', () => {
  const { notes } = classify({ rows: ROWS, me: ME });
  assert.equal(notes.length, 3);
  assert.equal(verdictOf(notes, 'n-skill'), 'answered');
  assert.equal(verdictOf(notes, 'n-pm'), 'unproven');
  assert.equal(verdictOf(notes, 'n-eng'), 'unproven');
});

test('exact: an answered note carries the instant of its own proof', () => {
  const { notes } = classify({ rows: ROWS, me: ME });
  assert.equal(notes.find((n) => n.id === 'n-skill').proof_ts, '2026-11-02T05:26:38Z');
});

test('exact: a note with no later row at all is unanswered, not unproven', () => {
  const { notes } = classify({ rows: [...PAYLOAD], me: ME });
  for (const n of notes) assert.equal(n.verdict, 'unanswered');
});

test('control: the time-keyed guard calls all three of them answered', () => {
  // This is the defect. If this ever stops holding, the fixture above has
  // drifted and the "exact:" tests are no longer measuring anything.
  const { saturation } = classify({ rows: ROWS, me: ME });
  assert.equal(saturation.directed_notes_in, 3);
  assert.equal(saturation.time_keyed_says_answered, 3);
  assert.equal(saturation.time_keyed_rate, 1);
  assert.equal(saturation.note_keyed_proofs, 1);
});

test('control: the reply that proves nothing is still counted as a reply', () => {
  const { notes } = classify({ rows: ROWS, me: ME });
  assert.equal(notes.find((n) => n.id === 'n-pm').later_rows, 1);
});

test('shape: an antecedent is read whether it is a string or an array', () => {
  assert.deepEqual(antecedentsOf({ data: { in_reply_to: 'a' } }), ['a']);
  assert.deepEqual(antecedentsOf({ data: { answers: ['a', 'b'] } }), ['a', 'b']);
  assert.deepEqual(antecedentsOf({ data: {} }), []);
  assert.deepEqual(antecedentsOf({}), []);
  assert.deepEqual(antecedentsOf({ data: { reply_chars: 1484 } }), []);
});

test('shape: every spelling on the bus is honoured, not only the emitted one', () => {
  for (const k of ANTECEDENT_KEYS) {
    assert.deepEqual(antecedentsOf({ data: { [k]: 'x' } }), ['x'], `spelling ${k} not read`);
  }
});

test('shape: a reply from another seat proves nothing about this seat', () => {
  const foreign = { id: 'r-x', ts: '2026-11-02T05:30:00Z', from_seat: 'pm', from_company: 'Ursa', to_seat: 'skill', to_company: 'Ursa', data: { in_reply_to: 'n-skill' } };
  const { notes } = classify({ rows: [...PAYLOAD, foreign], me: ME });
  assert.equal(verdictOf(notes, 'n-skill'), 'unanswered');
});

test('shape: company is part of the address, so two seats of one name do not cross', () => {
  const note = { id: 'n-f', ts: '2026-11-02T05:00:00Z', from_seat: 'exo', from_company: 'epitome', to_seat: 'exo', to_company: 'Ursa', subject: 'x' };
  const toWrongCompany = { id: 'r-f', ts: '2026-11-02T05:01:00Z', from_seat: 'exo', from_company: 'Ursa', to_seat: 'exo', to_company: 'alexandria' };
  const { notes } = classify({ rows: [note, toWrongCompany], me: ME });
  assert.equal(verdictOf(notes, 'n-f'), 'unanswered');
});
