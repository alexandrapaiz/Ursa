#!/usr/bin/env node
// Checks that every evidence ref in every skill resolves: the file exists, the
// line range named is in bounds, and the lines still say what they said when
// the citation was written. Cheap, but it is the difference between "skills
// with receipts" and skills with footnotes.
//
//   node skills/check-evidence.mjs            verify
//   node skills/check-evidence.mjs --update   re-record the fingerprints
//
// Why the third check exists. In-bounds is not the same as correct. On
// 2026-10-05 this library was carried forward onto a newer main with every
// anchor unchanged, and this script passed on all 133 sources while 58 of
// them pointed at unrelated code: `resolve.ts:160-167` had been the branch
// that sets `uncertain`, and by then it was the verbatim-match pass. A
// reader following the citation found something plausible and wrong, which
// is worse than a broken link, because a broken link announces itself.
//
// So every cited range is fingerprinted in skills/evidence.lock.json. The
// hash covers the cited lines with leading and trailing whitespace stripped,
// so reformatting does not raise an alarm and a changed word does. When the
// cited code legitimately moves or changes, re-anchor the citation, re-read
// the claim against the new lines, and run --update in the same commit so
// the diff shows a human decided.
import { readdirSync, readFileSync, existsSync, statSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const skillsDir = join(root, 'skills')
const lockPath = join(skillsDir, 'evidence.lock.json')
const update = process.argv.includes('--update')
const lock = existsSync(lockPath) ? JSON.parse(readFileSync(lockPath, 'utf8')) : {}
const fresh = {}
let checked = 0
let stale = 0
const problems = []

// The cited lines, whitespace-normalized, hashed. Keyed by skill/ref/path:range
// so a range that moves gets a new key and cannot inherit an old fingerprint.
const fingerprint = (lines, from, to) =>
  createHash('sha256')
    .update(lines.slice(from - 1, to).map((l) => l.trim()).join('\n'))
    .digest('hex')
    .slice(0, 16)

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
        if (nums.length === 2 && nums[0] > nums[1]) {
          problems.push(`${entry} ${ref}: ${path}:${part} is inverted`)
          continue
        }
        if (nums[0] < 1 || (nums[1] ?? nums[0]) > lines) continue
        const body = readFileSync(abs, 'utf8').replace(/\n$/, '').split('\n')
        const key = `${entry}/${ref}/${path}:${part}`
        const fp = fingerprint(body, nums[0], nums[1] ?? nums[0])
        fresh[key] = fp
        if (update) continue
        if (!(key in lock)) {
          problems.push(`${entry} ${ref}: ${path}:${part} has no recorded fingerprint (new or re-anchored citation; re-read the claim, then --update)`)
        } else if (lock[key] !== fp) {
          stale++
          problems.push(`${entry} ${ref}: ${path}:${part} has changed since it was cited — the claim may no longer hold (re-read it, re-anchor if it moved, then --update)`)
        }
      }
    }
  }

  for (const r of cited) if (!declared.has(r)) problems.push(`${entry}: body cites ${r}, not declared`)
  for (const r of declared) if (!cited.has(r)) problems.push(`${entry}: ${r} declared but never cited`)
}

if (update) {
  writeFileSync(lockPath, JSON.stringify(fresh, Object.keys(fresh).sort(), 2) + '\n')
  console.log(`fingerprints recorded: ${Object.keys(fresh).length} ranges in skills/evidence.lock.json`)
  process.exit(problems.length ? 1 : 0)
}

// A key in the lock that no citation claims any more is a citation that was
// moved or dropped. Not a failure, but worth saying, so the lock does not
// quietly accumulate.
const orphans = Object.keys(lock).filter((k) => !(k in fresh))

if (problems.length) {
  console.error(`evidence check FAILED (${problems.length}${stale ? `, ${stale} of them drifted` : ''})`)
  for (const p of problems) console.error('  ' + p)
  process.exit(1)
}
console.log(`evidence check OK: ${checked} sources resolved, ${Object.keys(fresh).length} ranges fingerprinted`)
if (orphans.length) console.log(`  note: ${orphans.length} stale lock entries, run --update to drop them`)
