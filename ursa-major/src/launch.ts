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
//   6. Why a work unit was dropped. The first drift that runs the other
//      way: `ursa ci` has counted its two drop reasons since 2026-10-08
//      and names them in the pull-request comment, and `ursa run` counted
//      nothing and printed `1 work unit found, 0 resolved into records.`
//      So the launch a person types was the one that could not say which
//      bound to move, and the two surfaces could not be compared at all
//      because only one of them held a number. Found 2026-10-24 by
//      resolving two three-commit fixtures locally and getting
//      byte-identical output from a unit below the size floor and a unit
//      whose generated file was deleted. Fixed in `DroppedUnits` and
//      `keepRecord` below, read by `src/bin/ursa.ts` and `src/ci/run.ts`.
//   7. Why a generation never became a work unit. The stage above drift 6,
//      and it runs back the original way. `ursa run` has printed the
//      pairing walk's abandonment tally since the bounds shipped; `ursa
//      ci` called `findCommitPairs`, which is
//      `findCommitPairsWithDiagnostics(...).pairs`, so the runner computed
//      all four counts and discarded them on the same line. With none in
//      hand, the pull-request comment had one explanation for a window
//      that resolved nothing and asserted it unconditionally: `no commit
//      here carried an agent marker that a later human commit then
//      edited`. Found 2026-10-25 by resolving `distantFixture` through
//      both launches at `--max-pair-distance 2`, where a pair exists, is
//      abandoned by the distance bound, and that sentence is false in
//      every clause. Fixed in `PairRefusal` and `pairRefusals` below,
//      read by `src/bin/ursa.ts` and `src/ci/comment.ts`.
//   8. Whether the window could have held a pair at all. Drift 7 one step
//      further out, and the first of these eight that is not about a
//      number one launch held and the other did not. Both launches had
//      `diagnostics.commitsScanned` and only `ursa run` printed it, and
//      neither of them read it. So on a window of one commit, where a
//      pairing is impossible by construction because it needs a
//      generation and a LATER commit that edits the same file, both
//      surfaces answered the question as though the window had been big
//      enough and the history had come up empty. Found 2026-10-25 by
//      resolving `editedFixture` with the merge window's base at `HEAD~1`
//      instead of `HEAD~2`: `commitsScanned` is 1, every `abandoned`
//      count is 0, and the comment reads `no commit here carried an agent
//      marker that a later human commit then edited` about a history
//      whose generation is one commit behind the base. A squash merge is
//      the common case, since it collapses a whole branch into one commit
//      and `src/ci/window.ts` already degrades the window to it and says
//      so in `windowNote`. Fixed in `PAIR_MINIMUM_COMMITS` and
//      `windowTooSmallForAPair` below, read by `src/bin/ursa.ts` and
//      `src/ci/comment.ts`.

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

/**
 * Why the work units a launch found did not become records.
 *
 * Both launches drop a resolved episode for exactly two reasons, and they
 * used to count them in two places: `src/ci/run.ts` kept this tally and
 * put it in the pull-request comment, and `src/bin/ursa.ts` kept none at
 * all and printed `1 work unit found, 0 resolved into records.` That is
 * drift 6 at the top of this file, and it is the one drift so far that
 * runs the other way, with the runner's surface ahead of the one a person
 * types.
 *
 * Measured on 2026-10-24, on two three-commit fixtures a few lines apart:
 * a pair whose generation is below the floor, and a pair whose generated
 * file the human then deleted, produce byte-identical local output. One
 * needs a flag and the other needs nothing, and the terminal cannot tell
 * the two apart.
 *
 * The counting is shared; the wording is not. A terminal and a markdown
 * comment are different surfaces and already say the same facts
 * differently everywhere else in this codebase. What can silently
 * diverge into a WRONG NUMBER — which episode counts as which kind of
 * drop — is decided once, in `keepRecord` below. That both surfaces name
 * the same flag is pinned by a test instead
 * (`src/launch-parity.test.ts`).
 */
export interface DroppedUnits {
  /** units `resolveEpisode` returned nothing for, with no exclusion to state */
  unresolvable: number
  /** units whose generation side was smaller than the `--min-chars` floor */
  belowMinChars: number
  /** the floor those units fell under, so the reader can raise it */
  minChars: number
  /**
   * The biggest generation side among the units the floor dropped, in
   * characters, or 0 when it dropped none.
   *
   * Carried so the remedy can name a value rather than a placeholder. The
   * run already knows this number and withholding it is what made the
   * fix two guesses instead of one: `--min-chars 1` was the second guess,
   * and `--min-chars <this>` is the smallest value that would have
   * recorded something. It is not part of the CI comment's own `dropped`
   * shape (`src/ci/comment.ts`), which predates it and compares
   * structurally, so passing this richer object to it needs no change
   * there.
   */
  largestBelowFloor: number
}

export function newDroppedUnits(minChars: number): DroppedUnits {
  return { unresolvable: 0, belowMinChars: 0, minChars, largestBelowFloor: 0 }
}

/**
 * Is this resolved episode one to write, and if not, which bound dropped it?
 *
 * The two `continue`s both launches had, written once. Returns false and
 * records the reason in `dropped`, so a caller's loop is
 * `if (!keepRecord(record, minChars, dropped)) continue` and the decision
 * and its label cannot be made in one place and counted in another.
 *
 * A type predicate because the caller needs the non-null narrowing the
 * `if (!record)` it replaces used to give it.
 */
export function keepRecord(
  record: OutcomeRecord | null,
  minChars: number,
  dropped: DroppedUnits,
): record is OutcomeRecord {
  if (!record) {
    dropped.unresolvable++
    return false
  }
  if (!clearsSizeFloor(record, minChars)) {
    dropped.belowMinChars++
    dropped.largestBelowFloor = Math.max(
      dropped.largestBelowFloor,
      record.stats.generated.totalChars,
    )
    return false
  }
  return true
}

/**
 * Why a generation never reached the episode builder at all.
 *
 * Drift 7, and the stage above `keepRecord`. `DroppedUnits` counts work
 * units that were built and then refused; this counts generations that
 * were found, walked forward from, and abandoned before any work unit
 * existed, because the walk hit one of its three pairing bounds
 * (`findCommitPairsWithDiagnostics` in src/pairfinder.ts, which has
 * tallied them under `diagnostics.abandoned` since the bounds shipped).
 *
 * It is shared for the same reason the drop tally is, and the asymmetry
 * that made it necessary is the mirror image of drift 6's. There the
 * runner held a number the terminal did not. Here the terminal rendered
 * `diagnostics.abandoned` from its own `findCommitPairsWithDiagnostics`
 * call and `src/ci/run.ts` called `findCommitPairs`, which is literally
 * `findCommitPairsWithDiagnostics(...).pairs`, so the runner COMPUTED
 * every one of these counts and then discarded them one line later.
 *
 * What the discard cost is not a missing number. With no abandonment
 * tally in hand, `emptyWindowSentence` in src/ci/comment.ts had one
 * explanation available for a window that resolved nothing and asserted
 * it unconditionally: "no commit here carried an agent marker that a
 * later human commit then edited." On a history where a pair was found
 * and then abandoned by `--max-pair-distance`, every clause of that
 * sentence is false. A commit carried the marker, a later human commit
 * did edit the same file, and the walk declined to reach that far. That
 * failure mode is already written down one stage lower, in
 * `RunCommentContext.dropped`'s own docstring, which records a run on
 * 2026-10-08 printing the same sentence beside `units-found=1`. The
 * repair applied then covered the `unitsFound > 0` branch; this stage
 * lands in the `unitsFound === 0` branch, because a generation abandoned
 * by a bound produces no work unit to count.
 *
 * Why it matters on real history rather than only on a fixture: drift 5
 * measured this repository at zero records under the default distance of
 * 25 and two records at 400, because twelve agent seats commit between
 * one touch of a file by the owner and the next. Every merge on a
 * repository shaped like that one gets the sentence above, which tells
 * the owner her agents never wrote anything she edited.
 */
export interface PairRefusal {
  /** the `abandoned` key this came from, so a caller can switch on it */
  bound: 'distance' | 'age' | 'interposedGeneration' | 'notDescendant'
  /** generations the bound stopped, counted by whichever bound stopped first */
  count: number
  /**
   * The flag that moves this bound, or null when no flag can.
   *
   * `notDescendant` is the null: the only edit found was on a branch the
   * generation is not an ancestor of, which is a fact about the commit
   * graph rather than a reach a caller can widen. Null rather than
   * omitted so a surface that prints a remedy has to handle the case
   * where there is none, instead of printing one flag's name for four
   * reasons.
   */
  flag: '--max-pair-distance' | '--max-pair-age-hours' | '--max-interposed-generations' | null
  /** the resolved value this walk ran under, or null where `flag` is null */
  limit: number | null
}

export interface PairRefusals {
  /** every refusal above, summed; zero when the walk abandoned nothing */
  total: number
  /** only the non-zero reasons, in the order a reader should read them */
  refusals: PairRefusal[]
}

/**
 * The abandonment tally both launches report, read off one walk's diagnostics.
 *
 * Takes the two diagnostic fields it needs rather than the whole
 * `PairFinderDiagnostics`, so `src/ci/comment.ts` can hold this type in
 * its context without importing the pair finder, and so a test can build
 * an input by hand.
 *
 * ORDER IS PART OF THE CONTRACT, and it is not the declaration order of
 * `abandoned`. `interposedGeneration` comes first because it is the one
 * refusal that is not a reach limit: the file WAS edited in range, by a
 * later generation, so the person's edit corrected that generation and
 * not this one. Raising that bound makes the walk claim a correction it
 * can see belongs to someone else, which is the opposite of what raising
 * the other two does. A reader shown the cheap fixes first would move
 * the wrong flag.
 */
export function pairRefusals(diagnostics: {
  abandoned: { distance: number; age: number; interposedGeneration: number; notDescendant: number }
  bounds: { maxPairDistance: number; maxPairAgeHours: number; maxInterposedGenerations: number }
}): PairRefusals {
  const { abandoned, bounds } = diagnostics
  const all: PairRefusal[] = [
    {
      bound: 'interposedGeneration',
      count: abandoned.interposedGeneration,
      flag: '--max-interposed-generations',
      limit: bounds.maxInterposedGenerations,
    },
    {
      bound: 'distance',
      count: abandoned.distance,
      flag: '--max-pair-distance',
      limit: bounds.maxPairDistance,
    },
    {
      bound: 'age',
      count: abandoned.age,
      flag: '--max-pair-age-hours',
      limit: bounds.maxPairAgeHours,
    },
    { bound: 'notDescendant', count: abandoned.notDescendant, flag: null, limit: null },
  ]
  const refusals = all.filter((r) => r.count > 0)
  return { total: refusals.reduce((n, r) => n + r.count, 0), refusals }
}

/**
 * The fewest commits a window can hold and still be able to produce one
 * pairing: two.
 *
 * A pairing is a generation commit plus a LATER commit that edits the same
 * file (`findCommitPairsWithDiagnostics` in src/pairfinder.ts). "Later" is
 * the whole of it. One commit cannot be later than itself, so a window of
 * one commit holds no pairing whatever that commit contains, and a window
 * of none holds no pairing for the same reason with nothing to inspect.
 *
 * A constant and not the literal `2`, because this is the one number in
 * drift 8 that both surfaces assert to a reader, and the two sentences
 * that carry it are written separately on purpose (drift 6's rule above:
 * a markdown comment and a terminal are different surfaces, and only the
 * NUMBER has to match between them). A literal in each file is how the
 * two come to disagree.
 */
export const PAIR_MINIMUM_COMMITS = 2

/**
 * Could this window have produced a pairing at all?
 *
 * Takes the commit count the walk itself scanned
 * (`PairFinderDiagnostics.commitsScanned`), which is the number of commits
 * in the range the caller handed it, so the answer is about the window the
 * resolver actually read rather than about the range string it was given.
 *
 * This is drift 8. Both launches held this count and neither asked this
 * question, so both reported an empty window the same way whether the
 * window was big enough to answer or not. The distinction matters because
 * the two states call for opposite actions: a history that carries no
 * agent markers is a question about commit trailers, and a window too
 * small to hold a pair is a question about the merge, usually a squash.
 * Telling a reader the first when the second is true sends them to fix
 * their trailers, which are fine.
 *
 * `true` is not a failure and callers must not treat it as one. It is the
 * reason a zero is uninformative, which is a different claim from the zero
 * being wrong.
 */
export function windowTooSmallForAPair(commitsScanned: number): boolean {
  return commitsScanned < PAIR_MINIMUM_COMMITS
}
