import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { normalize } from './normalize'
import { segmentProse, segmentLines, modeForPath } from './segment'
import { levSimilarity, similarity } from './match'
import { parsePasteConversation, parseClaudeSession } from './parse'
import { resolve } from './resolve'

const FIXTURE = join(__dirname, '..', 'fixtures', 'mini')

describe('normalize', () => {
  it('folds smart punctuation and collapses whitespace, mapping back to original offsets', () => {
    const { norm, map } = normalize('He said  “Hello,\n  World”')
    expect(norm).toBe('he said "hello, world"')
    // the h of hello sits right after the folded quote
    const hIdx = norm.indexOf('hello')
    expect('“Hello'.includes('Hello')).toBe(true)
    expect(map[hIdx]).toBe('He said  “'.length)
    // last char maps to the closing quote
    expect(map[norm.length - 1]).toBe('He said  “Hello,\n  World'.length)
  })
})

describe('segment', () => {
  it('splits prose into sentences with original offsets', () => {
    const text = 'First sentence here. Second one, e.g. with an abbreviation. Third!'
    const spans = segmentProse(text)
    expect(spans.map((s) => s.text)).toEqual([
      'First sentence here.',
      'Second one, e.g. with an abbreviation.',
      'Third!',
    ])
    for (const s of spans) expect(text.slice(s.start, s.end)).toBe(s.text)
  })
  it('splits code into trimmed lines with original offsets', () => {
    const text = 'const a = 1\n\n  return a\n'
    const spans = segmentLines(text)
    expect(spans.map((s) => s.text)).toEqual(['const a = 1', 'return a'])
    expect(text.slice(spans[1].start, spans[1].end)).toBe('return a')
  })
  it('picks mode by extension', () => {
    expect(modeForPath('app/page.tsx')).toBe('code')
    expect(modeForPath('notes/final.md')).toBe('prose')
  })
})

describe('match', () => {
  it('levSimilarity is 1 for identical and low for unrelated strings', () => {
    expect(levSimilarity('abc', 'abc')).toBe(1)
    expect(levSimilarity('abc', 'xyz')).toBe(0)
  })
  it('similarity is high for a light edit, low for unrelated text', () => {
    const gen = 'provenance is established by the artifact, and no human grader is involved at any point.'
    const edited = 'provenance is established by the artifact itself, not by any human grader.'
    expect(similarity(edited, gen)).toBeGreaterThan(0.6)
    expect(similarity('completely unrelated words about cooking pasta', gen)).toBeLessThan(0.35)
  })
})

describe('parse', () => {
  it('parses paste-format conversations', () => {
    const raw = readFileSync(join(FIXTURE, 'conversations', '01-claude.md'), 'utf8')
    const { conversation, generations } = parsePasteConversation(raw, '01-claude')
    expect(conversation.model).toBe('claude-opus-5')
    expect(conversation.userTurns).toBe(1)
    expect(generations).toHaveLength(1)
    expect(generations[0].kind).toBe('assistant_text')
    expect(generations[0].text).toContain('The resolver joins finished work')
  })

  it('parses Claude Code session JSONL, extracting Write/Edit generations with path filter', () => {
    const lines = [
      { type: 'custom-title', customTitle: 'Ursa Minor UI', sessionId: 'x' },
      { type: 'user', message: { role: 'user', content: 'make the page' } },
      {
        type: 'assistant', uuid: 'a1', timestamp: '2026-07-30T12:00:00Z',
        message: {
          model: 'claude-fable-5',
          content: [
            { type: 'tool_use', name: 'Write', input: { file_path: '/x/ursa-minor-site/app/page.tsx', content: 'export default function Home() {}' } },
            { type: 'tool_use', name: 'Write', input: { file_path: '/x/other-project/app.tsx', content: 'unrelated' } },
            { type: 'tool_use', name: 'Edit', input: { file_path: '/x/ursa-minor-site/app/page.tsx', old_string: 'a', new_string: 'const nights = 7' } },
          ],
        },
      },
    ]
    const raw = lines.map((l) => JSON.stringify(l)).join('\n')
    const { conversation, generations } = parseClaudeSession(raw, 'sess', { pathFilter: 'ursa-minor' })
    expect(conversation.title).toBe('Ursa Minor UI')
    expect(conversation.adapter).toBe('claude-code')
    expect(generations).toHaveLength(2)
    expect(generations.map((g) => g.kind)).toEqual(['write', 'edit'])
    expect(generations[0].model).toBe('claude-fable-5')
  })
})

describe('resolve (fixture end-to-end)', () => {
  const finalText = readFileSync(join(FIXTURE, 'final.md'), 'utf8')
  const convs = ['01-claude', '02-chatgpt'].map((id) =>
    parsePasteConversation(readFileSync(join(FIXTURE, 'conversations', `${id}.md`), 'utf8'), id),
  )
  const record = resolve({
    taskId: 'fixture-mini',
    files: [{ path: 'final.md', text: finalText }],
    conversations: convs.map((c) => c.conversation),
    generations: convs.flatMap((c) => c.generations),
    finished: true,
  })
  const spans = record.files[0].spans

  it('classifies each planted sentence correctly', () => {
    const byText = (frag: string) => {
      const s = spans.find((x) => x.text.includes(frag))
      expect(s, `span containing "${frag}"`).toBeDefined()
      return s!
    }
    expect(byText('The resolver joins finished work').class).toBe('survived_verbatim')
    expect(byText('artifact itself').class).toBe('survived_mutated')
    expect(byText('artifact itself').diff).toBeDefined()
    expect(byText('closing sentence entirely on my own').class).toBe('no_generation_provenance')
    const gpt = byText('verifier for open-ended work')
    expect(gpt.class).toBe('survived_verbatim')
    expect(gpt.source!.model).toBe('gpt-5')
  })

  it('marks the thrown-away generation sentence generated_deleted', () => {
    const claudeGen = record.generations.find((g) => g.conversationId === '01-claude')!
    const dead = claudeGen.spans.find((s) => s.text.includes('throwaway filler'))!
    expect(dead.fate).toBe('generated_deleted')
    expect(claudeGen.survivalRate).toBeLessThan(1)
    expect(claudeGen.survivalRate).toBeGreaterThan(0)
  })

  it('produces coherent stats', () => {
    const s = record.stats
    expect(s.byClass.survived_verbatim.chars).toBeGreaterThan(0)
    expect(s.byClass.survived_mutated.chars).toBeGreaterThan(0)
    expect(s.byClass.no_generation_provenance.chars).toBeGreaterThan(0)
    expect(s.byModel['gpt-5']).toBeDefined()
    expect(s.generated.deletedChars).toBeGreaterThan(0)
    const claude = s.perConversation.find((c) => c.conversationId === '01-claude')!
    expect(claude.turnsToAcceptance).toBe(1)
    // pcts over covered chars sum to ~1
    const total = Object.values(s.byClass).reduce((a, c) => a + c.pct, 0)
    expect(total).toBeGreaterThan(0.99)
    expect(total).toBeLessThan(1.01)
  })

  it('span offsets always slice the original text exactly', () => {
    for (const s of spans) expect(finalText.slice(s.start, s.end)).toBe(s.text)
    for (const g of record.generations) {
      for (const s of g.spans) expect(g.text.slice(s.start, s.end)).toBe(s.text)
    }
  })
})
