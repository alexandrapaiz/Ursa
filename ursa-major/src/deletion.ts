// Deletion attribution: when a generation's text is gone from the final
// blob, decide what destroyed it.
//
// The resolver can only see that text is absent. Absence has two causes
// and they mean opposite things:
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
// The test is the same containment primitive the resolver's verbatim
// pass uses to judge survival, run against two trees instead of one:
// text present in a parent of the merge and absent from the merge's own
// result was destroyed by that merge. Deliberately conjunctive — a span
// has to disappear exactly at a merge boundary to earn the `merge`
// label, so the default stays `human_edit` and the signal Ursa sells is
// never diluted by a guess.

import { blobAt, type MergeEvent } from './pairfinder'
import { normalize } from './normalize'
import type { DeletionAttribution } from './types'

export interface DeletionAttributor {
  (filePath: string, spanText: string): DeletionAttribution
}

const HUMAN: DeletionAttribution = { cause: 'human_edit' }

/** short sha, the length git itself abbreviates to */
const SHORT = 7

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
): DeletionAttributor {
  if (merges.length === 0) return () => HUMAN

  const blobs = new Map<string, string | null>()
  const normalizedBlob = (sha: string, path: string): string | null => {
    const key = `${sha}:${path}`
    if (!blobs.has(key)) {
      const raw = blobAt(projectPath, sha, path)
      blobs.set(key, raw === null ? null : normalize(raw).norm)
    }
    return blobs.get(key)!
  }
  const holds = (sha: string, path: string, needle: string): boolean => {
    const hay = normalizedBlob(sha, path)
    return hay !== null && hay.includes(needle)
  }

  return (filePath, spanText) => {
    const needle = normalize(spanText).norm
    if (needle.length === 0) return HUMAN
    for (const m of merges) {
      if (!m.paths.includes(filePath)) continue
      // Still present after this merge: it was not this merge's doing.
      if (holds(m.sha, filePath, needle)) continue
      // Gone after the merge. If any parent had it, the merge dropped it.
      if (m.parents.some((p) => holds(p, filePath, needle))) {
        return {
          cause: 'merge',
          mergeSha: m.sha.slice(0, SHORT),
          mergeSubject: m.subject,
        }
      }
    }
    return HUMAN
  }
}
