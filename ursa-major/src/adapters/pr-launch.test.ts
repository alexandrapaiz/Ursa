// Three launches, one resolver: the pull-request half of the test.
//
// `src/launch-parity.test.ts` holds the git-pair half and opens by saying
// what it is for: until 2026-10-10 the claim that `ursa run` and `ursa ci`
// are one resolver fired two ways was held up by an import path and
// nothing else, because no test resolved one repository through both and
// compared. This file is the same test for the launch that was not in
// that file at all.
//
// The pull-request path matters more than its line count suggests. It is
// the only path that finds anything on a repository whose every commit is
// an agent's: the n=3 dogfood run over 470 commits of this repository
// produced zero records through the git-pair path, and the adapter reads
// 23 pairs out of 13 merged pull requests over the same history
// (`src/adapters/README.md`). So the launch with no gate, no erasure
// check and the wrong floor was the one running on the corpus the product
// demonstrates itself with.
//
// WHY THIS FILE IS NOT A SECOND `bothLaunches` COMPARISON. The git-pair
// file diffs two records field by field, which it can do because both of
// its launches read the same commit pairs off the default branch. This
// launch reads a different population on purpose — commits inside one
// pull request, closed by a merge — so there is no record to diff against.
// What can be compared, and is compared here, is the three DECISIONS, each
// against the behaviour measured on 2026-11-02 before the repair.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { forget, isForgotten, loadConsent } from '../consent'
import { PR_LAUNCH_MIN_CHARS, renderPullRequestSummary, runPullRequestLaunch } from './pr-launch'
import { runPullRequestCommand } from './pr-command'
import { main } from '../bin/ursa'
import { IMPORT_TRAILER } from '../vendored'
import type { PullRequestSnapshot } from './github-pr'

const AGENT_TRAILER = 'Claude Opus 5 <noreply@anthropic.com>'

// Author identity through the environment, not `git config`:
// GIT_AUTHOR_NAME outranks a repository's user.name and every agent
// harness exports it, so a fixture that relies on `git config` is
// authored by whoever runs the suite. The long version is in m0.test.ts.
const ENV = {
  GIT_AUTHOR_NAME: 'Human Owner',
  GIT_AUTHOR_EMAIL: 'human@example.com',
  GIT_COMMITTER_NAME: 'Human Owner',
  GIT_COMMITTER_EMAIL: 'human@example.com',
}

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd, env: { ...process.env, ...ENV }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function recordFiles(dir: string): string[] {
  const d = join(dir, '.ursa', 'records')
  return existsSync(d) ? readdirSync(d).sort() : []
}

/**
 * A pull request the owner closed by resolving a conflict by hand, so the
 * final text is in neither parent. The same repository
 * `src/adapters/github-pr.test.ts` builds for the `merge-resolution`
 * closure, kept in this file rather than imported because the two files
 * assert different things about it and a shared builder makes one of them
 * break when the other's needs change.
 *
 * Its one record carries 281 generated characters, which is above the
 * 200-character default floor and below any floor a test raises.
 */
function conflictRepo(): { dir: string; snap: PullRequestSnapshot } {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-prlaunch-'))
  git(dir, ['init', '-q', '-b', 'main'])
  git(dir, ['config', 'user.email', 'human@example.com'])
  git(dir, ['config', 'user.name', 'Human Owner'])
  const line = 'One row per condition of the governance cycle, with the evidence that satisfied it and the date it was checked.'
  const body = [
    '## Governance-cycle tracker', '', line, '',
    '| Condition | Evidence |', '|---|---|',
    '| first governance cycle merged | PR #3 merged 2026-09-19 |', '| second cycle | pending |',
  ].join('\n')
  const rewrite = (heading: string, tail: string) =>
    body.replace('## Governance-cycle tracker', heading)
      .replace(line, line.replace('and the date it was checked.', tail))

  writeFileSync(join(dir, 'chart.md'), body + '\n')
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '-m', `Chart: tracker\n\nCo-Authored-By: ${AGENT_TRAILER}`])

  git(dir, ['checkout', '-q', '-b', 'seat/branch'])
  writeFileSync(join(dir, 'chart.md'), rewrite('## Governance-cycle tracker (refreshed)', 'and the date the Sunday run refreshed it.') + '\n')
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '-m', `Chart: refresh the tracker\n\nCo-Authored-By: ${AGENT_TRAILER}`])
  const genSha = git(dir, ['rev-parse', 'HEAD']).trim()

  git(dir, ['checkout', '-q', 'main'])
  writeFileSync(join(dir, 'chart.md'), rewrite('## Governance-cycle tracker (live)', 'and the date it went live.') + '\n')
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '-m', `Chart: tracker is live\n\nCo-Authored-By: ${AGENT_TRAILER}`])
  try {
    git(dir, ['merge', '--no-ff', '-m', 'Merge seat/branch: tracker as history', 'seat/branch'])
  } catch { /* expected: the merge conflicts, which is the point */ }
  writeFileSync(join(dir, 'chart.md'), rewrite('## Historical: governance-cycle tracker', 'and the date it became history.') + '\n')
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '--no-edit'])
  const mergeSha = git(dir, ['rev-parse', 'HEAD']).trim()
  const at = (sha: string) => git(dir, ['show', '-s', '--format=%aI', sha]).trim()

  const snap: PullRequestSnapshot = {
    repo: 'alexandrapaiz/Ursa', number: 7, title: 'Chart: refresh the tracker',
    baseRef: 'main', headRef: 'seat/branch', headSha: genSha,
    outcome: 'merged', mergedAt: at(mergeSha), closedAt: at(mergeSha),
    mergedByLogin: 'alexandrapaiz', mergeCommitSha: mergeSha,
    commits: [{
      sha: genSha, authoredAt: at(genSha), authorName: 'claude[bot]',
      subject: 'Chart: refresh the tracker', trailers: AGENT_TRAILER,
      parentCount: 1, files: ['chart.md'],
    }],
    reviewComments: [], capturedAt: '2026-09-28T18:00:00Z',
  }
  return { dir, snap }
}

/**
 * The same pull request, with the agent's commit declaring its one path
 * an import through the `Ursa-Imported-Path:` trailer.
 *
 * That declaration is read as authoritative for that commit's paths
 * (`src/vendored.ts`), so every resolvable path in the episode is
 * refused, and the record `resolveEpisode` returns has no files, no
 * generations, and one `exclusions` entry naming where the content came
 * from. It is the refusal-only record drift 1 was found on, and the one a
 * generation-side floor always drops.
 */
function importDeclaringRepo(): { dir: string; snap: PullRequestSnapshot } {
  const { dir, snap } = conflictRepo()
  // Rewrite the branch commit's message to declare the path, keeping its
  // tree and its parent, then rebuild the merge over it. Amending on the
  // branch is simpler than constructing a second fixture and keeps the
  // closure a `merge-resolution` one.
  git(dir, ['checkout', '-q', 'seat/branch'])
  git(dir, ['commit', '-q', '--amend', '-m',
    `Chart: refresh the tracker\n\nCo-Authored-By: ${AGENT_TRAILER}\n${IMPORT_TRAILER}: chart.md`])
  const genSha = git(dir, ['rev-parse', 'HEAD']).trim()
  git(dir, ['checkout', '-q', 'main'])
  git(dir, ['reset', '-q', '--hard', 'HEAD~1'])
  try {
    git(dir, ['merge', '--no-ff', '-m', 'Merge seat/branch: tracker as history', 'seat/branch'])
  } catch { /* expected */ }
  const current = git(dir, ['show', 'HEAD:chart.md'])
  writeFileSync(join(dir, 'chart.md'), current)
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '--no-edit'])
  const mergeSha = git(dir, ['rev-parse', 'HEAD']).trim()
  const at = (sha: string) => git(dir, ['show', '-s', '--format=%aI', sha]).trim()
  return {
    dir,
    snap: {
      ...snap,
      headSha: genSha, mergeCommitSha: mergeSha, mergedAt: at(mergeSha), closedAt: at(mergeSha),
      commits: [{ ...snap.commits[0], sha: genSha, authoredAt: at(genSha) }],
    },
  }
}

describe('drift 9: the pull-request launch no longer undoes `ursa forget`', () => {
  // Measured on this fixture on 2026-11-02, against the loop that was in
  // `src/adapters/cli.ts`: the user erased the record, the file was
  // deleted and the tombstone written, and the next run over the same
  // pull request wrote the record straight back to disk. `ursa forget`'s
  // own success message says "its id is tombstoned, so `ursa run` will
  // not rebuild it from the git history it came from"
  // (src/consent.cli.ts), which was true of the launch it names and false
  // of this one.
  it('skips the episode the user erased, and says so instead of reciting zeros', () => {
    const { dir, snap } = conflictRepo()

    const first = runPullRequestLaunch({ projectPath: dir, snapshot: snap })
    expect(first.records).toHaveLength(1)
    expect(recordFiles(dir)).toHaveLength(1)

    const id = first.records[0].task.id
    const tombstone = forget(dir, id)
    expect(tombstone.removed.recordFile).toBe(true)
    expect(recordFiles(dir)).toEqual([])
    expect(isForgotten(loadConsent(dir), id)).toBe(true)

    const second = runPullRequestLaunch({ projectPath: dir, snapshot: snap })
    expect(second.records).toEqual([])
    expect(second.erased).toEqual([id])
    // The deletion held on disk, which is the whole of constraint 2.
    expect(recordFiles(dir)).toEqual([])

    // And the summary names it rather than printing a survival table of
    // zeros at someone whose only work unit they erased.
    const summary = renderPullRequestSummary(snap, second, dir)
    expect(summary).toContain('1 work unit, 0 records.')
    expect(summary).toContain('Every one of them is erased. Nothing was rebuilt.')
    expect(summary).not.toContain('chars survived verbatim')
  })

  it('the episode id the launch skips is the record id `ursa forget` takes', () => {
    // The two are the same string, and nothing in the types says so: the
    // consent record tombstones a RECORD id and `erasedEpisodeIds` is
    // handed EPISODE ids. On the git-pair launch they coincide because
    // `resolveEpisode` copies `ep.id` into `record.task.id`, and this
    // launch inherits that through the same function. Asserted because
    // the erasure check is silently a no-op the day it stops being true.
    const { dir, snap } = conflictRepo()
    const result = runPullRequestLaunch({ projectPath: dir, snapshot: snap })
    expect(result.records[0].task.id).toBe(result.episodes[0].id)
  })
})

describe('drift 11: the size floor is the shared one, and a drop names its bound', () => {
  it('a refusal-only record survives a floor it has no generation side to clear', () => {
    const { dir, snap } = importDeclaringRepo()
    const result = runPullRequestLaunch({ projectPath: dir, snapshot: snap })

    // The record exists and is a refusal: no generated characters, one
    // exclusion naming where the content came from.
    expect(result.records).toHaveLength(1)
    const record = result.records[0]
    expect(record.stats.generated.totalChars).toBe(0)
    expect(record.exclusions?.length).toBeGreaterThan(0)
    expect(record.exclusions?.[0].path).toBe('chart.md')

    // The predicate this launch used until 2026-11-02 was
    // `record.stats.generated.totalChars < minChars`, which is 0 < 200 on
    // this record, so it dropped it and restored exactly the silence the
    // refusal record was built to replace: an absent file in
    // `.ursa/records/` is indistinguishable from a run that found nothing.
    expect(record.stats.generated.totalChars).toBeLessThan(PR_LAUNCH_MIN_CHARS)
    expect(recordFiles(dir)).toHaveLength(1)
    expect(result.dropped.belowMinChars).toBe(0)
  })

  it('a unit the floor really does drop is counted, and the summary names the value that would record it', () => {
    const { dir, snap } = conflictRepo()
    const result = runPullRequestLaunch({ projectPath: dir, snapshot: snap, minChars: 100_000 })
    expect(result.records).toEqual([])
    expect(result.dropped.belowMinChars).toBe(1)
    expect(result.dropped.unresolvable).toBe(0)
    expect(result.dropped.minChars).toBe(100_000)
    // 281 generated characters on this fixture. The remedy names a value
    // rather than a placeholder, which is the point of
    // `largestBelowFloor` in src/launch.ts.
    expect(result.dropped.largestBelowFloor).toBe(281)

    const summary = renderPullRequestSummary(snap, result, dir)
    expect(summary).toContain('fewer than 100,000 generated characters')
    expect(summary).toContain('--min-chars floor')
    expect(summary).toContain('--min-chars 281 would record it')
    // And it does not blame the other reason. A launch reporting both for
    // one unit would be printing arithmetic that cannot be true.
    expect(summary).not.toContain('resolved to nothing')
  })

  it('the default floor is one constant, not a literal in each surface', () => {
    expect(PR_LAUNCH_MIN_CHARS).toBe(200)
    const { dir, snap } = conflictRepo()
    const explicit = runPullRequestLaunch({ projectPath: dir, snapshot: snap, minChars: PR_LAUNCH_MIN_CHARS })
    expect(explicit.dropped.minChars).toBe(200)
    const defaulted = runPullRequestLaunch({ projectPath: dir, snapshot: snap })
    expect(defaulted.dropped.minChars).toBe(200)
  })
})

describe('drift 10: the record self-check runs, and its verdict is the exit code', () => {
  // Whether the gate DETECTS anything is tested against twenty-three
  // committed broken records in `src/invariants.violations.test.ts`, and
  // whether its verdict reaches this launch's exit code, result object
  // and report is tested with a replaced `checkRecord` in
  // `src/adapters/pr-gate-wiring.test.ts`, for the reason that file's
  // header gives. What is asserted here is the half those two cannot
  // reach: that a healthy pull request is gated at all rather than
  // unexamined, which is visible as a gate result on the object.
  it('a clean pull request is checked and reported as checked', () => {
    const { dir, snap } = conflictRepo()
    const result = runPullRequestLaunch({ projectPath: dir, snapshot: snap })
    expect(result.gate.violations).toEqual([])
    expect(result.gate.report).toBe('')
    expect(result.exitCode).toBe(0)
    // The record says which rules it was checked against, which is the
    // reader-facing half of the same fact.
    expect(result.records[0].task.gatedBy?.codes.length).toBeGreaterThan(0)
  })
})

describe('`ursa pr` is the surface, and it is the same function', () => {
  it('resolves a pull request from a snapshot on disk, with no gh and no network', () => {
    const { dir, snap } = conflictRepo()
    const snapshotPath = join(dir, 'pr-7.json')
    writeFileSync(snapshotPath, JSON.stringify(snap, null, 2))
    const out: string[] = []
    const code = runPullRequestCommand({
      projectPath: dir, pr: null, snapshotPath, out: (l) => out.push(l), err: () => {},
    })
    expect(code).toBe(0)
    expect(out.join('\n')).toContain('alexandrapaiz/Ursa#7: 1 work unit, 1 record.')
    expect(out.join('\n')).toContain('Resolved by:')
    expect(recordFiles(dir)).toHaveLength(1)
  })

  it('`ursa pr` reaches it, and refuses without a number instead of resolving the wrong thing', async () => {
    const { dir, snap } = conflictRepo()
    const snapshotPath = join(dir, 'pr-7.json')
    writeFileSync(snapshotPath, JSON.stringify(snap, null, 2))

    expect(await main(['pr', dir, '--snapshot', snapshotPath])).toBe(0)
    expect(recordFiles(dir)).toHaveLength(1)

    // No --pr and no --snapshot is a usage error, not a capture of
    // whatever number `Number(undefined)` becomes.
    expect(await main(['pr', dir])).toBe(2)
  })

  it('a --pr that is not a pull request number is refused before anything is captured', () => {
    const { dir } = conflictRepo()
    const errs: string[] = []
    expect(runPullRequestCommand({ projectPath: dir, pr: 'eleven', out: () => {}, err: (l) => errs.push(l) })).toBe(2)
    expect(errs.join('\n')).toContain('is not a pull request number')
    expect(recordFiles(dir)).toEqual([])
  })

  it('the usage text names the command, so a reader of one binary can find the path', async () => {
    const errs: string[] = []
    const real = console.error
    console.error = (l: string) => { errs.push(l) }
    try {
      expect(await main([])).toBe(2)
    } finally {
      console.error = real
    }
    expect(errs.join('\n')).toContain('ursa pr <projectPath> --pr N')
  })
})
