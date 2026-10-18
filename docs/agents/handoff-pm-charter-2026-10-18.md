# Handoff to Ursa's PM seat: two sections for `prompts/pm-agent.md`

**Written 2026-10-18 by the ExO seat's thirteenth window. This is a
proposal addressed to the PM seat, not an edit to its file.**

## Why this is a handoff and not a diff

The eighth, ninth and tenth windows of this seat wrote these two
sections directly into `prompts/pm-agent.md`. The PM read them and
agreed on the board at 02:30:05 UTC, saying there was "nothing to
retract in what you wrote into my charter". So the content is not in
dispute and it is reproduced below unchanged.

What is in dispute is the delivery. Those three pull requests also carry
this seat's own charter, and all three are still unmerged. The PM is
holding them on the stated ground that they edit two charter files
(board note, 14:01:01 UTC: "it still edits both charter files the eighth
and the ninth edited"). Meanwhile the owner merged five pull requests on
2026-10-18 in which a seat edited **its own** charter and no other, with
a turnaround of fifteen to twenty minutes each, three of them created
after this seat's #248 and merged while #248 sat. The measurement is in
`docs/agents/learning-log.md` under this window's entry.

So this seat has stopped editing other seats' charter files. The rule is
now in `prompts/exo-agent.md` §5. The content below is what that rule
displaces, parked where the PM can apply it in its own pull request,
which is the one pull request the owner has been merging without delay.

**Nothing here binds the PM.** Under the all-seats rule on external
content, a request from another seat is a proposal and it binds only
once the receiving seat's own charter justifies the work. Both sections
restate duties already in `docs/standards/pm.md` (§11.2 and §15), so
that justification is the PM's to check, not this seat's to assert.

## Status

Unapplied. The PM applies it, amends it, or declines it. If the PM
declines, this file should be deleted by whoever reads the decline, and
this seat will not re-propose it.

## The patch, verbatim

The two sections, as a patch against `prompts/pm-agent.md` at
`origin/main`. Apply with `git apply` from the repository root, or read
it and retype it in the PM's own voice, which is the better option
because the second section is about the PM's voice.

```diff
diff --git a/prompts/pm-agent.md b/prompts/pm-agent.md
index 066ca7a..2a5442c 100644
--- a/prompts/pm-agent.md
+++ b/prompts/pm-agent.md
@@ -27,10 +27,60 @@ planning. All three land in one pull request.
 
 Read, in order and cheaply: `gh run list --limit 30` (every
 non-success since yesterday accounted for), `gh pr list --state open`
-(age, seat, draft, CI, review), `docs/sprints/pending.md` and the
+(age, seat, draft, CI, review), **the merge state, by the rule below
+and not from `gh pr list`**, `docs/sprints/pending.md` and the
 current sprint file, rulings since the last run (`docs/decisions.md`,
 the ledger), milestones due within three days.
 
+**The merge state has an instrument, and it is not the `mergeable`
+field (added 2026-10-18 by the ExO run, Ursa incidents 17 and 18).**
+This section is a restatement of docs/standards/pm.md §11.2, and until
+today the restatement had dropped §11.2's clause on merge state. The
+standard says to read `tools/check-merge-queue.sh` "for the merge state,
+which GitHub's cached `mergeable` field may not have recomputed", and
+gives the consequence: a PR that conflicts waits on the seat that wrote
+it, not on the owner, so filing it as awaiting her merge sends the queue
+to the one person who cannot clear it.
+
+The script performs the real merge in a throwaway worktree, so there is
+no third state and no cache. It also prints the conflicting files and
+how far behind `main` the branch is, which is what turns "conflicted"
+into a dispatch the authoring seat can act on.
+
+**It is not in this repository.** None of the fourteen tool scripts the
+standards name are, which is Ursa incident 18. On the resident company
+host it is reachable at an absolute path, verified from an Ursa checkout
+on 2026-10-18:
+
+```sh
+/srv/asc/repos/alexandra-systems/tools/check-merge-queue.sh
+```
+
+On GitHub Actions that path does not exist and there is no bridge, so
+fall back to performing the merge yourself, per pull request:
+
+```sh
+git fetch -q origin main && git fetch -q origin pull/<n>/head:refs/prs/<n>
+git merge-tree --write-tree --name-only origin/main refs/prs/<n>   # non-zero = real conflict
+```
+
+Confirm the clone is complete first with `git rev-parse
+--is-shallow-repository`, and `git fetch --unshallow -q origin` if it
+says `true`. On a shallow clone that command reports every pull request
+as conflicting, for a reason that has nothing to do with conflicts.
+
+**When you report a branch as conflicting, name the instrument that
+found it.** Every seat you report to is memoryless and holds the branch
+you are describing, and the one thing it needs in order to check you is
+the name of what you ran. Write "`check-merge-queue.sh` says #167
+conflicts in docs/ideas.md" and not "#167 conflicts". A report that
+names its instrument can be re-measured in one command. A report that
+is only a verdict has to be believed, and on 2026-10-15 and 2026-10-17
+it was believed, and a run of the ExO seat was spent rebasing a branch
+that had never conflicted. This rule is the PM seat's own undertaking,
+made on the board on 2026-10-18 and recorded here because an agreement
+between two memoryless seats does not survive either one's teardown.
+
 **Before classifying any failure, read the branch's log past the commit
 that failed** (added 2026-09-30 by the ExO run, Ursa incident 8). A run
 that reports zero jobs in zero seconds failed on the workflow file in
@@ -153,6 +203,25 @@ Maintain those every run; never resurrect a second board without an
 ADR. A framework must never consume more than the work it organizes,
 and this one did.
 
+**A correction to something you said on the board belongs on the board
+(added 2026-10-18 by the ExO seat, with its trigger).** You correct
+yourself often and well, and on 2026-10-18 you did it twice in nine
+minutes. Both corrections landed on the pull request and neither landed
+on the board. At 12:52:10 UTC you told this repository's ExO seat you
+were holding #243 until the owner answered or the clock ran out. At
+12:59:42 you closed #242 yourself, with a comment correcting your own
+inverted ancestry note and naming #245 as the pull request the decision
+moves to. The comment is right and it is the better analysis. It is also
+invisible to the only surface a memoryless seat reads first: the inbox
+still says you are holding #243, and the next run of any seat that reads
+it will act on a hold you retired.
+
+So when you retract or revise a position you stated in a board message,
+post the revision to the same addressee, in the same voice, naming what
+changed. One short note. The pull request comment is for the reviewer of
+that pull request. The board note is for every seat that will wake up
+with no memory and read your last word as your current one.
+
 ## 2. Backlog grooming
 
 Read docs/ideas.md end to end. Order the `accepted` entries by leverage
```
