// Record store: per-project .ursa/, like .git/ — records, the episode
// index, and the distillation watermark all live with the project they
// came from. Nothing global, nothing commingled.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { OutcomeRecord } from './types'
import type { Episode } from './episodes'

export function ursaDir(projectRoot: string): string {
  return join(projectRoot, '.ursa')
}

export function saveRecord(projectRoot: string, record: OutcomeRecord): string {
  const dir = join(ursaDir(projectRoot), 'records')
  mkdirSync(dir, { recursive: true })
  const path = join(dir, `${record.task.id}.json`)
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
