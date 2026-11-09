# PM run, 2026-11-09, message-triggered (sixth pass)

Not Monday's ceremony re-run; the cadence ceremony already landed this
sprint. This is a message-triggered standup-scope pass per docs/standards/pm.md
§11.1, triggered by three events on one wake: engineer's PR #750, exo's
PR #753, and a notification that the engineer seat's run (the same one
behind #750) finished.

## Read first: this seat's own open PRs

`gh pr list --state open ... | test("pm")` returned nothing. No open PM
PR to absorb or resolve. Starting fresh from `main` at `6225f4b`.

## Event 1: #753 (exo) — already resolved before this pass started

`gh pr view 753` shows `state: MERGED`, `mergedAt: 2026-11-09T01:17:15Z`.
This was done by the fifth pass this morning (see
`docs/agents/pm-2026-11-09-message-5-run.md`, item 2: "Exo's read-date
reader (#753) also merged under Tier B"). Nothing left to do on this
event; it is stale by the time this pass read it.

## Event 2 and 3: #750 (engineer) and the engineer run report behind it

Same underlying run, two events. Reviewed `#750` against the Tier B
merge rule (docs/standards/pm.md §10):

1. Not this seat's own PR. Author is the shared service account, seat
   is `engineer` per the title and run log.
2. Not a draft. No `hold` label. No comments, no reviews
   (`gh pr view 750 --json labels,comments,reviews` — all empty).
3. Checks green: one check defined (`redaction-gate` / `scan`),
   `SUCCESS`.
4. `gh pr diff --name-only` (from the file list): `docs/agents/`,
   `docs/design/`, `docs/ideas.md`, `tools/ledger/`,
   `tools/secret-scan.mjs`, `tools/secret-scan.test.mjs`. No Tier C
   path — no `prompts/`, no `company.yaml`, no secrets, no workflow
   file.
5. Merges clean: `gh api .../pulls/750` reports `mergeable: true`,
   `mergeable_state: clean`, confirmed on a fresh poll rather than the
   cached field from the PR view.
6. Same day, well inside seven days.

Tier B holds. Before merging, the PR's own text named an expected
order: its inherited draft `#742` first, because `#750` is "already
mergeable" against it and `#742` is the earlier, independent increment.

## The stale close on #742, caught before acting on it

`#742` (engineer, 2026-11-08, the `ursa corpus` command) carries one
comment, posted by an earlier PM pass at `2026-11-08T23:48:47Z`, closing
it as superseded: no run was live, the branch added nothing beyond its
base. That comment is itself dated, not a status to take on its word.

A commit landed on the branch at `2026-11-09T00:20:30Z`, thirty-three
minutes **after** that comment, which already falsifies the comment's
central claim ("no run is live anywhere right now"). Checked
independently rather than trusting `#750`'s own account of having
"readied, not closed" it:

- `gh pr view 742 --json isDraft` → `false` (un-drafted after the close
  comment).
- `gh pr view 742 --json files` → 12 files, 2,232-line shape matching
  `#750`'s description of the inherited draft exactly (`corpus.ts`,
  `corpus-command.ts`, `corpus.test.ts`, `corpus-sweep.md`, the
  provenance bundle, `README.md`, the ledger, the run log).
- One check, `SUCCESS`.
- `gh api .../pulls/742` → `mergeable: true`, `mergeable_state: clean`,
  stable across three polls three seconds apart.
- No file under `prompts/`, `company.yaml`, secrets, or a workflow —
  `ursa-major/src/*` and `ursa-major/dist/ursa.cjs` are product code,
  Tier B's territory, not Tier C's.

Tier B holds here too, and the close comment is superseded by the push
that followed it, not the other way round. **Merged #742 first**, per
`#750`'s own expected order, then re-verified `#750` clean against the
new trunk and merged it.

## The docs-only conflict between #742 and #750, resolved rather than escalated

Merging `#742` first made `#750` go `dirty` on the next poll, as
expected since both touch `docs/ideas.md`. `gh pr diff --name-only` for
both showed the overlap was `docs/ideas.md` alone — a docs-only
conflict, which Tier B rule 5 lets this seat resolve directly instead
of handing back to the seat.

Caught one thing before resolving it by hand: `tools/ledger/check-attributes.mjs
--clone` warned this clone had never run
`bash tools/registers/install-drivers.sh`, so a plain `git merge` would
have fallen back to the default line merge on `docs/ideas.md` and said
nothing about it — exactly the failure mode `docs/standards/lessons.md`
L-A49 describes, where an append-only merge silently keeps one entry's
heading and the other entry's body. Ran the installer first, then
merged `origin/main` into `#750`'s branch in a worktree with the
`ledger` driver active: clean, `docs/ideas.md` resolved to 508 blocks
(504 on `main` plus `#750`'s four), and `node tools/ledger/check.mjs`
showed the same three pre-existing `STATUS_ALLOWED` warnings
`main` already carried before the merge (confirmed by running the
check against `main`'s own `docs/ideas.md` directly) — nothing this
merge introduced. Pushed the merge commit to `#750`'s branch, waited
for `redaction-gate` to go green on it, confirmed `mergeable: clean`
fresh, then merged.

## Merges this pass

1. `#742` — engineer, `ursa corpus` command. Tier B, merged, branch
   deleted. The 2026-11-08 close comment is void: superseded by a later
   push, not a decision that stands.
2. `#750` — engineer, the ledger's declared-recheck command and the
   `--no-baseline` flag fix. Tier B, merged after `#742` and after
   resolving the `docs/ideas.md` conflict between them, branch deleted.

## The finding inside #750, carried rather than re-litigated

`#750` reports that three of the ledger's `urgent` entries, previously
marked `symptom-cleared`, in fact still `hold` on a full-clone history
scan: an `aws-access-key-id`-shaped blob the baseline already accepts
as a vendor's published example, at
`tools/secret-scan-verdict.test.mjs:72`. The PR's own last line says
clearing `urgent` status is the owner's, not this seat's, so no ledger
status is touched here. Named for the owner's queue below.

`#750` also flags, in its own deviations section, that adding the new
`- Recheck:` ledger field to the standard (`docs/standards/pm.md` §4) is
this seat's surface and HQ's, not engineer's, and that the sprint's
`engineer` lane has been empty for 28 days, both of which belong in the
retro and backlog rather than a standup aside — carried to
`docs/sprints/pending.md` below, acted on at the next ceremony rather
than mid-week.

## Next thing handed to a seat

No seat has an open draft with failing CI or an unanswered review
comment past 24 hours (`#759`, `#758`, `#757`, `#756`, `#752` are the
remaining open PRs, none flagged by that criterion on this read). No
dispatch fires this pass: every seat with standing work already has a
live, unmerged PR of its own, and dispatching into a seat with an open
PR already in flight is the exact case the standard rules out. This
pass's "next thing" is the two §4 items named above, which the
Monday ceremony is the right-sized place to carry, not a new
message-triggered dispatch.

## External sources read

None. Everything above came from `gh`, `git`, and this repository's
committed files.
