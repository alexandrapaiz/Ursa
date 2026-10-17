// Build the one-file CLI the GitHub Action runs.
//
// Why a committed bundle at all: the Action must work on a runner with
// nothing installed. `npm install` on a runner needs the registry to be
// reachable, needs a lockfile that matches, and adds seconds to every
// merge; `npx tsx` needs a download. A single CommonJS file that the
// runner's own node executes needs none of that, which is what "the
// resolver must never block on what a runner lacks" means in practice.
//
// Why CommonJS and not ESM: the output is one file with no package.json
// beside it, and a bare `.js` next to this repository's `"type":
// "module"` would be read as ESM while a `.cjs` is unambiguous wherever
// it is copied to.
//
// What is deliberately NOT in the bundle: src/bridge/, the overlay's
// local half. It tails a Claude Code session log on the owner's own Mac
// and re-invokes the CLI through `npx tsx` and `import.meta.dirname`,
// neither of which means anything inside a CommonJS bundle on a runner
// that has no session log to tail. The stub below replaces it with an
// error that says exactly that, instead of shipping code that would
// resolve a wrong path at runtime.
//
// Why the bytes are canonicalized before they are hashed: esbuild
// annotates every module it inlines with the path it read that module
// from, written relative to the build's working directory, and it does
// so in two places — a `// <path>` comment above the module and a
// property key in the `__esm` / `__commonJS` registry object. Where
// `node_modules` resolves from is therefore part of the artifact's
// bytes, and the bytes are the resolver's identity:
// `resolverIdentity()` hashes this file and `task.resolvedBy.digest`
// is the first 16 characters of that hash. Measured on 2026-10-17, one
// commit built from four layouts produced three different digests. See
// `docs/provenance/bundle-reproducibility.md` for the numbers and for
// the candidate fix that measurement refuted.
//
//   node build/bundle.mjs            # write dist/ursa.cjs
//   node build/bundle.mjs --check    # rebuild into memory and compare

import { build } from 'esbuild'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'

const OUT = 'dist/ursa.cjs'
const check = process.argv.includes('--check')

// Rewrite each inlined dependency's annotated path to the
// `node_modules/...` suffix it ends with, so that a bundle built from a
// package whose `node_modules` is hoisted to a parent directory or
// symlinked out of the tree is byte-identical to one built from a
// package that owns its own `node_modules`.
//
// The rewrites are derived from the build's own metafile rather than
// from a regular expression over the output, so the only strings
// touched are paths esbuild reports having read. In the canonical
// layout every input is already relative to the package, every
// candidate is skipped, and this function returns its argument
// unchanged — which is why installing it churns no committed digest.
//
// Two inputs that canonicalize to one string would collide as registry
// keys and one module's initializer would silently overwrite the
// other's, so that case throws instead of shipping.
function canonicalizeInlinedPaths (text, metafile) {
  const rewrites = new Map()
  for (const input of Object.keys(metafile.inputs)) {
    const at = input.indexOf('node_modules/')
    if (at <= 0) continue                      // -1: not a dependency. 0: already canonical.
    if (input[at - 1] !== '/') continue        // e.g. a directory named `mynode_modules`
    const canonical = input.slice(at)
    const prior = rewrites.get(canonical)
    if (prior !== undefined && prior !== input) {
      throw new Error(
        `two inlined modules canonicalize to the same path, which would collide as ` +
        `registry keys in ${OUT}:\n  ${prior}\n  ${input}\n  both -> ${canonical}`
      )
    }
    rewrites.set(canonical, input)
  }
  // Longest source path first, so one path that is a prefix of another
  // cannot leave the longer one half-rewritten.
  const ordered = [...rewrites].sort((a, b) => b[1].length - a[1].length)
  let out = text
  for (const [canonical, input] of ordered) out = out.split(input).join(canonical)
  return out
}

const result = await build({
  entryPoints: ['src/bin/bundle-entry.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  // Node builtins stay external by platform:node. Everything else —
  // today that is the `diff` package the resolver uses for mutated
  // spans — is inlined, so the file has no node_modules to find.
  external: [],
  plugins: [{
    name: 'stub-bridge',
    setup(b) {
      b.onResolve({ filter: /bridge\/index$/ }, () => ({ path: 'ursa:bridge-stub', namespace: 'ursa-stub' }))
      b.onLoad({ filter: /.*/, namespace: 'ursa-stub' }, () => ({
        loader: 'ts',
        contents: `export function startBridge(): never {
  throw new Error(
    'ursa bridge is not in the single-file bundle. The bridge tails a local ' +
    'session log on your own machine; run it from the source tree with ' +
    '"npx tsx src/bin/ursa.ts bridge <project>". The bundle exists for the ' +
    'GitHub runner, which has no session log to tail.'
  )
}`,
      }))
    },
  }],
  legalComments: 'inline',
  banner: { js: '#!/usr/bin/env node' },
  write: false,
  // Asked for so the canonicalization below can name the paths esbuild
  // actually read instead of guessing at them from the output.
  metafile: true,
  logLevel: 'warning',
})

const text = canonicalizeInlinedPaths(result.outputFiles[0].text, result.metafile)
const digest = createHash('sha256').update(text).digest('hex')

if (check) {
  const current = readFileSync(OUT, 'utf8')
  const currentDigest = createHash('sha256').update(current).digest('hex')
  if (current !== text) {
    console.error(`${OUT} is stale.\n  committed: sha256 ${currentDigest}\n  rebuilt:   sha256 ${digest}\nRun: npm run bundle`)
    process.exit(1)
  }
  console.log(`${OUT} is current (sha256 ${digest}, ${text.length.toLocaleString('en-US')} bytes)`)
} else {
  mkdirSync('dist', { recursive: true })
  writeFileSync(OUT, text)
  console.log(`wrote ${OUT} (sha256 ${digest}, ${text.length.toLocaleString('en-US')} bytes)`)
}
