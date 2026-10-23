// Deterministic merge of one distillation pass into the tuning record.
// The model judged (statements, matches, contradictions); this code
// counts. Confidence IS evidenceCount — recurrence across records,
// never a model's self-reported score.

import { normalize } from '../normalize'
import type { OutcomeRecord } from '../types'
import { findRevocationBlock } from './revocation'
import type { AxiomEvidence, BlockedStatement, DistillOutput, TuningAxiom, TuningRecord } from './types'

function axiomId(existing: TuningAxiom[]): string {
  let n = existing.length + 1
  const taken = new Set(existing.map((a) => a.id))
  while (taken.has(`ax-${String(n).padStart(3, '0')}`)) n++
  return `ax-${String(n).padStart(3, '0')}`
}

export function emptyTuning(owner: string): TuningRecord {
  return {
    schemaVersion: '0.1.0',
    owner,
    updatedAt: new Date().toISOString(),
    sources: [],
    axioms: [],
    blockedByRevocation: [],
  }
}

export function mergeDistill(
  tuning: TuningRecord,
  output: DistillOutput,
  record: OutcomeRecord,
  model: string,
  now = new Date().toISOString()
): TuningRecord {
  const recordId = record.task.id
  const axioms = tuning.axioms.map((a) => ({ ...a, evidence: [...a.evidence], contradicts: [...a.contradicts] }))
  const byId = new Map(axioms.map((a) => [a.id, a]))
  // Second pass resolves contradiction ids for axioms new in this run.
  const newIdsByStatement = new Map<string, string>()
  // The revocation gate's two inputs. Neither changes during the loop: a
  // tombstone cannot be un-revoked here and every axiom this pass creates
  // is 'active', so both are read once.
  const tombstones = axioms.filter((a) => a.status === 'revoked')
  const live = axioms.filter((a) => a.status !== 'revoked')
  const blocked: BlockedStatement[] = (tuning.blockedByRevocation ?? []).map((w) => ({
    ...w,
    evidence: [...w.evidence],
  }))

  for (const d of output.axioms) {
    const evidence = d.evidence.map((e) => ({ ...e, recordId }))
    const match = d.matchesExisting ? byId.get(d.matchesExisting) : undefined
    if (d.matchesExisting && !match) {
      throw new Error(`Distill referenced unknown axiom id ${d.matchesExisting}`)
    }
    if (match) {
      if (match.status === 'revoked') continue // revocation survives re-distills
      // user-edited statements are sovereign; only evidence accrues
      if (match.status !== 'user-edited') {
        if (match.basis !== d.basis) match.basis = 'mixed'
      }
      match.evidence.push(...evidence)
      match.evidenceCount = match.evidence.length
      match.lastSeen = now
    } else {
      // The model declared this statement new. That declaration is not
      // evidence that it is new, so the store checks it against the
      // tombstones itself before it builds anything.
      const block = findRevocationBlock(d.statement, tombstones, live)
      if (block) {
        parkBlocked(blocked, d, evidence, block, now)
        continue
      }
      const id = axiomId(axioms)
      const created: TuningAxiom = {
        id,
        statement: d.statement,
        domain: d.domain,
        polarity: d.polarity,
        basis: d.basis,
        evidenceCount: evidence.length,
        evidence,
        contradicts: [],
        firstSeen: now,
        lastSeen: now,
        status: 'active',
      }
      axioms.push(created)
      byId.set(id, created)
      newIdsByStatement.set(d.statement, id)
    }
  }

  // Wire contradictions symmetrically, resolving statements of same-run
  // axioms to their assigned ids.
  for (const d of output.axioms) {
    const selfId = d.matchesExisting ?? newIdsByStatement.get(d.statement)
    if (!selfId) continue
    const self = byId.get(selfId)
    if (!self) continue
    for (const c of d.contradicts) {
      const otherId = byId.has(c) ? c : newIdsByStatement.get(c)
      const other = otherId ? byId.get(otherId) : undefined
      if (!other || other.id === self.id) continue
      if (!self.contradicts.includes(other.id)) self.contradicts.push(other.id)
      if (!other.contradicts.includes(self.id)) other.contradicts.push(self.id)
    }
  }

  return {
    ...tuning,
    updatedAt: now,
    sources: [...tuning.sources, { recordId, distilledAt: now, method: 'rlaif-claude', model }],
    axioms,
    blockedByRevocation: blocked,
  }
}

/**
 * Park a blocked statement where the user can see it.
 *
 * A pass that produces the same blocked statement again accrues onto the
 * existing entry instead of appending a second copy, because the
 * distillation prompt keeps handing the model the same tombstones and a
 * model that ignores them once will ignore them every run. Identity here
 * is the normalized statement, not the raw one, so a retyped dash does
 * not fork the entry — the same reason `verbatim-byte-identity.md` gives
 * for normalizing before comparing spans.
 */
function parkBlocked(
  blocked: BlockedStatement[],
  d: DistillOutput['axioms'][number],
  evidence: AxiomEvidence[],
  block: { blockedBy: string; score: number },
  now: string
): void {
  const key = normalize(d.statement).norm
  const existing = blocked.find((w) => normalize(w.statement).norm === key)
  if (existing) {
    existing.evidence.push(...evidence)
    existing.occurrences += 1
    existing.lastBlocked = now
    existing.score = Math.max(existing.score, block.score)
    return
  }
  blocked.push({
    statement: d.statement,
    domain: d.domain,
    polarity: d.polarity,
    basis: d.basis,
    evidence,
    blockedBy: block.blockedBy,
    score: block.score,
    occurrences: 1,
    firstBlocked: now,
    lastBlocked: now,
  })
}
