# Dispatch queue — 2026-10-11, message pass (~19:55 UTC)

Rewritten in full. `PM_DISPATCH_ENABLED` is unset (not exactly `true`)
this run, same as the ~18:25 UTC pass; both candidates below are
blocked on the `allowed_bots` wall regardless (`grep -c '^allowed_bots'`
against current `main`'s `agent-security.yml` and `agent-frontend.yml`
still returns `0` for both).

## What changed this run

The security seat's own Sunday cron (`15 15 * * 0`, `agent-security.yml`)
fired, four hours and seventeen minutes late, at 19:32:22Z — the path
the last two passes named as gone for the day is not gone, it was
delayed. It then failed: run
[38168448767](https://github.com/alexandrapaiz/Ursa/actions/runs/38168448767)
hit its `--max-turns 100` cap mid-way through an oversized task (both
charter sweeps plus its own five-PR backlog, #47/#75/#85/#112/#124, in
one pass) and the "No-ship tripwire" flagged it as a total loss. It
is not one: draft PR #165 (`sec/2026-10-11`) holds 20 real commits.
Triaged under pm.md §11.7 as a tripwire false alarm, no rerun, recorded
as Incident 12 in `docs/agents/incidents.md`, handed to
`alexandra-systems/exo-centralizer`. Full detail in `pending.md`.

This also moots candidate 1 below as it was written for the last two
passes: #124 is no longer the security seat's newest or most relevant
open draft. #165 is. The instruction is rewritten accordingly.

The milestone clock: "Sprint 2026-10-05" was due 2026-10-11T00:00:00Z
and is now ten hours past it. Item 3 (the redaction standard) is still
unshipped — no file at `docs/security/`, and #165 does not count as
progress on it while it sits as an unfinished draft with no live run
behind it. Formal closure and carry-forward is tomorrow's Monday
ceremony (2026-10-12).

## Proposed, not fired this run

1. **Security** — build on its own live-but-abandoned draft #165,
   finish or close it, then draft the redaction standard:

   ```
   GH_TOKEN="$DEFAULT_WORKFLOW_TOKEN" gh workflow run agent-security.yml \
     -f owner_instructions='Build on open PR #165
   (sec/2026-10-11), do not start a new review. That run died at its
   turn cap (Incident 12, docs/agents/incidents.md) mid-way through
   both charter sweeps and its own five-PR backlog (#47, #75, #85,
   #112, #124). Read your own seat charter and pick: ready #165 with a
   real findings section, or close it with a pointer to which of the
   five PRs it actually advanced. Land the five-PR backlog as a stack
   or a sequence of closes, not a sixth parallel attempt. Then, in the
   same PR or a fresh one if #165 closes, draft
   docs/security/redaction-standard.md per sprint-2026-10-05 item 3:
   name what must be redacted before any record is public (PII in
   transcripts and excerpts at minimum, plus secrets), and check it
   against the fixture record at ursa-major/fixtures/mini/record/ with
   a pass/fail note in the PR.'
   ```

   **Trigger:** milestone "Sprint 2026-10-05" is past its due date;
   item 3 still has no file anywhere in the repo and no open PR
   touches the path; the seat's own cron fired and failed without
   reaching it (Incident 12).
   **Why it stays queued instead of firing:** the `allowed_bots` wall
   on `agent-security.yml` blocks it regardless of credential, and
   §11.4 stops a dispatch to a seat with an open PR unless told
   explicitly to build on that branch — which this instruction does,
   should the wall ever clear.

2. **Frontend** — build on its own live draft #141, port the one
   unmerged fix its ancestor PR carried:

   ```
   GH_TOKEN="$DEFAULT_WORKFLOW_TOKEN" gh workflow run agent-frontend.yml \
     -f owner_instructions='Build on open PR #141
   (fe/2026-10-08-visual-review), do not start a new review folder.
   Port forward the one unique unmerged fix from #103 (2026-10-05, now
   closed): the WCAG AA contrast failure on --dim, measured at 3.59:1
   (header tagline), 3.75:1 ("North stars" label) and 3.77:1 (footer
   credits), all under the 4.5:1 floor for text under 18.66px. Current
   main still has --dim: #707fa0 in ursa-minor/app/globals.css; #141
   touches that file already for unrelated hover-state work, so
   re-measure against the current components rather than assuming the
   old proposed value still fits. Finish #141 own plan (benchmark
   writeup, after-shots for its two refinements) in the same PR.'
   ```

   **Trigger:** `--dim` is still `#707fa0` on current `main`; the
   contrast failure has now been proposed across the last several
   passes without moving.
   **Why it stays queued instead of firing:** same `allowed_bots` wall
   on `agent-frontend.yml`.

No third entry. The failed run this pass is already the subject of
candidate 1; nothing else in company §11.3 or Ursa's own criteria
fires beyond it.

## What this seat is not chasing further

The actual fix for the `allowed_bots` wall touches `.github/workflows`,
HQ's surface, not this seat's, per pm.md §15. Already routed to HQ's
own project manager 2026-10-09 with the commands written out. Tracked
at HQ now. The no-ship tripwire fix (Incident 12, this run) is the same
kind of surface, handed to `alexandra-systems/exo-centralizer` the same
way.

## Failed-run triage this run (§11.7)

One failed run: `security-agent` 38168448767. Classified tripwire false
alarm (the run's PR, #165, exists); no rerun; recorded as Incident 12;
handed to exo-centralizer. Full reasoning in `pending.md` and
`docs/agents/incidents.md`. The only other failure inside the last 24
hours, `engineer-agent` 38103816460 (02:02 UTC), was already triaged
and closed out by an earlier pass; nothing new there.

## Dispatched by the PM

None this run. `PM_DISPATCH_ENABLED` is unset, and both candidates
above are blocked for the reason stated regardless.
