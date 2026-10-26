# Visual review, 2026-10-26c (begun on a message run, finished on a hook run)

**What this run is.** The run that opened this folder was killed at turn
152 with pull request #473 open and three commits on it, and the
provider limit that killed it refused the next run too. Nothing had
completed for this seat since. So this branch is cut from #473's head
rather than from `main`, carries its three commits unchanged, and
finishes the review it never got to write. #473 is closed with a pointer
here, which resolves the draft the amended ship-first rule says a killed
run's successor inherits.

**What the inherited run did.** It took the two findings the 2026-10-26
review recorded in its §7 as seen and deliberately not changed, and the
2026-10-26b review confirmed were still open, and changed them. Both are
on the Ursa Major overlay.

**What this run added.** It verified both against its own build, and
then measured two things on the overlay that no instrument had ever been
pointed at: how long a line of the new sentence actually is, and what
the panel's text measures against the pixels behind it. The first found
that the inherited fix had shipped the longest line on the page. The
second found the first contrast failures anyone has recorded on this
surface, one of which is fixed here and one of which is not a number at
all.

| | before | after |
|---|---|---|
| a sync failure | printed twice, raw, in two slots | once, in the body, where the panel already explains itself |
| the header's sync slot with no payload | `sync 500` | `not synced` |
| the footer's verdict line with no payload | `sync 500` | `no verdict yet` |
| a record with no characters | full empty bar + four em dashes | one sentence, no bar |
| that sentence's measure | **128 characters a line** | 81, the page's own 38em |
| `input::placeholder` | 4.12:1, the user agent's colour | **6.18:1**, `--dim` |
| `p` "held in memory only…" | 4.48:1 | 4.48:1, not changed, §4 says why |
| every frame, 320 to 1440 | — | no overflow, nothing clipped |

---

## 1. A sync failure had two homes and said nothing in either

With no bridge running, the panel's header slot and its footer verdict
line both fell back to the same `error` string, so an unlocked panel
read `sync 500` twice and said nothing else. `crops/panel-before.png`.

Neither slot was the right one. The header's is 10px, dim and
right-aligned, which is where a sentence goes to not be read. The
footer's is the line that reports the owner's own declaration, so a
transport failure printed there reads as a verdict about her work.

The error now has one home, in the body, one line above the empty state
that already says "nothing distilled for this project yet". That is the
place on this surface where the panel already says what it has nothing
to show and why. The two vacated slots say what they actually know:

- the header's slot holds the time of the last good sync, so with no
  payload it has no time, and it now says **which kind of nothing** it
  has. `connecting` after a connection that answered 500 was the panel
  claiming an in-flight state it was not in, which is the same defect as
  the duplication one layer down. It reads `not synced` when there is an
  error and `connecting` only while there is genuinely nothing yet.
- the footer reads `no verdict yet`, which is true in every state where
  there is no payload, including the error one.

`crops/panel-after.png` is the result and `crops/panel-synced.png` is
the same panel with a payload behind it, which matters for the next
paragraph.

**No error string's wording changed.** Which message a 500 deserves is
behaviour and the engineer seat's call. Only where it is drawn is this
seat's, and only that moved.

**The success path was photographed for the first time.** Every frame of
this surface before today was shot with no bridge running, because the
sync route needs a Vercel Blob store and answers 500 on a developer's
machine, so the only state anyone had ever seen was the failure, which
is the state the finding was written about. A fix to the failure path
that is never checked against the success path is half a fix.
`data/state-panel-synced.mjs` is the state module: it derives the key in
the page with the same `crypto.subtle` call the bridge uses, encrypts
the payload under it, intercepts exactly one fetch, and lets the page's
own `decryptJson` open it. Nothing is mocked except the transport, which
is the part that needs a Vercel account, and the wait is on the
decrypted project name rather than on a number of milliseconds (L15).

## 2. A record with no characters drew a full bar and four em dashes

`zero-chars-demo` has no characters in its finished work, so every share
on its line is `pct`'s em dash, and it drew those four dashes under a
full-width empty track. `crops/row-zero-before.png`.

The track was worse than silent. The legend two blocks above calls a
bare track "covered by no span", so the bar asserted that 100% of the
record was uncovered while the figures beside it refused to say anything
at all. Both come out and the row says the one thing it knows:

> No characters in the finished work, so there are no shares to show.
> Why a record ends up empty is in the record and not in this index.

`crops/row-zero-after.png`. The second sentence is there because the
dashboard genuinely cannot answer "why" — an exclusion the resolver
declined to certify lives in the record, and the index is a reader.

## 3. That sentence was then the longest line on the page

Nobody asked how wide the new paragraph was. It went into a `.dash-row`,
and a row on that page is as wide as the page, so it took the full 640px
column at 0.7rem. Counted a character at a time with L9's method
(`data/measure-dash-prose-before.txt`):

```
  tablet   p  dash-meta dash-nothing   640px  11.2px   2 lines  median 128
  desktop  p  dash-meta dash-nothing   640px  11.2px   2 lines  median 128
  desktop  p  dash-empty               517px  13.6px   3 lines  median  84
```

The smallest type on the page had the longest line on it, which is
exactly the drift L9 was written against, arriving through a door L9 did
not name: not a prose box set in pixels, but a paragraph given no box at
all, dropped into a container that was sized for a bar.

**Nothing in the kit would have caught it.** The frame does not
overflow, the contrast passes, the tap targets pass, and the narrow
sweep says the page fits at 320. Every instrument this seat owns returns
a clean number on a 128-character line.

**128 is also longer than any figure in L10**, whose highest is Claude's
109 and which calls that a defect shipped by a frontier lab and refuses
to take it as cover. Shipping 128 here would have taken it as cover
anyway.

The fix is `max-width: 38em`, the same measure `.dash-empty` already
carries on this page, so it is the page's own rule rather than a width
chosen for this one sentence (`data/measure-dash-prose-after.txt`):

```
  tablet   p  dash-meta dash-nothing   426px  11.2px   2 lines  median  81
  desktop  p  dash-meta dash-nothing   426px  11.2px   2 lines  median  81
```

`crops/row-measure-before.png` and `crops/row-measure-after.png` at
desktop are the before and after. The page's overall measure does not
move: narrowing that is L10's open proposal and the owner's call, not
this run's. The general rule is now L27.

## 4. The first contrast sweep this surface has ever had

L21 is the entry everyone quotes, and it says 0 of 533 runs below
threshold. Those 533 are `ursa-minor`'s five routes. The overlay's
panel, which is the surface a user meets first, had never been pointed
at by `measure-contrast.mjs` at all. Asked for the first time, at three
viewports on the shipped build (`data/contrast-panel/`):

```
  p                      12px  4.48  needs 4.5  SHORT  "held in memory only; …"
  input::placeholder     13px  4.12  needs 4.5  SHORT  "passphrase"
```

Both at phone, tablet and desktop alike, and the page held still between
the two shutters to 0.000% of the frame, so those backdrops are the
backdrops a reader sees.

### 4.1 The 4.48 is not a number, and that is the finding

`body` on this surface is `rgba(5, 8, 16, 0.85)` on purpose, so the
terminal reads through faintly. In a browser the pixels under that glass
are the canvas, and the backdrop composites to `rgb(43, 45, 52)`. That
is measured rather than assumed: the frozen frame's own pixel at
(200, 400) is exactly `(42, 45, 52)`. In the product the pixels under
the glass are whatever the user's terminal is showing, and `--dim` over
the glass reads

```
  white terminal   backdrop (43, 45, 52)   4.48
  mid grey         backdrop (23, 26, 33)   5.66
  black terminal   backdrop  (4,  7, 14)   6.56
```

So every contrast figure this instrument will ever print for the panel
is the worst end of a 2.08-point range the user controls, and the 15% of
transparency that buys the glass is what costs it. **Not changed.** A
0.02 shortfall at one end of that range is not worth editing a token
that is load-bearing across the whole panel, and the owner can overrule
this in one sentence, which is the form L21 set for the one short run on
`ursa-minor`. L28 carries it.

### 4.2 The placeholder was a gap rather than a decision, and is fixed

`passphrase` read 4.12 because the field named no placeholder colour, so
Chromium supplied its own, which is the field's `color` at 54% alpha. A
value nobody in this repository chose is not a palette decision being
protected. It now takes `--dim`, the token this panel already uses for
this rank of text, and reads **6.18** against the field's own opaque
`--panel` fill rather than against the glass (`data/contrast-panel-after/`).

`crops/locked-before.png` and `crops/locked-after.png` at 3x are the
evidence, and the frame diff is the arithmetic:

```
  panel-locked-phone.png   500 px  0.152%  rows 59-70, cols 32-112
```

500 pixels, confined to the bounding box of the word `passphrase`.
Nothing else on the panel moved.

`opacity: 1` rides along in the rule because Firefox applies a default
placeholder opacity on top of the colour, which would let the same
unowned value back in through the other door.

### 4.3 The 2026-10-24 claim that neither surface has a contrast problem

The ledger's open item on Ursa Major's two identities says "neither has
a contrast problem, so this is drift and not a defect". That clause was
written before either surface had been contrast-measured. It is
withdrawn in the ledger today. The conclusion it supported still holds,
but it holds on a measurement now instead of on the absence of one.

## 5. The visual pass, and everything that was checked and found fine

Every frame in `before/` and `after/` was read rather than diffed, at
phone 390x844, tablet 820x1180 and desktop 1440x900, on the panel locked,
the panel unlocked with no bridge, the panel synced, and the dashboard
against a two-record store. No frame overflows its viewport at any
viewport (`data/measurements-*.txt`).

Below 390, where L25 and L26 say nothing is visible to the three charter
viewports, all three surfaces were swept at 320, 360, 375 and 390
(`data/narrow-dash.txt`, `data/narrow-panel-error.txt`,
`data/narrow-panel-synced.txt`):

```
  0 of 4 page-by-width cells put content out of reach; 0 overflow
  reachably; 0 carry decoration that bleeds on purpose
```

for each of the three, which is twelve cells, all measured and none
unaccounted for. The new body error line and the new sentence both wrap
rather than clip at 320.

One thing checked that does not need changing: the empty-record sentence
is set in the proportional face while the rest of its row is monospace.
That is the page's existing rule and not an oversight — on this surface
mono is data and the proportional face is prose, which is why the
intro paragraph and the footer note are already set in it. The sentence
is prose.

## 6. One defect in the instrument, fixed

`measure-narrow.mjs` sized its page column at a fixed 10 characters, so
`--pages panel-synced=/` printed

```
  320   panel-synced320 at 0        fits
```

with the width run into the name and the name into the content box. A
table whose columns collide is a table that gets read wrong, and being
read is this instrument's whole job. The column is now as wide as the
widest page name in the run plus a space, and the header is formatted
from the same value rather than hand-spaced, so the two cannot drift
apart again.

## 7. The benchmark: does anybody leave a placeholder to the browser?

§4.2 rests on a claim about practice, so the claim was put to the field.
`data/bench-placeholders.mjs` at 1440x900, read-only — nothing clicked,
nothing typed, nothing submitted — reads the colour each site's browser
actually resolves for `::placeholder` and compares it against the user
agent default, which Chromium defines as the field's own colour at 54%
alpha and is therefore detectable rather than guessed:

| site | visible placeholder | resolved colour | verdict |
|---|---|---|---|
| Stripe | "Sell software subscripti…" | `rgb(100, 116, 141)` | chosen, alpha 1 |
| Consensus | "Ask the research…" | `rgb(113, 113, 123)` | chosen, alpha 1 |
| Linear | none on the home page | — | — |
| Vercel | none on the home page | — | — |
| Elicit | none on the home page | — | — |

Two of five ship a visible placeholder on their home page, both name a
colour outright at full alpha, and neither takes the user agent's. The
three zeroes are not failures to load: those pages loaded and carry no
input with a placeholder on them, which matches L10's note that their
home pages are layout rather than prose.

**Why this benchmark and not an interaction one.** The charter asks each
run for two or three best-in-class sites and the owner's standing
interest is Elicit's bouncy hover feel. This run's two changes are both
text, neither adds or alters an interaction, and the one claim it makes
about other people's practice is the placeholder one. A benchmark
pointed at hover physics would have measured something nothing here
touches. The hover work remains the right next item and is proposed in
§9.

## 8. The build

`npx next build` in `ursa-major/overlay` ran six times today, two of
them on a build directory removed first, and none of the six failed on
its first attempt. The 2026-10-26 review
recorded it failing once with `SecurityFatalError` and succeeding on an
immediate retry every time, and the 2026-10-25c run saw the same from
`ursa-minor`. It did not reproduce here on a `node_modules` installed
fresh by `npm ci` this morning. That is one host and one day, so it is
recorded as not reproducing rather than as fixed.

`next dev` was not used. Every frame here is `next build` followed by
`next start`, as 2026-10-24g established for this app.

Two servers, both on loopback, both this run's own: the store on 7851
(`ursa serve` over a two-record fixture at
`/tmp/ursa-frontend-2026-10-26-hook/zero-store`) and the overlay on 7852.
Ports were chosen away from the defaults because the 2026-10-26 run
found another seat's dead server answering 7818 and shot three frames of
it before noticing.

## 9. Proposals, which are the owner's and not this seat's

**9.1 The panel's contrast floor, if she wants one.** §4.1 leaves
`--dim` at 4.48 against a white terminal. If she would rather the panel
clear 4.5 at every end of the range, the change is one token and L28 is
the entry to revise. The seat's recommendation is to leave it.

**9.2 The hover work the charter keeps asking for.** Eleven reviews have
now spent their budget on measurement and repair, and the interaction
refinement step the charter puts at number four has not been reached on
the overlay at all. The overlay's three controls (`run`, `reread`,
`forget this`) have no hover transition of any kind. That is the next
item, it wants a benchmark pointed at Elicit's spring rather than at
placeholder colours, and it is named here so the next run does not have
to rediscover it.

**9.3 Still open and still not this seat's.** Where Ursa's canon comes
from. The ledger's own count of reviews recording that `canon.md`,
`ban-list.md` and `tuning.md` do not exist is kept there rather than
restated here.

## 10. External sources read

- The public web, through Playwright, read-only: `linear.app`,
  `vercel.com`, `stripe.com`, `consensus.app`, `elicit.com`. Nothing was
  clicked, typed into, submitted or followed. Two computed colour
  values and the presence or absence of a placeholder are the only
  things taken from them.
- This seat's own pull requests and their GitHub metadata, through
  `gh pr list`, `gh pr view 473` and `gh pr close 473`.
- The toolchain's console output.
- The two local servers above, both built from this checkout.

**Nothing read from outside this repository's committed files directed
this run's work.** Unlike 2026-10-26, nothing tried: the `next build`
advisory that review quoted, which asks the agent to put a question to
the user on the dependency's behalf, did not appear on any of this run's
six builds. Its absence is not evidence that it is gone, and 2026-10-26
§10 remains the record of what it says.
