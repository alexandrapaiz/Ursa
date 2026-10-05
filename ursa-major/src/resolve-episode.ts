// Resolving one work unit. Shared by both launches: `ursa run`, which the
// user types against a finished project, and `ursa ci`, which a merged
// pull request fires on a runner. Extracted from src/bin/ursa.ts so the
// CI launch does not have to import the CLI entrypoint and create an
// import cycle; the behaviour is unchanged.

import { extname } from 'node:path'
import { blobAt } from './pairfinder'
import { resolve } from './resolve'
import type { Episode } from './episodes'
import type { OutcomeRecord, RawGeneration } from './types'

const TEXT_EXTS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.css', '.scss', '.html',
  '.md', '.mdx', '.txt', '.tex', '.json', '.yml', '.yaml', '.toml', '.sql',
])
const SKIP_FILES = new Set(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'])
const MAX_BLOB_CHARS = 300_000

export function resolveEpisode(projectPath: string, ep: Episode): OutcomeRecord | null {
  const files: Array<{ path: string; text: string }> = []
  const generations: RawGeneration[] = []
  let turn = 0
  for (const path of ep.touchedFiles) {
    if (!TEXT_EXTS.has(extname(path)) || SKIP_FILES.has(path.split('/').pop() ?? '')) continue
    const genText = blobAt(projectPath, ep.generatedSha, path)
    const finText = blobAt(projectPath, ep.finalSha, path)
    if (genText === null || finText === null) continue
    if (genText.length > MAX_BLOB_CHARS || finText.length > MAX_BLOB_CHARS) continue
    turn++
    files.push({ path, text: finText })
    generations.push({
      conversationId: `git-${ep.generatedSha.slice(0, 7)}`,
      model: ep.agentMarker,
      turnIndex: turn,
      kind: 'write',
      filePath: path,
      timestamp: ep.openedAt,
      text: genText,
    })
  }
  if (files.length === 0 || generations.length === 0) return null
  return resolve({
    taskId: ep.id,
    files,
    conversations: [{
      id: `git-${ep.generatedSha.slice(0, 7)}`,
      title: ep.subject,
      adapter: 'git',
      model: ep.agentMarker,
      date: ep.openedAt,
      turns: turn,
      userTurns: 0,
    }],
    generations,
    finished: true,
    generatedAt: ep.closedAt,
  })
}
