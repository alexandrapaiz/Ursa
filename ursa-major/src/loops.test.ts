// Trace-stage detection tests. Two of them run the whole pipeline over the
// public synthetic fixture (fixtures/loops), so what is under test is the
// path a real record takes: parse → resolve → deriveSignals. The rest pin the
// edges that fixture cannot show at once (abandoned, open, terminal
// acceptance, per-conversation step scoping, and the label stage staying
// exactly as it was).

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parsePasteConversation } from './parse'
import { resolve } from './resolve'
import { deriveSignals } from './signals'
import { contentTerms, detectTraceSignals, hasChatTrace, tracePrompts } from './loops'
import type { ConversationMeta, OutcomeRecord, RawGeneration, UserPrompt } from './types'

const FIXTURE = join(__dirname, '..', 'fixtures', 'loops')

function fixtureRecord(): OutcomeRecord {
  const conv = parsePasteConversation(
    readFileSync(join(FIXTURE, 'conversations', '01-claude.md'), 'utf8'),
    '01-claude',
  )
  return resolve({
    taskId: 'fixture-loops',
    files: [{ path: 'final.md', text: readFileSync(join(FIXTURE, 'final.md'), 'utf8') }],
    conversations: [conv.conversation],
    generations: conv.generations,
    finished: true,
  })
}

/** a trace record built straight from prompts and generation texts, no fixture files */
function syntheticRecord(
  convs: Array<{ id: string; prompts: UserPrompt[]; gens: Array<{ turnIndex: number; text: string }> }>,
  finalText: string,
): OutcomeRecord {
  const conversations: ConversationMeta[] = convs.map((c) => ({
    id: c.id,
    title: c.id,
    adapter: 'paste',
    model: 'claude-opus-5',
    turns: c.prompts.length + c.gens.length,
    userTurns: c.prompts.length,
    prompts: c.prompts,
  }))
  const generations: RawGeneration[] = convs.flatMap((c) =>
    c.gens.map((g) => ({
      conversationId: c.id,
      model: 'claude-opus-5',
      turnIndex: g.turnIndex,
      kind: 'assistant_text' as const,
      text: g.text,
    })),
  )
  return resolve({
    taskId: 'synthetic',
    files: [{ path: 'final.md', text: finalText }],
    conversations,
    generations,
    finished: true,
  })
}

describe('prompt typing', () => {
  it('drops structural and cue words from a prompt\'s content terms', () => {
    expect(contentTerms('The constellation is still too dark. Brighten it more!')).toEqual([
      'constellation', 'dark', 'brighten',
    ])
  })

  it('types the opening message as the task ask, an acceptance-only message as acceptance', () => {
    const record = fixtureRecord()
    const roles = tracePrompts(record).map((p) => [p.step, p.role])
    expect(roles).toEqual([
      [0, 'task_ask'],
      [1, 'correction'],
      [2, 'correction'],
      [3, 'correction'],
      [4, 'acceptance'],
      [5, 'correction'],
    ])
  })

  it('knows a trace record from a label-stage one', () => {
    expect(hasChatTrace(fixtureRecord())).toBe(true)
    const label = syntheticRecord([{ id: 'git-abc1234', prompts: [], gens: [{ turnIndex: 1, text: 'x' }] }], 'x')
    expect(hasChatTrace(label)).toBe(false)
  })
})

describe('an opened-then-closed loop (fixture, full pipeline)', () => {
  const signals = deriveSignals(fixtureRecord())

  it('detects exactly one loop and reports its recurrence count', () => {
    expect(signals.correctionLoops).toHaveLength(1)
    const loop = signals.correctionLoops[0]
    expect(loop.id).toBe('01-claude:L1')
    expect(loop.conversationId).toBe('01-claude')
    expect(loop.theme).toContain('constellation')
    expect(loop.openedStep).toBe(1)
    expect(loop.promptSteps).toEqual([1, 2, 3])
    // three statements of one theme = two failures after the first ask
    expect(loop.recurrences).toBe(2)
  })

  it('closes the loop at the generation that survived into the finished work', () => {
    const loop = signals.correctionLoops[0]
    expect(loop.resolvingSteps).toEqual([4])
    expect(loop.closedStep).toBe(4)
    // the user said "Perfect, that works." at step 4, so acceptance is stated, not tacit
    expect(loop.resolution).toBe('accepted')
    expect(loop.targetFiles).toEqual(['final.md'])
    const gen4 = fixtureRecord().generations.find((g) => g.turnIndex === 4)!
    expect(gen4.survivedChars).toBeGreaterThan(0)
  })

  it('quotes the loop\'s spec from a step the reader can look up, and merges nothing', () => {
    const loop = signals.correctionLoops[0]
    expect(loop.discoveredSpec).toContain('step 2')
    expect(loop.discoveredSpec).toContain('Brighten it more')
    // step 1 and step 3 stay addressable rather than being folded into one rule
    expect(loop.discoveredSpec).toMatch(/step 1, 3/)
  })

  it('reports the single stateable correction as one-shot, not as a loop', () => {
    expect(signals.oneShotCorrections).toHaveLength(1)
    expect(signals.oneShotCorrections[0].step).toBe(5)
    expect(signals.oneShotCorrections[0].text).toContain('padding')
    expect(signals.oneShotCorrections[0].domain).toBe('final.md')
  })

  it('counts assistant steps from the trace, not from the generation count', () => {
    expect(signals.episode.steps).toBe(6)
    expect(signals.method).toBe('auto-detected')
    // an acceptance was stated mid-trace, but a correction followed it
    expect(signals.episode.acceptanceStatedInChat).toBe(false)
  })

  it('never infers acceptance of the work from the trace', () => {
    expect(signals.episode.accepted).toBeNull()
    expect(signals.episode.acceptanceBasis).toContain('undeclared')
  })
})

describe('a regression event (fixture, full pipeline)', () => {
  const signals = deriveSignals(fixtureRecord())

  it('reports the step where previously-working state was called broken', () => {
    expect(signals.regressions).toHaveLength(1)
    const reg = signals.regressions[0]
    expect(reg.step).toBe(3)
    expect(reg.conversationId).toBe('01-claude')
    expect(reg.evidence).toContain('went back to dark again')
    expect(reg.brokenState).toContain('step 2')
    // the generation between step 2's complaint and step 3's report
    expect(reg.causedBySteps).toEqual([3])
  })

  it('does not count mere persistence ("still too dark") as a regression', () => {
    expect(signals.regressions.map((r) => r.step)).not.toContain(2)
    expect(signals.correctionLoops[0].regressionSteps).toEqual([3])
  })
})

describe('resolution edges', () => {
  it('calls a loop abandoned when the answering generations were all thrown away', () => {
    const record = syntheticRecord(
      [{
        id: 'c1',
        prompts: [
          { step: 0, text: 'Write the pricing table for the landing page.' },
          { step: 1, text: 'The pricing table columns are misaligned, align the pricing columns.' },
          { step: 2, text: 'The pricing columns are misaligned in the table, fix the alignment.' },
        ],
        gens: [
          { turnIndex: 1, text: 'Here is a first pricing table draft that nobody kept.' },
          { turnIndex: 2, text: 'I aligned the columns with a flex row that nobody kept either.' },
          { turnIndex: 3, text: 'I aligned the columns with a grid that also went nowhere at all.' },
        ],
      }],
      'The pricing section was rewritten by hand and no generated line survives here.\n',
    )
    const signals = deriveSignals(record)
    expect(signals.correctionLoops).toHaveLength(1)
    expect(signals.correctionLoops[0].closedStep).toBeNull()
    expect(signals.correctionLoops[0].resolution).toBe('abandoned')
  })

  it('calls a loop open when nothing answered its last statement', () => {
    const record = syntheticRecord(
      [{
        id: 'c1',
        prompts: [
          { step: 1, text: 'The hero headline is too long, shorten the headline.' },
          { step: 2, text: 'The headline is still too long, shorten the hero headline further.' },
        ],
        gens: [{ turnIndex: 1, text: 'The hero headline is too long, shorten the headline is what I did.' }],
      }],
      'A headline written by hand, with nothing generated behind it at all.\n',
    )
    const signals = deriveSignals(record)
    expect(signals.correctionLoops).toHaveLength(1)
    expect(signals.correctionLoops[0].resolution).toBe('open')
    expect(signals.correctionLoops[0].resolvingSteps).toEqual([])
  })

  it('reports terminal acceptance when the last thing the user says is acceptance', () => {
    const surviving = 'Stars render on their own layer at full opacity so the constellation stays bright.'
    const record = syntheticRecord(
      [{
        id: 'c1',
        prompts: [
          { step: 1, text: 'The constellation is too dark, brighten the constellation stars.' },
          { step: 2, text: 'The constellation is still dark, brighten those stars more.' },
          { step: 3, text: 'Perfect, that works.' },
        ],
        gens: [
          { turnIndex: 1, text: 'I nudged the opacity a little and nothing came of it.' },
          { turnIndex: 2, text: 'I nudged the opacity again and that went nowhere too.' },
          { turnIndex: 3, text: surviving },
        ],
      }],
      surviving + '\n',
    )
    const signals = deriveSignals(record)
    expect(signals.episode.acceptanceStatedInChat).toBe(true)
    expect(signals.correctionLoops[0].resolution).toBe('accepted')
    expect(signals.correctionLoops[0].closedStep).toBe(3)
    // still never a verdict on the work itself
    expect(signals.episode.accepted).toBeNull()
  })

  it('keeps step ordinals scoped per conversation instead of merging two traces', () => {
    const record = syntheticRecord(
      [
        {
          id: 'c1',
          prompts: [
            { step: 1, text: 'The footer spacing is wrong, tighten the footer spacing.' },
            { step: 2, text: 'The footer spacing is wrong again, tighten that spacing.' },
          ],
          gens: [{ turnIndex: 1, text: 'One footer attempt in the first conversation, kept by nobody.' }],
        },
        {
          id: 'c2',
          prompts: [
            { step: 1, text: 'The pricing copy is vague, sharpen the pricing copy.' },
            { step: 2, text: 'The pricing copy reads vague still, sharpen that copy.' },
          ],
          gens: [{ turnIndex: 1, text: 'One pricing attempt in the second conversation, kept by nobody.' }],
        },
      ],
      'Everything visible in this final file was written by the owner by hand.\n',
    )
    const signals = deriveSignals(record)
    expect(signals.correctionLoops.map((l) => l.id)).toEqual(['c1:L1', 'c2:L1'])
    expect(signals.correctionLoops.every((l) => l.promptSteps.length === 2)).toBe(true)
    expect(signals.correctionLoops.map((l) => l.conversationId)).toEqual(['c1', 'c2'])
  })
})

describe('the label stage is untouched', () => {
  it('still reports mutated spans as one-shot corrections and no loops', () => {
    const generated = 'The digest covers thirty one papers this week and leads with the retrieval result.\n'
    const final = 'The digest covers thirty one papers this week, leading with the retrieval result.\n'
    const record = resolve({
      taskId: 'pair',
      files: [{ path: 'digest.md', text: final }],
      conversations: [{
        id: 'git-abc1234', title: 'Generate digest', adapter: 'git',
        model: 'claude', turns: 1, userTurns: 0,
      }],
      generations: [{
        conversationId: 'git-abc1234', model: 'claude', turnIndex: 1,
        kind: 'write', filePath: 'digest.md', text: generated,
      }],
      finished: true,
    })
    const signals = deriveSignals(record)
    expect(signals.correctionLoops).toEqual([])
    expect(signals.regressions).toEqual([])
    expect(signals.oneShotCorrections).toHaveLength(1)
    expect(signals.oneShotCorrections[0].text).toContain('AGENT:')
    expect(signals.oneShotCorrections[0].domain).toBe('digest.md')
    expect(signals.notes?.[0]).toContain('label-stage')
    expect(signals.episode.steps).toBe(1)
  })
})

describe('detectTraceSignals output shape', () => {
  it('leaves the two model-judgment signals empty and says so in the notes', () => {
    const signals = deriveSignals(fixtureRecord())
    expect(signals.feedbackTranslations).toEqual([])
    expect(signals.repairAttempts).toEqual([])
    expect(signals.notes?.join(' ')).toContain('language judgment')
  })

  it('counts a single correction that nothing answered instead of emitting it', () => {
    const record = syntheticRecord(
      [{
        id: 'c1',
        prompts: [
          { step: 0, text: 'Write the about page for the site, three paragraphs.' },
          { step: 1, text: 'Drop the newsletter signup from the footer entirely please.' },
        ],
        gens: [
          { turnIndex: 1, text: 'An about page draft that the owner replaced completely by hand.' },
          { turnIndex: 2, text: 'A paragraph about the newsletter that never reached the final file.' },
        ],
      }],
      'A final file written entirely by hand with no generated line inside it.\n',
    )
    const trace = detectTraceSignals(record)
    expect(trace.oneShotCorrections).toEqual([])
    expect(trace.unresolvedSingleCorrections).toBe(1)
    expect(deriveSignals(record).notes?.join(' ')).toContain('nothing closed them')
  })
})
