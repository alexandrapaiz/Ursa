// Trace-stage signal detection: correction loops, regressions and one-shot
// corrections, recovered from a chat trace with no hand annotation.
//
// The label-stage case (a git commit pair) has no trace: one generation, one
// final state, corrections visible only as edits. That path stays in
// signals.ts. This module handles the other case, where the record carries
// `conversations[].prompts[]` — the user's own messages, in order — and every
// claim can therefore be joined back to a step the reader can read for
// themselves.
//
// Everything here is lexical and deterministic, for the same reason match.ts
// is: the code counts, the model judges (docs/design/product-plan.md §10).
// No entry is emitted that a reader cannot re-derive from the prompt text,
// the two thresholds below, and the cue lists. Two signal kinds are
// deliberately NOT emitted here — FeedbackTranslation (the user's complaint
// mapped to the technical fault behind it) and RepairAttempt (the strategy a
// run tried) — because both require naming something no lexical rule can
// name. They belong to the distiller, which runs a model over this output.

import { tokens } from './match'
import { normalize } from './normalize'
import { excerpt } from './text'
import type {
  CorrectionLoop, GenerationRecord, OneShotCorrection, OutcomeRecord, RegressionEvent,
} from './types'

/** two prompts share a theme when this fraction of the smaller term set matches */
export const THEME_OVERLAP = 0.34
/** ...and at least this many distinct content terms are shared. Guards against
 *  two three-word prompts colliding on one incidental word. */
export const MIN_SHARED_TERMS = 2
/** how many terms the generated theme label carries */
const MAX_THEME_TERMS = 3

// Structural words, plus the cue words below: a cue tells us what KIND of
// prompt this is, so letting it also carry theme meaning would cluster every
// "that's still wrong" in a session into one bogus loop.
const STOPWORDS = new Set([
  'the', 'and', 'but', 'for', 'not', 'you', 'your', 'yours', 'our', 'ours', 'its', 'it', 'is',
  'are', 'was', 'were', 'be', 'been', 'being', 'this', 'that', 'these', 'those', 'there',
  'here', 'with', 'without', 'from', 'into', 'onto', 'out', 'off', 'over', 'under', 'above',
  'below', 'then', 'than', 'them', 'they', 'their', 'have', 'has', 'had', 'can', 'cant',
  'could', 'would', 'should', 'will', 'wont', 'shall', 'may', 'might', 'must', 'just', 'only',
  'also', 'very', 'too', 'much', 'many', 'more', 'most', 'less', 'least', 'some', 'any', 'all',
  'each', 'both', 'other', 'another', 'same', 'such', 'what', 'when', 'where', 'which', 'who',
  'whom', 'why', 'how', 'now', 'get', 'got', 'make', 'made', 'let', 'lets', 'put', 'use',
  'using', 'try', 'trying', 'want', 'need', 'like', 'please', 'thanks', 'thank', 'okay',
  'yes', 'yeah', 'yep', 'nope', 'ill', 'ive', 'thats', 'dont', 'doesnt', 'didnt', 'isnt',
  'arent', 'one', 'two', 'three', 'first', 'last', 'next', 'before', 'after', 'again',
  'still', 'yet', 'back', 'broke', 'broken', 'keeps', 'keep', 'went', 'longer', 'used',
  'sure', 'maybe', 'about', 'because', 'while', 'between', 'every', 'anything', 'something',
  'nothing', 'doing', 'does', 'did', 'done', 'goes', 'going', 'see', 'look', 'looks',
])

// Acceptance vocabulary: the words a prompt made ENTIRELY of means "stop, this
// is fine", not "here is a new correction".
const ACCEPTANCE_VOCAB = new Set([
  'perfect', 'great', 'nice', 'good', 'works', 'working', 'work', 'love', 'ship', 'shipped',
  'exactly', 'correct', 'right', 'awesome', 'beautiful', 'lovely', 'cool', 'fine', 'better',
])
const ACCEPTANCE_CUE =
  /\b(perfect|that works|works now|thanks|thank you|looks good|looks great|love it|exactly right|ship it|nailed it|that'?s it|great work|yes[, ]|lgtm)\b/i

/** previously-working state reported broken — distinct from "it was never right yet" */
const REGRESSION_CUE =
  /\b(again|broke|broken|revert(ed)?|undid|undo|regress(ed|ion)?|reappeared|came back|went back|back to|no longer|used to|you removed|disappeared|lost the)\b/i

export type PromptRole = 'task_ask' | 'correction' | 'acceptance'

export interface TracePrompt {
  conversationId: string
  /** assistant-step ordinal this prompt arrived after; joins to generations[].turnIndex */
  step: number
  /** position in its conversation's prompts[] — disambiguates two prompts at one step */
  index: number
  text: string
  role: PromptRole
  /** distinct content terms, stopwords and cue words removed, in first-seen order */
  terms: string[]
  /** matched REGRESSION_CUE: the user says a working state came back broken */
  regressionCue: boolean
}

export interface TraceSignals {
  loops: CorrectionLoop[]
  regressions: RegressionEvent[]
  oneShotCorrections: OneShotCorrection[]
  /** highest assistant step observed across generations and prompts */
  steps: number
  /** an acceptance prompt stands after the last correction prompt in the trace.
   *  An observation about the chat, never the owner's declaration. */
  acceptanceStatedInChat: boolean
  /** single corrections that no surviving generation ever answered */
  unresolvedSingleCorrections: number
  notes: string[]
}

/** a record has a chat trace when at least one conversation carried the user's own messages */
export function hasChatTrace(record: OutcomeRecord): boolean {
  return record.conversations.some((c) => (c.prompts?.length ?? 0) > 0)
}

export function contentTerms(text: string): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const w of tokens(normalize(text).norm)) {
    if (w.length < 3 || STOPWORDS.has(w) || /^\d+$/.test(w) || seen.has(w)) continue
    seen.add(w)
    out.push(w)
  }
  return out
}

function roleOf(text: string, isFirstInConversation: boolean): PromptRole {
  if (ACCEPTANCE_CUE.test(text)) {
    const rest = contentTerms(text).filter((w) => !ACCEPTANCE_VOCAB.has(w))
    if (rest.length <= 1) return 'acceptance'
  }
  return isFirstInConversation ? 'task_ask' : 'correction'
}

/** every user message in the record, ordered, typed, and term-extracted */
export function tracePrompts(record: OutcomeRecord): TracePrompt[] {
  const out: TracePrompt[] = []
  for (const conv of record.conversations) {
    const prompts = conv.prompts ?? []
    prompts.forEach((p, index) => {
      out.push({
        conversationId: conv.id,
        step: p.step,
        index,
        text: p.text,
        role: roleOf(p.text, index === 0),
        terms: contentTerms(p.text),
        regressionCue: REGRESSION_CUE.test(p.text),
      })
    })
  }
  return out.sort((a, b) =>
    a.conversationId === b.conversationId
      ? a.step - b.step || a.index - b.index
      : a.conversationId < b.conversationId ? -1 : 1,
  )
}

function sharedTerms(a: string[], b: string[]): string[] {
  const bSet = new Set(b)
  return a.filter((t) => bSet.has(t))
}

/** single-linkage: a prompt joins the cluster whose closest member it matches best */
function themeScore(p: TracePrompt, members: TracePrompt[]): number {
  let best = 0
  for (const m of members) {
    const shared = sharedTerms(p.terms, m.terms).length
    if (shared < MIN_SHARED_TERMS) continue
    const overlap = shared / Math.max(1, Math.min(p.terms.length, m.terms.length))
    if (overlap >= THEME_OVERLAP && overlap > best) best = overlap
  }
  return best
}

function themeLabel(members: TracePrompt[]): string {
  const count = new Map<string, { n: number; first: number }>()
  members.forEach((m, mi) => {
    for (const t of m.terms) {
      const prev = count.get(t)
      if (prev) prev.n++
      else count.set(t, { n: 1, first: mi * 1000 + m.terms.indexOf(t) })
    }
  })
  return [...count.entries()]
    .sort((a, b) => b[1].n - a[1].n || a[1].first - b[1].first)
    .slice(0, MAX_THEME_TERMS)
    .map(([t]) => t)
    .join(' ')
}

/**
 * Detect trace-stage signals for one record.
 *
 * Shape of the detection, in the order it runs:
 *  1. type every prompt: the conversation's opening message is the task ask
 *     (a spec, not a failure), a message made only of acceptance words is an
 *     acceptance, everything else is a correction;
 *  2. cluster the corrections into themes by shared content terms;
 *  3. attach the task ask to a theme it shares terms with, so a loop that
 *     opened with the original ask reports that ask's step as openedStep;
 *  4. per theme, find the window that answered its last prompt — the
 *     generations between that prompt and the next correction — and read
 *     closure off whether any of them survived into the finished work;
 *  5. a theme with one prompt is a one-shot correction, not a loop; a theme
 *     with a prompt carrying a regression cue, raised earlier in the same
 *     theme, is also a RegressionEvent.
 */
export function detectTraceSignals(record: OutcomeRecord): TraceSignals {
  const prompts = tracePrompts(record)
  const byConv = new Map<string, GenerationRecord[]>()
  for (const g of record.generations) {
    let arr = byConv.get(g.conversationId)
    if (!arr) byConv.set(g.conversationId, (arr = []))
    arr.push(g)
  }

  const steps = Math.max(
    0,
    ...record.generations.map((g) => g.turnIndex),
    ...prompts.map((p) => p.step),
  )

  const loops: CorrectionLoop[] = []
  const regressions: RegressionEvent[] = []
  const oneShotCorrections: OneShotCorrection[] = []
  let unresolvedSingleCorrections = 0
  const notes: string[] = []

  for (const conv of record.conversations) {
    const convPrompts = prompts.filter((p) => p.conversationId === conv.id)
    if (convPrompts.length === 0) continue
    const gens = (byConv.get(conv.id) ?? []).slice().sort((a, b) => a.turnIndex - b.turnIndex)
    const corrections = convPrompts.filter((p) => p.role === 'correction')

    // 2 — cluster corrections into themes
    const clusters: TracePrompt[][] = []
    for (const p of corrections) {
      if (p.terms.length === 0) continue
      let bestIdx = -1
      let bestScore = 0
      clusters.forEach((members, i) => {
        const score = themeScore(p, members)
        if (score > bestScore) {
          bestScore = score
          bestIdx = i
        }
      })
      if (bestIdx >= 0) clusters[bestIdx].push(p)
      else clusters.push([p])
    }

    // 3 — the task ask joins the theme it restates, if any
    const ask = convPrompts.find((p) => p.role === 'task_ask')
    if (ask && ask.terms.length > 0) {
      let bestIdx = -1
      let bestScore = 0
      clusters.forEach((members, i) => {
        const score = themeScore(ask, members)
        if (score > bestScore) {
          bestScore = score
          bestIdx = i
        }
      })
      if (bestIdx >= 0) clusters[bestIdx].unshift(ask)
    }

    let loopOrdinal = 0
    for (const members of clusters) {
      members.sort((a, b) => a.step - b.step || a.index - b.index)
      const promptSteps = members.map((m) => m.step)
      const lastPromptStep = promptSteps[promptSteps.length - 1]
      const theme = themeLabel(members)

      // 4 — the window that answered the theme's last prompt: every generation
      // after it, up to and including the step the next correction arrived at.
      const nextCorrectionStep = corrections
        .filter((p) => p.step > lastPromptStep)
        .reduce((min, p) => Math.min(min, p.step), Infinity)
      const window = gens.filter((g) => g.turnIndex > lastPromptStep && g.turnIndex <= nextCorrectionStep)
      const resolving = window.filter((g) => g.survivedChars > 0)
      const resolvingSteps = [...new Set(resolving.map((g) => g.turnIndex))].sort((a, b) => a - b)
      const closedStep = resolvingSteps.length > 0 ? resolvingSteps[0] : null

      if (members.length === 1) {
        // a theme raised once: stateable, closed (or dropped) in one shot
        if (closedStep === null) {
          unresolvedSingleCorrections++
          continue
        }
        oneShotCorrections.push({
          step: members[0].step,
          text: excerpt(members[0].text),
          domain: targetFiles(record, conv.id, members[0].step, closedStep, members).join(', ') || theme,
        })
        continue
      }

      const statedAcceptance =
        closedStep !== null &&
        convPrompts.some(
          (p) => p.role === 'acceptance' && p.step >= closedStep && p.step <= nextCorrectionStep,
        )
      const resolution: CorrectionLoop['resolution'] =
        closedStep !== null
          ? statedAcceptance ? 'accepted' : 'accepted_tacitly'
          : window.length > 0 ? 'abandoned' : 'open'

      const regressionMembers = members.filter(
        (m, i) => m.regressionCue && i > 0 && m.role === 'correction',
      )
      for (const m of regressionMembers) {
        const prior = members.filter((x) => x.step < m.step).pop()!
        regressions.push({
          conversationId: conv.id,
          step: m.step,
          brokenState: `theme "${theme}" was already raised at step ${prior.step} and is reported broken again here`,
          evidence: excerpt(m.text),
          causedBySteps: gens
            .filter((g) => g.turnIndex > prior.step && g.turnIndex <= m.step)
            .map((g) => g.turnIndex)
            .filter((s, i, a) => a.indexOf(s) === i),
        })
      }

      loopOrdinal++
      loops.push({
        id: `${conv.id}:L${loopOrdinal}`,
        conversationId: conv.id,
        theme,
        targetFiles: targetFiles(record, conv.id, promptSteps[0], closedStep ?? lastPromptStep, members),
        openedStep: promptSteps[0],
        promptSteps,
        recurrences: promptSteps.length - 1,
        regressionSteps: regressionMembers.map((m) => m.step),
        closedStep,
        resolution,
        resolvingSteps,
        discoveredSpec: specFrom(members, promptSteps),
      })
    }
  }

  loops.sort((a, b) => a.openedStep - b.openedStep)
  regressions.sort((a, b) => a.step - b.step)
  oneShotCorrections.sort((a, b) => a.step - b.step)

  const lastCorrectionStep = prompts
    .filter((p) => p.role === 'correction')
    .reduce((max, p) => Math.max(max, p.step), -1)
  const acceptanceStatedInChat = prompts.some(
    (p) => p.role === 'acceptance' && p.step >= lastCorrectionStep,
  )

  notes.push(
    'trace-stage record: loops, regressions and one-shot corrections are auto-detected from conversations[].prompts[];',
    `every step joins to generations[].turnIndex and conversations[].prompts[].step, so each entry is re-derivable from the trace (theme overlap ${THEME_OVERLAP}, minimum ${MIN_SHARED_TERMS} shared terms).`,
  )
  if (unresolvedSingleCorrections > 0) {
    notes.push(
      `${unresolvedSingleCorrections} single correction(s) were raised and answered by no surviving generation; they are counted here, not emitted as one-shot corrections, because nothing closed them.`,
    )
  }
  if (acceptanceStatedInChat) {
    notes.push(
      'an acceptance prompt stands after the last correction in the trace. That is an observation about the chat, not the owner\'s declaration: episode.accepted stays whatever was declared at launch.',
    )
  }
  notes.push(
    'feedbackTranslations and repairAttempts stay empty by design: naming the mechanism behind a complaint, or the strategy behind a repair, is a language judgment the detector does not make. The distiller does it downstream.',
  )

  return {
    loops,
    regressions,
    oneShotCorrections,
    steps,
    acceptanceStatedInChat,
    unresolvedSingleCorrections,
    notes,
  }
}

/**
 * The spec the user could not state in advance, articulated post-hoc. The
 * detector does not write prose: it quotes. Which quote is the spec is a
 * code-owned choice — the loop's LAST statement of what was wanted, with
 * regression reports excluded, because "it went dark again" says the state
 * broke and never says what the state should be. Every other statement in
 * the loop stays addressable by step, so nothing is merged away
 * (docs/design/product-plan.md §10: contradictions survive as separate trail
 * entries, they are never resolved into one true preference).
 */
function specFrom(members: TracePrompt[], promptSteps: number[]): string {
  const wanted = members.filter((m) => !m.regressionCue)
  const pool = wanted.length > 0 ? wanted : members
  const chosen = pool[pool.length - 1]
  const others = promptSteps.filter((s) => s !== chosen.step)
  return (
    `quoted from step ${chosen.step}, the loop's last statement of what was wanted ` +
    `(regression reports excluded): "${excerpt(chosen.text)}"` +
    (others.length > 0
      ? ` — the loop's other statements stand unmerged at conversations[].prompts[].step ${others.join(', ')}`
      : '')
  )
}

/**
 * Which finished files a theme touched. Three independent sources, unioned:
 * a final span whose provenance points at a generation inside the step range,
 * a generation inside the range that named a file path, and a file whose name
 * the user typed into one of the theme's own prompts.
 */
function targetFiles(
  record: OutcomeRecord,
  conversationId: string,
  fromStep: number,
  toStep: number,
  members: TracePrompt[],
): string[] {
  const out = new Set<string>()
  for (const file of record.files) {
    for (const span of file.spans) {
      const s = span.source
      if (s && s.conversationId === conversationId && s.turnIndex >= fromStep && s.turnIndex <= toStep) {
        out.add(file.path)
        break
      }
    }
  }
  for (const g of record.generations) {
    if (g.conversationId !== conversationId || !g.filePath) continue
    if (g.turnIndex >= fromStep && g.turnIndex <= toStep) out.add(g.filePath)
  }
  const said = members.map((m) => m.text.toLowerCase()).join(' \n ')
  for (const file of record.files) {
    const base = file.path.split('/').pop()!.toLowerCase()
    if (base.includes('.') && said.includes(base)) out.add(file.path)
  }
  return [...out].sort()
}
