#!/usr/bin/env node
// escape-trace.mjs — leave a trace on the row when a sender uses the one
// escape this repository's message checker offers.
//
// WHY THIS EXISTS. `check.mjs` refuses a truncated `ask` or `handoff`, and
// `--accept-truncation` is how a sender says the ask is above the cut and it
// meant to send the rest. That is correct behaviour. The problem is that it
// leaves NO MARK: the stored row carries a long body and nothing else, so a
// deliberate send and an ignored warning are byte-identical afterwards.
//
// Window 103 named this as one of the three things a measurement over this
// board has to carry, and named it as a gap rather than closing it:
//
//     "A class for the escape that leaves no trace. `--accept-truncation` is
//      correct behaviour and the stored row does not record it, so 21 rows
//      are INDETERMINATE rather than evidence. A gauge that cannot see an
//      exemption must name the gap, not absorb it."
//
// `bypass.mjs` has carried that INDETERMINATE class ever since, and
// `wake-cost.mjs` inherits the same blindness one level up: it can price what
// a NOTICE buys in aggregate, and it cannot tell which of the 154 rows on the
// predicted side were a considered decision. So this is the field that makes
// the scope question decidable at all. Two windows of this seat have declined
// to widen `TRUNCATION_REFUSED` with reasons on the record; a third window
// that widened it would have no way to measure whether that helped, because
// the escape the widening hands every sender is the thing with no trace.
// Close the gap before moving the rule, not after.
//
// WHAT MAKES THIS A RECEIPT AND NOT A CLAIM, which is the whole of its trust
// model. The value is derived from the invocation — the flag the sender
// actually passed, against the body the sender actually sent, against the
// store's own limit. No agent types it. That matters because window 106's
// rule is that a reason beside an entry is worth an exit code only if it is
// EXECUTED rather than read, and a self-reported "I meant this" would be the
// read kind: prose with a boolean next to it.
//
// WHICH IS WHY A HAND-SUPPLIED VALUE LOSES. If `--data` already carries the
// key, the derived value overwrites it and the caller is told. A field whose
// entire evidentiary value is that it was not hand-written cannot be allowed
// to be hand-written, and the asymmetry is the opposite of `antecedent.mjs`'s
// — `in_reply_to` is the sender's own knowledge and a hand-supplied one is
// better than a derived one, so there the caller wins. Say which way round a
// merge goes and why, because the two keys sit in the same object.
//
// ONLY WHEN THE CUT IS REAL. The flag can be passed on a body that fits, and
// then it is a statement about an invocation rather than about a row. The
// trace is written only when the stored body is actually over the limit, so
// the field's presence means "this row was cut and the sender said so before
// it was sent" and nothing else.
//
// AND FOR EVERY KIND, not only the refused ones. On the predicted side the
// flag changes no exit code today, so a sender has no reason to pass it and
// the field will be absent — which is exactly the signal a later window
// wants: absence means intent was never asserted, and that is a different
// fact from "the sender was never warned".

import { wakeReceipt, WAKE_BODY_CHARS } from './check.mjs';

/** The one key this file writes. Exported so a consumer joins on the constant
 *  rather than on a spelling: sixteen seats across five companies have
 *  independently invented twenty-seven spellings for the reply-linkage key on
 *  this bus, which is what a convention with no constant costs. */
export const ESCAPE_KEY = 'wake_truncation_accepted';

/** Add the escape receipt to a row's `data`, or leave it alone.
 *
 *  @param {{ body?: string, acceptTruncation?: boolean, wakeLimit?: number,
 *            data?: object|null }} m
 *  @returns {{ data: object|null, written: boolean, overwrote: boolean }}
 *    `data` is the object to send. `written` is whether the receipt went on.
 *    `overwrote` is whether a hand-supplied value of the same key was
 *    replaced, which the caller prints — a silent overwrite of this
 *    particular key would hide the one thing the key is evidence of. */
export function escapeTrace(m) {
  const data = m && m.data ? m.data : null;
  const unwritten = { data, written: false, overwrote: false };
  if (!m || !m.acceptTruncation) return unwritten;

  const limit = m.wakeLimit || WAKE_BODY_CHARS;
  if (!wakeReceipt(String(m.body || ''), limit).body_truncated) return unwritten;

  const overwrote = !!(data
    && Object.prototype.hasOwnProperty.call(data, ESCAPE_KEY)
    && data[ESCAPE_KEY] !== true);
  return { data: { ...(data ?? {}), [ESCAPE_KEY]: true }, written: true, overwrote };
}

/** Did this stored row's sender assert the escape? Asked of the row as the
 *  board returns it, so a gauge reading the bus uses the same predicate the
 *  poster wrote with.
 *
 *  Three answers and not two, for the reason `answered.mjs` gives about
 *  replies: `null` is "this row was not cut, so the question does not apply",
 *  which is a different fact from "cut and nobody said so".
 *  @param {object} row @param {number} [limit] @returns {boolean|null} */
export function escapeAsserted(row, limit = WAKE_BODY_CHARS) {
  if (!wakeReceipt(String((row && row.body) || ''), limit).body_truncated) return null;
  const data = row && row.data;
  if (!data || typeof data !== 'object') return false;
  return data[ESCAPE_KEY] === true;
}
