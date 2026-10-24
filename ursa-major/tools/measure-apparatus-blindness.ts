// How blind is the record to the apparatus, and where does the field belong?
//
// Two questions, both answered over real records rather than argued:
//
//   1. WHERE. Ursa's research seat proposed "one optional field on
//      SourcePointer carrying the client and its output limit"
//      (board note, 2026-10-24). A SourcePointer is a pointer to a
//      character range and the apparatus is a property of a call, so the
//      proposal's cost is however many pointers a record holds per
//      generation. This counts that ratio.
//   2. WHAT CAN BE FILLED. Each generation's `apparatus.observability`
//      (src/apparatus.ts), tallied, so the share of today's corpus that
//      structurally cannot carry a cap is a number and not a claim.
//
// Run it over any directory of records:
//
//   npx tsx tools/measure-apparatus-blindness.ts .ursa/records
//   npx tsx tools/measure-apparatus-blindness.ts fixtures/real
//
// Measured on this repository's own history on 2026-10-24, resolved with
//   npx tsx src/bin/ursa.ts run <repo> --max-pair-distance 400 \
//     --max-pair-age-hours 720 --limit 60 --min-chars 200
// over 1,090 commits: 12 records, 14 generations, 7,525 SourcePointer
// instances. 537.5 pointers per generation on average and 2,161 in the
// largest single record, so the proposed field would have written one
// constant 7,525 times to describe 14 calls.

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { OutcomeRecord } from '../src/types'

/** Count SourcePointer-shaped objects anywhere in a record, at any depth. */
function countPointers(node: unknown): number {
  if (Array.isArray(node)) return node.reduce<number>((n, v) => n + countPointers(v), 0)
  if (node === null || typeof node !== 'object') return 0
  const o = node as Record<string, unknown>
  const isPointer =
    typeof o.conversationId === 'string' &&
    typeof o.generationIndex === 'number' &&
    typeof o.start === 'number' &&
    typeof o.end === 'number'
  let n = isPointer ? 1 : 0
  for (const v of Object.values(o)) n += countPointers(v)
  return n
}

function main() {
  const dir = process.argv[2] ?? '.ursa/records'
  const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort()

  let pointers = 0
  let generations = 0
  let conversations = 0
  let records = 0
  let worstRatio = 0
  let worstFile = ''
  const observability = new Map<string, number>()
  const reasons = new Map<string, number>()
  const models = new Set<string>()
  const adapters = new Set<string>()

  for (const f of files) {
    const rec = JSON.parse(readFileSync(join(dir, f), 'utf8')) as OutcomeRecord
    if (!Array.isArray(rec.generations)) continue
    records += 1
    const p = countPointers(rec)
    const g = rec.generations.length
    pointers += p
    generations += g
    conversations += rec.conversations?.length ?? 0
    if (g > 0 && p / g > worstRatio) {
      worstRatio = p / g
      worstFile = f
    }
    for (const gen of rec.generations) {
      models.add(gen.model)
      const key = gen.apparatus?.observability ?? '(field absent — record predates src/apparatus.ts)'
      observability.set(key, (observability.get(key) ?? 0) + 1)
      if (gen.apparatus?.reason) {
        reasons.set(gen.apparatus.reason, (reasons.get(gen.apparatus.reason) ?? 0) + 1)
      }
    }
    for (const c of rec.conversations ?? []) adapters.add(c.adapter)
  }

  console.log(`records read: ${records}  (from ${dir})`)
  console.log(`generations: ${generations}   conversations: ${conversations}`)
  console.log('')
  console.log('WHERE the field belongs — SourcePointer instances per generation')
  console.log(`  SourcePointer instances: ${pointers}`)
  console.log(`  per generation, mean: ${generations ? (pointers / generations).toFixed(1) : 'n/a'}`)
  console.log(`  worst single record: ${worstRatio.toFixed(0)} per generation (${worstFile})`)
  console.log(
    `  so a field on SourcePointer would store ${pointers} copies of a constant that describes ${generations} calls`,
  )
  console.log('')
  console.log('WHAT CAN BE FILLED — generations by apparatus.observability')
  for (const [k, v] of [...observability].sort((a, b) => b[1] - a[1])) {
    const pct = generations ? ((v / generations) * 100).toFixed(1) : '0.0'
    console.log(`  ${k}: ${v} (${pct}%)`)
  }
  for (const [k, v] of [...reasons].sort((a, b) => b[1] - a[1])) {
    console.log(`    unobservable because ${k}: ${v}`)
  }
  console.log('')
  console.log('WHAT SourcePointer.model actually holds on this corpus')
  for (const m of [...models].sort()) console.log(`  ${JSON.stringify(m)}`)
  console.log(`  ingest adapters present: ${[...adapters].sort().join(', ') || '(none)'}`)
}

main()
