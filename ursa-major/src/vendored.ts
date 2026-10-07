// A vendored file is an import, and no span of it is anyone's correction.
//
// WHAT THIS IS FOR. src/corroborate.ts settles the question "did the
// person reach this final text by editing this generation" one span at a
// time, by asking whether some commit outside the generation's line of
// descent already held that span's text. Run against this repository's
// own history on 2026-10-06 it fired seven times, and all seven spans
// were in one file, `docs/standards/pm.md`, and all seven named the same
// rival commit: `b59add9`, "Re-vendor docs/standards/pm.md from HQ main @
// 683c7dd". That file is a copy of a standard owned by
// `alexandrapaiz/alexandra-systems` (CLAUDE.md, "The holding company").
//
// The per-span test reached the right verdict seven separate times, at
// the cost of seven blob reads and seven chances to be wrong, for a fact
// that was never per-span: the whole file arrived from outside in one
// commit. Nine more spans in that same file came back `unverified` with
// reason `span_too_short`, because the length floor in
// src/corroborate.ts cannot judge a span of eleven normalized characters
// in isolation. So the per-span test is the right backstop and the wrong
// primary. The available fact is per-file, and this module asks for it
// per file.
//
// THE TEST, AND EXACTLY WHAT IT PROVES. For each of the episode's
// resolvable paths, compare the blob OBJECT ID of the file at
// `ep.finalSha` against the blob object id of the same path at every
// commit that is neither the generation nor a descendant of it. An equal
// object id means the two files are byte-identical, because that is what
// a git blob oid is: the SHA-1 of the content. So an equal oid proves
// this statement and no more than it.
//
//   The finished file is byte-for-byte a copy of content that exists
//   outside this generation's line of descent.
//
// From which it follows that not one character of the finished file was
// composed in this episode, and therefore that no span of it is a
// correction of this generation. Every `survived_verbatim` and
// `survived_mutated` label the resolver would attach to that file is
// false, and `no_generation_provenance` is true but uninformative, since
// it is true of the entire file for a reason the record would not state.
// Not classifying it is the honest answer.
//
// WHY OBJECT IDS AND NOT TEXT. One `git rev-parse <sha>:<path>` per
// candidate returns 40 hex characters whatever the file's size, so the
// comparison costs the same on `docs/standards/pm.md` (54KB) as on a
// three-line module, and nothing large is read into this process. The
// alternative, reading both blobs and comparing strings, is the same
// answer at the cost of the file's bytes twice over. It is also a weaker
// answer, because text comparison invites normalization and
// normalization is how "nearly the same" starts passing for "the same".
//
// THE TWO RELATIONS, which are src/corroborate.ts's and mean the same
// thing here:
//
//   pre_existing — the matching commit is an ancestor of the generation.
//     The finished file is the file as it stood before the agent wrote,
//     so the episode's net effect on it was nothing.
//   sibling — neither ancestor nor descendant. The content came off
//     another branch, which the person merged or checked out rather than
//     typed. This is the `b59add9` case: a vendoring commit on a branch
//     the generation never contained.
//
// Descendants of the generation are excluded, and that exclusion is what
// keeps the test from being vacuous. `ep.finalSha` is a descendant and
// holds the final blob by definition, so a test that did not exclude
// descendants would call every file in every record an import.
//
// WHAT IT REFUSES TO CLAIM. A path whose history git cannot report, or
// whose blob cannot be read, is not an import and is not reported as
// one. The default is to resolve the file, because a hole in a clone is
// a fact about the clone and dropping real correction signal over it
// costs the scarcest thing in the artifact. This is the same asymmetry
// src/corroborate.ts argues for and the opposite of src/deletion.ts's,
// where silence would otherwise fall on the person.
//
// THE LIMITATION, stated here rather than discovered later. Skipping the
// path drops the generation side with it. In the `pre_existing` case
// where the person reverted the file outright, the true record is
// "the agent wrote X, the person threw all of X away" — a
// `generated_deleted` story that is real signal, and this module
// currently discards it along with the false `survived_*` labels. The
// finished file genuinely carries no correction, so the final-side
// refusal is right; the generation-side deletion is a separate question
// that wants a separate answer. It is filed as its own ledger entry
// (docs/ideas.md, 2026-10-06, "An imported final file still has a
// discard story") and pinned by a test below so the cost is visible
// rather than implied.

import { execFileSync } from 'node:child_process'
import { commitsTouchingPath, type CommitInfo } from './pairfinder'
import { relatives } from './corroborate'

/**
 * Candidate commits whose blob oid is compared per path before the search
 * gives up. The same ceiling src/corroborate.ts uses for rival blobs, for
 * the same reason (40 covers every sibling branch alive on this
 * repository at once), and it binds much less often here: a `rev-parse`
 * costs one subprocess and returns 40 characters, so the budget is spent
 * on process startup rather than on reading files.
 */
export const MAX_CANDIDATE_BLOBS = 40

/** short sha, the length git itself abbreviates to */
const SHORT = 7

/** One resolvable path whose finished blob came in whole from elsewhere. */
export interface VendoredPath {
  /** repo-relative path, as `Episode.touchedFiles` spells it */
  path: string
  /** the commit outside the generation's descent holding the identical blob */
  sha: string
  /** that commit's subject line, so the record names the import in the user's own words */
  subject: string
  /** how that commit stands to the generation; see this file's header */
  relation: 'pre_existing' | 'sibling'
}

/**
 * The blob object id of `path` at `sha`, or null when there is no blob
 * there to name.
 *
 * `git rev-parse <sha>:<path>` is the whole read. It is spelled here
 * rather than added to src/pairfinder.ts deliberately: that module is the
 * most contended file in the repository (docs/ideas.md, 2026-09-28,
 * "the merge queue now costs the engineer seat working surface"), and
 * this is six lines that nothing else calls.
 *
 * stderr is dropped because a missing path at a given commit is an
 * expected answer here, not a failure worth printing. That is the same
 * choice `blobLookup` makes in src/pairfinder.ts.
 */
function blobOid(repoPath: string, sha: string, path: string): string | null {
  try {
    return execFileSync('git', ['-C', repoPath, 'rev-parse', `${sha}:${path}`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim() || null
  } catch {
    return null
  }
}

/**
 * The empty blob's object id, which git hardcodes and every empty file in
 * every repository shares.
 *
 * Two unrelated empty files are byte-identical, so without this guard an
 * episode that emptied a file would be reported as having imported it
 * from whichever commit last happened to hold an empty file at that path.
 * That is true and useless. An empty finished file contributes no span to
 * classify either way, so the refusal has nothing to protect.
 */
const EMPTY_BLOB = 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391'

/**
 * Which of `paths` arrived in the finished work whole, from outside this
 * generation's line of descent.
 *
 * @param paths the episode's resolvable paths, already filtered to the
 *   ones the caller would otherwise read. Passed in rather than taken
 *   from `ep.touchedFiles` so this module does not have to know which
 *   extensions src/bin/ursa.ts resolves, and so no git call is spent on a
 *   lockfile the resolver was going to skip anyway.
 * @param commits `listCommits(projectPath)`. The parent and child edges
 *   are what separate a rival commit from a descendant of the generation,
 *   and `ursa run` already walks the graph once per run.
 */
export function vendoredPaths(
  projectPath: string,
  ep: { generatedSha: string; finalSha: string },
  paths: string[],
  commits: CommitInfo[],
): VendoredPath[] {
  const { ancestors, descendants } = relatives(commits, ep.generatedSha)
  const found: VendoredPath[] = []
  for (const path of paths) {
    const finalOid = blobOid(projectPath, ep.finalSha, path)
    if (finalOid === null || finalOid === EMPTY_BLOB) continue
    const touching = commitsTouchingPath(projectPath, path)
    // null is "this clone cannot answer", which is not evidence of an
    // import. Resolve the file.
    if (touching === null) continue
    let compared = 0
    for (const c of touching) {
      if (compared >= MAX_CANDIDATE_BLOBS) break
      if (c.sha === ep.generatedSha || descendants.has(c.sha)) continue
      const oid = blobOid(projectPath, c.sha, path)
      if (oid === null) continue
      compared++
      if (oid !== finalOid) continue
      found.push({
        path,
        sha: c.sha.slice(0, SHORT),
        subject: c.subject,
        relation: ancestors.has(c.sha) ? 'pre_existing' : 'sibling',
      })
      break
    }
  }
  return found
}
