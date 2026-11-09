#!/usr/bin/env node
// Stale blockers: a ledger entry whose stated reason for not shipping has
// stopped being true.
//
//   node tools/ledger/check-blockers.mjs [path-to-ledger]
//   node tools/ledger/check-blockers.mjs --grade        # re-derive GRADED
//   node tools/ledger/check-blockers.mjs --open 1,2,3   # fixture open set
//
// Exit 0 when every named row is still open. Exit 1 when at least one claim
// names a row that has left the open set, which is a seat's to repair. Exit 2
// when the forge's open set could not be read, because silence over a scope
// nothing measured reads as clean. The three codes and the seat/environment
// split are `check-closures.mjs`'s contract, reproduced here for the reason
// that file gives: a reader who has learned one of this directory's gates has
// learned all of them.
//
// WHY THIS IS ONE FORGE CALL AND NOT ONE PER CLAIM. `gh pr list --state open`
// is the authority on openness and it answers for every row at once, so the
// predicate is membership in that set rather than a `gh pr view` per
// reference. Taken from `tools/registers/check-ids.mjs`, which resolves the
// same question the same way; the shape is reused rather than re-derived so
// the two gates cannot disagree about what "open" means. It also means a
// merged row and a closed-unmerged row are treated alike, which is correct
// for this gate's question: both have stopped being a reason to wait. The
// finding prints which of the two it was, because they ask opposite things of
// the seat — a merged blocker means the work is now takeable, and a closed
// one means the approach it was waiting for was abandoned.
//
// All parsing and all deciding is in `./blockers.mjs`, which runs no network
// and reads no files, so the whole decision is drivable from a fixture
// through `--open`. Importing this file does nothing.

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

import { LOCUS } from '../gates/verdict-shape.mjs'
import { GRADED, UNRESOLVABLE_SHAPES, blockerClaims, entries, staleBlockers } from './blockers.mjs'
import { verdict } from './blockers-verdict.mjs'

/** The forge's open pull request numbers, or null when it could not be asked.
 *  Null rather than an empty set, and the distinction is the whole of this
 *  function: an empty set makes every claim stale, so a gate that conflated
 *  the two would report the entire ledger as rotten the first time `gh` was
 *  unauthenticated.
 *  @returns {{open: Set<number>|null, why: string|null}} */
export function openPullRequests() {
  try {
    const raw = execFileSync(
      'gh',
      ['pr', 'list', '--state', 'open', '--limit', '500', '--json', 'number'],
      { encoding: 'utf8' },
    )
    return { open: new Set(JSON.parse(raw).map((pr) => pr.number)), why: null }
  } catch (error) {
    return { open: null, why: String(error.message).split('\n')[0] }
  }
}

/** Whether a row that has left the open set was merged or abandoned, which
 *  decides what the finding asks of the seat. Unknown is reported as unknown:
 *  a gate that guessed `merged` would tell a seat to go take work whose
 *  approach had been rejected.
 *  @param {number} number @returns {'merged'|'closed'|'unknown'} */
export function dispositionOf(number) {
  try {
    const raw = execFileSync(
      'gh',
      ['pr', 'view', String(number), '--json', 'state,mergedAt'],
      { encoding: 'utf8' },
    )
    const pr = JSON.parse(raw)
    if (pr.mergedAt) return 'merged'
    return pr.state === 'CLOSED' ? 'closed' : 'unknown'
  } catch {
    return 'unknown'
  }
}

/** One printed line per stale blocker. Separated from the printing so a test
 *  can assert the sentence without a forge.
 *  @param {ReturnType<typeof staleBlockers>[number]} s
 *  @param {Record<number, 'merged'|'closed'|'unknown'>} how
 *  @returns {{held: string, code: string, message: string}} */
export function findingFor(s, how = {}) {
  const parts = s.retired.map((n) => {
    const d = how[n] ?? 'unknown'
    if (d === 'merged') return `#${n} is merged, so the work it was waiting for is takeable`
    if (d === 'closed') return `#${n} was closed without merging, so the approach it was waiting for was abandoned and this entry may be dead rather than ready`
    return `#${n} has left the open set and the forge did not say whether it merged`
  })
  return {
    held: LOCUS.SEAT,
    code: s.code,
    message:
      `"${s.title}" (- Status: ${s.status ?? 'none declared'}) states a blocker ` +
      `that is no longer a fact: ${JSON.stringify(s.sentence)}. ${parts.join('; ')}.`,
  }
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href

if (invokedDirectly) {
  const argv = process.argv.slice(2)
  const flag = (name) => {
    const i = argv.indexOf(name)
    return i === -1 ? undefined : argv[i + 1]
  }

  if (argv.includes('--grade')) {
    // Re-derives the two numbers `GRADED` publishes rather than reprinting
    // them, because a measurement whose value changes without anyone touching
    // it cannot live in prose — which is `prompts/engineer-agent.md`'s own
    // finding about the branch-pattern count, applied to this file.
    const source = readFileSync(flag('--grade') ?? 'docs/ideas.md', 'utf8')
    const all = entries(source)
    const sameSentence = blockerClaims(source)
    const entryScoped = all.filter(
      (e) =>
        /\b(blocked on|blocked by|is blocked|was blocked|blocked until|depends on|gated on|gate it on|waiting on|cannot be taken until)\b/i.test(
          `${e.title} ${e.body}`,
        ) && /(?:(?:Ursa|alexandria|alexandra-systems|epitome)\s*)?#\d{2,5}(?!\d)/.test(`${e.title} ${e.body}`),
    )
    console.log(`entries:                 ${all.length}   (GRADED says ${GRADED.entries})`)
    console.log(`entry-scoped hits:       ${entryScoped.length}   (GRADED says ${GRADED.entry_scoped_hits})`)
    console.log(`same-sentence hits:      ${sameSentence.length}   (GRADED says ${GRADED.same_sentence_hits})`)
    console.log(`read_at in GRADED:       ${GRADED.read_at}`)
    for (const e of entryScoped) console.log(`  entry-scoped: ${e.title.slice(0, 92)}`)
    for (const c of sameSentence) console.log(`  same-sentence: ${c.sentence.slice(0, 92)}`)
    // Exit 1 when the file has moved under the published numbers, so this is
    // a check and not a report.
    const drifted =
      all.length !== GRADED.entries ||
      entryScoped.length !== GRADED.entry_scoped_hits ||
      sameSentence.length !== GRADED.same_sentence_hits
    if (drifted) {
      console.error(
        'GRADED no longer describes this ledger. Re-read it, re-read the new hits in ' +
          'context, and update GRADED in tools/ledger/blockers.mjs with the new ' +
          'read_at. A grading nobody re-derived is the defect this flag exists to find.',
      )
    }
    process.exit(drifted ? 1 : 0)
  }

  // The positional argument, which is every token that is neither a flag nor
  // the VALUE of a flag. Finding the first non-dash token is the obvious form
  // and it is wrong: `--open 679` makes `679` the first such token, so the
  // gate read the ledger from a file named `679` and died on ENOENT the first
  // time its own fixture path was exercised.
  const VALUED = new Set(['--open', '--grade'])
  const positional = argv.filter(
    (a, i) => !a.startsWith('-') && !(i > 0 && VALUED.has(argv[i - 1])),
  )
  const ledgerPath = positional[0] ?? 'docs/ideas.md'
  const source = readFileSync(ledgerPath, 'utf8')
  const claims = blockerClaims(source)

  // `--open` is the fixture path: it supplies the open set directly so the
  // gate's own exit codes can be driven in a test without a forge and
  // without a network. An explicitly empty `--open ''` is an empty set and
  // not an unknown one, which is the distinction `openPullRequests` exists
  // to keep.
  const fixture = flag('--open')
  const resolved =
    fixture === undefined
      ? openPullRequests()
      : {
          open: new Set(
            fixture
              .split(',')
              .map((s) => Number(s.trim()))
              .filter((n) => Number.isFinite(n)),
          ),
          why: null,
        }

  const stale = staleBlockers(claims, resolved.open)
  const how = {}
  if (fixture === undefined) {
    for (const s of stale) for (const n of s.retired) how[n] = dispositionOf(n)
  }
  const findings = stale.map((s) => findingFor(s, how))

  for (const f of findings) console.log(`::error::${f.code}: ${f.message}`)
  if (resolved.why) console.error(`FORGE_OPEN_SET_UNKNOWN: gh pr list failed: ${resolved.why}`)

  const v = verdict(findings, {
    claims: claims.length,
    entries: entries(source).length,
    unresolvable: UNRESOLVABLE_SHAPES.length,
    openSetKnown: resolved.open !== null,
    ledgerPath,
  })
  ;(v.stream === 'err' ? console.error : console.log)(v.line)
  for (const extra of v.trailer) (v.stream === 'err' ? console.error : console.log)(extra)
  process.exit(v.exitCode)
}
