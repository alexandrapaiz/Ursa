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
// THE TWO RELATIONS THE SEARCH CAN FIND, which are src/corroborate.ts's
// and mean the same thing here:
//
//   pre_existing — the matching commit is an ancestor of the generation.
//     The finished file is the file as it stood before the agent wrote,
//     so the episode's net effect on it was nothing.
//   sibling — neither ancestor nor descendant. The content came off
//     another branch, which the person merged or checked out rather than
//     typed. This is the `b59add9` case: a vendoring commit on a branch
//     the generation never contained.
//
// THE THIRD RELATION, AND THE CASE THE SEARCH STRUCTURALLY CANNOT SEE.
// Both relations above are found by locating the content somewhere in
// this repository's object store. An import from a DIFFERENT repository
// is invisible to that, because the content never existed here before
// the commit that brought it in. Measured on this repository on
// 2026-10-11: `docs/standards/lessons.md` arrived by a sync commit
// copying it from `alexandrapaiz/alexandra-systems` at `775ce36`, the
// resolver read all 63,362 characters of it as model output and 60,616
// of them as text the person kept, and this module could not refuse it.
// Scaling: that one file carried 84.7% of that run's headline survival
// figure (docs/design/vendored-paths.md §1).
//
//   declared — a commit says in its own trailer that the content it put
//     at this path came from outside. No blob search is run and none
//     would succeed. The evidence is the declaration, which is weaker
//     than byte identity and is therefore reported under its own
//     exclusion reason (`declared_import`, not `imported_whole`), so a
//     buyer reading the record can tell a proof from a statement.
//
// WHY A TRAILER AND NOT THE SUBJECT LINE. Every sync commit in this
// repository already names its upstream in prose — "Lessons sync
// 2026-09-28: HQ standards/lessons.md @ 775ce36", "Re-vendor
// docs/standards/pm.md from HQ main @ 683c7dd" — so a regex over
// subjects would have worked on today's history. It is refused anyway.
// A regex over prose is the central-assessment overreach the fourth
// principle names (docs/vision.md): it would silently reclassify any
// commit whose message happens to mention a sync, and the person who
// wrote that message never agreed to that reading. A trailer is a
// declaration in a field whose only purpose is to be read by a machine,
// which is the same shape as `--agent-identity`: where the library
// cannot know, the party who does says so.
//
// WHICH COMMITS ARE ASKED, AND WHY ONLY TWO. The generation and the
// final, in that order. These are the only two commits whose authorship
// any claim in the record rests on, and each voids a different half of
// `survived_verbatim`'s meaning ("a model wrote this and the person kept
// it"). A declaration on the generation says the model did not write it.
// A declaration on the final says the finished file is not the person's
// composition either. An ancestor's or a sibling's declaration is not
// read, because it says what that commit imported and nothing about what
// this episode composed on top of it; where the content did survive
// unchanged, the blob search above already finds it by identity.
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
  /**
   * How this path was found to be an import; see this file's header.
   * `pre_existing` and `sibling` are proven by blob identity and say where
   * the identical content sits relative to the generation. `declared` is
   * `sha`'s own trailer saying it brought the content in from outside this
   * repository, which is a statement rather than a proof and carries its
   * own exclusion reason downstream.
   */
  relation: 'pre_existing' | 'sibling' | 'declared'
  /**
   * Author date of `sha`, strict ISO 8601 with the author's own UTC offset,
   * exactly as `PathCommit.date` and `CommitInfo.date` carry it (`%aI`).
   *
   * This is the file-level twin of the date a `rival` descent verdict
   * carries. A `sibling` exclusion asserts the finished file is byte-
   * identical to a copy on a branch outside this work, and that assertion
   * rests on a clock the way the span-level `sibling` claim does: if the
   * matching commit was authored after the work closed, the copy is a copy
   * OF this work rather than a source for it, and the refusal is backwards
   * — the record drops a file the person did write. `EXCLUSION_NOT_CLASSIFIED`
   * in src/invariants.ts is what reads it.
   */
  date: string
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
 * The commit trailer by which the party making a commit declares that the
 * content it is putting at a path came from outside this repository.
 *
 * Exported because it is the public half of this module: a sync commit has
 * to spell the key exactly for the declaration to be read, and the design
 * document and the tests must not be free to spell it differently.
 *
 * One trailer line per path, repeated for a commit importing several:
 *
 *   Lessons sync 2026-09-28: HQ standards/lessons.md @ 775ce36
 *
 *   Ursa-Imported-Path: docs/standards/lessons.md
 *   Ursa-Imported-Path: docs/standards/pm.md
 *
 * Git parses trailers only out of the message's last paragraph, so a
 * declaration written mid-message is not read. That is a constraint worth
 * keeping rather than working around: it is what stops a commit that
 * merely discusses an import from being taken as declaring one.
 */
export const IMPORT_TRAILER = 'Ursa-Imported-Path'

/** What one commit says about itself: its subject, and the paths it imported. */
interface Declaration {
  /** full sha, as passed in; truncated only when it reaches a `VendoredPath` */
  sha: string
  subject: string
  /** paths named by `IMPORT_TRAILER` lines, empty on a commit that declares nothing */
  paths: Set<string>
}

/**
 * Read `sha`'s subject and its import declarations in one git call.
 *
 * `%(trailers:key=...,valueonly,separator=%x09)` is git's own trailer
 * parser, which is the whole reason this is a trailer: no parsing of commit
 * prose happens in this process. Tab separates the values and NUL separates
 * the subject from them, because neither character can occur in a git
 * subject line or in a path git will check out.
 *
 * Spelled here rather than added to `listCommits` in src/pairfinder.ts for
 * the reason `blobOid` above gives: that module is the most contended file
 * in the repository, its `--pretty` format is a positional tab-separated
 * row that every caller indexes into, and this needs two commits per
 * episode rather than every commit in the walk. `CommitInfo.trailers`
 * carries `Co-Authored-By` only, so there was no field to reuse.
 *
 * stderr is dropped and a failure returns a declaration of nothing, the
 * same asymmetry the header states: a clone that cannot answer is a fact
 * about the clone, and refusing to resolve a file over it would cost real
 * correction signal.
 */
function declaration(repoPath: string, sha: string): Declaration {
  let out: string
  try {
    out = execFileSync('git', [
      '-C', repoPath, 'log', '-1',
      `--pretty=format:%s%x00%(trailers:key=${IMPORT_TRAILER},valueonly,separator=%x09)`,
      sha,
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  } catch {
    return { sha, subject: '', paths: new Set() }
  }
  const nul = out.indexOf('\0')
  if (nul < 0) return { sha, subject: out.trim(), paths: new Set() }
  return {
    sha,
    subject: out.slice(0, nul),
    paths: new Set(
      out.slice(nul + 1).split('\t').map((x) => x.trim()).filter((x) => x.length > 0),
    ),
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
  // Two git calls for the whole episode, skipped entirely when there is
  // nothing to ask about. Generation before final: a declaration on the
  // generation voids the authorship claim at its root, so it is the more
  // informative of the two when both commits declare the same path.
  const declared = paths.length === 0
    ? []
    : [declaration(projectPath, ep.generatedSha), declaration(projectPath, ep.finalSha)]
  for (const path of paths) {
    const finalOid = blobOid(projectPath, ep.finalSha, path)
    if (finalOid === null || finalOid === EMPTY_BLOB) continue
    // Checked ahead of the search, and short-circuiting it. Not an
    // optimization dressed as a rule: the declared case is by definition
    // the one where the content is not in this object store, so the search
    // it skips is the search that was going to fail. The cost is that a
    // path which is both declared and findable by identity is reported
    // under the weaker evidence, which is the honest direction to err and
    // saves up to `MAX_CANDIDATE_BLOBS` + 1 subprocesses per such path.
    const d = declared.find((x) => x.paths.has(path))
    if (d !== undefined) {
      found.push({ path, sha: d.sha.slice(0, SHORT), subject: d.subject, relation: 'declared' })
      continue
    }
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
