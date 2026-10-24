# Merge order — Ursa

Written each run by the exo seat (`prompts/exo-agent.md` §5b). Replaces
the previous plan rather than appending to it. **Measuring the queue and
naming the order is information for the owner; merging is hers alone.**

Every verdict below names the instrument that produced it, because a
conflict verdict with no instrument beside it cannot be re-measured by
the seat holding the branch.

## Measured 2026-10-24, 17:0x UTC, thirty-first exo window

| | |
|---|---|
| open pull requests | **25** |
| of those, drafts | **5** |
| merged in the last seven days | **54** |
| oldest open | **#288**, 2026-10-23T19:08:59Z, about twenty-two hours |
| open that are contained in another open one | **16 of 25** |
| merges that would close all twenty-five | **9** |
| open that conflict with `main` | **none** |

Open does not outnumber the week's merges, so the depth warning does not
fire, and it is not close: fifty-four against twenty-five. The queue
fell from thirty-six to twenty-five in twenty minutes while the number
of decisions in it stayed at nine, which is the gate absorbing stacks
rather than the org slowing down.

## No conflicts with `main`, and the instrument is the reason

Instrument: `git merge-tree --write-tree --name-only origin/main
refs/prs/<n>`, run on an unshallowed clone with a widened refspec (§0),
**after** `bash tools/ledger/install-driver.sh`.

All twenty-five exit 0. That last step is load-bearing rather than
hygienic, and the twenty-ninth window is why: `main` declares
`docs/ideas.md merge=ledger` in `.gitattributes`, a named merge driver
is registered **per clone**, so a fresh host clone holds the declaration
without the driver and git falls back to line hunks with no warning.
Every `docs/ideas.md` conflict verdict published from a fresh clone is a
claim about the clone. This window installed the driver before measuring
and confirms the file's absence from every conflict list below.

## The nine tips, and nothing else needs a decision

Every other open pull request is contained in one of these. Instrument:
`git merge-base --is-ancestor refs/prs/<contained> refs/prs/<tip>`, exit
0 meaning contained, run over every ordered pair of the twenty-five open
heads.

| tip | seat | what it closes with it |
|---|---|---|
| **#290** | engineer | nothing, it stands alone |
| **#337** | exo | #288 |
| **#359** | skill | #316, #320, #348 |
| **#360** | frontend | #342 |
| **#361** | engineer | nothing, it stands alone |
| **#362** | exo | #344 |
| **#366** | research | #322, #325, #330, #333, #335, #338, #340, #345, #351, #358 |
| **#367** | pm | nothing, it stands alone |
| **#368** | engineer | nothing, it stands alone |

Nine decisions, twenty-five pull requests. **#366 alone carries ten of
them.**

#362 closes one rather than two because this window closed **#350**
itself, with the containment proof pasted into its closing comment. That
also removed the queue's only red check; see below.

## Order, and the one pair that still needs a hand

The simulation, because an order that has not been simulated is a guess.
Performed in a detached scratch worktree against `origin/main`, then
discarded:

```bash
git worktree add -q --detach /tmp/wt origin/main
cd /tmp/wt && git merge --no-edit refs/prs/<each tip in turn>
```

1. **#361 before the register-heavy tips.** It carries
   `tools/registers/`, whose driver makes `docs/agents/incidents.md`
   merge between two seats with no human. Landing it first removes the
   one mechanical reason the remaining branches would ever collide.
2. **#337 and #362 still cannot both land unattended, and the reason to
   prefer one is now measured rather than argued.** They are this seat's
   two chains and neither contains the other. `merge-tree` between them
   names six files: this seat's charter and all five of its registers.
   That verdict is correct and the previous two windows and the PM all
   reproduced it.

   **What none of them measured is that #362 is an in-lane superset of
   #337.** Instrument, and it is the third one, because neither of the
   two above can return this:

   ```bash
   base=$(git merge-base refs/prs/337 refs/prs/362)
   for f in $(git diff --name-only "$base" refs/prs/337); do
     n=$(diff <(git show refs/prs/337:"$f") <(git show refs/prs/362:"$f") 2>/dev/null | grep -c '^<')
     [ "$n" = 0 ] || echo "$f: $n line(s) in 337 absent from 362"
   done
   ```

   Lines present in #337's six own-lane files and absent from #362:
   **zero of substance.** Four of the six return 0 exactly. The charter
   returns 16 and `runner-facts.md` returns 2, and all eighteen are text
   #362 deliberately rewrote, being a future-tense paragraph about a
   clock that expired on 2026-10-20 and one restated runner-facts
   sentence. `merge-order.md`, this file, returns 120, and this charter
   instructs every window to replace it, so a line absent from the newer
   copy is the file working as specified.

   So the six-file conflict is **avoidable rather than resolvable**. The
   cheapest disposition is unchanged and its justification is now
   stronger: merge **#362**, close #337 against it, and nothing of this
   seat's is lost. #337's unique content is the sprint and decision
   files it imported from another seat's branch, which is exactly what
   HQ's scope clause says an ask must not land unseen, and which the
   twenty-eighth window dropped on purpose.

   This stays a recommendation and not an act. This seat does not close
   a pull request the PM has named in a live note to the owner, and the
   PM's notes name #288, #337 and #344.

**Why the conflict count was never going to settle this.** This seat's
output is six append-only registers plus its charter, so any two of its
non-ancestor branches appended to the same six tails from a shared base
and `merge-tree` returns six whatever the divergence is. Six is the size
of the file set. The full account is
`INC-2026-10-24-neither-contains-the-other-on-a-pair-where-one-was-redundant`.

## Red checks

**None open.** The dispatch that opened this window named a failed
`redaction-gate` run on this seat's branch, run `40111614477` on
`213f9f87`. That commit is an intermediate push; the thirtieth window
truncated the five full board identifiers in `6cc0018` and this
branch's tip replays clean. The live red was **#350**, which carried the
same five untruncated identifiers and never got the fix, and closing it
as contained in #362 is what cleared it.

## The one class the queue cannot tell you about

**Zero merges of any `prompts/*-agent.md` file since 2026-10-18 at
19:02 UTC**, which is five days and twenty-two hours, measured with the
glob and not the directory since `prompts/skill-extract.md` is not a
charter.

**State this one by date and never by a seven-day window.** The
seven-day query returns **eight** charter merges, #210, #248, #251,
#252, #259, #262, #265 and #266, and every one of them landed on
2026-10-18, five of the eight inside the same minute. So the honest
number and the convenient instrument disagree by exactly the one day
between the last merge and the window's edge, and a window that reads
the seven-day count will find eight charter merges and conclude the
freeze has lifted. This window ran that query, read eight, and nearly
published the opposite of the truth before dating the rows:

```bash
for n in $(gh pr list --state merged --limit 400 --json number,mergedAt     --jq '.[]|select(.mergedAt>"<cutoff>")|.number'); do
  gh pr view $n --json number,mergedAt,files     --jq '[.number,.mergedAt[0:16],([.files[].path]|map(select(test("^prompts/.*-agent\.md$")))|join(","))]|@tsv'
done | awk -F'\t' '$3!=""'
```

The gate is working and one predicate inside it is stuck, which is
`INC-2026-10-18-tier-c-charter-freeze` and the expired silence clock
recorded with it. Four of the nine tips touch no charter at all, so the
freeze is not what is holding the queue.
