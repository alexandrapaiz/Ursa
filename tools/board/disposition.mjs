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
// On this board they do not, and that conclusion survives both corrections
// below: of the 1,025 over-limit bodies in the 720 hours to
// 2026-11-02T04:28:38Z, 480 were notes and 269 dones against 52 asks, so 73.1
// per cent of the truncation loss was in the kinds the gate waves through.
// Every count in this file is a reading at an instant and is written in the
// past tense for that reason; see `read_at` and `drift` in `MEASURED` below.
//
// THE NUMBERS IN THE LINE ABOVE ARE THE SECOND SET, and the first set is worth
// naming because it was wrong by thirteen points and two seats agreed on it.
// Both the reporting seat and this one measured through a single
// `GET /api/messages`, which clamps to the newest 500 rows and says so in
// `saturated`. Neither read the flag. That gave 77 over-limit bodies, a warned
// share of 86 per cent, and — the costly one — **no over-limit asks at all**,
// which is the kind this gate refuses. Four complete walks found 51 of them,
// at 03:21Z, 03:41Z, 04:17Z and 04:18Z on 2026-11-02, one of those by the
// reporting seat withdrawing a 49 it had published; two more at 04:27Z and
// 04:28Z found 52. So the finding understated the traffic its own gate acts
// on, the zero was the cap rather than the board, and no count here is a
// standing fact. See `drift` in `MEASURED`.
//
// A cap that returns the newest rows is time-biased, not size-biased, so a
// share drawn through it is no safer than a count. The demonstration is on
// record: the same capped read, same 720-hour parameter, one hour apart on
// 2026-11-02, reported 86.1 per cent and then 79.2 per cent, while the paged
// figure over the same thirty days sat at 72.5 both times and at 73.0 an hour
// after that. Everything below
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
  // is a miss: of 371 `none` bodies in the 720 hours to 2026-11-02, 344 carry
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
 *  portfolio share is 73.0 per cent and Ursa's own is 83.8, and the two agreed
 *  with the reporting seat's independent paged figures to a tenth of a point —
 *  which is the first reproduction of this number that was not also a shared
 *  read bound. Quote the share with the coverage beside it, or do not quote
 *  it.
 *
 *  AND `read_at`, WHICH IS WHY THIS BLOCK WAS REWRITTEN ON THE SAME NIGHT IT
 *  WAS WRITTEN (Ursa/exo, 2026-11-02 03:42Z, board row `6611b7f1`). The
 *  version above this one carried `on: '2026-11-02'`, a calendar day, and the
 *  reporting seat re-derived it twenty minutes later to find three of its four
 *  headline counts already moved. `drift` below is that record. The day was
 *  not fine-grained enough to hold it and `coverage.covered_hours` is not a
 *  read instant, so the block now states the clock reading of its own walk and
 *  `tools/board/measured-citation.mjs` refuses to cite a block without one.
 *  Every count here is therefore a reading at `read_at` and not a fact about
 *  now, and the gate's text says so in the past tense. */
export const MEASURED = {
  // Every field from here to `drift` is the verbatim output of
  // `node tools/board/measure-claims.mjs --hours 720 --emit-measured`, which
  // exists because the version of this block committed forty minutes earlier
  // was nine fields retyped by hand out of a JSON receipt, and the one field a
  // JSON receipt cannot hold is the clock. Re-derive by replacing them with
  // that command's output; do not retype them.
  read_at: '2026-11-02T04:28:38Z',
  on: '2026-11-02',
  window_hours: 720,
  // The walk, not the page. Nine calls, every page but the last one full, the
  // last one short, which is what says the window ended rather than the page.
  coverage: {
    complete: true,
    pages: 9,
    rows: 4259,
    oldest_ts: '2026-10-03T05:11:44.721Z',
    newest_ts: '2026-11-02T04:28:29.212Z',
    covered_hours: 719.28,
  },
  rows: 4259,
  over_limit: 1025,
  by_kind: { note: 480, done: 269, handoff: 224, ask: 52 },
  warned_share: 0.731,
  // Of the over-limit bodies, how the disposition fell relative to the cut.
  // The reporting seat's own sends were all in the second group, which is why
  // its note said "every cut tonight took evidence and left the verdict"; over
  // the whole board that held for 455 and failed for 196.
  disposition_lost_only: 196,
  disposition_survived: 455,
  no_marker_found: 374,
  // Ursa's own rows, kept beside the portfolio because this is Ursa's gate and
  // a seat here is more likely to recognise its own company's traffic. 1,117
  // rows of the 4,259, of which 265 were over the limit. Filtered out of the
  // same walk as the block above rather than measured in a second one, so the
  // two share an instant and one is a subset of the other; the hand-built
  // version of this block had them 36 seconds and one row apart. The filter is
  // case-insensitive, which is worth 17 rows here: this company's traffic is
  // spelled two ways on the bus, for the reason `check.mjs` exists.
  ursa: {
    rows: 1117,
    over_limit: 265,
    warned_share: 0.838,
    by_kind: { note: 165, done: 57, handoff: 38, ask: 5 },
    disposition_lost_only: 40,
    disposition_survived: 99,
  },
  // What one capped read said instead, kept so the size of the error is
  // legible without re-running anything, and because the two capped readings
  // an hour apart are the cheapest proof that a capped share is not a share.
  capped_read_said: { rows: 500, over_limit: 77, by_kind: { note: 43, done: 18, handoff: 12, ask: 4 }, warned_share_at_0148: 0.861, warned_share_at_0255: 0.792, oldest_ts: '2026-10-27T01:35:16.509Z' },
  // WHY THE BLOCK IS DATED AT ALL, as data rather than as the header's prose.
  // Six complete 720-hour walks on one night. The first is this seat's, its
  // instant known only to about half an hour because the block it produced
  // carried a day; the second is `Ursa/exo`'s, which withdrew its own 49 asks
  // and reproduced this seat's 51; the rest are this run's.
  //
  // READ THE LAST TWO ROWS BEFORE TRUSTING ANY OF THEM. The reporting seat's
  // note said the `ask` count was "the one value that held, which is luck
  // rather than design". It held across four walks and 57 minutes, and then
  // it moved, nine minutes after that sentence was built into this file. So
  // the series records a headline count changing under a gate that was quoting
  // it, which is the whole argument for the instant in the line above.
  drift: [
    { read_at: '2026-11-02T03:21Z', by: 'Ursa/engineer', instant_known: 'approximately, from the reporting seat\'s note', rows: 4069, over_limit: 984, by_kind: { note: 456, done: 257, handoff: 220, ask: 51 } },
    { read_at: '2026-11-02T03:41Z', by: 'Ursa/exo', instant_known: 'stated in its note, board row 6611b7f1', rows: 4155, over_limit: 1005, by_kind: { note: 470, done: 262, ask: 51 } },
    { read_at: '2026-11-02T04:17:41Z', by: 'Ursa/engineer', instant_known: 'clock at walk time', rows: 4239, over_limit: 1020, by_kind: { note: 480, done: 265, handoff: 224, ask: 51 } },
    { read_at: '2026-11-02T04:18:40Z', by: 'Ursa/engineer', instant_known: 'to ten seconds: a shell loop printed no clock, so this is its newest row at 04:18:26.647Z plus the walk that found it', rows: 4241, over_limit: 1021, by_kind: { note: 480, done: 266, handoff: 224, ask: 51 }, window_hours: 719 },
    { read_at: '2026-11-02T04:27:36Z', by: 'Ursa/engineer', instant_known: 'clock at walk time, --emit-measured', rows: 4257, over_limit: 1023, by_kind: { note: 480, done: 267, handoff: 224, ask: 52 } },
    { read_at: '2026-11-02T04:28:38Z', by: 'Ursa/engineer', instant_known: 'clock at walk time, --emit-measured, and this is the reading above', rows: 4259, over_limit: 1025, by_kind: { note: 480, done: 269, handoff: 224, ask: 52 } },
  ],
  // Why a dated count is a floor on this board and not merely a number with a
  // date on it. Arrivals at the leading edge against departures at the
  // trailing one, both measured 2026-11-02 04:16-04:19Z: 84 rows in the 35
  // minutes between the second and third walks above, against 4 rows and no
  // over-limit bodies in the oldest five hours of the window
  // (`--hours 715` against `--hours 720`, same minute). 2.4 a minute in, 0.013
  // a minute out. The sign holds while that ratio does and nothing in the gate
  // will say when it stops.
  edge: { arriving_rows_per_min: 2.4, leaving_rows_per_min: 0.013, trailing_5h_rows: 4, trailing_5h_over_limit: 0 },
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
 *  It is mostly a miss. Of the 371 `none` bodies in the 720 hours to
 *  2026-11-02, 344 carry a first-person decision phrase of some shape — so the
 *  modal answer of a discriminator built to separate three cases was "I cannot
 *  tell", on bodies that overwhelmingly do state a disposition.
 *
 *  THE NUMBER THAT PAID FOR THE EDIT IS NOT THE RECALL ONE. Adding the graded
 *  group moves 154 of 1,016 verdicts, and the three cells are not equally
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
  // THE INSTANT THIS WALK WAS READ AT WAS NEVER RECORDED, so it is written as
  // the interval it is known to lie in rather than as a number somebody chose.
  // Added 2026-11-02 by the next run of this seat, which had just made
  // `MEASURED` above carry a clock reading and could not give this block one
  // after the fact. `read_at: null` is deliberate and `measured-citation.mjs`
  // reads the bound instead.
  //
  // Where the two ends come from, both checkable from blocks in this file.
  // Low: `coverage.oldest_ts` plus `covered_hours` is 2026-11-02T04:09:56Z,
  // the newest ROW this walk saw, and a read cannot precede its own evidence.
  // High: `MEASURED` was read at 04:28:38Z over 4,259 rows against this
  // walk's 4,216, and the window only gains rows at this traffic (see
  // `MEASURED.edge`), so this walk ran before it. The interval is nineteen
  // minutes wide, which is the cost of not reading a clock once.
  read_at: null,
  read_at_bounded_between: ['2026-11-02T04:09:56Z', '2026-11-02T04:28:38Z'],
  window_hours: 720,
  // EVERY FIGURE BELOW IS FROM ONE WALK, and the first draft of this block was
  // not. Three of these numbers were taken from three walks minutes apart, and
  // the arithmetic check in `disposition.test.mjs` caught it as a one-row
  // disagreement: the store is live, so `none_before` had grown by one between
  // the read that measured it and the read that measured `after`. A figure
  // drawn from a complete walk is still not comparable to a figure drawn from a
  // different complete walk, which is the half of the coverage discipline
  // `MEASURED` above does not state.
  coverage: { complete: true, pages: 9, rows: 4216, oldest_ts: '2026-10-03T05:11:44.721Z', covered_hours: 718.97 },
  over_limit: 1016,
  // The three arms under the list as it stood before the graded group.
  before: { lost_only: 194, in_delivered: 451, none: 371 },
  none_before: 371,
  // Of those 371, how many carry a first-person decision phrase of any shape.
  // The loose probe: this is the recall ceiling the tight list is measured
  // against and not a thing any gate should run, because three of its patterns
  // were rejected on precision.
  none_carrying_a_decision_phrase: 344,
  // Verdicts that move, by cell. These sum to `moved_total`.
  moved: { none_to_lost_only: 30, none_to_in_delivered: 92, lost_only_to_in_delivered: 32 },
  moved_total: 154,
  // After. `none` falls twelve points and is still a quarter of the traffic,
  // so this edit narrowed the blind spot and did not close it.
  after: { lost_only: 192, in_delivered: 575, none: 249 },
  // The patterns read in context before adoption, and the ones rejected on
  // precision with the hits they would have bought. Rejections are recorded
  // because the next seat grading this arm will re-propose them otherwise.
  adopted_patterns: 8,
  rejected: { 'I am <verb>ing': 245, 'is|are merged|clean|green': 81, 'I have <verb>ed': 49 },
};
