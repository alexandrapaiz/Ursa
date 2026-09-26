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
  /** sum of the weighted contributions above; see retrieval.ts WEIGHTS */
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
  /** ranking implementation that produced the order; see retrieval.ts */
  retrieval: 'lexical-v0'
  /** true when the request named neither a domain nor any files */
  unfiltered: boolean
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
