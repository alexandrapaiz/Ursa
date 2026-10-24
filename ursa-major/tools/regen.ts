// The two generated artifacts a source edit under `ursa-major/src/` drags
// behind it, and the order they have to be regenerated in.
//
// WHY THIS FILE EXISTS. `ursa-major/dist/ursa.cjs` is committed, because
// `ursa-major/action.yml` runs `node "$GITHUB_ACTION_PATH/dist/ursa.cjs"`
// on a runner with no `npm install` step, and GitHub downloads an action
// as a tarball rather than cloning it. On every repository that is not
// this one, that file is the whole product. `docs/provenance/bundle-
// digests.json` and `.md` are the index that turns the sixteen-character
// `task.resolvedBy.digest` in a customer record back into a commit.
//
// So one edit to `src/` needs `npm run bundle` and then `npm run
// provenance:bundles`, and neither is named at the point where the edit
// happens. Measured on 2026-10-24: the commit inherited by PR #387 fixed
// `src/lifespan.ts` and left `dist/ursa.cjs` holding the previous
// resolver. Three tests caught it, all of them at the end of a 79-second
// full-suite run, and a seat that edits one module and runs only that
// module's tests — the normal and recommended thing to do — sees green.
//
// WHY IT IS NOT ONE COMMAND, which is what the ledger entry asked for.
// The two artifacts are functions of different things. The bundle is a
// function of the working tree, so it is rebuilt *before* the commit. The
// digest index is a function of committed history: `buildIndex` in
// `tools/bundle-digest-index.ts` walks `git log` over the bundle path, so
// a run of it before the bundle is committed cannot see the new digest
// and writes an index that drifts the moment the commit lands. Measured
// in this run: `npm run bundle && npm run provenance:bundles` on a dirty
// tree left both index files unchanged, and `npm run
// provenance:bundles:check` after committing the bundle printed
// `drifted: docs/provenance/bundle-digests.json`.
//
// So `regen` is a converging command rather than a single-shot one: run
// it, do what it says, run it again until it says `clean`. The states and
// the sentence each one prints are this file; the process spawning is
// `tools/make-regen.ts`.

/** The sixteen hex characters a record carries, from a full SHA-256. */
export const SHORT_DIGEST_LEN = 16

export interface RegenInputs {
  /** SHA-256 of `ursa-major/dist/ursa.cjs` as it sits in the working tree after the rebuild */
  rebuiltSha256: string
  /**
   * SHA-256 of the same path as `HEAD` holds it, or null when `HEAD` has
   * no such blob — a fresh repository, or a checkout of a commit from
   * before the bundle was committed at all.
   */
  headSha256: string | null
  /**
   * Why committed history cannot be read, from `historyUnavailable()` in
   * `tools/bundle-digest-index.ts`; null when it can. A shallow clone is
   * the case this reports, and `tools/ensure-full-clone.sh` is its repair.
   */
  historyBlocked: string | null
  /**
   * Repo-relative paths of the index files that differ from what history
   * says, as `make-bundle-digest-index.ts --check` reports them. Empty
   * when the index is current. Only consulted once the bundle matches
   * `HEAD`, because before that the index is *expected* to disagree.
   */
  indexDrifted: readonly string[]
}

export type RegenState =
  /** the bundle in the tree is not the bundle in HEAD: commit it, then run again */
  | 'bundle-rebuilt'
  /** the bundle matches HEAD and the index is stale: it has been rewritten, commit it */
  | 'index-rewritten'
  /** the bundle matches HEAD and history cannot be read, so the index cannot be judged */
  | 'index-unverifiable'
  /** both artifacts agree with the commit they describe; nothing to do */
  | 'clean'

export interface RegenStep {
  state: RegenState
  /**
   * What the reader is told, in one or two sentences, naming the next
   * literal command when there is one. Never a bare status word: the
   * whole defect this tool addresses was a step nobody was told to take.
   */
  message: string
  /** true when another `npm run regen` is expected after the reader acts */
  runAgain: boolean
}

const short = (sha: string) => sha.slice(0, SHORT_DIGEST_LEN)

/**
 * Which of the four states the repository is in, and what to say about
 * it. Pure, so `src/regen.test.ts` can assert the whole table without a
 * build, a git repository or a clock.
 */
export function regenStep(input: RegenInputs): RegenStep {
  if (input.headSha256 === null || input.rebuiltSha256 !== input.headSha256) {
    const held = input.headSha256 === null
      ? 'HEAD has no committed bundle at that path'
      : `HEAD holds ${short(input.headSha256)}`
    return {
      state: 'bundle-rebuilt',
      message:
        `dist/ursa.cjs now holds ${short(input.rebuiltSha256)} and ${held}. ` +
        'Commit the bundle with the source change it belongs to, then run `npm run regen` ' +
        'again: the digest index is built from committed history and cannot see this build yet.',
      runAgain: true,
    }
  }
  if (input.historyBlocked !== null) {
    return {
      state: 'index-unverifiable',
      message:
        `dist/ursa.cjs matches HEAD (${short(input.rebuiltSha256)}), and the digest index was ` +
        `left alone because ${input.historyBlocked}. Repair the checkout with ` +
        '`bash tools/ensure-full-clone.sh`, then run `npm run regen` again.',
      runAgain: true,
    }
  }
  if (input.indexDrifted.length > 0) {
    return {
      state: 'index-rewritten',
      message:
        `dist/ursa.cjs matches HEAD (${short(input.rebuiltSha256)}), and ` +
        `${input.indexDrifted.join(' and ')} ${input.indexDrifted.length === 1 ? 'was' : 'were'} ` +
        'rewritten to match. Commit them; nothing else is pending.',
      runAgain: false,
    }
  }
  return {
    state: 'clean',
    message:
      `clean: dist/ursa.cjs matches HEAD (${short(input.rebuiltSha256)}) and the digest index ` +
      'matches history. Nothing to regenerate.',
    runAgain: false,
  }
}
