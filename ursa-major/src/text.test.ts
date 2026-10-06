// The grounding predicate (src/text.ts isExcerptOf), tested on its own,
// because SIGNAL_QUOTE_GROUNDED is only as strong as this function and the
// two cases that could make it vacuous — the ellipsis and the empty string —
// are both invisible from the bound's own tests.

import { describe, expect, it } from 'vitest'
import { MAX_EXCERPT, excerpt, isExcerptOf, normalizeForExcerpt } from './text'

describe('normalizeForExcerpt', () => {
  it('collapses every run of whitespace to one space and trims the ends', () => {
    expect(normalizeForExcerpt('  the stars\n\n  vanish\tabove  the fold '))
      .toBe('the stars vanish above the fold')
  })
})

describe('isExcerptOf', () => {
  it('grounds a quote in source text whose line breaks the quote collapsed', () => {
    const source = 'The constellation is still too dark.\nBrighten it more,\nthe stars vanish.'
    expect(isExcerptOf(excerpt(source), source)).toBe(true)
  })

  it('grounds a quote of part of the source, which is what a span-level quote is', () => {
    const source = 'one two three four five'
    expect(isExcerptOf('two three four', source)).toBe(true)
  })

  it('rejects a quote with one word changed, which is what a misquote looks like', () => {
    const source = 'No single observer holds it whole.'
    expect(isExcerptOf('No single grader holds it whole.', source)).toBe(false)
  })

  it('checks a truncated quote as a prefix, not as a substring', () => {
    const source = 'ab'.repeat(MAX_EXCERPT) // 2 * MAX_EXCERPT chars, so excerpt() truncates
    const quoted = excerpt(source)
    expect(quoted.length).toBe(MAX_EXCERPT + 1)
    expect(quoted.endsWith('…')).toBe(true)
    expect(isExcerptOf(quoted, source)).toBe(true)
  })

  it('rejects a truncated quote whose prefix was tampered with', () => {
    const source = 'ab'.repeat(MAX_EXCERPT)
    const quoted = excerpt(source)
    const tampered = 'z' + quoted.slice(1)
    expect(isExcerptOf(tampered, source)).toBe(false)
  })

  it('rejects a truncated quote whose source is shorter than the prefix it claims', () => {
    const quoted = excerpt('ab'.repeat(MAX_EXCERPT))
    expect(isExcerptOf(quoted, 'ab'.repeat(10))).toBe(false)
  })

  it('does not let a literal ellipsis in the source stand in for the elided text', () => {
    // The naive version of this check — includes() on the whole quote,
    // ellipsis and all — would pass here, because the source really does
    // contain a '…'. The quote still claims 220 characters this source
    // does not have.
    const quoted = excerpt('ab'.repeat(MAX_EXCERPT))
    expect(isExcerptOf(quoted, 'something entirely different …')).toBe(false)
  })

  it('rejects an empty quote, which every source would otherwise contain', () => {
    expect(isExcerptOf('', 'any source at all')).toBe(false)
    expect(isExcerptOf('', '')).toBe(false)
  })
})
