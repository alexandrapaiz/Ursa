// Normalization produces the shadow text all matching runs on, plus an offset
// map back to the original so every span pointer refers to real, unmodified text.

export interface Normalized {
  norm: string
  /** map[i] = index in the original text of the char norm[i] came from */
  map: number[]
}

const FOLD: Record<string, string> = {
  '‘': "'",
  '’': "'",
  '“': '"',
  '”': '"',
  '–': '-',
  '—': '-',
  '…': '...',
  ' ': ' ',
}

/**
 * Lowercase, fold smart punctuation, collapse whitespace runs to a single
 * space, drop leading/trailing whitespace — keeping a char-level offset map.
 */
export function normalize(text: string): Normalized {
  let norm = ''
  const map: number[] = []
  let pendingSpace = false
  let spaceIdx = -1
  for (let i = 0; i < text.length; i++) {
    let ch = text[i]
    if (ch in FOLD) ch = FOLD[ch]
    if (/\s/.test(ch)) {
      if (norm.length > 0) {
        pendingSpace = true
        if (spaceIdx < 0) spaceIdx = i
      }
      continue
    }
    if (pendingSpace) {
      norm += ' '
      map.push(spaceIdx)
      pendingSpace = false
      spaceIdx = -1
    }
    for (const c of ch.toLowerCase()) {
      norm += c
      map.push(i)
    }
  }
  return { norm, map }
}
