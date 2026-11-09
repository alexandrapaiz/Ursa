#!/usr/bin/env node
// Re-test every `urgent` entry in the ledger against the repository as it is
// today, and report which of them are still true.
//
//   node tools/ledger/recheck-urgent.mjs [path-to-ledger] [--today YYYY-MM-DD] [--no-run]
//
// Always exits 0 when it could do its job, whatever it found. Exits 2 when it
// could not: an unreadable ledger or a `git ls-files` that failed. Exit 2 is
// already this repository's code for a tool that cannot answer, per
// `tools/board/post.mjs`'s header, and the distinction matters here more than
// usual, because this tool's whole subject is the difference between "we
// looked and it is clear" and "we did not look".
//
// The reasoning for the classification, and for why this reports instead of
// gating, is in `./urgent-verdict.mjs`. This file is the I/O: read the ledger,
// ask git which paths exist, run the allowlisted probes, print.
//
// --no-run reports the extraction without executing any probe, so a reader can
// see which entries are checkable at all without paying for the test runs.
// Under it every entry classifies `unverifiable`, which is honest: nothing ran.
//
// An entry may name the command that decides it, which this tool then runs in
// preference to anything it could infer from the entry's prose:
//
//   - Recheck: `node tools/secret-scan.mjs --history`
//
// The grammar that line must satisfy, and the reason it is narrower than a
// shell command rather than wider, is in `./urgent-verdict.mjs`. A declaration
// that fails it is printed as refused with its reason, never dropped.
//
// THE CLONE IS MEASURED, NOT ASSUMED (added 2026-11-09). This tool runs probes
// that read git history, and the clone every seat on this host is handed is
// shallow and single-branch, so those probes refuse or answer from a truncated
// graph. That was already written down in three comments in this file and in
// `./urgent-verdict.mjs` and it was never in the output, so the report's
// headline count was being read as a fact about the repository when it was a
// fact about the checkout. Run twice on 2026-11-09 over the same ledger at the
// same commit: 0 entries still failing before `bash tools/ensure-full-clone.sh`
// and 3 after, 18 with no measurement before and 13 after. So the first thing
// this tool now does is ask `bash tools/ensure-full-clone.sh --check`, and the
// answer is printed with the counts. It does NOT repair the clone: completing a
// clone fetches 4,700 commits and 334 branches, and a reporting tool that
// silently rewrites `.git/config` and the object store is not a reporting tool.
//
// IT STILL EXITS 0 WHEN THE CLONE IS INCOMPLETE, deliberately. The reasoning
// is in `./urgent-verdict.mjs`'s header under WHY IT REPORTS AND NEVER GATES,
// and the clone is the case that tests it: a seat handed a shallow clone has
// done nothing wrong, cannot be blamed for one, and would learn to ignore a
// red light it cannot clear. The output says the counts are provisional in
// words, in the same paragraph as the counts, which is where a reader is.
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { parseLedger } from './ledger.mjs'
import { statusOf } from './block-kinds.mjs'
import { classifyEntry, probePlan, report } from './urgent-verdict.mjs'

const args = process.argv.slice(2)
const noRun = args.includes('--no-run')
const todayAt = args.indexOf('--today')
const today = todayAt !== -1 ? args[todayAt + 1] : new Date().toISOString().slice(0, 10)
const ledgerPath = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--today') ?? 'docs/ideas.md'

/**
 * Whether this checkout can answer a question about git history, asked of the
 * one script in this repository whose entire subject that is rather than
 * re-derived here. `bash tools/ensure-full-clone.sh --check` exits 0 complete,
 * 1 a repair is needed, 2 there is nothing here to repair (no repo, no
 * `origin`), and prints one line per repair on stderr. Those lines are passed
 * through verbatim.
 *
 * Resolved from this module's own URL, not from the process's cwd, because
 * this tool takes a ledger path as an argument and a caller may well run it
 * from somewhere else. A missing script is `'unknown'` and never `'complete'`:
 * the safe direction for a tool whose subject is the difference between a
 * measurement and the absence of one.
 *
 * No shell. `spawnSync('bash', [...])` with a fixed argument vector, for the
 * same reason the probe runner uses one.
 * @returns {{ clone: 'complete' | 'incomplete' | 'unknown', cloneWhy: string[] }}
 */
function cloneState() {
  const script = fileURLToPath(new URL('../ensure-full-clone.sh', import.meta.url))
  if (!existsSync(script)) {
    return { clone: 'unknown', cloneWhy: [`tools/ensure-full-clone.sh is not present at ${script}, so completeness was never asked`] }
  }
  const out = spawnSync('bash', [script, '--check'], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })
  const why = (out.stderr ?? '')
    .split('\n')
    .map((l) => l.replace(/^ensure-full-clone: /, '').trim())
    .filter((l) => l !== '' && !l.startsWith('Run: '))
  if (out.status === 0) return { clone: 'complete', cloneWhy: [] }
  if (out.status === 1) return { clone: 'incomplete', cloneWhy: why }
  return {
    clone: 'unknown',
    cloneWhy: why.length > 0 ? why : [`\`bash tools/ensure-full-clone.sh --check\` exited ${out.status === null ? 'without running' : String(out.status)}`],
  }
}

/** Every path git tracks. The 64 MiB ceiling is deliberate and is the fix for
 *  a defect this repository has already filed: `child_process`'s default
 *  `maxBuffer` is 1 MiB, and an over-buffer read inside a try/catch is
 *  indistinguishable from a missing path. `docs/ideas.md` alone is over 1 MiB,
 *  and this listing is of the whole tree. */
function trackedPaths() {
  const out = spawnSync('git', ['ls-files', '-z'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  if (out.status !== 0) {
    console.error(`recheck-urgent: git ls-files failed: ${out.stderr?.trim() ?? 'no stderr'}`)
    console.error('recheck-urgent: cannot tell which cited paths exist, so no entry can be classified.')
    process.exit(2)
  }
  return new Set(out.stdout.split('\0').filter(Boolean))
}

/**
 * Run one probe. The argument vector is passed to `spawnSync` directly and
 * never through a shell, because every token in it came out of a prose file.
 * Two vector shapes reach here and both are built by `probePlan`, not here:
 * `['--test', '<a tracked .test.mjs under tools>']` for a probe this tool
 * inferred from a path the entry mentioned, and `['<a tracked .mjs under tools
 * or scripts>', '--bare-flag', ...]` for the command the entry declared on a
 * `- Recheck:` line. Nothing else is accepted by either allowlist, so this function does no
 * validation of its own and must not start doing any: a check here would be a
 * second, weaker copy of a rule that belongs in one place.
 *
 * Exit 2 is reported as `'cannot-answer'` and never as a failure. That is this
 * repository's own convention for a gate that could not do its job, and here it
 * is load-bearing: `node tools/secret-scan.mjs --history` exits 2 in the
 * shallow single-branch clone every seat is handed, so reading non-zero as "the
 * urgent condition still holds" would turn a refusal into a finding. A spawn
 * that never started (`out.status === null`, which is what a timeout or a
 * missing interpreter looks like) is the same answer for the same reason.
 *
 * A `node --test` suite that SKIPS a subtest still exits 0, so for an inferred
 * probe the exit code alone cannot tell a pass from a measurement that did not
 * happen. `tools/root-entries.test.mjs` skips its central assertion on a
 * shallow clone, on purpose and with a message saying the claim is unmeasured,
 * and the shallow clone is what every seat is handed. So the TAP summary is
 * read too, and exit 0 with a non-zero skip count is `'incomplete'`. The skip
 * count is returned alongside so the report can print the one number a reader
 * needs to go and look.
 * @param {string[]} argv what follows the interpreter
 * @returns {{ outcome: true | false | 'cannot-answer' | 'incomplete', skipped: number }}
 */
function runProbe(argv) {
  const out = spawnSync(process.execPath, argv, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    timeout: 300_000,
  })
  const skipped = Number(/^# skipped (\d+)$/m.exec(out.stdout ?? '')?.[1] ?? 0)
  if (out.status === 2 || out.status === null) return { outcome: 'cannot-answer', skipped }
  if (out.status !== 0) return { outcome: false, skipped }
  return { outcome: skipped > 0 ? 'incomplete' : true, skipped }
}

let source
try {
  source = readFileSync(ledgerPath, 'utf8')
} catch (err) {
  console.error(`recheck-urgent: cannot read ${ledgerPath}: ${err.message}`)
  process.exit(2)
}

const { clone, cloneWhy } = cloneState()
if (clone !== 'complete') {
  process.stderr.write(`recheck-urgent: clone is ${clone}; counts below describe this checkout, not the repository\n`)
  for (const w of cloneWhy) process.stderr.write(`recheck-urgent:   ${w}\n`)
}

const tracked = trackedPaths()
/** Directories, derived from the file list. `git ls-files` lists files only,
 *  and ledger entries cite directories as often as files (`docs/standards`,
 *  `tools/doc-model`). Without this, every cited directory was reported as a
 *  path that no longer exists, which is the one kind of error this tool must
 *  not make: a false "the subject is gone" is an invitation to close a live
 *  entry. */
const trackedDirs = new Set()
for (const f of tracked) {
  const parts = f.split('/')
  for (let i = 1; i < parts.length; i += 1) trackedDirs.add(parts.slice(0, i).join('/'))
}
const isTracked = (p) => tracked.has(p) || trackedDirs.has(p)

const urgent = parseLedger(source)
  .filter((b) => b.kind === 'entry' && statusOf(b.text) === 'urgent')
  .map((b) => ({ heading: b.text.split('\n')[0], date: headingDate(b.text), text: b.text }))

/** @param {string} text @returns {string | null} */
function headingDate(text) {
  return text.match(/^###\s+(\d{4}-\d{2}-\d{2})/)?.[1] ?? null
}

/** Keyed on the probe's identity string, which is the test path for an
 *  inferred probe and the whole command line for a declared one, so two
 *  entries that declare the same command pay for it once. */
/** @type {Map<string, true | false | 'cannot-answer' | 'incomplete'>} */
const probeResults = new Map()
/** @type {Array<{ key: string, skipped: number }>} */
const skipping = []
if (!noRun) {
  /** @type {Map<string, string[]>} identity -> argv */
  const wanted = new Map()
  for (const e of urgent) {
    for (const probe of probePlan(e.text, isTracked).probes) wanted.set(probe.path, probe.argv)
  }
  for (const key of [...wanted.keys()].sort()) {
    process.stderr.write(`recheck-urgent: running ${key}\n`)
    const { outcome, skipped } = runProbe(wanted.get(key))
    probeResults.set(key, outcome)
    if (skipped > 0) skipping.push({ key, skipped })
  }
}

const verdicts = urgent.map((e) => classifyEntry(e, { probeResults, isTracked, today, clone }))
for (const line of report(verdicts, { ledgerPath, today, clone, cloneWhy })) console.log(line)
// The skip counts, printed on stdout with the report rather than left on
// stderr, because they are the reason an entry above reads `incomplete` and a
// reader who cannot see them has to take the word `incomplete` on trust.
for (const { key, skipped } of skipping) {
  console.log(`measurement note: \`${key}\` exited 0 with ${skipped} skipped subtest(s), so its zero is not a measurement of everything it asserts.`)
}
if (noRun) {
  console.log('--no-run was passed, so no probe was executed and every entry above is unverified by construction.')
}
