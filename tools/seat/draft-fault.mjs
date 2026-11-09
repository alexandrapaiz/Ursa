#!/usr/bin/env node
// Whether anything licenses a reader to treat somebody else's draft pull
// request as abandoned.
//
//   node tools/seat/draft-fault.mjs                 # the table, every open draft
//   node tools/seat/draft-fault.mjs --json
//   node tools/seat/draft-fault.mjs --pr 661
//   node tools/seat/draft-fault.mjs --stale-minutes 1440
//
// The pure core (`draftFault`, `silencesInWindow`, `thresholdFault`) touches
// no network, no token and no filesystem. The CLI makes exactly one
// `gh api graphql` request and reads nothing else.
//
// Exit 0 the table printed. Exit 1 at least one draft was called resolvable
// under `--strict`, which is how a reviewer's run can gate on this instead of
// reading it. Exit 2 the GraphQL read failed, which is an environment fault
// and not a verdict on any draft.
//
// WHY THIS EXISTS, with the measurement that produced it (2026-11-02, this
// seat's seventh message pass, over 120 of this repository's pull requests).
//
// Two org rules meet on a draft pull request and neither one carries the fact
// the other needs. `docs/standards/pm.md` §8 says open the draft before the
// work, so a draft is the normal state of a run in its first minutes. The
// amended clause in `prompts/engineer-agent.md` says an abandoned draft is
// the next run of the owning seat's to resolve, because GitHub refuses to
// merge a draft at all. So a reviewing seat that finds a draft has to decide
// which of the two it is looking at, and GitHub publishes no field that says.
//
// WHAT A SEAT USED INSTEAD, and what it cost on the night this was written.
// Ursa's PM read this seat's draft 661 and commented that "the run behind it
// ended 8 minutes before the claim reached me." The silence it measured was
// real: 6 minutes 48 seconds, from that draft's third commit at 02:56:20 to
// the comment at 03:03:08. The inference drawn from it was wrong by every
// margin available. That run pushed its fourth commit at 03:03:46, 38 seconds
// after the death call, and readied the pull request itself at 03:08:11, five
// minutes after it. Worse, the threshold was already contradicted by the
// draft it was applied to: the same run had shown silences of 6m12s and 6m00s
// earlier in the same window, so 6m48s was not an outlier in that pull
// request, it was that pull request's own normal pace.
//
// THE DISTRIBUTION, which is why no silence threshold in minutes can work
// here. Of 120 pull requests read, 34 are windows that one run demonstrably
// owns end to end, across 9 different seats; `oneRunWindowFault` below is the
// four exclusions that get there and `tools/seat/draft-fault-measure.mjs`
// prints what each one removed, which is the part a reviewer can argue with.
// Inside those 34 windows there are 116 silences bounded on both sides by
// action from that same run, so every one of them is a silence a live run
// produced:
//
//     median 2.17 min, p90 9.3 min, p99 17.17 min, max 57.57 min
//
// 21 of the 116, which is 18.1 per cent, are longer than the 6m48s that was
// read as death. The longest, 57.57 minutes, is `#642`: the frontend seat
// opened a draft at 01:05:33, pushed nothing until 02:02:36, and readied it at
// 02:12:35, and the next frontend run opened its own pull request 78 seconds
// after that ready, which is what pins the whole 67 minutes to one run. A
// reader applying any threshold under an hour calls that run dead while it is
// working. Draft lifetimes fail the same way: median 10.27 min, p90 27.07,
// max 67.55, with 10 of 34 longer than the 19 minutes of age at which 661 was
// called ended.
//
// WHAT WORKS INSTEAD, and it is evidence rather than a better threshold. A run
// in this organization works one branch: the harness hands it a branch name
// and its charter allows one pull request per run. So the question "is the run
// behind this draft still working" has a positive answer available, and it is
// not on the draft. It is on the seat's other branches. If the seat that owns
// this draft has pushed to a *different* branch more recently than to this
// one, the run behind this draft is not the run now working, and a reader may
// resolve the draft without racing anybody. If the newest thing that seat has
// pushed anywhere is this draft's own tip, then nothing distinguishes "ended"
// from "mid-turn" and the honest answer is a refusal.
//
// Checked against the night it came from: at 03:03:08 the newest `engineer`
// push anywhere was 661's own tip, so this tool refuses, which is the right
// answer five minutes before the run proved it. At 03:12:57, when this seat's
// seventh run pushed to `-message-7`, the same call returns `null` and 661
// becomes a thing a reader may act on, which is also correct, and arrives
// without anyone having to guess a number.
//
// THE ONE THRESHOLD THAT SURVIVES, and why it is a day and not an hour.
// `--stale-minutes` exists because a draft from last week is obviously
// resolvable and should not need a sibling branch to say so. Its default is
// 1440, one day, which is 25 times the longest proven-live silence above. A
// GitHub-runner run is capped at 45 minutes of wall clock by its workflow and
// a resident run has not been observed past 68, so a day of silence is not a
// pause. `thresholdFault` refuses any value at or below 57.57 and says why, so
// the next seat cannot quietly tune this down to the number that failed
// tonight.
//
// WHAT THIS DOES NOT SEE, named because a refusal is only honest if its blind
// spot is. The activity set is built from open pull requests, so a run that
// has not opened one yet is invisible to it, and a run whose only pull request
// was merged mid-run reads as absent. Both failures point the same way: the
// tool refuses more often than it must, never less. Second, the activity
// timestamp is a commit's committer date and not a push time, which is the
// only per-branch time GitHub will hand back in one request; a rebase rewrites
// it. Both are reasons to treat `licensed` as permission to act and `not
// licensed` as a fact, rather than the reverse.
import { seatOfBranch } from './charter-lag.mjs'

// --- pure core ----------------------------------------------------------

const MS_PER_MIN = 60_000

// The measurement in the header, in a form the tool and its test can both
// read, so a number quoted in prose and a number used in code cannot drift.
export const MEASURED = {
  on: '2026-11-02',
  reproduce: 'node tools/seat/draft-fault-measure.mjs --prs 120',
  prsRead: 120,
  oneRunWindows: 34,
  seatsRepresented: 9,
  silences: 116,
  silenceMedianMin: 2.17,
  silenceP90Min: 9.3,
  silenceP99Min: 17.17,
  silenceMaxMin: 57.57,
  silenceMaxPr: 642,
  lifetimeMedianMin: 10.27,
  lifetimeP90Min: 27.07,
  lifetimeMaxMin: 67.55,
  // The call this tool exists to refuse, kept as data so the test can replay it.
  misreadSilenceMin: 6.8,
  misreadAgeMin: 19,
  silencesLongerThanMisread: 21,
  lifetimesLongerThanMisreadAge: 10
}

// Is a readied draft's [first commit, ready] span the work of ONE run, so that
// every silence inside it is a silence a live run demonstrably produced?
// Returns null when it qualifies, else the reason it does not, because a
// measurement whose exclusions are not printed is a measurement nobody can
// check. Each test below matches a practice this organization states
// somewhere, and the counts each one removed are in the measure script's
// output.
//
//   window        { number, branch, createdAt, readyAt, commitDates[] }
//   seatActivity  [{ branch, at }] for every seat, filtered here
export function oneRunWindowFault (window, seatActivity) {
  const ready = Date.parse(window.readyAt ?? '')
  if (Number.isNaN(ready)) return 'never a readied draft, so there is no window'
  const own = window.commitDates.map(Date.parse).filter((t) => !Number.isNaN(t) && t <= ready).sort((a, b) => a - b)
  if (!own.length) return 'no commit before the ready'
  const start = own[0]

  // A per-run branch carries the run's date (`<seat>/YYYY-MM-DD-<trigger>`).
  // A branch without one is a long-lived lane, not a run.
  if (!/\/\d{4}-\d{2}-\d{2}-/.test(window.branch)) return 'branch name carries no run date'

  // Ship-first (§8) puts the first commit seconds before the pull request. A
  // first commit much older than the pull request is a stacked or rebased
  // branch carrying another run's history, which is what put a 5.8-day
  // "live silence" in the first pass of this measurement.
  const created = Date.parse(window.createdAt ?? '')
  if (!Number.isNaN(created) && created - start > 10 * 60_000) {
    return 'first commit predates the pull request by over 10 min, so the branch carries another run history'
  }

  // A run works one branch, which is the same premise `draftFault` rests on.
  const seat = seatOfBranch(window.branch)
  const elsewhere = seatActivity.some((a) => {
    const t = Date.parse(a.at)
    return seatOfBranch(a.branch) === seat && a.branch !== window.branch && t > start && t < ready
  })
  if (elsewhere) return 'the same seat committed to another branch inside the window'

  return null
}


// Minutes between consecutive timestamps that fall inside [from, to].
// `from` and `to` are themselves actions, so every gap returned is bounded on
// both sides by evidence and none of them spans two runs.
export function silencesInWindow (isoEvents, fromIso, toIso) {
  const from = Date.parse(fromIso)
  const to = Date.parse(toIso)
  if (Number.isNaN(from) || Number.isNaN(to) || to < from) return []
  const ts = [...new Set([...isoEvents, fromIso, toIso].map(Date.parse))]
    .filter((t) => !Number.isNaN(t) && t >= from && t <= to)
    .sort((a, b) => a - b)
  return ts.slice(1).map((t, i) => (t - ts[i]) / MS_PER_MIN)
}

// §8's ship-first rule made checkable the other way round: a silence
// threshold is only usable if this repository has never seen a live run be
// quieter than it. Returns null when the value may be used, else the sentence
// to print instead of using it.
export function thresholdFault (minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return `a silence threshold must be a positive number of minutes; got ${JSON.stringify(minutes)}`
  }
  if (minutes <= MEASURED.silenceMaxMin) {
    return `${minutes} minutes of silence is not evidence a run ended: ` +
      `pull request ${MEASURED.silenceMaxPr} was silent for ${MEASURED.silenceMaxMin} minutes ` +
      `and then readied itself, and ${MEASURED.silences} silences measured on ${MEASURED.oneRunWindows} ` +
      `one-run windows reach p99 ${MEASURED.silenceP99Min}. Use sibling-branch evidence, or a threshold above ${MEASURED.silenceMaxMin}.`
  }
  return null
}

// Is this draft resolvable by somebody other than the run that opened it?
//
//   draft         { number, branch, lastCommitAt }  lastCommitAt may be null
//   seatActivity  [{ branch, at }] for every branch, any seat; filtered here
//   nowIso        the reader's clock
//   opts          { staleMinutes = 1440 }
//
// Returns null when a reader is licensed to resolve it, otherwise the
// sentence to print instead of resolving it.
export function draftFault (draft, seatActivity, nowIso, opts = {}) {
  const staleMinutes = opts.staleMinutes ?? 1440
  const bad = thresholdFault(staleMinutes)
  if (bad) return bad

  const seat = seatOfBranch(draft.branch)
  if (!seat) {
    return `${draft.branch} names no seat in its first path segment, so there is no run to ask about; ` +
      'resolve it by asking the owner, not by inference.'
  }

  const mine = Date.parse(draft.lastCommitAt ?? '')
  const now = Date.parse(nowIso)
  if (Number.isNaN(now)) return `now is not a timestamp: ${JSON.stringify(nowIso)}`

  const siblings = seatActivity
    .filter((a) => seatOfBranch(a.branch) === seat && a.branch !== draft.branch)
    .map((a) => Date.parse(a.at))
    .filter((t) => !Number.isNaN(t))
  const newestSibling = siblings.length ? Math.max(...siblings) : null

  if (newestSibling !== null && (Number.isNaN(mine) || newestSibling > mine)) {
    return null
  }

  const silence = Number.isNaN(mine) ? null : (now - mine) / MS_PER_MIN
  if (silence !== null && silence > staleMinutes) return null

  const quiet = silence === null ? 'unknown' : `${silence.toFixed(1)} min`
  return `the newest thing ${seat} has pushed anywhere is this branch's own tip, ` +
    `so its run may be mid-turn: ${quiet} of silence, against a measured live maximum of ` +
    `${MEASURED.silenceMaxMin} min. Nothing licenses resolving ${draft.number} yet. ` +
    `It becomes resolvable when ${seat} pushes to another branch, or after ${staleMinutes} min of silence.`
}

export function buildRows ({ drafts, activity, nowIso, staleMinutes }) {
  return drafts.map((d) => {
    const fault = draftFault(d, activity, nowIso, { staleMinutes })
    const mine = Date.parse(d.lastCommitAt ?? '')
    return {
      number: d.number,
      branch: d.branch,
      seat: seatOfBranch(d.branch),
      silenceMin: Number.isNaN(mine) ? null : Math.round((Date.parse(nowIso) - mine) / MS_PER_MIN * 10) / 10,
      licensed: fault === null,
      why: fault ?? 'the owning seat has pushed to a newer branch, or this draft has been silent past the stale bound'
    }
  })
}

export function formatTable (rows) {
  const head = ['pull request', 'owning seat', 'silence', 'a reader may resolve it']
  const body = rows.map((r) => [
    String(r.number),
    r.seat ?? 'no seat in the branch name',
    r.silenceMin === null ? 'no commit read' : `${r.silenceMin} min`,
    r.licensed ? 'yes' : 'no, refused'
  ])
  const w = head.map((h, i) => Math.max(h.length, ...body.map((b) => b[i].length)))
  const line = (c) => c.map((v, i) => v.padEnd(i === w.length - 1 ? 0 : w[i])).join('  ')
  const table = [line(head), line(w.map((n) => '-'.repeat(n))), ...body.map(line)]
  // The sentence is the product, so it is printed in full under the table
  // rather than truncated into a cell.
  const notes = rows.map((r) => `\n  ${r.number}: ${r.why}`)
  return [...table, ...notes].join('\n')
}

// --- the live read ------------------------------------------------------

// One request. `commits(last:1)` is the newest commit on each open pull
// request's head branch, which is this organization's cheapest per-branch
// activity time: `git for-each-ref` would be cheaper still and is unavailable,
// because a seat's clone is shallow and single-branch (`tools/ensure-full-clone.sh`).
export const QUERY = `
query($owner:String!,$name:String!){
  repository(owner:$owner,name:$name){
    pullRequests(states:OPEN, first:100, orderBy:{field:UPDATED_AT,direction:DESC}){
      nodes{
        number isDraft headRefName createdAt
        commits(last:1){ nodes{ commit{ committedDate } } }
      }
    }
  }
}`

export function readOpenPrs (json) {
  const nodes = json?.data?.repository?.pullRequests?.nodes
  if (!Array.isArray(nodes)) throw new Error('GraphQL answered with no pullRequests.nodes')
  return nodes.map((n) => ({
    number: n.number,
    branch: n.headRefName,
    createdAt: n.createdAt,
    isDraft: n.isDraft,
    lastCommitAt: n.commits?.nodes?.[0]?.commit?.committedDate ?? null
  }))
}

async function main (argv) {
  const { execFile } = await import('node:child_process')
  const { promisify } = await import('node:util')
  const run = promisify(execFile)

  const flag = (name, dflt) => {
    const i = argv.indexOf(name)
    return i === -1 ? dflt : argv[i + 1]
  }
  const staleMinutes = Number(flag('--stale-minutes', '1440'))
  const onlyPr = flag('--pr', null)
  const asJson = argv.includes('--json')
  const strict = argv.includes('--strict')

  const repo = flag('--repo', 'alexandrapaiz/Ursa')
  const [owner, name] = repo.split('/')

  let prs
  try {
    const { stdout } = await run('gh', [
      'api', 'graphql', '-f', `owner=${owner}`, '-f', `name=${name}`, '-f', `query=${QUERY}`
    ], { maxBuffer: 16 * 1024 * 1024 })
    prs = readOpenPrs(JSON.parse(stdout))
  } catch (e) {
    console.error(`GH_GRAPHQL_UNREACHABLE: ${e.message.split('\n')[0]}`)
    console.error('This is an environment fault. No draft has been judged either way.')
    process.exit(2)
  }

  const activity = prs
    .filter((p) => p.lastCommitAt)
    .map((p) => ({ branch: p.branch, at: p.lastCommitAt }))
  let drafts = prs.filter((p) => p.isDraft)
  if (onlyPr) drafts = prs.filter((p) => String(p.number) === String(onlyPr))

  const nowIso = new Date().toISOString()
  const rows = buildRows({ drafts, activity, nowIso, staleMinutes })

  if (asJson) {
    console.log(JSON.stringify({ nowIso, staleMinutes, measured: MEASURED, openPrs: prs.length, rows }, null, 2))
  } else if (rows.length === 0) {
    console.log(`No open draft pull requests among the ${prs.length} open ones read at ${nowIso}.`)
  } else {
    console.log(formatTable(rows))
    const yes = rows.filter((r) => r.licensed).length
    console.log(`\n${rows.length} draft(s) of ${prs.length} open pull requests. ` +
      `${yes} resolvable by a reader, ${rows.length - yes} refused.`)
    console.log(`Silence is never the evidence: live runs here reach ${MEASURED.silenceMaxMin} min quiet ` +
      `(pull request ${MEASURED.silenceMaxPr}), measured over ${MEASURED.silences} silences on ${MEASURED.oneRunWindows} one-run windows.`)
  }

  if (strict && rows.some((r) => r.licensed)) process.exit(1)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(e)
    process.exit(2)
  })
}
