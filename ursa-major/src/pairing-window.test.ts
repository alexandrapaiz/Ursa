// The pairing window: what the pair walk refuses to claim, and why.
//
// Every case here was found by running `ursa run` against a clone of
// this repository's own `main` at 0d68df0 (98 commits), which produced
// six pairs. All six named the SAME edit of the SAME file,
// docs/standards/lessons.md, and each was credited with the whole file
// as it stood at its own commit: 239,976 chars reported as "survived
// your editing verbatim" against 239,841 chars reported as generated.
// Measurement and per-mechanism attribution: docs/design/pairing-window.md.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { findCommitPairs, findCommitPairsWithDiagnostics, isAncestor } from './pairfinder'

// Author identity is set through the environment, not `git config`.
// GIT_AUTHOR_NAME outranks a repository's user.name and every agent
// harness exports it, so a fixture that relies on `git config` is
// authored by whoever runs the suite. See the long note in m0.test.ts.
const AS = (name: string, email: string) => ({
  GIT_AUTHOR_NAME: name, GIT_AUTHOR_EMAIL: email,
  GIT_COMMITTER_NAME: name, GIT_COMMITTER_EMAIL: email,
})
const HUMAN = AS('Human Owner', 'human@example.com')
// The identity this repository's own commits actually carry.
const BOT = AS('claude[bot]', 'noreply@anthropic.com')
const TRAILER = '\n\nCo-Authored-By: Claude <noreply@anthropic.com>'

function sh(cwd: string, args: string[], env: Record<string, string> = HUMAN): string {
  return execFileSync('git', args, { cwd, env: { ...process.env, ...env }, encoding: 'utf8' })
}

interface Repo {
  dir: string
  /** write `body` to `path` and commit it; `env` chooses the author */
  commit(path: string, body: string, msg: string, env?: Record<string, string>): string
  /** run a git command that creates a commit (a merge), on the same clock */
  gitCommitting(args: string[], env?: Record<string, string>): void
  at(ref: string): string
}

/**
 * A repository on a controlled clock.
 *
 * Every commit-creating call advances the clock by `stepHours`, and the
 * date is passed through GIT_AUTHOR_DATE rather than left to the real
 * one. Both halves are necessary. The age bound reads author dates, so a
 * fixture on the wall clock cannot test it at all; and a fixture that
 * dates its own commits in the past while letting `git merge` take the
 * real time produces a merge dated nine months after the commits around
 * it, which is what caught the age bound testing every commit it walked
 * instead of the edit it was about.
 */
function repo(stepHours = 1): Repo {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-window-'))
  sh(dir, ['init', '-q', '-b', 'main'])
  const epoch = Date.UTC(2026, 0, 1, 0, 0, 0)
  let tick = 0
  const when = () => new Date(epoch + tick++ * stepHours * 3_600_000).toISOString()
  const dated = (env: Record<string, string>) => {
    const d = when()
    return { ...env, GIT_AUTHOR_DATE: d, GIT_COMMITTER_DATE: d }
  }
  return {
    dir,
    commit(path, body, msg, env = HUMAN) {
      writeFileSync(join(dir, path), body + '\n')
      sh(dir, ['add', '.'], env)
      sh(dir, ['commit', '-q', '-m', msg], dated(env))
      return sh(dir, ['rev-parse', 'HEAD']).trim()
    },
    gitCommitting(args, env = HUMAN) { sh(dir, args, dated(env)) },
    at(ref) { return sh(dir, ['rev-parse', ref]).trim() },
  }
}

const LONG = (tag: string) => Array.from({ length: 40 }, (_, i) => `${tag} line ${i}`).join('\n')

describe('a merge is not a generation', () => {
  // This repository's merge commits are authored claude[bot], which
  // matches the agent-author pattern, so the walk accepted them as
  // generations and credited them with the whole file at the merge
  // point. Two of the six pairs on `main` were merges. A merge's diff
  // against a parent is other commits' work restated; it generated
  // nothing of its own.
  function mergeAuthoredByBot() {
    const r = repo()
    r.commit('doc.md', LONG('base'), 'Baseline')
    sh(r.dir, ['checkout', '-q', '-b', 'side'])
    r.commit('doc.md', LONG('base') + '\nside addition', 'Side work')
    sh(r.dir, ['checkout', '-q', 'main'])
    r.commit('other.md', 'unrelated', 'Unrelated main commit')
    // The merge: authored by the bot identity, no trailer of its own.
    r.gitCommitting(['merge', '-q', '--no-ff', '-m', 'Merge pull request #23 from side', 'side'], BOT)
    const mergeSha = r.at('HEAD')
    // A human edit of the same file afterwards, which is what the merge
    // would have paired with.
    r.commit('doc.md', LONG('base') + '\nside addition, reworded', 'Reword the addition')
    return { r, mergeSha }
  }

  it('refuses the merge as a generation and says how many it refused', () => {
    const { r, mergeSha } = mergeAuthoredByBot()
    const { pairs, diagnostics } = findCommitPairsWithDiagnostics(r.dir)
    expect(pairs.map((p) => p.generatedSha)).not.toContain(mergeSha)
    expect(diagnostics.mergeGenerationsRefused).toBe(1)
  })

  it('still records that merge as an intervening merge of a real generation', () => {
    // The second half of the same defect, and the one that costs a
    // number. `marker(fin)` used to be tested BEFORE `fin.parents.length
    // > 1`, so a merge carrying an agent marker was skipped as "another
    // agent's commit" and never reached the branch that records it. On
    // this repository's main the walk found 0 intervening merges where 8
    // merges touched the paired path, which hands every merge-caused
    // deletion back to src/deletion.ts labelled as the person's discard
    // — the exact failure that module exists to prevent.
    const r = repo()
    const base = r.commit('doc.md', LONG('base'), 'Baseline')
    r.commit('doc.md', LONG('base') + '\nagent text', 'Generate the addition' + TRAILER)
    sh(r.dir, ['checkout', '-q', '-b', 'side', base])
    r.commit('doc.md', LONG('base') + '\nrival text', 'Rival addition' + TRAILER)
    sh(r.dir, ['checkout', '-q', 'main'])
    try {
      sh(r.dir, ['merge', '--no-ff', '--no-commit', 'side'], BOT)
    } catch {
      // expected: both branches touched the same region
    }
    writeFileSync(join(r.dir, 'doc.md'), LONG('base') + '\nrival text\n')
    sh(r.dir, ['add', '.'], BOT)
    r.gitCommitting(['commit', '-q', '-m', 'Merge pull request #24 from side'], BOT)
    const mergeSha = r.at('HEAD')
    r.commit('doc.md', LONG('base') + '\nrival text, reworded', 'Reword')

    const pair = findCommitPairs(r.dir).find((p) => p.subject === 'Generate the addition')
    expect(pair).toBeDefined()
    expect(pair!.interveningMerges.map((m) => m.sha)).toContain(mergeSha)
  })
})

describe('the pairing bounds', () => {
  /** generation, then `gap` unrelated commits, then a human edit of the file */
  function withGap(gap: number, stepHours = 1) {
    const r = repo(stepHours)
    r.commit('doc.md', LONG('base'), 'Baseline')
    r.commit('doc.md', LONG('agent'), 'Generate the doc' + TRAILER)
    for (let i = 0; i < gap; i++) r.commit(`filler-${i}.md`, `filler ${i}`, `Filler ${i}`)
    r.commit('doc.md', LONG('agent') + '\nedited', 'Edit the doc')
    return r
  }

  it('pairs across a short gap', () => {
    const { pairs, diagnostics } = findCommitPairsWithDiagnostics(withGap(3).dir)
    expect(pairs).toHaveLength(1)
    expect(diagnostics.abandoned.distance).toBe(0)
  })

  it('abandons the claim past --max-pair-distance, and names the bound it used', () => {
    // 40 filler commits puts the edit 41 commits past the generation, the
    // shape of the three worst pairs on this repository's main (37, 39
    // and 42 commits).
    const { pairs, diagnostics } = findCommitPairsWithDiagnostics(withGap(40).dir)
    expect(pairs).toHaveLength(0)
    expect(diagnostics.abandoned.distance).toBe(1)
    expect(diagnostics.bounds.maxPairDistance).toBe(25)
  })

  it('makes the same claim when the caller raises the bound', () => {
    // The bound is a default, not a verdict. Someone auditing what it
    // removed has to be able to get the old answer back.
    const { pairs } = findCommitPairsWithDiagnostics(withGap(40).dir, { maxPairDistance: Infinity })
    expect(pairs).toHaveLength(1)
  })

  it('abandons the claim past --max-pair-age-hours', () => {
    // Fixture dates advance one day per commit, so a 10-commit gap is 11
    // days. The real pairs spanned 217 to 235 hours.
    const { pairs, diagnostics } = findCommitPairsWithDiagnostics(withGap(10, 24).dir, {
      maxPairAgeHours: 48,
    })
    expect(pairs).toHaveLength(0)
    expect(diagnostics.abandoned.age).toBe(1)
  })

  it('counts a generation against one bound only, the one that stopped the walk', () => {
    // 40 fillers a day apart exceeds distance (25 commits) and age (168
    // hours) at once. Attribution has to be a partition, or a summary
    // that adds the counters double-counts the same generation.
    const { diagnostics } = findCommitPairsWithDiagnostics(withGap(40, 24).dir)
    const a = diagnostics.abandoned
    expect(a.distance + a.age + a.interposedGeneration + a.notDescendant).toBe(1)
  })
})

describe('a later generation on the same line takes the correction', () => {
  // The defect that produced every one of the six real pairs. The agent
  // writes the file, the agent writes it again, then the human edits.
  // The human never had the first version in front of them, so the first
  // generation cannot claim to have survived their editing.
  function rewrittenTwice() {
    const r = repo()
    r.commit('doc.md', LONG('base'), 'Baseline')
    const first = r.commit('doc.md', LONG('first'), 'Generate the doc' + TRAILER)
    r.commit('doc.md', LONG('second'), 'Generate the doc again' + TRAILER)
    r.commit('doc.md', LONG('second') + '\nedited', 'Edit the doc')
    return { r, first }
  }

  it('pairs the later generation and not the earlier one', () => {
    const { r, first } = rewrittenTwice()
    const { pairs, diagnostics } = findCommitPairsWithDiagnostics(r.dir)
    expect(pairs).toHaveLength(1)
    expect(pairs[0].subject).toBe('Generate the doc again')
    expect(pairs.map((p) => p.generatedSha)).not.toContain(first)
    expect(diagnostics.abandoned.interposedGeneration).toBe(1)
  })

  it('pins the number the old walk reported: both generations claimed the edit', () => {
    const { r } = rewrittenTwice()
    const { pairs } = findCommitPairsWithDiagnostics(r.dir, {
      maxInterposedGenerations: Infinity,
    })
    expect(pairs).toHaveLength(2)
    // Both name the same edit. That is the double count, in miniature: six
    // pairs, one edit, on real history.
    expect(new Set(pairs.map((p) => p.finalSha)).size).toBe(1)
  })

  it('does NOT treat a rival branch merged in later as interposed', () => {
    // The boundary that the first version of this rule got wrong, caught
    // by deletion.test.ts's merge fixture. A generation on a sibling
    // branch is printed between the two by --topo-order but is not on
    // the path between them, and the merge that brought it in is the
    // mechanism that destroyed the text. Dropping the pair here loses
    // the merge-deletion signal entirely.
    const r = repo()
    const base = r.commit('doc.md', LONG('base'), 'Baseline')
    r.commit('doc.md', LONG('base') + '\nagent text', 'Generate the addition' + TRAILER)
    sh(r.dir, ['checkout', '-q', '-b', 'side', base])
    r.commit('doc.md', LONG('base') + '\nrival text', 'Rival addition' + TRAILER)
    sh(r.dir, ['checkout', '-q', 'main'])
    try {
      sh(r.dir, ['merge', '--no-ff', '--no-commit', 'side'])
    } catch {
      // expected
    }
    writeFileSync(join(r.dir, 'doc.md'), LONG('base') + '\nrival text\n')
    sh(r.dir, ['add', '.'])
    r.gitCommitting(['commit', '-q', '-m', 'Merge side: keep the rival'])
    r.commit('doc.md', LONG('base') + '\nrival text, reworded', 'Reword')

    const pair = findCommitPairs(r.dir).find((p) => p.subject === 'Generate the addition')
    expect(pair).toBeDefined()
  })
})

describe('the edit has to descend from the generation', () => {
  it('refuses an edit that is only on a branch the generation never reached', () => {
    const r = repo()
    const base = r.commit('doc.md', LONG('base'), 'Baseline')
    r.commit('doc.md', LONG('agent'), 'Generate the doc' + TRAILER)
    // A human edit of the same file on a branch forked BEFORE the
    // generation. --topo-order prints it after the generation, and its
    // blob contains none of the generation's text.
    sh(r.dir, ['checkout', '-q', '-b', 'elsewhere', base])
    r.commit('doc.md', LONG('base') + '\nedited elsewhere', 'Edit on another branch')
    const { pairs, diagnostics } = findCommitPairsWithDiagnostics(r.dir)
    expect(pairs).toHaveLength(0)
    expect(diagnostics.abandoned.notDescendant).toBe(1)
  })

  it('isAncestor answers about the graph, including the self case git defines', () => {
    const r = repo()
    const base = r.commit('doc.md', 'a', 'Baseline')
    sh(r.dir, ['checkout', '-q', '-b', 'side', base])
    const side = r.commit('doc.md', 'b', 'Side')
    sh(r.dir, ['checkout', '-q', 'main'])
    const mainTip = r.commit('other.md', 'c', 'Main')
    expect(isAncestor(r.dir, base, side)).toBe(true)
    expect(isAncestor(r.dir, side, mainTip)).toBe(false)
    expect(isAncestor(r.dir, mainTip, side)).toBe(false)
    expect(isAncestor(r.dir, side, side)).toBe(true)
  })
})

describe('the real history this was found in, reduced to a fixture', () => {
  // Five agent commits rewrite one file in sequence, one human edit at
  // the end, exactly the shape of docs/standards/lessons.md on `main`.
  // Before: five pairs, all naming the one edit, each credited with the
  // whole file. After: one.
  it('five sequential generations and one edit make one pair, not five', () => {
    const r = repo()
    r.commit('lessons.md', LONG('v0'), 'Baseline')
    for (let i = 1; i <= 5; i++) {
      r.commit('lessons.md', LONG(`v${i}`), `Sync lessons register (#${i})` + TRAILER)
    }
    const editSha = r.commit('lessons.md', LONG('v5') + '\nedited by hand', 'Lessons sync from HQ')

    const loose = findCommitPairsWithDiagnostics(r.dir, { maxInterposedGenerations: Infinity })
    expect(loose.pairs).toHaveLength(5)
    expect(new Set(loose.pairs.map((p) => p.finalSha))).toEqual(new Set([editSha]))

    const bounded = findCommitPairsWithDiagnostics(r.dir)
    expect(bounded.pairs).toHaveLength(1)
    expect(bounded.pairs[0].subject).toBe('Sync lessons register (#5)')
    expect(bounded.diagnostics.abandoned.interposedGeneration).toBe(4)
  })
})
