#!/usr/bin/env node
// Re-derive every number in `draft-fault.mjs`'s MEASURED block from the live
// repository, and print what each exclusion removed.
//
//   node tools/seat/draft-fault-measure.mjs --prs 120          # ~8 min, 241 requests
//   node tools/seat/draft-fault-measure.mjs --prs 30 --json
//
// Exit 0 printed. Exit 2 `gh` could not answer, which is an environment fault.
//
// WHY A SEPARATE SCRIPT AND NOT A FLAG ON THE TOOL. The tool makes one request
// and is meant to be run by a reviewer mid-decision. This makes two per pull
// request and takes minutes, because the commit list and the draft timeline
// are different endpoints and neither is paginated into the other. Keeping
// them apart is what lets the tool stay cheap enough to run every time.
//
// WHY THE EXCLUSIONS ARE PRINTED AND NOT JUST APPLIED. The first pass of this
// measurement reported a 5.8-day "silence on a live run" because a stacked
// branch carries its parent's commits, and a 9.7-hour one because
// `distribution/vendored-pm` is a lane rather than a run. Both survived a
// filter and neither was visible in the output. The counts below are the
// part of this that a reviewer can argue with.
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { oneRunWindowFault, silencesInWindow } from './draft-fault.mjs'

const run = promisify(execFile)
const MS_PER_MIN = 60_000

async function gh (args) {
  const { stdout } = await run('gh', args, { maxBuffer: 32 * 1024 * 1024 })
  return stdout
}

export function quantile (sorted, q) {
  if (!sorted.length) return null
  return sorted[Math.round(q * (sorted.length - 1))]
}

export function summarise (prs) {
  // Activity by seat, from every commit on every pull request read.
  const activity = prs.flatMap((p) => p.commitDates.map((at) => ({ branch: p.branch, at })))
  const dropped = new Map()
  const kept = []
  for (const p of prs) {
    const fault = oneRunWindowFault(p, activity)
    if (fault) {
      dropped.set(fault, (dropped.get(fault) ?? 0) + 1)
      continue
    }
    const own = p.commitDates.filter((d) => Date.parse(d) <= Date.parse(p.readyAt)).sort()
    const gaps = silencesInWindow(own, own[0], p.readyAt)
    kept.push({
      number: p.number,
      seat: p.branch.split('/')[0],
      branch: p.branch,
      lifetimeMin: (Date.parse(p.readyAt) - Date.parse(own[0])) / MS_PER_MIN,
      gaps
    })
  }
  const silences = kept.flatMap((k) => k.gaps).sort((a, b) => a - b)
  const lifetimes = kept.map((k) => k.lifetimeMin).sort((a, b) => a - b)
  const r2 = (n) => (n === null ? null : Math.round(n * 100) / 100)
  return {
    prsRead: prs.length,
    dropped: [...dropped].sort((a, b) => b[1] - a[1]).map(([why, n]) => ({ why, n })),
    oneRunWindows: kept.length,
    seatsRepresented: new Set(kept.map((k) => k.seat)).size,
    silences: silences.length,
    silenceMedianMin: r2(quantile(silences, 0.5)),
    silenceP90Min: r2(quantile(silences, 0.9)),
    silenceP99Min: r2(quantile(silences, 0.99)),
    silenceMaxMin: r2(silences.at(-1)),
    silenceMaxPr: kept.length ? kept.reduce((a, b) => (Math.max(...b.gaps, 0) > Math.max(...a.gaps, 0) ? b : a)).number : null,
    lifetimeMedianMin: r2(quantile(lifetimes, 0.5)),
    lifetimeP90Min: r2(quantile(lifetimes, 0.9)),
    lifetimeMaxMin: r2(lifetimes.at(-1)),
    silencesLongerThanMisread: silences.filter((s) => s > 6.8).length,
    lifetimesLongerThanMisreadAge: lifetimes.filter((l) => l > 19).length
  }
}

async function main (argv) {
  const i = argv.indexOf('--prs')
  const limit = i === -1 ? 120 : Number(argv[i + 1])
  let list
  try {
    list = JSON.parse(await gh([
      'pr', 'list', '--state', 'all', '--limit', String(limit),
      '--json', 'number,headRefName,createdAt'
    ]))
  } catch (e) {
    console.error(`GH_UNREACHABLE: ${e.message.split('\n')[0]}`)
    process.exit(2)
  }
  const prs = []
  for (const p of list) {
    let commitDates = []
    let readyAt = null
    try {
      commitDates = JSON.parse(await gh([
        'api', `repos/:owner/:repo/pulls/${p.number}/commits?per_page=100`,
        '--jq', '[.[] | .commit.committer.date]'
      ]))
      const events = JSON.parse(await gh([
        'api', `repos/:owner/:repo/issues/${p.number}/timeline?per_page=100`,
        '--jq', '[.[] | select(.event=="ready_for_review") | .created_at]'
      ]))
      readyAt = events.sort()[0] ?? null
    } catch { /* a pull request the API will not answer for is dropped by oneRunWindowFault */ }
    prs.push({ number: p.number, branch: p.headRefName, createdAt: p.createdAt, readyAt, commitDates })
    process.stderr.write(`\r${prs.length}/${list.length} read`)
  }
  process.stderr.write('\n')

  const s = summarise(prs)
  if (argv.includes('--json')) {
    console.log(JSON.stringify(s, null, 2))
    return
  }
  console.log(`pull requests read: ${s.prsRead}`)
  for (const d of s.dropped) console.log(`  dropped, ${d.why}: ${d.n}`)
  console.log(`one-run windows kept: ${s.oneRunWindows}, across ${s.seatsRepresented} seats`)
  console.log(`first commit to ready, minutes: median ${s.lifetimeMedianMin}, p90 ${s.lifetimeP90Min}, max ${s.lifetimeMaxMin}`)
  console.log(`  longer than 19 min (the age at which 661 was called ended): ${s.lifetimesLongerThanMisreadAge} of ${s.oneRunWindows}`)
  console.log(`silences a live run produced: ${s.silences}`)
  console.log(`  median ${s.silenceMedianMin}, p90 ${s.silenceP90Min}, p99 ${s.silenceP99Min}, max ${s.silenceMaxMin} on pull request ${s.silenceMaxPr}`)
  console.log(`  longer than the 6.8 min read as death: ${s.silencesLongerThanMisread} of ${s.silences}`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).catch((e) => { console.error(e); process.exit(2) })
}
