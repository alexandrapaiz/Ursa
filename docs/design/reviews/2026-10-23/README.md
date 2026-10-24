# Frontend run, 2026-10-23: the measurement the last run could not take

Pull request 240 merged onto `main` today and recorded a debt against
itself in two places, the pull request body and
`docs/design/pairing-bounds-in-the-set-view.md` §5:

> The next run of this seat owes the nine shots at 390x844, 820x1180
> and 1440x900 and the engineer seat's 3.4 KiB re-measured.

That run could not take either. Its host's root filesystem sat at 100
percent for the whole session with between 22 and 230 megabytes free,
two of its writes failed with ENOSPC, and there was no cached browser
on it. This host had 16 gigabytes free, so both are taken here, and
both are below.

Everything in this file was rendered on a production build, the
pages photographed at 390x844, 820x1180 and 1440x900 at 1x, and read
before anything was called done.

## 0. Getting a browser to start, because the last three runs could not

Chromium downloaded but refused to launch, on the same
`libatk-1.0.so.0` the resolver seat hit on 2026-10-18. This host has no
root and `sudo` is refused by the no-new-privileges flag, so
`playwright install-deps` is not available.

Eight libraries were missing. `apt-get download` needs no privileges,
and `dpkg-deb -x` unpacks into a directory the seat owns, so the whole
set came down as `.deb` files and was extracted into `/tmp/pwlibs/root`
and put on `LD_LIBRARY_PATH`. Two more turned up on the second pass,
because `ldd` only reports what it reaches:

```
libXcomposite.so.1  libXdamage.so.1  libXfixes.so.3  libXrandr.so.2
libasound.so.2      libatk-1.0.so.0  libatspi.so.0   libgbm.so.1
libXi.so.6          libXrender.so.1
```

```
LD_LIBRARY_PATH=/tmp/pwlibs/root/usr/lib/aarch64-linux-gnu node shoot.mjs
```

This is worth writing down rather than leaving in a shell history. A
seat whose defining rule is that it looks at pixels has now been
blocked from looking at pixels on two separate hosts for the same
reason, and the workaround needs no permission anybody has to grant.

## 1. The nine shots, which came to thirty

Four pages at three viewports, plus the set reader in all six states
the pairing work created, at three viewports each. Thirty frames, in
`after/`, every one of them read.

**No page overflows its viewport at any of the three widths.** Measured
rather than eyeballed, `documentElement.scrollWidth` against
`clientWidth` on every frame:

| | 390 | 820 | 1440 |
|---|---|---|---|
| home | 390 | 820 | 1440 |
| `/record` | 390 | 820 | 1440 |
| `/record/mini-fixture` | 390 | 820 | 1440 |
| `/record/at` | 390 | 820 | 1440 |
| set, one bound | 390 | 820 | 1440 |
| set, two bounds | 390 | 820 | 1440 |
| set, bounds absent | 390 | 820 | 1440 |
| set, bounds stated as none | 390 | 820 | 1440 |
| set, unbounded walk | 390 | 820 | 1440 |
| set, empty | 390 | 820 | 1440 |

The six set states needed six published indexes and only two existed.
`ursa-minor/public/fixtures/site-03` and `site-04` cover bounds-absent
and two-bounds. The other four are in `fixtures/` here and were served
over a local CORS server on port 4333, which is why they are committed
as part of the evidence rather than added to the site's own fixtures:
they are this review's instrument, not the engineer seat's contract.

## 2. What the pixels said, and the two fixes

### A middot line was breaking inside its facts

Both lines in the set header are lists of short facts joined by a
middot, and at 390 both broke wherever the measure ran out:

```
2 records · someone/their-repo · published
2026-10-18 · 2 KB of index read, no record
fetched

400 commits forward · 720 hours · 2
interposed generations
```

The second one is the defect that matters. A reader on a phone meets
`· 2` at the end of a line with nothing saying what the 2 counts, and
finds `interposed generations` on the next line having already decided
what the number meant. The first is milder and the same shape:
`published` separated from its date, `no record` from `fetched`.

The middot is what tells a reader where one fact stops. A break
anywhere else contradicts the punctuation, and this page's whole
argument is that the reader should be able to trust what it prints.

Each fact now carries its own separator glued to its right, the way a
comma stays with the word before it, and the only breaking space left
is the one between facts:

```
2 records · someone/their-repo ·
published 2026-10-18 ·
2 KB of index read, no record fetched

400 commits forward · 720 hours ·
2 interposed generations
```

The repository name is the exception and stays breakable. It is one
token with no internal space to protect, and it is the only fact whose
length a stranger controls, so `someone/a-very-long-repository-name`
has to be allowed to wrap inside itself rather than push the viewport
sideways. Refusing to break a word is only safe when something else
bounds its length.

The reader's string contract is untouched: `pairingCopy` still returns
`sets: string[]` and `check:index-contract` still asserts
`sets[0].startsWith('400')`. The split happens in the view, on an
exported `FACT_SEPARATOR`, so the engineer seat's assertions keep
meaning what they meant. The bounds list also picked up the same
`max-w-2xl` measure as the paragraph above it, which it did not have.

| | before | after |
|---|---|---|
| 390 | `before/set-04-phone.png` | `after/set-04-phone.png` |
| 820 | `before/set-04-tablet.png` | `after/set-04-tablet.png` |
| 1440 | `before/set-04-desktop.png` | `after/set-04-desktop.png` |
| one bound, 390 | `before/set-single-phone.png` | `after/set-single-phone.png` |
| bounds absent, 390 | `before/set-03-phone.png` | `after/set-03-phone.png` |

### The set's primary control was the one thing that snapped

The record id's underline was a Tailwind `group-hover:underline`, which
is an instant on and an instant off. Measured on the build before the
fix, scrubbing the transition to a fixed point so the frame is
deterministic rather than a race with the screenshot:

| | before | after |
|---|---|---|
| `transition-duration` on the id | `0s` | `0.16s, 0.16s` |
| timing function | `ease` (inert, nothing animates) | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` |
| `text-decoration-color` at 40ms of a hover | `rgb(168, 199, 250)`, fully drawn | `rgba(168, 199, 250, 0.455)`, mid-fade |

Every other interactive thing on the page eases over 160ms. The one
piece that did not was the control the whole set view exists to offer.

It now uses the house idiom from `.rec-action`: the underline is
present and transparent rather than absent, so it fades in instead of
appearing, and the row cannot shift by a pixel when it lights up.
`:active` carries the same state, so a touch, where there is no hover
at all, still shows the row answering the finger.
`prefers-reduced-motion: reduce` drops the duration to 1ms.

`before/hover-record-row-desktop.png` and
`after/hover-record-row-desktop.png` are the same frame of the same
hover, both scrubbed to 40ms, from two builds that differ by this
change alone. `after/hover-record-row-desktop-settled.png` is where it
lands.

That is two interaction refinements, which is the charter's limit for
one run. Everything else below is a measurement or a proposal.

## 3. The weight, re-measured on a browser

The 3.4 KiB figure in `docs/design/pages-dogfood.md` is
`measure-published-site.ts`'s, and that tool does not use a browser: it
runs `gzipSync(body, { level: 9 })` and calls the result the transfer.
So the thing actually owed is not a second opinion on the arithmetic.
It is whether a browser, over a connection, receives what that tool
predicts, and what the `pairing` field costs.

Two sites were published with `publish()` from the same record, one
with `task.pairedBy` stamped and one without, which is exactly a 0.4
site beside the 0.3 site it would have been. Both were served over a
local HTTP server compressing at gzip level 6, which is nginx's default
and a static host's ordinary setting rather than the tool's level 9.
Chromium's own request accounting then reported what arrived:

| | `gzipSync` level 9, the tool | Chromium over the wire, level 6 |
|---|---|---|
| set page, no pairing stamp | 3.3 KiB | 3,360 bytes |
| set page, pairing stamped | 3.3 KiB | 3,430 bytes |

**The engineer seat's claim holds. The set page is 3.3 KiB over the
wire and the `pairing` field costs 70 bytes of it**, against the 0.1 KiB
that seat estimated. The tool's level-9 estimate and the browser's
level-6 reality agree to the tenth of a kibibyte at this size, which is
the useful finding about the instrument: it is not flattering itself.

### The number nobody asked for, which is the larger one

The same measurement run against this repository's own viewer, cold, at
390 wide:

```
viewer /record          15 requests   226,788 bytes   221.5 KiB
published set page       1 request      3,430 bytes     3.3 KiB
```

The viewer costs **sixty-seven times** what the page it is a viewer for
costs. Two woff2 files are 45.7 KiB of that and the rest is the
application. This matters beyond arithmetic because of what the page
prints: `2 KB of index read, no record fetched`, which is true about
the index and silent about the 221 KiB the reader already paid to be
shown that sentence. The honest version of that line is a question for
the owner, not a change this run made.

**22.6 KiB of it is one webfont for one wordmark.** `Inter_Tight` at
weight 200 is loaded for the `URSA MINOR` mark in the site header and
for nothing else in the repository; everything else is the system
Helvetica stack that `globals.css` sets at line 158, and the monospace
is Geist Mono. Ten characters, on every first visit of every page, for
a tenth of the page's weight. A proposal, below, not a change: the
wordmark is identity and narrowing how its font loads is the owner's
call.

## 4. Benchmarks

Linear and Elicit, read with Playwright at 1440 on 2026-10-23, by
computing the transition declarations actually in force on their
interactive elements rather than by looking at them.

**Linear.** Almost everything it transitions is between 100 and 160ms,
and the curve under most of it is `cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
an ease-out quad. The most common declaration on the page by a wide
margin is `color` alone at 100ms, on 38 elements. The craft is not that
the motion is elaborate. It is that the motion is short, that one curve
is used nearly everywhere, and that the cheapest possible property is
the one being animated. It also ships 35 `prefers-reduced-motion`
blocks, which is not a detail somebody adds at the end.

Our own `.rec-action` is 160ms on that same curve, so a previous run of
this seat already translated this and it is already law here. What this
pass found is that the translation had not reached the set view's own
rows, which is fix two above.

**Elicit.** The bouncy hover feel the owner likes is not in its
computed CSS. Reading its elements at rest gives two declarations in
total, a 200ms ease-in-out on `transform` and a 200ms ease on
`opacity`, which does not describe a spring. So the feel is produced in
JavaScript on interaction, by a motion library, and a static read of
the stylesheet cannot capture it. Saying so is more useful than
inventing a curve and attributing it to them. Capturing it properly
needs a run that drives a hover and samples the transform over frames,
which is a whole pass of its own and is proposed below.

It also ships **zero** `prefers-reduced-motion` rules, which is worth
noting precisely because it is the site this seat is told to admire.
Admire the feel, not the omission.

## 5. Proposals, not changes

1. **Subset the wordmark's font, or set the wordmark in the system
   stack.** 22.6 KiB for ten characters on every first visit. Next's
   `next/font/google` takes a `text` option that subsets to named
   characters and would cut this to a few hundred bytes. It is a change
   to how identity renders, with a real failure mode if a glyph is ever
   missing, so it wants the owner's word rather than this seat's. Needs
   the Next 16 font docs read first, per `ursa-minor/AGENTS.md`.

2. **The two surfaces disagree about naming the resolver's defaults,
   and the viewer is the one that is right.** `pairingCopy` in the
   viewer refuses to name them, and the note merged today says why in
   as many words: filling an absence with the resolver's defaults is
   "publishing a number the site never stated". But `pairingSentences`
   in `ursa-major/src/publish.ts` appends `The resolver's own defaults
   are X and Y.` to all three of its branches, including the one that
   has just told the reader that none of the records state their
   bounds. That is the published page doing the exact thing the viewer
   was changed not to do, one click away, about the same set. Not this
   seat's file. Routed to the engineer or resolver seat as an
   observation, with the note that both sentences cannot be the
   company's position at once.

3. **Measure Elicit's hover properly.** Drive the hover, sample
   `transform` over frames, fit the curve, and write the result into
   whatever stands in for `canon.md` here. The owner named this feel
   specifically and this seat has now twice described it from the
   outside.

4. **A `make-review-shots` instrument, or whatever it should be
   called.** Three of the last four runs of this seat spent a large
   part of themselves getting a browser to start and a server to serve
   the build they just made. `shoot.mjs`, `hover.mjs` and `weigh.mjs`
   are committed here as a start, but they are review artifacts in a
   dated directory, which means the next run will write them again.

## 6. Still open, and not this run's

- **Ursa still has no design canon.** The charter orders every run to
  read `docs/design/canon.md`, `ban-list.md` and `tuning.md`. None of
  the three exists here; they were alexandria's. Raised by the
  2026-10-18 review and by the one before it, unchanged. What stands in
  for them is the commentary in `ursa-minor/app/globals.css`, which is
  load-bearing and which no seat outside this one would know to read.
- **`next build` stops once per machine on a security advisory.**
  Next 16.4.0 refuses the first build with `SecurityFatalError` and a
  recommendation to run `next upgrade --agent=security`, then proceeds
  on a retry. This run did not run that command: a Next major upgrade
  is a dependency decision governed by `dep-floor.allow.json` and
  `docs/design/dependency-floor.md`, and it is not a frontend polish
  change. Naming it because every build in this repository now costs
  two invocations, and because the advisory is real whoever acts on it.

## 7. How to reproduce

`playwright` is a dev-only tool here and is deliberately not a
dependency of the site, so it is installed without saving. Run
everything below from `ursa-minor/`, with `LD_LIBRARY_PATH` set as in
§0 on any host that lacks the libraries.

```bash
npm ci && npm i -D --no-save playwright && npx playwright install chromium
npm run build && npm run build          # twice; see §6 on the advisory
npx next start -p 4488 &

R=../docs/design/reviews/2026-10-23
node $R/serve-fixtures.mjs &            # the four ad-hoc set states, :4333
node $R/shoot.mjs                       # thirty frames into after/
node $R/hover.mjs /tmp/h.png 40         # the hover, scrubbed to 40ms

cd ../ursa-major && npm ci
npx tsx $R/publish-pair.mts             # /tmp/site-a and /tmp/site-b
node $R/serve-published.mjs &           # gzip level 6, :4344
cd ../ursa-minor && node $R/weigh.mjs   # what a browser actually receives
```

The committed frames are PNGs reduced to a 128-colour adaptive palette,
which took the directory from 6.9 MB to 2.6 MB. The pages are a near
monochrome night sky and the reduction is not visible at 1x; it was
checked against the full-colour original before it was applied to all
of them. Anything in this file that turns on a colour value was read
from the browser's computed styles, not from these images.
