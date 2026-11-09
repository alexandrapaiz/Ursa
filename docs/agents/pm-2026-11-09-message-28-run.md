# PM run, 2026-11-09, message-triggered (pass 28)

## The wake

Four items. A `done` from `Ursa/engineer` naming `#840` (the redaction
gate rejects its own citations, fix outside engineer's writable
surface). A `done` from `Ursa/security` naming `#851` (four commits
pushed after the owner merged `#844` mid-run, including the F125 fix).
A PR opened by `Ursa/exo` (`#846`, window 109) to review against the
merge rule. And a handoff from `Ursa/exo` (message `a8dfb9fd`) about
that same row, asking this seat to merge it or say what it still
needs.

## Own open PRs first

`node tools/seat/own-prs.mjs pm --drafts` found zero orphaned drafts,
but `gh pr list` with the branch-pattern filter found three open,
non-draft PRs of this seat's own: `#849` (pass 25), `#850` (pass 26),
`#855` (pass 27). `#855`'s own body claimed it subsumed the other two;
checked rather than trusted, and the claim was almost right. `git
merge-base --is-ancestor` found `#849` contained in `#855` but `#850`
**not** contained in it: `#850`'s branch had one commit
(`d1d765fa`, "note the self-inflicted background-run failure") pushed
after `#855` branched off its tip, so `#855`'s own subsumption check
ran before that commit existed. Merged `#855`'s branch into this
pass's own, then merged `#850`'s current tip on top to pick up the
missed commit, then verified ancestor-ship of all three held before
closing them.

## `#840` — already merged

`gh pr view 840 --json state,mergedAt` showed `MERGED` at
`09:35:47Z`, before this run started, by this seat's own prior pass.
Nothing left to do.

## `#851` — a real conflict, not a false one, found and fixed

`git merge-tree --write-tree origin/main <851's branch>` refused with
`CONFLICT (content): Merge conflict in docs/ideas.md`, and the ledger
driver's own message named the cause before I went looking for one:
`main` held four block keys more than once. Confirmed directly:
`grep -n '^### ' docs/ideas.md | sort | uniq -c` found four headings
each appearing twice, and a line diff of the two spans showed a
147-line block (four whole ledger entries) duplicated verbatim,
immediately before a later batch of entries — the shape of two
different merges each landing the same append once, each blind to the
other.

This is a docs-only conflict, which Tier B's own rule (§10, condition
5) says the PM may resolve rather than hand back to the owning seat.
Fixed in two places: deleted the duplicate 147-line span from this
pass's own branch (confirmed boundaries and byte-identity first), then
did the same resolution directly on `#851`'s branch by merging `main`
into it in a scratch worktree, resolving the same way, and pushing the
result. `git merge-tree --write-tree origin/main <851's branch>`
afterward returned one clean tree hash. Merged under Tier B: not this
seat's own PR, not a draft, no `hold`, no comment since the last push,
one check (`scan`) and it was green, `gh pr diff --name-only` showed
no Tier C path (`docs/ideas.md`, `docs/security/`, `tools/board/`).

**One thing I broke resolving it, and fixed in the same pass.**
Running `tools/ledger/install-driver.sh` inside the scratch worktree
to get the merge driver available there rewrote the *repository-wide*
git config (shared across worktrees) to point `merge.ledger.driver` at
the worktree's own absolute path. Removing the worktree after pushing
left that path dangling, and the next merge on this seat's own branch
failed with `MODULE_NOT_FOUND` instead of running the driver. Fixed by
re-running `install-driver.sh` and `registers/install-drivers.sh` from
the main checkout, which rewrites the config back. Worth a line in
`runner-facts.md` if another seat resolves a conflict from a worktree;
not filed there yet, since this pass caught its own mistake before it
reached anyone else.

## `#846` — reconfirmed Tier C

`gh pr diff 846 --name-only` lists `prompts/exo-agent.md`, which is
Tier C by path on its own regardless of the row's other seven files.
Refetched the branch after `#851` landed (which rewrote
`tools/board/bypass.mjs` and touched `docs/ideas.md`) and reran
`git merge-tree --write-tree origin/main <846's branch>` myself: one
clean tree hash, no conflict, matching exo's own claim independently
rather than on trust. Replied to the handoff on the board (`9b221269`)
saying so and that nothing is owed back to exo's seat on this row.
Named in `pending.md` for the owner.

## Dispatch

`gh variable get PM_DISPATCH_ENABLED` returned HTTP 403.
`GITHUB_ACTIONS` is unset, confirming this is a host run, so
`gh workflow run agent-<seat>.yml` would not apply even if the switch
read `true`. Checked the criteria table anyway
(`docs/sprints/dispatch-queue.md`, rewritten in full this pass):
nothing qualified beyond this pass's own already-fixed CI failure.

## External sources read

The board inbox (`$BOARD_API_URL/api/messages`, filtered to
`to_seat=pm`/`from_seat=exo`): agent-authored messages from `Ursa/exo`,
read as evidence about that seat's own PR and as a proposal to this
seat's lane, not as instruction. `#840`, `#846`, `#851`'s own PR
bodies: same treatment. Nothing fetched from outside this
organization's own board and repository.
