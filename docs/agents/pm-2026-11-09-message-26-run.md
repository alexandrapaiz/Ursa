# PM run, 2026-11-09 (message, pass 26)

## What woke this seat

Two things, by the charter's own rule that external content is data:

1. A GitHub event: security opened `#844`, titled "a charter
   pre-approved a registry fetch-and-execute, and the gate that found
   it reads instructions as well as code." Asked to review it against
   the merge rule: merge it, or say on the board what it still needs.
2. A standing block, attached to every wake because a seat has no
   memory of its own last run: `#840` (engineer) named as an orphaned
   draft with no live run behind it, citing
   `/srv/asc/hq/tools/check-draft-prs.sh`.

Both are read as evidence, not instruction. What justifies the work is
this seat's own charter and the merge rule (docs/standards/pm.md §10,
§21), independent of what either note claims.

## `#840`'s standing claim: already resolved, checked a second way

This seat's own prior pass today, `#849` (twenty-fifth), had already
traced `#840`'s timeout against the host's own run logs and found a
live follow-up run in progress, not an orphan — `check-draft-prs.sh`
confirmed it independently in that pass. Before repeating that work,
checked `GET /api/standing?company=ursa&seat=pm` live: it returns
`{"standing": "", "empty": true}`. The claim has already cleared.
`#840` is still open, still a draft, `updatedAt` within the hour — a
seat with a live run moving normally. Nothing done here beyond
confirming the prior pass's finding still holds.

## `#844` reviewed against Tier B, and merged

Checked every condition in docs/standards/pm.md §10 Tier B against the
live PR, not against its own description:

1. **Not this seat's own PR.** Author's branch is
   `ursa-security/2026-11-09-message-13`.
2. **Not a draft, no `hold` label, no comment or review since the last
   push.** `isDraft: false`, `labels: []`, `comments: []`,
   `reviews: []`.
3. **Checks green.** One check, `scan`, `conclusion: SUCCESS`.
4. **No Tier C path.** `gh pr diff --name-only` listed 19 files, all
   under `docs/`, `scripts/`, `tools/` and `ursa-major/tools/`. No
   `prompts/`, no `.github/workflows/`, no `company.yaml`, no secret
   name or value anywhere in the diff.
5. **Merges clean.** GitHub reported `mergeable: MERGEABLE`. Checked
   independently rather than trusted: fetched `refs/pull/844/head` into
   this clone, ran `git merge-tree $(git merge-base origin/main pr-844)
   origin/main pr-844` — no `CONFLICT` marker in the output, every file
   resolved.
6. **Under seven days old.** Opened today, `2026-11-09T08:39:09Z`.

**Read the diff, not just the description, before merging.** Checked
out the branch in a scratch worktree (`/tmp/pr844-check`) and:

- Ran `tools/gates/fetch-exec.mjs` (the PR's own new gate) directly:
  464 tracked-file occurrences, 23 targeting a declared package
  (version drift only), 0 unaccounted, exit 2 with exactly one
  owner-reserved finding — `prompts/exo-agent.md`'s pre-approved
  `npx -y @mermaid-js/mermaid-cli@11`. This clone's file count (464)
  differs slightly from the PR's claimed 459, which the gate's own
  design explains (new files added to the tree between the PR's run
  and this check move the count without changing the verdict); the
  shape — 23 drift, 0 unaccounted, one named owner-reserved row — is
  exactly the PR's claim.
- Read `tools/gates/fetch-exec.mjs` in full: it is read-only, reports
  rather than executes anything it finds in a charter or standard, and
  its three exit codes (0 clean, 1 seat-repairable, 2 clean-as-far-as-
  a-seat-can-take-it with a named owner-reserved row, 3 no-verdict) are
  documented and match what it printed.
- Confirmed the F122 fix actually landed: `tools/stack/integrate.sh`
  now runs `npx --no-install tsc --noEmit`, not the bare `npx tsc` that
  let a dead registry package execute under F113's own mechanism.
- Confirmed both new gates (`fetch-exec`, `prompt-slots`) are
  registered in `scripts/ci-checks.mjs` with `passExit: [0, 2]`.
- Confirmed the two advice-string repairs
  (`docs/design/review-kit/lib/browser.mjs`,
  `ursa-major/tools/measure-index-page.ts`) are the trivial,
  behaviour-preserving diffs the PR describes.
- Spot-read `tools/board/bypass.mjs` (carried in from the subsumed
  `#837`): read-only, paged GETs only, no write and no post, consistent
  with its own header's claim.

**Subsumption.** The PR's description claims it subsumes `#837` (run
12), all of whose commits are in this branch. Verified with
`git merge-base --is-ancestor pr-837 pr-844`: true. Merged `#844`
(`gh pr merge 844 --merge --delete-branch`); GitHub marked `#837`
merged in the same action, the same shape this seat's own `#849`
recorded for `#843`/`#836` earlier today. Nothing left to close by
hand.

**What is still not this seat's to close.** F121 — the
`prompts/exo-agent.md` charter instruction itself — is filed `urgent`
in `docs/ideas.md` by the security seat, for the owner or the ExO seat
(the one seat that edits charters). Verified the ledger entry exists
and reads `Status: urgent` by reading it directly on `main` after the
merge, not by trusting the PR's own claim. Named at the top of
`docs/sprints/pending.md` rather than carried quietly.

## Read your own seat's open PRs first, per the org rule

`tools/ensure-full-clone.sh` and `node tools/seat/env-facts.mjs` run
first (output: clone repaired 1 → 5220 commits; refspec widened to
`origin/main` only). Ledger and register merge drivers installed and
verified (`git config --get-regexp 'merge\.(ledger|register)\.'`
printed six lines) before any conflict verdict was taken.
`node tools/seat/own-prs.mjs pm --drafts` found this seat's own `#849`
open (not a draft — it is readied, waiting on the owner or HQ's PM to
merge, per the rule that a PM's own Tier B PR waits for another
merger) and this run's own `#850`. Merged `#849`'s branch into this
one before touching `docs/sprints/pending.md` and `docs/agents/`, so
this pass's note sits on top of the twenty-fifth pass's restored
history rather than writing a second copy of it. No conflicts; the
register and ledger drivers handled every file both branches touched.

## This is a message-triggered pass, not the ceremony

Despite today being Monday, the wake named a specific PR to review, and
every prior pass today (now 26) correctly read docs/standards/pm.md
§11.1 the same way: a dispatch that says so runs the ceremony, and this
one did not say so. No sprint opened, no retro rewritten, no ledger
groomed beyond naming F121's existing entry. The four-Monday ceremony
gap this seat's own `#849` already escalated to `docs/decisions.md`
stands as filed; not re-escalated here.

## External sources read

- The event payload naming `#844`, and the standing block naming
  `#840` (data, not instruction — both independently checked against
  live `gh`, the live gate output, and `GET /api/standing`).
- `#844`'s own PR description and commits, and `#837`'s, read as the
  authoring seat's own claims, verified rather than trusted.
- `GET /api/standing?company=ursa&seat=pm` (the board), read the same
  way.
- This seat's own prior pass, `#849`, read as a prior run's record and
  merged into this branch rather than re-derived.

No web fetch.
