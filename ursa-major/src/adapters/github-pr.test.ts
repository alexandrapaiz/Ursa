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

  it('both fixtures report zero intervening merges, and the zero is computed', () => {
    // Each of these pull requests contains exactly one base-into-branch
    // merge, which is the commit shape this repository produces on every
    // seat branch. Both zeros are correct, for the two different reasons
    // the walker distinguishes, and neither is hardcoded any more. A
    // future capture whose merge does clobber a path a generation wrote
    // will fail this test rather than quietly charge the person.
    const twelve = fixture('ursa-pr-12.json')
    const pairs12 = pairsFromPullRequest(twelve.snapshot, replayReader(twelve.repo))
    expect(pairs12.every((p) => p.interveningMerges.length === 0)).toBe(true)
    expect(pairs12.every((p) => p.pullRequest.unreadableMerges === undefined)).toBe(true)

    // Reason one: the branch merge is itself the closure of the pair
    // whose paths it touched, and a closure is never intervening.
    const resolution = pairs12.find((p) => p.pullRequest.closure === 'merge-resolution')!
    expect(resolution.finalSha.startsWith('045c3b0f')).toBe(true)

    // Reason two: the pair that closed past that merge wrote a path the
    // merge never touched, so nothing of it could have died there.
    const branchMerge = twelve.snapshot.commits.find((c) => c.parentCount > 1)!
    expect(branchMerge.sha.startsWith('045c3b0f')).toBe(true)
    expect(branchMerge.files).toContain('docs/sprints/pending.md')
    expect(branchMerge.files).not.toContain('docs/sprints/dispatch-queue.md')
    const past = pairs12.find(
      (p) => p.pullRequest.closure === 'merge-as-accepted' && p.paths.includes('docs/sprints/dispatch-queue.md'),
    )!
    expect(past.interveningMerges).toEqual([])

    const seven = fixture('ursa-pr-7.json')
    const pairs7 = pairsFromPullRequest(seven.snapshot, replayReader(seven.repo))
    expect(pairs7.every((p) => p.interveningMerges.length === 0)).toBe(true)
    expect(pairs7.every((p) => p.pullRequest.unreadableMerges === undefined)).toBe(true)
  })

  it('alexandrapaiz/Ursa#13: a merge sits between the pair and is still correctly not reported', () => {
    // The third reason a computed zero is right, and the only one of the
    // three that exercises the position check rather than the path
    // check. The pair runs 57a750abe -> 4f9a7b0b8, and c5484dabc is a
    // base-into-branch merge strictly between them, so position alone
    // would report it. It touched only docs/sprints/dispatch-queue.md
    // and docs/sprints/pending.md, and the generation wrote README.md,
    // docs/design/trace-stage-loops.md and docs/ideas.md. No path in
    // common, so nothing of this generation could have died there.
    //
    // #13 was open at capture time, so `mergeCommitSha` is GitHub's
    // ephemeral test-merge commit, which is not in any clone. That is
    // why no merge-as-accepted pair forms here and `squashed` is false.
    const { snapshot: snap, repo } = fixture('ursa-pr-13.json')
    const pairs = pairsFromPullRequest(snap, replayReader(repo))
    expect(pairs).toHaveLength(1)
    expect(pairs[0].generatedSha.startsWith('57a750abe')).toBe(true)
    expect(pairs[0].finalSha.startsWith('4f9a7b0b8')).toBe(true)

    const between = snap.commits.find((c) => c.sha.startsWith('c5484dabc'))!
    expect(between.parentCount).toBe(2)
    expect(between.authoredAt > snap.commits.find((c) => c.sha.startsWith('57a750abe'))!.authoredAt).toBe(true)
    expect(between.files.some((f) => pairs[0].paths.includes(f))).toBe(false)

    expect(pairs[0].interveningMerges).toEqual([])
    expect(pairs[0].pullRequest.unreadableMerges).toBeUndefined()
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

/**
 * The pull-request path's own merge-deletion case.
 *
 * `src/deletion.test.ts` pins this down for the git walker: a merge
 * destroys an agent's text, the pair's final commit is a later human
 * commit that never saw it, and the record used to call that text
 * `generated_deleted` and name the human. On a repository run through
 * pull requests the same thing happens one level in — the merge is the
 * `Merge main into <seat branch>` commit the branch takes mid-review,
 * which is the single most common commit shape in this repository's own
 * history (both PR fixtures above contain one). This adapter handed
 * every pair `interveningMerges: []`, so the attributor had nothing to
 * read and every such deletion was the human's.
 */
describe('a merge inside the pull request deletes a generation', () => {
  function sh(cwd: string, args: string[]): string {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  }

  const BASE_A = ['export function header() {', "  return 'The frontier, read for you.'", '}'].join('\n')
  const BASE_B = ['export function footer() {', "  return 'Unsubscribe any time.'", '}'].join('\n')
  // Long and distinctive so the resolver's verbatim pass cannot match it
  // anywhere else in the tree by accident.
  const AGENT_BLOCK = [
    'export function formatItem(item) {',
    '  const why = item.why ?? "no stated reason"',
    '  return `- ${item.title}: ${item.claim} — so what: ${why}`',
    '}',
  ].join('\n')
  const RIVAL_BLOCK = [
    'export function formatItem(item) {',
    '  return [item.title, item.claim].join(": ")',
    '}',
  ].join('\n')

  /**
   * C0 (human, main)       digest.js = A + B
   * G  (agent, seat/branch) digest.js = A + AGENT_BLOCK + B   <- the generation
   * C1 (agent, main)       digest.js = A + RIVAL_BLOCK + B    someone else's work
   * M  (merge, seat/branch) merge main into the branch, resolved to A + RIVAL_BLOCK + B
   *                        <- AGENT_BLOCK dies HERE, inside the pull request
   * F  (human, seat/branch) digest.js = A + RIVAL_BLOCK + B'  an unrelated tweak
   * PRM (merge, main)      the pull request's own merge commit
   *
   * `M`'s file list is the diff against its first parent, which is the
   * branch head, because that is what the GitHub commits API returns for
   * a merge commit. So `digest.js` is in it: relative to the branch, the
   * merge changed that file.
   */
  function prMergeDeletionRepo(): { dir: string; snap: PullRequestSnapshot; mergeSha: string } {
    const dir = mkdtempSync(join(tmpdir(), 'ursa-prmerge-'))
    sh(dir, ['init', '-q', '-b', 'main'])
    sh(dir, ['config', 'user.email', 'human@example.com'])
    sh(dir, ['config', 'user.name', 'Human Owner'])
    const file = join(dir, 'digest.js')
    const write = (body: string) => writeFileSync(file, body + '\n')
    const at = (n: number) => `2026-09-28T1${n}:00:00Z`
    const commitAt = (msg: string, n: number, author?: string) => {
      sh(dir, ['add', '.'])
      const args = ['commit', '-q', '-m', msg, '--date', at(n)]
      if (author) args.push('--author', author)
      sh(dir, args)
    }
    const trailer = `\n\nCo-Authored-By: ${AGENT_TRAILER}`
    const AGENT = 'claude[bot] <bot@example.com>'

    write([BASE_A, BASE_B].join('\n\n'))
    commitAt('Baseline digest module', 0)

    sh(dir, ['checkout', '-q', '-b', 'seat/branch'])
    write([BASE_A, AGENT_BLOCK, BASE_B].join('\n\n'))
    commitAt('Generate the item formatter' + trailer, 1, AGENT)
    const genSha = sh(dir, ['rev-parse', 'HEAD']).trim()

    sh(dir, ['checkout', '-q', 'main'])
    write([BASE_A, RIVAL_BLOCK, BASE_B].join('\n\n'))
    commitAt('Generate a leaner item formatter' + trailer, 2, AGENT)

    // The branch takes main, conflicts on the same region, and the
    // resolution keeps main's version. Nobody read the agent's block and
    // rejected it; it was overwritten by someone else's branch.
    sh(dir, ['checkout', '-q', 'seat/branch'])
    try {
      sh(dir, ['merge', '--no-ff', '--no-commit', 'main'])
    } catch {
      // expected: the two formatters conflict
    }
    write([BASE_A, RIVAL_BLOCK, BASE_B].join('\n\n'))
    sh(dir, ['add', '.'])
    sh(dir, ['commit', '-q', '-m', 'Merge main into seat/branch: keep the leaner formatter', '--date', at(3)])
    const mergeSha = sh(dir, ['rev-parse', 'HEAD']).trim()

    write([BASE_A, RIVAL_BLOCK, BASE_B.replace('Unsubscribe any time.', 'Unsubscribe whenever.')].join('\n\n'))
    commitAt('Soften the footer wording', 4)
    const finSha = sh(dir, ['rev-parse', 'HEAD']).trim()

    sh(dir, ['checkout', '-q', 'main'])
    sh(dir, ['merge', '-q', '--no-ff', '-m', 'Merge pull request #42 from seat/branch', 'seat/branch'])
    const prMergeSha = sh(dir, ['rev-parse', 'HEAD']).trim()

    const authoredAt = (sha: string) => sh(dir, ['show', '-s', '--format=%aI', sha]).trim()
    const snap = snapshot({
      number: 42,
      headSha: finSha,
      mergeCommitSha: prMergeSha,
      mergedAt: authoredAt(prMergeSha),
      commits: [
        commit({ sha: genSha, authoredAt: authoredAt(genSha), files: ['digest.js'], subject: 'Generate the item formatter' }),
        commit({
          sha: mergeSha, authoredAt: authoredAt(mergeSha), parentCount: 2, files: ['digest.js'],
          authorName: 'Human Owner', trailers: '', subject: 'Merge main into seat/branch: keep the leaner formatter',
        }),
        commit({
          sha: finSha, authoredAt: authoredAt(finSha), files: ['digest.js'],
          authorName: 'Human Owner', trailers: '', subject: 'Soften the footer wording',
        }),
      ],
    })
    return { dir, snap, mergeSha }
  }

  it('reports the branch merge as intervening, with its parents and the path it touched', () => {
    const { dir, snap, mergeSha } = prMergeDeletionRepo()
    const pairs = pairsFromPullRequest(snap, gitRepoReader(dir))
    expect(pairs).toHaveLength(1)
    expect(pairs[0].pullRequest.closure).toBe('branch-edit')
    expect(pairs[0].interveningMerges).toHaveLength(1)
    const m = pairs[0].interveningMerges[0]
    expect(m.sha).toBe(mergeSha)
    expect(m.paths).toEqual(['digest.js'])
    expect(m.parents).toHaveLength(2)
    expect(m.subject).toBe('Merge main into seat/branch: keep the leaner formatter')
    expect(pairs[0].pullRequest.unreadableMerges).toBeUndefined()
  })

  it('the resolved record blames the merge, not the person who made the next commit', () => {
    const { dir, snap, mergeSha } = prMergeDeletionRepo()
    const episodes = episodesFromPullRequest(pairsFromPullRequest(snap, gitRepoReader(dir)), dir)
    const record = resolveEpisode(dir, episodes[0])!
    const deleted = record.generations.flatMap((g) => g.spans).filter((s) => s.fate === 'generated_deleted')
    const distinctive = deleted.filter((s) => s.text.includes('no stated reason'))
    expect(distinctive).toHaveLength(1)
    expect(distinctive[0].deletion?.cause).toBe('merge')
    expect(mergeSha.startsWith(distinctive[0].deletion!.mergeSha!)).toBe(true)
    expect(distinctive[0].deletion!.mergeSubject).toBe('Merge main into seat/branch: keep the leaner formatter')
    expect(record.stats.generated.mergeDeletedChars).toBeGreaterThan(0)
  })

  it('with the merge withheld, the same text is charged to the human — the defect, pinned', () => {
    const { dir, snap } = prMergeDeletionRepo()
    const episodes = episodesFromPullRequest(pairsFromPullRequest(snap, gitRepoReader(dir)), dir)
    // Exactly what this adapter shipped before: the episode reaches the
    // resolver with no merges to read.
    const blind = { ...episodes[0], interveningMerges: [] }
    const record = resolveEpisode(dir, blind)!
    const distinctive = record.generations
      .flatMap((g) => g.spans)
      .filter((s) => s.fate === 'generated_deleted' && s.text.includes('no stated reason'))
    expect(distinctive).toHaveLength(1)
    expect(distinctive[0].deletion?.cause).toBe('human_edit')
    expect(record.stats.generated.mergeDeletedChars).toBe(0)
  })

  it('snapshot parentage is enough: a fork PR whose commits are not in the clone still attributes', () => {
    const { dir, snap, mergeSha } = prMergeDeletionRepo()
    const parents = gitRepoReader(dir).parents(mergeSha)
    const withParents = {
      ...snap,
      commits: snap.commits.map((c) => (c.sha === mergeSha ? { ...c, parents } : c)),
    }
    // A reader that refuses to answer `parents` for the branch merge, the
    // way a clone without the fork's objects would.
    const inner = gitRepoReader(dir)
    const forkReader: RepoReader = {
      blobId: inner.blobId,
      parents: (sha) => (sha === mergeSha ? [] : inner.parents(sha)),
    }
    const pairs = pairsFromPullRequest(withParents, forkReader)
    expect(pairs[0].interveningMerges.map((m) => m.sha)).toEqual([mergeSha])
    expect(pairs[0].interveningMerges[0].parents).toEqual(parents)
  })

  it('an unreadable merge is named on the record, never silently treated as harmless', () => {
    const { dir, snap, mergeSha } = prMergeDeletionRepo()
    const inner = gitRepoReader(dir)
    const forkReader: RepoReader = {
      blobId: inner.blobId,
      parents: (sha) => (sha === mergeSha ? [] : inner.parents(sha)),
    }
    const pairs = pairsFromPullRequest(snap, forkReader)
    expect(pairs[0].interveningMerges).toEqual([])
    expect(pairs[0].pullRequest.unreadableMerges).toEqual([mergeSha])
  })
})
