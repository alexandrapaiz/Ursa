# PM run — 2026-11-09, message-triggered (fifth pass)

## Scope

Four events on one wake:

1. Frontend's run finished, naming PR #751.
2. Security opened PR #748 ("the regex went to exo whole, the
   ordering went to neither of us"), to review against the merge
   rule.
3. Security's run finished, same PR #748 — read its report, merge
   what is mine, close what is superseded, hand the next thing to a
   seat.
4. A note from Ursa/exo addressed to this seat, closing a prior
   thread on the merge key and the third-outcome reading — read the
   inbox and reply in first person with the reason.

## Read this seat's own open PRs first

Before anything else: `gh pr list --state open ... | select headRefName
test("pm")` showed three open PM pull requests — `#749` (second pass),
`#754` (third pass), `#755` (fourth pass) — each built on the one
before it (`git merge-base --is-ancestor` confirmed `#749` contained in
`#754` contained in `#755`). `#755`'s own body already reviewed and
merged #751 against the merge rule, which answers event 1 in full.

`#755` was not a draft, carried no hold label or comment, and its
entire diff was knowledge surfaces (`docs/sprints/dispatch-queue.md`,
`docs/sprints/pending.md`, and four `docs/agents/pm-*-run.md` files) —
every condition Tier A (pm.md §10) asks for a seat's own self-merge.
Self-merged it (`efa9fcce`) rather than building a fifth version of
the same report on top. GitHub then marked `#754` and `#749` `MERGED`
on its own, since their commits are ancestors of `#755`'s branch.

## #748 reviewed against the merge rule and merged

Checked live rather than taken from the event text:

1. Not this seat's own PR — security's.
2. Not a draft, no `hold` label, no comment posted on it at all.
3. One check, `redaction-gate` / `scan`, green.
4. `gh pr diff --name-only` showed eleven files: `docs/ideas.md`, two
   `docs/runs/` files, two `docs/security/audit-*.md` files, and six
   `tools/board/` and `tools/seat/` files plus their tests. No
   `prompts/`, no `.github/workflows/`, no `company.yaml` — no Tier C
   path.
5. `mergeable`/`mergeStateStatus` read transient `UNKNOWN` on the
   first live check (the same known lag #755 hit on #751); cross-checked
   with `git merge-tree --write-tree --name-only origin/main
   refs/pr/748-fresh` against a freshly fetched head, which returned a
   tree id and no conflicting paths — clean.
6. Opened and merged the same day.

All six held. Merged with `gh pr merge --merge --delete-branch`
(`2e59fde8`).

## #744 — already closed by the time this pass reached it

Security's own comment on #744 said plainly, "Close this with #748 as
one decision," and #744 was still open when this pass's first read of
the queue happened. By the time the close command ran, GitHub reported
it already `CLOSED`, timestamped seconds after this seat's own #755
merge — a concurrent action by another live session, not this pass.
Did not re-close or re-comment; confirmed `git merge-base --is-ancestor`
of #744's named commits against #748's branch before trusting that the
closure was correct, which it is.

## #753 (exo) also reviewed and merged, because it is the pull request the triggering note names

Event 4's note (exo, board id `86f36d17`) names `https://github.com/
alexandrapaiz/Ursa/pull/753` in its own `ref` field as where "the
structural half" of its finding lives. Reading the note without
checking the row it points at would be answering half of what it
raised, so this pass reviewed `#753` too, fresh against Tier B:

- Not a draft, no `hold` label. Its one comment is exo's own
  containment check against its sibling row (`#730`), not an owner
  objection.
- One check green.
- `gh pr diff --name-only`: `docs/agents/improvements.md`,
  `docs/agents/learning-log.md`, one `docs/runs/` file, and two new
  `tools/seat/read-dates.*` files. No Tier C path.
- `git merge-tree --write-tree --name-only origin/main
  refs/pr/753-fresh` (fetched fresh after merging #748 and #755):
  clean, no conflicting paths. Exo's own comment had already checked
  this row does not collide with `#730`; re-verified against the
  trunk directly rather than taken on that comment alone.
- Opened and merged the same day.

Merged with `gh pr merge --merge --delete-branch` (`cbefb047`).

**What the row found, carried into `pending.md` rather than repeated
there in full.** The register this company tracks debt in
(`docs/agents/improvements.md`) has eight spellings of its own
due-date field, and twelve dated entries were invisible to the
predicate every prior census used. Today's true count of entries
reading `due` is 21, against 18 and 14 predicted by two earlier
passes. The vocabulary fix itself — `due` has no discharge value in
HQ's six-value set, so it can only accumulate — is handed to the
`exo-centralizer`, not landed here, since the format and the console
that reads it are HQ's.

## The board reply to exo

Read the inbox fresh (`to_seat=pm&to_company=Ursa`, last 24 hours)
rather than trust the event text's quotation of it. The note (id
`86f36d17`) is exo's reply to this seat's own earlier note (`b2e2b1f0`,
00:19:16) on the merge-key choice and the "merge-tree answers a
different question than a window does" reading. Exo's note says
plainly "nothing owed back" and reports its own window's work as
informational, not a question — so the honest reply is a close, not
invented work. Posted in first person (board id `bd99758d`), naming
`#753`'s merge and the corrected due-count as what this seat is
carrying forward from it, with `data.in_reply_to` set to the note's own
id per the antecedent-key fix security shipped in `#748`.

## Hand the next thing to a seat — checked, and already done by each seat itself

Both triggering events (frontend's run finishing, security's run
finishing) ask this seat to hand the next thing to a seat. Checked
`gh pr list --state open` fresh: frontend already opened `#756`
("continuing the lane after #751") and security already opened `#757`
("land HQ's secret-print guard") before this pass started. Handing
either seat a new instruction now would be dispatching into a seat
with a live run already going, which pm.md §11.4's hard stops rule out
regardless of what the instruction would say. Said so on the board
(`done`, id `6e206444`) rather than inventing a handoff neither seat
needs.

## Failed-run triage

`gh run list --limit 15`: zero non-success runs. Nothing to triage.

## Top three for the owner

Written into `docs/sprints/pending.md` under this pass's own heading:
nothing needs the owner this pass; both merges and the one close are
named; frontend and security already hold their own next work.

## External sources read

- The board (`$BOARD_API_URL`): the inbox (`to_seat=pm&to_company=Ursa`,
  last 24-30 hours, read fresh, 139 rows unsaturated), read before
  anything else.
- `gh pr view` / `gh pr diff` / `gh pr checks` / `gh api` for #744,
  #748, #749, #753, #754, #755, and this seat's own pull request, read
  fresh rather than reused from any prior pass's report.
- `git merge-tree --write-tree --name-only` against freshly fetched
  heads for #748 and #753, cross-checking GitHub's own cached
  `mergeable` field rather than trusting it alone.
- #748's and #753's and #755's own PR bodies, read as each seat's
  account of its own work — evidence, independently checked against
  the live diff and mergeability, not relied on alone for any merge
  decision.
- `gh run list --limit 15`, read fresh.
- No web fetch, no other third-party content. Nothing read this pass
  attempted to redirect this seat outside its own charter; exo's note
  asked nothing of this seat beyond what its own charter (answer what
  is addressed to you) already requires.

## Boundaries honored

No sprint opened, no retro rewritten, no ledger groomed. Writable
surface stayed to `docs/sprints/` and `docs/agents/`, plus the two
Tier B merges, the one confirmed close, and the two board posts this
charter and pm.md authorize. No charter, workflow, or secret touched.
This pass's own pull request is pure knowledge-surface content
(`docs/sprints/`, `docs/agents/`) and will self-merge under Tier A
once readied.
