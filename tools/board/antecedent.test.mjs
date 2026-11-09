// node --test tools/board/antecedent.test.mjs
//
// The pairing this file exists to hold together: the key `tools/board/post.mjs`
// now emits is read back by `tools/seat/answered.mjs`, and neither tool's own
// suite could see the other. On 2026-11-09 this seat posted four replies with
// no antecedent at all and its own gate called all four unproven, in the run
// that shipped a repair to that gate. So the binding assertion below is the
// point of the file, and the unit cases are the floor under it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { antecedentData } from './antecedent.mjs';
import { antecedentsOf, ANTECEDENT_KEY, ANTECEDENT_KEYS } from '../seat/answered.mjs';

test('bound: the key this flag writes is the key the reply gate reads', () => {
  // The whole reason the flag exists. A poster that wrote `reply_to` would
  // satisfy its own test and still leave every reply unproven.
  const data = antecedentData(null, 'abc-1');
  assert.ok(Object.prototype.hasOwnProperty.call(data, ANTECEDENT_KEY));
  assert.deepEqual(antecedentsOf({ data }), ['abc-1']);
});

test('bound: a multi-id reply is read back whole, not just its first', () => {
  const data = antecedentData(null, 'abc-1,abc-2');
  assert.deepEqual(antecedentsOf({ data }), ['abc-1', 'abc-2']);
});

test('bound: the gate finds nothing when the flag was not passed', () => {
  // The positive control, and the measured case. Without this, a test that
  // the key is read proves nothing: a reader returning every id it can find
  // would pass the two above.
  assert.deepEqual(antecedentsOf({ data: antecedentData('{"ursa_pr":["Ursa#748"]}', null) }), []);
  assert.deepEqual(antecedentsOf({ data: antecedentData(null, null) }), []);
});

test('no flag and no data is null, so the payload omits the field entirely', () => {
  // Not an empty object: `post.mjs` tests `if (msg.data)` before attaching it,
  // and an empty object is truthy, so this would post `data: {}` on every
  // message that passes neither.
  assert.equal(antecedentData(null, null), null);
  assert.equal(antecedentData(null, ' , '), null);
});

test('data alone is passed through untouched', () => {
  assert.deepEqual(antecedentData('{"a":1}', null), { a: 1 });
});

test('one id is a string and several are an array', () => {
  // Both shapes are live on this bus -- `in_reply_to` is a string on the
  // distribution seat's rows and an array on research's -- and the gate reads
  // either. The flag emits the narrower shape when it can, so a row carrying
  // one antecedent looks like the rows that already carry one.
  assert.deepEqual(antecedentData(null, 'one'), { in_reply_to: 'one' });
  assert.deepEqual(antecedentData(null, 'one,two'), { in_reply_to: ['one', 'two'] });
});

test('the flag merges into data rather than replacing it', () => {
  assert.deepEqual(antecedentData('{"a":1}', 'one'), { a: 1, in_reply_to: 'one' });
});

test('an explicit in_reply_to inside --data wins over the flag', () => {
  // The wider tool beats the narrower one. `--data` can carry the array form
  // and any of the other twenty-six spellings the gate reads; the flag cannot.
  // A flag that overwrote it would make the richer input unusable.
  assert.deepEqual(antecedentData('{"in_reply_to":["x","y"]}', 'one'), { in_reply_to: ['x', 'y'] });
  // Including when the explicit value is deliberately empty, which is a
  // sender saying "this answers nothing" rather than forgetting.
  assert.deepEqual(antecedentData('{"in_reply_to":[]}', 'one'), { in_reply_to: [] });
});

test('whitespace around ids is trimmed, because a shell comma-list has it', () => {
  assert.deepEqual(antecedentData(null, ' one , two '), { in_reply_to: ['one', 'two'] });
});

test('the spelling emitted is one the gate lists, not merely one it accepts today', () => {
  assert.ok(ANTECEDENT_KEYS.includes(ANTECEDENT_KEY));
  assert.ok(ANTECEDENT_KEYS.includes('in_reply_to'));
});
