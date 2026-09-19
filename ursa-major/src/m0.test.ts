import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { findCommitPairs } from './pairfinder'
import { buildEpisodes } from './episodes'
import { main, resolveEpisode } from './bin/ursa'

function sh(cwd: string, cmd: string, args: string[], env: Record<string, string> = {}) {
  execFileSync(cmd, args, { cwd, env: { ...process.env, ...env }, encoding: 'utf8' })
}

function fixtureRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-m0-'))
  sh(dir, 'git', ['init', '-q', '-b', 'main'])
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
  sh(dir, 'git', ['add', '.'])
  sh(dir, 'git', ['commit', '-q', '-m', 'Generate digest module\n\nCo-Authored-By: Claude <noreply@anthropic.com>'])
  const edited = gen
    .replace('DIGEST — the latest research, summarized for you.', 'The frontier, read for you.')
    .replace('why it matters', 'so what')
  writeFileSync(join(dir, 'digest.js'), edited + '\n')
  sh(dir, 'git', ['add', '.'])
  sh(dir, 'git', ['commit', '-q', '-m', 'Tighten digest prose'])
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
