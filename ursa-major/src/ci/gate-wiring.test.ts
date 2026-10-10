// Is the record self-check actually wired into the CI launch?
//
// Separate from `src/launch-parity.test.ts` because of what it took to
// test honestly. The parity file's first version asserted that a healthy
// repository passes the gate on both launches, and that assertion passes
// identically whether the gate runs or does not exist at all: removing the
// call from `src/ci/run.ts` left all eight parity tests green (measured
// 2026-10-10). A test that cannot fail is not evidence.
//
// Making the gate fire for real needs a record whose arithmetic is
// impossible, and no git fixture reliably produces one — the resolver is
// correct, which is the whole point of the bounds. So `checkRecord` is
// replaced here with one that reports a violation, and the question asked
// is the one that was actually unprotected: does the verdict reach the
// caller. Three places it has to reach, each of which was silent before:
// the exit code, so the Action's step fails; the result object, so a
// programmatic caller can see it; and the run comment, so the person
// reading five confident fields is told not to trust them.

import { mkdtempSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { BOUND_COUNT, type Violation } from '../invariants'
import type { GitHubApi } from './github'

// A real `InvariantCode` and that bound's real text, not an invented one.
// The first draft used `claims-exceed-generated`, which is not a member of
// the union: `vi.mock`'s factory is not type-checked against the module it
// replaces, so `tsc --noEmit` accepted it, and the test would have gone on
// passing while asserting against a code the gate can never emit.
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

const { runCi } = await import('./run')

describe('the CI launch reports a violated bound instead of five confident fields', () => {
  it('exits non-zero, returns the violation, and marks the comment', async () => {
    const repo = fixtureRepo()
    const head = git(repo, ['rev-parse', 'HEAD'])
    const base = git(repo, ['rev-parse', `${head}~2`])
    const eventPath = join(repo, 'event.json')
    writeFileSync(eventPath, JSON.stringify({
      repository: { full_name: 'o/r' },
      pull_request: {
        number: 3, merged: true, merge_commit_sha: null,
        base: { sha: base }, head: { sha: head },
      },
    }))

    const logs: string[] = []
    const result = await runCi({
      projectPath: repo, eventPath, repo: 'o/r', token: '',
      api: silentApi(), env: {}, post: false, minChars: 10,
      log: (l) => logs.push(l),
    })

    // One record was resolved, so the gate had something to check.
    expect(result.recordPaths).toHaveLength(1)

    // 1. The exit code. This is what fails the Action's step.
    expect(result.exitCode).toBe(1)

    // 2. The violation, on the result, with both sides of the number.
    expect(result.invariantViolations).toHaveLength(1)
    expect(result.invariantViolations[0].observed).toContain('claimed 400')

    // 3. The comment. The five fields still appear, in order, because two
    //    runs whose tables carry different rows are not comparable; what
    //    changes is the detail block's self-check line.
    expect(result.comment).toContain('**1 bound violated**')
    expect(result.comment).toContain('cannot all be true at once')
    expect(result.comment).toContain('Units resolved')
    expect(result.comment).not.toContain(`satisfies all ${BOUND_COUNT} of the bounds`)

    // And the log, because that is where the numbers themselves go.
    expect(logs.join('\n')).toContain('GEN_CLAIM_BOUNDED')
  })

  it('writes the records anyway, because an impossible record is the evidence', async () => {
    const repo = fixtureRepo()
    const head = git(repo, ['rev-parse', 'HEAD'])
    const base = git(repo, ['rev-parse', `${head}~2`])
    const eventPath = join(repo, 'event.json')
    writeFileSync(eventPath, JSON.stringify({
      repository: { full_name: 'o/r' },
      pull_request: {
        number: 3, merged: true, merge_commit_sha: null,
        base: { sha: base }, head: { sha: head },
      },
    }))
    const result = await runCi({
      projectPath: repo, eventPath, repo: 'o/r', token: '',
      api: silentApi(), env: {}, post: false, minChars: 10, log: () => {},
    })
    // Same order as `ursa run`: saved first, judged second. Withholding the
    // record would withhold the evidence of the defect from the one person
    // who could act on it.
    expect(result.recordPaths).toHaveLength(1)
    expect(result.exitCode).toBe(1)
  })
})

// --- fixtures ---------------------------------------------------------

const FIXTURE_ENV = {
  GIT_AUTHOR_NAME: 'Human Owner',
  GIT_AUTHOR_EMAIL: 'human@example.com',
  GIT_COMMITTER_NAME: 'Human Owner',
  GIT_COMMITTER_EMAIL: 'human@example.com',
  GIT_AUTHOR_DATE: '2026-10-10T09:00:00Z',
  GIT_COMMITTER_DATE: '2026-10-10T09:00:00Z',
}

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd, env: { ...process.env, ...FIXTURE_ENV }, encoding: 'utf8',
  }).trim()
}

/** The same three commits as `src/launch-parity.test.ts`: base, agent, edit. */
function fixtureRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-gate-'))
  git(dir, ['init', '-q', '-b', 'main'])
  writeFileSync(join(dir, 'README.md'), '# project\n')
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '-m', 'Base'])

  const generated = [
    'export function digest() {',
    '  const items = fetchItems()',
    "  const summary = items.map(formatItem).join('\\n')",
    "  return 'DIGEST — the latest research, summarized for you.\\n' + summary",
    '}',
    'function formatItem(i) { return `- ${i.title}: ${i.claim} — why it matters: ${i.why}` }',
  ].join('\n')
  writeFileSync(join(dir, 'digest.js'), generated + '\n')
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '-m', 'Generate digest module\n\nCo-Authored-By: Claude <noreply@anthropic.com>'])

  writeFileSync(join(dir, 'digest.js'), generated.replace('why it matters', 'so what') + '\n')
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '-m', 'Tighten digest prose'])
  return dir
}

function silentApi(): GitHubApi {
  return {
    listRepoRunComments: async () => [],
    listPrComments: async () => [],
    listReactions: async () => [],
    postComment: async (_pr, body) => ({ id: 1, html_url: 'url', created_at: 'now', body }),
    patchComment: async (_id, body) => ({ id: 1, html_url: 'url', created_at: 'now', body }),
  }
}
