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
import { findCommitPairs, type MergeEvent } from './pairfinder'
import { buildEpisodes } from './episodes'
import { resolveEpisode } from './bin/ursa'
import { gitDeletionAttributor } from './deletion'

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

    // The distinctive line of the agent block — the one no other commit
    // in the repo contains — carries the merge as its cause, named by
    // sha, so a reader can go check the claim against the repo.
    const distinctive = deleted.filter((s) => s.text.includes('no stated reason'))
    expect(distinctive).toHaveLength(1)
    expect(distinctive[0].deletion?.cause).toBe('merge')
    expect(mergeSha.startsWith(distinctive[0].deletion!.mergeSha!)).toBe(true)
    expect(distinctive[0].deletion!.mergeSubject).toBe('Merge other: keep the leaner formatter')

    // The boundary, asserted rather than left to be discovered: a span
    // whose whole text is a bare `}` is still present in the merge's
    // result, because `}` occurs all over it. Containment cannot tell
    // one closing brace from another, so such a span stays
    // `human_edit`. That is the conservative direction on purpose —
    // the `merge` label is only applied to text that actually vanished
    // at the merge boundary, and trivia never inflates it.
    const braces = deleted.filter((s) => s.text.trim() === '}')
    expect(braces.length).toBeGreaterThan(0)
    for (const s of braces) expect(s.deletion?.cause).toBe('human_edit')

    // What matters commercially: the merge's work is the bulk of the
    // deletion here, and it is no longer filed as the human's discard.
    expect(record.stats.generated.mergeDeletedChars)
      .toBeGreaterThan(record.stats.generated.humanDeletedChars * 10)
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

// ---------------------------------------------------------------------------
// The second defect, one level down: an unreadable boundary is not a
// verdict about the person.
//
// `human_edit` used to be the fall-through for everything the merge test
// could not prove, and the test could not prove anything over a commit
// this clone does not hold. Three real shapes produce exactly that, all
// of them ordinary: a fork's pull request, a branch deleted after merge,
// and a shallow clone. In each one the pull-request adapter knows a merge
// by sha from the GitHub API while the git object is simply not here.
// Before this change every one of them read out as the person's discard.

/**
 * A commit sha that is valid, real, and absent from the repository under
 * test — the shape a fork's or a deleted branch's commit takes when the
 * API names it and the clone has never fetched it. Taken from a second
 * repository rather than invented, so the probe fails the way it fails in
 * production (object missing) rather than on a malformed argument.
 */
function foreignSha(): string {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-foreign-'))
  sh(dir, ['init', '-q', '-b', 'main'])
  sh(dir, ['config', 'user.email', 'other@example.com'])
  sh(dir, ['config', 'user.name', 'Other Fork'])
  writeFileSync(join(dir, 'README.md'), 'a repository under test has never seen this commit\n')
  sh(dir, ['add', '.'])
  sh(dir, ['commit', '-q', '-m', 'Unrelated history'])
  return sh(dir, ['rev-parse', 'HEAD']).trim()
}

/**
 * C0 (human)  digest.js = A + B
 * G  (agent)  digest.js = A + AGENT_BLOCK + B        <- the generation
 * OA (agent)  digest.js = A + RIVAL_BLOCK + B        on branch `other`
 * M  (human)  merge --no-ff other, resolved by DELETING digest.js
 * F  (human)  digest.js = A + RIVAL_BLOCK + B        re-added by hand
 *
 * The merge's tree has no digest.js at all. That is a definite answer —
 * the commit is right here and the path is not in it — and it has to stay
 * distinguishable from a commit this clone cannot read, because both used
 * to come back from `blobAt` as the same `null`.
 */
function mergeDeletesTheFileRepo(): { dir: string; mergeSha: string } {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-merge-rm-'))
  sh(dir, ['init', '-q', '-b', 'main'])
  sh(dir, ['config', 'user.email', 'human@example.com'])
  sh(dir, ['config', 'user.name', 'Human Owner'])
  const file = join(dir, 'digest.js')
  const write = (body: string) => writeFileSync(file, body + '\n')
  const commit = (msg: string) => { sh(dir, ['add', '-A']); sh(dir, ['commit', '-q', '-m', msg]) }
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
  sh(dir, ['rm', '-q', '-f', 'digest.js'])
  sh(dir, ['commit', '-q', '-m', 'Merge other: drop the module, it needs rewriting'])
  const mergeSha = sh(dir, ['rev-parse', 'HEAD']).trim()

  write([BASE_A, RIVAL_BLOCK, BASE_B].join('\n\n'))
  commit('Restore the module with the leaner formatter')
  return { dir, mergeSha }
}

describe('an unknown deletion cause is not the human\'s', () => {
  /** The real repository, its real pair, and the generation that was deleted. */
  function realCase() {
    const { dir, mergeSha } = mergeDeletionRepo()
    const pair = findCommitPairs(dir).find((p) => p.subject === 'Generate the item formatter')!
    const merge = pair.interveningMerges.find((m) => m.sha === mergeSha)!
    return { dir, pair, merge, mergeSha }
  }

  it('a merge whose own tree cannot be read is unknown, not a discard', () => {
    const { dir, pair } = realCase()
    const absent = foreignSha()
    // The fork shape: the API gave us the merge sha and its parentage, and
    // the merge commit itself was never fetched. A parent holds the text,
    // so half the conjunction is true and the other half is unreadable.
    const merge: MergeEvent = {
      sha: absent,
      parents: [pair.generatedSha],
      paths: ['digest.js'],
      author: 'Human Owner',
      date: pair.finalAt,
      subject: 'Merge other: keep the leaner formatter',
    }
    const got = gitDeletionAttributor(dir, [merge])('digest.js', AGENT_BLOCK)
    expect(got.cause).toBe('unknown')
    expect(got.unknownReason).toBe('unreadable_merge_result')
    expect(absent.startsWith(got.mergeSha!)).toBe(true)
  })

  it('a merge whose parents cannot be read is unknown, not a discard', () => {
    const { dir, merge } = realCase()
    // The shallow-clone shape: the merge is here, its result demonstrably
    // lacks the text, and whether any parent ever had it cannot be read.
    const absent = foreignSha()
    const blindParents: MergeEvent = { ...merge, parents: [absent] }
    const got = gitDeletionAttributor(dir, [blindParents])('digest.js', AGENT_BLOCK)
    expect(got.cause).toBe('unknown')
    expect(got.unknownReason).toBe('unreadable_merge_parents')
    expect(merge.sha.startsWith(got.mergeSha!)).toBe(true)
  })

  it('a merge event with no parentage at all rules nothing in and nothing out', () => {
    const { dir, merge } = realCase()
    const got = gitDeletionAttributor(dir, [{ ...merge, parents: [] }])('digest.js', AGENT_BLOCK)
    expect(got.cause).toBe('unknown')
    expect(got.unknownReason).toBe('unreadable_merge_parents')
  })

  it('a proven merge beats a hole found earlier in the walk', () => {
    const { dir, pair, merge } = realCase()
    const unreadableFirst: MergeEvent = {
      ...merge,
      sha: foreignSha(),
      parents: [pair.generatedSha],
    }
    // Order matters: the unreadable boundary is walked first and would
    // return `unknown` on its own. A later merge that can be shown to
    // have destroyed the text is the better answer and must win.
    const got = gitDeletionAttributor(dir, [unreadableFirst, merge])('digest.js', AGENT_BLOCK)
    expect(got.cause).toBe('merge')
    expect(merge.sha.startsWith(got.mergeSha!)).toBe(true)
  })

  it('a merge that deleted the whole file is still a merge deletion, not unknown', () => {
    // The regression this three-state read could have introduced. `blobAt`
    // returned null here too, and null used to be enough; now the path has
    // to be shown absent from a readable commit rather than unreadable.
    const { dir, mergeSha } = mergeDeletesTheFileRepo()
    const pair = findCommitPairs(dir).find((p) => p.subject === 'Generate the item formatter')!
    const record = resolveEpisode(dir, buildEpisodes([pair], dir)[0])!
    const distinctive = record.generations
      .flatMap((g) => g.spans)
      .filter((s) => s.fate === 'generated_deleted' && s.text.includes('no stated reason'))
    expect(distinctive).toHaveLength(1)
    expect(distinctive[0].deletion?.cause).toBe('merge')
    expect(mergeSha.startsWith(distinctive[0].deletion!.mergeSha!)).toBe(true)
    expect(record.stats.generated.unknownDeletedChars).toBe(0)
  })

  it('an untestable boundary empties the discard figure, end to end', () => {
    const { dir, pair } = realCase()
    // What `episodesFromPullRequest` now carries when the adapter could
    // not read a merge's parentage anywhere: the sha, and nothing else.
    const ep = { ...buildEpisodes([pair], dir)[0], interveningMerges: [], unreadableMerges: [foreignSha()] }
    const record = resolveEpisode(dir, ep)!
    const g = record.stats.generated

    expect(g.deletedChars).toBeGreaterThan(0)
    // The number the product sells as a discard rate is now zero, which is
    // the honest reading: this clone cannot say the person dropped anything.
    expect(g.humanDeletedChars).toBe(0)
    expect(g.humanDeletedPct).toBe(0)
    expect(g.unknownDeletedChars).toBe(g.deletedChars)
    for (const s of record.generations.flatMap((x) => x.spans).filter((x) => x.fate === 'generated_deleted')) {
      expect(s.deletion?.cause).toBe('unknown')
      expect(s.deletion?.unknownReason).toBe('unreadable_merge_commit')
    }
  })

  it('the defect, pinned: the same episode read as before charges it all to the person', () => {
    const { dir, pair } = realCase()
    const ep = { ...buildEpisodes([pair], dir)[0], interveningMerges: [] }
    const record = resolveEpisode(dir, ep)!
    const g = record.stats.generated
    // No merges and nothing unreadable is a real answer, and it stays
    // `human_edit`. This is the row that proves `unknown` did not become a
    // blanket hedge: the hedge appears only when something cannot be read.
    expect(g.humanDeletedChars).toBe(g.deletedChars)
    expect(g.unknownDeletedChars).toBe(0)
  })

  it('the three causes partition the gross deletion figure', () => {
    const { dir, pair } = realCase()
    for (const ep of [
      buildEpisodes([pair], dir)[0],
      { ...buildEpisodes([pair], dir)[0], interveningMerges: [], unreadableMerges: [foreignSha()] },
    ]) {
      const g = resolveEpisode(dir, ep)!.stats.generated
      expect(g.humanDeletedChars + g.mergeDeletedChars + g.unknownDeletedChars).toBe(g.deletedChars)
      expect(g.humanDeletedChars).toBeGreaterThanOrEqual(0)
    }
  })
})
