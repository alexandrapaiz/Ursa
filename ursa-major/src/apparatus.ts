// What produced a generation, as distinct from WHO produced it.
//
// WHY THIS MODULE EXISTS. `SourcePointer` (src/types.ts) answers "whose
// text is this" with a `model` field, and the record's whole commercial
// claim rests on cross-model comparison: CLAUDE.md §4 sells "what did the
// same user prefer between your model and your competitor's" as one of
// three properties nobody else can offer. A comparison like that is only
// a model comparison if everything else about the generation was equal,
// and the thing most likely not to have been equal is the apparatus: the
// client that made the call and the output limit it set.
//
// WHAT THAT COSTS, MEASURED BY SOMEONE ELSE. Ursa's research seat read
// arXiv 2610.00253 on 2026-10-24: over 6,324 stored responses from five
// deployed endpoints, changing the harness in one arm drove attribution
// of one system's answers to 0 of 120, and 83.1% of one endpoint's
// answers in one domain ended mid-sentence under a 1,024-token cap. That
// is a published measurement of an apparatus difference swamping the
// model difference it was mistaken for. It is evidence and not an
// instruction; the decision to act on it is recorded in
// docs/design/apparatus-provenance.md.
//
// WHY A FIELD AND NOT A NOTE. A schema field added after collection is
// null for everything collected before it, and null is indistinguishable
// from "asked and nothing was there". Today every generation this build
// resolves arrives through one client, so nothing is actually being
// confounded yet and this is not a live bug. The moment a second client
// lands, every record already on disk becomes unclassifiable, and no
// later edit can fix it because the apparatus was never written down.
// So the field goes in while the answer is still knowable.
//
// WHERE IT DOES NOT GO. Not on `SourcePointer`. A SourcePointer is a
// pointer to a character range, and there are many per generation:
// `fixtures/real/ursa-main-4d5e401.json`, the only real-history fixture
// in the tree, holds 19 of them over 1 generation. Stamping a
// per-generation constant onto each of 19 pointers creates 19 copies that
// can disagree with nothing in the record able to adjudicate between
// them. The apparatus is a property of the call that produced the text,
// so it lives on the generation, beside the `model` it qualifies.

import type { SegmentMode } from './types'

/**
 * How the apparatus below was come by. This is the load-bearing field,
 * and the three cases are three different claims, not three grades of
 * confidence.
 *
 * The distinction this type exists to protect is the one the rest of
 * this record already protects for `resolvedBy`, `gatedBy` and
 * `pairedBy` (src/types.ts): absent is a real claim and never a
 * placeholder. Without `unobservable`, a git-path generation would carry
 * `maxOutputTokens: undefined` — the same bytes a transcript-path
 * generation carries when the transcript genuinely recorded no cap. One
 * of those says "no limit was in force" and the other says "this ingest
 * path cannot see a limit, and never could." A lab buying cross-model
 * comparison needs to drop the second from its denominator and keep the
 * first.
 */
export type ApparatusObservability =
  /**
   * Read out of the generation's own source record. The transcript line
   * said which model, which client, and how the generation stopped, and
   * those values are reproduced here unmodified.
   */
  | 'observed'
  /**
   * A human or a config told us, and nothing verified it. The paste
   * adapter's frontmatter `model:` is this: a person typed a model name
   * above a transcript they copied out of a web UI.
   */
  | 'declared'
  /**
   * This ingest path structurally cannot see the apparatus, so no future
   * run over the same input will do better. `reason` says which path and
   * why. This is the honest value for everything the git launches
   * resolve, and writing it down is the whole point of the type.
   */
  | 'unobservable'

/**
 * Why an apparatus is `unobservable`, named by the mechanism rather than
 * graded. Each value is a fact about an ingest path, checkable by reading
 * that path's code.
 */
export type UnobservableReason =
  /**
   * The git launches (`ursa run`, `ursa ci`) rebuild a "generation" from
   * the whole blob of a touched file at the agent's commit
   * (src/resolve-episode.ts). A commit carries no model call: there is no
   * client in it, no output limit, and no stop reason. Note that this
   * also makes the mid-sentence footprint from arXiv 2610.00253
   * undetectable here, because a file blob ends where the file ends
   * whatever the cap was.
   */
  | 'git-blob-generation'
  /**
   * The source transcript was a model call, but the fields naming the
   * apparatus were missing from it. A transcript format that never wrote
   * `stop_reason` cannot be made to have written it.
   */
  | 'transcript-field-absent'

/** How a generation stopped, which is how a cap announces itself. */
export type StopReason =
  /** the model finished its turn on its own */
  | 'end_turn'
  /** the output limit cut the generation off mid-production — the arXiv 2610.00253 case */
  | 'max_tokens'
  /** a stop sequence fired */
  | 'stop_sequence'
  /** the model called a tool and the turn ended there */
  | 'tool_use'
  /** the source named a stop reason this build does not model; the raw string is kept in `rawStopReason` */
  | 'other'

/**
 * The apparatus behind one generation: the client that made the call and
 * the limit it imposed, with the provenance of both.
 *
 * Read `observability` before any other field. On `'unobservable'` every
 * other field is absent by construction and absence carries no
 * information about the call.
 */
export interface Apparatus {
  observability: ApparatusObservability
  /** set only when `observability` is `'unobservable'`; absent otherwise */
  reason?: UnobservableReason
  /**
   * The program that made the model call, as it names itself, with its
   * version when the source gives one: `claude-code/1.0.58`. Never a
   * category like "CLI" — the point is to tell two clients apart, and a
   * category cannot.
   */
  client?: string
  /**
   * The output cap in force for this call, in tokens, as the source
   * stated it. Absent under `'observed'` is a real claim: the transcript
   * recorded the call and no cap was set on it.
   */
  maxOutputTokens?: number
  /** tokens the call actually produced, when the source counted them */
  outputTokens?: number
  stopReason?: StopReason
  /** the source's own stop-reason string, kept whenever it did not map onto `StopReason` */
  rawStopReason?: string
}

/**
 * The apparatus value for an ingest path that cannot see one.
 *
 * Call this instead of leaving `apparatus` undefined. Undefined on a
 * generation means "written by a build older than this module", which is
 * a claim about Ursa; `unobservable` means "this path never could", which
 * is a claim about the data. Collapsing them loses the second.
 */
export function unobservableApparatus(reason: UnobservableReason): Apparatus {
  return { observability: 'unobservable', reason }
}

/**
 * Did the output cap cut this generation off?
 *
 * True only on an `'observed'` apparatus whose stop reason was the cap.
 * A `'declared'` or `'unobservable'` apparatus returns false, because
 * neither ever carries a stop reason and "we did not see a truncation"
 * must not read as "there was none". Use `truncationUnknown` to tell the
 * two falses apart.
 */
export function wasTruncatedByCap(a: Apparatus | undefined): boolean {
  return a?.observability === 'observed' && a.stopReason === 'max_tokens'
}

/** True when nothing in the record can say whether the cap cut this generation off. */
export function truncationUnknown(a: Apparatus | undefined): boolean {
  return !a || a.observability !== 'observed' || a.stopReason === undefined
}

const STOP_REASONS = new Set<string>(['end_turn', 'max_tokens', 'stop_sequence', 'tool_use'])

/**
 * Normalize a source's stop-reason string onto `StopReason`, keeping the
 * original when it does not map.
 *
 * The raw string is kept rather than discarded because an unmapped value
 * is how a client tells us it has a stopping mode this build has never
 * seen, and that is exactly the apparatus difference the record is here
 * to expose. Throwing it away would turn a new client's novel behaviour
 * into `'other'` and lose the evidence that it was novel.
 */
export function normalizeStopReason(raw: unknown): { stopReason?: StopReason; rawStopReason?: string } {
  if (typeof raw !== 'string' || raw.length === 0) return {}
  if (STOP_REASONS.has(raw)) return { stopReason: raw as StopReason }
  return { stopReason: 'other', rawStopReason: raw }
}

/**
 * Build the apparatus for one generation out of a Claude Code transcript
 * line's assistant message.
 *
 * `msg` is the parsed `message` object of a `type: "assistant"` line in
 * `~/.claude/projects/**.jsonl`; `clientVersion` is the line's own
 * `version` field, which is the CLI's version and not the model's.
 *
 * Returns `'observed'` when the line carried at least one apparatus fact,
 * and `'unobservable'` with `'transcript-field-absent'` when it carried
 * none. The second case is not hypothetical: these transcripts are
 * written by a program that changes, and a line from an older build can
 * lack `usage` entirely.
 */
export function apparatusFromClaudeSession(msg: unknown, clientVersion?: unknown): Apparatus {
  const m = (msg ?? {}) as Record<string, unknown>
  const usage = (m.usage ?? {}) as Record<string, unknown>
  const { stopReason, rawStopReason } = normalizeStopReason(m.stop_reason)
  const outputTokens = typeof usage.output_tokens === 'number' ? usage.output_tokens : undefined
  const maxOutputTokens = typeof m.max_tokens === 'number' ? m.max_tokens : undefined
  const client =
    typeof clientVersion === 'string' && clientVersion.length > 0
      ? `claude-code/${clientVersion}`
      : 'claude-code'
  if (stopReason === undefined && outputTokens === undefined && maxOutputTokens === undefined) {
    return unobservableApparatus('transcript-field-absent')
  }
  const a: Apparatus = { observability: 'observed', client }
  if (maxOutputTokens !== undefined) a.maxOutputTokens = maxOutputTokens
  if (outputTokens !== undefined) a.outputTokens = outputTokens
  if (stopReason !== undefined) a.stopReason = stopReason
  if (rawStopReason !== undefined) a.rawStopReason = rawStopReason
  return a
}

/**
 * The apparatus for a hand-pasted transcript.
 *
 * Always `'declared'`, never `'observed'`, even though the paste
 * adapter's frontmatter can name a model: a person typing `model: gpt-5`
 * above text they copied out of a web UI has told us a model and told us
 * nothing about the cap that UI had set. `client` carries what they said
 * the source was, so a reader can see it was hearsay rather than reading
 * a bare string and assuming it was read off the call.
 */
export function declaredApparatus(source?: string): Apparatus {
  const a: Apparatus = { observability: 'declared' }
  if (source) a.client = source
  return a
}

/**
 * Does this text end without a terminal mark, the footprint arXiv
 * 2610.00253 counted when it found 83.1% of one endpoint's answers
 * ending mid-sentence?
 *
 * EXPORTED WITH A WARNING, AND NOT WIRED INTO THE RESOLVER. This is a
 * heuristic over prose and it is only meaningful when the text it reads
 * is one model response. On the git launches it is actively misleading,
 * because a generation there is a whole file blob
 * (`'git-blob-generation'` above) and a source file legitimately ends
 * without a full stop. That is why no caller in `src/` applies this to a
 * generation: `wasTruncatedByCap` reads the stop reason, which is a fact,
 * and this function exists for a transcript path that has text but no
 * `stop_reason` to read. `mode` is `'code'` for paths where the test
 * does not apply at all and the answer is always false.
 */
export function endsMidSentence(text: string, mode: SegmentMode): boolean {
  if (mode === 'code') return false
  const trimmed = text.trimEnd()
  if (trimmed.length === 0) return false
  return !/[.!?:;,)\]"'`*_>-]$/.test(trimmed)
}
