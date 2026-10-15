// Does text sold as `survived_verbatim` descend from the generation, or did
// the file already hold it?
//
// THE QUESTION. Pass 1 of `resolve()` labels a final span
// `survived_verbatim` when the span's characters are byte-identical to an
// extent of some generation (src/resolve.ts, as of 2026-10-13). On the
// `ursa run` path a "generation" is not what the model typed. It is the
// whole blob of the touched file at the agent's commit, which contains
// every line the file already held before the agent opened it. So a span
// can be byte-identical to a generation and still be text the model never
// contributed, and nothing in the resolver asks the difference.
//
// `survived_mutated` does ask, through `input.corroborate`
// (src/corroborate.ts). Pass 1 does not call it, and
// `DESCENT_CHECKED_UNIFORMLY` in src/invariants.ts only requires a verdict
// on mutated spans. The ledger entry "Two thirds of the characters sold as
// verbatim have a rival nobody asked about" (docs/ideas.md, 2026-10-13)
// measured what that silence hides: 490 of 744 verbatim spans came back
// `rival` with relation `pre_existing` when the corroborator was pointed at
// them by hand.
//
// WHAT THIS PASS ADDS, AND THE CORRECTION IT CARRIES. That entry's first
// step reads: "run the same tally with the generation's own prior version
// of the edited file excluded from the rival search, which separates 'text
// that pre-existed anywhere' from 'text that pre-existed in a file this
// generation did not touch'."
//
// The second half of that sentence cannot be measured as written, and the
// reason is structural rather than a limit of this tool.
// `gitDescentCorroborator` builds its rival set from
// `commitsTouchingPath(projectPath, filePath)` — commits that touched THIS
// path. Every rival it can ever return is therefore a revision of the same
// file the generation edited. "Text that pre-existed in a file this
// generation did not touch" is the empty set by construction, so excluding
// the prior version of the edited file does not partition the 490 into two
// halves. It deletes the search.
//
// The distinction that does separate the entry's two readings is one commit
// deep, not one file over. Of the `pre_existing` rivals, which ones hold the
// span text in the file as it stood IMMEDIATELY BEFORE the generation —
// `generatedSha`'s parent — and which ones hold it only in some older
// revision?
//
//   prior_revision  The span's text was in the file at the generation's
//     parent. The agent did not write it. It is in the "generation" only
//     because the generation is a whole-file blob. A record selling this
//     span as "a model wrote this and the person kept it" is wrong about
//     the first half of that sentence, and the characters are not a
//     survival at all.
//   restored  No parent blob holds the text, but an older ancestor does.
//     The generation replaced text an earlier commit had, and the person
//     put the earlier text back. This is the reading `DescentEvidence` in
//     src/types.ts already documents for `pre_existing`, and it is a real
//     outcome: the person rejected the generation's wording in favour of
//     text that used to be there.
//   sibling  Another branch held the text, and that branch's commit already
//     existed when the final work was committed. Merged or checked out, not
//     typed, and not this generation's.
//   future  A rival on a branch whose commit is NEWER than the episode's
//     `finalSha`. Text cannot have been copied from work that did not exist
//     yet, so this row was a defect in `gitDescentCorroborator` rather than
//     a property of the records, and it was reported separately so the
//     sibling figure could be read without it.
//
// THE FUTURE ROW IS NOW THE ACCEPTANCE TEST (changed 2026-10-14). The bound
// this row argued for shipped today: `gitDescentCorroborator` takes a
// fourth argument `horizonSha`, and `resolveEpisode` passes `ep.finalSha`.
// So the pass now runs the search twice over the same spans — once as
// shipped, with the horizon, and once unbounded, which is the search as it
// behaved before today — and prints both:
//
//   the `future` row, computed from the SHIPPED verdict, which is the
//     fix's acceptance criterion and must read zero;
//   HORIZON BOUND, computed by diffing the unbounded verdict against the
//     shipped one, which is how many spans the bound actually changed and
//     what each of them says instead. That is the defect's size, kept as a
//     number rather than deleted along with the defect.
//
// `prior_revision` is the alarming reading and `restored` is the artifact of
// the taxonomy. The tally below says which one the 490 actually is.
//
// Usage, from the package root:
//   npx tsx tools/measure-verbatim-descent.ts <path-to-clone> [--limit N] [--examples N]
//
// Writes nothing. Records are resolved in memory and never saved, so it is
// safe to point at a clone you care about: no `.ursa/` directory, no consent
// store read or written.

import { execFileSync } from 'node:child_process'
import { commitsTouchingPath, findCommitPairs, listCommits, blobLookup, type CommitInfo } from '../src/pairfinder'
import { buildEpisodes, type Episode } from '../src/episodes'
import { clearsSizeFloor } from '../src/launch'
import { resolveEpisode } from '../src/resolve-episode'
import { authoredAfterHorizon, gitDescentCorroborator, relatives, MAX_RIVAL_BLOBS } from '../src/corroborate'
import { normalize } from '../src/normalize'
import { MIN_VERBATIM_LEN } from '../src/match'
import type { OutcomeRecord } from '../src/types'

/** the same floor `ursa run` applies, so the pass agrees with it on which records count */
const MIN_CHARS = 200

/** the refined verdict for one `survived_verbatim` span */
type Bucket =
  | 'corroborated'
  | 'unverified'
  | 'prior_revision'
  | 'restored'
  | 'merged_in'
  | 'sibling'
  | 'future'

interface Tally { spans: number; chars: number }

const empty = (): Tally => ({ spans: 0, chars: 0 })

/**
 * Was this span's text already in the file at the generation's parent?
 *
 * Normalized containment, matching `gitDescentCorroborator` exactly, so the
 * refinement and the shipped search cannot disagree about what "holds the
 * text" means. Parents plural because a merge has several; a hit in any of
 * them means the text was present on at least one side of the work the
 * generation started from.
 */
function heldByParent(
  projectPath: string,
  filePath: string,
  spanText: string,
  parents: string[],
  blobCache: Map<string, string | null>,
): boolean {
  const needle = normalize(spanText).norm
  if (needle.length < MIN_VERBATIM_LEN) return false
  for (const p of parents) {
    const key = `${p}:${filePath}`
    let text = blobCache.get(key)
    if (text === undefined) {
      const got = blobLookup(projectPath, p, filePath)
      text = got.kind === 'present' ? got.text : null
      blobCache.set(key, text)
    }
    if (text !== null && normalize(text).norm.includes(needle)) return true
  }
  return false
}

/** author date of a rival commit, by its short sha; null when git cannot say */
function rivalDate(projectPath: string, shortSha: string, cache: Map<string, string | null>): string | null {
  let got = cache.get(shortSha)
  if (got === undefined) {
    try {
      got = execFileSync('git', ['-C', projectPath, 'log', '-1', '--format=%aI', shortSha], {
        encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
      }).trim() || null
    } catch {
      got = null
    }
    cache.set(shortSha, got)
  }
  return got
}

function run(project: string, limit: number, exampleCap: number): void {
  const dateCache = new Map<string, string | null>()
  const commits = listCommits(project)
  const byShaIndex = new Map(commits.map((c) => [c.sha, c]))
  const pairs = findCommitPairs(project)
  const episodes = buildEpisodes(pairs, project)

  const paired: Array<{ ep: Episode; record: OutcomeRecord }> = []
  for (const ep of episodes.slice(0, limit)) {
    const record = resolveEpisode(project, ep, commits)
    if (!record) continue
    if (!clearsSizeFloor(record, MIN_CHARS)) continue
    paired.push({ ep, record })
  }

  // The four rows the ledger entry printed, reproduced from the shipped
  // corroborator with nothing changed, so the refinement below is read
  // against a number that is checkable rather than quoted.
  // Keyed by `basis` or by `rival:<relation>`, and every relation the
  // corroborator can return has a row. `rival:merged_in` arrived on
  // 2026-10-15 and `rival:prior_revision` is reachable in principle though
  // not on this pass (a parent-held span is demoted out of
  // `survived_verbatim` by the same corroborator before it reaches here),
  // so both are declared rather than left to appear as `undefined` and
  // throw on the first `.spans++`.
  const shipped: Record<string, Tally> = {
    corroborated: empty(),
    unverified: empty(),
    'rival:prior_revision': empty(),
    'rival:pre_existing': empty(),
    'rival:merged_in': empty(),
    'rival:sibling': empty(),
  }
  const refined: Record<Bucket, Tally> = {
    corroborated: empty(),
    unverified: empty(),
    prior_revision: empty(),
    restored: empty(),
    merged_in: empty(),
    sibling: empty(),
    future: empty(),
  }
  /** why the search could not answer, counted so "unverified" is not one opaque row */
  const unverifiedReasons = new Map<string, number>()
  /** candidates the horizon bound removes from the search, counted per (record, path) */
  const candidates = { considered: 0, dropped: 0, stillOverCap: 0, pathsDropping: 0 }
  /** one line per (record, path) the bound removed a candidate from, printed in the report */
  const candidateLines: string[] = []
  /** spans whose verdict the horizon bound changed, and what they say now */
  const boundDropped = empty()
  const boundNowSays = new Map<string, number>()
  const boundExamples: string[] = []
  const examples: Record<'prior_revision' | 'restored' | 'merged_in' | 'sibling' | 'future', string[]> = {
    prior_revision: [], restored: [], merged_in: [], sibling: [], future: [],
  }

  let verbatimSpans = 0
  let verbatimChars = 0
  /** every span carrying a descent verdict, of any class: the bound's whole surface */
  let descentSpans = 0
  // The decisive question, asked of EVERY verbatim span and not only of the
  // ones the shipped corroborator happened to call `pre_existing`.
  //
  // Why it has to be asked separately. `gitDescentCorroborator` returns the
  // FIRST rival it finds walking `git log --all` newest-first, so a span
  // whose text sits both in the generation's parent revision and on a
  // parallel branch is reported as whichever commit git listed first, which
  // is usually the parallel branch. The relation a record carries is
  // therefore partly an artifact of log ordering, and the `pre_existing`
  // row undercounts parent-held text by exactly the spans that also had a
  // sibling. This tally has no such dependence: it reads one blob per
  // (parent, path) and asks containment.
  const parentHeld = empty()

  for (const { ep, record } of paired) {
    const finalAt = byShaIndex.get(ep.finalSha)?.date ?? ''
    const corroborate = gitDescentCorroborator(project, ep.generatedSha, commits, ep.finalSha)
    // The same search with no horizon: `gitDescentCorroborator`'s own
    // behaviour before 2026-10-14, kept so the bound's effect is a
    // measured difference rather than an assertion that it worked.
    const unbounded = gitDescentCorroborator(project, ep.generatedSha, commits)
    // The candidate-level effect, which is where the bound bites first and
    // which no span-level tally can see. A dropped candidate changes a
    // verdict only when it was the one holding the text, and it frees a
    // slot against MAX_RIVAL_BLOBS for every span of the path either way.
    const afterHorizon = authoredAfterHorizon(commits, ep.generatedSha, ep.finalSha)
    const { descendants } = relatives(commits, ep.generatedSha)
    for (const file of record.files) {
      const touching = commitsTouchingPath(project, file.path)
      if (touching === null) continue
      const rivals = touching.filter((c) => c.sha !== ep.generatedSha && !descendants.has(c.sha))
      const dropped = rivals.filter((c) => afterHorizon(c.sha)).length
      candidates.considered += rivals.length
      candidates.dropped += dropped
      if (dropped > 0) {
        candidates.pathsDropping++
        if (rivals.length - dropped > MAX_RIVAL_BLOBS) candidates.stillOverCap++
        candidateLines.push(`  ${record.task.id} ${file.path}: ${rivals.length} considered, `
          + `${dropped} authored after ${finalAt} -> ${rivals.length - dropped} searchable (cap ${MAX_RIVAL_BLOBS})`)
      }
    }
    const parents = byShaIndex.get(ep.generatedSha)?.parents ?? []
    // The generous boundary. A rival could legitimately have been written
    // after the generation and before the person finished — they branched,
    // wrote the text elsewhere, and brought it in — so the cutoff is the
    // episode's LAST commit, not its first. Anything newer than that is
    // unambiguously work that did not exist when the final text was saved.
    const blobCache = new Map<string, string | null>()
    for (const file of record.files) {
      for (const span of file.spans) {
        const chars = span.end - span.start

        // The horizon bound, asked of every span the corroborator ran on
        // and not only of the verbatim ones. `survived_mutated` is the
        // relation's original client — pass 2 calls `input.corroborate`
        // and a `sibling` verdict demotes the span to
        // `no_generation_provenance` — so counting the bound's effect on
        // verbatim spans alone would measure a fraction of its surface.
        if (span.descent !== undefined) {
          descentSpans++
          const before = unbounded(file.path, span.text)
          if (before.basis === 'rival') {
            const beforeAt = rivalDate(project, before.sha, dateCache)
            if (beforeAt !== null && finalAt !== '' && Date.parse(beforeAt) > Date.parse(finalAt)) {
              const after = corroborate(file.path, span.text)
              boundDropped.spans++
              boundDropped.chars += chars
              const now = after.basis === 'rival' ? `rival:${after.relation} ${after.sha}` : after.basis
              boundNowSays.set(`${span.class} -> ${now}`, (boundNowSays.get(`${span.class} -> ${now}`) ?? 0) + 1)
              if (boundExamples.length < exampleCap) {
                boundExamples.push(
                  `  ${record.task.id} ${file.path} [${span.start},${span.end}) ${chars}c ${span.class}  (final at ${finalAt})` +
                  `\n    dropped rival: ${before.sha} ${before.subject}  [${beforeAt}]` +
                  `\n    now says:      ${now}` +
                  `\n    text:          ${JSON.stringify(span.text.slice(0, 96))}`,
                )
              }
            }
          }
        }

        if (span.class !== 'survived_verbatim') continue
        verbatimSpans++
        verbatimChars += chars

        const heldAlready = heldByParent(project, file.path, span.text, parents, blobCache)
        if (heldAlready) {
          parentHeld.spans++
          parentHeld.chars += chars
        }

        const ev = corroborate(file.path, span.text)
        const shippedKey = ev.basis === 'rival' ? `rival:${ev.relation}` : ev.basis
        const shippedRow = (shipped[shippedKey] ??= empty())
        shippedRow.spans++
        shippedRow.chars += chars
        if (ev.basis === 'unverified') {
          unverifiedReasons.set(ev.reason, (unverifiedReasons.get(ev.reason) ?? 0) + 1)
        }

        let bucket: Bucket
        if (ev.basis !== 'rival') {
          bucket = ev.basis
        } else if (ev.relation === 'merged_in') {
          // A branch the episode merged. The graph places it inside the
          // work, so no date is consulted and the `future` bucket below
          // cannot be reached from here — which is the whole point of the
          // relation existing (src/corroborate.ts, THE FOURTH RELATION).
          bucket = 'merged_in'
        } else if (ev.relation === 'sibling') {
          const rivalAt = rivalDate(project, ev.sha, dateCache)
          // Date.parse and not a string compare, matching the bound in
          // src/corroborate.ts: iso-strict dates carry each author's own
          // UTC offset, so text order is not time order across offsets.
          bucket = rivalAt !== null && finalAt !== ''
            && Date.parse(rivalAt) > Date.parse(finalAt) ? 'future' : 'sibling'
        } else {
          bucket = heldAlready ? 'prior_revision' : 'restored'
        }
        refined[bucket].spans++
        refined[bucket].chars += chars

        if (bucket !== 'corroborated' && bucket !== 'unverified' && examples[bucket].length < exampleCap) {
          const when = ev.basis === 'rival' ? (rivalDate(project, ev.sha, dateCache) ?? '?') : '?'
          const where = ev.basis === 'rival' ? `${ev.sha} ${ev.subject}` : ''
          examples[bucket].push(
            `  ${record.task.id} ${file.path} [${span.start},${span.end}) ${chars}c  (final at ${finalAt})` +
            `\n    rival: ${where}  [${when}]` +
            `\n    text:  ${JSON.stringify(span.text.slice(0, 96))}`,
          )
        }
      }
    }
  }

  const pct = (n: number, d: number) => (d === 0 ? '0.0%' : `${((n / d) * 100).toFixed(1)}%`)
  const row = (name: string, t: Tally) =>
    `  ${name.padEnd(20)} ${String(t.spans).padStart(6)} spans  ${t.chars.toLocaleString().padStart(9)} chars  ${pct(t.chars, verbatimChars).padStart(7)}`

  console.log(`project            ${project}`)
  console.log(`head               ${execFileSync('git', ['-C', project, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()}`)
  console.log(`episodes walked    ${Math.min(limit, episodes.length)}`)
  console.log(`records            ${paired.length}`)
  console.log(`verbatim spans     ${verbatimSpans}`)
  console.log(`verbatim chars     ${verbatimChars.toLocaleString()}`)
  console.log(`\nAS SHIPPED (src/corroborate.ts, unchanged) — the ledger entry's four rows`)
  for (const [k, t] of Object.entries(shipped)) console.log(row(k, t))
  console.log(`\nREFINED — pre_existing split by whether the generation's parent already held the text`)
  for (const [k, t] of Object.entries(refined)) console.log(row(k, t))

  if (unverifiedReasons.size > 0) {
    console.log(`\nwhy unverified`)
    for (const [r, n] of [...unverifiedReasons].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${r.padEnd(26)} ${String(n).padStart(6)} spans`)
    }
  }

  console.log(`\nHORIZON BOUND — rivals authored after the episode's finalSha, which the shipped search now drops`)
  console.log(`  candidate rivals considered across every record's paths: ${candidates.considered}`)
  console.log(`  candidates the bound dropped: ${candidates.dropped} (over ${candidates.pathsDropping} record-paths)`)
  console.log(`  of those record-paths, still above the ${MAX_RIVAL_BLOBS}-blob cap after the drop: ${candidates.stillOverCap}`)
  for (const line of candidateLines) console.log(line)
  console.log(`  spans carrying a descent verdict, all classes: ${descentSpans}`)
  console.log(row('verdict changed', boundDropped))
  if (boundNowSays.size > 0) {
    for (const [k, n] of [...boundNowSays].sort((a, b) => b[1] - a[1])) {
      console.log(`    now says ${k.padEnd(30)} ${String(n).padStart(6)} spans`)
    }
  }
  console.log(`  future row above, from the shipped verdict: ${refined.future.spans} spans (must be 0)`)
  if (boundExamples.length > 0) console.log(`\nexamples — dropped by the horizon bound\n${boundExamples.join('\n')}`)

  const contributed = refined.corroborated.chars + refined.unverified.chars + refined.restored.chars
  console.log(`\nPARENT CONTAINMENT — asked of every verbatim span, independent of rival-search order`)
  console.log(row('held by parent', parentHeld))
  console.log(row('not held', { spans: verbatimSpans - parentHeld.spans, chars: verbatimChars - parentHeld.chars }))

  console.log(`\nVERDICT`)
  console.log(`  of the ${shipped['rival:pre_existing'].spans} spans the shipped search calls pre_existing, ${refined.prior_revision.spans} are prior_revision and ${refined.restored.spans} are restored`)
  console.log(`  but the parent already held ${parentHeld.spans} of ${verbatimSpans} verbatim spans (${parentHeld.chars.toLocaleString()} of ${verbatimChars.toLocaleString()} chars, ${pct(parentHeld.chars, verbatimChars)})`)
  console.log(`  so the shipped pre_existing row undercounts parent-held text by ${parentHeld.spans - refined.prior_revision.spans} spans`)
  console.log(`  chars left that the generation can be said to have contributed: ${(verbatimChars - parentHeld.chars).toLocaleString()} (${pct(verbatimChars - parentHeld.chars, verbatimChars)})`)
  void contributed

  for (const k of ['prior_revision', 'restored', 'merged_in', 'sibling', 'future'] as const) {
    if (examples[k].length === 0) continue
    console.log(`\nexamples — ${k}\n${examples[k].join('\n')}`)
  }
}

const argv = process.argv.slice(2)
if (!argv[0] || argv[0].startsWith('--')) {
  console.error('usage: npx tsx tools/measure-verbatim-descent.ts <path-to-clone> [--limit N] [--examples N]')
  process.exit(2)
}
const li = argv.indexOf('--limit')
const ei = argv.indexOf('--examples')
run(argv[0], li >= 0 ? Number(argv[li + 1]) : 50, ei >= 0 ? Number(argv[ei + 1]) : 3)
