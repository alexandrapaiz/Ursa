// Arithmetic that must hold on every outcome record, as a gate.
//
// Why this file exists. On 2026-10-04 `ursa run` against a clone of this
// repository printed "239,976 chars survived your editing verbatim" above
// "239,841 chars were generated to get there". `survived_verbatim` means
// byte-identical in a generation and in the finished work, so it is a
// subset of what was generated and cannot exceed it. The figure was
// impossible, it was impossible in all six records of that run, and 344
// tests passed. Nothing in the codebase compared one number in a record
// against another number in the same record.
//
// That is what this module does. Every function here is a statement about
// one record that is either true or a defect, checked against the record's
// own fields — no fixtures, no expected values, no second implementation to
// drift. The checks are cheap enough to run on every record a trial
// produces, which is how they get exercised against real history instead of
// only against synthetic input (see src/invariants.test.ts and
// tools/invariants/probe.sh).
//
// Two rules kept this list honest:
//
//   1. An invariant states a bound between two numbers measured over THE
//      SAME set of characters. The original defect was not a wrong number,
//      it was a comparison between a final-file character count and a
//      generation-segment character count, which are two different sets.
//      `GEN_CLAIM_BOUNDED` is the repaired form of that comparison.
//   2. Anything that can be legitimately false is a measurement, not an
//      invariant. A generated sentence reused in two final files really is
//      counted twice by `byClass`, so "verbatim <= generated" is reported
//      by `measure()` and never fails the gate.

import { mergedLength } from './intervals'
import { isExcerptOf } from './text'
import type {
  DescentEvidence, FinalFile, FinalSpan, GenerationRecord, LabSignals, OutcomeRecord, QuoteRef,
  SpanClass,
} from './types'

/** Stable identifier for each invariant, so a violation can be grepped for. */
export type InvariantCode =
  | 'CLAIM_NOT_WIDER'
  | 'CLAIM_IN_GENERATION'
  | 'GEN_SPANS_PARTITION_ORDER'
  | 'GEN_CHARS_CONSISTENT'
  | 'GEN_SURVIVED_BOUNDED'
  | 'GEN_CLAIM_BOUNDED'
  | 'DELETION_SPLIT_EXACT'
  | 'FINAL_SPANS_IN_FILE'
  | 'COVERED_BOUNDED'
  | 'RATES_MATCH_FIELDS'
  | 'SIGNAL_QUOTE_GROUNDED'
  | 'DESCENT_CHECKED_UNIFORMLY'
  | 'EXCLUSION_NOT_CLASSIFIED'

export interface Violation {
  code: InvariantCode
  /** the bound, stated so the message is readable without this file open */
  invariant: string
  /** which record, file, generation or span it fired on */
  where: string
  /** the numbers as observed, always including both sides of the bound */
  observed: string
}

/**
 * Numbers the gate reports and never fails on, because each can be
 * legitimately non-zero. They are here rather than in a comment because
 * every one of them was invisible while the impossible figure was being
 * printed, and the first one is the whole explanation for it.
 */
export interface Measurement {
  recordId: string
  /** `byClass.survived_verbatim.chars` — final-file characters */
  verbatimFinalChars: number
  /** the same claims merged per generation — generation characters, counted once */
  verbatimClaimedChars: number
  /**
   * `verbatimFinalChars - verbatimClaimedChars`. Positive means generated
   * text was reused: two final spans claim one extent of one generation.
   * Legitimate, and the reason the final-side total can exceed every
   * generation-side total.
   */
  reusedChars: number
  /** `generated.charsWritten` — every character the generations wrote */
  generatedCharsWritten: number
  /** `generated.totalChars` — only the characters inside segments */
  generatedSegmentChars: number
  /**
   * Characters between generation segments, which carry no fate and are
   * therefore in no deletion or survival rate, but which a verbatim claim
   * CAN cover. On this repository's own history this is 4.7% of one
   * generation, so it is not a rounding concern.
   */
  generatedSeparatorChars: number
  /**
   * `finalChars - coveredChars`: characters of the finished work that no
   * span covers, so they are in no class and in no percentage. The
   * final-side twin of `generatedSeparatorChars`.
   */
  finalSeparatorChars: number
  /** `byClass.survived_mutated.chars` — final characters inside edited spans */
  mutatedFinalChars: number
  /**
   * Final characters inside `survived_mutated` spans beyond the generation
   * extent each one claims, summed. These are characters the person wrote
   * while keeping the span, so `mutatedFinalChars` is not a measure of what
   * the model contributed and must not be read as one. Zero means every
   * edit in the record shortened or rewrote at equal length.
   */
  mutatedAddedChars: number
  /**
   * Correction loops, regressions and one-shot corrections in this record —
   * the entries `SIGNAL_QUOTE_GROUNDED` walks. Reported because the bound is
   * vacuously true on a record with no signals, and both fixtures committed
   * to this repository are exactly that: a gate that checked nothing has to
   * say so, or "no violations" reads as "the quotes are grounded".
   */
  signalEntries: number
  /** quote references checked across those entries */
  signalQuotes: number
  /**
   * Signal entries carrying no quote reference at all. Legitimate for a
   * distilled spec, which states what was wanted in the detector's words
   * rather than the user's (src/hq/fixtures.ts has three). Not legitimate
   * for anything `loops.ts` or `signals.ts` produces, since both quote
   * verbatim — so a non-zero count on a record written by `ursa run` is a
   * defect this measurement is the only thing that would show.
   */
  signalEntriesWithoutQuote: number
  /**
   * `survived_mutated` spans carrying a descent verdict
   * (src/corroborate.ts). Zero on a record resolved with no corroborator,
   * which every chat-path record is, and which is why this is a
   * measurement: "no violations" on such a record means the bound was
   * vacuous, not that the mutation labels were checked.
   */
  descentChecked: number
  /**
   * Of those, the ones the search could not settle — `basis: 'unverified'`.
   * The label stands on these and is unguarded. A buyer who wants only
   * corroborated corrections filters on exactly this number, so it is
   * reported rather than left to be recomputed from the spans.
   */
  descentUnverified: number
  /**
   * Spans demoted to `no_generation_provenance` because a commit outside
   * the generation's descent held their text verbatim. Each one is a
   * word-level diff the record would otherwise have sold as the user's
   * correction, so a non-zero count here is the bound earning its place.
   */
  descentDemoted: number
  /**
   * Paths in `record.exclusions` — files the episode touched and the run
   * refused to classify. A measurement and not a bound, because zero is the
   * normal answer: most episodes import nothing. Reported because a
   * reviewer cannot otherwise tell a record that asked the question from
   * one whose capture path never could.
   */
  excludedPaths: number
  /**
   * Characters in those files, summed. This is the quantity that left this
   * record's survival and discard figures by being excluded, so it is the
   * number a reader needs to compare one run against an earlier one.
   */
  excludedChars: number
  /**
   * `stats.finalChars + excludedChars`: characters in every path the run was
   * willing to read, classified and refused together. The reconciliation
   * `excludedChars` exists for — a record whose excluded count cannot be
   * added back to the finished size is a record whose exclusions have
   * drifted from the files they describe.
   */
  consideredChars: number
}

const BOUNDS: Record<InvariantCode, string> = {
  CLAIM_NOT_WIDER:
    'a survived_verbatim final span is no wider than the generation extent it claims: span.end - span.start <= source.end - source.start. Verbatim means byte-identical, so the two extents describe the same characters. A survived_mutated span is exempt, because an edit may add text the generation never contained.',
  CLAIM_IN_GENERATION:
    'a source pointer names a generation that exists and an extent inside that generation\'s text: 0 <= start < end <= text.length',
  GEN_SPANS_PARTITION_ORDER:
    'a generation\'s spans are ordered, non-overlapping, inside its text, and each span.text is exactly text.slice(start, end)',
  GEN_CHARS_CONSISTENT:
    'a generation\'s character counts agree: totalChars = sum of span extents, charsWritten = text.length, separatorChars = charsWritten - totalChars',
  GEN_SURVIVED_BOUNDED:
    'a generation\'s surviving characters are a subset of its segment characters, which are a subset of what it wrote: survivedChars <= totalChars <= charsWritten',
  GEN_CLAIM_BOUNDED:
    'the characters of one generation claimed by final spans, counted once each, do not exceed what that generation wrote: claimed <= charsWritten',
  DELETION_SPLIT_EXACT:
    'the deletion split is exact and non-negative: humanDeletedChars + mergeDeletedChars + unknownDeletedChars = deletedChars = totalChars - survivedChars',
  FINAL_SPANS_IN_FILE:
    'a final file\'s spans are ordered, non-overlapping, inside its text, and each span.text is exactly text.slice(start, end)',
  COVERED_BOUNDED:
    'classified characters are a subset of the finished work: coveredChars = sum of final span extents <= finalChars',
  RATES_MATCH_FIELDS:
    'every stored rate equals its own numerator over its own denominator, rounded to three places',
  SIGNAL_QUOTE_GROUNDED:
    'every QuoteRef a signal carries names raw text that exists in this record, the excerpt appears in that text under excerpt()\'s whitespace normalization, and the same excerpt appears in the signal\'s own prose field. A signal may legitimately carry no QuoteRef at all (a distilled spec quotes nobody); what it may not do is carry one that does not hold.',
  EXCLUSION_NOT_CLASSIFIED:
    'no path the record excludes appears among its classified files, and every exclusion names a commit and a positive character count. The first clause is the same-set arithmetic this module exists for: `exclusions` and `files` partition the paths the run was willing to read, so a path in both means the refusal was computed and then not applied, and the record simultaneously claims the file is an import and sells labels over its spans. The second catches an exclusion that cannot be reconciled against the figures it moved — `stats.finalChars` plus the excluded characters is the size of every path the run read, and an entry with no number or no commit breaks that sum silently.',
  DESCENT_CHECKED_UNIFORMLY:
    'if any span in the record carries a descent verdict, every survived_mutated span carries one, and no span still labelled survived_mutated carries a `rival` verdict. The first clause catches a corroborator wired for some files and not others, which would leave part of the record\'s mutation labels unguarded while the record as a whole looks checked. The second catches the demotion being computed and then not applied, which is the only way a span can both name the rival that disproves its descent and keep the diff that asserts it.',
}

const r3 = (x: number) => Math.round(x * 1000) / 1000

/** a violation message quotes the offending string; 60 chars is enough to find it */
const abbrev = (s: string) => (s.length > 60 ? s.slice(0, 60) + '…' : s)

function claimsByGeneration(
  files: FinalFile[],
  include: (s: FinalSpan) => boolean,
): Map<number, Array<[number, number]>> {
  const byGen = new Map<number, Array<[number, number]>>()
  for (const f of files) {
    for (const s of f.spans) {
      if (!s.source || !include(s)) continue
      const arr = byGen.get(s.source.generationIndex)
      if (arr) arr.push([s.source.start, s.source.end])
      else byGen.set(s.source.generationIndex, [[s.source.start, s.source.end]])
    }
  }
  return byGen
}

/**
 * Every quoting signal in a record, flattened to one shape: the prose field a
 * lab actually reads, and the quote references attached to it. Written as a
 * generator over the three arrays rather than three near-identical loops,
 * because the three differ only in which field carries the prose and a fourth
 * signal type that quotes is a matter of when, not if.
 */
function* quotingSignals(
  signals: LabSignals,
): Generator<{ where: string; prose: string; quotes: QuoteRef[] }> {
  for (const [i, l] of signals.correctionLoops.entries()) {
    yield {
      where: `signals.correctionLoops[${i}] (${l.id}) discoveredSpec`,
      prose: l.discoveredSpec,
      quotes: l.quotes ?? [],
    }
  }
  for (const [i, r] of signals.regressions.entries()) {
    yield {
      where: `signals.regressions[${i}] (step ${r.step}) evidence`,
      prose: r.evidence,
      quotes: r.quotes ?? [],
    }
  }
  for (const [i, c] of signals.oneShotCorrections.entries()) {
    yield {
      where: `signals.oneShotCorrections[${i}] (step ${c.step}) text`,
      prose: c.text,
      quotes: c.quotes ?? [],
    }
  }
}

/**
 * The raw text one `QuoteRef` names, or a sentence saying why this record
 * does not contain it. A string return is the text; an `Error` is the
 * unresolvable case, which is a violation in its own right — an excerpt whose
 * source cannot be found is not a grounded quote, it is an assertion.
 */
function rawTextFor(record: OutcomeRecord, q: QuoteRef): string | Error {
  if (q.of === 'user_prompt') {
    if (q.conversationId === undefined || q.step === undefined) {
      return new Error('of=user_prompt needs both conversationId and step')
    }
    const conv = record.conversations.find((c) => c.id === q.conversationId)
    if (!conv) {
      return new Error(`no conversation ${q.conversationId} in this record (has ${record.conversations.map((c) => c.id).join(', ') || 'none'})`)
    }
    if (!conv.prompts) {
      return new Error(`conversation ${q.conversationId} carries no prompts[], so the quote cannot be re-read from this record`)
    }
    const prompt = conv.prompts.find((p) => p.step === q.step)
    if (!prompt) {
      return new Error(`conversation ${q.conversationId} has no prompt at step ${q.step} (steps present: ${conv.prompts.map((p) => p.step).join(', ') || 'none'})`)
    }
    return prompt.text
  }

  if (q.of === 'generation') {
    if (q.generationIndex === undefined) {
      return new Error('of=generation needs generationIndex, the record\'s own address for a generation')
    }
    const gen = record.generations[q.generationIndex]
    if (!gen || gen.generationIndex !== q.generationIndex) {
      return new Error(`no generation at index ${q.generationIndex} (record has ${record.generations.length})`)
    }
    if (q.step !== undefined && gen.turnIndex !== q.step) {
      return new Error(`generation ${q.generationIndex} is at turnIndex ${gen.turnIndex}, the quote claims step ${q.step}`)
    }
    return gen.text
  }

  if (q.filePath === undefined) return new Error('of=final_span needs filePath')
  const file = record.files.find((f) => f.path === q.filePath)
  if (!file) {
    return new Error(`no file ${q.filePath} in this record (has ${record.files.map((f) => f.path).join(', ') || 'none'})`)
  }
  return file.text
}

/**
 * Every violated invariant on one record, in the order the invariants are
 * declared above. An empty array means the record's own arithmetic is
 * self-consistent; it does not mean the labels are right.
 */
export function checkRecord(record: OutcomeRecord): Violation[] {
  const out: Violation[] = []
  const id = record.task.id
  const push = (code: InvariantCode, where: string, observed: string) =>
    out.push({ code, invariant: BOUNDS[code], where: `${id} ${where}`.trim(), observed })

  const gens: GenerationRecord[] = record.generations

  // Final-side spans, and the claims they make on generations.
  for (const f of record.files) {
    let prevEnd = 0
    for (const [i, s] of f.spans.entries()) {
      const at = `file ${f.path} span ${i} [${s.start},${s.end})`
      if (s.start < prevEnd || s.start > s.end || s.end > f.text.length) {
        push('FINAL_SPANS_IN_FILE', at,
          `previous span ended at ${prevEnd}, file is ${f.text.length} chars`)
      } else if (s.text !== f.text.slice(s.start, s.end)) {
        push('FINAL_SPANS_IN_FILE', at,
          `span.text is ${s.text.length} chars, text.slice(${s.start}, ${s.end}) is ${f.text.slice(s.start, s.end).length}`)
      }
      prevEnd = Math.max(prevEnd, s.end)

      if (!s.source) continue
      const gi = s.source.generationIndex
      const gen = gens[gi]
      if (!gen || gen.generationIndex !== gi) {
        push('CLAIM_IN_GENERATION', at,
          `source.generationIndex ${gi}, record has ${gens.length} generations`)
        continue
      }
      if (s.source.start < 0 || s.source.start >= s.source.end || s.source.end > gen.text.length) {
        push('CLAIM_IN_GENERATION', at,
          `claims [${s.source.start},${s.source.end}) of a generation ${gen.text.length} chars long`)
      }
      // Verbatim only. The first version of this check applied to every
      // span with a source and failed immediately on a mutated span 82
      // chars long matched to a 75-char generation segment: the person had
      // edited "holds it whole" into "holds the whole of it" and added
      // seven characters. The span is not lying, the edit really is wider
      // than what it edited, and that is the correction. What the seven
      // characters do break is the reading of `byClass.survived_mutated.
      // chars` as a model contribution — `measure()` reports them as
      // `mutatedAddedChars`, and the modelling question is a ledger entry
      // rather than a bound, because it changes a figure Ursa Minor sells.
      if (s.class === 'survived_verbatim') {
        const finalLen = s.end - s.start
        const srcLen = s.source.end - s.source.start
        if (finalLen > srcLen) {
          push('CLAIM_NOT_WIDER', at,
            `${finalLen} final chars credited to a ${srcLen}-char generation extent, ${finalLen - srcLen} too many`)
        }
      }
    }
  }

  // Generation-side spans and counts.
  for (const g of gens) {
    const at = `generation ${g.generationIndex}${g.filePath ? ` (${g.filePath})` : ''}`
    let prevEnd = 0
    let segmentChars = 0
    for (const [i, s] of g.spans.entries()) {
      if (s.start < prevEnd || s.start > s.end || s.end > g.text.length) {
        push('GEN_SPANS_PARTITION_ORDER', `${at} span ${i} [${s.start},${s.end})`,
          `previous span ended at ${prevEnd}, generation is ${g.text.length} chars`)
      } else if (s.text !== g.text.slice(s.start, s.end)) {
        push('GEN_SPANS_PARTITION_ORDER', `${at} span ${i} [${s.start},${s.end})`,
          `span.text is ${s.text.length} chars, text.slice(${s.start}, ${s.end}) is ${g.text.slice(s.start, s.end).length}`)
      }
      prevEnd = Math.max(prevEnd, s.end)
      segmentChars += s.end - s.start
    }
    if (g.totalChars !== segmentChars || g.charsWritten !== g.text.length
      || g.separatorChars !== g.charsWritten - g.totalChars) {
      push('GEN_CHARS_CONSISTENT', at,
        `totalChars ${g.totalChars} vs span extents ${segmentChars}; charsWritten ${g.charsWritten} vs text.length ${g.text.length}; separatorChars ${g.separatorChars} vs ${g.charsWritten - g.totalChars}`)
    }
    if (g.survivedChars > g.totalChars || g.totalChars > g.charsWritten) {
      push('GEN_SURVIVED_BOUNDED', at,
        `survivedChars ${g.survivedChars}, totalChars ${g.totalChars}, charsWritten ${g.charsWritten}`)
    }
    if (r3(g.totalChars ? g.survivedChars / g.totalChars : 0) !== g.survivalRate) {
      push('RATES_MATCH_FIELDS', at,
        `survivalRate ${g.survivalRate}, but ${g.survivedChars}/${g.totalChars} is ${r3(g.totalChars ? g.survivedChars / g.totalChars : 0)}`)
    }
  }

  const allClaims = claimsByGeneration(record.files, () => true)
  for (const [gi, intervals] of allClaims) {
    const gen = gens[gi]
    if (!gen) continue
    const claimed = mergedLength(intervals)
    if (claimed > gen.charsWritten) {
      push('GEN_CLAIM_BOUNDED', `generation ${gi}${gen.filePath ? ` (${gen.filePath})` : ''}`,
        `${claimed} distinct chars claimed by final spans, generation wrote ${gen.charsWritten}`)
    }
  }

  // Stats-level arithmetic.
  const st = record.stats
  const gen = st.generated
  const split = gen.humanDeletedChars + gen.mergeDeletedChars + gen.unknownDeletedChars
  const expectedDeleted = gen.totalChars - gen.survivedChars
  if (split !== gen.deletedChars || gen.deletedChars !== expectedDeleted
    || gen.humanDeletedChars < 0 || gen.mergeDeletedChars < 0 || gen.unknownDeletedChars < 0) {
    push('DELETION_SPLIT_EXACT', 'stats.generated',
      `human ${gen.humanDeletedChars} + merge ${gen.mergeDeletedChars} + unknown ${gen.unknownDeletedChars} = ${split}, deletedChars ${gen.deletedChars}, totalChars - survivedChars = ${expectedDeleted}`)
  }

  const spanExtentSum = record.files.reduce(
    (a, f) => a + f.spans.reduce((b, s) => b + (s.end - s.start), 0), 0,
  )
  if (st.coveredChars !== spanExtentSum || st.coveredChars > st.finalChars) {
    push('COVERED_BOUNDED', 'stats',
      `coveredChars ${st.coveredChars}, span extents ${spanExtentSum}, finalChars ${st.finalChars}`)
  }

  const rateChecks: Array<[string, number, number, number]> = [
    ['generated.deletedPct', gen.deletedChars, gen.totalChars, gen.deletedPct],
    ['generated.humanDeletedPct', gen.humanDeletedChars, gen.totalChars, gen.humanDeletedPct],
  ]
  for (const [name, num, den, stored] of rateChecks) {
    const actual = r3(den ? num / den : 0)
    if (actual !== stored) {
      push('RATES_MATCH_FIELDS', `stats.${name}`,
        `stored ${stored}, but ${num}/${den} is ${actual}`)
    }
  }
  for (const c of record.stats.perConversation) {
    const actual = r3(c.generatedChars ? c.survivedChars / c.generatedChars : 0)
    if (actual !== c.survivalRate) {
      push('RATES_MATCH_FIELDS', `stats.perConversation ${c.conversationId}`,
        `survivalRate ${c.survivalRate}, but ${c.survivedChars}/${c.generatedChars} is ${actual}`)
    }
  }
  // Signals — the block Ursa Minor sells. Ten bounds above read `files`,
  // `generations` and `stats`; this one reads the quotes, because a wrong
  // number is an arithmetic defect and a misquote of the user is a trust
  // incident (CLAUDE.md §5: the primary asset can be destroyed in a week).
  if (record.signals) {
    for (const sig of quotingSignals(record.signals)) {
      for (const [qi, q] of sig.quotes.entries()) {
        const at = `${sig.where} quote ${qi} (of=${q.of})`
        const raw = rawTextFor(record, q)
        if (raw instanceof Error) {
          push('SIGNAL_QUOTE_GROUNDED', at, `unresolvable: ${raw.message}`)
          continue
        }
        if (!isExcerptOf(q.text, raw)) {
          push('SIGNAL_QUOTE_GROUNDED', at,
            `quote ${JSON.stringify(abbrev(q.text))} does not appear in the ${raw.length}-char text it names`)
        }
        if (!sig.prose.includes(q.text)) {
          push('SIGNAL_QUOTE_GROUNDED', at,
            `quote ${JSON.stringify(abbrev(q.text))} is not present in the prose field a reader sees, so the two can disagree`)
        }
      }
    }
  }

  const classes: SpanClass[] = ['survived_verbatim', 'survived_mutated', 'no_generation_provenance']
  for (const c of classes) {
    const actual = r3(st.coveredChars ? st.byClass[c].chars / st.coveredChars : 0)
    if (actual !== st.byClass[c].pct) {
      push('RATES_MATCH_FIELDS', `stats.byClass.${c}.pct`,
        `stored ${st.byClass[c].pct}, but ${st.byClass[c].chars}/${st.coveredChars} is ${actual}`)
    }
  }

  // Descent — the guard on the one label that carries a `diff`, and so the
  // only bound here that is about whether a claim was CHECKED rather than
  // about whether two numbers agree. See src/corroborate.ts.
  const descentSpans: Array<{ where: string; span: FinalSpan; descent: DescentEvidence }> = []
  const mutatedWithout: string[] = []
  for (const f of record.files) {
    for (const [i, s] of f.spans.entries()) {
      const at = `file ${f.path} span ${i} [${s.start},${s.end})`
      if (s.descent) descentSpans.push({ where: at, span: s, descent: s.descent })
      else if (s.class === 'survived_mutated') mutatedWithout.push(at)
    }
  }
  if (descentSpans.length > 0 && mutatedWithout.length > 0) {
    push('DESCENT_CHECKED_UNIFORMLY', mutatedWithout[0],
      `${descentSpans.length} spans carry a descent verdict, ${mutatedWithout.length} survived_mutated spans carry none`)
  }
  for (const d of descentSpans) {
    if (d.span.class === 'survived_mutated' && d.descent.basis === 'rival') {
      push('DESCENT_CHECKED_UNIFORMLY', d.where,
        `labelled survived_mutated while naming ${d.descent.relation} rival ${d.descent.sha} as holding the span's text verbatim`)
    }
  }

  // The file-level refusal, checked the way the span-level one is. The
  // failure this catches is the mirror of DESCENT_CHECKED_UNIFORMLY's
  // second clause: there, the demotion is computed and not applied to the
  // span; here, the exclusion is computed and not applied to the file. Both
  // produce a record that names its own counter-evidence and sells the
  // claim anyway, which is the one defect a buyer could catch before we do.
  const classified = new Set(record.files.map((f) => f.path))
  for (const [i, x] of (record.exclusions ?? []).entries()) {
    const at = `exclusions[${i}] (${x.path})`
    if (classified.has(x.path)) {
      const f = record.files.find((ff) => ff.path === x.path)!
      push('EXCLUSION_NOT_CLASSIFIED', at,
        `excluded as ${x.reason} from ${x.sha} and also present in files[] with ${f.spans.length} classified span${f.spans.length === 1 ? '' : 's'} over ${f.text.length} chars`)
    }
    if (x.chars <= 0 || x.sha.length === 0) {
      push('EXCLUSION_NOT_CLASSIFIED', at,
        `chars=${x.chars}, sha=${x.sha ? x.sha : '(empty)'}; stats.finalChars is ${record.stats.finalChars}, which this entry cannot be added back to`)
    }
  }

  return out
}

/** The numbers the gate reports without failing. See `Measurement`. */
export function measure(record: OutcomeRecord): Measurement {
  const verbatimClaims = claimsByGeneration(record.files, (s) => s.class === 'survived_verbatim')
  let verbatimClaimedChars = 0
  for (const intervals of verbatimClaims.values()) verbatimClaimedChars += mergedLength(intervals)

  let mutatedAddedChars = 0
  for (const f of record.files) {
    for (const s of f.spans) {
      if (s.class !== 'survived_mutated' || !s.source) continue
      const excess = (s.end - s.start) - (s.source.end - s.source.start)
      if (excess > 0) mutatedAddedChars += excess
    }
  }

  let descentChecked = 0
  let descentUnverified = 0
  let descentDemoted = 0
  for (const f of record.files) {
    for (const s of f.spans) {
      if (!s.descent) continue
      if (s.class === 'survived_mutated') {
        descentChecked++
        if (s.descent.basis === 'unverified') descentUnverified++
      } else if (s.descent.basis === 'rival') {
        descentDemoted++
      }
    }
  }

  let signalEntries = 0
  let signalQuotes = 0
  let signalEntriesWithoutQuote = 0
  if (record.signals) {
    for (const sig of quotingSignals(record.signals)) {
      signalEntries++
      signalQuotes += sig.quotes.length
      if (sig.quotes.length === 0) signalEntriesWithoutQuote++
    }
  }

  const exclusions = record.exclusions ?? []
  const excludedChars = exclusions.reduce((a, x) => a + x.chars, 0)

  const verbatimFinalChars = record.stats.byClass.survived_verbatim.chars
  return {
    recordId: record.task.id,
    verbatimFinalChars,
    verbatimClaimedChars,
    reusedChars: verbatimFinalChars - verbatimClaimedChars,
    generatedCharsWritten: record.stats.generated.charsWritten,
    generatedSegmentChars: record.stats.generated.totalChars,
    generatedSeparatorChars: record.stats.generated.separatorChars,
    finalSeparatorChars: record.stats.finalChars - record.stats.coveredChars,
    mutatedFinalChars: record.stats.byClass.survived_mutated.chars,
    mutatedAddedChars,
    signalEntries,
    signalQuotes,
    signalEntriesWithoutQuote,
    descentChecked,
    descentUnverified,
    descentDemoted,
    excludedPaths: exclusions.length,
    excludedChars,
    consideredChars: record.stats.finalChars + excludedChars,
  }
}

/** One line per violation, for a CLI or a failing test's message. */
export function formatViolations(violations: Violation[]): string {
  return violations
    .map((v) => `${v.code}  ${v.where}\n    bound:    ${v.invariant}\n    observed: ${v.observed}`)
    .join('\n')
}
