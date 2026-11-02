# Merge order — measured 2026-11-02 at 01:31:11Z, window 76

Replaced wholesale each window by `prompts/exo-agent.md` §5b. The older
copy is stale by construction, so take the later window's whole file;
`tools/registers/registers.json` declares this register `enabled: false`
for that reason and says so by name.

`origin/main` at `ccb1366f`. Sixteen open pull requests. **Both drivers
registered in the parent clone before any measurement**, path asserted:

```
merge.ledger.driver    node .../tools/ledger/union-merge.mjs   %O %A %B %L %P
merge.register.driver  node .../tools/registers/merge-driver.mjs %O %A %B %L %P
```

**Measuring, not merging.** Everything here is information for the owner
and the PM. This seat never merges, never enables auto-merge, and never
advises a seat to merge its own work.

## The queue, five numbers

| | |
|---|---|
| open now | **16** |
| merged in the last seven days | **81** |
| oldest open | `#395`, 2026-10-24T21:21:40Z, **8.2 days** |
| newest merge | **2026-11-02T01:03:44Z** |
| merges per day | 10-26 **45**, 10-27 **22**, 10-28 **0**, 10-29 **0**, 10-30 **0**, 10-31 **0**, 11-01 **4**, 11-02 **18** |

**Neither predicate fires, and for the first time in five days both
silences are correct.** Open does not outnumber the week's merges, and
the newest merge is minutes rather than days old. The four zero days are
the outage windows 72 and 73 reported, and it has ended: capacity reads
46/0, 52/0, 50/0 and 50/0 attempted over completed for 10-28 to 10-31,
then 114/45 and 54/32. The five classes sum to `attempted` exactly,
54 = 32 + 0 + 0 + 22 + 0.

## Conflict verdicts, with the instrument beside each

Instrument for every row: `git merge-tree --write-tree --name-only
origin/main refs/prs/<n>`, both drivers registered, **no `2>&1`**, and
**branched on the exit code rather than its sign** — 0 clean, 1
conflict, anything else a claim about this clone and not a verdict. Refs
re-fetched at 01:31:11Z, immediately before the census, because §0's
fetch cannot contain an identifier opened after it.

| state | pull requests | instrument |
|---|---|---|
| **clean** | `#395 #615 #618 #631 #633 #636 #638 #639 #640 #641 #642 #643 #644 #645` | `merge-tree`, exit 0 |
| **conflict** | `#601`, `#612` | `merge-tree`, exit 1, files below |
| unresolvable ref | none | `rev-parse --verify` |

**`#601` — twelve files under `skills/`.** Not a judgement anybody owes.
`#601` **is contained in** `#633`, which is clean, so the conflict
resolves by the skill seat closing `#601` as superseded rather than by
anyone merging it.

```
git merge-base --is-ancestor refs/prs/601 refs/prs/633   # exit 0 = contained
```

**`#612` — `docs/agents/merge-order.md` alone.** This file, and the
conflict is correct and by construction: this charter replaces it every
window, so two windows' replacements cannot merge. `#612` **is contained
in** `#618`. It is also the live example of the one-lane rule —
`registers.json` declares this register unmergeable by driver and the
charter says it therefore belongs on exactly one lane, the register
lane, and `#612` is the charter lane carrying it. Nothing to resolve;
the newer copy wins.

## The second measurement: does the repository's own merge agree with the button

Run for every clean pull request whose diff touches a path
`.gitattributes` gives a `merge=` attribute, by performing the merge in a
detached scratch worktree with the drivers registered in the parent
clone. The six managed paths are `docs/ideas.md`,
`docs/agents/incidents.md`, `docs/decisions.md`,
`docs/agents/learning-log.md`, `docs/agents/runner-facts.md` and
`docs/agents/improvements.md`.

| pull request | driver paths in the diff | verdict |
|---|---|---|
| `#615 #631 #633 #638 #640 #643 #644` | `docs/ideas.md` | agrees |
| `#618` | improvements, incidents, learning-log, runner-facts | agrees |
| `#639` | incidents, runner-facts | agrees |

**No `drivers-disagree` row this pass**, so no seat owes a judgement on a
block the button would combine by line position. Nine of nine agree.

## Containment, so the queue is shorter than its count

| contained | in | instrument |
|---|---|---|
| `#612` | `#618` | `merge-base --is-ancestor`, exit 0 |
| `#601` | `#633` | `merge-base --is-ancestor`, exit 0 |
| `#601` | `#638` | `merge-base --is-ancestor`, exit 0 |
| `#633` | `#638` | `merge-base --is-ancestor`, exit 0 |

So sixteen identifiers are **thirteen decisions**, and two of the three
absorbed ones belong to the skill seat's own chain.

## The order, and who each step is for

Simulated by performing these merges in sequence in a detached scratch
worktree against `origin/main`, not reasoned about. Steps 1 to 4 are the
PM's under Tier B; step 5 is the owner's alone.

1. **`#639`** — this window's register half. No `prompts/` path, so Tier
   B. Clears the trunk's only genuine broken citation's companion
   finding and repairs the environment register's §25.
2. **`#633`**, then **`#638`** — the skill seat's chain. `#633` is the
   one merge that clears the **only genuine broken citation on `main`**:
   two rows of `docs/ideas.md` cite an incident identifier that no
   longer exists, and `#633` carries the live slug twice and the dead one
   zero times, verified on the branch. `#638` contains `#633`, so
   merging `#638` alone also does it.
3. **`#601` closed, not merged** — contained in both of the above. The
   skill seat's to close, with the ancestry command in the comment.
4. **`#615 #631 #640 #641 #643`** — the engineer, PM and market seats'
   clean Tier B work, any order.
5. **`#618`** — the owner's, and the only step that is. Eleven charters,
   6,798 written and unmerged charter lines, and `#612` contained in it,
   so one decision covers both. **It carries a pre-merge repair named in
   `INC-2026-11-02-grep-on-this-host-is-ugrep-and-its-qv-inverts-a-predicate-whose-other-defect-was-hiding-it`:**
   two call sites of a predicate that answers backwards on this host. If
   `#618` merges unrepaired, eleven seats are handed a classifier that
   reports nothing.

## Drafts open with no live run behind them

`#636 #642 #644 #645`, all opened today by the security, frontend and
skill seats and the engineer seat. **None is this seat's** — the only
`exo/` draft tonight was `#639`, readied at 01:1xZ — and the anchored
pattern `^([a-z0-9-]+-)?(exo)/` claims none of them, which is the
pattern working. They are their own seats' to ready or close, and under
the correction of 2026-10-27 this seat does not absorb another seat's
open branch.

## What is not in this file and why

No autonomy grade. HQ's `tools/autonomy.py --repos Ursa --days 7`
returns 81 merges, 46 seat-claimed, 35 unresolved, floor 56.8%, and
**43% unresolved is above the one-third ceiling at which that tool
refuses to report**. So the refusal stands, this is not a grade, and the
35 were already routed by window 75.
