#!/usr/bin/env node
// Checks that every evidence ref in every skill resolves: the file exists, and
// any line range named is in bounds. Cheap, but it is the difference between
// "skills with receipts" and skills with footnotes. Run: node skills/check-evidence.mjs
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const skillsDir = join(root, 'skills')
let checked = 0
const problems = []

for (const entry of readdirSync(skillsDir)) {
  const file = join(skillsDir, entry, 'SKILL.md')
  if (!existsSync(file) || !statSync(join(skillsDir, entry)).isDirectory()) continue

  const text = readFileSync(file, 'utf8')
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/)
  if (!fm) { problems.push(`${entry}: no frontmatter`); continue }

  // refs the body actually cites, e.g. [E3] or [E3, E7]
  const cited = new Set()
  for (const m of text.slice(fm[0].length).matchAll(/\[((?:E\d+)(?:,\s*E\d+)*)\]/g))
    for (const r of m[1].split(/,\s*/)) cited.add(r)

  const declared = new Set()
  for (const m of fm[1].matchAll(/- ref:\s*(\S+)\n(?:.*\n)*?\s*source:\s*(.+)/g)) {
    const [, ref, sourceLine] = m
    declared.add(ref)
    // One source line may hold several path[:ranges] plus prose. Scan it
    // rather than splitting on commas first: a comma separates two paths
    // AND two ranges of one path, so splitting dropped every range after
    // the first, and `segment.ts:1-3,900-999` passed on a 70-line file.
    for (const hit of sourceLine.matchAll(/([\w./-]+\.(?:ts|md|json|mjs))(?::([\d,-]+))?/g)) {
      const [, path, ranges] = hit
      checked++
      const abs = join(root, path)
      if (!existsSync(abs)) { problems.push(`${entry} ${ref}: missing ${path}`); continue }
      if (!ranges) continue
      // Trailing newline makes split() yield one empty extra element, which
      // let a citation one line past the end of the file pass.
      const lines = readFileSync(abs, 'utf8').replace(/\n$/, '').split('\n').length
      for (const part of ranges.split(',')) {
        // Only well-formed N or N-M. Number('') is 0, not NaN, so a trailing
        // comma used to invent a line 0 and fail an otherwise fine source.
        if (!/^\d+(?:-\d+)?$/.test(part)) continue
        const nums = part.split('-').map(Number)
        for (const n of nums)
          if (n < 1 || n > lines)
            problems.push(`${entry} ${ref}: ${path}:${n} out of bounds (${lines} lines)`)
        if (nums.length === 2 && nums[0] > nums[1])
          problems.push(`${entry} ${ref}: ${path}:${part} is inverted`)
      }
    }
  }

  for (const r of cited) if (!declared.has(r)) problems.push(`${entry}: body cites ${r}, not declared`)
  for (const r of declared) if (!cited.has(r)) problems.push(`${entry}: ${r} declared but never cited`)
}

if (problems.length) {
  console.error(`evidence check FAILED (${problems.length})`)
  for (const p of problems) console.error('  ' + p)
  process.exit(1)
}
console.log(`evidence check OK: ${checked} sources resolved`)
