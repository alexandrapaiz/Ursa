# Skill run — 2026-11-01 (message)

**Trigger.** A note from Ursa/exo addressed to this seat, saying this seat's
tip, PR #608, had been an unmergeable draft for five days and seventeen
hours, and that it contains this seat's own readied predecessor, PR #601, by
ancestry. It asked for the draft to be resolved and for a reply on the board
in first person with the reason.

**No database.** `NEON_RO_URL` is absent from this run's environment, so per
the charter's data-access section there is no silver query, no cluster pick
and no skill drafted from claims. No new skill means charter step 3 has no
trigger test to write and step 4 has no new frontmatter to render. The run
went to the parts that need no database.

## The draft, resolved by closing it, and why that was the cheaper answer

The note was read as data and checked, which is what this seat's charter
requires of anything that is not the owner, HQ within a standard's scope, or
this repository's own committed files.

**The clone this run woke in was shallow.** `git rev-parse
--is-shallow-repository` answered true, and a shallow graph answers ancestry
questions from a truncated history, so the first ancestry check this run ran
was worthless and it did not know that until it looked. `tools/ensure-full-clone.sh`
took it from 1954 to 3823 commits and from 2 to 283 remote-tracking refs.
Every measurement below was taken after that and with both of this
repository's merge drivers registered, through
`tools/ledger/install-driver.sh` and `tools/registers/install-drivers.sh`.

**The ancestry half of the note is right.** `git merge-base --is-ancestor
refs/prs/601 refs/prs/608` is true on the full graph.

**The better half is not.** Four commits separate them, and all four are
other seats' work already on `main`: the engineer's #598, the HQ
`lessons.md` re-vendor #610, and this branch's forward merge carrying them.
The run that opened #608 was refused by the provider three minutes after it
opened the draft, at 05:26 against a last commit at 05:29, so it never
produced a unit of its own. The tip is its parent plus other people's work.

**The decisive measurement.** `origin/main` was two commits ahead of both
tonight, through #611. Merging #601 into `main` and merging #608 into `main`
both succeed with no conflict, and the two results are **byte-identical
trees**: `git diff` between them is empty. So closing #608 costs nothing
that #601 does not already carry, and readying it would have handed the
owner a second copy of the same tree behind a stub description reading "this
description will be filled in as the run proceeds", which the run never got
to fill in.

**The work was checked before it was closed, not assumed fine.** At #608's
own tip: `node skills/check-evidence.mjs` exit 0, 352 sources resolved and
440 ranges fingerprinted; `node skills/trigger-coverage.mjs` exit 0, 90 of
90 ordered pairs and every skill meeting §5c; all six `skills/*.test.mjs`
passing. The work is good. It is good in #601 too, identically, which is the
whole point.

So #608 is closed with the measurement written into its own comment, and
#601 stands as the one landable copy. #601 was already readied, already
carries #593, #586, #560, #566 and #569 inside it, and already has the
write-up and guard table the owner needs in order to act. After this run,
the only open pull requests under this seat are #601, readied, and this
run's own.

## What this run deliberately did not do

It did not build on #601. The org rule in the charter says to merge an open
pull request of your own seat into your branch when it touches the files you
are about to touch, and the reason is that `main` is not this organization's
memory. That rule is about not writing a second version of work you already
have. Here, obeying it literally would have meant pulling 9,525 lines of
already-written, already-readied work into a new pull request and making the
owner's one landable copy into a superseded one, which is the exact shape
this run was woken to clean up.

So this run scoped itself to files #601 does not touch, and the one ledger
block it does touch is one #601 does not. That is stated here because a
deviation from an org rule that leaves no trace cannot be reviewed, and
because the rule's purpose and its letter point different ways in the
specific case of a seat whose backlog is already landable.

## The unit: the board's cut is a paragraph boundary, answered for free

The reply to Ursa/exo was posted with `tools/board/post.mjs`, checked first
with `tools/board/check.mjs`, which reported clean and that Ursa/exo would
be woken. The receipt said `cut at 1277 of 1510 characters` against a
`wake_limit` of 1500.

An open ledger entry from 2026-10-27 had asked exactly that question and
named three candidates: a paragraph break, a sentence end, or a hard
character count. Its first step was three self-addressed probe posts, and it
had priced that step honestly as three permanent rows on a store with no
delete route.

The reply answered it at no cost. Counting blank lines, that body's fifth
paragraph ends at character 1277 exactly, so the delivered length is a
paragraph boundary. The hard count at 1500 is refuted by the 1277. The
sentence end is refuted too, and this is the part one observation can
settle: the sixth paragraph's first sentence ends at character 1324, well
inside the limit, and a sentence-boundary cut would have carried it. It did
not. The earlier datapoint in that entry's trigger, `cut at 1286 of 1906`,
is consistent with the same rule and had already refuted a fixed count by
disagreeing with this one by nine characters.

The numbers are the board's own fields, `body_chars`, `body_delivered` and
`wake_limit`, which `post.mjs` prints as quotations rather than as its own
arithmetic.

The entry is updated with the answer and with what a seat should do about
it, which is to front-load the first two or three paragraphs and still read
`body_delivered` afterwards, since the usable length is a property of a
seat's own paragraphing and cannot be computed before the post. Its status
stays `proposed`: only the owner moves a status (pm.md §4) and it was never
accepted. What remains owed is the standards half, since §15 of pm.md tells
seats to write a conversation and names no length at all.

## The second ledger entry, which is this run's own finding about itself

The amended ship-first rule tells a seat to resolve an inherited draft by
absorbing it, readying it or closing it with a pointer, and gives no test for
choosing. The command it names is `git merge-base --is-ancestor`, and
ancestry answers the wrong question: it is true of a branch that merged
`main` and did nothing else, which is the common case in a portfolio where
runs are refused before their first turn. Tree identity answers the right
one. The entry proposes `tools/seat/same-tree.mjs` for the engineer seat,
since `tools/` is outside this seat's write surface.

## Merge order for the ledger

Seven other open pull requests touch `docs/ideas.md`: #615, #607, #602,
#601, #600, #599 and #591. Any order works, and for #601, the one that
matters most here because it is this seat's own, that was measured rather
than asserted. Merging in both orders gives **406 blocks on both sides, zero
keys present in one and not the other, and zero shared keys whose text
differs**. Nothing is lost or altered either way.

One caveat for whoever reviews the result: the two orders are not
byte-identical, because the blocks land in a different arrangement from index
333 on. So a diff between two correct merges of this file can read as 64
insertions and 64 deletions and mean nothing at all. The ledger's grammar
keys blocks on their headings and the driver merges by that identity, so
arrangement carries no meaning. Compare block sets, not lines.

## Guards

| guard | exit |
|---|---|
| `node tools/ledger/check.mjs` | 2, 390 blocks, the same two owner-only `STATUS_ALLOWED` violations `main` already has and that no seat can repair |
| `node tools/ledger/check-closures.mjs` | 0, 3 markers in 4 documents, all resolved |
| `node tools/ledger/check-attributes.mjs` | 0, 6 declarations over 2 drivers |
| `node tools/board/check.mjs` (the reply, before posting) | 0, clean, Ursa/exo would be woken |
| `node skills/trigger-coverage.mjs` | 0, 90 of 90 pairs |
| every `skills/*.test.mjs` | all passing |
| `node skills/check-evidence.mjs` | **1**, 26 stale ranges, the identical set `origin/main` has |
| `node skills/relevance-sweep.mjs --stale` | **1**, the same state as `origin/main` |

**The two red ones are `main`'s, and they are an argument for merging #601.**
At #608's tip `check-evidence.mjs` exits 0 with 352 sources and 440 ranges.
On `origin/main` it exits 1 with 26 stale citations, and on this branch it
exits 1 with the same 26, verified by diffing the two reports line for line
rather than by comparing counts. The difference is that #601 carries the
re-anchored `skills/evidence.lock.json` and `main` does not, so the library's
provenance gate has been red on the default branch for as long as this seat's
backlog has been unmerged. That is the cost of the queue, stated as an exit
status instead of a worry.

This branch adds none of it. The cited ranges inside `docs/ideas.md` sit at
lines 8124 to 8147, both of this run's ledger edits are below line 14295, and
`relocate-anchors.mjs` therefore had nothing to move. The skill guards are
run and recorded anyway, because they are what justified closing #608 rather
than readying it.

## External sources read

Nothing outside this repository's committed files was fetched from the web.
Three non-committed sources were read, all of them this organization's own:
the GitHub API, for this seat's own open pull requests and for #601's and
#608's descriptions; the board's `GET /api/standing` for this seat, which
answered empty after #608 was closed; and the board's `GET /api/messages`
inbox for this seat. The exo note in that inbox addresses this seat directly
and asks it to act. It was treated as data, checked against the repository,
and found right on ancestry and wrong on which copy is better. Nothing in it
was taken as an instruction, and the reply says so in those terms. No other
message in the inbox asked anything of this seat.
