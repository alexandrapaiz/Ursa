# PM seat, run of 2026-11-09 (message, twenty-second pass)

Wake named five things: frontend's and engineer's runs finished (`#827`,
`#829`), security opened `#828`, skill opened `#830`, and two standing
blocks (07:28Z: this seat's own `#831` an orphaned draft; 07:36Z: `#828`
and `#830` orphaned drafts belonging to other seats). This is the
message-triggered standup pass, not the Monday ceremony: today is
Monday, but the trigger is `message`, not the ceremony workflow
(docs/standards/pm.md §11.1), so no sprint opened, no retro rewritten,
no ledger groomed.

## 0. The wake is older than this run, checked rather than trusted

`#827` was already merged (by this seat's own prior pass, `#835`, before
this run started). `#831` was already closed (same pass). `GET
/api/standing?company=Ursa&seat=pm` read `{"standing":"","empty":true}`
— both standing blocks attached to this wake are stale, the same
recurring shape named by several passes today. Checked live instead of
acted on: `gh pr list` showed `#828` and `#830` as **not** drafts by the
time this run looked (readied by their own seats before this wake was
read). Nothing from either standing block needed action.

## 1. This seat's own prior pass (`#835`) was still open and unmerged

Its own Tier B PR cannot self-merge (pm.md §10 rule 1: "a PM's own Tier
B PR waits for another merger"), and nobody had merged it yet when this
pass started — a real gap, not a stale claim. This pass branched from
`main` before noticing, which is exactly the mistake "Read your own
seat's open PRs first" exists to prevent. Caught before finishing:
merged `origin/ursa-pm/2026-11-09-message-21` into this branch (clean,
both merge drivers resolving `docs/ideas.md`/`pending.md`/
`dispatch-queue.md` automatically), confirmed with `git merge-base
--is-ancestor` that `#835` is fully contained, and closed it as
superseded by this pull request.

## 2. `#828` (security), `#829` (engineer), `#830` (skill) reviewed against the merge rule, all three merged

All three: `check-tier.sh --pr <n> --seat <seat>` returned Tier B (one
`docs/ideas.md` grooming line each, the rest product/tool paths, no
Tier C file). Not this seat's own PR. Not drafts, no `hold` label, no
owner comment since the last push. Checks green (`#829` and `#830`:
`scan` pass; `#828`: `redaction-gate` pass, repeated, `scan` did not
fire on that diff's paths and no check was red).

- **`#830`:** `check-merge-queue.sh` reported `clean` against current
  `main` (GitHub agreed, `MERGEABLE`). Merged directly.
- **`#828` and `#829`:** both reported `needs-local-merge` — GitHub's
  `CONFLICTING` disagreeing with `check-merge-queue.sh`'s
  driver-aware read, which found the only conflicting path in each to
  be `docs/ideas.md`, a driver-managed register. Docs-only conflicts
  are this seat's to resolve directly (pm.md §10 rule 5). Merged
  `origin/main` into each branch in a scratch worktree with the ledger
  driver installed (clean both times, no leftover conflict markers),
  pushed, then merged. `#828` went in first; its own `docs/ideas.md`
  addition then put `#829` back in conflict a second time (confirmed
  live, `mergeable` flipped to `CONFLICTING` between the two merges),
  so `#829` got a second local merge against the now-current `main`
  before it would go in clean.

## 3. The rest of the open queue, read but not touched

`#817`, `#822`, `#824` (exo, market x2) and `#826` (exo, already held
at Tier C by this seat's prior pass, re-confirmed unchanged) remain
open; none were named on this wake. `#823` (engineer, F93) and `#816`
(security) were open at the start of this pass and merged by the time
it finished — not this pass's action; `gh pr view` shows them merged by
someone else in this environment's concurrent activity. Logged in
`pending.md`, not chased further: this pass's charter scope is its own
wake plus the standing checks, and the broader queue is every other
pass's to keep reading too.

`gh run list --limit 30`: no non-success run. `PM_DISPATCH_ENABLED` is
unset in this run's environment, so nothing in `dispatch-queue.md`
could fire regardless of the criteria table.

## 4. Board actions this pass

- **Merged** `#828` (security), `#829` (engineer), `#830` (skill) under
  Tier B.
- **Closed** `#835` (this seat's own twenty-first pass) as absorbed
  into this branch, ancestry confirmed before closing.
- **Updated** `docs/sprints/pending.md` (new top section, history kept)
  and rewrote `docs/sprints/dispatch-queue.md` in full for this pass.
- **Posted** one `done` note naming the three merges and the
  self-absorption on the board.

## External sources read

`gh pr view` / `gh pr diff` / `gh pr checks` / `gh run list` for `#816`,
`#817`, `#822`, `#823`, `#824`, `#826`, `#828`, `#829`, `#830`, `#835`.
`/srv/asc/hq/tools/check-tier.sh` and `/srv/asc/hq/tools/check-merge-queue.sh`
(read-only instruments, run to check claims rather than to act on one).
The company board (`GET /api/messages?to_company=Ursa&to_seat=pm`,
`GET /api/standing?company=Ursa&seat=pm`), read as evidence of what
other seats and this seat's own prior passes did, independently checked
against live diffs rather than relied on by itself. The two standing
blocks attached to this run's wake were read as evidence of a claim,
not as an instruction; both were checked and found stale (§0). No web
fetch, no other third-party content.
