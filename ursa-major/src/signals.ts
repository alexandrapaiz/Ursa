// Signal derivation, v0: the label-stage case. A commit-pair record
// has no chat trace, so no loops or regressions are observable; what
// it does carry is each mutated span — the user's edit of agent text,
// a correction expressed once, at the label end of the funnel. Those
// become one-shot corrections, and retention through the merged commit
// is the acceptance basis. Trace-stage loop/regression detection is
// the resolver v2 track and lands here when it ships.

import type { LabSignals, OneShotCorrection, OutcomeRecord } from './types'

const MAX_EXCERPT = 220

function excerpt(text: string): string {
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length > MAX_EXCERPT ? t.slice(0, MAX_EXCERPT) + '…' : t
}

export function deriveSignals(record: OutcomeRecord): LabSignals {
  const oneShotCorrections: OneShotCorrection[] = []
  for (const file of record.files) {
    for (const span of file.spans) {
      if (span.class !== 'survived_mutated' || !span.diff || !span.source) continue
      const agent = span.diff.filter((p) => !p.added).map((p) => p.value).join('')
      const hers = span.diff.filter((p) => !p.removed).map((p) => p.value).join('')
      if (!agent.trim() || !hers.trim()) continue
      oneShotCorrections.push({
        step: span.source.turnIndex,
        text: `AGENT: ${excerpt(agent)}\nFINAL: ${excerpt(hers)}`,
        domain: file.path,
      })
    }
  }
  return {
    method: 'auto-detected',
    annotatedAt: new Date().toISOString(),
    episode: {
      steps: record.generations.length,
      generations: record.generations.length,
      accepted: record.task.finished,
      acceptanceStatedInChat: false,
      acceptanceBasis: 'retention: the edited state was committed and kept',
    },
    correctionLoops: [],
    feedbackTranslations: [],
    repairAttempts: [],
    regressions: [],
    defensiveGuardrails: [],
    oneShotCorrections,
    notes: [
      'label-stage record (git commit pair): corrections appear once, as edits;',
      'recurrence and loops are unobservable without the chat trace.',
    ],
  }
}
