import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { normalize } from './normalize'
import { segmentProse, segmentLines, modeForPath } from './segment'
import { levSimilarity, similarity } from './match'
import { parsePasteConversation, parseClaudeSession } from './parse'
import { resolve } from './resolve'
import { checkRecord } from './invariants'
import { deriveSignals } from './signals'

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

// The six-case probe from the ledger entry "`survived_verbatim` is not
// verbatim, and a record sold today proves it" (docs/ideas.md, 2026-10-12),
// committed as the specification it asked to be. Each case is the same
// generation and a final text that differs from it in exactly one way.
// Five of the six produced `survived_verbatim` with `score: 1` before
// 2026-10-13; the measured before-and-after table is in
// docs/design/verbatim-byte-identity.md, and the same six cases run on
// demand from tools/measure-verbatim-fidelity.ts.
describe('resolve (survived_verbatim means byte-identical)', () => {
  const GEN =
    'The resolver joins finished work backward to the generations that fed it, and the label is supplied by the artifact — never by a grader.'

  const run = (finalText: string) =>
    resolve({
      taskId: 'verbatim-probe',
      files: [{ path: 'final.md', text: finalText }],
      conversations: [
        { id: 'c1', title: 'verbatim probe', adapter: 'paste', model: 'probe-model', turns: 2, userTurns: 1 },
      ],
      generations: [
        { conversationId: 'c1', model: 'probe-model', turnIndex: 0, kind: 'assistant_text', text: GEN },
      ],
      finished: true,
      generatedAt: '2026-10-13T00:00:00.000Z',
    })

  /** every span the record labels verbatim, with the generation bytes it points at */
  const verbatimClaims = (finalText: string) =>
    run(finalText)
      .files[0].spans.filter((s) => s.class === 'survived_verbatim')
      .map((s) => ({ final: s.text, claimed: s.source ? GEN.slice(s.source.start, s.source.end) : null }))

  it('labels an identical final text verbatim', () => {
    const spans = run(GEN).files[0].spans
    expect(spans).toHaveLength(1)
    expect(spans[0].class).toBe('survived_verbatim')
    expect(spans[0].text).toBe(GEN)
  })

  // The four differences the normalized match used to fold away. Each one
  // keeps the span's normalized text identical to the generation's, so
  // every one of these assertions failed before the fix.
  const folded: Array<[string, string]> = [
    ['a case change', GEN.replace('The resolver', 'The Resolver')],
    ['an em dash retyped as a hyphen', GEN.replace('—', '-')],
    ['a doubled space', GEN.replace('and the label', 'and  the label')],
  ]
  for (const [what, finalText] of folded) {
    it(`labels ${what} a normalized-only mutation, not verbatim`, () => {
      const spans = run(finalText).files[0].spans
      expect(spans.map((s) => s.class)).toEqual(['survived_mutated'])
      expect(spans[0].diff, 'the edit is reported as a diff, not folded away').toBeDefined()
      // The demotion keeps the generation extent pass 1 located, so the
      // record still says which model wrote the text that was edited.
      expect(spans[0].source).toBeDefined()
      expect(spans[0].normalizedOnly, 'a buyer can tell this mutation from a content edit').toBe(true)
      expect(spans[0].score).toBe(1)
    })
  }

  it('shows the change at character granularity, because a word diff cannot see whitespace', () => {
    // `diffWords` treats any run of whitespace as equivalent, so on the
    // commonest normalized-only difference it reports one unchanged part and
    // no change at all. A span whose entire content is the mutation,
    // carrying a diff asserting nothing was mutated, is worse than the label
    // it replaced.
    const spans = run(GEN.replace('and the label', 'and  the label')).files[0].spans
    const changed = spans[0].diff!.filter((d) => d.added || d.removed)
    expect(changed.map((d) => ({ value: d.value, added: d.added }))).toEqual([{ value: ' ', added: true }])
  })

  it('keeps a formatting-only mutation out of the one signal `ursa run` emits', () => {
    // These spans were `survived_verbatim` before 2026-10-13 and so never
    // reached `deriveSignals`. Demoting them without this would have added
    // whitespace edits to `oneShotCorrections`, which is a figure Ursa Minor
    // sells moving as a side effect of a labelling fix.
    const record = run(GEN.replace('and the label', 'and  the label'))
    expect(record.files[0].spans[0].normalizedOnly).toBe(true)
    const signals = deriveSignals(record)
    expect(signals.oneShotCorrections).toEqual([])
  })

  it('demotes rather than drops, because dropping moves the span to the class that must stay clean', () => {
    // The first version of this fix let a non-byte-identical pass-1 hit fall
    // through to pass 2, which scores against generation SEGMENTS. Over ten
    // records of this repository's history that pushed 26 spans and 1,466
    // characters into `no_generation_provenance` — "the model was never in
    // the running" — about text the model had written. The assertion is that
    // no case in this probe produces that class, since in every one of them
    // the model wrote the text.
    for (const [, finalText] of folded) {
      const classes = run(finalText).files[0].spans.map((s) => s.class)
      expect(classes).not.toContain('no_generation_provenance')
    }
  })

  it('asks the corroborator on a demoted span, and honours a rival verdict', () => {
    // DESCENT_CHECKED_UNIFORMLY requires that if any span carries a descent
    // verdict, every survived_mutated span does. Pass 1 never asked before,
    // so a demoted span would have been the one mutation label in the record
    // with no verdict behind it.
    const finalText = GEN.replace('The resolver', 'The Resolver')
    const asked: string[] = []
    const record = resolve({
      taskId: 'verbatim-probe',
      files: [{ path: 'final.md', text: finalText }],
      conversations: [
        { id: 'c1', title: 'verbatim probe', adapter: 'paste', model: 'probe-model', turns: 2, userTurns: 1 },
      ],
      generations: [
        { conversationId: 'c1', model: 'probe-model', turnIndex: 0, kind: 'assistant_text', text: GEN },
      ],
      finished: true,
      generatedAt: '2026-10-13T00:00:00.000Z',
      corroborate: (path) => {
        asked.push(path)
        return { basis: 'rival', relation: 'pre_existing', sha: 'deadbee', subject: 'docs: the sentence, written before this generation' }
      },
    })
    expect(asked).toEqual(['final.md'])
    const span = record.files[0].spans[0]
    expect(span.class).toBe('no_generation_provenance')
    expect(span.uncertain).toBe(true)
    expect(span.candidate, 'the evidence is kept for a human to adjudicate').toBeDefined()
    expect(span.descent!.basis).toBe('rival')
    // and the record still passes its own gate in that shape
    expect(checkRecord(record)).toEqual([])
  })

  it('does not credit a reflowed line with the whitespace the person inserted', () => {
    // Prose segments line by line, so a reflow splits one final segment into
    // two. Both halves really are byte-identical, and before the fix
    // mergeVerbatimRuns joined them across a 3-char final gap ("\n  ")
    // standing in for a 1-char generation gap (" "), claiming 2 characters
    // the model never wrote. That merged span is the CLAIM_NOT_WIDER
    // violation on record `ursa-2026-10-07-2f610e9`. The two halves stay
    // verbatim; the inserted whitespace now belongs to no span's claim.
    const finalText = GEN.replace('and the label', 'and\n  the label')
    const spans = run(finalText).files[0].spans
    expect(spans.map((s) => s.class)).toEqual(['survived_verbatim', 'survived_verbatim'])
    expect(spans.some((s) => s.text.includes('\n'))).toBe(false)
  })

  it('every verbatim claim in every case is the same characters on both sides', () => {
    const cases = [
      GEN,
      ...folded.map(([, f]) => f),
      GEN.replace('and the label', 'and\n  the label'),
      // smart quotes introduced: caught before the fix too, but only by the
      // accident that the fold runs curly-to-straight rather than the other
      // way, so it was never a rule
      GEN.replace('the artifact', 'the ‘artifact’'),
    ]
    for (const finalText of cases) {
      for (const c of verbatimClaims(finalText)) expect(c.claimed).toBe(c.final)
    }
  })
})
