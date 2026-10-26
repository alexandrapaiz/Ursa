// The HQ surface: what an agent reads before it starts work.
//
// Plan §15 ("Agentic-forward: the HQ surface") and the ledger entry
// "Agentic-forward: Ursa as the agents' HQ" (docs/ideas.md, accepted
// 2026-09-19). The debrief half already exists — `ursa run` grades a
// finished run into an OutcomeRecord, and `tuning distill` turns records
// into axioms. This is the brief half: the same store, read backwards,
// answering "what has this owner already taught, that applies to the
// files I am about to touch?"
//
// Discipline, load-bearing (vision §0b): the HQ serves EVIDENCE, never
// ORDERS. Every unit below carries where it came from — an axiom id, a
// record id, the user's own words, the steps they were said at — so the
// agent can weigh it. Nothing here is an instruction the agent must
// obey, and no field in this file tells an agent what to do. An HQ that
// commanded agents would be the central planner the principles reject.

import type { AxiomEvidence, TuningAxiom } from '../tuning/types'
import type { CorrectionLoop } from '../types'

/** What an agent asks for, before it starts. Both fields optional: an
 *  empty request is legal and returns the whole active HQ, ranked by
 *  evidence count, which is what a fresh agent with no file list wants. */
export interface BriefingInput {
  /** free-form domain tag matched against TuningAxiom.domain, e.g. 'motion' */
  domain?: string
  /** repo-relative paths the agent is about to work on, e.g. ['src/app/page.tsx'] */
  files?: string[]
  /** hard ceilings, so a briefing fits an agent's context window */
  maxRules?: number
  maxCases?: number
  /**
   * How many of the units that were NOT returned to include, with their
   * score breakdown intact. Omitted or 0 means none, which is the
   * default and the shape every caller before 2026-10-26 got.
   *
   * WHY THIS IS OPT-IN AND NOT ALWAYS ON. The floor and the ceilings
   * exist because an agent's opening context is the scarce thing
   * (MIN_RELEVANCE, DEFAULT_MAX_CASES in ./briefing.ts), so a briefing
   * that volunteered everything it rejected would spend the budget those
   * bounds were written to protect. The flag is for the reader who has
   * already seen a thin briefing and is asking a second question about
   * it: was there nothing, or was there something just out of reach?
   */
  dropped?: number
}

/** Which bound kept a scored unit out of the briefing. Two values rather
 *  than one, because they answer opposite questions for the agent
 *  reading a thin briefing: `below_floor` says the HQ has something on
 *  this subject and judged it too far away, `over_cap` says the HQ had
 *  more than the request asked to be shown. */
export type DropReason = 'below_floor' | 'over_cap'

/** A unit the briefing scored and did not serve, with the bound that
 *  kept it out. The bound is carried as a number so the remedy can name
 *  a value instead of a placeholder, the same discipline
 *  `DroppedUnits.minChars` follows in ../launch.ts. */
export interface DroppedUnit<T> {
  unit: T
  reason: DropReason
  /** MIN_RELEVANCE when `reason` is 'below_floor'; the effective
   *  `maxCases` or `maxRules` when it is 'over_cap' */
  bound: number
}

export type DroppedCase = DroppedUnit<CaseUnit>
export type DroppedRule = DroppedUnit<RuleUnit>

/** What the semantic ranker concluded about one case (semantic.ts).
 *  All four numbers are printed in the briefing, because the lead term
 *  is the one part of the score that depends on the other cases in the
 *  store, so the raw cosine and the mean subtracted from it are what
 *  make the arithmetic recomputable by hand. */
export interface SemanticReason {
  /** raw cosine of the case against the request, in [-1, 1] */
  cosine: number
  /** mean cosine of every OTHER case: the anisotropy offset removed */
  fieldMean: number
  /** cosine - fieldMean: how far this case stands above the field */
  lead: number
  /** points the lead bought, 0 to semantic.ts's SEMANTIC_CAP */
  term: number
}

/** Why one unit surfaced for this request. Printed in the rendered
 *  briefing so ranking is auditable instead of an opaque score. */
export interface MatchReason {
  /** the request's domain equals, contains, or is contained by the unit's domain */
  domain: 'exact' | 'partial' | null
  /** requested paths this unit was actually learned on, exact path match */
  filesExact: string[]
  /** requested paths matched only by file name, ignoring directory */
  filesByName: string[]
  /** query words found in the unit's own text */
  textTokens: string[]
  /** how the model ranked this case against the request. null when no
   *  embedder ran, which is every rule and every lexical-only briefing —
   *  null means "not measured", never "measured and found unrelated". */
  semantic: SemanticReason | null
  /** sum of the weighted contributions above, including semantic.term;
   *  see retrieval.ts WEIGHTS and semantic.ts SEMANTIC_CAP */
  score: number
}

/** A tuning axiom, flattened for an agent that has never seen this repo. */
export interface RuleUnit {
  axiomId: string
  /** the rule, stated portably: what this owner prefers or avoids */
  statement: string
  domain: string
  polarity: TuningAxiom['polarity']
  /** stated = the owner said it; tacit = revealed only by what survived */
  basis: TuningAxiom['basis']
  /** independent evidence entries behind it; the only confidence number */
  evidenceCount: number
  /** axiom ids this one conflicts with — surfaced, never averaged away */
  contradicts: string[]
  /** 'user-edited' rules are included; 'revoked' are never served */
  status: TuningAxiom['status']
  /** one evidence pointer per rule, so the agent can read the receipt */
  firstEvidence?: AxiomEvidence
  why: MatchReason
}

/** A prior correction on nearby files: the expensive lesson, with the
 *  owner's verbatim complaint and the spec that closed it.
 *
 *  TWO SHAPES, ONE UNIT (added 2026-10-26). A record carries corrections
 *  in whichever of two shapes its own evidence supports, and
 *  `src/signals.ts` decides which from one question: does the record have
 *  a chat trace?
 *
 *    `kind: 'loop'` — from `signals.correctionLoops`. The user's own
 *    messages are present and ordered, so the same ask repeating is
 *    observable and `recurrences` is a measurement.
 *
 *    `kind: 'one_shot'` — from `signals.oneShotCorrections`. The record is
 *    a git commit pair, so there are no user messages at all: the
 *    correction appears once, as the edit itself, and recurrence is not
 *    zero but unobservable. This is the ONLY shape `ursa run` over a
 *    repository can produce, which is why a briefing that indexed only
 *    loops returned nothing on a store built from real git history.
 *
 *  The two fields that are a measurement on a loop and not available on a
 *  one-shot are therefore nullable, and `null` here means "this record
 *  cannot answer that", never zero. */
export interface CaseUnit {
  recordId: string
  /** which of the two correction shapes above this unit came from */
  kind: 'loop' | 'one_shot'
  /** the loop's own id, or `one-shot-<ordinal>` within the record */
  loopId: string
  /** what the loop was about, as the record states it; on a one-shot, the
   *  path the edit was made in, which is what the record states instead */
  theme: string
  /** the files the loop was fought over; on a one-shot, the edited file */
  targetFiles: string[]
  /** repetitions after the first ask — how expensive this lesson was.
   *  `null` on a one-shot: unobservable without a chat trace. */
  recurrences: number | null
  /** `null` on a one-shot: an edit that was kept carries no stated
   *  resolution, and 'accepted' would be this surface inventing one. */
  resolution: CorrectionLoop['resolution'] | null
  /** the requirement the owner could not state up front, articulated
   *  after. On a one-shot, the correction itself: the agent's text and
   *  the text the owner replaced it with, both quoted from the record. */
  discoveredSpec: string
  /** the owner's verbatim words that opened the loop, when the record has them */
  complaint?: string
  /** the technical fault whose repair closed the complaint */
  mechanism?: string
  why: MatchReason
}

/** A guardrail the owner had to state because an agent once overreached.
 *  Extends the plan's `AxiomEvidence` with the axiom's own statement and
 *  id: evidence alone carries a quote and steps but no readable rule, and
 *  an agent cannot act on a pointer it cannot read. */
export interface GuardrailUnit extends AxiomEvidence {
  axiomId: string
  statement: string
  domain: string
}

/** What the briefing looked at to produce what it returned. Present so a
 *  thin briefing is legibly thin ("the HQ knows little here") rather than
 *  silently thin ("the HQ says nothing applies"). */
export interface BriefingCoverage {
  axiomsConsidered: number
  axiomsReturned: number
  recordsConsidered: number
  loopsConsidered: number
  /**
   * One-shot corrections looked at, counted separately from
   * `loopsConsidered` (added 2026-10-26).
   *
   * Two numbers rather than one total, because they are not the same
   * evidence and a reader who cannot tell them apart is misinformed in a
   * specific direction. A loop is a correction the owner had to make more
   * than once; a one-shot is an edit she made and moved on from. A store
   * built by `ursa run` over a repository has only the second kind, by
   * construction, so a coverage line that said `0 correction loops` and
   * nothing else read as "nothing to learn from here" when the true
   * statement was "204 corrections, none of them in the shape this
   * sentence counts".
   */
  oneShotsConsidered: number
  casesReturned: number
  /** ranking implementation that produced the order; see retrieval.ts.
   *  'lexical-v0' = word overlap only. 'semantic-v1' = MiniLM cosine
   *  similarity blended into the case score (plan §12). The value is the
   *  ranker that actually ran, so a briefing that silently fell back to
   *  lexical because no embedder was available says so here. */
  retrieval: 'lexical-v0' | 'semantic-v1'
  /** the embedding model behind a 'semantic-v1' ranking, absent for
   *  'lexical-v0'. Present so that two briefings taken months apart are
   *  comparable, or knowably not. */
  retrievalModel?: string
  /** true when the request named neither a domain nor any files */
  unfiltered: boolean
  /**
   * Character count of `renderBriefing`'s own output — the string that
   * actually enters a context window — including the sentence in the
   * `## Coverage` section that prints this number.
   *
   * Why characters and not rules. The two ceilings a caller can set,
   * `maxRules` and `maxCases`, are denominated in units of wildly
   * uneven size: a rule with five evidence entries and a verbatim quote
   * runs several times the length of a rule with one and none. So an
   * agent choosing `maxRules: 8` is guessing at a number it cannot
   * convert into the thing it has to budget, which is context. This
   * field closes that: ask once, read the cost, pick the ceiling.
   *
   * Why optional. `buildBriefing` cannot know it. The number is a
   * property of the rendering, and the renderer runs after the briefing
   * exists, so a briefing that has not been through `measureBriefing`
   * leaves this absent rather than reporting a placeholder. Absent
   * means not measured, never means zero.
   */
  renderedChars?: number
}

export interface Briefing {
  schemaVersion: '0.1.0'
  generatedAt: string
  request: BriefingInput
  rules: RuleUnit[]
  nearestCases: CaseUnit[]
  guardrails: GuardrailUnit[]
  /**
   * The highest-scoring cases that were scored and not returned, at most
   * `request.dropped` of them, score-descending (added 2026-10-26).
   *
   * Absent when the caller did not ask, which is not the same as empty.
   * Empty means "asked, and there was nothing held back"; absent means
   * "never asked", and a reader who confuses the two concludes the store
   * is bare on evidence that says nothing of the kind.
   *
   * The total held back is not repeated here because `coverage` already
   * determines it: `loopsConsidered + oneShotsConsidered - casesReturned`
   * for cases and `axiomsConsidered - axiomsReturned` for rules. One
   * number in one place, so the two cannot disagree.
   */
  dropped?: DroppedCase[]
  /** the same, for rules. See `dropped` above for what absent means. */
  droppedRules?: DroppedRule[]
  coverage: BriefingCoverage
  /** the §0b discipline, carried in the payload so it reaches the model
   *  that reads the briefing, not only the human who reads this file */
  disclaimer: string
}

export const BRIEFING_DISCLAIMER =
  'Evidence, not orders. Every line below is something this owner already ' +
  'demonstrated on real work, with a pointer to where. You remain the judge ' +
  'of whether it applies to the task in front of you.'
