# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.

Reconciled 2026-10-08, ~20:15 UTC (message-triggered run, not a
scheduled pass). The event named the skill seat's run `37832775208` as
failed and asked for it to be triaged under the failed-runs rule
(docs/standards/pm.md §11.7). This updates the ~17:50 UTC pass (PR
#138, merged) rather than redoing it; sections not touched by this
pass's findings are carried forward unchanged.

## Top three for the owner

1. **The skill seat's queue has a ready, high-leverage merge and a
   14-day-old charter defect that has never once reached `main`.**
   PR #140 ("consolidate the skill library onto a mergeable base") is
   open, not a draft, green, and `MERGEABLE`: it absorbs four runs of
   stuck work (#14, #50, #64, #83, #123 — see below), fixes a receipt
   that had silently drifted (58 of 117 citations pointed at the wrong
   lines while the checker reported all-clear), and adds a fingerprint
   guard against the drift recurring. Merging it is the single
   highest-leverage action available to the owner on this seat right
   now. Separately, and not fixed by that merge: the charter's "Data
   access" section still tells the skill seat to query a Neon claims
   database Ursa does not have. This has now been found independently
   four times since 2026-09-24 (#14, #50, #64, #140) and every PR that
   carried the finding got stuck unmerged, so it has never reached
   `docs/ideas.md` on `main` at all. `prompts/skill-agent.md` is Tier C
   (owner-merge-only); this pass handed the fix to Ursa's exo seat by
   board message rather than attempting it here, but it has waited 14
   days through the normal route already, which is why it is named to
   the owner directly this pass. Full triage in this PR's description.
2. **Security's redaction-standard item (sprint-2026-10-05's item 3,
   gates O2 KR2.2) still has no open PR touching it.** Unchanged since
   the 17:50 UTC pass: `docs/security/` still does not exist, none of
   security's five open pull requests (#47, #75, #85, #112, #124) touch
   a redaction path, and the §11.4 hard stop still forecloses
   dispatching security fresh onto a sixth open PR that wouldn't move
   the other five.
3. **Three ledger entries are now 20 to 21 days past the two-week
   verdict mark**, unchanged in substance since first flagged: repo
   split (2026-09-18, 20 days), tuning packs (2026-09-19, 19 days), the
   merge-commits/PR-reader finding (2026-09-20, 18 days). Full entries
   in `docs/ideas.md`. Grooming them into the ledger with a verdict is
   Monday's ceremony (2026-10-12), not this pass's.

Milestone "Sprint 2026-10-05" still has zero issues/PRs attached
through GitHub's own milestone field (due 2026-10-11, three days out);
unchanged since the last pass, dropped from the top three this pass
only to make room for item 1, not resolved — see "waiting on an
owner-only action" below.

## Failures this pass (§11.7)

Three failed runs in the last 24 hours (`gh run list --status failure
--created ">=...-24 hours"`). One already triaged in an earlier pass
today and unchanged:

- **`37719675527`** (engineer, this morning): tripwire false alarm, PR
  #134 exists and is merged. No action.

Two new:

- **`37819090675`** (pm-agent, 17:46 UTC, the standup that produced PR
  #138): **tripwire false alarm, a new variant.** `gh run view
  37819090675 --log-failed` shows the model step itself (`Seat run
  (Claude)`) completed successfully; only the "No-ship tripwire" step
  failed, reporting "no commit, no seat branch, no pull request."
  Cross-checked against timing: PR #138 was created at 17:50:13 and
  self-merged (Tier A) at 17:53:45, both inside that same job's model
  step (17:46:05–17:53:58), and the board carries that run's own note
  at 17:52:31 describing exactly that merge. The only way the tripwire
  can report nothing shipped at 17:53:58–59 is if the run's final
  checkout was back on `main` after the self-merge — which the tripwire
  doesn't account for, since it only reads the current `HEAD`, not
  what was pushed and merged earlier in the same session. **No rerun**:
  the work is already merged. Handed off to Ursa's exo seat by board
  message, since `.github/workflows/` is not a product seat's surface
  to edit (pm.md §15); this is a different gap from the already-fixed
  L-E8/L-X7 base-branch-exclusion issue, so it needs its own fix rather
  than assuming the old one covers it.
- **`37832775208`** (skill-agent, 19:32 UTC): **real work, not a
  defect**, same max-turns pattern as the engineer's two runs this
  week. `error_max_turns` at 101 turns, but PR #140 was pushed,
  non-draft and mergeable 28 seconds before the session ended — detail
  above in "Top three" item 1. **No rerun**: rerunning would spend
  turns reproducing work that already exists and ships. One gap the
  run itself didn't reach: its own PR body says #123 was "carried out
  here, then closed with a pointer," but #123 was still open when
  checked (the run died before executing the close). Closed it myself
  this pass with a comment pointing to #140, after checking its diff
  was still just the unchanged ship-first stub (`docs/ideas.md`, 9
  lines, body never rewritten) — nothing lost. Left #50 and #64 open:
  #140 explicitly asks the owner to close those two herself as one
  decision, since they're a judgement about content the skill seat
  reasoned through, not a mechanical cleanup like #123 was.

## Resolved since the last pass (#138, ~17:53 UTC 2026-10-08)

- **#138**: the 17:50 UTC standup's own PR, merged (self-merge, Tier A,
  per its own report). Its reconciliation is carried forward above.
- **#123** (skill): closed this pass with a pointer to #140 — see
  "Failures this pass" above.

## My own open pull requests

This pass's own (#142). Note on branch naming: `ursa-pm/2026-10-08-
message` was already used and closed earlier today by a different
message pass (#135, triaging a different failure). This pass forked
clean from current `main` on the suffixed name
`ursa-pm/2026-10-08-message-skill` per the charter's own instruction
for a name collision, rather than rebuilding on #135's old, already-
superseded tip.

## Everything else open (22 total, including this pass's own #142)

- **Engineer's queue**: #139 (second run of the day, "build-and-test
  gate parked and verified"), not a draft, opened 18:00 UTC. Not
  checked in depth this pass — out of scope for a failed-run triage —
  named here so it isn't lost before the next full pass.
- **Skill**: #140 (new this pass, see "Top three" item 1), #50 and #64
  (open, explicitly left for the owner to close per #140's own
  recommendation — not mechanically fixable by a seat, see above).
  #123 closed this pass; #83 and #14 were already closed before this
  pass.
- **docs/ideas.md append conflicts to expect on merge**: #75 still
  touches it alongside #140 now (#50/#64 also touch it, but are
  pending the owner's close decision above). #134 already landed its
  own append; whichever lands second against it conflicts, expected
  resolution keep-both, as before.
- **In flight from earlier handoffs, untouched this pass**: #124
  (security, rebase the severe-findings PR), #125 (frontend, rebase
  the visual review) — drafts, green, no unanswered review comment.
- **Conflicting, still waiting on the owning seat's rebase**: #103
  (frontend, handed off, #125 is the response), #75 (security, handed
  off, #112/#124 are the response).
- **Draft, idle since 2026-10-05, not failing CI, seat already has a
  newer open PR**: #47, #49, #84, #85, #87, #91.
- **Draft, idle since 2026-10-06, same reasoning**: #112, #113, #114.
- **New today, not yet reviewed by this seat**: #141 (frontend, visual
  review, draft, opened 19:56 UTC).
- **Tier C, waiting on the owner directly**: #39, #48 (both touch
  `prompts/`), #80 (touches `company.yaml`).

Full list, oldest first, is `gh pr list --state open`; not reproduced
line by line since it goes stale by the next pass.

## Waiting on an owner-only action

- `company.yaml` (#80), and #39/#48 under `prompts/`.
- The three ledger entries at "Top three" item 3.
- The `docs/decisions.md` ADR-005/ADR-006 numbering collision (two
  rulings each, 2026-09-23 through 2026-09-25) is still unfixed.
  Outside this seat's writable surface. Checked again this pass:
  unchanged.
- **Milestone "Sprint 2026-10-05" wiring** — unchanged, see above.
- **#50 and #64** (skill): the owner's close-as-one-decision call,
  per #140.
- **The skill charter's Data access section** — handed to exo first
  (board message, this pass); escalated to the owner directly in "Top
  three" item 1 because the normal route has not landed it in 14 days.

## Board message check

Queried `$BOARD_API_URL/api/messages?to_seat=pm&to_company=Ursa`
(query params return other companies' traffic too; filtered
client-side). Newest message addressed to Ursa's pm seat before this
pass's own was this seat's 17:52:31 UTC note about the #138 merge.
Nothing new addressed to pm since. One unrelated engineer note (18:20
UTC, to `alexandra-systems`/pm, a different company's inbox) was read
as evidence of the board's own cross-company query behavior, not
acted on — it isn't addressed to Ursa and isn't this seat's to answer.
