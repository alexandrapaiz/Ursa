// Synthetic HQ store used by hq.test.ts and by the `brief` walkthrough in
// docs/design/hq-briefing.md. Synthetic on purpose: the real trial data
// (task-001) lives in the private repo alexandrapaiz/ursa-private, and
// nothing here needs it. Paths are the ones a small Next.js site would
// actually have, so the retrieval behaviour under test is the behaviour
// a real project sees.

import type { LabSignals, OutcomeRecord, Stats } from '../types'
import type { TuningRecord } from '../tuning/types'

/** A structurally complete, all-zero Stats. The briefing never reads
 *  stats — it reads axioms, loops and file paths — but the record type
 *  is the record type, so the fixture satisfies it honestly rather than
 *  through a cast. */
export function zeroStats(): Stats {
  const byClass = {
    survived_verbatim: { spans: 0, chars: 0, pct: 0 },
    survived_mutated: { spans: 0, chars: 0, pct: 0 },
    no_generation_provenance: { spans: 0, chars: 0, pct: 0 },
  }
  return {
    finalChars: 0,
    coveredChars: 0,
    byClass,
    uncertainSpans: 0,
    trivialSpans: 0,
    byModel: {},
    generated: { totalChars: 0, survivedChars: 0, deletedChars: 0, deletedPct: 0 },
    perFile: [],
    perConversation: [],
  }
}

export function emptySignals(): LabSignals {
  return {
    method: 'manual-annotation',
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
  }
}

export function makeRecord(
  id: string,
  filePaths: string[],
  signals: Partial<LabSignals> = {}
): OutcomeRecord {
  return {
    schemaVersion: '0.1.0',
    task: { id, finished: true, generatedAt: '2026-09-26T00:00:00.000Z' },
    files: filePaths.map((path) => ({ path, mode: 'code' as const, text: '', spans: [] })),
    conversations: [],
    generations: [],
    stats: zeroStats(),
    signals: { ...emptySignals(), ...signals },
  }
}

/** Two records: a hero-section run whose loop was fought over
 *  src/app/page.tsx, and a copy run on src/content/about.md. */
export const RECORDS: OutcomeRecord[] = [
  makeRecord('rec-site-001', ['src/app/page.tsx', 'src/app/globals.css'], {
    correctionLoops: [
      {
        id: 'loop-a',
        theme: 'hero animation reads as a page crash',
        targetFiles: ['src/app/page.tsx'],
        openedStep: 12,
        promptSteps: [12, 18, 24, 31],
        recurrences: 3,
        regressionSteps: [],
        closedStep: 34,
        resolution: 'accepted',
        resolvingSteps: [33],
        discoveredSpec:
          'entrance motion may reposition an element by at most 8px; anything larger reads as breakage, not polish',
      },
      {
        id: 'loop-b',
        theme: 'contrast on the dark section',
        targetFiles: ['src/app/globals.css'],
        openedStep: 40,
        promptSteps: [40, 44],
        recurrences: 1,
        regressionSteps: [],
        closedStep: 46,
        resolution: 'accepted_tacitly',
        resolvingSteps: [45],
        discoveredSpec: 'body text on the dark section holds at least 7:1 against its background',
      },
    ],
    feedbackTranslations: [
      {
        loopId: 'loop-a',
        complaint: 'it looks like the page is crashing',
        complaintStep: 12,
        mechanism: 'a 64px translateY entrance on the hero, fired after paint',
        resolvedBySteps: [33],
      },
    ],
  }),
  makeRecord('rec-copy-002', ['src/content/about.md'], {
    correctionLoops: [
      {
        id: 'loop-c',
        theme: 'about page copy oversells',
        targetFiles: ['src/content/about.md'],
        openedStep: 5,
        promptSteps: [5, 9],
        recurrences: 1,
        regressionSteps: [],
        closedStep: 11,
        resolution: 'accepted',
        resolvingSteps: [10],
        discoveredSpec: 'claims name the mechanism or get cut; no adjective survives without one',
      },
    ],
  }),
]

/** Four axioms: one on motion learned inside loop-a, one on contrast, one
 *  on copy, one revoked. The motion axiom also carries the guardrail the
 *  owner stated after an agent rewrote files it was not asked to touch. */
export const TUNING: TuningRecord = {
  schemaVersion: '0.1.0',
  owner: 'local',
  updatedAt: '2026-09-26T00:00:00.000Z',
  sources: [
    { recordId: 'rec-site-001', distilledAt: '2026-09-26T00:00:00.000Z', method: 'rlaif-claude', model: 'sonnet' },
    { recordId: 'rec-copy-002', distilledAt: '2026-09-26T00:00:00.000Z', method: 'rlaif-claude', model: 'sonnet' },
  ],
  axioms: [
    {
      id: 'ax-001',
      statement: 'keep entrance motion under 8px of travel',
      domain: 'motion',
      polarity: 'prefer',
      basis: 'mixed',
      evidenceCount: 2,
      evidence: [
        {
          recordId: 'rec-site-001',
          kind: 'correction-loop',
          ref: 'loop-a',
          steps: [12, 18, 24, 31],
          quote: 'it looks like the page is crashing',
        },
        {
          recordId: 'rec-site-001',
          kind: 'defensive-guardrail',
          ref: '27',
          steps: [27],
          quote: 'only touch the hero, do not restyle the rest of the page',
        },
      ],
      contradicts: [],
      firstSeen: '2026-09-26T00:00:00.000Z',
      lastSeen: '2026-09-26T00:00:00.000Z',
      status: 'active',
    },
    {
      id: 'ax-002',
      statement: 'body text holds 7:1 contrast on dark sections',
      domain: 'color',
      polarity: 'prefer',
      basis: 'tacit',
      evidenceCount: 1,
      evidence: [{ recordId: 'rec-site-001', kind: 'correction-loop', ref: 'loop-b', steps: [40, 44] }],
      contradicts: [],
      firstSeen: '2026-09-26T00:00:00.000Z',
      lastSeen: '2026-09-26T00:00:00.000Z',
      status: 'active',
    },
    {
      id: 'ax-003',
      statement: 'every claim names its mechanism',
      domain: 'copy',
      polarity: 'prefer',
      basis: 'stated',
      evidenceCount: 5,
      evidence: [
        { recordId: 'rec-copy-002', kind: 'correction-loop', ref: 'loop-c', steps: [5, 9], quote: 'say how, not how great' },
      ],
      contradicts: [],
      firstSeen: '2026-09-26T00:00:00.000Z',
      lastSeen: '2026-09-26T00:00:00.000Z',
      status: 'active',
    },
    {
      id: 'ax-004',
      statement: 'open every section with a one-line summary',
      domain: 'copy',
      polarity: 'prefer',
      basis: 'stated',
      evidenceCount: 9,
      evidence: [{ recordId: 'rec-copy-002', kind: 'episode', ref: '1', steps: [1] }],
      contradicts: [],
      firstSeen: '2026-09-26T00:00:00.000Z',
      lastSeen: '2026-09-26T00:00:00.000Z',
      status: 'revoked',
    },
  ],
}
