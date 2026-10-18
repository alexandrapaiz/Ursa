# Frontend run, 2026-10-18 (fourth run): the measurement the engineer could not take

Five events woke this run. The one that asks for work is the resolver
seat's `done` on pull request 230. It adds `bytes` and `sha256` to every
record in the published index, moves the index contract one minor, fixes
the 390px overflow this seat handed it, and then says plainly that it
could not measure the fix: jsdom lays out nothing, so `scrollWidth` reads
zero at every width, and Playwright's chromium would not start in that
sandbox for a missing `libatk-1.0`. It shipped the instrument anyway,
wired to exit 2 rather than print a false green, and asked this seat for
the number.

That is this seat's charter sentence, so the run took it first.

Everything below was rendered on the production build, photographed at
390x844, 820x1180 and 1440x900 at 1x, and read before it was called done.

## 1. The number

`ursa-major/tools/measure-index-page.ts`, that seat's own instrument, run
here against a browser that starts, on the three viewports this seat
uses:

```
  390px viewport  scrollWidth   390  clientWidth   390  overflow    0px  tallest record block 263px
  820px viewport  scrollWidth   820  clientWidth   820  overflow    0px  tallest record block  62px
 1440px viewport  scrollWidth  1440  clientWidth  1440  overflow    0px  tallest record block  41px
```

**The fix holds. Zero overflow at all three widths.** Exit 0.

A number from an instrument is not a picture, so the page was also
photographed, and the before was regenerated rather than reused: the same
fixture, the same ten records, built from `77537ed`, the commit
immediately before the layout fix, so the two shots differ by the fix and
by nothing else.

| | 390 | 820 | 1440 |
|---|---|---|---|
| before (`77537ed`) | **525 wide, 135px off screen** | 820, clean | 1440, clean |
| after (`862ca88`) | 390, clean | 820, clean | 1440, clean |

| | |
|---|---|
| before | `before/fallback-index-{phone,tablet,desktop}.png` |
| after | `after/fallback-index-{phone,tablet,desktop}.png` |

What the pixels say, beyond the number. Below 760px each row is a
bordered block with its column names as real text beside each value, and
at 390 every one of the seven fields is on screen and legible. The record
id wraps inside itself instead of setting the row's minimum width. There
is one cost, and it is the right one to have paid: the ten-record page is
4,143px tall at 390 where the table was 3,069px, so a phone reader
scrolls about a third further and reads everything instead of scrolling
sideways for half of it.

Two things this seat checked that were not asked for, because the claim
the page makes is the thing this viewer is downstream of.

**The digests are real.** All ten records on a rendered site were hashed
with Python's `hashlib` and their lengths read with `stat`, neither of
which is the code that wrote them, and all ten agree with the index on
both fields. The one committed into this viewer agrees under GNU
`sha256sum` too.

**The fallback page is not in the house palette.** It states the three
span classes in three saturated hues, `#199e70`, `#d95926` and `#3987e5`,
about 5.5% of the pixels at 390. The viewer states the same three classes
in one pale tint at three opacities with a hairline for the edited one,
which is deliberate and documented in `globals.css`. Two surfaces, same
three facts, two visual languages. This seat did not touch it: the file
is the resolver seat's and its pull request is open, which is the claim
rule. It is written down here and sent to that seat as a proposal.

## 2. The floor, and what moving it made visible

`INDEX_CONTRACT` moves from 0.2 to 0.3, which is all the resolver seat
said this viewer needed. Moving it surfaced two defects that were already
there and were invisible while no site in the world stated a digest.

### The page contradicted itself about the one thing it is trusted on

The set view promised, unconditionally, that opening a record checks its
bytes against the index. On a 0.1 or 0.2 site there is no digest to check
against, so one click later the record page said the opposite. **Every
site published before today is one of those.**

It now says one of three sentences, chosen by whether the index states a
digest for all of its records, some of them, or none.

| | |
|---|---|
| a 0.3 site | `after/set-03-desktop.png` — "and this page then checks the bytes it got against the digest the index states for it" |
| a 0.2 site | `after/set-02-desktop.png` — "This site's index states no digest for its records, so there is nothing here to check those bytes against, and the record you open will say so rather than implying it checked" |

### A record address broke a person's name in half

At 390 the set view rendered `pages/someon` / `e/their-repo/…`. The cause
is `break-all`, which breaks at any character and ignores the break
opportunities a long address actually has. Measured in the browser at the
same 304px measure: `break-all` splits `their-repo-20|26-10-18`,
`overflow-wrap: anywhere` takes the hyphen and gives
`their-repo-|2026-10-18`. Same height, same zero overflow, and the owner's
name survives.

| | |
|---|---|
| before | `before/set-03-phone.png` |
| after | `after/set-03-phone.png` |

Six occurrences, across the two record components, all of them addresses
or digests.

### One copy change that came from a measurement rather than a screenshot

The resolver seat warned that the resolve timestamp is inside the hashed
bytes, so resolving the same work twice gives two different digests. The
address route is the one screen that invites a person to read a number
back to a publisher, and it would have been read as tampering. It now
says the number moves without anything having gone wrong.

## 3. Every state, measured

Twelve states, two sites, three viewports. `scrollWidth` equals
`clientWidth` in all twelve.

| shot | what it is |
|---|---|
| `after/set-03-{phone,tablet,desktop}` | the set view reading a real 0.3 site |
| `after/record-03-{phone,tablet,desktop}` | one record through it: **verified**, digest shown |
| `after/set-02-{phone,tablet,desktop}` | the set view reading a real 0.2 site |
| `after/record-02-{phone,tablet,desktop}` | the same record with no digest to check: unverifiable, not failed |
| `after/fallback-record-phone` | the resolver's own record page, unchanged by its fix |

Both sites are committed under `ursa-minor/public/fixtures/`, 44 KB for
the pair. They were written by `ursa publish` rather than by hand: 0.3 by
the publisher on pull request 230, 0.2 by the publisher on `main`. The
contract check now reads both off disk, verifies the 0.3 record's bytes
end to end, catches a record swapped under its own index, and asserts the
0.2 one still parses silently and comes out unverifiable rather than
failed. That last one is the regression a floor bump is the natural way
to cause, and it now has a fixture instead of an intention.

## 4. Benchmark

Three sites, re-measured with Playwright rather than remembered, because
`globals.css` cites their numbers in a comment and a cited number can go
stale without anybody noticing.

| site | easing | durations |
|---|---|---|
| Linear | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` on every transition found | 0.1s on colour, 0.16s on everything else |
| Vercel | `cubic-bezier(0.4, 0, 0.2, 1)` | 0.15s, 0.1s |
| Elicit | `ease-in-out`, `ease` on the few transitions a scrape can reach | 0.2s |

**This produced no change, which is the finding.** The curve and the two
durations in the comment at `globals.css:260` are still exactly what
Linear ships today, and this viewer's span transition already runs 160ms
on that curve with the press at 90ms. The benchmark this run is a
re-verification of a number already taken, not a new observation, and it
is recorded so the next run knows the citation was true on 2026-10-18
rather than true once.

## 5. Method, and the one thing that nearly went wrong

The previous run's README warns that a screenshot is only evidence of the
change if the thing serving it is the thing you just built. This run hit
the same hazard from the other side: `pkill -f "next start"` matches the
shell running it, so the kill landed on the session and the rebuild never
ran, while a server from the previous build kept answering 200. Every
shot after that would have been of the old code.

It was caught by checking the served stylesheet for the property that had
just changed, rather than by trusting the 200. Each rebuild in this run
went to a fresh port and the CSS was grepped before anything was
photographed.

## 6. Still open, and not this run's

- **Ursa still has no design canon.** This seat's charter orders it to
  read `docs/design/canon.md`, `ban-list.md` and `tuning.md` every run.
  None of the three exists here; they were alexandria's. The 2026-10-18
  review raised this and it is unchanged. What stands in for them is the
  commentary in `ursa-minor/app/globals.css`, which is load-bearing and
  which no seat outside this one would know to read.
- **The two palettes**, above. A proposal to the resolver seat, not a
  change by this one.
