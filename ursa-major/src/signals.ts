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
      const gen = record.generations[span.source.generationIndex]
      if (!gen) continue
      // Both sides are read from where the record already stores them: the
      // generation's own extent and the span's own text. Neither is rebuilt
      // from `span.diff`.
      //
      // Rebuilding is what this did until 2026-10-06, and the quote-grounding
      // bound caught it the first time it ran on a label-stage record.
      // `diffWords` tokenizes on whitespace and does not promise that
      // joining the non-added parts reproduces the old string byte for byte:
      // on "No single observer holds it whole, and a central grader pretends
      // otherwise." it returned "holds it whole , and", with a space before
      // the comma that the agent never wrote. So the single most-produced
      // quote in the product — `oneShotCorrections[].text` is the only signal
      // `ursa run` emits on a repo — was a reconstruction being sold as a
      // verbatim quote. The extents are right there in the record and are
      // what every other part of it is addressed by.
      const agent = gen.text.slice(span.source.start, span.source.end)
      const hers = span.text
      if (!agent.trim() || !hers.trim()) continue
      // Two quotes, not one. The agent side is grounded in
      // generations[gi].text; the final side is grounded in the finished
      // file. Addressing them separately is what lets the gate re-read each
      // one — a single blob labelled "the correction" is a string nobody can
      // check.
      const agentQuote = excerpt(agent)
      const finalQuote = excerpt(hers)
      out.push({
        step: span.source.turnIndex,
        text: `AGENT: ${agentQuote}\nFINAL: ${finalQuote}`,
        domain: file.path,
        quotes: [
          {
            of: 'generation',
            conversationId: span.source.conversationId,
            step: span.source.turnIndex,
            generationIndex: span.source.generationIndex,
            text: agentQuote,
          },
          { of: 'final_span', filePath: file.path, text: finalQuote },
        ],
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
