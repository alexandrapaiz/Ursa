#!/usr/bin/env node
// The reading half of the receipts. `check-evidence.mjs` proves a citation's
// path exists, its range is in bounds, body and table agree, and the cited
// lines still hash to what they hashed to when the claim was written. None of
// those is a relevance check: a range can pass all four and fail to support
// the sentence that cites it, which is the 2026-10-15 ledger entry "The
// evidence lock's blind spot: a correct hash over the wrong lines". That
// failure shipped once in this library, an E3 anchored at two ranges holding
// neither the incident nor the argument the claim made, caught by hand.
//
//   node skills/relevance-sweep.mjs                 the queue, least-defended first
//   node skills/relevance-sweep.mjs <skill>[/<ref>] the dossier for one ref or one skill
//   node skills/relevance-sweep.mjs --audited       what has been read, and when
//
// What this tool does and does not do. It gathers: for each ref it puts the
// `what` field, the sentences that cite it, and the actual cited lines in one
// place, so reading a ref costs one command instead of five. It then orders
// the unread refs by two mechanical signals. It does not decide. Relevance is
// the part that needs a reader, which is why the verdicts live in a file a
// person writes, skills/relevance-audit.md, and not in a lock a script writes.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { sourcePaths, ranges as lineRanges } from './source-line.mjs'

const root = new URL('..', import.meta.url).pathname
const skillsDir = join(root, 'skills')
const auditPath = join(skillsDir, 'relevance-audit.md')

// Words that carry no claim, so their presence or absence in the cited lines
// says nothing. Kept deliberately short: a stoplist that grows starts hiding
// misses, which is the one thing this signal is for.
const STOP = new Set(['that', 'this', 'with', 'from', 'what', 'when', 'which', 'while',
  'they', 'them', 'than', 'then', 'there', 'their', 'have', 'into', 'over', 'only',
  'both', 'each', 'rather', 'because', 'since', 'every', 'same', 'other', 'another',
  'does', 'said', 'says', 'been', 'being', 'cannot', 'would', 'could', 'should',
  'thing', 'things', 'whether', 'where', 'about', 'after', 'before', 'under',
  'percent', 'ursa', 'skill', 'claim', 'document'])

const sentencesCiting = (body, ref) => {
  const out = []
  // Sentence-ish: split on a period or newline that ends a sentence, keep the
  // ones naming this ref. Crude on purpose; a reader is going to read it.
  for (const s of body.split(/(?<=[.:;])\s+|\n\n+/)) {
    const re = new RegExp(`\\[(?:E\\d+,\\s*)*${ref}(?:,\\s*E\\d+)*\\]`)
    if (re.test(s)) out.push(s.replace(/\s+/g, ' ').trim())
  }
  return out
}

const parseRanges = (sourceLine) => {
  const out = []
  for (const { path, ranges } of sourcePaths(sourceLine)) {
    const parts = lineRanges(ranges)
    if (!parts.length) { out.push({ path, from: null, to: null }); continue }
    for (const { from, to } of parts) out.push({ path, from, to })
  }
  return out
}

const citedText = (ranges) => {
  let text = ''
  const blocks = []
  for (const r of ranges) {
    const abs = join(root, r.path)
    if (!existsSync(abs)) { blocks.push({ ...r, lines: null }); continue }
    const all = readFileSync(abs, 'utf8').replace(/\n$/, '').split('\n')
    if (r.from === null) { blocks.push({ ...r, lines: null }); continue }
    const lines = all.slice(r.from - 1, r.to)
    text += lines.join('\n') + '\n'
    blocks.push({ ...r, lines })
  }
  return { text, blocks }
}

// Signal 1. The share of the `what` field's content words that do not appear
// anywhere in the cited lines. A high miss is not a verdict: code can embody a
// concept without naming it, and a `what` written in the record's vocabulary
// can be right about lines that use the code's. A low miss is not a pass
// either. It is an ordering over which refs are least defended by anything
// mechanical, and that is all it is.
const missing = (what, text) => {
  const hay = text.toLowerCase()
  const tokens = [...new Set(what.toLowerCase().match(/[a-z_][a-z_]{3,}/g) ?? [])]
    .filter((t) => !STOP.has(t))
  const miss = tokens.filter((t) => !hay.includes(t))
  return { tokens, miss }
}

// Signal 2. Conjuncts in the `what` field per cited line. The failure this
// sweep hunts arrives as a range that is too narrow for the claim standing on
// it, so a `what` that makes four assertions over two lines is worth reading
// before a `what` that makes one over forty.
const conjuncts = (what) => what.split(/,\s+|\s+and\s+/).filter((p) => p.trim().length > 8).length

const readAudit = () => {
  const seen = new Map()
  if (!existsSync(auditPath)) return seen
  for (const line of readFileSync(auditPath, 'utf8').split('\n')) {
    const m = line.match(/^\|\s*`([\w-]+)\/(E\d+)`\s*\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|/)
    if (m) seen.set(`${m[1]}/${m[2]}`, { verdict: m[3], date: m[4], note: m[5] })
  }
  return seen
}

const refs = []
for (const entry of readdirSync(skillsDir)) {
  const file = join(skillsDir, entry, 'SKILL.md')
  if (!existsSync(file) || !statSync(join(skillsDir, entry)).isDirectory()) continue
  const text = readFileSync(file, 'utf8')
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/)
  if (!fm) continue
  const body = text.slice(fm[0].length)
  for (const m of fm[1].matchAll(/- ref:\s*(\S+)\n\s*what:\s*([\s\S]*?)\n\s*source:\s*(.+)/g)) {
    const [, ref, whatRaw, sourceLine] = m
    const what = whatRaw.replace(/\s+/g, ' ').trim()
    const ranges = parseRanges(sourceLine)
    const { text: cited, blocks } = citedText(ranges)
    const lineCount = blocks.reduce((n, b) => n + (b.lines?.length ?? 0), 0)
    const { tokens, miss } = missing(what, cited)
    refs.push({
      entry, ref, what, sourceLine: sourceLine.trim(), blocks, lineCount,
      sentences: sentencesCiting(body, ref),
      unrangeable: blocks.every((b) => b.from === null),
      missRate: tokens.length ? miss.length / tokens.length : 0,
      miss, tokens,
      density: lineCount ? conjuncts(what) / lineCount : Infinity,
      conjuncts: conjuncts(what),
    })
  }
}

const audited = readAudit()
const args = process.argv.slice(2)
const flags = args.filter((a) => a.startsWith('--'))
const targets = args.filter((a) => !a.startsWith('--'))

const dossier = (r) => {
  const a = audited.get(`${r.entry}/${r.ref}`)
  console.log(`\n${'='.repeat(78)}\n${r.entry}/${r.ref}${a ? `   [read ${r.date ?? a.date}: ${a.verdict}]` : ''}`)
  console.log(`source: ${r.sourceLine}`)
  console.log(`what:   ${r.what}`)
  console.log(`signals: ${r.lineCount} cited lines, ${r.conjuncts} conjuncts, ` +
    `${r.miss.length}/${r.tokens.length} what-words absent` +
    (r.miss.length ? ` (${r.miss.join(' ')})` : ''))
  console.log(`\ncited by ${r.sentences.length} passage${r.sentences.length === 1 ? '' : 's'}:`)
  for (const s of r.sentences) console.log(`  · ${s}`)
  for (const b of r.blocks) {
    console.log(`\n--- ${b.path}${b.from === null ? '  (no line range: outside both guards)' : `:${b.from}-${b.to}`}`)
    if (!b.lines) continue
    b.lines.forEach((l, i) => console.log(`${String(b.from + i).padStart(5)}  ${l}`))
  }
}

if (targets.length) {
  const want = refs.filter((r) => targets.some((t) => t === r.entry || t === `${r.entry}/${r.ref}`))
  if (!want.length) { console.error(`no ref matches ${targets.join(' ')}`); process.exit(1) }
  for (const r of want) dossier(r)
  process.exit(0)
}

if (flags.includes('--audited')) {
  const done = refs.filter((r) => audited.has(`${r.entry}/${r.ref}`))
  console.log(`read: ${done.length} of ${refs.length} refs\n`)
  for (const r of done) {
    const a = audited.get(`${r.entry}/${r.ref}`)
    console.log(`  ${a.verdict.padEnd(9)} ${a.date}  ${r.entry}/${r.ref}  ${a.note}`)
  }
  process.exit(0)
}

const unrangeable = refs.filter((r) => r.unrangeable)
const queue = refs.filter((r) => !audited.has(`${r.entry}/${r.ref}`) && !r.unrangeable)
  .sort((a, b) => b.missRate - a.missRate || b.density - a.density)
const bySkill = {}
for (const r of refs) bySkill[r.entry] = (bySkill[r.entry] ?? 0) + 1
console.log(`relevance sweep: ${refs.length} refs, ${audited.size} read, ${queue.length} unread with a line range`)
for (const [k, v] of Object.entries(bySkill)) console.log(`  ${String(v).padStart(3)}  ${k}`)
console.log(`\nThe order is two mechanical signals, not a verdict. Read top-down.\n`)
console.log(`  miss  dens  lines  ref`)
for (const r of queue) {
  console.log(`  ${(r.missRate * 100).toFixed(0).padStart(3)}%  ${
    r.density.toFixed(2).padStart(4)}  ${
    String(r.lineCount).padStart(5)}  ${r.entry}/${r.ref}`)
}
// These are listed apart rather than at the top of the queue, even though they
// are the least defended refs in the library, because their signals are an
// artifact: there are no cited lines, so every word of the `what` field is
// absent from them and the miss rate is 100 percent by construction. They need
// a different reading. The question for a ranged ref is whether the lines
// support the sentence; for these it is whether the named section still exists
// and still says it, which no fingerprint will ever tell anyone.
const unread = unrangeable.filter((r) => !audited.has(`${r.entry}/${r.ref}`))
if (unread.length) {
  console.log(`\n${unread.length} unread refs cite a document and a section name rather than lines.`)
  console.log(`No fingerprint exists for them, so nothing mechanical defends them at all:`)
  for (const r of unread) console.log(`         ${r.sourceLine}   (${r.entry}/${r.ref})`)
}
