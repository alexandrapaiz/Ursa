# Merge order for the owner — measured 2026-10-27, window 68, queue read 01:24:05Z

Replaced whole each window, by this charter's own instruction, which is
why `tools/registers/registers.json` declares this file `enabled: false`
and why it belongs on exactly one branch at a time.

## The three numbers

| | |
|---|---|
| open pull requests | **18** (read 01:24:05Z) |
| merged in the last 7 days | **105** |
| oldest open | #395, created 2026-10-24T21:21:40Z (2d4h) |

**Open does not outnumber the last seven days' merges** — 18 against
105 — so the depth warning this charter requires in bold does not fire.
That ratio has inverted since early October, when three consecutive
windows reported 17, 37 and 52 open against single-digit merges. The
gate is absorbing faster than the roster produces.

The queue is also *churning* fast rather than sitting: three of the
eighteen were opened in the four minutes before this read, and none of
the eighteen is older than 2d4h.

## What actually conflicts, performed rather than asked

Drivers installed first (`tools/ledger/install-driver.sh`,
`tools/registers/install-drivers.sh`; `git config --get-regexp '^merge\.'`
returns 6 lines here, and empty would be the defect). No `2>&1` on any
`merge-tree` call. Cross-checked against HQ's `check-merge-queue.sh`
fetched from HQ's `main`, not from the host's checkout.

`git merge-tree` with this repository's drivers registered calls **all
of the queue clean**. HQ's script, which additionally reports what
GitHub's driverless merge will do, splits them three ways:

| class | count | whose act |
|---|---|---|
| clean both ways | 12 | **the owner's merge** |
| conflicts only because the forge runs no custom merge driver | 5 | the authoring seat's: install drivers, merge `main`, push |
| real conflict | 1 | the authoring seat's to rebase |

- **Real conflict:** `#582` (security). Theirs to rebase under
  `docs/standards/pm.md` §11.3, not a decision owed by the owner.
- **Needs a local merge, not a judgement:** `#593` and `#586` (skill),
  `#560` (skill), `#551` (security), `#578` and `#571` (this seat).
  Every conflicting path in these declares a merge driver that this
  repository ships and the forge does not run. **Reporting these to her
  as conflicts dispatches a decision nobody has to make; reporting them
  as waiting on her merge is worse, because the button will refuse.**

This seat's own two are in that list and are discharged rather than
excused: `#588` supersedes both, contains both, and reads `clean
(behind main by 16)` from the same sweep.

## The order

Ordered by what unblocks the most work per act, not by age.

1. **`#576` (pm, clean).** The merging seat's own pass. It records six
   Tier B merges and the ancestry ruling on this seat's chain, so
   merging it first makes the queue's own bookkeeping true before
   anything else moves.
2. **`#588` (this seat, clean).** Eleven charters, and it is the only
   open pull request carrying the anchored branch-pattern repair that
   three seats have now independently verified and deferred to. While it
   is unmerged, six seats' dead-draft sweeps keep the defect, and
   `main`'s `tools/board/post.mjs` keeps attributing every seat's board
   note to the engineer seat. **Five of its twenty-four files are under
   `prompts/`, so it is hers alone under the tier rule.**
3. **`#587`, `#583` (finance, clean), `#584` (market, clean), `#585`,
   `#570`, `#592` (frontend), `#589` (security, clean).** Independent,
   single-lane, no cross-dependency. Any order.
4. **`#395` (research, clean, 680 behind).** Oldest in the queue and
   still clean. It additively edits three charters including the
   engineer's; it does not collide with `#588`, measured this window.
   Worth taking before it drifts further.
5. **Nothing for her on `#582`, `#593`, `#586`, `#560`, `#551`** until
   their seats push a local merge.

## One thing to know before acting on a draft in this queue

`#591`, `#592` and `#593` are drafts opened in the last twelve minutes
by live runs. The standing route named `#591` to Ursa/pm at 01:19:30Z as
a draft with "no live run behind it" and handed it the merge verb. That
was a false positive, measured — `runner-facts` §57a — and the PM was
warned off at 01:20:30Z. **A standing dead-draft condition on a draft
less than two minutes old is not evidence; check the runs route.**
