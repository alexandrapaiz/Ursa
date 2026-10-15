// The MCP surface, exercised through a real MCP client over a real
// transport. No mocks of the protocol: `InMemoryTransport.createLinkedPair`
// gives a client transport and a server transport wired to each other, so
// every assertion below went through `initialize`, capability negotiation
// and JSON-RPC framing exactly as a spawned stdio client's would. What is
// not exercised is the process boundary itself (argv parsing, stdout
// discipline), which `src/mcp/cli.ts` owns and which the walkthrough in
// docs/design/hq-mcp.md covers by hand.

import { describe, expect, it } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { RECORDS, TUNING } from '../hq/fixtures'
import type { Briefing } from '../hq/types'
import { createUrsaServer, fileStore, projectPaths, TUNING_URI, type UrsaStore } from './server'

const FROZEN = '2026-10-09T00:00:00.000Z'

/** Narrow one resource content block to its text. A ReadResourceResult
 *  block is text-or-blob in the protocol; this server only ever serves
 *  text, so a blob arriving here is a bug worth failing on by name
 *  rather than a case to handle. */
function textOf(block: { text?: string; blob?: string; uri: string }): string {
  if (typeof block.text !== 'string') throw new Error(`${block.uri} came back as a blob, not text`)
  return block.text
}

/** The same narrowing for a tool result's first content block. The
 *  client's `callTool` return type is a union with the pre-content
 *  `toolResult` compatibility shape, so `content` is optional on the
 *  type even though this server always sets it. */
function firstText(result: { [key: string]: unknown }): string {
  const blocks = result.content as Array<{ type: string; text: string }> | undefined
  if (!blocks) throw new Error('the tool result carried no content blocks')
  expect(blocks[0]?.type).toBe('text')
  return blocks[0].text
}

/** The fixture store, served straight out of memory. */
function memoryStore(overrides: Partial<UrsaStore> = {}): UrsaStore {
  return { tuning: () => TUNING, records: () => RECORDS, ...overrides }
}

/** A connected client/server pair. Returns the client plus a disposer,
 *  because an unclosed transport keeps a handle open and vitest reports
 *  it as a hanging process rather than as a leaked test. */
async function connect(server: McpServer): Promise<{ client: Client; close: () => Promise<void> }> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const client = new Client({ name: 'test-client', version: '0.0.0' })
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
  return {
    client,
    close: async () => {
      await client.close()
      await server.close()
    },
  }
}

async function withClient<T>(store: UrsaStore, fn: (client: Client) => Promise<T>): Promise<T> {
  const { client, close } = await connect(createUrsaServer({ store, now: () => FROZEN }))
  try {
    return await fn(client)
  } finally {
    await close()
  }
}

describe('the MCP surface advertises what it serves', () => {
  it('lists ursa://tuning/current as a markdown resource', async () => {
    const { resources } = await withClient(memoryStore(), (c) => c.listResources())
    expect(resources.map((r) => r.uri)).toContain(TUNING_URI)
    expect(resources.find((r) => r.uri === TUNING_URI)?.mimeType).toBe('text/markdown')
  })

  it('lists get_briefing as a read-only tool whose schema names the four inputs', async () => {
    const { tools } = await withClient(memoryStore(), (c) => c.listTools())
    const brief = tools.find((t) => t.name === 'get_briefing')
    expect(brief).toBeDefined()
    expect(brief!.annotations?.readOnlyHint).toBe(true)
    expect(Object.keys(brief!.inputSchema.properties ?? {}).sort()).toEqual([
      'domain',
      'files',
      'maxCases',
      'maxRules',
    ])
    // Nothing in the schema is required: an empty request is legal and
    // returns the whole active HQ, which is what a fresh agent wants.
    expect(brief!.inputSchema.required ?? []).toEqual([])
  })

  it('carries the evidence-not-orders discipline in the server instructions', async () => {
    const instructions = await withClient(memoryStore(), async (c) => c.getInstructions())
    expect(instructions).toContain('evidence')
    expect(instructions).toContain(TUNING_URI)
  })
})

describe('ursa://tuning/current serves the block the user would have pasted', () => {
  it('returns the rendered tuning block, byte for byte', async () => {
    const { renderTuningBlock } = await import('../tuning/export')
    const read = await withClient(memoryStore(), (c) => c.readResource({ uri: TUNING_URI }))
    expect(read.contents).toHaveLength(1)
    expect(read.contents[0].mimeType).toBe('text/markdown')
    expect(textOf(read.contents[0])).toBe(renderTuningBlock(TUNING))
    expect(textOf(read.contents[0])).toContain('keep entrance motion under 8px of travel')
  })

  it('re-reads the store on every request, so an edit lands without a reconnect', async () => {
    let served = TUNING
    const store: UrsaStore = { tuning: () => served, records: () => RECORDS }
    await withClient(store, async (c) => {
      const before = await c.readResource({ uri: TUNING_URI })
      expect(textOf(before.contents[0])).toContain('keep entrance motion under 8px of travel')

      // The user opens tuning.json and rewrites a rule by hand. Editing
      // is a first-class operation in this product (CLAUDE.md §3), so a
      // snapshot taken at connect time would be the wrong answer.
      served = {
        ...TUNING,
        axioms: TUNING.axioms.map((a) =>
          a.id === 'ax-001' ? { ...a, statement: 'no entrance motion at all' } : a
        ),
      }
      const after = await c.readResource({ uri: TUNING_URI })
      expect(textOf(after.contents[0])).toContain('no entrance motion at all')
      expect(textOf(after.contents[0])).not.toContain('keep entrance motion under 8px of travel')
    })
  })
})

describe('get_briefing over MCP is the same call `ursa brief` makes', () => {
  it('returns markdown for the model and the typed briefing beside it', async () => {
    const result = await withClient(memoryStore(), (c) =>
      c.callTool({ name: 'get_briefing', arguments: { domain: 'copy' } })
    )
    const text = firstText(result)
    expect(text).toContain('# Briefing')
    expect(text).toContain('Evidence, not orders')

    const briefing = result.structuredContent as unknown as Briefing
    expect(briefing.schemaVersion).toBe('0.1.0')
    expect(briefing.generatedAt).toBe(FROZEN)
    expect(briefing.request.domain).toBe('copy')
    expect(briefing.rules.length).toBeGreaterThan(0)
    expect(briefing.rules.every((r) => r.evidenceCount > 0)).toBe(true)
  })

  it('narrows on the files the caller is about to touch', async () => {
    const wide = await withClient(memoryStore(), (c) =>
      c.callTool({ name: 'get_briefing', arguments: {} })
    )
    const narrow = await withClient(memoryStore(), (c) =>
      c.callTool({ name: 'get_briefing', arguments: { files: ['src/app/page.tsx'] } })
    )
    const w = wide.structuredContent as unknown as Briefing
    const n = narrow.structuredContent as unknown as Briefing
    expect(w.coverage.unfiltered).toBe(true)
    expect(n.coverage.unfiltered).toBe(false)
    expect(n.rules.length).toBeLessThanOrEqual(w.rules.length)
  })

  it('honours the caller\'s ceilings, so a briefing fits the context it is for', async () => {
    const result = await withClient(memoryStore(), (c) =>
      c.callTool({ name: 'get_briefing', arguments: { maxRules: 1, maxCases: 1 } })
    )
    const briefing = result.structuredContent as unknown as Briefing
    expect(briefing.rules.length).toBeLessThanOrEqual(1)
    expect(briefing.nearestCases.length).toBeLessThanOrEqual(1)
  })

  // The cross-boundary form of the fixed point measureBriefing
  // establishes. The tool answers twice over, in markdown for the model
  // and in JSON for the client, and the size the JSON reports has to be
  // the size of the markdown that was actually sent. If these two ever
  // disagree, a client budgeting context against `renderedChars` is
  // budgeting against a number from a different string.
  it('reports a size in the JSON equal to the length of the markdown it sent', async () => {
    const result = await withClient(memoryStore(), (c) =>
      c.callTool({ name: 'get_briefing', arguments: { files: ['src/app/page.tsx'] } })
    )
    const briefing = result.structuredContent as unknown as Briefing
    const markdown = firstText(result)
    expect(briefing.coverage.renderedChars).toBe(markdown.length)
    expect(markdown).toContain(`Size: ${markdown.length} characters, counting this sentence.`)
  })

  it('reports lexical ranking rather than claiming a semantic one it did not run', async () => {
    const result = await withClient(memoryStore(), (c) =>
      c.callTool({ name: 'get_briefing', arguments: {} })
    )
    const briefing = result.structuredContent as unknown as Briefing
    expect(briefing.coverage.retrieval).toBe('lexical-v0')
    expect(briefing.coverage.retrievalModel).toBeUndefined()
  })

  // A caller that passes `files` as a bare string rather than an array is
  // the likeliest mistake a model makes against this schema. The SDK
  // answers it with an error RESULT rather than a JSON-RPC error, which is
  // the behaviour worth having: the model reads the message in its own
  // turn and can fix the call, where a transport-level rejection would
  // surface to the user as a broken tool. Asserted here so a later SDK
  // upgrade that changes it is visible rather than silent.
  it('names a malformed argument back to the caller instead of briefing on a guess', async () => {
    const result = await withClient(memoryStore(), (c) =>
      c.callTool({ name: 'get_briefing', arguments: { files: 'src/app/page.tsx' } })
    )
    expect(result.isError).toBe(true)
    expect(firstText(result)).toContain('files')
    expect(result.structuredContent).toBeUndefined()
  })
})

// The trust-critical assertion. Revocation is one of the four promises
// CLAUDE.md §3 makes to the user, and a new delivery surface is exactly
// where it would be dropped: the tombstone filter lives in
// renderTuningBlock and buildBriefing, not in this directory, so nothing
// here would fail loudly if a future refactor served raw axioms instead.
// This test is what fails.
describe('a revoked axiom reaches neither read', () => {
  it('is absent from the tuning resource', async () => {
    const revoked = TUNING.axioms.find((a) => a.status === 'revoked')
    expect(revoked, 'the fixture must carry a tombstone for this test to mean anything').toBeDefined()
    const read = await withClient(memoryStore(), (c) => c.readResource({ uri: TUNING_URI }))
    expect(textOf(read.contents[0])).not.toContain(revoked!.statement)
  })

  it('is absent from a briefing that would otherwise rank it first', async () => {
    const revoked = TUNING.axioms.find((a) => a.status === 'revoked')!
    // Ask with the revoked axiom's own domain and its own words, the
    // request most likely to surface it.
    const result = await withClient(memoryStore(), (c) =>
      c.callTool({ name: 'get_briefing', arguments: { domain: revoked.domain } })
    )
    const briefing = result.structuredContent as unknown as Briefing
    expect(briefing.rules.map((r) => r.axiomId)).not.toContain(revoked.id)
    expect(firstText(result)).not.toContain(revoked.statement)
  })
})

describe('the file-backed store', () => {
  it('reads tuning.json and records/*.json out of the project layout', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ursa-mcp-'))
    mkdirSync(join(root, '.ursa', 'records'), { recursive: true })
    writeFileSync(join(root, '.ursa', 'tuning.json'), JSON.stringify(TUNING))
    for (const record of RECORDS) {
      writeFileSync(join(root, '.ursa', 'records', `${record.task.id}.json`), JSON.stringify(record))
    }

    const store = fileStore(projectPaths(root))
    expect(store.tuning().axioms.map((a) => a.id)).toEqual(TUNING.axioms.map((a) => a.id))
    expect(store.records()).toHaveLength(RECORDS.length)
  })

  it('is empty rather than broken on a project that has never been run', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ursa-mcp-fresh-'))
    const store = fileStore(projectPaths(root))
    expect(store.tuning().axioms).toEqual([])
    expect(store.records()).toEqual([])

    // And the surface says so in words, rather than returning an empty
    // briefing a model would read as "nothing applies here".
    const result = await withClient(store, (c) => c.callTool({ name: 'get_briefing', arguments: {} }))
    expect(firstText(result)).toContain('The HQ has learned nothing about this yet')
  })
})
