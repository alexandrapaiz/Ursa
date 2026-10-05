// The invariant gate (src/invariants.ts), tested from both directions:
// every invariant must pass on records the resolver really produced, and
// every invariant must FAIL on a record broken in exactly the way it
// describes. The second half is the half that matters. A gate nobody has
// seen fail is indistinguishable from a function that returns [].
//
// Ledger: "The generated denominator is wrong in two directions, and
// nothing checks it" (docs/ideas.md, 2026-10-04). Its first step was the
// invariant, before either fix, run "over the public fixture plus a clone
// of this repository, so the assertion is exercised against real history
// and not only synthetic". fixtures/real/ursa-main-4d5e401.json is that
// clone's record, committed so the gate keeps being exercised against it.

import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderRunSummary } from './bin/ursa'
import { mergedLength } from './intervals'
import { checkRecord, measure, type InvariantCode } from './invariants'
import { runGate } from './invariants.cli'
import { resolve } from './resolve'
import type { OutcomeRecord } from './types'

const PUBLIC_FIXTURE = 'fixtures/mini/record/outcome_record.json'
const REAL_FIXTURE = 'fixtures/real/ursa-main-4d5e401.json'

const load = (p: string): OutcomeRecord => JSON.parse(readFileSync(p, 'utf8')) as OutcomeRecord
const clone = (r: OutcomeRecord): OutcomeRecord => JSON.parse(JSON.stringify(r)) as OutcomeRecord

/** A record with one verbatim span, one fuzzy-matched span and one deletion. */
function resolvedRecord(): OutcomeRecord {
  const generated = [
    'The information a decision needs is dispersed across many individuals.',
    'No single observer holds it whole, and a central grader pretends otherwise.',
    'This sentence is a draft that the person threw away entirely.',
  ].join('\n\n')
  const final = [
    'The information a decision needs is dispersed across many individuals.',
    'No single observer holds the whole of it, and a central grader pretends otherwise.',
    'A line the model was never in the running for.',
  ].join('\n\n')
  return resolve({
    taskId: 'invariants-unit',
    files: [{ path: 'notes.md', text: final }],
    conversations: [{
      id: 'c1', title: 'principles', adapter: 'paste', turns: 1, userTurns: 0,
    }],
    generations: [{
      conversationId: 'c1', model: 'test-model', turnIndex: 1,
      kind: 'assistant_text', text: generated,
    }],
    finished: true,
    generatedAt: '2026-10-05T00:00:00.000Z',
  })
}

describe('mergedLength', () => {
  it('counts a character covered by three extents once', () => {
    expect(mergedLength([[0, 10], [2, 6], [5, 8]])).toBe(10)
  })

  it('treats touching extents as one run and disjoint extents as two', () => {
    expect(mergedLength([[0, 5], [5, 9]])).toBe(9)
    expect(mergedLength([[0, 5], [6, 9]])).toBe(8)
  })

  it('ignores empty and inverted extents, and does not mutate its input', () => {
    const input: Array<[number, number]> = [[4, 4], [9, 3], [0, 2]]
    expect(mergedLength(input)).toBe(2)
    expect(input).toEqual([[4, 4], [9, 3], [0, 2]])
  })
})

describe('the gate on records the resolver really produced', () => {
  it('passes on the public fixture record', () => {
    const found = checkRecord(load(PUBLIC_FIXTURE))
    expect(found).toEqual([])
  })

  it('passes on a record made from this repository\'s real git history', () => {
    const found = checkRecord(load(REAL_FIXTURE))
    expect(found).toEqual([])
  })

  it('passes on a record resolved in-process, spans of all three classes', () => {
    const record = resolvedRecord()
    const classes = new Set(record.files[0].spans.map((s) => s.class))
    expect(classes.has('survived_verbatim')).toBe(true)
    expect(classes.has('survived_mutated')).toBe(true)
    expect(record.generations[0].spans.some((s) => s.fate === 'generated_deleted')).toBe(true)
    expect(checkRecord(record)).toEqual([])
  })

  it('exits zero through the CLI on the real fixture, non-zero is reserved for violations', () => {
    const { violations, lines } = runGate(REAL_FIXTURE)
    expect(violations).toBe(0)
    expect(lines.join('\n')).toContain('1 record checked, 0 violations.')
  })

  it('reports a non-zero count through the CLI when a record on disk is broken', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ursa-gate-'))
    const broken = load(REAL_FIXTURE)
    broken.generations[0].totalChars += 1000
    writeFileSync(join(dir, 'clean.json'), readFileSync(REAL_FIXTURE, 'utf8'))
    writeFileSync(join(dir, 'broken.json'), JSON.stringify(broken))
    const { violations, lines } = runGate(dir)
    const text = lines.join('\n')
    expect(violations).toBeGreaterThan(0)
    expect(text).toContain('GEN_CHARS_CONSISTENT')
    expect(text).toContain('2 records checked')
    // The clean one is still reported clean: the gate names the record, it
    // does not condemn the directory.
    expect(text).toContain('OK — every stated bound holds')
  })

  it('says so rather than passing silently when there is nothing to check', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ursa-gate-empty-'))
    const { violations, lines } = runGate(dir)
    expect(violations).toBe(0)
    expect(lines.join('\n')).toContain('Nothing checked, which is not the same as nothing wrong.')
  })
})

/**
 * Each case breaks one field of a passing record and names the code that
 * must fire. The record under test is the real-history fixture, so these
 * are mutations of something the resolver actually wrote rather than of a
 * hand-built object that may never have been reachable.
 */
const BREAKAGES: Array<{ code: InvariantCode; what: string; break: (r: OutcomeRecord) => void }> = [
  {
    code: 'CLAIM_NOT_WIDER',
    what: 'a verbatim span credited with more characters than the extent it claims',
    break: (r) => {
      const s = r.files[0].spans.find((x) => x.class === 'survived_verbatim' && x.source)!
      s.source!.end = s.source!.start + 1
    },
  },
  {
    code: 'CLAIM_IN_GENERATION',
    what: 'a source pointer past the end of the generation it names',
    break: (r) => {
      const s = r.files[0].spans.find((x) => x.source)!
      s.source!.end = r.generations[0].text.length + 50
    },
  },
  {
    code: 'CLAIM_IN_GENERATION',
    what: 'a source pointer at a generation index the record does not have',
    break: (r) => {
      const s = r.files[0].spans.find((x) => x.source)!
      s.source!.generationIndex = 99
    },
  },
  {
    code: 'GEN_SPANS_PARTITION_ORDER',
    what: 'two generation spans overlapping, so a character carries two fates',
    break: (r) => { r.generations[0].spans[1].start = r.generations[0].spans[0].start },
  },
  {
    code: 'GEN_SPANS_PARTITION_ORDER',
    what: 'a generation span whose text is not the slice its offsets name',
    break: (r) => { r.generations[0].spans[0].text += ' appended after the fact' },
  },
  {
    code: 'GEN_CHARS_CONSISTENT',
    what: 'charsWritten disagreeing with the generation text it summarises',
    break: (r) => { r.generations[0].charsWritten += 10 },
  },
  {
    code: 'GEN_CHARS_CONSISTENT',
    what: 'the original defect\'s shape: totalChars not the sum of the span extents',
    break: (r) => { r.generations[0].totalChars -= 7 },
  },
  {
    code: 'GEN_SURVIVED_BOUNDED',
    what: 'more characters surviving than the generation has segment characters',
    break: (r) => { r.generations[0].survivedChars = r.generations[0].totalChars + 1 },
  },
  {
    code: 'GEN_CLAIM_BOUNDED',
    what: 'final spans claiming, between them, more distinct generated characters than exist',
    break: (r) => {
      const gen = r.generations[0]
      gen.text = gen.text.slice(0, 40)
      gen.charsWritten = gen.text.length
      gen.spans = gen.spans.filter((s) => s.end <= 40)
      gen.totalChars = gen.spans.reduce((a, s) => a + (s.end - s.start), 0)
      gen.separatorChars = gen.charsWritten - gen.totalChars
      gen.survivedChars = Math.min(gen.survivedChars, gen.totalChars)
      gen.survivalRate = gen.totalChars
        ? Math.round((gen.survivedChars / gen.totalChars) * 1000) / 1000
        : 0
    },
  },
  {
    code: 'DELETION_SPLIT_EXACT',
    what: 'a deletion split that does not add up to the characters deleted',
    break: (r) => { r.stats.generated.humanDeletedChars += 5 },
  },
  {
    code: 'DELETION_SPLIT_EXACT',
    what: 'a negative human share, which is how a wrong merge attribution would show',
    break: (r) => {
      r.stats.generated.mergeDeletedChars = r.stats.generated.deletedChars + 20
      r.stats.generated.humanDeletedChars = -20
    },
  },
  {
    code: 'FINAL_SPANS_IN_FILE',
    what: 'a final span reaching past the end of the finished file',
    break: (r) => { r.files[0].spans[0].end = r.files[0].text.length + 1 },
  },
  {
    code: 'COVERED_BOUNDED',
    what: 'coveredChars not the sum of the span extents it claims to be',
    break: (r) => { r.stats.coveredChars += 3 },
  },
  {
    code: 'RATES_MATCH_FIELDS',
    what: 'a stored survival rate that is not its own numerator over its own denominator',
    break: (r) => { r.generations[0].survivalRate = 0.5 },
  },
  {
    code: 'RATES_MATCH_FIELDS',
    what: 'a stored discard rate that does not match the characters behind it',
    break: (r) => { r.stats.generated.humanDeletedPct = 0.42 },
  },
]

describe('the gate fails on a record broken in the way each invariant describes', () => {
  const base = load(REAL_FIXTURE)
  it('and the record it starts from is clean, so every failure below is the mutation', () => {
    expect(checkRecord(base)).toEqual([])
  })

  for (const c of BREAKAGES) {
    it(`${c.code}: ${c.what}`, () => {
      const broken = clone(base)
      c.break(broken)
      const found = checkRecord(broken)
      expect(found.map((v) => v.code)).toContain(c.code)
      // The violation has to carry the numbers, not just the code. A gate
      // whose message sends the reader back to the source is a gate that
      // gets silenced instead of read.
      const v = found.find((x) => x.code === c.code)!
      expect(v.observed).toMatch(/\d/)
      expect(v.invariant.length).toBeGreaterThan(20)
      expect(v.where).toContain(base.task.id)
    })
  }
})

describe('the 2026-10-04 defect, as the measurement that explains it', () => {
  // The run that triggered this work printed 239,976 chars surviving
  // verbatim against 239,841 generated. The numerator was final-file
  // characters and the denominator was generation SEGMENT characters, so
  // the comparison was between two different sets of characters and could
  // be impossible with every span individually correct. These assertions
  // pin the two mechanisms that make up the whole of the difference.
  const real = load(REAL_FIXTURE)

  it('separator characters are generated, are in no segment, and so are in no fate', () => {
    const gen = real.generations[0]
    const segmentChars = gen.spans.reduce((a, s) => a + (s.end - s.start), 0)
    expect(gen.charsWritten).toBe(gen.text.length)
    expect(gen.totalChars).toBe(segmentChars)
    expect(gen.separatorChars).toBe(gen.charsWritten - gen.totalChars)
    expect(gen.separatorChars).toBeGreaterThan(0)
    // Not a rounding concern on real history: this record alone hides 123
    // characters from every rate it reports.
    expect(gen.separatorChars).toBe(123)
  })

  it('a verbatim claim can cover separator characters, which is why the old comparison broke', () => {
    const m = measure(real)
    expect(m.verbatimFinalChars).toBeGreaterThan(m.generatedSegmentChars)
    expect(m.verbatimClaimedChars).toBeLessThanOrEqual(m.generatedCharsWritten)
  })

  it('reuse accounts for the rest: the same generated text claimed from two places', () => {
    const m = measure(real)
    expect(m.reusedChars).toBe(m.verbatimFinalChars - m.verbatimClaimedChars)
    expect(m.reusedChars).toBeGreaterThanOrEqual(0)
    expect(m.verbatimClaimedChars).toBe(real.stats.generated.verbatimClaimedChars)
  })

  it('every stated bound still holds on that same record', () => {
    expect(checkRecord(real)).toEqual([])
  })
})

describe('an edit that adds text is not a wider claim, and the added text is counted', () => {
  // The first version of CLAIM_NOT_WIDER applied to every span carrying a
  // source and fired on this record immediately. The span was right and the
  // invariant was wrong: the person turned "holds it whole" into "holds the
  // whole of it" and the finished span is seven characters longer than the
  // generation segment it descends from. An edit is allowed to add text.
  const record = resolvedRecord()

  it('passes the gate, because a mutated span may exceed what it edited', () => {
    expect(checkRecord(record)).toEqual([])
  })

  it('counts the seven characters the person added, which byClass credits to the model', () => {
    const m = measure(record)
    const mutated = record.files[0].spans.find((s) => s.class === 'survived_mutated')!
    expect(mutated.end - mutated.start).toBe(82)
    expect(mutated.source!.end - mutated.source!.start).toBe(75)
    expect(m.mutatedFinalChars).toBe(82)
    expect(m.mutatedAddedChars).toBe(7)
  })

  it('still fails a verbatim span that claims more than its extent', () => {
    const broken = clone(record)
    const v = broken.files[0].spans.find((s) => s.class === 'survived_verbatim')!
    v.source!.end = v.source!.start + 1
    expect(checkRecord(broken).map((x) => x.code)).toContain('CLAIM_NOT_WIDER')
  })
})

describe('the run summary never prints a pair that cannot both be true', () => {
  // The defect reached the user as two adjacent sentences, so the fix has
  // to be asserted there and not only on the record. The summary used to
  // set `byClass.survived_verbatim.chars` beside `generated.totalChars`,
  // which are a final-file count and a generation-segment count. It now
  // prints `charsWritten`, the only generation-side total a final-side
  // count may stand next to.
  const real = load(REAL_FIXTURE)
  const episode = {
    id: 'ep', generatedSha: 'aaaaaaa', finalSha: 'bbbbbbb', agentMarker: 'claude[bot]',
    openedAt: '2026-09-26T14:59:57Z', closedAt: '2026-09-30T03:49:49Z', touchedFiles: ['docs/sprints/dispatch-queue.md'],
  }

  function printedNumbers(summary: string, pattern: RegExp): number[] {
    const m = summary.match(pattern)
    if (!m) throw new Error(`summary did not contain ${pattern}:\n${summary}`)
    return m.slice(1).map((n) => Number(n.replace(/,/g, '')))
  }

  it('the generated total it prints is at least the surviving total it prints', () => {
    const summary = renderRunSummary([real], [episode as never])
    const [survived] = printedNumbers(summary, /([\d,]+) chars survived your editing verbatim/)
    const [written, claimed] = printedNumbers(
      summary, /([\d,]+) chars were generated to get there, and ([\d,]+) of them reached/,
    )
    expect(written).toBe(real.stats.generated.charsWritten)
    expect(survived).toBeLessThanOrEqual(written)
    expect(claimed).toBeLessThanOrEqual(written)
  })

  it('holds when the same record is counted twice, which is how the defect scaled', () => {
    const summary = renderRunSummary([real, real], [episode as never, episode as never])
    const [survived] = printedNumbers(summary, /([\d,]+) chars survived your editing verbatim/)
    const [written] = printedNumbers(summary, /([\d,]+) chars were generated to get there/)
    expect(survived).toBeLessThanOrEqual(written)
  })

  it('names the denominator of the discard figure in the sentence that reports it', () => {
    const withDiscard = clone(real)
    withDiscard.stats.generated.humanDeletedChars = 500
    withDiscard.stats.generated.deletedChars = 500
    withDiscard.stats.generated.survivedChars = withDiscard.stats.generated.totalChars - 500
    const summary = renderRunSummary([withDiscard], [episode as never])
    const [discarded, traced] = printedNumbers(
      summary, /You discarded ([\d,]+) chars of draft on the way, \d+% of the ([\d,]+) whose fate/,
    )
    expect(discarded).toBe(500)
    expect(traced).toBe(real.stats.generated.totalChars)
  })
})
