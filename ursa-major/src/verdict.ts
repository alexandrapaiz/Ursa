// The verdict reader (plan §16.3). One tier only, by owner revision
// 2026-09-20: **stated**. It recognizes a verdict the user actually
// said, in either direction, and nothing else. There is no inferred
// tier; the owner would rather teach the user to reward the model and
// state satisfaction than have the system guess it. Silence is
// `undeclared`, displayed as such, never converted to acceptance by
// retention (the 2026-09-19 rule).
//
// Runs on the bridge, on the owner's machine, on her subscription,
// via the same `claude -p` runner shape the distiller uses.
//
// Verification, revised 2026-09-27 after the reader was measured for the
// first time against fixtures/verdicts/cases.json (harness:
// src/evals/verdict.ts, report: `npx tsx src/evals/cli.ts verdict`).
// Two defects the corpus found, both now closed:
//
//   1. Two false satisfied readings. A quote was accepted on verbatim
//      presence alone, so a model that returned `accepted: true` quoting
//      the word "continue", or the single letter "s", produced a label
//      the user never gave. Closed by the substance guards below,
//      MIN_QUOTE_CHARS and NEUTRAL_ACKS, which can only ever discard.
//   2. One lost label. Presence was tested against the raw message
//      while the model was shown a newline-flattened one, so a verdict
//      written across two lines came back as a hallucination and the
//      session went undeclared. Closed by verifying against shownText,
//      the exact string the model saw, and recovering the verbatim span
//      from the original text afterwards.
//
// Still open and measured, not hidden: a verdict sitting past
// TRANSCRIPT_CHAR_LIMIT inside one long message is never shown to the
// model at all (cases.json, v16; counted as knownMiss).

import { execFileSync } from 'node:child_process'
import type { UserPrompt } from './types'

export interface Verdict {
  accepted: boolean | null
  /** the prompt step that carried it (UserPrompt.step) */
  step: number | null
  /** the owner's words, verbatim, as read from the trace */
  quote: string | null
  basis: 'read-from-chat' | 'undeclared'
  /** always 'stated' — the only tier that exists */
  confidence: 'stated'
}

export const NO_VERDICT: Verdict = {
  accepted: null,
  step: null,
  quote: null,
  basis: 'undeclared',
  confidence: 'stated',
}

export interface VerdictRunner {
  (prompt: string, model: string): string
}

/** Default runner: Claude Code CLI, print mode, local machine. */
export const claudeVerdictRunner: VerdictRunner = (prompt, model) => {
  const out = execFileSync('claude', ['-p', '--model', model, '--output-format', 'json'], {
    input: prompt,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    timeout: 120_000,
  })
  const envelope = JSON.parse(out) as { result?: string; is_error?: boolean }
  if (envelope.is_error || typeof envelope.result !== 'string') {
    throw new Error('claude -p returned an error envelope')
  }
  return envelope.result
}

const INSTRUCTION = `You are reading the user's own messages from a working session with an AI coding agent. Your only job: find whether the user STATED a verdict on the work, in their own words.

A stated verdict is an expression of satisfaction or dissatisfaction with the work itself, written by the user. Examples that count: "yesss finallyyy!!", "i love it", "perfect, thank you", "this is wrong", "i'm unhappy with the prose", "i was dissatisfied with that product". Things that do NOT count: instructions ("change the color"), questions, neutral acknowledgements ("ok", "continue", "done"), politeness ("thanks" alone with no evaluation), or anything you would have to infer from behavior rather than read from words. If the user corrected the work without evaluating it, that is not a verdict.

If several verdicts exist, report the LAST one: the most recent stated verdict governs.

Reply with ONLY a JSON object, no fences, no prose:
{"accepted": true | false | null, "step": <the step number of the message that carried it> | null, "quote": "<the user's exact words, a short verbatim excerpt from that message>" | null}

accepted=null means: no stated verdict exists in these messages. When accepted is null, step and quote are null. Never guess. A session with no stated verdict is a normal, honest outcome.`

/** How much of one user message the model is shown. A verdict past this
 *  offset inside a single message is structurally unreachable; the
 *  corpus measures that as `knownMiss` rather than hiding it
 *  (fixtures/verdicts/cases.json, v16-verdict-past-the-transcript-limit). */
export const TRANSCRIPT_CHAR_LIMIT = 2000

/**
 * The exact string the model is shown for one prompt. Newlines are
 * flattened so each message is one transcript line, and the message is
 * truncated at TRANSCRIPT_CHAR_LIMIT. Both substitutions preserve
 * character offsets one-for-one, so an index into this view is a valid
 * index into `p.text` and the verbatim span can be recovered from the
 * original. Verification reads this view and NOT `p.text`: a quote the
 * model returns can only ever come from what the model could see.
 */
export function shownText(p: UserPrompt): string {
  return p.text.replace(/[\r\n]/g, ' ').slice(0, TRANSCRIPT_CHAR_LIMIT)
}

/** A quote shorter than this cannot carry a stated verdict, and is
 *  present in almost any trace by accident. Discard-only guard. */
export const MIN_QUOTE_CHARS = 4

/**
 * Messages the reader refuses to treat as a verdict even when the model
 * returns one of them verbatim. These are the same neutral
 * acknowledgements INSTRUCTION already excludes; the guard enforces the
 * instruction rather than trusting the model to have followed it,
 * because verbatim presence alone cannot tell "continue" apart from a
 * real verdict (cases.json, v10-neutral-token-quoted-as-a-verdict).
 *
 * Every entry here can only turn a reading into `undeclared`. No guard
 * in this module can create a verdict, so none of them can manufacture
 * the false `satisfied` that plan 16.8 risk 1 names as the worst
 * outcome in the system.
 */
export const NEUTRAL_ACKS: readonly string[] = [
  'ok', 'okay', 'k', 'kk', 'sure', 'yes', 'yep', 'yeah', 'no', 'nope',
  'thanks', 'thank you', 'thx', 'ty', 'continue', 'go on', 'go ahead',
  'proceed', 'next', 'done', 'fine', 'got it', 'understood', 'noted',
  'cool', 'right', 'alright', 'please', 'please continue', 'keep going',
  'carry on', 'yes please', 'do it', 'hmm', 'hm', 'mhm',
]

/** lowercase, collapse whitespace, strip surrounding punctuation */
function normalizeAck(quote: string): string {
  return quote
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^[\s.,!?;:'"*_\-\u2026]+/, '')
    .replace(/[\s.,!?;:'"*_\-\u2026]+$/, '')
    .trim()
}

export function isNeutralAck(quote: string): boolean {
  return NEUTRAL_ACKS.includes(normalizeAck(quote))
}

function extractJson(raw: string): { accepted: unknown; step: unknown; quote: unknown } {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('verdict reader returned no JSON object')
  return JSON.parse(trimmed.slice(start, end + 1))
}

/**
 * Read the stated verdict out of the user's own messages. Every claim
 * the model makes is verified against the trace: the step must exist
 * and the quote must appear verbatim in that step's text, or the
 * reading is discarded as a misread and the session stays undeclared.
 */
export function readVerdict(
  prompts: UserPrompt[],
  runner: VerdictRunner = claudeVerdictRunner,
  model = 'claude-sonnet-5',
): Verdict {
  if (prompts.length === 0) return NO_VERDICT

  const transcript = prompts
    .map((p) => `[step ${p.step}] ${shownText(p)}`)
    .join('\n')
  const raw = runner(`${INSTRUCTION}\n\nThe user's messages:\n\n${transcript}`, model)
  const parsed = extractJson(raw)

  if (parsed.accepted === null || typeof parsed.accepted !== 'boolean') return NO_VERDICT

  const claimedStep = typeof parsed.step === 'number' ? parsed.step : null
  const claimedQuote = typeof parsed.quote === 'string' ? parsed.quote : null
  if (claimedQuote === null) return NO_VERDICT

  // Guard 1: substance. Too short to carry a verdict, or a neutral
  // acknowledgement the instruction already excluded.
  const needle = claimedQuote.trim()
  if (needle.length < MIN_QUOTE_CHARS) return NO_VERDICT
  if (isNeutralAck(needle)) return NO_VERDICT

  // Guard 2: presence. The user's words must be literally present in
  // what the model was shown (shownText, not the raw message), or the
  // reading is a hallucination and the session stays undeclared. The
  // step is then taken FROM the trace, not from the model — in the n=1
  // acceptance run the model quoted the verdict verbatim but
  // misnumbered its step (710 for 730), and the trace, not the
  // pointer, is the authority.
  const candidates: { prompt: UserPrompt; at: number }[] = []
  for (const prompt of prompts) {
    const at = shownText(prompt).indexOf(needle)
    if (at !== -1) candidates.push({ prompt, at })
  }
  if (candidates.length === 0) return NO_VERDICT
  const source =
    candidates.find((c) => c.prompt.step === claimedStep) ??
    candidates[candidates.length - 1]

  // Report the span from the ORIGINAL message, not from the flattened
  // view: the record carries the user's words as she wrote them,
  // newlines included. Offsets are one-for-one, so this is the same span.
  const verbatim = source.prompt.text.slice(source.at, source.at + needle.length)

  return {
    accepted: parsed.accepted,
    step: source.prompt.step,
    quote: verbatim,
    basis: 'read-from-chat',
    confidence: 'stated',
  }
}
