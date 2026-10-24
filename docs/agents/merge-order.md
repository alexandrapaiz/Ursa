# Merge order — measured 2026-10-24 01:5x UTC (twenty-first exo window)

Replaces the previous plan, per `prompts/exo-agent.md` §5b. This is
information for the owner. Merging is hers alone, and the PM's Tier B
route under `docs/standards/pm.md` §21 is unaffected by anything here.

## The three numbers

| | |
|---|---|
| open pull requests | **14** |
| merged in the last 7 days | **46** |
| age of the oldest open | #269, opened 2026-10-18T19:16Z, **5 days** |

**The queue is shallower than the week it merged**, 14 against 46, so
the sentence §5b asks for in bold does not fire. That is the second
consecutive window able to say so, after three weeks in which the
opposite was true and the depth ran 17 → 37 → 52.

## The order, simulated

Fourteen open pull requests are **six decisions**, because seats stack
and eleven containment relations hold across the queue.

Verified by performing the merges in sequence in a detached scratch
worktree off `origin/main`, not by asking GitHub. Thirteen of fourteen
merged clean in the order below; the fourteenth is the only conflict in
the queue.

| step | land | instrument | verdict |
|---|---|---|---|
| 1 | **#308** (PM, sixty-seventh pass) | sequential `git merge` in scratch worktree | clean; contains **#306**, which contains **#304** |
| 2 | **#307** (exo, twenty-first window) | sequential `git merge` in scratch worktree | clean; contains **#302** → **#288** → **#269** |
| 3 | **#305** (engineer) | sequential `git merge` in scratch worktree | clean; contains **#296** |
| 4 | **#282** (research) | sequential `git merge` in scratch worktree | clean; contains **#280** |
| 5 | **#303** (frontend), **#290** (engineer), **#293** (skill) | sequential `git merge` in scratch worktree | clean, independent of each other |
| 6 | **#285** (research) | `git merge-tree --write-tree --name-only` **and** sequential merge, both | **CONFLICT**, 54 files |

Merging steps 1 through 5 closes **thirteen** of the fourteen.

## The containment relations, stated in the direction that cannot invert

`#269` is contained in `#288`, which is contained in `#302`, which is
contained in `#307`. `#280` is contained in `#282`. `#296` is contained
in `#305`. `#304` is contained in `#306`, which is contained in `#308`.

```bash
git merge-base --is-ancestor refs/prs/<contained> refs/prs/<tip>   # exit 0 = contained
```

**#288 and #269 are deliberately left open**, against this seat's own
retirement duty. Ursa's PM told the owner at 01:48:58 UTC that #302
"contains pull requests 288 and 269 by ancestry, both carrying the same
charter path, so one owner merge of 302 should settle all three." That
is an open ask naming them, and the charter's first exception forbids
closing a pull request another seat has named in one. The same sentence
now covers #307, which contains all three.

## #285, and the instrument note that matters

#285 is the queue's only conflict and it is not close: 54 files,
including `add/add` collisions on `ursa-minor/components/ui/copy-line.tsx`
and `ursa-minor/lib/record/published-index.ts`. Its merge base with
`origin/main` is `8f3c6ce`, **1008 commits behind**. There is a common
base, so this is staleness and not the unrelated-histories signature the
2026-10-23 public history rewrite could have produced. Ursa's PM
independently measured 1003 commits and handed the pull request back to
the research seat, which is the right destination: a rebase across 1008
commits of two products' source is the owning seat's work and nobody
else's.

**Both instruments were run and they agree on #285.** They did not agree
on #307 and #308 at first: a `merge-tree` sweep taken before re-fetching
`refs/pull/*` reported both as conflicting, because their refs did not
exist in this clone yet and `merge-tree` exits non-zero for a missing
ref exactly as it does for a conflict. One `git fetch origin
'+refs/pull/*/head:refs/prs/*'` later, both are clean. This is the §5b
rule in its narrowest form: a non-zero exit from `merge-tree` is a claim
about your clone until you have checked the clone.
