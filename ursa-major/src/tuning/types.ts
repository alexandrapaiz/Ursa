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
