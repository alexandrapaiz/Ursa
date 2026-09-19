// Deterministic merge of one distillation pass into the taste record.
// The model judged (statements, matches, contradictions); this code
// counts. Confidence IS evidenceCount — recurrence across records,
// never a model's self-reported score.

import type { OutcomeRecord } from '../types'
import type { DistillOutput, TasteAxiom, TasteRecord } from './types'

function axiomId(existing: TasteAxiom[]): string {
  let n = existing.length + 1
  const taken = new Set(existing.map((a) => a.id))
  while (taken.has(`ax-${String(n).padStart(3, '0')}`)) n++
  return `ax-${String(n).padStart(3, '0')}`
}

export function emptyTaste(owner: string): TasteRecord {
  return {
    schemaVersion: '0.1.0',
    owner,
    updatedAt: new Date().toISOString(),
    sources: [],
    axioms: [],
  }
}

export function mergeDistill(
  taste: TasteRecord,
  output: DistillOutput,
  record: OutcomeRecord,
  model: string,
  now = new Date().toISOString()
): TasteRecord {
  const recordId = record.task.id
  const axioms = taste.axioms.map((a) => ({ ...a, evidence: [...a.evidence], contradicts: [...a.contradicts] }))
  const byId = new Map(axioms.map((a) => [a.id, a]))
  // Second pass resolves contradiction ids for axioms new in this run.
  const newIdsByStatement = new Map<string, string>()

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
      const id = axiomId(axioms)
      const created: TasteAxiom = {
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
    ...taste,
    updatedAt: now,
    sources: [...taste.sources, { recordId, distilledAt: now, method: 'rlaif-claude', model }],
    axioms,
  }
}
