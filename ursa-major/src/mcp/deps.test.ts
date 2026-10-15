// What the MCP SDK costs ursa-major, measured rather than asserted.
//
// The fact under test. Installing `@modelcontextprotocol/sdk` 1.32.1 took
// this package's production dependency tree from 70 packages to 161. The
// SDK earns its place — it supplies the in-memory transport that lets
// mcp.test.ts drive a real client over a real protocol — but the shipped
// MCP surface is stdio only (src/mcp/cli.ts), and the largest part of
// what arrived exists for the remote transports: a web framework, a CORS
// handler, a rate limiter, a JOSE implementation and two body parsers,
// behind the Streamable HTTP, SSE and OAuth paths that nothing in this
// repository connects to.
//
// Why that is worth a test rather than a note. `scripts/dep-floor.mjs`
// fails every pull request in this repository on a high advisory anywhere
// in the production tree. Half that tree is now code no shipped path
// executes, so the next `express` advisory would block the queue over a
// package Ursa does not run. The ledger entry that asks for this
// ("One stdio server grew the production audit tree from 70 packages to
// 161", docs/ideas.md 2026-10-09) offers the owner two answers — move the
// SDK to optionalDependencies, or scope a dep-floor exception to the
// unreachable packages — and both of them depend on this measurement
// staying true. A minor SDK release that moves one import to the top of
// `server/mcp.js` would invalidate both, silently, which is what this
// file is here to prevent.
//
// Why a child process. The probe measures a pristine module registry, and
// by the time vitest runs this file its worker may already have imported
// the SDK for mcp.test.ts, in which case nothing re-parses and every
// package would read as absent — a test that passes for the wrong reason.
// `node src/mcp/loaded-packages.mjs` in its own process cannot have that
// problem, and it is also the exact command a reader re-runs by hand.

import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const PROBE = fileURLToPath(new URL('./loaded-packages.mjs', import.meta.url))
const PACKAGE_ROOT = fileURLToPath(new URL('../..', import.meta.url))

interface Probe {
  entries: string[]
  packages: string[]
  scripts: number
}

/** Run the probe in its own process. `cwd` is the package root so that
 *  bare specifiers resolve against ursa-major's own node_modules, which
 *  is the tree the dep-floor gate audits. */
function probe(...entries: string[]): Probe {
  const stdout = execFileSync(process.execPath, [PROBE, ...entries], {
    cwd: PACKAGE_ROOT,
    encoding: 'utf8',
    timeout: 60_000,
  })
  return JSON.parse(stdout) as Probe
}

/**
 * Production packages the SDK brought in that the stdio path does not
 * touch. Named one by one rather than counted, because a count would go
 * stale on any transitive bump while each of these is a direct
 * dependency of the SDK with a job this repository has no use for.
 */
const REMOTE_ONLY = [
  ['express', 'HTTP server for the OAuth authorization router'],
  ['express-rate-limit', 'rate limiting on those OAuth endpoints'],
  ['cors', 'cross-origin headers for a browser client'],
  ['jose', 'JWT verification for OAuth bearer tokens'],
  ['hono', 'HTTP server behind the Streamable HTTP transport'],
  ['@hono/node-server', "Node adapter for hono's fetch-style handlers"],
  ['body-parser', 'request body decoding for the express router'],
  ['raw-body', 'request body buffering for the same'],
  ['pkce-challenge', 'PKCE code challenges for the OAuth client flow'],
  ['eventsource', 'client-side SSE, the transport this server does not offer'],
] as const

describe('the MCP SDK on the stdio path', () => {
  it('loads the schema validators and nothing resembling a web server', () => {
    const { packages, scripts } = probe()

    // Positive control first. A probe that reported an empty set would
    // satisfy every absence assertion below while measuring nothing, so
    // the test establishes that it can see a loaded package before it
    // claims any package is unloaded.
    expect(packages).toContain('zod')
    expect(packages).toContain('ajv')
    expect(scripts).toBeGreaterThan(100)

    // The whole loaded set, pinned. Eight packages reach the stdio path:
    // the SDK itself, zod and zod-to-json-schema for the tool schemas,
    // and ajv with its three helpers for validating them.
    expect(packages).toEqual([
      '@modelcontextprotocol/sdk',
      'ajv',
      'ajv-formats',
      'fast-deep-equal',
      'fast-uri',
      'json-schema-traverse',
      'zod',
      'zod-to-json-schema',
    ])

    for (const [name, job] of REMOTE_ONLY) {
      // Installed, so `npm audit` sees it and the dep-floor gate gates
      // on it. This half of the claim is what makes the other half cost
      // something.
      expect(existsSync(join(PACKAGE_ROOT, 'node_modules', name, 'package.json')), `${name} is installed`).toBe(true)
      expect(packages, `${name} (${job}) is carried, not run`).not.toContain(name)
    }
  }, 60_000)

  it('loads express only on the OAuth router, so the absence above is about the transport', () => {
    // The arm this measurement is expected to fail. Without it, every
    // absence above is equally consistent with "the probe cannot see
    // express at all", and the test would survive a refactor that broke
    // the measurement. Here the same probe, pointed at the SDK path those
    // packages exist for, finds them.
    const { packages } = probe('@modelcontextprotocol/sdk/server/auth/router.js')
    expect(packages).toContain('express')
    expect(packages).toContain('cors')
    expect(packages).toContain('body-parser')
    expect(packages).toContain('express-rate-limit')
  }, 60_000)
})
