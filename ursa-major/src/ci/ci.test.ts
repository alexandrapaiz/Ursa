// Tests for the CI surface. The four properties worth protecting, in
// order of what breaks the product if it regresses:
//
//   1. The run comment's five fields appear in a fixed order, with zeros
//      printed rather than omitted. The comment is the environment's
//      feedback; a field that vanishes on a zero makes two runs
//      incomparable.
//   2. A 👍 is a declaration and absence is not. Nothing converts
//      silence, retention, or a merge into acceptance.
//   3. CI mode resolves with no model and reports an honest zero.
//   4. A squash merge degrades to one coarse commit and says so; a pull
//      request closed unmerged resolves nothing.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  RUN_COMMENT_MARKER, renderRunComment, renderRunCommentFieldTable,
  runCommentFields, type TuningDelta,
} from './comment'
import {
  declarationFromReaction, findPriorRunComment, readAcceptance,
  type IssueComment, type Reaction,
} from './reactions'
import { mergeWindow, NotAMergedPullRequest } from './window'
import { noModelRunner, selectDistillMode } from './distill-mode'
import { renderStepOutputs, runCi } from './run'
import type { GitHubApi } from './github'
import { findCommitPairs } from '../pairfinder'
import { buildEpisodes } from '../episodes'

const CI_ZERO: TuningDelta = {
  unitsAdded: 0, unitsReinforced: 0, mode: 'ci-no-model',
  reason: 'no model credential in the environment (looked for ANTHROPIC_API_KEY, CLAUDE_CODE_OAUTH_TOKEN)',
}

const FIELD_ORDER = [
  'Units resolved',
  'Characters survived verbatim',
  'Characters survived edited',
  'Most corrected artifact',
  'Tuning delta',
]

describe('the run comment carries the same fields in the same order', () => {
  it('prints all five rows in order on an empty run, zeros included', () => {
    const table = renderRunCommentFieldTable(runCommentFields([], [], CI_ZERO))
    const positions = FIELD_ORDER.map((label) => table.indexOf(label))
    expect(positions.every((p) => p >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    expect(table).toContain('| 0 of 0 |')
    expect(table).toContain('none — no generated text was edited in this window')
    expect(table).toContain('0 new, 0 reinforced')
  })

  it('prints the same five rows in the same order on a populated run', () => {
    const fields = runCommentFields(
      [fakeRecord({ verbatim: 15_654, mutated: 198, perFile: { 'site/index.html': 150, 'site/app.css': 48 } })],
      [fakeEpisode('a'), fakeEpisode('b')],
      { unitsAdded: 3, unitsReinforced: 1, mode: 'distilled', reason: 'ANTHROPIC_API_KEY is set and the claude CLI is on PATH' }
    )
    const table = renderRunCommentFieldTable(fields)
    const positions = FIELD_ORDER.map((label) => table.indexOf(label))
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    expect(table.split('\n')).toHaveLength(7) // header, separator, five fields
    expect(table).toContain('| 1 of 2 |')
    expect(table).toContain('15,654')
    expect(table).toContain('198')
    expect(table).toContain('`site/index.html` (150 edited characters)')
    expect(table).toContain('3 new, 1 reinforced')
  })

  it('names the most corrected artifact by edited characters, breaking ties on the path', () => {
    const fields = runCommentFields(
      [fakeRecord({ verbatim: 0, mutated: 20, perFile: { 'b.md': 10, 'a.md': 10 } })],
      [fakeEpisode('a')],
      CI_ZERO
    )
    expect(fields.mostCorrectedArtifact).toBe('a.md')
    expect(fields.mostCorrectedChars).toBe(10)
  })

  it('distinguishes a zero from CI mode from a zero a model produced', () => {
    const ci = renderRunCommentFieldTable(runCommentFields([], [], CI_ZERO))
    const model = renderRunCommentFieldTable(
      runCommentFields([], [], { unitsAdded: 0, unitsReinforced: 0, mode: 'distilled', reason: 'ANTHROPIC_API_KEY is set and the claude CLI is on PATH' })
    )
    expect(ci).toContain('no interpretation ran: no model credential in the environment')
    expect(model).not.toContain('no interpretation ran')
  })

  it('leads with the marker so the next run can find it, and asks for the reaction', () => {
    const body = renderRunComment(runCommentFields([], [], CI_ZERO), {
      prNumber: 92, repo: 'alexandrapaiz/Ursa', range: 'abc1234..def5678',
      windowNote: 'merge commit: window is the pull request\'s own commits',
      declarationBasis: 'undeclared', recordsPath: '/tmp/x/.ursa/records', runUrl: null,
    })
    expect(body.startsWith(RUN_COMMENT_MARKER)).toBe(true)
    expect(body).toContain('React 👍')
    expect(body).toContain('retention is never read as acceptance')
  })
})

describe('the empty-window sentence names the bound that dropped the unit', () => {
  // The defect this pins, found on 2026-10-08 by running the reconciled
  // bundle against the throwaway repository in docs/design/resolver-action.md
  // §4: the comment printed "no commit here carried an agent marker that a
  // later human commit then edited" while its own step output said
  // `units-found=1`. One commit did carry the marker. The record was dropped
  // by --min-chars, and the reader was sent to fix their commit trailers.
  const CTX = {
    prNumber: 7, repo: 'alexandrapaiz/ursa-demo', range: 'abc1234..def5678',
    windowNote: "merge style undetermined: window is the pull request's own commits",
    declarationBasis: 'undeclared', recordsPath: '/tmp/x/.ursa/records', runUrl: null,
  }
  const NO_MARKER = 'no commit here carried an agent marker'

  it('still blames authorship when, and only when, no work unit was found at all', () => {
    const body = renderRunComment(runCommentFields([], [], CI_ZERO), CTX)
    expect(body).toContain(NO_MARKER)
  })

  it('does not blame authorship when a unit was found and then dropped', () => {
    const body = renderRunComment(runCommentFields([], [fakeEpisode('a')], CI_ZERO), {
      ...CTX, dropped: { unresolvable: 0, belowMinChars: 1, minChars: 200 },
    })
    expect(body).not.toContain(NO_MARKER)
    expect(body).toContain('1 work unit was found, and it did not become a record.')
    expect(body).toContain('The reason: 1 carried fewer than 200 generated characters')
    expect(body).toContain('`--min-chars`')
  })

  it('separates the size floor from a unit this clone could not resolve', () => {
    const body = renderRunComment(runCommentFields([], [fakeEpisode('a'), fakeEpisode('b'), fakeEpisode('c')], CI_ZERO), {
      ...CTX, dropped: { unresolvable: 2, belowMinChars: 1, minChars: 200 },
    })
    expect(body).toContain('3 work units were found, and none of them became a record.')
    expect(body).toContain('Of those, 1 carried fewer than 200 generated characters')
    expect(body).toContain('2 resolved to nothing this clone could stand behind')
  })

  it('says it does not know rather than inventing a reason, when the caller tracked none', () => {
    const body = renderRunComment(runCommentFields([], [fakeEpisode('a')], CI_ZERO), CTX)
    expect(body).not.toContain(NO_MARKER)
    expect(body).toContain('did not record which bound dropped them')
  })

  it('leaves the five-field table and its order alone', () => {
    const body = renderRunComment(runCommentFields([], [fakeEpisode('a')], CI_ZERO), {
      ...CTX, dropped: { unresolvable: 0, belowMinChars: 1, minChars: 200 },
    })
    const positions = FIELD_ORDER.map((label) => body.indexOf(label))
    expect(positions.every((p) => p >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    expect(body).toContain('| 0 of 1 |')
  })
})

describe('a thumbs up is a declaration and silence is not', () => {
  const comment: IssueComment = {
    id: 42, html_url: 'https://github.com/o/r/pull/7#issuecomment-42',
    created_at: '2026-10-04T10:00:00Z', body: `${RUN_COMMENT_MARKER}\n\nnumbers`,
  }

  it('finds the newest marked comment and ignores unmarked ones', () => {
    const older: IssueComment = { ...comment, id: 7, created_at: '2026-10-01T10:00:00Z' }
    const unrelated: IssueComment = { ...comment, id: 9, created_at: '2026-10-05T10:00:00Z', body: 'lgtm' }
    expect(findPriorRunComment([older, comment, unrelated], RUN_COMMENT_MARKER)?.commentId).toBe(42)
    expect(findPriorRunComment([unrelated], RUN_COMMENT_MARKER)).toBeNull()
  })

  it('reads a 👍 as accepted, naming who left it and when', () => {
    const reactions: Reaction[] = [
      { content: '+1', user: { login: 'alexandrapaiz' }, created_at: '2026-10-04T11:00:00Z' },
      { content: 'heart', user: { login: 'someone' }, created_at: '2026-10-04T12:00:00Z' },
    ]
    const prior = readAcceptance(findPriorRunComment([comment], RUN_COMMENT_MARKER)!, reactions)
    expect(prior.thumbsUp).toBe(1)
    expect(prior.mark).toEqual({
      step: 0, polarity: 'positive', source: 'pr-reaction', recordedAt: '2026-10-04T11:00:00Z',
    })
    const declaration = declarationFromReaction(prior)
    expect(declaration.accepted).toBe(true)
    expect(declaration.basis).toContain('alexandrapaiz')
    expect(declaration.basis).toContain('pr-reaction')
  })

  it('leaves an unreacted comment undeclared, never accepted and never rejected', () => {
    const prior = readAcceptance(findPriorRunComment([comment], RUN_COMMENT_MARKER)!, [])
    expect(prior.mark).toBeNull()
    const declaration = declarationFromReaction(prior)
    expect(declaration.accepted).toBeNull()
    expect(declaration.basis).toContain('retention is NOT acceptance')
    expect(declaration.basis).toContain('Silence stays undeclared')
  })

  it('does not read a 👎 as a verdict, and still reports that it happened', () => {
    const prior = readAcceptance(findPriorRunComment([comment], RUN_COMMENT_MARKER)!, [
      { content: '-1', user: { login: 'alexandrapaiz' }, created_at: '2026-10-04T11:00:00Z' },
    ])
    const declaration = declarationFromReaction(prior)
    expect(declaration.accepted).toBeNull()
    expect(prior.thumbsDown).toBe(1)
    expect(declaration.basis).toContain('👎 has no verified meaning')
  })

  it('treats no previous comment at all as undeclared', () => {
    expect(declarationFromReaction(null).accepted).toBeNull()
  })
})

describe('CI mode resolves without the local model', () => {
  it('reports ci-no-model with the credential names it looked for', () => {
    const mode = selectDistillMode({}, { claudeOnPath: () => true })
    expect(mode.kind).toBe('ci-no-model')
    expect(mode.reason).toContain('ANTHROPIC_API_KEY')
    expect(mode.reason).toContain('CLAUDE_CODE_OAUTH_TOKEN')
  })

  it('reports ci-no-model when a credential exists but the CLI does not', () => {
    const mode = selectDistillMode({ ANTHROPIC_API_KEY: 'sk-not-a-real-key' }, { claudeOnPath: () => false })
    expect(mode.kind).toBe('ci-no-model')
    expect(mode.reason).toContain('not on PATH')
  })

  it('selects model mode only when both the credential and the CLI are present', () => {
    const mode = selectDistillMode({ CLAUDE_CODE_OAUTH_TOKEN: 'token' }, { claudeOnPath: () => true })
    expect(mode).toEqual({ kind: 'model', model: 'sonnet', reason: 'CLAUDE_CODE_OAUTH_TOKEN is set and the claude CLI is on PATH' })
  })

  it('honours an explicit off switch even with a credential present', () => {
    expect(selectDistillMode({ URSA_DISTILL: 'off', ANTHROPIC_API_KEY: 'k' }, { claudeOnPath: () => true }).kind)
      .toBe('ci-no-model')
  })

  it('returns a parseable empty axiom list, so no axiom ever arrives without evidence', () => {
    expect(JSON.parse(noModelRunner('any prompt', 'sonnet'))).toEqual({ axioms: [] })
  })
})

describe('the merge window', () => {
  const base = {
    repository: { full_name: 'o/r' },
    pull_request: {
      number: 7, merged: true, merge_commit_sha: 'm'.repeat(40),
      base: { sha: 'b'.repeat(40) }, head: { sha: 'h'.repeat(40) },
    },
  }

  it('walks the pull request\'s own commits for a merge commit', () => {
    const w = mergeWindow(base, { parentCountOf: () => 2 })
    expect(w.style).toBe('merge-commit')
    expect(w.range).toBe(`${'b'.repeat(40)}..${'h'.repeat(40)}`)
  })

  it('degrades a squash merge to the one collapsed commit and says recurrence is lost', () => {
    const w = mergeWindow(base, { parentCountOf: () => 1 })
    expect(w.style).toBe('squash')
    expect(w.range).toBe(`${'m'.repeat(40)}~1..${'m'.repeat(40)}`)
    expect(w.note).toContain('recurrence counts inside the branch are unrecoverable')
  })

  it('resolves nothing for a pull request closed without merging', () => {
    expect(() => mergeWindow({ ...base, pull_request: { ...base.pull_request, merged: false } }))
      .toThrow(NotAMergedPullRequest)
  })
})

describe('ursa ci end to end over a real repository', () => {
  it('resolves a merged pull request, posts one comment, and writes step outputs', async () => {
    const repo = fixtureRepo()
    const posted: Array<{ prNumber: number; body: string }> = []
    const api: GitHubApi = {
      listRepoRunComments: async () => [{
        id: 11, html_url: 'https://github.com/o/r/pull/6#issuecomment-11',
        created_at: '2026-10-04T10:00:00Z', body: `${RUN_COMMENT_MARKER}\n\nprevious run`,
      }],
      listPrComments: async () => [],
      listReactions: async () => [{ content: '+1', user: { login: 'alexandrapaiz' }, created_at: '2026-10-04T11:00:00Z' }],
      postComment: async (prNumber, body) => {
        posted.push({ prNumber, body })
        return { id: 99, html_url: 'https://github.com/o/r/pull/7#issuecomment-99', created_at: '2026-10-05T10:00:00Z', body }
      },
      patchComment: async (_id, body) => ({ id: 99, html_url: 'url', created_at: '2026-10-05T10:00:00Z', body }),
    }

    const headSha = git(repo, ['rev-parse', 'HEAD'])
    const baseSha = git(repo, ['rev-parse', 'HEAD~2'])
    const eventPath = join(repo, 'event.json')
    writeFileSync(eventPath, JSON.stringify({
      repository: { full_name: 'o/r' },
      pull_request: { number: 7, merged: true, merge_commit_sha: null, base: { sha: baseSha }, head: { sha: headSha } },
    }))
    const outputsPath = join(repo, 'outputs.txt')

    const logs: string[] = []
    const result = await runCi({
      projectPath: repo, eventPath, repo: 'o/r', token: 'unused-by-the-fake',
      api, env: {}, outputsPath, log: (l) => logs.push(l),
    })

    // The record exists, carries the window note, and stayed on disk.
    expect(result.recordPaths).toHaveLength(1)
    expect(existsSync(result.recordPaths[0])).toBe(true)
    const record = JSON.parse(readFileSync(result.recordPaths[0], 'utf8'))
    expect(record.signals.notes.join(' ')).toContain('CI launch:')

    // Exactly one comment, carrying the five fields in order.
    expect(posted).toHaveLength(1)
    expect(posted[0].prNumber).toBe(7)
    const positions = FIELD_ORDER.map((label) => posted[0].body.indexOf(label))
    expect(positions.every((p) => p >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))

    // CI mode, because the fake environment has no credential.
    expect(result.mode.kind).toBe('ci-no-model')
    expect(result.fields?.tuningDelta).toMatchObject({ unitsAdded: 0, unitsReinforced: 0, mode: 'ci-no-model' })

    // The 👍 on the PREVIOUS pull request's comment is recorded against
    // that pull request, and does not label this merge's text as endorsed.
    expect(result.priorAcceptance?.mark?.source).toBe('pr-reaction')
    const acceptance = readFileSync(join(repo, '.ursa', 'acceptance.jsonl'), 'utf8').trim().split('\n')
    expect(acceptance).toHaveLength(1)
    expect(JSON.parse(acceptance[0])).toMatchObject({ thumbsUp: 1, thumbsUpBy: ['alexandrapaiz'] })
    expect(result.declaration.accepted).toBeNull()

    // Step outputs, same five fields, written by the run that produced them.
    const outputs = readFileSync(outputsPath, 'utf8')
    expect(outputs).toContain('units-resolved=1')
    expect(outputs).toContain('tuning-mode=ci-no-model')
    expect(outputs).toContain('comment-url=https://github.com/o/r/pull/7#issuecomment-99')
  })

  it('resolves nothing, and posts nothing, for a pull request closed unmerged', async () => {
    const repo = fixtureRepo()
    const eventPath = join(repo, 'event.json')
    writeFileSync(eventPath, JSON.stringify({
      repository: { full_name: 'o/r' },
      pull_request: { number: 8, merged: false, base: { sha: 'a' }, head: { sha: 'b' } },
    }))
    const api = failingApi()
    const result = await runCi({
      projectPath: repo, eventPath, repo: 'o/r', token: 't', api, env: {}, log: () => {},
    })
    expect(result.exitCode).toBe(0)
    expect(result.fields).toBeNull()
    expect(result.recordPaths).toEqual([])
  })

  it('keeps going when the reaction read fails, and still resolves', async () => {
    const repo = fixtureRepo()
    const headSha = git(repo, ['rev-parse', 'HEAD'])
    const baseSha = git(repo, ['rev-parse', 'HEAD~2'])
    const eventPath = join(repo, 'event.json')
    writeFileSync(eventPath, JSON.stringify({
      repository: { full_name: 'o/r' },
      pull_request: { number: 9, merged: true, merge_commit_sha: null, base: { sha: baseSha }, head: { sha: headSha } },
    }))
    const api: GitHubApi = {
      ...failingApi(),
      postComment: async (_pr, body) => ({ id: 1, html_url: 'url', created_at: 'now', body }),
    }
    const result = await runCi({
      projectPath: repo, eventPath, repo: 'o/r', token: 't', api, env: {}, log: () => {},
    })
    expect(result.recordPaths).toHaveLength(1)
    expect(result.priorAcceptance).toBeNull()
    expect(result.declaration.accepted).toBeNull()
  })

  it('narrows the window: the same repository resolves nothing outside the range', () => {
    const repo = fixtureRepo()
    const head = git(repo, ['rev-parse', 'HEAD'])
    expect(buildEpisodes(findCommitPairs(repo), repo)).toHaveLength(1)
    expect(findCommitPairs(repo, { range: `${head}..${head}` })).toHaveLength(0)
  })
})

describe('step outputs', () => {
  it('writes the empty string, not the word null, when nothing was edited', () => {
    const out = renderStepOutputs(runCommentFields([], [], CI_ZERO), null)
    expect(out).toContain('most-corrected-artifact=\n')
    expect(out).toContain('comment-url=\n')
    expect(out).toContain('tuning-delta=0/0')
  })
})

// --- fixtures ---------------------------------------------------------

const FIXTURE_IDENTITY = {
  GIT_AUTHOR_NAME: 'Human Owner',
  GIT_AUTHOR_EMAIL: 'human@example.com',
  GIT_COMMITTER_NAME: 'Human Owner',
  GIT_COMMITTER_EMAIL: 'human@example.com',
}

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, { cwd, env: { ...process.env, ...FIXTURE_IDENTITY }, encoding: 'utf8' }).trim()
}

/** Three commits: a base, an agent commit, and the human's edit of it. */
function fixtureRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-ci-'))
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

  const edited = generated
    .replace('DIGEST — the latest research, summarized for you.', 'The frontier, read for you.')
    .replace('why it matters', 'so what')
  writeFileSync(join(dir, 'digest.js'), edited + '\n')
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '-m', 'Tighten digest prose'])
  return dir
}

function failingApi(): GitHubApi {
  const boom = async (): Promise<never> => { throw new Error('the fake API refuses every call') }
  return {
    listRepoRunComments: boom, listPrComments: boom, listReactions: boom,
    postComment: boom, patchComment: boom,
  }
}

function fakeEpisode(id: string) {
  return {
    id, projectPath: '/tmp/p', status: 'closed' as const, openedAt: '2026-10-05T00:00:00Z',
    closedAt: '2026-10-05T01:00:00Z', closureHeuristic: 'git-commit-pair' as const,
    touchedFiles: [], generatedSha: 'a', finalSha: 'b', agentMarker: 'Claude', subject: 's', distilled: false,
    // Required on Episode since the merge-attribution work landed on
    // `main` (src/deletion.ts): a merge walked past between the generation
    // and the edit destroyed text nobody chose to discard. Empty here
    // because the comment fields this file tests read none of it.
    interveningMerges: [],
  }
}

/** The narrow slice of OutcomeRecord the comment actually reads. */
function fakeRecord(opts: { verbatim: number; mutated: number; perFile: Record<string, number> }) {
  const zero = { spans: 0, chars: 0, pct: 0 }
  return {
    stats: {
      byClass: {
        survived_verbatim: { spans: 1, chars: opts.verbatim, pct: 0 },
        survived_mutated: { spans: 1, chars: opts.mutated, pct: 0 },
        generated_deleted: zero,
        no_generation_provenance: zero,
      },
      perFile: Object.entries(opts.perFile).map(([path, mutated]) => ({
        path, coveredChars: mutated, byClass: { survived_mutated: mutated } as never,
      })),
    },
  } as never
}
