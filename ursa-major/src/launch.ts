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
//
// Two more were found later, by the same test, each on the day the option
// it concerns was added. They are listed here because `src/ci/run.ts`
// already cites this list by number and two of its citations pointed at
// entries that were never written down:
//
//   4. Who the person is. `--agent-identity` reached `ursa run` on
//      2026-10-11 and not `ursa ci`, so on any repository running agent
//      seats of its own the two launches disagreed about which commits
//      were a model's. Fixed in `src/ci/run.ts` and `action.yml`.
//   5. The pairing bounds. `--max-pair-distance`,
//      `--max-pair-age-hours` and `--max-interposed-generations` reached
//      `ursa run` and not `ursa ci`, so moving a bound changed one
//      launch's records and not the other's over identical history.
//      Found 2026-10-18 by resolving this repository's own history for
//      its own Pages site: at the default distance of 25 commits it
//      yields zero records and at 400 it yields two, because twelve agent
//      seats commit between one touch of a file by the owner and the
//      next. Fixed in `src/bin/ursa.ts` (`pairingBounds`),
//      `src/ci/run.ts` and `action.yml`.

import { isForgotten, loadConsent } from './consent'
import { checkRecord, formatViolations, type Violation } from './invariants'
import type { OutcomeRecord, PairingBounds } from './types'

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

/**
 * Write the bounds a walk ran under into every record that walk produced.
 *
 * Both launches owe this, and it is here rather than in each of them for
 * the reason the five entries at the top of this file exist: the pairing
 * bounds themselves reached one launch and not the other for seven days
 * (drift 5), and a stamp of those bounds written twice would be the same
 * defect one level down, where it is harder to see. A record whose
 * `pairedBy` is absent on one launch and present on the other, from
 * byte-identical history, would be a difference in the audit trail
 * rather than in a number, which is the kind a test is least likely to
 * catch and a buyer most likely to find.
 *
 * Not in `saveRecord` (src/store.ts), which is where the resolver stamp
 * and the bound-set stamp live, and the asymmetry is deliberate: those
 * two facts are properties of the running build and `saveRecord` can
 * read them from the process itself, while the pairing bounds are an
 * argument the caller chose. Passing them down to the store so the store
 * could stamp them would make every caller of `saveRecord` — including
 * `applyVerdict`, which re-saves a record and knows nothing about any
 * walk — carry a parameter only two callers can fill.
 *
 * Preserve, never overwrite, like both stamps in `saveRecord`: a record
 * loaded from disk and re-saved keeps the bounds its own walk used.
 *
 * One record at a time rather than the set, because both launches write
 * each record inside the loop that resolved it, so a stamp applied to
 * the finished set would be applied after the bytes were already on
 * disk.
 */
export function stampPairingBounds(record: OutcomeRecord, bounds: PairingBounds): void {
  if (!record.task.pairedBy) record.task.pairedBy = bounds
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
