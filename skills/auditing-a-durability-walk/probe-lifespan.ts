// What the durability walk reports, measured rather than read.
//
// Run from ursa-major/ (after `npm ci`):
//   npx tsx ../skills/auditing-a-durability-walk/probe-lifespan.ts
//
// Four probes, each building a real git repository in a temp dir and calling
// annotateDurability() on it, because the thing under test is what the walk
// does to real history rather than what its field names suggest. Cited by
// SKILL.md as measured facts under prompts/skill-extract.md §5b, which asks
// for the command and not the number.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { annotateDurability } from '../../ursa-major/src/lifespan'
import type { OutcomeRecord } from '../../ursa-major/src/types'

// Author identity through the environment, not `git config`, for the reason
// the long note in ursa-major/src/m0.test.ts gives: GIT_AUTHOR_NAME outranks
// a repository's user.name, so a fixture relying on `git config` is authored
// by whoever runs it.
const ENV = {
  GIT_AUTHOR_NAME: 'Human Owner', GIT_AUTHOR_EMAIL: 'human@example.com',
  GIT_COMMITTER_NAME: 'Human Owner', GIT_COMMITTER_EMAIL: 'human@example.com',
}
const sh = (d: string, a: string[]) =>
  execFileSync('git', a, { cwd: d, env: { ...process.env, ...ENV }, encoding: 'utf8' })

// One sentence, comfortably over MIN_TRACEABLE_LEN, with vocabulary the other
// strings here do not share, so the token-containment tier cannot rescue it
// with a neighbour's words.
const A = 'The resolver joins each finished file back to the generation that produced it every time.'
const B = 'Retention through the following commit is treated as sufficient evidence of acceptance here.'

function repo(): string {
  const d = mkdtempSync(join(tmpdir(), 'durability-probe-'))
  sh(d, ['init', '-q', '-b', 'main'])
  return d
}
function commit(d: string, path: string, body: string, msg: string): string {
  writeFileSync(join(d, path), body)
  sh(d, ['add', '-A'])
  sh(d, ['commit', '-q', '-m', msg])
  return sh(d, ['rev-parse', 'HEAD']).trim()
}
// A record is only ever read here for its durability block and its spans, so
// the two fields the walk touches are the two the fixture carries.
const record = (path: string, spans: unknown[]) =>
  ({ files: [{ path, spans }] }) as unknown as OutcomeRecord
const span = (text: string, cls: string) =>
  ({ start: 0, end: text.length, text, class: cls })
const NOW = () => new Date().toISOString()

// --- 1 -----------------------------------------------------------------
// durableChars is not the chars of durableSpans. One span, two sentences,
// the second deleted: the span is `eroded`, so durableSpans counts zero of
// it, while durableChars still takes the surviving sentence's characters.
{
  const d = repo()
  const closing = commit(d, 'g.md', `${A}\n\n${B}\n`, 'the agent writes both sentences')
  commit(d, 'g.md', `${A}\n`, 'the human deletes the second sentence')
  const r = record('g.md', [span(`${A}\n\n${B}`, 'survived_verbatim')])
  annotateDurability(d, r, closing, NOW())
  const l = r.files[0].spans[0].lifespan!, u = r.durability!
  console.log('1  one eroded span')
  console.log(`1  fate=${l.fate} unitsTraced=${l.unitsTraced} unitsSurviving=${l.unitsSurviving} basis=${l.basis}`)
  console.log(`1  durableSpans=${u.durableSpans} erodedSpans=${u.erodedSpans} decayedSpans=${u.decayedSpans} testedSpans=${u.testedSpans}`)
  console.log(`1  durableChars=${u.durableChars} decayedChars=${u.decayedChars} decayRate=${u.decayRate}`)
  console.log(`1  >> durableSpans is ${u.durableSpans} and durableChars is ${u.durableChars}`)
  console.log(`1  >> basis is one value for a span that had a unit die: ${l.basis}`)
}

// --- 2 -----------------------------------------------------------------
// The cap selects the NEWEST maxRevisions revisions, not the oldest. git
// applies --max-count before --reverse, which firstVanish's own doc comment
// warns about and logOnePath does anyway. The span below dies at the first
// commit after the episode; under a cap smaller than the history, the walk
// never sees that commit and blames a later innocent one.
{
  const d = repo()
  const closing = commit(d, 'g.md', `${A}\n`, 'the agent writes A')
  const killer = commit(d, 'g.md', 'the human replaced the file on the very first edit after the episode.\n', 'edit 1: A dies HERE')
  for (let i = 2; i <= 6; i++) {
    commit(d, 'g.md', `the human replaced the file on the very first edit after the episode.\n\nlater unrelated note ${i} that keeps the file changing.\n`, `edit ${i}`)
  }
  console.log('2  six revisions after the episode; A is removed by the first of them')
  for (const cap of [3, 50]) {
    const r = record('g.md', [span(A, 'survived_verbatim')])
    annotateDurability(d, r, closing, NOW(), cap)
    const l = r.files[0].spans[0].lifespan!
    const blamed = l.diedAtSha ? sh(d, ['log', '-1', '--format=%s', l.diedAtSha]).trim() : '-'
    console.log(`2  cap=${String(cap).padEnd(2)} fate=${l.fate} diedAt="${blamed}"`)
  }
  console.log(`2  >> the commit that actually removed it: "${sh(d, ['log', '-1', '--format=%s', killer]).trim()}"`)
}

// --- 3 -----------------------------------------------------------------
// A span whose every unit falls under MIN_TRACEABLE_LEN is `untested`, and
// an untested span is skipped by the record totals, so a deletion the walk
// did witness is absent from decayRate rather than counted against it.
{
  const d = repo()
  const short = 'return nil'
  const closing = commit(d, 'g.md', `${short}\n`, 'the agent writes a short span')
  commit(d, 'g.md', 'entirely different text now lives in this file.\n', 'the human deletes it')
  const r = record('g.md', [span(short, 'survived_verbatim')])
  annotateDurability(d, r, closing, NOW())
  const l = r.files[0].spans[0].lifespan!, u = r.durability!
  console.log('3  one span of ten characters, deleted at the next commit')
  console.log(`3  fate=${l.fate} skipped=${l.skipped} unitsTraced=${l.unitsTraced}`)
  console.log(`3  >> testedSpans=${u.testedSpans} decayRate=${u.decayRate}: the deletion is not in the rate`)
}

// --- 4 -----------------------------------------------------------------
// decayRate is a property of the record AND of the tip it was walked to.
// The same record, the same closing commit, two tips, two answers.
{
  const d = repo()
  const closing = commit(d, 'g.md', `${A}\n`, 'the agent writes A')
  commit(d, 'g.md', `${A}\n\nthe human added a paragraph underneath and kept the original.\n`, 'the human keeps it')
  const r1 = record('g.md', [span(A, 'survived_verbatim')])
  annotateDurability(d, r1, closing, NOW())
  commit(d, 'g.md', 'the human later replaced the whole file with something unrelated.\n', 'the human removes it')
  const r2 = record('g.md', [span(A, 'survived_verbatim')])
  annotateDurability(d, r2, closing, NOW())
  console.log('4  same record, same closingSha, walked at two different tips')
  console.log(`4  tip 1: decayRate=${r1.durability!.decayRate} fate=${r1.files[0].spans[0].lifespan!.fate} tipSha=${r1.durability!.tipSha!.slice(0, 8)}`)
  console.log(`4  tip 2: decayRate=${r2.durability!.decayRate} fate=${r2.files[0].spans[0].lifespan!.fate} tipSha=${r2.durability!.tipSha!.slice(0, 8)}`)
}
