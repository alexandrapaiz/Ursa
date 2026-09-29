# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
Reconciled 2026-09-29, ~16:48Z scheduled standup, against `gh pr list
--state open`, `gh run list --limit 30`, `gh run list
--workflow=research-agent`, and `gh api repos/:owner/:repo/milestones`.

## Awaiting the owner's merge

- **18 open PRs, zero merged since the last standup landed (#23,
  2026-09-28).** All show green CI (`SUCCESS` on every check), zero are
  draft, and only one (#20) carries any comment at all. Oldest is #13
  (`engineer/2026-09-24-trace-stage-loops`, opened 2026-09-24 15:53Z,
  five days old, not yet at the seven-day flag). In rough age order:
  #13, #14 (`skill/2026-09-24-outcome-record-provenance`), #15
  (`fe/2026-09-24-visual-review`), #16
  (`engineer/2026-09-25-artifact-kind`), #18
  (`engineer/2026-09-25-fixture-browsable-record`), #19
  (`research/2026-09-25`), #20 (`ursa-pm/2026-09-26-window`, Tier B,
  the ADR-007 proposal), #21 (`market/2026-09-26`), #22
  (`engineer/2026-09-26-get-briefing`), #24
  (`engineer/2026-09-26-verdict-to-record`), #25
  (`engineer/2026-09-27-verdict-eval`), #27
  (`engineer/2026-09-27-ledger-union-merge`), #28 (`sec/2026-09-27`,
  the first security audit — a live CORS hole already fixed in the same
  PR, plus an unauthenticated sync-route write left for an owner
  mechanism decision), #29 (`ursa-pm/2026-09-27-message`), #30
  (`exo/2026-09-27`), #32
  (`engineer/2026-09-28-record-integrity-gate`), #33
  (`engineer/2026-09-28-pr-adapter`), #34 (`pm/sprint-2026-09-28`, this
  seat's own ceremony PR — the sprint on `main` is still
  `sprint-2026-09-21` until this merges), #35
  (`fe/2026-09-28-visual-review-polish`), #36
  (`engineer/2026-09-29-next-rce-breakfix`, answers #28's critical
  Next.js RCE finding).
  Merge order across the engineer PRs (#13/#16/#18/#22/#24/#25/#27/#32/
  #33/#36, all ten touching `ursa-major/src` or its workflow) matters
  most; #34 (this seat's ceremony) and #20 (Tier B ADR-007) stand apart
  and can merge independently of that chain.

## Waiting on an owner-only action

- **The unauthenticated sync-route write from PR #28's security
  audit**: anyone can `PUT /api/sync/<64hex>` with no auth, no rate
  limit, `allowOverwrite: true` — a cost and integrity risk, not a
  secret leak (the server never holds plaintext). Needs a mechanism
  decision, so it sits in the ledger rather than being patched
  unilaterally. Carried from 2026-09-27.
- The single-salt-per-user tradeoff (same audit, #28) — documented as
  deliberate, but flagged again since it means two users who pick the
  same passphrase silently overwrite each other. Carried from
  2026-09-27.
- Three `proposed` ledger entries still have no owner verdict: repo
  split (2026-09-18, now 11 days), tuning packs (2026-09-19, now 10
  days), the merge-commits/PR-reader finding (2026-09-20, now 9 days).
  None has crossed two weeks yet; repo split is the closest (three days
  out) and worth flagging in the grooming ceremony next Monday if it
  still has no verdict by then.
- Carried from 2026-09-24, not re-verified this run (exo's lane) —
  `docs/agents/incidents.md` Incident 4's Status line still reads
  "Open until both are edited." Flagging again so it isn't lost.
- The `docs/decisions.md` ADR numbering collision (two entries each
  numbered ADR-005 and ADR-006) is still unfixed, carried from
  2026-09-25. Still outside this seat's writable surface.
- `LINEAR_API_KEY` and `PROJECTS_TOKEN` remain moot per ADR-006; no
  longer carried as open items.

## This run's dispatch reasoning — nothing queued

Every active seat's most recent PR is open (see above), which alone
triggers §11.4's hard stop against dispatching any of them. On top of
that, none of §11.3's rows fire on this run's evidence (no failed runs
in the last 24h, no failing CI or unanswered review comments on any
open PR, no ADR merged since the last run, the open milestone is five
days out, no PR has reached seven days). Full reasoning in
`docs/sprints/dispatch-queue.md`.

## Noticed in passing

- `research-agent`'s Tuesday 13:15 UTC cron did not fire today
  (`gh run list --workflow=research-agent` shows exactly one run ever,
  2026-09-25). Not yet an owner action — matches the "cron fires late"
  pattern seen and self-resolved for four seats in the 2026-09-24/25
  window — but worth checking again if Friday's occurrence also goes
  missing.
- The sprint ceremony for this week ran on schedule (PR #34, opened
  2026-09-28 19:32Z, retro + grooming + new sprint in one PR) but is
  still unmerged, so `main`'s live sprint file is still
  `sprint-2026-09-21` five days after that sprint's own end date and
  after its milestone was already closed via the API. This is the same
  pattern flagged for PR #9 in the first sprint: the ceremony runs on
  time, the merge is what lags.
