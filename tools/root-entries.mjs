#!/usr/bin/env node
// The gate for the inverted root-scratch rule in `.gitignore`.
//
// WHY THIS EXISTS. Seventeen root-level dot-entries have been committed to
// this repository as run scratch, measured over every object in every ref on
// 2026-11-02. Each was a ship-first placeholder written at a run's opening,
// which is the moment the run is holding its wake payload, and that payload is
// composed by agents of every company in the portfolio. `.gitignore` had two
// defences, `*-scratch` and friends, and both were lists of names a run would
// have to remember; between them they covered five of the seventeen, and
// `.ursa-run/` was still tracked on `main` six days after the second list was
// added with a comment warning about exactly this hazard.
//
// A list of names is the wrong instrument for a name nobody has invented yet.
// So `.gitignore` now ignores every root-level dot-entry and names back the
// three this repository commits, and this gate is what fails when the tree and
// that list disagree. It would have caught seventeen of seventeen, and across
// the whole history of this repository it has never had a false positive to
// have: the only root-level entries that are not dot-entries are the twelve
// real ones.
//
// WHAT IT DOES NOT DO: define the allowlist. `.gitignore` is the authority,
// because it is the file `git add` actually obeys, and this gate reads the
// negations out of it. There is nothing here to drift. If the inverted rule is
// missing from `.gitignore` this exits 2 and says so, rather than comparing
// the tree against an empty allowlist and reporting clean. That is
// `scripts/redaction-check.mjs`'s discipline and the same refusal
// `tools/secret-scan.mjs --history` makes on a shallow clone.
//
// TWO SHAPES, TWO ACTORS. A tracked entry outside the allowlist is in `main`
// and every clone has it. An entry that is only present in this working copy
// and not ignored is one `git add -A` away from becoming the first kind. The
// verdict names both counts on every run; `tools/root-entries-verdict.mjs`
// holds the reasoning.
//
// Usage:
//   node tools/root-entries.mjs          # exit 1 on an entry outside the list
//   node tools/root-entries.mjs --json   # same exit codes, JSON out
//
// Exit 0 the tree and the allowlist agree. Exit 1 at least one entry outside
// it. Exit 2 the gate could not establish its own rule, which is never
// reported as clean.
//
// Test seam, documented so nobody mistakes it for configuration:
// `--repo=<dir>` checks another checkout, which is how the suite plants
// scratch files in a throwaway repository and proves this gate can fail.
//
// IMPORTING THIS FILE DOES NOT RUN IT. The program is behind an
// `invokedDirectly` guard, which `tools/gates/enumerate-verdicts.mjs` already
// uses. Without it, `import { allowlistFrom }` in the suite would read the
// environment, scan the repository and call `process.exit` at module scope,
// which is the defect `tools/board/live-target.mjs` was split out of
// `post.mjs` to escape -- there, importing the module posted a message. The
// first draft of this file had it, and the symptom is a suite that reports one
// passing test and silently runs none of its own.
//
// No dependencies, no network.

import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { LOCUS, renderVerdict } from './gates/verdict-shape.mjs'
import { entryLine, unusable, verdict } from './root-entries-verdict.mjs'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function flag(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : null
}
const has = (name) => process.argv.includes(`--${name}`)

const REPO = resolve(flag('repo') ?? REPO_ROOT)
const JSON_OUT = has('json')

/** @returns {{out: string, ok: boolean}} */
function git(args, { allowFail = false } = {}) {
  const r = spawnSync('git', ['-C', REPO, ...args], { encoding: 'utf8' })
  if (r.error || (!allowFail && r.status !== 0)) return { out: '', ok: false }
  return { out: r.stdout ?? '', ok: r.status === 0 }
}

/**
 * The allowlist, read out of `.gitignore` rather than written here. A negation
 * is only part of the allowlist if the inverted rule it is negating is present,
 * so this returns null when `/.*` is absent: there is no allowlist to speak of
 * and the caller must refuse rather than compare against nothing.
 *
 * A negation naming a path *inside* a directory is not a root entry and does
 * not join this list. `.claude/` needs that spelling: the directory is
 * negated so one file can be tracked there, then re-ignored with
 * `/.claude/*` and the single file named back in with
 * `!/.claude/settings.json`, which keeps the harness's session transcripts
 * and local permission overrides out of the repository. Before this filter
 * the nested negation became a fifth "root entry" called
 * `.claude/settings.json`, which the gate would then have reported as an
 * allowlisted root entry that no tree can ever contain.
 *
 * @param {string} text the contents of the root `.gitignore`.
 * @returns {string[] | null}
 */
export function allowlistFrom(text) {
  const lines = text.split('\n').map((l) => l.trim())
  if (!lines.includes('/.*')) return null
  return lines
    .filter((l) => l.startsWith('!/'))
    .map((l) => l.slice(2).replace(/\/$/, ''))
    .filter((n) => n !== '' && !n.includes('/'))
}

/** The first path segment of every tracked file, kept when it is a dot-entry.
 *  A directory is reported by its own name and not by the files inside it,
 *  because the allowlist is a list of entries and `.ursa-run/` is one entry
 *  whether it holds one file or thirty. */
function trackedRootDotEntries() {
  const { out, ok } = git(['ls-files', '-z'])
  if (!ok) return null
  const names = new Set()
  for (const path of out.split('\0')) {
    if (path === '') continue
    const head = path.split('/')[0]
    if (head.startsWith('.')) names.add(head)
  }
  return [...names].sort()
}

/** Dot-entries that exist on disk here, are not tracked, and are not ignored.
 *  `.git` is excluded by name: git ignores it unconditionally and no ignore
 *  rule is what makes that true, so asking `check-ignore` about it would
 *  report the repository itself as loose scratch. */
function looseRootDotEntries(tracked) {
  const names = readdirSync(REPO, { withFileTypes: true })
    .map((d) => d.name)
    .filter((n) => n.startsWith('.') && n !== '.git' && !tracked.includes(n))
  if (names.length === 0) return []
  const loose = []
  for (const name of names) {
    const r = spawnSync('git', ['-C', REPO, 'check-ignore', '-q', '--', name], { encoding: 'utf8' })
    // 0 ignored, 1 not ignored, 128 an error. Only 1 is a finding; 128 would
    // be a gate that cannot answer, and it is reported rather than treated as
    // "not ignored", which would publish a false positive.
    if (r.status === 1) loose.push(name)
    else if (r.status !== 0) return null
  }
  return loose.sort()
}

function run() {
  const ignoreFile = join(REPO, '.gitignore')
  if (!git(['rev-parse', '--show-toplevel']).ok) {
    return { v: unusable('git could not name a repository root here', REPO), entries: [], seen: {} }
  }
  if (!existsSync(ignoreFile)) {
    return { v: unusable('there is no .gitignore at the repository root', REPO), entries: [], seen: {} }
  }
  const allowlist = allowlistFrom(readFileSync(ignoreFile, 'utf8'))
  if (allowlist === null) {
    return {
      v: unusable(
        'no `/.*` line in .gitignore, so there is no allowlist to compare the tree against',
        'the rule and the reasoning for it are at the end of .gitignore',
      ),
      entries: [],
      seen: {},
    }
  }

  const tracked = trackedRootDotEntries()
  if (tracked === null) {
    return { v: unusable('git ls-files would not answer in this checkout', REPO), entries: [], seen: {} }
  }
  const loose = looseRootDotEntries(tracked)
  if (loose === null) {
    return { v: unusable('git check-ignore would not answer in this checkout', REPO), entries: [], seen: {} }
  }

  const entries = [
    ...tracked.filter((n) => !allowlist.includes(n)).map((name) => ({ name, locus: LOCUS.COMMITTED })),
    ...loose.map((name) => ({ name, locus: LOCUS.CLONE })),
  ]
  const seen = { scanned: tracked.length + loose.length, allowlist }
  return { v: verdict(entries, seen), entries, seen }
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href

if (invokedDirectly) {
  const { v, entries, seen } = run()

  if (JSON_OUT) {
    process.stdout.write(
      `${JSON.stringify({ clean: v.exitCode === 0, cause: v.cause, line: v.line, entries, ...seen }, null, 2)}\n`,
    )
  } else {
    const lines = renderVerdict(v, entries.map(entryLine))
    const write = v.stream === 'err' ? process.stderr : process.stdout
    write.write(`${lines.join('\n')}\n`)
  }
  process.exit(v.exitCode)
}
