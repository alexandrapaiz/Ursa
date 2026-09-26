// The verdict reaches the record (overlay S0, plan §16.7: "tails the
// session log, reads the verdict, WRITES RECORDS WITH IT").
//
// Before this module the bridge read the verdict out of the chat and
// then showed it on a page. The reading never landed anywhere durable,
// so every record on disk still said `undeclared` while the overlay
// displayed `reads as satisfied at step 730`. The label the whole
// product is built to capture was being rendered and dropped.
//
// Two rules govern what follows, both older than this module:
//
//   1. Silence is never acceptance (2026-09-19). A `null` verdict
//      writes nothing at all. It does not "confirm" an undeclared
//      record, and it never clears a verdict already read, because a
//      later session with no stated verdict is not a retraction.
//   2. Existing signals are not overwritten. A record annotated by
//      hand, or by the trace-stage detectors, keeps every loop,
//      regression and correction it carries. Only the `episode` block
//      that holds the declaration is rewritten.

import { deriveSignals, UNDECLARED, type Declaration } from '../signals'
import { listRecordIds, loadRecord, saveRecord } from '../store'
import type { LabSignals, OutcomeRecord } from '../types'
import { NO_VERDICT, type Verdict } from '../verdict'

/** Marks the note this module owns, so re-applying replaces instead of piling up. */
export const VERDICT_NOTE_PREFIX = 'verdict read from chat:'

/**
 * Turn a chat reading into the declaration the record carries. A
 * `null` reading maps to `UNDECLARED` verbatim, which is what makes
 * "no verdict yet" and "never asked" the same state on disk.
 */
export function declarationFromVerdict(verdict: Verdict): Declaration {
  if (verdict.accepted === null) return UNDECLARED
  const where = `read from chat at step ${verdict.step}: "${verdict.quote}"`
  return {
    accepted: verdict.accepted,
    basis: verdict.accepted
      ? `owner-stated satisfied, ${where} (stated tier; the user said it, the system did not infer it)`
      : `owner-stated unsatisfied, ${where}: survived text is not endorsed text, it is not-yet-fixed`,
  }
}

/** What `applyVerdict` did, so the bridge can log it and the page can show it. */
export interface AppliedVerdict {
  /** records whose bytes changed this call; empty when the verdict was already on disk */
  changed: string[]
  /** every record the verdict now applies to, changed or already-current */
  declared: string[]
  declaration: Declaration
}

function declaredSignals(
  record: OutcomeRecord,
  declaration: Declaration,
  verdict: Verdict,
  note: string,
): LabSignals {
  // deriveSignals only when nothing is there: it is the honest default
  // for a record that has no signals yet, and a destructive overwrite
  // for one that does.
  const base = record.signals ?? deriveSignals(record, declaration)
  const notes = (base.notes ?? []).filter((n) => !n.startsWith(VERDICT_NOTE_PREFIX))
  return {
    ...base,
    episode: {
      ...base.episode,
      accepted: declaration.accepted,
      acceptanceStatedInChat: verdict.basis === 'read-from-chat',
      acceptanceBasis: declaration.basis,
    },
    notes: [...notes, note],
  }
}

/**
 * Write the chat-read verdict into every record of a project.
 *
 * The verdict is a property of the session, and a session's work is
 * spread across the records that session produced, so the reading
 * applies to all of them rather than to a guessed subset. Writing is
 * idempotent: a record already carrying this exact declaration is left
 * untouched, which is what lets the bridge call this on every tick.
 */
export function applyVerdict(projectPath: string, verdict: Verdict): AppliedVerdict {
  const declaration = declarationFromVerdict(verdict)
  if (verdict.accepted === null) {
    // Rule 1. Nothing is written, nothing is cleared.
    return { changed: [], declared: [], declaration }
  }
  const note = `${VERDICT_NOTE_PREFIX} the user stated this verdict themselves at step ${verdict.step}; the quote was verified verbatim against the trace, and retention played no part in it`
  const changed: string[] = []
  const declared: string[] = []
  for (const id of listRecordIds(projectPath)) {
    const record = loadRecord(projectPath, id)
    if (!record) continue
    const before = JSON.stringify(record.signals ?? null)
    record.signals = declaredSignals(record, declaration, verdict, note)
    declared.push(id)
    if (JSON.stringify(record.signals) !== before) {
      saveRecord(projectPath, record)
      changed.push(id)
    }
  }
  return { changed, declared, declaration }
}

/** The no-op result, for a bridge tick that has read nothing yet. */
export const NOTHING_APPLIED: AppliedVerdict = {
  changed: [],
  declared: [],
  declaration: declarationFromVerdict(NO_VERDICT),
}
