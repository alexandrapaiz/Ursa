// Record store: per-project .ursa/, like .git/ — records, the episode
// index, and the distillation watermark all live with the project they
// came from. Nothing global, nothing commingled.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { currentGateIdentity } from './invariants'
import { currentResolverIdentity } from './resolver-identity'
import type { GateIdentity, OutcomeRecord, ResolverIdentity } from './types'
import type { Episode } from './episodes'

export function ursaDir(projectRoot: string): string {
  return join(projectRoot, '.ursa')
}

/**
 * Write one record to `<project>/.ursa/records/<task.id>.json`, stamping
 * the resolver that made its claims if it does not carry one yet.
 *
 * WHY THE STAMP IS HERE AND NOT IN `resolve()`. `resolve()` is a pure
 * function of its input and the three facts it cannot compute — which
 * merge destroyed a deleted span, whether a rival commit holds a span's
 * text, which paths are imports — all reach it as callbacks or data
 * prepared at the edge, for exactly this reason. The resolver's own
 * commit is a fourth such fact: reading it means running git against a
 * directory that has nothing to do with the project being resolved.
 * Writing is already the edge, it is where a record stops being a value
 * in a process and becomes an artifact somebody can buy, and it is the
 * one place every launch passes through. Four call sites save records
 * today (`src/bin/ursa.ts`, `src/ci/run.ts`, `src/adapters/cli.ts`,
 * `src/bridge/declare.ts`) and a fifth would otherwise be free to forget.
 *
 * WHY IT MUTATES THE ARGUMENT. The caller usually goes on to display or
 * summarize the same object — `src/ci/run.ts` renders the pull request
 * comment from the records it just saved. Returning a stamped copy and
 * writing that would leave the caller holding a record that differs from
 * the file on disk, which is the kind of near-identical pair this field
 * exists to make impossible.
 *
 * WHY THE BOUND SET IS STAMPED HERE TOO, as a second parameter rather
 * than folded into the first. The two facts are independent and one of
 * them can be unavailable while the other is certain. `resolverIdentity()`
 * returns null when there is no git work tree under the running script and
 * no readable artifact to hash, and the bound set is in this process
 * either way, because `currentGateIdentity()` reads an object literal in
 * `src/invariants.ts` and cannot fail. Suppressing a knowable fact because
 * an unrelated one is unknowable would make `task.gatedBy` absent on
 * records whose rules were never in doubt.
 *
 * @param identity the resolver to stamp, defaulting to this process's
 *   own. Passing `null` writes the record with no resolver stamp, which is
 *   what a test asserting on exact record contents wants.
 * @param gate the bound set to stamp, defaulting to this build's own.
 *   `null` suppresses it, for the same tests.
 */
export function saveRecord(
  projectRoot: string,
  record: OutcomeRecord,
  identity: ResolverIdentity | null = currentResolverIdentity(),
  gate: GateIdentity | null = currentGateIdentity(),
): string {
  const dir = join(ursaDir(projectRoot), 'records')
  mkdirSync(dir, { recursive: true })
  const path = join(dir, `${record.task.id}.json`)
  // Preserve, never overwrite. See `task.resolvedBy` in src/types.ts: a
  // re-save that writes signals into an existing record must not credit
  // today's build with yesterday's classifications.
  if (identity && !record.task.resolvedBy) record.task.resolvedBy = identity
  // Same preserve-never-overwrite rule, and it matters more here than for
  // the resolver, because the bound set changes without the resolver's
  // commit changing in the record: a re-save months later would otherwise
  // claim today's eighteen bounds for classifications made under ten.
  if (gate && !record.task.gatedBy) record.task.gatedBy = gate
  writeFileSync(path, JSON.stringify(record, null, 2) + '\n')
  return path
}

export function saveEpisodes(projectRoot: string, episodes: Episode[]): string {
  mkdirSync(ursaDir(projectRoot), { recursive: true })
  const path = join(ursaDir(projectRoot), 'episodes.json')
  writeFileSync(path, JSON.stringify(episodes, null, 2) + '\n')
  return path
}

export function loadEpisodes(projectRoot: string): Episode[] {
  const path = join(ursaDir(projectRoot), 'episodes.json')
  if (!existsSync(path)) return []
  return JSON.parse(readFileSync(path, 'utf8')) as Episode[]
}

export function isDistilled(projectRoot: string, recordId: string): boolean {
  return loadEpisodes(projectRoot).some((e) => e.id === recordId && e.distilled)
}

/** Record ids present for this project, sorted; the filename is the task id. */
export function listRecordIds(projectRoot: string): string[] {
  const dir = join(ursaDir(projectRoot), 'records')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((n) => n.endsWith('.json'))
    .map((n) => n.slice(0, -'.json'.length))
    .sort()
}

/** One record by id, or null when this project has never resolved it. */
export function loadRecord(projectRoot: string, recordId: string): OutcomeRecord | null {
  if (!SAFE_RECORD_ID.test(recordId)) return null
  const path = join(ursaDir(projectRoot), 'records', `${recordId}.json`)
  if (!existsSync(path)) return null
  return JSON.parse(readFileSync(path, 'utf8')) as OutcomeRecord
}

/**
 * Record ids are task ids, which become filenames. Anything outside this
 * shape is refused rather than joined onto a path: the bridge serves
 * records to a browser by id (plan §16.2), so an id is untrusted input.
 */
export const SAFE_RECORD_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/
