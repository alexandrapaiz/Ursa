// The decisions both launches must make identically.
//
// `ursa run` (src/bin/ursa.ts, typed by a person against a finished
// project) and `ursa ci` (src/ci/run.ts, fired by a merged pull request on
// a runner) are sold as one resolver fired two ways. That claim is the
// whole premise of the Action surface: a lab auditing a record made in CI
// is auditing the local resolver's behaviour or it is auditing nothing.
//
// `src/resolve-episode.ts` is the shared middle of that claim and has been
// since the 2026-10-08 reconciliation. This module is the shared edges:
// the three questions each launch asks AROUND the resolve step, which were
// written twice and had drifted apart by three answers. In the idiom this
// repository already uses for `src/intervals.ts` (one definition of how
// many characters a set of extents covers) and `src/text.ts` (one
// definition of a quoted excerpt), each is written once here and imported
// by both callers, so a future divergence has to be an edit to this file
// rather than an omission in one of two places.
//
// What drifted, measured 2026-10-10 by resolving one fixture repository
// through both launches and diffing the records (src/launch-parity.test.ts):
//
//   1. The size floor. `ursa run` exempts a refusal-only record from
//      `--min-chars`; `ursa ci` did not, so the one record whose entire
//      job is to make an absence state itself was dropped by a threshold
//      aimed at something else. See `clearsSizeFloor`.
//   2. The self-check. `ursa run` runs `src/invariants.ts` over every
//      record it wrote and exits non-zero on a violation; `ursa ci` ran no
//      check at all, so an arithmetically impossible record was posted to
//      a pull request as five confident fields. See `gateRecords`.
//   3. Erasure. `ursa run` skips an episode the user erased, because every
//      episode is rebuilt from git history and a deletion that the next
//      run undoes is not a deletion; `ursa ci` rebuilt it. See
//      `erasedEpisodeIds`.

import { isForgotten, loadConsent } from './consent'
import { checkRecord, formatViolations, type Violation } from './invariants'
import type { OutcomeRecord } from './types'

/**
 * Is this resolved record big enough to be worth writing?
 *
 * `--min-chars` exists because a survival percentage taken over a handful
 * of generated characters is noise, and it is measured on the generation
 * side. A refusal-only record has no generation side at all: every
 * resolvable path in its episode was an import, so it carries no files, no
 * generations and one `exclusions` entry naming the commit the finished
 * file came from (`src/resolve-episode.ts`, `docs/design/record-exclusions.md`).
 * Measuring that record against a generation-side floor always drops it,
 * and dropping it restores exactly the silence it was built to replace: an
 * absent file in `.ursa/records/` is indistinguishable from a run that
 * found no work.
 *
 * So the floor is asked of the generation side when there is one, and the
 * refusal is kept when there is not.
 */
export function clearsSizeFloor(record: OutcomeRecord, minChars: number): boolean {
  if (record.stats.generated.totalChars >= minChars) return true
  return (record.exclusions?.length ?? 0) > 0
}

/**
 * Which of this project's episode ids the user has erased.
 *
 * Erasure has to survive re-derivation. Every episode either launch
 * resolves was rebuilt from git history, which is still on the machine
 * after `ursa forget` ran, so a launch that does not consult the consent
 * record recreates the record the user deleted. That is not deletion, and
 * constraint 2 of this project (`README.md`) says the user can always
 * delete what has been inferred about them.
 *
 * Returns a set rather than a predicate so a caller reads the consent file
 * once per run instead of once per episode.
 */
export function erasedEpisodeIds(projectPath: string, episodeIds: string[]): Set<string> {
  const consent = loadConsent(projectPath)
  return new Set(episodeIds.filter((id) => isForgotten(consent, id)))
}

export interface GateResult {
  violations: Violation[]
  /**
   * What to print when there are any: the count, the reason the records
   * were still written, and both sides of every number that broke. Empty
   * string when the gate passed, so a caller can print it unconditionally.
   */
  report: string
}

/**
 * The record's self-check, run over everything a launch just wrote.
 *
 * Fifteen bounds a record must satisfy (`src/invariants.ts`). The records
 * are written BEFORE this runs, in both launches, and that order is the
 * point: a record whose arithmetic is impossible is still the evidence of
 * the defect, so nothing is withheld from the user. What changes is that
 * the run stops reporting success.
 *
 * Not behind a flag in either launch. The defect this exists for survived
 * six records, four open pull requests and 344 passing tests, and an
 * opt-in check would have been off for all of them.
 */
export function gateRecords(records: OutcomeRecord[]): GateResult {
  const violations = records.flatMap((r) => checkRecord(r))
  if (violations.length === 0) return { violations, report: '' }
  const plural = violations.length === 1 ? '' : 's'
  return {
    violations,
    report:
      `${violations.length} record invariant${plural} violated. The records are written and are ` +
      'still the evidence, but the numbers above cannot all be true at once, so this run is not ' +
      `reporting success.\n${formatViolations(violations)}`,
  }
}
