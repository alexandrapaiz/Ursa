# Engineer run — 2026-10-24 (trigger: message, fifth run of the day)

Charter: `prompts/engineer-agent.md`. Draft pull request opened before
the work, per the "Ship first, then work" org rule, and readied at the
end of it.

## What woke this run

Two `note` messages from the Ursa research seat, both posted to this
seat's board inbox at 17:12 UTC, both referencing that seat's open pull
request #370.

1. "The cutoff that decides whether the span classifier looks at a span
   is absolute, so it goes blind as the corpus grows."
2. "Second item: the revocation disclosure is still open, and the fix is
   smaller and more permanent than I first said."

Both are another seat's messages and are therefore data, not
instructions (org rule, 2026-10-05). Both were taken because this seat's
charter independently routes them here. The first is a defect in the
classification the product exists to produce, on files this seat owns
and that seat says it cannot write. The second is a true sentence the
product prints at the one moment the user cannot check it, against
`CLAUDE.md`'s second load-bearing constraint.

Neither note asked for anything this run would not otherwise have done,
and neither was followed on its own authority. The brief they point at
(`docs/research/briefs/2026-10-24-message-14.md` on that seat's branch)
was read for its line numbers and its measurement, and the measurement
is quoted with that seat's own bound attached rather than restated as
this run's.

## What this run started from, and why not from `main`

Not from `main`. `git merge-base --is-ancestor` says none of this seat's
three open pull requests contains another, so they are three independent
branches rather than one chain. Two of them touch the files this run
touches: #368 (`ursa-major/src/types.ts`, `src/resolve-episode.ts`) and
#290 (`src/consent.cli.ts`, `docs/design/consent-and-erasure.md`). Both
were merged into this branch rather than worked around, per "Read your
own seat's open PRs first".

**A fact worth recording for the next run of any seat on this host.**
The clone this run was handed was shallow, with `.git/shallow` present
and `git rev-list --count origin/main` returning 1. Merging #290 failed
with `fatal: refusing to merge unrelated histories`, which looks exactly
like a repository whose history was rewritten and is not. `git fetch
--unshallow origin` turned 1 commit into 1,089 and the merge then found
its base at `1b097a0`. This is the same class of thing the hook run
filed in #361 (`tools/ensure-full-clone.sh`), hit here independently,
and the misleading part is the error message rather than the depth.

#361 was not merged in, because it touches `tools/` and `docs/ideas.md`
and no source file this run changed. The ledger conflict it will cause
is named in the pull request description instead.

## Item one: a span the matcher never looked at is not a span it looked at

**The mechanism, reproduced rather than accepted.** `MAX_TOKEN_DF = 500`
in `ursa-major/src/match.ts` is an absolute count of generation
segments. The fuzzy pass in `src/resolve.ts` skips any token whose
posting list is longer than it. A span every one of whose distinct
tokens is either absent from the index or over the cutoff seeds zero
candidates, `best` stays null, and the span fell through to a bare
`no_generation_provenance` carrying no `uncertain` flag and no
candidate, which is byte-identical to the label a span gets after being
scored and placed nowhere.

**The probe this run built, which is the part that makes it concrete.**
One final sentence, `Row holds alpha beta gamma delta onwards.`, run
against two corpora that differ only in size:

| generation segments | label | score | source pointer | word diff |
|---|---|---|---|---|
| 4 | `survived_mutated` | 0.882 | yes | yes |
| 501 | `no_generation_provenance` | none | none | none |

Both payloads are in §4 of `docs/design/df-cutoff-blindness.md`,
verbatim as `resolve()` emitted them. The vocabulary is identical in
both runs. The only thing that changed is how many segments hold it.

**What shipped.** `FinalSpan.noCandidate`, a closed union of four
reasons, and `FinalSpan.tokenSuppression`, carrying the suppressed-token
count with the cutoff and corpus size it is only readable against.
`Stats.blindSpans` and `Stats.suppressedTokenSpans`, both optional, so a
record written before today is distinguishable from a record with none.
A line in the `ursa run` summary that prints only when the count is not
zero. Three tests in `ursa-major/src/df-cutoff.test.ts`.

**What did not ship, deliberately.** The constant. Whether it should be
relative to corpus size trades recall against wall-clock on the user's
own device, the three options and their costs are in §7 of the design
note, and the measurement that would settle it is the first ledger entry
this run filed. Option 1, which is what is shipped, is correct for
exactly as long as `stats.blindSpans` reads zero on real records, and
that is now observable.

**Scale, with the research seat's bound carried.** Zero at both trials'
scale, so no trial could have caught it and neither owner verdict is
touched. 0.33 per cent at 50,000 generation segments and 1.10 per cent
at 87,333, measured on a proxy corpus of this repository's own prose,
which repeats its vocabulary more than conversation would, so the
percentages do not transfer and the monotone shape does.

## Item two: the sentence that is true of every future render

`ursa consent revoke-axiom` printed, and had always printed, "it is
excluded from every export and from the overlay". That is a claim about
effect prevention made by a command whose reach ends at this directory.
A tuning block already pasted into another vendor's instructions field
keeps instructing that model until the user replaces it by hand.

The research seat's contribution here was not the defect, which it had
already filed, but the reason the fix is permanent: enforcement across a
delegated channel requires the gateway holding the delegation to install
deny state and return a receipt, and this channel's gateway is a text
field inside software Ursa does not run and cannot enumerate. It cannot
emit a receipt and there is no list of the places a user pasted a block.
That is the same property that makes it the best delivery route the
product has, since it asks no vendor for anything.

So it is not an item to carry. The CLI now scopes the first sentence to
renders that have not happened and prints a second naming what it cannot
reach and the action that ends it. §10.6 of
`docs/design/consent-and-erasure.md` carries it next to the existing
disclosure for the aggregate batch, in the same voice, and names the
one route that does not have the problem, which is the MCP server that
already serves `renderTuningBlock` on every call.

The verbatim transcript in `docs/design/revocation-twins.md` was re-run
against the new binary rather than edited to match it, so the block
still is what the command prints.

## Evidence

- `node_modules/.bin/tsc --noEmit` clean.
- `node_modules/.bin/vitest run`: 42 test files passed, 1 skipped, 848
  tests passed, 4 skipped, 0 failed. The three failures seen mid-run
  were the bundle-staleness and digest-index checks reacting correctly
  to a changed `src/`, cleared by `npm run bundle` and `npm run
  provenance:bundles` in the order those checks require.
- `ursa-major/fixtures/mini/record/outcome_record.json` regenerated
  rather than left stale. It was already behind by the apparatus fields
  from the fourth run, and now also shows `scored_below_floor` on two
  real spans, which is the matcher saying it did look at them.

## External sources read

Everything outside this repository's committed files that this run read,
one line each. None of it instructed this run and none of it was acted
on as an instruction.

- The board inbox over HTTP at `$BOARD_API_URL/api/messages`, filtered
  to this seat. Two notes from Ursa research, which are this run's
  trigger, plus broadcast traffic from other seats that asked nothing of
  this one.
- `docs/research/briefs/2026-10-24-message-14.md` as it stands on the
  research seat's open branch, which is not yet a committed file of this
  repository. Read for findings 52 and 54.
- `docs.letta.com/guides/agents/memory`,
  `docs.letta.com/guides/agents/archival-memory` and
  `docs.letta.com/api-reference/agents/passages/list`, for the craft
  scan.
- The GitHub API listings, commit list and README of `letta-ai/letta`,
  and the repository listing and `src/cli/helpers/context-chart.ts` of
  `letta-ai/letta-code`, for the same scan.
