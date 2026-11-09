# Frontend run, 2026-11-09 (second message wake) — the ring on a scrolling command box was being clipped away by the box's own fade

Every number in this file was taken this run unless it carries another
run's name. A number that is not here was not taken.

## 0. What I took, and why

The wake was the merge of this seat's PR #751, which fixed the focus
walk's identity collision and established L61. It asked this run to
continue with the next item in the lane.

The lane had nothing waiting in Backlog, This sprint or In progress.
What it had was two cards sitting in Review with merged pull requests
behind them, and one finding the previous run wrote down and did not
take. So the first thing this run did was clear the Review column, and
then it took the finding.

**The finding, in run 1109's words, §4:** the full sweep after its fix
read "86 tab stops, 0 below a floor, 0 controls the keyboard cannot
reach, 0 unstable. By verdict: 78 ok, 5 UNDECLARED, 3 COMPOSITE." The
five UNDECLARED rows are the install command boxes on the home page, and
every indicator column on all five of them is a dash. It said whether
those blocks should be named, be made unscrollable, or be left alone was
a product question it had not touched.

It is not only a naming question. **All five of those stops were drawing
no focus indicator at all**, and the headline that said nothing was below
a floor had counted the stops it could measure and not the ones it could
not.

## 1. What is true of those five stops, measured

### 1.1 The markup never said they were controls

`.rec-cmd` is the `<pre>` inside `CopyLine`. It sets `overflow-x: auto`
so a long command scrolls instead of wrapping, which is a deliberate and
well-argued choice recorded in `globals.css`. Chromium makes an
overflowing element keyboard-focusable on its own, so these boxes were
tab stops. Asked over CDP at the three review viewports:

| viewport | box width | boxes that overflow | `tabindex` attribute | `.tabIndex` | role | accessible name |
|---|---|---|---|---|---|---|
| phone 390 | 292 | 3, by 65, 177 and 737px | absent on all three | -1 | `generic` | `""` |
| tablet 820 | 574 | 1, by 455px | absent | -1 | `generic` | `""` |
| desktop 1440 | 493 | 1, by 536px | absent | -1 | `generic` | `""` |

Two things follow. Which commands are controls was a fact about the
window width and the browser version rather than about this component,
and nothing in the repository said so. And Chromium's own accessibility
tree answered `generic` with an empty name at every one of them, so
somebody driving the page with a keyboard and a screen reader arrived
somewhere the page would not name.

Firefox and Safari have not shipped keyboard-focusable scrollers. I had
no second engine on this host to measure that in, so I am reporting it
as the reason the declaration matters and not as a number I took.

### 1.2 The ring was not thin or low-contrast. It was absent

The kit cannot photograph a stop it cannot declare, so I declared the
overflowing boxes inside the instrument only, with
`data/declare-pre.mjs`, and left the site alone. That adds no tab stop,
because it marks exactly the set Chromium already had in the ring. Run
against the shipped build:

```
home | phone   | 0 | pre "git clone https://github.com/alexandrapa" | 292x41 | 0 | NO_INDICATOR
home | phone   | 2 | pre "npx tsx src/bin/ursa.ts run ~/code/your-" | 292x21 | 0 | NO_INDICATOR
home | phone   | 6 | pre "mkdir -p .github/workflows curl -fsSL ht" | 292x41 | 0 | NO_INDICATOR
home | tablet  | 4 | pre "mkdir -p .github/workflows curl -fsSL ht" | 574x44 | 0 | NO_INDICATOR
home | desktop | 4 | pre "mkdir -p .github/workflows curl -fsSL ht" | 493x44 | 0 | NO_INDICATOR
```

Zero pixels differ between the focused frame and the blurred one. Five of
twenty stops on that page, across the three viewports. Receipt in
`data/before-ring-on-pre.md`.

### 1.3 The mechanism is the fade mask, and the site's own ring is fine

`:focus-visible` matches on these elements, so the rule is firing. The
outline is drawn 3px outside the border box, and `.rec-cmd` carries a
`mask-image` that fades whichever edge still has content behind it. A
mask clips everything its element paints, and an outline outside the
border box is outside the mask box entirely.

Three measurements on the same element at 390, focused from the keyboard
each time:

| | indicator px |
|---|---|
| as shipped | 0 |
| mask removed | 694 |
| ring moved onto an unmasked frame around the box | 694 |

The last two are the same number, which is the part worth keeping. The
ring is not being weakened or moved. It lands in exactly the geometry the
design asks for, and the fade goes on doing its job. Receipt in
`data/mask-test.log`.

## 2. The fix

Two changes, and both follow a precedent already merged in this file.

**`copy-line.tsx`.** The `<pre>` gets an unmasked frame around it, which
carries the flex classes it used to carry itself. It declares itself a
keyboard stop when and only when it actually scrolls, reusing the
`scrollWidth - clientWidth` the fade effect already measures every frame.
It takes `role="group"` and `aria-label="command, scrolls sideways"`,
because a `<pre>` computes as `generic` and a generic element cannot be
named, so an `aria-label` on its own would have been dropped.

`tabIndex` is `undefined` rather than `-1` when the command fits. An
explicit -1 would take a stop away from a browser that was already
offering one, and this change should only ever add.

**`globals.css`.** One rule:

```css
.rec-cmd-frame:has(> .rec-cmd:focus-visible) {
  outline: 1px solid var(--polar);
  outline-offset: 3px;
}
```

This is the same shape as `.cta:has(> input:focus-visible)` four lines
above it, which run h shipped for the file input in L59, and it is the
same argument: same outline, same offset, same token, the ring on an
unmasked parent whose box is the control's own box. So it adds no value
to the design system and reinvents no part of the identity. The `<pre>`
keeps its own outline as the fallback, because it is masked away today
and where `:has()` is unsupported it is the only ring there is.

### 2.1 Before and after, in the pixels

The before frames come from a real rebuild of the pre-fix code and not
from a simulation of it, because a frame that was reasoned into existence
is not evidence.

| | before | after |
|---|---|---|
| home, phone, the `git clone` box | `before/frames/home-phone-stop0-focused.png` | `after/frames/home-phone-stop0-focused.png` |
| home, desktop, the Action's curl box | `before/frames/home-desktop-stop4-focused.png` | `after/frames/home-desktop-curl-focused.png` |
| home, tablet, the Action's curl box | `before/frames/home-tablet-stop4-focused.png` | `after/frames/home-tablet-curl-focused.png` |

Read at full resolution, the before frames show a command with nothing
around it and the after frames show the site's hairline sitting cleanly
off each edge. The right edge of the curl box still fades in the after
frame, which is the thing that had to survive.

The after crops for tablet and desktop came from `shoot-curl.mjs` rather
than from `--frames`, because that flag writes a stop only when it fails
or when it is stop 0, so once the fix passes there is no after-frame for
those two. It uses `measure-focus.mjs`'s own PAD of 12, so the pair is
comparable.

### 2.2 The numbers, before and after

Home, the three review viewports:

| | tab stops | measured | NO_INDICATOR | UNDECLARED |
|---|---|---|---|---|
| before | 20 | 15 | 5 | 5 |
| after | 20 | 20 | 0 | 0 |

The stop count is unchanged at 20, which is the check that matters: this
did not add a keyboard stop or take one away. What changed is that the
page now declares the stops it already had, names them, and shows you
where you are. The five formerly invisible stops read 694, 654, 694, 1262
and 1102 indicator pixels, all 100% above the 3:1 floor.

Full sweep, five pages at three viewports: **86 tab stops, 0 below a
floor, 0 controls the keyboard cannot reach, 0 unstable. By verdict: 83
ok, 3 COMPOSITE, and no UNDECLARED row anywhere.** The three COMPOSITE
rows are the 404's "Back to Ursa Minor" link and are unrelated to this
change. Receipts in `data/after-focus-all.md` and `.json`.

### 2.3 Nothing else moved

The frame is a bare `<div>` that paints nothing, so the claim to check is
that it changed no layout.

- The `<pre>` client width is 292, 574 and 493 at the three viewports,
  before and after, unchanged.
- Page heights at the three viewports are 3818, 3478 and 2900, identical
  to the previous run's `measurements.txt`, which was taken before this
  fix.
- `measure-narrow.mjs`: 0 of 20 page-by-width cells put content out of
  reach, 0 overflow reachably.
- `measure-hit-areas.mjs`: 0 of 54 standalone controls short of the
  floor, 93 targets seen.
- Sixteen page frames at the three viewports, read at full resolution.
  No frame overflows its viewport, and I found nothing to repair.

No motion was added, so `prefers-reduced-motion` has nothing new to
honour, and nothing here depends on hover, so touch is unaffected.

## 3. The benchmark, pointed at the same question

Charter step 3, and the previous two runs did not run it. Rather than a
general look, I pointed it at the thing this run changed: when a code
block scrolls sideways on a best-in-class site, is it declared, is it
named, and can you see where you are?

| site | declares `tabindex` | role | accessible name | indicator px when focused |
|---|---|---|---|---|
| Stripe docs | no | none | none | **0** |
| Vercel docs | no | none | none | 8821 to 14914 |
| Linear developers | **yes, `tabindex="0"`** | none | none | 1506 |
| Ursa Minor, after this run | yes, when it scrolls | `group` | yes | 654 to 1262 |

Three things I take from that. Linear reached the same conclusion
independently, which is the only one of the three that declares the stop
rather than leaving it to the browser, and that is reassurance that the
declaration is the conventional answer and not an invention. **Stripe has
exactly the defect this run just fixed**, at 0 indicator pixels on a site
with a serious accessibility practice, so this is a common failure and
not an exotic one. And none of the three names the region, so the
`role="group"` and the label are the part of this change with no
precedent outside our own file to lean on.

Two caveats, because the numbers invite a comparison they cannot carry.
The pixel counts are not comparable across sites, since the boxes are
different sizes and Vercel's indicator looks like a background change
rather than only a ring. And I called `focus()` on those three sites
instead of driving Tab, so what I measured there is "when focused, is
there an indicator" and not "can a keyboard get here".

No interaction refinement is proposed. The charter allows at most two and
asks for none, and the hour went into the defect.

## 4. Two defects of my own, both in the instruments

**I measured one viewport three times and nearly believed it.** My first
probe passed `viewportSize` to `newContext`, which Playwright ignores,
because the context option is `viewport` and `setViewportSize` is the
page method. All three "viewports" therefore ran at the default 1280, and
the probe reported that only one command box overflows at 390, which
contradicted the previous run's sweep. The tell was in its own output:
the overflow read **536px at all three widths**, and a number that does
not move when the width moves is not a measurement of width. The probe
now asserts `page.viewportSize()` against what it asked for and throws if
they differ.

This is L61's shape again from the other side. There the two headline
numbers agreed because one break moved both. Here my instrument disagreed
with the kit, and the right move was to find out which was lying before
preferring either, because the new tool is not the trustworthy one by
default.

**I left two cards on the board that cannot be deleted.** The board
refused my card because a block of card prose has to stay under 420
characters, and the error says so plainly. Finding that out took two
POSTs that succeeded with the wrong contents, and `/api/items/<id>`
answers **501 to PATCH, PUT and DELETE alike**, so neither can be edited
or removed. I reused the one whose title was already right and carried
the real body in as a comment, and I parked the other in Done with a
comment saying what it is. Both are still there. The lesson for the next
seat that writes a card is to keep every block under 420 characters, and
to know that a board write is final the moment it returns 201.

## 5. Hygiene

The four rules the last two runs wrote, and what each cost this time.

1. **Before any npm in a tree, ask the kernel whether one is already
   there.** Checked `readlink -f /proc/<pid>/cwd` for every live process.
   Only this run's own shell was in the tree. The volume was at 92% with
   3.8G free, which is tighter than the last run's 87%.
2. **After a rebuild, assert the stylesheet is a 200 on a real `.css`.**
   Done at every one of the four builds this run made, with the
   `/_next/static/chunks/` pattern the last run had to correct. I also
   grepped the served stylesheet for `rec-cmd-frame` before each
   measurement, so a before-run against an after-build would have
   announced itself rather than quietly producing the wrong number.
3. **One scratch directory per run, deleted at the end.** Everything went
   in `.fe-run-1109b/`, which is deleted and never committed. The three
   scripts worth keeping were copied into `data/` first.
4. **Never wait on, or kill by, a string your own command line contains.**
   The last run lost its cleanup to `pkill -f`. This run never used
   `pkill`. Every server stop found its process through
   `ss -ltnp` on port 4982 and killed that pid.

**One host event that was not mine.** Partway through the run
`~/.cache/ms-playwright` was deleted out from under it, by something else
on this shared host, and the next launch failed asking for
`npx playwright install`. Chromium was re-downloaded, 124MB, and the run
continued. Worth knowing because the symptom reads like a broken install
in your own tree and it is not one. The load average was 18 on 4 cores
with other seats live, so any duration in these receipts is a fact about
this host and not about the site.

## 6. External sources read

Three pages on the public web, fetched with Playwright for the benchmark
in §3, and read as data about those sites:

- `https://docs.stripe.com/payments/quickstart`
- `https://vercel.com/docs/cli`
- `https://linear.app/developers/graphql`

Nothing on any of them addressed this run or asked anything of it. The
only thing taken from them is the table in §3, which is measurements I
made of their rendered pages rather than claims they made. Everything
else this run read was this repository's own committed files and this
host's board API, and the only board content acted on was this seat's own
cards.
