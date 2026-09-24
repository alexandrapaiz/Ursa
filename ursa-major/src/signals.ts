// Signal derivation. One entry point, two stages, decided by whether the
// record carries a chat trace (`conversations[].prompts[]`):
//
//   Label stage — a git commit pair (`ursa run`). No trace exists, so no
//   recurrence is observable: what the record does carry is each mutated
//   span, the user's edit of agent text, a correction expressed once at the
//   label end of the funnel. Those become one-shot corrections.
//
//   Trace stage — a Claude Code session or a pasted conversation. The user's
//   own messages are present and ordered, so correction loops, regressions
//   and one-shot corrections are detected in loops.ts and carried through
//   here. This is what shipped for sprint-2026-09-21 item 1 (O1 KR1.2);
//   `method` stays 'auto-detected' in both stages because no hand annotation
//   is involved in either.
//
// Still owed, and deliberately empty in both stages: feedbackTranslations,
// repairAttempts and defensiveGuardrails. Each needs a judgment about what a
// complaint MEANT, which is the distiller's job (a model over this output),
// not the detector's. See loops.ts's header for why.
//
// What this module never does: infer acceptance. `episode.accepted` comes
// only from the owner's declaration passed in below. A trace can show an
// acceptance cue in chat, and that sets `acceptanceStatedInChat`, which is an
// observation about the conversation and never a verdict on the work.

import { detectTraceSignals, hasChatTrace } from './loops'
import { excerpt } from './text'
import type { LabSignals, OneShotCorrection, OutcomeRecord } from './types'

export interface Declaration {
  /** the owner's own verdict on the artifact's current state; null = never asked */
  accepted: boolean | null
  basis: string
}

export const UNDECLARED: Declaration = {
  accepted: null,
  basis: 'undeclared: no owner declaration surface was offered; retention is NOT acceptance',
}

/** label-stage corrections: every span the user kept but edited */
function mutationCorrections(record: OutcomeRecord): OneShotCorrection[] {
  const out: OneShotCorrection[] = []
  for (const file of record.files) {
    for (const span of file.spans) {
      if (span.class !== 'survived_mutated' || !span.diff || !span.source) continue
      const agent = span.diff.filter((p) => !p.added).map((p) => p.value).join('')
      const hers = span.diff.filter((p) => !p.removed).map((p) => p.value).join('')
      if (!agent.trim() || !hers.trim()) continue
      out.push({
        step: span.source.turnIndex,
        text: `AGENT: ${excerpt(agent)}\nFINAL: ${excerpt(hers)}`,
        domain: file.path,
      })
    }
  }
  return out
}

export function deriveSignals(record: OutcomeRecord, declaration: Declaration = UNDECLARED): LabSignals {
  const base: LabSignals = {
    method: 'auto-detected',
    annotatedAt: new Date().toISOString(),
    episode: {
      steps: record.generations.length,
      generations: record.generations.length,
      accepted: declaration.accepted,
      acceptanceStatedInChat: false,
      acceptanceBasis: declaration.basis,
    },
    correctionLoops: [],
    feedbackTranslations: [],
    repairAttempts: [],
    regressions: [],
    defensiveGuardrails: [],
    oneShotCorrections: [],
    notes: [],
  }

  if (!hasChatTrace(record)) {
    return {
      ...base,
      oneShotCorrections: mutationCorrections(record),
      notes: [
        'label-stage record (git commit pair): corrections appear once, as edits;',
        'recurrence and loops are unobservable without the chat trace.',
      ],
    }
  }

  const trace = detectTraceSignals(record)
  return {
    ...base,
    episode: {
      ...base.episode,
      steps: trace.steps,
      acceptanceStatedInChat: trace.acceptanceStatedInChat,
    },
    correctionLoops: trace.loops,
    regressions: trace.regressions,
    oneShotCorrections: trace.oneShotCorrections,
    notes: trace.notes,
  }
}
