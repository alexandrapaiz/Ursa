# Merge order — measured 2026-10-18, fifth window, 13:0x UTC

Replaces the fourth window's plan, which was three hours old and already
wrong in five of its eleven rows. This file is information for whoever
merges, under `docs/standards/pm.md` §21 that is Ursa's PM or any chair.
Measuring the queue and naming the order is this seat's; merging is not.

## The three numbers

| | |
|---|---|
| Open pull requests | **8**, four of them drafts, one of the drafts this run's own (#243) |
| Merged in the last seven days | **53** |
| Age of the oldest open | **3 days** (#199, opened 2026-10-15) |

Open does not outnumber the last seven days' merges, so the bold warning
that stood for three consecutive runs stays withdrawn for a third week.
The depth went 17 → 37 → 52 → 8 → 11 → 8 across six measurements.

## Read the authorship before reading the depth as good news, and read it in three buckets

**The fourth window's split was wrong and this is the correction.** It
reported forty-three merges by the owner against nine by the PM and
graded autonomy the weakest attribute on that. On the resident host the
token is the owner's own account, so `mergedBy.login` reports the
credential and not the decider
(`INC-2026-10-18-host-token-is-the-owner`). Joined against the board,
where every PM merge is a `done` carrying its pull request:

```
seat on Actions, app/claude, certain                     9
seat on the host, PM's explicit board claim, certain      8
seat on the host, PM claim that omitted the number        1   (#215)
unattributed, merged before the 2026-10-17 boundary      30   (hers or a chair's; the field still separated them)
unattributed, merged after it                             5   (#214 #224 #233 #239 #244)
```

Autonomy is therefore at least seventeen of fifty-three, thirty-two per
cent, and probably eighteen. Not the seventeen per cent reported this
morning. **The useful number for the owner is the last row**: five merges
in two days whose decider this repository cannot name. That row is the
one to drive to zero, and it closes with one line in the PM standard
rather than with anything here.

## Nothing conflicts, measured by performing the merge

```
199  clean      210  clean      225  clean      242  clean      243  clean
```

`git merge-tree --write-tree --name-only origin/main refs/prs/<n>`, every
open pull request, 13:0x UTC. The drafts #236, #240 and #241 are excluded
because GitHub refuses to merge a draft at all; they belong to their own
runs to ready or close.

**#199's three-day conflict is gone, and not by itself.** The fourth
window and this one's own first pass both measured it conflicting on
`docs/ideas.md`. The skill seat merged `main` into its branch at 12:40
UTC and union-merged the ledger, and `main` itself moved only
`docs/standards/lessons.md` in the same period. So the fix was a seat's
work, not drift. Worth stating because Ursa incident 17 is this same
pull request being reported conflicting for three days, and the lesson
there was about the instrument. The lesson here is the other half: a
conflict is a relation between two moving things, so a conflict measured
three hours ago is not a fact about a pull request.

## Containment: one merge closes two

```
242 is contained in 243
```

Verified with `git merge-base --is-ancestor` on an unshallowed clone.
#167, #231 and #234 were the rest of this chain and the PM closed all
three as superseded at 12:38 UTC, correctly, on the same instrument.

## The order

1. **#243** — this seat's fifth window. Closes #242 with it, so #242 does
   not need a separate decision. **It touches `prompts/`, so read its
   bold declaration line first**: it says no authority moves, which under
   the PM's reading makes it Tier B, and under §10's uncorrected list
   makes it Tier C. That question is with the owner until 2026-10-20
   12:30 UTC and this pull request is content to wait.
2. **#225** — the PM's own twenty-third-pass record. Clean.
3. **#210** — the research seat's 2026-10-16 brief. Clean, three days old.
4. **#199** — the skill seat, now clean after its own rebase. Clean.
5. The three drafts, **#236**, **#240** and **#241**, are not merge
   candidates. #240 is the one carrying fifty-four commits on a branch
   whose earlier pull request already merged, which is the near miss in
   `INC-2026-10-18-branch-name-reuse`. Do not delete that branch.

Simulated in that order in a detached worktree off `origin/main`, every
merge clean.

## Branches

**Nothing is deletable this run, and that is the measurement rather than
an omission.** The charter's old one-line duty, "delete the remote
branches whose PRs have merged", named one branch,
`ursa-frontend/2026-10-18-message`. That branch carries merged #227 and
**open #240**, fifty-four commits apart. The predicate is now over pull
requests rather than names and it returns an empty list:

```
$ comm -12 <(git ls-remote --heads origin | sed 's#.*refs/heads/##' | sort) \
           <(gh pr list --state all --limit 400 --json headRefName,state,mergedAt \
             | jq -r 'group_by(.headRefName)[] | select(all(.[]; .mergedAt != null)) | .[0].headRefName' | sort -u)
(no output)
```

Fifty-nine branches belong to pull requests that closed without merging.
Those stay until the owner answers the question Ursa's PM carried for
this seat, or until the silence route carries it at 2026-10-20 12:30 UTC
on the PM's recommendation, which is to leave them alone unless the
closing comment said plainly that nothing in them was needed.
