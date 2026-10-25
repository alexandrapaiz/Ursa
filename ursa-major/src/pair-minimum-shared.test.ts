// One number, two sentences: the test that the sharing is real.
//
// `PAIR_MINIMUM_COMMITS` (src/launch.ts) exists for one reason. Both user
// surfaces assert the number to a reader — the pull-request comment in
// markdown, `ursa run` in a terminal — and the two sentences are written
// separately on purpose, because drift 6's rule is that only the NUMBER
// has to match across surfaces and the wording should not. A constant is
// what makes the number match. A literal `2` in each file is how the two
// come to disagree.
//
// WHY THIS FILE EXISTS SEPARATELY FROM src/launch-parity.test.ts. The
// drift 8 block there has a test titled `states the minimum once, where
// both surfaces read it`, and on 2026-10-25 the run that wrote it
// measured what that title actually checks: it asserts
// `PAIR_MINIMUM_COMMITS === 2` and four values of
// `windowTooSmallForAPair`, which is the constant's VALUE and the
// predicate's behaviour. Nothing in it exercises the SHARING. Every prose
// assertion around it spells the number out as a literal
// (`toContain('a pairing takes 2 commits')`), so replacing every
// `${PAIR_MINIMUM_COMMITS}` in src/ci/comment.ts and src/bin/ursa.ts with
// a hardcoded `2` left that whole block green: `Tests 7 passed`. The test
// written to catch a surface asserting something it had not checked was
// itself a test asserting a contract it did not exercise.
//
// WHAT CHECKS IT INSTEAD. Substitute the constant and render both
// surfaces. A surface that reads the constant prints the substituted
// number; a surface carrying a literal keeps printing `2` and fails here.
// That needs one module-level mock, which is why it is its own file:
// `vi.mock` applies to a whole test file, and src/launch-parity.test.ts
// must keep the real value for its forty-odd other assertions.
//
// WHY THE CHEAP VERSION WAS REJECTED. The ledger entry's first step
// offered a cheaper option — build the expected substring out of
// `PAIR_MINIMUM_COMMITS` and assert that string appears in both outputs —
// and asked for it to be tried first and reported on. It was, and it does
// not work: with the constant at its real value of 2, a literal `2` in a
// surface renders a byte-identical string, so the computed assertion
// passes on exactly the code it was written to reject. It only fails once
// the constant is changed, which is to say it catches the defect one
// commit after the commit that introduces it, in a run nobody has a
// reason to make. Substitution is the version that fails on the
// introducing commit, and it is barely more code.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

/**
 * The substituted minimum. Three and not two so the mock is visible in
 * the output, and not a number like 9 because the sentences also inflect
 * on it ("holds one commit" versus "holds 2") and a plausible value keeps
 * the rendered prose readable in a failure message.
 */
const SUBSTITUTED = 3

// Only the constant is replaced. `windowTooSmallForAPair` keeps its real
// behaviour (`commitsScanned < 2`), which is deliberate: the fixtures
// below are a one-commit window and a one-commit history, too small under
// either value, so the too-small branch fires for the same reason it does
// in production and the only thing under test is which number the prose
// reads. Mocking the predicate as well would make the branch itself a
// product of the mock.
vi.mock('./launch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./launch')>()
  return { ...actual, PAIR_MINIMUM_COMMITS: SUBSTITUTED }
})

const { main } = await import('./bin/ursa')
const { renderRunComment, runCommentFields } = await import('./ci/comment')
const { PAIR_MINIMUM_COMMITS } = await import('./launch')

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

/**
 * A repository of exactly one commit, and that commit an agent's.
 *
 * The same shape as `oneCommitFixture` in src/launch-parity.test.ts, with
 * the marker load-bearing for the same reason: the local surface only
 * reaches the too-short sentence after reporting how many commits looked
 * generated, so a history with no marker at all exercises a different
 * line. Duplicated rather than exported from that file, because importing
 * a helper out of a test module runs that module's own forty tests under
 * this file's mock.
 */
function oneCommitRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-pairmin-'))
  git(dir, ['init', '-q', '-b', 'main'])
  writeFileSync(join(dir, 'digest.js'), [
    'export function digest() {',
    '  const items = fetchItems()',
    "  const summary = items.map(formatItem).join('\\n')",
    "  return 'DIGEST — the latest research, summarized for you.\\n' + summary",
    '}',
  ].join('\n') + '\n')
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '-m', 'Generate digest module\n\nCo-Authored-By: Claude <noreply@anthropic.com>'])
  return dir
}

/** `ursa run` writes through `console.log`; this collects it. */
async function localRun(repo: string): Promise<{ output: string; exitCode: number }> {
  const printed: string[] = []
  const realLog = console.log
  console.log = (...a: unknown[]) => { printed.push(a.map(String).join(' ')) }
  try {
    const exitCode = await main(['run', repo, '--min-chars', '10'])
    return { output: printed.join('\n'), exitCode }
  } finally {
    console.log = realLog
  }
}

describe('the pairing minimum reaches both surfaces from one place', () => {
  it('the mock is in effect, so a green run below is not a run of the real constant', () => {
    // The vacuity check, first, because every assertion in this file is
    // read through it. If `vi.mock` stopped applying — a renamed module,
    // a changed import path in either surface — the substituted number
    // would never appear anywhere, and three tests asserting its absence
    // would pass for the wrong reason.
    expect(PAIR_MINIMUM_COMMITS).toBe(SUBSTITUTED)
    expect(SUBSTITUTED).not.toBe(2)
  })

  it('the pull-request comment prints the substituted minimum, not a literal 2', () => {
    const fields = runCommentFields([], [], {
      unitsAdded: 0, unitsReinforced: 0, mode: 'ci-no-model', reason: 'test',
    })
    const comment = renderRunComment(fields, {
      prNumber: 9, repo: 'o/r', range: 'aaa1111..bbb2222',
      windowNote: 'squash merge: the branch is one commit here',
      declarationBasis: 'undeclared', recordsPath: '.ursa/records', runUrl: null,
      commitsInWindow: 1,
    })

    // Both places this surface states the number: the zero-state
    // sentence and the detail block's window line.
    expect(comment).toContain(`a pairing takes ${SUBSTITUTED} commits`)
    expect(comment).toContain(`${SUBSTITUTED} is the fewest a pairing can come from`)
    // As an absence too. A surface that read the constant in one of the
    // two places and a literal in the other would satisfy the presence
    // assertions above on its own output.
    expect(comment).not.toContain('a pairing takes 2 commits')
    expect(comment).not.toContain('2 is the fewest a pairing can come from')
  })

  it('`ursa run` prints the substituted minimum, not a literal 2', async () => {
    const { output, exitCode } = await localRun(oneCommitRepo())
    expect(exitCode).toBe(0)
    // Guard that this run reached the sentence at all, so the two
    // assertions after it are about wording rather than about a branch
    // that never ran.
    expect(output).toContain('Scanned 1 commit')
    expect(output).toContain('too short to hold one yet')

    expect(output).toContain(`a pairing takes ${SUBSTITUTED} commits`)
    expect(output).not.toContain('a pairing takes 2 commits')
  })

  it('and the two surfaces agree on it, which is the claim the constant makes', async () => {
    // Stated as one assertion over both outputs rather than inferred from
    // the two tests above, because the contract is not "each surface
    // reads a constant", it is "both read the SAME one". Two surfaces
    // each importing a different constant would pass the tests above and
    // fail this one.
    const fields = runCommentFields([], [], {
      unitsAdded: 0, unitsReinforced: 0, mode: 'ci-no-model', reason: 'test',
    })
    const comment = renderRunComment(fields, {
      prNumber: 9, repo: 'o/r', range: 'aaa1111..bbb2222',
      windowNote: 'squash merge: the branch is one commit here',
      declarationBasis: 'undeclared', recordsPath: '.ursa/records', runUrl: null,
      commitsInWindow: 1,
    })
    const { output } = await localRun(oneCommitRepo())

    const stated = (text: string): string[] =>
      [...text.matchAll(/a pairing takes (\d+) commits/g)].map((m) => m[1])
    expect(stated(comment)).toEqual([String(SUBSTITUTED)])
    expect(stated(output)).toEqual([String(SUBSTITUTED)])
    expect(stated(comment)).toEqual(stated(output))
  })
})
