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

// ---------------------------------------------------------------------------
// The time dimension (CLAUDE.md §1). A span's class is a verdict taken at
// one instant — the episode's closing commit. Its lifespan is what the work
// that came afterwards did to it. See lifespan.ts for how it is measured.
// ---------------------------------------------------------------------------

export interface SpanLifespan {
  /** revisions of this span's file, after the closing commit, that were examined */
  revisionsChecked: number
  /**
   * The span is traced sentence by sentence (prose) or line by line (code),
   * because resolve() merges adjacent same-class text and a whole file often
   * arrives here as one span. These count the units long enough to carry
   * evidence; see MIN_TRACEABLE_LEN in lifespan.ts.
   */
  unitsTraced: number
  unitsSurviving: number
  /** chars of this span whose units were still present at the last revision examined */
  survivingChars: number
  /** chars of this span whose units later work removed */
  decayedChars: number
  /** revisions in which every one of the span's units was still present */
  intactRevisions: number
  /** seconds from the closing commit to the newest revision at which it was wholly intact */
  intactSeconds: number
  /** the revision that took the span's first unit; null when it lost none */
  diedAtSha: string | null
  diedAt: string | null
  /** at least one unit was still present at the newest revision examined */
  liveAtTip: boolean
  /**
   * durable  = every unit survived to the tip
   * eroded   = some units survived, some did not
   * decayed  = every unit is gone — a false positive in the span's own class
   * untested = nothing later to test against, or no unit long enough to carry evidence
   */
  fate: 'durable' | 'eroded' | 'decayed' | 'untested'
  /** how presence was last judged */
  basis: 'verbatim' | 'token-containment' | null
  /** why `untested`, when it is untested */
  skipped: 'too-short' | 'no-later-revisions' | null
}

export interface Durability {
  method: 'git-forward-walk'
  /** the revision the walk ended at */
  tipSha: string | null
  /** the episode's closing commit — the instant the span classes were taken at */
  closingSha: string
  /** surviving spans (survived_verbatim + survived_mutated) with a later revision to test */
  testedSpans: number
  durableSpans: number
  erodedSpans: number
  decayedSpans: number
  durableChars: number
  decayedChars: number
  /**
   * decayedChars / (durableChars + decayedChars). The share of this record's
   * own "the user kept it" verdict that later real work overturned. Null when
   * nothing was testable — "nothing decayed" and "nothing was measured" are
   * different claims and only one of them is sellable. A conservative floor:
   * see spanPresent() in lifespan.ts for the presence test, which can only
   * over-report survival.
   */
  decayRate: number | null
  /**
   * The same rate over `no_generation_provenance` spans — text the user wrote
   * themselves. This is the repo's background churn, so agent text decaying at
   * the baseline is not decaying because it was agent text.
   */
  baselineDecayRate: number | null
  /** median seconds a span that lost something stayed wholly intact; null when none did */
  medianIntactSeconds: number | null
  maxRevisionsWalked: number
  minTraceableLen: number
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
  /** what later work did to this span; set by annotateDurability, absent on non-git records */
  lifespan?: SpanLifespan
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
  adapter: 'claude-code' | 'paste' | 'git'
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
  /** conversation the steps below belong to; step ordinals are per-conversation */
  conversationId?: string
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
  /** conversation the steps below belong to; step ordinals are per-conversation */
  conversationId?: string
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
    /** null = undeclared: no owner declaration was given; never inferred */
    accepted: boolean | null
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


// ---------------------------------------------------------------------------
// What kind of finished thing this record is about. Ursa does not only read
// chats: the artifact the record joins backward from can be a chat trace, a
// git repository, a deployed/published page, or something the user judged by
// eye. The capture path names which, because the correction channel differs
// per kind (prose edits vs. commits vs. "still too dark" on a render).
// ---------------------------------------------------------------------------

export type ArtifactKind =
  /** the finished work is the conversation itself (transcript, pasted thread) */
  | 'chat'
  /** the finished work is source under version control; commits are the edits */
  | 'repo'
  /** the finished work is reachable at a URL — a deployed site, a published page */
  | 'hosted'
  /** the finished work was accepted or corrected by eye — a render, a design */
  | 'visual'

export interface Artifact {
  kind: ArtifactKind
  /**
   * Where the accepted state can be seen as the user saw it: a deploy URL for
   * `hosted`, a screenshot path for `visual`. Absent when no render exists.
   */
  renderRef?: string
}

export interface OutcomeRecord {
  schemaVersion: '0.1.0'
  task: {
    id: string
    finished: boolean
    generatedAt: string
  }
  /** what kind of finished thing this is, and where its rendered state lives */
  artifact: Artifact
  files: FinalFile[]
  conversations: ConversationMeta[]
  generations: GenerationRecord[]
  stats: Stats
  signals?: LabSignals
  /** the time dimension; present only for git-backed records, where later revisions exist */
  durability?: Durability
}
