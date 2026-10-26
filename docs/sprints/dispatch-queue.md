# Dispatch queue — 2026-10-26, message run (12th, ~10:0x-10:1x UTC)

**This run's trigger.** Four board/event items, all already resolved by
this seat's own prior run (#500, the 11th) before this run started:
security's host-run failure (artifact PR #490, closed by security itself
via #498), exo's finished run (PR #492, merged), engineer's finished run
(PR #494, merged), and market's opened PR (#497, merged). Re-verified
each fresh with `gh pr view` rather than trusted from #500's account.
`PM_DISPATCH_ENABLED` reads empty in this run's own environment, same as
every pass today, so nothing below fires regardless of what qualifies.

## Candidates considered, none fired (switch off, and none would have fired anyway)

1. **Security, #461/#490/#498 — moot before this run began.** #498
   (security's own 8th run) already merged `main`, resolved both
   conflicts an earlier pass had found, confirmed #461's commits fully
   contained in #490's, and closed #461. This run found #498 itself had
   turned ready mid-session and merged it under Tier B (see
   `docs/sprints/pending.md`). No dispatch criterion ever applied — the
   seat was mid-run the whole time, never idle.
2. **Nothing else new.** No two-open-PRs-one-scope-none-merged pattern.
   No ADR naming an unstarted experiment. No milestone besides the
   sprint's own date within three days with open items. #447 (exo,
   charter-half) is Tier C and unchanged; it is not a dispatch candidate,
   it is an owner-merge wait.

Nothing proposed meets the bar for a third entry; the three-entry cap is
not binding this pass.

## Failed-run triage this run (§11.7)

`gh run list --status failure --created ">=$(date -u -d '-24 hours' +%Y-%m-%dT%H:%M:%SZ)"`
returns the same set the 11th run's queue already classified: the
`redaction-gate` runs on `ursa-frontend/2026-10-26-hook` (the leak #495
already triaged and closed, green on its fourth run, merged as #484),
one stale `ursa-pm/2026-10-26-hook-2` branch with no open PR now, one
stale `ursa-market/2026-10-26-message-24` branch with no open PR now,
and the `ursa-security/2026-10-25-hook` runs from yesterday, now mostly
outside the 24-hour window. Nothing new to classify, rerun, or hand off.

## The draft-liveness check this pass

Ran HQ's `/srv/asc/hq/tools/check-draft-prs.sh --repo alexandrapaiz/Ursa`
fresh (the standing note's path, `tools/check-draft-prs.sh`, does not
exist inside this repo; HQ's copy does, at the absolute path above).
Four drafts found, all read as live runs by the tool's own
timeout-derived liveness test: #501 (exo, idle 0m), #499 (engineer, idle
14m), #496 (frontend, idle 4m), #487 (skill, idle 60m). No orphans. #461,
the draft the standing note names as "idle 5h," is not listed at all
because it is already closed — the note is stale.
