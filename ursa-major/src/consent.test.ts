// Covers the three invariants stated at the top of src/consent.ts:
// fail closed, revocation is auditable, erasure reaches the inference.

import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  consentPath,
  forget,
  grantScope,
  isForgotten,
  isGranted,
  loadConsent,
  revokeScope,
  saveConsent,
  tuningPathFor,
  withheldByDefault,
} from './consent'
import { forgetRecordInTuning, revokeAxiom } from './tuning/revoke'
import type { TuningAxiom, TuningRecord } from './tuning/types'

function project(): string {
  return mkdtempSync(join(tmpdir(), 'ursa-consent-'))
}

/** Write a raw string straight into .ursa/consent.json, bypassing saveConsent. */
function writeRawConsent(root: string, body: string): void {
  mkdirSync(join(root, '.ursa'), { recursive: true })
  writeFileSync(consentPath(root), body)
}

function axiom(id: string, recordIds: string[], over: Partial<TuningAxiom> = {}): TuningAxiom {
  return {
    id,
    statement: `prefer thing ${id}`,
    domain: 'process',
    polarity: 'prefer',
    basis: 'tacit',
    evidenceCount: recordIds.length,
    evidence: recordIds.map((recordId, i) => ({ recordId, kind: 'episode', ref: `e${i}`, steps: [i + 1] })),
    contradicts: [],
    firstSeen: '2026-09-01T00:00:00.000Z',
    lastSeen: '2026-09-01T00:00:00.000Z',
    status: 'active',
    ...over,
  }
}

function tuning(axioms: TuningAxiom[], recordIds: string[]): TuningRecord {
  return {
    schemaVersion: '0.1.0',
    owner: 'local',
    updatedAt: '2026-09-01T00:00:00.000Z',
    sources: recordIds.map((recordId) => ({
      recordId, distilledAt: '2026-09-01T00:00:00.000Z', method: 'rlaif-claude' as const, model: 'sonnet',
    })),
    axioms,
  }
}

describe('consent fails closed', () => {
  it('reads as withheld when no consent file exists at all', () => {
    const root = project()
    const consent = loadConsent(root)
    expect(consent.scopes['minor-aggregate'].state).toBe('withheld')
    expect(isGranted(consent, 'minor-aggregate')).toBe(false)
    expect(consent.scopes['minor-aggregate'].changedAt).toBeNull()
  })

  it.each([
    ['empty', ''],
    ['truncated mid-object', '{"scopes":{"minor-aggregate":{"state":"gran'],
    ['not an object', '"granted"'],
    ['null', 'null'],
    ['an array', '[]'],
  ])('reads as withheld when the file is %s', (_label, body) => {
    const root = project()
    writeRawConsent(root, body)
    expect(isGranted(loadConsent(root), 'minor-aggregate')).toBe(false)
  })

  it.each([
    ['boolean true', '{"scopes":{"minor-aggregate":{"state":true}}}'],
    ['the number 1', '{"scopes":{"minor-aggregate":{"state":1}}}'],
    ['a different case', '{"scopes":{"minor-aggregate":{"state":"GRANTED"}}}'],
    ['a near miss', '{"scopes":{"minor-aggregate":{"state":"grant"}}}'],
    ['a missing scope', '{"scopes":{}}'],
  ])('refuses to read %s as a grant', (_label, body) => {
    const root = project()
    writeRawConsent(root, body)
    expect(isGranted(loadConsent(root), 'minor-aggregate')).toBe(false)
  })

  it('grants only on the literal string, and the file round-trips', () => {
    const root = project()
    grantScope(root, 'minor-aggregate', 'test')
    expect(isGranted(loadConsent(root), 'minor-aggregate')).toBe(true)
    expect(JSON.parse(readFileSync(consentPath(root), 'utf8')).scopes['minor-aggregate'].state).toBe('granted')
  })
})

describe('revocation is auditable', () => {
  it('keeps every transition with its timestamp and the action that caused it', () => {
    const root = project()
    grantScope(root, 'minor-aggregate', 'ursa consent grant --scope minor-aggregate', '2026-10-01T10:00:00.000Z')
    revokeScope(root, 'minor-aggregate', 'ursa consent revoke --scope minor-aggregate', '2026-10-01T11:00:00.000Z')
    const s = loadConsent(root).scopes['minor-aggregate']
    expect(s.state).toBe('withheld')
    expect(s.changedAt).toBe('2026-10-01T11:00:00.000Z')
    expect(s.history).toEqual([
      { at: '2026-10-01T10:00:00.000Z', from: 'withheld', to: 'granted', by: 'ursa consent grant --scope minor-aggregate' },
      { at: '2026-10-01T11:00:00.000Z', from: 'granted', to: 'withheld', by: 'ursa consent revoke --scope minor-aggregate' },
    ])
  })

  it('records a re-grant as its own event rather than collapsing it', () => {
    const root = project()
    grantScope(root, 'minor-aggregate', 'first', '2026-10-01T10:00:00.000Z')
    grantScope(root, 'minor-aggregate', 'again', '2026-10-01T12:00:00.000Z')
    expect(loadConsent(root).scopes['minor-aggregate'].history).toHaveLength(2)
  })

  it('a saved default is still read as withheld', () => {
    const root = project()
    saveConsent(root, withheldByDefault('2026-10-01T00:00:00.000Z'))
    expect(isGranted(loadConsent(root), 'minor-aggregate')).toBe(false)
  })
})

describe('erasure reaches the inference', () => {
  it('deletes an axiom outright when the forgotten record was its only evidence', () => {
    const t = tuning([axiom('ax-001', ['rec-a']), axiom('ax-002', ['rec-b'])], ['rec-a', 'rec-b'])
    const r = forgetRecordInTuning(t, 'rec-a', 'NOW')
    expect(r.axiomsDeleted).toEqual(['ax-001'])
    expect(r.tuning.axioms.map((a) => a.id)).toEqual(['ax-002'])
    // Not tombstoned: a tombstone would preserve the statement derived
    // from the record the user just erased.
    expect(r.tuning.axioms.some((a) => a.id === 'ax-001')).toBe(false)
  })

  it('keeps an axiom grounded in other records, and recounts its evidence', () => {
    const t = tuning([axiom('ax-001', ['rec-a', 'rec-b', 'rec-a'])], ['rec-a', 'rec-b'])
    const r = forgetRecordInTuning(t, 'rec-a', 'NOW')
    expect(r.axiomsDeleted).toEqual([])
    expect(r.evidenceStripped).toBe(2)
    const kept = r.tuning.axioms[0]
    expect(kept.evidence.map((e) => e.recordId)).toEqual(['rec-b'])
    expect(kept.evidenceCount).toBe(1)
    expect(kept.lastSeen).toBe('NOW')
  })

  it('removes the record from tuning.sources', () => {
    const t = tuning([axiom('ax-001', ['rec-b'])], ['rec-a', 'rec-b'])
    const r = forgetRecordInTuning(t, 'rec-a', 'NOW')
    expect(r.sourcesRemoved).toBe(1)
    expect(r.tuning.sources.map((s) => s.recordId)).toEqual(['rec-b'])
  })

  it('drops a dangling tension pointing at a deleted axiom', () => {
    const t = tuning(
      [axiom('ax-001', ['rec-a'], { contradicts: ['ax-002'] }), axiom('ax-002', ['rec-b'], { contradicts: ['ax-001'] })],
      ['rec-a', 'rec-b']
    )
    const r = forgetRecordInTuning(t, 'rec-a', 'NOW')
    expect(r.axiomsDeleted).toEqual(['ax-001'])
    expect(r.tuning.axioms[0].contradicts).toEqual([])
  })

  it('leaves a tuning record untouched when the id is not a source of anything', () => {
    const t = tuning([axiom('ax-001', ['rec-b'])], ['rec-b'])
    const r = forgetRecordInTuning(t, 'rec-zzz', 'NOW')
    expect(r).toMatchObject({ axiomsDeleted: [], evidenceStripped: 0, sourcesRemoved: 0 })
    expect(r.tuning.axioms).toEqual(t.axioms)
  })
})

describe('forget on disk', () => {
  function seeded(): { root: string; recordFile: string } {
    const root = project()
    mkdirSync(join(root, '.ursa', 'records'), { recursive: true })
    const recordFile = join(root, '.ursa', 'records', 'rec-a.json')
    writeFileSync(recordFile, JSON.stringify({ task: { id: 'rec-a' } }))
    writeFileSync(
      tuningPathFor(root),
      JSON.stringify(tuning([axiom('ax-001', ['rec-a']), axiom('ax-002', ['rec-a', 'rec-b'])], ['rec-a', 'rec-b']))
    )
    return { root, recordFile }
  }

  it('removes the file, prunes the tuning record, and tombstones the id', () => {
    const { root, recordFile } = seeded()
    const t = forget(root, 'rec-a', '2026-10-01T09:00:00.000Z')
    expect(existsSync(recordFile)).toBe(false)
    expect(t.removed).toEqual({
      recordFile: true, axiomsDeleted: ['ax-001'], evidenceStripped: 2, sourcesRemoved: 1,
    })
    const after = JSON.parse(readFileSync(tuningPathFor(root), 'utf8')) as TuningRecord
    expect(after.axioms.map((a) => a.id)).toEqual(['ax-002'])
    expect(after.axioms[0].evidenceCount).toBe(1)
    expect(isForgotten(loadConsent(root), 'rec-a')).toBe(true)
  })

  it('is idempotent and does not accumulate duplicate tombstones', () => {
    const { root } = seeded()
    forget(root, 'rec-a')
    forget(root, 'rec-a')
    expect(loadConsent(root).forgotten.filter((x) => x.recordId === 'rec-a')).toHaveLength(1)
  })

  it('tombstones an id that was never on disk, so a later run cannot create it', () => {
    const root = project()
    const t = forget(root, 'rec-never')
    expect(t.removed.recordFile).toBe(false)
    expect(isForgotten(loadConsent(root), 'rec-never')).toBe(true)
  })

  it('survives a project that has no tuning record yet', () => {
    const root = project()
    mkdirSync(join(root, '.ursa', 'records'), { recursive: true })
    writeFileSync(join(root, '.ursa', 'records', 'rec-a.json'), '{}')
    expect(() => forget(root, 'rec-a')).not.toThrow()
    expect(existsSync(join(root, '.ursa', 'records', 'rec-a.json'))).toBe(false)
  })
})

describe('revokeAxiom (product-plan.md §2 component 9)', () => {
  it('tombstones the axiom instead of deleting it, so a re-distill cannot resurrect it', () => {
    const root = project()
    mkdirSync(join(root, '.ursa'), { recursive: true })
    const path = tuningPathFor(root)
    writeFileSync(path, JSON.stringify(tuning([axiom('ax-001', ['rec-a'])], ['rec-a'])))
    const updated = revokeAxiom(path, 'ax-001', 'NOW')
    expect(updated.axioms[0].status).toBe('revoked')
    expect(updated.axioms[0].statement).toBe('prefer thing ax-001')
    expect(JSON.parse(readFileSync(path, 'utf8')).axioms[0].status).toBe('revoked')
  })

  it('throws on an unknown id rather than reporting a revocation that did not happen', () => {
    const root = project()
    mkdirSync(join(root, '.ursa'), { recursive: true })
    const path = tuningPathFor(root)
    writeFileSync(path, JSON.stringify(tuning([axiom('ax-001', ['rec-a'])], ['rec-a'])))
    expect(() => revokeAxiom(path, 'ax-404')).toThrow(/No axiom ax-404/)
  })

  it('throws when there is no tuning record at all', () => {
    expect(() => revokeAxiom(join(project(), '.ursa', 'tuning.json'), 'ax-001')).toThrow(/No tuning record/)
  })
})
