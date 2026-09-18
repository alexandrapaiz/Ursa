// Segmentation splits a text into the spans that get classified.
// Prose segments at sentence boundaries; code segments at lines.
// Offsets always index into the original text.

import type { SegmentMode } from './types'

export interface Span {
  start: number
  end: number
  text: string
}

export function modeForPath(p: string): SegmentMode {
  return /\.(md|mdx|markdown|txt|tex)$/i.test(p) ? 'prose' : 'code'
}

export function segment(text: string, mode: SegmentMode): Span[] {
  return mode === 'prose' ? segmentProse(text) : segmentLines(text)
}

export function segmentLines(text: string): Span[] {
  const out: Span[] = []
  const re = /[^\n]+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    const raw = m[0]
    const t = raw.trim()
    if (!t) continue
    const ls = raw.length - raw.trimStart().length
    out.push({ start: m.index + ls, end: m.index + ls + t.length, text: t })
  }
  return out
}

const CLOSERS = `"')”’`

export function segmentProse(text: string): Span[] {
  const out: Span[] = []
  const push = (a: number, b: number) => {
    const raw = text.slice(a, b)
    const t = raw.trim()
    if (!t) return
    const ls = raw.length - raw.trimStart().length
    out.push({ start: a + ls, end: a + ls + t.length, text: t })
  }
  const lineRe = /[^\n]+/g
  let lm: RegExpExecArray | null
  while ((lm = lineRe.exec(text))) {
    const line = lm[0]
    const base = lm.index
    let s = 0
    for (let k = 0; k < line.length; k++) {
      if (!'.!?'.includes(line[k])) continue
      let e = k + 1
      while (e < line.length && CLOSERS.includes(line[e])) e++
      if (e < line.length && line[e] !== ' ') continue
      const next = line.slice(e).trimStart()
      const decimal = /\d/.test(line[k + 1] ?? '')
      // don't split at abbreviations like "e.g. something" — next sentence
      // must start with a non-lowercase char (or line end)
      if (decimal || (next !== '' && /[a-z]/.test(next[0]))) continue
      push(base + s, base + e)
      s = e
      while (s < line.length && line[s] === ' ') s++
      k = s - 1
    }
    if (s < line.length) push(base + s, base + line.length)
  }
  return out
}
