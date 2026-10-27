# Merge order for the owner — measured 2026-10-27, window 71, queue read 05:32:29Z

Replaced whole each window, by this charter's own instruction, which is
why `tools/registers/registers.json` declares this file `enabled: false`
and why it belongs on exactly one branch at a time.

## The three numbers

| | |
|---|---|
| open pull requests | **12** (read 05:32:29Z) |
| merged in the last 7 days | **116** (read 05:26:52Z) |
| oldest open | #395, created 2026-10-24T21:21:40Z (2d8h) |

**Open does not outnumber the last seven days' merges** — 12 against
116 — so the depth warning this charter requires in bold does not fire.
The gate is absorbing faster than the roster produces, and has been
since mid-October.

**The queue is churning, not sitting, and the read instants above are
load-bearing for that reason.** Four of the twelve were opened in the
twenty-six minutes before this read, and the first pass of this
measurement, taken at 05:32:01Z, held two pull requests whose
`refs/prs/*` did not yet resolve. Twenty-eight seconds and one refetch
later both were clean. A verdict on this queue has a shelf life in
minutes, which is why every row below carries the instrument that
produced it and the instant it was produced.

## What actually conflicts, performed rather than asked

Drivers installed first (`tools/ledger/install-driver.sh`,
`tools/registers/install-drivers.sh`; `git config --get-regexp '^merge\.'`
returns **6** lines here, and empty would be the defect). PR refs
refetched with an explicit destination before any `merge-tree` call, so
an exit of 128 cannot be read as a conflict.

**GitHub's cached field is unusable on this queue and the number is
worth stating.** `mergeable` read at 05:32:47Z returned `UNKNOWN` for
**7 of 12**, including every pull request older than twenty-six minutes.
It is not a conflict instrument here. The merge was performed instead.

Two instruments, agreeing, and the split is the whole value:

| class | count | whose act |
|---|---|---|
| clean both ways | **10** | **the owner's merge** |
| conflicts only because the forge runs no custom merge driver | **1** | the authoring seat's — and it is this seat's own |
| real conflict | **1** | the authoring seat's to rebase |

- **Real conflict:** `#599` (PM), in `docs/sprints/dispatch-queue.md`
  and `docs/sprints/pending.md`. Theirs to rebase under
  `docs/standards/pm.md` §11.3, not a decision owed by the owner. The
  PM has `#609` open and clean as of 05:32, and `#599` is **not**
  contained in it (`git merge-base --is-ancestor refs/prs/599
  refs/prs/609` exits non-zero), so the two are separate bodies of work
  and landing `#609` does not resolve `#599`.
- **Driverless conflict, and it is mine:** `#571` (this seat), in
  `docs/agents/incidents.md` and `docs/agents/learning-log.md`. Every
  conflicting path declares a `merge=register` driver and this
  repository's drivers resolve all of them; GitHub's merge runs in a
  clone that has none. **No action is being taken on it and that is
  deliberate.** `#571` is contained in `#603`
  (`git merge-base --is-ancestor refs/prs/571 refs/prs/603`, exit 0),
  `#603` is clean both ways, and Ursa's PM placed `#571` with the owner
  at 00:23:57Z for a charter path. Merging `main` into a superseded
  branch would move an artifact a sibling seat has promised her would
  not move, to clear a conflict on content that `#603` already carries.
  **The owner's decision on `#603` closes `#571`'s content either way.**

Instrument column, for every row above: `git merge-tree --write-tree
--name-only origin/main refs/prs/<n>` with this repository's drivers
registered, cross-checked against HQ's
`tools/check-merge-queue.sh` run at 05:33Z from the resident host's
checkout at `/srv/asc/repos/alexandra-systems/`. The two agree on all
twelve. HQ's script additionally reports what the forge's driverless
merge will do, which is the only source of the middle row.

## The landing order

Nine of the ten clean-both-ways pull requests are this morning's live
window runs on nine different seats, touching nine different lanes, and
`merge-tree` calls every pair of them clean against `main`. There is no
ordering constraint to simulate between them: any sequence works.

Two notes that are about order rather than about conflict:

1. **`#603` before `#571`.** `#571` is contained in `#603`. Merging
   `#603` first makes `#571` empty and closable with no decision owed;
   merging `#571` first costs a second read of the same work.
2. **`#395` (research, 731 commits behind) is the one row where "clean"
   deserves a second look before the button.** It merges clean and it
   predates 731 commits of movement on `main`, so its *content* may have
   been overtaken even though its *merge* has not. That is a judgement
   about the work and it is the owner's, not a tracking fact. Named here
   so it is not mistaken for a conflict.

## Drafts

Three of the twelve are drafts — `#600` (engineer), `#604` (frontend),
`#608` (skill) — and all three belong to runs that were live at this
read. None is a dead draft and none is this seat's. **This seat has no
open draft**, which is the check its charter requires before a run ends.
