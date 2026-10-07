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

import { diffWords } from 'diff'
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

  const files: FinalFile[] = input.files.map((f) => {
    const mode = modeForPath(f.path)
    const spans: FinalSpan[] = []

    for (const s of segment(f.text, mode)) {
      const sNorm = normalize(s.text).norm
      const base = { start: s.start, end: s.end, text: s.text }
      let span: FinalSpan | null = null

      // Pass 1 — verbatim
      if (sNorm.length >= MIN_VERBATIM_LEN) {
        for (const p of preps) {
          const idx = p.norm.norm.indexOf(sNorm)
          if (idx < 0) continue
          const gStart = p.norm.map[idx]
          const gEnd = p.norm.map[idx + sNorm.length - 1] + 1
          span = { ...base, class: 'survived_verbatim', score: 1, source: srcPtr(p, gStart, gEnd) }
          addClaim(verbatimClaims, { genIndex: p.gen.generationIndex, start: gStart, end: gEnd })
          break
        }
      } else if (sNorm.length > 0) {
        // short segment: exact equality with a whole generation segment only,
        // and flagged trivial — weak evidence either way
        outer: for (const p of preps) {
          for (const g of p.sentences) {
            if (g.norm === sNorm) {
              span = { ...base, class: 'survived_verbatim', score: 1, trivial: true, source: srcPtr(p, g.start, g.end) }
              addClaim(verbatimClaims, { genIndex: p.gen.generationIndex, start: g.start, end: g.end })
              break outer
            }
          }
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
              diff: diffWords(best.sent.text, s.text).map((d) => ({
                value: d.value,
                ...(d.added ? { added: true } : {}),
                ...(d.removed ? { removed: true } : {}),
              })),
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

    return { path: f.path, mode, text: f.text, spans: mergeVerbatimRuns(spans, f.text) }
  })

  const overlaps = (claims: Claim[] | undefined, s: Span) =>
    !!claims && claims.some((c) => c.start < s.end && c.end > s.start)

  const attribute = input.attributeDeletion ?? (() => ({ cause: 'human_edit' as const }))

  const generations: GenerationRecord[] = preps.map((p) => {
    const gi = p.gen.generationIndex
    const spans = p.sentences.map((gs) => {
      const v = overlaps(verbatimClaims.get(gi), gs)
      const m = !v && overlaps(mutatedClaims.get(gi), gs)
      const fate: GenerationFate = v ? 'survived_verbatim' : m ? 'survived_mutated' : 'generated_deleted'
      const base = { start: gs.start, end: gs.end, text: gs.text, fate }
      if (fate !== 'generated_deleted') return base
      return { ...base, deletion: attribute(p.gen.filePath ?? '', gs.text) }
    })
    const totalChars = spans.reduce((a, s) => a + (s.end - s.start), 0)
    const survivedChars = spans
      .filter((s) => s.fate !== 'generated_deleted')
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
    stats: computeStats(files, generations, input.conversations),
    // Spread rather than assigned so a caller that did not ask produces a
    // record with no `exclusions` key, instead of one with the key set to
    // undefined, which `JSON.stringify` drops and a schema check does not.
    ...(input.exclusions ? { exclusions: input.exclusions } : {}),
  }
}

/**
 * Merge consecutive verbatim spans that came from the same generation with
 * contiguous source ranges into maximal runs.
 */
function mergeVerbatimRuns(spans: FinalSpan[], text: string): FinalSpan[] {
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
      /^\s*$/.test(text.slice(prev.end, s.start))
    ) {
      prev.end = s.end
      prev.text = text.slice(prev.start, prev.end)
      prev.source.end = s.source.end
      if (!(prev.trivial && s.trivial)) delete prev.trivial
      continue
    }
    out.push({ ...s })
  }
  return out
}
