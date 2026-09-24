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
    // one source line may hold several comma-separated path[:ranges] plus prose
    for (const piece of sourceLine.split(/[,;]/)) {
      const hit = piece.trim().match(/^([\w./-]+\.(?:ts|md|json|mjs))(?::([\d,-]+))?/)
      if (!hit) continue
      const [, path, ranges] = hit
      checked++
      const abs = join(root, path)
      if (!existsSync(abs)) { problems.push(`${entry} ${ref}: missing ${path}`); continue }
      if (!ranges) continue
      const lines = readFileSync(abs, 'utf8').split('\n').length
      for (const part of ranges.split(',')) {
        const nums = part.split('-').map(Number).filter((n) => !Number.isNaN(n))
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
