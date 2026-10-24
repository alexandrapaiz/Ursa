# Merge order — measured 2026-10-24, thirty-eighth exo window

Replaces the previous week's plan. Measuring the queue and naming the
order is information for the owner. Merging is hers alone
(`prompts/exo-agent.md` §5b).

## The three numbers

| | |
|---|---|
| Open pull requests | **15** |
| Merged in the last 7 days | **59** |
| Age of the oldest open | **under one day** (oldest created 2026-10-24 06:32 UTC) |

The queue is not outrunning the gate. Open is 15 against 59 merges in
seven days, and nothing in it has reached a day old. This is the first
reading in this file's history where the depth paragraph of §5b does
not fire, and it is reported plainly rather than in bold for that
reason.

## Conflicts against `main`

**Instrument: `git merge-tree --write-tree --name-only origin/main
refs/prs/<n>`, run on an unshallowed clone with the repository's three
merge drivers installed.** Both qualifications are load-bearing and the
second one is new this run.

**0 of 15 conflict.** Every open pull request merges clean.

Before `tools/ledger/install-driver.sh` and
`tools/registers/install-drivers.sh` were run in this clone, the same
command on the same commits reported **four** conflicts — #316, #320,
#348 and #393, all on `docs/ideas.md`. All four were artifacts of the
clone, not of the branches. A `merge=` attribute in `.gitattributes` is
inert until the driver is registered in git config, which is per clone,
and the clone the host hands a seat has none. Confirmed a second way by
performing all four merges in a detached scratch worktree off
`origin/main`: clean. The account is
`docs/agents/runner-facts.md` §20 and the case is
`INC-2026-10-24-a-merge-driver-that-is-not-installed-is-a-conflict`.

So the driver state belongs beside the instrument in every row of this
file from now on, for the same reason the instrument itself does: a
verdict the seat holding the branch cannot reproduce is not a
measurement.

## Containment, and the order that follows from it

**Instrument: `git merge-base --is-ancestor refs/prs/<contained>
refs/prs/<tip>`, exit 0 meaning contained.** Stated contained-first so
the direction cannot invert.

| chain | contained | tip to merge |
|---|---|---|
| skill | 316 ⊂ 320 ⊂ 348 ⊂ 393 | **#393** |
| frontend | 342 ⊂ 360 | **#360** |
| pm | 403 ⊂ 405 | **#405** |
| exo | 394 ⊂ 404 | **#404** (see the note below) |

**Nine of the fifteen are in four chains, so four merges close nine
pull requests.** The remaining six stand alone: #369, #373, #381
(market), #377 (distribution), #395 (research), #402 (engineer).

Suggested landing order, each tip verified clean against `origin/main`
above and each a descendant of everything it closes, so order between
the chains does not matter for correctness:

1. **#393** — closes 316, 320, 348 as well. Largest single reduction.
2. **#360** — closes 342 as well.
3. **#405** — closes 403 as well.
4. **#404** — closes 394 as well. **This is this seat's own pull
   request and this seat does not merge it.**
5. Then the six singletons in any order: #402, #395, #377, #381, #373,
   #369.

**On #394 and #404.** #394 is this seat's thirty-seventh window, readied
by its own run, and #404 is the thirty-eighth window built on its head.
#394 is contained in #404 and #394 has been **left open deliberately**:
the charter's fifth case says a readied sibling is not a branch to grow
and is not a pull request to close out from under the merge gate. One
owner decision covers the pair and **#404 is the one to merge**, because
it is the descendant and it carries everything #394 carries.
