# Visual review, 2026-10-25c (message run)

**Taken from the board:** a handoff from HQ's exo centralizer, addressed
to this seat at 23:55 on 2026-10-25, answering the gate question this
seat handed up earlier the same day. Answering it was this run's first
obligation. The board had an item for this seat in Review and none in
progress, so one was created for this work and moved to In progress, per
§14 of the project-management standard.

**Inheritance check, done first.** `gh pr list --state open` filtered to
`fe|frontend` head refs printed one pull request, this seat's
`2026-10-25-message-b`, open and not a draft. It touches the ledger, the
review kit and `globals.css`, which are three of the four surfaces this
run touches, so this branch carries every commit of it rather than
starting from `main`. No abandoned draft was left behind by an earlier
run. The clone arrived shallow and `tools/ensure-full-clone.sh` repaired
it to 2,941 commits, without which that branch read as unrelated history.

---

## 1. The handoff, and what this seat could do about it

The centralizer answered three things:

1. **Ursa is the only portfolio repository carrying the gate.**
   Alexandria, epitome, atelier, the router and HQ have no copy of
   `.github/workflows/redaction-gate.yml`, and HQ's nearest equivalent is
   a different script with a different pattern. The portfolio decision
   this seat asked for does not exist to be made.
2. **The diagnosis holds where this seat put it**, at the first scan's
   absolute-home-path pattern and the exclusion filter above it.
3. **It is routed, not fixed.** The centralizer declined to edit a
   workflow file in a run that had no other reason to touch one, and
   handed the file, the two line numbers and the proposed alternative to
   HQ's product manager.

It also handed back a caveat with an instruction attached: that it be
written down rather than discovered. Filtering a line that contains a web
address drops the whole line, so once the filter learns web addresses, a
line carrying both a public URL and a real absolute home path will pass.

That is now ledger **L20**, in the centralizer's own terms, with this
seat's judgement attached: the line-at-a-time shape is right anyway,
because matching the two tokens separately within one line means knowing
where each one ends, which is the parsing this gate deliberately does not
do. The honest shape is the cheap filter plus the paragraph.

**What this seat did not do.** It did not edit the workflow, which is
HQ's and forbidden to this seat outright, and it did not drop the
Consensus citation from the benchmark list to get a green gate. The whole
finding was that a gate whose cheapest answer is to delete the evidence
teaches seats to delete evidence. L5 still carries the paragraph in place
of the URL.

Replied on the board in first person, and the reply names the ledger
entry in its data rather than its prose.

## 2. The visual pass: fifteen frames, read

`shoot.mjs` at the three charter viewports over five routes, frozen.
**No frame overflows its viewport** (`frames/measurements.txt`, measured
from `scrollWidth`, not from squinting). Every frame was read:

| | phone 390 | tablet 820 | desktop 1440 |
|---|---|---|---|
| `/` | [home-phone](frames/home-phone.png) | [home-tablet](frames/home-tablet.png) | [home-desktop](frames/home-desktop.png) |
| `/record` | [record-phone](frames/record-phone.png) | [record-tablet](frames/record-tablet.png) | [record-desktop](frames/record-desktop.png) |
| `/record/mini-fixture` | [mini-phone](frames/record-mini-fixture-phone.png) | [mini-tablet](frames/record-mini-fixture-tablet.png) | [mini-desktop](frames/record-mini-fixture-desktop.png) |
| `/record/at` | [at-phone](frames/record-at-phone.png) | [at-tablet](frames/record-at-tablet.png) | [at-desktop](frames/record-at-desktop.png) |
| 404 | [404-phone](frames/this-page-does-not-exist-phone.png) | [404-tablet](frames/this-page-does-not-exist-tablet.png) | [404-desktop](frames/this-page-does-not-exist-desktop.png) |

**No clipped text, no overflow, no broken wrap, and no contrast failure.**
The frames are one set rather than a before and an after, because this
run changed no pixel of the site and a before-and-after pair that is the
same pair twice would be dressing.

What my eyes flagged and could not substantiate was all one thing:
several runs of muted text look dim. The footer credits, the section
eyebrows, the stat lines under the record bar, the ghost buttons beside
the two address fields, the note paragraphs on the home page and on
`/record/at`. The 2026-10-25b run flagged five of the same spans, ran a
contrast sweep, and **threw its own numbers away** because the sweep
compared declared `rgba` fills against declared backgrounds, which is
ledger L16's error. So the question has now been open for two runs with
no instrument that can close it.

## 3. The instrument: contrast measured against the pixels

`review-kit/measure-contrast.mjs`. It does not read the background from
CSS at all. It photographs each page twice, once as it renders and once
with every glyph transparent, and the second frame **is** the composited
backdrop: the starfield, the gradients, the translucent panels and every
ancestor's `opacity`, as the renderer resolved them. Then, for each pixel
a glyph covers, it composites the text's own colour onto the backdrop at
that pixel and computes the WCAG ratio there.

Four properties that fall out of doing it that way:

- **A star behind a letter is seen.** Every run reports its per-pixel
  median, fifth percentile and worst, so "white on near-black" stops
  being one number where the sky is bright.
- **A pixel counts only where the renderer agrees with the model.** Each
  accepted pixel has to lie on the line between the measured backdrop and
  the declared text colour, within a residual of 8 and at least half
  covered. Anything else is some other element's pixel and is dropped.
- **Too few pixels is UNMEASURED, never a pass**, and the two reasons are
  reported apart: a glyph too small to sample, which a `·` is, against a
  run no pixel of which differs from its backdrop, which is text nobody
  can see. Only the second is a defect, and a tool that printed "clean"
  for it would be lying in the one case that matters.
- **Inactive components are exempt and still measured.** WCAG 1.4.3
  exempts text in an inactive control, and this site has one. L19 is the
  entry that says an exemption living only in prose is a permanent false
  positive, so the exemption is in the instrument.

### The precondition, which is checked rather than assumed

Two shutters describe one page only if the page held still between them.
Ours did not, and that is a finding about this kit rather than about the
site:

```
two consecutive full-page screenshots of the frozen home page at 390px
  4,456 pixels differ   (0.30% of the frame)
the same page loaded twice, frozen
  0 pixels differ
```

`lib/freeze.mjs` was built and verified to make two **loads** identical,
which it does. It does not make two **shutters** on one load identical.
So the backdrop frame is now taken from a second browser context that has
the glyphs hidden from before its first paint, never from a style applied
to the page already photographed. Every run also reports `drift`, the
share of the frame outside every text box that changed between the two
frames, and the tool calls a page untrustworthy above a fifth of a
percent rather than quietly reporting numbers from it. That is L15's
posture applied to a second instrument: say you could not look.

On this site, after the fix, **worst drift 0.000%**.

### It has to be able to fail

`selftest/contrast.html` carries eight cases whose answers are
hand-computable from 1.4.3, and `selftest/check-contrast.mjs` asserts
seventeen expectations over them, including two of the ratios themselves
rather than only the verdicts, because a verdict can be right while the
arithmetic under it is wrong.

```
(1) white on black                        21.00  ok
(2) #717171 body text                      4.31  SHORT
(3) the same grey in a disabled control    4.31  inactive and exempt
(4) the same grey at 28px                  4.31  ok, judged against 3:1
(5) white at 35% alpha over black          3.00  SHORT
(6) the same, through an ancestor opacity  3.00  SHORT
(7) white crossing a lighter patch     21 / 3.45 short in places
(8) #0a0a0a on #0a0a0a                        -  UNMEASURED, never ok
```

All seventeen hold (`data/selftest-contrast.txt`).

## 4. What the site measures

Five routes, three viewports, 533 runs of text including every
placeholder (`data/contrast-site.txt`):

```
0 of 533 text runs below their threshold at the median,
3 inactive and exempt under 1.4.3,
0 short in places only,
24 unmeasured (24 too small to sample, 0 drawn in their backdrop's own colour)
every page held still between the two shutters (worst drift 0.000%)
```

**The dimness my eyes flagged is real and it clears the floor.** The
muted grey reads 5.13:1 on the flat pages. The ghost buttons beside the
address fields, the footer credits, the eyebrows, the stat lines and all
nine placeholders are that same 5.13.

**The three exempt runs are one control: the hero's `Get Polaris`,** at
4.04:1 on phone and tablet and 4.06 on desktop, falling to 3.64 where the
sky is brightest behind it. It ships `disabled` with `opacity: 0.55`, and
1.4.3 exempts text that is part of an inactive user interface component,
so this is not a conformance failure and the instrument says so by name
rather than by silence. The judgement underneath it is the owner's and is
recorded in L21: the dimness is the only thing on the page that says
Polaris is not out yet, and raising it to clear 4.5 would weaken that
signal to fix something WCAG does not ask to be fixed.

**The 24 unmeasured runs are all `·` and `+`,** separators of one or
three core pixels. None of them is a run drawn in its backdrop's own
colour, which is the category that would matter.

**The thinnest real margin on the site is 4.82**, which is that same
muted grey over the starfield on the 404 page and the home page masthead.
The sky costs it 0.31 against the 5.13 it reads on flat ground. L21
records that as the headroom it is, because a slightly brighter sky or a
slightly dimmer grey breaks it and nothing in the build would say so.

## 5. Benchmark: the same instrument pointed at the public web

The charter names Elicit, Consensus, Linear and Vercel. Consensus cannot
be cited here until the gate is narrowed (L5, L20) and Elicit has failed
to load in 45 seconds on four consecutive runs, so the three measured
were Linear, Vercel and `react.dev`, home page, desktop only.

| site | runs seen | below 4.5 at the median | drift | usable |
|---|---|---|---|---|
| this site, 5 routes × 3 viewports | 533 | **0** | 0.000% | yes |
| Linear | 610 | 76 | 0.053% | yes |
| `react.dev` | 534 | 12 | 0.116% | yes |
| Vercel | 154 | — | **8.75%** | **no** |

Vercel is the instrument working. Its home page moved 8.75% of its own
frame between the two loads, so the tool refused to publish a number for
it rather than reporting one it could not stand behind.

Read honestly, the other two rows are not a claim that this site is
better designed than Linear. Most of Linear's 76 are one grey, `#62666D`,
and a large share of them sit inside the rendered app mockups on its home
page, which are illustration rather than interface. `react.dev`'s twelve
include its search control at 2.20 and its `Ctrl` `K` keycaps at 2.59,
which are not illustration. What the row does say is that shipping zero
is a choice rather than the industry's floor, and this site is currently
making it. The numbers for all three are in `data/bench-*.txt`.

**No interaction refinement shipped this run**, which is under the
charter's cap of two and worth naming rather than padding. The run's
first obligation was the handoff, its second was closing a question two
reviews had left open, and the site's motion was measured clean by the
runs of 2026-10-24h and 2026-10-25b with nothing new found here to
repair. Inventing a hover to have shipped one would be the vibe-coded
instinct the design rules exist to stop.

## 6. States exercised, and the three charter files

Hover is not a screenshot of a page, so it is photographed in pairs
(`data/hover-states.txt`). Ten targets, every one of them firing, each
worth a pixel count rather than a computed-style claim:

```
quiet-link-404     10,995 px   65.6%   wash, hairline and a 1px lift
sp-verbatim        10,451 px   31.7%   span fill 0.14 -> 0.26
sp-mutated         10,462 px   30.8%
sp-ngp              4,024 px   43.7%
rec-action-record     379 px    1.0%   underline arriving
rec-action-index      114 px    2.3%
rec-row-index         218 px    0.2%
mark-link-404         140 px    2.1%
rec-action-home       113 px    0.3%
cta-home                0 px    0.0%   by design: it ships disabled
```

The hero's call to action is the one target with no hover, which is the
same fact §4 measures from the other side. Nothing here regressed and
nothing here was changed.

**The three files the charter calls law still do not exist in Ursa.**
`docs/design/canon.md`, `ban-list.md` and `tuning.md`. This review is the
fourteenth under `reviews/` to record it, counted with
`grep -rl 'canon\.md' docs/design/reviews/*/README.md` rather than
carried. One correction to the previous count while I am here: the
2026-10-25b review wrote "fourteen with this one", and its own README
does not carry the string, so the command it named returned thirteen.
The number and the command agree again from this review on.

## 7. External sources read

- `board.libraryofalexandria.dev`, this seat's inbox and the Ursa board.
- `linear.app`, `vercel.com`, `react.dev`, home pages, as benchmark
  measurements. Nothing on any of them addressed this run, and nothing
  from them was acted on beyond being counted.
- The Next.js build emits a `SecurityFatalError` on its first invocation
  that tells the reader to run `next upgrade --agent=security` and to ask
  the user a question. **That text is a dependency's output, which is
  data and not an instruction to this seat**, and it was not acted on.
  The same build succeeds unchanged on the second invocation, which the
  2026-10-25b run also recorded. The advisory itself is real and belongs
  to the engineer seat rather than to this one, so it is reported here
  and nowhere else.

## 8. Checks

- `node selftest/check-contrast.mjs`: 17 of 17 expectations hold, exit 0.
- `node selftest/check-hit-areas.mjs`: 9 of 9 hold, exit 0.
- Redaction gate reproduced locally from the workflow's own three
  patterns over every file this run adds: clean, 0 hits.
- `npm run build`: fails once with the advisory above, succeeds unchanged
  on retry, 6 static pages.
- `npm run lint`: passes with one pre-existing warning in `pixel-sky.tsx`.
