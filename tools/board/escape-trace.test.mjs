import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESCAPE_KEY, escapeAsserted, escapeTrace } from './escape-trace.mjs';
import { WAKE_BODY_CHARS } from './check.mjs';

const LONG = 'x'.repeat(WAKE_BODY_CHARS + 10);
const SHORT = 'x'.repeat(40);

test('no flag, no trace, whatever the body', () => {
  for (const body of [LONG, SHORT, '']) {
    const r = escapeTrace({ body, acceptTruncation: false });
    assert.equal(r.written, false);
    assert.equal(r.data, null);
  }
});

test('the flag on a body that fits writes nothing, because then it is about the invocation', () => {
  const r = escapeTrace({ body: SHORT, acceptTruncation: true });
  assert.equal(r.written, false);
  assert.equal(r.data, null);
});

test('a body exactly at the limit is not cut, so the flag writes nothing', () => {
  const r = escapeTrace({ body: 'x'.repeat(WAKE_BODY_CHARS), acceptTruncation: true });
  assert.equal(r.written, false);
});

test('the flag on a cut body writes the receipt', () => {
  const r = escapeTrace({ body: LONG, acceptTruncation: true });
  assert.equal(r.written, true);
  assert.deepEqual(r.data, { [ESCAPE_KEY]: true });
  assert.equal(r.overwrote, false);
});

test('the receipt is added beside existing data rather than replacing it', () => {
  const r = escapeTrace({ body: LONG, acceptTruncation: true, data: { in_reply_to: 'abc', n: 3 } });
  assert.deepEqual(r.data, { in_reply_to: 'abc', n: 3, [ESCAPE_KEY]: true });
});

test('the caller data object is not mutated, so a retry sends the same payload', () => {
  const data = { n: 1 };
  escapeTrace({ body: LONG, acceptTruncation: true, data });
  assert.deepEqual(data, { n: 1 });
});

test('a hand-supplied value LOSES, and the caller is told', () => {
  // The asymmetry this file exists for: the key is evidence only because no
  // sender types it, so the derived value wins. The opposite of in_reply_to.
  const r = escapeTrace({ body: LONG, acceptTruncation: true, data: { [ESCAPE_KEY]: false } });
  assert.equal(r.data[ESCAPE_KEY], true);
  assert.equal(r.overwrote, true);
});

test('a hand-supplied value that already agrees is not reported as an overwrite', () => {
  const r = escapeTrace({ body: LONG, acceptTruncation: true, data: { [ESCAPE_KEY]: true } });
  assert.equal(r.data[ESCAPE_KEY], true);
  assert.equal(r.overwrote, false);
});

test('a hand-supplied value with the flag ABSENT is left alone, because nothing was derived', () => {
  // Without the flag there is no receipt to mint, so this file must not
  // silently correct a key it did not write. Whatever that row means, it is
  // not this function's claim.
  const r = escapeTrace({ body: LONG, acceptTruncation: false, data: { [ESCAPE_KEY]: true } });
  assert.equal(r.written, false);
  assert.deepEqual(r.data, { [ESCAPE_KEY]: true });
});

test('a custom wake limit is honoured, so --wake-limit cannot desync the receipt', () => {
  assert.equal(escapeTrace({ body: SHORT, acceptTruncation: true, wakeLimit: 10 }).written, true);
  assert.equal(escapeTrace({ body: LONG, acceptTruncation: true, wakeLimit: 1e6 }).written, false);
});

test('a missing message is not a crash and not a trace', () => {
  for (const m of [null, undefined, {}]) {
    const r = escapeTrace(m);
    assert.equal(r.written, false);
  }
});

// ---- the read side ----

test('escapeAsserted is null for a row that was not cut, which is a third answer', () => {
  assert.equal(escapeAsserted({ body: SHORT }), null);
  assert.equal(escapeAsserted({ body: '' }), null);
  assert.equal(escapeAsserted({}), null);
});

test('escapeAsserted is false for a cut row that asserted nothing', () => {
  assert.equal(escapeAsserted({ body: LONG }), false);
  assert.equal(escapeAsserted({ body: LONG, data: null }), false);
  assert.equal(escapeAsserted({ body: LONG, data: {} }), false);
  assert.equal(escapeAsserted({ body: LONG, data: 'a string' }), false);
});

test('escapeAsserted is true only on the literal true, not on anything truthy', () => {
  assert.equal(escapeAsserted({ body: LONG, data: { [ESCAPE_KEY]: true } }), true);
  assert.equal(escapeAsserted({ body: LONG, data: { [ESCAPE_KEY]: 'yes' } }), false);
  assert.equal(escapeAsserted({ body: LONG, data: { [ESCAPE_KEY]: 1 } }), false);
});

test('the poster and the reader agree on every shape the poster can mint', () => {
  // The one property that matters across the two halves of this file: a row
  // built by escapeTrace reads back as asserted, and a cut row built without
  // it does not. An equality-shaped assertion between two functions in one
  // file cannot catch a shared defect, so both sides are also pinned to
  // literals in the tests above.
  const minted = escapeTrace({ body: LONG, acceptTruncation: true, data: { n: 1 } });
  assert.equal(escapeAsserted({ body: LONG, data: minted.data }), true);
  assert.equal(escapeAsserted({ body: LONG, data: { n: 1 } }), false);
});

test('escapeAsserted honours a custom limit the same way the poster does', () => {
  assert.equal(escapeAsserted({ body: SHORT, data: { [ESCAPE_KEY]: true } }, 10), true);
  assert.equal(escapeAsserted({ body: SHORT, data: { [ESCAPE_KEY]: true } }), null);
});

test('the key is a constant, so a consumer joins on it rather than on a spelling', () => {
  assert.equal(ESCAPE_KEY, 'wake_truncation_accepted');
});
