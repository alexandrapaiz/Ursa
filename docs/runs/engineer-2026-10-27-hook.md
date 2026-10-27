# engineer run note — the re-fired slot of 2026-10-26T23:26:03Z

Dated **2026-10-26**. The provider refused this cron slot before the run took
a turn and it re-fired after the limit reset at 2026-10-27T00:00:00Z. A slot
fires once per period, so this is the scheduled daily run for 2026-10-26 and
not a reply to the wake that delivered it.

## Inherited work, resolved by absorbing it

The run of 2026-10-26T20:55:04Z was cut off at turn 89 with draft PR #561 open
on `ursa-engineer/2026-10-26-message-13`, its description still a stub. That
branch is the base of this one, verified rather than assumed:

```
$ git merge-base --is-ancestor origin/ursa-engineer/2026-10-26-message-13 HEAD
$ echo $?
0
```

So #561 is closed with a pointer here rather than reviewed twice. Its five
commits are the first slice of the ledger entry "Every gate exports its verdict
as data, so the sweep is a program and not a table": four gates extracted, the
enumerator, 36 cases, and `docs/design/verdict-enumeration.md`. Every one of
its tests passes on this branch as merged (15 + 6 + 6 + 9).

#549 and #555, named as merge-order dependencies in #561's stub description,
both merged before this run started. There is no longer an order to state.

## Observe

- **Sprint.** `docs/sprints/sprint-2026-10-12.md` is still the newest sprint
  file, two weeks old, and both of its `engineer` items have shipped:
  `RESOLVER_IDENTIFIED` is in `ursa-major/src/invariants.ts:58` and documented
  in `README.md:244`, and the byte-identity assertions are in
  `ursa-major/src/resolver.test.ts:168`. With the sprint's engineer backlog
  empty, the charter's fallback applies: an `accepted` ledger entry no sprint
  picked up, then this seat's own improvements. There is exactly one
  `accepted` entry in the ledger and it is the owner-directed one from
  2026-09-19. So this run continued its own line of work, which is the second
  slice of the entry above, and says so here for the PM's retrospective.
- **Queue.** One open pull request for this seat, #561, resolved as described.
- **Pipeline health.** Skipped, and not applicable: `modal` is not installed
  in this sandbox (`command -v modal` is empty) and Ursa has no Modal
  deployment — that line of the charter is inherited from alexandria.
- **Craft scan.** GNU grep 3.11 and git 2.43.0's exit-status contracts,
  measured in this sandbox rather than recalled. In `docs/ideas.md`.

## Shipped

The fifth gate: `tools/board/post.mjs`'s verdict, as data.

- `tools/board/post-verdict.mjs` — `verdict(findings, seen)` and
  `unreachable(fault)`. Ten named causes where `grep -c
  'process.exit([1-9])'` counts four, three of them invisible to a text
  search in principle: the success line has two forms and no exit call at
  all, the four unreachable-board conditions share one `process.exit(2)`, and
  `--dry-run` leaves through `process.exit(0)`.
- `tools/board/post.mjs` — prints through one `say()` helper over
  `renderVerdict`, so the sentence and the exit status come out of one
  function. Every output string byte-identical, measured over twelve
  invocations against the parent commit, including a `node:http` stub board
  on loopback for the exit-3 and both exit-0 live branches.
- `tools/gates/verdict-shape.mjs` — two widenings the first four gates could
  not have reached: `exitCode` is now `0 | 1 | 2 | 3`, and `quoted: string[]`
  exempts an integer that sits inside a string the gate declared it took from
  an observed input (an HTTP status, a record id) from `COUNTS_DERIVED`.
- `tools/gates/enumerate-verdicts.mjs` — the registry entry, the narrow
  exemption, and a sixth property, `QUOTED_IS_QUOTED`: a declared quotation
  absent from the verdict is a finding, because an exemption with nothing
  behind it is how this check would get weakened without anyone editing it.
- 19 new cases: 17 over the ten branches, pinned against literals, and 2 in
  the enumerator suite proving the exemption is narrow in both directions.
- `docs/design/verdict-enumeration.md` §10, to the six-element standard: the
  ten-branch table, the two widenings, the behaviour that did change and its
  measurement, and the two defects found and deliberately not repaired.

## Found and not repaired, both in the ledger

1. A 2xx the board answered without a readable id prints `Posted note to
   Ursa/pm.` and says nothing about the id being absent.
2. `--dry-run` with no board variables set prints `POST /api/messages`, a
   request line with no origin, then `Checked clean.`

Each would change an output string on a branch this slice's whole evidence is
that no output string changed. They land together, with the differential
re-run and the new lines stated as the intended diff.

## For the next slice

The census orders the remaining nine gates by path. It should order them by
how much of each verdict is already pure: `tools/board/read-filters.mjs`
already calls `liveTargetFault`, so its four ground branches are extracted
before anyone starts, and the census reports it as "not yet" all the same. A
third state, partial, measured by which non-zero exits route through an
already-pure module, would make the cheapest next extraction visible instead
of guessed.
