# Merge order — measured 2026-10-24, twenty-seventh ExO window

Replaces the previous plan. Written by Ursa's ExO seat under
`prompts/exo-agent.md` §5b. This file is information for the owner. The
merge is hers; nothing here loosens that.

**The instrument is named beside every verdict**, because a conflict
verdict with no instrument beside it cannot be re-measured by the seat
holding the branch.

## The three numbers

| | |
|---|---|
| open pull requests | **19** (23 before this window closed four of its own as contained) |
| merged in the last seven days | **48** |
| oldest open | **#288**, 2026-10-23 |

**The depth warning does not fire.** Forty-eight merges against nineteen
open means the owner is absorbing work faster than the org produces it.
Do not report this queue as stuck. One predicate inside it is stuck and
that is a different sentence: **zero of the fifteen merges since the
silence clock expired on 2026-10-20 touches a `prompts/*-agent.md`
file**, and the last charter merge here is 2026-10-18 at 19:02 UTC.

## Conflicts against `main`

Instrument: `git merge-tree --write-tree --name-only origin/main
refs/prs/<n>` on an unshallowed clone, run 2026-10-24 ~12:52 UTC. Five
of twenty-three conflicted. GitHub's `mergeable` field read `UNKNOWN`
for twenty-one of twenty-three and is not used here.

| PR | branch | verdict | conflicting files | instrument |
|---|---|---|---|---|
| 290 | `ursa-engineer/2026-10-23-message-3` | CONFLICT | `docs/ideas.md` | `merge-tree` |
| 305 | `ursa-engineer/2026-10-24-message-2` | CONFLICT | `docs/ideas.md` | `merge-tree` |
| 316 | `ursa-skill/2026-10-24-message` | CONFLICT | `docs/ideas.md` | `merge-tree` |
| 320 | `ursa-skill/2026-10-24-message-2` | CONFLICT | `docs/ideas.md` | `merge-tree` |
| 331 | `ursa-skill/2026-10-24-message-4` | CONFLICT | `docs/ideas.md` | `merge-tree` |
| all others | | clean | | `merge-tree` |

**Every conflict in this queue is one file.** Five of five, and it is
`docs/ideas.md`, the append-only ideas ledger. Nobody disagreed about
anything: two seats appended entries to the end and a textual three-way
merge cannot know that two appends are not a disagreement.

This repository already declares `docs/ideas.md merge=ledger` in
`.gitattributes`. The declaration does nothing on the forge, because the
driver behind the name is registered **per clone** by
`tools/ledger/install-driver.sh` and the forge's merge button has no
clone to register it in. HQ holds the instrument that does work on this
shape, `tools/unjam-ledger.sh`, which merges the mainline into the branch
and proves it lost nothing. It is named nowhere in this repository. HQ's
`exo-centralizer` identified that absence as its own distribution failure
at 12:37 UTC on 2026-10-24 and routed it to HQ's project manager.

## Containment

Instrument: `git merge-base --is-ancestor refs/prs/<contained>
refs/prs/<tip>`, exit 0 meaning contained.

All five of this seat's earlier open pull requests are contained in
**#337**:

```
#269 is contained in #337      #302 is contained in #337
#288 is contained in #337      #307 is contained in #337
#318 is contained in #337
```

Four were closed by this window with the proof in each closing comment
and their branches kept. **#288 is deliberately left open**, because the
project manager presented it to the owner at 00:39 UTC as awaiting her,
and moving an artifact a seat has promised the owner would not move costs
more than the queue slot saves.

## The landing order, simulated

Instrument: a **detached** scratch worktree at `origin/main`, merging in
sequence, comparing against `origin/main` and never against `main`.

Eleven of the fourteen clean pull requests merge in sequence with no
resolution at all:

```
288  322  325  327  330  333  335  337  338  340  342
```

**Three fail only in sequence, and that is the finding.** #339, #341 and
#343 are all clean against `main` individually and all three collide once
#337 lands, on `docs/agents/incidents.md`, because this seat and the
project manager both append to that register.

So the order matters and the reason is a register rather than a
disagreement:

1. **#305 first.** It carries the register merge driver, and it is one of
   the five ledger conflicts above, so it needs the ledger resolved by
   hand or by HQ's unjam tool to land at all.
2. Then the eleven above, in the order listed.
3. Then **#339, #341, #343**, which need either the driver registered or
   one hand resolution of `incidents.md` each.

**Tested rather than asserted.** The driver on #305 does resolve the
collision it is aimed at. Running HQ's vendored `merge-register.py` with
the identifier pattern from `tools/registers/registers.json` over the
exact three-way that git refused:

```
base 36 entries, ours 53, theirs 36  ->  exit 0, merged 53
```

Every entry identifier from **both** sides is present in the output, and
a line-level probe of the only edit `theirs` made inside an existing
entry found it present too. So for this case the resolution is lossless
and verified on both sides, not inferred from the exit status.

**The bound on that claim, stated because the next reader will want it.**
The merger resolves by entry identity and guarantees each output entry is
byte-for-byte from one input. The case it cannot blend is an edit made
*inside* an entry by one side only. It did not arise here because this
seat's branch already carried the project manager's commits. It is the
case to re-check before trusting the driver on a different pair.

## What this window did not touch

Nothing in `ursa-major/`, `ursa-minor/`, sprints, OKRs, market docs,
`docs/ideas.md` statuses, `docs/vision.md`, or `docs/standards/`. No
workflow file. The five ledger conflicts above are other seats' branches
and were measured, not resolved.
