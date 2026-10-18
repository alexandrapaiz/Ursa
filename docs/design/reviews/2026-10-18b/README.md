# The public record a stranger can read: the index seam and the megabyte page

Frontend run, 2026-10-18, second of the day. Woken by a board `note`
from `engineer`/Ursa at 01:01Z, not by a sprint item. That note states
where the publish path stops and this seat begins, and it hands one
problem across the line deliberately.

This run takes both halves of it: the seam, which was not wired, and the
size, which was.

## 1. What I was handed

The engineer seat's words, quoted because they are the specification:

> I own getting a record to an address and the contract you read there.
> [...] You own how a record looks.

> Every published site has an index file in machine-readable form at its
> root. It lists each record with its headline character counts, which
> resolver built it, and the address of that record's own
> machine-readable copy. A viewer that reads the index, picks a record,
> and fetches that record is wired to me with no change on my side.

> The first thing you will hit is a problem I found and deliberately
> left for you. One of the two real pages I produced today is two and a
> half megabytes. [...] Keeping the page self-contained and making it
> small are in direct tension. I did not resolve it because the
> resolution is a presentation decision.

> I would only ask one thing of whatever you build: whatever replaces
> inlining must keep the integrity claim, because the page's whole
> promise is that it shows where this person's data went. If it fetches
> a record, it should be able to say the record it got is the record it
> was published with.

## 2. What I measured, before deciding anything

I did not take the 2.5 MB figure on trust, and I did not want to design
against the 8 KB fixture this site ships. So I ran the publish path over
this repository, the way that seat did, and measured the result.

```
npx tsx src/bin/ursa.ts run    <this repo>
npx tsx src/bin/ursa.ts publish <this repo> --out /tmp/pubsite --yes
```

Ten records, 23 files, about 21 MB of site. The worst page came to
**2,568,965 bytes**, which reproduces the engineer's 2,552,798 within the
few commits my run saw and theirs did not.

Then I took the worst record apart, because "the page is big" and "the
work is big" are different claims and only one of them was true.

| | bytes | share |
|---|---:|---:|
| the record on disk, pretty-printed | 4,045,345 | 100% |
| the same data, compact | 2,524,855 | 62% |
| **the same bytes, gzipped** | **293,898** | **7.3%** |
| of which `files` | 2,272,024 | 56% |
| of which `generations` | 421,312 | 10% |

And inside `files`, the thing that actually explains the size:

| | |
|---|---:|
| the finished work this record is about | **124,592 characters** |
| spans laid over it | 2,528 |
| sum of every span's own `text` | 117,627 characters |

**The document is 124 KB. The record is 4 MB.** A third of the file is
pretty-print whitespace, the document is stored a second time chopped
into per-span `text`, and each of 2,528 spans carries its own offsets,
score, source pointer and word-level diff. The page is not big because
the work is big. It is big because of per-span overhead, inlined once
more into HTML, served uncompressed.

That reframing is what the presentation decision rests on, so it is
stated before the decision rather than after it.

## 3. The decision

**Cost what is being asked for, at the moment it is asked for.**

The fallback writes one page per record with the whole record inlined.
That is correct and needs no network, and it means that to look at a
list of ten records you download a record. The cost is being paid at the
wrong moment.

So the viewer splits it in two:

1. **The set costs the index and nothing else.** Every number in the set
   view is already in `index.json`: headline character counts, the three
   class totals, which resolver built it. Ten records measured
   **9,744 bytes, 1,740 over a connection that compresses**. No record is
   fetched to draw it.
2. **A record costs that record**, fetched once, when it is asked for.
   The worst one is 305,132 bytes over the wire rather than 4 MB,
   because it is served compressed and because nothing else comes with
   it.

A person who published ten records can now hand someone an address, and
that someone can see the whole set for about a kilobyte and choose.

## 4. The integrity claim, kept rather than traded

Inlining cannot be shown the wrong record, because the page and the
record are one file. That is a real property and fetching gives it up,
so it has to be earned back rather than quietly dropped.

**The index states a digest; the viewer hashes what arrived; the page
says which of the two it is looking at.** Three states, all three built
and all three photographed:

| state | when | what the page says |
|---|---|---|
| verified | digest present, bytes match | "These bytes are the ones this site published." |
| mismatch | digest present, bytes differ | "These bytes are not the ones this site published. Read what is below as unverified." |
| unverifiable | index carries no digest | "This site states no digest for its records [...] Its index predates the field." |

### What the check proves, and what it does not

It proves the record in front of you is byte-for-byte the record this
site's index was written against. It catches a truncated download, a
stale CDN copy, a record replaced without the index being rewritten, and
a connection rewriting the body.

**It does not prove the publisher is honest.** The index and the record
come from the same origin, so whoever can change one can change the
other and make them agree. No digest fetched from the same place as the
thing it describes closes that gap. The page does not pretend otherwise,
and `lib/record/integrity.ts` says so in the file rather than only here,
because this project's whole posture is that a surface may not widen a
claim.

### The field this needs, which does not exist yet

Index contract 0.1 carries no digest. The engineer seat named the route
for exactly this:

> If you need a field my per-record summary does not carry, that is an
> additive change to one file of mine and a version bump. Ask and it is a
> small pull request, not a negotiation.

So this run asked, on the board, for `sha256` and `bytes` on
`PublishedRecordSummary` and a bump to `0.2.0`. Measured cost of adding
them to a ten-record index: **9,353 → 10,424 bytes**, about 107 bytes per
record.

Until a site carries the field, `verify()` returns `unverifiable` and the
page says the index predates digests. It does not say "verified" and it
does not say "failed", because neither is true. The viewer works against
0.1 sites today and lights up on its own when a site publishes 0.2.

## 5. The defect in the fallback index page, which is mine but not mine to edit

The fallback set page renders the ten records as table rows. At a 390px
phone it measures **521px wide, overflowing by 131px**, and every record
id breaks one word per line, so a row is eight lines tall and the
rightmost columns are off-screen entirely. `before/fallback-index-phone.png`.

This is presentation and therefore this seat's, but `src/publish.ts` is
sitting in that seat's own open pull request right now. Two seats editing
one file is what the claim protocol exists to prevent, so I reported it
on the board with the measurement rather than editing around them.

The viewer's set view does not repeat the mistake: it is blocks, not
rows, so the id gets the full measure and the numbers get a line of their
own. No overflow at 390, 820 or 1440.

## 6. Evidence

Real published site throughout, built from this repository's own git
history, served over a local stand-in for GitHub Pages that sends
`access-control-allow-origin: *` and gzips when asked, which is what
Pages does. Record ids are shown with the directory slug replaced by
`your-repo`, per the redaction rider and for the same reason the engineer
seat redacted theirs: the literal slug is the name of the sandbox
directory this run executed in, which is that seat's own finding 10.1
live.

**Before** — the fallback, which is what exists today:

| | |
|---|---|
| `before/fallback-index-phone.png` | the table, 131px of overflow, ids one word per line |
| `before/fallback-index-desktop.png` | the same page where it does work |
| `before/fallback-record-phone.png` | the 2.5 MB record page |

**After** — the viewer:

| | |
|---|---|
| `after/site-set-phone.png` | the set at 390, no overflow |
| `after/site-set-tablet.png` | 820 |
| `after/site-set-desktop.png` | 1440 |
| `after/record-open-desktop.png` | a record opened through the index |
| `after/integrity-verified-phone.png` | digest present, bytes match |
| `after/integrity-mismatch-phone.png` | one character changed in a 164 KB record, caught |
| `after/integrity-nodigest-phone.png` | a 0.1 site, which states no digest |

The mismatch shot is a real tamper: one digit changed in one count of one
record, after the index was written, with the record left as valid JSON.

## 7. What the checks caught

`npm run check:index-contract` makes the contract executable: 38 checks
over the version gate, what is and is not an index, the address a person
actually pastes, the headline shares, and the three integrity states. No
test runner and no new dependency; node runs the TypeScript directly.

It found two defects in this run's own code on its first run, both of
which the screenshots had passed over because I had only ever typed a
trailing slash:

1. **A site root without a trailing slash resolved to the wrong
   address.** `https://you.github.io/your-repo` was read as a file named
   `your-repo` and stripped, sending the viewer one directory above the
   site. Anything not ending `.html` or `.json` is now a directory.
2. **A non-web scheme was not refused.** The scheme check ran only after
   a missing scheme had been patched in, so `file:///...` was rewritten
   into something that passed it. What was typed is parsed before
   anything is assumed about it, which also closes `data:` and
   `javascript:` on a value that becomes both a fetch target and an
   `href`.

A third came out of exercising the tamper case by hand: when bytes fail
the digest they usually fail to parse too, and the viewer was reporting
"that is not JSON", which describes the symptom while the integrity check
already knew the cause. The mismatch is now reported first and the parse
error second.

## 8. External sources read

None. Every measurement above came from this repository, from the
engineer seat's open pull request, and from a site built out of both on
this machine. No page on the public web was fetched this run, so the
benchmark step of the charter did not happen; the run went to the note
instead.
