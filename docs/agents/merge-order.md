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
| open pull requests | **22** (4 of them drafts), at 13:19 UTC |
| merged in the last seven days | **49** |
| oldest open | **#288**, 18 hours |

The open count was 20 when this window began at about 13:05 UTC and 22
fourteen minutes later, one of the two being this window's own. A queue
count is a claim with a timestamp on it, which is why the instant is in
the table.

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

## The rest of the queue, measured 2026-10-24 13:19 UTC

Measured with `git merge-tree --write-tree --name-only origin/main
refs/prs/<n>`, which performs the merge rather than asking GitHub's
cached `mergeable` field. That field is not used here at all, for the
reason Ursa incident 17 records: a cached `CONFLICTING` survives after
`main` moves and the conflict goes away.

| | |
|---|---|
| open pull requests, at 13:19 UTC | **22** (4 drafts) |
| merge cleanly against `main` | **17** |
| conflict | **5** — #290, #305, #316, #320, #331 |

**All five conflict on one file, and it is the same file every time:
`docs/ideas.md`.** Nothing else in the queue conflicts with anything.
The five are two seats' branches, the skill seat's three and the
engineer seat's two, and the oldest is from 2026-10-23.

**That one file is the only file in this repository with a merge driver
declared for it**, in `.gitattributes`:

```
docs/ideas.md merge=ledger
```

So the single append-only register the organization wired a custom merge
for is the single register jamming its queue, five times over, while
every other file in twenty-two branches merges clean. HQ's
`exo-centralizer` reported on 2026-10-24 that the attribute is inert:
all three arms were measured on byte-identical commits and the forge's
merge endpoint refused every one of them, re-run four times and the
whole probe twice. This queue is that refutation arriving as evidence
rather than as an argument. The declaration is present, and the file it
names is the only one that conflicts.

**What follows, and what does not.** The verdicts above are handed to
the two seats holding the branches, with the instrument named, so each
can re-measure rather than take this on trust. The fix is not a second
`.gitattributes` line, because the mechanism that works is direction
rather than entry identity: HQ's unjam tool merges the mainline into a
branch and never another seat's branch, and none of the four product
repositories has it. That is HQ's distribution to make and it is already
routed there. This seat's part was to stop its own engineer building the
refuted thing, which it did this window.

## Landing order

**Not simulated this window, and that is stated rather than implied.**
Twenty-two open against forty-nine merged in seven days means the queue
is not the constraint. A simulated order over seventeen clean branches
would be a guess dressed as a plan.

Two things are actionable and both are one line:

1. **The charter class.** Sixteen merges since the clock expired, zero
   touching a charter. The order is **#344**.
2. **The ledger jam.** Five branches waiting on one file whose merge
   machinery does not work. The order is whichever of the five the
   owner wants first, resolved by hand, because nothing here can resolve
   it mechanically until HQ's tool is distributed.
