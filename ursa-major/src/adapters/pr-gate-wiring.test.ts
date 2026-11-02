// Is the record self-check actually wired into the pull-request launch?
//
// Separate from `src/adapters/pr-launch.test.ts` for the reason
// `src/ci/gate-wiring.test.ts` is separate from
// `src/launch-parity.test.ts`, stated there and true again here: an
// assertion that a healthy repository passes the gate passes identically
// whether the gate runs or does not exist at all. On the CI launch that
// was measured — removing the call left all eight parity tests green on
// 2026-10-10. On this launch it was not a hypothetical at all: the gate
// genuinely did not exist on the pull-request path until 2026-11-02, and
// every test in the suite was green the whole time.
//
// Making the gate fire for real needs a record whose arithmetic is
// impossible, and no git fixture reliably produces one, because the
// resolver is correct — which is the point of the bounds. The twenty-three
// committed records that each break one bound (`fixtures/violations/`)
// cannot be handed to this launch either: the records it gates are the ones
// it resolved in-process, so there is no seam to pass a file through
// without adding one to production code for a test's benefit. So
// `checkRecord` is replaced here with one that reports a violation, and
// the question asked is the one that was unprotected: does the verdict
// reach the caller. Three places it has to reach, each of which was
// silent on this path: the exit code, so a script calling it fails; the
// result object, so a programmatic caller can see it; and the terminal, so
// the person reading a survival figure is told not to trust it.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import type { Violation } from '../invariants'
import type { PullRequestSnapshot } from './github-pr'

// A real `InvariantCode` and that bound's real text. The CI file's own
// note explains why that matters: `vi.mock`'s factory is not type-checked
// against the module it replaces, so an invented code survives
// `tsc --noEmit` and the test goes on passing while asserting against
// something the gate can never emit.
const VIOLATION: Violation = {
  code: 'GEN_CLAIM_BOUNDED',
  invariant: 'the characters of one generation claimed by final spans, counted once each, do not exceed what that generation wrote: claimed <= charsWritten',
  where: 'fixture generation 0',
  observed: 'claimed 400 > charsWritten 219',
}

vi.mock('../invariants', async (importOriginal) => {
  const real = await importOriginal<typeof import('../invariants')>()
  return { ...real, checkRecord: () => [VIOLATION] }
})

const { runPullRequestLaunch } = await import('./pr-launch')
const { runPullRequestCommand } = await import('./pr-command')

describe('the pull-request launch reports a violated bound instead of a survival figure', () => {
  it('returns the violation, exits non-zero, and writes the record anyway', () => {
    const { dir, snap } = conflictRepo()
    const result = runPullRequestLaunch({ projectPath: dir, snapshot: snap })

    // One record was resolved, so the gate had something to check.
    expect(result.records).toHaveLength(1)

    // 1. The exit code, which is what fails a script that calls this.
    expect(result.exitCode).toBe(1)

    // 2. The violation on the result, with both sides of the number.
    expect(result.gate.violations).toHaveLength(1)
    expect(result.gate.violations[0].code).toBe('GEN_CLAIM_BOUNDED')
    expect(result.gate.violations[0].observed).toContain('claimed 400')
    expect(result.gate.report).toContain('cannot all be true at once')

    // 3. Written first, judged second, the same order as the other two
    //    launches: an impossible record is still the evidence of the
    //    defect, so nothing is withheld from the person who could act on
    //    it. What changes is that the run stops reporting success.
    expect(recordFiles(dir)).toHaveLength(1)
  })

  it('the command surface prints the report on stderr and returns the same code', () => {
    const { dir, snap } = conflictRepo()
    const snapshotPath = join(dir, 'pr-7.json')
    writeFileSync(snapshotPath, JSON.stringify(snap, null, 2))
    const out: string[] = []
    const errs: string[] = []
    const code = runPullRequestCommand({
      projectPath: dir, pr: null, snapshotPath,
      out: (l) => out.push(l), err: (l) => errs.push(l),
    })
    expect(code).toBe(1)
    expect(errs.join('\n')).toContain('GEN_CLAIM_BOUNDED')
    expect(errs.join('\n')).toContain('1 record invariant violated')
    // The figures are still printed. Two runs whose output carries
    // different lines are not comparable; what changes is that the gate's
    // report sits beside them.
    expect(out.join('\n')).toContain('chars survived verbatim')
  })
})

// --- fixture ----------------------------------------------------------
//
// The same `merge-resolution` repository `src/adapters/pr-launch.test.ts`
// builds, duplicated rather than imported because importing it would pull
// that file's `vi.mock`-free module graph into this file's mocked one.

const AGENT_TRAILER = 'Claude Opus 5 <noreply@anthropic.com>'
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

function conflictRepo(): { dir: string; snap: PullRequestSnapshot } {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-prgate-'))
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
  } catch { /* expected: the merge conflicts */ }
  writeFileSync(join(dir, 'chart.md'), rewrite('## Historical: governance-cycle tracker', 'and the date it became history.') + '\n')
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '--no-edit'])
  const mergeSha = git(dir, ['rev-parse', 'HEAD']).trim()
  const at = (sha: string) => git(dir, ['show', '-s', '--format=%aI', sha]).trim()

  return {
    dir,
    snap: {
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
    },
  }
}
