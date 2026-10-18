# Dispatch queue — 2026-10-18, ~02:0x UTC, message pass (`window:message`)

## Tier B merges this pass (§10, amended by §21)

**#229 (frontend, the record address and the viewer that refuses to
overclaim).** Not a draft, no label, no comment or review since its
last push, one defined check (`scan`) green, `mergeStateStatus:
CLEAN`. Diff confined to `docs/design/reviews/`, `ursa-minor/app`,
`ursa-minor/components`, `ursa-minor/lib`, `ursa-minor/scripts`,
`ursa-minor/package.json` — no `prompts/`, `.github/workflows/`, or
`company.yaml` path. Merged.

**#230 (engineer, the index's digest and byte count, and the 390px
fallback-page fix).** Opened since the last pass closed; found by the
same open-queue check that found #229. Not a draft, no label, no
comment since its last push, check green, `mergeStateStatus: CLEAN`,
diff confined to `README.md`, `docs/design/public-record-address.md`,
`docs/ideas.md`, `docs/provenance/`, and `ursa-major/` source and
tests. Merged.

## Not merged: #231 (exo), Tier C by content

`gh pr diff --name-only 231` includes `prompts/exo-agent.md`. Charters
are owner-only (pm.md §9) regardless of what this seat's own Tier B/C
authority otherwise covers. Named for the owner in `pending.md`,
alongside the fact that it subsumes #167, so she can close both with
one decision.

## This pass acted through the board, not `gh workflow run`

Per §17, a message-triggered pass answers what woke it and hands work
onward as board messages rather than firing scheduled dispatches. Two
went out this pass: a `note` to engineer and a `note` to exo, each
answering a message addressed to this seat, and a `handoff` to
engineer naming the one open item neither of the two live drafts
below claims — measuring how much of a record is not reproducible
across two resolves of the same clone (`ursa-major/
tools/measure-resolve-determinism.ts`, the first step engineer's own
#230 already wrote into the ledger).

## Nothing proposed through `gh workflow run` this pass

`gh variable get PM_DISPATCH_ENABLED` returned `403: Resource not
accessible by personal access token` this pass, the same token-scope
gap pm.md §11.5 describes for Actions calls generally, not a secret
withheld on purpose. Moot regardless: every open thread this pass
found already has a live seat on it. #232 (engineer) is building the
Pages dogfood this seat handed off two passes ago. #233 (frontend) is
reading the integrity UI against the divergent-digest case and
measuring the width this seat could not. Nothing here needed a cold
`workflow_dispatch` start instead of the message it already had.

## Failed-run triage this run (§11.7)

`gh run list --status failure --created ">=-24h"` returns seven
`redaction-gate` runs, all on this branch or frontend's prior ones,
all already classified by the second, fifth, seventh, and eighth
passes in this same pull request. Nothing new in this pass's own
window; no rerun, no new incident.
