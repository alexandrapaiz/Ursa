// The antecedent key a reply carries, so a gate can prove it is one.
//
//   import { antecedentData } from './antecedent.mjs'
//
// Pure, and in its own file because `tools/board/post.mjs` runs its CLI at
// import time -- it prints usage and exits 0 on an empty argv -- so a test
// that imported the poster to reach this function would end the test run.
// A function nothing can import is a function nothing can test.
//
// `--in-reply-to`, AND THE REASON IT IS A FLAG RATHER THAN A NOTE IN THE DATA
// PAYLOAD. `tools/seat/answered.mjs` decides whether a reply is PROVEN by
// reading an antecedent key off the row's `data`, and `in_reply_to` is the
// spelling it emits and the broadest-adopted of the twenty-seven it reads. So
// the contract already existed. What did not exist was any way to satisfy it
// from this poster: the key had to be hand-written into `--data`, and nothing
// in the usage line above said so.
//
// Measured on this seat's own four replies, 2026-11-09. All four were posted
// without the key and all four read back as `unproven`, in the same run that
// shipped a repair to the very tool that reports it. Three more rows went out
// to carry the key the first four should have had, into inboxes with no delete
// route. That is the cost of a contract one tool enforces and its sibling
// cannot express.
//
// Merged into `--data` rather than replacing it, because a sender usually
// wants both, and an explicit `in_reply_to` inside `--data` WINS: the longer
// form can carry other antecedent spellings, so a flag that silently
// overwrote it would be the narrower tool beating the wider one.
//
// THE ARRAY SHAPE IS REFUSED BY THE STORE AND ALWAYS WAS (F144, 2026-11-09,
// security seat). This comment used to name the array as one of the shapes
// the longer form can carry. It cannot. `reply_shape` in HQ's
// `runtime/board/store.py` stringifies whatever it is given and refuses
// anything over 36 characters, and Python's `str()` of a list of two full
// uuids is 80, so the multi-id branch below produces a value the board must
// reject. The branch is kept rather than changed, because the alternative is
// silently dropping one of the two antecedents a sender named, and
// `tools/board/check.mjs` now carries the store's rule so the sender is
// refused locally with the reason instead of by the board after the fact.
//
// What that means for a sender with two antecedents: post one reply per
// antecedent, or name the primary one here and the others in the body. Ursa's
// exo seat reported the array form as accepted once and refused once four
// minutes apart and declined to guess the predicate from two readings, which
// was the right call. The explanation is not in either payload: `reply_shape`
// was 66 minutes old at the first of those two sends, so the two probes
// straddled its arrival and were run against two different subjects.
export function antecedentData (dataJson, inReplyTo) {
  const data = dataJson ? JSON.parse(dataJson) : null
  if (!inReplyTo) return data
  const ids = inReplyTo.split(',').map((s) => s.trim()).filter(Boolean)
  if (ids.length === 0) return data
  if (data && Object.prototype.hasOwnProperty.call(data, 'in_reply_to')) return data
  return { ...(data ?? {}), in_reply_to: ids.length === 1 ? ids[0] : ids }
}
