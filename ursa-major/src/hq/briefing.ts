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
import { caseKey, caseText, embedAndRank, queryText, type SemanticIndex } from './semantic'
import type { Embedder, EmbeddingCache } from './embedding'

/** Defaults sized for an agent's opening context: enough to change how
 *  it writes the first draft, small enough that it reads all of them. */
export const DEFAULT_MAX_RULES = 8
export const DEFAULT_MAX_CASES = 3

/**
 * Relevance floor for a filtered request.
 *
 * One incidental word in common is not a reason to put something in an
 * agent's context: 'page' appears in half the paths a web project has.
 * Two points is the first score that requires a real signal — a domain
 * match, a file match, or two distinct query words — so anything below
 * it is dropped rather than ranked last. An unfiltered request (no
 * domain, no files) has no floor, because there is nothing to be
 * irrelevant to.
 */
export const MIN_RELEVANCE = 2

/** Guardrails are few by nature — each one exists because an agent once
 *  overreached badly enough that the owner wrote a rule against it — but
 *  the ceiling is stated rather than assumed. */
export const GUARDRAIL_CAP = 10

/** Every correction loop in the store, tagged with the record it came
 *  from and the owner's own words where the record carried them.
 *  Exported because semantic.ts embeds exactly this text. */
export interface IndexedLoop {
  recordId: string
  loop: CorrectionLoop
  complaint?: string
  mechanism?: string
}

export function indexLoops(records: OutcomeRecord[]): IndexedLoop[] {
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
 *
 * @param semantics  case rankings from semantic.ts, or undefined for a
 *                   lexical-only briefing. Passing them in rather than
 *                   computing them keeps this function pure and
 *                   synchronous: the same store, request and semantic
 *                   index produce the same briefing byte for byte, and
 *                   no model runs inside it. `briefWithSemantics` is the
 *                   async wrapper that produces the index.
 * @param semanticModel  the embedding model behind `semantics`, recorded
 *                   in coverage so a reader can tell which model ranked.
 */
export function buildBriefing(
  tuning: TuningRecord,
  records: OutcomeRecord[],
  input: BriefingInput = {},
  now: string = new Date().toISOString(),
  semantics?: SemanticIndex,
  semanticModel?: string
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
    .filter(({ unit }) => query.empty || unit.why.score >= MIN_RELEVANCE)
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
          caseText(indexed),
          semantics?.get(caseKey(indexed.recordId, indexed.loop.id)) ?? null
        )
      ),
    }))
    .filter(({ unit }) => query.empty || unit.why.score >= MIN_RELEVANCE)
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

  // Guardrails ride with the rules they belong to: an agent being told
  // "prefer X here" also needs "and the last agent that touched this went
  // further than asked, here is what she said about it." Scope is every
  // axiom that cleared the relevance floor, including ones ranked below
  // the maxRules cut — a guardrail is cheap to read and expensive to
  // rediscover, so it is not dropped for being ninth.
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
      retrieval: semantics ? 'semantic-v1' : 'lexical-v0',
      ...(semantics && semanticModel ? { retrievalModel: semanticModel } : {}),
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
  // The semantic term is printed with the arithmetic that produced it,
  // not as a bare number, because it is the one term that depends on the
  // rest of the store and so cannot be checked from this line alone.
  const sem = why.semantic
  if (sem && sem.term > 0) {
    parts.push(
      `close in meaning (cosine ${sem.cosine}, ${sem.lead >= 0 ? '+' : ''}${sem.lead} over the ` +
        `${sem.fieldMean} field average, worth ${sem.term})`
    )
  }
  if (parts.length === 0 && sem) {
    parts.push(`nothing in common but the request; nearest by meaning at cosine ${sem.cosine}`)
  }
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
      lines.push(`- From ${g.axiomId} ("${g.statement}"), ${g.recordId} step ${g.steps.join(', ')}:`)
      lines.push(g.quote ? `  - Her words: "${g.quote}"` : '  - No verbatim words recorded; the rule above is the whole receipt.')
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
      `Ranking: ${cov.retrieval}${cov.retrievalModel ? ` (${cov.retrievalModel})` : ''}.`
  )
  if (cov.renderedChars !== undefined) {
    lines.push('')
    lines.push(
      `Size: ${cov.renderedChars} characters, counting this sentence. That is what ` +
        `reading this briefing costs you, so raise or lower maxRules and maxCases ` +
        `against it rather than guessing.`
    )
  }
  lines.push('')

  return lines.join('\n')
}

/** Passes `measureBriefing` will take before it gives up. The worst
 *  case the recurrence in that function's comment can actually reach is
 *  four; six leaves margin so that an edit to the size sentence cannot
 *  turn a slower fixed point into a thrown error. */
const MEASURE_PASSES = 6

/** A briefing and the markdown that was measured to fill in its
 *  `coverage.renderedChars`. Returned as a pair because the two are only
 *  true together: the number is the length of this exact string, and
 *  re-rendering the briefing after changing anything invalidates it. */
export interface MeasuredBriefing {
  briefing: Briefing
  markdown: string
}

/**
 * Fill in `coverage.renderedChars` and return the markdown it counts.
 *
 * The wrinkle this function exists for. `coverage` is part of the
 * `Briefing` that `renderBriefing` consumes, so the number cannot be
 * inside the thing it measures in one pass. Render, measure, attach, and
 * the attached figure is now wrong by its own digits, because the
 * sentence printing it is itself in the string. Measuring the render
 * that omits the sentence and reporting that number would be the
 * obvious implementation and would ship a figure nobody can reproduce:
 * a reader who counts the characters they were handed gets a different
 * answer than the one they were told.
 *
 * So the number is defined as a fixed point. It is the value `n` such
 * that rendering the briefing with `renderedChars: n` produces a string
 * of length exactly `n`, which is the only definition under which the
 * figure and the string agree.
 *
 * It exists and is reached quickly. Let `base` be the length of the
 * rendered briefing with the size sentence present but its digits
 * removed, so the recurrence is `n -> base + digits(n)`. Seeded below
 * `base` it is non-decreasing, and once past the first pass it rises by
 * at most one per pass, since only a change in the digit count can move
 * it at all. A digit count changes only when `n` crosses a power of
 * ten, so the sequence settles within four passes even in the awkward
 * case where the first pass lands on 999 and the second on 1000.
 *
 * Non-convergence would mean that reasoning is wrong, so it throws
 * rather than returning the last candidate. A thrown error is a defect
 * report somebody fixes; a figure that is quietly off by four is the
 * exact failure this function was written to avoid.
 */
export function measureBriefing(briefing: Briefing): MeasuredBriefing {
  // Seed: the render with no size sentence at all, which is a strict
  // lower bound on the answer. Taken from a briefing with the field
  // cleared rather than from the argument as given, so that measuring
  // an already-measured briefing starts from the same place and returns
  // the same number as measuring a fresh one.
  const unmeasured: Briefing = {
    ...briefing,
    coverage: { ...briefing.coverage, renderedChars: undefined },
  }
  let renderedChars = renderBriefing(unmeasured).length
  for (let pass = 0; pass < MEASURE_PASSES; pass++) {
    const candidate: Briefing = { ...unmeasured, coverage: { ...unmeasured.coverage, renderedChars } }
    const markdown = renderBriefing(candidate)
    if (markdown.length === renderedChars) return { briefing: candidate, markdown }
    renderedChars = markdown.length
  }
  throw new Error(
    `measureBriefing: the rendered size did not settle in ${MEASURE_PASSES} passes ` +
      `(last candidate ${renderedChars} characters). The size sentence in renderBriefing ` +
      `has stopped being a fixed point of its own length; see this function's comment.`
  )
}

/**
 * The briefing with semantic case ranking: `buildBriefing`, plus the one
 * await that the pure function above deliberately does not contain.
 *
 * This is the entry point `ursa brief --semantic` and an MCP
 * `get_briefing` handler call. It degrades rather than fails: when
 * `embedder` is null — no model downloaded, no network, the optional
 * dependency omitted at install — it returns exactly what
 * `buildBriefing` would have returned, and the briefing's coverage block
 * says `lexical-v0` so the caller can tell which ranking it got. A
 * briefing that silently claimed to be semantic when it was not would be
 * worse than one that never offered semantics at all.
 *
 * `cache.vectors` is mutated with anything newly computed. Persisting is
 * the caller's job (`saveCache`), so a briefing taken against a fixture
 * leaves no trace on disk.
 */
export async function briefWithSemantics(
  tuning: TuningRecord,
  records: OutcomeRecord[],
  input: BriefingInput,
  embedder: Embedder | null,
  cache: EmbeddingCache,
  now: string = new Date().toISOString()
): Promise<Briefing> {
  if (!embedder) return buildBriefing(tuning, records, input, now)
  const request = queryText(input.domain, input.files)
  const cases = indexLoops(records).map((indexed) => ({
    key: caseKey(indexed.recordId, indexed.loop.id),
    text: caseText(indexed),
  }))
  const semantics = await embedAndRank(embedder, cache, request, cases)
  if (semantics.size === 0) return buildBriefing(tuning, records, input, now)
  return buildBriefing(tuning, records, input, now, semantics, embedder.id)
}
