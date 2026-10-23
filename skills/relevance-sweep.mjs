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
//   node skills/relevance-sweep.mjs --record <scope> bind a verdict to what was read
//   node skills/relevance-sweep.mjs --stale          exit 1 if any verdict is unbound or stale
//
// A verdict is only as good as the lines it was read against, so each one is
// bound to them in skills/relevance.lock.json: three digests per ref, over the
// cited lines, the `what` field, and the passages citing it. When any of the
// three moves, the ref is read in the audit and stale here, and it is listed
// for a re-read with the input that moved named. This is the same failure the
// evidence lock already learned once, one level up: a fingerprint stops a hash
// from outliving its lines, and this stops a reading from outliving them. The
// library's own drift measurements are why it cannot wait: 27 of 44 ranges
// drifted on 2026-10-15 and 39 of 43 on 2026-10-18, so a library read once in
// October is a library read against October's text and nothing says so.
//
// The digest over the lines covers their content and their paths, never their
// line numbers, because relocate-anchors.mjs moves a range whose lines are
// identical and a verdict earned on those lines is still earned. A re-point
// to different text invalidates; a pure relocation does not.
//
// A dossier also names every ref this one SHARES A SENTENCE with, because a
// tag like `[E2, E4]` divides one claim between two refs and nothing audits
// the division; that is how slice 3 found its one bad range. And it names
// every other ref whose cited lines OVERLAP this one's,
// with its own `what`, because the one false claim slice 2 found was
// contradicted by another ref over the same helper and nothing mechanical ever
// compares two refs to each other. Overlap and not merely the same file: this
// library cites `resolve.ts` from twenty refs and they are not all about each
// other, so a same-file list is noise and a shared-lines list is a question.
//
// What this tool does and does not do. It gathers: for each ref it puts the
// `what` field, the sentences that cite it, and the actual cited lines in one
// place, so reading a ref costs one command instead of five. It then orders
// the unread refs by two mechanical signals. It does not decide. Relevance is
// the part that needs a reader, which is why the verdicts live in a file a
// person writes, skills/relevance-audit.md, and not in a lock a script writes.
import { readdirSync, readFileSync, existsSync, statSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { sourcePaths, ranges as lineRanges } from './source-line.mjs'
import { citingTexts } from './citing-files.mjs'

const root = new URL('..', import.meta.url).pathname
const skillsDir = join(root, 'skills')
const auditPath = join(skillsDir, 'relevance-audit.md')
const verdictLockPath = join(skillsDir, 'relevance.lock.json')

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
  // Every markdown file in the directory, SKILL.md first, because a passage in
  // a TRIGGER-TEST.md cites a ref as load-bearingly as one in the body and
  // used to be read by nothing. ./citing-files.mjs holds the defect.
  const citing = citingTexts(join(skillsDir, entry))
  for (const m of fm[1].matchAll(/- ref:\s*(\S+)\n\s*what:\s*([\s\S]*?)\n\s*source:\s*(.+)/g)) {
    const [, ref, whatRaw, sourceLine] = m
    const what = whatRaw.replace(/\s+/g, ' ').trim()
    const ranges = parseRanges(sourceLine)
    const { text: cited, blocks } = citedText(ranges)
    const lineCount = blocks.reduce((n, b) => n + (b.lines?.length ?? 0), 0)
    const { tokens, miss } = missing(what, cited)
    // Grouped by file for the dossier, flattened for everything else. The
    // flattening keeps SKILL.md's passages first and in their old order, so
    // the `passages` digest of a ref no other file cites is byte-identical to
    // what it was before this widening, and no verdict goes stale for a
    // change in a tool.
    const passages = citing
      .map(({ file, text: body }) => ({ file, sentences: sentencesCiting(body, ref) }))
      .filter((p) => p.sentences.length)
    refs.push({
      entry, ref, what, sourceLine: sourceLine.trim(), blocks, lineCount,
      passages,
      sentences: passages.flatMap((p) => p.sentences),
      unrangeable: blocks.every((b) => b.from === null),
      // Every source on this ref's line that carries no range, whether or not
      // the ref has other sources that do. `unrangeable` above is a property
      // of the ref and answers "can this be queued at all"; this is a property
      // of the sources and answers "is anything here undefended". Slice 5 of
      // the sweep found the two differ: a ref with one ranged source and one
      // unranged one was counted as ranged, so it never reached the queue and
      // never reached the list of refs the queue sets apart. Two citations
      // hid there, one of them with no range and no section name at all.
      unranged: blocks.filter((b) => b.from === null).map((b) => b.path),
      missRate: tokens.length ? miss.length / tokens.length : 0,
      miss, tokens,
      density: lineCount ? conjuncts(what) / lineCount : Infinity,
      conjuncts: conjuncts(what),
    })
  }
}

// Which other refs cite the same file. The slice-2 reading found
// `adjudicating-uncertain-spans/E4` and `quoting-a-number-from-an-outcome-record/E9`
// making opposite claims about the same flag in the same helper, and the lock
// was green over both, because it keys on one ref's own ranges and nothing in
// it ever compares two refs to each other. That contradiction was found by
// luck, by reading the second ref an hour after the first. This is the part
// that does not need luck: a dossier names every other ref citing any of its
// files, so a reader is shown the library's other statements about the same
// code while judging this one. It is not a check and it cannot be, since two
// refs about one file usually agree and should.
const overlaps = (a, b) =>
  a.path === b.path && a.from !== null && b.from !== null && a.from <= b.to && b.from <= a.to

const coCited = (r) => {
  const out = []
  for (const o of refs) {
    if (o === r) continue
    const shared = o.blocks.filter((ob) => r.blocks.some((mb) => overlaps(mb, ob)))
    if (shared.length) out.push({ ref: o, shared })
  }
  return out
}

// Which refs share a SENTENCE with this one. A tag like `[E2, E4]` divides one
// claim between two refs, and the division is the part nothing audits: each
// author knew which half was theirs and no tool knows either. Slice 3 found
// `running-an-outcome-record-trial/E4` that way. Its sentence says the merge
// exclusion "is written against parent count", the other half of a claim it
// shares with E2, and its range was four lines of comment that never mention
// parents. The test is ten lines below it. The ordering had E4 near the bottom
// of the slice at a 13 percent miss rate, so the signal did not find this and
// the neighbouring ref did. Twelve of the library's 182 citation tags name two
// refs, all twelve inside one skill, so this field is rarer than the overlap
// one and points inward rather than across a skill boundary.
const splitWith = (r) => {
  const out = new Map()
  for (const s of r.sentences) {
    for (const tag of s.match(/\[E\d+(?:,\s*E\d+)+\]/g) ?? []) {
      for (const id of tag.slice(1, -1).split(/,\s*/)) {
        if (id === r.ref || out.has(id)) continue
        const o = refs.find((x) => x.entry === r.entry && x.ref === id)
        if (o) out.set(id, o)
      }
    }
  }
  return [...out.values()]
}

const audited = readAudit()

// What a verdict was read against, hashed. Three inputs, hashed apart rather
// than together, because which one moved decides what the re-read costs: a
// reflowed passage is a minute and a re-pointed range is the whole reading
// again. Line content and paths, never line numbers, for the reason in the
// header. Whitespace per line is trimmed, matching the evidence lock, so
// reformatting is not an alarm and a changed word is.
const hash = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16)
const readAgainst = (r) => ({
  lines: hash(r.blocks.map((b) =>
    `${b.path}\n${(b.lines ?? ['(no line range)']).map((l) => l.trim()).join('\n')}`).join('\n')),
  what: hash(r.what),
  passages: hash(r.sentences.map((x) => x.trim()).join('\n')),
})

const verdictLock = existsSync(verdictLockPath)
  ? JSON.parse(readFileSync(verdictLockPath, 'utf8'))
  : {}

// The audit file is the authority on the verdict; the lock is the authority on
// what the verdict was read against. So a lock entry whose verdict or date no
// longer matches the audit row is not evidence about today's verdict at all,
// and the ref counts as unbound rather than as bound to something else.
const verdictState = (r) => {
  const key = `${r.entry}/${r.ref}`
  const a = audited.get(key)
  if (!a) return null
  const rec = verdictLock[key]
  if (!rec) return { key, audit: a, status: 'unbound', why: 'no verdict digest recorded' }
  if (rec.verdict !== a.verdict || rec.read !== a.date) {
    return { key, audit: a, status: 'unbound', why: `the audit row now reads ${a.verdict} ${a.date} and the lock was written for ${rec.verdict} ${rec.read}` }
  }
  const now = readAgainst(r)
  const moved = ['lines', 'what', 'passages'].filter((k) => rec[k] !== now[k])
  if (moved.length) return { key, audit: a, status: 'stale', why: `${moved.join(' and ')} changed since it was read`, moved }
  return { key, audit: a, status: 'bound' }
}

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
  // Attributed per file once there is more than one, because a prompt in a
  // trigger test and a step in the procedure are different kinds of claim to
  // stand on a range, and a reader judging the range should know which it is.
  for (const p of r.passages) {
    if (r.passages.length > 1) console.log(`  ${p.file}:`)
    for (const s of p.sentences) console.log(`  · ${s}`)
  }
  const split = splitWith(r)
  if (split.length) {
    console.log(`\n${split.length} other ref${split.length === 1 ? '' : 's'} ` +
      `${split.length === 1 ? 'shares' : 'share'} a sentence with this one, so the claim is ` +
      `divided. Check which half is yours:`)
    for (const o of split) {
      const oa = audited.get(`${o.entry}/${o.ref}`)
      console.log(`  · ${o.entry}/${o.ref}${oa ? ` [${oa.verdict}]` : ''}  ${o.sourceLine}`)
      console.log(`      ${o.what}`)
    }
  }
  const also = coCited(r)
  if (also.length) {
    console.log(`\n${also.length} other ref${also.length === 1 ? ' cites' : 's cite'} overlapping lines. ` +
      `Read what they claim about the same code:`)
    for (const { ref: o, shared } of also) {
      const oa = audited.get(`${o.entry}/${o.ref}`)
      console.log(`  · ${o.entry}/${o.ref}${oa ? ` [${oa.verdict}]` : ''}  ` +
        `${shared.map((b) => `${b.path}:${b.from}-${b.to}`).join(', ')}`)
      console.log(`      ${o.what}`)
    }
  }
  for (const b of r.blocks) {
    console.log(`\n--- ${b.path}${b.from === null ? '  (no line range: outside both guards)' : `:${b.from}-${b.to}`}`)
    if (!b.lines) continue
    b.lines.forEach((l, i) => console.log(`${String(b.from + i).padStart(5)}  ${l}`))
  }
}

// `--record <scope>` writes the digests for refs the audit already has a
// verdict for. It refuses a bare `--record`, the way `check-evidence.mjs
// --update` learned to: an unscoped re-record on 2026-10-18 turned 43 red
// ranges green with nobody reading anything and a zero exit status, and this
// file would fail the same way one level up, by blessing a stale verdict as
// freshly read. Naming the scope is the act that says a person decided.
if (flags.includes('--record')) {
  if (!targets.length) {
    console.error('--record needs a scope: a skill slug, or skill/ref, one or more.')
    console.error('A bare --record would bind every verdict in the audit to whatever')
    console.error('the tree says today, which is the one thing this lock exists to stop.')
    process.exit(1)
  }
  const want = refs.filter((r) => targets.some((t) => t === r.entry || t === `${r.entry}/${r.ref}`))
  if (!want.length) { console.error(`no ref matches ${targets.join(' ')}`); process.exit(1) }
  const next = { ...verdictLock }
  const wrote = []
  const skipped = []
  for (const r of want) {
    const key = `${r.entry}/${r.ref}`
    const a = audited.get(key)
    if (!a) { skipped.push(`${key}  no verdict in relevance-audit.md`); continue }
    const before = verdictLock[key]
    next[key] = { verdict: a.verdict, read: a.date, ...readAgainst(r) }
    wrote.push(`${key}  ${a.verdict} ${a.date}${before ? ' (rebound)' : ''}`)
  }
  const sorted = {}
  for (const k of Object.keys(next).sort()) sorted[k] = next[k]
  writeFileSync(verdictLockPath, JSON.stringify(sorted, null, 2) + '\n')
  console.log(`bound ${wrote.length} verdict${wrote.length === 1 ? '' : 's'} to what was read:`)
  for (const w of wrote) console.log(`  ${w}`)
  if (skipped.length) {
    console.log(`\n${skipped.length} ref${skipped.length === 1 ? '' : 's'} in scope had nothing to bind:`)
    for (const w of skipped) console.log(`  ${w}`)
  }
  process.exit(0)
}

// `--stale` is the exit status the reading step never had. The default run
// reports the same thing in prose and still exits 0, because a queue is not a
// failure; an unbound or stale verdict is, and a check that cannot fail is a
// check nobody runs twice.
if (flags.includes('--stale')) {
  const states = refs.map(verdictState).filter(Boolean)
  const bad = states.filter((v) => v.status !== 'bound')
  const unread = refs.filter((r) => !audited.has(`${r.entry}/${r.ref}`))
  for (const v of bad) console.log(`${v.status.padEnd(7)} ${v.key}  ${v.why}`)
  console.log(`${states.length - bad.length} of ${states.length} verdicts bound to what was read` +
    `, ${unread.length} ref${unread.length === 1 ? '' : 's'} unread`)
  process.exit(bad.length ? 1 : 0)
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
    const v = verdictState(r)
    console.log(`  ${a.verdict.padEnd(9)} ${a.date}  ${
      (v.status === 'bound' ? '' : v.status).padEnd(8)}${r.entry}/${r.ref}  ${a.note}`)
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

// Counted apart from the block above, and the reason is the whole point of it.
// A ref whose sources are mixed has a range, so it is in the queue and its
// signals mean something, and it is not in the list above either. Its unranged
// source is therefore invisible twice over, which is how the least defended
// citation in this library stayed unread through four slices.
const partly = refs.filter((r) => r.unranged.length && !r.unrangeable)
if (partly.length) {
  console.log(`\n${partly.length} refs are in the queue above and still carry an unranged source:`)
  for (const r of partly) console.log(`         ${r.unranged.join(', ')}   (${r.entry}/${r.ref})`)
}
const unrangedSources = refs.reduce((n, r) => n + r.unranged.length, 0)
console.log(`\n${unrangedSources} unranged sources in all, across ${
  refs.filter((r) => r.unranged.length).length} refs. Count sources, not refs: a ref is`)
console.log(`defended only as well as its weakest citation.`)

// The queue above answers which refs nobody has read. This answers which of
// the read ones were read against text the repository has since changed, which
// is a different question and the one a closed sweep turns into: on the day it
// closed, every ref in this library was read, and on any later day some of
// those readings are about lines that are gone.
const states = refs.map(verdictState).filter(Boolean)
const unbound = states.filter((v) => v.status === 'unbound')
const staleVerdicts = states.filter((v) => v.status === 'stale')
console.log(`\n${states.length - unbound.length - staleVerdicts.length} of ${
  states.length} verdicts are bound to what was read.`)
if (unbound.length) {
  console.log(`\n${unbound.length} verdict${unbound.length === 1 ? ' is' : 's are'} unbound, so nothing says what ${
    unbound.length === 1 ? 'it was' : 'they were'} read against:`)
  for (const v of unbound) console.log(`  ${v.key}  ${v.why}`)
  console.log(`  Bind them with --record, naming the skill or the ref.`)
}
if (staleVerdicts.length) {
  console.log(`\n${staleVerdicts.length} verdict${staleVerdicts.length === 1 ? ' was' : 's were'} read against text that has changed since. Re-read ${
    staleVerdicts.length === 1 ? 'it' : 'them'}, then --record:`)
  for (const v of staleVerdicts) console.log(`  ${v.key}  ${v.audit.verdict} ${v.audit.date}, ${v.why}`)
}
