// Counterfactual measurement for agent-coauthor detection.
//
// The question this answers, on a real history rather than on a fixture:
// how much of what an outcome record calls "the person kept this"
// depends on the Co-Authored-By pattern recognising only four harness
// vendor names instead of every machine identity the author-name
// fallback already knew?
//
// It resolves the same clone twice. Once with `agentTrailerPattern` set
// to the pattern that shipped until 2026-10-11
// (/claude|codex|cursor|gpt/i), once with the shipped default
// (`MACHINE_IDENTITY` in src/pairfinder.ts). Nothing else differs
// between the two runs: same bounds, same clone, same commit graph,
// same `--min-chars` floor. Every other seam the run has — the import
// check, the deletion attributor, the durability walk — is held
// identical by being called the same way in both passes.
//
// A third pass runs when identities are declared on the command line,
// which is how the second half of the same finding was measured: the
// trailer fix stopped a machine's SYNC being read as a correction, and
// declaring the seats stopped a machine's EDIT being read as one.
//
// Usage, from the package root:
//   npx tsx tools/measure-coauthor-detection.ts <path-to-clone> \
//     [--agent-identity <substring>]...
//
// Writes nothing. Records are resolved in memory and never saved, so it
// is safe to point at a clone you care about; it does not create a
// `.ursa/` directory and does not read or write the consent store.
// Prints one JSON object per pass plus a delta object.

import { findCommitPairsWithDiagnostics, listCommits } from '../src/pairfinder'
import { buildEpisodes } from '../src/episodes'
import { vendoredPaths } from '../src/vendored'
import { annotateDurability } from '../src/lifespan'
import { clearsSizeFloor } from '../src/launch'
import { resolveEpisode, resolvablePaths } from '../src/resolve-episode'
import type { OutcomeRecord } from '../src/types'

/** the pattern that shipped until 2026-10-11, kept here as the baseline */
const FOUR_VENDOR_WORDS = /claude|codex|cursor|gpt/i
/** the same floor `ursa run` applies, so the two passes agree on which records count */
const MIN_CHARS = 200

const argv = process.argv.slice(2)
const project = argv.find((a) => !a.startsWith('--') && argv[argv.indexOf(a) - 1] !== '--agent-identity')
const declared = argv.flatMap((a, i) => (a === '--agent-identity' && argv[i + 1] ? [argv[i + 1]] : []))
if (!project) {
  console.error('usage: npx tsx tools/measure-coauthor-detection.ts <path-to-clone> [--agent-identity <substring>]...')
  process.exit(2)
}

interface Totals {
  pass: string
  trailerPattern: string
  /** identities the caller declared to be agents' for this pass */
  declaredIdentities: string[]
  /** commits classified by that declaration rather than by a pattern */
  generatedByDeclaredIdentity: number
  /** who the pass decided was the person, which is the thing to look at */
  editorIdentities: { name: string; email: string; pairs: number }[]
  /** commits the walk classified as generations by their trailer */
  generatedByTrailer: number
  /** commits it classified by author name, after the all-match suppression */
  generatedByAuthorName: number
  /** pairs that survived every bound */
  pairs: number
  /** records that cleared the size floor */
  records: number
  survivedVerbatimChars: number
  survivedMutatedChars: number
  /** every character the generations wrote, the only final-side denominator */
  generatedCharsWritten: number
  /** characters inside segments, the only denominator a deletion rate may use */
  generatedTraceableChars: number
  /** generated characters the person read and dropped, merge-caused excluded */
  humanDeletedChars: number
  /** generated characters a merge destroyed, which carry no correction signal */
  mergeDeletedChars: number
  /** gone, with no readable cause, because a merge was unreadable from this clone */
  unknownDeletedChars: number
  /** share of traceable generated characters the person discarded */
  humanDiscardRate: number
  /** pairs the bounds refused, by the bound that stopped the walk */
  refused: { distance: number; age: number; interposedGeneration: number; notDescendant: number }
}

function pass(label: string, trailer: RegExp | undefined, identities: string[] = []): Totals {
  const { pairs, diagnostics } = findCommitPairsWithDiagnostics(project, {
    agentTrailerPattern: trailer,
    agentIdentities: identities,
  })
  const commits = listCommits(project)
  const episodes = buildEpisodes(pairs, project).map((ep) => ({
    ...ep,
    vendoredPaths: vendoredPaths(project, ep, resolvablePaths(ep), commits),
  }))
  const records: OutcomeRecord[] = []
  for (const ep of episodes) {
    const record = resolveEpisode(project, ep, commits)
    if (!record) continue
    if (!clearsSizeFloor(record, MIN_CHARS)) continue
    annotateDurability(project, record, ep.finalSha, ep.closedAt)
    records.push(record)
  }
  const sum = (f: (r: OutcomeRecord) => number) => records.reduce((a, r) => a + f(r), 0)
  const traceable = sum((r) => r.stats.generated.totalChars)
  const humanDeleted = sum((r) => r.stats.generated.humanDeletedChars)
  return {
    pass: label,
    trailerPattern: String(trailer ?? '(shipped default)'),
    declaredIdentities: identities,
    generatedByDeclaredIdentity: diagnostics.generatedByDeclaredIdentity,
    editorIdentities: diagnostics.editorIdentities,
    generatedByTrailer: diagnostics.generatedByTrailer,
    generatedByAuthorName: diagnostics.generatedByAuthorName,
    pairs: pairs.length,
    records: records.length,
    survivedVerbatimChars: sum((r) => r.stats.byClass.survived_verbatim.chars),
    survivedMutatedChars: sum((r) => r.stats.byClass.survived_mutated.chars),
    generatedCharsWritten: sum((r) => r.stats.generated.charsWritten),
    generatedTraceableChars: traceable,
    humanDeletedChars: humanDeleted,
    mergeDeletedChars: sum((r) => r.stats.generated.mergeDeletedChars),
    unknownDeletedChars: sum((r) => r.stats.generated.unknownDeletedChars),
    humanDiscardRate: traceable ? Number((humanDeleted / traceable).toFixed(4)) : 0,
    refused: diagnostics.abandoned,
  }
}

const before = pass('four-vendor-words (shipped until 2026-10-11)', FOUR_VENDOR_WORDS)
const after = pass('machine-identity (shipped from 2026-10-11)', undefined)

console.log(JSON.stringify(before, null, 2))
console.log(JSON.stringify(after, null, 2))
if (declared.length > 0) {
  console.log(JSON.stringify(pass('machine-identity plus declared identities', undefined, declared), null, 2))
}
console.log(JSON.stringify({
  delta: 'after minus before',
  survivedVerbatimChars: after.survivedVerbatimChars - before.survivedVerbatimChars,
  survivedVerbatimSharePreviouslyClaimedInError: before.survivedVerbatimChars
    ? Number((1 - after.survivedVerbatimChars / before.survivedVerbatimChars).toFixed(4))
    : 0,
  records: after.records - before.records,
  humanDiscardRateBefore: before.humanDiscardRate,
  humanDiscardRateAfter: after.humanDiscardRate,
}, null, 2))
