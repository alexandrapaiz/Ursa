import { describe, expect, it } from 'vitest'
import type { OutcomeRecord } from '../types'
import { buildDistillPrompt, distill, parseDistillOutput } from './distill'
import { emptyTuning, mergeDistill } from './merge'
import { renderTuningBlock } from './export'
import type { DistillOutput } from './types'

const record = (id: string): OutcomeRecord =>
  ({
    schemaVersion: '0.1.0',
    task: { id, finished: true, generatedAt: '2026-09-18T00:00:00Z' },
    files: [],
    conversations: [
      { source: 'fixture', prompts: [{ step: 1, text: 'no explanatory labels please' }] },
    ],
    generations: [],
    stats: {},
    signals: {
      method: 'manual-annotation',
      episode: {
        steps: 10,
        generations: 5,
        accepted: true,
        acceptanceStatedInChat: false,
        acceptanceBasis: 'retention',
      },
      correctionLoops: [
        {
          id: 'A',
          theme: 'labels',
          targetFiles: ['x.tsx'],
          openedStep: 1,
          promptSteps: [1, 3],
          recurrences: 1,
          regressionSteps: [],
          closedStep: 5,
          resolution: 'accepted_tacitly',
          resolvingSteps: [4],
          discoveredSpec: 'no labels on visual elements',
        },
      ],
      feedbackTranslations: [],
      repairAttempts: [],
      regressions: [],
      defensiveGuardrails: [],
      oneShotCorrections: [],
    },
  }) as unknown as OutcomeRecord

const output1: DistillOutput = {
  axioms: [
    {
      statement: 'No explanatory labels on visual elements',
      domain: 'copy',
      polarity: 'avoid',
      basis: 'mixed',
      matchesExisting: null,
      contradicts: [],
      evidence: [{ kind: 'correction-loop', ref: 'A', steps: [1, 3], quote: 'no explanatory labels please' }],
    },
  ],
}

describe('distill parsing', () => {
  it('parses fenced JSON and validates evidence', () => {
    const raw = '```json\n' + JSON.stringify(output1) + '\n```'
    expect(parseDistillOutput(raw).axioms).toHaveLength(1)
  })

  it('rejects axioms without evidence', () => {
    const bad = { axioms: [{ ...output1.axioms[0], evidence: [] }] }
    expect(() => parseDistillOutput(JSON.stringify(bad))).toThrow(/without evidence/)
  })

  it('prompt carries signals, existing axioms and revocations', () => {
    const tuning = emptyTuning('t')
    tuning.axioms.push({
      id: 'ax-001',
      statement: 'old rule',
      domain: 'copy',
      polarity: 'avoid',
      basis: 'tacit',
      evidenceCount: 1,
      evidence: [],
      contradicts: [],
      firstSeen: 'x',
      lastSeen: 'x',
      status: 'revoked',
    })
    const p = buildDistillPrompt(record('r1'), tuning)
    expect(p).toContain('discoveredSpec')
    expect(p).toContain('do not resurrect')
    expect(p).toContain('old rule')
  })
})

describe('merge', () => {
  it('creates new axioms with evidence-count confidence', () => {
    const t = mergeDistill(emptyTuning('t'), output1, record('r1'), 'sonnet')
    expect(t.axioms).toHaveLength(1)
    expect(t.axioms[0].id).toBe('ax-001')
    expect(t.axioms[0].evidenceCount).toBe(1)
    expect(t.axioms[0].evidence[0].recordId).toBe('r1')
    expect(t.sources).toHaveLength(1)
  })

  it('reinforces matched axioms instead of duplicating', () => {
    const t1 = mergeDistill(emptyTuning('t'), output1, record('r1'), 'sonnet')
    const output2: DistillOutput = {
      axioms: [{ ...output1.axioms[0], matchesExisting: 'ax-001' }],
    }
    const t2 = mergeDistill(t1, output2, record('r2'), 'sonnet')
    expect(t2.axioms).toHaveLength(1)
    expect(t2.axioms[0].evidenceCount).toBe(2)
    expect(t2.axioms[0].evidence.map((e) => e.recordId)).toEqual(['r1', 'r2'])
  })

  it('revoked axioms stay revoked and gain nothing', () => {
    const t1 = mergeDistill(emptyTuning('t'), output1, record('r1'), 'sonnet')
    t1.axioms[0].status = 'revoked'
    const output2: DistillOutput = {
      axioms: [{ ...output1.axioms[0], matchesExisting: 'ax-001' }],
    }
    const t2 = mergeDistill(t1, output2, record('r2'), 'sonnet')
    expect(t2.axioms).toHaveLength(1)
    expect(t2.axioms[0].evidenceCount).toBe(1)
  })

  it('wires contradictions symmetrically across same-run axioms', () => {
    const conflicted: DistillOutput = {
      axioms: [
        { ...output1.axioms[0], statement: 'A rule', contradicts: ['B rule'] },
        { ...output1.axioms[0], statement: 'B rule', contradicts: ['A rule'] },
      ],
    }
    const t = mergeDistill(emptyTuning('t'), conflicted, record('r1'), 'sonnet')
    expect(t.axioms[0].contradicts).toEqual(['ax-002'])
    expect(t.axioms[1].contradicts).toEqual(['ax-001'])
  })

  it('rejects unknown matchesExisting ids', () => {
    const bad: DistillOutput = {
      axioms: [{ ...output1.axioms[0], matchesExisting: 'ax-999' }],
    }
    expect(() => mergeDistill(emptyTuning('t'), bad, record('r1'), 'sonnet')).toThrow(/unknown axiom/)
  })
})

describe('export', () => {
  it('renders domains, confidence and tensions; hides revoked', () => {
    const conflicted: DistillOutput = {
      axioms: [
        { ...output1.axioms[0], statement: 'Sparse copy', contradicts: ['Rich copy'] },
        { ...output1.axioms[0], statement: 'Rich copy', polarity: 'prefer', contradicts: ['Sparse copy'] },
      ],
    }
    const t = mergeDistill(emptyTuning('t'), conflicted, record('r1'), 'sonnet')
    t.axioms.push({ ...t.axioms[0], id: 'ax-009', statement: 'gone', status: 'revoked' })
    const md = renderTuningBlock(t)
    expect(md).toContain('## copy')
    expect(md).toContain('Avoid: Sparse copy (mixed, x1)')
    expect(md).toContain('## Tensions')
    expect(md).not.toContain('gone')
  })
})

describe('distill with injected runner', () => {
  it('runs end to end without the real CLI', () => {
    const runner = () => JSON.stringify(output1)
    const out = distill(record('r1'), emptyTuning('t'), 'sonnet', runner)
    expect(out.axioms).toHaveLength(1)
  })
})
