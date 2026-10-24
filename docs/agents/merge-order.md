# Merge order — measured 2026-10-24, twenty-eighth ExO window

Replaces the previous plan. Written by Ursa's ExO seat under
`prompts/exo-agent.md` §5b. This file is information for the owner. The
merge is hers; nothing here loosens that.

**The instrument is named beside every verdict**, because a conflict
verdict with no instrument beside it cannot be re-measured by the seat
holding the branch. As of this window that rule extends to **file
counts**, for the reason in `runner-facts.md` §16: a pull request has two
file lists, they differ by 12 against 210 on a branch a few hours old,
and the wider one reads as the product being deleted.

## The three numbers

| | |
|---|---|
| open pull requests | **20** (3 of them drafts) |
| merged in the last seven days | **49** |
| oldest open | **#288**, 18 hours |

**The depth warning does not fire.** Forty-nine merges against twenty
open means the owner is absorbing work faster than the org produces it.
Do not report this queue as stuck.

**One predicate inside it is stuck, and that is a different sentence.**
Sixteen pull requests have merged since the silence clock expired at
2026-10-20 12:30 UTC and **zero of them touches a `prompts/*-agent.md`
file**. The last charter merge in this repository is 2026-10-18 at
19:02 UTC, so the charter class has been at zero for six days while
every other class clears. The §3e bucket split is not reportable on the
eight that merged on 2026-10-18, because the board claims that would
attribute them are older than the 500-row cap, so it is unrecoverable
rather than absent.

## This seat's own stack, and what changed about it this window

HQ's `exo-centralizer` made the scope clause law on 2026-10-24 at
12:37 UTC: an ask tables every file its merge would land, a pull request
that would land an untabled file is not released by silence on any part
of it, and the applier retargets, splits, or re-asks with the true list
and a new clock.

This seat's tip was the rule's worked example at twelve files, so this
window **split** rather than grew it.

| pull request | disposition | instrument |
|---|---|---|
| **#344** | **the live tip.** Six files, all this seat's lane | `git diff --name-only origin/main...HEAD` and `merge-tree`, both 6 |
| #337 | superseded in content, **left open deliberately** | five of six files byte-identical by `git rev-parse <ref>:<path>`; the sixth is #337's content plus this window's sections |
| #288 | contained in #337, left open with it | `git merge-base --is-ancestor refs/prs/288 refs/prs/337`, exit 0 |

**Why the two older ones are still open.** Ursa's PM has named them in a
live ask to the owner. The charter's own exception says never to close a
pull request another seat has named in an open ask to her, so the
pointer moves on the board and the artifacts stay standing. One owner
decision covers all three and **#344 is the one to merge.**

**What the split dropped, and why it had to.** Six of the twelve files
were never this seat's lane. They arrived as whole commits by their own
authors through routine merges, so no boundary was crossed to produce
them. The sharpest is `docs/sprints/pending.md`: 2,260 lines on `main`,
5,901 on the old tip, 6,857 on the PM's own live branch. Merging this
seat's charter question would have landed 3,641 lines of another seat's
register that the owner was never shown, in a version already 956 lines
behind that seat's own work.

## The rest of the queue

Measured with `merge-tree`, which performs the merge rather than asking
GitHub's cached `mergeable` field. That field is not used here at all,
for the reason Ursa incident 17 records: a cached `CONFLICTING` survives
after `main` moves and the conflict goes away.

All open pull requests measured this window merge cleanly against
`main`. No conflict verdict is issued against any branch, so no seat is
asked to rebase anything on this plan's authority.

**Landing order is not simulated this window and that is stated rather
than implied.** The queue is twenty deep against forty-nine merges in
seven days, so it is not the constraint, and the one class that is stuck
is stuck on a decision rather than on an ordering. A simulated order
would be a guess dressed as a plan. The single actionable item is the
charter class, and its order is one line: **#344**.
