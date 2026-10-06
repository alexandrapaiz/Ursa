// The gate, on the command line. Reads records off disk and exits non-zero
// if any of them violates its own arithmetic.
//
//   npx tsx src/invariants.cli.ts fixtures/mini/record/outcome_record.json
//   npx tsx src/invariants.cli.ts <project>/.ursa/records
//   npx tsx src/invariants.cli.ts <project>/.ursa/records --quiet
//
// A directory argument checks every *.json in it, non-recursively, which is
// the shape `ursa run` writes. `--quiet` suppresses the per-record
// measurement block and prints only violations, for use in a pre-push hook.
//
// This exists as a CLI and not only as a test because the records worth
// checking hardest are the ones made from real history on someone's own
// machine, and those never become fixtures: they hold verbatim prompts and
// stay local (CLAUDE.md, constraint 3). The gate has to be runnable where
// the record is.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { checkRecord, formatViolations, measure } from './invariants'
import type { OutcomeRecord } from './types'

export function recordPaths(target: string): string[] {
  if (statSync(target).isDirectory()) {
    return readdirSync(target)
      .filter((f) => f.endsWith('.json'))
      .sort()
      .map((f) => join(target, f))
  }
  return [target]
}

export function runGate(target: string, quiet = false): { violations: number; lines: string[] } {
  const lines: string[] = []
  let violations = 0
  const paths = recordPaths(target)
  if (paths.length === 0) {
    lines.push(`No .json records under ${target}. Nothing checked, which is not the same as nothing wrong.`)
    return { violations: 0, lines }
  }
  for (const p of paths) {
    const record = JSON.parse(readFileSync(p, 'utf8')) as OutcomeRecord
    const found = checkRecord(record)
    const m = measure(record)
    violations += found.length
    lines.push(`${p}`)
    if (!quiet) {
      lines.push(`  generated ${m.generatedCharsWritten.toLocaleString()} chars, of which ${m.generatedSeparatorChars.toLocaleString()} sit between segments and carry no fate`)
      lines.push(`  survived verbatim: ${m.verbatimFinalChars.toLocaleString()} chars of the finished work, from ${m.verbatimClaimedChars.toLocaleString()} distinct generated chars (${m.reusedChars.toLocaleString()} reused)`)
      lines.push(`  ${m.finalSeparatorChars.toLocaleString()} chars of the finished work are in no span, so they are in no percentage`)
      if (m.mutatedFinalChars > 0) {
        lines.push(`  survived edited: ${m.mutatedFinalChars.toLocaleString()} chars, of which ${m.mutatedAddedChars.toLocaleString()} were added by the person and are credited to the model anyway`)
      }
      // Printed even when it is zero. SIGNAL_QUOTE_GROUNDED is vacuously
      // true on a record that quotes nobody, and a gate that silently
      // checked nothing reads exactly like a gate that passed.
      lines.push(
        m.signalEntries === 0
          ? '  signals: no correction loops, regressions or one-shot corrections, so no quote was checked'
          : `  signals: ${m.signalQuotes} quote${m.signalQuotes === 1 ? '' : 's'} re-read across ${m.signalEntries} entr${m.signalEntries === 1 ? 'y' : 'ies'}` +
            (m.signalEntriesWithoutQuote > 0
              ? `, and ${m.signalEntriesWithoutQuote} entr${m.signalEntriesWithoutQuote === 1 ? 'y quotes' : 'ies quote'} nothing addressable`
              : ''),
      )
    }
    if (found.length === 0) {
      lines.push('  OK — every stated bound holds')
    } else {
      lines.push(`  ${found.length} violation${found.length === 1 ? '' : 's'}`)
      lines.push(formatViolations(found).split('\n').map((l) => '  ' + l).join('\n'))
    }
  }
  lines.push(`${paths.length} record${paths.length === 1 ? '' : 's'} checked, ${violations} violation${violations === 1 ? '' : 's'}.`)
  return { violations, lines }
}

if (process.argv[1] && process.argv[1].endsWith('invariants.cli.ts')) {
  const args = process.argv.slice(2)
  const target = args.find((a) => !a.startsWith('--'))
  if (!target) {
    console.error('usage: tsx src/invariants.cli.ts <recordFile|recordsDir> [--quiet]')
    process.exit(2)
  }
  const { violations, lines } = runGate(target, args.includes('--quiet'))
  console.log(lines.join('\n'))
  process.exit(violations === 0 ? 0 : 1)
}
