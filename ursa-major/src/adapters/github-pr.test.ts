import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  episodesFromPullRequest,
  pairsFromPullRequest,
  parseHunkRanges,
  statedCorrectionsFor,
  type PullRequestCommit,
  type PullRequestSnapshot,
  type RepoReader,
} from './github-pr'
import { gitRepoReader } from './git-reader'
import { replayReader, type RecordedRepo } from './replay'
import { coAuthoredBy } from './gh'
import { resolveEpisode } from '../bin/ursa'

const AGENT_TRAILER = 'Claude Opus 5 <noreply@anthropic.com>'

function commit(over: Partial<PullRequestCommit> & { sha: string; authoredAt: string }): PullRequestCommit {
  return {
    authorName: 'claude[bot]',
    subject: 'Agent commit',
    trailers: AGENT_TRAILER,
    parentCount: 1,
    files: ['a.md'],
    ...over,
  }
}

function snapshot(over: Partial<PullRequestSnapshot> = {}): PullRequestSnapshot {
  return {
    repo: 'owner/name',
    number: 42,
    title: 'A pull request',
    baseRef: 'main',
    headRef: 'seat/branch',
    headSha: 'head000',
    outcome: 'merged',
    mergedAt: '2026-09-28T12:00:00Z',
    closedAt: '2026-09-28T12:00:00Z',
    mergedByLogin: 'alexandrapaiz',
    mergeCommitSha: 'merge00',
    commits: [commit({ sha: 'gen0000', authoredAt: '2026-09-28T10:00:00Z' })],
    reviewComments: [],
    capturedAt: '2026-09-28T18:00:00Z',
    ...over,
  }
}

/** A reader where the merge is a two-parent merge and every path is unchanged in it. */
function plainMergeReader(): RepoReader {
  return {
    parents: (sha) => (sha === 'merge00' ? ['base000', 'head000'] : []),
    blobId: (sha, path) => `blob-${path}`,
  }
}

describe('parseHunkRanges', () => {
  it('reads new-side line ranges, one per hunk', () => {
    const patch = ['@@ -1,3 +1,4 @@', ' ctx', '+new', '@@ -40,0 +50,2 @@', '+a', '+b'].join('\n')
    expect(parseHunkRanges(patch)).toEqual([[1, 4], [50, 51]])
  })

  it('treats a hunk header with no count as one line', () => {
    expect(parseHunkRanges('@@ -7 +9 @@\n-old\n+new')).toEqual([[9, 9]])
  })
})

describe('coAuthoredBy', () => {
  it('joins the trailer values and ignores the rest of the message', () => {
    const msg = `Subject line\n\nBody text with Co-Authored-By in prose.\n\nCo-Authored-By: ${AGENT_TRAILER}`
    expect(coAuthoredBy(msg)).toBe(AGENT_TRAILER)
  })

  it('is empty for a commit with no trailer', () => {
    expect(coAuthoredBy('Owner commit\n\nno trailers here')).toBe('')
  })
})

describe('closures', () => {
  it('branch-edit: a human commit on the branch beats the merge that followed it', () => {
    const snap = snapshot({
      commits: [
        commit({ sha: 'gen0000', authoredAt: '2026-09-28T10:00:00Z', files: ['a.md', 'b.md'] }),
        commit({
          sha: 'fix0000', authoredAt: '2026-09-28T11:00:00Z', authorName: 'alexandrapaiz',
          authorLogin: 'alexandrapaiz', trailers: '', subject: 'Tighten the prose', files: ['a.md'],
        }),
      ],
    })
    const pairs = pairsFromPullRequest(snap, plainMergeReader())
    expect(pairs).toHaveLength(1)
    expect(pairs[0].pullRequest.closure).toBe('branch-edit')
    expect(pairs[0].finalSha).toBe('fix0000')
    expect(pairs[0].paths).toEqual(['a.md'])
    expect(pairs[0].pullRequest.acceptance.accepted).toBe(true)
  })

  it('merge-as-accepted: merged by a person with nothing edited', () => {
    const pairs = pairsFromPullRequest(snapshot(), plainMergeReader())
    expect(pairs).toHaveLength(1)
    expect(pairs[0].pullRequest.closure).toBe('merge-as-accepted')
    expect(pairs[0].finalSha).toBe('merge00')
    expect(pairs[0].pullRequest.acceptance.basis).toContain('an explicit act, not retention')
  })

  it('a bot merge is not an acceptance declaration', () => {
    const pairs = pairsFromPullRequest(snapshot({ mergedByLogin: 'claude[bot]' }), plainMergeReader())
    expect(pairs[0].pullRequest.acceptance.accepted).toBeNull()
    expect(pairs[0].pullRequest.acceptance.basis).toContain('a bot account')
  })

  it('an open pull request is undeclared, never accepted', () => {
    const snap = snapshot({ outcome: 'open', mergedAt: null, closedAt: null, mergedByLogin: null, mergeCommitSha: null })
    const pairs = pairsFromPullRequest(snap, plainMergeReader())
    expect(pairs).toHaveLength(0)
  })

  it('closed without merging: the human edit still pairs, and acceptance is false', () => {
    const snap = snapshot({
      outcome: 'closed_unmerged', mergedAt: null, mergedByLogin: null, mergeCommitSha: null,
      commits: [
        commit({ sha: 'gen0000', authoredAt: '2026-09-28T10:00:00Z' }),
        commit({ sha: 'fix0000', authoredAt: '2026-09-28T11:00:00Z', authorName: 'alexandrapaiz', trailers: '', files: ['a.md'] }),
      ],
    })
    const pairs = pairsFromPullRequest(snap, plainMergeReader())
    expect(pairs).toHaveLength(1)
    expect(pairs[0].pullRequest.acceptance.accepted).toBe(false)
    expect(pairs[0].pullRequest.acceptance.basis).toContain('closed without merging')
  })

  it('a reverted merge is a regression, and acceptance flips to false', () => {
    const snap = snapshot({ revertedBy: { sha: 'rev00000', subject: 'Revert "A pull request"', at: '2026-09-28T14:00:00Z' } })
    const pairs = pairsFromPullRequest(snap, plainMergeReader())
    expect(pairs[0].pullRequest.acceptance.accepted).toBe(false)
    expect(pairs[0].pullRequest.regression?.sha).toBe('rev00000')
  })

  it('a one-parent merge is reported as squashed', () => {
    const reader: RepoReader = { parents: () => ['base000'], blobId: (_s, p) => `blob-${p}` }
    const pairs = pairsFromPullRequest(snapshot(), reader)
    expect(pairs[0].pullRequest.squashed).toBe(true)
    expect(pairs[0].pullRequest.closure).toBe('merge-as-accepted')
  })

  it('a merge of the base into the branch is never treated as a generation', () => {
    const snap = snapshot({
      commits: [commit({ sha: 'mrg0000', authoredAt: '2026-09-28T10:00:00Z', parentCount: 2, subject: 'Merge main into branch' })],
    })
    expect(pairsFromPullRequest(snap, plainMergeReader())).toHaveLength(0)
  })
})

describe('statedCorrectionsFor', () => {
  const snap = snapshot({
    commits: [
      commit({ sha: 'gen0000', authoredAt: '2026-09-28T10:00:00Z' }),
      commit({
        sha: 'fix0000', authoredAt: '2026-09-28T11:30:00Z', authorName: 'alexandrapaiz', trailers: '',
        files: ['a.md'], changedRanges: { 'a.md': [[10, 14]] },
      }),
    ],
    reviewComments: [
      { id: 1, path: 'a.md', line: 12, body: 'this heading is a bare noun', createdAt: '2026-09-28T11:00:00Z' },
      { id: 2, path: 'a.md', line: 90, body: 'unrelated line', createdAt: '2026-09-28T11:00:00Z' },
      { id: 3, path: 'z.md', line: 1, body: 'different file', createdAt: '2026-09-28T11:00:00Z' },
      { id: 4, path: 'a.md', line: 12, body: 'written before the generation', createdAt: '2026-09-28T09:00:00Z' },
    ],
  })

  it('counts a comment as evidence only when a later commit changed its path', () => {
    const out = statedCorrectionsFor(snap, ['a.md'], 'gen0000')
    expect(out.map((c) => c.commentId)).toEqual([1, 2])
  })

  it('marks line containment as line-overlap and everything else as path-only', () => {
    const out = statedCorrectionsFor(snap, ['a.md'], 'gen0000')
    expect(out.find((c) => c.commentId === 1)!.evidenceBasis).toBe('line-overlap')
    expect(out.find((c) => c.commentId === 2)!.evidenceBasis).toBe('path-only')
  })
})

describe('merge-resolution against a real git repository', () => {
  function sh(cwd: string, args: string[]): string {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  }

  /**
   * A repository where two agent commits touch the same lines on two
   * branches and the owner resolves the conflict by writing her own
   * heading. That third text is in neither parent, which is the whole
   * point of the merge-resolution closure.
   */
  function conflictRepo(): { dir: string; snap: PullRequestSnapshot } {
    const dir = mkdtempSync(join(tmpdir(), 'ursa-pr-'))
    sh(dir, ['init', '-q', '-b', 'main'])
    sh(dir, ['config', 'user.email', 'human@example.com'])
    sh(dir, ['config', 'user.name', 'Human Owner'])
    const line = 'One row per condition of the governance cycle, with the evidence that satisfied it and the date it was checked.'
    const body = ['## Governance-cycle tracker', '', line, '', '| Condition | Evidence |', '|---|---|', '| first governance cycle merged | PR #3 merged 2026-09-19 |', '| second cycle | pending |'].join('\n')
    const rewrite = (heading: string, tail: string) =>
      body
        .replace('## Governance-cycle tracker', heading)
        .replace(line, line.replace('and the date it was checked.', tail))
    writeFileSync(join(dir, 'chart.md'), body + '\n')
    sh(dir, ['add', '.'])
    sh(dir, ['commit', '-q', '-m', `Chart: tracker\n\nCo-Authored-By: ${AGENT_TRAILER}`])
    const baseSha = sh(dir, ['rev-parse', 'HEAD']).trim()

    sh(dir, ['checkout', '-q', '-b', 'seat/branch'])
    writeFileSync(join(dir, 'chart.md'), rewrite('## Governance-cycle tracker (refreshed)', 'and the date the Sunday run refreshed it.') + '\n')
    sh(dir, ['add', '.'])
    sh(dir, ['commit', '-q', '-m', `Chart: refresh the tracker\n\nCo-Authored-By: ${AGENT_TRAILER}`])
    const genSha = sh(dir, ['rev-parse', 'HEAD']).trim()

    sh(dir, ['checkout', '-q', 'main'])
    writeFileSync(join(dir, 'chart.md'), rewrite('## Governance-cycle tracker (live)', 'and the date it went live.') + '\n')
    sh(dir, ['add', '.'])
    sh(dir, ['commit', '-q', '-m', `Chart: tracker is live\n\nCo-Authored-By: ${AGENT_TRAILER}`])

    // The owner merges and resolves by hand: neither branch's heading.
    try {
      sh(dir, ['merge', '--no-ff', '-m', 'Merge seat/branch: tracker as history', 'seat/branch'])
    } catch {
      // expected: the merge conflicts
    }
    writeFileSync(join(dir, 'chart.md'), rewrite('## Historical: governance-cycle tracker', 'and the date it became history.') + '\n')
    sh(dir, ['add', '.'])
    sh(dir, ['commit', '-q', '--no-edit'])
    const mergeSha = sh(dir, ['rev-parse', 'HEAD']).trim()

    const genAt = sh(dir, ['show', '-s', '--format=%aI', genSha]).trim()
    const snap = snapshot({
      repo: 'alexandrapaiz/Ursa',
      number: 7,
      mergeCommitSha: mergeSha,
      mergedAt: sh(dir, ['show', '-s', '--format=%aI', mergeSha]).trim(),
      headSha: genSha,
      commits: [commit({ sha: genSha, authoredAt: genAt, files: ['chart.md'], subject: 'Chart: refresh the tracker' })],
    })
    void baseSha
    return { dir, snap }
  }

  it('finds the path the owner wrote while resolving, and calls it merge-resolution', () => {
    const { dir, snap } = conflictRepo()
    const pairs = pairsFromPullRequest(snap, gitRepoReader(dir))
    expect(pairs).toHaveLength(1)
    expect(pairs[0].pullRequest.closure).toBe('merge-resolution')
    expect(pairs[0].paths).toEqual(['chart.md'])
    expect(pairs[0].finalSha).toBe(snap.mergeCommitSha)
  })

  it('resolves that pair into a record whose mutated span is the owner edit', () => {
    const { dir, snap } = conflictRepo()
    const episodes = episodesFromPullRequest(pairsFromPullRequest(snap, gitRepoReader(dir)), dir)
    expect(episodes).toHaveLength(1)
    expect(episodes[0].closureHeuristic).toBe('github-pr')
    expect(episodes[0].id).toMatch(/-pr7-/)
    const record = resolveEpisode(dir, episodes[0])!
    expect(record).not.toBeNull()
    const spans = record.files[0].spans
    // The sentence she reworded keeps most of the agent's words, so the
    // resolver matches it and the edit itself is the label.
    const mutated = spans.filter((s) => s.class === 'survived_mutated')
    expect(mutated).toHaveLength(1)
    expect(mutated[0].text).toContain('became history')
    expect(mutated[0].diff?.some((part) => part.added)).toBe(true)
    // The heading she replaced outright matches nothing above threshold,
    // so it lands in the category the artifact values most: text in the
    // finished work that no generation produced.
    const unprovenanced = spans.filter((s) => s.class === 'no_generation_provenance')
    expect(unprovenanced.some((s) => s.text.includes('Historical'))).toBe(true)
  })

  it('the git-diff adapter cannot see the same correction, because a merge is not an edit', async () => {
    const { dir } = conflictRepo()
    const { findCommitPairs } = await import('../pairfinder')
    expect(findCommitPairs(dir)).toHaveLength(0)
  })
})

describe('replay against Ursa pull requests that really merged', () => {
  function fixture(name: string): { snapshot: PullRequestSnapshot; repo: RecordedRepo } {
    return JSON.parse(readFileSync(join(__dirname, '..', '..', 'fixtures', 'pr', name), 'utf8'))
  }

  it('alexandrapaiz/Ursa#7: 7 pairs, 4 of them the owner resolving a merge', () => {
    const { snapshot: snap, repo } = fixture('ursa-pr-7.json')
    const pairs = pairsFromPullRequest(snap, replayReader(repo))
    expect(pairs).toHaveLength(7)
    const byClosure = pairs.reduce<Record<string, number>>((acc, p) => {
      acc[p.pullRequest.closure] = (acc[p.pullRequest.closure] ?? 0) + 1
      return acc
    }, {})
    expect(byClosure).toEqual({ 'merge-resolution': 4, 'merge-as-accepted': 3 })
    expect(pairs.every((p) => p.pullRequest.acceptance.accepted === true)).toBe(true)
    expect(pairs[0].pullRequest.acceptance.basis).toContain('alexandrapaiz merged')
  })

  it('alexandrapaiz/Ursa#12: the one resolved path is the sprint pending file', () => {
    const { snapshot: snap, repo } = fixture('ursa-pr-12.json')
    const pairs = pairsFromPullRequest(snap, replayReader(repo))
    const resolution = pairs.filter((p) => p.pullRequest.closure === 'merge-resolution')
    expect(resolution).toHaveLength(1)
    expect(resolution[0].paths).toEqual(['docs/sprints/pending.md'])
  })

  it('no fixture pair claims acceptance from a bot merge', () => {
    for (const name of ['ursa-pr-7.json', 'ursa-pr-12.json']) {
      const { snapshot: snap, repo } = fixture(name)
      for (const p of pairsFromPullRequest(snap, replayReader(repo))) {
        if (p.pullRequest.acceptance.accepted === true) {
          expect(p.pullRequest.acceptance.basis).not.toMatch(/\[bot\]/)
        }
      }
    }
  })
})
