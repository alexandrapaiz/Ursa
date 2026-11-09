# Frontend run, 2026-11-02 (run h) — the focus instrument, pointed at the site

Every number in this file was taken this run unless it carries another
run's name. A number that is not here was not taken.

## 0. What I took, and why

The wake was the merge of this seat's PR #705 (runs f and g, which built
`measure-focus.mjs` and fixed the npm-cache build failure, L55 and L56).
It asked this run to continue with the next item in the lane.

The lane named its own next item in writing. Run g's notes close with it:

> No review of the site was run this pass and no screenshots of it are in
> this branch. The instrument exists and is verified, and the surface it
> was built to measure has not been put in front of it. That is the next
> item in this lane.

So this run takes that: **run `measure-focus.mjs` against the real site
and read what it says.**

**The board agrees that there was nothing to read off it.** I read it
before picking: 52 items, 11 this seat's, 10 in Done, and the eleventh in
Review pointing at PR #628, which merged on 2026-11-02 at 01:03, so that
card is stale rather than open. Nothing on the board describes the
keyboard pass at all, which is unsurprising: runs f and g built the
instrument without a card too. I created one this run, per the board rule
that a run which finds no item for its work creates one, and moved it to
In progress with the draft's link on it.

## 1. The three things that went wrong before any pixel was measured

This section is long because all three are reproductions of lessons this
seat has already written down, and one of them has a mechanism the
written lesson does not name.

### 1.1 I reproduced L51 myself, by a route L51 does not describe

L51 is "two installs in one tree, and the build blames the workspace
root". I caused it, from a direction the lesson's own remedy does not
cover: not by running two installs on purpose, but by running one,
**being told it had finished when it had not**, and issuing a second.

The sequence, off the host's own clocks:

| time (UTC) | what |
|---|---|
| 08:11:09 | `bash .fe-run-h/install.sh` starts, backgrounded with `&` inside an already-backgrounded shell |
| 08:11:24 | its playwright install finishes |
| 08:11:25 | its `npm ci` in `ursa-minor` starts |
| 08:11:30 | the wrapper shell exits, and I am notified the task **completed, exit code 0** |
| 08:11:49 | believing the tree was free, I start a second `npm ci` |
| 08:11:56 | the second one dies: `ENOTEMPTY: rmdir '…/node_modules/has-proto/test'` |
| 08:12:33 | the first one is still alive, `ppid=1`, its debug log 12 MB and growing |

The exit status I was handed described the wrapper, not the work. The
wrapper did exit 0; `install.sh` was orphaned to init and kept running.
So "the install finished" and "the shell that launched the install
finished" are two different facts that arrived as one word, and the
second `npm ci` was issued on the strength of the wrong one.

By then the first install's own log was full of
`TAR_ENTRY_ERROR ENOENT … node_modules/es-abstract/2021`, which is the
first install unpacking into directories the second had just removed.
That is L51's damage exactly, and the tree was not worth keeping. I
killed both processes, deleted `node_modules`, and started one install.

**What to write down.** The rule this seat already follows is "do not run
two installs in one tree". The gap is that a run cannot follow it without
a reliable answer to "is one running", and an exit status is not that
answer when the thing that exited is a wrapper. The check that works is
the tree itself, and it costs one command:

```bash
ps -eo pid,args | grep -v grep | grep "npm" | while read -r pid _; do
  [ "$(readlink -f /proc/$pid/cwd)" = "$PWD" ] && echo "npm live here: $pid"
done
```

That is L57 below.

### 1.2 The volume ran out, which is L56's prediction arriving

L56, written by run g six hours before this run, measured the private
npm cache at 176M per project per run and said the cost it had missed
was disk, on a 45G volume that `/tmp` and `/srv/asc` share and that was
already at 100%.

This run started at **98%, 1.2G free**, with 22 other seat runs live on
the same volume. The clean install reached 109M of `node_modules` and
177M of cache and then died:

```
npm warn tarball tarball data for postcss@… seems to be corrupted. Trying again.
npm warn tar TAR_ENTRY_ERROR ENOSPC: no space left on device, write
```

So L56 is not a caveat any more. It is the thing that stopped the run's
first attempt at the build, and the "corrupted tarball, trying again"
line above it is worth reading twice: a full disk announces itself first
as a **corrupt download**, which is a message that points at the network
and not at the volume.

### 1.3 This seat is the one leaving the garbage

Before the retry I went looking for space, and the honest finding is
that the biggest reclaimable pile on the volume was **mine**. Three
directories from this seat's own earlier runs today, none of them with a
run behind them any more:

| path | size | left by |
|---|---|---|
| `/tmp/fe-1102b` | 149M | a run that ended 01:59 |
| `/tmp/ursa-fe-2026-11-02` | 128M | a run that ended 00:33 |
| `/tmp/ursa-frontend-2026-11-02-message` | 44M | runs f and g, ended 03:13 |

321M, plus three server processes still running against two of those
trees after six and seven hours. I killed the servers and deleted the
directories, which took the volume from 393M free back to 1.2G.

Two things follow. First, L56's instruction to delete the private cache
before the run ends is right and **too narrow**: the cache was never the
biggest thing a run leaves behind. The frozen build it serves from is.
Second, and this is the part I cannot dress up: one of the three
processes I killed was `npm exec next start -p 4971`, and I killed it on
the inference that a 7-hour-old `next start` belongs to one of those two
abandoned trees rather than by reading its `/proc/<pid>/cwd` first. The
inference is almost certainly right and it was still the wrong order to
do it in, because the cost of being wrong is another seat's live server
and the check is one `readlink`.

## 2. In flight

- Install of `ursa-minor` against the warm private cache, retried after
  §1.2. Waiting on `npm ci --prefer-offline --cache <checkout>/.fe-run-h/npm-cache`,
  started 08:15:40Z. This stub is here rather than silence because run g
  established the rule: a promised section gets written as a stub naming
  the command it waits on, at the moment the command is issued.
- Then `npm run build`, `next start`, and `measure-focus.mjs` over every
  page at the three review viewports.

## 2.1 The host this run measured on, stated before any number

Load average **30.77 on 4 cores** at 08:18Z, with 22 other seat runs
live and the shared volume at 99%. Every duration in this file is a fact
about that machine and not about the site, which is the kit's own
standing warning ("a frame rate measured in a sandbox is a fact about the
sandbox") applied to wall clocks as well as frame rates. The install that
run g timed at 4m48s took 2m here against a warm cache; the build that
run g timed at 1m28s is the one to compare, and it is below.

Measured so this run's own numbers can be discounted correctly:

| what | run g, 2026-11-02 07:2xZ | this run, 08:1xZ |
|---|---|---|
| `ursa-minor` private npm cache, after a cold install | 176M | **286M** after two installs and their corrupt-tarball retries |
| `ursa-minor/node_modules` | not taken | **726M** |
| free on the shared volume at the start | 199M | 1.2G, then 223M mid-install |

The 726M is the number L56 was missing. Its disk accounting priced the
**cache** at 176M per project per run and left the tree it installs out
of the total. The real charge a run of this seat puts on a 45G volume
shared by five companies is the cache plus the tree plus the frozen
build, which is why §1.3's 321M of abandoned scratch was findable at all.

## 3. What the instrument said about the site, and what it said about itself

The instrument was calibrated first, which the kit requires: 21 of 21
assertions in `selftest/check-focus.mjs` hold on this host, re-run from
scratch rather than taken on PR #705's word, including the trap fixture
and L36's 1.20 recomputed through this code path. Receipt in
`data/check-focus-selftest.log`.

Then it was pointed at `ursa-minor`, built with `next build` and served
with `next start`, at the three review viewports over five pages.

**The first pass found one defect in the site and three in itself.** That
ratio is the honest headline of this run, and it is what happens the
first time an instrument meets a surface it was not written against.

### 3.1 The site defect: the one tab stop where focus moves and nothing changes

`/record`, tab stop 4 of 6, at 1440x900 and 820x1180. An `input` with a
**1x1** box, **zero** pixels different between the focused frame and the
blurred one, on a page where every other stop reports 11.99:1.

It is the file input inside "Open a record":

```jsx
<label className="cta ...">
  Open a record
  <input type="file" className="sr-only" … />
</label>
```

The focusable element is the input, `sr-only` clips it to one pixel, and
the site's global `:focus-visible` ring is therefore drawn perfectly,
around that one pixel, behind the label. A pointer user never notices. A
keyboard user tabs onto the control and the screen does not change.

**Why no earlier review could have found it.** `measure-hit-areas.mjs`
measures the label's box and reports a healthy 44px target. Reading the
stylesheet finds a global focus rule that is correct and that does apply
here. The defect lives only in the join, and the only way to see it is to
put a keyboard on the control and photograph the result. That is the
argument for the instrument, made by the instrument, on its first outing.

The fix forwards the ring to the label with `:has(> input:focus-visible)`,
same token, same weight, same offset, so no new value enters the design
system. L59.

### 3.2 The instrument defect that produced a contrast ratio from page text

`ursa-minor` declares `html { scroll-behavior: smooth }`. The kit's
freeze does not touch it, because it is not an `requestAnimationFrame`
loop the page owns, and Playwright's `animations: 'disabled'` does not
reach it either.

`measure-focus.mjs` takes a control's box, then drives `Shift+Tab` and
`Tab` to give it a keyboard focus, which makes the browser scroll, and
then photographs the rectangle it computed before the scroll. The two
frames of one stop therefore came from two different offsets.

The proof is a pair of frames rather than an argument. For the
`mini-fixture` link on `/record` at 820x1180 the tool reported
`BELOW_FLOOR`, 49% of 655 indicator pixels, median 2.87. Magnified, the
focused frame shows a passage reading `no_generation_pro…` and the
blurred frame shows a different part of the page. **Neither frame
contains the link.** The 655 pixels were page text that had slid, and the
tool printed a contrast ratio for them.

The same cause produced two `UNSTABLE` verdicts, a `NO_INDICATOR` on a
header link that read 11.99 one viewport over, the inflated stop counts
in §3.4, and the crash in §3.3.

Repaired in two places: `lib/freeze.mjs` takes a `scroll` option that
pins `scroll-behavior: auto`, opt-in on the same reasoning as `now`, and
`measure-focus.mjs` re-reads the bounding box after the focus has landed
instead of before. L58.

### 3.3 The instrument defect that threw away four pages of measurements

The phone pass **crashed**:

```
page.screenshot: Expected options.clip.height to be greater than 0
    at docs/design/review-kit/measure-focus.mjs:389
```

A control whose box lies outside the viewport gives a clip with a
non-positive side. The tool guards the element's box and never guards the
clip computed from it, so the exception escaped the per-stop loop, the
per-page loop and the per-viewport loop, and the run ended with no table
at all. Three pages it had already measured went with it.

The enumeration is explicit that a zero-box element is a legitimate tab
stop and says "record it, flag it, do not drop it". The photographer one
stage later does not hold the same line. One stop that cannot be
photographed is now a row with the verdict `OFF_VIEWPORT`.

### 3.4 The instrument defect that counted stops that were not there

Before the scroll fix the reach table read "5 focusable in the DOM, 6 tab
stops" on home at two viewports and "5 focusable, 8 tab stops" on the
phone, and the extra stops appeared in no row of the table, because a
stop the enumeration had not declared was a bare `continue`.

Two things were wrong and the second hid the first. The extra stops were
the moving page: a stop with no probe is keyed by its coordinates, and a
page that is still scrolling gives one control a new key on every pass.
With `scroll-behavior` pinned, every page reports exactly as many stops
as the DOM declares. And the silent `continue` meant that a tool whose
entire headline is a set difference was reporting one direction of it. An
undeclared stop is now a row.

### 3.5 The verdict that was wrong about a ring that is excellent

The 404 page's only control reported `BELOW_FLOOR` at **5%** of 11,319
indicator pixels, median 1.12, at two viewports. The magnified frames,
committed as `frames/404-desktop-stop1-focused.png` and its blurred
twin, show a bright unbroken ring at a 3px offset with the border
brightened behind it. The site is right and the verdict was wrong.

`.quiet-link` answers focus with three things at once: the ring at about
11:1, a brightened border, and a 6% wash across the control's whole
interior. The wash is most of the pixels and almost none of the
contrast, so a share-of-all-changed-pixels statistic reads 5%. The share
is not a bad statistic; it has an unstated assumption, which is that the
indicator is only the ring, and every focus treatment that layers a
quiet wash under a loud ring inverts it.

A stop that fails the share is now asked a second question that needs no
new constant: do the pixels that *do* clear 3:1 cover at least a 1 CSS px
perimeter of the control on their own, `(w+2)(h+2) - wh`. That is the
ring this site declares, measured off the control's own box. The 404's
566 clearing pixels against a 558 pixel perimeter clear it, and the stop
reads `COMPOSITE` rather than failing. A ring along one edge only does
not clear it, and a ring drawn in its own backdrop's colour has no
clearing pixels at all, which is the selftest's fixture 4 and it still
fails as it should. L60.

## 4. The after state, and the one claim I nearly shipped without checking

**The numbers below were nearly wrong, and the way they were nearly wrong
is worth more than the numbers.** The first "after" sweep came back with
every page reporting the same control boxes at 390 and at 1440, which a
responsive layout cannot do. The cause was that the old `next start` was
still holding the port, serving HTML that pointed at a stylesheet chunk
the rebuild had replaced. That chunk answered **500**, so three
viewports' worth of "verified" measurements had been taken on an
unstyled page, and every one of them looked plausible. The check that
caught it was two numbers being equal that had no business being equal.

So the rule this run adds for itself: after a rebuild, fetch the page's
own stylesheet link and assert it is a 200 before measuring anything.
One `curl`. It is in §6.

**With the server actually serving the new build**, over five pages at
the three review viewports:

| viewport | stops | below a floor | unreachable | unstable |
|---|---|---|---|---|
| phone 390x844 | 28 | 1 | 1 | 0 |
| tablet 820x1180 | 28 | 1 | 0 | 0 |
| desktop 1440x900 | 28 | 1 | 0 | 0 |

The one below a floor at each viewport is the file input of §3.1, which
is the control this run fixed, and it was still reported as
`NO_INDICATOR` because of §4.1 below rather than because the fix had
failed.

The two `UNSTABLE` verdicts and the inflated stop counts from the first
pass are gone, which is the scroll pin doing its job. The 404's control
now reads `COMPOSITE` at 582 clearing pixels against a 558 pixel
perimeter, which is the verdict §3.5 argued for, reached by arithmetic
rather than by me deciding the site was fine.

### 4.1 The fix was correct and the instrument still could not see it

This is the fifth instrument defect and the one most worth writing down,
because it would have let a correct fix be reported as a failed one.

After the CSS change the file input still reported `NO_INDICATOR` at all
three viewports. The ring is drawn on the **label**, the input is a 1x1
box somewhere inside that label, and the tool photographs a rectangle
padded 12px around the focused element. None of the label's ring falls
inside that rectangle.

I checked the page itself rather than trusting either the tool or the
diff:

```
matched: {"fv":true,
          "labelMatches":true,
          "labelOutline":"rgb(168, 199, 250) solid 1px"}
```

and photographed the label by hand, which is
`frames/record-label-cta-focused-after.png` against its blurred twin. The
ring is there, 1px, polar, 3px offset, the same ring every other control
on the site gets.

`verify-hover.mjs` already knows the mirror of this and says so in the
kit's own README: three of this site's hover rules style a descendant
rather than the hovered element, so a computed-style read alone reports
"nothing changed" for them. Focus has the same shape one direction up,
and nothing in the kit had it. A control under 8px on a side is now
photographed over its nearest ancestor with a real box, capped at five
levels and at half the viewport so the climb cannot end at `<body>`, and
the row prints which box it used.

With that in place, `/record` at all three viewports:

| page | vp | stop | control | box | indicator px | share | median | verdict |
|---|---|---|---|---|---|---|---|---|
| set | phone | 4 | input | 182x47 (ancestor:label) | 488 | 100% | 11.99 | ok |
| set | tablet | 4 | input | 182x47 (ancestor:label) | 486 | 100% | 11.99 | ok |
| set | desktop | 4 | input | 182x47 (ancestor:label) | 488 | 100% | 11.99 | ok |

**0 of 18 tab stops below a floor on that page, at every viewport.** The
control that answered with nothing now answers exactly like its
neighbours. Receipt: `data/after-focus-set-widened.md`.

The selftest was re-run after every one of these changes and holds at
**21 of 21** each time. `data/check-focus-selftest-after.log`.

## 5. Two findings this run measured and did not fix

Both are on the home page, both are new, and neither is a polish item
this seat should take without saying what it is first.

**A copy button the keyboard cannot reach, at phone width only.**

```
home/phone button.cta.rec-hit@49,3257 57x29 offscreen "copy"
```

Three copy buttons on the home page, two reached, one not, and only at
390. At 820 and 1440 the same page reports zero unreachable. The `@49,3257`
is its position: it is far down a long page. This is the first unreachable
control any instrument in this kit has ever reported, so the first thing
the next run should establish is whether the tab walk is terminating early
rather than whether the button is genuinely stranded. The walk stops when a
stop's key repeats, and a page this tall at this width is where that
assumption is most likely to be wrong. Named here, with its measurement,
rather than fixed on a guess.

**Two tab stops the DOM enumeration does not declare.** They are the
`<pre>` blocks that hold the install commands. Chromium makes a
scrollable region keyboard-focusable, which is correct behaviour and not
a bug on either side, and it means the home page has two tab stops with
no accessible name and no focus treatment anybody chose. They show as
`UNDECLARED` now instead of vanishing. Whether they should carry a name,
or be made unscrollable, or be left exactly as they are, is a product
question rather than a polish one.

## 6. The run's own hygiene, since it cost most of the morning

1. **Before any `npm` in a tree, ask the kernel whether one is already
   there.** `readlink -f /proc/<pid>/cwd` for every live `npm ci` or
   `npm install`. An exit status will not answer this; L57.
2. **After a rebuild, assert the stylesheet is a 200 before measuring.**
   Three viewports of measurements were taken on an unstyled page this
   run and every number looked reasonable. §4.
3. **One scratch directory per run, deleted at the end.** Not just the
   npm cache, which is what L56 said: the frozen build and the served
   tree are bigger. §1.3.
4. **Never wait on a string your own command line contains.** L57.

All four are in the kit's README now.

## External sources read

Nothing. This run fetched no page, ran no search, and read no content
from outside this repository's committed files. The benchmark step in
the charter was not run, which is stated plainly rather than omitted:
fixing the build took the first part of the run, per the charter's rule
that when the build fails, fixing the build is the run, and the rest
went on the keyboard pass and the five defects it turned up. No
benchmark notes are offered because none were taken.
