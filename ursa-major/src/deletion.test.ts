// The merge-attribution defect and its fix.
//
// Shape of the bug this file pins down: two agent branches touch one
// file, a human resolves the merge and drops one side's text, and a
// later human commit is the one the pair finder picks as "final". The
// agent text the MERGE destroyed is absent from that final blob, so
// the resolver labelled it `generated_deleted` — "the human produced
// this and threw it away" — and the record named the human who wrote
// the unrelated later commit. Nobody threw it away. A merge destroyed
// it mechanically.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { findCommitPairs } from './pairfinder'
import { buildEpisodes } from './episodes'
import { resolveEpisode } from './bin/ursa'

function sh(cwd: string, args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' })
}

const BASE_A = [
  'export function header() {',
  "  return 'The frontier, read for you.'",
  '}',
].join('\n')

// The agent block the merge destroys. Long and distinctive so the
// resolver's verbatim pass cannot match it by accident.
const AGENT_BLOCK = [
  'export function formatItem(item) {',
  '  const why = item.why ?? "no stated reason"',
  '  return `- ${item.title}: ${item.claim} — so what: ${why}`',
  '}',
].join('\n')

// The rival agent block the human keeps instead.
const RIVAL_BLOCK = [
  'export function formatItem(item) {',
  '  return [item.title, item.claim].join(": ")',
  '}',
].join('\n')

const BASE_B = [
  'export function footer() {',
  "  return 'Unsubscribe any time.'",
  '}',
].join('\n')

/**
 * C0 (human)  digest.js = A + B
 * G  (agent)  digest.js = A + AGENT_BLOCK + B        <- the generation
 * OA (agent)  digest.js = A + RIVAL_BLOCK + B        on branch `other`
 * M  (human)  merge --no-ff other, resolved to A + RIVAL_BLOCK + B
 *             <- AGENT_BLOCK dies HERE, in the merge
 * F  (human)  digest.js = A + RIVAL_BLOCK + B'       an unrelated tweak
 *
 * The pair finder correctly refuses OA (agent) and M (merge) as pairing
 * targets, so it pairs G -> F. F's blob has no AGENT_BLOCK in it.
 */
function mergeDeletionRepo(): { dir: string; mergeSha: string } {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-merge-'))
  sh(dir, ['init', '-q', '-b', 'main'])
  sh(dir, ['config', 'user.email', 'human@example.com'])
  sh(dir, ['config', 'user.name', 'Human Owner'])
  const file = join(dir, 'digest.js')
  const write = (body: string) => writeFileSync(file, body + '\n')
  const commit = (msg: string) => { sh(dir, ['add', '.']); sh(dir, ['commit', '-q', '-m', msg]) }
  const AGENT_TRAILER = '\n\nCo-Authored-By: Claude <noreply@anthropic.com>'

  write([BASE_A, BASE_B].join('\n\n'))
  commit('Baseline digest module')

  write([BASE_A, AGENT_BLOCK, BASE_B].join('\n\n'))
  commit('Generate the item formatter' + AGENT_TRAILER)

  sh(dir, ['checkout', '-q', '-b', 'other', 'HEAD~1'])
  write([BASE_A, RIVAL_BLOCK, BASE_B].join('\n\n'))
  commit('Generate a leaner item formatter' + AGENT_TRAILER)

  sh(dir, ['checkout', '-q', 'main'])
  try {
    sh(dir, ['merge', '--no-ff', '--no-commit', 'other'])
  } catch {
    // expected: the two agent branches conflict on the same region
  }
  // The human resolves the conflict by keeping the rival block.
  write([BASE_A, RIVAL_BLOCK, BASE_B].join('\n\n'))
  sh(dir, ['add', '.'])
  sh(dir, ['commit', '-q', '-m', 'Merge other: keep the leaner formatter'])
  const mergeSha = sh(dir, ['rev-parse', 'HEAD']).trim()

  write([BASE_A, RIVAL_BLOCK, BASE_B.replace('Unsubscribe any time.', 'Unsubscribe whenever.')].join('\n\n'))
  commit('Soften the footer wording')

  return { dir, mergeSha }
}

describe('a merge can delete a generation, and the record must not blame the human', () => {
  it('pairs the generation past the merge and past the rival agent commit', () => {
    const { dir } = mergeDeletionRepo()
    const pairs = findCommitPairs(dir)
    const agentPairs = pairs.filter((p) => p.subject === 'Generate the item formatter')
    expect(agentPairs).toHaveLength(1)
    expect(agentPairs[0].finalAuthor).toBe('Human Owner')
    expect(agentPairs[0].paths).toEqual(['digest.js'])
  })

  it('records the merge that destroyed text as a merge deletion, not a human discard', () => {
    const { dir, mergeSha } = mergeDeletionRepo()
    const pairs = findCommitPairs(dir)
    const pair = pairs.find((p) => p.subject === 'Generate the item formatter')!
    const ep = buildEpisodes([pair], dir)[0]
    const record = resolveEpisode(dir, ep)!

    const deleted = record.generations
      .flatMap((g) => g.spans)
      .filter((s) => s.fate === 'generated_deleted')
    expect(deleted.length).toBeGreaterThan(0)

    // Every span the merge destroyed carries the merge as its cause,
    // named by sha, and none of them is attributed to a human edit.
    const fromAgentBlock = deleted.filter((s) => AGENT_BLOCK.includes(s.text.trim()))
    expect(fromAgentBlock.length).toBeGreaterThan(0)
    for (const s of fromAgentBlock) {
      expect(s.deletion?.cause).toBe('merge')
      expect(mergeSha.startsWith(s.deletion!.mergeSha!)).toBe(true)
      expect(s.deletion!.mergeSubject).toBe('Merge other: keep the leaner formatter')
    }
  })

  it('keeps merge-destroyed chars out of the human-discard statistic', () => {
    const { dir } = mergeDeletionRepo()
    const pairs = findCommitPairs(dir)
    const pair = pairs.find((p) => p.subject === 'Generate the item formatter')!
    const record = resolveEpisode(dir, buildEpisodes([pair], dir)[0])!
    const g = record.stats.generated

    expect(g.mergeDeletedChars).toBeGreaterThan(0)
    expect(g.humanDeletedChars + g.mergeDeletedChars).toBe(g.deletedChars)
    // the headline claim "drafts you discarded" must exclude the merge's work
    expect(g.humanDeletedPct).toBeLessThan(g.deletedPct)
  })

  it('still calls a real human deletion a human deletion', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ursa-human-del-'))
    sh(dir, ['init', '-q', '-b', 'main'])
    sh(dir, ['config', 'user.email', 'human@example.com'])
    sh(dir, ['config', 'user.name', 'Human Owner'])
    const file = join(dir, 'digest.js')
    writeFileSync(file, [BASE_A, AGENT_BLOCK, BASE_B].join('\n\n') + '\n')
    sh(dir, ['add', '.'])
    sh(dir, ['commit', '-q', '-m', 'Generate the item formatter\n\nCo-Authored-By: Claude <noreply@anthropic.com>'])
    writeFileSync(file, [BASE_A, BASE_B].join('\n\n') + '\n')
    sh(dir, ['add', '.'])
    sh(dir, ['commit', '-q', '-m', 'Drop the formatter, it was wrong'])

    const record = resolveEpisode(dir, buildEpisodes(findCommitPairs(dir), dir)[0])!
    const deleted = record.generations.flatMap((g) => g.spans).filter((s) => s.fate === 'generated_deleted')
    expect(deleted.length).toBeGreaterThan(0)
    for (const s of deleted) expect(s.deletion?.cause).toBe('human_edit')
    expect(record.stats.generated.mergeDeletedChars).toBe(0)
    expect(record.stats.generated.humanDeletedChars).toBe(record.stats.generated.deletedChars)
  })
})
