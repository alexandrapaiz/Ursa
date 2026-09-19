// The interpretation pass: reverse-engineer the whys behind a record's
// correction signals. Runs locally via the Claude Code CLI (`claude -p`)
// so distillation happens on the user's machine with the user's own
// subscription — nothing leaves except the API call Claude Code itself
// makes.

import { execFileSync } from 'node:child_process'
import type { OutcomeRecord } from '../types'
import type { DistillOutput, DistilledAxiom, TasteRecord } from './types'

const VALID_KINDS = new Set([
  'correction-loop',
  'feedback-translation',
  'regression',
  'defensive-guardrail',
  'one-shot-correction',
  'episode',
])

export function buildDistillPrompt(record: OutcomeRecord, taste: TasteRecord): string {
  const s = record.signals
  if (!s) throw new Error('Record has no signals block; nothing to distill from')

  const existing = taste.axioms
    .filter((a) => a.status !== 'revoked')
    .map((a) => ({ id: a.id, statement: a.statement, domain: a.domain, polarity: a.polarity }))
  const revoked = taste.axioms
    .filter((a) => a.status === 'revoked')
    .map((a) => ({ id: a.id, statement: a.statement }))

  const prompts = record.conversations.flatMap((c) =>
    (c.prompts ?? []).map((p) => ({ step: p.step, text: p.text }))
  )

  return [
    'You are the interpretation pass of a preference-distillation pipeline.',
    'Below is machine-extracted evidence of how one user corrected an AI',
    'assistant during a real finished piece of work: correction loops with',
    'the spec the user could not state in advance, complaint-to-mechanism',
    'translations, regressions, defensive guardrails, and one-shot',
    'corrections, plus the user\'s verbatim prompts.',
    '',
    'Your task: reverse-engineer the WHYS. State the user\'s underlying',
    'preferences as short portable rules (axioms) a different AI could',
    'follow from its first message. Rules for your output:',
    '- Every axiom MUST cite the evidence entries that ground it. Never',
    '  invent an axiom no signal supports.',
    '- Prefer the general why over the incident (not "polaris star label',
    '  was removed" but "no explanatory labels on visual elements").',
    '- basis is "stated" only if the user said the rule in words;',
    '  "tacit" if the artifact revealed it; "mixed" if both.',
    '- If an axiom restates an EXISTING axiom below, set matchesExisting',
    '  to that id instead of rewording it into a duplicate.',
    '- Never resurrect a REVOKED axiom: if the evidence points at one,',
    '  drop it.',
    '- If two axioms genuinely conflict (stated preference vs revealed',
    '  behavior), emit both and list each in the other\'s contradicts.',
    '- 3 to 12 axioms. Quality over count.',
    '',
    'Return ONLY a JSON object, no markdown fences, matching:',
    '{"axioms": [{"statement": string, "domain": string, "polarity":',
    '"prefer"|"avoid", "basis": "stated"|"tacit"|"mixed",',
    '"matchesExisting": string|null, "contradicts": string[],',
    '"evidence": [{"kind": "correction-loop"|"feedback-translation"|',
    '"regression"|"defensive-guardrail"|"one-shot-correction"|"episode",',
    '"ref": string, "steps": number[], "quote": string (optional,',
    'verbatim user words)}]}]}',
    '',
    `EXISTING AXIOMS: ${JSON.stringify(existing)}`,
    `REVOKED AXIOMS (do not resurrect): ${JSON.stringify(revoked)}`,
    '',
    `EPISODE: ${JSON.stringify(s.episode)}`,
    `CORRECTION LOOPS: ${JSON.stringify(s.correctionLoops)}`,
    `FEEDBACK TRANSLATIONS: ${JSON.stringify(s.feedbackTranslations)}`,
    `REGRESSIONS: ${JSON.stringify(s.regressions)}`,
    `DEFENSIVE GUARDRAILS: ${JSON.stringify(s.defensiveGuardrails)}`,
    `ONE-SHOT CORRECTIONS: ${JSON.stringify(s.oneShotCorrections)}`,
    '',
    `USER PROMPTS (step, text): ${JSON.stringify(prompts)}`,
  ].join('\n')
}

/** Strip accidental code fences and parse the model's JSON. */
export function parseDistillOutput(raw: string): DistillOutput {
  let text = raw.trim()
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) text = fence[1].trim()
  const start = text.indexOf('{')
  if (start > 0) text = text.slice(start)
  const parsed = JSON.parse(text) as DistillOutput
  if (!Array.isArray(parsed.axioms)) throw new Error('Distill output has no axioms array')
  for (const a of parsed.axioms) validateAxiom(a)
  return parsed
}

function validateAxiom(a: DistilledAxiom): void {
  if (!a.statement || typeof a.statement !== 'string') throw new Error('Axiom missing statement')
  if (!['prefer', 'avoid'].includes(a.polarity)) throw new Error(`Bad polarity on "${a.statement}"`)
  if (!['stated', 'tacit', 'mixed'].includes(a.basis)) throw new Error(`Bad basis on "${a.statement}"`)
  if (!Array.isArray(a.evidence) || a.evidence.length === 0) {
    throw new Error(`Axiom without evidence rejected: "${a.statement}"`)
  }
  for (const e of a.evidence) {
    if (!VALID_KINDS.has(e.kind)) throw new Error(`Bad evidence kind "${e.kind}" on "${a.statement}"`)
    if (!Array.isArray(e.steps)) throw new Error(`Evidence without steps on "${a.statement}"`)
  }
}

export interface DistillRunner {
  (prompt: string, model: string): string
}

/** Default runner: Claude Code CLI, print mode, local machine. */
export const claudeRunner: DistillRunner = (prompt, model) => {
  const out = execFileSync('claude', ['-p', '--model', model, '--output-format', 'json'], {
    input: prompt,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    timeout: 300_000,
  })
  const envelope = JSON.parse(out) as { result?: string; is_error?: boolean }
  if (envelope.is_error || typeof envelope.result !== 'string') {
    throw new Error('claude -p returned an error envelope')
  }
  return envelope.result
}

export function distill(
  record: OutcomeRecord,
  taste: TasteRecord,
  model: string,
  runner: DistillRunner = claudeRunner
): DistillOutput {
  const prompt = buildDistillPrompt(record, taste)
  return parseDistillOutput(runner(prompt, model))
}
