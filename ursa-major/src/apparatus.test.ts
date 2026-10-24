// The apparatus field, tested on the distinction it exists to protect.
//
// The point of `src/apparatus.ts` is not that it stores a client string.
// It is that three different claims — observed, declared, and
// structurally unobservable — stop being the same bytes. So the
// assertions below are mostly about which of those a path produces, and
// the two that matter most assert a NEGATIVE: that an absent cap under
// `'observed'` does not read like an absent cap under `'unobservable'`,
// and that `wasTruncatedByCap` is false for both a generation that
// finished normally and a generation nobody could ask, without those two
// falses being interchangeable.
//
// These are unit tests over the parsers plus one integration test over
// `resolveEpisode` on a real git repository, because the git launch's
// claim ('unobservable', 'git-blob-generation') is a claim about how that
// launch builds a generation and a unit test of the type would pass on
// the day the wiring was forgotten.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  apparatusFromClaudeSession,
  declaredApparatus,
  endsMidSentence,
  normalizeStopReason,
  truncationUnknown,
  unobservableApparatus,
  wasTruncatedByCap,
} from './apparatus'
import { parseClaudeSession, parsePasteConversation } from './parse'
import { buildEpisodes } from './episodes'
import { findCommitPairs } from './pairfinder'
import { resolveEpisode } from './bin/ursa'

describe('apparatusFromClaudeSession', () => {
  it('reads the cap, the stop reason and the client off an assistant line', () => {
    const a = apparatusFromClaudeSession(
      {
        model: 'claude-opus-5',
        stop_reason: 'max_tokens',
        max_tokens: 1024,
        usage: { output_tokens: 1024 },
      },
      '1.0.58',
    )
    expect(a.observability).toBe('observed')
    expect(a.client).toBe('claude-code/1.0.58')
    expect(a.maxOutputTokens).toBe(1024)
    expect(a.outputTokens).toBe(1024)
    expect(a.stopReason).toBe('max_tokens')
  })

  it('reports a generation the cap cut off, which is the arXiv 2610.00253 case', () => {
    const cut = apparatusFromClaudeSession(
      { stop_reason: 'max_tokens', max_tokens: 1024, usage: { output_tokens: 1024 } },
      '1.0.58',
    )
    expect(wasTruncatedByCap(cut)).toBe(true)
    expect(truncationUnknown(cut)).toBe(false)
  })

  it('distinguishes a call that finished on its own from one nobody can ask about', () => {
    const finished = apparatusFromClaudeSession({ stop_reason: 'end_turn', usage: { output_tokens: 40 } })
    const blind = unobservableApparatus('git-blob-generation')

    // Both are "not truncated" as far as `wasTruncatedByCap` is concerned.
    expect(wasTruncatedByCap(finished)).toBe(false)
    expect(wasTruncatedByCap(blind)).toBe(false)

    // And that is exactly why a second predicate exists: only one of
    // those two falses is a measurement.
    expect(truncationUnknown(finished)).toBe(false)
    expect(truncationUnknown(blind)).toBe(true)
  })

  it('an observed call with no cap set is not the same claim as an unobservable one', () => {
    const noCap = apparatusFromClaudeSession({ stop_reason: 'end_turn', usage: { output_tokens: 12 } })
    const blind = unobservableApparatus('git-blob-generation')

    // Identical bytes if you only read `maxOutputTokens`...
    expect(noCap.maxOutputTokens).toBeUndefined()
    expect(blind.maxOutputTokens).toBeUndefined()

    // ...and different claims once you read the field that carries the claim.
    expect(noCap.observability).toBe('observed')
    expect(blind.observability).toBe('unobservable')
    expect(blind.reason).toBe('git-blob-generation')
  })

  it('calls a transcript line carrying none of the three facts unobservable, not observed-and-empty', () => {
    const a = apparatusFromClaudeSession({ model: 'claude-opus-5' }, '1.0.58')
    expect(a.observability).toBe('unobservable')
    expect(a.reason).toBe('transcript-field-absent')
    // No client either: naming one would assert we had read the call.
    expect(a.client).toBeUndefined()
  })

  it('keeps an unmapped stop reason verbatim instead of flattening it', () => {
    expect(normalizeStopReason('end_turn')).toEqual({ stopReason: 'end_turn' })
    expect(normalizeStopReason('refusal')).toEqual({ stopReason: 'other', rawStopReason: 'refusal' })
    expect(normalizeStopReason(undefined)).toEqual({})
    const a = apparatusFromClaudeSession({ stop_reason: 'pause_turn', usage: { output_tokens: 9 } })
    expect(a.stopReason).toBe('other')
    expect(a.rawStopReason).toBe('pause_turn')
  })
})

describe('the paste path declares and never observes', () => {
  it('marks a hand-pasted transcript declared even when it names a model', () => {
    const parsed = parsePasteConversation(
      ['---', 'model: gpt-5', 'source: chatgpt-web', '---', '', '## user', 'hi', '', '## assistant', 'hello there.'].join('\n'),
      'paste-1',
    )
    expect(parsed.conversation.model).toBe('gpt-5')
    expect(parsed.generations).toHaveLength(1)
    const a = parsed.generations[0].apparatus
    expect(a?.observability).toBe('declared')
    expect(a?.client).toBe('chatgpt-web')
    // A person's word for a model is not a reading of the call, so the
    // cap is absent and truncation stays unknown.
    expect(a?.maxOutputTokens).toBeUndefined()
    expect(truncationUnknown(a)).toBe(true)
    expect(declaredApparatus().observability).toBe('declared')
  })
})

describe('the claude-code path observes, per call and not per file write', () => {
  it('stamps one apparatus on every generation a single assistant message produced', () => {
    const line = JSON.stringify({
      type: 'assistant',
      uuid: 'u1',
      timestamp: '2026-10-24T10:00:00Z',
      version: '1.0.58',
      message: {
        model: 'claude-opus-5',
        stop_reason: 'max_tokens',
        max_tokens: 1024,
        usage: { output_tokens: 1024 },
        content: [
          { type: 'tool_use', name: 'Write', input: { file_path: 'a.md', content: 'first chunk of prose' } },
          { type: 'tool_use', name: 'Write', input: { file_path: 'b.md', content: 'second chunk of prose' } },
        ],
      },
    })
    const parsed = parseClaudeSession(line, 'sess-1')
    expect(parsed.conversation.adapter).toBe('claude-code')
    expect(parsed.generations).toHaveLength(2)
    for (const g of parsed.generations) {
      expect(g.model).toBe('claude-opus-5')
      expect(g.apparatus?.observability).toBe('observed')
      expect(g.apparatus?.maxOutputTokens).toBe(1024)
      expect(wasTruncatedByCap(g.apparatus)).toBe(true)
    }
  })
})

describe('the git launch says unobservable out loud', () => {
  it('stamps every generation it rebuilds from a commit blob', () => {
    const repo = mkdtempSync(join(tmpdir(), 'ursa-apparatus-'))
    const git = (...args: string[]) =>
      execFileSync('git', ['-C', repo, ...args], {
        encoding: 'utf8',
        env: {
          ...process.env,
          GIT_AUTHOR_NAME: 'Agent',
          GIT_AUTHOR_EMAIL: 'agent@example.com',
          GIT_COMMITTER_NAME: 'Agent',
          GIT_COMMITTER_EMAIL: 'agent@example.com',
        },
      })
    git('init', '-q', '-b', 'main')
    git('config', 'user.name', 'Agent')
    git('config', 'user.email', 'agent@example.com')

    const body = Array.from({ length: 24 }, (_, i) => `Sentence ${i} of generated prose about the subject.`).join(' ')
    writeFileSync(join(repo, 'doc.md'), body + '\n')
    git('add', '.')
    git('commit', '-q', '-m', 'write the doc\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')

    writeFileSync(join(repo, 'doc.md'), body.replace('Sentence 3', 'Sentence three') + '\n')
    git('-c', 'user.name=Human', '-c', 'user.email=human@example.com', 'commit', '-qam', 'edit the doc')

    const pairs = findCommitPairs(repo)
    expect(pairs.length, 'the fixture must produce one agent-then-human pair').toBeGreaterThan(0)
    const episodes = buildEpisodes(pairs, repo)
    const rec = resolveEpisode(repo, episodes[0])
    expect(rec).not.toBeNull()
    expect(rec!.generations.length).toBeGreaterThan(0)
    for (const g of rec!.generations) {
      expect(g.apparatus?.observability).toBe('unobservable')
      expect(g.apparatus?.reason).toBe('git-blob-generation')
      // The whole reason this path is marked blind: nothing here is a cap.
      expect(g.apparatus?.maxOutputTokens).toBeUndefined()
      expect(truncationUnknown(g.apparatus)).toBe(true)
    }
    // And the field it sits beside is a git identity rather than a model id.
    expect(rec!.generations[0].model).toContain('noreply@anthropic.com')
  })
})

describe('endsMidSentence is a prose heuristic and says so', () => {
  it('flags prose cut off mid-clause and leaves finished prose alone', () => {
    expect(endsMidSentence('The answer depends on three', 'prose')).toBe(true)
    expect(endsMidSentence('The answer depends on three things.', 'prose')).toBe(false)
    expect(endsMidSentence('', 'prose')).toBe(false)
  })

  it('never fires on code, where a file ending without punctuation is normal', () => {
    expect(endsMidSentence('const x = 1\n', 'code')).toBe(false)
    expect(endsMidSentence('function f() {\n  return 1\n}', 'code')).toBe(false)
  })
})
