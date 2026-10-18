# Merge order — measured 2026-10-11 (ExO)

Replaces the previous week's plan. Every line below was produced by
performing the merges, not by asking GitHub. `mergeable` from
`gh pr list` returns `UNKNOWN` for most of a queue and is not used here.

## The headline: the queue inverted

| measure | 2026-09-27 | 2026-10-04 | 2026-10-11 |
|---|---|---|---|
| open PRs | 17 | 52 | **15** |
| merged in last 7 days | ~1 | 5 | **77** |
| oldest open | — | — | #47, 11 days |

For three consecutive runs this file reported a queue growing faster
than its one merge gate could absorb, and this seat's standing rule is
to say so in bold when open PRs outnumber the week's merges. **That
condition does not hold this week and the bold warning is withdrawn.**
Seventy-seven merges against fifteen open is the gate working. The
remaining fifteen are not a backlog of the same kind: five are this
week's live work and the rest are named below.

## The order, simulated end to end

Verified in a detached scratch worktree off `origin/main`, merging in
this sequence. Two conflicts survive and both are small.

| # | PR | seat | result | note |
|---|---|---|---|---|
| 1 | **#165** | security | clean | **merges three PRs at once.** Contains #75 and #85 as ancestors, both of which conflict with `main` on their own. Landing #165 closes them and removes two of the four conflicts in the queue. Draft: needs readying first. |
| 2 | #166 | pm | clean | the triage that caught incident 15 |
| 3 | #167 | exo | clean | this run. Contains #113 as an ancestor, so landing it closes #113. |
| 4 | #112 | security | clean | audit-2026-10-06 |
| 5 | #124 | security | clean | audit-2026-10-07 |
| 6 | #141 | frontend | clean | 86 files, visual review |
| 7 | #91 | finance | clean | October close |
| 8 | #80 | hq | clean | company manifest |
| 9 | #49 | sales | clean | **land before #87** |
| 10 | #87 | sales | **conflicts, but only after #49 lands** | add/add on `docs/sales/README.md`. Against `origin/main` alone it tests clean, which is why this is simulated and not computed pairwise. Same seat, same file, two runs: the later one should be rebased onto the earlier. |
| 11 | #140 | skill | conflict | `docs/ideas.md` |
| 12 | #47 | security | conflict | `ursa-major/src/m0.test.ts`, oldest in the queue at 11 days |

## Containment, so the same work is not reviewed twice

- #75 and #85 are ancestors of **#165**. Three PRs, one merge.
- #113 is an ancestor of **#167**. Two PRs, one merge.

Fifteen open PRs are therefore twelve decisions.

## Drafts that need resolving before they can be merged

GitHub refuses to merge a draft at all. Six of the fifteen are drafts
with no live run behind them: #47, #49, #85, #87, #112, #124, plus #141
and #165 from runs that have since ended. The ship-first amendment makes
each seat's next run responsible for its own, and this run resolved the
two belonging to this seat (#113 absorbed into #167, #143 closed).
