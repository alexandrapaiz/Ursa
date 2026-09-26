// `ursa brief` — read the HQ before you work.
//
//   npx tsx src/hq/cli.ts brief <projectPath> [--domain motion] \
//     [--files src/app/page.tsx,src/app/globals.css] \
//     [--max-rules 8] [--max-cases 3] [--json] \
//     [--tuning <path>] [--records <dir>]
//
// Defaults follow the project store (src/store.ts): the tuning record is
// <projectPath>/.ursa/tuning.json and the outcome records are every
// *.json under <projectPath>/.ursa/records/. Both are overridable so a
// briefing can be taken against a fixture without a project on disk.
//
// Output is markdown on stdout by default, JSON with --json. Nothing is
// written to disk: a briefing is a read of the store, never a mutation
// of it, and the agent that asked for one is free to paste it wherever
// it keeps its own context.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve as absPath } from 'node:path'
import { parseArgs } from 'node:util'
import type { OutcomeRecord } from '../types'
import type { TuningRecord } from '../tuning/types'
import { emptyTuning } from '../tuning/merge'
import { buildBriefing, DEFAULT_MAX_CASES, DEFAULT_MAX_RULES, renderBriefing } from './briefing'
import type { BriefingInput } from './types'

const USAGE = `ursa brief <projectPath> [--domain <tag>] [--files a.ts,b.ts]
       [--max-rules N] [--max-cases N] [--json]
       [--tuning <tuning.json>] [--records <records dir>]`

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

export function main(argv: string[]): number {
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

  const briefing = buildBriefing(loadTuning(tuningPath), loadRecords(recordsDir), input)
  console.log(values.json ? JSON.stringify(briefing, null, 2) : renderBriefing(briefing))
  return 0
}

const invokedDirectly = process.argv[1]?.endsWith('hq/cli.ts') || process.argv[1]?.endsWith('hq\\cli.ts')
if (invokedDirectly) process.exit(main(process.argv.slice(2)))
