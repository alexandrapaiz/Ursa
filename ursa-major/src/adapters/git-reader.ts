// The local half of the PR adapter: blob identity, parentage, and revert
// detection over a clone the user already has. The PR adapter needs blob
// object ids rather than blob contents, because "did this path change"
// is a hash comparison and reading three copies of a large file to
// answer it is waste.
//
// A pull request's branch commits are reachable locally only after its
// head ref is fetched, which is one command:
//
//   git -C <repo> fetch --no-tags origin +refs/pull/<N>/head:refs/ursa/pr/<N>
//
// `fetchPullRequestRef` runs exactly that. Nothing here writes to the
// working tree, and nothing here creates or moves a branch the user can
// see; refs live under refs/ursa/ so `git branch` stays clean.

import { execFileSync } from 'node:child_process'
import type { RepoReader } from './github-pr'

function git(repoPath: string, args: string[]): string {
  return execFileSync('git', ['-C', repoPath, ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

/** Fetch one PR's head into refs/ursa/pr/<number>. Returns the fetched sha. */
export function fetchPullRequestRef(repoPath: string, number: number, remote = 'origin'): string {
  git(repoPath, ['fetch', '--no-tags', remote, `+refs/pull/${number}/head:refs/ursa/pr/${number}`])
  return git(repoPath, ['rev-parse', `refs/ursa/pr/${number}`]).trim()
}

/**
 * A `RepoReader` backed by a local clone, memoized per (sha, path). One
 * `git rev-parse` per lookup is cheap, but a PR with many commits over
 * the same files asks the same question repeatedly.
 */
export function gitRepoReader(repoPath: string): RepoReader {
  const blobs = new Map<string, string | null>()
  const parentsOf = new Map<string, string[]>()
  return {
    blobId(sha, path) {
      const key = `${sha}:${path}`
      if (!blobs.has(key)) {
        let id: string | null = null
        try {
          id = git(repoPath, ['rev-parse', `${sha}:${path}`]).trim() || null
        } catch {
          id = null
        }
        blobs.set(key, id)
      }
      return blobs.get(key)!
    },
    parents(sha) {
      if (!parentsOf.has(sha)) {
        let list: string[] = []
        try {
          const out = git(repoPath, ['rev-list', '--parents', '-n', '1', sha]).trim()
          list = out.split(/\s+/).slice(1)
        } catch {
          list = []
        }
        parentsOf.set(sha, list)
      }
      return parentsOf.get(sha)!
    },
  }
}

/**
 * A commit on `baseRef` after `mergeSha` that reverts it. Git's own
 * revert message carries the reverted sha ("This reverts commit <sha>"),
 * and GitHub's revert-PR button produces a `Revert "<subject>"` subject,
 * so both forms are matched. Returns null when the merge stands.
 */
export function findRevert(
  repoPath: string,
  mergeSha: string,
  baseRef: string,
  subject?: string,
): { sha: string; subject: string; at: string } | null {
  let out = ''
  try {
    out = git(repoPath, [
      'log', `${mergeSha}..${baseRef}`, '--date=iso-strict',
      '--pretty=format:%H%x09%aI%x09%s%x09%b',
    ])
  } catch {
    return null
  }
  for (const line of out.split('\n').filter(Boolean)) {
    const [sha, at, subj, body = ''] = line.split('\t')
    const revertsSha = body.includes(mergeSha) || body.includes(mergeSha.slice(0, 7))
    const revertsSubject = subject !== undefined && subj === `Revert "${subject}"`
    if (revertsSha || revertsSubject) return { sha, subject: subj, at }
  }
  return null
}
