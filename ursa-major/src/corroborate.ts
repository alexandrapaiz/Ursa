// Descent corroboration: a similarity score is not proof that the person
// edited this generation.
//
// `resolve()` Pass 2 takes the best-scoring generation segment above
// THETA_HIGH and labels the final span `survived_mutated`, attaching a
// word-level diff from the generation to the final text. CLAUDE.md §1
// sells that diff as the product's most distinctive object: "the mutation
// IS the correction, expressed as an edit rather than a complaint". Pass 2
// cannot establish it. All it has is that two strings are similar.
//
// The case that showed the difference (docs/ideas.md, 2026-10-02). Two
// agent branches each wrote a `formatItem` function and the human kept
// branch B's. Branch A's generation is the one in the record, and A's line
//
//     return `- ${item.title}: ${item.claim} — so what: ${why}`
//
// came back `survived_mutated` with a diff from A's line to B's line,
// presented as the human's correction. The text in the final file is B's,
// written by a different agent on a branch the human never edited. Nobody
// performed that diff. A lab training on it is training on an invented
// correction, which is worse than a missing label: a missing label costs
// one record, a fabricated one teaches the model something false.
//
// Tuning THETA_HIGH cannot fix it. Branch B's generation is not in the
// record at all, because `resolveEpisode` builds generations only from the
// episode's own `generatedSha`, so there is no rival candidate to
// tie-break against. The evidence that settles it is outside the record,
// and it is git.
//
// THE TEST. If the span's text is present verbatim in a commit that is NOT
// a descendant of the generation, then the text has a source other than
// editing this generation, and the mutation claim is dropped. Two
// relations qualify, both rivals:
//
//   pre_existing — the commit is an ancestor of the generation. The text
//     was in the file before the agent wrote. This is not a corner case on
//     the `ursa run` path, where a "generation" is the whole file blob at
//     the agent's commit and therefore contains everything the file
//     already held.
//   sibling — neither ancestor nor descendant. Another branch's work,
//     which the person merged or checked out rather than typed. The
//     branch-B case above.
//
// Descendants of the generation are excluded, and the exclusion is what
// makes the test usable rather than vacuous: `finalSha` is a descendant
// and its blob holds every final span by definition, so a test that did
// not exclude descendants would demote every mutation in every record.
//
// WHY IT IS A HOOK AND NOT A git CALL IN THE RESOLVER. `resolve()` is a
// pure function of its input, which is what lets the chat path
// (src/cli.ts) resolve pasted conversations with no repository anywhere.
// So the git lookup stays at the edge and is injected, exactly as
// `attributeDeletion` is (src/deletion.ts, wired in src/bin/ursa.ts).
// With no corroborator supplied, every above-threshold match is labelled
// `survived_mutated` as before, which is the correct reading for the chat
// path: there, the final file is the file on disk and the only text in
// evidence is the generation's.
//
// WHAT IT DOES WHEN IT CANNOT TELL. It says so, and the label stands. This
// is the opposite of src/deletion.ts's choice and the asymmetry is
// deliberate. There, silence defaulted toward blaming the person, so an
// unreadable boundary had to become `unknown`. Here, demoting on a hole in
// the clone would delete real correction signal — the scarcest thing in
// the artifact — on no evidence at all. So an unsearchable span keeps
// `survived_mutated` and carries `basis: 'unverified'` with the reason
// named, which is a fact about the clone rather than a claim about the
// person, and a buyer can filter on it.

import { blobLookup, commitsTouchingPath, type CommitInfo, type PathCommit } from './pairfinder'
import { normalize } from './normalize'
import { MIN_VERBATIM_LEN } from './match'
import type { DescentEvidence } from './types'

export interface DescentCorroborator {
  (filePath: string, spanText: string): DescentEvidence
}

/**
 * Rival commits read per path before the search gives up and says it was
 * capped. Each miss costs one `git show`, cached per (sha, path), so the
 * ceiling is 40 subprocesses for the first unmatched span of a path and
 * zero for every span after it. Chosen against this repository's own
 * history, where the most-touched file (`docs/ideas.md`) carries ~100
 * commits: 40 covers every sibling branch alive at once and stops short
 * of walking a year of ancestors to re-confirm a miss.
 */
export const MAX_RIVAL_BLOBS = 40

/** short sha, the length git itself abbreviates to */
const SHORT = 7

/**
 * Walk the commit graph outward from `generatedSha` in both directions.
 *
 * Both sets come from the `CommitInfo[]` the pair walk already produced,
 * so classifying a rival costs no subprocess at all. The alternative,
 * `git merge-base --is-ancestor` per candidate commit, is one process per
 * question and the questions are per (path, commit).
 *
 * Exported because src/vendored.ts asks the same question of a whole file
 * that this module asks of a span, and the answer is the same partition
 * of the graph. One definition of "outside this generation's descent"
 * keeps the file-level refusal and the span-level one from disagreeing.
 */
export function relatives(commits: CommitInfo[], generatedSha: string): {
  ancestors: Set<string>
  descendants: Set<string>
} {
  const parents = new Map<string, string[]>()
  const children = new Map<string, string[]>()
  for (const c of commits) {
    parents.set(c.sha, c.parents)
    for (const p of c.parents) {
      let arr = children.get(p)
      if (!arr) children.set(p, (arr = []))
      arr.push(c.sha)
    }
  }
  const reach = (edges: Map<string, string[]>): Set<string> => {
    const seen = new Set<string>()
    const queue = [...(edges.get(generatedSha) ?? [])]
    while (queue.length > 0) {
      const sha = queue.pop() as string
      if (seen.has(sha)) continue
      seen.add(sha)
      for (const next of edges.get(sha) ?? []) queue.push(next)
    }
    return seen
  }
  return { ancestors: reach(parents), descendants: reach(children) }
}

/**
 * Build a corroborator over one episode's generation commit.
 *
 * `commits` is `listCommits(projectPath)`, passed in rather than read
 * here: `ursa run` already walks the whole graph once to find pairs, and
 * one walk is enough to classify every rival of every episode.
 *
 * Blobs and path histories are read lazily and cached. A path's rival set
 * is enumerated on its first above-threshold span and reused for the
 * rest; a blob is read once per (sha, path) however many spans ask about
 * it.
 */
export function gitDescentCorroborator(
  projectPath: string,
  generatedSha: string,
  commits: CommitInfo[],
): DescentCorroborator {
  const { ancestors, descendants } = relatives(commits, generatedSha)

  /** rival commits for a path, newest first; null when git could not say */
  const rivalCache = new Map<string, PathCommit[] | null>()
  const rivalsFor = (filePath: string): PathCommit[] | null => {
    if (rivalCache.has(filePath)) return rivalCache.get(filePath) as PathCommit[] | null
    const touching = commitsTouchingPath(projectPath, filePath)
    const rivals = touching === null
      ? null
      : touching.filter((c) => c.sha !== generatedSha && !descendants.has(c.sha))
    rivalCache.set(filePath, rivals)
    return rivals
  }

  const blobCache = new Map<string, ReturnType<typeof blobLookup>>()
  const read = (sha: string, path: string) => {
    const key = `${sha}:${path}`
    let got = blobCache.get(key)
    if (!got) {
      got = blobLookup(projectPath, sha, path)
      blobCache.set(key, got)
    }
    return got
  }

  return (filePath, spanText) => {
    const needle = normalize(spanText).norm
    // The same floor the verbatim pass uses. Below it, containment in
    // another blob is coincidence: `return null` normalizes to eleven
    // characters and appears in every file in a TypeScript project, so a
    // shorter floor would demote every short edited line in the record.
    if (needle.length < MIN_VERBATIM_LEN) {
      return { basis: 'unverified', reason: 'span_too_short' }
    }

    const rivals = rivalsFor(filePath)
    if (rivals === null) {
      return { basis: 'unverified', reason: 'path_history_unreadable' }
    }

    let searched = 0
    let hole: string | null = null
    for (const c of rivals) {
      if (searched >= MAX_RIVAL_BLOBS) {
        // Nothing found in the commits that were read, and commits were
        // left unread. "No rival" would be a claim about the ones nobody
        // looked at.
        return { basis: 'unverified', reason: 'rival_search_capped' }
      }
      const got = read(c.sha, filePath)
      // A path git reported as touched can still be absent at a given
      // commit: the commit that deleted it touched it. That is a definite
      // answer and not a hole.
      if (got.kind === 'absent') continue
      if (got.kind === 'unreadable') {
        hole ??= c.sha
        continue
      }
      searched++
      if (!normalize(got.text).norm.includes(needle)) continue
      return {
        basis: 'rival',
        sha: c.sha.slice(0, SHORT),
        subject: c.subject,
        relation: ancestors.has(c.sha) ? 'pre_existing' : 'sibling',
      }
    }

    // A proven rival always beats a missing one, which is why the hole is
    // only reported after the whole set has been walked.
    if (hole !== null) {
      return { basis: 'unverified', reason: 'unreadable_blob', sha: hole.slice(0, SHORT) }
    }
    return { basis: 'corroborated', rivalsSearched: searched }
  }
}
