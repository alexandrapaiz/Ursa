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
      deletedChars: generatedTotal - generatedSurvived,
      deletedPct: generatedTotal ? r3((generatedTotal - generatedSurvived) / generatedTotal) : 0,
    },
    perFile,
    perConversation,
  }
}
