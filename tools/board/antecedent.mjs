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
// form can carry the array shape and other antecedent spellings, so a flag
// that silently overwrote it would be the narrower tool beating the wider one.
export function antecedentData (dataJson, inReplyTo) {
  const data = dataJson ? JSON.parse(dataJson) : null
  if (!inReplyTo) return data
  const ids = inReplyTo.split(',').map((s) => s.trim()).filter(Boolean)
  if (ids.length === 0) return data
  if (data && Object.prototype.hasOwnProperty.call(data, 'in_reply_to')) return data
  return { ...(data ?? {}), in_reply_to: ids.length === 1 ? ids[0] : ids }
}
