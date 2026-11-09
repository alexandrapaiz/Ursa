# Visual review, 2026-11-09 (run ac)

`ursa-minor`, five paths, three charter viewports. The frames in `live/`
are the review set. There is no `before/` directory in this review and
that absence is the review's subject.

## What happened, in order

The run shot fifteen frames against `next dev`, read them, and found one
clear defect on the home page at every viewport: the `curl` command in
the third code block cut flush at the edge of its box, 536px of command
hidden at desktop, 455 at tablet, 737 at phone, with no fade, no visible
scrollbar and a last glyph that reads like the end of a path rather than
the middle of one. `data/clip-desktop-before.png` is that frame at 2x.

Measured before repairing it, which is the only reason this review says
what it says. `CopyLine` builds three affordances for exactly this case:
a mask that fades the overflowing edge, a keyboard stop, and an
`aria-label` reading "command, scrolls sideways". All three are driven
from the component measuring its own box, and a previous run measured all
three working. On the page in front of this run, `--fade-r` was `0px`
over a 536px overflow, the inline property the effect sets was never
written at all, `tabIndex` was `-1` and the label was `null`.

So the next question was whether the component had broken. It had not.
The page had never run.

## The measurement

Same probe, three seconds after networkidle, 1440x900:

|  | React fibers | fiber on the body | `--fade-r` | `tabIndex` |
|---|---|---|---|---|
| `next dev` | 3 of 114 | no | effect never ran | -1 |
| `next start` | 88 of 103 | yes | 32px | 0 |

Four pages shot both ways at desktop and diffed in `data/frame-diff.txt`:

```
home-desktop.png                1310196 px   31.374%
record-at-desktop.png                 0 px    identical
record-desktop.png                    0 px    identical
record-mini-fixture-desktop.png       0 px    identical
```

Three of four identical. On those three, a frame of a page that never ran
a line of JavaScript is the same image as a frame of a page that did,
while every client behaviour on it is dead. The home page is the only one
that shows the fault, and only because its hero is a WebGL constellation
that is not drawn at all: compare `data/dead-page/home-desktop.png`
against `live/home-desktop.png`.

## What was fixed

Nothing on the site. The site was correct at every point this run looked
at it, and `data/clip-desktop-live.png` is the same crop off the live
build with the fade doing its job.

The repair is in the instrument:

- `lib/hydrated.mjs`, a gate with the same shape as `lib/reached.mjs`,
  one layer down. Reached asks whether the instrument got to its subject.
  This asks whether the subject was alive. Exit 2, the refusal in the
  slot a reader scans, and narrow on purpose: a page with no client
  runtime, which is every `file://` fixture in `selftest/`, is not a
  refusal.
- `waitForHydration()`, because hydration is a race and not only a server
  setting. With the gate reporting rather than waiting, 1 of 15 frames
  off the **production** build caught the home page mid-hydration at 2 of
  102 fibers. Bounded, so a dead server refuses instead of hanging.
- `shoot.mjs` waits, then gates, and prints the overflow table either
  way, because overflow is a fact about the served HTML and stays true.
- `selftest/check-hydrated.mjs`, 15 expectations, all four states plus an
  end-to-end case over a real page with no framework on it.

Both arms re-measured after the change: `next dev` exits 2 and names
every frame, `next start` exits 0 and says so.

## What this review did not do

The charter's step 3 and step 4, the public-web benchmark and up to two
interaction refinements, were not done. The reason is the review above:
the frame set this run would have proposed refinements against was a set
of photographs of a page that does nothing, and the first obligation was
to find that out and stop it happening again. Proposing a hover spring on
that evidence would have been proposing it blind.

The visual review proper, over the `live/` set, is clean on every
instrument that ran: 0 of 533 text runs below their contrast threshold, 0
of 48 standalone controls under 44px, 0 frames overflowing at any
viewport, 15 of 15 loads reached, 15 of 15 hydrated.

## Still open

The gate is wired into `shoot.mjs` and no further. The other five
browser-driving tools will still measure a dead page and report a number
for it, so a contrast or hit-area figure taken off `next dev` is a figure
about the pre-hydration DOM with nothing saying so. One mechanical change
per tool, and the next run's first item. L78 records it.

## External sources read

None. Every measurement here is off this repository's own two servers on
this host.
