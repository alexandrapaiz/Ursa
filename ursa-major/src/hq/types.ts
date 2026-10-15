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
}

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

/** A prior correction loop on nearby files: the expensive lesson, with
 *  the owner's verbatim complaint and the spec that closed it. */
export interface CaseUnit {
  recordId: string
  loopId: string
  /** what the loop was about, as the record states it */
  theme: string
  /** the files the loop was fought over */
  targetFiles: string[]
  /** repetitions after the first ask — how expensive this lesson was */
  recurrences: number
  resolution: CorrectionLoop['resolution']
  /** the requirement the owner could not state up front, articulated after */
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
  coverage: BriefingCoverage
  /** the §0b discipline, carried in the payload so it reaches the model
   *  that reads the briefing, not only the human who reads this file */
  disclaimer: string
}

export const BRIEFING_DISCLAIMER =
  'Evidence, not orders. Every line below is something this owner already ' +
  'demonstrated on real work, with a pointer to where. You remain the judge ' +
  'of whether it applies to the task in front of you.'
