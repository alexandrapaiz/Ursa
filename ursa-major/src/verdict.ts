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
    .map((p) => `[step ${p.step}] ${p.text.replace(/\n/g, ' ').slice(0, 2000)}`)
    .join('\n')
  const raw = runner(`${INSTRUCTION}\n\nThe user's messages:\n\n${transcript}`, model)
  const parsed = extractJson(raw)

  if (parsed.accepted === null || typeof parsed.accepted !== 'boolean') return NO_VERDICT

  const step = typeof parsed.step === 'number' ? parsed.step : null
  const quote = typeof parsed.quote === 'string' ? parsed.quote : null
  if (step === null || quote === null) return NO_VERDICT

  // Verify against the trace: the model's reading must be literally
  // present in the message it points at. A hallucinated quote or step
  // is a misread, and a misread is not a verdict.
  const source = prompts.find((p) => p.step === step)
  if (!source || !source.text.includes(quote)) return NO_VERDICT

  return {
    accepted: parsed.accepted,
    step,
    quote,
    basis: 'read-from-chat',
    confidence: 'stated',
  }
}
