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
   * The segment is inside the generation's text, but the file already held
   * that text at the generation's parent commit, so it is not output the
   * model produced and it has no survival or deletion fate at all.
   * (Added 2026-10-14 with the pass-1 descent gate.)
   *
   * It exists because of what a generation IS on the `ursa run` path.
   * `resolveEpisode` builds one from the whole blob of each touched file at
   * the agent's commit, so most of a "generation" is usually the file the
   * agent opened. Once the final span over that text is demoted to
   * `no_generation_provenance`, the segment behind it is covered by no
   * survival claim, and without this fate it fell to `generated_deleted` —
   * asserting that the model produced text and the person threw it away,
   * about text that is still sitting in the finished file. That is a false
   * label in the one class CLAUDE.md §1 sells as correction signal, so the
   * fate is named instead of inferred.
   *
   * It carries no `deletion` attribution, is excluded from `survivedChars`,
   * and is subtracted from `deletedChars` before the human share is
   * computed. It stays inside `totalChars`, because `totalChars` is defined
   * as the sum of segment extents and a reader must be able to add the
   * fates up to it.
   */
  | 'not_generated'

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
   *   prior_revision — the commit is the generation's own parent, so
   *     the file already held this text when the agent opened it. On the
   *     `ursa run` path a generation is the whole blob of the touched
   *     file at the agent's commit, which contains every line the file
   *     already had, so a span can be byte-identical to a generation and
   *     still be text no model contributed. This is the strongest of the
   *     three relations and the only one that demotes a
   *     `survived_verbatim` claim, because it is the only one that says
   *     the text was there before the generation existed rather than
   *     merely that it exists somewhere else too. Checked before the
   *     general rival walk (src/corroborate.ts) so the answer does not
   *     depend on `git log --all` ordering.
   *   pre_existing — the commit is an older ancestor of the generation,
   *     and the parent does NOT hold the text. In practice this is a
   *     restore: an ancestor held the text, the generation replaced it,
   *     and the person put it back. Before `prior_revision` existed this
   *     relation carried both cases, and over this repository's own
   *     history the split is 504 `prior_revision` to 1 restore
   *     (`tools/measure-verbatim-descent.ts`), so the two readings were
   *     never comparable in size and the label named the rarer one.
   *   merged_in — the commit is not an ancestor of the generation, and IS
   *     an ancestor of the episode's own final commit. Another branch's
   *     work that this episode merged, so the person demonstrably had it
   *     in front of them: the graph proves it existed while they were
   *     working, with no appeal to any clock. Split out of `sibling` on
   *     2026-10-15, because the two make the same claim with very
   *     different standing — see `date` below, and
   *     `RIVAL_NOT_AFTER_FINAL` in src/invariants.ts, which can police
   *     `sibling` precisely because `merged_in` is no longer hiding
   *     inside it. Only reachable when the corroborator was given a
   *     horizon (`gitDescentCorroborator`'s fourth argument), which the
   *     `ursa run` and `ursa ci` paths always pass and the chat path has
   *     nothing to pass.
   *   sibling — the commit is reachable from neither the generation nor
   *     the episode's final commit: another branch's work, which the
   *     person may have merged or checked out rather than typed. "May"
   *     is the whole difference from `merged_in`. Nothing in the graph
   *     places this commit inside the work, so the claim rests entirely
   *     on its author date being early enough to have been available,
   *     which is why this is the one relation whose date is load-bearing
   *     and the one `RIVAL_NOT_AFTER_FINAL` checks.
   *
   * Neither verdict says nothing happened. The person did reject the
   * generation's wording, and that rejection survives as the span's
   * `candidate` and as the generation segment's `generated_deleted`
   * fate. What the demotion refuses is the stronger claim `diff` makes:
   * that the final text was composed by editing this generation. Text
   * that already existed verbatim elsewhere was not composed here.
   */
  | {
      basis: 'rival'
      sha: string
      subject: string
      relation: 'prior_revision' | 'pre_existing' | 'merged_in' | 'sibling'
      /**
       * The rival commit's own author date, strict ISO 8601 with the
       * author's UTC offset (`PathCommit.date`, git's `%aI`).
       *
       * Why a date is in the evidence (added 2026-10-15). Every relation
       * above is a claim about time as much as about the graph: the text
       * was in the file BEFORE the generation ran (`prior_revision`,
       * `pre_existing`), or it was on a branch the person could have
       * merged WHILE they were working (`sibling`). Until 2026-10-14 the
       * resolver checked neither, and a shipped record named a commit
       * authored seven days after its own work finished as the source of
       * that work's text (docs/ideas.md, 2026-10-14). The resolver now
       * drops such a candidate before it is written
       * (`authoredAfterHorizon` in src/corroborate.ts), but the record
       * itself could not state the ordering, so no bound in
       * src/invariants.ts could see the defect and the only thing that
       * found it was a tool holding the commit graph.
       *
       * With the date here, `RIVAL_NOT_AFTER_FINAL` checks the ordering
       * against `task.generatedAt` using nothing but the record, which is
       * the property every other bound has and the auditability story
       * CLAUDE.md §4 sells to labs: a buyer can see that the evidence
       * predates the work without cloning the repository.
       *
       * The date is load-bearing for exactly one relation, `sibling`.
       * The other three are placed inside the work by the commit graph —
       * `prior_revision` and `pre_existing` are ancestors of the
       * generation, `merged_in` is an ancestor of the episode's final
       * commit — so their dates are reported and never checked, and a
       * rebase or a wrong machine clock that puts a late author date on
       * one of them says nothing about the claim. That split is why
       * `merged_in` exists: while it was folded into `sibling`, no bound
       * could police a sibling's date without also firing on records
       * whose evidence the graph had already proven, which
       * src/invariants.ts's second rule forbids ("anything that can be
       * legitimately false is a measurement, not an invariant").
       *
       * OPTIONAL, and absence is legal and unchecked. Every record
       * written before 2026-10-15 carries rivals with no date, and a
       * bound that required the field would make all of them illegal —
       * the mistake `RESOLVER_IDENTIFIED` avoided by leaving an absent
       * `task.resolvedBy` alone. A date is also genuinely unavailable in
       * one live case: `relation: 'prior_revision'` names the
       * generation's own parent, read off the in-memory commit graph
       * rather than from `commitsTouchingPath`, so a caller holding a
       * narrowed `CommitInfo[]` can have the parent sha and not its date.
       * Absent means "this resolver could not state the date", never
       * "the date is fine".
       */
      date?: string
    }
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
  /**
   * Similarity score that earned the label: 1 for verbatim, and also 1 for a
   * `normalizedOnly` mutation, whose two texts are identical on the
   * normalized side by construction.
   */
  score?: number
  source?: SourcePointer
  /** word-level diff generation → final; the mutation is the correction */
  diff?: DiffPart[]
  /**
   * Set on a `survived_mutated` span whose text is identical to the
   * generation extent it names after case folding, punctuation folding and
   * whitespace collapsing, and differs in raw characters only. The person
   * reflowed a line, changed a capital, or retyped an em dash as a hyphen.
   *
   * Three readings of this span are defensible and the record refuses to
   * choose between them, which is why the fact is a field and not a class.
   * A buyer studying content corrections filters these out as formatting
   * noise. A buyer studying house style — the thing Ursa Major sells users
   * as "your tone, your format preferences" — wants exactly these and
   * nothing else. A buyer counting how much of the model's output survived
   * wants them inside `survived_verbatim`, which they are not, because that
   * label means byte-identical as of 2026-10-13.
   *
   * Until that date these spans WERE labelled `survived_verbatim` with
   * `score: 1`, because pass 1 made its claim on a hit in the normalized
   * shadow text. Measured over ten records of this repository's own history,
   * 26 of 770 verbatim claims, covering 1,466 characters, were claims of
   * this kind: see docs/design/verbatim-byte-identity.md and
   * `tools/measure-verbatim-fidelity.ts`, which reproduces the number.
   */
  normalizedOnly?: true
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

// ---------------------------------------------------------------------------
// Two denominators, because the record answers two different questions and
// only ever stated one of them.
//
// `pct` divides by `coveredChars`, the characters some span covered. The
// three class percentages therefore sum to 1.0 by construction, which is
// what makes them read as a partition of the finished work when they are a
// partition of the classified part of it. On the real-history fixture
// (fixtures/real/ursa-main-4d5e401.json) 79 of 3,018 final characters are
// inside no span, so `survived_verbatim.pct` is 0.927 where the same
// characters are 0.903 of the file. The gap is exactly `measure()`'s
// `finalSeparatorChars`, the denominator can never exceed the file, and so
// the error has one direction: it flatters the model.
//
// Both numbers are correct answers. `pct` answers "of the text we
// classified, what fate did it have", which is the right question when
// reading the distribution bar in the viewer. `pctOfFinal` answers "of this
// finished file, how much is the model's", which is the question a lab's
// pipeline is asking when it reads the first percentage it finds. Before
// this field existed, the record offered one number and no statement of
// which question it answered.
//
// `pct` is unchanged rather than repaired, deliberately: it is the field the
// viewer's bar is built on and any consumer already reading records is
// calibrated against it. The repair is a second field and a bound between
// them (`PCT_DENOMINATORS_ORDERED` in src/invariants.ts), not a redefinition
// nobody downstream would notice.
// ---------------------------------------------------------------------------

export interface ClassStat {
  spans: number
  chars: number
  /**
   * `chars / stats.coveredChars` — this class's share of the characters that
   * any span covered. Sums to 1.0 across the three classes.
   */
  pct: number
  /**
   * `chars / stats.finalChars` — this class's share of the whole finished
   * work, counting characters no span covered. Sums to at most 1.0, and to
   * less than 1.0 whenever the record has unclassified text. Never larger
   * than `pct`.
   */
  pctOfFinal: number
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
     * Characters of generation segments whose fate is `not_generated`: the
     * file already held the text at the generation's parent, so the model
     * did not produce them. Neither survived nor deleted, and subtracted
     * from `totalChars` before `deletedChars` is computed. Zero on the chat
     * path, which injects no corroborator and therefore never demotes.
     *
     * OPTIONAL, and read as zero when absent. Every record this project
     * wrote before 2026-10-14 omits the field, and for those records zero
     * is the true value rather than a default: no descent gate ran on their
     * verbatim claims, so no segment of them could carry the fate. Making
     * it required instead would fail `DELETION_SPLIT_EXACT` on every
     * historical record on disk, which is the same mistake
     * `RESOLVER_IDENTIFIED` avoided by making an absent `task.resolvedBy`
     * legal. Written on every new record; `src/stats.ts` always sets it.
     */
    notGeneratedChars?: number
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
  /**
   * One row per path the run read, which is every path in `files` plus every
   * path in `exclusions`. A consuming pipeline iterates this array, so a row
   * missing for an excluded path is a path that silently does not exist from
   * the row-level view: before excluded rows were emitted here, an excluded
   * record's `perFile` was `[]` while its episode had touched a file, and
   * nothing in the iteration said anything was left out. coverage.py reports
   * excluded statements as a column on the file's own row for the same
   * reason — a coverage number and what was taken out of its denominator
   * cannot drift apart when they are one row.
   *
   * The evidence for an exclusion (the rival commit's sha, its subject, the
   * relation) stays in `OutcomeRecord.exclusions` and is not duplicated
   * here, because that is not row data. What a row carries is the reason, so
   * that iterating `perFile` is enough to know a path produced no spans and
   * why.
   */
  perFile: Array<{
    path: string
    coveredChars: number
    byClass: Record<SpanClass, number>
    /**
     * Present only on a row for an excluded path, carrying the `reason` of
     * the matching `Exclusion`. Such a row has `coveredChars: 0` and zero in
     * every class, since the resolver never saw the path. Absent on a
     * classified path's row, so `'excluded' in row` is the test for which
     * kind of row this is.
     */
    excluded?: ExclusionReason
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

// ---------------------------------------------------------------------------
// What the run refused to classify, and on what evidence.
//
// `resolveEpisode` in src/bin/ursa.ts drops a path before the resolver sees
// it when src/vendored.ts proves the finished blob came in whole from
// outside the generation's line of descent. That refusal is correct and it
// was, until this field existed, invisible: it was written to
// `.ursa/episodes.json` and printed in the run summary, and the record a lab
// reads carried no trace of it. So the one thing a buyer should be able to
// audit — what the run declined to claim, and why — reached only a terminal
// nobody kept.
//
// The field is the record's own statement of that. It is the final-side twin
// of `Durability`: parallel in shape, present only on records whose capture
// path can answer the question, and absent rather than empty when nothing
// was asked.
// ---------------------------------------------------------------------------

/** Why a path the run touched is in no span, no class and no percentage. */
export type ExclusionReason =
  /**
   * The finished blob at the episode's final commit is byte-identical to a
   * blob held by a commit that is neither the generation nor a descendant of
   * it, so no character of the file was composed in this episode. Proven by
   * `vendoredPaths` in src/vendored.ts by comparing git blob object ids; see
   * that file's header for what an equal oid does and does not prove.
   */
  | 'imported_whole'
  /**
   * The commit that put this content at this path declared in its own
   * `Ursa-Imported-Path:` trailer that the content came from outside this
   * repository, so nobody in this episode composed it. Read by
   * `vendoredPaths` in src/vendored.ts from the episode's generation and
   * final commits only.
   *
   * Deliberately a different reason from `imported_whole` rather than the
   * same reason with a third relation. `imported_whole` is proven: two blob
   * object ids are equal, which is byte identity and nothing weaker. This
   * one rests on a statement by whoever made the commit, which is the
   * strongest evidence available for content whose source is in another
   * repository and is still not a proof. A buyer who cannot tell the two
   * apart in the record cannot price the difference, and collapsing them
   * would be the same defect as reading a similarity score as descent.
   */
  | 'declared_import'

export interface Exclusion {
  /** repo-relative path, spelled as `Episode.touchedFiles` spells it */
  path: string
  reason: ExclusionReason
  /**
   * Short sha of the commit the exclusion rests on: the one outside the
   * generation's descent holding the identical blob when `reason` is
   * `imported_whole`, and the declaring commit itself when it is
   * `declared_import`.
   */
  sha: string
  /** that commit's subject line, so the record names the import in the author's own words */
  subject: string
  /**
   * How that commit stands to the generation. `pre_existing` means the
   * matching commit is an ancestor, so the episode's net effect on the file
   * was nothing. `sibling` means neither ancestor nor descendant, so the
   * content came off another branch the person merged or checked out rather
   * than typed. `declared` means no blob search found anything and none
   * could: `sha` is the episode's own generation or final commit, and it
   * declared the path an import in its trailer. The first two always carry
   * `reason: 'imported_whole'` and the third always carries
   * `reason: 'declared_import'`.
   */
  relation: 'pre_existing' | 'sibling' | 'declared'
  /**
   * Characters of the finished file at the episode's final commit, which is
   * exactly what left this record's figures by being excluded. Stated here so
   * the exclusion can be reconciled against the numbers it moved:
   * `stats.finalChars + sum(exclusions[].chars)` is the size of every path
   * the run was willing to read, and `measure()` in src/invariants.ts reports
   * both sides. A field whose number cannot be reconciled against the figures
   * it moved is a field that drifts.
   */
  chars: number
  /**
   * Author date of `sha`, strict ISO 8601 with the author's own UTC offset
   * (`%aI`), as `DescentEvidence`'s `rival` variant carries it one level
   * down.
   *
   * Why the file level needs it for the same reason the span level did.
   * A `sibling` exclusion is the only relation here whose claim rests on a
   * clock: it says the finished file is byte-identical to a copy on a
   * branch that is neither an ancestor nor a descendant of the generation,
   * which is evidence that the content came from that branch — and if that
   * branch's commit was authored after the work closed, the copy is a copy
   * OF this work rather than a source for it. The refusal is then
   * backwards, and it is an expensive refusal to get backwards: an
   * exclusion removes a whole file from every figure in the record, and on
   * this repository's own history one of them removed 60,616 characters,
   * 84.7% of a run's headline survival figure.
   *
   * `pre_existing` and `declared` are exempt from the ordering for the
   * reasons `RIVAL_NOT_AFTER_FINAL` exempts `prior_revision`,
   * `pre_existing` and `merged_in`: a `pre_existing` match is an ancestor
   * of the generation, so the commit graph vouches for it whatever a
   * rebase did to its author date, and a `declared` import names a commit
   * in ANOTHER repository's history whose clock is not comparable to this
   * one's at all.
   *
   * ABSENT is legal and unchecked. Every record this project wrote before
   * 2026-10-15 has exclusions with no date, and `vendoredPaths` omits the
   * field rather than writing an empty string when a clone cannot answer.
   * Read `EXCLUSION_NOT_CLASSIFIED` in src/invariants.ts for the bound.
   */
  date?: string
}

/**
 * Which code made a record's claims.
 *
 * Two bases, because the two launches ship this resolver as two different
 * artifacts and the identity available for each is a different kind of
 * fact. `git_commit` is a pointer into this repository's public history,
 * which is what `ursa run` has: it executes `src/bin/ursa.ts` from a git
 * work tree. `bundle_digest` is a content hash with no history behind it,
 * which is what `ursa ci` has on any repository other than this one:
 * GitHub downloads `dist/ursa.cjs` as a tarball rather than cloning it,
 * so there is no HEAD under the bundle to read.
 *
 * The basis is a value in the record rather than a sentence in a document
 * for the same reason `ExclusionReason` is: a consumer that will only
 * accept records it can audit against a public commit selects on the
 * word, with no prose to interpret. See src/resolver-identity.ts for how
 * each one is read.
 */
export type ResolverIdentity =
  | {
      basis: 'git_commit'
      /** `git rev-parse --short HEAD` in the resolver's own source tree */
      commit: string
      /**
       * Whether that tree had uncommitted or untracked changes when the
       * record was written, by `git status --porcelain`. True means
       * `commit` does not identify the code that ran, and the record says
       * so rather than letting the sha imply otherwise.
       */
      dirty: boolean
    }
  | {
      basis: 'bundle_digest'
      /**
       * First 16 hex characters of the SHA-256 of the running bundle,
       * which is the same identity `npm run bundle:check` compares a
       * committed `dist/ursa.cjs` against.
       */
      digest: string
    }

/**
 * Which rules a record's claims were checked against.
 *
 * WHAT THIS IS NOT, FIRST, BECAUSE THE NAME INVITES THE WRONG READING.
 * It is not a verdict and it is not a pass. Both launches write every
 * record BEFORE running the gate over it, deliberately — see
 * `gateRecords` in src/launch.ts, whose comment says why: a record whose
 * arithmetic is impossible is still the evidence of the defect, so
 * nothing is withheld from the user. A record therefore carries this
 * field whether it passed or failed, and the twenty-three records in
 * `ursa-major/fixtures/violations/` are the demonstration: every one of
 * them names the bound set below and every one of them is refused by it.
 * `gatedBy` answers "which rules applied", never "and they held".
 *
 * WHY IT IS IN THE RECORD. `task.resolvedBy` names the code that made
 * the claims, which is the complete answer for anyone who can clone that
 * commit, and a weak one for anyone who cannot: the bound set went from
 * ten to eighteen in eleven days, so two records bought two months apart
 * were checked under different rules, and before this field the only way
 * to learn which rules was to clone the resolver at `task.resolvedBy` and
 * read a TypeScript module. `CLAUDE.md` §4 sells auditability to labs and
 * the §2 user surface rests on the same property; a buyer holding a
 * passing record could re-derive all of its arithmetic and could not tell
 * which checks had run on it.
 *
 * WHY BOTH A CODE LIST AND A DIGEST, when either alone looks sufficient.
 * They answer two different questions and neither answers the other's.
 * The digest answers "same rules?" between two records in one comparison
 * and says nothing about which rule moved. The codes answer "which rule
 * moved?" and cannot see a bound whose STATEMENT was rewritten while its
 * name stayed, which is a change that silently alters what a record was
 * checked for. Together they also make one specific tamper visible, which
 * is the one the ledger entry behind this field asked for: a record whose
 * digest matches the checking resolver's but whose code list is short has
 * had a bound dropped from it, and `GATE_IDENTIFIED` in src/invariants.ts
 * fails such a record rather than reporting consistency.
 */
export interface GateIdentity {
  /**
   * `InvariantCode` for every bound the resolver that wrote this record
   * carried, in that resolver's own declaration order — `BOUND_CODES` in
   * src/invariants.ts.
   *
   * Typed as `string[]` and not `InvariantCode[]`, which is the one place
   * this file deliberately widens a type. A record written by a later
   * resolver names bounds this build has never heard of, and that record
   * is not malformed, it is newer: the eighteen codes below are this
   * build's bound set, not the vocabulary of every record that will ever
   * exist. Narrowing the field would make the correct handling of a
   * nineteenth bound a type error at the only place that reads a record
   * from disk.
   */
  codes: string[]
  /**
   * First 16 hex characters of the SHA-256 over every bound's code and
   * statement text, which is the same prefix length `ResolverIdentity`'s
   * `bundle_digest` uses and the same hash `npm run bundle:check` uses.
   *
   * Not verifiable from the record alone, and it is not meant to be: the
   * bound statements are prose that would multiply a record's size, and
   * the question this field exists for is comparative. Two records with
   * the same digest were checked under the same rules; two with different
   * digests were not, and the code lists say where to look. Computed by
   * `currentGateIdentity()` in src/invariants.ts, over a canonical
   * serialization documented there.
   */
  boundsDigest: string
}

/**
 * The three limits the pair walk ran under, as the walk itself resolved
 * them, defaults included (`resolvePairingBounds` in src/pairfinder.ts).
 *
 * WHY A RECORD CARRIES THIS. Every span class in a git-path record rests
 * on one claim: that the commit which edited a file after a model wrote
 * it was correcting that model rather than visiting the same file later
 * for an unrelated reason. These three numbers are where that claim
 * stops. Move the distance from 25 commits to 400 on the same history
 * and the set of records changes completely: measured on this
 * repository on 2026-10-18, 25 yields nothing at all and 400 yields two
 * records, because twelve agent seats commit between one touch of a
 * file by the owner and the next.
 *
 * So two records resolved from the same history under different bounds
 * are not two readings of one fact, and before this field a reader
 * holding both could not tell them apart. A published set states the
 * distinct bound sets in it (`PublishedIndex.pairing` in src/publish.ts)
 * for the same reason, which is the reason the sentence naming them is
 * on the published index page rather than only in a design document.
 *
 * Numbers rather than an optional-with-default shape, deliberately: a
 * record states what the walk used, never what a caller omitted. The
 * defaults live in exactly one place (src/pairfinder.ts) and a record
 * says the value, so reading one never requires knowing which build's
 * defaults were in force.
 *
 * `Infinity` is reachable and JSON-serializes to `null`, which is the
 * one lossy case here and an honest one: `--max-pair-distance Infinity`
 * is the unbounded walk, and a reader of that record's JSON sees a null
 * where a bound would be rather than a number that was never applied.
 */
export interface PairingBounds {
  /** commits walked forward from a generation before the pair claim is abandoned */
  maxPairDistance: number
  /** hours between the generation and the edit before the same claim is abandoned */
  maxPairAgeHours: number
  /** how many later generations may rewrite the same file in between and the pair still stand */
  maxInterposedGenerations: number
}

export interface OutcomeRecord {
  schemaVersion: '0.1.0'
  task: {
    id: string
    finished: boolean
    generatedAt: string
    /**
     * The resolver that produced every classification below, stamped when
     * the record is first written to disk (`saveRecord` in src/store.ts).
     *
     * Absent means no resolver could be identified, which is a different
     * claim from a record that names one: a record built in memory and
     * never saved has no identity to state, and neither does one written
     * by a build with no git tree and no readable artifact. Absent is
     * never a placeholder for "some resolver" — see `exclusions` below for
     * the same absent-versus-empty distinction.
     *
     * Preserved, never rewritten, once set. `applyVerdict` in
     * src/bridge/declare.ts loads a record and saves it again to write a
     * verdict into `signals`, and the span classifications in that record
     * are still the original resolver's work. Re-stamping on every save
     * would credit a later build with claims it did not make.
     */
    resolvedBy?: ResolverIdentity
    /**
     * The bound set the resolver above carried, stamped beside
     * `resolvedBy` by `saveRecord` in src/store.ts.
     *
     * Absent and present mean exactly what they mean for `resolvedBy`:
     * absent says nothing stamped this record, which every record written
     * before 2026-10-16 says truthfully, and is never a placeholder for
     * "some bound set". Preserved and never rewritten once set, for the
     * same reason — `applyVerdict` in src/bridge/declare.ts re-saves a
     * record months later to write a user's verdict into `signals`, and
     * the classifications in it were checked under the rules of the build
     * that made them, not of the build that added a field.
     *
     * Present does NOT mean the record passed. See `GateIdentity`.
     */
    gatedBy?: GateIdentity
    /**
     * The pairing bounds the walk that found this record's generations
     * ran under, stamped by whichever launch resolved it
     * (`stampPairingBounds` in src/launch.ts, called by both
     * `src/bin/ursa.ts` and `src/ci/run.ts`).
     *
     * Absent is a real claim and not a gap in three cases, and they are
     * different from each other: a record from the chat or paste path,
     * where no commit pair was walked and no bound could apply; a record
     * written before 2026-10-18, when nothing stamped this; and a record
     * built in memory and never saved. Absent is never a placeholder for
     * "the defaults", because the defaults are themselves a bound set and
     * a record that ran under them says so with numbers.
     *
     * Preserved, never rewritten, once set — the rule `resolvedBy` and
     * `gatedBy` above state and for the same reason: `applyVerdict` in
     * src/bridge/declare.ts re-saves a record later to write a user's
     * verdict into `signals`, and the pairs in it were found under the
     * bounds of the walk that found them.
     */
    pairedBy?: PairingBounds
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
  /**
   * Paths the run touched and refused to classify, one entry each. Absent on
   * a record whose capture path cannot ask the question (every chat-path
   * record is one), and an empty array when it asked and found nothing — the
   * two are different claims and only the second one is evidence.
   */
  exclusions?: Exclusion[]
}
