// `normText` and `normalize().norm` must be the same string, and both must be
// the same string the single-loop version produced before 2026-11-09.
//
// Why a reference implementation lives in a test file. The change that
// created `normText` also replaced `/\s/.test(ch)` with an ASCII fast path
// and `norm += c` with an array join, for a measured reason
// (docs/design/resolve-cost.md §2). Every record this repository has ever
// shipped has span offsets computed by the old loop, so a one-character
// drift in the output is a silent change to the meaning of
// `survived_verbatim`. The old loop is therefore pinned here, byte for
// byte, and the two new entry points are graded against it rather than
// against each other.
//
// The corpus is this repository's own files and not a generated string,
// because the characters that could break the ASCII fast path — non-ASCII
// whitespace, smart punctuation, astral-plane characters, CRLF — are ones
// a fixture author has to think to include and a real tree has anyway.
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { normalize, normText } from './normalize'

/**
 * `normalize` exactly as it stood at `main` 9d0b7df0, before `fold` and
 * `normText` existed. Do not refactor this: its value is that it is the
 * code that produced every shipped record's offsets.
 */
const FOLD_REF: Record<string, string> = {
  '‘': "'",
  '’': "'",
  '“': '"',
  '”': '"',
  '–': '-',
  '—': '-',
  '…': '...',
  ' ': ' ',
}
function normalizeReference(text: string): { norm: string; map: number[] } {
  let norm = ''
  const map: number[] = []
  let pendingSpace = false
  let spaceIdx = -1
  for (let i = 0; i < text.length; i++) {
    let ch = text[i]
    if (ch in FOLD_REF) ch = FOLD_REF[ch]
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

const CASES: Array<[string, string]> = [
  ['empty', ''],
  ['only whitespace', '   \t\n  '],
  ['leading whitespace is dropped', '   hello'],
  ['trailing whitespace is dropped', 'hello   '],
  ['interior runs collapse', 'a \t\n\r\v\f  b'],
  ['every ASCII whitespace alone', '\t\n\v\f\r '],
  ['smart punctuation folds', '‘a’ “b” – — …'],
  ['ellipsis expands to three characters', 'a…b'],
  ['non-breaking space is in FOLD', 'a b'],
  ['non-ASCII whitespace outside FOLD', 'a b c　d﻿e f g'],
  ['CRLF', 'line one\r\nline two\r\n'],
  ['uppercase folds', 'ABC DeF'],
  ['German sharp s lowercases to itself', 'STRASSE straße'],
  ['Turkish dotted capital I expands under toLowerCase', 'İstanbul'],
  ['astral plane', 'a\u{1F600}b\u{1D400}c'],
  ['combining marks', 'école'],
  ['lone surrogate halves', 'a\ud83db\ude00c'],
  ['digits and symbols are untouched', '0123 !@#$%^&*()'],
  ['a single character', 'x'],
  ['a single whitespace', ' '],
]

const repoFiles = (): Array<[string, string]> => {
  const roots = ['src', 'fixtures', 'docs']
  const out: Array<[string, string]> = []
  const walk = (dir: string, depth: number) => {
    if (depth > 3) return
    let entries: string[]
    try {
      entries = readdirSync(dir)
    } catch {
      return
    }
    for (const e of entries) {
      if (e === 'node_modules' || e.startsWith('.')) continue
      const p = join(dir, e)
      let st
      try {
        st = statSync(p)
      } catch {
        continue
      }
      if (st.isDirectory()) walk(p, depth + 1)
      else if (st.isFile() && st.size > 0 && st.size < 400_000 && /\.(ts|md|json|txt|html|css)$/.test(e)) {
        try {
          out.push([p, readFileSync(p, 'utf8')])
        } catch {
          /* unreadable file is not this test's subject */
        }
      }
    }
  }
  for (const r of roots) walk(r, 0)
  return out
}

describe('normalize: normText is normalize().norm', () => {
  for (const [name, input] of CASES) {
    it(`agrees on ${name}`, () => {
      const ref = normalizeReference(input)
      const full = normalize(input)
      expect(full.norm).toBe(ref.norm)
      expect(full.map).toEqual(ref.map)
      expect(normText(input)).toBe(ref.norm)
    })
  }

  it('agrees with the reference over every file in this repository', () => {
    const files = repoFiles()
    // A corpus that silently became empty would make this test pass by
    // measuring nothing, which is the failure mode the gate census found
    // across this repository on 2026-11-09 (docs/ideas.md).
    expect(files.length).toBeGreaterThan(50)
    let chars = 0
    for (const [path, text] of files) {
      const ref = normalizeReference(text)
      const full = normalize(text)
      if (full.norm !== ref.norm) throw new Error(`norm differs at ${path}`)
      if (normText(text) !== ref.norm) throw new Error(`normText differs at ${path}`)
      if (full.map.length !== ref.map.length) throw new Error(`map length differs at ${path}`)
      for (let i = 0; i < ref.map.length; i++) {
        if (full.map[i] !== ref.map[i]) throw new Error(`map[${i}] differs at ${path}`)
      }
      chars += text.length
    }
    expect(chars).toBeGreaterThan(1_000_000)
  })

  it('a span and its containing blob agree, which is what containment depends on', () => {
    const blob = 'The  quick — brown\nfox “jumps” over  the lazy dog.'
    const span = 'brown fox “jumps”'
    expect(normText(blob).includes(normText(span))).toBe(true)
    expect(normalize(blob).norm.includes(normalize(span).norm)).toBe(true)
  })
})
