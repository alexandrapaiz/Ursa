// `ursa brief` — read the HQ before you work.
//
//   npx tsx src/hq/cli.ts brief <projectPath> [--domain motion] \
//     [--files src/app/page.tsx,src/app/globals.css] \
//     [--max-rules 8] [--max-cases 3] [--json] [--semantic] \
//     [--tuning <path>] [--records <dir>] [--embeddings <path>]
//
// Defaults follow the project store (src/store.ts): the tuning record is
// <projectPath>/.ursa/tuning.json and the outcome records are every
// *.json under <projectPath>/.ursa/records/. Both are overridable so a
// briefing can be taken against a fixture without a project on disk.
//
// Output is markdown on stdout by default, JSON with --json.
//
// `--semantic` additionally ranks the nearest cases by meaning rather
// than by word overlap alone (src/hq/semantic.ts, plan §12). It is
// off by default for three reasons, in order of weight: it needs the
// optional `@huggingface/transformers` dependency, it costs ~2s of model
// load on the first briefing in a process, and the lexical ranking is
// already the better answer whenever the agent named a file this owner
// has actually been corrected on. When the model cannot be loaded the
// flag degrades to the lexical ranking rather than failing, and the
// briefing's coverage line says `lexical-v0` so the difference is
// visible rather than silent.
//
// Except for the embedding cache under --semantic, nothing is written to
// disk: a briefing is a read of the store, never a mutation of it, and
// the agent that asked for one is free to paste it wherever it keeps its
// own context. The cache holds vectors of text already on the machine,
// it is derived rather than authoritative, and deleting it costs only
// the time to recompute.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve as absPath } from 'node:path'
import { parseArgs } from 'node:util'
import type { OutcomeRecord } from '../types'
import type { TuningRecord } from '../tuning/types'
import { emptyTuning } from '../tuning/merge'
import { briefWithSemantics, DEFAULT_MAX_CASES, DEFAULT_MAX_RULES, renderBriefing } from './briefing'
import { loadCache, loadMiniLM, saveCache } from './embedding'
import type { BriefingInput } from './types'

const USAGE = `ursa brief <projectPath> [--domain <tag>] [--files a.ts,b.ts]
       [--max-rules N] [--max-cases N] [--json] [--semantic]
       [--tuning <tuning.json>] [--records <records dir>]
       [--embeddings <embeddings.json>]`

export function loadTuning(path: string): TuningRecord {
  if (!existsSync(path)) return emptyTuning('local')
  return JSON.parse(readFileSync(path, 'utf8')) as TuningRecord
}

export function loadRecords(dir: string): OutcomeRecord[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as OutcomeRecord)
}

export async function main(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      domain: { type: 'string' },
      files: { type: 'string' },
      'max-rules': { type: 'string' },
      'max-cases': { type: 'string' },
      json: { type: 'boolean', default: false },
      tuning: { type: 'string' },
      records: { type: 'string' },
      semantic: { type: 'boolean', default: false },
      embeddings: { type: 'string' },
    },
  })

  const [cmd, project] = positionals
  if (cmd !== 'brief' || !project) {
    console.error(USAGE)
    return 2
  }

  const root = absPath(project)
  const tuningPath = values.tuning ? absPath(values.tuning) : join(root, '.ursa', 'tuning.json')
  const recordsDir = values.records ? absPath(values.records) : join(root, '.ursa', 'records')

  const input: BriefingInput = {
    domain: values.domain,
    files: values.files
      ?.split(',')
      .map((f) => f.trim())
      .filter((f) => f.length > 0),
    maxRules: values['max-rules'] ? Number(values['max-rules']) : DEFAULT_MAX_RULES,
    maxCases: values['max-cases'] ? Number(values['max-cases']) : DEFAULT_MAX_CASES,
  }

  const embeddingsPath = values.embeddings ? absPath(values.embeddings) : join(root, '.ursa', 'embeddings.json')

  // loadMiniLM returns null when the optional dependency is absent or the
  // weights cannot be fetched. That is the degrade path, not an error:
  // briefWithSemantics falls back to lexical and labels the result.
  const embedder = values.semantic ? await loadMiniLM() : null
  if (values.semantic && !embedder) {
    console.error(
      'note: --semantic asked for, but all-MiniLM-L6-v2 could not be loaded; ' +
        'ranking lexically instead. Install it with: npm install --include=optional'
    )
  }
  const cache = embedder ? loadCache(embeddingsPath, embedder.id) : loadCache(embeddingsPath)
  const before = Object.keys(cache.vectors).length

  const briefing = await briefWithSemantics(
    loadTuning(tuningPath),
    loadRecords(recordsDir),
    input,
    embedder,
    cache
  )
  // Only touch disk when there is something new to keep, so a briefing
  // over an unchanged store leaves the mtime alone.
  if (embedder && Object.keys(cache.vectors).length > before) saveCache(embeddingsPath, cache)

  console.log(values.json ? JSON.stringify(briefing, null, 2) : renderBriefing(briefing))
  return 0
}

const invokedDirectly = process.argv[1]?.endsWith('hq/cli.ts') || process.argv[1]?.endsWith('hq\\cli.ts')
// .then rather than top-level await: this file is imported by hq.test.ts,
// which tsx may transform to CJS, and CJS has no top-level await.
if (invokedDirectly) void main(process.argv.slice(2)).then((code) => process.exit(code))
