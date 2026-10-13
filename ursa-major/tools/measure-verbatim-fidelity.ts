// What `survived_verbatim` claimed before 2026-10-13 and what it claims now.
//
// The question this answers: how many spans does an outcome record sell as
// "generated and kept unchanged" when the characters are not the characters
// the model wrote? Until 2026-10-13 pass 1 of the resolver made its claim on
// a hit in the normalized shadow text, which is lowercased, has smart
// punctuation folded and every whitespace run collapsed to one space. A case
// change, an em dash retyped as a hyphen, a doubled space and a reflow were
// therefore all invisible to the label, and the edit — which is the
// correction, and the product — was folded away as noise.
//
// Two passes, neither of which needs the old code checked out:
//
//   cases   The six-case probe from the ledger entry "`survived_verbatim` is
//           not verbatim, and a record sold today proves it" (docs/ideas.md,
//           2026-10-12). One generation, six final texts differing from it in
//           one way each. The BEFORE column is the pre-2026-10-13 rule
//           restated here in one line (normalized containment anywhere in a
//           generation, at or above MIN_VERBATIM_LEN), not the old module;
//           it is one expression long precisely because that is all the rule
//           was. The AFTER column is the shipped `resolve()`.
//
//   repo    The same counterfactual over a real git history. Every record the
//           walk produces is resolved by the shipped resolver, and then every
//           span it did NOT label verbatim is re-tested against the old rule.
//           A span the old rule would have called verbatim and the new one
//           does not is a span that was being sold wrong, and the pass prints
//           the first differing characters of each one so the claim is
//           checkable rather than asserted.
//
// Usage, from the package root:
//   npx tsx tools/measure-verbatim-fidelity.ts cases
//   npx tsx tools/measure-verbatim-fidelity.ts repo <path-to-clone> [--limit N]
//
// Writes nothing. Records are resolved in memory and never saved, so it is
// safe to point at a clone you care about: no `.ursa/` directory, no consent
// store read or written.

import { findCommitPairs, listCommits } from '../src/pairfinder'
import { buildEpisodes } from '../src/episodes'
import { annotateDurability } from '../src/lifespan'
import { clearsSizeFloor } from '../src/launch'
import { resolveEpisode } from '../src/resolve-episode'
import { checkRecord } from '../src/invariants'
import { normalize } from '../src/normalize'
import { MIN_VERBATIM_LEN } from '../src/match'
import { resolve } from '../src/resolve'
import type { ConversationMeta, OutcomeRecord, RawGeneration } from '../src/types'

/** the same floor `ursa run` applies, so the pass agrees with it on which records count */
const MIN_CHARS = 200

/**
 * The rule pass 1 used until 2026-10-13, restated. True when the span's
 * normalized text is contained in some generation's normalized text, which
 * is the entire condition the old code checked before writing
 * `class: 'survived_verbatim', score: 1`.
 */
function oldRuleCallsItVerbatim(spanText: string, genTexts: string[]): boolean {
  const sNorm = normalize(spanText).norm
  if (sNorm.length < MIN_VERBATIM_LEN) return false
  return genTexts.some((t) => normalize(t).norm.includes(sNorm))
}

/** where two strings that should be identical stop being identical */
function firstDifference(a: string, b: string, window = 24): string {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  const from = Math.max(0, i - 8)
  return `offset ${i}: ${JSON.stringify(a.slice(from, i + window))} vs ${JSON.stringify(b.slice(from, i + window))}`
}

// ---------------------------------------------------------------------------
// Pass one: the six cases.
// ---------------------------------------------------------------------------

const GEN =
  'The resolver joins finished work backward to the generations that fed it, and the label is supplied by the artifact — never by a grader.'

const CASES: Array<{ name: string; final: string }> = [
  { name: 'identical', final: GEN },
  { name: 'case changed', final: GEN.replace('The resolver', 'The Resolver') },
  { name: 'em dash -> hyphen', final: GEN.replace('—', '-') },
  { name: 'space doubled', final: GEN.replace('and the label', 'and  the label') },
  { name: 'line rewrapped', final: GEN.replace('and the label', 'and\n  the label') },
  { name: 'smart quotes introduced', final: GEN.replace('the artifact', 'the ‘artifact’') },
]

const CONV: ConversationMeta = {
  id: 'c1', title: 'verbatim fidelity probe', adapter: 'paste',
  model: 'probe-model', turns: 2, userTurns: 1,
}
const GENERATION: RawGeneration = {
  conversationId: 'c1', model: 'probe-model', turnIndex: 0,
  kind: 'assistant_text', text: GEN,
}

/**
 * The merge rule mergeVerbatimRuns used until 2026-10-13, restated: two
 * verbatim spans from the same generation, the gap in the generation at most
 * two characters, the gap in the final text any whitespace at all. The second
 * half of the finding lives here rather than in the label — prose segments
 * line by line, so a reflow splits one final segment into two halves that
 * really are byte-identical, and it was the merge that then claimed the
 * newline and two spaces the person inserted between them.
 */
function oldRuleMerges(
  finalText: string,
  a: { end: number; source?: { generationIndex: number; end: number } },
  b: { start: number; source?: { generationIndex: number; start: number } },
): boolean {
  if (!a.source || !b.source) return false
  if (a.source.generationIndex !== b.source.generationIndex) return false
  const genGap = b.source.start - a.source.end
  return genGap >= 0 && genGap <= 2 && /^\s*$/.test(finalText.slice(a.end, b.start))
}

function runCases(): void {
  console.log(`generation (${GEN.length} chars): ${JSON.stringify(GEN)}\n`)
  console.log('case                      before                                after                                 exact')
  console.log('-'.repeat(110))
  for (const c of CASES) {
    const record = resolve({
      taskId: 'verbatim-fidelity',
      files: [{ path: 'final.md', text: c.final }],
      conversations: [CONV],
      generations: [GENERATION],
      finished: true,
      generatedAt: '2026-10-13T00:00:00.000Z',
    })
    const spans = record.files[0].spans
    const beforeLabels = spans.map((s) => (oldRuleCallsItVerbatim(s.text, [GEN]) ? 'survived_verbatim' : s.class))
    // Where the old merge rule would have joined two of them, say so with the
    // two extents it would have produced, because that pair of numbers is the
    // CLAIM_NOT_WIDER violation the finding started from.
    let before = beforeLabels.join(' + ')
    for (let i = 0; i + 1 < spans.length; i++) {
      if (beforeLabels[i] !== 'survived_verbatim' || beforeLabels[i + 1] !== 'survived_verbatim') continue
      if (!oldRuleMerges(c.final, spans[i], spans[i + 1])) continue
      const finalLen = spans[i + 1].end - spans[i].start
      const srcLen = spans[i + 1].source!.end - spans[i].source!.start
      before = `survived_verbatim (merged, ${finalLen} final chars on a ${srcLen}-char extent)`
    }
    const after = spans.map((s) => s.class)
    // true when every verbatim claim the record makes is the same characters
    // on both sides, which is the whole of what the label now means
    const exact = spans
      .filter((s) => s.class === 'survived_verbatim')
      .every((s) => !!s.source && GEN.slice(s.source.start, s.source.end) === s.text)
    console.log(
      c.name.padEnd(25) +
      ' ' + before.padEnd(37) +
      ' ' + after.join(' + ').padEnd(37) +
      ' ' + exact,
    )
  }
  const violations = CASES.flatMap((c) =>
    checkRecord(resolve({
      taskId: 'verbatim-fidelity',
      files: [{ path: 'final.md', text: c.final }],
      conversations: [CONV],
      generations: [GENERATION],
      finished: true,
      generatedAt: '2026-10-13T00:00:00.000Z',
    })).map((v) => `${c.name}: ${v.code}`),
  )
  console.log(`\ngate over the six records: ${violations.length === 0 ? 'no violations' : violations.join(', ')}`)
}

// ---------------------------------------------------------------------------
// Pass two: the same counterfactual over a real history.
// ---------------------------------------------------------------------------

function runRepo(project: string, limit: number): void {
  const commits = listCommits(project)
  const pairs = findCommitPairs(project)
  const episodes = buildEpisodes(pairs, project)
  const records: OutcomeRecord[] = []
  for (const ep of episodes.slice(0, limit)) {
    const record = resolveEpisode(project, ep, commits)
    if (!record) continue
    if (!clearsSizeFloor(record, MIN_CHARS)) continue
    annotateDurability(project, record, ep.finalSha, ep.closedAt)
    records.push(record)
  }

  let verbatimSpans = 0
  let verbatimChars = 0
  let reclassified = 0
  let reclassifiedChars = 0
  const examples: string[] = []
  let gateViolations = 0

  for (const r of records) {
    const genTexts = r.generations.map((g) => g.text)
    gateViolations += checkRecord(r).length
    for (const f of r.files) {
      for (const s of f.spans) {
        if (s.class === 'survived_verbatim') {
          verbatimSpans++
          verbatimChars += s.end - s.start
          continue
        }
        // Not verbatim now. Would the rule that shipped until 2026-10-13
        // have said it was?
        if (!oldRuleCallsItVerbatim(s.text, genTexts)) continue
        reclassified++
        reclassifiedChars += s.end - s.start
        if (examples.length < 8 && s.source) {
          const claimed = genTexts[s.source.generationIndex].slice(s.source.start, s.source.end)
          examples.push(`  ${r.task.id} ${f.path} [${s.start},${s.end}) now ${s.class}; ${firstDifference(s.text, claimed)}`)
        } else if (examples.length < 8) {
          examples.push(`  ${r.task.id} ${f.path} [${s.start},${s.end}) now ${s.class}, no source pointer`)
        }
      }
    }
  }

  console.log(JSON.stringify({
    project,
    episodesConsidered: Math.min(limit, episodes.length),
    records: records.length,
    gateViolations,
    verbatimSpansNow: verbatimSpans,
    verbatimCharsNow: verbatimChars,
    // spans the old rule sold as verbatim that are not byte-identical
    spansTheOldRuleMislabelled: reclassified,
    charsTheOldRuleMislabelled: reclassifiedChars,
    shareOfVerbatimClaimsThatWereNotExact:
      verbatimSpans + reclassified === 0 ? 0
        : Math.round((reclassified / (verbatimSpans + reclassified)) * 1000) / 1000,
  }, null, 2))
  if (examples.length) console.log('\nfirst differences, one line each:\n' + examples.join('\n'))
}

const argv = process.argv.slice(2)
const mode = argv[0]
if (mode === 'cases') {
  runCases()
} else if (mode === 'repo' && argv[1]) {
  const li = argv.indexOf('--limit')
  runRepo(argv[1], li >= 0 ? Number(argv[li + 1]) : 50)
} else {
  console.error('usage: npx tsx tools/measure-verbatim-fidelity.ts cases')
  console.error('       npx tsx tools/measure-verbatim-fidelity.ts repo <path-to-clone> [--limit N]')
  process.exit(2)
}
