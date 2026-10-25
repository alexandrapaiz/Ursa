# Merge order — replaced each window by Ursa's ExO seat

**Measured 2026-10-25 at 23:1xZ by the forty-fourth window**, on an
unshallowed clone with `remote.origin.fetch` widened to all heads (§0)
and **both of this repository's merge drivers registered** before any
verdict was taken:

```sh
bash tools/ledger/install-driver.sh
bash tools/registers/install-drivers.sh
git config --get-regexp 'merge\..*\.driver'   # two lines, or every verdict below is false
```

## The queue

| | |
|---|---|
| open pull requests | **11** |
| merged in the last seven days | **44** |
| oldest open | 2026-10-24T21:21:40Z |

Open does not outnumber the week's merges, so the depth warning does
not fire. The owner is absorbing work faster than the org produces it.

## Conflicts with `main`

Instrument: `git merge-tree --write-tree origin/main refs/prs/<n>`,
drivers registered, **no `2>&1`**, because a driver writes its
diagnostic to stderr and redirecting it puts that line where the tree
object identifier was.

| pull request | branch | verdict | instrument |
|---|---|---|---|
| #395 | ursa-research/2026-10-24-hook-2 | CLEAN | merge-tree, drivers on |
| #418 | ursa-exo/2026-10-25-message | **CONFLICT**, one file | merge-tree, drivers on |
| #423 | ursa-skill/2026-10-25-message-merge | CLEAN | merge-tree, drivers on |
| #424 | ursa-frontend/2026-10-25-message | CLEAN | merge-tree, drivers on |
| #425 | ursa-exo/2026-10-25-message-3 | CLEAN | merge-tree, drivers on |
| #426 | ursa-engineer/2026-10-25-message-2 | CLEAN | merge-tree, drivers on |
| #427 | ursa-security/2026-10-25-hook | CLEAN | merge-tree, drivers on |
| #428 | ursa-engineer/2026-10-25-hook | CLEAN | merge-tree, drivers on |
| #429 | ursa-exo/2026-10-25-hook-2 | CLEAN | merge-tree, drivers on |
| #430 | ursa-market/2026-10-25-message | CLEAN | merge-tree, drivers on |
| #431 | ursa-pm/2026-10-25-hook-2 | CLEAN | merge-tree, drivers on |

**Ten of eleven are clean and there is no ordering constraint between
any of them.** All four register drivers fired on #418 and auto-merged
all four registers; the full stderr is in this window's pull request.

## The one conflict, and it is the file this charter rewrites

#418's only conflicted path is **`docs/agents/merge-order.md`** — this
file. It is declared `enabled: false` **by name with the reason** in
`tools/registers/registers.json`, because this charter replaces it
wholesale each window and an entry-keyed merge would publish two
contradictory merge orders. So the conflict is correct, expected, and
resolved by taking the newer copy:

```sh
git checkout --theirs docs/agents/merge-order.md
```

## The finding the owner should have before she reads #418

**#418's register half is now provably redundant with `main`**, measured
set-wise with heading levels normalised, after #422 merged at
2026-10-25T23:06:36Z:

| file | lines in #418 found nowhere on `main` |
|---|---|
| `docs/agents/incidents.md` | **0** |
| `docs/agents/learning-log.md` | **0** |
| `docs/agents/runner-facts.md` | **0** |
| `docs/agents/improvements.md` | **0** |

So everything in #418 except its two charter files has already landed by
another route. What remains is `prompts/exo-agent.md` (+2,698/-69) and
`prompts/pm-agent.md` (+30/-0), which is Tier C and hers.

**The decision in front of her is now a two-file charter decision**,
where a week ago it was a twelve-file, nine-thousand-line one. That is
the whole of what window 42's split bought, and it is reported rather
than acted on: #418 is named in a standing report to the owner, and the
rule for that case is to post which pull request the decision moves to
and leave the artifact exactly where the PM placed it. **Nothing in
#418 has been touched.**

## Landing order

There is no ordering constraint to simulate. Any of the ten clean pull
requests may land in any order. #418 lands whenever its charter question
is answered, and its one conflict is resolved with the single command
above.

#429 is this window's own and the PM may merge it under §21: it carries
no `prompts/` path, which is the predicate §10's checklist reads.

```sh
gh pr diff 429 --name-only | grep '^prompts/'   # no output
```
