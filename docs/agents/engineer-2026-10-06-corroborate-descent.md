# Engineer run log — 2026-10-06 (second dispatch): corroborated descent

Opened before the work, per L-E3 (open the pull request first, then
build). Appended to as the run proceeds; if the run dies early, what is
written here is what survived.

## Observe (done before this commit)

- **A second engineer dispatch landed on the same calendar day.** PR
  #107 (`engineer/2026-10-06-excerpt-grounding`) was opened at
  00:26Z today by the first run of this seat and is still open. The
  charter's "one PR per day, maximum" is a cap on a run's output, and
  this run's dispatch instruction says to open exactly one pull
  request, so this run ships one PR and names the duplication rather
  than ending silently with work in the sandbox.
- **A newer sprint exists, unmerged.** PR #108
  (`pm/sprint-2026-10-05`) opens
  `docs/sprints/sprint-2026-10-05.md`, which supersedes the drafts in
  #34 and #93. `main` still carries only
  `docs/sprints/sprint-2026-09-21.md`, 15 days old and with every
  engineer item built. So the first run today had no startable sprint
  item and fell back to the ledger; by the time this run started, the
  newer sprint's text was readable on `origin/pm/sprint-2026-10-05`.
- **That sprint's item 1 is PR #107 and its item 2 is unstarted.**
  Item 2 is "Stop labelling similarity as descent", engineer, serving
  O1 KR1.1, and its first step is written out in full in the ledger
  entry it continues (docs/ideas.md, 2026-10-02). That is this run's
  unit.
- **Base choice.** This branch is cut from
  `engineer/2026-10-06-excerpt-grounding`, not from `main`, so #107's
  content is an ancestor here. Reason: both PRs append to
  `docs/ideas.md`, the ledger union driver is registered per clone by
  `tools/ledger/install-driver.sh` and therefore does not run on
  GitHub's merge, and two main-based PRs appending to the same file
  would conflict on the owner's second merge. Expected merge order is
  #107 then this PR, or this PR alone, since it already contains #107.

## Orient

Sprint item 2, taken as written. Not a deviation: it is the first
unfinished engineer item in the newest sprint's order, and item 1 is
already in flight on #107.

## Decide

One unit, shippable in the session: sprint item 2 as the ledger entry
scoped it. An optional `corroborate` hook on `ResolveInput`, a git-side
implementation at the edge, and the test the item names. Not split.

Three things were added beyond the item's letter, each because the work
produced the evidence for it rather than because the scope felt thin:

1. A twelfth invariant, `DESCENT_CHECKED_UNIFORMLY`. The eleventh
   landed this morning on #107, so the gate was the freshest surface in
   the repo, and the demotion is exactly the kind of change that can be
   computed and then not applied.
2. A line in the viewer. A demoted span was rendering a rejected
   candidate at score 0.948 with no account of why, which `CLAUDE.md`
   §2 does not allow.
3. Corroboration left ON by default for every caller of
   `resolveEpisode`, not just `ursa run`. All 396 pre-existing tests
   pass unmodified under it, which is the evidence that made the choice
   safe rather than bold.

## Act — what shipped

- `src/corroborate.ts` (new), `src/pairfinder.ts`
  (`commitsTouchingPath`, `CommitInfo` exported), `src/types.ts`
  (`DescentEvidence`, `FinalSpan.descent`), `src/resolve.ts` (Pass 2),
  `src/bin/ursa.ts` (the edge), `src/invariants.ts` + `.cli.ts` (the
  bound and three measurements), `src/viewer.ts`, `README.md`.
- `src/corroborate.test.ts` (11 cases) and 5 added to
  `src/invariants.test.ts`. `npm test`: 412 passed, 4 skipped, 0 failed.
- `docs/design/corroborated-descent.md`, to the six-element standard.

## The measurement, which is the part worth keeping

`ursa run` over a clone of this repository with all 95 refs fetched, 447
commits, 7 records. Before/after on the same clone, `origin/main`'s
resolver run from a worktree:

| | `survived_mutated` | `no_generation_provenance` | `survived_verbatim` | wall clock |
|---|---|---|---|---|
| `origin/main` | 47 | 451 | 1,074 | 3.918 s |
| this branch | 40 | 458 | 1,074 | 4.418 s |

Seven of 47 mutation labels — 15% — were corrections nobody made. All
seven are in `docs/standards/pm.md`, a file vendored from HQ, and all
seven name the same rival commit `b59add9`, "Re-vendor
docs/standards/pm.md from HQ main @ 683c7dd". One of them was the owner
being credited with changing `/api/items` to `/api/messages` at score
0.948, a change written by HQ in another repository.

`survived_verbatim` is unmoved at 1,074, which is the control: Pass 1 is
not in this change's path and its count must not move.

Verdicts across all seven records: 30 `corroborated`, 7 `rival` (all
`sibling`), 10 `unverified` (all `span_too_short`). No `unreadable_blob`,
no `rival_search_capped`, no `path_history_unreadable`. The invariant
gate reports 0 violations on all seven.

## Findings on the way

1. **A failing test corrected the artifact, not just the code.** The
   first `pre_existing` fixture had the human edit their own
   pre-existing line, and it correctly came back `survived_mutated` —
   the edited line exists in no earlier commit. Pre-existing text that
   survives untouched never reaches Pass 2, because the verbatim pass
   claims it first. The shape that does reach Pass 2 is a restore. The
   doc comment in `types.ts` had been written from the wrong shape and
   is fixed on this branch.
2. **A viewer test passed for the wrong reason.** It asserted the merge
   subject appeared in the HTML, and it did — but via
   `deletion.mergeSubject`, because the merge destroyed branch A's line.
   The demotion actually names branch B's own commit. Rewritten to
   assert the subject the descent verdict carries, which is the only
   version that can fail.
3. **`model` on a source pointer is a git trailer, not a model
   identity.** Real records carry
   `"model": "Claude Fable 5.1 <noreply@anthropic.com>"`, and on the
   author-fallback path the field holds a person's name instead. It is
   the join key for the first of the three properties Ursa Minor sells.
   Ledger entry, 2026-10-06.
4. **`reusedChars` can be negative, and the field says it cannot.** The
   gate printed `(-2 reused)` for record `ursa-probe-2026-10-04-a06ad46`.
   Not a bug in the arithmetic: `CLAIM_NOT_WIDER` permits a verbatim
   span's generation extent to exceed the final span, because
   normalization can map a shorter final run onto a wider generation
   extent, so `verbatimFinalChars - verbatimClaimedChars` is legitimately
   negative. The defect is the field's own doc comment, which says
   "Positive means generated text was reused" and offers no reading for
   a negative value, and the CLI line which prints it as a reuse count.
   Not promoted to the ledger: it is a one-paragraph comment fix plus a
   CLI string, below the size of an entry, and today's three entries are
   already at the charter's cap. Left here so tomorrow's run finds it.
