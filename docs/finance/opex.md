# OPEX — Ursa operating cost ledger

Living ledger. Maintained by the finance agent (`prompts/finance-agent.md`).
Updated monthly at the close; touched between closes only to correct a
line that turns out to be wrong.

**Rule this file follows:** every dollar figure here is either read
from a public surface, read from repo evidence (workflow config, run
history, dependency manifests), or given by the owner. Nothing here is
estimated and presented as fact. Where the true cost is real but not
observable to this seat, the line says so and asks the owner directly.

**Practice adopted 2026-10-27 (close-2026-10.md, sixth run):** a figure
sourced from a live repo or host read now names that read's own
timestamp next to the measurement window, because the source can move
between the read and the line being published, and a figure that
names only the window it measures can go stale without saying so.

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
| Host runtime (`/srv/asc/...`, "epito") | New evidence this run, 2026-11-01: this seat's own current run, and ten other Ursa seats per the October table below, are executing under a host runtime that keeps its own audit log (`/srv/asc/state/.epito/audit.jsonl`), not named in `company.yaml` or any Ursa workflow file. | **Out of Ursa's ledger, same treatment as Board** | Looks like the same class of shared Alexandra Systems execution infrastructure as the Board line above, not something Ursa provisioned. Treated the same way pending confirmation — see open question 5 below. |

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

## Update: 2026-10-01 — September reconciled, October opened

`gh repo view alexandrapaiz/Ursa` still returns `visibility: PUBLIC`, so
the $0 Actions-minutes line continues to hold without re-deriving the
argument above.

**September, reconciled against the full month** (the 2026-09-30 pull
above was taken a day early and missed the month's last runs). Pulled
via `gh api "repos/alexandrapaiz/Ursa/actions/runs?created=2026-09-01..2026-09-30"`,
completed runs only:

| Workflow | Runs | Successes | Total wall-minutes (proxy, see note) |
|---|---|---|---|
| engineer-agent | 13 | 13 | 230.0 |
| pm-agent | 11 | 11 | 73.9 |
| redaction-gate | 170 | 168 | 24.5 |
| frontend-agent | 2 | 2 | 52.3 |
| exo-agent | 2 | 2 | 25.6 |
| research-agent | 2 | 2 | 13.9 |
| market-agent | 2 | 2 | 10.1 |
| security-agent | 1 | 1 | 12.8 |
| skill-agent | 1 | 1 | 8.2 |
| okr-agent | 5 | 1 | 3.3 |
| finance-agent | 1 | 0 | 0.0 |

213 completed runs for the full month (up from the 172 seen on 2026-09-30),
10 non-success. Total still $0 — the growth is in volume, not cost.
"Wall-minutes" is `updated_at − run_started_at` per run, the same proxy
the 2026-09-30 table used; it is not GitHub's own billed-minutes figure
(that would need one `.../runs/{id}/timing` call per run, 200+ calls,
for a number that doesn't change the $0 conclusion), so treat the
minute columns in this file as a volume indicator, not a billing figure.

**October, month to date (2026-10-01, a few hours in).** 12 runs so far
(2 engineer-agent, 1 pm-agent, 8 redaction-gate, this finance-agent run),
~29 wall-minutes, repo still public. Too little of the month has
elapsed for this to mean anything on its own; it will roll into the
2026-11-01 close as the real October figure.

**Open questions carried forward unchanged** (Claude subscription
allocation, OpenRouter balance, `NEON_RO_URL` ownership, the Groq/
Clerk/Modal charter-vs-reality mismatches): see below. None has been
answered since the first close; none is re-asked as new.

## Update: 2026-10-27 — shared-services register opened

`docs/finance/shared-services.md` is new this run, at a handoff from
HQ's PM seat: a 2026-10-26 turn-cap raise (`alexandra-systems#525`)
lifted `max_turns` 1.5x on four of Ursa's own seats (engineer, exo,
security, skill), which raises the ceiling on the same Claude-subscription
line this file already carries as unmeasured (open question 1 below).
The register carries the usage facts, measured against the host's own
run record; it carries no dollar figure for the same reason this file's
Claude-subscription line doesn't.

## Update: 2026-11-01 — October reconciled, November opened

Read at 2026-11-01T23:1x UTC (this run). `gh repo view alexandrapaiz/Ursa`
still returns `visibility: PUBLIC`, so the $0 Actions-minutes line
continues to hold for the same reason as every prior close.

**October's Actions volume, reconciled against the full month.**
`gh api repos/alexandrapaiz/Ursa/actions/runs?created=2026-10-01..2026-10-31`
reports `total_count: 2267` — up from September's reconciled 213, a
10.6x increase. Broken out per workflow (`total_count` from each
workflow's own runs endpoint, which sums exactly to 2267, so this count
is exact even though the API caps any single listing at 1000 retrievable
items):

| Workflow | Runs (October, exact) | Runs (September) |
|---|---|---|
| redaction-gate | 2192 | 170 |
| engineer-agent | 34 | 13 |
| pm-agent | 17 | 11 |
| frontend-agent | 5 | 2 |
| research-agent | 5 | 2 |
| security-agent | 4 | 1 |
| exo-agent | 3 | 2 |
| skill-agent | 3 | 1 |
| market-agent | 2 | 2 |
| finance-agent (this seat) | 1 | 1 |
| okr-agent | 1 | 5 |
| sales-agent | 0 | 0 |

**Still $0 end to end** — the growth is entirely in volume, same
conclusion as every prior close, for the same reason (public repo,
unmetered standard runner minutes). Wall-time detail, read as a sample
where the full set wasn't retrievable: the non-redaction-gate workflows
above total 75 runs and all retrieved in full (1,407 wall-minutes,
proxy as before), but every one of them landed by 2026-10-17 —
`engineer-agent`'s own last GitHub Actions run of the month started
2026-10-17T14:18Z, and nothing from any seat workflow (other than
redaction-gate) shows up on GitHub Actions after that date. This is not
a drop in seat activity — see the host-audit-log section below, which
shows seats running heavily through the rest of October — it is
evidence that most seat-agent dispatch moved off GitHub Actions
workflow-dispatch sometime around mid-October, onto the host runtime
this seat's own current run is executing under (`/srv/asc/state/.epito/`).
`redaction-gate` keeps running on GitHub Actions regardless of what
dispatches a seat, because it triggers on `push`, not on a workflow
dispatch; its listing API caps at the 1000 most recent of 2192 runs,
which all land 2026-10-24 to 2026-10-27 (965 success / 35 failure in
that sample, average wall-time 0.19 minutes/run, consistent with
September's 0.14 min/run average) — too concentrated a sample to say
anything about the first three weeks of the month's redaction-gate
timing, only that the count for the full month (2192) is exact.

**Why this matters beyond a volume number.** `redaction-gate` firing
2192 times in one month, still at $0 because the repo is public, is the
single clearest illustration yet of the risk every close since
September has named first: the day this repo goes private, this line
stops being $0 practically overnight, and October's volume makes that a
much bigger number than September's would have. Nothing changed about
the risk's likelihood this run — flagging that its cost, if it ever
materializes, has grown an order of magnitude this month.

**New measurable source: the host's own run record.**
`/srv/asc/state/.epito/audit.jsonl` (used once before, in
`shared-services.md`'s turn-cap line) records every seat run directly —
`run.start`/`run.end` events per agent, with `turns`, `durationMs`,
`model`, and `exit` — regardless of whether GitHub Actions dispatched it.
Read at 2026-11-01T23:2x UTC, filtered to `agent` names prefixed
`ursa-` with `action: run.end` and a timestamp in October:

| Seat | Runs | Turns | Wall-hours | Model |
|---|---|---|---|---|
| pm | 287 | 11,053 | 33.8 | claude-sonnet-5 |
| exo | 91 | 6,304 | 22.9 | claude-opus-5 |
| engineer | 73 | 4,456 | 23.3 | claude-opus-5 |
| frontend | 49 | 4,481 | 20.8 | claude-opus-5 |
| skill | 51 | 4,216 | 12.8 | claude-opus-5 |
| market | 45 | 2,318 | 5.3 | claude-sonnet-5 |
| security | 23 | 1,834 | 7.2 | claude-opus-5 |
| research | 30 | 1,730 | 6.4 | claude-opus-5 |
| finance (this seat) | 10 | 323 | 1.1 | claude-sonnet-5 |
| okr | 2 | 112 | 0.3 | claude-sonnet-5 |
| sales | 1 | 0 | 0.2 | claude-opus-5 |
| **Total** | **662** | **36,827** | **134.2** | — |

This is real, sourced usage for the thing open question 1 below has
asked about since the first close — the Claude subscription's actual
draw — for the first time measured across all eleven active-or-dormant
seats rather than inferred from GitHub Actions minutes that, per the
above, stopped reflecting most seats' activity around mid-month. **It
still carries no dollar figure**, for the same reason as always: there
is no per-turn or per-seat rate from the owner to multiply it by, and
this seat will not invent one. There is also no September baseline to
diff this against — this is the first month this seat read the host
record for anything beyond the one turn-cap line — so the table above
is a new starting point, not a trend, going into November.

**Kimi/OpenRouter balance — open question 2, partially answered.** The
company board now carries a recurring broadcast from HQ's own shared
finance seat (`from_seat: finance`, `from_company: alexandra-systems`,
not this seat), reading the Moonshot/Kimi prepaid balance roughly every
six hours and posting it company-wide. Three readings fell inside this
run's window: $40.38 at 2026-11-01T06:06Z, $39.94 at 13:25Z, $39.41 at
22:02Z — a decline of about $0.97 over roughly 16 hours. **This balance
is shared across the whole Alexandra Systems portfolio** (the note is a
broadcast, addressed to no specific company), not an Ursa-only draw, so
this ledger still cannot carve out "Ursa's share" of it without an
allocation rule from the owner or HQ. What changed: the number itself
is no longer unmeasurable (`gh secret list` still 403s, but the board
reading doesn't need that access), only its allocation across companies
is still open.

**Open questions 3 and 4, re-checked, unchanged.** `NEON_RO_URL` wiring
in `agent-research.yml`/`agent-skill.yml` is identical to September;
Groq and Clerk still have no footprint in the tree; Modal is still
excluded by the charter's own header. Nothing new to report.

## Open questions for the owner

1. Claude subscription: is there a rate or allocation you want Ursa's
   books to carry, or does this stay a $0 line because the subscription
   exists regardless of Ursa? Usage is now measured in full
   (see the October table above and `shared-services.md`) — only the
   dollar rate is missing.
2. OpenRouter/Moonshot Kimi: the balance is now observable via the
   board (~$39-40 as of 2026-11-01, declining), but it's shared across
   the whole portfolio. What share, if any, belongs on Ursa's books?
3. `NEON_RO_URL`: whose Neon project is this, and should its cost (if
   any) appear on Ursa's books or someone else's?
4. Groq and Clerk are named in this charter's OPEX section but have no
   footprint in the repo; Modal is named and explicitly excluded by the
   charter's own header. Recommend correcting the charter text at the
   next edit so this ledger stops carrying phantom lines. Flagging
   rather than editing the charter myself — charter changes are the
   owner's or HQ's, not this seat's to make.
5. The host runtime this seat (and ten others) now runs under
   (`/srv/asc/state/.epito/`, visible in its own audit log) is not
   named in `company.yaml` or any Ursa workflow — it looks like shared
   Alexandra Systems execution infrastructure, the same class of
   dependency as the board line already carried here as "out of Ursa's
   ledger." Flagging for confirmation rather than assuming: should this
   ledger treat it the same way (HQ's infra to carry, not Ursa's), or
   does Ursa owe some share of it?
