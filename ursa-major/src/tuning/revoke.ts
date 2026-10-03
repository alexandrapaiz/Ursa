// Revocation and erasure inside the tuning record.
//
// Two different user actions, deliberately not the same operation. The
// difference is the whole point of this file, so it is stated here
// rather than left for a reader to infer:
//
//   REVOKE AN AXIOM — "this inference about me is wrong, stop applying
//   it." The axiom is kept as a tombstone (`status: 'revoked'`), which
//   is what `tuning/merge.ts` already reads to stop a re-distill from
//   resurrecting it, and what `distill.ts` passes to the model as
//   "REVOKED AXIOMS (do not resurrect)". The statement has to survive
//   locally for the system to know what not to do. It is never
//   disclosed: `tuning/export.ts` and `bridge/index.ts` both filter
//   `status !== 'revoked'` already.
//
//   FORGET A RECORD — "erase this piece of my work and what you
//   concluded from it." Here a tombstone is the wrong answer, because a
//   tombstone preserves the statement that was derived from the thing
//   being erased. So an axiom whose evidence was *only* the forgotten
//   record is deleted outright. `tuning/types.ts` already makes this the
//   only consistent choice: "An axiom without evidence is invalid by
//   construction." An axiom that also rests on records the user has not
//   erased keeps its statement and loses that record's evidence, with
//   `evidenceCount` recounted from the surviving entries.
//
// The consequence worth naming: deleting an axiom rather than
// tombstoning it means a later distillation over a *different* record
// may derive the same statement again. That is correct. The user erased
// a piece of work, not a conclusion; a conclusion grounded in evidence
// she has not erased is one she has not objected to. Revoking is how she
// objects to the conclusion itself, and that one does leave a tombstone.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import type { TuningAxiom, TuningRecord } from './types'

export interface ForgetResult {
  tuning: TuningRecord
  /** ids deleted outright — the forgotten record was their only evidence */
  axiomsDeleted: string[]
  /** evidence entries removed from axioms that survive on other records */
  evidenceStripped: number
  sourcesRemoved: number
}

/**
 * Pure: strip every trace of one record from a tuning record.
 * Does no I/O so the invariants above are testable without a filesystem.
 */
export function forgetRecordInTuning(
  tuning: TuningRecord,
  recordId: string,
  now = new Date().toISOString()
): ForgetResult {
  const axiomsDeleted: string[] = []
  let evidenceStripped = 0
  const axioms: TuningAxiom[] = []

  for (const axiom of tuning.axioms) {
    const kept = axiom.evidence.filter((e) => e.recordId !== recordId)
    const dropped = axiom.evidence.length - kept.length
    if (dropped === 0) {
      axioms.push(axiom)
      continue
    }
    evidenceStripped += dropped
    if (kept.length === 0) {
      // No grounding left. An axiom without evidence is invalid by
      // construction, and keeping it as a tombstone would preserve the
      // statement the user just erased the basis for.
      axiomsDeleted.push(axiom.id)
      continue
    }
    axioms.push({ ...axiom, evidence: kept, evidenceCount: kept.length, lastSeen: now })
  }

  // A deleted axiom must not stay referenced as a tension by a survivor,
  // or `export.ts` renders "[tension with ax-004]" against an id that no
  // longer exists.
  const deleted = new Set(axiomsDeleted)
  const cleaned = axioms.map((a) =>
    a.contradicts.some((c) => deleted.has(c))
      ? { ...a, contradicts: a.contradicts.filter((c) => !deleted.has(c)) }
      : a
  )

  const sources = tuning.sources.filter((s) => s.recordId !== recordId)
  return {
    tuning: { ...tuning, updatedAt: now, sources, axioms: cleaned },
    axiomsDeleted,
    evidenceStripped,
    sourcesRemoved: tuning.sources.length - sources.length,
  }
}

/**
 * The control surface the plan names as component 9
 * (docs/design/product-plan.md §2, row 9):
 *
 *   revokeAxiom(tuningPath: string, unitId: string): TuningRecord
 *
 * `unitId` is the axiom id in the shipped schema (`ax-001`). Writes the
 * file and returns the updated record. Throws on an unknown id rather
 * than succeeding silently, because a revocation the user believes
 * happened and which did not is the worst available outcome here.
 */
export function revokeAxiom(
  tuningPath: string,
  unitId: string,
  now = new Date().toISOString()
): TuningRecord {
  if (!existsSync(tuningPath)) throw new Error(`No tuning record at ${tuningPath}`)
  const tuning = JSON.parse(readFileSync(tuningPath, 'utf8')) as TuningRecord
  const target = tuning.axioms.find((a) => a.id === unitId)
  if (!target) {
    throw new Error(
      `No axiom ${unitId} in ${tuningPath} (present: ${tuning.axioms.map((a) => a.id).join(', ') || 'none'})`
    )
  }
  const updated: TuningRecord = {
    ...tuning,
    updatedAt: now,
    axioms: tuning.axioms.map((a) =>
      a.id === unitId ? { ...a, status: 'revoked' as const, lastSeen: now } : a
    ),
  }
  writeFileSync(tuningPath, JSON.stringify(updated, null, 2) + '\n')
  return updated
}
