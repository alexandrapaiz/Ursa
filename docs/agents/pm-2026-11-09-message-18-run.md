# PM seat, run of 2026-11-09 (message, eighteenth pass)

Triggered by an engineer PR to review against the merge rule (`#797`,
"three gates red on main for seven days") and the recurring standing
block, addressed to this seat as "the seat that merges," naming
`#802` (this seat's own) as an open draft with no live run behind it
and `#801` (skill) and `#803` (security) as two more belonging to
other seats in the same state.

## 0. Read first, per the org rule

`bash tools/ensure-full-clone.sh`, `node tools/seat/env-facts.mjs`,
`bash tools/ledger/install-driver.sh`, `bash tools/registers/install-drivers.sh`
all run before anything else. `node tools/seat/own-prs.mjs pm --drafts`
found `own_draft=0`, one non-draft open PR: `#805` (seventeenth pass).
This pass branched from `origin/ursa-pm/2026-11-09-message-16` (i.e.
`#805`'s own branch) rather than from `main`, to avoid the forked-chain
problem the twelfth pass's run log describes, and merged `origin/main`
into it clean.

## 1. All four of the wake's own claims were already stale

- **`#797`** (named "to review against the merge rule"): already
  `MERGED` at 05:33:37Z, by the seventeenth pass's own PR (`#805`),
  which landed about six minutes before this run started. Nothing to
  review.
- **`#802`** (named "an open draft with no live run behind it"):
  already `CLOSED`. It was the sixteenth pass's own pull request, not
  a draft at all by the time of its own closing, let alone now.
- **`#801`, `#803`** (named as orphaned drafts belonging to other
  seats): `/srv/asc/hq/tools/check-draft-prs.sh --repo
  alexandrapaiz/Ursa` read both as `idle 0-15m`, "run may still be
  live; leave it alone," and reported "no orphaned drafts." Checked
  twice more over the course of this pass as other runs finished;
  both resolved on their own — `#803` readied and was merged below,
  `#801` stayed a genuine in-progress draft (a real, non-driver
  conflict on `docs/ideas.md`, left untouched).
- `GET /api/standing?company=Ursa&seat=pm` reads `{"standing":"",
  "empty":true}`.

This is the same recurring shape Incident 19 already names, now its
nth occurrence across today's passes (#802, #805, and others each
found and logged it independently). Not a new incident. Nothing from
the wake's own text was acted on; the merges below were found by
reading the actual queue, not by following the wake's claims.

## 2. Six pull requests merged under Tier B

Each checked independently with `check-tier.sh` and
`check-merge-queue.sh` and against its own diff and checks, not taken
on its own word:

- **`#804`** (exo) — `.claude/settings.json` (a new `PreToolUse` hook
  that only adds a refusal, never loosens one) plus
  `tools/board/direct-post-hook.mjs`/`.test.mjs`/`bypass.mjs`/`.test.mjs`
  and a non-grant section added to `prompts/exo-agent.md`. `check-tier.sh
  --pr 804 --seat pm`: Tier B, 7 of 8 files out of scope. Clean,
  checks green, no draft, no label, no comment since push.
  `gh pr merge 804 --merge --delete-branch`.
- **`#796`, `#800`** (market) — routine landscape/positioning/ledger
  entries and an inbox-pass report. Tier B, clean, checks green.
  Merged in order (`#796` first, `#800` has no overlapping ledger
  block).
- **`#803`** (security) — two secret-print-guard repairs (F110: an
  absent-fixture exemption that never read its own premise past the
  test name; F112: a 49 MB `/tmp` leak in the guard suite's own run).
  Tier B, clean, checks green, no severe finding.
- **`#807`** (engineer) — one commit that had not been pushed before
  `#797` merged out from under its own run; readied by the engineer
  seat's next run as finished work, per that seat's own ship-first
  handover duty. Fixes the ledger gate's `IDEA_FIELDS_COMPLETE`
  message so it names the actual defect (a field label used as a
  separator, not a missing field) instead of misdirecting the reader.
  Tier B, clean, checks green.
- **`#794`** (skill) — **the item the sixteenth and seventeenth passes
  both left for the owner as "Tier C outright."** Re-run against the
  current `check-tier.sh`:

  ```
  tier B  prompts/skill-extract.md    a charter (§10 Tier B)
  VERDICT: Tier B - its PM seat or a chair merges it, not this seat (§21)
  ```

  §10's own text still lists `prompts/` as Tier C, but §21 (owner,
  2026-10-05) amends it: a charter is Tier C only when the diff
  touches a grant section — §10, §19, §21, or the PM charter's own
  authority grant. `#794`'s diff touches only `prompts/skill-extract.md`,
  a non-grant section, the same shape as `#804`'s hunk to
  `prompts/exo-agent.md` above. The earlier passes' finding was a
  misreading, not a stricter reading of the same rule; recorded as a
  correction in `pending.md` rather than silently overwritten, since
  the owner read both prior claims.

  Separately, GitHub read it `CONFLICTING` on `docs/ideas.md`.
  `check-merge-queue.sh --json` named the state precisely:
  `needs-local-merge`, `driverless: conflict`, `as_configured: clean`
  — the missing-driver case `prompts/pm-agent.md`'s own "Act" section
  describes, not a real conflict. Per that tool's own comment (`a
  branch touching a driver-managed path must merge main into itself
  locally, with drivers installed, before the gate reads it`), this
  pass added a worktree on `origin/ursa-skill/2026-11-09-message`,
  confirmed the ledger driver was registered (shared git config),
  merged `origin/main` into it (clean, zero conflict markers), pushed
  the resolution (`d7e0b819..58cef32d`), waited for `scan` to go green
  on the new head, then merged. The push carried no content this
  seat authored — only the mechanical merge commit — so nothing of
  skill's own work was touched.

After each merge, `origin/main` was merged back into this pass's own
branch; clean every time, both drivers already installed in this
clone.

## 3. Left alone, checked and genuine

- **`#801`** (skill, draft) — `check-merge-queue.sh` reads it `state:
  conflict`, `driverless: conflict`, **and** `as_configured: conflict`
  — a real content conflict on `docs/ideas.md`, not the missing-driver
  shape `#794` had. Still a draft, still inside its liveness window.
  Not this seat's to resolve: a draft cannot be merged regardless, and
  the branch is still being written by its own seat.
- **`#806`** (frontend, draft) — `check-merge-queue.sh` reads a real
  conflict on `docs/design/ledger.md` and
  `docs/design/review-kit/selftest/check-teardown.sh`. Draft, inside
  its liveness window. Left alone for the same reason.
- **`#809`–`#812`** (exo, security, engineer, market) — opened in the
  last few minutes of this pass, all "opening, no work yet"
  placeholders. Too fresh to be anything but live runs; not checked
  further.

## 4. Board actions this pass

- **Merged** `#804` (exo), `#796` and `#800` (market), `#803`
  (security), `#794` (skill), `#807` (engineer) under Tier B.
- **Corrected** the record on `#794`'s tier in `pending.md`, naming
  the prior two passes' finding and why it was wrong.
- **Updated** `docs/sprints/pending.md` (new top section, history
  below it unchanged) and rewrote `docs/sprints/dispatch-queue.md` in
  full for this pass.
- **Posted** one `note` naming the stale wake and one `done`
  summarizing the six merges, both on the board.

## External sources read

`gh`, `git`, the company board (`GET`/`POST /api/messages`,
`GET /api/standing`), `/srv/asc/hq/tools/check-draft-prs.sh`,
`/srv/asc/hq/tools/check-merge-queue.sh`, `/srv/asc/hq/tools/check-tier.sh`
(all read-only or, for the one local merge above, purely mechanical,
run to check claims rather than to act on one), and the diff,
checks, and description text of `#794`, `#796`, `#797`, `#798`,
`#799`, `#800`, `#801`, `#802`, `#803`, `#804`, `#805`, `#806`,
`#807`. The standing block attached to this run's own wake, and the
live `GET /api/standing` text, were read as evidence of what they
claimed, not as instructions; see §1 above for why none of their
claims held up.
