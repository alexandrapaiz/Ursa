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
import type { CorrectionLoop, OneShotCorrection, OutcomeRecord } from '../types'
import {
  BRIEFING_DISCLAIMER,
  type Briefing,
  type BriefingInput,
  type CaseUnit,
  type DroppedCase,
  type DroppedRule,
  type DroppedUnit,
  type GuardrailUnit,
  type MatchReason,
  type RuleUnit,
} from './types'
import { oneLine } from '../tuning/export'
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
 *  Still exported, and still loop-only, because `axiomFiles` below
 *  resolves an axiom's evidence `ref` against a loop id and a one-shot
 *  has no id an axiom can cite. */
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
 * One correction, normalized across the two shapes a record can carry it
 * in. This is what the rankers consume, and what `CaseUnit` is built
 * from; see that interface in ./types.ts for which shape means what.
 *
 * WHY THIS EXISTS (added 2026-10-26, from the engineer seat's own
 * dogfooding run, sprint-2026-10-26 item 2). Until today the only input
 * to `nearestCases` was `indexLoops`, so the briefing read
 * `signals.correctionLoops` and nothing else. `src/signals.ts`
 * `deriveSignals` returns `correctionLoops: []` for every record with no
 * chat trace and routes that record's corrections to
 * `oneShotCorrections` instead, saying so in the record's own `notes`:
 * "label-stage record (git commit pair): corrections appear once, as
 * edits; recurrence and loops are unobservable without the chat trace."
 *
 * `ursa run` over a repository produces exactly that kind of record. So
 * the briefing was blind to the whole output of the one command this
 * product ships. Measured on this repository's own history on 2026-10-26:
 * 17 records, 0 correction loops, 204 one-shot corrections, and a
 * briefing that returned 0 cases and printed `0 correction loops across
 * 17 outcome records`.
 */
export interface IndexedCase {
  /** 'loop' = signals.correctionLoops; 'one_shot' = signals.oneShotCorrections */
  kind: 'loop' | 'one_shot'
  recordId: string
  /** stable within the record: a loop's own id, or `one-shot-<ordinal>` */
  caseId: string
  /** a loop's theme; a one-shot's edited path, which is what it carries */
  theme: string
  /** paths this correction was made on */
  targetFiles: string[]
  /** null on a one-shot: unobservable, not zero */
  recurrences: number | null
  resolution: CorrectionLoop['resolution'] | null
  /** a loop's discoveredSpec, or the one-shot's AGENT/FINAL pair */
  spec: string
  complaint?: string
  mechanism?: string
}

/** The loop half, lifted into the normalized shape. The three fields the
 *  semantic ranker embeds (theme, spec, complaint) keep the values they
 *  had before this normalization existed, so `vectors.json` and every
 *  recorded cosine in it stay valid. */
export function asCase(indexed: IndexedLoop): IndexedCase {
  return {
    kind: 'loop',
    recordId: indexed.recordId,
    caseId: indexed.loop.id,
    theme: indexed.loop.theme,
    targetFiles: indexed.loop.targetFiles,
    recurrences: indexed.loop.recurrences,
    resolution: indexed.loop.resolution,
    spec: indexed.loop.discoveredSpec,
    complaint: indexed.complaint,
    mechanism: indexed.mechanism,
  }
}

/**
 * Every one-shot correction in the store, in the same normalized shape.
 *
 * Two deliberate decisions about what is NOT invented here.
 *
 * `recurrences` and `resolution` are null rather than 0 and 'accepted'.
 * A one-shot record has no user messages, so neither question has an
 * answer in it, and a surface that answered them anyway would be selling
 * an unobserved value as a measurement. `src/hq/types.ts` states the same
 * rule on `CaseUnit`.
 *
 * `theme` and `targetFiles` both come from `OneShotCorrection.domain`,
 * which for a label-stage correction is the edited file's path
 * (`src/signals.ts` `mutationCorrections` sets it). It is a path and not
 * a domain tag, so it is scored as a file and never passed to the
 * briefing's domain term: a request for domain `docs` must not partially
 * match a correction whose "domain" is `docs/sprints/pending.md`.
 */
export function indexOneShots(records: OutcomeRecord[]): IndexedCase[] {
  const out: IndexedCase[] = []
  for (const record of records) {
    const corrections: OneShotCorrection[] = record.signals?.oneShotCorrections ?? []
    for (const [ordinal, c] of corrections.entries()) {
      out.push({
        kind: 'one_shot',
        recordId: record.task.id,
        caseId: `one-shot-${ordinal}`,
        theme: c.domain,
        targetFiles: c.domain ? [c.domain] : [],
        recurrences: null,
        resolution: null,
        spec: c.text,
      })
    }
  }
  return out
}

/** Both shapes, loops first so a store holding both ranks the measured
 *  lesson above the single edit when their scores tie. */
export function indexCases(records: OutcomeRecord[]): IndexedCase[] {
  return [...indexLoops(records).map(asCase), ...indexOneShots(records)]
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

/**
 * CONTAINMENT AT THE BUILD BOUNDARY, ADDED 2026-10-26.
 *
 * `renderBriefing` below has flattened every record-derived field since
 * 2026-10-25, and that was the whole of the fix for the 2026-10-17
 * audit's F3. It is not enough any more, because `renderBriefing` is no
 * longer the only way a model reads a briefing. `src/mcp/server.ts`
 * returns `measureBriefing`'s markdown *and* the typed `Briefing` as the
 * tool result's `structuredContent`, and that object comes straight out
 * of this function. Measured through a real MCP client: with an axiom
 * statement that opens its own heading and bullet, the markdown half
 * carries neither as a line of its own and the `structuredContent` half
 * carries both, over five lines. So F3's asymmetry came back one layer
 * up, with the hardened surface the one a client may ignore and the
 * unhardened one the one its own description recommends.
 *
 * Fixed here rather than in the MCP handler because every consumer of
 * `buildBriefing` has the same exposure and there is no reason for the
 * typed object to be the dangerous one. `renderBriefing` keeps its own
 * `oneLine` calls: they are idempotent on contained text, and a renderer
 * that trusts its input is the thing that failed twice already.
 *
 * Bounds are the ones `renderBriefing` already uses, field for field, so
 * a well-formed briefing is byte-identical in both halves and
 * `measureBriefing`'s fixed point is undisturbed.
 */
const ID_MAX = 64
const PATH_MAX = 128

/** Contain one piece of axiom evidence. Its `quote` is the owner's own
 *  words from a session, which is the field most likely to carry text
 *  somebody else wrote. `steps` and `kind` are numbers and a closed
 *  union, so there is nothing in them to flatten. */
function containEvidence(e: AxiomEvidence): AxiomEvidence {
  return {
    ...e,
    recordId: oneLine(e.recordId, ID_MAX),
    ref: oneLine(e.ref, ID_MAX),
    ...(e.quote === undefined ? {} : { quote: oneLine(e.quote) }),
  }
}

function toRuleUnit(axiom: TuningAxiom, why: MatchReason): RuleUnit {
  const first = axiom.evidence[0]
  return {
    axiomId: oneLine(axiom.id, ID_MAX),
    statement: oneLine(axiom.statement),
    domain: oneLine(axiom.domain, ID_MAX),
    polarity: axiom.polarity,
    basis: axiom.basis,
    evidenceCount: axiom.evidenceCount,
    contradicts: axiom.contradicts.map((c) => oneLine(c, ID_MAX)),
    status: axiom.status,
    firstEvidence: first === undefined ? undefined : containEvidence(first),
    why,
  }
}

function toCaseUnit(indexed: IndexedCase, why: MatchReason): CaseUnit {
  return {
    recordId: oneLine(indexed.recordId, ID_MAX),
    kind: indexed.kind,
    loopId: oneLine(indexed.caseId, ID_MAX),
    theme: oneLine(indexed.theme),
    targetFiles: indexed.targetFiles.map((f) => oneLine(normalizePath(f), PATH_MAX)),
    recurrences: indexed.recurrences,
    resolution: indexed.resolution,
    discoveredSpec: oneLine(indexed.spec),
    complaint: indexed.complaint === undefined ? undefined : oneLine(indexed.complaint),
    mechanism: indexed.mechanism === undefined ? undefined : oneLine(indexed.mechanism),
    why,
  }
}

/**
 * The units a request scored and did not serve, highest-scoring first.
 *
 * WHY THIS EXISTS (added 2026-10-26, from the ledger entry "The briefing
 * can say why a unit was surfaced and has no answer for why one was
 * not"). `renderWhy` prints a full score breakdown for every unit that
 * came back, and the floor one line above discarded the identical
 * breakdown for every unit that did not. So `None on these files` over a
 * store of 204 real corrections was a dead end: the reader could not
 * tell a unit that was scored and judged too far from a unit that scored
 * nothing at all, and those two ask opposite things of the agent reading
 * them.
 *
 * TWO REASONS, NOT ONE, and this is the deviation from the ledger
 * entry's own first step, which named the below-floor half alone. A unit
 * can also miss because the request asked for three cases and the store
 * had four that cleared the floor. Reporting only the below-floor half
 * would reproduce this function's own motivating defect one level up: an
 * empty `dropped` list would mean either "nothing was near" or "plenty
 * was near and the ceiling cut it", which is again two answers wearing
 * one face. `bound` carries the number that did the cutting, so the
 * remedy is a value the reader can raise rather than a guess.
 *
 * Order. The over-cap units all scored at or above the floor and the
 * below-floor units all scored under it, so concatenating the two in
 * that order is already score-descending and no second sort is needed.
 *
 * @param ranked  every scored unit, floor not yet applied, in rank order
 * @param kept    the same list filtered to units that cleared the floor
 * @param cap     the effective ceiling the kept list was sliced at
 * @param limit   how many to return; 0 or less returns an empty list
 */
function collectDropped<S extends { unit: T }, T>(
  ranked: S[],
  kept: S[],
  cap: number,
  limit: number
): DroppedUnit<T>[] {
  if (limit <= 0) return []
  const keptSet = new Set(kept)
  const overCap: DroppedUnit<T>[] = kept
    .slice(cap)
    .map(({ unit }) => ({ unit, reason: 'over_cap' as const, bound: cap }))
  const belowFloor: DroppedUnit<T>[] = ranked
    .filter((s) => !keptSet.has(s))
    .map(({ unit }) => ({ unit, reason: 'below_floor' as const, bound: MIN_RELEVANCE }))
  return [...overCap, ...belowFloor].slice(0, limit)
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
  const wantDropped = input.dropped ?? 0
  const loops = indexLoops(records)
  const cases = indexCases(records)
  const servable = tuning.axioms.filter((a) => a.status !== 'revoked')

  const rankedRules = servable
    .map((axiom) => ({
      axiom,
      unit: toRuleUnit(axiom, score(query, axiom.domain, axiomFiles(axiom, records, loops), axiom.statement)),
    }))
    .sort((a, b) =>
      compareScored(
        a,
        b,
        (x) => x.unit.why,
        (x) => recurrenceBonus(x.axiom.evidenceCount),
        (x) => x.axiom.id
      )
    )

  // PARTITION, NOT FILTER (changed 2026-10-26). The floor used to be a
  // `.filter()` in the chain above, which threw away both the unit and
  // the `why` block the scorer had already computed for it. The ranking
  // and the cut are unchanged: `clearsFloor` is the same predicate, and
  // sorting before the cut rather than after cannot reorder the kept
  // units, because `compareScored` is a total order with a stable id
  // tiebreak. What is new is that the rejected side survives long enough
  // to be reported when the caller asks for it.
  const clearsFloor = (unit: { why: MatchReason }) => query.empty || unit.why.score >= MIN_RELEVANCE
  const scoredRules = rankedRules.filter(({ unit }) => clearsFloor(unit))

  const rules = scoredRules.slice(0, maxRules).map(({ unit }) => unit)

  const rankedCases = cases
    .map((indexed) => ({
      indexed,
      unit: toCaseUnit(
        indexed,
        score(
          query,
          // Deliberately '': neither shape carries a domain tag. A loop
          // has none at all, and a one-shot's `domain` field holds a file
          // path, which is scored below as a file instead.
          '',
          indexed.targetFiles,
          caseText(indexed),
          semantics?.get(caseKey(indexed.recordId, indexed.caseId)) ?? null
        )
      ),
    }))
    .sort((a, b) =>
      compareScored(
        a,
        b,
        (x) => x.unit.why,
        // The recurrence tiebreak is "how many times was this
        // independently seen". A loop seen once plus its recurrences; a
        // one-shot exactly once, which is 0 bonus — the honest value,
        // since `recurrences: null` means unobservable and an
        // unobservable count cannot buy a rank.
        (x) => recurrenceBonus((x.indexed.recurrences ?? 0) + 1),
        (x) => `${x.indexed.recordId}::${x.indexed.caseId}`
      )
    )

  const scoredCases = rankedCases.filter(({ unit }) => clearsFloor(unit))
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
      guardrails.push({
        ...containEvidence(e as AxiomEvidence),
        axiomId: oneLine(axiom.id, ID_MAX),
        statement: oneLine(axiom.statement),
        domain: oneLine(axiom.domain, ID_MAX),
      })
    }
  }

  return {
    schemaVersion: '0.1.0',
    generatedAt: now,
    request: { ...input },
    rules,
    nearestCases,
    guardrails: guardrails.slice(0, GUARDRAIL_CAP),
    // Absent rather than empty when the caller did not ask: see
    // `Briefing.dropped` in ./types.ts for why the two must stay
    // distinguishable.
    ...(wantDropped > 0
      ? {
          dropped: collectDropped(rankedCases, scoredCases, maxCases, wantDropped) as DroppedCase[],
          droppedRules: collectDropped(rankedRules, scoredRules, maxRules, wantDropped) as DroppedRule[],
        }
      : {}),
    coverage: {
      axiomsConsidered: servable.length,
      axiomsReturned: rules.length,
      recordsConsidered: records.length,
      loopsConsidered: loops.length,
      oneShotsConsidered: cases.length - loops.length,
      casesReturned: nearestCases.length,
      retrieval: semantics ? 'semantic-v1' : 'lexical-v0',
      ...(semantics && semanticModel ? { retrievalModel: semanticModel } : {}),
      unfiltered: query.empty,
    },
    disclaimer: BRIEFING_DISCLAIMER,
  }
}

/**
 * The one-line account of why a unit scored what it did.
 *
 * @param unfiltered  `coverage.unfiltered` for this briefing, which the
 *   zero-score branch below needs and cannot derive. A score of 0 has
 *   two different causes and they are not interchangeable: on a request
 *   that named neither a domain nor any files there was nothing to rank
 *   against, and on a request that named both there was and nothing
 *   matched. Until 2026-10-26 this function printed the first sentence
 *   unconditionally, which was true of every caller it then had, because
 *   a filtered request dropped its zero-scoring units before rendering.
 *   `--dropped` prints exactly those units, so the sentence became
 *   reachable on a request that had in fact named files, and it said the
 *   opposite of what the reader could see one line above.
 */
function renderWhy(why: MatchReason, unfiltered: boolean): string {
  if (why.score === 0) {
    return unfiltered
      ? 'the request named no domain and no files, so nothing ranked it'
      : 'nothing in common with the request: no domain, no file and no word matched (score 0)'
  }
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
 * The "## Considered and not shown" section, printed only when the
 * caller asked for it with `request.dropped`.
 *
 * One bullet and one reason line per unit, which is the same two-line
 * shape the sections above use, deliberately: a reader who has learned
 * to read a surfaced unit should not have to learn a second format to
 * read a rejected one. What differs is the first line's tail, which
 * names the bound rather than the provenance, because the bound is the
 * one thing a reader of this section can act on.
 *
 * The totals come out of `coverage` rather than out of the arrays below,
 * so a request that asked for 3 and held back 198 says so instead of
 * implying 3 was all there was.
 */
function renderDropped(briefing: Briefing): string[] {
  const dropped = briefing.dropped
  const droppedRules = briefing.droppedRules
  if (!dropped && !droppedRules) return []

  const cov = briefing.coverage
  const casesHeld = cov.loopsConsidered + cov.oneShotsConsidered - cov.casesReturned
  const rulesHeld = cov.axiomsConsidered - cov.axiomsReturned
  const asked = briefing.request.dropped ?? 0
  const lines: string[] = ['## Considered and not shown', '']

  if (casesHeld === 0 && rulesHeld === 0) {
    lines.push(
      'Nothing was held back. Every rule and case this request scored is ' +
        'printed above, so an empty section above is a statement about the ' +
        'store rather than about the bounds.'
    )
    lines.push('')
    return lines
  }

  lines.push(
    `You asked for up to ${asked} of the units this request scored and did not ` +
      `return. ${rulesHeld} rule${rulesHeld === 1 ? '' : 's'} and ${casesHeld} ` +
      `case${casesHeld === 1 ? '' : 's'} were held back in total. Each line below ` +
      `names the bound that held it, so raising that number is the remedy.`
  )
  lines.push('')

  const why = (u: { reason: string; bound: number }) =>
    u.reason === 'below_floor'
      ? `scored under the relevance floor of ${u.bound}`
      : `cleared the floor and lost the cut at ${u.bound}`

  if (droppedRules && droppedRules.length > 0) {
    lines.push('Rules:')
    for (const d of droppedRules) {
      const verb = d.unit.polarity === 'prefer' ? 'Prefer' : 'Avoid'
      lines.push(
        `- ${verb}: ${oneLine(d.unit.statement)} (${oneLine(d.unit.axiomId, ID_MAX)}) — ${why(d)}`
      )
      lines.push(`  - Would have been surfaced because: ${renderWhy(d.unit.why, cov.unfiltered)}`)
    }
    lines.push('')
  }

  if (dropped && dropped.length > 0) {
    lines.push('Cases:')
    for (const d of dropped) {
      lines.push(
        `- ${oneLine(d.unit.theme)} (${oneLine(d.unit.recordId, ID_MAX)}/` +
          `${oneLine(d.unit.loopId, ID_MAX)}) — ${why(d)}`
      )
      lines.push(`  - Would have been surfaced because: ${renderWhy(d.unit.why, cov.unfiltered)}`)
    }
    lines.push('')
  }

  return lines
}


/**
 * Render the briefing as the markdown an agent actually reads — the same
 * shape `tuning export` uses for humans, with the provenance kept in.
 * The JSON is the interface; this is the surface.
 */
/**
 * The briefing as the markdown an agent actually reads.
 *
 * CONTAINMENT, ADDED 2026-10-25. Every field spliced in below is
 * record-derived: an axiom statement, a correction loop's theme, the
 * owner's quoted words. All of it is distilled from session text, which
 * means text a model generated or a stranger's content passed through,
 * and this function is what puts it into the instruction positions of a
 * markdown document an agent treats as its standing orders. So each of
 * those fields goes through `oneLine` from src/tuning/export.ts, which
 * flattens line breaks, strips control characters, removes a leading
 * markdown marker and bounds length.
 *
 * `renderTuningBlock` has done this since 2026-10-17 and this function
 * did not, which made the hardened path the one a human pastes by hand
 * and the unhardened one the path an agent reads automatically. That
 * asymmetry was the 2026-10-17 audit's F3.
 *
 * This is containment, not authentication, on exactly the terms
 * `oneLine` states: it stops injected text from occupying a block's
 * instruction positions and cannot stop a one-sentence rule from being a
 * harmful rule. A well-formed axiom is a short single-line rule, so every
 * existing one renders byte for byte as before and `measureBriefing`'s
 * fixed point is undisturbed.
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
      const contradicts = r.contradicts.map((c) => oneLine(c, 64))
      const tension = contradicts.length > 0 ? ` [tension with ${contradicts.join(', ')}]` : ''
      lines.push(`- **${verb}: ${oneLine(r.statement)}**${tension}`)
      lines.push(
        `  - ${oneLine(r.axiomId, 64)}, domain ${oneLine(r.domain, 64)}, ${r.basis}, seen ${r.evidenceCount}x` +
          (r.status === 'user-edited' ? ', edited by the owner' : '')
      )
      if (r.firstEvidence?.quote) lines.push(`  - Her words: "${oneLine(r.firstEvidence.quote)}"`)
      lines.push(`  - Surfaced because: ${renderWhy(r.why, briefing.coverage.unfiltered)}`)
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
      // The parenthetical says which shape this case is, because the two
      // are worth different amounts to the reader and the lines below
      // differ accordingly. A loop carries a measured recurrence; a
      // one-shot carries none, and printing `Took 0 repeats` for it would
      // state as a measurement the one thing its record cannot observe.
      const provenance = c.kind === 'loop' ? `${c.resolution}` : 'one-shot edit'
      lines.push(
        `- **${oneLine(c.theme)}** (${oneLine(c.recordId, 64)}/${oneLine(c.loopId, 64)}, ${provenance})`
      )
      lines.push(`  - Files: ${c.targetFiles.map((f) => oneLine(f, 128)).join(', ') || 'not recorded'}`)
      if (c.recurrences === null) {
        lines.push(
          '  - How often she had to repeat it: not recorded. This record is a git' +
            ' commit pair, so the correction appears once, as the edit itself, and' +
            ' recurrence is unobservable rather than zero.'
        )
      } else {
        lines.push(`  - Took ${c.recurrences} repeat${c.recurrences === 1 ? '' : 's'} after the first ask`)
      }
      if (c.complaint) lines.push(`  - She said: "${oneLine(c.complaint)}"`)
      if (c.mechanism) lines.push(`  - What actually fixed it: ${oneLine(c.mechanism)}`)
      if (c.discoveredSpec) {
        lines.push(
          c.kind === 'loop'
            ? `  - The spec nobody could state up front: ${oneLine(c.discoveredSpec)}`
            : `  - What she changed: ${oneLine(c.discoveredSpec)}`
        )
      }
      lines.push(`  - Surfaced because: ${renderWhy(c.why, briefing.coverage.unfiltered)}`)
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
      lines.push(
        `- From ${oneLine(g.axiomId, 64)} ("${oneLine(g.statement)}"), ` +
          `${oneLine(g.recordId, 64)} step ${g.steps.join(', ')}:`
      )
      lines.push(g.quote ? `  - Her words: "${oneLine(g.quote)}"` : '  - No verbatim words recorded; the rule above is the whole receipt.')
    }
    lines.push('')
  }

  lines.push(...renderDropped(briefing))

  const cov = briefing.coverage
  lines.push('## Coverage')
  lines.push('')
  // Three counts, not two. The one-shot figure is printed beside the loop
  // figure rather than folded into it, because a store built by `ursa run`
  // over a repository has only one-shots, and a line reading `0 correction
  // loops` with no second number told a reader that store held nothing to
  // learn from. See BriefingCoverage.oneShotsConsidered in ./types.ts.
  lines.push(
    `Considered ${cov.axiomsConsidered} active rule${cov.axiomsConsidered === 1 ? '' : 's'}, ` +
      `${cov.loopsConsidered} correction loop${cov.loopsConsidered === 1 ? '' : 's'} and ` +
      `${cov.oneShotsConsidered} one-shot correction${cov.oneShotsConsidered === 1 ? '' : 's'} across ` +
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
  const cases = indexCases(records).map((indexed) => ({
    key: caseKey(indexed.recordId, indexed.caseId),
    text: caseText(indexed),
  }))
  const semantics = await embedAndRank(embedder, cache, request, cases)
  if (semantics.size === 0) return buildBriefing(tuning, records, input, now)
  return buildBriefing(tuning, records, input, now, semantics, embedder.id)
}
