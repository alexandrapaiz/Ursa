// What a set of records says when you read it as one corpus instead of one
// record at a time.
//
// WHY THIS EXISTS. `docs/okrs/2026-q4.md` KR1.3 asks for "five or more
// completed outcome records on distinct real finished works", with "at least
// two [using] the prose path (.md/.txt/.tex)" and "at least one [joining]
// generations from more than one source". Every launch in this package
// answers for one work unit at a time: `renderPullRequestSummary` prints one
// pull request's figures, `src/ci/comment.ts` prints one merge's. Nothing
// reads a pile of records and answers the three questions above, so the only
// way to know where that key result stands has been to open records by hand,
// and the README's trials table has been maintained by hand to match.
//
// The second reason, which is the one that made this a measurement rather
// than a report. The pull-request launch is the only path that finds anything
// on a repository whose every commit is an agent's (`src/adapters/pr-launch.ts`,
// opening comment), and this repository is one of those: the n=3 dogfood run
// over the git-pair path produced zero records. README.md says of that run
// that "the owner's corrections are in the pull requests she merged, which is
// the pull-request path's job". That sentence is a claim about a population of
// 358 merged pull requests, and it had been checked against one. A corpus is
// the unit at which it can be checked at all.
//
// WHAT THIS FILE IS AND IS NOT. It is pure: records in, numbers out, no git,
// no `gh`, no filesystem. `src/corpus-command.ts` is the I/O around it. It
// states measured quantities and never a verdict on a key result: the
// thresholds in KR1.3 are the owner's to read against these numbers, so
// `corpusShape` reports the three counts and the clause each one answers,
// and nothing here returns a boolean named after an objective.

import type { OutcomeRecord, SpanClass } from './types'

/**
 * The extensions KR1.3 names as "the prose path", quoted from the key result
 * rather than widened. `.rst`, `.org` and `.adoc` are prose by any ordinary
 * reading and are deliberately absent: the clause this set exists to measure
 * lists three extensions, and a set that scored a fourth would report a
 * number the key result did not ask for.
 */
export const PROSE_EXTENSIONS: readonly string[] = ['.md', '.txt', '.tex']

/** Which of KR1.3's surfaces a single classified path belongs to. */
export type Surface = 'prose' | 'other'

/**
 * @param path a repository-relative path as it appears in `record.files[].path`
 */
export function surfaceOf(path: string): Surface {
  const dot = path.lastIndexOf('.')
  const slash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))
  // A dot before the last separator belongs to a directory, and a leading dot
  // on the basename is the whole name of a dotfile rather than an extension,
  // so `docs/v1.2/NOTES` and `.gitignore` both have none.
  if (dot <= slash + 1) return 'other'
  return PROSE_EXTENSIONS.includes(path.slice(dot).toLowerCase()) ? 'prose' : 'other'
}

/** One source a corpus was swept over, with what the launch over it found. */
export interface CorpusEntry {
  /** how to name this unit in the table: `alexandrapaiz/Ursa#645` */
  label: string
  /** work units the launch built, whether or not they became records */
  workUnits: number
  records: OutcomeRecord[]
  /** units the `--min-chars` floor dropped */
  belowMinChars: number
  /** units that resolved to nothing with no import to state */
  unresolvable: number
  /** episode ids the user had erased, which stayed erased */
  erased: number
  /** invariant violations the gate found over this entry's records */
  violations: number
  /**
   * Why this entry has no records, when a reason other than "it found none"
   * applies: a capture that failed, a merge commit missing from the clone.
   * Absent means the launch ran and answered. Never a placeholder for a
   * failure nobody named, which is the rule `src/apparatus.ts` states for
   * `resolvedBy`.
   */
  refusal?: string
}

export interface CorpusTotals {
  entries: number
  /** entries whose launch produced at least one record */
  entriesWithRecords: number
  /** entries that could not be measured at all, each carrying a `refusal` */
  entriesRefused: number
  workUnits: number
  records: number
  belowMinChars: number
  unresolvable: number
  erased: number
  violations: number
  /** characters of finished work the corpus classified */
  finalChars: number
  byClass: Record<SpanClass, number>
  /** generated characters, and what became of them */
  generatedChars: number
  humanDeletedChars: number
  mergeDeletedChars: number
  unknownDeletedChars: number
}

/**
 * The three quantities KR1.3's three clauses ask about, each stated beside the
 * clause it answers. No threshold is applied here and no clause is scored:
 * see the note at the top of this file.
 */
export interface CorpusShape {
  /**
   * Distinct finished works the corpus classified, counted as distinct paths
   * across every record. Two records over the same file are one subject,
   * which is the count KR1.3's "distinct real finished works" asks for and is
   * NOT the record count: pull request #645 of this repository produces three
   * records over one file.
   */
  distinctSubjects: string[]
  /** those of `distinctSubjects` whose extension is in `PROSE_EXTENSIONS` */
  proseSubjects: string[]
  /**
   * Records joining generations from more than one source, counted by
   * `record.conversations.length > 1`. A git-pair or pull-request record
   * carries no conversations at all, so on those paths this is always zero
   * and zero is a true statement about the path rather than a gap.
   */
  multiSourceRecords: string[]
  /**
   * The distinct subjects grouped by the first two segments of their path,
   * counted, sorted by count descending and then by name.
   *
   * Reported because the size of a corpus and the SUBJECT of a corpus are
   * different facts, and on this repository the second one is the finding.
   * Of the 15 distinct subjects the 2026-11-08 sweep classified, 10 are under
   * `docs/runs/`, which is where the agent seats write their own run logs. A
   * reader told only "10 of 15 subjects are on the prose path" would conclude
   * the prose clause of KR1.3 was answered by a corpus of real prose work. It
   * is answered by a corpus of agents writing about their own runs, which is
   * a much weaker demonstration and is the sort of thing a lab evaluating the
   * data would find on its own.
   */
  subjectsByArea: Array<{ area: string; subjects: number }>
  /**
   * Records carrying a correction: any edited span, or a signal derived from
   * one. This is not in KR1.3 and is reported anyway, because it is the thing
   * the corpus is FOR. A record of 12,000 verbatim characters and no edit
   * tells a lab nothing it could not get from a diff; the edit is the
   * correction (`CLAUDE.md`, section 1).
   */
  correctionCarryingRecords: string[]
}

// `SpanClass` is three values, not four. `generated_deleted` is a
// `GenerationFate` and belongs to a generation's own spans, never to a span of
// the finished work, so it is counted below out of `stats.generated` instead.
// Derived from the type rather than listed, so a fourth class added to
// `src/types.ts` is a compile error here and not a silently uncounted column.
const ZERO_BY_CLASS = (): Record<SpanClass, number> => ({
  survived_verbatim: 0,
  survived_mutated: 0,
  no_generation_provenance: 0,
})

export function summarizeCorpus(entries: CorpusEntry[]): CorpusTotals {
  const totals: CorpusTotals = {
    entries: entries.length,
    entriesWithRecords: 0,
    entriesRefused: 0,
    workUnits: 0,
    records: 0,
    belowMinChars: 0,
    unresolvable: 0,
    erased: 0,
    violations: 0,
    finalChars: 0,
    byClass: ZERO_BY_CLASS(),
    generatedChars: 0,
    humanDeletedChars: 0,
    mergeDeletedChars: 0,
    unknownDeletedChars: 0,
  }

  for (const entry of entries) {
    if (entry.refusal) totals.entriesRefused += 1
    if (entry.records.length > 0) totals.entriesWithRecords += 1
    totals.workUnits += entry.workUnits
    totals.records += entry.records.length
    totals.belowMinChars += entry.belowMinChars
    totals.unresolvable += entry.unresolvable
    totals.erased += entry.erased
    totals.violations += entry.violations

    for (const record of entry.records) {
      totals.finalChars += record.stats.finalChars
      for (const klass of Object.keys(totals.byClass) as SpanClass[]) {
        // A class absent from `byClass` is a class with no spans, which the
        // resolver omits rather than writing as a zero, so this reads through
        // the absence instead of trusting the key to be there.
        totals.byClass[klass] += record.stats.byClass[klass]?.chars ?? 0
      }
      totals.generatedChars += record.stats.generated.totalChars
      totals.humanDeletedChars += record.stats.generated.humanDeletedChars
      totals.mergeDeletedChars += record.stats.generated.mergeDeletedChars
      totals.unknownDeletedChars += record.stats.generated.unknownDeletedChars
    }
  }

  return totals
}

/** Whether this record carries any correction at all, by either channel. */
export function carriesCorrection(record: OutcomeRecord): boolean {
  if ((record.stats.byClass.survived_mutated?.chars ?? 0) > 0) return true
  const signals = record.signals
  if (!signals) return false
  return (
    signals.correctionLoops.length > 0 ||
    signals.oneShotCorrections.length > 0 ||
    signals.regressions.length > 0 ||
    signals.repairAttempts.length > 0
  )
}

export function corpusShape(entries: CorpusEntry[]): CorpusShape {
  const subjects = new Set<string>()
  const multiSource: string[] = []
  const withCorrections: string[] = []

  for (const entry of entries) {
    for (const record of entry.records) {
      for (const file of record.files) subjects.add(file.path)
      if ((record.conversations?.length ?? 0) > 1) multiSource.push(record.task.id)
      if (carriesCorrection(record)) withCorrections.push(record.task.id)
    }
  }

  const distinctSubjects = [...subjects].sort()
  return {
    distinctSubjects,
    proseSubjects: distinctSubjects.filter((p) => surfaceOf(p) === 'prose'),
    subjectsByArea: groupByArea(distinctSubjects),
    multiSourceRecords: multiSource,
    correctionCarryingRecords: withCorrections,
  }
}

/**
 * Group paths by their first two segments, or by the first where there is no
 * second, or by `.` for a path at the root.
 *
 * Two segments rather than one because one is uninformative on this
 * repository's own shape: `docs/` holds the vision, the ADRs, the designs and
 * the seats' run logs, and the difference between `docs/design` and
 * `docs/runs` is exactly the difference the grouping exists to show.
 */
export function groupByArea(paths: string[]): Array<{ area: string; subjects: number }> {
  const counts = new Map<string, number>()
  for (const path of paths) {
    // The DIRECTORY's first two segments, never the path's. Grouping a
    // path's own first two segments files `docs/a.md` under `docs/a.md`,
    // which is one area per file and no grouping at all. Caught by the
    // root-level case in `src/corpus.test.ts`, which is the only input where
    // the two readings differ visibly.
    const dir = path.split('/').slice(0, -1)
    const area = dir.length === 0 ? '.' : dir.slice(0, 2).join('/')
    counts.set(area, (counts.get(area) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([area, subjects]) => ({ area, subjects }))
    // Count descending, then name ascending, so the output is stable across
    // runs and the largest area is the first thing read.
    .sort((a, b) => b.subjects - a.subjects || a.area.localeCompare(b.area))
}

function pct(part: number, whole: number): string {
  if (whole === 0) return 'n/a'
  return `${((part / whole) * 100).toFixed(1)}%`
}

/**
 * The corpus as text. Separate from the counting for the reason
 * `src/launch.ts` gives under `DroppedUnits`: the counting is shared and the
 * wording is not.
 *
 * @param window one sentence naming what was swept and over what range,
 *   printed above the table. Required rather than optional, because a
 *   corpus figure with no stated window is the defect this repository filed
 *   on 2026-11-08 ("Every measurement this repository publishes should state
 *   the window it was measured over").
 */
export function renderCorpus(entries: CorpusEntry[], window: string): string {
  const totals = summarizeCorpus(entries)
  const shape = corpusShape(entries)
  const lines: string[] = []

  lines.push(`Corpus: ${window}`)
  lines.push('')
  lines.push('| source | work units | records | verbatim | edited | person dropped | refused |')
  lines.push('|---|---|---|---|---|---|---|')
  for (const entry of entries) {
    const verbatim = entry.records.reduce((n, r) => n + (r.stats.byClass.survived_verbatim?.chars ?? 0), 0)
    const mutated = entry.records.reduce((n, r) => n + (r.stats.byClass.survived_mutated?.chars ?? 0), 0)
    const dropped = entry.records.reduce((n, r) => n + r.stats.generated.humanDeletedChars, 0)
    lines.push(
      `| ${entry.label} | ${entry.workUnits} | ${entry.records.length} | ` +
      `${verbatim.toLocaleString()} | ${mutated.toLocaleString()} | ${dropped.toLocaleString()} | ` +
      `${entry.refusal ?? ''} |`,
    )
  }

  lines.push('')
  lines.push(
    `${totals.entries} source(s) swept, ${totals.entriesWithRecords} with at least one record, ` +
    `${totals.entriesRefused} this sweep could not measure.`,
  )
  lines.push(
    `${totals.workUnits} work unit(s) found, ${totals.records} became records. ` +
    `${totals.belowMinChars} fell under the --min-chars floor, ${totals.unresolvable} resolved to ` +
    `nothing with no import to state, ${totals.erased} stayed erased.`,
  )
  lines.push(
    `${totals.finalChars.toLocaleString()} characters of finished work classified: ` +
    `${totals.byClass.survived_verbatim.toLocaleString()} kept unchanged ` +
    `(${pct(totals.byClass.survived_verbatim, totals.finalChars)}), ` +
    `${totals.byClass.survived_mutated.toLocaleString()} kept after an edit ` +
    `(${pct(totals.byClass.survived_mutated, totals.finalChars)}), ` +
    `${totals.byClass.no_generation_provenance.toLocaleString()} with no generation behind them ` +
    `(${pct(totals.byClass.no_generation_provenance, totals.finalChars)}).`,
  )
  lines.push(
    `${totals.generatedChars.toLocaleString()} generated characters: ` +
    `${totals.humanDeletedChars.toLocaleString()} the person dropped, ` +
    `${totals.mergeDeletedChars.toLocaleString()} destroyed by a merge, ` +
    `${totals.unknownDeletedChars.toLocaleString()} with no readable cause.`,
  )

  // The three KR1.3 clauses, each with the number that answers it and no
  // verdict on whether the key result is met. The clause text is quoted so a
  // reader comparing this output to docs/okrs/2026-q4.md is comparing the
  // same words.
  lines.push('')
  lines.push('Against KR1.3 (docs/okrs/2026-q4.md), measured, not scored:')
  lines.push(
    `  "five or more completed outcome records on distinct real finished works": ` +
    `${shape.distinctSubjects.length} distinct finished work(s) across ${totals.records} record(s).`,
  )
  lines.push(
    `  "at least two use the prose path (.md/.txt/.tex)": ` +
    `${shape.proseSubjects.length} of those ${shape.distinctSubjects.length}.`,
  )
  lines.push(
    `  "at least one joins generations from more than one source": ` +
    `${shape.multiSourceRecords.length} record(s). A pull-request record carries no ` +
    `conversations, so zero here is a fact about this path and not a missing measurement.`,
  )
  lines.push(
    `  What those ${shape.distinctSubjects.length} finished work(s) ARE, by area, because the size of a ` +
    `corpus and its subject are different facts: ` +
    `${shape.subjectsByArea.map((a) => `${a.area} ${a.subjects}`).join(', ')}.`,
  )
  lines.push(
    `  Not in KR1.3, and the reason the corpus exists: ` +
    `${shape.correctionCarryingRecords.length} of ${totals.records} record(s) carry a correction, ` +
    `meaning an edited span or a signal derived from one.`,
  )

  if (totals.violations > 0) {
    lines.push('')
    lines.push(
      `${totals.violations} invariant violation(s) across the corpus. The records are on disk: ` +
      'an impossible record is still the evidence of the defect.',
    )
  }

  return lines.join('\n')
}
