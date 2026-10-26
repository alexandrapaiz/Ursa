# Merge order — replaced for window 48, 2026-10-26

Measured at 2026-10-26 00:4x–00:5x UTC against `main` at `6bd03363`,
from a clone unshallowed and widened per §0 of `prompts/exo-agent.md`,
with both register merge drivers registered
(`git config --get-regexp 'merge\.(ledger|register)\.'` prints six
lines). Every verdict below names the instrument that produced it,
because a conflict verdict with no instrument beside it cannot be
re-measured by the seat holding the branch.

## The three numbers

| | |
|---|---|
| open pull requests | **12** (6 of them drafts) |
| merged in the last seven days | **54** |
| age of the oldest open | `#395`, opened 2026-10-24T21:21Z, **27 hours** |

Open does not outnumber the week's merges, so the depth warning does not
fire. The owner is absorbing work faster than the org produces it.
**One class of file is the exception and it is the same exception as
four windows ago: zero of the fifty-four merges touched any
`prompts/*-agent.md`, and `main`'s newest charter commit is `94e926b7`
of 2026-10-18.** The gate is working and one predicate inside it has not
moved in eight days.

## Conflicts

Instrument: `git merge-tree --write-tree --name-only origin/main refs/prs/<n>`,
exit status read with the drivers registered and with the §27 caveat
that a non-zero exit is not by itself a conflict verdict.

**All twelve are clean.** `#395 #427 #439 #441 #444 #445 #446 #447 #448
#449 #450 #451`, exit 0 every one.

## Containment

Instrument: `git merge-base --is-ancestor refs/prs/<contained> refs/prs/<tip>`,
exit 0 meaning contained. Stated in the direction that cannot invert.

- `#445` is contained in `#448` (skill)
- `#427` is contained in `#439`, and `#439` is contained in `#446` (security)
- `#427` is contained in `#446` (transitively, checked directly)

So twelve identifiers are **nine decisions**. Merging `#446` closes
three of the security seat's and merging `#448` closes two of the
skill seat's.

## The order, simulated rather than guessed

Performed in a detached scratch worktree at `origin/main`, drivers
registered, `git merge --no-edit` in this sequence. **Nine of nine
merged with no conflict and nothing to resolve by hand:**

```
450  446  448  441  449  451  444  395  447
```

`#450` first because it is the PM's own pass and because it is the only
live route to `main` for
`INC-2026-10-18-board-runtime-token-printed-twice`, whose 48-line entry
is absent from `main` while nine citations across three registers name
it (`docs/agents/improvements.md` 1, `docs/agents/incidents.md` 5,
`docs/agents/learning-log.md` 3). `#443` and `#438` both carried it and
both closed as superseded at 00:36 today, correctly and with the
ancestry pasted; `#450` contains them.

`#447` last because it is this seat's charter half and Tier C, so it
waits on the owner whatever the rest of the queue does. Nothing in the
order depends on it.

## What a seat holding one of these should know

- A `CONFLICTING` or `UNKNOWN` from `gh pr list`'s `mergeable` field
  disagrees with every verdict above, in both directions, and the
  account is
  `INC-2026-10-25-githubs-merge-verdict-is-the-driverless-merge-and-the-drivers-cannot-reach-the-gate`.
  Re-measure with `merge-tree` and the drivers registered before you
  rebase anything.
- If a verdict here contradicts what you measure, yours is the newer
  one. `refs/prs/*` goes stale inside a single window (runner-facts §27).

## Postscript, 00:46–00:53 UTC, written because the queue moved under this file

Dated rather than rewritten, because the difference between a verdict
that was wrong and one that was true and expired calls for opposite
responses, and this one is the second.

Between the sweep above and this paragraph the owner merged four of the
nine: `#446` and `#427` and `#439` (security, 00:44:54 and 00:44:56) and
`#449` (market, 00:46:01). So the order's first three decisions are
discharged and the remainder is `450 448 441 451 444 395 447`.

Re-measured at 00:53: **13 open** (six drafts), **58** merged in the last
seven days, oldest still `#395`. The two new identifiers are this
window's own `#454` and one other seat's.

Four branches were deleted under §5b's predicate after each was checked
individually against `gh pr list` rather than taken from the query:
`ursa-market/2026-10-26-message`, `ursa-security/2026-10-25-hook`,
`ursa-security/2026-10-25-message`, `ursa-security/2026-10-26-message`.
All four had merged in the preceding nine minutes, which is exactly why
the rule says print the list and read it rather than piping it into
`git push --delete`: the same query run twenty minutes earlier would
have named three branches with open pull requests on them.
