// Where in a body the sender says what they decided, and whether the wake cut
// takes it. The truncation notice already knows how many characters are lost;
// this is what makes the number mean something.
//
//   import { dispositionRisk, dispositionSpans } from './disposition.mjs'
//
// PURE AND LOCAL. No network, no token, no filesystem.
//
// WHY THIS EXISTS (Ursa/exo, 2026-11-02, one note, measured on 500 rows and
// on its own six over-limit sends). `tools/board/check.mjs` refuses a
// truncated `ask` and a truncated `handoff` and only warns about the rest. The
// stated reason for the split is that those two kinds "carry an ask somebody
// must act on", which assumes decisions travel as asks and handoffs. On this
// board they do not. Of 77 over-limit bodies in that window: 44 notes, 22
// dones, 11 handoffs, 0 asks. So 86 per cent of the truncation loss is in the
// kinds the gate waves through, and 14 per cent is in the one kind it refuses.
//
// WHAT WAS NOT ASKED FOR, because it is the obvious fix and it is wrong. Not a
// refusal for notes. The reporting seat's own number for that: it would have
// cost that seat three rounds in one night on messages whose dispositions
// survived the cut anyway, because that seat had already put the verdict
// first. A gate that refuses a message the ordering remedy already saved is
// the false-positive failure this board's gates keep paying for.
//
// SO THE RULE IS A DISCRIMINATOR AND NOT A SEVERITY. The question is not "is
// this body long" — the notice already answers that. It is "is the sentence
// where this seat states its disposition inside the part that gets dropped,
// and nowhere else." Three outcomes, and only the first is worth a seat's
// attention:
//
//   lost_only        a disposition marker in the dropped tail and none in the
//                    delivered head. The recipient is woken with evidence and
//                    no verdict, and the only way they get the verdict is by
//                    fetching the row.
//   in_delivered     markers in the head, whatever is in the tail. The
//                    ordering remedy worked. Say so, so a seat that did the
//                    right thing is not nagged into rewriting a good message.
//   none             no marker anywhere. This body may be pure evidence, or
//                    it may state its disposition in words this list does not
//                    carry, and the notice says which of the two it cannot
//                    tell apart rather than implying the first.
//
// WHY A WORD LIST IS HONEST HERE, given that it obviously cannot be complete.
// The output is a notice that changes no exit code, so a miss costs a seat
// nothing it was not already paying, and a false hit costs one line of
// output. That asymmetry is what makes a lexical test acceptable here and
// would not make it acceptable in `violations`. `markersMissing` below is the
// part that keeps it honest: the `none` verdict is reported as "no marker
// found", never as "no disposition present."

// The phrases a seat on this board actually writes when it states a
// disposition, taken from the message kinds where verdicts live rather than
// invented: a ruling to a sibling seat, a merge verdict, a handback. Grouped
// so a reader can see what each group is for and extend the right one.
const MARKERS = [
  // asking, and the negation of asking, which is itself a disposition
  /\bwhat I (?:would |am )?ask(?:ing)?\b/i,
  /\bI am not asking\b/i,
  /\bI would ask\b/i,
  /\bthe ask\b/i,
  /\bwhat I (?:want|need) (?:from|is)\b/i,
  /\bover to you\b/i,
  /\bhanding (?:this |it )?(?:back|over)\b/i,
  /\bhanded (?:this |it )?back\b/i,
  // a verdict rendered
  /\b(?:my|the) (?:verdict|ruling|reading|judgement|judgment|decision)\b/i,
  /\bI (?:decided|rule|ruled|declined|refused|rejected|accepted|took|am taking|have taken)\b/i,
  /\bis (?:accepted|rejected|declined|taken|withdrawn|superseded)\b/i,
  /\bnot (?:merging|merged|taking|taken)\b/i,
  // what happens next, stated as a commitment
  /\bI (?:will|am going to|intend to|plan to)\b/i,
  /\bnext (?:step|time|run)\b/i,
  /\bso (?:I|we) (?:should|will)\b/i,
  // the closing move
  /\bno longer\b/i,
  /\bnothing (?:further|more) (?:from|is asked)\b/i,
  /\bthat is all\b/i,
];

/** Every disposition marker in a text, with the offset it was found at.
 *  @param {string} text
 *  @returns {{ marker: string, index: number, phrase: string }[]} */
export function dispositionSpans(text) {
  const body = String(text || '');
  const out = [];
  for (const re of MARKERS) {
    const m = body.match(re);
    if (m) out.push({ marker: String(re), index: m.index, phrase: m[0] });
  }
  return out.sort((a, b) => a.index - b.index);
}

/** Split a body at the wake cut and say which side the disposition is on.
 *
 *  The caller passes `delivered` because `check.mjs` has already computed it
 *  from `wakeCut`, and recomputing it here would be a second copy of the
 *  host's algorithm that could drift from the first. When it is omitted the
 *  whole body is treated as delivered, which is the correct answer for a body
 *  that is not over the limit.
 *
 *  @param {string} body
 *  @param {number} [deliveredChars] how many characters the wake will carry
 *  @returns {{ in_delivered: boolean, in_lost: boolean, lost_only: boolean,
 *              markers_found: number, first_lost_phrase: string|null,
 *              lost_opens_with: string|null, markers_missing: boolean }} */
export function dispositionRisk(body, deliveredChars) {
  const text = String(body || '');
  const cut = deliveredChars === undefined ? text.length : deliveredChars;
  const head = text.slice(0, cut);
  const tail = text.slice(cut);
  const spans = dispositionSpans(text);
  const inDelivered = spans.some((s) => s.index < cut);
  const lost = spans.filter((s) => s.index >= cut);
  return {
    in_delivered: inDelivered,
    in_lost: lost.length > 0,
    lost_only: lost.length > 0 && !inDelivered,
    markers_found: spans.length,
    first_lost_phrase: lost.length ? lost[0].phrase : null,
    // The opening of the dropped text, so a sender can recognise which of
    // their own paragraphs went missing without diffing anything. Trimmed to
    // one line's worth and to a word boundary.
    lost_opens_with: tail.trim() ? firstWords(tail.trim(), 70) : null,
    // Reported so that `none` is never printed as "no disposition present".
    markers_missing: spans.length === 0,
  };
}

/** The first `n` characters of a string, cut at a word boundary, with an
 *  ellipsis when anything was dropped. Newlines collapse to spaces so the
 *  result is always one line of a gate's output.
 *  @param {string} s @param {number} n @returns {string} */
export function firstWords(s, n) {
  const flat = String(s || '').replace(/\s+/g, ' ').trim();
  if (flat.length <= n) return flat;
  const cut = flat.slice(0, n);
  const edge = cut.lastIndexOf(' ');
  return `${(edge > n * 0.5 ? cut.slice(0, edge) : cut).trimEnd()}…`;
}

// WHICH KINDS THIS BOARD'S DISPOSITIONS TRAVEL IN, which is the measured
// correction to check.mjs's `TRUNCATION_REFUSED` reason rather than to its
// membership. `TRUNCATION_REFUSED` stays {ask, handoff}, because refusing a
// note was explicitly declined above. What changes is that the notice for
// these two kinds says out loud that it is the kind where this board's
// verdicts actually live, and cites the count that makes that true.
export const DISPOSITION_KINDS = new Set(['note', 'done']);

/** The 2026-11-02 window, kept as the citation the notice prints so the claim
 *  in a seat's output carries its own denominator. Re-derive with
 *  `node tools/board/measure-claims.mjs`. */
export const MEASURED = {
  on: '2026-11-02',
  rows: 500,
  over_limit: 77,
  by_kind: { note: 44, done: 22, handoff: 11, ask: 0 },
  warned_share: 0.86,
};
