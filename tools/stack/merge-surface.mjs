#!/usr/bin/env node
// merge-surface.mjs — what is the conflict surface of one pair of commits?
//
//   node tools/stack/merge-surface.mjs --head refs/prs/615
//   node tools/stack/merge-surface.mjs --base origin/main --head my-branch
//   node tools/stack/merge-surface.mjs --head refs/prs/615 --json
//   node tools/stack/merge-surface.mjs --prs 601,615,665        # one row each
//
// Exit 0 the pair merges clean. Exit 1 at least one path conflicts, and the
// paths are named. Exit 2 the surface could not be measured at all, which is
// never reported as clean and never as a conflict. Exit 2 is also usage.
//
// WHY THIS EXISTS, and it is not that the command is hard to type. It is one
// command: `git merge-tree --write-tree --name-only <base> <head>`. This
// repository has recorded four separate occasions on which that command
// returned a confident wrong answer with no error on any of them, the fourth
// of them on 2026-11-02, five lines below a rule written in bold to prevent
// exactly it. The four are enumerated in `merge-surface-verdict.mjs`'s header
// with their incident identifiers. The common shape: every precondition the
// command needs is a property of the CLONE, and `merge-tree` reports a
// violated precondition as a finding about the repository.
//
// So the preconditions are executed here, in order, before any merge is
// attempted, and a violated one is exit 2 with a named cause and a named
// repair holder:
//
//   1. The clone answers history questions (`tools/ensure-full-clone.sh
//      --check`). A shallow or single-branch clone does not refuse these
//      questions, it answers them wrongly.
//   2. Every merge driver `.gitattributes` declares is registered in THIS
//      clone. A clone as handed has none of them, and git then falls back to
//      the line merge on precisely the files that exist because the line merge
//      is wrong for them.
//   3. Every registered driver's program is inside THIS checkout.
//      `install-drivers.sh` writes absolute paths, so a driver can be
//      registered and still point at a directory that is not here.
//      `docs/agents/merge-order.md` requires this assertion in prose; this is
//      it, executed.
//   4. No driver key is the empty string. That configuration returns one side
//      verbatim, writes `error: cannot run :` to stderr, and exits 1 -- the
//      same exit a genuine conflict returns.
//
// THE STREAMS ARE NOT COLLAPSIBLE HERE, which is the point. `spawnSync` is
// given two separate pipes, so there is no form of this program's invocation
// that can put a driver's stderr where the tree identifier belongs. And
// because a future driver's diagnostic text is not knowable, the guard is
// positive rather than a denylist: stdout's first line must match
// /^[0-9a-f]{40}$/ AND name an object that exists, or the run is
// TREE_ID_UNREADABLE and the path list under it is discarded. A caller cannot
// get a conflict surface out of this program without the tree that produced
// it.
//
// AND THE REASON A DRIVER REFUSED IS ON THE OTHER HANDLE FROM THE PATH IT
// REFUSED, which the tree-id guard above does not help with at all. Added
// 2026-11-02 after `Ursa/exo` reported a second case of the collapse: a merge
// gate that had installed both drivers reported ONE remaining conflict on its
// held branch where there were two, and the one it dropped was the
// `improvements` register, which the `register` driver had refused with a
// reason naming a single heading both sides had edited. Re-measured here on
// `refs/prs/668` against `origin/main` at `9c3c52dc` before anything was
// built, and it reproduces: the path is on stdout, the sentence is on stderr.
// So both drivers now emit one machine-readable attribution line per
// invocation, `tools/stack/driver-report.mjs` parses it, and this gate prints
// the reason under the path it belongs to -- because the two kinds of
// conflicted path need different work, and keeping both sides is the correct
// resolution for one of them and actively wrong for the other. A driver that
// reports refusing a path git did not list is `DRIVER_REFUSAL_UNLISTED`, which
// is ground: that is the state the 2026-11-02 census was in.
//
// WHICH QUESTION THE ANSWER IS TO, because there are two and they have
// different answers. With this repository's drivers registered, "does this
// conflict" means **can a seat resolve this without a person**. With them
// absent it means **will the owner's green button work**, because the forge
// has no clone to register a driver in. A skill-seat measurement of
// 2026-10-25, recorded in `docs/ideas.md`, reproduced here: over eighteen of
// this repository's own merges whose two parents both change `docs/ideas.md`,
// on every owner merge where the two arms differ -- four of five -- the blob
// `main` recorded is the driverless merge's and never the driver's.
//
// This gate answers the FIRST question, and it says so numerically on every
// line: `measured with N merge driver key(s) registered` is the arm as a
// property of the clone rather than as a flag the caller believes it passed,
// which is what that ledger entry's first step asked for. It REFUSES to run
// in the second arm rather than answering it badly, because the three
// configurations that look like "drivers off" are three different things and
// only one of them is: `merge.<n>.name` with no `.driver` is fatal at 128,
// `.driver` set empty returns one side verbatim and exits 1, and only a bare
// `merge` attribute in `.git/info/attributes` restores the built-in three-way
// merge. The driverless arm is in `docs/ideas.md` as its own proposal with
// the method that works.
//
// THE REFUSAL SHAPES ARE TWO, AND ONLY ONE OF THEM IS LOUD. Measured on git
// 2.43.0 while writing this file: unrelated histories is
// `fatal: refusing to merge unrelated histories` at exit **128**, which no
// caller can mistake for a verdict. A revision that is not present is
// `merge-tree: <rev> - not something we can merge` at exit **1**, with empty
// stdout -- the same exit a genuine conflict returns. That is the shape behind
// L-A55, where a narrowed refspec turned every refused merge into "a conflict
// in no files". Two guards here, because one is not enough: both revisions are
// resolved with `rev-parse --verify` before the merge, and the exit code and
// the path count are then required to agree, so an exit 1 with no paths is
// MERGE_REFUSED and never a clean-looking zero-length surface.
//
// THE EXIT CODE IS READ THREE-VALUED, never two. 0 is clean, 1 is a content
// conflict, and anything else -- 128 in practice -- is git refusing to attempt
// the merge, which is reported as ground. `tools/stack/integrate.sh` learned
// this on 2026-10-24 after classifying refusals as conflicts in `--json` and
// as conflicts-in-no-files on the console, in the same run.
//
// WHAT THIS IS NOT. It is not `tools/stack/integrate.sh`. That script answers
// "if the owner merged all of these, in this order, would the result build and
// pass", which needs a real worktree, a real `git merge` and the test suites.
// This answers "what is the conflict surface of one pair of commits", writes
// nothing outside the object database, needs no worktree and no network beyond
// the refs already fetched, and takes single-digit milliseconds, so it is the
// one that can be run over every open branch.
//
// IMPORTING THIS FILE DOES NOT RUN IT: the program is behind an
// `invokedDirectly` guard, the same seam `tools/root-entries.mjs` uses, so the
// suite can import `parseSurface` without the module scanning a repository and
// calling `process.exit` on load.
//
// Test seam, documented so nobody mistakes it for configuration:
// `--repo=<dir>` measures another checkout, which is how the suite builds a
// throwaway repository with a stderr-writing driver in it and proves each
// ground branch can actually fire.
//
// No dependencies, no network.

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { LOCUS, renderVerdict } from '../gates/verdict-shape.mjs'
import { classify, collapseCost, reconcile } from './driver-report.mjs'
import { GROUND, pathLine, verdict } from './merge-surface-verdict.mjs'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

const OID = /^[0-9a-f]{40}$/

function flag(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  if (hit) return hit.slice(name.length + 3)
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')
    ? process.argv[i + 1]
    : null
}

/**
 * Split `merge-tree --write-tree --name-only` stdout into the tree it wrote
 * and the paths it could not merge, refusing anything that is not that shape.
 *
 * Exported and pure because this is the function the stream-collapse guard
 * lives in, and a guard that can only be exercised by spawning git is a guard
 * nobody rehearses red.
 *
 * @param {string} stdout the raw stdout, both streams NEVER combined.
 * @param {(oid: string) => boolean} objectExists
 * @returns {{tree: string, paths: string[]} | {fault: string}}
 */
export function parseSurface(stdout, objectExists) {
  const lines = stdout.split('\n')
  const first = lines[0] ?? ''
  if (!OID.test(first)) return { fault: first }
  if (!objectExists(first)) return { fault: first }
  const paths = []
  for (const line of lines.slice(1)) {
    if (line === '') break
    paths.push(line)
  }
  return { tree: first, paths }
}

/**
 * Do `merge-tree`'s exit code and its path list agree about what happened?
 *
 * They have to, and when they do not the output is not a verdict about the
 * branch. The case that is not hypothetical: a revision that is absent from
 * the clone produces `merge-tree: <rev> - not something we can merge` on
 * stderr, EMPTY stdout, and exit **1** -- the same exit a genuine conflict
 * returns. Measured on git 2.43.0. That is the shape behind lesson L-A55,
 * where a narrowed refspec made `tools/stack/integrate.sh` report three live
 * branches as conflicting in no files at all.
 *
 * Exported and pure so the case can be driven directly. The absent-revision
 * path is already closed upstream by `rev-parse --verify`, which means this
 * check can only fire if that one is wrong or if `merge-tree`'s contract
 * changes -- and a guard whose only trigger is someone else's future mistake
 * is exactly the kind that is never rehearsed unless it is callable.
 *
 * @param {number} status the process exit code, as git returned it.
 * @param {number} pathCount how many conflicted paths were parsed out.
 * @returns {boolean} true when the two cannot both be true.
 */
export function disagrees(status, pathCount) {
  return (status === 1) !== (pathCount > 0)
}

/**
 * Which merge driver names `.gitattributes` declares, and which of those this
 * clone has registered, and whether the registered ones point at this
 * checkout. Three separate answers because they have three separate repairs.
 *
 * @param {(args: string[]) => {out: string, status: number}} git
 * @param {string} root the checkout the drivers must point into.
 * @returns {{declared: string[], unregistered: string[], foreign: string[], empty: string[], keys: number}}
 */
export function auditDrivers(git, root) {
  const attrs = git(['show', 'HEAD:.gitattributes'])
  const declared = [
    ...new Set(
      (attrs.out.match(/\bmerge=([A-Za-z0-9_-]+)/g) ?? []).map((m) => m.split('=')[1]),
    ),
  ].sort()

  const config = git(['config', '--get-regexp', '^merge\\..*\\.driver$'])
  /** @type {Map<string, string>} */
  const registered = new Map()
  for (const line of config.out.split('\n')) {
    if (line.trim() === '') continue
    const sp = line.indexOf(' ')
    const key = sp === -1 ? line : line.slice(0, sp)
    const value = sp === -1 ? '' : line.slice(sp + 1)
    const name = key.replace(/^merge\./, '').replace(/\.driver$/, '')
    registered.set(name, value)
  }

  const unregistered = declared.filter((n) => !registered.has(n))
  const empty = [...registered.entries()].filter(([, v]) => v.trim() === '').map(([n]) => n)
  // The driver command is `node /abs/path/to/tool.mjs %O %A %B %L %P`. Take
  // every absolute-looking token and require it to live under this checkout.
  const foreign = [...registered.entries()]
    .filter(([, v]) => {
      const paths = v.split(/\s+/).filter((t) => t.startsWith('/'))
      return paths.length > 0 && !paths.every((p) => p.startsWith(`${root}/`) && existsSync(p))
    })
    .map(([n]) => n)

  return { declared, unregistered, foreign, empty, keys: registered.size }
}

/** The whole measurement for one pair of revisions. Returns a Verdict plus the
 *  census and findings the printer needs. */
function measure({ repo, base, head }) {
  const git = (args) => {
    const r = spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8' })
    return { out: (r.stdout ?? '').trim(), err: (r.stderr ?? '').trim(), status: r.status ?? 128 }
  }

  // Precondition 1. The clone has to be able to answer history questions
  // before a merge question means anything.
  const clone = spawnSync(
    'bash',
    [resolve(REPO_ROOT, 'tools', 'ensure-full-clone.sh'), '--check', '--repo', repo],
    { encoding: 'utf8' },
  )
  if (clone.status === 1) {
    // `--check` writes its reasons to STDERR and exits 1. Reading stdout here
    // was this file's own first bug of exactly the class it exists to catch:
    // the detail is on the other handle, and taking the wrong one yields an
    // empty string that reads as "no reason given".
    const reasons = (clone.stderr ?? '')
      .split('\n')
      .map((l) => l.replace(/^ensure-full-clone: /, '').trim())
      .filter((l) => l !== '' && !l.startsWith('Run:'))
    return {
      v: GROUND.cloneIncomplete(reasons.join('; ') || 'repair needed'),
      findings: [],
      seen: {},
    }
  }
  if (clone.status !== 0) {
    return { v: GROUND.cloneIncomplete((clone.stderr ?? 'ensure-full-clone could not run').trim().split('\n')[0]), findings: [], seen: {} }
  }

  // Preconditions 2, 3 and 4. All three are properties of this clone's own
  // configuration, so they are answered before git is asked to merge anything.
  const d = auditDrivers(git, repo)
  if (d.unregistered.length > 0) {
    return { v: GROUND.driversUnregistered(d.unregistered), findings: [], seen: {} }
  }
  if (d.empty.length > 0) return { v: GROUND.driverEmpty(d.empty), findings: [], seen: {} }
  if (d.foreign.length > 0) return { v: GROUND.driverPathForeign(d.foreign, repo), findings: [], seen: {} }

  const baseOid = git(['rev-parse', '--verify', `${base}^{commit}`])
  const headOid = git(['rev-parse', '--verify', `${head}^{commit}`])
  if (baseOid.status !== 0 || headOid.status !== 0) {
    const bad = baseOid.status !== 0 ? base : head
    return { v: GROUND.mergeRefused(`${bad} does not resolve to a commit`), findings: [], seen: {} }
  }

  // The merge itself. Two pipes, never one; see this file's header.
  const r = spawnSync(
    'git',
    ['-C', repo, 'merge-tree', '--write-tree', '--name-only', baseOid.out, headOid.out],
    { encoding: 'utf8' },
  )
  const status = r.status ?? 128
  const stdout = r.stdout ?? ''
  const diagnostics = (r.stderr ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '')

  // Three-valued, never two. 128 is git refusing, not git conflicting.
  if (status !== 0 && status !== 1) {
    return {
      v: GROUND.mergeRefused(diagnostics[0] ?? `git merge-tree exited ${status}`),
      findings: [],
      seen: {},
    }
  }

  const parsed = parseSurface(stdout, (oid) => git(['cat-file', '-e', `${oid}^{tree}`]).status === 0)
  if ('fault' in parsed) {
    return { v: GROUND.treeIdUnreadable(parsed.fault), findings: [], seen: {} }
  }

  // What the drivers themselves said they did, read off the stderr this
  // function already holds on its own pipe. The path list above says WHICH
  // paths conflict; this says which of them a driver REFUSED and why, which is
  // the half that was on the other handle. See `driver-report.mjs`.
  const reported = classify(diagnostics)
  const agreement = reconcile(reported.results, parsed.paths)

  const findings = parsed.paths.map((path) => {
    const refusal = agreement.reasonByPath[path]
    return refusal
      ? { path, locus: LOCUS.SEAT, driver: refusal.driver, reason: refusal.reason }
      : { path, locus: LOCUS.SEAT }
  })
  const seen = {
    base,
    head,
    baseOid: baseOid.out,
    headOid: headOid.out,
    tree: parsed.tree,
    drivers: d.keys,
    diagnostics,
    attributed: reported.results.length,
    collapseCost: collapseCost(diagnostics),
  }

  // A driver saying it refused a path git did not list means the surface is an
  // under-report while looking complete, so there is no verdict to publish
  // about the branch. Checked BEFORE the exit-code/path-count agreement below,
  // because this one names the specific path that is missing and that one can
  // only say the two numbers disagree.
  if (agreement.refusalsUnlisted.length > 0) {
    return { v: GROUND.driverRefusalUnlisted(agreement.refusalsUnlisted), findings: [], seen }
  }
  if (disagrees(status, findings.length)) {
    return {
      v: GROUND.mergeRefused(
        `git merge-tree exited ${status} and named ${findings.length} conflicted path(s), which cannot both be true`,
      ),
      findings: [],
      seen,
    }
  }
  return { v: verdict(findings, seen), findings, seen }
}

function invokedDirectly() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
}

if (invokedDirectly()) {
  const repo = resolve(flag('repo') ?? REPO_ROOT)
  const base = flag('base') ?? 'origin/main'
  const jsonOut = process.argv.includes('--json')
  const prs = (flag('prs') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '')
  const heads = prs.length > 0 ? prs.map((n) => `refs/prs/${n}`) : [flag('head')].filter(Boolean)

  if (heads.length === 0) {
    process.stderr.write('merge-surface: --head <rev> or --prs <n,n,n> is required\n')
    process.exit(2)
  }

  const rows = heads.map((head) => ({ head, ...measure({ repo, base, head }) }))
  if (jsonOut) {
    process.stdout.write(
      `${JSON.stringify(
        {
          base,
          rows: rows.map(({ head, v, findings, seen }) => ({
            head,
            exit: v.exitCode,
            cause: v.cause,
            derived_from: v.derivedFrom,
            paths: findings.map((f) => f.path),
            line: v.line,
            seen,
          })),
        },
        null,
        2,
      )}\n`,
    )
  } else {
    for (const { v, findings } of rows) {
      const lines = renderVerdict(v, findings.map(pathLine))
      const sink = v.stream === 'err' ? process.stderr : process.stdout
      sink.write(`${lines.join('\n')}\n`)
    }
  }
  // The worst row wins, so a sweep over twenty branches exits non-zero when
  // any one of them could not be measured.
  process.exit(Math.max(...rows.map((r) => r.v.exitCode)))
}
