# Merge order for the owner — replaced each run by Ursa's exo seat

Measured 2026-10-25 at 03:05 UTC, window 41, on an unshallowed clone with
`remote.origin.fetch` widened and **both merge drivers installed**. Read
the one constraint below before the order, because it is the only thing
in this file that changes an outcome.

## The three numbers (§5b)

**7 open, 68 merged in the last seven days, oldest open #395 at
2026-10-24T21:21:40Z, under six hours old.** Merges outrun the open
queue by nearly ten to one, so the depth alarm is not firing. This is
the healthiest reading in this register's history, against 17 open
earlier tonight, 52 on 2026-10-04 and 37 on 2026-09-30. Three of the
seven are drafts of runs that are live this minute.

## The one constraint: merge #418, not #414

#414 and #418 are both this seat's and **#414 is contained in #418**:

```
git merge-base --is-ancestor refs/prs/414 refs/prs/418   # exit 0 = contained
```

**#414 cannot be merged after #417, in any position in any order.** It
carries a 75-line copy of the PM's `## Incident 19`, frozen by this
seat's split of 2026-10-24, while the entry's author has grown it to 182
lines on #417. The two collide on that entry, and #418 is the pull
request that deletes the copy. Measured:

| order | result |
|---|---|
| 395, 412, **417, 418**, 419, 420 | **7 of 7 clean**, and #414 then merges as "Already up to date" |
| 395, 412, 414, 417, … | #417 refuses on `Incident 19` |
| 395, 412, 417, 414, … | #414 refuses on `Incident 19` |

So #414 is not an alternative to #418 and never was: it is contained in
it and it is the member of the pair that conflicts. It is left open
rather than closed because Ursa's PM has named it to the owner in an
open ask, and this seat does not move a pull request another seat has
promised the owner would stay put.

**And note what this says about a verdict that was correct.** The PM
reviewed #414 at 02:47:22 UTC, merged it in a scratch worktree against
current `main` with both drivers installed, got zero conflict markers,
and reported it as waiting only on the owner. Every word of that is
true. `merge-tree origin/main refs/prs/414` still exits 0 at 03:05.
Clean against `main` and mergeable are different claims the moment a
second pull request is in the queue, and only the ordering sweep can
tell them apart. That is the argument for this file existing.

## The order

| | PR | seat | what it is |
|---|---|---|---|
| 1 | #395 | research | the judge-score result crossing from vision into text |
| 2 | #412 | frontend | verify the frozen hover captures (draft, live run) |
| 3 | #417 | pm | tonight's standup, and the author's full `Incident 19` |
| 4 | **#418** | **exo** | **window 41, and it contains #414, #404 and #394** |
| 5 | #419 | skill | write #393's report (draft, live run) |
| 6 | #420 | engineer | hook run (draft, live run) |
| — | #414 | exo | **absorbed by #418. Do not merge it separately.** |

Positions 3 and 4 may be swapped: #418 and #417 merge clean in either
order and `Incident 19` is 182 lines in both outcomes. Everything else
is order-independent, because no other pair touches a shared register
entry.

Four of the seven touch a driver-managed file, which is why the
installers are the first thing this file asks for: #413's successor
#420, #417, #418 and #419 on `docs/ideas.md`, and #414, #417 and #418 on
`docs/agents/incidents.md`.

## Install the drivers before you measure, or the answers are false in both directions

This repository declares two custom merge drivers in `.gitattributes`
and ships both installers. **A clone as handed has neither registered**,
and `git config --get-regexp '^merge\.'` comes back empty.

```sh
bash tools/ledger/install-driver.sh
bash tools/registers/install-drivers.sh
git config --get-regexp 'merge\.(ledger|register)\.'   # must print 6 lines
```

Window 40 measured the first direction: four of seventeen pull requests
reported `CONFLICT docs/ideas.md` before the installers and none after,
same commits and same instrument. Window 41 measured the second: once
installed, the `register` driver **refused one merge that git would have
taken**, and it was right to, because the merge would have reverted 107
lines of another seat's postmortem. The same two commands removed four
false conflicts and surfaced one true one.

**Drop the `2>&1` from every `merge-tree` call.** A driver writes its
diagnostic to stderr, correctly, and `2>&1` puts that line where the
tree object identifier was.

**And read the refusal reason before you believe the exit status.** The
driver's unit is the entry and git's is the line, so two edits twelve
lines apart inside one entry are refused on a tree that is **byte
identical** to the clean merge: exit 1 and exit 0 over the same tree
object. The four measured cases, the three exit statuses of a
half-registered driver, and the controls are `runner-facts` §21. The
account of what the refusal caught is
`INC-2026-10-25-a-file-scoped-split-keeps-another-seats-register-entry-and-freezes-it`.

## Pull requests this seat is holding open deliberately

#414, #404 and #394 are all contained in #418 and are **left standing**
on purpose. The PM reviewed #404 at 2026-10-24T23:08:22 and #414 at
2026-10-25T02:47:22, found each clean and unmergeable only for want of
owner authority over `prompts/`, and recorded them as waiting on her.
**The identifier the decision should move to is #418.**
