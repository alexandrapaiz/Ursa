// ursa run <project> — the launch. One explicit invocation: walk the
// project's git history for generated→edited commit pairs, resolve
// each into an outcome record under <project>/.ursa/, print a summary
// that leads with what survived, and exit. No process before, none
// after.
//
//   npx tsx src/bin/ursa.ts run <projectPath> [--limit N] [--min-chars N]
//
// ursa bridge <project> — the overlay's local half (plan §16.2): tails
// the project's session log, reads the stated verdict, encrypts, and
// syncs ciphertext for the hosted page. Resident while open, exits on
// close, started by nothing but the owner.
//
//   URSA_PASSPHRASE=... npx tsx src/bin/ursa.ts bridge <projectPath> \
//     [--sync-url https://...] [--session <file>] [--interval ms] [--port 7817]

import { parseArgs } from 'node:util'
import { resolve as absPath, extname } from 'node:path'
import { blobAt, findCommitPairs } from '../pairfinder'
import { deriveSignals, UNDECLARED, type Declaration } from '../signals'
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
      declare: { type: 'string' },
      'sync-url': { type: 'string' },
      session: { type: 'string' },
      interval: { type: 'string' },
      port: { type: 'string' },
    },
  })
  const [cmd, project] = positionals
  if ((cmd !== 'run' && cmd !== 'bridge') || !project) {
    console.error('Usage: ursa run <projectPath> [--limit N] [--min-chars N]')
    console.error('       ursa bridge <projectPath> [--sync-url URL] [--session FILE] [--interval MS] [--port N]')
    return 2
  }
  if (cmd === 'bridge') {
    const passphrase = process.env.URSA_PASSPHRASE ?? (await promptHidden('passphrase (held in memory only): '))
    if (!passphrase) { console.error('a passphrase is required; it derives the key and the blob id'); return 2 }
    const { startBridge } = await import('../bridge/index')
    const handle = await startBridge({
      projectPath: absPath(project),
      passphrase,
      syncUrl: (values['sync-url'] ?? 'https://ursa-overlay.vercel.app').replace(/\/$/, ''),
      session: values.session,
      intervalMs: values.interval ? Number(values.interval) : undefined,
      port: values.port ? Number(values.port) : undefined,
      allowOrigins: ['https://ursa-overlay.vercel.app'],
    })
    await new Promise<void>((resolve) => {
      process.on('SIGINT', () => { void handle.stop().then(resolve) })
      process.on('SIGTERM', () => { void handle.stop().then(resolve) })
    })
    return 0
  }
  const projectPath = absPath(project)
  const minChars = Number(values['min-chars'] ?? 200)
  const limit = values.limit ? Number(values.limit) : Infinity

  let declaration: Declaration = UNDECLARED
  if (values.declare === 'satisfied') {
    declaration = { accepted: true, basis: 'owner-declared satisfied at launch (--declare satisfied)' }
  } else if (values.declare === 'unsatisfied') {
    declaration = { accepted: false, basis: 'owner-declared unsatisfied at launch (--declare unsatisfied): survived text is not endorsed, it is not-yet-fixed' }
  }

  const pairs = findCommitPairs(projectPath)
  const episodes = buildEpisodes(pairs, projectPath).slice(0, limit)
  const records: OutcomeRecord[] = []
  for (const ep of episodes) {
    const record = resolveEpisode(projectPath, ep)
    if (!record || record.stats.generated.totalChars < minChars) continue
    record.signals = deriveSignals(record, declaration)
    saveRecord(projectPath, record)
    records.push(record)
  }
  saveEpisodes(projectPath, episodes)
  console.log(renderRunSummary(records, episodes))
  console.log(`\nRecords: ${projectPath}/.ursa/records/`)
  return 0
}

/** Read a line from the tty without echoing it. */
function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question)
    const stdin = process.stdin
    if (!stdin.isTTY) {
      let buf = ''
      stdin.setEncoding('utf8')
      stdin.on('data', (d: string) => { buf += d })
      stdin.on('end', () => resolve(buf.trim()))
      return
    }
    stdin.setRawMode(true)
    stdin.resume()
    let value = ''
    const onData = (ch: Buffer) => {
      const c = ch.toString('utf8')
      if (c === '\n' || c === '\r' || c === '\u0004') {
        stdin.setRawMode(false)
        stdin.pause()
        stdin.off('data', onData)
        process.stdout.write('\n')
        resolve(value)
      } else if (c === '\u0003') {
        process.stdout.write('\n')
        process.exit(130)
      } else if (c === '\u007f') {
        value = value.slice(0, -1)
      } else {
        value += c
      }
    }
    stdin.on('data', onData)
  })
}

const invokedDirectly = process.argv[1]?.endsWith('ursa.ts')
if (invokedDirectly) {
  main(process.argv.slice(2)).then((code) => process.exit(code))
}
