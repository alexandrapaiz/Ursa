// Deletion attribution: when a generation's text is gone from the final
// blob, decide what destroyed it.
//
// The resolver can only see that text is absent. Absence has three
// causes and the first two mean opposite things:
//
//   human_edit — the person had the text in front of them and did not
//     keep it. This is signal. It is the `generated_deleted` label
//     Ursa Minor sells (CLAUDE.md §1).
//
//   merge — a merge commit between the generation and the final commit
//     resolved the file to something that does not contain the text. A
//     merge brings in another branch's work; nobody read this text and
//     rejected it. Counting it as a discard is a false positive in the
//     load-bearing label, and it also names the wrong person, because
//     the pair's finalAuthor is whoever made the later unrelated commit.
//
//   unknown — a merge sat on this boundary and the evidence that would
//     decide between the two above could not be read from this clone.
//
// The merge test is the same containment primitive the resolver's
// verbatim pass uses to judge survival, run against two trees instead of
// one: text present in a parent of the merge and absent from the merge's
// own result was destroyed by that merge. It is deliberately
// conjunctive, so a span has to disappear exactly at a merge boundary to
// earn the `merge` label.
//
// What the conjunction used to do when it could not run is the defect
// this module now fixes. `blobAt` returned null both for "the commit is
// here and the path is not in its tree", a definite answer, and for "the
// commit object is missing from this clone", no answer at all. A
// shallow clone, a fork whose head is not fetched, or a branch deleted
// after merge all produced the second, the containment check silently
// read false, and the span fell through to `human_edit`. So the label
// that is supposed to be the person's own correction absorbed every
// hole in the repository, and the direction of the error was always the
// same: toward blaming the person. `blobLookup` (src/pairfinder.ts)
// splits those two cases apart, and an unreadable boundary now yields
// `unknown` with the reason named, which is a fact about the clone
// rather than a claim about the person.
//
// `unknown` never wins over a confident `merge`: the scan keeps walking
// later merges after it finds a hole, and only returns the hole if no
// merge on the boundary can be shown to have destroyed the text.

import { blobLookup, type MergeEvent } from './pairfinder'
import { normalize } from './normalize'
import type { DeletionAttribution, UnknownDeletionReason } from './types'

export interface DeletionAttributor {
  (filePath: string, spanText: string): DeletionAttribution
}

export interface DeletionAttributorOptions {
  /**
   * Shas of merges known to sit on this episode's boundary whose
   * parentage could not be read anywhere, so they never became
   * `MergeEvent`s and their paths were never compared
   * (`PullRequestProvenance.unreadableMerges`). Any deletion that no
   * readable merge explains is `unknown` while one of these is
   * outstanding, because the merge that would explain it is exactly the
   * one this run cannot see.
   */
  unreadableMerges?: string[]
}

const HUMAN: DeletionAttribution = { cause: 'human_edit' }

/** short sha, the length git itself abbreviates to */
const SHORT = 7

function unknown(
  reason: UnknownDeletionReason,
  merge: { sha: string; subject?: string },
): DeletionAttribution {
  return {
    cause: 'unknown',
    unknownReason: reason,
    mergeSha: merge.sha.slice(0, SHORT),
    ...(merge.subject ? { mergeSubject: merge.subject } : {}),
  }
}

/**
 * Build an attributor over one episode's intervening merges.
 *
 * Blobs are read lazily and cached per (sha, path): a generation has
 * many deleted spans but only a handful of distinct trees to check, so
 * the cost is a few `git show` calls per episode, not one per span.
 */
export function gitDeletionAttributor(
  projectPath: string,
  merges: MergeEvent[],
  opts: DeletionAttributorOptions = {},
): DeletionAttributor {
  const blind = opts.unreadableMerges ?? []
  // Nothing readable to test and nothing unreadable to worry about: the
  // only remaining cause is the person, and that is a real answer.
  if (merges.length === 0 && blind.length === 0) return () => HUMAN

  // A merge whose commit object is absent from the clone cannot be
  // tested at all, so no span on this boundary can be called a discard.
  const blindFallback = blind.length > 0
    ? unknown('unreadable_merge_commit', { sha: blind[0] })
    : HUMAN

  const lookups = new Map<string, ReturnType<typeof blobLookup>>()
  const read = (sha: string, path: string) => {
    const key = `${sha}:${path}`
    let got = lookups.get(key)
    if (!got) {
      got = blobLookup(projectPath, sha, path)
      lookups.set(key, got)
    }
    return got
  }
  /** Normalized containment, three-state like the read it is built on. */
  const holds = (sha: string, path: string, needle: string): boolean | 'unreadable' => {
    const got = read(sha, path)
    if (got.kind === 'unreadable') return 'unreadable'
    if (got.kind === 'absent') return false
    return normalize(got.text).norm.includes(needle)
  }

  return (filePath, spanText) => {
    const needle = normalize(spanText).norm
    if (needle.length === 0) return HUMAN

    // The first hole found, returned only if no later merge explains the
    // deletion outright. A proven cause always beats a missing one.
    let pending: DeletionAttribution | null = null

    for (const m of merges) {
      if (!m.paths.includes(filePath)) continue

      const after = holds(m.sha, filePath, needle)
      // Still present after this merge: it was not this merge's doing.
      if (after === true) continue

      // Parentage is what makes the merge test a test. A MergeEvent with
      // none is a merge nobody could read the other side of, so it rules
      // nothing in and nothing out.
      if (m.parents.length === 0) {
        pending ??= unknown('unreadable_merge_parents', m)
        continue
      }

      const parentHolds = m.parents.map((p) => holds(p, filePath, needle))
      if (parentHolds.some((h) => h === true)) {
        if (after === 'unreadable') {
          // Half the conjunction. A parent had the text, but whether the
          // merge's own result kept it cannot be read, so the merge is
          // not shown to have destroyed anything.
          pending ??= unknown('unreadable_merge_result', m)
          continue
        }
        // Gone after the merge and present in a parent: the merge did it.
        return {
          cause: 'merge',
          mergeSha: m.sha.slice(0, SHORT),
          mergeSubject: m.subject,
        }
      }

      // No parent is known to have held it. If a parent could not be
      // read, "was it ever there to destroy" is unanswered.
      if (parentHolds.some((h) => h === 'unreadable')) {
        pending ??= unknown('unreadable_merge_parents', m)
        continue
      }
      // Every parent readable and none held it: the text was already
      // gone before this merge, so this merge is not the cause. Keep
      // walking; a later merge may still be.
    }

    return pending ?? blindFallback
  }
}
