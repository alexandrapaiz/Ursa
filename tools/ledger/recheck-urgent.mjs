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
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { parseLedger } from './ledger.mjs'
import { statusOf } from './block-kinds.mjs'
import { classifyEntry, probesIn, report } from './urgent-verdict.mjs'

const args = process.argv.slice(2)
const noRun = args.includes('--no-run')
const todayAt = args.indexOf('--today')
const today = todayAt !== -1 ? args[todayAt + 1] : new Date().toISOString().slice(0, 10)
const ledgerPath = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--today') ?? 'docs/ideas.md'

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
 * Run one probe. `node --test <path>` with the argument vector passed
 * directly, never through a shell, because the path came out of a prose file.
 * @param {string} path a path already matched against urgent-verdict's
 *   PROBE_SHAPE allowlist and confirmed tracked
 * @returns {boolean} whether it exited 0
 */
function runProbe(path) {
  const out = spawnSync(process.execPath, ['--test', path], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    timeout: 300_000,
  })
  return out.status === 0
}

let source
try {
  source = readFileSync(ledgerPath, 'utf8')
} catch (err) {
  console.error(`recheck-urgent: cannot read ${ledgerPath}: ${err.message}`)
  process.exit(2)
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

/** @type {Map<string, boolean>} */
const probeResults = new Map()
if (!noRun) {
  const wanted = new Set()
  for (const e of urgent) for (const p of probesIn(e.text, isTracked)) wanted.add(p)
  for (const p of [...wanted].sort()) {
    process.stderr.write(`recheck-urgent: running ${p}\n`)
    probeResults.set(p, runProbe(p))
  }
}

const verdicts = urgent.map((e) => classifyEntry(e, { probeResults, isTracked, today }))
for (const line of report(verdicts, { ledgerPath, today })) console.log(line)
if (noRun) {
  console.log('--no-run was passed, so no probe was executed and every entry above is unverified by construction.')
}
