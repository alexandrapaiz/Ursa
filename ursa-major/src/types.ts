// The provenance-resolved outcome record — Ursa's core data artifact.
// A finished piece of work joined backward to every model generation that fed it,
// each span classified by what happened to it. Schema first; everything else serves it.

export type SpanClass =
  | 'survived_verbatim'
  | 'survived_mutated'
  | 'no_generation_provenance'

export type GenerationFate =
  | 'survived_verbatim'
  | 'survived_mutated'
  | 'generated_deleted'

export type GenerationKind = 'write' | 'edit' | 'assistant_text'

export type SegmentMode = 'prose' | 'code'

export interface SourcePointer {
  conversationId: string
  model: string
  /** ordinal of the assistant turn within its conversation (1-based) */
  turnIndex: number
  generationIndex: number
  /** char offsets into the generation's original text */
  start: number
  end: number
}

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
  /** similarity score that earned the label (1 for verbatim) */
  score?: number
  source?: SourcePointer
  /** word-level diff generation → final; the mutation is the correction */
  diff?: DiffPart[]
  /** below-threshold best match existed; surfaced for human adjudication */
  uncertain?: boolean
  candidate?: { score: number; text: string; source: SourcePointer }
  /** matched by exact equality of a very short segment — weak evidence */
  trivial?: boolean
}

export interface FinalFile {
  path: string
  mode: SegmentMode
  text: string
  spans: FinalSpan[]
}

export interface GenerationSpan {
  start: number
  end: number
  text: string
  fate: GenerationFate
}

export interface RawGeneration {
  conversationId: string
  model: string
  turnIndex: number
  kind: GenerationKind
  filePath?: string
  timestamp?: string
  text: string
}

export interface GenerationRecord extends RawGeneration {
  generationIndex: number
  spans: GenerationSpan[]
  totalChars: number
  survivedChars: number
  survivalRate: number
}

export interface UserPrompt {
  /** assistant-step ordinal at which this prompt arrived — orders it against generations' turnIndex */
  step: number
  timestamp?: string
  text: string
}

export interface ConversationMeta {
  id: string
  title: string
  adapter: 'claude-code' | 'paste'
  model?: string
  source?: string
  date?: string
  turns: number
  userTurns: number
  /** the user's own messages, in order — the correction stream. Raw data; stays local. */
  prompts?: UserPrompt[]
}

export interface ClassStat {
  spans: number
  chars: number
  /** fraction of covered final chars */
  pct: number
}

export interface Stats {
  /** total chars across all final files */
  finalChars: number
  /** chars covered by classified spans (excludes inter-span whitespace) */
  coveredChars: number
  byClass: Record<SpanClass, ClassStat>
  uncertainSpans: number
  trivialSpans: number
  byModel: Record<string, { chars: number; pctOfCovered: number }>
  generated: {
    totalChars: number
    survivedChars: number
    deletedChars: number
    deletedPct: number
  }
  perFile: Array<{
    path: string
    coveredChars: number
    byClass: Record<SpanClass, number>
  }>
  perConversation: Array<{
    conversationId: string
    title: string
    generations: number
    generatedChars: number
    survivedChars: number
    survivalRate: number
    /** latest assistant turn that contributed surviving text; null if none */
    turnsToAcceptance: number | null
  }>
}

// ---------------------------------------------------------------------------
// Lab-facing trajectory signals. Every entry references `step` — the
// assistant-step ordinal — which joins to generations[].turnIndex and
// conversations[].prompts[].step, so each claim is auditable against the
// raw generations and the user's own words.
// ---------------------------------------------------------------------------

export interface CorrectionLoop {
  id: string
  theme: string
  targetFiles: string[]
  openedStep: number
  /** steps of every user prompt in the loop; length-1 = one-shot, not a loop */
  promptSteps: number[]
  /** repetitions after the initial ask — the failure count */
  recurrences: number
  /** prompts reporting previously-accepted state broken */
  regressionSteps: number[]
  closedStep: number | null
  /** accepted = stated; accepted_tacitly = shipped/retained without complaint */
  resolution: 'accepted' | 'accepted_tacitly' | 'abandoned' | 'open'
  /** generation steps whose edits closed the loop */
  resolvingSteps: number[]
  /** the spec the user could not state in advance, articulated post-hoc */
  discoveredSpec: string
}

export interface FeedbackTranslation {
  loopId: string
  /** the user's verbatim phenomenological words */
  complaint: string
  complaintStep: number
  /** the technical fault that fixing closed the complaint */
  mechanism: string
  resolvedBySteps: number[]
}

export interface RepairAttempt {
  loopId: string
  strategy: string
  steps: number[]
  outcome: 'failed' | 'partial' | 'resolved'
  /** artifact's verdict: survival of this attempt's edits */
  evidence: string
}

export interface RegressionEvent {
  /** step at which the user reported it */
  step: number
  brokenState: string
  /** user's verbatim words */
  evidence: string
  causedBySteps?: number[]
}

export interface DefensiveGuardrail {
  step: number
  text: string
  /** the earlier overreach that taught the user to defend */
  priorIncidentStep: number
}

export interface OneShotCorrection {
  step: number
  text: string
  /** why it closed in one shot — the stateable domain it belongs to */
  domain: string
}

export interface LabSignals {
  /** provenance of these labels themselves */
  method: 'manual-annotation' | 'auto-detected'
  annotatedAt?: string
  episode: {
    steps: number
    generations: number
    accepted: boolean
    /** terminal acceptance is often tacit — retention without complaint */
    acceptanceStatedInChat: boolean
    acceptanceBasis: string
  }
  correctionLoops: CorrectionLoop[]
  feedbackTranslations: FeedbackTranslation[]
  repairAttempts: RepairAttempt[]
  regressions: RegressionEvent[]
  defensiveGuardrails: DefensiveGuardrail[]
  oneShotCorrections: OneShotCorrection[]
  notes?: string[]
}

export interface OutcomeRecord {
  schemaVersion: '0.1.0'
  task: {
    id: string
    finished: boolean
    generatedAt: string
  }
  files: FinalFile[]
  conversations: ConversationMeta[]
  generations: GenerationRecord[]
  stats: Stats
  signals?: LabSignals
}
