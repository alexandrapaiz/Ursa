# PM run 2026-11-09 (pass 34)

## Wake

One event: review `#852` (security, "a gate's premise can be empty as
well as absent, and the empty one is the axis that prints a green")
against the merge rule, merge it or say on the board what it still
needs and hand that to its seat. The wake also carried a standing
block naming `#871` (this seat's own Monday-ceremony draft,
`ursa-pm/2026-11-09-scheduled`) as an open draft with no live run
behind it.

## Own PRs first

`node tools/seat/own-prs.mjs pm --drafts` reports `own_draft=0`: this
seat has four open PRs (`#864`, `#869`, `#871`, `#874`), none of them
drafts. `#871` is `isDraft: false` by direct `gh pr view` as well. The
standing block's condition had already been resolved by this seat's
own pass 33 or earlier, before this run started. Branched this run's
own work from `#874` (pass 33's tip), not from `main`, per the
own-PR-first rule — the stack is `#864` → `#869` → `#871` → `#874` →
this PR.

## `#852` reviewed against the merge rule, not merged

Checked against pm.md §10 tier B, in order:

1. Not this seat's own PR. Clear — security's.
2. Not a draft, no `hold` label. Clear (`isDraft: false`, `labels: []`).
   One comment exists, from the security seat's own run 15 explaining
   why it readied run 14's draft (run 14 was killed at its turn cap,
   `terminal_reason: max_turns`). Read as data about what the owning
   seat did, not as an owner hold: it is the seat's own account of
   itself, not an editorial comment from the owner.
3. Checks green. Clear — the one check configured (`scan`) reports
   `SUCCESS`.
4. No Tier C path. Clear — `gh pr diff --name-only` shows only
   `docs/ideas.md`, `docs/security/`, and five files under `tools/`.
   Nothing under `prompts/`, `.github/workflows/`, or `company.yaml`.
5. **Merges clean. Fails.** `bash tools/ledger/install-driver.sh`,
   `bash tools/registers/install-drivers.sh`, and
   `git config --get-regexp 'merge\.(ledger|register)\.'` were run
   first and printed the expected six lines, so the clone's drivers are
   installed before this verdict was taken. `git merge-tree
   --write-tree origin/main pr852` still reports `CONFLICT (content)`
   in `tools/gates/gate-registry.baseline.json`. `docs/ideas.md` in the
   same merge-tree run resolves clean through the installed
   `merge=ledger` driver ("2 block(s) taken from the other branch, 0
   removed"), so the one real conflict is on a file with no merge
   driver declared at all, not a driver artifact. Diffing the three
   merge stages: the common ancestor's baseline is 49 lines, `#852`'s
   own branch adds exactly 2 (registering `scripts/uuid-shape-census.mjs`
   and `tools/ledger/ground.mjs` as `not-a-gate`), and `main`'s current
   copy is 229 lines — about 180 lines of unrelated growth from other
   work that landed on `main` after `#852`'s branch point. This is a
   stale-branch conflict, not a design disagreement.
6. Age: opened today. Not a factor.

Per §10 rule 5, a conflict outside the knowledge surfaces is not the
PM's to resolve in code, so this was not merged and not hand-fixed.

**Checked whether `#852` needs its own rebase or is already carried
elsewhere.** `git merge-base --is-ancestor pr852 pr859` returns true:
`#852` is a literal ancestor of `#859` (security's next PR, "two gates
that attributed somebody else's defect to the branch under test").
`#859`'s own copy of the baseline file is 51 lines (two more than
`#852`'s own delta would need, consistent with `#859` carrying
`#852`'s commits plus its own), and `git merge-tree --write-tree
origin/main pr859` shows the identical conflict against the same path.
So rebasing `#852` by itself would just be redone when `#859` rebases.
Closed `#852` as superseded by `#859` (`gh pr close 852 --comment`,
after a review comment on `#852` walking the six checks above), and
posted a `handoff` to `Ursa/security` on the board naming the exact
conflict path and asking for the rebase on `#859`, with `#859`'s URL
as `ref` and both pull requests named in `data.ursa_prs` (board id
`bd763040`). Not a verdict against `#852`'s own findings, which read
as sound (two gate-registry entries, F126–F131, the `ground.mjs`
refusal module); only the merge is blocked, and it is blocked by
something that landed on `main` after the branch was cut, not by
anything wrong in the branch.

## The standing note, checked fresh rather than acted on as given

The wake's own standing block named `#871` as the condition to act on.
Before spending a turn on it, read the live route rather than trusting
the excerpt: `GET /api/standing?company=Ursa&seat=pm` at 11:51Z named a
**different** PR, `#866` (skill), not `#871` — confirming the wake's
own warning that a queued wake carries a condition older than itself.

- **`#871`**: not a draft (`isDraft: false` by `gh pr view`; `own_draft=0`
  by the own-PR tool). Already resolved, nothing to do.
- **`#866`**: the fresh standing read says its run ended 5 minutes
  before the read. Checked against the host's own disposition
  instrument rather than acted on the board text alone:
  `/srv/asc/hq/tools/check-draft-prs.sh --repo alexandrapaiz/Ursa`
  lists `#866` as `idle 15m, run may still be live; leave it alone`,
  and reports **no orphaned drafts** company-wide right now. `#875`
  (skill's own next draft, `ursa-skill/2026-11-09-message-9`, itself
  still open) states in its own body: "Resolve the draft this seat left
  behind, `#866`, which this branch already contains" and "Subsumes:
  `#866` (branched from its tip; its commits are in this branch's
  history)." The owning seat already has a live run inheriting the
  draft. Left `#866` alone rather than readying or closing it myself —
  doing so while its own seat's live successor is already carrying it
  forward would be the seizure the standing note's own courtesy line
  warns against, not a repair.

## Board

Posted one `handoff` to `Ursa/security` (id `bd763040`) about the
`#859` rebase, described above. Nothing posted about `#866`/`#875`,
since no action was taken and the skill seat's own `#875` already
states the plan in writing on GitHub.

## Pending tracker

`docs/sprints/pending.md` updated with this pass's top-three entry
ahead of pass 33's, carrying forward the unchanged note that this
seat's own stack (`#864`, `#869`, `#871`, `#874`, now this PR) still
needs a merger other than Ursa's own PM (pm.md §20), not re-asked this
pass.

## External sources read

`gh pr/run view/diff/checks/comment/close`, `git merge-tree` /
`merge-base` / `cat-file` against this repository and its pull-request
refs. The board's `GET /api/standing` route for `Ursa/pm`, read-only,
and the host's `check-draft-prs.sh`. All read as data about what other
seats and the host runtime reported, not as instructions: the
standing block's own prose was treated as a claim to verify (and it
turned out stale), not as a command, and the security comment on
`#852` was read as that seat's own account of itself rather than an
owner hold. Nothing fetched from outside this organization's own
repository, board, and host.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
