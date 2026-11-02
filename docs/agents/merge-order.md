# Merge order for the owner — replaced each window by Ursa's exo seat

**Measured 2026-11-02T04:34:33Z by window 81**, on `origin/main` at
`30d8258c`. Replaces window 79's plan (03:17:11Z, `e9cf564b`), per §5b of
`prompts/exo-agent.md`. Every verdict below names the instrument that
produced it.

Both merge drivers were installed in this clone before any verdict was
taken, and the driver path was asserted against this checkout:
`git config --get-regexp 'merge\.(ledger|register)\.driver' | grep -q "$PWD"`.
`node tools/seat/env-facts.mjs` is **parked in `#618`** and exits
`MODULE_NOT_FOUND` from a `main` checkout, so §0's table could not be
read this window.

## The five queue numbers (§5b)

| | |
|---|---|
| 1. open now | **31** (6 drafts, all opened in the 20 minutes before this read, all with live runs behind them) |
| 2. merged in the last 7 days | **96** |
| 3. oldest open | **#395**, `ursa-research`, 2026-10-24T21:21:40Z — **8.3 days** |
| 4. newest merge | 2026-11-02T04:14:19Z, **20 minutes** before this read |
| 5. merges per day | see below, as seven rows and never a sum |

```
2026-10-23   9
2026-10-24  27
2026-10-25  14
2026-10-26  45
2026-10-27  22
2026-10-28   —   dark
2026-10-29   —   dark
2026-10-30   —   dark
2026-10-31   —   dark
2026-11-01   4
2026-11-02  33
```

**Neither predicate fires.** Open 31 against 96 merged in seven days, so
the org is not out-producing its gate. The newest merge is 20 minutes
old, so the gate is live — which is the predicate that would have fired
on each of the four dark days above and did not exist until window 72
wrote it.

The four dark rows are the outage
`INC-2026-11-01-the-portfolio-completed-zero-runs-for-five-days-and-the-depth-rule-reported-a-healthy-gate-throughout`
— **parked in `#618` and not defined on `main`**, so that citation does
not resolve for a reader of the trunk; see the entry below it —
and they are **over**: the brief reports 195 runs attempted today with
157 finished, 2 refused (1% of the day, none before a first turn).

## Amended at 04:43:00Z, in the same window, because the trunk moved twice under the measurement

**Everything below was measured at `main` = `30d8258c`. `main` is now
`9c3c52dc`.** `#675` — this seat's own other register half — merged at
04:34:58Z and `main` took seven commits while this window was reading.
Three things change, and the third is the finding.

1. **`#680` is now `MERGEABLE` and its driverless merge exits 0.** The
   sentence below saying its verdict "will not clear on its own" is
   **withdrawn**. It was right that staleness could not explain it and
   wrong that nothing could fix it. The skill seat merged `origin/main`
   into its own branch at `8b749f48` and pushed, which is exactly the
   remedy this file prescribes, and the row cleared. That is a positive
   control for the remedy from an independent seat's act rather than
   from this seat's reasoning, and it is better evidence than the
   prediction it refutes.

2. **The `needs-local-merge` class is nine, not ten, and at 04:43 not
   one member's base is `main`'s tip.** Re-measured against
   `9c3c52dc`: `#618 #643 #646 #649 #652 #660 #667 #673` all merge with
   the drivers and all refuse driverless, eight on `docs/ideas.md` and
   `#618` on `learning-log.md` and `runner-facts.md`. Every one has a
   stale base, so every one is explicable by the trunk having moved plus
   the driverless ledger collision, and the one-command remedy is right
   for all of them.

3. **The staleness guard this charter prescribes passed while both of
   its operands were seven commits stale, and that is why this window
   spent four reads concluding GitHub was wrong about a fast-forward.**
   §5b says to read `mergeable`, `mergeStateStatus` and `baseRefOid`
   together and "compare the last against `git rev-parse origin/main`".
   Measured at 04:39:0xZ on this window's own branch: `baseRefOid` was
   `30d8258c`, local `origin/main` was `30d8258c`, the guard agreed, and
   the real `main` was `9c3c52dc`. GitHub was computing against the real
   trunk and reporting `CONFLICTING` **correctly**.

   **Both operands of that comparison come from one fetch generation**,
   so when the clone is stale they are stale together and the guard
   reports health. This charter already names the class — *an
   equality-shaped assertion cannot detect a defect in the environment
   both sides share* — and wrote it about a test three thousand lines
   away from the guard it applies to.

   The right operand has to come off the wire, and the fetch has to
   happen immediately before any verdict you intend to publish:

   ```sh
   git fetch origin --quiet
   wire=$(git ls-remote origin refs/heads/main | cut -f1)
   [ "$(git rev-parse origin/main)" = "$wire" ] || { echo "clone is behind the wire"; exit 1; }
   ```

   **And `headRefOid` is not the head the verdict was computed at.** The
   only field that reports that is the second parent of
   `refs/pull/<n>/merge`, which is written on success and never
   invalidated. Measured at 04:39Z: `#680` and `#673` current, `#618`
   and `#682` stale on the head side while `headRefOid` read correctly
   for all four.

   ```sh
   git fetch -q origin "refs/pull/$n/merge:refs/prm$n" && \
     git log -1 --format='%P' "refs/prm$n"   # 2nd parent != headRefOid means stale
   ```

   The amendment is a `prompts/` path and therefore Tier C, so it is
   **not written on this branch** — this lane is registers only, by the
   one-tier-per-branch rule. It is owed to the charter lane `#618`, and
   the account is
   `INC-2026-11-02-the-staleness-guard-for-a-merge-verdict-compares-two-copies-of-one-fetch-and-agrees-when-both-are-stale`.

4. **The general rule, which is the reusable half.** A conflict verdict
   in this repository has a shelf life measured in minutes, because the
   trunk took 33 merges today. So **a queue census carries the trunk sha
   it was taken at, and a verdict older than the newest merge is
   re-measured rather than quoted.** This file's own header has carried
   an instant since 2026-10-04 and never the sha until this window.

## The headline: ten of thirty-one are waiting on their own author, not on the owner

GitHub's `mergeable` field and the merge this repository's own drivers
perform were read against each other over all 31 open pull requests, at
`main` = `30d8258c`. Then each disagreement was re-measured **driverless**,
by overriding the declared attributes in `.git/info/attributes` and never
the git config, per §5b.

| state (§5b's three, plus the real-conflict row) | count | who owes what |
|---|---|---|
| `ready` — button merges, drivers merge | **19** | the owner, one merge |
| `needs-local-merge` — button refuses, drivers merge | **10** | the **authoring seat**, one local forward merge and a push. No judgement, no owner, **not a rebase.** |
| `drivers-disagree` — button merges, drivers refuse | **0** | nobody today. Stated plainly because this is the dangerous row and window 49 found one in it. |
| both refuse — a real conflict | **2** | `#601` and `#668`, below |

**Every one of the ten is re-derivable and none of them is a stale
cache.** The ten pull requests GitHub calls `CONFLICTING` while the
drivers merge them are **exactly** the ten whose driverless merge
refuses — agreement on **31 of 31**, no exceptions in either direction:

| pull request | seat | driverless conflict path | `baseRefOid` |
|---|---|---|---|
| `#618` | exo | `learning-log.md`, `runner-facts.md` | `aaa98509` |
| `#633` | skill | `docs/ideas.md` | `63524102` |
| `#643` | market | `docs/ideas.md` | `ccb1366f` |
| `#646` | skill | `docs/ideas.md` | `ccb1366f` |
| `#649` | engineer | `docs/ideas.md` | `42da3065` |
| `#652` | skill | `docs/ideas.md` | `383afa21` |
| `#660` | skill | `docs/ideas.md` | `2b32cc6f` |
| `#667` | skill | `docs/ideas.md` | `e9cf564b` |
| `#673` | skill | `docs/ideas.md` | `cdbdcdff` |
| **`#680`** | skill | `docs/ideas.md` | **`30d8258c`** — `main`'s own tip |

`#680`'s base **is** `main`, so its verdict could not be explained by
staleness. **Withdrawn at 04:43:00Z: it cleared when its own seat
forward-merged `main`. See the amendment above.** Controlled both ways on it, same
commits, one minute apart:

```sh
git merge-tree --write-tree --name-only origin/main refs/prs/680   # drivers: exit 0
# with the declared attributes overridden to merge=text:
#   exit 1, CONFLICT (content): docs/ideas.md
```

So the sharper statement, and it is sharper than "the field is
unreliable": **the field never disagreed with the driverless merge.** It
disagrees with *this repository's* merge, because GitHub merges
server-side in a clone that has no drivers registered, which is a
difference of question and not of answer. Window 46 measured "five of
fourteen disagreed, three in each direction" and read that as a
reliability rate; on 31 cases the reliability is 100% against the
question the field actually asks.

**The remedy is routing and it is one command per branch, run by the
seat that owns it:**

```sh
bash tools/ledger/install-driver.sh && bash tools/registers/install-drivers.sh
git config --get-regexp 'merge\.(ledger|register)\.driver' | grep -q "$PWD" || exit 1
git merge --no-edit origin/main && git push
```

After that `baseRefOid` is `main`'s tip, GitHub has nothing left to
merge, and the two instruments cannot disagree because there is no merge
to disagree about.

## The landing order

**Seven of the ten belong to one chain, and merging its tip closes ten
pull requests.** Containment measured with
`git merge-base --is-ancestor refs/prs/<contained> refs/prs/<tip>`, exit
0 meaning contained:

```
#601 ⊂ #633 ⊂ #638 ⊂ #644 ⊂ #646 ⊂ #652 ⊂ #660 ⊂ #667 ⊂ #673 ⊂ #680
```

`#601` is the queue's **only other real conflict** — twelve files, all
inside `skills/`, which no driver manages — and it is already resolved
inside its own descendant. Nobody has to rebase it. So:

| step | act | closes | whose |
|---|---|---|---|
| 1 | **skill merges `origin/main` into `#680`'s branch with the drivers installed and pushes** | — | the skill seat's, not the owner's |
| 2 | merge `#680` | **ten**: `#601 #633 #638 #644 #646 #652 #660 #667 #673 #680` | the owner |
| 3 | merge `#678` | four: `#669 #674 #676 #678` | the owner |
| 4 | merge `#681` | two: `#672 #681` | the owner |
| 5 | the remaining tips, any order, all `ready` | `#395 #631 #640 #651 #665 #666 #675 #677 #679 #683` | the owner |

Step 1 before step 2 is not optional: `#680` is the `main`-based row in
the table above, so the button refuses it today.

Thirteen of the 31 are contained in another open pull request, so the
queue is **18 decisions deep and not 31**.

## The two real conflicts

**`#601`, `ursa-skill`, drivers and driverless both refuse.** Twelve
files, every one under `skills/`, so this is content and not a merge
mechanism. No action: it is contained in `#680` and lands with it.

**`#668`, `ursa-exo`, this seat's own.** Two files, and **the PM's
census named one of them.** Measured at 04:26:57Z with stderr read
separately, which is what separates the two causes:

| file | cause | instrument |
|---|---|---|
| `docs/agents/merge-order.md` | **no driver, by design.** `tools/registers/registers.json` declares it `enabled: false` because this charter replaces it wholesale every window, so two replacements collide on real content. | git's line merge |
| `docs/agents/improvements.md` | **the register driver refused it**: `both sides edited '## Week of 2026-11-02' differently` | `tools/registers/merge-driver.mjs` on stderr |

**Resolved on this window's branch rather than re-proposed beside it.**
This window merged `#668` into its own lane, so `#668` is contained here
and one decision covers both:

- `merge-order.md` — taken from **neither side**. The file this charter
  replaces every window is not a thing to merge, so it was rewritten
  from a fresh measurement over `main` at `30d8258c`. That is this file.
- `improvements.md` — hand-resolved **keeping both sides**. The diff3
  base section was empty, so both sides were pure additions under one
  `## Week of` heading. Verified with the per-entry boundary check §5b
  mandates, against `main`:

  ```
  16c16
  < 594 ## Week of 2026-11-02
  --- 708 ## Week of 2026-11-02
  ```

  One entry, `+114`, which is exactly `#668`'s own `+114/-0` on that
  file. No text moved between entries and no other entry changed.

**And the PM's framing has one correction that changes the remedy.** The
handoff said "two open proposals collide on real content". Measured with
the three-dot form, **exactly one** open pull request proposes a change
to `merge-order.md`, which is `#668`; a two-point
`git diff origin/main refs/prs/<n> -- <file>` reports 23 of them, and 22
of those carry a *stale copy* rather than a proposal. The second party to
the collision is `main` itself, carrying window 79's plan from 03:17:11Z.
That is why "which of the two orders should win" has no useful answer and
a fresh measurement does: neither order was taken, because by 04:34 both
were describing a queue that had moved.

## What this window did not measure

- `tools/seat/env-facts.mjs`, `own-prs.mjs` and `branch-patterns.json`
  are **parked in `#618`** and absent from a `main` checkout, so §0's
  env-facts table and the anchored branch-pattern audit were unavailable.
  That is the fourth tool state this charter names, and it is not a
  routing finding: the tools merge in the same breath as the clauses
  citing them.
- The per-entry boundary check was run on `improvements.md`, which is the
  register this window resolved by hand. It was not run over every open
  branch.
