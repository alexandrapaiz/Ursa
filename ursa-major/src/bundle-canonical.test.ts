// `dist/ursa.cjs` must be a function of its source and not of the
// machine that built it.
//
// WHY THIS FILE EXISTS. `resolverIdentity()` hashes the committed
// bundle and `task.resolvedBy.digest` is the first sixteen characters
// of that hash, so those sixteen characters are the identity every
// customer record carries for the program that resolved it. Since
// 2026-10-17 `tools/bundle-digest-index.ts` also keys every row of
// `docs/provenance/bundle-digests.json` on them, which is the surface
// that turns a digest back into a commit. Both of those read as a
// promise that the digest stands in for a commit.
//
// It did not. Measured on 2026-10-17, one commit of this repository
// built from four different directory layouts produced three different
// digests:
//
//     node_modules/ real dir, in package        d32543070474cc28…
//     node_modules/ symlink out of tree         c23a2cc0037c233d…
//     node_modules/ hoisted to parent dir       743ca60a55a5444c…
//     real dir, checkout 5 levels deeper        d32543070474cc28…
//
// The source was byte-identical across all four. The whole difference
// was the path esbuild annotates each inlined module with, written
// relative to the build's working directory, which it emits both as a
// `// <path>` comment and as a property key in the `__esm` registry
// object. So "where does node_modules resolve from" was part of the
// artifact's bytes, and the third row above is not an exotic accident:
// a parent-directory `node_modules` is what npm workspaces produce.
//
// `build/canonicalize.mjs` rewrites those annotations to the
// `node_modules/...` suffix the build's own metafile names for them.
// The two halves of this file assert the two things that has to mean.
//
// WHY THE UNIT HALF IS NOT ENOUGH, which is the obvious objection since
// the rewrite is twenty lines of string handling. The property it has
// to hold is about esbuild's output, not about the rewrite in
// isolation, and esbuild chooses those annotation strings. A version
// bump that changed their form would leave every unit assertion below
// green and the artifact layout-dependent again. So the second half
// runs the real `build/bundle.mjs` in a real symlinked layout and
// compares the digest it produces against the committed file.
//
// WHY IT IS A DIFFERENT CHECK FROM `npm run bundle:check`.
// `bundle:check` builds in whatever layout the runner happens to have
// and asks whether the bytes match. In this repository's own CI that
// layout is always the canonical one, so `bundle:check` can never
// observe this. This test manufactures the other layout on purpose.
//
// Ledger: "Two builds of identical source produce two different
// resolver digests" (docs/ideas.md, 2026-10-17). The measurement, and
// the `absWorkingDir` fix it refuted, are in
// `docs/provenance/bundle-reproducibility.md`.

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { canonicalizeInlinedPaths } from '../build/canonicalize.mjs'

const PKG = resolve(import.meta.dirname, '..')

/** The metafile shape `canonicalizeInlinedPaths` actually reads. */
const inputs = (...paths: string[]) => ({
  inputs: Object.fromEntries(paths.map((p) => [p, { bytes: 0 }])),
})

describe('canonicalizeInlinedPaths', () => {
  it('is the identity on a canonical layout, which is why no committed digest churns', () => {
    const text = '// node_modules/diff/libesm/index.js\n  "node_modules/diff/libesm/index.js"() {}\n'
    expect(canonicalizeInlinedPaths(text, inputs('src/resolve.ts', 'node_modules/diff/libesm/index.js')))
      .toBe(text)
  })

  it('rewrites a hoisted dependency path in both places esbuild writes it', () => {
    const dep = '../node_modules/diff/libesm/index.js'
    const text = `// ${dep}\nvar init_index = __esm({\n  "${dep}"() {\n  }\n});\n`
    expect(canonicalizeInlinedPaths(text, inputs('src/resolve.ts', dep))).toBe(
      '// node_modules/diff/libesm/index.js\n'
        + 'var init_index = __esm({\n  "node_modules/diff/libesm/index.js"() {\n  }\n});\n',
    )
  })

  it('rewrites an out-of-tree symlinked dependency path', () => {
    const dep = '../../../home/runner/work/Ursa/Ursa/ursa-major/node_modules/diff/libesm/diff/word.js'
    expect(canonicalizeInlinedPaths(`// ${dep}\n`, inputs(dep)))
      .toBe('// node_modules/diff/libesm/diff/word.js\n')
  })

  it('keeps a nested dependency nested, rather than collapsing to the inner segment', () => {
    // `node_modules/a/node_modules/b` is a real npm layout for a
    // conflicting transitive version, and its canonical form has to
    // keep both segments or two different packages named `b` would
    // become one string.
    const dep = '../node_modules/a/node_modules/b/index.js'
    expect(canonicalizeInlinedPaths(`// ${dep}\n`, inputs(dep)))
      .toBe('// node_modules/a/node_modules/b/index.js\n')
  })

  it('leaves a directory that merely ends in the word alone', () => {
    const dep = '../vendor/mynode_modules/thing.js'
    expect(canonicalizeInlinedPaths(`// ${dep}\n`, inputs(dep))).toBe(`// ${dep}\n`)
  })

  it('throws rather than shipping two modules under one registry key', () => {
    // Two distinct inputs that canonicalize to one string would become
    // two properties of the same name in the `__esm` object literal,
    // and the second initializer would silently win. A bundle with one
    // of its modules replaced by another must not be hashable at all.
    expect(() => canonicalizeInlinedPaths('', inputs(
      '../node_modules/diff/libesm/index.js',
      '../../node_modules/diff/libesm/index.js',
    ))).toThrow(/collide as registry keys/)
  })

  it('does not half-rewrite a path that is a prefix of another', () => {
    const short = '../node_modules/diff/libesm/index.js'
    const long = '../node_modules/diff/libesm/index.js.map.js'
    const out = canonicalizeInlinedPaths(`// ${long}\n// ${short}\n`, inputs(short, long))
    expect(out).toBe('// node_modules/diff/libesm/index.js.map.js\n// node_modules/diff/libesm/index.js\n')
  })
})

describe('the committed bundle, rebuilt from a layout that is not this one', () => {
  // Builds the real `build/bundle.mjs` in a copy of the package whose
  // `node_modules` is a symlink pointing out of the tree, which is the
  // layout that produced `c23a2cc0037c233d…` before the fix.
  it('produces the committed digest', () => {
    const work = mkdtempSync(join(tmpdir(), 'ursa-bundle-layout-'))
    try {
      const pkg = join(work, 'ursa-major')
      cpSync(PKG, pkg, {
        recursive: true,
        filter: (src) => !src.startsWith(join(PKG, 'node_modules')),
      })
      symlinkSync(join(PKG, 'node_modules'), join(pkg, 'node_modules'))

      execFileSync(process.execPath, ['build/bundle.mjs'], { cwd: pkg, stdio: 'pipe' })

      const rebuilt = createHash('sha256').update(readFileSync(join(pkg, 'dist/ursa.cjs'))).digest('hex')
      const committed = createHash('sha256').update(readFileSync(join(PKG, 'dist/ursa.cjs'))).digest('hex')
      expect(rebuilt).toBe(committed)
    } finally {
      rmSync(work, { recursive: true, force: true })
    }
  }, 120_000)
})
