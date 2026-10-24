// The time dimension, tested against real git repositories built in a
// temp dir — no mock of `git log`, because the thing under test is
// exactly whether the range syntax and the revision order are right.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { findCommitPairs } from './pairfinder'
import { buildEpisodes } from './episodes'
import { resolveEpisode, renderRunSummary } from './bin/ursa'
import {
  annotateDurability, revisionsAfter, spanPresent, traceFile,
  MIN_TRACEABLE_LEN,
} from './lifespan'
import { normalize } from './normalize'
import { tokens } from './match'
import type { FinalSpan, OutcomeRecord } from './types'

// Author identity is set through the environment, not `git config`.
// GIT_AUTHOR_NAME outranks a repository's user.name and every agent
// harness exports it, so a fixture that relies on `git config` is
// authored by whoever runs the suite. See the long note in m0.test.ts.
const AS = (name: string, email: string) => ({
  GIT_AUTHOR_NAME: name, GIT_AUTHOR_EMAIL: email,
  GIT_COMMITTER_NAME: name, GIT_COMMITTER_EMAIL: email,
})
const HUMAN_ID = AS('Human Owner', 'human@example.com')

function sh(cwd: string, args: string[], env: Record<string, string> = HUMAN_ID): string {
  return execFileSync('git', args, { cwd, env: { ...process.env, ...env }, encoding: 'utf8' })
}

// Two agent-written paragraphs, in two files. Separate files on purpose:
// resolve() merges adjacent same-class prose into one span, so two
// paragraphs of the same fate in one file become one span and neither
// can be observed dying alone. Deliberately disjoint vocabulary, so the
// token-containment tier in spanPresent() cannot rescue one with the
// other's words.
const KEPT = [
  'The resolver joins each finished file back to the generation that produced it,',
  'so every span carries a pointer to the turn it came from rather than a bare score.',
].join('\n')

const DOOMED = [
  'Retention through the following commit is treated as sufficient evidence of acceptance,',
  'which lets this module skip asking whoever owns the work whether they were happy.',
].join('\n')

// Two more agent paragraphs, together in one file. The resolver merges
// adjacent same-class prose, so these arrive as a single span; later work
// deletes only the second. A span-level presence test would call the whole
// thing durable, which is the reason tracing runs per sentence.
const GUIDE_KEPT = 'Run it once against a project you already finished, and read what it tells you about the parts you threw away.'
const GUIDE_CUT = 'Scheduling it hourly gives a denser signal, so most people leave a timer running in the background.'

// Written by the human at the closing commit, so it resolves to
// `no_generation_provenance` and becomes the durability baseline.
const HUMAN = [
  'Ownership of every verdict stays with whoever did the work, permanently and by design.',
  'Nothing downstream may infer approval from silence, however convenient that inference looks.',
].join('\n')

/**
 * Four commits, which is the smallest history that can tell the two
 * failure modes apart:
 *
 *   1  agent writes KEPT (notes.md) and DOOMED (basis.md)   <- generatedSha
 *   2  human retitles both, keeps the prose, adds HUMAN     <- finalSha, where the classes are taken
 *   3  human replaces DOOMED with an unrelated rule         <- the real work rejects it
 *   4  human appends to notes.md, unrelated                 <- KEPT is still there at the tip
 *
 * At commit 2 the record says the user kept DOOMED. It is not wrong:
 * she did. The point of the walk is that commit 3 exists.
 */
function repoWithAfterlife(): string {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-lifespan-'))
  sh(dir, ['init', '-q', '-b', 'main'])
  sh(dir, ['config', 'user.email', 'human@example.com'])
  sh(dir, ['config', 'user.name', 'Human Owner'])

  writeFileSync(join(dir, 'notes.md'), `# Notes\n\n${KEPT}\n`)
  writeFileSync(join(dir, 'basis.md'), `# Basis\n\n${DOOMED}\n`)
  writeFileSync(join(dir, 'guide.md'), `# Guide\n\n${GUIDE_KEPT}\n${GUIDE_CUT}\n`)
  sh(dir, ['add', '.'])
  sh(dir, ['commit', '-q', '-m', 'Write the notes\n\nCo-Authored-By: Claude <noreply@anthropic.com>'])

  writeFileSync(join(dir, 'notes.md'), `# Resolver notes\n\n${KEPT}\n\n${HUMAN}\n`)
  writeFileSync(join(dir, 'basis.md'), `# Acceptance basis\n\n${DOOMED}\n`)
  writeFileSync(join(dir, 'guide.md'), `# Using it\n\n${GUIDE_KEPT}\n${GUIDE_CUT}\n`)
  sh(dir, ['add', '.'])
  sh(dir, ['commit', '-q', '-m', 'Retitle all three, and say who owns a verdict'])

  writeFileSync(join(dir, 'basis.md'), [
    '# Acceptance basis',
    '',
    'Only a declaration counts. Absent one, an episode is undeclared, and',
    'undeclared never becomes approval no matter how much later traffic arrives.',
    '',
  ].join('\n'))
  writeFileSync(join(dir, 'guide.md'), `# Using it\n\n${GUIDE_KEPT}\n`)
  sh(dir, ['add', '.'])
  sh(dir, ['commit', '-q', '-m', 'Drop the retention-is-acceptance rule and the timer advice'])

  writeFileSync(join(dir, 'notes.md'), `# Resolver notes\n\n${KEPT}\n\n${HUMAN}\n\nSee lifespan.ts for the time dimension.\n`)
  sh(dir, ['add', '.'])
  sh(dir, ['commit', '-q', '-m', 'Point at the module'])
  return dir
}

function annotated(repo: string) {
  const ep = buildEpisodes(findCommitPairs(repo), repo)[0]
  const record = resolveEpisode(repo, ep)!
  annotateDurability(repo, record, ep.finalSha, ep.closedAt)
  return { record, ep }
}

/** The longest span in a file — the one carrying the paragraph, not the heading. */
function mainSpan(record: OutcomeRecord, path: string): FinalSpan {
  const file = record.files.find((f) => f.path === path)!
  return [...file.spans].sort((a, b) => b.text.length - a.text.length)[0]
}

describe('revisionsAfter', () => {
  it('lists only the commits after the closing one, oldest first', () => {
    const repo = repoWithAfterlife()
    const { ep } = annotated(repo)
    const revs = revisionsAfter(repo, ep.finalSha, 'basis.md')
    expect(revs).toHaveLength(1)
    expect(revs[0].subject).toMatch(/Drop the retention-is-acceptance rule/)
  })

  it('is scoped per file: notes.md and basis.md have different afterlives', () => {
    const repo = repoWithAfterlife()
    const { ep } = annotated(repo)
    expect(revisionsAfter(repo, ep.finalSha, 'notes.md').map((r) => r.subject))
      .toEqual(['Point at the module'])
  })

  it('returns nothing when the closing commit is the tip, so the walk reports untested', () => {
    const repo = repoWithAfterlife()
    expect(revisionsAfter(repo, sh(repo, ['rev-parse', 'HEAD']).trim(), 'notes.md')).toEqual([])
  })

  it('returns nothing rather than throwing when the ref does not exist', () => {
    expect(revisionsAfter(repoWithAfterlife(), 'deadbeef'.repeat(5), 'notes.md')).toEqual([])
  })
})

describe('spanPresent', () => {
  const file = normalize(`# Acceptance basis\n\n${DOOMED}`).norm
  const set = new Set(tokens(file))

  it('calls untouched text verbatim', () => {
    expect(spanPresent(normalize(DOOMED).norm, file, set)).toEqual({ present: true, basis: 'verbatim' })
  })

  it('calls re-edited text present by token containment', () => {
    const reworded = DOOMED.replace('is treated as sufficient evidence of', 'counts as')
    const p = spanPresent(normalize(reworded).norm, file, set)
    expect(p).toEqual({ present: true, basis: 'token-containment' })
  })

  it('calls replaced text absent', () => {
    expect(spanPresent(normalize(KEPT).norm, file, set)).toEqual({ present: false })
  })
})

describe('annotateDurability: what later work did to each span', () => {
  it('a span kept at the closing commit and removed afterwards is decayed, not survived', () => {
    const repo = repoWithAfterlife()
    const { record } = annotated(repo)
    const doomed = mainSpan(record, 'basis.md')
    // The record's own class label says the user kept it...
    expect(doomed.class).toMatch(/^survived_/)
    expect(doomed.text).toContain('sufficient evidence of acceptance')
    // ...and the time dimension says the work disagreed one commit later.
    expect(doomed.lifespan!.fate).toBe('decayed')
    expect(doomed.lifespan!.liveAtTip).toBe(false)
    expect(doomed.lifespan!.unitsSurviving).toBe(0)
    expect(doomed.lifespan!.unitsTraced).toBeGreaterThan(0)
    expect(doomed.lifespan!.survivingChars).toBe(0)
    expect(doomed.lifespan!.decayedChars).toBeGreaterThan(0)
    const killer = sh(repo, ['log', '-1', '--format=%s', doomed.lifespan!.diedAtSha!]).trim()
    expect(killer).toMatch(/Drop the retention-is-acceptance rule/)
    expect(doomed.lifespan!.diedAt).toBeTruthy()
  })

  it('a span still present at the tip is durable', () => {
    const repo = repoWithAfterlife()
    const { record } = annotated(repo)
    const kept = mainSpan(record, 'notes.md')
    expect(kept.class).toMatch(/^survived_/)
    expect(kept.lifespan!.fate).toBe('durable')
    expect(kept.lifespan!.liveAtTip).toBe(true)
    expect(kept.lifespan!.diedAtSha).toBeNull()
    expect(kept.lifespan!.intactRevisions).toBe(1)
    expect(kept.lifespan!.unitsSurviving).toBe(kept.lifespan!.unitsTraced)
    expect(kept.lifespan!.decayedChars).toBe(0)
    expect(kept.lifespan!.basis).toBe('verbatim')
    expect(kept.lifespan!.intactSeconds).toBeGreaterThanOrEqual(0)
  })

  it('reports a decay rate over chars, with the closing and tip shas that produced it', () => {
    const repo = repoWithAfterlife()
    const { record, ep } = annotated(repo)
    const d = record.durability!
    expect(d.method).toBe('git-forward-walk')
    expect(d.closingSha).toBe(ep.finalSha)
    expect(d.tipSha).toBe(sh(repo, ['rev-parse', 'HEAD']).trim())
    expect(d.testedSpans).toBe(3)
    expect(d.decayedSpans).toBe(1)   // basis.md, replaced wholesale
    expect(d.erodedSpans).toBe(1)    // guide.md, one sentence of two cut
    expect(d.durableSpans).toBe(1)   // notes.md, untouched
    expect(d.decayRate).toBeGreaterThan(0)
    expect(d.decayRate).toBeLessThan(1)
    expect(d.decayRate).toBeCloseTo(d.decayedChars / (d.decayedChars + d.durableChars), 10)
    expect(d.medianIntactSeconds).not.toBeNull()
  })

  it('scores human-written text separately as the churn baseline', () => {
    const repo = repoWithAfterlife()
    const { record } = annotated(repo)
    const human = record.files.find((f) => f.path === 'notes.md')!.spans
      .find((s) => s.text.includes('Ownership of every verdict'))
    expect(human, 'the human paragraph should be its own span').toBeDefined()
    expect(human!.class).toBe('no_generation_provenance')
    expect(human!.lifespan!.fate).toBe('durable')
    // It survived, so the repo's background churn is 0 and the agent
    // text's decay is not explained by the files being volatile.
    expect(record.durability!.baselineDecayRate).toBe(0)
    expect(record.durability!.decayRate).toBeGreaterThan(0)
  })

  it('a span that lost one sentence of two is eroded, and only those chars count as decayed', () => {
    const repo = repoWithAfterlife()
    const { record } = annotated(repo)
    const guide = mainSpan(record, 'guide.md')
    expect(guide.text).toContain('Scheduling it hourly')
    expect(guide.text).toContain('Run it once against a project')
    // One span, both sentences: whole-span presence would call this durable.
    expect(guide.lifespan!.unitsTraced).toBe(2)
    expect(guide.lifespan!.fate).toBe('eroded')
    expect(guide.lifespan!.unitsSurviving).toBe(1)
    expect(guide.lifespan!.liveAtTip).toBe(true)
    expect(guide.lifespan!.survivingChars).toBeGreaterThan(0)
    expect(guide.lifespan!.decayedChars).toBeGreaterThan(0)
    expect(guide.lifespan!.decayedChars).toBeLessThan(guide.text.length)
    expect(sh(repo, ['log', '-1', '--format=%s', guide.lifespan!.diedAtSha!]).trim())
      .toMatch(/timer advice/)
  })

  it('a record with no later revisions is untested everywhere, and decayRate is null not zero', () => {
    const repo = repoWithAfterlife()
    const ep = buildEpisodes(findCommitPairs(repo), repo)[0]
    const record = resolveEpisode(repo, ep)!
    annotateDurability(repo, record, sh(repo, ['rev-parse', 'HEAD']).trim(), ep.closedAt)
    expect(record.durability!.testedSpans).toBe(0)
    expect(record.durability!.decayRate).toBeNull()
    expect(record.durability!.baselineDecayRate).toBeNull()
    for (const file of record.files) {
      for (const span of file.spans) expect(span.lifespan!.fate).toBe('untested')
    }
    expect(record.files.flatMap((f) => f.spans).some((s) => s.lifespan!.skipped === 'no-later-revisions')).toBe(true)
  })
})

describe('traceFile guardrails', () => {
  it('a span too short to carry evidence is skipped rather than called durable', () => {
    const repo = repoWithAfterlife()
    const { ep } = annotated(repo)
    const revs = revisionsAfter(repo, ep.finalSha, 'notes.md')
    const tiny: FinalSpan = { start: 0, end: 6, text: 'return', class: 'survived_verbatim' }
    traceFile(repo, 'notes.md', [tiny], ep.closedAt, revs)
    expect(normalize(tiny.text).norm.length).toBeLessThan(MIN_TRACEABLE_LEN)
    expect(tiny.lifespan!.fate).toBe('untested')
    expect(tiny.lifespan!.skipped).toBe('too-short')
    expect(tiny.lifespan!.revisionsChecked).toBe(0)
  })

  it('a revision that deletes the file kills every span in it', () => {
    const repo = repoWithAfterlife()
    const { ep } = annotated(repo)
    sh(repo, ['rm', '-q', 'notes.md'])
    sh(repo, ['commit', '-q', '-m', 'Remove the notes entirely'])
    const span: FinalSpan = { start: 0, end: KEPT.length, text: KEPT, class: 'survived_verbatim' }
    traceFile(repo, 'notes.md', [span], ep.closedAt, revisionsAfter(repo, ep.finalSha, 'notes.md'))
    expect(span.lifespan!.fate).toBe('decayed')
    expect(sh(repo, ['log', '-1', '--format=%s', span.lifespan!.diedAtSha!]).trim())
      .toBe('Remove the notes entirely')
  })

  it('stops at maxRevisions rather than walking a whole history', () => {
    const repo = repoWithAfterlife()
    const { ep } = annotated(repo)
    const revs = revisionsAfter(repo, ep.finalSha, 'notes.md', 1)
    expect(revs).toHaveLength(1)
  })
})

describe('the run summary tells the user the difference', () => {
  it('reports the share of kept text that later work removed', () => {
    const repo = repoWithAfterlife()
    const { record } = annotated(repo)
    const out = renderRunSummary([record], buildEpisodes(findCommitPairs(repo), repo))
    expect(out).toMatch(/Of what you kept at the time, \d+% was gone by the latest commit\./)
    expect(out).toMatch(/Surviving your first edit is not the same as surviving the work\./)
  })

  it('says nothing about durability when nothing was testable', () => {
    const repo = repoWithAfterlife()
    const ep = buildEpisodes(findCommitPairs(repo), repo)[0]
    const record = resolveEpisode(repo, ep)!
    annotateDurability(repo, record, sh(repo, ['rev-parse', 'HEAD']).trim(), ep.closedAt)
    expect(renderRunSummary([record], [ep])).not.toMatch(/gone by the latest commit/)
  })
})

// ---------------------------------------------------------------------------
// Renames. Added 2026-10-24 as the regression guard for the defect described
// in docs/design/rename-reads-as-death.md: a path-limited log still returns
// the commit that renamed the path away, because git reports a rename-away as
// a deletion of the old path, so the walk read a blob that was not there and
// called unmodified text decayed.
//
// Every assertion below that mentions a fate is checked against the pre-fix
// module as well, in the PR description's evidence section. The four that
// matter inverted.
// ---------------------------------------------------------------------------

/**
 * Three commits and one `git mv`, which is the smallest history that shows
 * the defect:
 *
 *   1  agent writes MOVED (notes.md)                     <- generatedSha
 *   2  human retitles it, keeps the prose, adds HUMAN     <- finalSha
 *   3  human runs `git mv notes.md docs/notes.md`, no content change
 *
 * At commit 3 every character the agent wrote is still in the tree, under a
 * different name. The correct reading is `durable`.
 *
 * `-q` and the explicit `user.email`/`user.name` match repoWithAfterlife
 * above; the author identity still comes from the environment, per the note
 * at the top of this file.
 */
function repoWithRename(opts: { gutOnMove?: boolean; moveBack?: boolean } = {}): string {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-rename-'))
  sh(dir, ['init', '-q', '-b', 'main'])
  sh(dir, ['config', 'user.email', 'human@example.com'])
  sh(dir, ['config', 'user.name', 'Human Owner'])

  writeFileSync(join(dir, 'notes.md'), `# Notes\n\n${KEPT}\n`)
  sh(dir, ['add', '.'])
  sh(dir, ['commit', '-q', '-m', 'Write the notes\n\nCo-Authored-By: Claude <noreply@anthropic.com>'])

  writeFileSync(join(dir, 'notes.md'), `# Resolver notes\n\n${KEPT}\n\n${HUMAN}\n`)
  sh(dir, ['add', '.'])
  sh(dir, ['commit', '-q', '-m', 'Retitle it, and say who owns a verdict'])

  sh(dir, ['mv', 'notes.md', 'moved.md'])
  if (opts.gutOnMove) {
    // The move and the gutting in one commit. Following the rename must not
    // rescue this: the presence test reads the blob at the new path and the
    // agent's text is not in it.
    writeFileSync(join(dir, 'moved.md'), `# Resolver notes\n\n${HUMAN}\n`)
    sh(dir, ['add', '-A'])
  }
  sh(dir, ['commit', '-q', '-m', opts.gutOnMove ? 'Move it and rewrite it' : 'Move it into place'])

  if (opts.moveBack) {
    sh(dir, ['mv', 'moved.md', 'notes.md'])
    sh(dir, ['commit', '-q', '-a', '-m', 'Move it back'])
  }
  return dir
}

describe('revisionsAfter follows a rename', () => {
  it('reads the renaming revision at the destination path, and says it renamed', () => {
    const repo = repoWithRename()
    const { ep } = annotated(repo)
    const revs = revisionsAfter(repo, ep.finalSha, 'notes.md')
    expect(revs).toHaveLength(1)
    expect(revs[0].subject).toBe('Move it into place')
    // The two fields the fix adds. `path` is where the content is readable
    // in this revision's tree; the record still calls the file notes.md.
    expect(revs[0].path).toBe('moved.md')
    expect(revs[0].renamedFrom).toBe('notes.md')
  })

  it('still reports the plain case with the record path and no rename marker', () => {
    const repo = repoWithAfterlife()
    const { ep } = annotated(repo)
    const revs = revisionsAfter(repo, ep.finalSha, 'basis.md')
    expect(revs.map((r) => r.path)).toEqual(['basis.md'])
    expect(revs[0].renamedFrom).toBeUndefined()
  })

  it('terminates on a rename cycle rather than looping forever', () => {
    // a -> b -> a inside one range is legal git. Without the `seen` guard in
    // revisionsAfter this test does not fail, it hangs, so the assertion is
    // only that control returns at all and the revisions are sane.
    const repo = repoWithRename({ moveBack: true })
    const { ep } = annotated(repo)
    const revs = revisionsAfter(repo, ep.finalSha, 'notes.md')
    expect(revs.length).toBeGreaterThanOrEqual(1)
    expect(revs.length).toBeLessThanOrEqual(2)
    expect(revs[0].renamedFrom).toBe('notes.md')
  })

  it('honours the revision limit while following, so one rename cannot overrun it', () => {
    const repo = repoWithRename({ moveBack: true })
    const { ep } = annotated(repo)
    expect(revisionsAfter(repo, ep.finalSha, 'notes.md', 1)).toHaveLength(1)
  })
})

describe('annotateDurability across a rename', () => {
  it('text moved to a new path without being edited is durable, not decayed', () => {
    const repo = repoWithRename()
    const { record } = annotated(repo)
    const moved = mainSpan(record, 'notes.md')
    expect(moved.class).toMatch(/^survived_/)
    // The four assertions that invert against the pre-fix module. Before the
    // fix: fate 'decayed', liveAtTip false, unitsSurviving 0, decayedChars
    // greater than 0 — for text sitting unmodified at the tip.
    expect(moved.lifespan!.fate).toBe('durable')
    expect(moved.lifespan!.liveAtTip).toBe(true)
    expect(moved.lifespan!.unitsSurviving).toBe(moved.lifespan!.unitsTraced)
    expect(moved.lifespan!.decayedChars).toBe(0)
    expect(moved.lifespan!.diedAtSha).toBeNull()
  })

  it('records that it crossed a rename, and where the text went', () => {
    const repo = repoWithRename()
    const { record } = annotated(repo)
    const moved = mainSpan(record, 'notes.md')
    expect(moved.lifespan!.renamesFollowed).toBe(1)
    expect(moved.lifespan!.renamedTo).toBe('moved.md')
    // The record keeps calling the file by the path the episode classified
    // it at; the destination is carried alongside, not substituted in.
    expect(record.files.map((f) => f.path)).toContain('notes.md')
  })

  it('leaves both rename fields absent when no rename was crossed', () => {
    const repo = repoWithAfterlife()
    const { record } = annotated(repo)
    const kept = mainSpan(record, 'notes.md')
    // Absent, never 0 and never the original path: a record written before
    // the walk could follow a rename must stay indistinguishable from one
    // whose file never moved, because the older record cannot say.
    expect(kept.lifespan!.renamesFollowed).toBeUndefined()
    expect(kept.lifespan!.renamedTo).toBeUndefined()
    expect(record.durability!.renamesFollowed).toBeUndefined()
  })

  it('a commit that moved the file and gutted it still reports death', () => {
    // The guard against the fix overcorrecting into false continuity. The
    // rename buys the right place to look, nothing more: spanPresent reads
    // the blob at the destination and the agent's text is not in it.
    const repo = repoWithRename({ gutOnMove: true })
    const { record } = annotated(repo)
    const moved = mainSpan(record, 'notes.md')
    expect(moved.lifespan!.fate).toBe('decayed')
    expect(moved.lifespan!.liveAtTip).toBe(false)
    expect(moved.lifespan!.unitsSurviving).toBe(0)
    expect(sh(repo, ['log', '-1', '--format=%s', moved.lifespan!.diedAtSha!]).trim())
      .toBe('Move it and rewrite it')
    // ...and it is still honest about having crossed the rename to find out.
    expect(moved.lifespan!.renamesFollowed).toBe(1)
  })

  it('rolls the count up onto the record, summed over spans', () => {
    const repo = repoWithRename()
    const { record } = annotated(repo)
    const perSpan = record.files
      .flatMap((f) => f.spans)
      .reduce((n, s) => n + (s.lifespan?.renamesFollowed ?? 0), 0)
    expect(record.durability!.renamesFollowed).toBe(perSpan)
    expect(record.durability!.renamesFollowed).toBeGreaterThan(0)
  })
})
