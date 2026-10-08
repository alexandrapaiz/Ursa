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

export function renderRunComment(f: RunCommentFields, ctx: RunCommentContext): string {
  const lines: string[] = [RUN_COMMENT_MARKER, '']
  lines.push(`**Ursa Major resolved this merge.** Pull request #${ctx.prNumber} in \`${ctx.repo}\`.`)
  lines.push('')
  lines.push(renderRunCommentFieldTable(f))
  lines.push('')
  lines.push(
    f.unitsResolved === 0
      ? 'Nothing resolved in this window. That is a reading, not a failure: no commit here carried an agent marker that a later human commit then edited.'
      : "That's the part worth noticing: not what got written, what got kept."
  )
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
