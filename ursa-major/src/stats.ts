// Summary + trajectory statistics over a resolved record.

import { mergedLength } from './intervals'
import type {
  ConversationMeta, Exclusion, FinalFile, GenerationRecord, SpanClass, Stats,
} from './types'

const CLASSES: SpanClass[] = [
  'survived_verbatim',
  'survived_mutated',
  'no_generation_provenance',
]

const r3 = (x: number) => Math.round(x * 1000) / 1000

/**
 * Every figure the record states about itself.
 *
 * `exclusions` is the same array the record carries at top level, passed in
 * so `perFile` can enumerate the paths the run read rather than only the
 * paths it classified. It is optional because the chat path (src/cli.ts)
 * excludes nothing: there is no repository to prove an import against, so
 * `files` already is every path.
 */
export function computeStats(
  files: FinalFile[],
  generations: GenerationRecord[],
  conversations: ConversationMeta[],
  exclusions: Exclusion[] = [],
): Stats {
  const byClass = Object.fromEntries(
    CLASSES.map((c) => [c, { spans: 0, chars: 0, pct: 0, pctOfFinal: 0 }]),
  ) as Stats['byClass']
  let coveredChars = 0
  let finalChars = 0
  let uncertainSpans = 0
  let trivialSpans = 0
  const byModelChars = new Map<string, number>()
  const byConvChars = new Map<string, number>()

  const perFile: Stats['perFile'] = files.map((f) => {
    finalChars += f.text.length
    const fileByClass = Object.fromEntries(CLASSES.map((c) => [c, 0])) as Record<SpanClass, number>
    let fileCovered = 0
    for (const s of f.spans) {
      const chars = s.end - s.start
      coveredChars += chars
      fileCovered += chars
      byClass[s.class].spans++
      byClass[s.class].chars += chars
      fileByClass[s.class] += chars
      if (s.uncertain) uncertainSpans++
      if (s.trivial) trivialSpans++
      if (s.source) {
        byModelChars.set(s.source.model, (byModelChars.get(s.source.model) ?? 0) + chars)
        byConvChars.set(s.source.conversationId, (byConvChars.get(s.source.conversationId) ?? 0) + chars)
      }
    }
    return { path: f.path, coveredChars: fileCovered, byClass: fileByClass }
  })

  // Two denominators, both stored, neither inferable from the other without
  // the reader knowing which characters each counts. See ClassStat in
  // src/types.ts for why `pct` keeps the narrower one.
  for (const c of CLASSES) {
    byClass[c].pct = coveredChars ? r3(byClass[c].chars / coveredChars) : 0
    byClass[c].pctOfFinal = finalChars ? r3(byClass[c].chars / finalChars) : 0
  }

  // A row for every path the run read, not only the ones that produced
  // spans. An excluded path's row is all zeros and names its reason: the
  // resolver never saw the path, so there is nothing to apportion, and the
  // row exists so that iterating `perFile` enumerates the run's whole
  // reading list. Paths already classified are skipped rather than
  // overwritten, which keeps this loop a no-op on the malformed record
  // EXCLUSION_NOT_CLASSIFIED exists to catch instead of hiding it.
  const classifiedPaths = new Set(files.map((f) => f.path))
  for (const x of exclusions) {
    if (classifiedPaths.has(x.path)) continue
    perFile.push({
      path: x.path,
      coveredChars: 0,
      byClass: Object.fromEntries(CLASSES.map((c) => [c, 0])) as Record<SpanClass, number>,
      excluded: x.reason,
    })
  }

  const generatedTotal = generations.reduce((a, g) => a + g.totalChars, 0)
  const generatedWritten = generations.reduce((a, g) => a + g.charsWritten, 0)
  const generatedSeparators = generations.reduce((a, g) => a + g.separatorChars, 0)
  const generatedSurvived = generations.reduce((a, g) => a + g.survivedChars, 0)
  const verbatimClaimed = claimedChars(files, 'survived_verbatim')
  // A merge can destroy a generation without the human ever choosing to
  // drop it, and an unreadable boundary can leave the cause unknown, so
  // the gross deletion figure is split three ways. Only the human share
  // is a discard, and only it carries correction signal. The human share
  // is computed by subtraction rather than by counting `human_edit`
  // spans, so a cause added later is excluded from the discard rate by
  // default instead of landing in it silently.
  const deletedCharsWhere = (p: (cause: string | undefined) => boolean) =>
    generations.reduce(
      (a, g) => a + g.spans
        .filter((s) => s.fate === 'generated_deleted' && p(s.deletion?.cause))
        .reduce((b, s) => b + (s.end - s.start), 0),
      0,
    )
  const mergeDeleted = deletedCharsWhere((c) => c === 'merge')
  const unknownDeleted = deletedCharsWhere((c) => c === 'unknown')
  const generatedDeleted = generatedTotal - generatedSurvived
  const humanDeleted = generatedDeleted - mergeDeleted - unknownDeleted

  const perConversation = conversations.map((conv) => {
    const convGens = generations.filter((g) => g.conversationId === conv.id)
    const generatedChars = convGens.reduce((a, g) => a + g.totalChars, 0)
    const survivedChars = convGens.reduce((a, g) => a + g.survivedChars, 0)
    const accepted = convGens.filter((g) => g.survivedChars > 0)
    return {
      conversationId: conv.id,
      title: conv.title,
      generations: convGens.length,
      generatedChars,
      survivedChars,
      survivalRate: generatedChars ? r3(survivedChars / generatedChars) : 0,
      turnsToAcceptance: accepted.length
        ? Math.max(...accepted.map((g) => g.turnIndex))
        : null,
    }
  })

  return {
    finalChars,
    coveredChars,
    byClass,
    uncertainSpans,
    trivialSpans,
    byModel: Object.fromEntries(
      [...byModelChars.entries()].map(([m, chars]) => [
        m,
        { chars, pctOfCovered: coveredChars ? r3(chars / coveredChars) : 0 },
      ]),
    ),
    generated: {
      totalChars: generatedTotal,
      charsWritten: generatedWritten,
      separatorChars: generatedSeparators,
      verbatimClaimedChars: verbatimClaimed,
      survivedChars: generatedSurvived,
      deletedChars: generatedDeleted,
      deletedPct: generatedTotal ? r3(generatedDeleted / generatedTotal) : 0,
      humanDeletedChars: humanDeleted,
      humanDeletedPct: generatedTotal ? r3(humanDeleted / generatedTotal) : 0,
      mergeDeletedChars: mergeDeleted,
      unknownDeletedChars: unknownDeleted,
    },
    perFile,
    perConversation,
  }
}

/**
 * Generation characters claimed by final spans of one class, counted once
 * each. The per-class figures in `byClass` count FINAL-file characters, so
 * a generated sentence reused in two files is counted twice there and the
 * total can exceed every generation-side figure. Here the claims are
 * merged per generation first, which makes the result a measurement of the
 * generation and therefore comparable to `charsWritten`.
 *
 * Claims are keyed by `source.generationIndex`, so two files claiming the
 * same extent of the same generation collapse to one, and two files
 * claiming the same extent of different generations do not.
 */
export function claimedChars(files: FinalFile[], cls: SpanClass): number {
  const byGen = new Map<number, Array<[number, number]>>()
  for (const f of files) {
    for (const s of f.spans) {
      if (s.class !== cls || !s.source) continue
      const arr = byGen.get(s.source.generationIndex)
      if (arr) arr.push([s.source.start, s.source.end])
      else byGen.set(s.source.generationIndex, [[s.source.start, s.source.end]])
    }
  }
  let total = 0
  for (const intervals of byGen.values()) total += mergedLength(intervals)
  return total
}
