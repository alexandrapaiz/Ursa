// Arithmetic that must hold on every outcome record, as a gate.
//
// Why this file exists. On 2026-10-04 `ursa run` against a clone of this
// repository printed "239,976 chars survived your editing verbatim" above
// "239,841 chars were generated to get there". `survived_verbatim` means
// byte-identical in a generation and in the finished work, so it is a
// subset of what was generated and cannot exceed it. The figure was
// impossible, it was impossible in all six records of that run, and 344
// tests passed. Nothing in the codebase compared one number in a record
// against another number in the same record.
//
// That is what this module does. Every function here is a statement about
// one record that is either true or a defect, checked against the record's
// own fields — no fixtures, no expected values, no second implementation to
// drift. The checks are cheap enough to run on every record a trial
// produces, which is how they get exercised against real history instead of
// only against synthetic input (see src/invariants.test.ts and
// tools/invariants/probe.sh).
//
// Two rules kept this list honest:
//
//   1. An invariant states a bound between two numbers measured over THE
//      SAME set of characters. The original defect was not a wrong number,
//      it was a comparison between a final-file character count and a
//      generation-segment character count, which are two different sets.
//      `GEN_CLAIM_BOUNDED` is the repaired form of that comparison.
//   2. Anything that can be legitimately false is a measurement, not an
//      invariant. A generated sentence reused in two final files really is
//      counted twice by `byClass`, so "verbatim <= generated" is reported
//      by `measure()` and never fails the gate.

import { createHash } from 'node:crypto'

import { mergedLength } from './intervals'
import { isExcerptOf } from './text'
import type {
  DescentEvidence, FinalFile, FinalSpan, GateIdentity, GenerationRecord, LabSignals, OutcomeRecord,
  QuoteRef, SpanClass,
} from './types'

/** Stable identifier for each invariant, so a violation can be grepped for. */
export type InvariantCode =
  | 'CLAIM_NOT_WIDER'
  | 'CLAIM_IN_GENERATION'
  | 'GEN_SPANS_PARTITION_ORDER'
  | 'GEN_CHARS_CONSISTENT'
  | 'GEN_SURVIVED_BOUNDED'
  | 'GEN_CLAIM_BOUNDED'
  | 'DELETION_SPLIT_EXACT'
  | 'FINAL_SPANS_IN_FILE'
  | 'COVERED_BOUNDED'
  | 'RATES_MATCH_FIELDS'
  | 'PCT_DENOMINATORS_ORDERED'
  | 'PERFILE_ENUMERATES_PATHS'
  | 'SIGNAL_QUOTE_GROUNDED'
  | 'DESCENT_CHECKED_UNIFORMLY'
  | 'EXCLUSION_NOT_CLASSIFIED'
  | 'RESOLVER_IDENTIFIED'
  | 'RIVAL_NOT_AFTER_FINAL'
  | 'GATE_IDENTIFIED'

export interface Violation {
  code: InvariantCode
  /** the bound, stated so the message is readable without this file open */
  invariant: string
  /** which record, file, generation or span it fired on */
  where: string
  /** the numbers as observed, always including both sides of the bound */
  observed: string
}

/**
 * Numbers the gate reports and never fails on, because each can be
 * legitimately non-zero. They are here rather than in a comment because
 * every one of them was invisible while the impossible figure was being
 * printed, and the first one is the whole explanation for it.
 */
export interface Measurement {
  recordId: string
  /** `byClass.survived_verbatim.chars` — final-file characters */
  verbatimFinalChars: number
  /** the same claims merged per generation — generation characters, counted once */
  verbatimClaimedChars: number
  /**
   * `verbatimFinalChars - verbatimClaimedChars`. Positive means generated
   * text was reused: two final spans claim one extent of one generation.
   * Legitimate, and the reason the final-side total can exceed every
   * generation-side total.
   */
  reusedChars: number
  /** `generated.charsWritten` — every character the generations wrote */
  generatedCharsWritten: number
  /** `generated.totalChars` — only the characters inside segments */
  generatedSegmentChars: number
  /**
   * Characters between generation segments, which carry no fate and are
   * therefore in no deletion or survival rate, but which a verbatim claim
   * CAN cover. On this repository's own history this is 4.7% of one
   * generation, so it is not a rounding concern.
   */
  generatedSeparatorChars: number
  /**
   * `finalChars - coveredChars`: characters of the finished work that no
   * span covers, so they are in no class and in no percentage. The
   * final-side twin of `generatedSeparatorChars`.
   */
  finalSeparatorChars: number
  /** `byClass.survived_mutated.chars` — final characters inside edited spans */
  mutatedFinalChars: number
  /**
   * Final characters inside `survived_mutated` spans beyond the generation
   * extent each one claims, summed. These are characters the person wrote
   * while keeping the span, so `mutatedFinalChars` is not a measure of what
   * the model contributed and must not be read as one. Zero means every
   * edit in the record shortened or rewrote at equal length.
   */
  mutatedAddedChars: number
  /**
   * Correction loops, regressions and one-shot corrections in this record —
   * the entries `SIGNAL_QUOTE_GROUNDED` walks. Reported because the bound is
   * vacuously true on a record with no signals, and both fixtures committed
   * to this repository are exactly that: a gate that checked nothing has to
   * say so, or "no violations" reads as "the quotes are grounded".
   */
  signalEntries: number
  /** quote references checked across those entries */
  signalQuotes: number
  /**
   * Signal entries carrying no quote reference at all. Legitimate for a
   * distilled spec, which states what was wanted in the detector's words
   * rather than the user's (src/hq/fixtures.ts has three). Not legitimate
   * for anything `loops.ts` or `signals.ts` produces, since both quote
   * verbatim — so a non-zero count on a record written by `ursa run` is a
   * defect this measurement is the only thing that would show.
   */
  signalEntriesWithoutQuote: number
  /**
   * `survived_mutated` spans carrying a descent verdict
   * (src/corroborate.ts). Zero on a record resolved with no corroborator,
   * which every chat-path record is, and which is why this is a
   * measurement: "no violations" on such a record means the bound was
   * vacuous, not that the mutation labels were checked.
   */
  descentChecked: number
  /**
   * Of those, the ones the search could not settle — `basis: 'unverified'`.
   * The label stands on these and is unguarded. A buyer who wants only
   * corroborated corrections filters on exactly this number, so it is
   * reported rather than left to be recomputed from the spans.
   */
  descentUnverified: number
  /**
   * Spans demoted to `no_generation_provenance` because a commit outside
   * the generation's descent held their text verbatim. Each one is a
   * word-level diff the record would otherwise have sold as the user's
   * correction, so a non-zero count here is the bound earning its place.
   */
  descentDemoted: number
  /**
   * Paths in `record.exclusions` — files the episode touched and the run
   * refused to classify. A measurement and not a bound, because zero is the
   * normal answer: most episodes import nothing. Reported because a
   * reviewer cannot otherwise tell a record that asked the question from
   * one whose capture path never could.
   */
  excludedPaths: number
  /**
   * Characters in those files, summed. This is the quantity that left this
   * record's survival and discard figures by being excluded, so it is the
   * number a reader needs to compare one run against an earlier one.
   */
  excludedChars: number
  /**
   * `stats.finalChars + excludedChars`: characters in every path the run was
   * willing to read, classified and refused together. The reconciliation
   * `excludedChars` exists for — a record whose excluded count cannot be
   * added back to the finished size is a record whose exclusions have
   * drifted from the files they describe.
   */
  consideredChars: number
}

const BOUNDS: Record<InvariantCode, string> = {
  CLAIM_NOT_WIDER:
    'a survived_verbatim final span is no wider than the generation extent it claims: span.end - span.start <= source.end - source.start. Verbatim means byte-identical, so the two extents describe the same characters. A survived_mutated span is exempt, because an edit may add text the generation never contained.',
  CLAIM_IN_GENERATION:
    'a source pointer names a generation that exists and an extent inside that generation\'s text: 0 <= start < end <= text.length',
  GEN_SPANS_PARTITION_ORDER:
    'a generation\'s spans are ordered, non-overlapping, inside its text, and each span.text is exactly text.slice(start, end)',
  GEN_CHARS_CONSISTENT:
    'a generation\'s character counts agree: totalChars = sum of span extents, charsWritten = text.length, separatorChars = charsWritten - totalChars',
  GEN_SURVIVED_BOUNDED:
    'a generation\'s surviving characters are a subset of its segment characters, which are a subset of what it wrote: survivedChars <= totalChars <= charsWritten',
  GEN_CLAIM_BOUNDED:
    'the characters of one generation claimed by final spans, counted once each, do not exceed what that generation wrote: claimed <= charsWritten',
  DELETION_SPLIT_EXACT:
    'the deletion split is exact and non-negative: humanDeletedChars + mergeDeletedChars + unknownDeletedChars = deletedChars = totalChars - survivedChars - notGeneratedChars. The last term is the characters of generation segments whose fate is `not_generated` — text the file already held at the generation\'s parent, which the model did not produce and the person therefore did not discard. It is inside totalChars because totalChars is the sum of segment extents and the fates must add up to it, and it is outside the deletion split because nothing destroyed it.',
  FINAL_SPANS_IN_FILE:
    'a final file\'s spans are ordered, non-overlapping, inside its text, and each span.text is exactly text.slice(start, end)',
  COVERED_BOUNDED:
    'classified characters are a subset of the finished work: coveredChars = sum of final span extents <= finalChars',
  RATES_MATCH_FIELDS:
    'every stored rate equals its own numerator over its own denominator, rounded to three places',
  PCT_DENOMINATORS_ORDERED:
    'a class\'s share of the finished work is never larger than its share of the classified part: byClass[c].pctOfFinal <= byClass[c].pct. The two fields differ only in denominator — coveredChars for pct, finalChars for pctOfFinal — and COVERED_BOUNDED already holds coveredChars <= finalChars, so the bound is the same-set statement that the wider denominator produced the smaller number. It fires when the two are computed from each other\'s denominator, which is the one way a reader could be handed the flattering figure under the honest field\'s name.',
  PERFILE_ENUMERATES_PATHS:
    'the paths in stats.perFile are exactly the paths in files[] together with the paths in exclusions[], each appearing once. perFile is the array a consuming pipeline iterates, so a path the run read and this array omits is a gap no iteration can see; a path here that the record does not carry under either key is a row pointing at nothing. Exact equality rather than containment in one direction, because both failures are silent in the same way.',
  SIGNAL_QUOTE_GROUNDED:
    'every QuoteRef a signal carries names raw text that exists in this record, the excerpt appears in that text under excerpt()\'s whitespace normalization, and the same excerpt appears in the signal\'s own prose field. A signal may legitimately carry no QuoteRef at all (a distilled spec quotes nobody); what it may not do is carry one that does not hold.',
  EXCLUSION_NOT_CLASSIFIED:
    'no path the record excludes appears among its classified files; every exclusion names a commit and a positive character count; and an exclusion that states its commit\'s author date states one that can be ordered, with a `sibling` exclusion\'s date no later than the record\'s own `task.generatedAt`. The first clause is the same-set arithmetic this module exists for: `exclusions` and `files` partition the paths the run was willing to read, so a path in both means the refusal was computed and then not applied, and the record simultaneously claims the file is an import and sells labels over its spans. The second catches an exclusion that cannot be reconciled against the figures it moved — `stats.finalChars` plus the excluded characters is the size of every path the run read, and an entry with no number or no commit breaks that sum silently. The third is `RIVAL_NOT_AFTER_FINAL` one level up, added 2026-10-15, and it is the more expensive of the two to get wrong: a span-level mistake moves one span, while an exclusion drops a whole file out of every figure in the record, and on this repository\'s own history one exclusion removed 60,616 characters, 84.7% of that run\'s headline survival figure. A `sibling` exclusion asserts the finished file is byte-identical to a copy on a branch that is neither an ancestor nor a descendant of the generation; if that branch\'s commit was authored after the work closed then the copy is a copy OF this work rather than a source for it, the refusal is backwards, and the record drops a file the person did write. `pre_existing` and `declared` are exempt from the ordering and reported without a time check, for the reasons `RIVAL_NOT_AFTER_FINAL` exempts the relations the graph vouches for: a `pre_existing` match is an ancestor of the generation whatever a rebase did to its author date, and a `declared` import names a commit in ANOTHER repository, whose clock is not comparable to this one\'s. An unreadable date fails on every relation including the exempt ones, because a field that reads as provenance everywhere it is printed may not state a time nothing can order, and omitting it was always allowed. An ABSENT date is legal and unchecked: every record written before 2026-10-15 has exclusions with no date, and `vendoredPaths` in src/vendored.ts omits the field rather than writing an empty string when a clone cannot answer.',
  DESCENT_CHECKED_UNIFORMLY:
    'if any span in the record carries a descent verdict, every survived_mutated span carries one; no span still labelled survived_mutated carries a `rival` verdict; and no span still labelled survived_verbatim carries a `prior_revision` rival verdict. The first clause catches a corroborator wired for some files and not others, which would leave part of the record\'s mutation labels unguarded while the record as a whole looks checked. The second catches the demotion being computed and then not applied, which is the only way a span can both name the rival that disproves its descent and keep the diff that asserts it. The third is the same failure on the survival label, added 2026-10-14: a verbatim span whose text the generation\'s own PARENT already held is not text a model wrote, since a generation on the `ursa run` path is the whole blob of the touched file and contains everything the file already had. Only `prior_revision` fires, because it is the only relation that dates the text earlier than the generation; `sibling`, `merged_in` and the older-ancestor `pre_existing` say the text exists elsewhere too, which is not the same claim.',
  RESOLVER_IDENTIFIED:
    'if a record names the resolver that made its claims, the name is one a reader can look up. A `git_commit` basis carries a `commit` of 7 to 40 lowercase hexadecimal characters (the shape `git rev-parse --short HEAD` emits) and a `dirty` boolean saying whether the tree that ran had uncommitted changes; a `bundle_digest` basis carries a `digest` of exactly 16 lowercase hexadecimal characters (the SHA-256 prefix `npm run bundle:check` compares against); and no third basis exists. An ABSENT `task.resolvedBy` is legal and unchecked, because absence is a true claim — it says nobody could establish which code ran, which is a different statement from naming code, and every record this project wrote before 2026-10-12 makes it. This is a shape bound and not an arithmetic one, in register with the second clause of EXCLUSION_NOT_CLASSIFIED: both ask whether a commit the record names is a commit at all, because a pointer that cannot be followed is indistinguishable from provenance until someone tries to follow it.',
  RIVAL_NOT_AFTER_FINAL:
    'if a descent verdict names a `sibling` rival and states that commit\'s author date, the date is not later than the record\'s own `task.generatedAt`; and any rival\'s stated date, whatever the relation, is one `Date.parse` can read. `sibling` is the relation whose claim rests on a clock: it says the text was on a branch the person MAY have merged or checked out, and nothing in the commit graph places that branch inside the work, so a commit authored after the work finished cannot be where the text came from. The other three relations are exempt by name and reported without a time check, because the graph vouches for them — `prior_revision` and `pre_existing` are ancestors of the generation, `merged_in` is an ancestor of the episode\'s final commit — and a rebase or a wrong machine clock can put a late author date on any of them without touching the claim. Exempting them is what makes this an invariant rather than a measurement under this module\'s second rule: while `merged_in` was folded into `sibling` (before 2026-10-15) no bound could police a sibling\'s date without also firing on records whose evidence had already been proven by the graph. An ABSENT date is legal and unchecked, because every record written before 2026-10-15 carries rivals with no date and because `prior_revision` reads the parent off an in-memory commit graph a narrowed caller can hold without dates — the same absent-is-a-true-claim rule `RESOLVER_IDENTIFIED` follows. On the git path `task.generatedAt` is the episode\'s closing commit date (`ep.closedAt` in src/resolve-episode.ts), which is exactly the horizon `authoredAfterHorizon` in src/corroborate.ts bounds the search by, so this bound is that resolver-side rule restated over the record alone and a record that fails it is a record the resolver would not have written.',
  GATE_IDENTIFIED:
    'if a record names the bound set its claims were checked against, the name is one that can be compared. `task.gatedBy.codes` is a non-empty array of distinct bound codes in the shape this module declares them (uppercase letters, digits and underscores, starting with a letter), `task.gatedBy.boundsDigest` is exactly 16 lowercase hexadecimal characters, and a record whose digest equals the CHECKING resolver\'s own digest carries exactly the checking resolver\'s codes. That last clause is the only one with teeth beyond shape, and it is the one the field was added for: a digest is a claim about which rules applied, so a record asserting this build\'s rule set while listing fewer rules than this build has is a record a bound was dropped from, and dropping one quietly is the failure `task.resolvedBy` alone could not catch. Membership is deliberately NOT checked, in the other direction: a record whose digest differs names the bounds of the resolver that wrote it, which on a record from a later build includes codes this one has never heard of, and refusing that record would make every bound added after it a gate against its own future. An ABSENT `task.gatedBy` is legal and unchecked, for the reason `RESOLVER_IDENTIFIED` gives — absence says nothing stamped this record, which every record written before 2026-10-16 says truthfully. Present is NOT a claim that the record passed: both launches write records before the gate runs (`gateRecords` in src/launch.ts), so each of the twenty-three records in fixtures/violations/ names this bound set and is refused by it.',
}

const r3 = (x: number) => Math.round(x * 1000) / 1000

/** a violation message quotes the offending string; 60 chars is enough to find it */
const abbrev = (s: string) => (s.length > 60 ? s.slice(0, 60) + '…' : s)

/**
 * An arbitrary JSON value quoted into a violation message.
 *
 * `JSON.stringify` returns the VALUE `undefined` rather than a string for
 * `undefined` and for a function, so `abbrev(JSON.stringify(x))` throws on
 * exactly the input RESOLVER_IDENTIFIED exists to report: a record whose
 * `dirty` flag or `basis` key is simply missing. Found by the unit case for
 * that bound before it was ever committed, which is the whole reason the
 * bound has unit cases beside its fixture.
 */
const quoted = (x: unknown) => abbrev(JSON.stringify(x) ?? String(x))

function claimsByGeneration(
  files: FinalFile[],
  include: (s: FinalSpan) => boolean,
): Map<number, Array<[number, number]>> {
  const byGen = new Map<number, Array<[number, number]>>()
  for (const f of files) {
    for (const s of f.spans) {
      if (!s.source || !include(s)) continue
      const arr = byGen.get(s.source.generationIndex)
      if (arr) arr.push([s.source.start, s.source.end])
      else byGen.set(s.source.generationIndex, [[s.source.start, s.source.end]])
    }
  }
  return byGen
}

/**
 * Every quoting signal in a record, flattened to one shape: the prose field a
 * lab actually reads, and the quote references attached to it. Written as a
 * generator over the three arrays rather than three near-identical loops,
 * because the three differ only in which field carries the prose and a fourth
 * signal type that quotes is a matter of when, not if.
 */
function* quotingSignals(
  signals: LabSignals,
): Generator<{ where: string; prose: string; quotes: QuoteRef[] }> {
  for (const [i, l] of signals.correctionLoops.entries()) {
    yield {
      where: `signals.correctionLoops[${i}] (${l.id}) discoveredSpec`,
      prose: l.discoveredSpec,
      quotes: l.quotes ?? [],
    }
  }
  for (const [i, r] of signals.regressions.entries()) {
    yield {
      where: `signals.regressions[${i}] (step ${r.step}) evidence`,
      prose: r.evidence,
      quotes: r.quotes ?? [],
    }
  }
  for (const [i, c] of signals.oneShotCorrections.entries()) {
    yield {
      where: `signals.oneShotCorrections[${i}] (step ${c.step}) text`,
      prose: c.text,
      quotes: c.quotes ?? [],
    }
  }
}

/**
 * The raw text one `QuoteRef` names, or a sentence saying why this record
 * does not contain it. A string return is the text; an `Error` is the
 * unresolvable case, which is a violation in its own right — an excerpt whose
 * source cannot be found is not a grounded quote, it is an assertion.
 */
function rawTextFor(record: OutcomeRecord, q: QuoteRef): string | Error {
  if (q.of === 'user_prompt') {
    if (q.conversationId === undefined || q.step === undefined) {
      return new Error('of=user_prompt needs both conversationId and step')
    }
    const conv = record.conversations.find((c) => c.id === q.conversationId)
    if (!conv) {
      return new Error(`no conversation ${q.conversationId} in this record (has ${record.conversations.map((c) => c.id).join(', ') || 'none'})`)
    }
    if (!conv.prompts) {
      return new Error(`conversation ${q.conversationId} carries no prompts[], so the quote cannot be re-read from this record`)
    }
    const prompt = conv.prompts.find((p) => p.step === q.step)
    if (!prompt) {
      return new Error(`conversation ${q.conversationId} has no prompt at step ${q.step} (steps present: ${conv.prompts.map((p) => p.step).join(', ') || 'none'})`)
    }
    return prompt.text
  }

  if (q.of === 'generation') {
    if (q.generationIndex === undefined) {
      return new Error('of=generation needs generationIndex, the record\'s own address for a generation')
    }
    const gen = record.generations[q.generationIndex]
    if (!gen || gen.generationIndex !== q.generationIndex) {
      return new Error(`no generation at index ${q.generationIndex} (record has ${record.generations.length})`)
    }
    if (q.step !== undefined && gen.turnIndex !== q.step) {
      return new Error(`generation ${q.generationIndex} is at turnIndex ${gen.turnIndex}, the quote claims step ${q.step}`)
    }
    return gen.text
  }

  if (q.filePath === undefined) return new Error('of=final_span needs filePath')
  const file = record.files.find((f) => f.path === q.filePath)
  if (!file) {
    return new Error(`no file ${q.filePath} in this record (has ${record.files.map((f) => f.path).join(', ') || 'none'})`)
  }
  return file.text
}

/**
 * Every violated invariant on one record, in the order the invariants are
 * declared above. An empty array means the record's own arithmetic is
 * self-consistent; it does not mean the labels are right.
 */
/**
 * How many bounds a record is checked against.
 *
 * Derived from `BOUNDS` rather than written as a word, because the written
 * word went stale twice without anybody noticing. `README.md` and three
 * design documents said "thirteen" on 2026-10-10, when
 * `EXCLUSION_NOT_CLASSIFIED` had been the fifteenth for four days and
 * `docs/design/record-exclusions.md` §4.1 still called it "the thirteenth
 * bound" from the day it was the thirteenth. The number is now reported to
 * a user in the CI run comment (`src/ci/comment.ts`), and a run that tells
 * a buyer how many checks it passed must not get the count wrong.
 */
export const BOUND_COUNT = Object.keys(BOUNDS).length

/**
 * Every bound's code, in the order they are declared.
 *
 * Exported for the same reason as `BOUND_COUNT`, one step further on. The
 * count caught a stale word in four documents; this list is what lets a test
 * catch a bound with no counterexample behind it. `fixtures/violations/`
 * holds one committed record per code, and
 * `src/invariants.violations.test.ts` asserts the set of codes those
 * fixtures fire equals this array — so adding a sixteenth bound without a
 * record that breaks it fails the suite instead of passing quietly.
 */
export const BOUND_CODES = Object.keys(BOUNDS) as InvariantCode[]

/**
 * The bound set this build carries, as a record stamps it into
 * `task.gatedBy` (`saveRecord` in src/store.ts).
 *
 * WHY THE DIGEST IS COMPUTED HERE rather than in a module of its own, which
 * is where `ResolverIdentity` is computed. A digest in another file needs
 * `BOUNDS` exported, and an exported `BOUNDS` is a second place that can
 * disagree with this one about what the bound set is — which is the whole
 * class of defect `BOUND_COUNT` and `BOUND_CODES` exist to close, after
 * four documents carried the word "thirteen" for four days. The hash and
 * the thing hashed stay in one scope.
 *
 * WHAT IS HASHED, exactly, because a digest whose input is unstated is a
 * number nobody can reproduce. Each bound contributes its code, a newline,
 * its statement text, and a newline; the bounds are concatenated in
 * CODE-ALPHABETICAL order, not declaration order; the result is UTF-8 and
 * its SHA-256 is truncated to 16 hex characters. The command that
 * reproduces it, from `ursa-major/`:
 *
 *     npx tsx -e "import('./src/invariants').then(m => console.log(m.currentGateIdentity().boundsDigest))"
 *
 * Alphabetical and not declaration order for one reason: declaration order
 * is an editorial choice in this file, and moving a bound up the list
 * changes nothing about what a record was checked for. A digest that moved
 * on a reorder would report a rule change where there was none, and the
 * only reading a consumer can make of the digest is "same rules or not".
 * Declaration order still matters and is still shipped — `codes` carries
 * it, and `checkRecord` reports violations in it.
 *
 * The statement text is inside the hash, not just the code. A bound whose
 * name stays and whose sentence is rewritten is the change this field is
 * least able to afford missing, because it is invisible in `codes` and it
 * is exactly what happened to `CLAIM_NOT_WIDER` on 2026-10-13: the code
 * did not move and what the bound checked went from comparing two extents'
 * lengths to comparing their bytes.
 */
export function currentGateIdentity(): GateIdentity {
  const canonical = [...BOUND_CODES]
    .sort()
    .map((code) => `${code}\n${BOUNDS[code]}\n`)
    .join('')
  return {
    codes: [...BOUND_CODES],
    boundsDigest: createHash('sha256').update(canonical, 'utf8').digest('hex').slice(0, 16),
  }
}

/**
 * Where two strings that should be identical stop being identical, with a
 * short window of each side. The window is what makes a CLAIM_NOT_WIDER
 * message actionable: `"e it, and"` against `"e it,\n  and"` names the reflow
 * on sight, where "not the same characters" sends the reader to the record.
 */
function firstDifference(final: string, generation: string, window = 10): {
  offset: number
  final: string
  generation: string
} {
  let i = 0
  while (i < final.length && i < generation.length && final[i] === generation[i]) i++
  const from = Math.max(0, i - window)
  return {
    offset: i,
    final: final.slice(from, i + window),
    generation: generation.slice(from, i + window),
  }
}


export function checkRecord(record: OutcomeRecord): Violation[] {
  const out: Violation[] = []
  const id = record.task.id
  const push = (code: InvariantCode, where: string, observed: string) =>
    out.push({ code, invariant: BOUNDS[code], where: `${id} ${where}`.trim(), observed })

  const gens: GenerationRecord[] = record.generations

  // Final-side spans, and the claims they make on generations.
  for (const f of record.files) {
    let prevEnd = 0
    for (const [i, s] of f.spans.entries()) {
      const at = `file ${f.path} span ${i} [${s.start},${s.end})`
      if (s.start < prevEnd || s.start > s.end || s.end > f.text.length) {
        push('FINAL_SPANS_IN_FILE', at,
          `previous span ended at ${prevEnd}, file is ${f.text.length} chars`)
      } else if (s.text !== f.text.slice(s.start, s.end)) {
        push('FINAL_SPANS_IN_FILE', at,
          `span.text is ${s.text.length} chars, text.slice(${s.start}, ${s.end}) is ${f.text.slice(s.start, s.end).length}`)
      }
      prevEnd = Math.max(prevEnd, s.end)

      if (!s.source) continue
      const gi = s.source.generationIndex
      const gen = gens[gi]
      if (!gen || gen.generationIndex !== gi) {
        push('CLAIM_IN_GENERATION', at,
          `source.generationIndex ${gi}, record has ${gens.length} generations`)
        continue
      }
      if (s.source.start < 0 || s.source.start >= s.source.end || s.source.end > gen.text.length) {
        push('CLAIM_IN_GENERATION', at,
          `claims [${s.source.start},${s.source.end}) of a generation ${gen.text.length} chars long`)
      }
      // Verbatim only. The first version of this check applied to every
      // span with a source and failed immediately on a mutated span 82
      // chars long matched to a 75-char generation segment: the person had
      // edited "holds it whole" into "holds the whole of it" and added
      // seven characters. The span is not lying, the edit really is wider
      // than what it edited, and that is the correction. What the seven
      // characters do break is the reading of `byClass.survived_mutated.
      // chars` as a model contribution — `measure()` reports them as
      // `mutatedAddedChars`, and the modelling question is a ledger entry
      // rather than a bound, because it changes a figure Ursa Minor sells.
      //
      // Width was all this bound checked until 2026-10-13, while its own
      // sentence said byte-identical. The gap between the two sentences was
      // not academic: a case change, an em dash retyped as a hyphen and a
      // doubled space all leave the width alone or nearly alone, so the
      // bound could only ever catch the reflow that happened to add
      // characters. It caught exactly one, on record
      // `ursa-2026-10-07-2f610e9`, and that is how the resolver's
      // normalized-match labelling was found at all. The check is now the
      // sentence: the characters have to be the same characters. Width is
      // subsumed, because equal strings have equal length.
      if (s.class === 'survived_verbatim') {
        const finalLen = s.end - s.start
        const srcLen = s.source.end - s.source.start
        const claimed = gen.text.slice(s.source.start, s.source.end)
        if (finalLen > srcLen) {
          push('CLAIM_NOT_WIDER', at,
            `${finalLen} final chars credited to a ${srcLen}-char generation extent, ${finalLen - srcLen} too many`)
        } else if (claimed !== s.text) {
          const d = firstDifference(s.text, claimed)
          push('CLAIM_NOT_WIDER', at,
            `${finalLen} final chars and the ${srcLen}-char generation extent they claim are not the same characters, ` +
            `first differing at offset ${d.offset}: final ${JSON.stringify(d.final)}, generation ${JSON.stringify(d.generation)}`)
        }
      }
    }
  }

  // Generation-side spans and counts.
  for (const g of gens) {
    const at = `generation ${g.generationIndex}${g.filePath ? ` (${g.filePath})` : ''}`
    let prevEnd = 0
    let segmentChars = 0
    for (const [i, s] of g.spans.entries()) {
      if (s.start < prevEnd || s.start > s.end || s.end > g.text.length) {
        push('GEN_SPANS_PARTITION_ORDER', `${at} span ${i} [${s.start},${s.end})`,
          `previous span ended at ${prevEnd}, generation is ${g.text.length} chars`)
      } else if (s.text !== g.text.slice(s.start, s.end)) {
        push('GEN_SPANS_PARTITION_ORDER', `${at} span ${i} [${s.start},${s.end})`,
          `span.text is ${s.text.length} chars, text.slice(${s.start}, ${s.end}) is ${g.text.slice(s.start, s.end).length}`)
      }
      prevEnd = Math.max(prevEnd, s.end)
      segmentChars += s.end - s.start
    }
    if (g.totalChars !== segmentChars || g.charsWritten !== g.text.length
      || g.separatorChars !== g.charsWritten - g.totalChars) {
      push('GEN_CHARS_CONSISTENT', at,
        `totalChars ${g.totalChars} vs span extents ${segmentChars}; charsWritten ${g.charsWritten} vs text.length ${g.text.length}; separatorChars ${g.separatorChars} vs ${g.charsWritten - g.totalChars}`)
    }
    if (g.survivedChars > g.totalChars || g.totalChars > g.charsWritten) {
      push('GEN_SURVIVED_BOUNDED', at,
        `survivedChars ${g.survivedChars}, totalChars ${g.totalChars}, charsWritten ${g.charsWritten}`)
    }
    if (r3(g.totalChars ? g.survivedChars / g.totalChars : 0) !== g.survivalRate) {
      push('RATES_MATCH_FIELDS', at,
        `survivalRate ${g.survivalRate}, but ${g.survivedChars}/${g.totalChars} is ${r3(g.totalChars ? g.survivedChars / g.totalChars : 0)}`)
    }
  }

  const allClaims = claimsByGeneration(record.files, () => true)
  for (const [gi, intervals] of allClaims) {
    const gen = gens[gi]
    if (!gen) continue
    const claimed = mergedLength(intervals)
    if (claimed > gen.charsWritten) {
      push('GEN_CLAIM_BOUNDED', `generation ${gi}${gen.filePath ? ` (${gen.filePath})` : ''}`,
        `${claimed} distinct chars claimed by final spans, generation wrote ${gen.charsWritten}`)
    }
  }

  // Stats-level arithmetic.
  const st = record.stats
  const gen = st.generated
  const split = gen.humanDeletedChars + gen.mergeDeletedChars + gen.unknownDeletedChars
  // `notGeneratedChars` joined this subtraction on 2026-10-14. Segments the
  // file already held at the generation's parent sit inside `totalChars`
  // and are neither survival nor deletion, so leaving them out of the
  // right-hand side would push every character of the file the agent opened
  // into the human discard rate — the figure Ursa Minor actually sells.
  const notGenerated = gen.notGeneratedChars ?? 0
  const expectedDeleted = gen.totalChars - gen.survivedChars - notGenerated
  if (split !== gen.deletedChars || gen.deletedChars !== expectedDeleted
    || gen.humanDeletedChars < 0 || gen.mergeDeletedChars < 0 || gen.unknownDeletedChars < 0
    || notGenerated < 0) {
    push('DELETION_SPLIT_EXACT', 'stats.generated',
      `human ${gen.humanDeletedChars} + merge ${gen.mergeDeletedChars} + unknown ${gen.unknownDeletedChars} = ${split}, deletedChars ${gen.deletedChars}, totalChars - survivedChars - notGeneratedChars(${notGenerated}) = ${expectedDeleted}`)
  }

  const spanExtentSum = record.files.reduce(
    (a, f) => a + f.spans.reduce((b, s) => b + (s.end - s.start), 0), 0,
  )
  if (st.coveredChars !== spanExtentSum || st.coveredChars > st.finalChars) {
    push('COVERED_BOUNDED', 'stats',
      `coveredChars ${st.coveredChars}, span extents ${spanExtentSum}, finalChars ${st.finalChars}`)
  }

  const rateChecks: Array<[string, number, number, number]> = [
    ['generated.deletedPct', gen.deletedChars, gen.totalChars, gen.deletedPct],
    ['generated.humanDeletedPct', gen.humanDeletedChars, gen.totalChars, gen.humanDeletedPct],
  ]
  for (const [name, num, den, stored] of rateChecks) {
    const actual = r3(den ? num / den : 0)
    if (actual !== stored) {
      push('RATES_MATCH_FIELDS', `stats.${name}`,
        `stored ${stored}, but ${num}/${den} is ${actual}`)
    }
  }
  for (const c of record.stats.perConversation) {
    const actual = r3(c.generatedChars ? c.survivedChars / c.generatedChars : 0)
    if (actual !== c.survivalRate) {
      push('RATES_MATCH_FIELDS', `stats.perConversation ${c.conversationId}`,
        `survivalRate ${c.survivalRate}, but ${c.survivedChars}/${c.generatedChars} is ${actual}`)
    }
  }
  // Signals — the block Ursa Minor sells. Ten bounds above read `files`,
  // `generations` and `stats`; this one reads the quotes, because a wrong
  // number is an arithmetic defect and a misquote of the user is a trust
  // incident (CLAUDE.md §5: the primary asset can be destroyed in a week).
  if (record.signals) {
    for (const sig of quotingSignals(record.signals)) {
      for (const [qi, q] of sig.quotes.entries()) {
        const at = `${sig.where} quote ${qi} (of=${q.of})`
        const raw = rawTextFor(record, q)
        if (raw instanceof Error) {
          push('SIGNAL_QUOTE_GROUNDED', at, `unresolvable: ${raw.message}`)
          continue
        }
        if (!isExcerptOf(q.text, raw)) {
          push('SIGNAL_QUOTE_GROUNDED', at,
            `quote ${JSON.stringify(abbrev(q.text))} does not appear in the ${raw.length}-char text it names`)
        }
        if (!sig.prose.includes(q.text)) {
          push('SIGNAL_QUOTE_GROUNDED', at,
            `quote ${JSON.stringify(abbrev(q.text))} is not present in the prose field a reader sees, so the two can disagree`)
        }
      }
    }
  }

  const classes: SpanClass[] = ['survived_verbatim', 'survived_mutated', 'no_generation_provenance']
  for (const c of classes) {
    const actual = r3(st.coveredChars ? st.byClass[c].chars / st.coveredChars : 0)
    if (actual !== st.byClass[c].pct) {
      push('RATES_MATCH_FIELDS', `stats.byClass.${c}.pct`,
        `stored ${st.byClass[c].pct}, but ${st.byClass[c].chars}/${st.coveredChars} is ${actual}`)
    }
    const actualOfFinal = r3(st.finalChars ? st.byClass[c].chars / st.finalChars : 0)
    if (actualOfFinal !== st.byClass[c].pctOfFinal) {
      push('RATES_MATCH_FIELDS', `stats.byClass.${c}.pctOfFinal`,
        `stored ${st.byClass[c].pctOfFinal}, but ${st.byClass[c].chars}/${st.finalChars} is ${actualOfFinal}`)
    }
    // The ordering of the two denominators, checked separately from each
    // field matching its own arithmetic. A record can have both fields
    // internally consistent and still be built the wrong way round, if the
    // two divisions were swapped at the point they were computed; then each
    // field equals a real ratio and the one a lab reads first is the
    // flattering one. Rounding cannot invert the order, since r3 is
    // monotonic, so an equal pair is legal and only a strict inversion
    // fires.
    if (st.byClass[c].pctOfFinal > st.byClass[c].pct) {
      push('PCT_DENOMINATORS_ORDERED', `stats.byClass.${c}`,
        `pctOfFinal ${st.byClass[c].pctOfFinal} > pct ${st.byClass[c].pct}, with coveredChars ${st.coveredChars} and finalChars ${st.finalChars}`)
    }
  }

  // The row list against the two path lists it is built from. This is the
  // same-set arithmetic of EXCLUSION_NOT_CLASSIFIED read from the other
  // side: that bound says `files` and `exclusions` do not overlap, this one
  // says `perFile` loses neither of them.
  const readPaths = [...record.files.map((f) => f.path), ...(record.exclusions ?? []).map((x) => x.path)]
  const rowPaths = st.perFile.map((r) => r.path)
  const missing = readPaths.filter((pth) => !rowPaths.includes(pth))
  const extra = rowPaths.filter((pth) => !readPaths.includes(pth))
  const duplicated = rowPaths.filter((pth, i) => rowPaths.indexOf(pth) !== i)
  if (missing.length > 0 || extra.length > 0 || duplicated.length > 0) {
    push('PERFILE_ENUMERATES_PATHS', 'stats.perFile',
      `${rowPaths.length} row${rowPaths.length === 1 ? '' : 's'} against ${record.files.length} classified + ${(record.exclusions ?? []).length} excluded path${readPaths.length === 1 ? '' : 's'}`
      + (missing.length > 0 ? `; no row for ${missing.map((pth) => JSON.stringify(pth)).join(', ')}` : '')
      + (extra.length > 0 ? `; row for unknown path ${extra.map((pth) => JSON.stringify(pth)).join(', ')}` : '')
      + (duplicated.length > 0 ? `; repeated row for ${duplicated.map((pth) => JSON.stringify(pth)).join(', ')}` : ''))
  }

  // Descent — the guard on the one label that carries a `diff`, and so the
  // only bound here that is about whether a claim was CHECKED rather than
  // about whether two numbers agree. See src/corroborate.ts.
  const descentSpans: Array<{ where: string; span: FinalSpan; descent: DescentEvidence }> = []
  const mutatedWithout: string[] = []
  for (const f of record.files) {
    for (const [i, s] of f.spans.entries()) {
      const at = `file ${f.path} span ${i} [${s.start},${s.end})`
      if (s.descent) descentSpans.push({ where: at, span: s, descent: s.descent })
      else if (s.class === 'survived_mutated') mutatedWithout.push(at)
    }
  }
  if (descentSpans.length > 0 && mutatedWithout.length > 0) {
    push('DESCENT_CHECKED_UNIFORMLY', mutatedWithout[0],
      `${descentSpans.length} spans carry a descent verdict, ${mutatedWithout.length} survived_mutated spans carry none`)
  }
  for (const d of descentSpans) {
    if (d.span.class === 'survived_mutated' && d.descent.basis === 'rival') {
      push('DESCENT_CHECKED_UNIFORMLY', d.where,
        `labelled survived_mutated while naming ${d.descent.relation} rival ${d.descent.sha} as holding the span's text verbatim`)
    }
    // The same failure on the other label (added 2026-10-14). Only
    // `prior_revision` fires here, because it is the only relation that
    // places the text in the file BEFORE the generation existed, and that
    // is what makes "generated and kept unchanged" false rather than
    // merely unproven. A verbatim span naming a `sibling` or an older
    // `pre_existing` ancestor keeps its label by design; see the
    // `verbatimClaim` comment in src/resolve.ts for why demoting on those
    // would destroy survival signal on weak evidence.
    if (d.span.class === 'survived_verbatim' && d.descent.basis === 'rival'
      && d.descent.relation === 'prior_revision') {
      push('DESCENT_CHECKED_UNIFORMLY', d.where,
        `labelled survived_verbatim while naming the generation's own parent ${d.descent.sha} as already holding the span's text`)
    }
  }

  // The time ordering a `sibling` descent claim depends on, checked
  // against the record's own clock. See `RIVAL_NOT_AFTER_FINAL` in BOUNDS
  // for the statement and src/corroborate.ts for the resolver-side rule
  // this one restates with nothing but the record in hand.
  //
  // Why only `sibling` is ordered. It is the only relation the commit
  // graph does not vouch for, and therefore the only one whose date is
  // part of the claim rather than a fact about it. The other three are
  // reachable from the generation or from the episode's final commit, so
  // they existed whatever their author dates say, and a rebase routinely
  // makes those dates say something wrong. Ordering them would make this a
  // bound a correct record can fail, which rule 2 at the top of this file
  // forbids, and it is precisely why `merged_in` was split out of
  // `sibling` on 2026-10-15: the set this bound polices had to be
  // nameable in the record before the bound could exist.
  //
  // Why the comparison is against `task.generatedAt` and not against the
  // generation's own timestamp. The stronger reading is available —
  // a sibling had to be available while the person was working, and the
  // work ends at `task.generatedAt` — and the generation's timestamp is
  // the wrong end of that interval: a person can legitimately branch
  // mid-episode, write text elsewhere and bring it in. src/corroborate.ts
  // makes the same choice for the same reason, which is what keeps the two
  // rules identical rather than merely similar.
  const finalMs = Date.parse(record.task.generatedAt)
  let datedSiblings = 0
  for (const d of descentSpans) {
    if (d.descent.basis !== 'rival') continue
    // Read as `unknown` for the reason RESOLVER_IDENTIFIED reads
    // `task.resolvedBy` that way: these records reach the gate through
    // `JSON.parse` off a directory somebody else wrote, where the declared
    // type is an assumption. A `date` of `1760000000` is reachable in a
    // file and unreachable in TypeScript.
    const date = (d.descent as { date?: unknown }).date
    if (date === undefined) continue
    const ms = typeof date === 'string' ? Date.parse(date) : Number.NaN
    // Unreadable dates fail on every relation, not just `sibling`. A
    // relation the graph vouches for still has no business stating a time
    // nothing can order: the field reads as provenance on every surface
    // that prints it, and a record whose dates are decorative is worse
    // than one that omits them, which it is allowed to do.
    if (Number.isNaN(ms)) {
      push('RIVAL_NOT_AFTER_FINAL', d.where,
        `rival ${d.descent.sha} (${d.descent.relation}) carries date ${quoted(date)}, which is not a date Date.parse can read, so the record states a time nothing can order against task.generatedAt ${record.task.generatedAt}`)
      continue
    }
    if (d.descent.relation !== 'sibling') continue
    datedSiblings++
    if (Number.isNaN(finalMs)) continue
    if (ms > finalMs) {
      push('RIVAL_NOT_AFTER_FINAL', d.where,
        `sibling rival ${d.descent.sha} authored ${date}, which is after task.generatedAt ${record.task.generatedAt}, so the record names a commit from its own future as already holding this span's text`)
    }
  }
  // One violation for the record rather than one per span: the fault is in
  // the single field every sibling is ordered against. Conditioned on
  // there being a sibling to order, because this bound has no standing to
  // police `task.generatedAt` in general — no other bound does, and a
  // record whose rivals are all graph-vouched never needs that field read.
  if (datedSiblings > 0 && Number.isNaN(finalMs)) {
    push('RIVAL_NOT_AFTER_FINAL', 'task.generatedAt',
      `${datedSiblings} sibling rival verdict${datedSiblings === 1 ? '' : 's'} carry a date and task.generatedAt is ${quoted(record.task.generatedAt)}, which is not a date Date.parse can read, so no sibling's date can be ordered against the work it is evidence about`)
  }

  // The file-level refusal, checked the way the span-level one is. The
  // failure this catches is the mirror of DESCENT_CHECKED_UNIFORMLY's
  // second clause: there, the demotion is computed and not applied to the
  // span; here, the exclusion is computed and not applied to the file. Both
  // produce a record that names its own counter-evidence and sells the
  // claim anyway, which is the one defect a buyer could catch before we do.
  const classified = new Set(record.files.map((f) => f.path))
  // Dated `sibling` exclusions, counted for the same reason `datedSiblings`
  // is counted above: the record-level complaint about an unreadable
  // `task.generatedAt` has standing only once something actually needs that
  // field ordered. Counted separately from the span-level tally because a
  // record can carry exclusions and no descent verdicts at all, and then
  // the span-level loop never runs.
  let datedSiblingExclusions = 0
  for (const [i, x] of (record.exclusions ?? []).entries()) {
    const at = `exclusions[${i}] (${x.path})`
    if (classified.has(x.path)) {
      const f = record.files.find((ff) => ff.path === x.path)!
      push('EXCLUSION_NOT_CLASSIFIED', at,
        `excluded as ${x.reason} from ${x.sha} and also present in files[] with ${f.spans.length} classified span${f.spans.length === 1 ? '' : 's'} over ${f.text.length} chars`)
    }
    if (x.chars <= 0 || x.sha.length === 0) {
      push('EXCLUSION_NOT_CLASSIFIED', at,
        `chars=${x.chars}, sha=${x.sha ? x.sha : '(empty)'}; stats.finalChars is ${record.stats.finalChars}, which this entry cannot be added back to`)
    }
    // The time clause, which is `RIVAL_NOT_AFTER_FINAL` one level up. Read
    // as `unknown` for the reason that bound reads a rival's date that way:
    // these records reach the gate through `JSON.parse` off a directory
    // somebody else wrote, so the declared type is an assumption and a
    // `date` of `1760000000` is reachable in a file.
    const date = (x as { date?: unknown }).date
    if (date === undefined) continue
    const ms = typeof date === 'string' ? Date.parse(date) : Number.NaN
    // Unreadable fails on every relation, exactly as it does for a rival:
    // an exempt relation still has no business stating a time nothing can
    // order, because the field reads as provenance on every surface that
    // prints it and omitting it was always allowed.
    if (Number.isNaN(ms)) {
      push('EXCLUSION_NOT_CLASSIFIED', at,
        `excluded as ${x.reason} from ${x.sha} (${x.relation}) carrying date ${quoted(date)}, which is not a date Date.parse can read, so the record states a time nothing can order against task.generatedAt ${record.task.generatedAt}`)
      continue
    }
    if (x.relation !== 'sibling') continue
    datedSiblingExclusions++
    if (Number.isNaN(finalMs)) continue
    if (ms > finalMs) {
      push('EXCLUSION_NOT_CLASSIFIED', at,
        `sibling copy ${x.sha} authored ${date}, which is after task.generatedAt ${record.task.generatedAt}, so the ${x.chars} chars of this file were dropped from every figure on the evidence of a commit from the record's own future`)
    }
  }
  // One violation for the record rather than one per exclusion, for the
  // reason the span-level twin above gives: the fault is in the single
  // field every sibling is ordered against.
  if (datedSiblingExclusions > 0 && Number.isNaN(finalMs)) {
    push('EXCLUSION_NOT_CLASSIFIED', 'task.generatedAt',
      `${datedSiblingExclusions} sibling exclusion${datedSiblingExclusions === 1 ? '' : 's'} carry a date and task.generatedAt is ${quoted(record.task.generatedAt)}, which is not a date Date.parse can read, so no excluded file's copy can be ordered against the work it was dropped from`)
  }

  // The resolver the record names, checked the way an exclusion's commit is.
  // Neither of those is arithmetic. Both ask the same question: is the thing
  // this record points at a thing a reader could go and find?
  //
  // Why absence is legal. `resolverIdentity()` returns `null` when there is
  // no git work tree and no readable bundle, and src/store.ts writes nothing
  // rather than writing a word like `unknown`, because "nobody could tell
  // which code ran" and "this code ran" are different claims and only the
  // second one is provenance (src/resolver-identity.ts, and
  // docs/design/resolver-identity.md §3.2). A bound requiring the field
  // would also make every record this project wrote before 2026-10-12
  // illegal, including both fixtures committed here.
  //
  // Why the field is read as `unknown` instead of as `ResolverIdentity`.
  // This is the only bound in the module that asks whether a value has the
  // SHAPE its type promises, and the records the gate runs on reach it
  // through `JSON.parse` off disk, where that type is an assumption and not
  // a guarantee — `runGate` in src/invariants.cli.ts reads a directory a
  // buyer or an earlier version of this resolver wrote. Narrowing through
  // the declared union first would make the malformed cases unreachable in
  // TypeScript while leaving them reachable in the file, which is the exact
  // trade the gate exists to refuse.
  const resolvedBy = record.task.resolvedBy as unknown
  if (resolvedBy !== undefined && resolvedBy !== null) {
    const at = 'task.resolvedBy'
    if (typeof resolvedBy !== 'object') {
      push('RESOLVER_IDENTIFIED', at,
        `the field is ${typeof resolvedBy} (${quoted(resolvedBy)}), not an object carrying a basis`)
    } else {
      const v = resolvedBy as Record<string, unknown>
      if (v.basis === 'git_commit') {
        // Lowercase only, 7 the shortest prefix `--short` emits and 40 the
        // full SHA-1 object id. A longer string is not a git object id and a
        // shorter one is not one a reader can resolve unambiguously.
        if (typeof v.commit !== 'string' || !/^[0-9a-f]{7,40}$/.test(v.commit)) {
          push('RESOLVER_IDENTIFIED', at,
            `basis git_commit names commit ${quoted(v.commit)}, which is not 7 to 40 lowercase hex characters, so it is not a commit id anyone can look up`)
        }
        if (typeof v.dirty !== 'boolean') {
          push('RESOLVER_IDENTIFIED', at,
            `basis git_commit carries dirty ${quoted(v.dirty)}, which is not a boolean, so the record does not say whether the tree that ran was the tree at that commit`)
        }
      } else if (v.basis === 'bundle_digest') {
        // Exactly 16, because `resolverIdentity()` writes
        // `digest.slice(0, 16)` of a SHA-256 and `npm run bundle:check`
        // compares the same prefix. A different length is a digest from
        // somewhere else, and the comparison a buyer would run against the
        // committed `dist/ursa.cjs` would silently never match.
        if (typeof v.digest !== 'string' || !/^[0-9a-f]{16}$/.test(v.digest)) {
          push('RESOLVER_IDENTIFIED', at,
            `basis bundle_digest names digest ${quoted(v.digest)}, which is not exactly 16 lowercase hex characters, so it cannot be compared against the bundle's own sha256 prefix`)
        }
      } else {
        push('RESOLVER_IDENTIFIED', at,
          `basis ${quoted(v.basis)}, which is neither git_commit nor bundle_digest, so nothing downstream knows what kind of identity this is`)
      }
    }
  }

  // GATE_IDENTIFIED. The second shape bound, and `as unknown` for the same
  // reason the first one is: this value reaches the gate through
  // `JSON.parse` off a directory somebody else wrote, so the declared type
  // is an assumption here and narrowing through it first would make every
  // malformed case unreachable in TypeScript and still reachable in the
  // file.
  const gatedBy = record.task.gatedBy as unknown
  if (gatedBy !== undefined && gatedBy !== null) {
    const at = 'task.gatedBy'
    if (typeof gatedBy !== 'object') {
      push('GATE_IDENTIFIED', at,
        `the field is ${typeof gatedBy} (${quoted(gatedBy)}), not an object carrying codes and a digest`)
    } else {
      const v = gatedBy as Record<string, unknown>
      const codes = v.codes
      let codesWellFormed = false
      if (!Array.isArray(codes)) {
        push('GATE_IDENTIFIED', at,
          `codes is ${quoted(codes)}, not an array, so the record does not list the bounds it was checked against`)
      } else if (codes.length === 0) {
        // Empty is a different defect from absent and is not the same claim.
        // Absent says nothing stamped this record. An empty array says a
        // resolver stamped it and carried no bounds at all, which no build of
        // this module can be: `BOUNDS` has never had fewer than ten entries.
        push('GATE_IDENTIFIED', at,
          'codes is an empty array, so the record names a resolver that checked it against no bounds; absence of the field is how "nothing stamped this" is written')
      } else {
        const bad = codes.filter((c) => typeof c !== 'string' || !/^[A-Z][A-Z0-9_]*$/.test(c))
        const dupes = [...new Set(codes.filter((c, i) => codes.indexOf(c) !== i))]
        if (bad.length > 0) {
          push('GATE_IDENTIFIED', at,
            `codes holds ${bad.length} of ${codes.length} entr${bad.length === 1 ? 'y' : 'ies'} that is not a bound code in this module's shape, the first being ${quoted(bad[0])}`)
        } else if (dupes.length > 0) {
          // Distinctness, because `codes` is read as a SET by every
          // comparison the field exists for, and a list with one code twice
          // has the same length as the honest list with one code missing.
          push('GATE_IDENTIFIED', at,
            `codes names ${quoted(dupes[0])} more than once, so its length is not the number of distinct bounds it claims`)
        } else {
          codesWellFormed = true
        }
      }

      const digest = v.boundsDigest
      // Exactly 16 lowercase hex, matching `currentGateIdentity()` above and
      // the `bundle_digest` prefix RESOLVER_IDENTIFIED checks. A digest of
      // any other length is from somewhere else, and the one comparison this
      // field supports would silently never match.
      const digestWellFormed = typeof digest === 'string' && /^[0-9a-f]{16}$/.test(digest)
      if (!digestWellFormed) {
        push('GATE_IDENTIFIED', at,
          `boundsDigest is ${quoted(digest)}, which is not exactly 16 lowercase hex characters, so it cannot be compared against another record's`)
      }

      // The clause with teeth. Only runs when both halves are well formed,
      // so a record with a malformed digest is reported once for the shape
      // rather than twice for the shape and the comparison it made
      // impossible.
      if (codesWellFormed && digestWellFormed) {
        const mine = currentGateIdentity()
        if (digest === mine.boundsDigest) {
          const listed = codes as string[]
          const claimed = new Set(listed)
          const missing = mine.codes.filter((c) => !claimed.has(c))
          const extra = listed.filter((c) => !mine.codes.includes(c))
          if (missing.length > 0 || extra.length > 0) {
            push('GATE_IDENTIFIED', at,
              `boundsDigest ${digest} is this resolver's own, so the record claims this resolver's ${mine.codes.length} bounds, and it lists ${listed.length}` +
              (missing.length > 0 ? `, missing ${missing.join(', ')}` : '') +
              (extra.length > 0 ? `, with ${extra.join(', ')} not in this bound set` : ''))
          }
        }
      }
    }
  }

  return out
}

/** The numbers the gate reports without failing. See `Measurement`. */
export function measure(record: OutcomeRecord): Measurement {
  const verbatimClaims = claimsByGeneration(record.files, (s) => s.class === 'survived_verbatim')
  let verbatimClaimedChars = 0
  for (const intervals of verbatimClaims.values()) verbatimClaimedChars += mergedLength(intervals)

  let mutatedAddedChars = 0
  for (const f of record.files) {
    for (const s of f.spans) {
      if (s.class !== 'survived_mutated' || !s.source) continue
      const excess = (s.end - s.start) - (s.source.end - s.source.start)
      if (excess > 0) mutatedAddedChars += excess
    }
  }

  let descentChecked = 0
  let descentUnverified = 0
  let descentDemoted = 0
  for (const f of record.files) {
    for (const s of f.spans) {
      if (!s.descent) continue
      if (s.class === 'survived_mutated') {
        descentChecked++
        if (s.descent.basis === 'unverified') descentUnverified++
      } else if (s.descent.basis === 'rival') {
        descentDemoted++
      }
    }
  }

  let signalEntries = 0
  let signalQuotes = 0
  let signalEntriesWithoutQuote = 0
  if (record.signals) {
    for (const sig of quotingSignals(record.signals)) {
      signalEntries++
      signalQuotes += sig.quotes.length
      if (sig.quotes.length === 0) signalEntriesWithoutQuote++
    }
  }

  const exclusions = record.exclusions ?? []
  const excludedChars = exclusions.reduce((a, x) => a + x.chars, 0)

  const verbatimFinalChars = record.stats.byClass.survived_verbatim.chars
  return {
    recordId: record.task.id,
    verbatimFinalChars,
    verbatimClaimedChars,
    reusedChars: verbatimFinalChars - verbatimClaimedChars,
    generatedCharsWritten: record.stats.generated.charsWritten,
    generatedSegmentChars: record.stats.generated.totalChars,
    generatedSeparatorChars: record.stats.generated.separatorChars,
    finalSeparatorChars: record.stats.finalChars - record.stats.coveredChars,
    mutatedFinalChars: record.stats.byClass.survived_mutated.chars,
    mutatedAddedChars,
    signalEntries,
    signalQuotes,
    signalEntriesWithoutQuote,
    descentChecked,
    descentUnverified,
    descentDemoted,
    excludedPaths: exclusions.length,
    excludedChars,
    consideredChars: record.stats.finalChars + excludedChars,
  }
}

/** One line per violation, for a CLI or a failing test's message. */
export function formatViolations(violations: Violation[]): string {
  return violations
    .map((v) => `${v.code}  ${v.where}\n    bound:    ${v.invariant}\n    observed: ${v.observed}`)
    .join('\n')
}
