// Snapshot capture for the PR adapter. Every network read happens here,
// through the `gh` CLI the user is already authenticated with, so Ursa
// stores no token and asks for no new scope. `gh` is the choice over a
// raw fetch against api.github.com for exactly that reason: the auth
// already exists on the machine, and on a GitHub Actions runner the same
// command works from GH_TOKEN with no code change.
//
// The exact commands this file runs, in order, for repo `o/r` and PR N:
//
//   gh api repos/o/r/pulls/N
//   gh api repos/o/r/pulls/N/commits --paginate
//   gh api repos/o/r/pulls/N/comments --paginate
//   gh api repos/o/r/commits/<sha>            (once per commit, for files and patches)
//
// The per-commit call is the expensive one, at one request per branch
// commit, and it is not optional: `pulls/N/commits` returns no file list,
// and per-commit file lists are what pairing is built on. What `gh api
// repos/o/r/pulls/N/files` returns instead is the union of paths across
// the whole PR with no per-commit attribution, which cannot tell an
// agent's commit from the human's edit of it.
//
// `noPatches` therefore saves no requests. It drops the parsed hunk
// ranges from the stored snapshot, which shrinks a large snapshot by
// roughly the size of its diffs and downgrades review-comment evidence
// from 'line-overlap' to 'path-only' (see StatedCorrection.evidenceBasis).
// It is the right trade for a survey across many PRs, and the wrong one
// for a PR whose review comments matter.

import { execFileSync } from 'node:child_process'
import { parseHunkRanges, type PullRequestCommit, type PullRequestSnapshot, type ReviewComment } from './github-pr'
import { findRevert } from './git-reader'

function gh<T>(args: string[]): T {
  const out = execFileSync('gh', args, {
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  return JSON.parse(out) as T
}

/** The repo the local clone points at, as "owner/name". */
export function currentRepo(repoPath: string): string {
  const out = execFileSync('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'], {
    cwd: repoPath,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  return out.trim()
}

interface ApiPull {
  title: string
  state: 'open' | 'closed'
  merged: boolean
  merged_at: string | null
  closed_at: string | null
  merge_commit_sha: string | null
  merged_by: { login: string } | null
  base: { ref: string }
  head: { ref: string; sha: string }
}

interface ApiCommit {
  sha: string
  parents: Array<{ sha: string }>
  author: { login?: string } | null
  commit: { message: string; author: { name: string; date: string } }
  files?: Array<{ filename: string; patch?: string }>
}

interface ApiReviewComment {
  id: number
  path: string
  line: number | null
  original_line: number | null
  body: string
  created_at: string
  user: { login: string } | null
}

/** Co-Authored-By values in a commit message, joined the way git's %(trailers) prints them. */
export function coAuthoredBy(message: string): string {
  return message
    .split('\n')
    .map((l) => /^Co-Authored-By:\s*(.+)$/i.exec(l.trim())?.[1])
    .filter((v): v is string => Boolean(v))
    .join('|')
}

export interface CaptureOptions {
  /**
   * Omit parsed hunk ranges from the snapshot. Saves snapshot size, not
   * requests: the per-commit call still runs, because file lists come
   * from it. Review-comment evidence degrades to 'path-only'.
   */
  noPatches?: boolean
  /** local clone used for revert detection; skipped when absent */
  repoPath?: string
}

export function capturePullRequest(repo: string, number: number, opts: CaptureOptions = {}): PullRequestSnapshot {
  const pull = gh<ApiPull>(['api', `repos/${repo}/pulls/${number}`])
  const rawCommits = gh<ApiCommit[]>(['api', `repos/${repo}/pulls/${number}/commits`, '--paginate'])
  const rawComments = gh<ApiReviewComment[]>(['api', `repos/${repo}/pulls/${number}/comments`, '--paginate'])

  const commits: PullRequestCommit[] = rawCommits.map((c) => {
    const detail = gh<ApiCommit>(['api', `repos/${repo}/commits/${c.sha}`])
    const files = detail.files ?? []
    const changedRanges: Record<string, Array<[number, number]>> = {}
    if (!opts.noPatches) {
      for (const f of files) {
        if (f.patch) changedRanges[f.filename] = parseHunkRanges(f.patch)
      }
    }
    return {
      sha: c.sha,
      authorName: c.commit.author.name,
      ...(c.author?.login ? { authorLogin: c.author.login } : {}),
      authoredAt: c.commit.author.date,
      subject: c.commit.message.split('\n')[0],
      trailers: coAuthoredBy(c.commit.message),
      parentCount: c.parents.length,
      // The API already answers this on the list call, so recording it
      // costs nothing and makes merge attribution work on a pull request
      // whose commits are not in the local clone (a fork, or a branch
      // deleted after merge).
      parents: c.parents.map((p) => p.sha),
      files: files.map((f) => f.filename),
      ...(opts.noPatches ? {} : { changedRanges }),
    }
  })

  const reviewComments: ReviewComment[] = rawComments.map((c) => ({
    id: c.id,
    path: c.path,
    line: c.line ?? c.original_line ?? null,
    body: c.body,
    createdAt: c.created_at,
    ...(c.user?.login ? { authorLogin: c.user.login } : {}),
  }))

  const outcome = pull.merged ? 'merged' : pull.state === 'closed' ? 'closed_unmerged' : 'open'
  const revertedBy =
    opts.repoPath && pull.merged && pull.merge_commit_sha
      ? findRevert(opts.repoPath, pull.merge_commit_sha, `origin/${pull.base.ref}`, pull.title)
      : null

  return {
    repo,
    number,
    title: pull.title,
    baseRef: pull.base.ref,
    headRef: pull.head.ref,
    headSha: pull.head.sha,
    outcome,
    mergedAt: pull.merged_at,
    closedAt: pull.closed_at,
    mergedByLogin: pull.merged_by?.login ?? null,
    mergeCommitSha: pull.merge_commit_sha,
    commits,
    reviewComments,
    ...(revertedBy ? { revertedBy } : {}),
    capturedAt: new Date().toISOString(),
  }
}

/** Every pull request on a repo, newest first, as (number, outcome) pairs. */
export function listPullRequests(repo: string, state: 'all' | 'merged' | 'open' = 'all', limit = 100): Array<{ number: number; title: string }> {
  const args = ['pr', 'list', '--repo', repo, '--limit', String(limit), '--json', 'number,title']
  args.push('--state', state === 'merged' ? 'merged' : state)
  return gh<Array<{ number: number; title: string }>>(args)
}
