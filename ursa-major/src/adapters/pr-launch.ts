// The third launch, brought under the parity definition.
//
// `src/launch.ts` opens with the sentence "the decisions both launches
// must make identically" and names two: `ursa run` (src/bin/ursa.ts) and
// `ursa ci` (src/ci/run.ts). There have been three since the pull-request
// adapter shipped. `src/adapters/cli.ts run` resolved a pull request into
// records, wrote them to `<project>/.ursa/records/`, and asked none of the
// three questions that file exists to answer, because it was written as an
// adapter's own entry point while `src/bin/ursa.ts` was being edited by
// another pull request and then stayed one (see the note at the top of
// `src/adapters/cli.ts`).
//
// That is not a cosmetic omission on this path. The pull-request path is
// the ONLY one that finds anything on a repository whose commits are all
// an agent's, which is what this repository is: the n=3 dogfood run over
// 470 commits produced zero records through the git-pair path and the
// adapter reads 23 pairs out of 13 merged pull requests over the same
// history (`src/adapters/README.md`). So the launch with no gate, no
// erasure check and the wrong size floor was the launch that ran on the
// corpus the product demonstrates itself with.
//
// Measured 2026-11-02 on one `merge-resolution` fixture (the repository
// `conflictRepo` builds in `src/adapters/pr-launch.test.ts`), before any
// of this module existed:
//
//   9. Erasure. `ursa forget <project> --record <id>` deleted the record
//      file and wrote the tombstone, and the next `src/adapters/cli.ts
//      run` over the same pull request wrote the record back to disk. The
//      command's own success message says "its id is tombstoned, so `ursa
//      run` will not rebuild it from the git history it came from"
//      (src/consent.cli.ts), which was true of the launch it names and
//      false of this one. This is drift 3 of `src/launch.ts`, which was
//      found on the CI launch on 2026-10-10 and fixed there, reappearing
//      on a third launch nobody compared. It is also the only drift of the
//      eleven that breaks a promise the product makes in writing:
//      constraint 2 in README.md is that the user can always delete what
//      has been inferred about them.
//   10. The self-check. The loop never called `checkRecord` or
//      `gateRecords`, so a record whose arithmetic cannot be true was
//      written and the command exited 0. Drift 2, same shape, third
//      launch.
//   11. The size floor. The loop asked `record.stats.generated.totalChars
//      < minChars` directly instead of `clearsSizeFloor`, so a
//      refusal-only record — one whose every resolvable path was an
//      import, which therefore has no generation side to measure and
//      exists to make that absence state itself — was dropped by a
//      threshold aimed at something else. Drift 1, third launch. Also
//      drift 6: the drop was silent, so a run that wrote nothing printed
//      `0 records` with no bound named.
//
// WHAT THIS MODULE DELIBERATELY DOES NOT DO.
//
// It does not call `stampPairingBounds`. A pull request is its own
// window: `pairsFromPullRequest` pairs commits inside one pull request's
// own commit list and has no `--max-pair-distance`,
// `--max-pair-age-hours` or `--max-interposed-generations` to apply
// (`PullRequestAdapterOptions` in src/adapters/github-pr.ts carries two
// regexes and nothing else). So `task.pairedBy` stays absent on this
// path, and absent is a real claim here rather than a gap: the rule it
// follows is the one `src/apparatus.ts` states for `resolvedBy`,
// `gatedBy` and `pairedBy` alike, that absent is never a placeholder. A
// record stamped with bounds no walk applied would be worse than one
// carrying none.
//
// It does not call `annotateDurability`. The local git-pair launch walks
// the commits after an episode closed and records how long each span
// lasted; this path could, since a merged pull request has history after
// it in any clone that is not shallow, and `ursa ci` cannot, since at
// merge time there is none yet. Whether a pull-request record may assert
// the time dimension is a product decision about what that record claims
// and not a drift repair, which is the reason `src/launch-parity.test.ts`
// gives for leaving `lifespan` in `ALLOWED_TO_DIFFER` on the CI launch.
// It is in the ledger as a proposal rather than taken here.

import { erasedEpisodeIds, gateRecords, keepRecord, newDroppedUnits, type DroppedUnits, type GateResult } from '../launch'
import { resolveEpisode } from '../resolve-episode'
import { deriveSignals } from '../signals'
import { saveEpisodes, saveRecord } from '../store'
import { gitRepoReader } from './git-reader'
import {
  episodesFromPullRequest,
  pairsFromPullRequest,
  type PullRequestAdapterOptions,
  type PullRequestEpisode,
  type PullRequestSnapshot,
  type RepoReader,
} from './github-pr'
import type { OutcomeRecord } from '../types'

/**
 * The floor `src/adapters/cli.ts` has defaulted to since the adapter
 * shipped. Named here rather than repeated as a literal in the two
 * surfaces that now reach this launch (`ursa pr` in src/bin/ursa.ts and
 * `cli.ts run`), because a default written twice is the shape every
 * drift at the top of this file has.
 */
export const PR_LAUNCH_MIN_CHARS = 200

export interface PullRequestLaunchOptions {
  projectPath: string
  snapshot: PullRequestSnapshot
  /**
   * How blobs and parents are read. Defaults to `gitRepoReader` over
   * `projectPath`, which is what both surfaces pass; it is a parameter
   * because `src/adapters/replay.ts` wraps a reader to record its answers
   * into a fixture and the tests hand in a fork reader.
   */
  reader?: RepoReader
  minChars?: number
  adapter?: PullRequestAdapterOptions
}

export interface PullRequestLaunchResult {
  episodes: PullRequestEpisode[]
  records: OutcomeRecord[]
  /** absolute paths of the files written, in the order they were written */
  recordPaths: string[]
  /** which bound dropped each work unit that did not become a record */
  dropped: DroppedUnits
  /**
   * Episode ids the user had erased, skipped rather than rebuilt. Ids and
   * not a count, because the summary names them and because a caller
   * checking that erasure held needs to know WHICH id survived.
   */
  erased: string[]
  gate: GateResult
  /**
   * 1 when the gate found anything, 0 otherwise. The records are already
   * on disk when this is computed, in both of the other launches and in
   * this one, because an impossible record is still the evidence of the
   * defect; what the exit code changes is that the run stops reporting
   * success.
   */
  exitCode: number
}

/**
 * Resolve one pull request into records, with the three shared decisions
 * asked in the same place the other two launches ask them.
 *
 * Takes a captured snapshot rather than a repository and a number, so the
 * launch itself touches no network: `src/adapters/gh.ts` does the capture
 * and either surface can pass a snapshot read off disk instead. That is
 * also what makes this testable without `gh` on the path, which the loop
 * inside `cli.ts run` was not.
 */
export function runPullRequestLaunch(opts: PullRequestLaunchOptions): PullRequestLaunchResult {
  const { projectPath, snapshot } = opts
  const minChars = opts.minChars ?? PR_LAUNCH_MIN_CHARS
  const reader = opts.reader ?? gitRepoReader(projectPath)

  const pairs = pairsFromPullRequest(snapshot, reader, opts.adapter ?? {})
  const episodes = episodesFromPullRequest(pairs, projectPath)

  // Drift 9. Every episode above was rebuilt from the pull request's own
  // commits, which are still in the clone after `ursa forget` ran, so
  // without this filter the command undoes the deletion it told the user
  // was permanent.
  const erasedIds = erasedEpisodeIds(projectPath, episodes.map((ep) => ep.id))
  const erased: string[] = []

  // Drift 11, second half: which bound dropped a unit, counted where both
  // other launches count it.
  const dropped = newDroppedUnits(minChars)
  const records: OutcomeRecord[] = []
  const recordPaths: string[] = []

  for (const ep of episodes) {
    if (erasedIds.has(ep.id)) {
      erased.push(ep.id)
      continue
    }
    const record = resolveEpisode(projectPath, ep)
    // Drift 11, first half: `keepRecord` asks `clearsSizeFloor`, which
    // exempts a record with no generation side and one or more
    // exclusions. The predicate this replaced dropped exactly that
    // record.
    if (!keepRecord(record, minChars, dropped)) continue
    record.signals = deriveSignals(record, ep.pullRequest.acceptance)
    recordPaths.push(saveRecord(projectPath, record))
    records.push(record)
  }
  saveEpisodes(projectPath, episodes)

  // Drift 10. After the writes, never instead of them.
  const gate = gateRecords(records)
  return {
    episodes,
    records,
    recordPaths,
    dropped,
    erased,
    gate,
    exitCode: gate.violations.length > 0 ? 1 : 0,
  }
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

/**
 * What the terminal prints for one pull-request launch.
 *
 * Separate from `runPullRequestLaunch` for the reason `src/launch.ts`
 * gives under `DroppedUnits`: the counting is shared and the wording is
 * not. What may not diverge is which episode counts as which kind of
 * drop, and that is decided in `keepRecord` for all three launches.
 */
export function renderPullRequestSummary(
  snapshot: PullRequestSnapshot,
  result: PullRequestLaunchResult,
  projectPath: string,
): string {
  const { records, episodes, dropped, erased } = result
  const lines: string[] = []
  const mutated = records.reduce((n, r) => n + r.stats.byClass.survived_mutated.chars, 0)
  const verbatim = records.reduce((n, r) => n + r.stats.byClass.survived_verbatim.chars, 0)
  const humanDeleted = records.reduce((n, r) => n + r.stats.generated.humanDeletedChars, 0)
  const mergeDeleted = records.reduce((n, r) => n + r.stats.generated.mergeDeletedChars, 0)
  const unknownDeleted = records.reduce((n, r) => n + r.stats.generated.unknownDeletedChars, 0)

  lines.push(
    `${snapshot.repo}#${snapshot.number}: ${plural(episodes.length, 'work unit')}, ` +
    `${plural(records.length, 'record')}.`,
  )

  // Same rule as the local launch: reciting zeros at someone whose only
  // work unit they erased reads as a failed run.
  if (records.length === 0 && erased.length > 0) {
    lines.push(
      `${erased.length === episodes.length ? 'Every one of them is' : `${erased.length} of them are`} ` +
      'erased. Nothing was rebuilt.',
    )
    lines.push(`\nRecords: ${projectPath}/.ursa/records/`)
    return lines.join('\n')
  }

  lines.push(`${verbatim.toLocaleString()} chars survived verbatim, ${mutated.toLocaleString()} survived edited.`)
  lines.push(
    `${humanDeleted.toLocaleString()} chars the person dropped, ` +
    `${mergeDeleted.toLocaleString()} destroyed by a merge inside the pull request, ` +
    `${unknownDeleted.toLocaleString()} with no readable cause.`,
  )

  // Which bound dropped what, in the local launch's own wording: the
  // reader of a terminal gets a flag and a value to type, not a label.
  if (dropped.belowMinChars > 0) {
    lines.push(
      `\n${plural(dropped.belowMinChars, 'work unit')} ` +
      `${dropped.belowMinChars === 1 ? 'was' : 'were'} found and not recorded, because ` +
      `${dropped.belowMinChars === 1 ? 'it' : 'they'} carried fewer than ` +
      `${dropped.minChars.toLocaleString()} generated characters, which is the --min-chars floor. ` +
      `The largest carried ${dropped.largestBelowFloor.toLocaleString()}, so --min-chars ` +
      `${dropped.largestBelowFloor} would record it.`,
    )
  }
  if (dropped.unresolvable > 0) {
    lines.push(
      `\n${plural(dropped.unresolvable, 'work unit')} resolved to nothing, with no import to state: ` +
      'the generated file was not readable at the final commit, or no path in it survived to be classified.',
    )
  }
  if (erased.length > 0) {
    lines.push(`\n${plural(erased.length, 'work unit')} you erased stayed erased.`)
  }

  lines.push(`\nRecords: ${projectPath}/.ursa/records/`)
  return lines.join('\n')
}
