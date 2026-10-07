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
import { parsePasteConversation } from './parse'
import { resolve } from './resolve'
import { deriveSignals } from './signals'
import type { Exclusion, OutcomeRecord } from './types'

const PUBLIC_FIXTURE = 'fixtures/mini/record/outcome_record.json'
const REAL_FIXTURE = 'fixtures/real/ursa-main-4d5e401.json'

const load = (p: string): OutcomeRecord => JSON.parse(readFileSync(p, 'utf8')) as OutcomeRecord
const clone = (r: OutcomeRecord): OutcomeRecord => JSON.parse(JSON.stringify(r)) as OutcomeRecord

/** A record with one verbatim span, one fuzzy-matched span and one deletion. */
function resolvedRecord(exclusions?: Exclusion[]): OutcomeRecord {
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
    ...(exclusions ? { exclusions } : {}),
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

// ---------------------------------------------------------------------------
// SIGNAL_QUOTE_GROUNDED — the eleventh bound.
//
// Ledger: "The gate checks seven of a record's nine top-level keys"
// (docs/ideas.md, 2026-10-05). Its named first step was the excerpt check
// alone, "the one whose failure would be a trust incident rather than a wrong
// number". The ten bounds above all compare numbers; this one re-reads the
// quotes, which is the only part of a record a buyer can check against their
// own copy of the conversation.
//
// Both directions are covered, and the second one matters more: these tests
// run the whole pipeline (parse → resolve → deriveSignals) over the public
// trace fixture and over a label-stage record, then break one quote at a time
// in each of the five ways it can be wrong.
// ---------------------------------------------------------------------------

describe('SIGNAL_QUOTE_GROUNDED on records the pipeline really produced', () => {
  function traceRecord(): OutcomeRecord {
    const conv = parsePasteConversation(
      readFileSync(join('fixtures', 'loops', 'conversations', '01-claude.md'), 'utf8'),
      '01-claude',
    )
    const record = resolve({
      taskId: 'quote-grounding-trace',
      files: [{ path: 'final.md', text: readFileSync(join('fixtures', 'loops', 'final.md'), 'utf8') }],
      conversations: [conv.conversation],
      generations: conv.generations,
      finished: true,
    })
    record.signals = deriveSignals(record)
    return record
  }

  /** the label stage: a git commit pair, no prompts, corrections as edits */
  function labelRecord(): OutcomeRecord {
    const record = resolvedRecord()
    record.signals = deriveSignals(record)
    return record
  }

  it('grounds every quote the trace stage emits, across all three signal kinds', () => {
    const record = traceRecord()
    const s = record.signals!
    expect(s.correctionLoops.length).toBeGreaterThan(0)
    expect(s.regressions.length).toBeGreaterThan(0)
    expect(s.oneShotCorrections.length).toBeGreaterThan(0)
    const m = measure(record)
    expect(m.signalQuotes).toBe(m.signalEntries)
    expect(m.signalEntriesWithoutQuote).toBe(0)
    expect(checkRecord(record)).toEqual([])
  })

  it('points each trace quote at the user prompt it came from, by conversation and step', () => {
    const loop = traceRecord().signals!.correctionLoops[0]
    expect(loop.quotes).toHaveLength(1)
    expect(loop.quotes[0].of).toBe('user_prompt')
    expect(loop.quotes[0].conversationId).toBe('01-claude')
    expect(loop.discoveredSpec).toContain(loop.quotes[0].text)
  })

  it('carries two quotes at the label stage, grounded in two different texts', () => {
    const record = labelRecord()
    const [correction] = record.signals!.oneShotCorrections
    expect(correction.quotes.map((q) => q.of)).toEqual(['generation', 'final_span'])
    // The agent side is the generation extent the span descends from; the
    // final side is the span as the person left it. Checking both against
    // one text would make the bound unfalsifiable for whichever side lost.
    const [agent, final] = correction.quotes
    expect(record.generations[agent.generationIndex!].text).toContain(agent.text)
    expect(record.files.find((f) => f.path === final.filePath)!.text).toContain(final.text)
    expect(checkRecord(record)).toEqual([])
  })

  it('counts a distilled spec as quoting nobody, and does not fail it', () => {
    const record = labelRecord()
    record.signals!.correctionLoops = [{
      id: 'distilled', theme: 'copy oversells', targetFiles: ['notes.md'],
      openedStep: 1, promptSteps: [1, 4], recurrences: 1, regressionSteps: [],
      closedStep: 5, resolution: 'accepted', resolvingSteps: [5],
      discoveredSpec: 'claims name the mechanism or get cut',
      quotes: [],
    }]
    expect(checkRecord(record)).toEqual([])
    expect(measure(record).signalEntriesWithoutQuote).toBe(1)
  })

  it('reports zero quotes checked on the two fixtures committed here, rather than passing silently', () => {
    // Both are real records and neither carries a signal, so the bound is
    // vacuously true on both. The measurement is the only thing standing
    // between that and a green gate that read nothing.
    for (const p of [PUBLIC_FIXTURE, REAL_FIXTURE]) {
      const m = measure(load(p))
      expect(m.signalEntries).toBe(0)
      expect(m.signalQuotes).toBe(0)
    }
  })
})

describe('SIGNAL_QUOTE_GROUNDED fires on each way a quote can be wrong', () => {
  function groundedTrace(): OutcomeRecord {
    const conv = parsePasteConversation(
      readFileSync(join('fixtures', 'loops', 'conversations', '01-claude.md'), 'utf8'),
      '01-claude',
    )
    const record = resolve({
      taskId: 'quote-grounding-break',
      files: [{ path: 'final.md', text: readFileSync(join('fixtures', 'loops', 'final.md'), 'utf8') }],
      conversations: [conv.conversation],
      generations: conv.generations,
      finished: true,
    })
    record.signals = deriveSignals(record)
    return record
  }

  const fired = (r: OutcomeRecord) =>
    checkRecord(r).filter((v) => v.code === 'SIGNAL_QUOTE_GROUNDED')

  it('a word changed inside the quote — the misquote this bound exists for', () => {
    const r = groundedTrace()
    const reg = r.signals!.regressions[0]
    const bad = reg.quotes[0].text.replace('dark', 'bright')
    expect(bad).not.toBe(reg.quotes[0].text)
    reg.quotes[0].text = bad
    reg.evidence = bad
    const v = fired(r)
    expect(v).toHaveLength(1)
    expect(v[0].observed).toContain('does not appear in')
    expect(v[0].where).toContain('signals.regressions[0]')
  })

  it('the structured quote drifting from the prose a reader sees', () => {
    const r = groundedTrace()
    // The quote is still perfectly grounded in the prompt. What broke is
    // that the sentence shipped to the buyer no longer contains it, so the
    // two can say different things and only one of them is checked.
    r.signals!.oneShotCorrections[0].text = 'the user asked for less padding'
    const v = fired(r)
    expect(v).toHaveLength(1)
    expect(v[0].observed).toContain('not present in the prose field')
  })

  it('a step that no prompt in the conversation has', () => {
    const r = groundedTrace()
    r.signals!.regressions[0].quotes[0].step = 9999
    expect(fired(r)[0].observed).toMatch(/no prompt at step 9999/)
  })

  it('a conversation id this record does not contain', () => {
    const r = groundedTrace()
    r.signals!.regressions[0].quotes[0].conversationId = 'not-a-conversation'
    expect(fired(r)[0].observed).toMatch(/no conversation not-a-conversation/)
  })

  it('a conversation whose prompts were stripped, so nothing can be re-read', () => {
    const r = groundedTrace()
    delete r.conversations[0].prompts
    // Every quote in the record points at those prompts, so all three fire.
    const v = fired(r)
    expect(v.length).toBe(measure(r).signalQuotes)
    expect(v[0].observed).toContain('carries no prompts[]')
  })

  it('a generation quote whose step disagrees with the generation it addresses', () => {
    const r = groundedTrace()
    const label = resolvedRecord()
    label.signals = deriveSignals(label)
    const q = label.signals!.oneShotCorrections[0].quotes[0]
    q.step = q.step! + 7
    expect(fired(label)[0].observed).toMatch(/turnIndex \d+, the quote claims step \d+/)
    expect(fired(r)).toEqual([])
  })

  it('an emptied quote, which a substring check alone would call grounded', () => {
    const r = groundedTrace()
    r.signals!.regressions[0].quotes[0].text = ''
    expect(fired(r).length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// DESCENT_CHECKED_UNIFORMLY — the twelfth bound, and the only one that is
// about whether a claim was checked rather than about two numbers agreeing.
// The thing it guards is src/corroborate.ts's demotion; the thing it catches
// is that demotion being computed and then not reaching the label.
// ---------------------------------------------------------------------------

describe('the descent verdict behind a mutation label', () => {
  /** a record with one survived_mutated span and no corroborator anywhere */
  function unchecked(): OutcomeRecord {
    const r = resolvedRecord()
    const mutated = r.files[0].spans.filter((s) => s.class === 'survived_mutated')
    expect(mutated.length).toBeGreaterThan(0)
    return r
  }

  it('passes, and reports zero, on a record no corroborator ever saw', () => {
    const r = unchecked()
    // Vacuous, which is exactly why it is also a measurement. The chat
    // path has no repository to ask and this must not read as a failure.
    expect(checkRecord(r)).toEqual([])
    expect(measure(r).descentChecked).toBe(0)
    expect(measure(r).descentDemoted).toBe(0)
  })

  it('fires when a span names the rival that disproves its own descent and keeps the label', () => {
    const r = unchecked()
    const span = r.files[0].spans.find((s) => s.class === 'survived_mutated')!
    span.descent = { basis: 'rival', sha: 'deadbee', subject: 'Sibling branch wrote it', relation: 'sibling' }
    const v = checkRecord(r)
    expect(v.map((x) => x.code)).toContain('DESCENT_CHECKED_UNIFORMLY')
    expect(v[0].observed).toContain('deadbee')
  })

  it('fires when the corroborator reached some spans and not others', () => {
    const r = unchecked()
    const mutated = r.files[0].spans.filter((s) => s.class === 'survived_mutated')
    // One file, one checked span, and at least one mutation label with no
    // verdict at all. A corroborator wired per-file rather than per-record
    // produces exactly this, and the record as a whole looks checked.
    r.files.push({
      path: 'other.md',
      mode: 'prose',
      text: mutated[0].text,
      spans: [{
        start: 0, end: mutated[0].text.length, text: mutated[0].text,
        class: 'survived_mutated', score: 0.9,
        descent: { basis: 'corroborated', rivalsSearched: 3 },
      }],
    })
    const v = checkRecord(r)
    expect(v.map((x) => x.code)).toContain('DESCENT_CHECKED_UNIFORMLY')
    expect(v.find((x) => x.code === 'DESCENT_CHECKED_UNIFORMLY')!.observed)
      .toMatch(/survived_mutated spans carry none/)
  })

  it('passes when every mutation label carries a verdict, including an unverified one', () => {
    const r = unchecked()
    for (const s of r.files[0].spans) {
      if (s.class !== 'survived_mutated') continue
      s.descent = { basis: 'unverified', reason: 'span_too_short' }
    }
    expect(checkRecord(r).map((x) => x.code)).not.toContain('DESCENT_CHECKED_UNIFORMLY')
    const m = measure(r)
    expect(m.descentChecked).toBeGreaterThan(0)
    expect(m.descentUnverified).toBe(m.descentChecked)
  })

  it('counts a demoted span without counting it as a checked mutation label', () => {
    const r = unchecked()
    const span = r.files[0].spans.find((s) => s.class === 'survived_mutated')!
    span.class = 'no_generation_provenance'
    delete span.diff
    delete span.source
    delete span.score
    span.uncertain = true
    span.descent = { basis: 'rival', sha: 'cafe123', subject: 'Other branch', relation: 'sibling' }

    const m = measure(r)
    expect(m.descentDemoted).toBe(1)
    // A demotion is not a checked mutation label. The two counters answer
    // different questions and a buyer reads them differently: one is how
    // much of the correction signal is guarded, the other is how much of
    // it the guard removed.
    expect(m.descentChecked).toBe(0)
    // This record's only mutation label was the demoted one, so there is
    // no unguarded label left and the uniformity clause is silent. The
    // half-wired state is the case above, where one survives.
    expect(checkRecord(r)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// EXCLUSION_NOT_CLASSIFIED — the thirteenth bound, and the file-level twin of
// DESCENT_CHECKED_UNIFORMLY's second clause. There, the demotion is computed
// and does not reach the span. Here, the exclusion is computed and does not
// reach the file, so the record names the commit the content came from and
// sells `survived_verbatim` over its spans anyway.
// ---------------------------------------------------------------------------

describe('a path the record excludes and the figures it left', () => {
  /**
   * The unit record with one exclusion, built THROUGH `resolve()` rather than
   * patched onto a finished record. The patch form was the original shape
   * here and it stopped being usable once `stats.perFile` had to enumerate
   * excluded paths too (PERFILE_ENUMERATES_PATHS): a record with
   * `exclusions` bolted on afterwards is missing the row the resolver would
   * have written, so every assertion below would have been reading a record
   * no run could produce. `patch` defaults to excluding the record's own one
   * classified path, which is the illegal overlap the first test is about.
   */
  function excludedAndClassified(patch: Partial<Exclusion> = {}): OutcomeRecord {
    return resolvedRecord([{
      path: 'notes.md',
      reason: 'imported_whole',
      sha: '96ed4e5',
      subject: 'market: rebase #89\'s landscape onto main',
      relation: 'sibling',
      chars: 199,
      ...patch,
    }])
  }

  it('fires when a path is excluded and classified at the same time', () => {
    const v = checkRecord(excludedAndClassified())
    expect(v.map((x) => x.code)).toContain('EXCLUSION_NOT_CLASSIFIED')
    const fired = v.find((x) => x.code === 'EXCLUSION_NOT_CLASSIFIED')!
    expect(fired.where).toContain('notes.md')
    // Both sides of the bound in the message, which is this module's rule:
    // the exclusion's own evidence and the classification it contradicts.
    expect(fired.observed).toContain('imported_whole')
    expect(fired.observed).toContain('96ed4e5')
    expect(fired.observed).toMatch(/classified spans? over \d+ chars/)
  })

  it('passes when the excluded path is the one path not in files[]', () => {
    expect(checkRecord(excludedAndClassified({ path: 'docs/standards/pm.md' }))).toEqual([])
  })

  it('fires on an exclusion whose number cannot be added back to the figures', () => {
    const r = excludedAndClassified({ path: 'docs/standards/pm.md', chars: 0 })
    const v = checkRecord(r)
    expect(v.map((x) => x.code)).toContain('EXCLUSION_NOT_CLASSIFIED')
    expect(v[0].observed).toContain('chars=0')
    expect(v[0].observed).toContain(`stats.finalChars is ${r.stats.finalChars}`)
  })

  it('fires on an exclusion that names no commit', () => {
    const r = excludedAndClassified({ path: 'docs/standards/pm.md', sha: '' })
    expect(checkRecord(r)[0].observed).toContain('sha=(empty)')
  })

  it('reports the reconciliation, and reports it on a record that excluded nothing', () => {
    // Vacuously clean, which is the case the measurement exists for. A
    // record with no `exclusions` key never asked the question, and a
    // reader who sees only "no violations" cannot tell that from a record
    // that asked and found nothing.
    const clean = resolvedRecord()
    const m0 = measure(clean)
    expect(m0.excludedPaths).toBe(0)
    expect(m0.excludedChars).toBe(0)
    expect(m0.consideredChars).toBe(clean.stats.finalChars)

    const r = excludedAndClassified({ path: 'docs/standards/pm.md', chars: 21_656 })
    const m = measure(r)
    expect(m.excludedPaths).toBe(1)
    expect(m.excludedChars).toBe(21_656)
    // The sum the field exists to make checkable: what the run read is
    // what it classified plus what it refused.
    expect(m.consideredChars).toBe(r.stats.finalChars + 21_656)
  })
})
