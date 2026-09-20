// Export the tuning record as a portable context block: paste it into
// any model's instructions (Claude Code CLAUDE.md, ChatGPT custom
// instructions, a system prompt) and the model starts from your tuning
// instead of zero. Import your tuning into every model.

import type { TuningRecord } from './types'

export function renderTuningBlock(tuning: TuningRecord): string {
  const active = tuning.axioms.filter((a) => a.status !== 'revoked')
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
