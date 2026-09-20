// Tuning CLI.
//
//   npx tsx src/tuning/cli.ts distill --record <outcome_record.json> \
//     --tuning <tuning.json> [--owner <label>] [--model sonnet]
//
//   npx tsx src/tuning/cli.ts export --tuning <tuning.json> [--out tuning.md]
//
// distill runs the interpretation pass locally (claude -p) and merges
// the result into the tuning record, creating it if absent. export
// renders the portable context block.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import type { OutcomeRecord } from '../types'
import type { TuningRecord } from './types'
import { distill } from './distill'
import { emptyTuning, mergeDistill } from './merge'
import { renderTuningBlock } from './export'

function arg(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 ? argv[i + 1] : undefined
}

function main(): void {
  const [cmd, ...rest] = process.argv.slice(2)
  if (cmd === 'distill') {
    const recordPath = arg(rest, 'record')
    const tuningPath = arg(rest, 'tuning')
    if (!recordPath || !tuningPath) throw new Error('distill needs --record and --tuning')
    const model = arg(rest, 'model') ?? 'sonnet'
    const owner = arg(rest, 'owner') ?? 'local'
    const record = JSON.parse(readFileSync(recordPath, 'utf8')) as OutcomeRecord
    const tuning: TuningRecord = existsSync(tuningPath)
      ? (JSON.parse(readFileSync(tuningPath, 'utf8')) as TuningRecord)
      : emptyTuning(owner)
    if (tuning.sources.some((s) => s.recordId === record.task.id)) {
      throw new Error(`Record ${record.task.id} already distilled into this tuning file`)
    }
    const output = distill(record, tuning, model)
    const merged = mergeDistill(tuning, output, record, model)
    writeFileSync(tuningPath, JSON.stringify(merged, null, 2) + '\n')
    const added = merged.axioms.length - tuning.axioms.length
    console.log(
      `Distilled ${output.axioms.length} axioms from ${record.task.id}: ` +
        `${added} new, ${output.axioms.length - added} reinforced. → ${tuningPath}`
    )
  } else if (cmd === 'export') {
    const tuningPath = arg(rest, 'tuning')
    if (!tuningPath) throw new Error('export needs --tuning')
    const out = arg(rest, 'out') ?? 'tuning.md'
    const tuning = JSON.parse(readFileSync(tuningPath, 'utf8')) as TuningRecord
    writeFileSync(out, renderTuningBlock(tuning))
    console.log(`Exported ${tuning.axioms.filter((a) => a.status !== 'revoked').length} axioms → ${out}`)
  } else {
    throw new Error('Usage: tuning/cli.ts distill|export ...')
  }
}

main()
