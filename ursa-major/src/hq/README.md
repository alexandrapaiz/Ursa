# hq/ — the agent-facing side of the tuning store

Work in progress for the ledger entry "Agentic-forward: Ursa as the
agents' HQ" (docs/ideas.md, 2026-09-20 accepted), plan §15.

`get_briefing` serves an agent evidence before it starts work: the
rules that apply, the nearest prior cases, and the guardrails already
learned. It never issues orders. The agent stays the judge of
application (vision §0b).
