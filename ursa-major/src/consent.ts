// Consent and erasure: the user's side of the boundary.
//
// CLAUDE.md names two load-bearing constraints that had no code behind
// them before this file existed:
//
//   2. The user can always see, edit, revoke, and delete what's been
//      inferred about them. No dark patterns.
//   3. Raw processing happens on-device. Raw data never touches the
//      aggregation layer.
//
// This module owns (2) and the state that (3) is enforced against; the
// enforcement itself is `src/disclosure.ts`. Three invariants, each one
// covered by a test in `src/consent.test.ts`:
//
// FAIL CLOSED. A missing, empty, truncated or unparseable consent file
// reads as `withheld` for every scope. Consent is only ever granted by
// a file that says so in as many words. "No dark patterns" has a
// mechanical form, and this is it: the default state of a user who has
// never heard of Ursa Minor is that nothing of theirs is disclosable,
// and a corrupted file cannot silently become a grant.
//
// REVOCATION IS AUDITABLE. Every transition is appended to the scope's
// `history` with a timestamp and the action that caused it. The user can
// read their own consent history; so can an auditor the user invites.
// Nothing overwrites a prior state without leaving the prior state behind.
//
// ERASURE REACHES THE INFERENCE. Deleting a record that an axiom was
// derived from and leaving the axiom standing is not deletion, it is
// deletion theatre. `forget()` removes the record file, strips that
// record's evidence from every axiom, and deletes outright any axiom
// whose evidence was *only* that record, because `tuning/types.ts`
// already states that an axiom without evidence is invalid by
// construction. It also tombstones the record id so `ursa run` does not
// rebuild it from the git history it was derived from in the first place.

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TuningRecord } from './tuning/types'
import { forgetRecordInTuning } from './tuning/revoke'
import { ursaDir } from './store'

/** The only scope that crosses the device boundary today (plan §12: the
 *  third crossing edge, "aggregate scalar batch (Minor-consented only)"). */
export type DisclosureScope = 'minor-aggregate'

export const SCOPES: readonly DisclosureScope[] = ['minor-aggregate']

export type ConsentState = 'withheld' | 'granted'

export interface ConsentChange {
  at: string
  from: ConsentState
  to: ConsentState
  /** the action that caused it, e.g. 'ursa consent grant --scope minor-aggregate' */
  by: string
}

export interface ScopeConsent {
  state: ConsentState
  /** null = never changed from the fail-closed default */
  changedAt: string | null
  history: ConsentChange[]
}

/** What `forget` removed, kept so the user can audit their own erasure. */
export interface Tombstone {
  recordId: string
  forgottenAt: string
  removed: {
    recordFile: boolean
    /** axiom ids deleted outright: this record was their only evidence */
    axiomsDeleted: string[]
    /** evidence entries stripped from axioms that survive on other records */
    evidenceStripped: number
    /** entries removed from tuning.sources */
    sourcesRemoved: number
  }
}

export interface ConsentRecord {
  schemaVersion: '0.1.0'
  updatedAt: string
  scopes: Record<DisclosureScope, ScopeConsent>
  forgotten: Tombstone[]
}

export function consentPath(projectRoot: string): string {
  return join(ursaDir(projectRoot), 'consent.json')
}

export function tuningPathFor(projectRoot: string): string {
  return join(ursaDir(projectRoot), 'tuning.json')
}

/** The fail-closed default. Returned for any file we cannot read as a
 *  grant, including no file at all. */
export function withheldByDefault(now = new Date().toISOString()): ConsentRecord {
  return {
    schemaVersion: '0.1.0',
    updatedAt: now,
    scopes: { 'minor-aggregate': { state: 'withheld', changedAt: null, history: [] } },
    forgotten: [],
  }
}

function coerceScope(raw: unknown): ScopeConsent {
  const o = (raw ?? {}) as Partial<ScopeConsent>
  // Anything that is not the literal string 'granted' is withheld. A
  // truthy-but-wrong value (true, 1, 'yes', 'GRANTED') must not grant.
  const state: ConsentState = o.state === 'granted' ? 'granted' : 'withheld'
  return {
    state,
    changedAt: typeof o.changedAt === 'string' ? o.changedAt : null,
    history: Array.isArray(o.history) ? (o.history as ConsentChange[]) : [],
  }
}

/**
 * Read the project's consent file. Never throws: a file we cannot parse
 * is indistinguishable from an attacker's truncation, and the safe
 * reading of both is "this user has consented to nothing".
 */
export function loadConsent(projectRoot: string): ConsentRecord {
  const path = consentPath(projectRoot)
  if (!existsSync(path)) return withheldByDefault()
  let parsed: unknown
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return withheldByDefault()
  }
  if (parsed === null || typeof parsed !== 'object') return withheldByDefault()
  const o = parsed as Partial<ConsentRecord>
  const scopes = (o.scopes ?? {}) as Partial<Record<DisclosureScope, unknown>>
  return {
    schemaVersion: '0.1.0',
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : new Date().toISOString(),
    scopes: { 'minor-aggregate': coerceScope(scopes['minor-aggregate']) },
    forgotten: Array.isArray(o.forgotten) ? (o.forgotten as Tombstone[]) : [],
  }
}

export function saveConsent(projectRoot: string, consent: ConsentRecord): string {
  mkdirSync(ursaDir(projectRoot), { recursive: true })
  const path = consentPath(projectRoot)
  writeFileSync(path, JSON.stringify(consent, null, 2) + '\n')
  return path
}

export function isGranted(consent: ConsentRecord, scope: DisclosureScope): boolean {
  return consent.scopes[scope]?.state === 'granted'
}

export function isForgotten(consent: ConsentRecord, recordId: string): boolean {
  return consent.forgotten.some((t) => t.recordId === recordId)
}

function setState(
  projectRoot: string,
  scope: DisclosureScope,
  to: ConsentState,
  by: string,
  now: string
): ConsentRecord {
  const consent = loadConsent(projectRoot)
  const current = consent.scopes[scope]
  // An unchanged state is still recorded as an event, because "she
  // re-granted it" and "it was never touched" are different facts.
  const next: ScopeConsent = {
    state: to,
    changedAt: now,
    history: [...current.history, { at: now, from: current.state, to, by }],
  }
  const updated: ConsentRecord = { ...consent, updatedAt: now, scopes: { ...consent.scopes, [scope]: next } }
  saveConsent(projectRoot, updated)
  return updated
}

export function grantScope(
  projectRoot: string,
  scope: DisclosureScope,
  by: string,
  now = new Date().toISOString()
): ConsentRecord {
  return setState(projectRoot, scope, 'granted', by, now)
}

export function revokeScope(
  projectRoot: string,
  scope: DisclosureScope,
  by: string,
  now = new Date().toISOString()
): ConsentRecord {
  return setState(projectRoot, scope, 'withheld', by, now)
}

/**
 * Erase one outcome record and everything derived from it, then
 * tombstone its id so re-deriving the project does not bring it back.
 *
 * Returns the tombstone, which is also appended to the consent file.
 * Idempotent: forgetting an already-forgotten id re-runs the cleanup
 * (harmless, since each step is itself idempotent) and replaces the
 * tombstone rather than accumulating duplicates.
 */
export function forget(
  projectRoot: string,
  recordId: string,
  now = new Date().toISOString()
): Tombstone {
  const recordFile = join(ursaDir(projectRoot), 'records', `${recordId}.json`)
  const hadFile = existsSync(recordFile)
  if (hadFile) rmSync(recordFile)

  let axiomsDeleted: string[] = []
  let evidenceStripped = 0
  let sourcesRemoved = 0
  const tPath = tuningPathFor(projectRoot)
  if (existsSync(tPath)) {
    const tuning = JSON.parse(readFileSync(tPath, 'utf8')) as TuningRecord
    const result = forgetRecordInTuning(tuning, recordId, now)
    writeFileSync(tPath, JSON.stringify(result.tuning, null, 2) + '\n')
    axiomsDeleted = result.axiomsDeleted
    evidenceStripped = result.evidenceStripped
    sourcesRemoved = result.sourcesRemoved
  }

  const tombstone: Tombstone = {
    recordId,
    forgottenAt: now,
    removed: { recordFile: hadFile, axiomsDeleted, evidenceStripped, sourcesRemoved },
  }
  const consent = loadConsent(projectRoot)
  saveConsent(projectRoot, {
    ...consent,
    updatedAt: now,
    forgotten: [...consent.forgotten.filter((t) => t.recordId !== recordId), tombstone],
  })
  return tombstone
}
