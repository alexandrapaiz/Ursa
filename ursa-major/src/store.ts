// Record store: per-project .ursa/, like .git/ — records, the episode
// index, and the distillation watermark all live with the project they
// came from. Nothing global, nothing commingled.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
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
