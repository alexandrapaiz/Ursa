// CI mode for the distiller.
//
// The distiller's interpretation pass runs `claude -p` on the user's own
// machine and subscription (src/tuning/distill.ts). A GitHub runner has
// neither by default: no `claude` binary on PATH and no credential. The
// resolver must never block on what a runner lacks, so the CI launch
// decides up front which mode it is in and keeps going either way.
//
// What CI mode does NOT do: fabricate tuning units. The distiller's own
// contract is that every axiom cites evidence, and a mode with no model
// has produced no interpretation. It therefore returns an empty axiom
// list and reports a tuning delta of zero, which the run comment prints
// as a zero rather than omitting (the comment's field order is fixed).
// The records are still written, so the same records distill later, on a
// machine that has the model, with nothing lost but a day.

import { execFileSync } from 'node:child_process'
import type { DistillRunner } from '../tuning/distill'

export type DistillMode =
  | { kind: 'model'; model: string; reason: string }
  | { kind: 'ci-no-model'; reason: string }

/** Credentials that make a `claude -p` call possible, by name only. */
const CREDENTIAL_VARS = ['ANTHROPIC_API_KEY', 'CLAUDE_CODE_OAUTH_TOKEN'] as const

export interface DistillModeOptions {
  /** defaults to probing PATH for the `claude` binary */
  claudeOnPath?: () => boolean
  /** the model to ask for when a credential exists */
  model?: string
}

export function claudeOnPath(): boolean {
  try {
    execFileSync('claude', ['--version'], { encoding: 'utf8', timeout: 20_000, stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

export function selectDistillMode(
  env: Record<string, string | undefined>,
  opts: DistillModeOptions = {}
): DistillMode {
  const probe = opts.claudeOnPath ?? claudeOnPath
  const model = opts.model ?? env.URSA_DISTILL_MODEL ?? 'sonnet'

  if (env.URSA_DISTILL === 'off') {
    return { kind: 'ci-no-model', reason: 'distillation disabled by URSA_DISTILL=off' }
  }
  const credential = CREDENTIAL_VARS.find((name) => (env[name] ?? '').trim().length > 0)
  if (!credential) {
    return {
      kind: 'ci-no-model',
      reason: `no model credential in the environment (looked for ${CREDENTIAL_VARS.join(', ')})`,
    }
  }
  if (!probe()) {
    return {
      kind: 'ci-no-model',
      reason: `${credential} is set but the claude CLI is not on PATH`,
    }
  }
  return { kind: 'model', model, reason: `${credential} is set and the claude CLI is on PATH` }
}

/**
 * The runner CI mode installs. It satisfies DistillRunner's signature and
 * returns a well-formed empty result, so mergeDistill is never handed a
 * half-parsed response and no axiom arrives without evidence.
 */
export const noModelRunner: DistillRunner = () => '{"axioms": []}'
