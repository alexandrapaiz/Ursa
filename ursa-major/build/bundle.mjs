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
//   node build/bundle.mjs            # write dist/ursa.cjs
//   node build/bundle.mjs --check    # rebuild into memory and compare

import { build } from 'esbuild'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'

const OUT = 'dist/ursa.cjs'
const check = process.argv.includes('--check')

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
  logLevel: 'warning',
})

const text = result.outputFiles[0].text
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
