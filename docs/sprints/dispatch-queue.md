# Dispatch queue — 2026-10-18, ~02:3x UTC, message pass (`window:message`)

## Tier B merge this pass (§10, amended by §21)

**#233 (frontend, the resolver's phone-overflow number and the index
floor moved to 0.3).** Not a draft, no label, no comment or review
since its last push, one defined check (`scan`) green,
`mergeStateStatus: CLEAN`. Diff confined to `docs/design/reviews/` and
`ursa-minor/` (`app`, `components`, `lib`, `package.json`, `public/
fixtures`, `scripts`) — no `prompts/`, `.github/workflows/`, or
`company.yaml` path. Cut from #229 (already merged), so the diff
against `main` is additive only. Merged.

## Not merged: #234 (exo), Tier C by content

`gh pr diff --name-only 234` includes `prompts/exo-agent.md` and
`prompts/pm-agent.md`. Charters are owner-only (pm.md §9) regardless of
what this seat's own Tier B/C authority otherwise covers. Still
subsumes #231 and #167 (confirmed this pass). Named for the owner in
`pending.md`.

## Owner-action logged, not fixed by this seat: eight stale charter branch prefixes

`alexandra-systems/exo-centralizer` named eight Ursa charters whose
branch-naming line still reads the bare role instead of the registered
`ursa-<role>` prefix the runtime actually dispatches onto. Verified
every line named. Not self-edited — charters are the owner's tier. The
exact one-line diff per file is in `docs/decisions.md` ("eight of
Ursa's charters..."), for the owner to take directly or hand to a
routed pull request. Does not collide with #234's own `prompts/
pm-agent.md` edit, which is a different, unrelated clause.

## This pass acted through the board, not `gh workflow run`

Per §17, a message-triggered pass answers what woke it and hands work
onward as board messages rather than firing scheduled dispatches. Two
replies went to exo-centralizer (the host-report question closed, the
eight-charter finding confirmed and located) and one to frontend
(confirming #233's merge), each first person, each answering a message
addressed to this seat.

## Nothing proposed through `gh workflow run` this pass

`gh variable get PM_DISPATCH_ENABLED` returned `403: Resource not
accessible by personal access token` again this pass, the same
token-scope gap pm.md §11.5 describes for Actions calls generally.
Moot regardless: every open thread this pass found already has a live
seat on it — #232 (engineer), #235 (exo), #236 (frontend) are all live
drafts with runs behind them, none idle. Nothing here needed a cold
`workflow_dispatch` start instead of the message it already had.

## Failed-run triage this run (§11.7)

`gh run list --limit 30` shows no run completing outside success since
the eleventh pass. No rerun, no new incident.
