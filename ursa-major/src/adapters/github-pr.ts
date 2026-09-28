// The PR adapter (plan §8). Reads one pull request and emits the shapes
// M0 already produces — `CommitPair` from src/pairfinder.ts and
// `Episode` from src/episodes.ts — so src/resolve.ts is reused with no
// change and no new record schema exists.
//
// Why it exists. The git-diff adapter pairs an agent commit with the
// next human commit that edits the same file on the default branch. On a
// repository that is itself run by agents through pull requests, that
// commit almost never happens: the n=2 trial over alexandria found one
// real pair in 374 commits. The corrections were not missing, they were
// inside the pull requests. This module reads the four places a PR puts
// them, named by `PullRequestClosure` below.
//
// Everything here is pure over a `PullRequestSnapshot` plus an injected
// `RepoReader`. Nothing in this file touches the network or the
// filesystem; src/adapters/gh.ts captures the snapshot and
// src/adapters/git-reader.ts reads blobs.

import type { CommitPair } from '../pairfinder'
import type { Episode } from '../episodes'
import { basename } from 'node:path'

// Re-declared rather than imported from pairfinder.ts so that changing
// one adapter's agent-identity policy cannot silently change the
// other's. Same defaults, same reasoning: a false negative (a generated
// commit read as human) destroys signal, so matching errs toward yes.
const DEFAULT_TRAILER = /claude|codex|cursor|gpt/i
const DEFAULT_AUTHOR = /claude|codex|cursor|gpt|copilot|github-actions|\[bot\]/i
const BOT_LOGIN = /\[bot\]$|^github-actions$/i

export interface PullRequestCommit {
  sha: string
  authorName: string
  /** GitHub login when the commit is attributed to an account */
  authorLogin?: string
  authoredAt: string
  subject: string
  /** joined Co-Authored-By trailer values, '' when the commit carries none */
  trailers: string
  /** 2 or more = a merge of another branch into this one */
  parentCount: number
  files: string[]
  /**
   * New-side line ranges this commit changed, per path, parsed from the
   * commit's own patch. Absent when the snapshot was captured without
   * patches (`--no-patches`), which downgrades review-comment evidence
   * from 'line-overlap' to 'path-only'.
   */
  changedRanges?: Record<string, Array<[number, number]>>
}

export interface ReviewComment {
  id: number
  path: string
  /** new-side line in the PR's head diff; null when the comment went outdated */
  line: number | null
  body: string
  createdAt: string
  authorLogin?: string
}

export type PullRequestOutcome = 'merged' | 'closed_unmerged' | 'open'

export interface PullRequestSnapshot {
  /** "owner/name" */
  repo: string
  number: number
  title: string
  baseRef: string
  headRef: string
  headSha: string
  outcome: PullRequestOutcome
  mergedAt: string | null
  closedAt: string | null
  /** login of whoever pressed merge; a bot here is not an owner declaration */
  mergedByLogin: string | null
  mergeCommitSha: string | null
  commits: PullRequestCommit[]
  reviewComments: ReviewComment[]
  /** a later commit on the base branch that reverts this PR's merge */
  revertedBy?: { sha: string; subject: string; at: string }
  capturedAt: string
}

export type PullRequestClosure =
  /** a human, non-merge commit on the branch edited the agent's file before merge */
  | 'branch-edit'
  /** the merge commit's blob for a path differs from both parents: a human wrote it while resolving */
  | 'merge-resolution'
  /** merged with no human edit of that path: acceptance without a correction */
  | 'merge-as-accepted'

export interface StatedCorrection {
  commentId: number
  path: string
  line: number | null
  body: string
  at: string
  /** the commit that changed the same path after the comment was written */
  answeredBySha: string
  /**
   * 'line-overlap' = that commit's own patch changed lines containing the
   * comment's line. 'path-only' = the path matched and the line could not
   * be compared, because the comment is outdated or patches were not
   * captured. v0 does not classify comment intent, so a comment that was
   * a question still lands here; the basis field is what a consumer
   * filters on.
   */
  evidenceBasis: 'line-overlap' | 'path-only'
}

export interface PullRequestProvenance {
  repo: string
  number: number
  closure: PullRequestClosure
  /**
   * accepted=true only when a non-bot account merged. A bot merge and an
   * open PR are both `null`: retention is never read as acceptance
   * (vision.md; docs/decisions.md ADR-003).
   */
  acceptance: { accepted: boolean | null; basis: string; at: string | null }
  statedCorrections: StatedCorrection[]
  /** set when a later commit on the base reverts this merge */
  regression?: { sha: string; subject: string; at: string }
  /** the merge has one parent, so the branch's commit sequence is not in the base history */
  squashed: boolean
}

export interface PullRequestPair extends CommitPair {
  pullRequest: PullRequestProvenance
}

export interface PullRequestEpisode extends Omit<Episode, 'closureHeuristic'> {
  closureHeuristic: 'github-pr'
  pullRequest: PullRequestProvenance
}

/** Blob identity and parentage at specific commits. Implemented over a local clone. */
export interface RepoReader {
  /** the blob object id for a path at a commit, or null when the path is absent there */
  blobId(sha: string, path: string): string | null
  /** parent shas of a commit, first parent first; [] when the commit is not present locally */
  parents(sha: string): string[]
}

export interface PullRequestAdapterOptions {
  agentTrailerPattern?: RegExp
  agentAuthorPattern?: RegExp
}

/**
 * New-side line ranges a unified-diff patch changes, one entry per hunk.
 * `@@ -12,7 +12,9 @@` yields [12, 20]. Context lines are inside the
 * range: a hunk is the neighbourhood a reviewer's line comment lands in,
 * and narrowing to added lines only would drop a comment on a line the
 * commit deleted.
 */
export function parseHunkRanges(patch: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = []
  for (const line of patch.split('\n')) {
    const m = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line)
    if (!m) continue
    const start = Number(m[1])
    const count = m[2] === undefined ? 1 : Number(m[2])
    ranges.push([start, start + Math.max(count, 1) - 1])
  }
  return ranges
}

function agentMarkerOf(c: PullRequestCommit, opts: PullRequestAdapterOptions): string | null {
  const trailer = opts.agentTrailerPattern ?? DEFAULT_TRAILER
  const author = opts.agentAuthorPattern ?? DEFAULT_AUTHOR
  if (trailer.test(c.trailers)) return c.trailers
  if (author.test(c.authorName)) return c.authorName
  if (c.authorLogin && author.test(c.authorLogin)) return c.authorLogin
  return null
}

function acceptanceOf(snap: PullRequestSnapshot): PullRequestProvenance['acceptance'] {
  const ref = `${snap.repo}#${snap.number}`
  if (snap.revertedBy) {
    return {
      accepted: false,
      basis: `merged then reverted by ${snap.revertedBy.sha.slice(0, 9)} ("${snap.revertedBy.subject}"): the merge was withdrawn`,
      at: snap.revertedBy.at,
    }
  }
  if (snap.outcome === 'merged') {
    const who = snap.mergedByLogin
    if (who && !BOT_LOGIN.test(who)) {
      return { accepted: true, basis: `${who} merged ${ref} at ${snap.mergedAt}: an explicit act, not retention`, at: snap.mergedAt }
    }
    return {
      accepted: null,
      basis: who
        ? `${ref} was merged by ${who}, a bot account, so no human declared acceptance`
        : `${ref} is merged but the merging account is unknown, so no human declaration is recorded`,
      at: snap.mergedAt,
    }
  }
  if (snap.outcome === 'closed_unmerged') {
    return { accepted: false, basis: `${ref} was closed without merging at ${snap.closedAt}: the work was thrown away`, at: snap.closedAt }
  }
  return { accepted: null, basis: `${ref} is still open at capture time (${snap.capturedAt}); an unmerged PR is undeclared, never accepted`, at: null }
}

/**
 * Review comments that a later commit answered with a change to the same
 * path. A comment with no following change to its path is not returned:
 * v0 reports stated corrections only where the artifact shows the
 * correction being acted on.
 */
export function statedCorrectionsFor(
  snap: PullRequestSnapshot,
  paths: string[],
  afterSha: string,
): StatedCorrection[] {
  const byIndex = new Map(snap.commits.map((c, i) => [c.sha, i]))
  const from = byIndex.get(afterSha)
  const out: StatedCorrection[] = []
  for (const comment of snap.reviewComments) {
    if (!paths.includes(comment.path)) continue
    if (from !== undefined) {
      const genAt = snap.commits[from].authoredAt
      if (comment.createdAt < genAt) continue
    }
    for (const c of snap.commits) {
      if (c.authoredAt < comment.createdAt) continue
      if (!c.files.includes(comment.path)) continue
      const ranges = c.changedRanges?.[comment.path]
      const overlaps =
        comment.line !== null &&
        ranges !== undefined &&
        ranges.some(([s, e]) => comment.line! >= s && comment.line! <= e)
      out.push({
        commentId: comment.id,
        path: comment.path,
        line: comment.line,
        body: comment.body,
        at: comment.createdAt,
        answeredBySha: c.sha,
        evidenceBasis: overlaps ? 'line-overlap' : 'path-only',
      })
      break
    }
  }
  return out
}

/**
 * The pairs one pull request yields. At most one pair per agent commit,
 * taking the earliest closure that fired, in the order branch-edit,
 * merge-resolution, merge-as-accepted.
 */
export function pairsFromPullRequest(
  snap: PullRequestSnapshot,
  reader: RepoReader,
  opts: PullRequestAdapterOptions = {},
): PullRequestPair[] {
  const commits = [...snap.commits].sort((a, b) => a.authoredAt.localeCompare(b.authoredAt))
  const merge = snap.mergeCommitSha
  const mergeParents = merge ? reader.parents(merge) : []
  const squashed = merge !== null && mergeParents.length === 1
  const acceptance = acceptanceOf(snap)
  const base = {
    repo: snap.repo,
    number: snap.number,
    acceptance,
    squashed,
    ...(snap.revertedBy ? { regression: snap.revertedBy } : {}),
  }

  const pairs: PullRequestPair[] = []
  for (let i = 0; i < commits.length; i++) {
    const gen = commits[i]
    if (gen.parentCount > 1) continue // a merge of the base into the branch generated nothing
    const marker = agentMarkerOf(gen, opts)
    if (!marker) continue
    const genFiles = new Set(gen.files)
    if (genFiles.size === 0) continue

    const emit = (
      closure: PullRequestClosure,
      finalSha: string,
      finalAuthor: string,
      finalAt: string,
      paths: string[],
    ) => {
      pairs.push({
        generatedSha: gen.sha,
        finalSha,
        paths,
        generatedAuthor: gen.authorName,
        finalAuthor,
        generatedAt: gen.authoredAt,
        finalAt,
        agentMarker: marker,
        subject: gen.subject,
        pullRequest: {
          ...base,
          closure,
          statedCorrections: statedCorrectionsFor(snap, paths, gen.sha),
        },
      })
    }

    // 1. branch-edit: the human corrected the file on the branch.
    let paired = false
    for (let j = i + 1; j < commits.length; j++) {
      const fin = commits[j]
      if (agentMarkerOf(fin, opts)) continue
      if (fin.parentCount > 1) continue
      const overlap = fin.files.filter((p) => genFiles.has(p))
      if (overlap.length === 0) continue
      emit('branch-edit', fin.sha, fin.authorName, fin.authoredAt, overlap)
      paired = true
      break
    }
    if (paired || merge === null || snap.outcome !== 'merged') continue

    // 2. merge-resolution: content in the merge that is in neither parent.
    if (mergeParents.length >= 2) {
      const resolved = [...genFiles].filter((p) => {
        const atMerge = reader.blobId(merge, p)
        if (atMerge === null) return false
        return mergeParents.every((parent) => reader.blobId(parent, p) !== atMerge)
      })
      if (resolved.length > 0) {
        emit('merge-resolution', merge, snap.mergedByLogin ?? 'unknown', snap.mergedAt ?? '', resolved)
        continue
      }
    }

    // 3. merge-as-accepted: merged, still present, nobody edited it.
    const kept = [...genFiles].filter((p) => reader.blobId(merge, p) !== null)
    if (kept.length === 0) continue
    emit('merge-as-accepted', merge, snap.mergedByLogin ?? 'unknown', snap.mergedAt ?? '', kept)
  }
  return pairs
}

/**
 * One episode per pair, bounded by the pull request rather than by a
 * timeout. `closureHeuristic: 'github-pr'` is what separates these from
 * M0's episodes in the same `.ursa/episodes.json`.
 */
export function episodesFromPullRequest(pairs: PullRequestPair[], projectPath: string): PullRequestEpisode[] {
  const slug = basename(projectPath).toLowerCase().replace(/[^a-z0-9-]+/g, '-')
  return pairs.map((p) => ({
    id: `${slug}-pr${p.pullRequest.number}-${p.generatedSha.slice(0, 7)}`,
    projectPath,
    status: 'closed',
    openedAt: p.generatedAt,
    closedAt: p.finalAt,
    closureHeuristic: 'github-pr',
    touchedFiles: p.paths,
    generatedSha: p.generatedSha,
    finalSha: p.finalSha,
    agentMarker: p.agentMarker,
    subject: p.subject,
    distilled: false,
    pullRequest: p.pullRequest,
  }))
}
