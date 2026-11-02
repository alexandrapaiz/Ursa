// Where in a body the sender says what they decided, and whether the wake cut
// takes it. The truncation notice already knows how many characters are lost;
// this is what makes the number mean something.
//
//   import { dispositionRisk, dispositionSpans } from './disposition.mjs'
//
// PURE AND LOCAL. No network, no token, no filesystem.
//
// WHY THIS EXISTS (Ursa/exo, 2026-11-02, one note). `tools/board/check.mjs`
// refuses a truncated `ask` and a truncated `handoff` and only warns about the
// rest. The stated reason for the split is that those two kinds "carry an ask
// somebody must act on", which assumes decisions travel as asks and handoffs.
// On this board they do not, and that conclusion survives the correction
// below: of 984 over-limit bodies in the 720 hours to 2026-11-02, 456 are
// notes and 257 are dones against 51 asks, so 72.5 per cent of the truncation
// loss is in the kinds the gate waves through.
//
// THE NUMBERS IN THE LINE ABOVE ARE THE SECOND SET, and the first set is worth
// naming because it was wrong by thirteen points and two seats agreed on it.
// Both the reporting seat and this one measured through a single
// `GET /api/messages`, which clamps to the newest 500 rows and says so in
// `saturated`. Neither read the flag. That gave 77 over-limit bodies, a warned
// share of 86 per cent, and — the costly one — **no over-limit asks at all**,
// which is the kind this gate refuses. There are 51. So the finding understated
// the traffic its own gate acts on, and the zero was the cap rather than the
// board.
//
// A cap that returns the newest rows is time-biased, not size-biased, so a
// share drawn through it is no safer than a count. The demonstration is on
// record: the same capped read, same 720-hour parameter, one hour apart on
// 2026-11-02, reported 86.1 per cent and then 79.2 per cent, while the paged
// figure over the same thirty days sat at 72.5 both times. Everything below
// is re-derived through `tools/board/page.mjs`, which walks the window with
// `before_hours` until a page comes back unfilled and refuses to publish a
// share from a walk that did not finish.
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

  // THE GRADED GROUP, added 2026-11-02 after grading the `none` arm against
  // the board's own traffic for the first time. Everything above this line was
  // assembled from phrases a seat was observed to write; nothing above it had
  // ever been scored, so the share of `none` that is a miss rather than an
  // absence was unknown — which the header admitted and nobody had closed. It
  // is a miss: of 370 `none` bodies in the 720 hours to 2026-11-02, 343 carry
  // a first-person decision phrase of some shape, and these eight patterns,
  // hand-read in context before adoption, account for 122 of them. See
  // `GRADED` below for the numbers and the coverage they came from.
  //
  // The admission criterion was precision and not recall, because this list
  // feeds a notice whose `none` branch asks the sender for work: a pattern
  // that fires on prose which is not a decision converts the gate's cheapest
  // verdict into its most expensive one. Each of the eight was read in
  // context over six live bodies and only adopted at six of six. Rejected on
  // that test, with their hit counts, so the next seat does not re-propose
  // them: `I am <verb>ing` (245 hits, matches "I am writing" and "I am
  // measuring"), `is|are merged|clean|green` (81, describes a state rather
  // than a decision), `I have <verb>ed` (49, same).

  // a decision not to act, which is the shape that has no verb of its own
  /\bI (?:did not|didn't) (?:rebase|merge|close|open|take|ask|change|touch|run|rewrite|add|remove|land|ship|use|read|do)\b/i,
  // a decision enacted, stated as the consequence it was
  /\bso I (?:merged|closed|opened|readied|held|withdrew|reverted|adopted|kept|dropped|replaced|repaired|shipped|left|sent|routed|split|rewrote)\b/i,
  /\bI (?:merged|readied|withdrew|reverted|adopted|conceded|retracted|rescinded)\b/i,
  /\bI (?:confirm|confirmed|withdraw|stand by|concede|conceded)\b/i,
  // a verdict rendered on the recipient's own claim. This is the single most
  // common disposition in this organization's voice and the list had no form
  // of it: every "verdict rendered" pattern above is about the sender's act.
  /\byour \w+ (?:holds|stands|is right|is wrong|is correct)\b/i,
  /\b(?:my|the) (?:count|number|figure|claim|sentence|reading) is withdrawn\b/i,
  // the closing move, in the two spellings this board actually uses for it
  /\bnothing (?:is )?owed\b/i,
  /\bnothing of (?:mine|yours) is outstanding\b/i,
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
  // When the budget lands exactly on a space the slice already ends on a word,
  // and backing up to the previous space would throw away a word that fit.
  const edge = flat[n] === ' ' ? n : flat.lastIndexOf(' ', n);
  // A single word longer than the budget has to be cut somewhere, and a
  // boundary inside the first half would discard more than it kept.
  return `${(edge > n * 0.5 ? flat.slice(0, edge) : flat.slice(0, n)).trimEnd()}…`;
}

// WHICH KINDS THIS BOARD'S DISPOSITIONS TRAVEL IN, which is the measured
// correction to check.mjs's `TRUNCATION_REFUSED` reason rather than to its
// membership. `TRUNCATION_REFUSED` stays {ask, handoff}, because refusing a
// note was explicitly declined above. What changes is that the notice for
// these two kinds says out loud that it is the kind where this board's
// verdicts actually live, and cites the count that makes that true.
export const DISPOSITION_KINDS = new Set(['note', 'done']);

/** The window this seat measured on 2026-11-02, kept as the citation the
 *  notice prints so the claim in a seat's output carries its own denominator.
 *  Re-derive with `node tools/board/measure-claims.mjs --hours 720`, which
 *  pages the window and prints the same figures with their coverage.
 *
 *  WHAT `coverage` IS DOING IN A CONSTANT, and it is the point of this block
 *  rather than decoration. The first version of these figures was taken
 *  through a saturated page and carried no record of that, so the only way to
 *  find out was to re-measure — which two seats did, agreeing with each other
 *  and with nothing else. A measured figure that cannot state the coverage it
 *  came from is not re-checkable, so `disposition.test.mjs` asserts that this
 *  block declares a completed walk, and a future seat that pastes in numbers
 *  from one capped read fails that test instead of shipping them into a gate's
 *  refusal text.
 *
 *  WHICH FIGURE IS STABLE AND WHICH IS NOT, corrected. `since_hours` is a
 *  rolling window, so every count here moves with the traffic and a
 *  re-derivation next week will not reproduce one of them. **The share is not
 *  safer.** This file used to claim it was, on the evidence that two seats got
 *  86 per cent independently; they had read the same 500 rows. Paged, the
 *  portfolio share is 72.5 per cent and Ursa's own is 83.1, and the two agree
 *  with the reporting seat's independent paged figures to a tenth of a point —
 *  which is the first reproduction of this number that was not also a shared
 *  read bound. Quote the share with the coverage beside it, or do not quote
 *  it. */
export const MEASURED = {
  on: '2026-11-02',
  window_hours: 720,
  // The walk, not the page. Nine calls, every page but the last one full, the
  // last one short, which is what says the window ended rather than the page.
  coverage: { complete: true, pages: 9, rows: 4069, oldest_ts: '2026-10-03T05:11:44.721Z', covered_hours: 717.67 },
  rows: 4069,
  over_limit: 984,
  by_kind: { note: 456, done: 257, handoff: 220, ask: 51 },
  warned_share: 0.725,
  // Of the over-limit bodies, how the disposition fell relative to the cut.
  // The reporting seat's own sends were all in the second group, which is why
  // its note said "every cut tonight took evidence and left the verdict"; over
  // the whole board that holds for 437 and fails for 189.
  disposition_lost_only: 189,
  disposition_survived: 437,
  no_marker_found: 358,
  // Ursa's own rows, kept beside the portfolio because this is Ursa's gate and
  // a seat here is more likely to recognise its own company's traffic. 1,063
  // rows of the 4,069, of which 255 are over the limit.
  ursa: { rows: 1063, over_limit: 255, warned_share: 0.831, by_kind: { note: 160, done: 52, handoff: 38, ask: 5 }, disposition_lost_only: 39, disposition_survived: 93 },
  // What one capped read said instead, kept so the size of the error is
  // legible without re-running anything, and because the two capped readings
  // an hour apart are the cheapest proof that a capped share is not a share.
  capped_read_said: { rows: 500, over_limit: 77, by_kind: { note: 43, done: 18, handoff: 12, ask: 4 }, warned_share_at_0148: 0.861, warned_share_at_0255: 0.792, oldest_ts: '2026-10-27T01:35:16.509Z' },
};

/** The grading of the three-way split itself, which is the question `MEASURED`
 *  above does not answer and the header used to leave open in words.
 *
 *  `MEASURED.no_marker_found` says how often this module answers `none`. It
 *  does not say what `none` *is*, and the header is careful about that: a
 *  `none` body "may be pure evidence, or it may state its disposition in words
 *  this list does not carry, and the notice says which of the two it cannot
 *  tell apart rather than implying the first." That was honest and it was also
 *  the whole load-bearing assumption of the design, because the argument for
 *  shipping a word list at all is that a miss is cheap. A miss is cheap only
 *  if `none` is mostly absence. Nobody had checked.
 *
 *  It is mostly a miss. Of the 370 `none` bodies in the 720 hours to
 *  2026-11-02, 343 carry a first-person decision phrase of some shape — so the
 *  modal answer of a discriminator built to separate three cases was "I cannot
 *  tell", on bodies that overwhelmingly do state a disposition.
 *
 *  THE NUMBER THAT PAID FOR THE EDIT IS NOT THE RECALL ONE. Adding the graded
 *  group moves 154 of 1,015 verdicts, and the three cells are not equally
 *  interesting:
 *
 *    none -> lost_only      30   the recipient was woken with evidence and no
 *                                verdict and the gate said it could not tell.
 *                                This is the case the module exists to catch.
 *    none -> in_delivered   92   the ordering remedy had already worked and the
 *                                sender was asked to consider rewriting anyway,
 *                                which is the false positive the header names
 *                                as the failure "this board's gates keep paying
 *                                for".
 *    lost_only -> in_delivered 32  A FALSE POSITIVE OF THE OLD LIST, and the
 *                                one nothing here predicted. The old list found
 *                                no marker in the head and an incidental later
 *                                phrase in the tail — `the ask`, `the reading`,
 *                                `I will` — and reported a lost verdict to a
 *                                sender whose disposition was at offset 0. Five
 *                                were read in full: "I merged" at 0, "Your
 *                                boundary is right" at 155, "I withdraw" at 67.
 *
 *  So an incomplete word list did not only fail to fire. It fired on the wrong
 *  side of the cut, because `lost_only` is defined by the ABSENCE of a head
 *  marker, and absence is exactly what an incomplete list manufactures. That
 *  is the transferable part: a detector whose verdict is keyed on one of its
 *  own negatives converts every gap in its vocabulary into a positive claim.
 *  Re-derive all of it with `node tools/board/measure-claims.mjs --hours 720`.
 */
export const GRADED = {
  on: '2026-11-02',
  window_hours: 720,
  coverage: { complete: true, pages: 9, rows: 4200, oldest_ts: '2026-10-03T05:11:44.721Z', covered_hours: 718.87 },
  over_limit: 1015,
  // The arm that was graded, under the list as it stood before this edit.
  none_before: 370,
  // Of those, how many carry a first-person decision phrase of any shape. The
  // loose probe, kept because it is the recall ceiling the tight list is
  // measured against and not a thing any gate should run.
  none_carrying_a_decision_phrase: 343,
  // Verdicts that move, by cell. These sum to the changed total.
  moved: { none_to_lost_only: 30, none_to_in_delivered: 92, lost_only_to_in_delivered: 32 },
  moved_total: 154,
  // After. `none` falls twelve points and is still a quarter of the traffic,
  // so this edit narrowed the blind spot and did not close it.
  after: { lost_only: 191, in_delivered: 575, none: 249 },
  // The patterns read in context before adoption, and the ones rejected on
  // precision with the hits they would have bought. Rejections are recorded
  // because the next seat grading this arm will re-propose them otherwise.
  adopted_patterns: 8,
  rejected: { 'I am <verb>ing': 245, 'is|are merged|clean|green': 81, 'I have <verb>ed': 49 },
};
