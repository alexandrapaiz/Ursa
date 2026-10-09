// `ursa mcp` — serve the local store over MCP on stdio.
//
//   npx tsx src/mcp/cli.ts <projectPath> [--tuning <tuning.json>] \
//     [--records <records dir>]
//
// Stdio, not HTTP, and that is the whole transport story for M2. The
// client spawns this process, talks JSON-RPC over its stdin and stdout,
// and kills it when the conversation ends. Nothing listens on a port,
// so there is no surface for anything but the client that started it,
// and the data never leaves the machine. The remote transport the plan
// reserves for M2.5 is a separate decision with a separate auth story
// (product-plan.md §6, bearer token over OAuth for one owner's
// machines); it is not half-built here.
//
// Wiring it into Claude Code, verified command in docs/design/hq-mcp.md:
//
//   claude mcp add ursa -- npx tsx /abs/path/ursa-major/src/mcp/cli.ts ~/my-project
//
// One rule this file exists to keep: on stdio, stdout IS the protocol.
// A stray console.log corrupts the JSON-RPC stream and the client
// reports a parse error rather than a bug in Ursa, so every diagnostic
// below goes to stderr. This is also why the usage text is printed with
// console.error even in the success-adjacent case.

import { resolve as absPath } from 'node:path'
import { parseArgs } from 'node:util'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createUrsaServer, fileStore, projectPaths } from './server'

const USAGE = `ursa mcp <projectPath> [--tuning <tuning.json>] [--records <records dir>]

Serves two reads of the store at <projectPath>/.ursa over MCP on stdio:
  resource  ursa://tuning/current   your tuning as a context block
  tool      get_briefing            rules, prior cases and guardrails`

export async function main(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      tuning: { type: 'string' },
      records: { type: 'string' },
    },
  })

  const [project] = positionals
  if (!project) {
    console.error(USAGE)
    return 2
  }

  const defaults = projectPaths(absPath(project))
  const paths = {
    tuningPath: values.tuning ? absPath(values.tuning) : defaults.tuningPath,
    recordsDir: values.records ? absPath(values.records) : defaults.recordsDir,
  }

  // stderr, deliberately: see the stdout note at the top of this file.
  // Clients surface stderr in their own logs, which is where someone
  // debugging "why is my briefing empty" will look.
  console.error(`ursa mcp: tuning ${paths.tuningPath}`)
  console.error(`ursa mcp: records ${paths.recordsDir}`)

  const server = createUrsaServer({ store: fileStore(paths) })
  await server.connect(new StdioServerTransport())

  // Resolve only when the client closes the transport. Returning here
  // would exit the process mid-conversation.
  await new Promise<void>((done) => {
    server.server.onclose = () => done()
  })
  return 0
}

const invokedDirectly =
  process.argv[1]?.endsWith('mcp/cli.ts') || process.argv[1]?.endsWith('mcp\\cli.ts')
if (invokedDirectly) void main(process.argv.slice(2)).then((code) => process.exit(code))
