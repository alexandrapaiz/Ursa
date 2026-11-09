#!/usr/bin/env node
// Does every committed capture that renders an outcome record say which store
// it was pointed at?
//
//   node tools/capture-provenance.mjs            # exit 1 on an undeclared record surface
//   node tools/capture-provenance.mjs --json     # same exit code, JSON out
//   node tools/capture-provenance.mjs --census   # every capture directory, with its classification
//
// Exit 0 no capture directory renders a record surface without naming its
// store. Exit 1 at least one does. Exit 2 the facts could not be established,
// so nothing is reported clean.
//
// WHY THIS READS TEXT AND NEVER A PIXEL. The reasoning for the whole gate,
// including why it is not a second PWC-13 and why its rule is a conjunction
// rather than a blanket requirement, is in
// `tools/capture-provenance-verdict.mjs`. In one sentence: what makes a
// screenshot safe is the store behind the page, not the bytes of the image, so
// the checkable question is about the directory's committed text and not about
// its PNGs. This file is the driver. It finds the capture directories, reads
// their committed text, and prints what the verdict function returns.
//
// WHY IT NEVER QUOTES WHAT IT READ. The charter forbids printing a value the
// scan found, and the text this gate reads is exactly the text a leak would be
// in. So the output carries a directory, a count, and the NAME of a surface
// from a fixed table. It never echoes a matched line, a URL, or a declaration,
// not even truncated. A gate is a disclosure surface and this one is built not
// to be: a run of it is safe to paste into a public pull request, which is
// where it will be pasted.
//
// WHY THE ENUMERATOR IS `git ls-files` AND NOT A DIRECTORY WALK. The question
// is about what this repository publishes, and an untracked file publishes
// nothing. A walk would also read the frontend seat's uncommitted working
// captures, report them, and make the gate's answer depend on whose sandbox it
// ran in. L-A55's shape: a command whose scope is the clone it was handed
// answers a different question each time.

import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderVerdict } from './gates/verdict-shape.mjs'
import {
  DECLARATIONS,
  RECORD_SURFACES,
  undeclaredLine,
  unusable,
  verdict,
} from './capture-provenance-verdict.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Where the design review practice commits its captures. */
export const REVIEWS = 'docs/design/reviews'

/** The extensions this gate counts as a capture. */
const IMAGE = /\.(png|ico|jpe?g|gif|webp|avif|bmp|tiff?)$/i

// The extensions whose contents are read for surfaces and declarations. A
// capture recipe lives in prose (`.md`) or in the script that ran it (`.mjs`,
// `.sh`), and a `.txt` is where the probes write their measurements. SVG is
// excluded on purpose: it is a capture here, not a recipe.
const TEXT = /\.(md|txt|mjs|cjs|js|ts|sh|json|ya?ml|html)$/i

/**
 * Tracked files under a prefix, as repository-relative paths.
 *
 * @param {string} prefix
 * @returns {string[]}
 */
export function trackedUnder(prefix) {
  const out = spawnSync('git', ['ls-files', '-z', '--', prefix], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  })
  if (out.error) throw new Error(`git ls-files could not run: ${out.error.message}`)
  if (out.status !== 0) throw new Error(`git ls-files exited ${out.status}: ${out.stderr.trim()}`)
  return out.stdout.split('\0').filter(Boolean)
}

/**
 * The review directory a tracked path belongs to, or null.
 *
 * A review is one level under `docs/design/reviews/`, and everything deeper is
 * that review's own structure (`after/`, `data/hover-all/rest/`). Grouping at
 * the review level is deliberate: a declaration is written once per run, and a
 * gate that demanded one per subdirectory would ask the frontend seat for
 * forty sentences about one capture session.
 *
 * @param {string} file
 * @returns {string | null}
 */
export function reviewOf(file) {
  const rest = file.startsWith(`${REVIEWS}/`) ? file.slice(REVIEWS.length + 1) : null
  if (rest === null) return null
  const slash = rest.indexOf('/')
  if (slash <= 0) return null
  return `${REVIEWS}/${rest.slice(0, slash)}`
}

/**
 * Group tracked review files into one record per review directory.
 *
 * @param {string[]} files
 * @returns {Map<string, {images: string[], texts: string[]}>}
 */
export function groupReviews(files) {
  const byDir = new Map()
  for (const f of files) {
    const dir = reviewOf(f)
    if (dir === null) continue
    if (!byDir.has(dir)) byDir.set(dir, { images: [], texts: [] })
    if (IMAGE.test(f)) byDir.get(dir).images.push(f)
    else if (TEXT.test(f)) byDir.get(dir).texts.push(f)
  }
  // A directory with no captures has nothing to establish provenance for.
  for (const [dir, r] of byDir) if (r.images.length === 0) byDir.delete(dir)
  return byDir
}

/**
 * Classify one review directory from its own committed text.
 *
 * @param {string} dir
 * @param {{images: string[], texts: string[]}} r
 * @param {(p: string) => string} read
 * @returns {{dir: string, images: number, surfaces: string[], declared: boolean}}
 */
export function classify(dir, r, read) {
  const surfaces = new Set()
  let declared = false
  // The paths are evidence too: a capture named `record-mini-fixture/phone`
  // states its surface and its store in the filename the harness chose.
  const corpus = [...r.images, ...r.texts]
  for (const p of corpus) {
    const body = TEXT.test(p) ? `${p}\n${read(p)}` : p
    for (const s of RECORD_SURFACES) if (s.pattern.test(body)) surfaces.add(s.name)
    if (!declared) declared = DECLARATIONS.some((d) => d.test(body))
  }
  return { dir, images: r.images.length, surfaces: [...surfaces].sort(), declared }
}

function readTracked(p) {
  const out = spawnSync('git', ['show', `HEAD:${p}`], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  // A file tracked in the index but absent from HEAD is a staged addition.
  // Read it from disk rather than refusing: the gate's answer should be about
  // what is about to be committed, which is what a seat running it wants.
  if (out.status !== 0) {
    const disk = spawnSync('cat', [path.join(ROOT, p)], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    return disk.status === 0 ? disk.stdout : ''
  }
  return out.stdout
}

export function sweep(read = readTracked) {
  const reviews = groupReviews(trackedUnder(REVIEWS))
  const rows = [...reviews.entries()].map(([dir, r]) => classify(dir, r, read)).sort((a, b) => a.dir.localeCompare(b.dir))
  const withRecord = rows.filter((row) => row.surfaces.length > 0)
  const seen = {
    dirs: rows.length,
    images: rows.reduce((n, row) => n + row.images, 0),
    declared: rows.filter((row) => row.declared).length,
    recordDirs: withRecord.length,
  }
  const undeclared = withRecord
    .filter((row) => !row.declared)
    .map(({ dir, images, surfaces }) => ({ dir, images, surfaces }))
  return { rows, undeclared, seen }
}

function main(argv) {
  const json = argv.includes('--json')
  const census = argv.includes('--census')
  for (const a of argv) {
    if (!['--json', '--census'].includes(a)) {
      process.stderr.write(`capture-provenance: unknown argument: ${a}\n`)
      return 2
    }
  }

  let swept
  try {
    swept = sweep()
  } catch (e) {
    const v = unusable('TREE_UNREADABLE', 'the tracked file list could not be read', e.message)
    process.stderr.write(`${renderVerdict(v).join('\n')}\n`)
    return v.exitCode
  }

  const { rows, undeclared, seen } = swept
  const v = verdict(undeclared, seen)

  if (json) {
    process.stdout.write(`${JSON.stringify({ verdict: v, undeclared, seen, rows: census ? rows : undefined }, null, 2)}\n`)
    return v.exitCode
  }

  const out = v.stream === 'err' ? process.stderr : process.stdout
  if (census) {
    for (const row of rows) {
      const where = row.surfaces.length > 0 ? row.surfaces.join(', ') : 'no record surface'
      out.write(`  ${row.declared ? 'declared  ' : 'undeclared'}  ${String(row.images).padStart(4)}  ${row.dir.padEnd(44)} ${where}\n`)
    }
  }
  out.write(`${renderVerdict(v, undeclared.map(undeclaredLine)).join('\n')}\n`)
  return v.exitCode
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)))
}
