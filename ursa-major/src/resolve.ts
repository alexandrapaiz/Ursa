// The resolver. Joins final files backward to generations:
//   Pass 1 — verbatim: normalized containment in any generation.
//   Pass 2 — mutated: best fuzzy match over generation segments, thresholded.
//   Residue → no_generation_provenance; unclaimed generation segments → generated_deleted.
//
// An unclaimed generation segment is absent from the final file, which
// is not the same as the human having discarded it: a merge between the
// generation and the final commit can have destroyed it mechanically.
// resolve() stays a pure function of its input and does not read git,
// so the caller injects `attributeDeletion` to say which it was. With
// no attributor every deletion is the human's, which is correct for the
// chat path (src/cli.ts), where the final file is the file on disk and
// no merge sits in between.
//
// Pass 2 has the mirror-image problem on the survival side. A score above
// THETA_HIGH says the final text is SIMILAR to a generation segment; the
// `survived_mutated` label says the person DERIVED it by editing that
// segment. Those are different claims, and the second one is the one
// CLAUDE.md §1 sells. The evidence that separates them is outside the
// record, so it arrives the same way: the caller injects `corroborate`,
// which answers whether the span's text also exists outside the
// generation's line of descent. See src/corroborate.ts for the case that
// forced it. With no corroborator every above-threshold match is labelled
// `survived_mutated` as before.

import { diffChars, diffWords } from 'diff'
import { normalize, type Normalized } from './normalize'
import { segment, modeForPath, type Span } from './segment'
import {
  THETA_HIGH, THETA_LOW, MIN_VERBATIM_LEN, MAX_TOKEN_DF, FUZZY_TOP_K,
  tokens, levSimilarity, containment, combinedScore,
} from './match'
import type {
  Artifact, ConversationMeta, DeletionAttribution, DescentEvidence, Exclusion, FinalFile,
  FinalSpan, GenerationFate, GenerationRecord, OutcomeRecord, RawGeneration, SourcePointer,
  SegmentMode,
} from './types'
import { computeStats } from './stats'

export interface ResolveInput {
  taskId: string
  files: Array<{ path: string; text: string }>
  conversations: ConversationMeta[]
  generations: RawGeneration[]
  finished: boolean
  generatedAt?: string
  /**
   * What kind of finished thing this is. Omitted means `chat`: the resolver's
   * original path joins final files against a conversation transcript, so the
   * correction stream is chat. Callers that know better say so — `ursa run`
   * passes `repo` or `hosted` because it walks git.
   */
  artifact?: Artifact
  /**
   * Why a generation span is missing from the final file. Called once
   * per deleted span with the generation's own path and the span's text.
   * Omit it and every deletion is attributed to the human.
   */
  attributeDeletion?: (filePath: string, spanText: string) => DeletionAttribution
  /**
   * Whether a final span's text exists outside the generation's line of
   * descent, asked once per span the fuzzy pass scores above THETA_HIGH,
   * with the final file's path and the span's own text. A `rival` verdict
   * drops the `survived_mutated` label and the diff that goes with it,
   * because an edit of this generation is then not the only account of
   * the text. Omit it and similarity is accepted as descent, which is the
   * right reading only when no other text was in evidence.
   */
  corroborate?: (filePath: string, spanText: string) => DescentEvidence
  /**
   * Paths the caller touched and declined to pass in `files`, with the
   * evidence for declining. Carried onto the record unchanged: deciding
   * which paths are imports needs git, so it happens at the edge
   * (src/vendored.ts, called from src/bin/ursa.ts) for the same reason
   * `attributeDeletion` and `corroborate` do, and this function stays a pure
   * function of its input.
   *
   * Passing it is what turns a silent drop into a claim the record makes.
   * Omit it and the record carries no `exclusions` field at all, which is
   * the honest answer for a caller that never asked — an empty array would
   * say the question was asked and came back clean.
   */
  exclusions?: Exclusion[]
}

interface GenSentence extends Span {
  norm: string
  tokenSet: Set<string>
}

interface GenPrep {
  gen: RawGeneration & { generationIndex: number }
  mode: SegmentMode
  norm: Normalized
  sentences: GenSentence[]
}

interface Claim {
  genIndex: number
  start: number
  end: number
}

const r3 = (x: number) => Math.round(x * 1000) / 1000

/** diff generation → final, in the record's own DiffPart shape */
const toDiffParts = (parts: Array<{ value: string; added?: boolean; removed?: boolean }>) =>
  parts.map((d) => ({
    value: d.value,
    ...(d.added ? { added: true } : {}),
    ...(d.removed ? { removed: true } : {}),
  }))

/** word-level, the right granularity for an edit that changed words */
const wordDiff = (from: string, to: string) => toDiffParts(diffWords(from, to))

/**
 * Character-level, and only for a `normalizedOnly` mutation. `diffWords`
 * tokenizes on whitespace and treats any run of it as equivalent, so on the
 * commonest normalized-only difference — a doubled space, a reflowed line —
 * it reports one unchanged part and no change at all. A span whose whole
 * content is the mutation, carrying a diff that says nothing was mutated,
 * would be worse than the label it replaced. At this granularity the
 * difference is always visible, and it is cheap here because the two strings
 * are the same string modulo folding.
 */
const charDiff = (from: string, to: string) => toDiffParts(diffChars(from, to))

export function resolve(input: ResolveInput): OutcomeRecord {
  const gens = input.generations.map((g, i) => ({ ...g, generationIndex: i }))

  const preps: GenPrep[] = gens.map((gen) => {
    const mode: SegmentMode = gen.filePath
      ? modeForPath(gen.filePath)
      : gen.kind === 'assistant_text' ? 'prose' : 'code'
    const sentences = segment(gen.text, mode).map((s) => {
      const norm = normalize(s.text).norm
      return { ...s, norm, tokenSet: new Set(tokens(norm)) }
    })
    return { gen, mode, norm: normalize(gen.text), sentences }
  })

  // token → generation segments containing it, for the fuzzy-pass prefilter
  const tokenIndex = new Map<string, Array<{ p: GenPrep; sIdx: number }>>()
  for (const p of preps) {
    p.sentences.forEach((s, sIdx) => {
      for (const t of s.tokenSet) {
        let arr = tokenIndex.get(t)
        if (!arr) tokenIndex.set(t, (arr = []))
        arr.push({ p, sIdx })
      }
    })
  }

  const verbatimClaims = new Map<number, Claim[]>()
  const mutatedClaims = new Map<number, Claim[]>()
  /**
   * Generation extents that a pass-1 hit matched byte-for-byte and the
   * descent gate then refused (added 2026-10-14). They are not claims in
   * the sense the other two maps are — no final span asserts survival over
   * them — and they are kept only so the generation segment behind them can
   * be marked `not_generated` instead of `generated_deleted`.
   */
  const notGeneratedClaims = new Map<number, Claim[]>()
  const addClaim = (m: Map<number, Claim[]>, c: Claim) => {
    let arr = m.get(c.genIndex)
    if (!arr) m.set(c.genIndex, (arr = []))
    arr.push(c)
  }

  const srcPtr = (p: GenPrep, start: number, end: number): SourcePointer => ({
    conversationId: p.gen.conversationId,
    model: p.gen.model,
    turnIndex: p.gen.turnIndex,
    generationIndex: p.gen.generationIndex,
    start,
    end,
  })

  /**
   * The descent gate on a byte-identical pass-1 hit (added 2026-10-14).
   *
   * WHAT IT IS FOR. On the `ursa run` path a "generation" is not what the
   * model typed. `resolveEpisode` builds one from the whole blob of each
   * touched file at the agent's commit, so a generation contains every line
   * the file already held before the agent opened it. A final span can
   * therefore be byte-identical to a generation extent and still be text no
   * model wrote, and until today pass 1 labelled all of it
   * `survived_verbatim` — "generated and kept unchanged", per README's class
   * table — without ever asking.
   *
   * HOW BIG IT WAS. Over 12 records of this repository's own history, 719
   * of 1,024 verbatim spans, 110,736 of 139,105 characters, hold text the
   * file already contained at the generation's parent commit. That is 79.6%
   * of what the records sold as survival.
   * `tools/measure-verbatim-descent.ts` is that measurement and reproduces
   * it; the ledger entry "Two thirds of the characters sold as verbatim
   * have a rival nobody asked about" (docs/ideas.md, 2026-10-13) is where
   * the question came from.
   *
   * WHICH VERDICT DEMOTES, AND WHY ONLY ONE. `prior_revision` only. It is
   * the single relation that says the text existed BEFORE the generation
   * did, which is the claim that makes "the model wrote this" false.
   * `sibling` says the text also exists on some parallel branch, which on a
   * file many branches edit is mostly the same common base content seen
   * from the side, and `pre_existing` says an older ancestor held text the
   * parent does not — a restore, which pass 1 cannot reach anyway, since
   * restored text is absent from the generation. Demoting on either would
   * destroy real survival signal on weak evidence, which is the asymmetry
   * src/corroborate.ts already argues for in the other direction.
   *
   * WHERE IT LANDS. `no_generation_provenance`, which CLAUDE.md §1 defines
   * as "present in the finished work but traceable to no generation at all,
   * meaning the model was never in the running". For text the file already
   * held, the model was never in the running, so this is the literal
   * reading of the class and not a stretch of it. The generation extent is
   * not thrown away: it stays as `candidate`, so a buyer can see what the
   * resolver nearly claimed and why it did not.
   *
   * WHAT IT DOES NOT CLAIM. No verdict at all, or any non-`rival` verdict,
   * leaves the label exactly as it was. The chat path (src/cli.ts) injects
   * no corroborator, so every verbatim claim there is unchanged.
   */
  const verbatimClaim = (
    base: { start: number; end: number; text: string },
    p: GenPrep,
    gStart: number,
    gEnd: number,
    filePath: string,
    trivial?: true,
  ): FinalSpan => {
    const descent = input.corroborate?.(filePath, base.text)
    if (descent?.basis === 'rival' && descent.relation === 'prior_revision') {
      // Registered against the generation even though the span makes no
      // survival claim, so the segment behind it can be given the
      // `not_generated` fate rather than falling to `generated_deleted`.
      // Without this the record would assert that the model produced text
      // and the person discarded it, about text still present in the
      // finished file. See `GenerationFate` in src/types.ts.
      addClaim(notGeneratedClaims, { genIndex: p.gen.generationIndex, start: gStart, end: gEnd })
      return {
        ...base,
        class: 'no_generation_provenance',
        uncertain: true,
        candidate: { score: 1, text: p.gen.text.slice(gStart, gEnd), source: srcPtr(p, gStart, gEnd) },
        descent,
      }
    }
    // The claim stands, so it is registered against the generation. This
    // happens here and not at the call site because a demoted span must not
    // register one: `GEN_CLAIM_BOUNDED` and the `survived_verbatim`
    // generation fate are both computed from `verbatimClaims`, and a claim
    // left behind by a span that no longer makes it would put the extent in
    // a rate no span supports.
    addClaim(verbatimClaims, { genIndex: p.gen.generationIndex, start: gStart, end: gEnd })
    return {
      ...base,
      class: 'survived_verbatim',
      score: 1,
      ...(trivial ? { trivial } : {}),
      source: srcPtr(p, gStart, gEnd),
      ...(descent ? { descent } : {}),
    }
  }

  /**
   * What to do with a pass-1 hit whose raw characters do not agree with the
   * generation extent it found. The hit is real: the two texts are the same
   * text after case folding, punctuation folding and whitespace collapsing.
   * What it is not is `survived_verbatim`, so the span is demoted here
   * rather than dropped.
   *
   * Dropping it was the first version of this fix, and measuring it is what
   * rejected it. Falling through to pass 2 sends the span to be scored
   * against generation SEGMENTS, and the commonest case in real history is a
   * line the model wrapped and the person did not, whose final segment
   * straddles two generation segments and therefore matches neither well
   * enough. Over ten records of this repository's own history that put 26
   * spans and 1,466 characters into `no_generation_provenance` — the class
   * CLAUDE.md §1 calls the most valuable, meaning "the model was never in
   * the running", asserted about text the model demonstrably wrote. A false
   * verbatim claim traded for a false claim of no provenance at all is not a
   * fix. `tools/measure-verbatim-fidelity.ts` is that measurement.
   *
   * `corroborate` is asked here for the same reason pass 2 asks it, and a
   * `rival` verdict demotes the same way: identical-after-normalization is
   * still not proof of descent when a blob outside this generation's line
   * holds the same text. DESCENT_CHECKED_UNIFORMLY in src/invariants.ts
   * requires that uniformity and would fire if this branch skipped the ask.
   */
  const normalizedOnlyMutation = (
    base: { start: number; end: number; text: string },
    p: GenPrep,
    gStart: number,
    gEnd: number,
    filePath: string,
    trivial?: true,
  ): FinalSpan => {
    const claimed = p.gen.text.slice(gStart, gEnd)
    const source = srcPtr(p, gStart, gEnd)
    const descent = input.corroborate?.(filePath, base.text)
    if (descent?.basis === 'rival') {
      return {
        ...base,
        class: 'no_generation_provenance',
        uncertain: true,
        candidate: { score: 1, text: claimed, source },
        descent,
      }
    }
    addClaim(mutatedClaims, { genIndex: p.gen.generationIndex, start: gStart, end: gEnd })
    return {
      ...base,
      class: 'survived_mutated',
      score: 1,
      normalizedOnly: true,
      source,
      diff: charDiff(claimed, base.text),
      ...(trivial ? { trivial } : {}),
      ...(descent ? { descent } : {}),
    }
  }

  const files: FinalFile[] = input.files.map((f) => {
    const mode = modeForPath(f.path)
    const spans: FinalSpan[] = []

    for (const s of segment(f.text, mode)) {
      const sNorm = normalize(s.text).norm
      const base = { start: s.start, end: s.end, text: s.text }
      let span: FinalSpan | null = null

      // Pass 1 — verbatim.
      //
      // Containment runs on the shadow text, which is lowercased, has smart
      // punctuation folded and every whitespace run collapsed to one space.
      // A normalized hit therefore survives a case change, an em dash
      // retyped as a hyphen and any reflow, and until 2026-10-13 every one
      // of those was labelled `survived_verbatim` with `score: 1`. That is
      // a weaker claim than the label makes: README's class table says
      // "generated and kept unchanged", and CLAIM_NOT_WIDER's own sentence
      // says "verbatim means byte-identical". So the normalized hit only
      // locates a candidate extent now, and the claim is made solely when
      // the raw characters agree. A hit whose raw characters differ falls
      // through to pass 2, where the difference is scored and emitted as a
      // diff — which is the thing Ursa Minor sells, rather than noise to
      // fold away.
      if (sNorm.length >= MIN_VERBATIM_LEN) {
        // Every occurrence in every generation, not just the first hit: a
        // generation that repeats a sentence should not lose a byte-identical
        // claim because an earlier copy of it differs in case. The first hit
        // that is not byte-identical is kept as `nearest` and used only if no
        // exact one exists anywhere.
        let nearest: { p: GenPrep; gStart: number; gEnd: number } | null = null
        outerLong: for (const p of preps) {
          for (let idx = p.norm.norm.indexOf(sNorm); idx >= 0; idx = p.norm.norm.indexOf(sNorm, idx + 1)) {
            const gStart = p.norm.map[idx]
            const gEnd = p.norm.map[idx + sNorm.length - 1] + 1
            if (p.gen.text.slice(gStart, gEnd) !== s.text) {
              nearest ??= { p, gStart, gEnd }
              continue
            }
            span = verbatimClaim(base, p, gStart, gEnd, f.path)
            break outerLong
          }
        }
        if (!span && nearest) {
          span = normalizedOnlyMutation(base, nearest.p, nearest.gStart, nearest.gEnd, f.path)
        }
      } else if (sNorm.length > 0) {
        // short segment: exact equality with a whole generation segment only,
        // and flagged trivial — weak evidence either way. Raw equality for
        // the same reason the long branch demands it, and the same demotion
        // when only the normalized sides agree.
        let nearestShort: { p: GenPrep; g: GenSentence } | null = null
        outer: for (const p of preps) {
          for (const g of p.sentences) {
            if (g.norm !== sNorm) continue
            if (g.text !== s.text) {
              nearestShort ??= { p, g }
              continue
            }
            span = verbatimClaim(base, p, g.start, g.end, f.path, true)
            break outer
          }
        }
        if (!span && nearestShort) {
          const { p, g } = nearestShort
          span = normalizedOnlyMutation(base, p, g.start, g.end, f.path, true)
        }
      }

      // Pass 2 — fuzzy
      if (!span && sNorm.length > 0) {
        const sTokens = tokens(sNorm)
        const seen = new Set<string>()
        const candidates: Array<{ p: GenPrep; sent: GenSentence; cont: number }> = []
        for (const t of new Set(sTokens)) {
          const bucket = tokenIndex.get(t)
          if (!bucket || bucket.length > MAX_TOKEN_DF) continue
          for (const cand of bucket) {
            const key = cand.p.gen.generationIndex + ':' + cand.sIdx
            if (seen.has(key)) continue
            seen.add(key)
            const sent = cand.p.sentences[cand.sIdx]
            candidates.push({ p: cand.p, sent, cont: containment(sTokens, sent.tokenSet) })
          }
        }
        candidates.sort((a, b) => b.cont - a.cont)
        let best: { p: GenPrep; sent: GenSentence; score: number } | null = null
        for (const c of candidates.slice(0, FUZZY_TOP_K)) {
          const score = combinedScore(c.cont, levSimilarity(sNorm, c.sent.norm))
          if (!best || score > best.score) best = { p: c.p, sent: c.sent, score }
        }
        if (best && best.score >= THETA_HIGH) {
          const descent = input.corroborate?.(f.path, s.text)
          if (descent?.basis === 'rival') {
            // The text exists outside this generation's descent, so the
            // person did not reach it by editing this generation. Demoted
            // to the same shape the below-threshold branch produces: no
            // `source`, no `diff`, the evidence kept as a candidate for a
            // human to adjudicate. No claim is added, so the generation
            // segment stays unclaimed and is reported `generated_deleted`
            // — which is what happened to it.
            span = {
              ...base,
              class: 'no_generation_provenance',
              uncertain: true,
              candidate: { score: r3(best.score), text: best.sent.text, source: srcPtr(best.p, best.sent.start, best.sent.end) },
              descent,
            }
          } else {
            span = {
              ...base,
              class: 'survived_mutated',
              score: r3(best.score),
              source: srcPtr(best.p, best.sent.start, best.sent.end),
              diff: wordDiff(best.sent.text, s.text),
              // `uncertain` is deliberately NOT set on an `unverified`
              // verdict. It is stats.uncertainSpans' own definition (a
              // below-threshold candidate awaiting adjudication) and that
              // count is O1 KR1.1's metric; widening it here would move
              // the KR's number without any span changing.
              ...(descent ? { descent } : {}),
            }
            addClaim(mutatedClaims, { genIndex: best.p.gen.generationIndex, start: best.sent.start, end: best.sent.end })
          }
        } else if (best && best.score >= THETA_LOW) {
          span = {
            ...base,
            class: 'no_generation_provenance',
            uncertain: true,
            candidate: { score: r3(best.score), text: best.sent.text, source: srcPtr(best.p, best.sent.start, best.sent.end) },
          }
        }
      }

      spans.push(span ?? { ...base, class: 'no_generation_provenance' })
    }

    return {
      path: f.path,
      mode,
      text: f.text,
      // preps is built by mapping over input.generations in order, so its
      // index is the generationIndex a source pointer carries.
      spans: mergeVerbatimRuns(spans, f.text, preps.map((p) => p.gen.text)),
    }
  })

  const overlaps = (claims: Claim[] | undefined, s: Span) =>
    !!claims && claims.some((c) => c.start < s.end && c.end > s.start)

  const attribute = input.attributeDeletion ?? (() => ({ cause: 'human_edit' as const }))

  const generations: GenerationRecord[] = preps.map((p) => {
    const gi = p.gen.generationIndex
    const spans = p.sentences.map((gs) => {
      const v = overlaps(verbatimClaims.get(gi), gs)
      const m = !v && overlaps(mutatedClaims.get(gi), gs)
      // Checked last, so a segment that any real claim covers keeps that
      // claim: one segment of a whole-file blob can hold both a line the
      // agent wrote and a line the file already had, and the survival is
      // the stronger statement about it.
      const n = !v && !m && overlaps(notGeneratedClaims.get(gi), gs)
      const fate: GenerationFate = v
        ? 'survived_verbatim'
        : m ? 'survived_mutated'
          : n ? 'not_generated' : 'generated_deleted'
      const base = { start: gs.start, end: gs.end, text: gs.text, fate }
      if (fate !== 'generated_deleted') return base
      return { ...base, deletion: attribute(p.gen.filePath ?? '', gs.text) }
    })
    const totalChars = spans.reduce((a, s) => a + (s.end - s.start), 0)
    // Stated as the two survival fates rather than as "not deleted", which
    // is what it said before `not_generated` existed. A segment the file
    // already held is not a survival, and the old spelling would have
    // counted it as one the moment a fourth fate appeared.
    const survivedChars = spans
      .filter((s) => s.fate === 'survived_verbatim' || s.fate === 'survived_mutated')
      .reduce((a, s) => a + (s.end - s.start), 0)
    // charsWritten is the generation's own length, separatorChars the part
    // of it no segment covers. totalChars stays segment-only, because a fate
    // is only ever assigned to a segment, but a verbatim claim is matched
    // against the normalization of the whole text and can therefore cover
    // separators. Recording all three is what lets src/invariants.ts state
    // a bound a claim total can actually be checked against.
    return {
      ...p.gen,
      spans,
      totalChars,
      charsWritten: p.gen.text.length,
      separatorChars: p.gen.text.length - totalChars,
      survivedChars,
      survivalRate: totalChars ? r3(survivedChars / totalChars) : 0,
    }
  })

  return {
    schemaVersion: '0.1.0',
    task: {
      id: input.taskId,
      finished: input.finished,
      generatedAt: input.generatedAt ?? new Date().toISOString(),
    },
    artifact: input.artifact ?? { kind: 'chat' },
    files,
    conversations: input.conversations,
    generations,
    stats: computeStats(files, generations, input.conversations, input.exclusions),
    // Spread rather than assigned so a caller that did not ask produces a
    // record with no `exclusions` key, instead of one with the key set to
    // undefined, which `JSON.stringify` drops and a schema check does not.
    ...(input.exclusions ? { exclusions: input.exclusions } : {}),
  }
}

/**
 * Merge consecutive verbatim spans that came from the same generation with
 * contiguous source ranges into maximal runs.
 *
 * The merged span covers the gap between the two spans as well as the spans
 * themselves, so the merge makes a claim about characters neither span
 * matched. Until 2026-10-13 it accepted any whitespace gap in the final text
 * against a generation gap of up to two characters, and that is exactly what
 * produced the CLAIM_NOT_WIDER violation on record
 * `ursa-2026-10-07-2f610e9`, span 78 of `docs/sprints/pending.md`: the person
 * had reflowed one line, so a one-character generation gap (a space) was
 * credited with a three-character final gap (a newline and two spaces), and
 * 101 final characters were sold as 99 generated ones. The gap now has to be
 * the same characters on both sides. Two byte-identical runs separated by a
 * gap the person rewrote stay two spans, and the characters they inserted
 * belong to no span's claim, which is what happened to them.
 *
 * `genTexts` is indexed by `generationIndex`.
 */
function mergeVerbatimRuns(spans: FinalSpan[], text: string, genTexts: string[]): FinalSpan[] {
  const out: FinalSpan[] = []
  for (const s of spans) {
    const prev = out[out.length - 1]
    if (
      prev &&
      prev.class === 'survived_verbatim' &&
      s.class === 'survived_verbatim' &&
      prev.source &&
      s.source &&
      prev.source.generationIndex === s.source.generationIndex &&
      s.source.start >= prev.source.end &&
      s.source.start - prev.source.end <= 2 &&
      text.slice(prev.end, s.start) ===
        (genTexts[s.source.generationIndex] ?? '').slice(prev.source.end, s.source.start)
    ) {
      prev.end = s.end
      prev.text = text.slice(prev.start, prev.end)
      prev.source.end = s.source.end
      if (!(prev.trivial && s.trivial)) delete prev.trivial
      // The descent verdict of a merged run is the weaker of the two
      // (added 2026-10-14, with the pass-1 gate). Each verdict was asked
      // about one of the two spans, and nobody asked about the joined text.
      // `corroborated` is a positive claim — searched, and nothing outside
      // this generation's descent holds it — so inheriting it from the
      // first half would extend that claim over characters no search
      // covered. `unverified` says only that the question could not be
      // answered, which stays true of any wider span containing it.
      if (s.descent?.basis === 'unverified' && prev.descent?.basis !== 'unverified') {
        prev.descent = s.descent
      }
      continue
    }
    out.push({ ...s })
  }
  return out
}
