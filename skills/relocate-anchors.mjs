#!/usr/bin/env node
// skills/relocate-anchors.mjs — move citation anchors that main moved under them.
//
//   node skills/relocate-anchors.mjs <old-ref>           show what it would do
//   node skills/relocate-anchors.mjs <old-ref> --write   do it
//
// Why this exists. check-evidence.mjs fingerprints every cited line range, so
// when main moves the cited code the lock goes red and the library is honest
// about being stale. It cannot tell you which kind of stale. Two runs measured
// that split by hand: on 2026-10-15 a merge tripped 44 of 144 ranges and 27
// were pure relocation, and on 2026-10-18 it tripped 43 of 154 and 39 were.
// So nine tenths of a drift batch is a line number that moved while the lines
// said the same thing, and that tenth which is not is the only part worth a
// person's attention. Both runs wrote this pass from scratch and threw it
// away. This is the same pass, committed.
//
// What it does, and the one guarantee that makes it safe. For each drifted
// range it recovers the as-cited lines from <old-ref>, the tree the citation
// was written against, and refuses to proceed on any range whose lines at
// <old-ref> do not hash to the fingerprint the lock recorded — if they do not,
// that ref is not the tree the citation came from and nothing here can be
// trusted. Then it looks for that block of lines in the working tree. Exactly
// one match is a relocation. Zero matches means the text changed rather than
// moved. More than one means a person has to choose, and this tool will not
// choose by proximity, because the 2026-10-18 run resolved all three of its
// ambiguous ranges by the block each line sat in and two of them would have
// come out wrong on distance alone.
//
// Because the match is on the same whitespace-trimmed lines the fingerprint is
// taken over, a relocated range's new fingerprint is identical to the old one
// by construction. So --write carries that one value across to the new key in
// evidence.lock.json and leaves every other key alone. That is deliberately
// not `check-evidence.mjs --update`, which would re-record every range in the
// library including the ones whose claims no longer hold. Nothing is blessed
// here that was not already verified.
//
// It never edits prose. A relocated anchor means the claim's text is byte
// identical modulo whitespace, not that the claim is still well stated, and
// the sentence citing it is still yours to read.
import { readdirSync, readFileSync, existsSync, statSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const skillsDir = join(root, 'skills')
const lockPath = join(skillsDir, 'evidence.lock.json')

// Same hash as check-evidence.mjs, and it has to stay the same: the whole
// safety argument is that a fingerprint computed here equals one computed
// there over the same lines.
export const fingerprint = (lines, from, to) =>
  createHash('sha256')
    .update(lines.slice(from - 1, to).map((l) => l.trim()).join('\n'))
    .digest('hex')
    .slice(0, 16)

const splitLines = (text) => text.replace(/\n$/, '').split('\n')

// Every cited range in one SKILL.md, with the character offset of the range
// text itself so a rewrite can be surgical. Offsets matter because one source
// line holds several paths and one path holds several ranges, so there is no
// string in the file unique enough to search for.
export function citedRanges(text, entry) {
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/)
  if (!fm) return []
  const fmOffset = 4 // fm[0] is "---\n" + fm[1] + "\n---\n"
  const out = []
  for (const m of fm[1].matchAll(/- ref:\s*(\S+)\n(?:.*\n)*?\s*source:\s*(.+)/g)) {
    const [, ref, sourceLine] = m
    // Both regexes end with the group being located, so the group sits at the
    // tail of its own match and its offset is a subtraction rather than a search.
    const sourceAbs = fmOffset + m.index + (m[0].length - sourceLine.length)
    for (const hit of sourceLine.matchAll(/([\w./-]+\.(?:ts|md|json|mjs))(?::([\d,-]+))?/g)) {
      const [whole, path, ranges] = hit
      if (!ranges) continue
      const rangesAbs = sourceAbs + hit.index + (whole.length - ranges.length)
      let cursor = 0
      for (const part of ranges.split(',')) {
        const partAbs = rangesAbs + cursor
        cursor += part.length + 1 // the comma
        if (!/^\d+(?:-\d+)?$/.test(part)) continue
        const nums = part.split('-').map(Number)
        out.push({
          entry,
          ref,
          path,
          part,
          partAbs,
          from: nums[0],
          to: nums[1] ?? nums[0],
          spanned: part.includes('-'),
          key: `${entry}/${ref}/${path}:${part}`,
        })
      }
    }
  }
  return out
}

// Where a block of trimmed lines sits in a file now. Returns every match,
// because the count is the decision: one is mechanical, anything else is not.
export function locate(haystackLines, needleLines) {
  const hay = haystackLines.map((l) => l.trim())
  const needle = needleLines.map((l) => l.trim())
  const at = []
  for (let i = 0; i + needle.length <= hay.length; i++) {
    let ok = true
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) { ok = false; break }
    if (ok) at.push(i + 1)
  }
  return at
}

const formatRange = (start, length, spanned) =>
  length > 1 || spanned ? `${start}-${start + length - 1}` : String(start)

function main(argv) {
  const write = argv.includes('--write')
  const oldRef = argv.find((a) => !a.startsWith('--'))
  if (!oldRef) {
    console.error('usage: node skills/relocate-anchors.mjs <old-ref> [--write]')
    console.error('  <old-ref> is the git ref whose tree the current citations were written against,')
    console.error('  e.g. the first parent of the merge that moved everything.')
    return 2
  }
  if (!existsSync(lockPath)) {
    console.error(`no ${lockPath}; run check-evidence.mjs --update first`)
    return 2
  }
  const lock = JSON.parse(readFileSync(lockPath, 'utf8'))

  const oldFiles = new Map()
  const atOldRef = (path) => {
    if (!oldFiles.has(path)) {
      try {
        oldFiles.set(path, splitLines(execFileSync('git', ['show', `${oldRef}:${path}`],
          { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })))
      } catch {
        oldFiles.set(path, null)
      }
    }
    return oldFiles.get(path)
  }

  const nowFiles = new Map()
  const inTree = (path) => {
    if (!nowFiles.has(path)) {
      const abs = join(root, path)
      nowFiles.set(path, existsSync(abs) ? splitLines(readFileSync(abs, 'utf8')) : null)
    }
    return nowFiles.get(path)
  }

  const ranges = []
  for (const entry of readdirSync(skillsDir)) {
    const file = join(skillsDir, entry, 'SKILL.md')
    if (!existsSync(file) || !statSync(join(skillsDir, entry)).isDirectory()) continue
    ranges.push(...citedRanges(readFileSync(file, 'utf8'), entry))
  }

  const moved = []
  const needsAPerson = []
  let settled = 0
  let unlocked = 0

  for (const r of ranges) {
    const expected = lock[r.key]
    if (expected === undefined) { unlocked++; continue }
    const now = inTree(r.path)
    const inBounds = now && r.from >= 1 && r.to <= now.length && r.from <= r.to
    if (inBounds && fingerprint(now, r.from, r.to) === expected) { settled++; continue }

    const gone = (why) => needsAPerson.push({ ...r, kind: 'gone', why })

    const old = atOldRef(r.path)
    if (!old) { gone(`${r.path} is not in the tree at ${oldRef}`); continue }
    if (r.from < 1 || r.to > old.length || r.from > r.to) {
      gone(`the range is out of bounds at ${oldRef} too, so the citation was never right`); continue
    }
    if (fingerprint(old, r.from, r.to) !== expected) {
      gone(`the lines at ${oldRef} do not match the recorded fingerprint, so this is not the tree the citation was written against`); continue
    }
    const cited = old.slice(r.from - 1, r.to)
    if (cited.every((l) => l.trim() === '')) { gone('the as-cited text is blank, so there is nothing to search for'); continue }
    if (!now) { gone(`${r.path} does not exist any more`); continue }

    const at = locate(now, cited)
    if (at.length === 0) {
      gone('the as-cited text is not in the file any more, so it changed rather than moved'); continue
    }
    if (at.length > 1) {
      needsAPerson.push({ ...r, kind: 'ambiguous', why: `matches at ${at.map((s) => formatRange(s, cited.length, r.spanned)).join(', ')}` })
      continue
    }
    const part = formatRange(at[0], cited.length, r.spanned)
    if (part === r.part) {
      gone('the text is where the citation says it is, so the drift is not a move'); continue
    }
    const newKey = `${r.entry}/${r.ref}/${r.path}:${part}`
    if (newKey in lock && lock[newKey] !== expected) {
      gone(`relocating onto ${part} would collide with another citation's fingerprint`); continue
    }
    moved.push({ ...r, newPart: part, newKey, fp: expected })
  }

  const drifted = moved.length + needsAPerson.length
  console.log(`relocate-anchors: ${ranges.length} cited ranges, ${settled} settled, ${drifted} drifted`)
  console.log(`  ${moved.length} relocated, text unchanged`)
  console.log(`  ${needsAPerson.filter((n) => n.kind === 'gone').length} text changed, needs a person`)
  console.log(`  ${needsAPerson.filter((n) => n.kind === 'ambiguous').length} matched in more than one place, needs a person`)
  if (unlocked) console.log(`  ${unlocked} with no recorded fingerprint, left alone`)

  if (moved.length) {
    console.log(`\nRelocated${write ? '' : ' (dry run, nothing written)'}:`)
    for (const m of moved) console.log(`  ${m.entry} ${m.ref}  ${m.path}:${m.part} -> ${m.newPart}`)
  }
  for (const [kind, heading] of [['gone', 'Text changed, read these'], ['ambiguous', 'Matched in more than one place, read these']]) {
    const group = needsAPerson.filter((n) => n.kind === kind)
    if (!group.length) continue
    console.log(`\n${heading}:`)
    for (const n of group) {
      console.log(`  ${n.entry} ${n.ref}  ${n.path}:${n.part}`)
      console.log(`      ${n.why}`)
    }
  }

  if (!write) {
    if (moved.length) console.log(`\nNothing written. Re-run with --write to apply ${moved.length} relocation${moved.length === 1 ? '' : 's'}.`)
    return drifted ? 1 : 0
  }

  // Edit each SKILL.md from the back, so an earlier rewrite cannot shift a
  // later offset. Every replacement is checked against the text it claims to
  // be replacing, and one mismatch abandons the whole file rather than
  // writing a half-corrected citation.
  const byEntry = new Map()
  for (const m of moved) {
    if (!byEntry.has(m.entry)) byEntry.set(m.entry, [])
    byEntry.get(m.entry).push(m)
  }
  for (const [entry, edits] of byEntry) {
    const file = join(skillsDir, entry, 'SKILL.md')
    let text = readFileSync(file, 'utf8')
    for (const e of [...edits].sort((a, b) => b.partAbs - a.partAbs)) {
      const found = text.slice(e.partAbs, e.partAbs + e.part.length)
      if (found !== e.part) {
        console.error(`\nrefusing to write ${entry}: expected "${e.part}" at offset ${e.partAbs}, found "${found}"`)
        return 3
      }
      text = text.slice(0, e.partAbs) + e.newPart + text.slice(e.partAbs + e.part.length)
    }
    writeFileSync(file, text)
  }

  // The fingerprint moves with the citation and does not change value. Drop
  // the old key so the lock does not accumulate orphans the checker then has
  // to mention.
  for (const m of moved) {
    delete lock[m.key]
    lock[m.newKey] = m.fp
  }
  writeFileSync(lockPath, JSON.stringify(lock, Object.keys(lock).sort(), 2) + '\n')

  console.log(`\nWrote ${byEntry.size} skill file${byEntry.size === 1 ? '' : 's'} and carried ${moved.length} fingerprint${moved.length === 1 ? '' : 's'} across in skills/evidence.lock.json.`)
  const left = needsAPerson.length
  if (left) {
    console.log(`Now read the ${left} range${left === 1 ? '' : 's'} above. Do not run \`check-evidence.mjs --update\` to clear them:`)
    console.log(`it re-records every range in the library, including the claims that stopped being true.`)
  } else {
    console.log(`Nothing left needs a person. \`node skills/check-evidence.mjs\` should be green.`)
  }
  return left ? 1 : 0
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv.slice(2)))
