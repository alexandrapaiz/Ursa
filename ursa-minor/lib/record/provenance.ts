import type {
  ConversationMeta,
  GenerationRecord,
  OutcomeRecord,
  SourcePointer,
  UserPrompt,
} from './types'

/**
 * Which of the person's own messages elicited a given assistant turn.
 *
 * The rule, stated exactly once: `UserPrompt.step` is the assistant-step
 * ordinal that was current when the person typed, so the prompt behind
 * assistant turn `T` is the LAST prompt with `step < T`. A turn with
 * nothing in front of it has no eliciting prompt, and that is reported as
 * null rather than hidden.
 *
 * This is the same rule as `elicitingPrompt` in `ursa-major/src/audit.ts`,
 * and a second implementation of a rule is a second place for it to
 * drift. The drift is checked rather than hoped for:
 * `npm run check:example-record` recomputes the whole array here and
 * compares it with the array `ursa-major`'s own renderer inlined into the
 * committed fixture viewer, so a disagreement between the two
 * implementations fails a command instead of quietly changing what the
 * page attributes to a person.
 */
export function elicitingPrompt(
  conversations: ConversationMeta[],
  conversationId: string,
  turnIndex: number,
): UserPrompt | null {
  const conv = conversations.find((c) => c.id === conversationId)
  if (!conv?.prompts?.length) return null
  let found: UserPrompt | null = null
  for (const p of conv.prompts) {
    if (p.step < turnIndex) found = p
    else break
  }
  return found
}

/** The eliciting prompt of every generation, indexed by generationIndex. */
export function elicitingPrompts(record: OutcomeRecord): Array<UserPrompt | null> {
  const out: Array<UserPrompt | null> = []
  for (const g of record.generations) {
    out[g.generationIndex] = elicitingPrompt(
      record.conversations,
      g.conversationId,
      g.turnIndex,
    )
  }
  return out
}

export function generationAt(
  record: OutcomeRecord,
  src: SourcePointer,
): GenerationRecord | undefined {
  return record.generations.find((g) => g.generationIndex === src.generationIndex)
}

export function conversationTitle(
  record: OutcomeRecord,
  conversationId: string,
): string {
  const conv = record.conversations.find((c) => c.id === conversationId)
  return conv?.title ?? conversationId
}

export interface ProvenanceReach {
  /** every span of every file */
  spansTotal: number
  /** spans that name a generation */
  spansWithSource: number
  /** of those, the ones that reach the words the person typed */
  spansReachingPrompt: number
  /** span sources that point at a generation this record does not contain */
  brokenSources: number
}

/**
 * How far the page can actually walk, counted rather than asserted.
 *
 * The navigation criterion this viewer exists to meet is that every
 * span's classification links back to the specific generation and the
 * person's own words that produced it, with no broken pointer. A page
 * that claims that and does not count it is a page asking to be trusted.
 * So the numbers are computed from the record in front of the reader and
 * printed on it, including when they are bad.
 */
export function provenanceReach(record: OutcomeRecord): ProvenanceReach {
  const elicited = elicitingPrompts(record)
  let spansTotal = 0
  let spansWithSource = 0
  let spansReachingPrompt = 0
  let brokenSources = 0
  for (const file of record.files) {
    for (const span of file.spans) {
      spansTotal += 1
      if (!span.source) continue
      spansWithSource += 1
      if (!generationAt(record, span.source)) {
        brokenSources += 1
        continue
      }
      if (elicited[span.source.generationIndex]) spansReachingPrompt += 1
    }
  }
  return { spansTotal, spansWithSource, spansReachingPrompt, brokenSources }
}

/** Percent with one decimal, and no trailing ".0" noise. */
export function pct(n: number): string {
  const v = n * 100
  return `${Number.isInteger(v) ? v : v.toFixed(1)}%`
}
