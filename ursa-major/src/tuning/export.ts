// Export the tuning record as a portable context block: paste it into
// any model's instructions (Claude Code CLAUDE.md, ChatGPT custom
// instructions, a system prompt) and the model starts from your tuning
// instead of zero. Import your tuning into every model.

import type { TuningRecord } from './types'

/**
 * An axiom's text becomes a line of instructions inside a block this
 * file tells other models to follow from their first message. The text
 * itself is model-written, distilled from whatever was in the session,
 * and a session routinely contains text the user pasted from somewhere
 * else. So a statement is allowed to be a rule and nothing more: it may
 * not introduce structure into the block it sits in.
 *
 * One line, no control characters, no leading list or heading marker, and
 * a length bound. A well-formed axiom is a short single-line rule, so
 * every one of them renders byte-for-byte as before; this only bites text
 * that was trying to be more than a rule.
 *
 * This is containment, not authentication. It stops injected text from
 * occupying the block's instruction positions. It cannot stop a
 * one-sentence rule from being a harmful rule, which is why a review gate
 * before an axiom goes active is in the ledger rather than here.
 */
const MAX_FIELD = 300

function oneLine(value: string, max = MAX_FIELD): string {
  const flat = value
    // every Unicode line break and separator, not just \n
    .replace(/[\r\n\u000b\f\u0085\u2028\u2029]+/g, ' ')
    // remaining C0/C1 controls, which terminals and some parsers act on
    .replace(/[\u0000-\u0008\u000e-\u001f\u007f-\u009f]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim()
  // A leading marker would make the text its own bullet, heading, quote or
  // fence once it is spliced into markdown.
  const unmarked = flat.replace(/^(?:[-*+>#]|\d+[.)]|`{3,}|~{3,})[ \t]*/, '')
  return unmarked.length > max ? `${unmarked.slice(0, max - 1).trimEnd()}…` : unmarked
}

export function renderTuningBlock(tuning: TuningRecord): string {
  const active = tuning.axioms
    .filter((a) => a.status !== 'revoked')
    .map((a) => ({
      ...a,
      id: oneLine(a.id, 64),
      statement: oneLine(a.statement),
      domain: oneLine(a.domain, 64) || 'general',
      contradicts: a.contradicts.map((c) => oneLine(c, 64)),
    }))
  const byDomain = new Map<string, typeof active>()
  for (const a of active) {
    const list = byDomain.get(a.domain) ?? []
    list.push(a)
    byDomain.set(a.domain, list)
  }

  const lines: string[] = [
    '# Tuning',
    '',
    `Distilled from ${tuning.sources.length} real working session${tuning.sources.length === 1 ? '' : 's'};`,
    'every rule is backed by evidence in the owner\'s outcome records.',
    'Confidence = independent evidence count. Follow high-confidence rules',
    'from the first message; treat single-evidence rules as hints.',
    '',
  ]

  const domains = [...byDomain.keys()].sort()
  for (const domain of domains) {
    lines.push(`## ${domain}`)
    const axioms = byDomain
      .get(domain)!
      .sort((x, y) => y.evidenceCount - x.evidenceCount)
    for (const a of axioms) {
      const verb = a.polarity === 'prefer' ? 'Prefer' : 'Avoid'
      const conflict = a.contradicts.length > 0 ? ` [tension with ${a.contradicts.join(', ')}]` : ''
      lines.push(`- ${verb}: ${a.statement} (${a.basis}, x${a.evidenceCount})${conflict}`)
    }
    lines.push('')
  }

  const tensions = active.filter((a) => a.contradicts.length > 0)
  if (tensions.length > 0) {
    lines.push('## Tensions')
    lines.push('')
    lines.push('Stated and revealed preferences that conflict. Ask, do not guess:')
    for (const a of tensions) {
      lines.push(`- ${a.id}: ${a.statement}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
