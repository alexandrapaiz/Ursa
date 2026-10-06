// One shared text helper: the excerpt used wherever a signal quotes the
// user's own words or an agent's generation. Kept in its own module so
// signals.ts and loops.ts share one definition of "quoted, truncated"
// instead of two that can drift apart.

/** longest quote a signal entry carries before it is elided with an ellipsis */
export const MAX_EXCERPT = 220

export function excerpt(text: string): string {
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length > MAX_EXCERPT ? t.slice(0, MAX_EXCERPT) + '…' : t
}

/**
 * `excerpt()`'s own normalization, on its own, so a checker can compare like
 * with like instead of guessing what the quoting side did to the whitespace.
 */
export function normalizeForExcerpt(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * Is `quoted` really an excerpt of `source`?
 *
 * The comparison runs against `normalizeForExcerpt(source)` rather than
 * `source`, because `excerpt()` collapses whitespace on the way out, so a
 * quote of a generation that wrapped its lines will never appear in the raw
 * text byte-for-byte. Normalizing the source is not a loosening of the
 * check: it is the only way to state it over the same characters, which is
 * invariants.ts's first rule.
 *
 * Truncated quotes are the case worth naming. `excerpt()` returns
 * `slice(0, MAX_EXCERPT) + '…'` only when the normalized text is longer than
 * `MAX_EXCERPT`, so a quote longer than `MAX_EXCERPT` that ends in an
 * ellipsis is unambiguously a truncation, and what must hold for it is that
 * the source STARTS with the part before the ellipsis. Checking `includes`
 * on the ellipsis itself would pass for any source containing a literal
 * `…`, which is the kind of check that cannot fail.
 *
 * An empty quote returns false. `''.includes('')` is true for every source,
 * so treating emptiness as grounded would make the bound vacuous exactly
 * where a signal quotes nobody.
 */
export function isExcerptOf(quoted: string, source: string): boolean {
  if (quoted.length === 0) return false
  const normalized = normalizeForExcerpt(source)
  if (quoted.length > MAX_EXCERPT && quoted.endsWith('…')) {
    return normalized.startsWith(quoted.slice(0, -1))
  }
  return normalized.includes(quoted)
}
