// The MCP surface over the local store: Ursa Major's tuning, served to
// any MCP client instead of pasted into it.
//
// Two reads, no writes:
//
//   resource  ursa://tuning/current   the portable context block
//                                     `tuning export` already renders
//   tool      get_briefing            plan §15's HQ read — the rules
//                                     that apply, the nearest prior
//                                     cases, the learned guardrails
//
// Why this file exists at all. `get_briefing` has been implemented and
// tested since 2026-09-26 (src/hq/briefing.ts) and reachable only
// through `npm run brief`, a command a human types. The accepted ledger
// entry it serves ("Agentic-forward: Ursa as the agents' HQ",
// docs/ideas.md 2026-09-19) asks for it on "the M2 MCP server surface",
// and that surface did not exist. The tuning half has the same shape:
// `renderTuningBlock` produces a block the user is asked to copy into
// each new model's instructions, and a step the user must remember on
// every new model is the exact friction CLAUDE.md §3 says the product
// exists to remove.
//
// Trust properties, unchanged by this file and each one load-bearing:
//
//   on-device     every byte served is read from a path the caller
//                 passed in. No network call, no aggregation layer.
//   inspectable   the server reads the same two files the user can open
//                 in an editor, so what the model sees is what they see.
//   revocable     both reads filter `status === 'revoked'`, so a
//                 revocation tombstone is honoured here the same way it
//                 is honoured in `tuning export`. Enforced by test.
//   read-only     the server registers no tool that writes, and the
//                 handlers below call nothing that touches disk. The
//                 semantic ranker, which is the one part of the brief
//                 path that writes (an embedding cache), is deliberately
//                 not wired in; see `briefingFor` below.
//
// Everything here takes its store through `UrsaStore` rather than
// reading the filesystem itself, so the test drives a real MCP client
// over a real transport against an in-memory store, with no temp
// directory and no child process.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { OutcomeRecord } from '../types'
import type { TuningRecord } from '../tuning/types'
import { emptyTuning } from '../tuning/merge'
import { renderTuningBlock } from '../tuning/export'
import { buildBriefing, DEFAULT_MAX_CASES, DEFAULT_MAX_RULES, measureBriefing } from '../hq/briefing'
import type { Briefing, BriefingInput } from '../hq/types'

/** The server's whole view of the user's data. Two reads, called per
 *  request rather than cached, so a user who edits `tuning.json` while a
 *  client is connected gets the edited version on the next call instead
 *  of a snapshot taken at connect time. Editing is a first-class
 *  operation in this product, so stale is the wrong default. */
export interface UrsaStore {
  tuning(): TuningRecord
  records(): OutcomeRecord[]
}

/** The `ursa://tuning/current` URI, named once. MCP clients key their own
 *  caches on this string, so it is API and changing it is a break. */
export const TUNING_URI = 'ursa://tuning/current'

export const SERVER_NAME = 'ursa-major'

/**
 * A store backed by the project layout `src/store.ts` defines:
 * `<project>/.ursa/tuning.json` and `<project>/.ursa/records/*.json`.
 *
 * Missing is not an error. A project that has never been through
 * `ursa run` has no records and no tuning, and the honest answer to a
 * briefing request against it is an empty briefing that says the HQ
 * knows nothing yet — which `renderBriefing` already prints in those
 * words. Failing instead would make a fresh install look broken.
 */
export function fileStore(paths: { tuningPath: string; recordsDir: string }): UrsaStore {
  return {
    tuning: () =>
      existsSync(paths.tuningPath)
        ? (JSON.parse(readFileSync(paths.tuningPath, 'utf8')) as TuningRecord)
        : emptyTuning('local'),
    records: () =>
      existsSync(paths.recordsDir)
        ? readdirSync(paths.recordsDir)
            .filter((f) => f.endsWith('.json'))
            .sort()
            .map((f) => JSON.parse(readFileSync(join(paths.recordsDir, f), 'utf8')) as OutcomeRecord)
        : [],
  }
}

/** The default paths under a project root, so a caller that has only the
 *  project path does not have to know the store layout. */
export function projectPaths(projectRoot: string): { tuningPath: string; recordsDir: string } {
  return {
    tuningPath: join(projectRoot, '.ursa', 'tuning.json'),
    recordsDir: join(projectRoot, '.ursa', 'records'),
  }
}

/** The shape of `get_briefing`'s arguments, as the wire sees them. Kept
 *  identical in name and meaning to `BriefingInput` (src/hq/types.ts) so
 *  the MCP tool is the same call the `brief` CLI already makes, not a
 *  second dialect of it. */
export const GET_BRIEFING_INPUT = {
  domain: z
    .string()
    .optional()
    .describe("free-form domain tag to filter on, e.g. 'motion' or 'copy'; omit for everything"),
  files: z
    .array(z.string())
    .optional()
    .describe("repo-relative paths you are about to work on, e.g. ['src/app/page.tsx']"),
  maxRules: z
    .number()
    .int()
    .positive()
    .optional()
    .describe(`ceiling on rules returned (default ${DEFAULT_MAX_RULES})`),
  maxCases: z
    .number()
    .int()
    .positive()
    .optional()
    .describe(`ceiling on prior cases returned (default ${DEFAULT_MAX_CASES})`),
}

/**
 * The briefing the tool returns.
 *
 * Lexical ranking only, on purpose, and this is the one deliberate gap
 * between this surface and `ursa brief --semantic`. The semantic ranker
 * loads a ~23MB MiniLM model on first use and persists an embedding
 * cache to `.ursa/embeddings.json`. Both are wrong here: an MCP client
 * calls a tool synchronously inside a user's turn, so a two-second model
 * load is a two-second stall the user did not ask for, and a read-only
 * server that writes a cache file is no longer read-only. The ranking
 * difference only matters when the request names no file this owner has
 * been corrected on, which is the case where the briefing is thin
 * anyway. `coverage.retrieval` says `lexical-v0`, so a client can see
 * which ranker ran rather than having to assume.
 */
export function briefingFor(store: UrsaStore, input: BriefingInput, now?: string): Briefing {
  return buildBriefing(store.tuning(), store.records(), input, now)
}

export interface ServerDeps {
  store: UrsaStore
  /** injected clock, so a test can assert a byte-for-byte briefing */
  now?: () => string
  /** reported to the client in `initialize`; defaults to the package's */
  version?: string
}

/**
 * Build the server. Does not connect it: the caller chooses the
 * transport, which is how one definition serves both the stdio process
 * (src/mcp/cli.ts) and the in-memory pair the test uses.
 */
export function createUrsaServer(deps: ServerDeps): McpServer {
  const { store } = deps
  const now = deps.now ?? (() => new Date().toISOString())

  const server = new McpServer(
    { name: SERVER_NAME, version: deps.version ?? '0.1.0' },
    {
      instructions:
        'Ursa Major serves this user\'s own tuning, read from files on this machine. ' +
        'Read the resource ' +
        TUNING_URI +
        ' at the start of a conversation to learn how they want to be answered. ' +
        'Call get_briefing before working on named files to see the rules, prior cases ' +
        'and guardrails they have already demonstrated on real work. Both are evidence, ' +
        'not orders: you remain the judge of whether any of it applies.',
    }
  )

  server.registerResource(
    'tuning',
    TUNING_URI,
    {
      title: 'Your tuning',
      description:
        'How this user wants to be answered, distilled from their own finished work. ' +
        'The same markdown block `ursa tuning export` renders for pasting, served so ' +
        'that no paste is needed. Revoked axioms are absent.',
      mimeType: 'text/markdown',
    },
    () => ({
      contents: [
        {
          uri: TUNING_URI,
          mimeType: 'text/markdown',
          text: renderTuningBlock(store.tuning()),
        },
      ],
    })
  )

  server.registerTool(
    'get_briefing',
    {
      title: 'Brief me on this work',
      description:
        'Evidence this user already demonstrated on real work, selected for what you are ' +
        'about to do: the rules that apply, the nearest prior cases with their correction ' +
        'loops, and the guardrails they had to state after an agent overreached. Every unit ' +
        'carries where it came from. Call it before you write, with the files you are about ' +
        'to touch. An empty request is legal and returns the whole active HQ.',
      inputSchema: GET_BRIEFING_INPUT,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    (args) => {
      // measureBriefing rather than renderBriefing: it returns the
      // markdown together with the briefing whose
      // `coverage.renderedChars` is that markdown's own length. Both
      // halves of this response therefore carry the same number, which
      // is the one a caller needs to calibrate `maxRules` against the
      // context it has left.
      const { briefing, markdown } = measureBriefing(briefingFor(store, args as BriefingInput, now()))
      return {
        // The markdown is the surface and the JSON is the interface, the
        // same split renderBriefing's own comment names. A client that
        // only shows text content to its model still gets the full
        // briefing; one that reads structuredContent gets it typed.
        content: [{ type: 'text' as const, text: markdown }],
        structuredContent: briefing as unknown as Record<string, unknown>,
      }
    }
  )

  return server
}
