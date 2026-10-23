// Revocation and erasure inside the tuning record.
//
// Two different user actions, deliberately not the same operation. The
// difference is the whole point of this file, so it is stated here
// rather than left for a reader to infer:
//
//   REVOKE AN AXIOM — "this inference about me is wrong, stop applying
//   it." The axiom is kept as a tombstone (`status: 'revoked'`), which
//   is what `tuning/revocation.ts` scores every new statement against to
//   stop a re-distill from resurrecting it, what `tuning/merge.ts` reads
//   when the model does declare the match, and what `distill.ts` passes
//   to the model as "REVOKED AXIOMS (do not resurrect)". Only the first
//   of those three is enforcement; the second needs a model-supplied
//   field to be set and the third is an instruction a model can ignore.
//   The statement has to survive locally for the system to know what not
//   to do. It is never disclosed: `tuning/export.ts` and
//   `bridge/index.ts` both filter `status !== 'revoked'` already.
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
import type { BlockedStatement, TuningAxiom, TuningRecord } from './types'

export interface ForgetResult {
  tuning: TuningRecord
  /** ids deleted outright — the forgotten record was their only evidence */
  axiomsDeleted: string[]
  /** evidence entries removed from axioms that survive on other records */
  evidenceStripped: number
  sourcesRemoved: number
  /**
   * Withheld statements dropped because the forgotten record was their
   * only evidence. Counted separately from `axiomsDeleted` because they
   * were never axioms; see `blockedForgotten` below for why they are
   * swept at all.
   */
  blockedDropped: number
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
  const { blocked, dropped } = blockedForgotten(tuning.blockedByRevocation ?? [], recordId, now)
  return {
    tuning: { ...tuning, updatedAt: now, sources, axioms: cleaned, blockedByRevocation: blocked },
    axiomsDeleted,
    evidenceStripped,
    sourcesRemoved: tuning.sources.length - sources.length,
    blockedDropped: dropped,
  }
}

/**
 * Apply "forget this record" to the blocked-statement list too.
 *
 * This is not a nicety. A blocked entry carries the statement the model
 * produced AND the evidence pointers that grounded it, which name the
 * record's steps and can quote the user's own words. If erasure stopped
 * at `axioms`, then forgetting a record would leave behind a statement
 * derived from it and a quote lifted out of it, parked in a field whose
 * whole purpose is to be shown to the user later. The rule is the same
 * one `tuning/types.ts` states for axioms: an entry without evidence is
 * invalid by construction, so an entry that loses all of its evidence to
 * an erasure goes with it.
 */
function blockedForgotten(
  entries: BlockedStatement[],
  recordId: string,
  now: string
): { blocked: BlockedStatement[]; dropped: number } {
  const blocked: BlockedStatement[] = []
  let dropped = 0
  for (const w of entries) {
    const kept = w.evidence.filter((e) => e.recordId !== recordId)
    if (kept.length === w.evidence.length) {
      blocked.push(w)
      continue
    }
    if (kept.length === 0) {
      dropped++
      continue
    }
    blocked.push({ ...w, evidence: kept, lastBlocked: now })
  }
  return { blocked, dropped }
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


export interface ReleaseResult {
  tuning: TuningRecord
  /** the axiom the released statement became */
  released: TuningAxiom
}

/**
 * The user's answer to an over-block: promote a blocked statement into
 * a live axiom.
 *
 * This is the half of the design that lets `THETA_REVOKED` sit low.
 * Blocking is default-closed, so the gate is allowed to be wrong in the
 * cautious direction, but only because being wrong costs the user one
 * command instead of a lost preference. Without this function a false
 * positive would be indistinguishable from a deletion.
 *
 * The released axiom is created with `status: 'user-edited'`, which is
 * exact rather than convenient: the user, not a distillation pass, is
 * the reason this statement is in the record, and `merge.ts` treats a
 * `user-edited` statement as sovereign and will never reword it. It also
 * stops the gate from blocking the same statement again, because
 * `findRevocationBlock` lets a candidate through when a live axiom sits
 * at least as close to it as the tombstone does.
 *
 * `index` is the position in `blockedByRevocation` as `ursa consent show` prints
 * it, one-based, because that listing is the only place a user sees
 * these entries and an id we invented here would be a second vocabulary
 * for the same thing.
 */
export function releaseBlocked(
  tuningPath: string,
  index: number,
  now = new Date().toISOString()
): ReleaseResult {
  if (!existsSync(tuningPath)) throw new Error(`No tuning record at ${tuningPath}`)
  const tuning = JSON.parse(readFileSync(tuningPath, 'utf8')) as TuningRecord
  const blocked = tuning.blockedByRevocation ?? []
  const entry = blocked[index - 1]
  if (!entry) {
    throw new Error(
      `No blocked statement ${index} in ${tuningPath} (${blocked.length} blocked by a revocation; run \`ursa consent show\` to list them)`
    )
  }
  const taken = new Set(tuning.axioms.map((a) => a.id))
  let n = tuning.axioms.length + 1
  while (taken.has(`ax-${String(n).padStart(3, '0')}`)) n++
  const released: TuningAxiom = {
    id: `ax-${String(n).padStart(3, '0')}`,
    statement: entry.statement,
    domain: entry.domain,
    polarity: entry.polarity,
    basis: entry.basis,
    evidenceCount: entry.evidence.length,
    evidence: entry.evidence,
    contradicts: [],
    firstSeen: entry.firstBlocked,
    lastSeen: now,
    status: 'user-edited',
  }
  const updated: TuningRecord = {
    ...tuning,
    updatedAt: now,
    axioms: [...tuning.axioms, released],
    blockedByRevocation: blocked.filter((_, i) => i !== index - 1),
  }
  writeFileSync(tuningPath, JSON.stringify(updated, null, 2) + '\n')
  return { tuning: updated, released }
}
