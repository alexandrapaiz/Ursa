// The merge window: which commits one merged pull request actually
// contributed. The CI launch is event-fired, not a poll (plan §1), so
// the window comes out of the event payload GitHub already wrote to
// disk for the job, never out of a second API call.
//
// Three shapes of merge reach us, and the window differs for each:
//
//   merge commit   base..head, the pull request's own commits, in order
//   rebase merge   base..head likewise, because the rebased commits are
//                  the pull request's commits with new shas
//   squash merge   one commit whose tree is the whole branch. The
//                  generation-to-mutation chain inside the branch is
//                  gone (plan §7.3), so the window degrades to that one
//                  commit and the record says so, rather than failing.

import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

export type MergeStyle = 'merge-commit' | 'squash' | 'unknown'

export interface MergeWindow {
  /** pull request number, for the comment's own identity */
  prNumber: number
  repo: string
  /** the commit the pull request branched from */
  baseSha: string
  /** the last commit on the pull request's branch */
  headSha: string
  /** what landed on the base branch; null when the payload carries none */
  mergeCommitSha: string | null
  style: MergeStyle
  /** the git revision range to hand findCommitPairs */
  range: string
  /** why this range and not another, carried onto the record */
  note: string
}

/** The subset of the pull_request event payload this module reads. */
export interface PullRequestEventPayload {
  action?: string
  number?: number
  pull_request?: {
    number?: number
    merged?: boolean
    merge_commit_sha?: string | null
    base?: { sha?: string; ref?: string }
    head?: { sha?: string; ref?: string }
  }
  repository?: { full_name?: string }
}

export class NotAMergedPullRequest extends Error {}

/**
 * Build the window from an already-parsed payload. Pure, so the
 * squash-detection branch is testable without a repository.
 */
export function mergeWindow(
  payload: PullRequestEventPayload,
  opts: { parentCountOf?: (sha: string) => number } = {}
): MergeWindow {
  const pr = payload.pull_request
  if (!pr) throw new NotAMergedPullRequest('event payload carries no pull_request object')
  if (pr.merged !== true) {
    throw new NotAMergedPullRequest(
      `pull request #${pr.number ?? payload.number ?? 0} closed without merging; nothing was accepted, so nothing is resolved`
    )
  }
  const baseSha = pr.base?.sha
  const headSha = pr.head?.sha
  if (!baseSha || !headSha) throw new NotAMergedPullRequest('event payload carries no base.sha or head.sha')

  const prNumber = pr.number ?? payload.number ?? 0
  const repo = payload.repository?.full_name ?? ''
  const mergeCommitSha = pr.merge_commit_sha ?? null

  // A squash merge produces a single-parent commit on the base branch,
  // and the branch's own commits are not ancestors of it. A merge
  // commit has two parents. Without the repository we cannot tell, and
  // 'unknown' keeps the honest range rather than guessing.
  let style: MergeStyle = 'unknown'
  if (mergeCommitSha && opts.parentCountOf) {
    const parents = opts.parentCountOf(mergeCommitSha)
    style = parents >= 2 ? 'merge-commit' : parents === 1 ? 'squash' : 'unknown'
  }

  if (style === 'squash') {
    return {
      prNumber, repo, baseSha, headSha, mergeCommitSha, style,
      range: `${mergeCommitSha}~1..${mergeCommitSha}`,
      note:
        `squash merge: the branch's commit sequence collapsed into ${String(mergeCommitSha).slice(0, 7)}, ` +
        'so this window is that one commit and recurrence counts inside the branch are unrecoverable',
    }
  }
  return {
    prNumber, repo, baseSha, headSha, mergeCommitSha, style,
    range: `${baseSha}..${headSha}`,
    note:
      `${style === 'merge-commit' ? 'merge commit' : 'merge style undetermined'}: window is the pull request's own ` +
      `commits, ${baseSha.slice(0, 7)}..${headSha.slice(0, 7)}`,
  }
}

/** Count a commit's parents with the runner's own git. */
export function parentCountOf(repoPath: string, sha: string): number {
  try {
    const out = execFileSync('git', ['-C', repoPath, 'rev-list', '--parents', '-n', '1', sha], {
      encoding: 'utf8',
    }).trim()
    // "<sha> <parent> [<parent> …]" — the first field is the commit itself.
    return out.split(/\s+/).filter(Boolean).length - 1
  } catch {
    return 0
  }
}

/** Read and parse $GITHUB_EVENT_PATH, then build the window. */
export function mergeWindowFromEvent(eventPath: string, repoPath: string): MergeWindow {
  const payload = JSON.parse(readFileSync(eventPath, 'utf8')) as PullRequestEventPayload
  return mergeWindow(payload, { parentCountOf: (sha) => parentCountOf(repoPath, sha) })
}
