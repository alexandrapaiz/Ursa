import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { findCommitPairs, findCommitPairsWithDiagnostics } from './pairfinder'
import { buildEpisodes } from './episodes'
import { main, renderRunSummary, resolveEpisode } from './bin/ursa'

// Git's identity environment variables outrank `git config`, so a
// sandbox that exports GIT_AUTHOR_NAME (every agent runner does, and so
// does a GitHub Actions job that sets one) would rename this fixture's
// human author and break the assertions below. Pin the identity in the
// environment, where it actually wins, and let a caller override it.
const FIXTURE_IDENTITY = {
  GIT_AUTHOR_NAME: 'Human Owner',
  GIT_AUTHOR_EMAIL: 'human@example.com',
  GIT_COMMITTER_NAME: 'Human Owner',
  GIT_COMMITTER_EMAIL: 'human@example.com',
}

function sh(cwd: string, cmd: string, args: string[], env: Record<string, string> = {}) {
  execFileSync(cmd, args, {
    cwd,
    env: { ...process.env, ...FIXTURE_IDENTITY, ...env },
    encoding: 'utf8',
  })
}

/**
 * The identity the fixture's commits must carry, stated as environment
 * variables rather than left to `git config user.name`.
 *
 * This is not belt and braces, it is the only form that works. GIT_AUTHOR_NAME
 * and GIT_COMMITTER_NAME outrank a repository's own user.name, and every agent
 * harness exports them, including the one the engineer seat runs in
 * (GIT_AUTHOR_NAME=ursa-engineer). With only the `git config` lines below, the
 * fixture's "human" commit was authored by whoever happened to be running the
 * suite, so `npm test` on main failed on this file in any such environment and
 * passed on a laptop. `ambient` lets a test choose that leaked identity on
 * purpose, which is what the two probes at the bottom of this file do.
 */
const HUMAN = {
  GIT_AUTHOR_NAME: 'Human Owner',
  GIT_AUTHOR_EMAIL: 'human@example.com',
  GIT_COMMITTER_NAME: 'Human Owner',
  GIT_COMMITTER_EMAIL: 'human@example.com',
}

function fixtureRepo(ambient: Record<string, string> = HUMAN): string {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-m0-'))
  sh(dir, 'git', ['init', '-q', '-b', 'main'], ambient)
  sh(dir, 'git', ['config', 'user.email', 'human@example.com'])
  sh(dir, 'git', ['config', 'user.name', 'Human Owner'])
  const gen = [
    'export function digest() {',
    "  const items = fetchItems()",
    "  const summary = items.map(formatItem).join('\\n')",
    "  return 'DIGEST — the latest research, summarized for you.\\n' + summary",
    '}',
    'function formatItem(i) { return `- ${i.title}: ${i.claim} — why it matters: ${i.why}` }',
  ].join('\n')
  writeFileSync(join(dir, 'digest.js'), gen + '\n')
  sh(dir, 'git', ['add', '.'], ambient)
  sh(dir, 'git', ['commit', '-q', '-m', 'Generate digest module\n\nCo-Authored-By: Claude <noreply@anthropic.com>'], ambient)
  const edited = gen
    .replace('DIGEST — the latest research, summarized for you.', 'The frontier, read for you.')
    .replace('why it matters', 'so what')
  writeFileSync(join(dir, 'digest.js'), edited + '\n')
  sh(dir, 'git', ['add', '.'], ambient)
  sh(dir, 'git', ['commit', '-q', '-m', 'Tighten digest prose'], ambient)
  return dir
}

describe('M0: ursa run over a git repo', () => {
  it('finds the generated→edited commit pair via the trailer', () => {
    const repo = fixtureRepo()
    const pairs = findCommitPairs(repo)
    expect(pairs).toHaveLength(1)
    expect(pairs[0].paths).toEqual(['digest.js'])
    expect(pairs[0].agentMarker).toMatch(/Claude/)
    expect(pairs[0].finalAuthor).toBe('Human Owner')
  })

  it('never pairs an agent commit with a merge commit', () => {
    const repo = fixtureRepo()
    sh(repo, 'git', ['checkout', '-q', '-b', 'feature'])
    writeFileSync(join(repo, 'digest.js'), 'export const other = 1\n')
    sh(repo, 'git', ['add', '.'], HUMAN)
    sh(repo, 'git', ['commit', '-q', '-m', 'Agent feature\n\nCo-Authored-By: Claude <noreply@anthropic.com>'], HUMAN)
    sh(repo, 'git', ['checkout', '-q', 'main'])
    sh(repo, 'git', ['merge', '-q', '--no-ff', '-m', 'Merge feature', 'feature'], HUMAN)
    const pairs = findCommitPairs(repo)
    expect(pairs.every((p) => p.finalSha !== execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim())).toBe(true)
    expect(pairs).toHaveLength(1)
  })

  it('resolves an episode into a record with survived and mutated spans', () => {
    const repo = fixtureRepo()
    const eps = buildEpisodes(findCommitPairs(repo), repo)
    expect(eps).toHaveLength(1)
    expect(eps[0].closureHeuristic).toBe('git-commit-pair')
    const record = resolveEpisode(repo, eps[0])!
    expect(record).not.toBeNull()
    expect(record.stats.byClass.survived_verbatim.chars).toBeGreaterThan(0)
    expect(record.stats.generated.totalChars).toBeGreaterThan(0)
  })

  it('the acceptance test: one command, records on disk, exits', async () => {
    const repo = fixtureRepo()
    const code = await main(['run', repo, '--min-chars', '10'])
    expect(code).toBe(0)
    expect(existsSync(join(repo, '.ursa', 'episodes.json'))).toBe(true)
    const eps = JSON.parse(readFileSync(join(repo, '.ursa', 'episodes.json'), 'utf8'))
    expect(existsSync(join(repo, '.ursa', 'records', `${eps[0].id}.json`))).toBe(true)
  })
})

describe('a work unit that did not become a record says which bound dropped it', () => {
  // The defect, measured on 2026-10-24: `1 work unit found, 0 resolved into
  // records.` was the entire explanation the local launch gave, for both of
  // the two reasons a unit can be dropped. The two fixtures below printed
  // byte-identical output on main. One of them is fixed by passing a flag
  // and the other cannot be fixed by any flag, which is the difference the
  // reader had no way to see.
  //
  // Asserted on the sentence rather than on the count, because the count was
  // already right. What was missing was a reason, and a test that reads
  // `records.length` would pass on the output this describe block exists to
  // replace.

  /** The run's own stdout, which is the surface under test here. */
  async function runLocally(repo: string, args: string[] = []): Promise<{ out: string; code: number }> {
    const chunks: string[] = []
    const realLog = console.log
    console.log = (...a: unknown[]) => { chunks.push(a.map(String).join(' ')) }
    try {
      const code = await main(['run', repo, ...args])
      return { out: chunks.join('\n'), code }
    } finally {
      console.log = realLog
    }
  }

  /**
   * A real pair whose generation side is tiny: 32 characters, which is below
   * every floor this product ships with. The work is genuine and the only
   * thing wrong with it is its size, so the remedy is a number.
   */
  function smallPairRepo(): string {
    const dir = mkdtempSync(join(tmpdir(), 'ursa-small-'))
    sh(dir, 'git', ['init', '-q', '-b', 'main'])
    writeFileSync(join(dir, 'note.md'), 'seed\n')
    sh(dir, 'git', ['add', '.'])
    sh(dir, 'git', ['commit', '-q', '-m', 'Base'])
    writeFileSync(join(dir, 'note.md'), 'The model wrote this short note.\n')
    sh(dir, 'git', ['add', '.'])
    sh(dir, 'git', ['commit', '-q', '-m', 'Generate note\n\nCo-Authored-By: Claude <noreply@anthropic.com>'])
    writeFileSync(join(dir, 'note.md'), 'The model wrote this brief note.\n')
    sh(dir, 'git', ['add', '.'])
    sh(dir, 'git', ['commit', '-q', '-m', 'Tighten it'])
    return dir
  }

  /**
   * A real pair the resolver cannot read: the model wrote a file and the
   * person deleted it, so the finished side of every resolvable path is
   * absent and there is no import to state instead
   * (`src/resolve-episode.ts` returns null). It is also the outcome this
   * product most wants to record, since a draft thrown away whole is
   * `generated_deleted`, so the honest message has to say that no flag
   * recovers it rather than implying one does.
   */
  function deletedDraftRepo(): string {
    const dir = mkdtempSync(join(tmpdir(), 'ursa-deleted-'))
    sh(dir, 'git', ['init', '-q', '-b', 'main'])
    writeFileSync(join(dir, 'seed.md'), 'seed\n')
    sh(dir, 'git', ['add', '.'])
    sh(dir, 'git', ['commit', '-q', '-m', 'Base'])
    writeFileSync(join(dir, 'draft.md'), 'A draft the model wrote.\n'.repeat(20))
    sh(dir, 'git', ['add', '.'])
    sh(dir, 'git', ['commit', '-q', '-m', 'Generate draft\n\nCo-Authored-By: Claude <noreply@anthropic.com>'])
    rmSync(join(dir, 'draft.md'))
    sh(dir, 'git', ['add', '-A'])
    sh(dir, 'git', ['commit', '-q', '-m', 'Throw the draft away'])
    return dir
  }

  it('names the --min-chars floor, and the lowest value that would have recorded the unit', async () => {
    const repo = smallPairRepo()
    const { out } = await runLocally(repo, ['--min-chars', '200'])
    expect(out).toContain('1 work unit found, 0 resolved into records.')
    expect(out).toContain('1 work unit was found and not recorded')
    expect(out).toContain('carried fewer than 200 generated characters, which is the --min-chars floor')
    // The remedy names a value, not a placeholder. 32 is the generation
    // side of this fixture, and the floor is `>=`, so it is exactly the
    // lowest floor that keeps the unit.
    expect(out).toContain('--min-chars 32 is the lowest floor that would have recorded it')
  })

  it('and that value is the real boundary, asserted from both sides', async () => {
    // The sentence above is a claim about this resolver's behaviour, so it
    // is checked against the behaviour rather than trusted. A message that
    // names a number the run then refuses is worse than one that names no
    // number, because the reader stops believing the next sentence too.
    const repo = smallPairRepo()
    const at = await runLocally(repo, ['--min-chars', '32'])
    expect(at.out).toContain('1 work unit found, 1 resolved into record.')
    rmSync(join(repo, '.ursa'), { recursive: true, force: true })
    const above = await runLocally(repo, ['--min-chars', '33'])
    expect(above.out).toContain('1 work unit found, 0 resolved into records.')
    expect(above.out).toContain('--min-chars 32 is the lowest floor')
  })

  it('says no flag recovers a unit whose generated file the edit deleted', async () => {
    const repo = deletedDraftRepo()
    const { out } = await runLocally(repo, ['--min-chars', '10'])
    expect(out).toContain('1 work unit found, 0 resolved into records.')
    expect(out).toContain('1 resolved to nothing this run could stand behind')
    expect(out).toContain('No flag changes that one')
    expect(out).toContain('a generated file your edit deleted outright')
    // The size floor did not fire here, so its sentence must not appear.
    // Printing both reasons for one unit is the arithmetic failure the
    // abandoned-generations block upstream was already fixed for.
    expect(out).not.toContain('--min-chars floor')
  })

  it('the two cases no longer print the same thing, which is the whole defect', async () => {
    // On main both of these produced exactly `1 work unit found, 0 resolved
    // into records.` followed by two lines of zeros. This assertion is the
    // regression guard for the defect itself rather than for either message.
    const small = await runLocally(smallPairRepo(), ['--min-chars', '200'])
    const deleted = await runLocally(deletedDraftRepo(), ['--min-chars', '10'])
    expect(small.out).not.toBe(deleted.out)
    expect(small.out).toContain('--min-chars')
    expect(deleted.out).not.toContain('--min-chars floor')
  })

  it('stops reciting zeros when nothing was recorded', async () => {
    // `0 chars survived your editing verbatim, 0 survived edited.` followed
    // by `That's the part worth noticing` is what a user saw above the
    // silence. The erased-episode path in `main` already refuses to print
    // that shape, for the same reason.
    const { out } = await runLocally(smallPairRepo(), ['--min-chars', '200'])
    expect(out).not.toContain('0 chars survived your editing verbatim')
    expect(out).not.toContain('part worth noticing')
    // Still printed when there is something to notice.
    const kept = await runLocally(fixtureRepo(), ['--min-chars', '10'])
    expect(kept.out).toContain('part worth noticing')
  })
})

describe('the ambient git identity', () => {
  // GIT_AUTHOR_NAME wins over a repository's user.name, so in a project
  // committed to from inside a coding harness every commit carries the
  // harness's name. When that name matches the agent-author pattern, both
  // sides of every pair look generated, nothing is eligible as a human edit,
  // and the walk returns nothing. Measured on main before this fix: 0 pairs
  // for GIT_AUTHOR_NAME=Claude and for =Cursor, on the same fixture that
  // yields 1 pair on a laptop.
  const harness = (name: string) => ({
    GIT_AUTHOR_NAME: name,
    GIT_AUTHOR_EMAIL: 'harness@example.com',
    GIT_COMMITTER_NAME: name,
    GIT_COMMITTER_EMAIL: 'harness@example.com',
  })

  it('the fixture does not inherit the identity of whoever runs the suite', () => {
    // The assertion this file already made, now true regardless of the
    // environment. Under GIT_AUTHOR_NAME=ursa-engineer, which is what the
    // engineer seat exports, this failed on main.
    const repo = fixtureRepo()
    expect(findCommitPairs(repo)[0].finalAuthor).toBe('Human Owner')
  })

  for (const name of ['Claude', 'Cursor', 'gpt-5-codex']) {
    it(`still finds the pair when every commit is authored "${name}"`, () => {
      const repo = fixtureRepo(harness(name))
      const { pairs, diagnostics } = findCommitPairsWithDiagnostics(repo)
      // The trailer is what separates the two commits, and it still does.
      expect(pairs).toHaveLength(1)
      expect(pairs[0].agentMarker).toMatch(/Claude/)
      expect(pairs[0].finalAuthor).toBe(name)
      // The author pattern matched both commits, so it was set aside, and the
      // walk says so rather than leaving the caller to guess.
      expect(diagnostics.authorFallbackSuppressed).not.toBeNull()
      expect(diagnostics.authorFallbackSuppressed!.authors).toEqual([name])
      expect(diagnostics.generatedByTrailer).toBe(1)
      expect(diagnostics.generatedByAuthorName).toBe(0)
    })
  }

  it('keeps the author fallback when it actually separates the history', () => {
    // A history where the pattern matches one commit and not the other is the
    // case the fallback exists for. It must behave exactly as before.
    const repo = mkdtempSync(join(tmpdir(), 'ursa-mixed-'))
    sh(repo, 'git', ['init', '-q', '-b', 'main'], HUMAN)
    writeFileSync(join(repo, 'a.js'), 'export const a = 1\nexport const b = 2\n')
    sh(repo, 'git', ['add', '.'], HUMAN)
    // No trailer at all: the author name is the only thing that can classify
    // this commit as generated.
    sh(repo, 'git', ['commit', '-q', '-m', 'Generate a'], harness('Claude'))
    writeFileSync(join(repo, 'a.js'), 'export const a = 1\nexport const b = 3\n')
    sh(repo, 'git', ['add', '.'], HUMAN)
    sh(repo, 'git', ['commit', '-q', '-m', 'Fix b'], HUMAN)

    const { pairs, diagnostics } = findCommitPairsWithDiagnostics(repo)
    expect(diagnostics.authorFallbackSuppressed).toBeNull()
    expect(diagnostics.generatedByAuthorName).toBe(1)
    expect(pairs).toHaveLength(1)
    expect(pairs[0].agentMarker).toBe('Claude')
    expect(pairs[0].finalAuthor).toBe('Human Owner')
  })

  it('a suppressed fallback is reported to the user, not swallowed', () => {
    const repo = fixtureRepo(harness('Claude'))
    const { diagnostics } = findCommitPairsWithDiagnostics(repo)
    const summary = renderRunSummary([], [], diagnostics)
    expect(summary).toContain('authored "Claude"')
    expect(summary).toContain('Co-Authored-By')
    // An empty run explains itself instead of printing only a zero.
    expect(summary).toMatch(/Scanned 2 commits/)
  })

  it('a one-commit history is not described as an ambient identity', () => {
    // Below two commits no pair can exist, so suppressing would change no
    // result and the notice would only mislead.
    const repo = mkdtempSync(join(tmpdir(), 'ursa-single-'))
    sh(repo, 'git', ['init', '-q', '-b', 'main'], HUMAN)
    writeFileSync(join(repo, 'a.js'), 'export const a = 1\n')
    sh(repo, 'git', ['add', '.'], HUMAN)
    sh(repo, 'git', ['commit', '-q', '-m', 'Generate a'], harness('Claude'))
    const { pairs, diagnostics } = findCommitPairsWithDiagnostics(repo)
    expect(pairs).toHaveLength(0)
    expect(diagnostics.authorFallbackSuppressed).toBeNull()
    expect(diagnostics.commitsScanned).toBe(1)
  })
})
