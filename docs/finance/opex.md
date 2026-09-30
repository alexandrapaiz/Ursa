# OPEX — Ursa operating cost ledger

Living ledger. Maintained by the finance agent (`prompts/finance-agent.md`).
Updated monthly at the close; touched between closes only to correct a
line that turns out to be wrong.

**Rule this file follows:** every dollar figure here is either read
from a public surface, read from repo evidence (workflow config, run
history, dependency manifests), or given by the owner. Nothing here is
estimated and presented as fact. Where the true cost is real but not
observable to this seat, the line says so and asks the owner directly.

## First close: 2026-09-30

This is the finance seat's first run since activation (ADR-005,
2026-09-24). Ursa's repo has no prior finance close to diff against, so
every line below is a baseline, not a trend.

## Cost lines

| Service | Status in Ursa (evidence) | Cost this month | Note |
|---|---|---|---|
| GitHub Actions | Repo is public (`gh repo view`: `visibility: PUBLIC`). All 12 seat workflows and the redaction gate run on `runs-on: ubuntu-latest`. Public repos get unmetered standard-runner minutes. | **$0** | Verified via `gh api repos/alexandrapaiz/Ursa/actions/runs`: 172 runs since 2026-09-01, ~423 total runner-minutes across seats this month (see below). Minutes are free regardless of volume as long as the repo stays public; if it ever goes private this line stops being $0. |
| GitHub (storage, LFS) | No LFS pointers or large-binary evidence found in the tree. | **$0** | Nothing to meter. |
| Claude subscription (compute) | Every `agent-*.yml` workflow calls `anthropics/claude-code-action@v1` with `secrets.CLAUDE_CODE_OAUTH_TOKEN` as its fallback path (and sole path when `OPENROUTE_API_KEY` is unset or the open-routed attempt fails, per `agent-finance.yml`'s two-step design). | **Not measurable by this seat** | This is the owner's existing Claude subscription, shared across the whole Alexandra Systems portfolio, not a Ursa-specific line item. **Question for the owner:** what share of the subscription's cost (or a stated internal rate per seat-run) should Ursa's books carry, if any? Until she answers, this ledger records the dependency and assigns it no dollar figure rather than guessing one. |
| OpenRouter (Moonshot Kimi, "open routing") | `agent-finance.yml` (and the other seat workflows) try a Kimi run first via `secrets.OPENROUTE_API_KEY` / `OPENROUTE_BASE_URL`, falling back to the Claude subscription on failure or when the secret is absent. The workflow comment records three prior open-routed failures (2026-09-21 x2, 2026-09-24) attributed to "Moonshot's prepaid tier allows almost no concurrency." | **Not measurable by this seat** | This is a metered, prepaid balance this seat cannot read (`gh secret list` returns 403 by design, per `docs/standards/secrets.md` §5). **Question for the owner:** current prepaid balance and burn rate, so this ledger can track it as a real number instead of a placeholder. |
| Groq | Named in this charter's "known lines" list (inherited from alexandria's charter). No reference to Groq in any workflow, `package.json`, or source file in this repo. | **Not integrated — charter/reality mismatch** | Ursa's actual model-routing fallback is OpenRouter/Moonshot Kimi, not Groq. Flagging this for the owner rather than carrying a phantom line: either Groq is planned and not yet wired in, or the charter line is stale from the alexandria inheritance and should be corrected to name OpenRouter. |
| Modal | Named in the charter's "known lines" list. No reference anywhere in this repo (`.py`, `.ts`, `.yml`) to Modal. | **Not integrated** | The charter's own header already flags that "Modal, digests, corpus" are alexandria-specific references that don't apply here. This line in the OPEX section body was not adjusted to match. Recommend the owner strike it at the next charter edit; until then this ledger records $0 because there is nothing to meter. |
| Neon (serverless Postgres) | `secrets.NEON_RO_URL` is wired into `agent-research.yml` and `agent-skill.yml` only — read-only. No Ursa-owned schema exists yet: `docs/design/product-plan.md` §12 designs an `accounts` / `sync_blobs` / `survival_stats` schema for Ursa Major's cloud surface, but no code in `ursa-major/overlay/` creates or migrates it, and no `DATABASE_URL`-shaped secret is wired into any Ursa Major workflow or route. | **$0 for Ursa's own use; unknown for the read-only connection** | The `NEON_RO_URL` research/skill seats read from is most likely a shared read-only view into an existing (non-Ursa) database, per the "shared across companies" pattern in `docs/standards/secrets.md` §1. **Question for the owner:** confirm whose Neon project `NEON_RO_URL` points at, so this ledger can either exclude it (someone else's bill) or start tracking it. |
| Vercel | `ursa-major/overlay/package.json` depends on `@vercel/blob`; `ursa-major/overlay/app/api/sync/[key]/route.ts` exists. No `.vercel/` directory, no `vercel.json`, and `gh repo view` shows no linked deployment evidence in-tree. `docs/design/product-plan.md` §12 designs the Vercel serverless surface at "Hobby tier, $0 until traffic demands otherwise" — a design decision, not yet a deployment. | **$0 — not deployed yet** | Nothing to meter; the overlay is scaffolded but not live. Revisit the month this actually ships. |
| Clerk | Named in the charter's "known lines" list. `docs/design/product-plan.md` §12 explicitly decided against Clerk in favor of GitHub OAuth ("**Identity/auth — decision: GitHub OAuth**, not Clerk... $0"). No Clerk dependency anywhere in the tree. | **Not integrated — charter/reality mismatch** | The product decision superseded the charter's inherited assumption. Recommend striking this line at the next charter edit. |
| Stripe | No revenue exists yet (see `revenue.md`), so no fees can accrue. No Stripe dependency in the tree. | **$0 (no revenue to process)** | Revisit the month billing goes live. |
| Domains / SES | No domain purchase or SES reference found. Ursa Major's product plan defers this to Phase 2. | **$0 — not yet relevant** | Revisit when Phase 2 starts. |
| Board (`board.libraryofalexandria.dev`) | `BOARD_API_URL` / `BOARD_RUNTIME_TOKEN` / `PROJECTS_TOKEN` are wired into every seat workflow, including finance's. Per `docs/standards/pm.md` §14, this is HQ-hosted infrastructure ("the host"), shared across the whole portfolio, not a Ursa-provisioned service. | **Out of Ursa's ledger** | This is HQ's infra cost to carry, not Ursa's, unless HQ allocates it back. Recording the dependency here for completeness; not counting it as an Ursa OPEX dollar without an owner or HQ instruction to do so. |

## Actions usage detail (evidence for the $0 line above)

Pulled via `gh api "repos/alexandrapaiz/Ursa/actions/runs?created=>2026-09-01"` on 2026-09-30, paginated, 172 runs returned:

| Workflow | Runs | Total runner-minutes | Avg minutes/run |
|---|---|---|---|
| engineer-agent | 12 | 214.2 | 17.8 |
| pm-agent | 10 | 66.4 | 6.6 |
| frontend-agent | 2 | 52.3 | 26.1 |
| exo-agent | 2 | 25.6 | 12.8 |
| redaction-gate | 132 | 19.4 | 0.1 |
| research-agent | 2 | 13.9 | 6.9 |
| security-agent | 1 | 12.8 | 12.8 |
| skill-agent | 1 | 8.2 | 8.2 |
| market-agent | 1 | 7.0 | 7.0 |
| okr-agent | 5 | 3.3 | 0.7 |
| finance-agent (this seat) | 1 prior failed dispatch, 0 completed before this run | — | — |

9 of the 172 runs failed, 1 was cancelled, 162 succeeded. Failure detail
is the exo/engineer/pm lane's territory (see `docs/agents/incidents.md`
and the standup PRs), not restated here — this ledger only needed the
minute totals.

**Reading this table:** volume is high (172 runs in a month, dominated
by the redaction gate firing on every push) but the dollar cost is
still $0 end to end, because the repo is public. The one thing that
would break this line is the repo going private — flag that decision
to finance if it's ever made, since it converts free minutes into a
metered bill.

## Open questions for the owner

1. Claude subscription: is there a rate or allocation you want Ursa's
   books to carry, or does this stay a $0 line because the subscription
   exists regardless of Ursa?
2. OpenRouter/Moonshot Kimi: current prepaid balance and this month's
   burn, so this ledger can carry a real number.
3. `NEON_RO_URL`: whose Neon project is this, and should its cost (if
   any) appear on Ursa's books or someone else's?
4. Groq and Clerk are named in this charter's OPEX section but have no
   footprint in the repo; Modal is named and explicitly excluded by the
   charter's own header. Recommend correcting the charter text at the
   next edit so this ledger stops carrying phantom lines. Flagging
   rather than editing the charter myself — charter changes are the
   owner's or HQ's, not this seat's to make.
