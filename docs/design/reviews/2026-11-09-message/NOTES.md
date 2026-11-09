# Frontend run, 2026-11-09 — the walk was stopping early, and the button was never stranded

Every number in this file was taken this run unless it carries another
run's name. A number that is not here was not taken.

## 0. What I took, and why

The wake was the merge of this seat's PR #724 (the keyboard pass on the
real site, L57 through L60). It asked this run to continue with the next
item in the lane.

The lane named its own next item in writing. Run h's notes, §5, first
deferred finding:

> ```
> home/phone button.cta.rec-hit@49,3257 57x29 offscreen "copy"
> ```
> This is the first unreachable control any instrument in this kit has
> ever reported, so the first thing the next run should establish is
> whether the tab walk is terminating early rather than whether the
> button is genuinely stranded. The walk stops when a stop's key repeats,
> and a page this tall at this width is where that assumption is most
> likely to be wrong.

So this run took that, and the answer is the one run h thought to suspect
first. **The tab walk was terminating early. The copy button was never
stranded, and the home page never had a keyboard-reach defect.**

**The board.** Run h's card, "Someone using the site with a keyboard can
always tell which control they are on", moved to Done at 00:41 today when
#724 merged, so it is not this run's card. This work is a distinct item
and I created one for it, `35bda049`, in Review with this pull request on
it.

## 1. The mechanism, in the order I established it

### 1.1 Reading the code first, because the hypothesis was about the code

Run h's question is a question about `measure-focus.mjs` and not about
the site, so the first move was the walk's own source rather than a
browser. Two lines carry the whole defect.

The walk ends when a stop's identity repeats, which is how a closed ring
is detected:

```js
const id = act.probe !== null ? `p${act.probe}` : `${act.tag}@${Math.round(act.box.x)},${Math.round(act.box.y)}`
if (seen.has(id)) break // the ring closed
```

A stop the DOM enumeration declared carries a `data-focus-probe`
attribute and is identified by it, which cannot collide. A stop the
enumeration never declared has no probe, so it falls to the second
branch, and `act.box` comes from `getBoundingClientRect`, which is
**viewport-relative**.

The walk drives Tab, and Tab scrolls the stop it lands on into view
before the walk reads its box. So the coordinate of an undeclared stop is
not a fact about that stop. It is a fact about where the browser parks
whatever it has just focused, and on a long page that is very nearly the
same number every time.

### 1.2 The fixture, which missed by one pixel and was worth more for it

Before touching the site I built a tall page with three scrollable `<pre>`
blocks, each followed by a button, and walked it with the tool's identity
logic copied verbatim. The first version spaced the blocks with uniform
700px margins, and it did **not** reproduce:

```
stop 2  pre@20,412   scrollY= 1051
stop 4  pre@20,411   scrollY= 1814
```

Two different elements, 763 scrolled pixels apart, landing one pixel
apart in the viewport. That near-miss is the useful part of the first
attempt, because it says the collision is not a coincidence waiting on
bad luck. It is the default behaviour of scroll-into-view, and whether
two stops collide exactly comes down to sub-pixel layout rounding.

Positioning the blocks at absolute integer tops removed the rounding, and
the fixture then failed the way the hypothesis predicted at both widths I
tried and at the selftest's own 800x600:

```
=== one 800x600
declared in DOM: 3   tab stops reached: 2
walk ended because: key repeated: pre@20,289
unreachable: 2 -> button "copy", button "copy"
```

Two of six stops reported, and two buttons called unreachable that Tab
reaches without trouble. Receipt in `data/repro-walk-collision.mjs` and
`data/repro-walk-collision.log`.

### 1.3 The site, walked past the point where the tool gives up

Then the real page, built and served, at 390x844, with the walk instructed
to keep going past its own stopping condition and print every identity:

| stop | identity the tool used | document y | element |
|---|---|---|---|
| 0 | `pre@49,401` | 2510 | the `git clone` command |
| 1 | `p0` | 2563 | copy |
| 2 | `pre@49,560` | 2669 | the `npx tsx` command |
| 3 | `p1` | 2702 | copy |
| 4 | `p2` | 2895 | the record viewer |
| 5 | `p3` | 2921 | a published record |
| 6 | `pre@49,401` **collision** | 3204 | the `curl` command |
| 7 | `p4` | 3257 | copy |
| 8 | focus left the document | | |

Stops 0 and 6 are two different elements sitting 694 pixels apart in the
document, and they handed the walk the same identity. The walk quit at
stop 6, so stop 7 was never reached, and stop 7 is the copy button run h
reported. The page has eight tab stops and the walk was finding six.

**Why only the phone.** Chromium makes an overflowing `<pre>`
keyboard-focusable, so the undeclared stops here are the install
commands, and whether a command overflows depends on the width. At 390
all three overflow and there are three undeclared stops available to
collide. At 820 and 1440 only one does, so there was nothing to collide
with and those viewports reported clean. The width-dependence that made
the finding look like a responsive bug in the page was the width
dependence of how many `<pre>` blocks happen to scroll.

## 2. The fix

The identity is stamped onto the element on first sight, `data-focus-walk`,
instead of being computed from where it happens to be. Two elements cannot
share it, and one element keeps it however far the page scrolls under it.
A repeat now means the keyboard genuinely came back to a stop it had
already been on, which is the only thing that should ever end the walk.

The diff is the two lines above plus the comment explaining why, in
`measure-focus.mjs`. Nothing in the site changed, because nothing in the
site was wrong.

**Home at 390, before and after:**

| | tab stops | unreachable |
|---|---|---|
| before | 6 | 1 |
| after | 8 | 0 |

The control that was reported unreachable now reads **200 indicator
pixels, 100% above 3:1, median 11.25**, which is exactly what its two
siblings read in the same table. Receipts in
`data/before-focus-home-phone.md` and `data/after-focus-home-phone.md`.

## 3. The check, and proving it can fail

A check that cannot fail is not a check, which is this kit's L19, so the
new selftest fixture was run against the old code before it was trusted
against the new.

`tall.html` is a 4000px page with three scrollable `<pre>` blocks at
absolute integer tops, which is what makes all three land at exactly
`20,289` at the selftest's 800x600 rather than within a pixel. Six new
assertions, and the suite now stands at **27 of 27**.

With the identity line put back to coordinates, five of the six fail:

```
  ok    11. the DOM offers three buttons
  FAIL  11. the walk runs to the end of the page, six stops  got 2
  FAIL  11. and no button is reported unreachable  got ["copy 2","copy 3"]
  FAIL  11. all three undeclared pre stops get a row, not one  got ["UNDECLARED"]
  FAIL  11. all three buttons are photographed and ringed  got [["copy 1","ok"]]
  FAIL  11. the three stops that collided are three identities  got [0]
```

Receipts: `data/selftest-fails-on-old-code.log` and
`data/check-focus-selftest-after.log`.

## 4. What this changes about the record

**The site has no keyboard-reach defect and has never had one.** The full
sweep after the fix, five pages at the three review viewports:

**86 tab stops, 0 below a floor, 0 controls the keyboard cannot reach, 0
unstable.** By verdict: 78 ok, 5 UNDECLARED, 3 COMPOSITE. Receipts in
`data/after-focus-all.md` and `data/after-focus-all.json`.

**Run h's second deferred finding was undercounted by the same break.**
It reported two undeclared `<pre>` stops on the home page. There are
three at 390, and the third was behind the collision. Whether those
blocks should carry an accessible name, be made unscrollable, or be left
exactly as they are is still the product question run h said it was, and
I have not touched it.

**The part worth carrying past this bug.** Both of this tool's headline
numbers are set differences against one traversal. Anything that shortens
the walk inflates the unreachable count and deflates the stop count at
the same time, so the two errors corroborate each other. Run h had a real
reason to trust the report, because the same pass found a genuine defect
on the same page, the file input of L59. An instrument whose two numbers
come from a single traversal has one failure mode that moves both, and
agreement between them is therefore not evidence. That is L61.

## 5. The visual pass

The charter's defining rule is that a page is never fine because the code
reads right, so the site was rendered and photographed after the fix and
the frames were read.

Five pages at 390x844, 820x1180 and 1440x900, fifteen frames, in
`after/`. **No frame overflows its viewport**, measured rather than
eyeballed, and `after/measurements.txt` carries the per-frame numbers.

Read at full resolution, the pages hold up. The install blocks at 390
show the `.rec-cmd` edge fade doing its job, so a command that runs past
its box says so. Hairlines, the mono labels and the measure column are
consistent across the three widths. I found nothing to repair, which is
why this run ships no site diff.

The frames were quantized to 256 colours before committing, 2111K down to
845K, and re-read afterwards to confirm the starfield gradient did not
band. The charter asks for compressed 1x evidence and the first sweep was
four times the weight of what previous runs committed.

## 6. What I did not do

**No benchmark pass.** The charter's step 3 asks for two or three
best-in-class sites studied with Playwright, and step 4 for up to two
interaction refinements. I ran neither. The lane item was a measurement
question with a code defect behind it, and establishing the mechanism,
fixing it, proving the fixture fails on the old code and re-reading the
site took the run. Saying so plainly rather than omitting it, since an
unrun step that goes unmentioned reads as a passed one. No benchmark
notes are offered because none were taken, and no interaction refinement
is proposed because none was studied.

## 7. Hygiene

Run h's four rules from its §6 were followed, and the second one earned
its place:

1. **Before any npm in a tree, ask the kernel whether one is already
   there.** Checked `readlink -f /proc/<pid>/cwd` for every live process
   before the install. Nothing was running in this tree. The volume was
   at 87% with 6.1G free, which is a better start than run h's 98%.
2. **After a rebuild, assert the stylesheet is a 200 before measuring.**
   This nearly went wrong in a new way. My first attempt grepped for
   `/_next/static/css/`, got an empty string, pasted it onto the base
   URL, and printed `stylesheet HTTP 200` for the **home page**. The
   check passed by fetching the wrong thing. This build emits its
   stylesheet under `/_next/static/chunks/`, and with the right pattern
   all three pages answer 200 on a real `.css` file. A check whose
   failure mode is to silently measure something else is the same shape
   as the bug this run fixed.
3. **One scratch directory per run, deleted at the end.** Everything went
   in `.fe-run-1109/`, which is deleted and never committed.
4. **Never wait on a string your own command line contains.** Nothing in
   this run waited on a grep of its own invocation, and then the run hit
   the same rule from the other side anyway. The cleanup was issued as
   `pkill -f "next start -p 4981"; rm -rf .fe-run-1109 ...` on one line.
   `pkill -f` matched the shell running that line, killed it at the
   semicolon, and the `rm` never ran. Exit code 144, server genuinely
   stopped, scratch still on disk. L57 was written about `pgrep`, where
   the cost is a loop that hangs and so announces itself. In `pkill` the
   cost is every command after it on the line, silently. The scratch was
   removed because the run checked rather than assuming, which is the
   only reason this is a footnote and not an incident. Written into the
   kit README.

The load average was 26 on 4 cores with other seat runs live, so the
durations in `data/after-focus-all.md` are facts about this host and not
about the site. The kit's standing warning applies to wall clocks as well
as frame rates.

## External sources read

Nothing. This run fetched no page, ran no web search, and read no content
from outside this repository's committed files and this host's own board
API. The board was read and written with the seat's runtime token, and
the only board content this run acted on was its own seat's card state.
Nothing read from it directed this run's work.
