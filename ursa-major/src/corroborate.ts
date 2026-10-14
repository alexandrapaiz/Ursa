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
// editing this generation, and the mutation claim is dropped. Three
// relations qualify, all rivals:
//
//   prior_revision — the commit is the generation's own PARENT. The file
//     already held the text when the agent opened it. This is not a corner
//     case on the `ursa run` path, where a "generation" is the whole file
//     blob at the agent's commit and therefore contains everything the
//     file already held.
//   pre_existing — an older ancestor holds the text and the parent does
//     not: the generation replaced text an earlier commit had and the
//     person put the earlier text back.
//   sibling — neither ancestor nor descendant. Another branch's work,
//     which the person merged or checked out rather than typed. The
//     branch-B case above.
//
// WHY THE PARENT IS CHECKED FIRST, AND SEPARATELY (added 2026-10-14).
// Until today this module had two relations, and `pre_existing` carried
// both the parent case and the restore. It reported whichever rival
// `git log --all` listed first, newest-first, so a span whose text sits
// both in the parent revision and on a parallel branch came back
// `sibling`. The relation a record carried was therefore partly an
// artifact of log ordering, and the parent case — the only one that
// settles whether the model contributed the text at all — was the one most
// often hidden by it. `tools/measure-verbatim-descent.ts` measured the
// gap over this repository's own history: the old search called 505 spans
// `pre_existing`, while the parent blob actually held 719 of the 1,024
// verbatim spans, 110,736 of 139,105 characters.
//
// So the parent blob is read before the walk. It is one `git show` per
// (parent, path), cached, which is cheaper than the walk it short-circuits,
// and its answer does not depend on the order of anything.
//
// WHY A RIVAL CAN BE TOO NEW TO BE A RIVAL (added 2026-10-14).
// `sibling` claims the person "merged or checked out rather than typed"
// the text, and that claim requires the other branch's commit to have
// existed while the person was working. Until today nothing here looked
// at time at all, so a commit authored after the episode ended could be
// named as the source of text the episode had already finished. It
// happened on a shipped record: `ursa-2026-10-07-2f610e9` named rival
// `510a55a`, authored 2026-10-14 on an unmerged branch, as holding text
// in a file whose work closed on 2026-10-07 (docs/ideas.md, 2026-10-14).
// Seven spans over 298 characters, so 0.2% of verbatim characters: a
// correctness defect rather than a load-bearing figure, and it corrupts
// the one relation that carries a claim about what the person did.
//
// The bound is `horizonSha`, the episode's `finalSha`. The boundary is
// the episode's LAST commit and not its first, because a person can
// legitimately branch mid-episode, write text elsewhere and bring it in;
// only work authored after they finished is unambiguously not a source.
//
// Two things make this narrower than "compare the dates":
//
//   The graph is asked first and the clock only answers what the graph
//   cannot. A commit that is an ancestor of the generation, or an
//   ancestor of the horizon, demonstrably existed by then whatever its
//   author date says, and rebases and clock skew make author dates lie
//   in exactly that direction. So the time bound applies only to a
//   candidate whose position neither reaches — which is precisely the
//   `sibling` set, the only relation the defect could reach.
//
//   An unknown date never drops a rival. A candidate missing from
//   `commits` (a caller that passed a narrowed range), an unparseable
//   date, or an absent horizon all leave the candidate in the search,
//   because dropping it would silently promote a span on no evidence.
//
// This is the one place the module trusts a timestamp instead of the
// commit graph, and a rewritten history can therefore lie to it: a
// sibling rebased to an older author date gets searched again. That is
// the safe direction, since being searched is the old behaviour.
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
/**
 * @param horizonSha the episode's `finalSha`: the last commit of the work
 *   this generation belongs to. A candidate rival authored after it, and
 *   reachable from neither the generation's history nor the horizon's,
 *   did not exist while the person was working and is dropped from the
 *   search. Omitted means no horizon is known — the chat path, and the
 *   unit tests that ask about one span — and then every candidate is in
 *   the running, which is this function's behaviour before 2026-10-14.
 */
export function gitDescentCorroborator(
  projectPath: string,
  generatedSha: string,
  commits: CommitInfo[],
  horizonSha?: string,
): DescentCorroborator {
  const { ancestors, descendants } = relatives(commits, generatedSha)
  // The generation's own parents, read off the graph the pair walk already
  // produced rather than asked of git again. Plural because a merge has
  // several; a hit in any of them means the text was present on at least
  // one side of the work this generation started from. Empty for a root
  // commit, which correctly makes `prior_revision` unreachable: a root
  // commit's blob is the first version of the file, so nothing preceded it.
  const parent = commits.find((c) => c.sha === generatedSha)
  const parents = parent?.parents ?? []
  const parentSubject = new Map(commits.map((c) => [c.sha, c.subject]))

  // The horizon, in epoch milliseconds. `Date.parse` and not a string
  // compare: `listCommits` reads author dates with `--date=iso-strict`,
  // which carries each author's own UTC offset, so `2026-10-14T00:26:39Z`
  // sorts before `2026-10-13T23:00:00-07:00` as text while being two
  // hours after it in fact.
  const authorMs = new Map(commits.map((c) => [c.sha, Date.parse(c.date)]))
  const horizonMs = horizonSha === undefined ? NaN : (authorMs.get(horizonSha) ?? NaN)
  // Ancestors of the horizon, which are not in general ancestors of the
  // generation: a branch merged into this episode between `generatedSha`
  // and `finalSha` is a sibling of the generation and still demonstrably
  // existed before the person finished. Computed from the same in-memory
  // graph, so it costs one more walk of a map and no subprocess.
  const horizonAncestors = Number.isNaN(horizonMs)
    ? new Set<string>()
    : relatives(commits, horizonSha as string).ancestors
  /** authored after the person finished, so it cannot be where the text came from */
  const afterHorizon = (sha: string): boolean => {
    if (Number.isNaN(horizonMs)) return false
    if (ancestors.has(sha) || horizonAncestors.has(sha)) return false
    const ms = authorMs.get(sha)
    if (ms === undefined || Number.isNaN(ms)) return false
    return ms > horizonMs
  }

  /** rival commits for a path, newest first; null when git could not say */
  const rivalCache = new Map<string, PathCommit[] | null>()
  const rivalsFor = (filePath: string): PathCommit[] | null => {
    if (rivalCache.has(filePath)) return rivalCache.get(filePath) as PathCommit[] | null
    const touching = commitsTouchingPath(projectPath, filePath)
    const rivals = touching === null
      ? null
      : touching.filter((c) => c.sha !== generatedSha
        && !descendants.has(c.sha)
        // Dropped before any blob is read, like the descendant exclusion
        // above and for the same reason: a commit that cannot be the
        // source should not cost a `git show`, and it must not consume a
        // slot against MAX_RIVAL_BLOBS, or a burst of later branch work
        // on a busy path would push the real rivals past the cap.
        && !afterHorizon(c.sha))
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

    // The parent, before the walk. A hit here is the strongest statement
    // this module can make and the only one that demotes a verbatim claim,
    // so it is never allowed to lose a race to a sibling that git happened
    // to list first.
    for (const p of parents) {
      const got = read(p, filePath)
      if (got.kind !== 'present') continue
      if (!normalize(got.text).norm.includes(needle)) continue
      return {
        basis: 'rival',
        sha: p.slice(0, SHORT),
        subject: parentSubject.get(p) ?? '',
        relation: 'prior_revision',
      }
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
        // A parent that held the text already returned above, so an
        // ancestor reaching this line is an older one and the relation is
        // the restore it was always documented to be.
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
