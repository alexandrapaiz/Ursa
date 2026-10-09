# mcp/ — the Model Context Protocol surface over the local store

Work in progress for the ledger entry "Agentic-forward: Ursa as the
agents' HQ" (docs/ideas.md, 2026-09-19, accepted owner-directed),
whose first step is "add get_briefing to the M2 MCP server surface".
There was no MCP server surface to add it to, so this directory is
that surface.

Everything here is local and read-only. The server reads the same two
things on disk that `src/hq/cli.ts` and `src/tuning/export.ts` already
read, and it writes nothing.
