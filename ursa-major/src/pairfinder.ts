// Pair finder: walk a project's git history for (generated, edited)
// commit pairs. A commit counts as generated when its Co-Authored-By
// trailer matches the agent pattern (the convention agent commits
// already carry) or, as a fallback, when its author name matches the
// agent-identity list — a false negative (a generated commit treated
// as human) loses signal, so the fallback errs toward matching. Its
// pairing "final" commit is the next commit by author date touching an
// overlapping path, with no agent marker. Merges and other agents'
// commits between the two are skipped as pairing targets but not
// forgotten: a merge between them can destroy the generation's text
// without any human choosing to drop it, so each skipped merge that
// touched a paired path is reported on the pair as an
// `interveningMerges` entry for deletion attribution to read.

import { execFileSync } from 'node:child_process'

/** a merge commit sitting between the generated and final commit */
export interface MergeEvent {
  sha: string
  /** the merge's parents, in git's order; parents[0] is the first parent */
  parents: string[]
  /** paths this merge touched that the generation also touched */
  paths: string[]
  author: string
  date: string
  subject: string
}

export interface CommitPair {
  generatedSha: string
  finalSha: string
  paths: string[]
  generatedAuthor: string
  finalAuthor: string
  generatedAt: string
  finalAt: string
  /** the trailer or author string that classified the generated side */
  agentMarker: string
  subject: string
  /**
   * Merges walked past on the way from generatedSha to finalSha that
   * touched at least one of the generation's paths, oldest first. Text
   * these destroyed is not the human's discard.
   */
  interveningMerges: MergeEvent[]
}

export interface PairFinderOptions {
  agentTrailerPattern?: RegExp
  agentAuthorPattern?: RegExp
}

const DEFAULT_TRAILER = /claude|codex|cursor|gpt/i
const DEFAULT_AUTHOR = /claude|codex|cursor|gpt|copilot|github-actions|\[bot\]/i

interface CommitInfo {
  sha: string
  authorName: string
  authorEmail: string
  date: string
  trailers: string
  subject: string
  /** parent shas in git's order; length > 1 = a merge, and a merge is never an edit */
  parents: string[]
}

function git(repoPath: string, args: string[]): string {
  return execFileSync('git', ['-C', repoPath, ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
}

export function listCommits(repoPath: string): CommitInfo[] {
  // --reverse with --topo-order: ancestors before descendants, so the
  // pairing scan walks forward in history even when commits share a
  // timestamp (same-second bursts are common in agent workflows).
  const out = git(repoPath, [
    'log', '--all', '--reverse', '--topo-order', '--date=iso-strict',
    '--pretty=format:%H%x09%an%x09%ae%x09%aI%x09%P%x09%(trailers:key=Co-Authored-By,valueonly,separator=|)%x09%s',
  ])
  return out.split('\n').filter(Boolean).map((line) => {
    const [sha, authorName, authorEmail, date, parents, trailers, ...rest] = line.split('\t')
    return {
      sha, authorName, authorEmail, date,
      parents: parents ? parents.split(' ').filter(Boolean) : [],
      trailers: trailers ?? '',
      subject: rest.join('\t'),
    }
  })
}

/**
 * Paths a commit touched, including merges.
 *
 * `-m` is load-bearing: without it `git show --name-only` prints NOTHING
 * for a merge commit, because git shows no diff for a merge by default.
 * That blindness is why `findCommitPairs` appeared to refuse merges as
 * pairing targets even before the explicit parent check — a merge simply
 * never reported an overlapping path. With `-m` git diffs the merge
 * against each parent in turn, so a path is listed once per parent that
 * differs; dedupe, since callers only ask whether the path was touched.
 */
export function commitFiles(repoPath: string, sha: string): string[] {
  const out = git(repoPath, ['show', '-m', '--name-only', "--format=", sha])
  return [...new Set(out.split('\n').filter(Boolean))]
}

export function blobAt(repoPath: string, sha: string, path: string): string | null {
  try {
    return git(repoPath, ['show', `${sha}:${path}`])
  } catch {
    return null
  }
}

export function findCommitPairs(repoPath: string, opts: PairFinderOptions = {}): CommitPair[] {
  const trailerPattern = opts.agentTrailerPattern ?? DEFAULT_TRAILER
  const authorPattern = opts.agentAuthorPattern ?? DEFAULT_AUTHOR
  const commits = listCommits(repoPath)
  const files = new Map<string, string[]>()
  const touched = (sha: string) => {
    if (!files.has(sha)) files.set(sha, commitFiles(repoPath, sha))
    return files.get(sha)!
  }
  const marker = (c: CommitInfo): string | null => {
    if (trailerPattern.test(c.trailers)) return c.trailers
    if (authorPattern.test(c.authorName)) return c.authorName
    return null
  }

  const pairs: CommitPair[] = []
  for (let i = 0; i < commits.length; i++) {
    const gen = commits[i]
    const agentMarker = marker(gen)
    if (!agentMarker) continue
    const genFiles = new Set(touched(gen.sha))
    if (genFiles.size === 0) continue
    const interveningMerges: MergeEvent[] = []
    for (let j = i + 1; j < commits.length; j++) {
      const fin = commits[j]
      if (marker(fin)) continue
      // A merge brings in other commits' work; the human did not write
      // that diff. It is not a pairing target. But it can still have
      // destroyed this generation's text, so record it before moving on
      // and let deletion attribution decide whose deletion it was.
      if (fin.parents.length > 1) {
        const mergeOverlap = touched(fin.sha).filter((p) => genFiles.has(p))
        if (mergeOverlap.length > 0) {
          interveningMerges.push({
            sha: fin.sha,
            parents: fin.parents,
            paths: mergeOverlap,
            author: fin.authorName,
            date: fin.date,
            subject: fin.subject,
          })
        }
        continue
      }
      const overlap = touched(fin.sha).filter((p) => genFiles.has(p))
      if (overlap.length === 0) continue
      pairs.push({
        generatedSha: gen.sha,
        finalSha: fin.sha,
        paths: overlap,
        generatedAuthor: gen.authorName,
        finalAuthor: fin.authorName,
        generatedAt: gen.date,
        finalAt: fin.date,
        agentMarker,
        subject: gen.subject,
        interveningMerges,
      })
      break
    }
  }
  return pairs
}
