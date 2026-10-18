/**
 * The part of the outcome record this site renders.
 *
 * The record's authority lives in `ursa-major/src/types.ts`, which is a
 * thousand lines of schema with a paragraph of reasoning behind most
 * fields. This file is deliberately NOT a copy of it. It is the
 * structural subset the viewer reads, so that a reader of this site's
 * code can see the whole contract the page depends on in one screen, and
 * so that a field added over there does not have to be mirrored here to
 * keep the page compiling.
 *
 * Two consequences, stated because they are the cost of the choice:
 *
 * 1. Every field below is optional unless the viewer cannot render
 *    without it, because this site may be handed a record written by an
 *    older resolver than the one in this repository. A record from
 *    before `durability` existed is still a record, and the page shows
 *    what it has rather than refusing it.
 * 2. Nothing here may widen a claim. A field's meaning is whatever
 *    `ursa-major/src/types.ts` says it is; if the two ever disagree,
 *    that file is right and this one is a bug.
 */

/** What happened to a span of the finished work. */
export type SpanClass =
  | 'survived_verbatim'
  | 'survived_mutated'
  | 'no_generation_provenance'

/** What happened to a span of a model generation. */
export type GenerationFate =
  | 'survived_verbatim'
  | 'survived_mutated'
  | 'generated_deleted'
  | 'not_generated'

export interface SourcePointer {
  conversationId: string
  model: string
  /** ordinal of the assistant turn within its conversation (1-based) */
  turnIndex: number
  generationIndex: number
  /** char offsets into the generation's own text */
  start: number
  end: number
}

/** One part of a word-level generation-to-final diff. */
export interface DiffPart {
  value: string
  added?: boolean
  removed?: boolean
}

export interface FinalSpan {
  start: number
  end: number
  text: string
  class: SpanClass
  score?: number
  source?: SourcePointer
  diff?: DiffPart[]
  uncertain?: boolean
  trivial?: boolean
  normalizedOnly?: true
  candidate?: { score: number; text: string; source: SourcePointer }
  descent?: { basis: string; relation?: string; subject?: string; sha?: string }
  lifespan?: { revisions?: number; survivedRevisions?: number }
}

export interface FinalFile {
  path: string
  mode?: 'prose' | 'code'
  text: string
  spans: FinalSpan[]
}

export interface GenerationSpan {
  start: number
  end: number
  text: string
  fate: GenerationFate
  deletion?: { cause: 'human_edit' | 'merge' | 'unknown'; mergeSubject?: string }
}

export interface GenerationRecord {
  generationIndex: number
  conversationId: string
  model: string
  turnIndex: number
  kind: 'write' | 'edit' | 'assistant_text'
  filePath?: string
  text: string
  spans: GenerationSpan[]
}

export interface UserPrompt {
  /** the assistant-step ordinal that was current when the person typed */
  step: number
  text: string
}

export interface ConversationMeta {
  id: string
  title: string
  adapter?: string
  model?: string
  source?: string
  date?: string
  turns?: number
  userTurns?: number
  prompts?: UserPrompt[]
}

export interface ClassStat {
  spans: number
  chars: number
  /** share of the covered characters */
  pct: number
  /** share of every character in the finished work */
  pctOfFinal?: number
}

export interface Stats {
  finalChars: number
  coveredChars: number
  byClass: Partial<Record<SpanClass, ClassStat>>
  uncertainSpans?: number
  trivialSpans?: number
  byModel?: Record<string, { chars: number; pctOfCovered: number }>
  generated?: {
    totalChars: number
    survivedChars: number
    deletedChars: number
    deletedPct: number
    humanDeletedChars?: number
    humanDeletedPct?: number
    mergeDeletedChars?: number
    unknownDeletedChars?: number
  }
  perConversation?: Array<{
    conversationId: string
    title?: string
    generations: number
    generatedChars: number
    survivedChars: number
    survivalRate: number
    turnsToAcceptance?: number | null
  }>
}

export interface OutcomeRecord {
  schemaVersion: string
  task: {
    id: string
    finished: boolean
    generatedAt: string
    resolvedBy?: { kind?: string; commit?: string; digest?: string; clean?: boolean }
  }
  artifact?: { kind?: string; renderRef?: string }
  files: FinalFile[]
  conversations: ConversationMeta[]
  generations: GenerationRecord[]
  stats: Stats
  signals?: {
    verdict?: {
      accepted?: boolean | null
      step?: number | null
      quote?: string | null
      basis?: string
    }
  }
}

/** The order the summary leads with: what survived, first. */
export const SPAN_CLASSES: SpanClass[] = [
  'survived_verbatim',
  'survived_mutated',
  'no_generation_provenance',
]

/**
 * The short name and the sentence each classification earns on the page.
 * The sentences are the record's own definitions, from CLAUDE.md §1 and
 * `ursa-major/src/types.ts`, not a paraphrase invented here: a stranger
 * reading this page is reading the only explanation of the artifact they
 * will get, so the words have to be the project's own.
 */
export const CLASS_COPY: Record<
  SpanClass,
  { label: string; gloss: string }
> = {
  survived_verbatim: {
    label: 'survived verbatim',
    gloss: 'A model generated this text and you kept it unchanged.',
  },
  survived_mutated: {
    label: 'survived mutated',
    gloss:
      'A model generated this text and you kept it, edited. The edit is the correction, expressed as a change rather than a complaint.',
  },
  no_generation_provenance: {
    label: 'no generation provenance',
    gloss:
      'This is in the finished work and traceable to no generation at all. No model was ever in the running for it.',
  },
}

export const FATE_COPY: Record<GenerationFate, string> = {
  survived_verbatim: 'kept, unchanged',
  survived_mutated: 'kept, edited',
  generated_deleted: 'thrown away',
  not_generated: 'already in the file before this generation',
}
