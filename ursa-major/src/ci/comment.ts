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

import { BOUND_COUNT, currentGateIdentity } from '../invariants'
import { formatResolverIdentity } from '../resolver-identity'
import type { OutcomeRecord, ResolverIdentity } from '../types'
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
  /**
   * How many of this run's own bounds (`src/invariants.ts`) the records it
   * just wrote violated. Zero on a healthy run, and zero is also what an
   * older caller that does not pass it gets, which is wrong in only one
   * direction: it understates.
   *
   * It appears in the detail block rather than in the five-field table on
   * purpose. The table's shape is fixed, because two runs whose tables
   * carry different rows are not comparable, and a row that is almost
   * always "0" would train the reader to skip it. The detail block is where
   * a reader goes to ask how far to trust the numbers, which is exactly the
   * question a violated bound answers.
   */
  /**
   * Generations the pairing walk abandoned before any work unit existed,
   * one stage above `dropped` (`pairRefusals` in src/launch.ts).
   *
   * This exists because `dropped` fixed half of one sentence. Its
   * docstring above records a run on 2026-10-08 asserting "no commit here
   * carried an agent marker that a later human commit then edited" beside
   * `units-found=1`, and the repair gave the `unitsFound > 0` branch a
   * reason to name. A generation abandoned by a pairing bound produces no
   * work unit at all, so it lands in the OTHER branch, where the same
   * sentence was still the only thing on offer and is false in every
   * clause: the marker was there, the human edit was there, and the walk
   * declined to reach between them.
   *
   * Omitted by a caller that does not track it, in which case the
   * zero-unit sentence keeps the unconditional wording, because a caller
   * with no tally cannot distinguish the history that sentence is true of
   * from the history it is false of.
   */
  refused?: {
    total: number
    refusals: {
      bound: 'distance' | 'age' | 'interposedGeneration' | 'notDescendant'
      count: number
      flag: '--max-pair-distance' | '--max-pair-age-hours' | '--max-interposed-generations' | null
      limit: number | null
    }[]
  }
  invariantViolations?: number
  /**
   * The resolver that wrote this run's records, as `task.resolvedBy`
   * states it in each of them (src/resolver-identity.ts).
   *
   * In the detail block for the same reason `invariantViolations` is: the
   * five-field table's shape is fixed so two runs stay comparable, and
   * this is a question a reader asks when deciding how far to trust the
   * figures rather than one of the figures. It matters most here, on the
   * CI launch, because a reader of this comment is reading numbers
   * produced by a build they did not install and cannot see — and on any
   * repository other than this one, GitHub handed the runner the action
   * as a tarball, so the identity is the bundle's digest and this line is
   * the only place it is ever shown.
   *
   * Omitted by a caller that does not pass it, which prints no line at
   * all. A sentence naming no resolver would be worse than silence: it
   * would read as a resolver that declined to identify itself.
   */
  resolvedBy?: ResolverIdentity | null
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
/**
 * The abandonment tally as one clause, or null when there is nothing to say.
 *
 * Wording lives here and not in `pairRefusals`, for the reason drift 6
 * gives in src/launch.ts: a markdown comment and a terminal are different
 * surfaces, and only the NUMBER and the FLAG have to match between them.
 * What is shared is which bound stopped how many generations; what is not
 * is that this surface writes the flag as code and `src/bin/ursa.ts`
 * writes it bare.
 */
function refusedClause(ctx: RunCommentContext): string | null {
  const r = ctx.refused
  if (!r || r.total === 0) return null
  const parts = r.refusals.map((x) => {
    const n = `${x.count} generation${x.count === 1 ? '' : 's'}`
    switch (x.bound) {
      case 'interposedGeneration':
        return `${n} had the same file rewritten by a later generation first, so the edit that followed corrected that generation and not this one`
      case 'distance':
        return `${n} found no edit of the same file within ${x.limit} commits, the \`--max-pair-distance\` reach`
      case 'age':
        return `${n} found none within ${x.limit} hours, the \`--max-pair-age-hours\` reach`
      case 'notDescendant':
        return `${n} were only edited on a branch that never contained them, which no input widens`
    }
  })
  return parts.join(', and ')
}

function emptyWindowSentence(f: RunCommentFields, ctx: RunCommentContext): string {
  const opening = 'Nothing resolved in this window. That is a reading, not a failure:'
  const refused = refusedClause(ctx)
  if (f.unitsFound === 0) {
    // The marker-and-edit sentence is only true when the walk abandoned
    // nothing. When it abandoned something, every clause of it is false:
    // a commit DID carry a marker, a later human commit DID edit the same
    // file, and a bound stopped the walk in between. Saying it anyway is
    // what this branch did until 2026-10-25 (drift 7, src/launch.ts), and
    // on a repository where agent seats commit between the owner's own
    // touches it is the sentence every merge gets.
    if (!refused) {
      return `${opening} no commit here carried an agent marker that a later human commit then edited.`
    }
    const one = ctx.refused!.total === 1
    return (
      `${opening} commits here did carry agent markers and were followed by your edits, and ` +
      `${ctx.refused!.total} of those pairings ${one ? 'was' : 'were'} left out rather than guessed at. ` +
      `${refused}. ` +
      'Those are claims this run could not stand behind, so it did not make them. Raise the pairing ' +
      'inputs on the Ursa step to see them anyway.'
    )
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
  const bad = ctx.invariantViolations ?? 0
  lines.push(
    bad === 0
      ? `- Self-check: every record above satisfies all ${BOUND_COUNT} of the bounds a record must satisfy, so the figures in the table are at least internally consistent.`
      : `- Self-check: **${bad} bound${bad === 1 ? '' : 's'} violated**, so the figures in the table cannot all be true at once. The records were still written, because an impossible record is still the evidence of the defect, and this run's step exited non-zero rather than reporting success. The violations, with both sides of every number, are in the workflow log.`
  )
  if (ctx.resolvedBy !== undefined) {
    lines.push(`- Resolver that produced these records: ${formatResolverIdentity(ctx.resolvedBy)}. Every record above carries it as \`task.resolvedBy\`, so a figure in this table can be traced to the code that computed it.`)
  }
  // The bound set, beside the resolver and not folded into the self-check
  // line above it. That line says how many bounds held; this one says WHICH,
  // and the two are different facts: a count is the same word whether or not
  // a bound was dropped from the set being counted. The digest is here
  // rather than only in the record because this comment is the surface a
  // reader sees without opening a record at all, and comparing two runs'
  // digests is the one check the field supports.
  lines.push(`- Bound set those records were checked against: \`${currentGateIdentity().boundsDigest}\`, over ${BOUND_COUNT} bounds. Every record above carries it as \`task.gatedBy\`, so two runs can be compared on whether the same rules applied. It names the rules, not a verdict: the self-check line above is what says they held.`)
  if (ctx.runUrl) lines.push(`- Workflow run: ${ctx.runUrl}`)
  lines.push('')
  lines.push('</details>')
  lines.push('')
  lines.push(
    'React 👍 on this comment if the merged work is what you wanted. Ursa reads that reaction on the next run and records it as a declared acceptance. Leaving it alone records nothing: silence stays undeclared, and retention is never read as acceptance.'
  )
  return lines.join('\n')
}
