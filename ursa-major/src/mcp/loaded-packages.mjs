// Which node_modules packages a module graph actually loads.
//
// Written for one question with a specific answer. `@modelcontextprotocol/sdk`
// 1.32.1 declares seventeen production dependencies, and installing it took
// ursa-major's production tree from 70 packages to 161. Most of that is the
// remote transports: `express`, `hono`, `cors`, `jose`, `express-rate-limit`
// and the body parsers behind the Streamable HTTP and SSE servers. The only
// transport this repository ships is stdio (src/mcp/cli.ts), so the question
// is whether those packages are code Ursa runs or code Ursa carries.
//
// Why this is a file and not a paragraph in a design doc. The answer changes
// without anyone touching Ursa: a minor SDK release that moves one import to
// the top of `server/mcp.js` would pull a web framework onto the stdio path,
// and the only thing that would notice is a measurement that still runs.
// src/mcp/deps.test.ts runs it.
//
// How it measures. There is no public registry of loaded ESM modules the way
// `require.cache` lists loaded CommonJS ones, and the SDK is dual-published,
// so a `require`-based probe would measure `dist/cjs` while this project
// (`"type": "module"`) loads `dist/esm`. Instead it attaches an inspector
// session and records `Debugger.scriptParsed`, which fires once per script
// V8 compiles, for the build that actually ships. A package whose name never
// appears in a parsed script's path was never executed.
//
// Why .mjs and not .ts. It has to run as its own process with nothing
// transforming it, both because the question is about a pristine module
// registry and because `node src/mcp/loaded-packages.mjs` with no toolchain
// is the form a reader can re-run against a future SDK in one command.
//
// Usage, from the ursa-major directory:
//
//   node src/mcp/loaded-packages.mjs
//   node src/mcp/loaded-packages.mjs @modelcontextprotocol/sdk/server/streamableHttp.js
//
// Output on stdout is one JSON object: `{ entries, packages, scripts }`.
//
// `packages` is the sorted list of node_modules package names whose files
// were compiled, and it is the stable part: three consecutive runs on one
// machine give the same set, and so do two different entry points asked
// the same question. That is the field anything should assert on.
//
// `scripts` is how many scripts V8 compiled in all, Node's own internals
// included, and it is indicative rather than reproducible: observed
// between 362 and 370 for the same stdio entry points on one machine in
// one afternoon, because which internals get compiled lazily is not
// something this probe controls. It is reported because a count that
// collapses to near zero is the signature of a broken measurement, which
// is worth being able to see. It is not reported as a figure to pin.

import { Session } from 'node:inspector'

/** The stdio surface's own entry points: the server class src/mcp/server.ts
 *  constructs, and the transport src/mcp/cli.ts connects it to. Between them
 *  they are everything the shipped MCP path imports from the SDK. */
const STDIO_ENTRIES = [
  '@modelcontextprotocol/sdk/server/mcp.js',
  '@modelcontextprotocol/sdk/server/stdio.js',
]

/** `/path/to/node_modules/@scope/name/dist/x.js` -> `@scope/name`.
 *  Last match wins, so a nested dependency is attributed to the nested
 *  package rather than to the one that hoisted it. */
function packageOf(url) {
  let found = null
  const pattern = /node_modules\/((?:@[^/]+\/)?[^/@][^/]*)\//g
  for (const match of url.matchAll(pattern)) found = match[1]
  return found
}

export async function loadedPackages(entries = STDIO_ENTRIES) {
  const session = new Session()
  session.connect()
  const urls = []
  session.on('Debugger.scriptParsed', (message) => urls.push(message.params.url))
  session.post('Debugger.enable')
  try {
    for (const entry of entries) await import(entry)
  } finally {
    session.post('Debugger.disable')
    session.disconnect()
  }
  const packages = new Set()
  for (const url of urls) {
    const name = packageOf(url)
    if (name) packages.add(name)
  }
  return { entries, packages: [...packages].sort(), scripts: urls.length }
}

// Run as a script: the argv form documented above. Guarded on argv[1] so
// importing this module from a test does not start a second measurement.
if (process.argv[1]?.endsWith('loaded-packages.mjs')) {
  const entries = process.argv.length > 2 ? process.argv.slice(2) : STDIO_ENTRIES
  console.log(JSON.stringify(await loadedPackages(entries), null, 2))
}
