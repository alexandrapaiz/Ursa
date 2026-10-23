// The tuning layer: what the interpretation pass (RLAIF) distills out of
// outcome records, and the user-owned store it compounds into.
//
// Division of labor, load-bearing: the MODEL infers the why (an axiom's
// statement and which existing axiom it matches); the CODE does all
// arithmetic (confidence, recurrence, merge) and every axiom must carry
// evidence pointers joinable back to the record's steps. An axiom
// without evidence is invalid by construction.
//
// Privacy invariants: distillation runs on the user's machine; the
// tuning record lives with the user, never on an aggregation layer; the
// user can edit or revoke any axiom and revocation survives re-distills.
// The last of those is enforced in `tuning/revocation.ts`, which holds
// back a restated tombstone without asking the model whether it was one,
// and parks it in `TuningRecord.blockedByRevocation` rather than in `axioms`.

export interface AxiomEvidence {
  /** outcome record this evidence came from */
  recordId: string
  /** which signal grounded it */
  kind:
    | 'correction-loop'
    | 'feedback-translation'
    | 'regression'
    | 'defensive-guardrail'
    | 'one-shot-correction'
    | 'episode'
  /** loop id, or step ordinal(s) as recorded */
  ref: string
  steps: number[]
  /** the user's own words, verbatim, when the signal carried them */
  quote?: string
}

export interface TuningAxiom {
  id: string
  /** the why, stated as a rule portable to any model */
  statement: string
  /** free-form domain tag, e.g. 'motion', 'copy', 'layout', 'process' */
  domain: string
  polarity: 'prefer' | 'avoid'
  /** stated = user said it; tacit = revealed only through the artifact */
  basis: 'stated' | 'tacit' | 'mixed'
  /**
   * Deterministic, code-owned: number of independent evidence entries.
   * Recurrence across records is the confidence signal, never a model's
   * self-reported score.
   */
  evidenceCount: number
  evidence: AxiomEvidence[]
  /** axiom ids this one conflicts with — surfaced, never averaged */
  contradicts: string[]
  firstSeen: string
  lastSeen: string
  /** user sovereignty; 'revoked' axioms are kept as tombstones */
  status: 'active' | 'user-edited' | 'revoked'
}

/**
 * A statement one distillation pass produced, and the store refused to
 * make an axiom of, because it restates an axiom the user revoked.
 *
 * It lives outside `axioms` on purpose, and the reason is the whole
 * design: six separate call sites filter `status !== 'revoked'` to
 * decide what may reach a model (`tuning/export.ts`, `bridge/index.ts`,
 * `mcp/server.ts` through its store, `hq/briefing.ts`, `consent.cli.ts`
 * and `tuning/cli.ts`). A fourth axiom status would have had to be
 * added to all six and to every one written after today, and a consumer
 * that had not heard of it would disclose a held statement by default.
 * A field nobody reads yet cannot leak by omission. Anything that shows
 * blocked statements to the user has to name this field deliberately.
 */
export interface BlockedStatement {
  statement: string
  domain: string
  polarity: 'prefer' | 'avoid'
  basis: 'stated' | 'tacit' | 'mixed'
  /** kept so the user sees what the model thought it had found */
  evidence: AxiomEvidence[]
  /** id of the revoked axiom whose statement this one restates */
  blockedBy: string
  /** `revocationSimilarity` against that axiom, 0..1, three decimals */
  score: number
  /** distillation passes that have produced this same statement */
  occurrences: number
  firstBlocked: string
  lastBlocked: string
}

export interface TuningRecord {
  schemaVersion: '0.1.0'
  /** local label only; never transmitted */
  owner: string
  updatedAt: string
  sources: Array<{
    recordId: string
    distilledAt: string
    method: 'rlaif-claude'
    model: string
  }>
  axioms: TuningAxiom[]
  /**
   * Statements the revocation gate refused to make axioms of. Named in
   * full rather than `withheld`, because `disclosure.ts` already uses
   * "withheld" for the rows a consent scope keeps out of a disclosure
   * batch, and these two have nothing to do with each other. Optional so
   * a record written before this field existed still parses;
   * `emptyTuning` and `mergeDistill` always write it, empty array
   * included.
   */
  blockedByRevocation?: BlockedStatement[]
}

// What the model must return from one distillation pass. Kept minimal:
// judgment only, no arithmetic.
export interface DistilledAxiom {
  statement: string
  domain: string
  polarity: 'prefer' | 'avoid'
  basis: 'stated' | 'tacit' | 'mixed'
  /** id of the existing axiom this restates, or null if new */
  matchesExisting: string | null
  /** ids of existing axioms this genuinely conflicts with */
  contradicts: string[]
  evidence: Array<{
    kind: AxiomEvidence['kind']
    ref: string
    steps: number[]
    quote?: string
  }>
}

export interface DistillOutput {
  axioms: DistilledAxiom[]
}
