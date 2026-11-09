// The corpus reader, tested on its own.
//
// Two of these assertions are about numbers that are easy to get right by
// accident and wrong on the one corpus that matters. The first is that a
// subject is a file and not a record: pull request #645 of this repository
// resolves to three records over ONE file, so a "distinct finished works"
// count that counted records would have reported three where the truth is
// one, and KR1.3's threshold of five would have been cleared by a single
// document. The second is that `survived_mutated` is read out of `byClass`
// rather than inferred from a record having survived anything at all, which
// is what makes a corpus of 12,000 verbatim characters and zero corrections
// reportable as the finding it is.

import { describe, expect, it } from 'vitest'
import {
  PROSE_EXTENSIONS,
  carriesCorrection,
  corpusShape,
  groupByArea,
  renderCorpus,
  summarizeCorpus,
  surfaceOf,
  type CorpusEntry,
} from './corpus'
import type { LabSignals, OutcomeRecord, SpanClass } from './types'

interface FakeRecordSpec {
  id: string
  paths: string[]
  finalChars?: number
  byClass?: Partial<Record<SpanClass, number>>
  generated?: Partial<OutcomeRecord['stats']['generated']>
  conversations?: number
  signals?: Partial<LabSignals>
}

/**
 * The smallest object the corpus reader actually touches. Deliberately not a
 * resolved record: these assertions are about the arithmetic over a pile of
 * records, and building real ones through `resolveEpisode` would make a
 * failure here ambiguous between the reader and the resolver. The records
 * resolved for real are covered by `src/adapters/pr-launch.test.ts`.
 */
function fakeRecord(spec: FakeRecordSpec): OutcomeRecord {
  const byClass = {} as OutcomeRecord['stats']['byClass']
  for (const klass of ['survived_verbatim', 'survived_mutated', 'no_generation_provenance'] as SpanClass[]) {
    const chars = spec.byClass?.[klass] ?? 0
    byClass[klass] = { spans: chars > 0 ? 1 : 0, chars, pct: 0, pctOfFinal: 0 }
  }
  return {
    schemaVersion: '0.1.0',
    task: { id: spec.id, finished: true, generatedAt: '2026-11-08T00:00:00Z' },
    artifact: { kind: 'repo' },
    files: spec.paths.map((path) => ({ path, mode: 'prose', text: '', spans: [] })),
    conversations: Array.from({ length: spec.conversations ?? 0 }, (_, i) => ({
      id: `c${i}`,
      title: `conversation ${i}`,
      adapter: 'claude-code' as const,
      turns: 0,
      userTurns: 0,
    })),
    generations: [],
    stats: {
      finalChars: spec.finalChars ?? 0,
      coveredChars: 0,
      byClass,
      uncertainSpans: 0,
      trivialSpans: 0,
      blindSpans: 0,
      suppressedTokenSpans: 0,
      byModel: {},
      generated: {
        totalChars: 0,
        charsWritten: 0,
        separatorChars: 0,
        verbatimClaimedChars: 0,
        survivedChars: 0,
        notGeneratedChars: 0,
        deletedChars: 0,
        deletedPct: 0,
        humanDeletedChars: 0,
        humanDeletedPct: 0,
        mergeDeletedChars: 0,
        unknownDeletedChars: 0,
        ...spec.generated,
      },
      perFile: [],
      perConversation: [],
    },
    ...(spec.signals
      ? {
          signals: {
            method: 'auto-detected',
            episode: {
              steps: 0,
              generations: 0,
              accepted: null,
              acceptanceStatedInChat: false,
              acceptanceBasis: 'undeclared',
            },
            correctionLoops: [],
            feedbackTranslations: [],
            repairAttempts: [],
            regressions: [],
            defensiveGuardrails: [],
            oneShotCorrections: [],
            ...spec.signals,
          } as LabSignals,
        }
      : {}),
  } as OutcomeRecord
}

function entry(label: string, records: OutcomeRecord[], extra: Partial<CorpusEntry> = {}): CorpusEntry {
  return {
    label,
    workUnits: records.length,
    records,
    belowMinChars: 0,
    unresolvable: 0,
    erased: 0,
    violations: 0,
    ...extra,
  }
}

describe('surfaceOf (which of KR1.3\'s surfaces a path is)', () => {
  it('reads the three extensions the key result names, and only those', () => {
    expect(PROSE_EXTENSIONS).toEqual(['.md', '.txt', '.tex'])
    expect(surfaceOf('docs/vision.md')).toBe('prose')
    expect(surfaceOf('notes.TXT')).toBe('prose')
    expect(surfaceOf('paper/main.tex')).toBe('prose')
    expect(surfaceOf('src/resolve.ts')).toBe('other')
    expect(surfaceOf('README.rst')).toBe('other')
  })

  it('does not read a directory\'s dot or a dotfile\'s name as an extension', () => {
    // `docs/v1.2/NOTES` has a dot before the last separator, and `.gitignore`
    // is a name that begins with one. Both would be `.2` and `.gitignore` to
    // a naive lastIndexOf, and `docs/v1.2/NOTES.md` must still be prose.
    expect(surfaceOf('docs/v1.2/NOTES')).toBe('other')
    expect(surfaceOf('docs/v1.2/NOTES.md')).toBe('prose')
    expect(surfaceOf('.gitignore')).toBe('other')
    expect(surfaceOf('docs/.keep')).toBe('other')
  })
})

describe('corpusShape (the three KR1.3 clauses)', () => {
  it('counts a subject once however many records cover it, which is PR #645\'s shape', () => {
    // The real case, with the real numbers: three records, one file.
    const path = 'docs/runs/engineer-2026-11-02-message-4.md'
    const shape = corpusShape([
      entry('alexandrapaiz/Ursa#645', [
        fakeRecord({ id: 'pr645-54dae55', paths: [path] }),
        fakeRecord({ id: 'pr645-aa86d16', paths: [path] }),
        fakeRecord({ id: 'pr645-de76b0e', paths: [path] }),
      ]),
    ])
    expect(shape.distinctSubjects).toEqual([path])
    expect(shape.distinctSubjects).toHaveLength(1)
    expect(shape.proseSubjects).toHaveLength(1)
  })

  it('separates prose subjects from the rest, and de-duplicates across entries', () => {
    const shape = corpusShape([
      entry('r#1', [fakeRecord({ id: 'a', paths: ['docs/a.md', 'src/x.ts'] })]),
      entry('r#2', [fakeRecord({ id: 'b', paths: ['docs/a.md', 'docs/b.txt'] })]),
    ])
    expect(shape.distinctSubjects).toEqual(['docs/a.md', 'docs/b.txt', 'src/x.ts'])
    expect(shape.proseSubjects).toEqual(['docs/a.md', 'docs/b.txt'])
  })

  it('counts a record as multi-source only when it joins more than one conversation', () => {
    const shape = corpusShape([
      entry('r#1', [
        fakeRecord({ id: 'pair', paths: ['a.md'], conversations: 0 }),
        fakeRecord({ id: 'one', paths: ['b.md'], conversations: 1 }),
        fakeRecord({ id: 'two', paths: ['c.md'], conversations: 2 }),
      ]),
    ])
    expect(shape.multiSourceRecords).toEqual(['two'])
  })
})

describe('groupByArea (what the corpus is OF)', () => {
  it('groups by two segments, because one does not separate docs/design from docs/runs', () => {
    expect(groupByArea(['docs/design/a.md', 'docs/runs/b.md', 'docs/runs/c.md'])).toEqual([
      { area: 'docs/runs', subjects: 2 },
      { area: 'docs/design', subjects: 1 },
    ])
  })

  it('sorts by count descending and then by name, so two runs print the same order', () => {
    const grouped = groupByArea(['b/x/1.md', 'a/y/1.md', 'a/y/2.md', 'c/z/1.md', 'b/x/2.md'])
    expect(grouped).toEqual([
      { area: 'a/y', subjects: 2 },
      { area: 'b/x', subjects: 2 },
      { area: 'c/z', subjects: 1 },
    ])
  })

  it('files a root-level path under a name rather than dropping it', () => {
    expect(groupByArea(['README.md', 'docs/a.md'])).toEqual([
      { area: '.', subjects: 1 },
      { area: 'docs', subjects: 1 },
    ])
  })

  it('reproduces the 2026-11-08 sweep\'s own finding, which is the reason it exists', () => {
    // The real 14 subjects of the committed measurement, which is the
    // five-pull-request window in docs/design/corpus-sweep.md §2.3. Nine of
    // them are seat run logs under docs/runs/, so a reader told only "10 of
    // 14 subjects are on the prose path" would read a corpus of real prose
    // work where the truth is mostly agents writing about their own runs.
    const measured = [
      'docs/provenance/bundle-digests.json',
      'docs/provenance/bundle-digests.md',
      'docs/runs/2026-11-02-engineer-message-13.md',
      'docs/runs/2026-11-08-exo-window-91.md',
      'docs/runs/engineer-2026-11-02-message-10.md',
      'docs/runs/engineer-2026-11-02-message-11.md',
      'docs/runs/engineer-2026-11-02-message-14.md',
      'docs/runs/engineer-2026-11-02-message-15.md',
      'docs/runs/engineer-2026-11-02-message-16.md',
      'docs/runs/engineer-2026-11-02-message-7.md',
      'docs/runs/engineer-2026-11-02-message-9.md',
      'ursa-major/src/adapters/github-pr.test.ts',
      'ursa-major/src/adapters/github-pr.ts',
      'ursa-major/tools/bundle-digest-index.ts',
    ]
    expect(measured).toHaveLength(14)
    expect(groupByArea(measured)).toEqual([
      { area: 'docs/runs', subjects: 9 },
      { area: 'docs/provenance', subjects: 2 },
      { area: 'ursa-major/src', subjects: 2 },
      { area: 'ursa-major/tools', subjects: 1 },
    ])
    // The clause the grouping exists to qualify: 10 of 14 are prose, and 9
    // of those 10 are run logs.
    expect(measured.filter((p) => surfaceOf(p) === 'prose')).toHaveLength(10)
  })
})

describe('carriesCorrection (the thing the corpus is for)', () => {
  it('is false for a record of pure verbatim survival, however large', () => {
    const record = fakeRecord({
      id: 'verbatim-only',
      paths: ['docs/a.md'],
      finalChars: 12_258,
      byClass: { survived_verbatim: 11_110, survived_mutated: 0, no_generation_provenance: 931 },
    })
    expect(carriesCorrection(record)).toBe(false)
  })

  it('is true on an edited span', () => {
    const record = fakeRecord({
      id: 'edited',
      paths: ['docs/a.md'],
      byClass: { survived_mutated: 1 },
    })
    expect(carriesCorrection(record)).toBe(true)
  })

  it('is true on a signal derived from an edit even when no span carries the label', () => {
    // The git-pair path derives one-shot corrections from edited spans, and a
    // record can carry the signal with the span accounting elsewhere. Reading
    // only `byClass` would under-report the corpus's whole subject.
    const record = fakeRecord({
      id: 'signalled',
      paths: ['docs/a.md'],
      signals: {
        oneShotCorrections: [
          { step: 1, text: 'AGENT: x\nFINAL: y', domain: 'tone', quotes: [] },
        ],
      },
    })
    expect(carriesCorrection(record)).toBe(true)
  })

  it('is false for a record with no signals block at all, rather than throwing', () => {
    expect(carriesCorrection(fakeRecord({ id: 'bare', paths: ['a.md'] }))).toBe(false)
  })
})

describe('summarizeCorpus', () => {
  it('adds the four character figures across entries and counts refusals apart', () => {
    const totals = summarizeCorpus([
      entry('r#1', [
        fakeRecord({
          id: 'a',
          paths: ['docs/a.md'],
          finalChars: 100,
          byClass: { survived_verbatim: 60, survived_mutated: 10, no_generation_provenance: 30 },
          generated: { totalChars: 80, humanDeletedChars: 7, mergeDeletedChars: 2, unknownDeletedChars: 1 },
        }),
      ], { belowMinChars: 2, unresolvable: 3, erased: 1, workUnits: 7 }),
      entry('r#2', [
        fakeRecord({
          id: 'b',
          paths: ['docs/b.md'],
          finalChars: 50,
          byClass: { survived_verbatim: 50 },
          generated: { totalChars: 20 },
        }),
      ], { violations: 2 }),
      entry('r#3', [], { refusal: 'could not capture: gh exited 1' }),
    ])

    expect(totals.entries).toBe(3)
    expect(totals.entriesWithRecords).toBe(2)
    expect(totals.entriesRefused).toBe(1)
    expect(totals.records).toBe(2)
    expect(totals.workUnits).toBe(8)
    expect(totals.finalChars).toBe(150)
    expect(totals.byClass.survived_verbatim).toBe(110)
    expect(totals.byClass.survived_mutated).toBe(10)
    expect(totals.byClass.no_generation_provenance).toBe(30)
    expect(totals.generatedChars).toBe(100)
    expect(totals.humanDeletedChars).toBe(7)
    expect(totals.mergeDeletedChars).toBe(2)
    expect(totals.unknownDeletedChars).toBe(1)
    expect(totals.belowMinChars).toBe(2)
    expect(totals.unresolvable).toBe(3)
    expect(totals.erased).toBe(1)
    expect(totals.violations).toBe(2)
  })

  it('counts an entry that produced records as measured even when it also carries a refusal', () => {
    // An unreadable intervening merge is a caveat on a figure, not an absence
    // of one: the records exist and the row says what the reader may not
    // conclude from them.
    const totals = summarizeCorpus([
      entry('r#1', [fakeRecord({ id: 'a', paths: ['a.md'] })], { refusal: 'merge commit abc not in this clone' }),
    ])
    expect(totals.entriesWithRecords).toBe(1)
    expect(totals.entriesRefused).toBe(1)
  })

  it('reads through a class the resolver omitted rather than trusting the key to be present', () => {
    const record = fakeRecord({ id: 'a', paths: ['a.md'], finalChars: 10 })
    // @ts-expect-error deleting a key the type requires is the condition under test
    delete record.stats.byClass.survived_mutated
    expect(() => summarizeCorpus([entry('r#1', [record])])).not.toThrow()
    expect(summarizeCorpus([entry('r#1', [record])]).byClass.survived_mutated).toBe(0)
  })
})

describe('renderCorpus', () => {
  const corpus = [
    entry('alexandrapaiz/Ursa#645', [
      fakeRecord({
        id: 'pr645-de76b0e',
        paths: ['docs/runs/engineer-2026-11-02-message-4.md'],
        finalChars: 12_258,
        byClass: { survived_verbatim: 11_110, survived_mutated: 0, no_generation_provenance: 931 },
        generated: { totalChars: 10_960, humanDeletedChars: 15 },
      }),
    ]),
  ]

  it('states the window it was measured over, above the figures', () => {
    const text = renderCorpus(corpus, '1 pull request of alexandrapaiz/Ursa on 2026-11-08: #645')
    expect(text.split('\n')[0]).toBe('Corpus: 1 pull request of alexandrapaiz/Ursa on 2026-11-08: #645')
  })

  it('quotes each KR1.3 clause beside its number and scores none of them', () => {
    const text = renderCorpus(corpus, 'w')
    expect(text).toContain('five or more completed outcome records on distinct real finished works')
    expect(text).toContain('at least two use the prose path (.md/.txt/.tex)')
    expect(text).toContain('at least one joins generations from more than one source')
    expect(text).toContain('measured, not scored')
    // No pass/fail verdict on an owner-held key result.
    expect(text).not.toMatch(/\bKR1\.3 (met|unmet|passes|fails)\b/)
  })

  it('says what the finished works ARE, by area, beside how many there are', () => {
    const text = renderCorpus(corpus, 'w')
    expect(text).toContain('the size of a corpus and its subject are different facts')
    expect(text).toContain('docs/runs 1')
  })

  it('reports the correction count even when it is zero, because zero is the finding', () => {
    const text = renderCorpus(corpus, 'w')
    expect(text).toContain('0 of 1 record(s) carry a correction')
  })

  it('divides by no zero on an empty corpus', () => {
    const text = renderCorpus([entry('r#1', [])], 'w')
    expect(text).toContain('n/a')
    expect(text).not.toContain('NaN')
  })

  it('names the violation count and says the records are still on disk', () => {
    const text = renderCorpus([entry('r#1', [fakeRecord({ id: 'a', paths: ['a.md'] })], { violations: 3 })], 'w')
    expect(text).toContain('3 invariant violation(s)')
    expect(text).toContain('still the evidence')
  })
})
