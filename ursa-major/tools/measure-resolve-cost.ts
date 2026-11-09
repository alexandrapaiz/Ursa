// What one span costs the descent corroborator, over a real file in a real
// repository.
//
// This exists because docs/design/resolve-cost.md makes a performance claim
// — 4,139 spans on `docs/sprints/pending.md` went from a projected 10,759
// seconds to 5.7 — and a performance claim whose harness is gone cannot be
// re-run by a reviewer. It is a measurement tool and not a test: it asserts
// nothing and always exits 0 unless it cannot read the repository it was
// pointed at.
//
// WHY IT DRIVES THE CORROBORATOR AND NOT `ursa pr`. The end-to-end launch
// spends most of its wall clock in `gh api` per commit, which is network and
// varies by an order of magnitude between runs on a shared host. The cost
// this measures is in-process and per span, so it is driven directly, and
// the end-to-end figure is taken separately with `/usr/bin/time -v` (that
// command is in docs/design/resolve-cost.md §4.1).
//
// WHY THE DEFAULTS NAME THIS REPOSITORY'S OWN HISTORY. The file and the two
// commits below are the ones that stalled the thirty-pull-request sweep of
// docs/design/corpus-sweep.md §2.4. A synthetic string of the same length
// would not do: the cost depends on how many commits touch the path (the
// rival walk), on whether the generation's parent already held each span
// (the short-circuit), and on the span count the prose segmenter finds,
// none of which a generated file has.
//
//   N=4    npx tsx tools/measure-resolve-cost.ts    # the cold, per-span cost
//   N=4139 npx tsx tools/measure-resolve-cost.ts    # the whole file
//
// Environment:
//   REPO  path to the clone to measure over      (default: this workspace's parent)
//   PATHNAME  the path inside it                 (default: docs/sprints/pending.md)
//   GEN, FIN  generation and final commit shas   (default: PR #707's two commits)
//   N     how many of the file's spans to drive  (default: 4)

import { execFileSync } from 'node:child_process'
import { resolve as resolvePath } from 'node:path'
import { gitDescentCorroborator } from '../src/corroborate'
import { listCommits } from '../src/pairfinder'
import { segment } from '../src/segment'
import type { DescentEvidence } from '../src/types'

const REPO = resolvePath(process.env.REPO ?? resolvePath(import.meta.dirname, '../..'))
const PATHNAME = process.env.PATHNAME ?? 'docs/sprints/pending.md'
const GEN = process.env.GEN ?? '76360e73081ed0e307b159acc053a367881805ac'
const FIN = process.env.FIN ?? 'e846365211bce45bf044f6872a64949a4790abf4'

const show = (sha: string, path: string): string =>
  execFileSync('git', ['-C', REPO, 'show', `${sha}:${path}`], {
    encoding: 'utf8',
    // A quarter of a megabyte is the point of this measurement, and
    // execFileSync's default 1 MB buffer would throw on a larger one with
    // ENOBUFS rather than with a sentence about size.
    maxBuffer: 1 << 28,
  })

/**
 * The verdict's name, flattened to one string so the tally is readable.
 * `rival` carries a relation and `unverified` carries a reason, and the two
 * answer different questions about the same span, so neither can be dropped.
 */
const verdictName = (ev: DescentEvidence): string =>
  ev.basis === 'rival'
    ? `rival/${ev.relation}`
    : ev.basis === 'unverified'
      ? `unverified/${ev.reason}`
      : 'corroborated'

let final: string
try {
  final = show(FIN, PATHNAME)
} catch (e) {
  console.error(`cannot read ${FIN}:${PATHNAME} in ${REPO}`)
  console.error(`  ${(e as Error).message}`)
  console.error('  If the clone is shallow, run `bash tools/ensure-full-clone.sh` at the repository root.')
  process.exit(2)
}

const segs = segment(final, 'prose')
console.log(`${PATHNAME} at ${FIN.slice(0, 7)}: ${final.length} chars, ${segs.length} prose segments`)

const tGraph = performance.now()
const graph = listCommits(REPO)
console.log(`listCommits: ${graph.length} commits in ${(performance.now() - tGraph).toFixed(0)}ms`)

const N = Math.min(Number(process.env.N ?? '4'), segs.length)
const corroborate = gitDescentCorroborator(REPO, GEN, graph, FIN)
const tally = new Map<string, number>()

const t0 = performance.now()
for (let i = 0; i < N; i++) {
  const name = verdictName(corroborate(PATHNAME, segs[i].text))
  tally.set(name, (tally.get(name) ?? 0) + 1)
}
const ms = performance.now() - t0

console.log(`${N} span(s) in ${ms.toFixed(0)}ms -> ${(ms / N).toFixed(1)}ms/span`)
console.log(`verdicts: ${[...tally].map(([k, v]) => `${k}=${v}`).join(' ')}`)
if (N < segs.length) {
  // Said as a projection and not as a total, because the corroborator's
  // caches are cold for the first span of a path and warm after it: this
  // number is an UPPER bound and the whole-file run is the measurement.
  // Before the 2026-11-09 repair the two agreed, which is exactly what it
  // means for the cost to be per span.
  console.log(
    `projected upper bound for all ${segs.length}: ${((ms / N) * segs.length / 1000).toFixed(0)}s ` +
    `(run N=${segs.length} for the real total; the caches warm)`,
  )
}
