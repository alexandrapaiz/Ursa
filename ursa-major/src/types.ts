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

/**
 * What destroyed a generation span, when its fate is `generated_deleted`.
 *
 * `human_edit` — absent from the human's final blob and no mechanical
 * cause was found. This is the label Ursa Minor sells: the person had
 * the text in front of them and did not keep it.
 *
 * `merge` — the text was present in a parent of an intervening merge
 * commit and absent from the merge's own result. A merge brings in
 * another branch's work; nobody read this text and rejected it, so it
 * carries no correction signal and must not be counted as one.
 *
 * `unknown` — an intervening merge sat between the generation and its
 * closure, and the evidence that would settle whether that merge
 * destroyed the text could not be read: the merge's own tree, one of its
 * parents' trees, or the merge commit itself is missing from this clone.
 * `human_edit` and `merge` are both claims, and neither is supportable
 * here. This value exists so an unreadable repository produces an
 * unreadable label rather than an accusation: `humanDeletedChars` is the
 * number Ursa Minor sells as a discard rate, and a missing git object is
 * not a person's decision.
 */
export type DeletionCause = 'human_edit' | 'merge' | 'unknown'

/**
 * Why a deletion could not be attributed. Set only when cause is
 * 'unknown', and specific because each value has a different fix.
 *
 * `unreadable_merge_result` — the merge touched the path and a parent
 * held the text, but the merge's own tree could not be read, so the
 * second half of the `merge` test never ran.
 *
 * `unreadable_merge_parents` — the merge's result is readable and lacks
 * the text, but no parent could be read, so whether the text was ever
 * there to destroy is unknown.
 *
 * `unreadable_merge_commit` — a merge was known to sit on this pair by
 * sha alone and its parentage is absent from the clone, so its paths
 * were never compared. Fixed by fetching the base ref.
 */
export type UnknownDeletionReason =
  | 'unreadable_merge_result'
  | 'unreadable_merge_parents'
  | 'unreadable_merge_commit'

export interface DeletionAttribution {
  cause: DeletionCause
  /**
   * short sha of the merge this attribution is about: the one that
   * destroyed the text when cause is 'merge', or the one that could not
   * be read when cause is 'unknown'
   */
  mergeSha?: string
  /** that merge's subject line, so the record is readable without the repo */
  mergeSubject?: string
  /** set only when cause is 'unknown'; names which evidence was missing */
  unknownReason?: UnknownDeletionReason
}

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

/**
 * Why the descent claim behind a `survived_mutated` label does or does not
 * stand. Set only when the caller supplied a corroborator (`ursa run`
 * does; the chat path has no git to ask), so its absence means the check
 * never ran rather than that it passed.
 *
 * The label it guards is the one CLAUDE.md §1 sells as "the mutation IS
 * the correction, expressed as an edit rather than a complaint". The
 * resolver reaches it from a similarity score alone, and similarity is
 * not descent: on 2026-10-02 two agent branches each wrote a
 * `formatItem` function, the human kept branch B's version, and branch
 * A's generation came back `survived_mutated` carrying a word-level diff
 * from A's line to B's line presented as the human's correction. Nobody
 * performed that diff. The evidence that settles it is outside the
 * record, because branch B's generation is not in the record at all.
 */
export type DescentEvidence =
  /**
   * Searched and nothing outside the generation's line of descent holds
   * this span's text, so an edit of this generation is the only account
   * of it left. `rivalsSearched` is how many commits were read; zero
   * means the path has no history besides the generation itself.
   */
  | { basis: 'corroborated'; rivalsSearched: number }
  /**
   * Found verbatim in a commit that is not a descendant of the
   * generation, so the person did not derive it by editing this
   * generation. The label fell back to `no_generation_provenance` and no
   * diff was emitted.
   *
   *   pre_existing — the commit is an ancestor of the generation: the
   *     text was already in the file before the agent wrote. `ursa run`
   *     feeds whole-file blobs as generations, so a generation "contains"
   *     everything the file already held.
   *   sibling — the commit is on a branch the generation is not an
   *     ancestor of: another branch's work, which the person merged or
   *     checked out rather than typed.
   */
  | { basis: 'rival'; sha: string; subject: string; relation: 'pre_existing' | 'sibling' }
  /**
   * The search did not settle the question, so the `survived_mutated`
   * label stands unchanged and says why it is unguarded.
   *
   *   span_too_short — the span normalizes to fewer than MIN_VERBATIM_LEN
   *     characters, the same floor the verbatim pass uses, below which
   *     containment in another blob is coincidence rather than evidence.
   *   unreadable_blob — a rival commit is in the graph but its blob could
   *     not be read from this clone (shallow clone, partial clone, blob on
   *     a remote). `sha` names the first such commit.
   *   path_history_unreadable — `git log` over the path failed, so the
   *     rival set could not be enumerated at all.
   *   rival_search_capped — the path has more rival commits than
   *     MAX_RIVAL_BLOBS and the unsearched remainder may hold the text.
   */
  | {
      basis: 'unverified'
      reason: 'span_too_short' | 'unreadable_blob' | 'path_history_unreadable' | 'rival_search_capped'
      sha?: string
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
  /**
   * Whether the span's text exists outside this generation's line of
   * descent; set by the resolver's `corroborate` hook on any span the
   * fuzzy pass scored above THETA_HIGH, and on the
   * `no_generation_provenance` span a `rival` verdict demotes one to.
   * Absent on records resolved without a corroborator.
   */
  descent?: DescentEvidence
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
  /** set only when fate is 'generated_deleted': what destroyed it, and why that is not a correction */
  deletion?: DeletionAttribution
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
  /**
   * Characters inside segments. `segment()` splits a generation into
   * sentences or statements and the characters BETWEEN those segments —
   * blank lines, indentation, the newline after a heading — belong to no
   * segment, so they are absent from this sum. It is the denominator of
   * `survivalRate` and of every deletion rate, because a fate is only
   * ever assigned to a segment.
   *
   * It is NOT the number of characters the generation wrote. That is
   * `charsWritten`, and the difference is `separatorChars`. Keeping the
   * two apart is load-bearing: a verbatim claim is matched against the
   * normalization of the WHOLE generation text, so a claim can cover
   * separator characters that `totalChars` never counted, and comparing
   * a claim total against this field produces arithmetic that cannot be
   * true. See src/invariants.ts and docs/design/generated-denominator.md.
   */
  totalChars: number
  /** `text.length` — every character the generation wrote, separators included */
  charsWritten: number
  /** `charsWritten - totalChars` — characters between segments, carrying no fate */
  separatorChars: number
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
    /** sum of every generation's `totalChars` — segment characters only */
    totalChars: number
    /**
     * sum of every generation's `charsWritten` — the characters actually
     * written, separators included. The only generation-side figure a
     * final-side character count may be compared against, since a span's
     * source extent can cover separators. Always >= totalChars.
     */
    charsWritten: number
    /** sum of every generation's `separatorChars` */
    separatorChars: number
    /**
     * Generation characters covered by at least one `survived_verbatim`
     * claim, counted once each. `byClass.survived_verbatim.chars` counts
     * final-file characters instead, so it double-counts a generation
     * whose text was reused in two places and can exceed any
     * generation-side total. This field is the deduplicated figure, and
     * it is what the run summary prints next to `charsWritten`.
     */
    verbatimClaimedChars: number
    survivedChars: number
    /**
     * every deleted char, whatever destroyed it:
     * humanDeletedChars + mergeDeletedChars + unknownDeletedChars
     */
    deletedChars: number
    /** deletedChars / totalChars — the gross figure, not a claim about the human */
    deletedPct: number
    /** chars the human had in front of them and did not keep — the correction signal */
    humanDeletedChars: number
    /** humanDeletedChars / totalChars — the only deletion rate safe to call a discard rate */
    humanDeletedPct: number
    /** chars an intervening merge destroyed mechanically; carries no correction signal */
    mergeDeletedChars: number
    /**
     * chars that are gone and whose cause could not be read — see
     * DeletionCause 'unknown'. Excluded from humanDeletedChars rather
     * than folded into it, because a repository this run could not read
     * is not evidence about the person. Re-running after fetching the
     * missing objects moves these chars into one of the other two.
     */
    unknownDeletedChars: number
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

/**
 * Where one excerpt inside a signal came from, as data rather than as prose.
 *
 * Every signal Ursa Minor sells quotes somebody: `CorrectionLoop.
 * discoveredSpec` quotes the user's last statement of what she wanted,
 * `RegressionEvent.evidence` quotes her report that something broke, and
 * `OneShotCorrection.text` quotes either her prompt or the agent text she
 * edited. Those quotes used to exist only inside the sentence a reader sees,
 * which means a buyer auditing the signal had to find the raw text by hand
 * and nothing could check the quote mechanically. A `QuoteRef` names the raw
 * text the excerpt was taken from, precisely enough that `checkRecord`
 * re-reads it and asserts the excerpt is really in there
 * (`SIGNAL_QUOTE_GROUNDED`, src/invariants.ts).
 */
export interface QuoteRef {
  /**
   * which raw text in this record the excerpt was taken from:
   *   `user_prompt` — the `conversations[].prompts[]` entry with this
   *                   `conversationId` and this `step`
   *   `generation`  — the `generations[]` entry at this `generationIndex`,
   *                   whose `turnIndex` is this `step`
   *   `final_span`  — the finished file at this `filePath`, i.e. `files[].text`
   */
  of: 'user_prompt' | 'generation' | 'final_span'
  /** required for `user_prompt` and `generation`; absent for `final_span` */
  conversationId?: string
  /** `prompts[].step` or `generations[].turnIndex`; absent for `final_span` */
  step?: number
  /** exact address of the generation quoted; set only when `of` is `generation` */
  generationIndex?: number
  /** `files[].path`; set only when `of` is `final_span` */
  filePath?: string
  /**
   * the excerpt exactly as it appears in the signal's own prose field, as
   * produced by `excerpt()` in src/text.ts: whitespace collapsed to single
   * spaces, trimmed, and truncated with a trailing ellipsis past
   * `MAX_EXCERPT` characters.
   */
  text: string
}

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
  /** every excerpt `discoveredSpec` carries, with the raw text it came from */
  quotes: QuoteRef[]
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
  /** `evidence` again, with the prompt it was quoted from */
  quotes: QuoteRef[]
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
  /**
   * every excerpt inside `text`, with the raw text each came from. One entry
   * at the trace stage (the user's prompt); two at the label stage, where
   * `text` is `AGENT: <generation extent>` over `FINAL: <finished span>`.
   */
  quotes: QuoteRef[]
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
