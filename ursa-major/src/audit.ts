// Provenance navigation audit — "can you get from any span back to what caused it?"
//
// The record is a graph of pointers: a final span names a generation, a generation
// belongs to a conversation, and a conversation carries the user's own prompts. The
// viewer walks that graph; a pointer that does not resolve shows up there as a dead
// hover or a silent fallback rather than an error. This module walks every pointer
// in a record and names the ones that do not resolve, so "no broken pointer" is a
// check that runs rather than something a person squints at in a browser.
//
// Sprint 2026-09-21, backlog item 3.

import type { OutcomeRecord, SourcePointer, UserPrompt } from './types'

export type BrokenPointerKind =
  /** source.conversationId names a conversation the record does not carry */
  | 'unknown_conversation'
  /** source.generationIndex is outside generations[] */
  | 'generation_index_out_of_range'
  /** generations[i].generationIndex !== i, so array-index lookup lands on the wrong generation */
  | 'generation_index_mismatch'
  /** the generation reached is filed under a different conversation than the pointer claims */
  | 'generation_conversation_mismatch'
  /** the generation reached sits at a different turn than the pointer claims */
  | 'generation_turn_mismatch'
  /** the generation reached is attributed to a different model than the pointer claims */
  | 'generation_model_mismatch'
  /** source.start/end do not slice inside the generation's text */
  | 'source_range_out_of_bounds'
  /** span.text is not what span.start/end slice out of the file */
  | 'span_text_mismatch'
  /** a generation span's text is not what its offsets slice out of the generation */
  | 'generation_span_text_mismatch'
  /** the generation is reachable but no user prompt precedes it: the user's words are missing */
  | 'no_eliciting_prompt'
  /** a stats row names a file or conversation the record does not carry */
  | 'stats_path_unknown'
  | 'stats_conversation_unknown'

export interface BrokenPointer {
  kind: BrokenPointerKind
  /** record coordinates of the pointer, e.g. `files[0].spans[3].source` */
  at: string
  /** what was expected and what was found, concretely */
  detail: string
}

export interface ProvenanceAudit {
  /** every source pointer, generation span and stats row walked */
  pointersChecked: number
  spansTotal: number
  /** spans carrying a resolved generation source (confirmed or best-rejected candidate) */
  spansWithSource: number
  /** of those, the ones that also reach the user prompt that produced the generation */
  spansReachingPrompt: number
  broken: BrokenPointer[]
}

/**
 * The user's words that produced a given assistant turn: the last prompt that
 * arrived before it. `UserPrompt.step` is the assistant-step ordinal current when
 * the prompt was typed, so the prompt behind turn T is the latest one with
 * `step < T`. Returns null when the turn has no prompt in front of it.
 */
export function elicitingPrompt(
  record: OutcomeRecord,
  conversationId: string,
  turnIndex: number,
): UserPrompt | null {
  const conv = record.conversations.find((c) => c.id === conversationId)
  if (!conv?.prompts?.length) return null
  let best: UserPrompt | null = null
  for (const p of conv.prompts) if (p.step < turnIndex) best = p
  return best
}

/** The eliciting prompt for each generation, indexed by generationIndex. */
export function elicitingPrompts(record: OutcomeRecord): Array<UserPrompt | null> {
  return record.generations.map((g) => elicitingPrompt(record, g.conversationId, g.turnIndex))
}

export function auditProvenance(record: OutcomeRecord): ProvenanceAudit {
  const broken: BrokenPointer[] = []
  const add = (kind: BrokenPointerKind, at: string, detail: string) => broken.push({ kind, at, detail })

  let pointersChecked = 0
  let spansTotal = 0
  let spansWithSource = 0
  let spansReachingPrompt = 0

  const convIds = new Set(record.conversations.map((c) => c.id))
  const filePaths = new Set(record.files.map((f) => f.path))

  // generations[] must be addressable by generationIndex: the viewer looks up
  // R.generations[src.generationIndex] directly.
  record.generations.forEach((g, i) => {
    pointersChecked++
    if (g.generationIndex !== i) {
      add('generation_index_mismatch', `generations[${i}]`,
        `generations[${i}].generationIndex is ${g.generationIndex}; array-index lookup would land on the wrong generation`)
    }
    if (!convIds.has(g.conversationId)) {
      add('unknown_conversation', `generations[${i}].conversationId`,
        `no conversation with id "${g.conversationId}"`)
    }
    g.spans.forEach((s, j) => {
      pointersChecked++
      if (g.text.slice(s.start, s.end) !== s.text) {
        add('generation_span_text_mismatch', `generations[${i}].spans[${j}]`,
          `offsets ${s.start}..${s.end} slice ${JSON.stringify(g.text.slice(s.start, s.end).slice(0, 40))}, span text is ${JSON.stringify(s.text.slice(0, 40))}`)
      }
    })
  })

  /** walk one source pointer; returns true when it reaches a generation */
  const checkSource = (src: SourcePointer, at: string): boolean => {
    pointersChecked++
    if (!convIds.has(src.conversationId)) {
      add('unknown_conversation', at, `no conversation with id "${src.conversationId}"`)
    }
    const gen = record.generations[src.generationIndex]
    if (!gen) {
      add('generation_index_out_of_range', at,
        `generationIndex ${src.generationIndex} with ${record.generations.length} generations in the record`)
      return false
    }
    if (gen.conversationId !== src.conversationId) {
      add('generation_conversation_mismatch', at,
        `pointer claims conversation "${src.conversationId}", generation ${src.generationIndex} is filed under "${gen.conversationId}"`)
    }
    if (gen.turnIndex !== src.turnIndex) {
      add('generation_turn_mismatch', at,
        `pointer claims turn ${src.turnIndex}, generation ${src.generationIndex} is turn ${gen.turnIndex}`)
    }
    if (gen.model !== src.model) {
      add('generation_model_mismatch', at,
        `pointer claims model "${src.model}", generation ${src.generationIndex} is "${gen.model}"`)
    }
    if (src.start < 0 || src.end > gen.text.length || src.start >= src.end) {
      add('source_range_out_of_bounds', at,
        `range ${src.start}..${src.end} against a generation of ${gen.text.length} chars`)
    }
    return true
  }

  record.files.forEach((f, fi) => {
    f.spans.forEach((s, si) => {
      spansTotal++
      const at = `files[${fi}].spans[${si}]`
      pointersChecked++
      if (f.text.slice(s.start, s.end) !== s.text) {
        add('span_text_mismatch', at,
          `offsets ${s.start}..${s.end} slice ${JSON.stringify(f.text.slice(s.start, s.end).slice(0, 40))}, span text is ${JSON.stringify(s.text.slice(0, 40))}`)
      }
      const src = s.source ?? s.candidate?.source
      if (!src) return
      spansWithSource++
      const reached = checkSource(src, `${at}.${s.source ? 'source' : 'candidate.source'}`)
      if (!reached) return
      pointersChecked++
      if (elicitingPrompt(record, src.conversationId, src.turnIndex)) {
        spansReachingPrompt++
      } else {
        add('no_eliciting_prompt', `${at} → conversations["${src.conversationId}"].prompts`,
          `no user prompt with step < ${src.turnIndex}; the span classification cannot be traced to the user's own words`)
      }
    })
  })

  record.stats.perFile.forEach((r, i) => {
    pointersChecked++
    if (!filePaths.has(r.path)) {
      add('stats_path_unknown', `stats.perFile[${i}].path`, `no final file with path "${r.path}"`)
    }
  })
  record.stats.perConversation.forEach((r, i) => {
    pointersChecked++
    if (!convIds.has(r.conversationId)) {
      add('stats_conversation_unknown', `stats.perConversation[${i}].conversationId`,
        `no conversation with id "${r.conversationId}"`)
    }
  })

  return { pointersChecked, spansTotal, spansWithSource, spansReachingPrompt, broken }
}

/** One block of plain text for a terminal; empty-safe, no color codes. */
export function formatAudit(audit: ProvenanceAudit): string {
  const lines = [
    '— provenance navigation audit —',
    `pointers checked: ${audit.pointersChecked}`,
    `spans: ${audit.spansTotal} · with a generation source: ${audit.spansWithSource} · of those, reaching the user's own words: ${audit.spansReachingPrompt}`,
    `broken pointers: ${audit.broken.length}`,
  ]
  for (const b of audit.broken) lines.push(`  ✗ ${b.kind} at ${b.at}: ${b.detail}`)
  return lines.join('\n')
}
