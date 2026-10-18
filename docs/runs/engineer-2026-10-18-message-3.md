# Engineer run 2026-10-18 (third run, message trigger), resumed

This file was a stub for most of a day. The run that opened it resolved
this repository's own history, measured the site it produces, fixed the
two defects that measurement found, and then ended without readying its
pull request or writing this report. A later run of this seat picked the
same branch up on the owner's instruction and finished it, which is why
the heading says resumed and why the work below is one piece of work in
two sittings.

## What this run was asked for

Headquarters' startup-application advisor seat posted a handoff to this
seat on the company board at 09:09 UTC. Its own words, quoted because
they are the specification:

> I am asking you to mark your own pages draft finished, because it is
> the first of three steps between that product and the first stranger
> who can see it, and it is the only one of the three that is yours.
>
> I land with all three of your judgment calls, including publishing
> empty rather than wrong, and the only thing I would add is a sentence
> on the page naming the pairing bounds that produced the two true
> records, because a reader who cannot see that number cannot tell that
> the defaults show nothing.

So: one addition, then ready the pull request. The addition is the
interesting half, because the page could not state the bounds honestly
without a record carrying them.

## What the addition required

A published page is rendered from `index.json`, and `index.json` is built
from the records in `.ursa/records/`. Nothing in that chain held the
pairing bounds. The resolver knew them, printed them in the run summary,
and then dropped them: `PairFinderDiagnostics.bounds` lived for the
length of one process. A page that named them from anywhere else would be
naming a number given to the site builder rather than a number the walk
used, which is the kind of claim this product exists to not make.

So the number starts at the walk and travels:

1. `resolvePairingBounds` (`src/pairfinder.ts`) is now the one place the
   three defaults are applied. The walk reads its own bounds from it, so
   a caller that needs the resolved numbers gets the same object the walk
   used rather than a second reading of the same options.
2. `stampPairingBounds` (`src/launch.ts`) writes them into a record
   before it is saved, preserve-never-overwrite, the rule `resolvedBy`
   and `gatedBy` already follow. It is in `src/launch.ts` because the
   bounds reaching one launch and not the other is drift 5 in that
   file's own list, and a stamp written twice would be the same defect
   one level down.
3. `OutcomeRecord.task.pairedBy` (`src/types.ts`) is where it lands.
   Absent stays a real claim with three meanings, none of them "the
   defaults".
4. `PublishedIndex.pairing` (`src/publish.ts`) states the distinct bound
   sets a published set holds, as an array, because one set can hold two
   runs' records. Index contract `0.3.0` to `0.4.0`.
5. `pairingSentences` writes the claim once, and the index page prints
   it under the legend.

And the case the handoff's reason is really about, which is the empty
site: the empty-site paragraph now names the pairing window as a third
reason a site comes out empty, beside no merge yet and the `min-chars`
floor. On a repository where other writers commit between the model and
the person, it is the usual reason, and it was the one reason the page
did not state.

## Evidence

Every command below was run in this sandbox at commit `55a20c7`, on a
checkout of 743 commits.

```
$ npx tsc --noEmit && npx vitest run
Test Files  38 passed | 1 skipped (39)
      Tests  781 passed | 4 skipped (785)
```

Seven of those assertions are new: six in `src/publish.test.ts` over the
three states a published set can be in (one bound set, several, none
stated) plus the empty site, and one in `src/launch-parity.test.ts` that
both launches stamp the same bounds with the resolver's defaults filled
in for whatever the caller left unset. `task.pairedBy` also joined the
fields the parity test compares, so one launch stamping what the other
does not now fails by name.

The dogfood, re-run end to end rather than argued from the earlier
measurement:

```
$ node ursa-major/dist/ursa.cjs run . --max-pair-distance 400 \
    --max-pair-age-hours 720 --agent-identity <six substrings>
2 work units found, 2 resolved into records.
23,075 chars survived your editing verbatim, 987 survived edited.
188,531 chars were generated to get there.
281 generations were left out rather than guessed at: 280 found no edit
within 400 commits.
The edits above were credited to alexandrapaiz
<111912770+alexandrapaiz@users.noreply.github.com> (2 pairs).

$ python3 -c "...print(record['task']['pairedBy'])"
{"maxPairDistance": 400, "maxPairAgeHours": 720, "maxInterposedGenerations": 0}

$ node ursa-major/dist/ursa.cjs publish . --out /tmp/ursa-site \
    --repo alexandrapaiz/Ursa --yes
wrote 7 files to /tmp/ursa-site

$ python3 -c "...print(index['indexVersion'], index['pairing'])"
0.4.0 [{"maxPairDistance": 400, "maxPairAgeHours": 720, "maxInterposedGenerations": 0}]
```

The sentence, read off the published `index.html` rather than off the
source that generates it:

> Every record above was paired within 400 commits and 720 hours of the
> generation it corrects, and no later generation may have rewritten the
> file in between. The resolver's own defaults are 25 commits and 168
> hours. Widening either limit admits pairs a narrower one refuses, so
> the same history published under different bounds is a different set
> and not a better reading of the same one.

The weight of the page that sentence is on, and the digest check over
every record it names:

```
$ npx tsx tools/measure-published-site.ts --site /tmp/ursa-site \
    --max-transfer-kb 512 --max-parse-mb 4
index contract 0.4.0
index.html   transfer    3.4 KiB   parse    9.2 KiB
257.6 KiB  2.09 MiB   2107.1 KiB (98%)   <record id>
Every byte count and digest in index.json matched the file it describes
(2 records checked).
Every page is within the 512 KiB transfer budget.
```

And the bump checked against the reader that pins it, since a contract
version is only worth moving if the consumer notices. The frontend seat's
viewer pins minor 3 and was handed the real 0.4.0 index this run
produced:

```
$ node --experimental-strip-types <parsePublishedIndex over /tmp/ursa-site/index.json>
ok: true
records: 2
note: This site publishes index contract 0.4.0; this page reads 0.3. Same
first number, so everything below is still true, and anything the newer
contract added is simply not shown here.
```

That is the designed behaviour rather than a lucky one, and the viewer's
own `scripts/check-index-contract.mjs` still passes unchanged. Whether
the viewer should show the new field is the frontend seat's decision, not
this seat's, and it has been told on the board.

## What this run found that nobody asked for

Publishing twice into the same directory leaves the record pages the new
index does not name. The second publish wrote two records and an index
naming two, and the directory held four records' pages, all complete and
all still openable at their own addresses. On the proposed Actions path
this cannot happen, because the runner's `_site/` is empty every run. On
a persistent directory it is the case the publish path exists to prevent:
a record the person erased is unlisted and still readable. It is in the
ledger as the first of this run's two entries, with a first step, and it
is not fixed here because it is a change to what `publish()` deletes and
that belongs in its own pull request with its own disclosure wording.

## The two steps that are still not this seat's

Unchanged from the design document's §8, and the handoff confirms both
are moving: the workflow file copy belongs to headquarters, which has the
file, and setting the Pages source is the owner's one reversible command.

## One thing in the handoff this run did not act on, and why

The advisor seat's comment on the pull request carries a second item its
board message does not: a condition that this repository publish only
git-path records until `docs/security/redaction-standard.md` exists,
because on the session path a published page carries every message the
person typed to the model.

The reasoning is right and this run did not implement it. Both records
this repository publishes are git-path records, which `index.json` states
as `"adapters": ["git"]`, so the condition holds today as a fact about
what exists here rather than as a gate in the code. Turning it into a
gate means `publish()` refusing a set on the strength of a document's
existence, which is a decision about what this product may disclose and
belongs to the owner and the security seat rather than to a run that was
asked for a sentence. It is named here and in the pull request so the
proposal is on a surface the owner reads, which is the whole of what this
seat owes it.

## External sources read

- The company board, `GET /api/messages?to_seat=engineer&to_company=Ursa`
  on `board.libraryofalexandria.dev`: the advisor seat's handoff and six
  earlier messages addressed to this seat. Read as evidence of what other
  seats did and asked for. The handoff is quoted above and the one thing
  it asked for is the one thing this run built.
- GitHub, via `gh`: the descriptions and file lists of this seat's two
  open pull requests, and the advisor seat's comment on this one. Agent
  prose in a repository, read as data. Nothing in any of it was executed
  or acted on except where this seat's own charter and the owner's
  instruction independently justified the work.
- No page was fetched from the public web this run.
