// Verdict-reader evaluation (product-plan §16.8 risk 1).
//
// `src/verdict.ts` is the only component in Ursa that creates a label.
// Everything else joins finished work back to the generations that fed
// it; the verdict reader decides whether the work was accepted. So a
// false `satisfied` is not a display bug, it is a fabricated label
// entering an outcome record, and it breaks vision §0b directly:
// acceptance is never inferred, only declared. That single number,
// `falseSatisfied`, is this harness's headline metric and its gate.
//
// Two modes, and the difference matters when reading a report:
//
//   replay (default, runs in CI)  the injected runner returns the
//     case's own `modelReply` string. Measures the VERIFICATION layer
//     — JSON extraction, the substance guards, verbatim presence, step
//     repair — against model behaviour, including misbehaviour, that a
//     human wrote down. It does not measure the model.
//
//   live (`--mode live`, the owner's machine)  the runner is
//     `claudeVerdictRunner`, so `claude -p` actually reads each case.
//     Measures the model and the verification layer together. Costs
//     one `claude -p` call per non-empty case on her subscription.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { UserPrompt } from '../types'
import { readVerdict, shownText, TRANSCRIPT_CHAR_LIMIT, type Verdict, type VerdictRunner } from '../verdict'

export interface CaseTruth {
  accepted: boolean | null
  step: number | null
  /** the exact verbatim span the reader must return; absent when accepted is null */
  quote?: string | null
}

export interface VerdictCase {
  id: string
  why: string
  prompts: UserPrompt[]
  truth: CaseTruth
  /** the exact string the replay runner returns for this case */
  modelReply: string
  /** set when the reader provably cannot pass this case today */
  knownLimitation?: string
}

export interface VerdictCorpus {
  schemaVersion: string
  about: string
  cases: VerdictCase[]
}

export const CORPUS_PATH = join(import.meta.dirname, '..', '..', 'fixtures', 'verdicts', 'cases.json')

/** Filler for the PADDING_<n> token. No newline, no word that any guard
 *  in verdict.ts reacts to, so the padding itself never changes a reading. */
const FILLER = 'earlier context from the same long message, which carries no verdict. '

function expandPadding(text: string): string {
  return text.replace(/PADDING_(\d+)/g, (_m, n: string) => {
    const want = Number(n)
    return FILLER.repeat(Math.ceil(want / FILLER.length)).slice(0, want)
  })
}

export function loadCorpus(path: string = CORPUS_PATH): VerdictCorpus {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as VerdictCorpus
  return {
    ...raw,
    cases: raw.cases.map((c) => ({
      ...c,
      prompts: c.prompts.map((p) => ({ ...p, text: expandPadding(p.text) })),
    })),
  }
}

// ---------------------------------------------------------------- audit

/**
 * Model-free checks on the corpus itself, so a badly written case is
 * reported as a corpus defect instead of being blamed on the reader.
 */
export function auditCorpus(corpus: VerdictCorpus): string[] {
  const problems: string[] = []
  const seen = new Set<string>()
  for (const c of corpus.cases) {
    if (seen.has(c.id)) problems.push(`${c.id}: duplicate id`)
    seen.add(c.id)

    const stated = c.truth.accepted !== null
    if (stated && (c.truth.step === null || c.truth.quote == null)) {
      problems.push(`${c.id}: a stated truth needs both step and quote`)
    }
    if (!stated && (c.truth.step !== null || (c.truth.quote ?? null) !== null)) {
      problems.push(`${c.id}: an undeclared truth must have null step and null quote`)
    }
    if (!stated) continue

    const source = c.prompts.find((p) => p.step === c.truth.step)
    if (!source) {
      problems.push(`${c.id}: truth names step ${c.truth.step}, which no prompt carries`)
      continue
    }
    if (!source.text.includes(c.truth.quote as string)) {
      problems.push(`${c.id}: truth quote is not verbatim in the prompt at step ${c.truth.step}`)
      continue
    }
    const { reachable, reason } = reachability(c)
    if (reachable && c.knownLimitation) {
      problems.push(`${c.id}: marked knownLimitation but the verdict IS reachable — ${reason}; delete the marker`)
    }
    if (!reachable && !c.knownLimitation) {
      problems.push(`${c.id}: the verdict is unreachable and the case is not marked — ${reason}`)
    }
  }
  return problems
}

/**
 * Is the labelled verdict even visible to the model? Decided without
 * calling one: the quote, flattened the way `shownText` flattens it,
 * must survive inside the transcript view of its own prompt.
 */
export function reachability(c: VerdictCase): { reachable: boolean; reason: string } {
  if (c.truth.quote == null || c.truth.step === null) {
    return { reachable: true, reason: 'no stated verdict to reach' }
  }
  const source = c.prompts.find((p) => p.step === c.truth.step)
  if (!source) return { reachable: false, reason: `no prompt at step ${c.truth.step}` }
  const flattened = c.truth.quote.replace(/[\r\n]/g, ' ')
  const at = source.text.replace(/[\r\n]/g, ' ').indexOf(flattened)
  if (shownText(source).includes(flattened)) {
    return { reachable: true, reason: `visible at offset ${at} of ${source.text.length}` }
  }
  return {
    reachable: false,
    reason: `the quote starts at offset ${at}, past TRANSCRIPT_CHAR_LIMIT (${TRANSCRIPT_CHAR_LIMIT})`,
  }
}

// ----------------------------------------------------------------- run

export type Outcome =
  /** polarity, step and quote all match the label */
  | 'correct'
  /** the reader returned satisfied where the label is not satisfied — the worst outcome */
  | 'falseSatisfied'
  /** the reader returned unsatisfied where the label is not unsatisfied */
  | 'falseUnsatisfied'
  /** the label states a verdict, the reader read none, and nothing explains it */
  | 'missed'
  /** the label states a verdict the reader provably cannot see; explained by knownLimitation */
  | 'knownMiss'
  /** right polarity, wrong prompt named */
  | 'stepWrong'
  /** right polarity and step, the returned span is not the user's words */
  | 'quoteWrong'

export interface CaseResult {
  id: string
  why: string
  outcome: Outcome
  truth: CaseTruth
  got: Verdict
  runnerCalls: number
  /** set when the runner was called on a case with zero prompts: wasted tokens */
  wastedCall: boolean
  note: string
}

export interface EvalReport {
  mode: 'replay' | 'live'
  model: string | null
  counts: Record<Outcome, number>
  /** the gate: 0 required. Any nonzero value is a fabricated label. */
  falseSatisfied: number
  results: CaseResult[]
  auditProblems: string[]
  passed: boolean
}

const ZERO: Record<Outcome, number> = {
  correct: 0, falseSatisfied: 0, falseUnsatisfied: 0, missed: 0,
  knownMiss: 0, stepWrong: 0, quoteWrong: 0,
}

export function classify(c: VerdictCase, got: Verdict): { outcome: Outcome; note: string } {
  const truth = c.truth
  if (truth.accepted === null) {
    if (got.accepted === null) return { outcome: 'correct', note: 'undeclared, as labelled' }
    return got.accepted
      ? { outcome: 'falseSatisfied', note: `read satisfied from "${got.quote}" where the label is undeclared` }
      : { outcome: 'falseUnsatisfied', note: `read unsatisfied from "${got.quote}" where the label is undeclared` }
  }
  if (got.accepted === null) {
    if (c.knownLimitation) return { outcome: 'knownMiss', note: c.knownLimitation }
    return { outcome: 'missed', note: 'a stated verdict was labelled and none was read' }
  }
  if (got.accepted !== truth.accepted) {
    return got.accepted
      ? { outcome: 'falseSatisfied', note: `read satisfied where the label is unsatisfied at step ${truth.step}` }
      : { outcome: 'falseUnsatisfied', note: `read unsatisfied where the label is satisfied at step ${truth.step}` }
  }
  if (got.step !== truth.step) {
    return { outcome: 'stepWrong', note: `named step ${got.step}, label says ${truth.step}` }
  }
  if (truth.quote != null && got.quote !== truth.quote) {
    return { outcome: 'quoteWrong', note: `returned ${JSON.stringify(got.quote)}, label says ${JSON.stringify(truth.quote)}` }
  }
  const fixed = c.knownLimitation ? ' (knownLimitation marker is now stale)' : ''
  return { outcome: 'correct', note: `read as labelled${fixed}` }
}

export interface RunOptions {
  mode: 'replay' | 'live'
  /** used in live mode only */
  liveRunner?: VerdictRunner
  model?: string
  /** substring filter on case id */
  only?: string
}

export function runEval(corpus: VerdictCorpus, opts: RunOptions): EvalReport {
  const cases = opts.only ? corpus.cases.filter((c) => c.id.includes(opts.only as string)) : corpus.cases
  const counts = { ...ZERO }
  const results: CaseResult[] = []

  for (const c of cases) {
    let calls = 0
    const base: VerdictRunner =
      opts.mode === 'replay'
        ? () => c.modelReply
        : (opts.liveRunner ?? (() => { throw new Error('live mode needs a runner') }))
    const counted: VerdictRunner = (prompt, model) => { calls += 1; return base(prompt, model) }

    let got: Verdict
    try {
      got = readVerdict(c.prompts, counted, opts.model ?? 'claude-sonnet-5')
    } catch (e) {
      got = { accepted: null, step: null, quote: null, basis: 'undeclared', confidence: 'stated' }
      results.push({
        id: c.id, why: c.why, outcome: 'missed', truth: c.truth, got,
        runnerCalls: calls, wastedCall: false,
        note: `the reader threw: ${(e as Error).message}`,
      })
      counts.missed += 1
      continue
    }
    const { outcome, note } = classify(c, got)
    counts[outcome] += 1
    results.push({
      id: c.id, why: c.why, outcome, truth: c.truth, got,
      runnerCalls: calls,
      wastedCall: c.prompts.length === 0 && calls > 0,
      note,
    })
  }

  const auditProblems = auditCorpus({ ...corpus, cases })
  const wasted = results.filter((r) => r.wastedCall).map((r) => `${r.id}: the model was called on a session with zero prompts`)
  const stale = results.filter((r) => r.outcome === 'correct' && r.note.includes('stale')).map((r) => `${r.id}: knownLimitation marker is stale`)
  const problems = [...auditProblems, ...wasted, ...stale]

  const passed =
    counts.falseSatisfied === 0 && counts.falseUnsatisfied === 0 &&
    counts.missed === 0 && counts.stepWrong === 0 && counts.quoteWrong === 0 &&
    problems.length === 0

  return {
    mode: opts.mode,
    model: opts.mode === 'live' ? (opts.model ?? 'claude-sonnet-5') : null,
    counts, falseSatisfied: counts.falseSatisfied, results,
    auditProblems: problems, passed,
  }
}

// -------------------------------------------------------------- report

const GLYPH: Record<Outcome, string> = {
  correct: 'ok  ', falseSatisfied: 'FALSE-SAT', falseUnsatisfied: 'FALSE-UNSAT',
  missed: 'MISS', knownMiss: 'known-miss', stepWrong: 'STEP', quoteWrong: 'QUOTE',
}

export function formatReport(r: EvalReport): string {
  const width = Math.max(...r.results.map((x) => x.id.length), 10)
  const lines: string[] = []
  lines.push(`verdict-reader eval — mode ${r.mode}${r.model ? `, model ${r.model}` : ''}, ${r.results.length} cases`)
  lines.push('')
  for (const x of r.results) {
    lines.push(`  ${GLYPH[x.outcome].padEnd(11)} ${x.id.padEnd(width)}  ${x.note}`)
  }
  lines.push('')
  lines.push(`  false satisfied     ${r.counts.falseSatisfied}   <- the gate (plan §16.8 risk 1): a label the user never gave`)
  lines.push(`  false unsatisfied   ${r.counts.falseUnsatisfied}`)
  lines.push(`  missed              ${r.counts.missed}   a stated verdict the reader failed to read: a lost label`)
  lines.push(`  wrong step          ${r.counts.stepWrong}`)
  lines.push(`  wrong quote         ${r.counts.quoteWrong}`)
  lines.push(`  known miss          ${r.counts.knownMiss}   unreachable today, explained, not gated`)
  lines.push(`  read as labelled    ${r.counts.correct}`)
  if (r.auditProblems.length > 0) {
    lines.push('')
    lines.push('  corpus problems:')
    for (const p of r.auditProblems) lines.push(`    - ${p}`)
  }
  lines.push('')
  lines.push(r.passed ? '  PASS' : '  FAIL')
  return lines.join('\n')
}
