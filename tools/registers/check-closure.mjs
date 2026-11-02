#!/usr/bin/env node
// The production-closure gate: what this repository's lockfiles actually ship,
// pinned to a committed baseline, measured without the network.
//
//   node tools/registers/check-closure.mjs              # the gate
//   node tools/registers/check-closure.mjs --json       # same, machine-readable
//   node tools/registers/check-closure.mjs --write      # re-pin the baseline
//   node tools/registers/check-closure.mjs --names zod shadcn undici
//                                                      # does this package ship?
//   node tools/registers/check-closure.mjs --root DIR   # against another checkout
//
// Exit 0 every member of every production closure is pinned. Exit 1 a closure
// and the baseline disagree, which is a defect in a tracked file. Exit 2 the
// baseline or a lockfile could not be read, so this tool established nothing
// and must not report clean.
//
// WHY IT READS THE WORKING TREE AND NOT A REF. The lockfile on disk is the one
// `npm ci` will install from, so it is the one whose closure ships. A gate that
// read `HEAD` would pass on a branch whose uncommitted lockfile change adds a
// package, which is the exact moment the answer matters. `git ls-files` is used
// only to decide WHICH lockfiles are the repository's, so that a stray
// package-lock.json under an ignored directory cannot enter the census; the
// bytes always come from disk.
//
// WHY `--names` EXISTS AS A FLAG RATHER THAN A README SENTENCE. On 2026-10-26 a
// seat needed to know whether `shadcn` and `@modelcontextprotocol/sdk` ship,
// could not answer it, and filed the question in `docs/ideas.md` as urgent,
// where it sat for six days. The answer was in a committed file the whole time.
// A question a seat asks twice is a flag, not a paragraph.
//
// WHAT THIS GATE IS NOT. It is not an advisory check and it does not know what
// a vulnerability is. `scripts/dep-floor.mjs` is that gate, it needs the
// registry, and the two compose: dep-floor answers "is there an advisory and
// how bad", this answers "is the package it names on a deployed surface", and
// only the second half is a property of a committed file. Neither replaces the
// other and this file deliberately does not reach for the network.
//
// WHY `--root` EXISTS, since a gate that can be pointed elsewhere is a gate
// that can be pointed at the wrong thing. Everything above the CLI lives in
// ./closure-verdict.mjs and is driven directly by its test. The part that only
// exists here -- enumerating tracked lockfiles, reading them off disk, writing
// the baseline -- resolved its paths from `import.meta.url`, so the only
// repository it could ever read was this one, and `--write` could only be
// exercised by overwriting the committed baseline. That is untestable in the
// precise sense that matters: the branches would ship unexercised.
// `tools/registers/check-ids.test.mjs` solved the same problem for its gate by
// building fixture repositories with `git init` and passing `--base main`, and
// this is that flag for this gate. It defaults to this repository, so no
// invocation anyone types changes.
//
// No dependencies. No network. Reads three committed lockfiles and one
// committed baseline.

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, posix, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { renderVerdict } from '../gates/verdict-shape.mjs'
import {
  baselineFault,
  baselineUnusable,
  compare,
  lockFault,
  lockUnreadable,
  prodClosure,
  scopeUnreadable,
  verdict,
} from './closure-verdict.mjs'

const DEFAULT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const BASELINE_REL = 'tools/registers/prod-closure.json'

const argv = process.argv.slice(2)
const JSON_OUT = argv.includes('--json')
const WRITE = argv.includes('--write')
const ROOT_AT = argv.indexOf('--root')
const REPO_ROOT = ROOT_AT === -1 ? DEFAULT_ROOT : resolve(argv[ROOT_AT + 1] ?? '.')
const BASELINE = join(REPO_ROOT, 'tools', 'registers', 'prod-closure.json')
const NAMES_AT = argv.indexOf('--names')
// STOP at the first flag, do not FILTER flags out. `--names` is variadic, so
// the first draft collected every later argument that did not begin with `--`
// and dropped the flags -- which silently swallowed the VALUE of any later
// flag. `--names a --json --root /tmp/x` asked whether a package literally
// called `/tmp/x` ships. Found by the test immediately below, which is the
// only reason it is not in the committed gate.
const NAMES = NAMES_AT === -1 ? [] : (() => {
  const taken = []
  for (const arg of argv.slice(NAMES_AT + 1)) {
    if (arg.startsWith('--')) break
    taken.push(arg)
  }
  return taken
})()

/**
 * Every lockfile this repository tracks, as repository-relative POSIX paths.
 * Returns a fault rather than throwing: the caller exits at module scope and a
 * checkout that is not a git tree is a ground condition, not a finding.
 *
 * @returns {{dirs: string[]} | {fault: {code: string, detail: string}}}
 */
export function trackedLockfileDirs(root = DEFAULT_ROOT) {
  let listing
  try {
    listing = execFileSync('git', ['-C', root, 'ls-files', '-z', '*package-lock.json'], {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    })
  } catch (error) {
    return { fault: { code: 'NOT_A_GIT_CHECKOUT', detail: `git ls-files in ${relative(process.cwd(), root) || '.'} failed: ${error.message}` } }
  }
  const dirs = listing
    .split('\u0000')
    .filter((p) => p !== '' && posix.basename(p) === 'package-lock.json')
    .map((p) => posix.dirname(p))
    .sort()
  if (dirs.length === 0) {
    // Zero lockfiles would make this gate print a clean line over nothing
    // checked, the one output it must never produce. ./closure-verdict.mjs
    // refuses an empty baseline for the same reason.
    return { fault: { code: 'NO_TRACKED_LOCKFILES', detail: 'git ls-files matched no package-lock.json, so this gate would check nothing and exit 0' } }
  }
  return { dirs }
}

/** Parse a JSON file, returning the Error rather than throwing, which is what
 *  the two fault validators in ./closure-verdict.mjs take as input. */
function readJson(path) {
  let raw
  try {
    raw = readFileSync(path, 'utf8')
  } catch (error) {
    return error.code === 'ENOENT' ? undefined : error
  }
  try {
    return JSON.parse(raw)
  } catch (error) {
    return error
  }
}

/** The baseline file's own contents, so `--write` and the header stay in step. */
export function baselineDocument(measured) {
  const workspaces = {}
  for (const dir of Object.keys(measured).sort()) {
    workspaces[dir] = {
      members: measured[dir].members,
      count: measured[dir].members.length,
      devOnlyEntriesExcluded: measured[dir].devOnly,
    }
  }
  return {
    _note:
      'The production closure of every tracked package-lock.json: the name@version set that ' +
      '`npm ci --omit=dev` installs, which is what reaches a deployed surface. Generated by ' +
      '`node tools/registers/check-closure.mjs --write` and enforced by the same file without ' +
      'the flag. Scope comes from npm’s own `dev` and `devOptional` fields in the lockfile, ' +
      'the same fields `npm audit --omit=dev` reads; see tools/registers/closure-verdict.mjs for ' +
      'why they are read rather than recomputed. A diff here is a change in what this ' +
      'repository ships, so it is reviewed as one. This file is not an allowlist and nothing in ' +
      'it accepts a risk; dep-floor.allow.json is where an accepted risk goes.',
    workspaces,
  }
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href

if (invokedDirectly) {
  const located = trackedLockfileDirs(REPO_ROOT)
  if ('fault' in located) {
    const v = scopeUnreadable(located.fault)
    console.error(v.line)
    process.exit(v.exitCode)
  }

  // Measure every closure first. A lockfile this gate cannot read a scope off
  // is a ground fault and stops the run, because a partial census would print
  // a clean line about two workspaces while saying nothing about the third.
  const measured = {}
  for (const dir of located.dirs) {
    const path = join(REPO_ROOT, dir, 'package-lock.json')
    const lock = readJson(path)
    const fault = lockFault(lock === undefined ? new Error('file disappeared between listing and read') : lock, `${dir}/package-lock.json`)
    if (fault) {
      const v = lockUnreadable(fault)
      console.error(v.line)
      process.exit(v.exitCode)
    }
    measured[dir] = prodClosure(lock)
  }

  const totals = {
    workspaces: Object.keys(measured).length,
    packages: Object.values(measured).reduce((t, c) => t + c.members.length, 0),
    devOnly: Object.values(measured).reduce((t, c) => t + c.devOnly, 0),
  }

  // --names is a query and not a gate. It answers the one question that sent a
  // seat to the ledger instead of to a file, and it exits 0 whatever the
  // answer, because "yes it ships" is a fact and not a defect.
  if (NAMES.length > 0) {
    const rows = []
    for (const name of NAMES) {
      for (const dir of Object.keys(measured)) {
        const shipping = measured[dir].members.filter((m) => m.slice(0, m.lastIndexOf('@')) === name)
        rows.push({ package: name, workspace: dir, ships: shipping.length > 0, versions: shipping })
      }
    }
    if (JSON_OUT) {
      console.log(JSON.stringify({ names: rows }, null, 2))
    } else {
      const w = Math.max(...rows.map((r) => r.package.length), 7)
      for (const r of rows) {
        console.log(
          `${r.package.padEnd(w)}  ${r.workspace.padEnd(18)}  ` +
            `${r.ships ? `ships as ${r.versions.join(', ')}` : 'development-only or absent: not in this workspace’s production closure'}`,
        )
      }
    }
    process.exit(0)
  }

  if (WRITE) {
    writeFileSync(BASELINE, `${JSON.stringify(baselineDocument(measured), null, 2)}\n`)
    console.log(
      `Production closure: wrote ${totals.packages} package(s) across ${totals.workspaces} ` +
        `workspace(s) to ${BASELINE_REL}, with ${totals.devOnly} development-only entry(ies) ` +
        'excluded. Review the diff; it is the change in what this repository ships.',
    )
    process.exit(0)
  }

  const baseline = readJson(BASELINE)
  const bFault = baselineFault(baseline)
  if (bFault) {
    const v = baselineUnusable(bFault)
    console.error(v.line)
    process.exit(v.exitCode)
  }

  const findings = compare(measured, baseline)
  const v = verdict(findings, totals)
  const lines = renderVerdict(v, findings.map((f) => `::error::${f.rule}: ${f.message}`))

  if (JSON_OUT) {
    console.log(JSON.stringify({ workspaces: measured, findings, totals, verdict: v }, null, 2))
  } else {
    for (const line of lines) (v.stream === 'err' ? console.error : console.log)(line)
  }
  process.exit(v.exitCode)
}
