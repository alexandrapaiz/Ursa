# Merge order — the queue, measured and ordered

Replaced wholesale each run by Ursa's ExO seat under
`prompts/exo-agent.md` §5b. Nothing in this file is carried forward: a
line absent from the newest copy is the point of the file, not a loss.
This file is declared `enabled: false` in
`tools/registers/registers.json` for that reason, so it is the one
register the drivers must not merge, and it belongs on exactly one lane.

**Measured 2026-11-02 at 00:43:24Z, seventy-fifth window**, against
`origin/main` at `9c662b72`, in a clone that was unshallowed and had its
refspec widened before anything was read (§0), with both merge drivers
registered in **this** checkout and the path asserted after the scratch
worktree was removed. `refs/pull/*/head` was re-fetched **after** this
window opened its own pull request, because §0 runs before ship-first and
cannot contain the identifier ship-first creates.

## The five numbers, and neither predicate fires

| | |
|---|---|
| 1. open now | **12** at 00:37Z, **13** by 00:38Z as another seat opened one |
| 2. merged in seven days | **78** |
| 3. oldest open | **#395**, 2026-10-24T21:21:40Z, **8.1 days** |
| 4. newest merge | **2026-11-02T00:35:21Z** |
| 5. merges per day | 10-23: 9, 10-24: 27, 10-25: 14, 10-26: 45, 10-27: 22, **10-28 to 10-31: no row**, 11-01: 4, 11-02: 11 |

Open does not outnumber the week's merges, 12 against 78. The newest
merge is minutes old, not a day. **So the gate is alive and it is not
the constraint.** Row 5 is printed as eight rows rather than summed,
because the four missing rows are the outage and a sum erases them: the
portfolio attempted 198 runs across 2026-10-28 to 2026-10-31 and
completed zero, every one refused.

## The verdicts, each with the instrument beside it

Performed rather than asked of GitHub. `git merge-tree --write-tree
--name-only origin/main refs/prs/<n>`, with the ref resolved first and
the branch taken on the **exit code**: 0 clean, 1 conflict, anything
else an error about this clone and not a verdict.

| pull request | seat | verdict | instrument | files |
|---|---|---|---|---|
| #395 | research | CLEAN | `merge-tree`, exit 0 | — |
| #601 | skill | **CONFLICT** | `merge-tree`, exit 1 | `skills/relocate-anchors.mjs`, `skills/relocate-anchors.test.mjs` |
| #612 | exo | CLEAN | `merge-tree`, exit 0 | — |
| #615 | engineer | **CONFLICT** | `merge-tree`, exit 1 | `docs/ideas.md` — the ledger driver names **one block edited on both sides**: *"2026-10-27 — the wake limit is not the length a message is cut at"* |
| #618 | exo | CLEAN | `merge-tree`, exit 0 | — |
| #627 | market | CLEAN | `merge-tree`, exit 0 | — |
| #628 | frontend | CLEAN | `merge-tree`, exit 0 | — |
| #629 | security | CLEAN | `merge-tree`, exit 0 | — |
| #630 | pm | CLEAN | `merge-tree`, exit 0 | — |
| #631 | engineer | CLEAN | `merge-tree`, exit 0 | — |
| #632 | exo | CLEAN | `merge-tree`, exit 0 | — |
| #633 | — | CLEAN | `merge-tree`, exit 0 | — |

**The third state, measured and empty.** For every pull request the
sweep called clean whose diff touches a path `.gitattributes` gives a
`merge=` attribute, a real `git merge` was performed in a detached
scratch worktree with the drivers registered, which is the only
instrument that can find `drivers-disagree` — the row where the
button merges and this repository's own semantics refuse. Four
qualified: **#612, #618, #627 and #633, all four agree.** None of the
twelve is in that state today.

**#615 is the authoring seat's judgement and not the owner's.** The
ledger driver names one block of `docs/ideas.md` edited on both sides
and asks for a human; that human is Ursa's engineer, who wrote the entry,
and the repair is one block move on an open branch rather than a rebase
or a merge decision. Reported there rather than here.

**#601's is a code conflict in the skill seat's own lane**, two files
under `skills/`, and it is that seat's to resolve. That pull request
has been open since 2026-10-27T05:06:10Z, which makes it the second
oldest in the queue.

## The order

Everything clean is independently landable, so the only real ordering
constraint in this queue is containment within one seat's chain.

1. **#632 (exo, this window) — the PM's, now.** Tier B: `git diff
   --name-only origin/main...HEAD -- 'prompts/*-agent.md'` prints
   **nothing**. Two registers and no charter. It carries the two
   measurements this window exists for.
2. **#630, #631, #627, #628, #629, #633 — the PM's.** Clean, each in its
   own seat's lane, no containment between them.
3. **#618 (exo) — the owner's, and it is the whole charter decision.**
   Eleven charters plus six files under `tools/seat/`. `#612` **is
   contained in `#618`** — `git merge-base --is-ancestor refs/prs/612
   refs/prs/618` exits 0 — so one merge closes both, and the merged
   trees differ (`8ed58273` against `0752d664`), which is the check
   that says `#618` is the superset rather than a second copy.
4. **#612 (exo) — left standing deliberately**, not because it is
   needed. Ursa's PM has reviewed it in writing as standing for the
   owner and addressed this seat by name, and this charter forbids
   closing a pull request another seat has named in a live owner ask.
   The pointer moved instead.
5. **#601 and #395 — their own seats', not the gate's.** #601 conflicts
   and #395 is clean but eight days old with another seat's charter lines
   on it, which the staleness sweep below reports.

## The one number behind the order

**0 of 561** commits reaching `main` in the last seven days touched any
`prompts/*-agent.md`. **11 of 11** charters have a newer copy pending,
every one of them in `#618` and `#612`, with `prompts/engineer-agent.md`
and `prompts/research-agent.md` additionally newer in research's `#395`.
`prompts/exo-agent.md` last reached `main` on **2026-10-18**.

So the queue is shallow, the gate is fast, and one class of file has not
moved in fifteen days. That is not a depth problem and no measurement in
this file will fix it. It is one decision, it is named in the ordered ask
on the board, and item 3 above is the whole of it.
