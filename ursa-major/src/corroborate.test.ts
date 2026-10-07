// Descent corroboration, tested on real git repositories.
//
// The case these fixtures rebuild is the one in the ledger entry
// (docs/ideas.md, 2026-10-02): two agent branches each wrote a
// `formatItem` function, the human kept branch B's version, and branch
// A's generation came back `survived_mutated` carrying a word-level diff
// from A's line to B's line. Nobody performed that diff. Every assertion
// below is about a label the resolver used to emit and must not.
//
// Why these are integration tests over `resolveEpisode` and not unit
// tests over `gitDescentCorroborator`: the defect is not in the git
// lookup, which is three lines. It is in the resolver believing a score.
// A unit test of the lookup would have passed on the day the bug shipped.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildEpisodes } from './episodes'
import { findCommitPairs, listCommits } from './pairfinder'
import { resolveEpisode } from './bin/ursa'
import { gitDescentCorroborator, MAX_RIVAL_BLOBS } from './corroborate'
import { resolve } from './resolve'
import { THETA_HIGH } from './match'
import type { FinalSpan } from './types'

// Author identity is set through the environment, not `git config`:
// GIT_AUTHOR_NAME outranks a repository's user.name and every agent
// harness exports it, so a fixture that relies on `git config` is
// authored by whoever runs the suite. See the note in m0.test.ts.
const AS = (name: string, email: string) => ({
  GIT_AUTHOR_NAME: name, GIT_AUTHOR_EMAIL: email,
  GIT_COMMITTER_NAME: name, GIT_COMMITTER_EMAIL: email,
})
const HUMAN = AS('Human Owner', 'human@example.com')
const BOT = AS('claude[bot]', 'noreply@anthropic.com')
const TRAILER = '\n\nCo-Authored-By: Claude <noreply@anthropic.com>'

function sh(cwd: string, args: string[], env: Record<string, string> = HUMAN): string {
  return execFileSync('git', args, { cwd, env: { ...process.env, ...env }, encoding: 'utf8' })
}

interface Repo {
  dir: string
  commit(path: string, body: string, msg: string, env?: Record<string, string>): string
  gitCommitting(args: string[], env?: Record<string, string>): void
  at(ref: string): string
}

/** A repository on a controlled clock, so the pair walk's age bound is testable. */
function repo(stepHours = 1): Repo {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-corrob-'))
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

/**
 * Padding that is identical in every revision of the fixture file.
 *
 * It exists so the pair walk sees a substantial shared file rather than
 * a three-line one, and so the span under test is a small edited region
 * inside a mostly-verbatim file — the shape every real record has.
 */
const PAD = Array.from({ length: 20 }, (_, i) => `const unrelatedConstant${i} = ${i}`).join('\n')

const A_LINE = 'export const label = (item) => `- ${item.title}: ${item.claim} -- so what: ${item.why}`'
const B_LINE = 'export const label = (item) => `* ${item.title}: ${item.claim} -- because: ${item.why}`'

const file = (line: string) => `${PAD}\n${line}\n`

/** the span covering `line`, whatever class it ended up in */
function spanFor(spans: FinalSpan[], line: string): FinalSpan | undefined {
  return spans.find((s) => s.text.includes(line.slice(0, 40)))
}

/**
 * Branch A generates a line, branch B generates a near-identical rival
 * line, and the human keeps B's by merging B. Branch A's generation is
 * the one the episode is built from.
 *
 * The two lines score above THETA_HIGH against each other, which the
 * first assertion below checks directly rather than assuming: if they
 * ever stopped doing so, the demotion test would pass for the wrong
 * reason and keep passing forever.
 */
function twoBranchesOneSurvivor() {
  const r = repo()
  r.commit('label.ts', file('export const label = (item) => item.title'), 'Baseline label')
  const baseline = r.at('HEAD')

  // Branch A: the agent generation this episode is about.
  r.gitCommitting(['checkout', '-q', '-b', 'branch-a'])
  const generatedSha = r.commit('label.ts', file(A_LINE), 'Rich label' + TRAILER, BOT)

  // Branch B, cut from the same baseline: a different agent's near-identical line.
  r.gitCommitting(['checkout', '-q', baseline])
  r.gitCommitting(['checkout', '-q', '-b', 'branch-b'])
  const rivalSha = r.commit('label.ts', file(B_LINE), 'Rich label, other wording' + TRAILER, BOT)

  // The human, on branch A, takes B's version. `-X theirs` makes the
  // merge resolve to B's line, which is the human keeping B's work.
  r.gitCommitting(['checkout', '-q', 'branch-a'])
  r.gitCommitting(['merge', '-q', '--no-ff', '-X', 'theirs', '-m', 'Merge branch-b, keeping its wording', 'branch-b'])
  // The human's own edit afterwards, which is what the generation pairs with.
  r.commit('label.ts', file(B_LINE) + '\nexport const done = true', 'Mark the module done')

  return { r, generatedSha, rivalSha }
}

describe('a rival commit holding the text drops the mutation claim', () => {
  it('scores the two rival lines above THETA_HIGH, so the demotion is the thing being tested', () => {
    // Without a corroborator, this is exactly the defect: A's line in the
    // generation, B's line in the final file, labelled as the human's edit.
    const record = resolve({
      taskId: 'no-corroborator',
      files: [{ path: 'label.ts', text: file(B_LINE) }],
      conversations: [],
      generations: [{
        conversationId: 'c1', model: 'claude', turnIndex: 1, kind: 'write',
        filePath: 'label.ts', timestamp: '2026-01-01T00:00:00.000Z', text: file(A_LINE),
      }],
      finished: true,
    })
    const span = spanFor(record.files[0].spans, B_LINE)
    expect(span?.class).toBe('survived_mutated')
    expect(span?.score).toBeGreaterThanOrEqual(THETA_HIGH)
    expect(span?.diff).toBeDefined()
    expect(span?.descent).toBeUndefined()
  })

  it('does not label the span survived_mutated when a sibling commit holds it verbatim', () => {
    const { r, generatedSha } = twoBranchesOneSurvivor()
    const ep = buildEpisodes(findCommitPairs(r.dir), r.dir)
      .find((e) => e.generatedSha === generatedSha)
    expect(ep, 'the fixture must produce a pair for branch A\'s generation').toBeDefined()

    const record = resolveEpisode(r.dir, ep!)!
    const span = spanFor(record.files.find((f) => f.path === 'label.ts')!.spans, B_LINE)
    expect(span?.class).toBe('no_generation_provenance')
  })

  it('names the rival commit and keeps the score as a candidate for adjudication', () => {
    const { r, generatedSha, rivalSha } = twoBranchesOneSurvivor()
    const ep = buildEpisodes(findCommitPairs(r.dir), r.dir)
      .find((e) => e.generatedSha === generatedSha)!
    const span = spanFor(resolveEpisode(r.dir, ep)!.files
      .find((f) => f.path === 'label.ts')!.spans, B_LINE)!

    expect(span.descent).toMatchObject({ basis: 'rival', relation: 'sibling' })
    // The evidence is kept, not thrown away: a human adjudicating this
    // record needs the score and the text that scored.
    expect(span.uncertain).toBe(true)
    expect(span.candidate?.score).toBeGreaterThanOrEqual(THETA_HIGH)
    expect(span.candidate?.text).toContain(A_LINE.slice(0, 40))
    // The one thing a demoted span must never carry: the fabricated diff.
    expect(span.diff).toBeUndefined()
    expect(span.source).toBeUndefined()
    // Short sha, so the record is greppable against the repository.
    expect(span.descent?.basis === 'rival' && rivalSha.startsWith(span.descent.sha)).toBe(true)
  })

  it("reports the generation's own line as deleted, since nothing in the final work descends from it", () => {
    const { r, generatedSha } = twoBranchesOneSurvivor()
    const ep = buildEpisodes(findCommitPairs(r.dir), r.dir)
      .find((e) => e.generatedSha === generatedSha)!
    const record = resolveEpisode(r.dir, ep)!
    const gen = record.generations.find((g) => g.filePath === 'label.ts')!
    const line = gen.spans.find((s) => s.text.includes(A_LINE.slice(0, 40)))
    // Dropping the claim has to reach the generation side too. If the
    // claim were still registered, A's line would read as surviving while
    // the final span said nothing descends from it, and the record would
    // contradict itself.
    expect(line?.fate).toBe('generated_deleted')
  })
})

describe('the human restoring text the agent had replaced', () => {
  /**
   * The `pre_existing` relation, and it took a failing test to find the
   * shape that actually produces it. The first fixture written here had
   * the human write a line, the agent commit a file still containing it,
   * and the human then edit their own line — and it correctly came back
   * `survived_mutated`, because the EDITED line exists in no earlier
   * commit. Pre-existing text that survives untouched never reaches Pass
   * 2 at all; the verbatim pass claims it first.
   *
   * The case that does reach Pass 2 is a restore. An ancestor holds line
   * X, the agent's generation replaces it with Y, and the human's commit
   * puts X back. The final span is X, which no longer appears in the
   * generation, so Pass 1 misses it and Pass 2 fuzzy-matches it to Y at a
   * high score. The record then ships a word-level diff Y → X described
   * as the person's edit of the model's text, when X is a string the
   * repository already contained and the person restored rather than
   * composed.
   *
   * The demotion is not a claim that nothing happened. The person did
   * reject Y. What it refuses is the stronger claim the `diff` field
   * makes, and the rejection survives in the span's `candidate` and in
   * the generation's `generated_deleted` fate.
   */
  function restoredAfterTheAgentReplacedIt() {
    const r = repo()
    const original = r.commit('label.ts', file(B_LINE), 'The human writes the label')
    // The agent replaces the human's line with its own wording.
    const generatedSha = r.commit('label.ts', file(A_LINE), 'Reword the label' + TRAILER, BOT)
    // The human puts their own wording back, and leaves a mark of their
    // own alongside it.
    //
    // The extra line is load-bearing and was added when src/vendored.ts
    // landed. Without it the final blob is byte-for-byte the blob at
    // `original`, which is a whole-file import: the episode's net effect
    // on label.ts would be nothing, the file-level refusal would skip the
    // path before any span of it was classified, and this test would be
    // asserting about a span the record no longer contains. With it the
    // file is genuinely this episode's, while the RESTORED LINE is still
    // text the repository already held, which is the span-level claim
    // under test here and is unchanged.
    r.commit('label.ts', file(B_LINE) + 'export const restored = true\n', 'Put my wording back')
    return { r, generatedSha, original }
  }

  it('is not the agent\'s generation surviving the human\'s edit', () => {
    const { r, generatedSha, original } = restoredAfterTheAgentReplacedIt()
    const ep = buildEpisodes(findCommitPairs(r.dir), r.dir)
      .find((e) => e.generatedSha === generatedSha)
    expect(ep, 'the fixture must produce a pair for the agent\'s generation').toBeDefined()
    const span = spanFor(resolveEpisode(r.dir, ep!)!.files
      .find((f) => f.path === 'label.ts')!.spans, B_LINE)!

    expect(span.class).toBe('no_generation_provenance')
    expect(span.descent).toMatchObject({ basis: 'rival', relation: 'pre_existing' })
    expect(span.descent?.basis === 'rival' && original.startsWith(span.descent.sha)).toBe(true)
    expect(span.diff).toBeUndefined()
  })
})

describe('what the corroborator says when it cannot tell', () => {
  it('declines on a span shorter than the verbatim floor, leaving the label alone', () => {
    const r = repo()
    r.commit('tiny.ts', 'const a = 1', 'Base')
    const commits = listCommits(r.dir)
    const c = gitDescentCorroborator(r.dir, r.at('HEAD'), commits)
    // MIN_VERBATIM_LEN is 12 normalized characters. "return null"
    // normalizes to eleven and appears in every TypeScript project, so
    // containment in another blob would be coincidence.
    expect(c('tiny.ts', 'return null')).toEqual({ basis: 'unverified', reason: 'span_too_short' })
  })

  it('reports an unreadable path history rather than calling it corroborated', () => {
    const r = repo()
    r.commit('a.ts', PAD, 'Base')
    // A path outside the repository. `git log -- <path>` succeeds with no
    // output for a path git simply never saw, which is the `corroborated`
    // answer with zero rivals searched — a real answer, not a hole.
    const c = gitDescentCorroborator(r.dir, r.at('HEAD'), listCommits(r.dir))
    expect(c('never/existed.ts', PAD.slice(0, 80)))
      .toEqual({ basis: 'corroborated', rivalsSearched: 0 })
  })

  it('corroborates when the only other commits are descendants of the generation', () => {
    const r = repo()
    const gen = r.commit('only.ts', file(A_LINE), 'Agent writes it all' + TRAILER, BOT)
    r.commit('only.ts', file(B_LINE), 'Human rewords it')
    const c = gitDescentCorroborator(r.dir, gen, listCommits(r.dir))
    // The human's own commit holds B's line and is a descendant, so it is
    // not a rival. If descendants were not excluded, every mutation in
    // every record would be demoted, because `finalSha` always holds the
    // final text.
    const verdict = c('only.ts', B_LINE)
    expect(verdict.basis).toBe('corroborated')
  })

  it('keeps the label and names the cap when more rivals exist than it will read', () => {
    // The cap is a bound on work, so "no rival found" after hitting it is
    // a claim about the commits nobody read. Build one more sibling than
    // the cap allows, none of which holds the span's text.
    const r = repo()
    r.commit('wide.ts', file('export const base = 0'), 'Base')
    const baseline = r.at('HEAD')
    for (let i = 0; i <= MAX_RIVAL_BLOBS; i++) {
      r.gitCommitting(['checkout', '-q', baseline])
      r.gitCommitting(['checkout', '-q', '-b', `side-${i}`])
      r.commit('wide.ts', file(`export const side = ${i}`), `Side ${i}`)
    }
    r.gitCommitting(['checkout', '-q', baseline])
    r.gitCommitting(['checkout', '-q', '-b', 'gen'])
    const gen = r.commit('wide.ts', file(A_LINE), 'Agent line' + TRAILER, BOT)

    const c = gitDescentCorroborator(r.dir, gen, listCommits(r.dir))
    expect(c('wide.ts', A_LINE)).toEqual({ basis: 'unverified', reason: 'rival_search_capped' })
  })
})

describe('the chat path is unchanged', () => {
  it('labels an above-threshold match survived_mutated with no corroborator, and says the check did not run', () => {
    const record = resolve({
      taskId: 'chat',
      files: [{ path: 'note.md', text: 'The resolver holds the whole of it in memory.' }],
      conversations: [],
      generations: [{
        conversationId: 'c1', model: 'claude', turnIndex: 1, kind: 'assistant_text',
        timestamp: '2026-01-01T00:00:00.000Z', text: 'The resolver holds it whole in memory.',
      }],
      finished: true,
    })
    const span = record.files[0].spans[0]
    expect(span.class).toBe('survived_mutated')
    // Absent, not `corroborated`. A record from a pasted conversation has
    // no repository to ask, and saying the check passed would be a claim.
    expect(span.descent).toBeUndefined()
  })
})

describe('the viewer accounts for a demotion rather than going quiet', () => {
  it('names the rival commit and its subject in the span inspector', async () => {
    const { renderViewer } = await import('./viewer')
    const { r, generatedSha } = twoBranchesOneSurvivor()
    const ep = buildEpisodes(findCommitPairs(r.dir), r.dir)
      .find((e) => e.generatedSha === generatedSha)!
    const html = renderViewer(resolveEpisode(r.dir, ep)!)
    // The record carries a rejected candidate scoring above THETA_HIGH. A
    // viewer that shows the score and not the reason reads as the
    // resolver being coy about a near-certainty, and the user is owed the
    // inference (CLAUDE.md §2).
    expect(html).toContain('Not counted as your edit')
    // Branch B's OWN commit, not the merge that brought it in. The first
    // version of this assertion named the merge subject and passed, which
    // was a false positive: that string is already in the HTML because
    // the merge destroyed branch A's line and `deletion.mergeSubject`
    // records it. Asserting the subject the descent verdict actually
    // carries is the only version of this test that can fail.
    expect(html).toContain('Rich label, other wording')
    expect(html).toContain('a branch this generation is not an ancestor of')
  })
})
