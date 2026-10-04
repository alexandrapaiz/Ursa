// Summary + trajectory statistics over a resolved record.

import type {
  ConversationMeta, FinalFile, GenerationRecord, SpanClass, Stats,
} from './types'

const CLASSES: SpanClass[] = [
  'survived_verbatim',
  'survived_mutated',
  'no_generation_provenance',
]

const r3 = (x: number) => Math.round(x * 1000) / 1000

export function computeStats(
  files: FinalFile[],
  generations: GenerationRecord[],
  conversations: ConversationMeta[],
): Stats {
  const byClass = Object.fromEntries(
    CLASSES.map((c) => [c, { spans: 0, chars: 0, pct: 0 }]),
  ) as Stats['byClass']
  let coveredChars = 0
  let finalChars = 0
  let uncertainSpans = 0
  let trivialSpans = 0
  const byModelChars = new Map<string, number>()
  const byConvChars = new Map<string, number>()

  const perFile = files.map((f) => {
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

  for (const c of CLASSES) byClass[c].pct = coveredChars ? r3(byClass[c].chars / coveredChars) : 0

  const generatedTotal = generations.reduce((a, g) => a + g.totalChars, 0)
  const generatedSurvived = generations.reduce((a, g) => a + g.survivedChars, 0)
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
