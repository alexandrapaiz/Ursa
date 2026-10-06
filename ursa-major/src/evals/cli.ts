#!/usr/bin/env -S npx tsx
// Eval runner. Deliberately its own entry point rather than a script in
// package.json or a subcommand of src/cli.ts: on 2026-09-27 both of
// those files were open in other unmerged pull requests (#16, #18, #22),
// and a new file conflicts with nobody.
//
// Exact invocations:
//
//   npx tsx src/evals/cli.ts verdict
//   npx tsx src/evals/cli.ts verdict --mode live --model claude-sonnet-5
//   npx tsx src/evals/cli.ts verdict --only v10 --json
//
// Exit code 0 when the report passes, 1 when it does not, so the
// command is usable as a gate.

import { claudeVerdictRunner } from '../verdict'
import { formatReport, loadCorpus, runEval } from './verdict'

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? undefined : argv[i + 1]
}

function main(argv: string[]): number {
  const which = argv[0]
  if (which !== 'verdict') {
    console.error('usage: npx tsx src/evals/cli.ts verdict [--mode replay|live] [--model NAME] [--only SUBSTRING] [--json]')
    return 2
  }
  const mode = (flag(argv, 'mode') ?? 'replay') as 'replay' | 'live'
  if (mode !== 'replay' && mode !== 'live') {
    console.error(`unknown mode "${mode}"; expected replay or live`)
    return 2
  }
  const report = runEval(loadCorpus(), {
    mode,
    model: flag(argv, 'model'),
    only: flag(argv, 'only'),
    liveRunner: mode === 'live' ? claudeVerdictRunner : undefined,
  })
  console.log(argv.includes('--json') ? JSON.stringify(report, null, 2) : formatReport(report))
  return report.passed ? 0 : 1
}

process.exit(main(process.argv.slice(2)))
