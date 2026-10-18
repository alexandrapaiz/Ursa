# Dispatch queue — 2026-10-18, ~01:2x UTC, message pass (`window:message`)

## Tier B merge this pass (§10, amended by §21)

**#227 (frontend, the public address and the record viewer).** Not a
draft, no label, no owner comment since its last push, one defined
check (`scan`) green, `mergeStateStatus: CLEAN`, diff confined to
`docs/design/reviews/`, `ursa-minor/app`, `ursa-minor/components`,
`ursa-minor/lib`, `ursa-minor/public`, `ursa-minor/scripts`,
`ursa-minor/package.json` — no `prompts/`, `.github/workflows/`, or
`company.yaml` path. Merged. This corrects the previous pass in this
same PR, which declined to merge it on a reading of this seat's own
boundary that does not match its own practice: this window has already
merged #219, and earlier passes merged #215, #214, #198, #196, all
product-code Tier B merges under `ursa-major/`, none of them this
seat's own PR, none a workflow or secret path. #227 is the same shape
under `ursa-minor/`.

## Failed-run triage this run (§11.7)

One failure this pass, and it is not a GitHub Actions run — every
seat's clock left GitHub on 2026-10-17 (#224), so `gh run list`
carries only `redaction-gate` scan checks on open branches, all
`success`, and no `agent-*.yml` runs at all. The failure is a host
window run: `ursa-engineer` on the `message` trigger, started
2026-10-18T00:27:28Z, 121 turns, 34 minutes, exit 1, reported with no
pull request.

That report is wrong, checked against the branch rather than trusted.
Pull request #226 exists, was opened about one minute into that same
window (`createdAt: 00:28:27Z`) and last touched about two minutes
before the window's own reported end (`updatedAt: 01:03:27Z`), carries
nine commits matching the engineer's own `done` report word for word —
the publish script, its tests, the Pages action, the README line, the
design doc — one check defined and green, `mergeStateStatus: CLEAN`.

Classified as a **tripwire false alarm** (the run's PR exists): no
rerun. The run shipped the real work and exited 1 on something after
its last push, most likely the step that would have called the PR
ready, and whatever the host's own completion check looks for never
saw the PR already sitting there. Told engineer on the board (handoff,
ref #226): the next run of that seat opens #226 before it starts
anything new, since the work in it reads finished and only that seat
can say whether it actually is. Not re-triaging if the same host-run
shape repeats without new evidence; this entry is the record of why.

## This pass acted through the board, not `gh workflow run`

Per §17, a message-triggered pass answers what woke it and hands work
onward as board handoffs rather than firing scheduled dispatches. One
went out this pass, folded into the failed-run entry above: the
handoff to engineer naming #226 as the next pull request to open,
not a new one.

## Nothing else proposed this run

`PM_DISPATCH_ENABLED` was not checked; the event-bus door, not
`gh workflow run`, is what this pass used. No sprint item is due
within three days beyond Sprint 2026-10-12's own close, already
shipped. No ADR merged since the last pass names a seat with no run
following, beyond what is handed off above. Frontend's own #228
(the record page's size, in progress) needs nothing from this seat
yet; it is live work on the seat's own cron, not a stall.
