// Pair finder: walk a project's git history for (generated, edited)
// commit pairs. A commit counts as generated when its Co-Authored-By
// trailer matches the agent pattern (the convention agent commits
// already carry) or, as a fallback, when its author name matches the
// agent-identity list — a false negative (a generated commit treated
// as human) loses signal, so the fallback errs toward matching. Its
// pairing "final" commit is the next commit by author date touching an
// overlapping path, with no agent marker.

import { execFileSync } from 'node:child_process'

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
  /** more than one parent = a merge; a merge is never an edit */
  parentCount: number
}

function git(repoPath: string, args: string[], opts: { quiet?: boolean } = {}): string {
  return execFileSync('git', ['-C', repoPath, ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    // `quiet` drops git's stderr. Only blobAt uses it, because a missing path
    // at a given commit is an expected answer there (deploy detection probes
    // for files that may not exist), not a failure worth printing.
    stdio: opts.quiet ? ['ignore', 'pipe', 'ignore'] : undefined,
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
      parentCount: parents ? parents.split(' ').length : 0,
      trailers: trailers ?? '',
      subject: rest.join('\t'),
    }
  })
}

export function commitFiles(repoPath: string, sha: string): string[] {
  return git(repoPath, ['show', '--name-only', "--format=", sha])
    .split('\n').filter(Boolean)
}

export function blobAt(repoPath: string, sha: string, path: string): string | null {
  try {
    return git(repoPath, ['show', `${sha}:${path}`], { quiet: true })
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
    for (let j = i + 1; j < commits.length; j++) {
      const fin = commits[j]
      if (marker(fin)) continue
      // A merge brings in other commits' work; the human did not write
      // that diff. Skip it as a pairing target rather than count another
      // agent's changes as this person's corrections.
      if (fin.parentCount > 1) continue
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
      })
      break
    }
  }
  return pairs
}
