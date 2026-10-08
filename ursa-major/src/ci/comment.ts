// The run comment: the environment's feedback on a merged pull request.
//
// The shape is a contract, not a layout choice. The comment carries the
// same five fields in the same order on every run, zeros included, so a
// reader comparing two merges is reading the same rows and a zero is a
// fact rather than a missing line:
//
//   1. units resolved          — work units found, and how many resolved
//   2. survived verbatim       — characters generated and kept unchanged
//   3. survived edited         — characters kept after the user edited them
//   4. most corrected artifact — the file carrying the most edited characters
//   5. tuning delta            — units added and reinforced this run
//
// Field 4 is a path or the literal `none`; it is never omitted. Field 5
// is two counts plus the mode that produced them, so a zero from CI mode
// (no model on the runner) never reads as a zero from a model that found
// nothing.
//
// The marker on the first line is how the next run finds this comment
// again, to update it in place and to read the thumbs up on it
// (src/ci/reactions.ts). It is versioned, because a later field order
// would be a different contract and must not be mistaken for this one.

import type { OutcomeRecord } from '../types'
import type { Episode } from '../episodes'

export const RUN_COMMENT_MARKER = '<!-- ursa-major:run-comment:v1 -->'

export interface TuningDelta {
  unitsAdded: number
  unitsReinforced: number
  /** 'distilled' = a model interpreted the corrections; 'ci-no-model' = none was available */
  mode: 'distilled' | 'ci-no-model'
  /** why this mode, verbatim from selectDistillMode */
  reason: string
}

export interface RunCommentFields {
  unitsFound: number
  unitsResolved: number
  charsSurvivedVerbatim: number
  charsSurvivedEdited: number
  /** path of the file with the most survived_mutated characters, or null */
  mostCorrectedArtifact: string | null
  mostCorrectedChars: number
  tuningDelta: TuningDelta
}

export interface RunCommentContext {
  prNumber: number
  repo: string
  /** the git revision range the records came from */
  range: string
  /** why that range (squash degradation included) */
  windowNote: string
  /** the declaration this run carried in, and where it came from */
  declarationBasis: string
  recordsPath: string
  runUrl: string | null
  /**
   * Why the work units this window found did not become records, when some
   * did not. The comment's empty-window sentence is otherwise a guess: it
   * used to assert "no commit here carried an agent marker that a later
   * human commit then edited" on every zero, including the zeros where a
   * pair WAS found and then dropped. On 2026-10-08 a run printed that
   * sentence beside `units-found=1`, which is the one thing the sentence
   * says did not happen.
   *
   * Omitted by a caller that does not track it, in which case the sentence
   * says a count was not resolved rather than inventing a reason for it.
   */
  dropped?: {
    /** units `resolveEpisode` returned nothing for, with no exclusion to state */
    unresolvable: number
    /** units whose generation was smaller than the `--min-chars` floor */
    belowMinChars: number
    /** the floor those units fell under, so the reader can raise it */
    minChars: number
  }
}

/**
 * Derive the five fields from the run's own records. Pure: every number
 * is a sum over the resolver's existing stats, so the comment can never
 * disagree with the records it summarizes.
 */
export function runCommentFields(
  records: OutcomeRecord[],
  episodes: Episode[],
  tuningDelta: TuningDelta
): RunCommentFields {
  let charsSurvivedVerbatim = 0
  let charsSurvivedEdited = 0
  const mutatedByPath = new Map<string, number>()

  for (const record of records) {
    charsSurvivedVerbatim += record.stats.byClass.survived_verbatim.chars
    charsSurvivedEdited += record.stats.byClass.survived_mutated.chars
    for (const file of record.stats.perFile) {
      const mutated = file.byClass.survived_mutated ?? 0
      if (mutated <= 0) continue
      mutatedByPath.set(file.path, (mutatedByPath.get(file.path) ?? 0) + mutated)
    }
  }

  // Ties break on the path, so two runs over the same data print the
  // same artifact rather than whichever the map happened to yield first.
  let mostCorrectedArtifact: string | null = null
  let mostCorrectedChars = 0
  for (const [path, chars] of [...mutatedByPath].sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))) {
    mostCorrectedArtifact = path
    mostCorrectedChars = chars
    break
  }

  return {
    unitsFound: episodes.length,
    unitsResolved: records.length,
    charsSurvivedVerbatim,
    charsSurvivedEdited,
    mostCorrectedArtifact,
    mostCorrectedChars,
    tuningDelta,
  }
}

function n(value: number): string {
  return value.toLocaleString('en-US')
}

/** The five rows, in order, zeros included. */
export function renderRunCommentFieldTable(f: RunCommentFields): string {
  const delta = f.tuningDelta
  const deltaCell =
    delta.mode === 'distilled'
      ? `${n(delta.unitsAdded)} new, ${n(delta.unitsReinforced)} reinforced`
      : `${n(delta.unitsAdded)} new, ${n(delta.unitsReinforced)} reinforced (no interpretation ran: ${delta.reason})`
  const artifactCell =
    f.mostCorrectedArtifact === null
      ? 'none — no generated text was edited in this window'
      : `\`${f.mostCorrectedArtifact}\` (${n(f.mostCorrectedChars)} edited characters)`

  return [
    '| Field | Value |',
    '| --- | --- |',
    `| Units resolved — work units found in this merge, and how many became outcome records | ${n(f.unitsResolved)} of ${n(f.unitsFound)} |`,
    `| Characters survived verbatim — generated text you kept unchanged | ${n(f.charsSurvivedVerbatim)} |`,
    `| Characters survived edited — generated text you kept after editing it; the edit is the correction | ${n(f.charsSurvivedEdited)} |`,
    `| Most corrected artifact — the file carrying the most edited characters | ${artifactCell} |`,
    `| Tuning delta — preference units this run added to, or reinforced in, the tuning store | ${deltaCell} |`,
  ].join('\n')
}

/**
 * What the comment says when the window produced no records.
 *
 * Three different facts hide behind one zero, and the reader acts on them
 * differently. No pair at all means this repository's commits do not carry
 * an agent marker, which is a question about authorship. A pair found and
 * dropped under the size floor means the work was real and small, which is
 * a question about `--min-chars`. A pair that resolved to nothing means the
 * blobs could not be read, which is a question about the clone. Reporting
 * the first for all three, which this comment did until 2026-10-08, tells a
 * user to go fix their commit trailers when the actual fix is one flag.
 */
function emptyWindowSentence(f: RunCommentFields, ctx: RunCommentContext): string {
  const opening = 'Nothing resolved in this window. That is a reading, not a failure:'
  if (f.unitsFound === 0) {
    return `${opening} no commit here carried an agent marker that a later human commit then edited.`
  }
  const one = f.unitsFound === 1
  const found = one
    ? '1 work unit was found, and it did not become a record.'
    : `${f.unitsFound} work units were found, and none of them became a record.`
  const d = ctx.dropped
  if (!d) return `${opening} ${found} This run did not record which bound dropped them.`
  const because: string[] = []
  if (d.belowMinChars > 0) {
    because.push(`${d.belowMinChars} carried fewer than ${d.minChars} generated characters, the \`--min-chars\` floor, which is small enough that a survival figure over it would be noise`)
  }
  if (d.unresolvable > 0) {
    because.push(`${d.unresolvable} resolved to nothing this clone could stand behind, which is usually a blob the runner could not read or a file over the size ceiling`)
  }
  if (because.length === 0) return `${opening} ${found}`
  const lead = one ? 'The reason:' : 'Of those,'
  return `${opening} ${found} ${lead} ${because.join(', and ')}.`
}

export function renderRunComment(f: RunCommentFields, ctx: RunCommentContext): string {
  const lines: string[] = [RUN_COMMENT_MARKER, '']
  lines.push(`**Ursa Major resolved this merge.** Pull request #${ctx.prNumber} in \`${ctx.repo}\`.`)
  lines.push('')
  lines.push(renderRunCommentFieldTable(f))
  lines.push('')
  lines.push(f.unitsResolved === 0 ? emptyWindowSentence(f, ctx) : "That's the part worth noticing: not what got written, what got kept.")
  lines.push('')
  lines.push('<details><summary>How this run was bounded</summary>')
  lines.push('')
  lines.push(`- Commit window: \`${ctx.range}\``)
  lines.push(`- Why that window: ${ctx.windowNote}`)
  lines.push(`- Acceptance declaration carried into these records: ${ctx.declarationBasis}`)
  lines.push(`- Records written to \`${ctx.recordsPath}\` on this runner. They are not pushed anywhere.`)
  if (ctx.runUrl) lines.push(`- Workflow run: ${ctx.runUrl}`)
  lines.push('')
  lines.push('</details>')
  lines.push('')
  lines.push(
    'React 👍 on this comment if the merged work is what you wanted. Ursa reads that reaction on the next run and records it as a declared acceptance. Leaving it alone records nothing: silence stays undeclared, and retention is never read as acceptance.'
  )
  return lines.join('\n')
}
