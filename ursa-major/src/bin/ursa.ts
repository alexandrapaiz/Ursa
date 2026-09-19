// ursa run <project> — the launch. One explicit invocation: walk the
// project's git history for generated→edited commit pairs, resolve
// each into an outcome record under <project>/.ursa/, print a summary
// that leads with what survived, and exit. No process before, none
// after.
//
//   npx tsx src/bin/ursa.ts run <projectPath> [--limit N] [--min-chars N]

import { parseArgs } from 'node:util'
import { resolve as absPath, extname } from 'node:path'
import { blobAt, findCommitPairs } from '../pairfinder'
import { buildEpisodes, type Episode } from '../episodes'
import { resolve } from '../resolve'
import { saveEpisodes, saveRecord } from '../store'
import type { OutcomeRecord, RawGeneration } from '../types'

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

export function renderRunSummary(records: OutcomeRecord[], episodes: Episode[]): string {
  const lines: string[] = []
  let verbatim = 0, mutated = 0, generated = 0, deleted = 0
  for (const r of records) {
    verbatim += r.stats.byClass.survived_verbatim.chars
    mutated += r.stats.byClass.survived_mutated.chars
    generated += r.stats.generated.totalChars
    deleted += r.stats.generated.deletedChars
  }
  lines.push(`${episodes.length} work units found, ${records.length} resolved into records.`)
  lines.push(`${verbatim.toLocaleString()} chars survived your editing verbatim, ${mutated.toLocaleString()} survived edited.`)
  lines.push(`That's the part worth noticing: not what got written, what got kept.`)
  if (generated > 0) {
    const pct = Math.round((deleted / generated) * 100)
    lines.push(`${generated.toLocaleString()} chars were generated to get there; ${pct}% were drafts you discarded on the way.`)
  }
  const edited = records.filter((r) => r.stats.byClass.survived_mutated.chars > 0).length
  if (edited > 0) lines.push(`${edited} record${edited === 1 ? '' : 's'} carry your corrections — the whys live there.`)
  return lines.join('\n')
}

export async function main(argv: string[]): Promise<number> {
  const { positionals, values } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      limit: { type: 'string' },
      'min-chars': { type: 'string' },
    },
  })
  const [cmd, project] = positionals
  if (cmd !== 'run' || !project) {
    console.error('Usage: ursa run <projectPath> [--limit N] [--min-chars N]')
    return 2
  }
  const projectPath = absPath(project)
  const minChars = Number(values['min-chars'] ?? 200)
  const limit = values.limit ? Number(values.limit) : Infinity

  const pairs = findCommitPairs(projectPath)
  const episodes = buildEpisodes(pairs, projectPath).slice(0, limit)
  const records: OutcomeRecord[] = []
  for (const ep of episodes) {
    const record = resolveEpisode(projectPath, ep)
    if (!record || record.stats.generated.totalChars < minChars) continue
    saveRecord(projectPath, record)
    records.push(record)
  }
  saveEpisodes(projectPath, episodes)
  console.log(renderRunSummary(records, episodes))
  console.log(`\nRecords: ${projectPath}/.ursa/records/`)
  return 0
}

const invokedDirectly = process.argv[1]?.endsWith('ursa.ts')
if (invokedDirectly) {
  main(process.argv.slice(2)).then((code) => process.exit(code))
}
