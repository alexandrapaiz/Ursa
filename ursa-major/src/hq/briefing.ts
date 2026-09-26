// get_briefing: the HQ read, served to an agent before it starts work.
//
// Input: the owner's tuning record (rules distilled from finished work)
// and the outcome records those rules were distilled from (the runs
// themselves, with their correction loops). Output: a Briefing — the
// rules that apply, the nearest prior cases, and the guardrails the
// owner had to state after an agent overreached.
//
// Everything here is a pure function over data already on disk. No model
// call, no network, no clock except the one injected for `generatedAt`,
// so the same store and the same request produce the same briefing
// byte for byte.

import type { AxiomEvidence, TuningAxiom, TuningRecord } from '../tuning/types'
import type { CorrectionLoop, OutcomeRecord } from '../types'
import {
  BRIEFING_DISCLAIMER,
  type Briefing,
  type BriefingInput,
  type CaseUnit,
  type GuardrailUnit,
  type MatchReason,
  type RuleUnit,
} from './types'
import { buildQuery, compareScored, normalizePath, recurrenceBonus, score } from './retrieval'

/** Defaults sized for an agent's opening context: enough to change how
 *  it writes the first draft, small enough that it reads all of them. */
export const DEFAULT_MAX_RULES = 8
export const DEFAULT_MAX_CASES = 3

/** Guardrails are few by nature — each one exists because an agent once
 *  overreached badly enough that the owner wrote a rule against it — but
 *  the ceiling is stated rather than assumed. */
export const GUARDRAIL_CAP = 10

/** Every correction loop in the store, tagged with the record it came
 *  from and the owner's own words where the record carried them. */
interface IndexedLoop {
  recordId: string
  loop: CorrectionLoop
  complaint?: string
  mechanism?: string
}

function indexLoops(records: OutcomeRecord[]): IndexedLoop[] {
  const out: IndexedLoop[] = []
  for (const record of records) {
    const signals = record.signals
    if (!signals) continue
    for (const loop of signals.correctionLoops) {
      const translation = signals.feedbackTranslations.find((t) => t.loopId === loop.id)
      out.push({
        recordId: record.task.id,
        loop,
        complaint: translation?.complaint,
        mechanism: translation?.mechanism,
      })
    }
  }
  return out
}

/**
 * The files an axiom was learned on.
 *
 * Strong form: the evidence names a correction loop, and that loop names
 * the files it was fought over. Those are the paths where this rule was
 * actually paid for. Weak form: the evidence carries no loop reference
 * (an `episode` or a bare step ordinal), so the best available answer is
 * the finished files of the record it came from.
 */
function axiomFiles(axiom: TuningAxiom, records: OutcomeRecord[], loops: IndexedLoop[]): string[] {
  const files = new Set<string>()
  for (const e of axiom.evidence) {
    const loop = loops.find((l) => l.recordId === e.recordId && l.loop.id === e.ref)
    if (loop) {
      for (const f of loop.loop.targetFiles) files.add(normalizePath(f))
      continue
    }
    const record = records.find((r) => r.task.id === e.recordId)
    if (record) for (const f of record.files) files.add(normalizePath(f.path))
  }
  return [...files]
}

function toRuleUnit(axiom: TuningAxiom, why: MatchReason): RuleUnit {
  return {
    axiomId: axiom.id,
    statement: axiom.statement,
    domain: axiom.domain,
    polarity: axiom.polarity,
    basis: axiom.basis,
    evidenceCount: axiom.evidenceCount,
    contradicts: [...axiom.contradicts],
    status: axiom.status,
    firstEvidence: axiom.evidence[0],
    why,
  }
}

function toCaseUnit(indexed: IndexedLoop, why: MatchReason): CaseUnit {
  const { loop } = indexed
  return {
    recordId: indexed.recordId,
    loopId: loop.id,
    theme: loop.theme,
    targetFiles: loop.targetFiles.map(normalizePath),
    recurrences: loop.recurrences,
    resolution: loop.resolution,
    discoveredSpec: loop.discoveredSpec,
    complaint: indexed.complaint,
    mechanism: indexed.mechanism,
    why,
  }
}

/**
 * Build the briefing.
 *
 * The signature an MCP `get_briefing` handler calls, and the one the
 * `brief` CLI calls. Transport is somebody else's problem: this takes
 * data and returns data.
 *
 * `revoked` axioms are never served under any request. That is user
 * sovereignty (plan §4, tuning/types.ts): a revoked rule survives as a
 * tombstone so a re-distill cannot resurrect it, and the tombstone is
 * exactly the thing an agent must not read.
 */
export function buildBriefing(
  tuning: TuningRecord,
  records: OutcomeRecord[],
  input: BriefingInput = {},
  now: string = new Date().toISOString()
): Briefing {
  const query = buildQuery(input.domain, input.files)
  const maxRules = input.maxRules ?? DEFAULT_MAX_RULES
  const maxCases = input.maxCases ?? DEFAULT_MAX_CASES
  const loops = indexLoops(records)
  const servable = tuning.axioms.filter((a) => a.status !== 'revoked')

  const scoredRules = servable
    .map((axiom) => ({
      axiom,
      unit: toRuleUnit(axiom, score(query, axiom.domain, axiomFiles(axiom, records, loops), axiom.statement)),
    }))
    .filter(({ unit }) => query.empty || unit.why.score > 0)
    .sort((a, b) =>
      compareScored(
        a,
        b,
        (x) => x.unit.why,
        (x) => recurrenceBonus(x.axiom.evidenceCount),
        (x) => x.axiom.id
      )
    )

  const rules = scoredRules.slice(0, maxRules).map(({ unit }) => unit)

  const scoredCases = loops
    .map((indexed) => ({
      indexed,
      unit: toCaseUnit(
        indexed,
        score(
          query,
          '',
          indexed.loop.targetFiles,
          `${indexed.loop.theme} ${indexed.loop.discoveredSpec} ${indexed.complaint ?? ''}`
        )
      ),
    }))
    .filter(({ unit }) => query.empty || unit.why.score > 0)
    .sort((a, b) =>
      compareScored(
        a,
        b,
        (x) => x.unit.why,
        (x) => recurrenceBonus(x.indexed.loop.recurrences + 1),
        (x) => `${x.indexed.recordId}::${x.indexed.loop.id}`
      )
    )

  const nearestCases = scoredCases.slice(0, maxCases).map(({ unit }) => unit)

  // Guardrails ride with the rules they belong to: an agent that is
  // being told "prefer X here" also needs "and the last agent that
  // touched this went too far, here is what she said about it."
  const relevantAxiomIds = new Set(scoredRules.map(({ axiom }) => axiom.id))
  const guardrails: GuardrailUnit[] = []
  for (const axiom of servable) {
    if (!relevantAxiomIds.has(axiom.id)) continue
    for (const e of axiom.evidence) {
      if (e.kind !== 'defensive-guardrail') continue
      guardrails.push({ ...(e as AxiomEvidence), axiomId: axiom.id, statement: axiom.statement, domain: axiom.domain })
    }
  }

  return {
    schemaVersion: '0.1.0',
    generatedAt: now,
    request: { ...input },
    rules,
    nearestCases,
    guardrails: guardrails.slice(0, GUARDRAIL_CAP),
    coverage: {
      axiomsConsidered: servable.length,
      axiomsReturned: rules.length,
      recordsConsidered: records.length,
      loopsConsidered: loops.length,
      casesReturned: nearestCases.length,
      retrieval: 'lexical-v0',
      unfiltered: query.empty,
    },
    disclaimer: BRIEFING_DISCLAIMER,
  }
}

function renderWhy(why: MatchReason): string {
  if (why.score === 0) return 'served because the request named no domain and no files'
  const parts: string[] = []
  if (why.domain) parts.push(`${why.domain} domain match`)
  if (why.filesExact.length > 0) parts.push(`learned on ${why.filesExact.join(', ')}`)
  if (why.filesByName.length > 0) parts.push(`same file name as ${why.filesByName.join(', ')}`)
  if (why.textTokens.length > 0) parts.push(`words in common: ${why.textTokens.join(', ')}`)
  return `${parts.join('; ')} (score ${why.score})`
}

/**
 * Render the briefing as the markdown an agent actually reads — the same
 * shape `tuning export` uses for humans, with the provenance kept in.
 * The JSON is the interface; this is the surface.
 */
export function renderBriefing(briefing: Briefing): string {
  const lines: string[] = ['# Briefing', '', briefing.disclaimer, '']

  const req = briefing.request
  const asked =
    briefing.coverage.unfiltered
      ? 'Request: everything active, no domain or file filter.'
      : `Request: ${[
          req.domain ? `domain ${req.domain}` : null,
          req.files?.length ? `files ${req.files.join(', ')}` : null,
        ]
          .filter(Boolean)
          .join('; ')}.`
  lines.push(asked, '')

  lines.push('## Rules that apply')
  lines.push('')
  if (briefing.rules.length === 0) {
    lines.push('None. The HQ has learned nothing about this yet, which is a')
    lines.push('fact about the store, not permission to do anything.')
    lines.push('')
  } else {
    for (const r of briefing.rules) {
      const verb = r.polarity === 'prefer' ? 'Prefer' : 'Avoid'
      const tension = r.contradicts.length > 0 ? ` [tension with ${r.contradicts.join(', ')}]` : ''
      lines.push(`- **${verb}: ${r.statement}**${tension}`)
      lines.push(
        `  - ${r.axiomId}, domain ${r.domain}, ${r.basis}, seen ${r.evidenceCount}x` +
          (r.status === 'user-edited' ? ', edited by the owner' : '')
      )
      if (r.firstEvidence?.quote) lines.push(`  - Her words: "${r.firstEvidence.quote}"`)
      lines.push(`  - Surfaced because: ${renderWhy(r.why)}`)
    }
    lines.push('')
  }

  lines.push('## Nearest prior cases')
  lines.push('')
  if (briefing.nearestCases.length === 0) {
    lines.push('None on these files.')
    lines.push('')
  } else {
    for (const c of briefing.nearestCases) {
      lines.push(`- **${c.theme}** (${c.recordId}/${c.loopId}, ${c.resolution})`)
      lines.push(`  - Files: ${c.targetFiles.join(', ') || 'not recorded'}`)
      lines.push(`  - Took ${c.recurrences} repeat${c.recurrences === 1 ? '' : 's'} after the first ask`)
      if (c.complaint) lines.push(`  - She said: "${c.complaint}"`)
      if (c.mechanism) lines.push(`  - What actually fixed it: ${c.mechanism}`)
      if (c.discoveredSpec) lines.push(`  - The spec nobody could state up front: ${c.discoveredSpec}`)
      lines.push(`  - Surfaced because: ${renderWhy(c.why)}`)
    }
    lines.push('')
  }

  lines.push('## Guardrails')
  lines.push('')
  if (briefing.guardrails.length === 0) {
    lines.push('None recorded for this request.')
    lines.push('')
  } else {
    lines.push('Each of these exists because an agent once went further than asked.')
    lines.push('')
    for (const g of briefing.guardrails) {
      lines.push(`- ${g.statement} (${g.axiomId}, from ${g.recordId} step ${g.steps.join(', ')})`)
      if (g.quote) lines.push(`  - Her words: "${g.quote}"`)
    }
    lines.push('')
  }

  const cov = briefing.coverage
  lines.push('## Coverage')
  lines.push('')
  lines.push(
    `Considered ${cov.axiomsConsidered} active rule${cov.axiomsConsidered === 1 ? '' : 's'} and ` +
      `${cov.loopsConsidered} correction loop${cov.loopsConsidered === 1 ? '' : 's'} across ` +
      `${cov.recordsConsidered} outcome record${cov.recordsConsidered === 1 ? '' : 's'}; ` +
      `returned ${cov.axiomsReturned} rule${cov.axiomsReturned === 1 ? '' : 's'} and ` +
      `${cov.casesReturned} case${cov.casesReturned === 1 ? '' : 's'}. ` +
      `Ranking: ${cov.retrieval}.`
  )
  lines.push('')

  return lines.join('\n')
}
