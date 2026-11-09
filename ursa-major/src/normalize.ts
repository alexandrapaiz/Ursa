// Normalization produces the shadow text all matching runs on, plus an offset
// map back to the original so every span pointer refers to real, unmodified text.
//
// TWO ENTRY POINTS, ONE LOOP (added 2026-11-09). `normalize` returns the
// offset map, which every span pointer in a record is built from. Six call
// sites in src/ ask only for `.norm` and throw the map away, and three of
// those pass a whole file blob: `corroborate.ts` and `deletion.ts` test
// normalized containment of a span in a blob, and `lifespan.ts` does the
// same against each revision of a file. For a 207,964-character blob the map
// is a 201,665-element `number[]` built one `push` at a time and then
// discarded, which is roughly half the work and all of the allocation.
//
// So the loop is factored into `fold`, which takes the map or `null`, and
// `normText` is the map-free entry point. The two cannot drift, because
// there is one loop; `normalize-equivalence.test.ts` asserts
// `normText(x) === normalize(x).norm` over this repository's own files
// anyway, since "one loop" is a property of today's source and the test is
// a property of the contract.

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
  ' ': ' ',
}

const WS = /\s/

/**
 * `/\s/.test(ch)` without the regex engine for the characters that are
 * almost all of any real file.
 *
 * Exactly `WS.test(ch)` by construction and not by approximation: the fast
 * path answers only for a single-character string whose code unit is below
 * 128, where JavaScript's `\s` class is precisely `U+0009`–`U+000D` and
 * `U+0020`. Everything else — the non-ASCII whitespace `\s` also matches
 * (`U+00A0`, `U+2028`, `U+FEFF` and the rest) and the multi-character
 * strings `FOLD` can produce (`…` becomes `...`) — falls through to the
 * regex, so no judgement about Unicode is encoded here.
 */
const isWhitespace = (ch: string): boolean => {
  if (ch.length === 1) {
    const c = ch.charCodeAt(0)
    if (c < 128) return c === 32 || (c >= 9 && c <= 13)
  }
  return WS.test(ch)
}

/**
 * Lowercase, fold smart punctuation, collapse whitespace runs to a single
 * space, drop leading/trailing whitespace.
 *
 * @param map when given, receives one original-text index per output
 *   character. Pass `null` to skip building it, which is what every caller
 *   that only compares strings wants.
 */
const fold = (text: string, map: number[] | null): string => {
  const out: string[] = []
  let any = false
  let pendingSpace = false
  let spaceIdx = -1
  for (let i = 0; i < text.length; i++) {
    let ch = text[i]
    if (ch in FOLD) ch = FOLD[ch]
    if (isWhitespace(ch)) {
      if (any) {
        pendingSpace = true
        if (spaceIdx < 0) spaceIdx = i
      }
      continue
    }
    if (pendingSpace) {
      out.push(' ')
      map?.push(spaceIdx)
      pendingSpace = false
      spaceIdx = -1
    }
    for (const c of ch.toLowerCase()) {
      out.push(c)
      map?.push(i)
      any = true
    }
  }
  return out.join('')
}

/**
 * Lowercase, fold smart punctuation, collapse whitespace runs to a single
 * space, drop leading/trailing whitespace — keeping a char-level offset map.
 */
export function normalize(text: string): Normalized {
  const map: number[] = []
  return { norm: fold(text, map), map }
}

/**
 * The same normalized text, with no offset map built.
 *
 * For callers that compare or search normalized strings and never point
 * back into the original: normalized containment of a span in a file blob
 * (`src/corroborate.ts`, `src/deletion.ts`, `src/lifespan.ts`), and
 * normalized identity of two short statements (`src/tuning/merge.ts`).
 * `normText(x)` is `normalize(x).norm` for every input.
 */
export function normText(text: string): string {
  return fold(text, null)
}
