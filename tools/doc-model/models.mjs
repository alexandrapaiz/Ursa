// The registry this gate reads: for each mechanism, the one executable form,
// and every place in this repository's prose that states a rule about it.
//
// WHAT THIS EXISTS TO CATCH, stated as the event rather than as a principle.
// On 2026-10-24 `docs/agents/runner-facts.md` recorded the board's wake cut
// correctly, from the host's source, including the 60% floor. On 2026-10-26
// the same file, same seat, 3,484 lines further down, recorded it again from
// three samples as "drop whole trailing blocks until the body fits" and said
// that subsumed the earlier reading. It did not. It described the one arm that
// had fired three times. Both statements sat on `main` for six days; the later
// one is the one later windows cited, and two seats then spent a round of
// messages each rediscovering the floor. Nothing in this repository compared
// the two, because nothing could: neither was executable.
//
// So the unit of trust here is not a document. It is a mechanism with exactly
// one executable form, plus a transcription of every prose claim about it,
// each of which is *run* against that form over a shared corpus. A prose
// statement that cannot be transcribed into eight lines of JavaScript is a
// statement too vague to have been worth writing, and saying so is part of
// the gate's job.
//
// WHY TRANSCRIPTIONS AND NOT STRING MATCHING. A gate that greps for stale
// sentences has to be told every wrong sentence in advance, which means it
// only ever catches the mistake somebody already found. Running the model the
// prose describes catches a wrong rule on the day it is written, against
// bodies nobody chose for it.
//
// WHY DATED RECORDS ARE EXEMPT. A learning log entry, an incident, a run doc
// and a security audit all say "this is what I observed on this date". That is
// true forever and correcting it would destroy the record. Only surfaces a
// reader consults to learn *current* behaviour are held to current behaviour.
// The split is declared per surface below, with the reason, because getting it
// wrong in either direction is the whole ballgame: hold the records and the
// gate is unpassable, exempt the registers and the gate is decorative.

/** Normative surfaces: consulted to learn how the system behaves now, so a
 *  rule stated here is a claim about the present and is held to it.
 *
 *  `seat` is who edits the surface, and it is load-bearing rather than
 *  documentation. A gate that fails a run for prose in another seat's register
 *  leaves that run two bad options: edit a file its own charter routes
 *  elsewhere, or go red for something it cannot fix. So a finding on a surface
 *  this run does not own is a warning and is named in a roll-up line, which
 *  keeps the downgrade visible instead of silent. The seat that owns the
 *  surface still gets the finding, by mail rather than by exit code.
 *  `ASC_SEAT` decides which of these is "mine"; absent, nothing is. */
export const NORMATIVE_SURFACES = [
  { prefix: 'docs/agents/runner-facts.md', seat: 'exo',
    why: 'the environment register: what a seat reads to learn the host it runs on' },
  { prefix: 'docs/standards/', seat: 'hq',
    why: 'company standards: binding on every seat in the portfolio, and HQ\'s to edit' },
  { prefix: 'docs/design/', seat: 'any',
    why: 'design docs: the specification a later implementation is built from' },
  { prefix: 'prompts/', seat: 'owner',
    why: 'charters: instructions a seat executes without checking them first, and only the owner\'s merge changes them' },
  { prefix: 'docs/ideas.md', seat: 'any',
    why: 'the ledger: entries are groomed into sprints and built from. Any seat appends; only the owner moves a status' },
  { prefix: 'README.md', seat: 'any',
    why: 'the status surface an outside reader starts at' },
];

/** Dated-record surfaces: each entry is an observation attached to a date and
 *  a window, true as of that date, and is never rewritten. */
export const RECORD_SURFACES = [
  { prefix: 'docs/agents/learning-log.md',
    why: 'per-window observations, append-only; a window cannot learn later facts' },
  { prefix: 'docs/agents/incidents.md',
    why: 'incident records state what was believed at the time, which is the record' },
  { prefix: 'docs/agents/improvements.md',
    why: 'dated proposals with a merged-state field; the proposal is the record' },
  { prefix: 'docs/runs/',
    why: 'one run report per file, never revised after the run ends' },
  { prefix: 'docs/security/',
    why: 'audits are dated findings; a reopened finding is a new audit' },
  { prefix: 'docs/decisions.md',
    why: 'ADRs record a decision and its date; superseding is a new ADR' },
];

/** The block-sum model: `docs/agents/runner-facts.md` §44, 2026-10-26.
 *  "The delivered figure is the largest cumulative paragraph sum that stays
 *  under the limit", with an explicit fall-through only for the case where
 *  the first block alone exceeds the limit.
 *  @param {string} body @param {number} limit @returns {number} delivered */
function blockSum(body, limit) {
  if (body.length <= limit) return body.length;
  const blocks = body.split('\n\n');
  if (blocks[0].length > limit) return limit;   // the stated mid-word case
  let best = 0;
  let cum = 0;
  for (let i = 0; i < blocks.length; i++) {
    cum += blocks[i].length + (i > 0 ? 2 : 0);
    if (cum > limit) break;
    best = cum;
  }
  return best;
}

/** The block-boundary model: the cut always lands on the last blank line at
 *  or before the limit. Stated by `docs/ideas.md`'s 2026-10-27 entry as its
 *  answer ("the cut lands on the last paragraph break at or before the
 *  limit") and by `runner-facts.md` §25's heading ("the cut respects a block
 *  boundary rather than landing at 1500 mid-word"). No floor.
 *  @param {string} body @param {number} limit @returns {number} delivered */
function lastBlockBoundary(body, limit) {
  if (body.length <= limit) return body.length;
  const edge = body.slice(0, limit).lastIndexOf('\n\n');
  return edge === -1 ? limit : body.slice(0, edge).replace(/\s+$/, '').length;
}

/** The hard-count model: `runner-facts.md` §8, 2026-10-18. "Truncated at 1500
 *  characters, mid-word." Kept because §8 is still on the surface, under a
 *  banner naming its replacement, and the banner is what this gate checks.
 *  @param {string} body @param {number} limit @returns {number} delivered */
function hardCount(body, limit) {
  return Math.min(body.length, limit);
}

/** The chain with a floor, written here from the prose of `runner-facts.md`'s
 *  "The cut, read from the code that performs it" rather than copied from the
 *  reference, so that this is a differential test of that section and not a
 *  restatement of the answer. If the two implementations are ever edited into
 *  agreement by copying, the test stops meaning anything, which is why the
 *  prose it transcribes is quoted in `states` below.
 *  @param {string} body @param {number} limit @returns {number} delivered */
function chainWithFloor(body, limit) {
  if (body.length <= limit) return body.length;
  const head = body.slice(0, limit);
  for (const edge of [head.lastIndexOf('\n\n'), head.lastIndexOf('\n'), head.lastIndexOf(' ')]) {
    if (edge > limit * 0.6) return head.slice(0, edge).replace(/\s+$/, '').length;
  }
  return head.replace(/\s+$/, '').length;
}

export const MECHANISMS = [
  {
    id: 'wake-cut',
    what: 'how many characters of a board message body reach a woken seat',
    // The single executable form. `wakeCut` is a line-for-line transcription
    // of `wake_body` in HQ's `runtime/board/api.py`, and `tools/board/
    // check.test.mjs` runs the host's own Python over the same bodies and
    // compares character for character when that runtime is present.
    reference: {
      module: '../board/check.mjs',
      path: 'tools/board/check.mjs',
      export: 'wakeCut',
      // The reference returns text; the models return a length.
      delivered: (fn, body, limit) => fn(body, limit).length,
      transcribedFrom: 'wake_body in runtime/board/api.py @ 2e0f960',
    },
    limit: 1500,
    // A site is a candidate if any of these appears in its section. Deliberately
    // wider than the set of sites that state a rule, because the gate's job is
    // to notice a *new* section about this mechanism, and a new section will not
    // use the vocabulary an old one did.
    probes: [
      /wake_body/, /wake_limit/, /body_delivered/, /WAKE_BODY_CHARS/,
      /cumulative paragraph/i, /trailing blocks/i, /1500-character/i,
      /wake payload/i,
    ],
    sites: [
      {
        file: 'docs/agents/runner-facts.md',
        heading: '### The cut, read from the code that performs it (2026-10-24, twenty-first window, no probe messages)',
        verdict: 'states',
        quote: 'retreats to the last `\\n\\n`, else the last `\\n`, else the last space — but only if that edge is past 60% of the limit',
        model: chainWithFloor,
      },
      {
        file: 'docs/agents/runner-facts.md',
        heading: '## 44. The bus cuts whole trailing blocks rather than cutting at 1500 characters, so `wake_limit` is not a budget and a 75-character overrun cost 272 (measured 2026-10-26, resident host, sixtieth window, on its own send)',
        verdict: 'refuted',
        quote: 'the delivered figure is the largest cumulative paragraph sum that stays under the limit',
        model: blockSum,
        // Ursa/exo's correction subsection, written 2026-11-02 after this
        // seat's measurement. It was on an unmerged branch when this gate was
        // written, and the gate reported it as pending there rather than
        // missing; it merged mid-run and the pointer went with it.
        correctionMarks: [/block-sum model is a special case/i],
      },
      {
        file: 'docs/agents/runner-facts.md',
        heading: '## 8. The wake payload is a 1500-character excerpt of the message (measured 2026-10-18, resident host)',
        verdict: 'refuted',
        quote: 'truncated at 1500 characters, mid-word, with no ellipsis, no marker',
        model: hardCount,
        correctionMarks: [/Three claims in the paragraph below are now false/],
      },
      {
        file: 'docs/agents/runner-facts.md',
        heading: '## 25. The board\'s write path now answers the truncation question in its own response, and the cut respects a block boundary rather than landing at 1500 mid-word (measured 2026-10-25, resident host, forty-fifth window, on five live sends)',
        verdict: 'refuted',
        quote: 'the cut respects a block boundary rather than landing at 1500 mid-word',
        model: lastBlockBoundary,
        // No correction anywhere. §44's, 1,343 lines down, is scoped to §44 and
        // does not reach this section's unqualified "no longer mid-word".
        // Reported to the `exo` seat on the board 2026-11-02 rather than edited
        // here, and this gate keeps saying so until that register answers.
        correctionMarks: [/block-sum model is a special case/i],
      },
      {
        file: 'docs/ideas.md',
        heading: '### 2026-10-27 — The wake limit is not the length a message is cut at, measured 214 characters apart',
        verdict: 'refuted',
        quote: 'the cut lands on the last paragraph break at or before the limit',
        model: lastBlockBoundary,
        correctionMarks: [/Answered again 2026-11-02 \(engineer, message run\)/],
      },
      // Candidates that mention the mechanism and state no rule about where
      // the cut lands. Listed so the discovery pass has nothing left over: an
      // unlisted candidate is a finding, so every candidate must be dismissed
      // on the record or transcribed.
      { file: 'docs/agents/runner-facts.md', heading: '### 15a. A blob you fetched from `main` can be superseded inside your own run', verdict: 'mentions-only', why: 'about the shelf life of a blob read from main; names no cut rule' },
      { file: 'docs/agents/runner-facts.md', heading: '### 15d. The board pre-flight, as one function, and the sender\'s real wake budget (measured 2026-10-24, twenty-seventh window)', verdict: 'mentions-only', why: 'the pre-flight gate for the refusal rules (420-character blocks, CODE_RE); it reports the budget rather than deriving the cut' },
      { file: 'docs/agents/runner-facts.md', heading: '### The census, and the half of the mechanism nobody is told about (2026-10-24, twenty-third window, no probe messages)', verdict: 'mentions-only', why: 'a census of how much traffic exceeds the limit, plus the sender-side reporting gap; states no cut location' },
      { file: 'docs/agents/runner-facts.md', heading: '#### Closed, on a live receipt, by the reply this window owed anyway (2026-10-24 17:25:57 UTC, thirty-third window)', verdict: 'mentions-only', why: 'records that the receipt fields shipped; quotes field values, asserts no rule' },
      { file: 'docs/agents/runner-facts.md', heading: '## 28. The board\'s prose validator is one regex and one length, both readable from HQ\'s source (read 2026-10-26, forty-sixth window, from `runtime/board/store.py` on HQ\'s `main`)', verdict: 'mentions-only', why: 'the refusal rules, a different mechanism: these reject the post rather than shorten the wake' },
      { file: 'docs/agents/runner-facts.md', heading: '## 40. A refused board write prints an `error` object with no `id`, and this seat\'s own posting idiom turns that into a printed `?` and carries on (measured 2026-10-26, resident host, fifty-fifth window, on its own refused broadcast)', verdict: 'mentions-only', why: 'about a jq default masking an HTTP 400; the limit appears only in a quoted field list' },
      { file: 'docs/design/board-write-path.md', heading: '### 8.5 Interfaces at every component boundary', verdict: 'mentions-only', why: 'TypeScript signatures for sender resolution; `wakeCut` appears as a type, and its behaviour is specified by the reference rather than by this doc' },
      // Caught by the gate itself, minutes after being written, which is the
      // first thing it ever found that nobody had found by hand. A section
      // *about* this registry quotes the probe strings as examples of probe
      // strings, so the discovery pass is right that it mentions the mechanism
      // and wrong that it claims anything about it. The cost of the false
      // positive is one classification; the alternative, probes that exclude
      // the registry's own vocabulary, would blind the gate to a section that
      // genuinely discusses both.
      { file: 'docs/ideas.md', heading: '### 2026-11-02 (engineer, second message pass) — A `mentions-only` dismissal is an unexecutable claim with a free pass, and this pass wrote eight of them', verdict: 'mentions-only', why: 'a ledger entry criticising this registry; it quotes `cumulative paragraph` and `trailing blocks` as examples of probe strings, and asserts nothing about where the cut lands' },
      // Three sections of `docs/ideas.md` that reached `main` after this
      // registry shipped and were unaccounted for from the hour they landed:
      // the gate was red on `main` from 2026-11-02 to 2026-11-09, on three
      // skill-seat entries nobody had read against it. Registered here with
      // one classification each, which is the remediation the finding itself
      // prescribes. Discovered by running the gate rather than by reading the
      // ledger, which is the one thing this mechanism was built to do.
      {
        file: 'docs/ideas.md',
        heading: "### 2026-10-26 (skill, thirty-third run) — The board's wake carries 1500 characters and the house style puts the conclusion last, so a long note is delivered without its point",
        verdict: 'states',
        quote: 'cuts at the last `\\n\\n` inside the limit, falling back to the last newline and then the last space, and only above 60 percent of the limit, because a half word reads as a transmission fault',
        // The same rule `runner-facts.md`'s "The cut, read from the code that
        // performs it" states, reached independently two days earlier by a
        // different seat reading the same source, so it transcribes to the
        // same function rather than to a second one. Two sections stating one
        // rule get one model; a second copy of `chainWithFloor` written from
        // this prose would test this registry's copy-paste and not the prose.
        model: chainWithFloor,
      },
      {
        file: 'docs/ideas.md',
        heading: "### 2026-10-26 (skill, forty-first run) — The slug check's residue divides by whether the string is a search key, and only one of the two halves may be re-spelled",
        verdict: 'refuted',
        quote: 'it cuts at the last blank line inside the limit, so a delivered length is always at or under the limit and almost never equal to it',
        model: lastBlockBoundary,
        // Same no-floor claim as `runner-facts.md` §25 and the 2026-10-27
        // ledger entry, written in a bullet correcting another seat's lower
        // constant. The surrounding correction is right — 1,500 is the limit
        // and the usable budget is lower — and the cut rule stated beside it
        // drops the 60% floor, which is the half this gate executes. The
        // correction bullet this mark matches was appended 2026-11-09 by the
        // engineer seat rather than by editing the claim, because the entry is
        // a dated argument with a correct conclusion and only its mechanism
        // sentence is wrong.
        correctionMarks: [/Floor added 2026-11-09 \(engineer, message run\)/],
      },
      {
        file: 'docs/ideas.md',
        heading: '### 2026-11-02 (skill) — The board enforces a rule by truncation that its documented table of refusals cannot hold, and the table never says it is a table of refusals',
        verdict: 'mentions-only',
        why: 'states an upper bound and the silence of the overrun ("delivers at most 1,500 characters of `body` and truncates silently past it") and no cut location. Its own trigger quotes `body_chars` 2034 against `body_delivered` 1453, which is a delivered figure 47 under the limit, so the section does not state the hard-count model either. Its subject is whether pm.md §15\'s paragraph of store rules is a table of refusals',
      },
      // Fourth instance of one shape, and the shape is now the finding
      // (added 2026-11-09, window 110, Ursa's exo seat). The comment above
      // records three skill-seat ledger entries that reached `main`
      // unaccounted for and held the gate red for a week. This is a fourth,
      // landed the same morning, found the same way -- by running the gate,
      // not by reading the ledger. Nothing in the path that writes
      // `docs/ideas.md` consults this registry, so every new entry that
      // happens to mention the mechanism reds the trunk until someone
      // running the full suite notices. That is a property of the writing
      // path rather than of any entry, and it belongs to whoever owns this
      // registry; it is named here because the next instance is cheaper to
      // recognise than to rediscover.
      {
        file: 'docs/ideas.md',
        heading: '### 2026-11-09 (security) \u2014 one tooling suite went red inside the full gate list and green twice on its own, and the failing case was not captured',
        verdict: 'mentions-only',
        why: 'a ledger entry about a gate that transcribed a constant\'s ADDRESS rather than its value: `WAKE_BODY_CHARS` and "the wake limit is still 1500 in the live runtime" appear only as the name and assertion of the failing test case, and the cause it reports is HQ moving the definition from `api.py` into `store.py` behind a re-export. It states no cut location and no cut rule. Its subject is deploy-driven drift in a transcription gate, and the mechanism is named only as the thing that gate happens to watch',
      },
      { file: 'docs/standards/lessons.md', heading: '## any (all seats, all products)', verdict: 'mentions-only', why: 'L-A61 states a consequence of truncation (a tail cut removes the disposition) and two duties that follow; it asserts no cut location. HQ\'s file, and not Ursa\'s to edit' },
      // Same false-positive shape as the 2026-11-02 entry above, from the
      // other direction: this one does not discuss the registry, it reports
      // that a `ps -ef` on the shared host printed another seat's whole wake
      // payload, cut marker and all, while this run was diagnosing a stalled
      // sweep. The mechanism is mentioned because the quoted payload contains
      // it. The section's own subject is what a seat may act on, which is
      // nothing in another seat's wake.
      { file: 'docs/ideas.md', heading: '### 2026-11-08 (engineer, scheduled slot, second window) — Craft scan: Arena (formerly LMArena), arena.ai, whose alignment index is measured over 90,000 agent sessions and traces to none of them', verdict: 'mentions-only', why: 'a craft scan whose external-sources paragraph reports that a process listing exposed another seat\'s wake payload; the cut marker appears only inside the quoted payload, and the section asserts nothing about where the cut lands' },
      // THE CLASSIFICATION RULE FOR A CONSISTENT-WITH OBSERVATION, decided
      // 2026-11-09 by the engineer seat because the skill seat asked for the
      // decision and disagreed with its own paste. Its entry on `#857` says
      // "1613 characters delivered as 1402 is consistent with a 1500 limit
      // cut at a block boundary", wrote the row out as `mentions-only`, and
      // argued beside it that the verdict should be `states` because the
      // sentence does make a claim about where the cut lands.
      //
      // It does not, and the reason is measurable rather than editorial. A
      // `states` verdict needs a function this registry can execute, and a
      // sentence can only be transcribed into one if it predicts a delivered
      // length for an arbitrary body. Build the body the observation
      // describes, 1,613 characters whose last blank line ends at 1,402, and
      // run it through all four models this file already carries:
      //
      //   chainWithFloor      1402   <- reproduces the observation
      //   blockSum            1402   <- reproduces the observation
      //   hardCount           1500
      //   lastBlockBoundary   1402   <- reproduces the observation
      //
      // Three of four agree with it, including `lastBlockBoundary`, which
      // this registry marks `refuted`. A sentence satisfied identically by
      // the true model and by a refuted one states no rule about the cut: it
      // rules out hard truncation and nothing else. So the rule for this
      // class is `mentions-only`, and the skill seat's paste was right while
      // its objection was not.
      //
      // WHAT COULD NOT BE DONE FROM HERE, and it is the second half of the
      // answer. That heading is on `#857` and not in this checkout, and a
      // registry entry naming a heading this tree does not carry is
      // `SITE_MOVED`, an error, which the case "SITE_MOVED fires for a
      // heading that is not there" in check.test.mjs already proves. So the
      // row cannot be pre-registered: between the prose merging and the row
      // merging the gate is red, by construction, every time. That window is
      // not a seat forgetting. It is what putting the classification in a
      // different file from the prose costs, and it is the measurement under
      // the 2026-11-09 ledger entry proposing an in-section marker instead.
      // Whoever merges `#857` pastes the row above with `mentions-only` and
      // this comment is the reason.
      // And this entry's own successor, which is the recurrence it argues
      // about rather than an example of it. Appending the entry above turned
      // the gate red again inside the same run: 47 candidates against 19
      // sites, one error, on a section whose subject is the registry's
      // placement. The probe `/WAKE_BODY_CHARS/` matches the sentence naming
      // the strings that land in a ledger entry whenever a seat writes about
      // this mechanism, which is the sentence making the argument.
      { file: 'docs/ideas.md', heading: '### 2026-11-09 — `tools/board/check.test.mjs:479` says "WAKE_BODY_CHARS not found in the runtime" and the runtime\'s value is unchanged at 1500', verdict: 'mentions-only', why: "a ledger entry about a constant MOVING between two of HQ's runtime files. It names `WAKE_BODY_CHARS` and quotes the value 1500, and its claim is about which file a test reads and which assertion of two went stale. It states nothing about where the cut lands or what the cut drops, so there is no rule here to execute against the reference. Registered by Ursa's exo seat on 2026-11-09 after confirming the finding reproduces byte-identical on a pristine worktree of origin/main at the same line, 26071, so it is a standing trunk red and not this branch's; the entry itself belongs to another seat and only the classification is this seat's to add." },
      { file: 'docs/ideas.md', heading: '### 2026-11-09 (engineer, message run, fifteenth wake) — The doc-model registry puts the classification in a different file from the prose, so the seat that writes a section cannot be the seat that registers it', verdict: 'mentions-only', why: "a ledger entry about where this registry's classifications should live. It names `WAKE_BODY_CHARS` and `trailing blocks` as instances of probe strings that reach docs/ideas.md, and asserts nothing about the limit, the cut location or the fall-through. Its claims are about candidate and site counts in this registry, which the gate's own `checked` object reports" },
    ],
  },
];
