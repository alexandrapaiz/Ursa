// What `CorrectionLoop.recurrences` counts, measured rather than read.
//
// Run from ursa-major/ (after `npm install`):
//   npx tsx ../skills/auditing-a-detected-correction-loop/probe-recurrences.ts
//
// Three probes, each holding the user's correction behaviour fixed and varying
// one thing the detector keys on. Cited by SKILL.md as a measured fact under
// prompts/skill-extract.md §5b, which asks for the command and not the number.

import { resolve } from '../../ursa-major/src/resolve'
import { deriveSignals } from '../../ursa-major/src/signals'
import type { ConversationMeta, RawGeneration, UserPrompt } from '../../ursa-major/src/types'

const GEN = 'The constellation stars render on their own layer at full opacity.'

function run(ask: string, corrections: string[]) {
  const prompts: UserPrompt[] = [
    { step: 0, text: ask },
    ...corrections.map((text, i) => ({ step: i + 1, text })),
  ]
  const conversations: ConversationMeta[] = [{
    id: 'c1', title: 'c1', adapter: 'paste', model: 'claude-opus-5',
    turns: prompts.length * 2, userTurns: prompts.length, prompts,
  }]
  const generations: RawGeneration[] = [{
    conversationId: 'c1', model: 'claude-opus-5', turnIndex: prompts.length,
    kind: 'assistant_text' as const, text: GEN,
  }]
  const record = resolve({
    taskId: 't', files: [{ path: 'final.md', text: GEN }],
    conversations, generations, finished: true,
  })
  const s = deriveSignals(record)
  return {
    loops: s.correctionLoops.map((l) => ({
      openedStep: l.openedStep, promptSteps: l.promptSteps,
      recurrences: l.recurrences, theme: l.theme,
    })),
    oneShotSteps: s.oneShotCorrections.map((c) => c.step),
    // the counter in notes[] — corrections no surviving generation answered
    unresolvedNote: (s.notes ?? []).filter((n) => n.includes('single correction')),
  }
}

// Probe 1 — the same three corrections, under two opening asks. The only
// difference is whether the ask shares two content terms with the theme.
const SAME = [
  'The constellation animation is too dark, brighten the constellation.',
  'The constellation animation is still too dark, brighten the constellation.',
  'The constellation animation is dark, brighten the constellation stars.',
]
console.log('probe 1 — three corrections on one theme, ask off-theme:')
console.log('  ', JSON.stringify(run('Write the hero section copy, two short paragraphs.', SAME)))
console.log('probe 1 — the same three corrections, ask restates the theme:')
console.log('  ', JSON.stringify(run('Write the hero copy and a constellation animation, brighten it.', SAME)))

// Probe 2 — one theme stated three times in varying word forms. No stemming,
// so "brighten" and "brightening" are different terms.
console.log('probe 2 — one theme, three inflections of the same verb:')
console.log('  ', JSON.stringify(run('Write the hero section copy, two short paragraphs.', [
  'The constellation animation is too dark, brighten the constellation.',
  'The constellation needs brightening, the stars vanish.',
  'Brightened enough? The constellation still reads dark.',
])))

// Probe 3 — the same root cause reaches regressions. A regression member must
// sit at index > 0 in its own theme (loops.ts, the regressionMembers filter),
// so whether the FIRST complaint's regression cue is emitted depends on
// whether the task ask was unshifted ahead of it.
function regressionsOf(ask: string) {
  const corrections = [
    'The constellation animation went back to dark again, you broke what worked.',
    'The constellation animation is dark, brighten the constellation.',
  ]
  const prompts: UserPrompt[] = [
    { step: 0, text: ask },
    ...corrections.map((text, i) => ({ step: i + 1, text })),
  ]
  const conversations: ConversationMeta[] = [{
    id: 'c1', title: 'c1', adapter: 'paste', model: 'claude-opus-5',
    turns: 6, userTurns: 3, prompts,
  }]
  const generations: RawGeneration[] = [{
    conversationId: 'c1', model: 'claude-opus-5', turnIndex: 3,
    kind: 'assistant_text' as const, text: GEN,
  }]
  const record = resolve({
    taskId: 't', files: [{ path: 'final.md', text: GEN }],
    conversations, generations, finished: true,
  })
  const s = deriveSignals(record)
  return {
    openedStep: s.correctionLoops[0]?.openedStep,
    regressionSteps: s.correctionLoops[0]?.regressionSteps,
    regressions: s.regressions.map((r) => ({ step: r.step, brokenState: r.brokenState })),
  }
}
console.log('probe 3 — regression cue on the first complaint, ask off-theme:')
console.log('  ', JSON.stringify(regressionsOf('Write the hero section copy, two short paragraphs.')))
console.log('probe 3 — the same complaint, ask restates the theme:')
console.log('  ', JSON.stringify(regressionsOf('Write the hero copy and a constellation animation, brighten it.')))
