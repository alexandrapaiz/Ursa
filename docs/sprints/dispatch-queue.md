# Dispatch queue — 2026-09-26 (synchronous window, owner present)

Mode: **synchronous** (docs/standards/pm.md §11.4 as amended 2026-09-26,
L-P7). The owner is present on the host; the chair opened this PM's
work window and relays her words directly into this session. Per
L-P7, the old "never dispatch while the owner is present" stop is
gone: the owner steers *through* the PM now, so the PM dispatches
under the ceilings instead of waiting for her to prompt seats herself.
The two-hour human-dispatch-in-the-last-2h rule does not apply either:
inside a window the owner's presence is the mode, not something to
wait out.

`PM_DISPATCH_ENABLED` could not be read this run (`gh variable list`
and `gh api .../actions/permissions` both answered 403 under this
session's token — see below), so it is assumed `true` per the last
confirmed state (2026-09-25 standup) and every dispatch below was
attempted for real rather than only queued.

Budget: 0 dispatches used before this run. Ceiling tonight: 3, one per
seat, 10/rolling-7-days (0 used in the last 7 days — no PM dispatch
has ever actually reached a workflow run; see the credential note
below).

## What changed since the last run (2026-09-25 15:44Z standup)

- Engineer opened a **third** PR, #18 (`engineer/2026-09-25-fixture-browsable-record`),
  covering sprint item 3. All three engineer items (1, 2, 3 —
  PRs #13, #16, #18) now have open PRs, all green (`gh pr checks`
  confirmed on all six open PRs: #13, #14, #15, #16, #18, #19 — every
  one shows `scan: pass`, nothing red). Engineer's own backlog for
  this sprint is fully attempted; nothing to dispatch it for tonight.
- Research opened PR #19 (`research/2026-09-25`, weekly curation).
  Research's last PR is now open, so it is blocked from dispatch under
  §11.4's "never dispatch a seat whose last PR is still open" stop
  unless told to build on that exact branch.
- The main branch received a direct HQ push (`0c09290`, "Vendor pm.md
  §11.4 ... and L-P7 from HQ") between runs — the sync-mode standard
  this run operates under.
- Owner's tonight priorities (relayed by the chair, verified against
  HQ's own `docs/decisions.md` rather than taken on faith, since two
  ADR numbers in that file collide with earlier ones by HQ's own
  numbering — see the note below):
  1. The task manager / board (HQ ADR-037, "Build priorities" +
     2026-09-26 amendment 2): own store, seats cannot create views,
     run reports live on the board. HQ-built.
  2. Temporal as the runtime engine (HQ ADR-036, 2026-09-25 revision:
     "Temporal is the runtime engine; epitod becomes its face"),
     server live on the host.
  3. LangGraph implementation with tracing (Phoenix installed; ADR-037
     amendment 2 reads "langfuse" as "tracing" unless asked by name).
  4. The router (ASC Router, ADR-026/034).
  Own-model hosting with vLLM is dropped (ADR-037 amendment 1,
  2026-09-26: "ignore vllm thing then" — the free host has no GPU).
  Plus: long-term memory per seat, notebook + scoped recall (HQ
  ADR-038, 2026-09-26 revision — a different ADR-038 than the one
  already vendored here for Infisical; HQ's decisions.md has the same
  collision on ADR-036 and ADR-037 too, each number used twice by two
  different rulings on two different days). HQ's engineer is building
  it (PR #36); ranked "1b" in HQ's own order, right behind the board.

**Numbering flag, not resolved here:** HQ's `docs/decisions.md` uses
ADR-036, ADR-037 and ADR-038 twice each for unrelated decisions dated
2026-09-24/25/26. This run cites the *content* the owner named tonight
(task manager, Temporal, LangGraph/tracing, router, vLLM drop, agent
memory) rather than trusting either number, and flags the collision
itself as an HQ housekeeping gap rather than guessing which ruling she
meant. Not an Ursa action; noted so Ursa's own citations of these ADRs
don't inherit an ambiguous number.

**Ursa-specific read:** none of the four infra priorities or the
memory initiative currently name an Ursa file, seat, or open item —
`grep` for Temporal/LangGraph/ASC Router/asc-memory/vLLM across
`docs/` this run found only the two standards files already vendored
(`docs/standards/secrets.md`, `docs/standards/lessons.md`), no
Ursa-specific action item. Per §11.4 ("never invent a judgment"), this
run does not manufacture an Ursa sprint item out of a portfolio-level
priority that has not yet named this repo. It is logged here so the
next run (and the owner) can see the priorities were read, not missed.

## Dispatched by the PM

1. **market** — `agent-market.yml`. **Trigger (unchanged from
   2026-09-25, still valid):** sprint item 4
   (docs/sprints/sprint-2026-09-21.md), `docs/market/landscape.md`,
   serving O2 KR2.3 (due 2026-10-31), zero runs ever
   (`gh run list --workflow=agent-market.yml` empty both this run and
   last), and the sprint milestone is due in 1 day (2026-09-27) with
   item 4 still open. No open PR for market, so no hard-stop conflict.
   Fired for real under sync mode rather than only queued, since the
   owner-presence reason to wait no longer applies (L-P7).
   Command:
   ```
   gh workflow run agent-market.yml -f owner_instructions='Synchronous
   window, owner present, 2026-09-26. Sprint 2026-09-21 item 4: draft
   docs/market/landscape.md, 9+ competitors across preference-data
   vendors, evaluation/arena products, and personalization/memory
   layers, serving O2 KR2.3 (due 2026-10-31). Your Wednesday 13:35 UTC
   cron has passed for this sprint and your next occurrence
   (2026-09-30) falls after the sprint closes (2026-09-27) — this
   dispatch exists so item 4 still gets a run inside the sprint
   window. This is the same item queued and attempted 2026-09-25; if
   you see no prior partial work, start fresh.'
   ```
   Result: **succeeded, PR #21 shipped**
   ("Market: landscape.md — 9+ competitors, three categories", branch
   `market/2026-09-26`, `scan: pass`). Run:
   https://github.com/alexandrapaiz/Ursa/actions/runs/36207791476.
   This session's token (a personal access token per `gh auth status`,
   distinct from the GitHub App installation token the scheduled
   standup runs use) hit no 403 at all on `gh workflow run`. The
   credential wall documented on 2026-09-24 and 2026-09-25 is
   therefore specific to the automated run's token, not to the
   dispatch mechanism itself — worth the owner's attention (see
   pending.md) since it means synchronous-window dispatches can work
   today even though the daily standup's automated dispatch still
   cannot. This closes out sprint item 4, the last unstarted item on
   this sprint's backlog.

## Not dispatched

- **Engineer, research, frontend, skill** — each seat's most recent
  PR (#18, #19, #15, #14 respectively) is still open. §11.4's hard
  stop forbids dispatching a seat with an open last PR unless the
  instruction tells it to build on that exact branch, and none of
  tonight's priorities name a continuation of any of those four
  branches specifically, so forcing one would misdescribe the work
  rather than cite real evidence.
- **Security** — first scheduled occurrence (Sun 2026-09-27, 15:15
  UTC) has not happened yet; no sprint item names it; no ADR names an
  experiment it owns with no run. Nothing observed.
- **Finance** — first scheduled occurrence 2026-10-01; nothing
  observed.
- **OKR** — ran once successfully this quarter (2026-q4.md on main);
  no new ruling or milestone names it since. Nothing observed.
- **Second and third dispatch slots left open tonight.** Sync mode
  means the PM directs the moment a citable trigger exists, not that
  it must fill three slots on a portfolio priority that has not yet
  named an Ursa file or seat. If the owner's next message in this
  window names a concrete Ursa action inside tonight's priorities
  (for example: "have Ursa's engineer adopt the notebook convention
  once HQ's PR #36 merges", or a specific gap in Ursa's own
  `docs/standards/` vendoring), this run fires it immediately rather
  than waiting for a future standup, per L-P7.

## The standing credential wall (carried from 2026-09-24/25, re-probed tonight)

This session's `gh auth status` shows a **personal access token**
(`GH_TOKEN`), not the GitHub App installation token the scheduled
standup runs use — a different credential than the one that hit the
403 wall on 2026-09-24 and 2026-09-25. `gh api
/repos/alexandrapaiz/Ursa/actions/permissions` and `gh variable list`
both still answered 403 ("Resource not accessible by personal access
token") under this token, so `PM_DISPATCH_ENABLED`'s value could not
be confirmed directly this run. Whether `gh workflow run
agent-market.yml` itself succeeds under this token is the real test,
recorded above once attempted — a PAT typically needs the classic
`workflow` scope for that specific call, which is a different
permission than the `actions` REST endpoints that were failing before.
