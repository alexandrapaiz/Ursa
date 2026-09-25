// The resolver. Joins final files backward to generations:
//   Pass 1 — verbatim: normalized containment in any generation.
//   Pass 2 — mutated: best fuzzy match over generation segments, thresholded.
//   Residue → no_generation_provenance; unclaimed generation segments → generated_deleted.

import { diffWords } from 'diff'
import { normalize, type Normalized } from './normalize'
import { segment, modeForPath, type Span } from './segment'
import {
  THETA_HIGH, THETA_LOW, MIN_VERBATIM_LEN, MAX_TOKEN_DF, FUZZY_TOP_K,
  tokens, levSimilarity, containment, combinedScore,
} from './match'
import type {
  Artifact, ConversationMeta, FinalFile, FinalSpan, GenerationFate,
  GenerationRecord, OutcomeRecord, RawGeneration, SourcePointer, SegmentMode,
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
          }
          addClaim(mutatedClaims, { genIndex: best.p.gen.generationIndex, start: best.sent.start, end: best.sent.end })
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

  const generations: GenerationRecord[] = preps.map((p) => {
    const gi = p.gen.generationIndex
    const spans = p.sentences.map((gs) => {
      const v = overlaps(verbatimClaims.get(gi), gs)
      const m = !v && overlaps(mutatedClaims.get(gi), gs)
      const fate: GenerationFate = v ? 'survived_verbatim' : m ? 'survived_mutated' : 'generated_deleted'
      return { start: gs.start, end: gs.end, text: gs.text, fate }
    })
    const totalChars = spans.reduce((a, s) => a + (s.end - s.start), 0)
    const survivedChars = spans
      .filter((s) => s.fate !== 'generated_deleted')
      .reduce((a, s) => a + (s.end - s.start), 0)
    return {
      ...p.gen,
      spans,
      totalChars,
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
