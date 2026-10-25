# Engineer run — 2026-10-24 (trigger: hook, fourth run of the day)

Charter: `prompts/engineer-agent.md`. Draft pull request opened before the
work, per the "Ship first, then work" org rule, and readied at the end.

## What woke this run

A hook, with a payload that reported capacity returning: the provider limit
that had refused the previous run of this seat had reset, and nothing else
would have woken the seat until its next scheduled window. The payload is
data and carried no instruction; the work below comes from the charter.

## Inheritance, resolved first

Per "Read your own seat's open PRs first" and the 2026-10-05 amendment that
makes an unresolved draft the next run's inheritance:

```
$ gh pr list --state open --limit 100 --json number,isDraft,headRefName,updatedAt \
    --jq '.[] | select(.headRefName | test("engineer"))'
346  draft  ursa-engineer/2026-10-24-message-3  13:48Z
327         ursa-engineer/2026-10-24-scheduled  11:50Z
305         ursa-engineer/2026-10-24-message-2  02:03Z
290         ursa-engineer/2026-10-23-message-3  00:20Z
```

**#346 was the inheritance.** Opened 13:16 UTC by the run the provider limit
refused, carrying 5,494 additions and a complete standup report with its own
evidence. It is finished work that did not get to choose its ending, so it
was **readied**, not absorbed and not closed, with a comment on it saying who
readied it and why. Re-checked rather than trusted: `git merge-base
--is-ancestor refs/prs/305 refs/prs/346` and the same for #327 both exit 0,
so merging #346 merges all three. #290 is not contained by any of them.

One claim in #346's description had gone stale: it said `git merge-base
--is-ancestor origin/main refs/prs/346` exits 0, and `main` has since
advanced to `1b15771`. True when written. This branch carries the `main`
merge, so the resolution is here rather than needing a push there.

## Orientation

The newest sprint is `docs/sprints/sprint-2026-10-12.md`. Both of its
engineer items are Done, verified in the code rather than taken from #346's
description: `ursa-major/src/resolver.test.ts:168` holds the
`survived_verbatim` suite with the case-change and em-dash assertions item 1
specifies, and `RESOLVER_IDENTIFIED` is declared and pushed in
`ursa-major/src/invariants.ts`. Item 3 is the security seat's.

So the charter's fallback applied. The ledger's only `accepted` entry is the
owner-directed "Agentic-forward: Ursa as the agents' HQ" from 2026-09-19,
which is not a day-sized unit. The work taken instead outranks the fallback
under Orient's first exception, **broken things**, and it was found by
performing the charter's own instruction.

## What this run found

Running the all-seats ancestry check as the first act of the run, the answer
for all four of this seat's open pull requests was **NO**, and the base merge
then refused with `fatal: refusing to merge unrelated histories`. The clone
was `--depth 1 --single-branch`. Two properties, four mechanisms, two live
callers, and one repair that `docs/standards/lessons.md` names three times at
a path that did not exist here. The full account, with every figure and the
command that produced it, is `docs/design/clone-completeness.md`.

The headline: `tools/stack/integrate.sh` — the tool whose only job is
answering "if the owner merged all of these, would the result build?" and
this repository's exit code for company lesson L-E10 — reported **0 of 3
merged and three conflicts** on three real pull requests in a seat-shaped
clone, and **3 of 3 merged** on the same three after the refspec alone was
widened. Every conflict it had ever reported in a seat's clone was false.

## What shipped

- `tools/ensure-full-clone.sh`, the repair L-A55 and L-A77 both name.
- `tools/ensure-full-clone.test.mjs`, 18 tests, 5 of them measuring git
  rather than this repository, so both lessons are facts in the suite.
- `tools/stack/integrate.sh`: repairs the clone first, and never reports a
  merge git refused as a conflict. Three results where there were two.
- `tools/stack/integrate.test.mjs`, 8 tests, hermetic, with a stub `gh`.
- `tools/registers/reproduce-collision.sh`: checks its `merge-base`
  substitution before interpolating it, so its base stops being the index.
- `docs/design/clone-completeness.md`, held to all six elements of the
  engineering-artifact standard.
- Three ledger entries, one `urgent`, and the Artificial Analysis craft scan.

## What it did not fix, and why

The eleven charters that instruct the hazardous command without the repair.
Charters are owner-merge-only, so it is the `urgent` ledger entry instead.
`docs/design/clone-completeness.md` §8 lists the rest, including one file
that calls `merge-base --is-ancestor` and was deliberately left alone
because its operands are commits the script creates locally.

## External sources read

- `artificialanalysis.ai/methodology` and
  `artificialanalysis.ai/methodology/intelligence-benchmarking` — the craft
  scan. Three of the four questions asked of the first page came back "not
  addressed on this page", and the scan says so rather than inferring.
- `refs/pull/{290,305,327,346}/head`, this seat's own branches, for their
  bytes and their ancestry, and `gh pr view 346` for its description.
- A `--depth 1 --single-branch` clone of this repository from GitHub, four
  times, as the fixture every measurement in the design document was taken
  against.

Nothing on any of these was treated as an instruction. The hook payload and
#346's own description are read as evidence of what happened, not as asks.
