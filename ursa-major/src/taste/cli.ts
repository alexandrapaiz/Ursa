// Taste CLI.
//
//   npx tsx src/taste/cli.ts distill --record <outcome_record.json> \
//     --taste <taste.json> [--owner <label>] [--model sonnet]
//
//   npx tsx src/taste/cli.ts export --taste <taste.json> [--out taste.md]
//
// distill runs the interpretation pass locally (claude -p) and merges
// the result into the taste record, creating it if absent. export
// renders the portable context block.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import type { OutcomeRecord } from '../types'
import type { TasteRecord } from './types'
import { distill } from './distill'
import { emptyTaste, mergeDistill } from './merge'
import { renderTasteBlock } from './export'

function arg(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 ? argv[i + 1] : undefined
}

function main(): void {
  const [cmd, ...rest] = process.argv.slice(2)
  if (cmd === 'distill') {
    const recordPath = arg(rest, 'record')
    const tastePath = arg(rest, 'taste')
    if (!recordPath || !tastePath) throw new Error('distill needs --record and --taste')
    const model = arg(rest, 'model') ?? 'sonnet'
    const owner = arg(rest, 'owner') ?? 'local'
    const record = JSON.parse(readFileSync(recordPath, 'utf8')) as OutcomeRecord
    const taste: TasteRecord = existsSync(tastePath)
      ? (JSON.parse(readFileSync(tastePath, 'utf8')) as TasteRecord)
      : emptyTaste(owner)
    if (taste.sources.some((s) => s.recordId === record.task.id)) {
      throw new Error(`Record ${record.task.id} already distilled into this taste file`)
    }
    const output = distill(record, taste, model)
    const merged = mergeDistill(taste, output, record, model)
    writeFileSync(tastePath, JSON.stringify(merged, null, 2) + '\n')
    const added = merged.axioms.length - taste.axioms.length
    console.log(
      `Distilled ${output.axioms.length} axioms from ${record.task.id}: ` +
        `${added} new, ${output.axioms.length - added} reinforced. → ${tastePath}`
    )
  } else if (cmd === 'export') {
    const tastePath = arg(rest, 'taste')
    if (!tastePath) throw new Error('export needs --taste')
    const out = arg(rest, 'out') ?? 'taste.md'
    const taste = JSON.parse(readFileSync(tastePath, 'utf8')) as TasteRecord
    writeFileSync(out, renderTasteBlock(taste))
    console.log(`Exported ${taste.axioms.filter((a) => a.status !== 'revoked').length} axioms → ${out}`)
  } else {
    throw new Error('Usage: taste/cli.ts distill|export ...')
  }
}

main()
