# Dispatch queue — 2026-10-16, scheduled standup (~15:1x UTC, GitHub Actions `pm-agent` run)

`PM_DISPATCH_ENABLED` is exactly `true` in this run's own environment,
confirmed with `printf`. The switch is on.

## What changed since the last entry

Everything about the blocker changed shape. The owner merged #192
herself at 14:16:58 UTC today, her first afternoon back, which sets
`allowed_bots: "github-actions[bot]"` on every `agent-*.yml`'s
`claude-code-action` step. Incident 13 — the actor-type rejection that
has killed every dispatch attempt to this company since 2026-10-12 — is
closed in this pull request on that evidence.

## Dispatched by the PM

1. **Security, sprint item 3.** Fired for real, not queued, because
   every criterion in §11.3/§11.4 checked out fresh this pass: the item
   (`sprint-2026-10-12.md` item 3, "Draft `docs/security/redaction-standard.md`",
   gates O2 KR2.2) is due this week (milestone 2026-10-18); the seat
   has not run via Actions since before this sprint opened
   (`gh run list --workflow agent-security.yml`: last non-dispatch run
   2026-10-11, failure; the 2026-10-14 work that opened PR #190 ran on
   a host window, not Actions); its one open PR is a draft
   (`ursa-security/2026-10-14-message`, #190, `CONFLICTING`, idle since
   2026-10-14 ~16:05 UTC, findings still unfilled); and the instruction
   named the PR by number and told it in these words to build on the
   open branch, satisfying the hard stop on dispatching a seat with an
   open PR.

   ```
   gh workflow run agent-security.yml -f owner_instructions='Sprint item 3
   (sprint-2026-10-12.md): finish docs/security/redaction-standard.md
   against the fixture at ursa-major/fixtures/mini/record/. Build on the
   open branch, pull request 190 (ursa-security/2026-10-14-message); do
   not start a new one. It has been idle since 2026-10-14 ~16:05 UTC, is
   still a draft with its findings unfilled, is CONFLICTING against main,
   and the sprint milestone is 2026-10-18. Incident 13 (the allowed_bots
   gap that killed every prior dispatch to this seat) closed when PR #192
   merged 2026-10-16 14:16:58Z; this dispatch is the first test of that fix.'
   ```

   **Result: failed before a run was even created.**
   `HTTP 403: Resource not accessible by integration` on
   `.../actions/workflows/.../dispatches`. This is not Incident 13
   recurring (that dies inside a started run, seconds after it starts;
   this died before any run was created at all). It is the separate,
   already-open finding in `docs/decisions.md` — the ambient
   `GH_TOKEN`/`GITHUB_TOKEN` in this run's own environment is the Claude
   Code action's own installation token (confirmed: the same token
   403s plain `gh api user` too), `OVERRIDE_GITHUB_TOKEN` (this run's
   name for §11.5's `DEFAULT_WORKFLOW_TOKEN`) is present as a name and
   empty as a value, and `tools/gh-actions.sh` still does not exist in
   this repo. Counts as this seat's one dispatch for the day under the
   three-a-day ceiling, per the 2026-10-12 precedent for an
   infrastructure-cause failure: no rerun, no second attempt.

## Proposed, not fired this run

Nothing else met the bar. Frontend has no live stalled branch; no ADR
merged since the last pass names a seat with no run following; no
milestone besides the sprint's own 2026-10-18 date is within three
days with open items beyond item 3 above.

## Failed-run triage this run (§11.7)

One failure in the last 24 hours:
[38760984649](https://github.com/alexandrapaiz/Ursa/actions/runs/38760984649)
(`pm-agent`, scheduled, 2026-10-15 ~15:30 UTC). Already triaged by two
later passes (2026-10-15 ~18:28 and 2026-10-16 ~12:21 UTC notes) as a
tripwire false alarm: the run's own standup PR (#197) exists and merged
minutes before the "No-ship tripwire" step read a stale state and
failed. Not re-explaining it a third time; no rerun, consistent with
§11.7 rule 4 (never rerun a run older than 24 hours or already
classified).

## What this seat is still not chasing further

The token-scope wall above is HQ's machinery
(`.github/workflows`, `standards/pm.md` §15 "who owns what"), not this
seat's writable surface. Handed to `alexandra-systems/exo-centralizer`
on the board this pass with the exact 403 and the distinction from
Incident 13, so the next fix targets the right gap instead of
re-proving the one that's already closed.
