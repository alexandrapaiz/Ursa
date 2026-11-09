#!/usr/bin/env node
// excuse-control.mjs — execute the reason a gate was excused, instead of
// reading it.
//
//     node tools/gates/excuse-control.mjs            # the table
//     node tools/gates/excuse-control.mjs --gate     # exit 1 on a false excuse
//     node tools/gates/excuse-control.mjs --json
//
// Exit 0 every excuse of an executable kind held. Exit 1 at least one did
// not. Exit 2 the sweep found no row of an executable kind at all, because an
// empty census and an unavailable one read the same to a caller and only one
// of them is clean.
//
// WHY THIS EXISTS.
//
// `tools/gates/gate-registry.mjs` requires every candidate gate under
// `tools/` and `scripts/` to be either named by a check in
// `scripts/ci-checks.mjs` or carry a baseline row under one of ten kinds
// saying why no per-change gate runs it. Thirty-eight rows carry such a
// reason. One kind's reason is executed — `red-on-main` has to name a heading
// `docs/ideas.md` actually carries — and the other nine are prose that a
// reader checks, which is the method that works exactly as often as somebody
// looks.
//
// `needs-token` is the largest of the nine: 14 of the 38 rows. Its claim is
// uniform and it is causal: without the credential this file ANSWERS NOTHING.
// A row of that kind is therefore falsifiable by one observation, and this
// file makes it: run the gate with the forge and board credentials removed
// from its environment, and require that it does not report clean.
//
// WHAT THIS FOUND ON THE RUN THAT WROTE IT (Ursa's security seat, run 12,
// 2026-11-09). Two of the 14 were false, in the two different ways a claim of
// this shape can be false:
//
//   tools/board/bypass.mjs --audit        exit 0 over a window it could not
//                                         read, printing `coverage INCOMPLETE:
//                                         page 1 answered 401` above the green
//   tools/stack/repair-pending.mjs        exit 1, which is its own code for
//                                         `genuinely unrepaired`, from an
//                                         uncaught `gh` failure
//
// Both are fixed in the same pull request, so this gate is green on the tree
// that introduces it. That ordering is deliberate: a gate shipped red is a
// gate every seat learns to ignore.
//
// WHY A BARE NON-ZERO IS NOT ENOUGH, which is the second finding's whole
// point. A gate that already uses exit 1 for a substantive verdict reports a
// missing credential as a finding about the repository. So a row may declare
// `no_verdict_exit`, the codes that tool uses for `I did not answer`, and the
// control then requires the stripped run to return one of those and not just
// something non-zero.
//
// WHAT THIS DELIBERATELY DOES NOT GATE ON, and the reason, which is Ursa's
// frontend seat's of the same day: a test that pins an implementation answers
// `is the shape there`, not `is that why this failed`. The obvious stronger
// assertion is that the refusal NAMES the credential — `gh auth login`, a
// 401, `BOARD_RUNTIME_TOKEN`. On a runner with no network the same tools
// refuse for lack of reach and say so in DNS words, so that assertion would
// go red for a correct tree on exactly the environment this gate is written
// to run in. It is reported as a column and counted, never failed on.
//
// External content: none. Every subject is a tracked file in this repository
// and the only inputs are their exit codes.

import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const BASELINE = join(REPO_ROOT, 'tools', 'gates', 'gate-registry.baseline.json')

/** The credentials removed from the child's environment. Removed and not
 *  emptied: a tool that reads `process.env.X ?? ''` and one that reads
 *  `'X' in process.env` must both see absence. */
export const STRIPPED = ['GH_TOKEN', 'GITHUB_TOKEN', 'BOARD_RUNTIME_TOKEN', 'GH_ENTERPRISE_TOKEN']

/** Which kinds this file can execute, and for the rest, why not yet. The
 *  unexecuted ones are printed rather than omitted: a kind nobody has found a
 *  control for is a measurement about this gate's coverage, and leaving it out
 *  of the output would make nine prose reasons look like ten executed ones. */
export const EXECUTABLE = ['needs-token']
export const UNEXECUTED = {
  'not-a-gate': 'the claim is that every outcome of the file is information. A control would '
    + 'have to enumerate its outcomes, which is the file\'s own suite\'s job',
  'needs-network': 'the control is to run it with the network removed, which this sweep cannot '
    + 'do from inside the sandbox it is running in',
  'write-action': 'the claim is that running it changes the repository, and a control that '
    + 'demonstrated that would itself be the change',
  'merge-driver': 'the claim is about who invokes it. A control is a real merge, which '
    + 'tools/registers/reproduce-collision.sh already performs',
  'the-runner': 'the claim is that a list cannot be one of its own entries, which is about the '
    + 'shape of the list and not about a run',
  'schedule-only': 'the claim is that the file takes minutes. A control is a timing, so it '
    + 'grades the host rather than the tree (runner-facts: a verdict about the host is not a '
    + 'verdict about the branch)',
  'host-dependent': 'the claim is that two hosts answer differently about an unchanged tree, '
    + 'so the control needs a second host',
  'red-on-main': 'already executed, by tools/gates/gate-registry.mjs, which fails when the '
    + 'row\'s ledger pointer is not a heading docs/ideas.md carries',
  'covered-by': 'already executed, by tools/gates/gate-registry.mjs, which fails when the '
    + 'named check is not in scripts/ci-checks.mjs',
}

/** Words that make a refusal legibly about the credential. Reported, never
 *  gated on; see the header. */
const NAMES_CREDENTIAL = /GH_TOKEN|GITHUB_TOKEN|BOARD_RUNTIME_TOKEN|BOARD_API_URL|gh auth login|\b401\b|unauthori[sz]ed|authenticat|credential|GH_UNREACHABLE|GH_GRAPHQL_UNREACHABLE/i

/**
 * The verdict for one row, from its declared contract and one observed run.
 *
 * Pure, so every class below is asserted in the suite without spawning
 * anything. `code` is the child's exit status, `out` its combined output.
 *
 * @returns {{ state: string, why: string, names_credential: boolean }}
 */
export function classify(entry, { code, out, timedOut = false }) {
  const names = NAMES_CREDENTIAL.test(out || '')
  if (timedOut) {
    return {
      state: 'unmeasured',
      why: 'the run did not finish inside the timeout, so it neither refused nor reported clean',
      names_credential: names,
    }
  }
  if (code === null) {
    return {
      state: 'unmeasured',
      why: 'the child did not produce an exit status, so there is no observation to classify',
      names_credential: names,
    }
  }
  if (code === 0) {
    return {
      state: 'green-on-nothing',
      why: 'it exited 0 with the credential removed, so its baseline reason — that it answers '
        + 'nothing without one — is false of its exit code, and registering it would put a '
        + 'green tick next to a scope it never measured',
      names_credential: names,
    }
  }
  const noVerdict = entry.no_verdict_exit
  if (Array.isArray(noVerdict) && noVerdict.length && !noVerdict.includes(code)) {
    return {
      state: 'verdict-without-reach',
      why: `it exited ${code}, which this file's own contract reserves for a finding about the `
        + `repository rather than for 'I did not answer' (${noVerdict.join(', ')}). A missing `
        + 'credential is then published as a verdict',
      names_credential: names,
    }
  }
  return { state: 'refused', why: `exit ${code}`, names_credential: names }
}

/** Every row the given kind set can be executed for, in baseline order. */
export function rowsToControl(baseline, kinds = EXECUTABLE) {
  return (baseline.entries ?? []).filter((e) => kinds.includes(e.kind))
}

export function verdict(results) {
  const bad = results.filter((r) => r.state === 'green-on-nothing' || r.state === 'verdict-without-reach')
  const unmeasured = results.filter((r) => r.state === 'unmeasured')
  return {
    total: results.length,
    refused: results.filter((r) => r.state === 'refused').length,
    named: results.filter((r) => r.state === 'refused' && r.names_credential).length,
    unmeasured: unmeasured.length,
    failed: bad.length,
    // An unmeasured row is not a pass. It is the absence this gate exists to
    // refuse to read as clean, so it fails the gate exactly as a false excuse
    // does, and it is counted separately so a reader can tell them apart.
    exitCode: bad.length || unmeasured.length ? 1 : 0,
  }
}

function run(entry, { timeoutMs = 60_000 } = {}) {
  const env = { ...process.env }
  for (const k of STRIPPED) delete env[k]
  const argv = Array.isArray(entry.control) ? entry.control : []
  const abs = join(REPO_ROOT, entry.path)
  const [cmd, args] = entry.path.endsWith('.py')
    ? ['python3', [abs, ...argv]]
    : entry.path.endsWith('.sh')
      ? ['bash', [abs, ...argv]]
      : [process.execPath, [abs, ...argv]]
  const r = spawnSync(cmd, args, { encoding: 'utf8', env, timeout: timeoutMs, cwd: REPO_ROOT })
  return {
    code: r.status,
    out: `${r.stdout ?? ''}${r.stderr ?? ''}`,
    timedOut: r.error ? r.error.code === 'ETIMEDOUT' : false,
  }
}

function main(argv) {
  const gate = argv.includes('--gate')
  const json = argv.includes('--json')

  if (!existsSync(BASELINE)) {
    console.error(`excuse-control: cannot do its job: ${BASELINE} is not in this tree, so there `
      + 'are no excuses to execute rather than zero false ones.')
    return 2
  }
  let baseline
  try {
    baseline = JSON.parse(readFileSync(BASELINE, 'utf8'))
  } catch (err) {
    console.error(`excuse-control: cannot do its job: the baseline is not readable JSON (${err.message}).`)
    return 2
  }

  let tracked
  try {
    tracked = new Set(execFileSync('git', ['-C', REPO_ROOT, 'ls-files'], {
      encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    }).split('\n').filter(Boolean))
  } catch (err) {
    console.error('excuse-control: cannot do its job: this is not a git checkout, so whether a '
      + `row's subject is still in the tree is unavailable rather than false (${err.message}).`)
    return 2
  }

  const rows = rowsToControl(baseline)
  if (!rows.length) {
    console.error('excuse-control: cannot do its job: the baseline carries no row of an '
      + `executable kind (${EXECUTABLE.join(', ')}). An empty census and an unavailable one read `
      + 'the same to a caller, so this is exit 2 and not a clean sweep.')
    return 2
  }

  const results = []
  for (const entry of rows) {
    if (!tracked.has(entry.path)) {
      // gate-registry.mjs owns this finding and fails on it already, so this
      // file reports it and does not double-count it as a false excuse.
      results.push({ path: entry.path, kind: entry.kind, state: 'refused', code: null, names_credential: false, why: 'not in this tree; gate-registry.mjs owns that finding' })
      continue
    }
    const obs = run(entry)
    const c = classify(entry, obs)
    results.push({ path: entry.path, kind: entry.kind, control: entry.control ?? [], code: obs.code, ...c })
  }

  const v = verdict(results)

  if (json) {
    console.log(JSON.stringify({ results, verdict: v, unexecuted_kinds: UNEXECUTED }, null, 2))
    return v.exitCode
  }

  for (const r of results) {
    const argvStr = (r.control ?? []).join(' ')
    console.log(`${r.state.padEnd(21)} ${(`${r.path} ${argvStr}`).trim().padEnd(52)} ${r.names_credential ? 'names the credential' : 'does not name a credential'}`)
    if (r.state !== 'refused') console.log(`  ${r.why}`)
  }
  console.log('')
  console.log(`${v.total} rows of kind ${EXECUTABLE.join(', ')}: ${v.refused} refused with the `
    + `credential removed, ${v.failed} did not, ${v.unmeasured} unmeasured.`)
  console.log(`${v.named} of the ${v.refused} refusals name the credential in their output. That `
    + 'is reported and not gated: on a runner with no network the same files refuse for lack of')
  console.log('reach, so an assertion on the words would go red for a correct tree.')
  console.log('')
  console.log(`${Object.keys(UNEXECUTED).length} kinds have no executed control here:`)
  for (const [k, why] of Object.entries(UNEXECUTED)) console.log(`  ${k.padEnd(15)} ${why}`)

  if (v.exitCode && !gate) {
    console.log('')
    console.log('Run with --gate to make the above an exit code.')
  }
  return gate ? v.exitCode : 0
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main(process.argv.slice(2)))
}
