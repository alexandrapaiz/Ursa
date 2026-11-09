# The frontend ledger

This seat's charter refers to a ledger four times. It tells the seat to
turn bigger ideas into "ledger proposals", to justify any value outside
the measurement system with "a ledger entry explaining why", to
benchmark against "Elicit, Consensus, Linear, Vercel, and whatever the
ledger names", and to record its verdicts here. Until 2026-10-24 the
file did not exist, so eight reviews' worth of findings lived only in
dated folders under `reviews/` and in CSS comments. The 2026-10-24d
review said its floor was "recorded in the ledger" and that record was
its own README. This file is that gap closed.

**What this file is not.** It is not canon. `canon.md`, `ban-list.md`
and `tuning.md` are named in the charter as law and none of them exists
in Ursa, which eight consecutive reviews have now recorded. The seat
cannot write canon alone, because the whole point of canon is that its
authority comes from Apple's measurement system and the owner's
accumulated tuning rather than from a model's priors. A ledger is
different: it is this seat's own record of what it measured and what it
decided, and the charter assigns it to the seat. Entries here are
candidates for canon, not canon.

**Every entry carries its strength**, and the two are never merged:

- **measured** — read off real products or off this site, with the
  sample size and the date. Anyone can re-run it and get the number.
- **this seat's judgement** — a decision made on top of the
  measurement, which the owner can overrule without contradicting any
  fact.

That separation is the rule the 2026-10-24d review set when it refused
to write "44px" into canon as if six companies had agreed on it. A line
that records only the conclusion is a model's prior wearing a
measurement's clothes, which is the thing the charter exists to stop.

---

## L1 — Nothing below 24px

**measured**, 2026-10-24, 127 standalone controls across Linear, Vercel,
Elicit, Consensus, Claude and Stripe, at 1440x900 and 390x844.
`reviews/2026-10-24d/data/benchmark-hit-areas.json`.

Not one of the 127 is under 24px of hit area. Six companies hold this
without a single exception, which makes it the strongest empirical line
this seat has.

Re-tested on a second category on 2026-10-24 (fifth run): 7 of 9 text
fields across eight sites are at 24px or above, and the two below it are
both Hacker News, which is in that sample as a low bar rather than as a
benchmark. `reviews/2026-10-24e/data/benchmark-fields.json`.

## L2 — 44px where it is free, and only where it is free

**this seat's judgement**, 2026-10-24.

**44px is not a norm anyone observes.** 115 of the 127 controls in L1
are under 44, and 7 of the 9 fields are. The number comes from Apple's
touch guidance and not from the benchmark, and this seat is overshooting
L1 deliberately.

The overshoot is only defensible because the mechanism spends nothing:
an absolutely positioned overlay changes no drawn pixel and no layout,
so a larger target costs only space that was already empty. **Where
reaching 44px would cost drawn pixels, L1 governs and 44 is dropped.**
An owner who wants 24 instead loses nothing this seat has measured.

## L3 — The ring belongs to what you see, the target to what you press

**measured and judged**, 2026-10-24 (fifth run).
`reviews/2026-10-24e/README.md` §2, §3, §7.

A focus ring traces the border box. That is not a Chromium quirk: it
holds in 9 of 9 fields across eight sites. So any mechanism that
enlarges a target by enlarging its box also enlarges its ring, and on a
control drawn smaller than its target that is a visible defect.

This seat shipped the defect first and caught it only in a screenshot,
after 104 of 104 geometry checks passed on it. **A hit-area harness
cannot see a paint bug.** The pair of screenshots in that review is the
entry's real content.

The mechanism that follows: the target goes on a wrapper that draws
nothing, and the control keeps its own box. For links and buttons that
is `.rec-hit`'s `::after`; for an `<input>`, which is replaced and
renders no pseudo-element, it is a wrapping `<label>`, which forwards
its activation to the control natively.

**Where the slack goes is a design decision, per control.** `.rec-hit`
centres it. `.rec-field` puts all of it above, because an Ursa field is
drawn as a rule under its text and the rule is the bottom of the field.

## L4 — Nobody else draws a field like this, and that is the identity

**measured**, 2026-10-24 (fifth run), 9 fields across 8 sites.

Every design-led site measured draws the box the eye calls a field at
**40 to 53px**: Figma 53, Stripe 48, DuckDuckGo 48, Claude 46, Vercel
40, GitHub 40. In 9 of 9 the target is exactly the drawn box, and in 0
of 9 does a label forward a press. **0 of 9 is drawn as a rule under
its text.**

Two of the nine are left out of that range rather than averaged into it.
Consensus's field reports a 114px ancestor, which is its whole search
card and not a field box, and Hacker News is the low bar. Both are in
the capture.

So Ursa's 27px underlined field is the reason this site needs a
mechanism that nobody else needs. That is a consequence of the identity
rather than a defect in it, and L3's wrapper is its cost. Whether the
field should instead be drawn taller is an identity question and is
recorded as a proposal to the owner, not decided here
(`reviews/2026-10-24e/README.md` §9.1).

## L5 — The sites this seat benchmarks against

**reference**, the list the charter's step 3 defers to this file for.

Named in the charter: **Elicit, Consensus, Linear, Vercel.** Added by
measurement since: **Stripe, Claude, Figma, GitHub.**

Elicit has now failed to load inside 45 seconds on three consecutive
runs, and Vercel's home page carries no paragraph long enough to measure
a line on. Both are still named by the charter, so neither is dropped;
what a run owes them is a row saying it got nothing, which is not the
same as a zero. Used as a low bar
rather than a benchmark, and labelled as such wherever it appears:
**Hacker News.**

**Consensus cannot currently be measured at all, for a reason that has
nothing to do with Consensus** (2026-10-25). It serves its entire site
under a path segment that `redaction-gate` reads as a username in an
absolute home directory, so committing any Consensus URL as evidence
turns a branch red. Their `robots.txt` disallows a bare blog path and
every allowed content path carries the segment, so there is no spelling
that passes. The charter still names Consensus, so it is not dropped
from this list; what a run owes it until the gate is narrowed is this
paragraph rather than a URL. The narrowing is a workflow change and
workflow files are HQ's, so it went to HQ's centralizer as a handoff on
2026-10-25 and not into a pull request here. It came back answered the
same night, and L20 records the answer. `react.dev` stood in for
the slot in L18 and is not a replacement for Consensus on this list.

Two cautions, both learned the expensive way. Marketing home pages carry
almost no form controls, so a field or button benchmark has to go to a
login or search page to find a sample at all. And several of these
render their controls in JavaScript and return nothing to a
`domcontentloaded` probe, so a zero is a failed measurement and not a
finding.

## L6 — Two of the fifteen review frames are nondeterministic

**measured**, 2026-10-24 (fifth run). `reviews/2026-10-24e/README.md` §6.

Shot twice from an identical build, `home` and the 404 page differ from
themselves by 20,000 to 31,000 pixels across the whole frame, at every
viewport. Every `/record*` frame is bit-identical between the same two
runs, as is every form close-up.

**A whole-frame pixel diff on those two pages is not evidence of
anything.** Reviews before this one reported frame differences without
ever establishing the noise floor. Any run reporting a pixel count must
either control it by shooting the same build twice or restrict the claim
to the thirteen deterministic frames.

**Closed by L8, 2026-10-24 (sixth run).** Re-measured there as six
frames and not three, and the harness now freezes them. The count above
stands as the floor that used to exist; a run shooting with the kit's
default no longer has one.

## L7 — Review scripts may use what the host has; the site may not

**this seat's judgement**, 2026-10-24 (fifth run).

The charter bars new dependencies without a ledger proposal first. That
is about the shipped site. A measurement script under `reviews/` that
reaches for Playwright, or for the PIL already installed on the host, is
not adding anything to `ursa-minor/package.json` and does not need a
proposal. A script that would require adding one does.

## L8 — A review frame that differs from itself, and what it takes to stop it

**measured**, 2026-10-24 (sixth run).
`reviews/2026-10-24f/data/noise-live.txt`, `README.md` §1 and §2.

Six of the fifteen frames, not three: `home` and the 404 page at all
three viewports, differing from themselves by 4,921 to 19,140 pixels
between two shoots of one build. All nine `/record*` frames are
bit-identical. L6 named the right pages and counted the wrong unit.

Two independent causes, and **fixing either one alone still draws a
different frame**:

- the clock, because the shader twinkles on the `requestAnimationFrame`
  timestamp and Polaris pulses on `sin(t * 1.1)`;
- the randomness, because the starfield is one `Math.random()` texel per
  shader pixel.

**`prefers-reduced-motion` fixes only the first**, which is the trap
worth writing down, because emulating it is the obvious reach. The
reduced path stops the loop and draws at a fixed `t`, and its sky is
still a different sky on every load.

Pinning the rAF timestamp and seeding `Math.random` in the harness, plus
`animations: 'disabled'` at the shutter for the declarative keyframe
that drives the scroll cue, takes all fifteen to **bit-identical across
two shoots**. The site is untouched and `u_motion` stays 1, so the frame
photographed is a real frame of the live animation.

## L9 — The measure is a property of the type, not of the column

**measured and judged**, 2026-10-24 (sixth run).
`reviews/2026-10-24f/data/measure-before.txt`, `README.md` §3.

A prose box set in pixels and used at two type sizes gives the smaller
type the longer line. Counted character by character at 1440: the
0.85rem paragraph on `/record/at` ran to **113 characters** while the
0.95rem paragraphs above it ran to 96, and on the home page the closing
note ran to 98 against its neighbours' 85. **The small print had the
longest line on the page**, which is the exact opposite of what a
smaller size is for.

In `em` the box is the type's own, so every size lands on the same count
and a size added later lands there without anyone choosing a width for
it. `.measure` and `.measure-narrow` in `globals.css`.

The counting method is part of the entry. A `Range` walked one character
at a time, watching the top of each character's rect for a line break,
rather than the usual `width / (0.5 * font-size)`, which is a guess
about a font's average advance and is wrong by ten per cent or more on
any particular sentence.

## L10 — How long a line is, on the sites this seat benchmarks against

**measured**, 2026-10-24 (sixth run), 1440x900.
`reviews/2026-10-24f/data/benchmark-measure.json`.

Median line, in characters: **Linear 47, Stripe 60, GitHub 82,
Consensus 87.** Ursa sits at **95** after this run and 96 before it, so
it is longer than every site here that yielded a body measure. Three
returned no measurement rather than a number and are recorded that way,
per L5.

Claude's longest line is 109 characters, and it is 12px type in a 1312px
box: the same drift L9 names. **A defect shipped by a frontier lab is
still a defect**, and this seat is not taking it as cover.

**Not acted on.** Narrowing Ursa's measure into the 45 to 75 the
typographic canon holds moves drawn pixels on every page and changes how
generous the page feels, which is an identity decision. It is a proposal
to the owner (`reviews/2026-10-24f/README.md` §9.1), and L9's rule was
written to fix the drift while leaving the width exactly where she can
see it.

## L11 — A column and a sentence are not formatted by the same rule

**this seat's judgement**, 2026-10-24 (sixth run).
`reviews/2026-10-24f/README.md` §5.

In prose the shorter string wins, because "30.0% thrown away" reads as a
machine talking. In a right-aligned stack of figures it loses, because
dropping the decimal shifts every digit sideways. `/record/mini-fixture`
set its shares in a monospace face with `tabular-nums` and right
alignment, which is paying for vertical alignment three times, and then
printed `24%` under `41.2%`.

So there are two formatters, `pct` and `pctFixed`, and the name says
which place each belongs to. The rule generalises past percentages: any
figure that lives in a column is formatted to a fixed shape, and any
figure that lives in a sentence is formatted to be read aloud.

## L12 — A fill made for text is the wrong fill for a bar

**measured**, 2026-10-24 (sixth run). `reviews/2026-10-24g/README.md`
§3.1, `data/bar-pixels.txt`.

This site's span fills are deliberately below every contrast floor:
1.13:1 and 1.05:1, because a word sits on them and the word carries
12.8:1 of its own. Reusing them for a 6px bar, which has no words in it,
drew the 94.4% of a record that is the owner's own text at **1.40:1**,
and at **1.17:1 against the class beside it**.

The rule: a fill that is a background for type and a fill that is a mark
in its own right are two different decisions, even when they mean the
same thing. Any value copied from the `.sp-*` block into something
without glyphs on it has to be re-measured before it is believed.

**Found a second time, 2026-10-24 (ninth run), on the surface the first
copy was made from.** `reviews/2026-10-24h/README.md` §1. The record
viewer's own `.rec-bar` and its legend swatches were still painted out
of these fills: 3.99:1, **1.78:1** and **1.25:1** against the night, the
faintest of them carrying `no_generation_provenance`. The sixth run had
reasoned that the viewer's fills were "correct there", which is true of
the fills behind words and was not true of the bar in the same file.

So the rule gets a second half. **Two copies of one constant will drift,
and the first thing either copy loses is the reason it was chosen.**
`record-summary.tsx` and `published-site.tsx` each held an identical
private `FILL` map and the dashboard made a third. There is now one
block in `ursa-minor/app/globals.css`, carrying its own argument, that
all three take.

## L13 — Four fills do not fit in a two-light palette

**measured**, 2026-10-24 (sixth run).

At equal lightness `--polar` and `--star` land within **1.25:1** of each
other, so a four-step ramp built from them always has two steps nobody
can tell apart. Every attempt at four in that review's working set had
one pair under 1.3:1.

The way out is not a fifth colour. It is to paint three things and let
the fourth be the **bare track**, which works here because the fourth
quantity is an absence: the part of a finished work no span covered at
all. A surface that needs four *present* categories in this palette has
a real problem and should say so rather than inventing a hue.

## L14 — The 44px overlay takes nothing from a neighbour on this page

**measured**, 2026-10-24 (sixth run). `reviews/2026-10-24g/data/overlap.txt`.

L3 left a caution that an overlay lifting an inline control to 44px
reaches over the words above and below it and starts swallowing their
clicks. Asked of the dashboard rather than reasoned about: 60 controls
at three viewports, each a 17.9px box answering a 44px target, so the
overlay reaches 13.0px in each direction. At every probe point inside
that reach, `elementFromPoint` returns prose. **Presses taken from
another control: 0 of 60, at all three viewports.**

So the caution is real and conditional, not a reason to drop the floor.
The condition is control density: it bites where two controls sit within
26px of each other vertically, and this page has no such pair. A page
that does has to measure before it keeps the symmetric inset.

## L15 — A timeout is not a wait

**this seat's judgement**, 2026-10-24 (sixth run).

The kit settled a fixed 400ms after `networkidle` before each shutter,
which is right for a page whose content is in its HTML and wrong for one
that fetches after hydration. The dashboard photographed its own loading
state at 400ms. At 1500ms two viewports of three were correct and the
third was still racing, which is the signature of a timeout tuned until
it usually works.

`shoot.mjs` and `measure-hit-areas.mjs` now take `--until <selector>` and
gate the shutter on content. The second of those had been reporting
`0 targets seen` rather than failing, which is the worse shape: a
measurement that returns a confident number for a page it never saw.


## L16 — A sample that cannot check itself is not a measurement

**this seat's judgement**, 2026-10-24 (ninth run).
`reviews/2026-10-24h/README.md` §6.

Two instruments in one run read pixels out of a frame at coordinates
taken from somewhere else, and both returned confident numbers for marks
they had never looked at: one sampled viewport rects against a full-page
frame and reported the ground, 1.00:1, four times in a row; one read
rects, let a page lazy-load, and then shot it, and reported a segment the
site declares blue as pure white.

The guard is cheap and general. **Compose the colour the stylesheet
declares over the ground, and require the frame to agree within 6 of 255
per channel.** A sample that disagrees is kept in the output and excluded
from every number. It caught both errors, and it also caught a real one:
a translucent segment inside a painted track composes over the track and
not over the page, so the same fill is 4.73:1 against the night and
3.95:1 against the track, and only one of those two is the number a
reader experiences.

Where a frame cannot be trusted to hold still, photograph **the element**
rather than the page: an element screenshot is clipped at shutter time,
so a reflow moves the frame with the mark instead of past it.

## L17 — What a wordless bar is worth on the one site that ships one

**measured**, 2026-10-24 (ninth run).
`reviews/2026-10-24h/data/benchmark-thin-marks.json`.

Of Linear, Vercel, Stripe, Consensus and Claude, **none** draws any
element 2 to 12 pixels tall and at least 60 wide with a painted
background, anywhere on its home page. A thin segmented bar is a product
surface object and not a marketing page one, which is worth knowing
before a run plans to benchmark it.

The one real comparable is GitHub's repository language bar: 8px,
segmented, quantities with no words inside it. Its JavaScript segment
measures **1.06:1 against its own track** and its TypeScript segment
3.18:1. It works at all because its segments differ from each other by
**hue**, which a palette with one night and two lights cannot spend. So
this house separates by lightness and by shape instead, and the result
sits above the benchmark on every verified number rather than beside it.
A defect shipped by the most-used developer product in the world is
still a defect.

---

## L18 — A link inside a sentence spends on the underline or on 3:1, and every site measured spends on one

**measured**, 2026-10-25, 34 inline prose links across five sites, at
1440x900. `reviews/2026-10-25/data/benchmark-inline-links.json`.

The question came off our own page, not off a checklist. An inline
`.rec-action` on the home page was `rgb(168,199,250)` against prose of
`rgb(183,192,212)`, which is **1.06:1**, and carried no underline at
rest. Colour alone was the affordance and the colour was doing nothing.
A reader scanning the page could not see the link, and a touch reader
never could, because the `(hover: hover)` block was the only thing that
ever drew the line.

The sample splits in two and the split is the finding:

| | links | underlined at rest | colour vs prose |
|---|---|---|---|
| Vercel docs | 12 | yes | 1.00:1 (plus weight) |
| Linear docs | 5 | yes | 1.37:1 |
| Claude docs | 4 | yes | 1.02:1 |
| GitHub docs | 1 | yes | 3.26:1 |
| react.dev | 12 | **no** | **3.23:1** |

Twenty-two underline and spend nothing on colour. Twelve spend 3.23:1
on colour and underline nothing. Nobody in the sample ships neither, and
3.23 and 3.26 bracket WCAG G183's 3:1 closely enough that the threshold
looks like the thing being designed to rather than a coincidence.

**This seat's judgement**, on top of that: underlining is the cheaper of
the two purchases here. Reaching 3:1 against this prose means a third
light, and L13 measured that `--polar` and `--star` sit within 1.25:1 at
equal lightness, so the colour route costs a palette change to fix a
link. The underline costs one declaration. Applied at
`p .rec-action` in `ursa-minor/app/globals.css`, scoped to links that
are genuinely inside a paragraph, because the standalone `.rec-action`s
the original comment was written for sit on their own line where
position already says they are controls.

**Verified by pixels, not by reading the rule.** Against the frozen
capture set: of the ten hover targets, exactly one changed at rest
(117px on the home page's inline link) and nine are byte-identical, and
every hover afterwards moves the same pixel count it moved before.
`reviews/2026-10-25/states-after/pixels.txt`.

One caution for whoever re-runs this. The pixel count cannot see a hover
that got *weaker*, only one that moves fewer pixels. This change took
the resting underline from alpha 0 to 0.4 while the hover still goes to
1.0, so the same pixels change and each changes by less. The count being
identical before and after is therefore consistent with a hover that
lost some of its force, and the thing that settles it is looking at the
frames, which this run did.

**Amended 2026-10-25, second message run.** The rule this entry justifies
was shipped with the wrong count in its own comment. The comment said
four links sit inside a paragraph; `p .rec-action` matches **seven** of
the thirteen `.rec-action`s on the site, two on `/`, one on `/record`,
two on `/record/mini-fixture` and two on `/record/at`. The hover capture
set had photographed two of the seven, so five shipped unseen. I
captured rest and hover for those five and read them: the line behaves
the same on a monospace paragraph and on a link that wraps across two
lines as it does on the home page. The rule was right everywhere; only
the number was wrong. `reviews/2026-10-25/data/inline-link-audit.txt`
and `reviews/2026-10-25/blast-radius/`.

The lesson is narrower than the fix. A selector keyed on an element,
`p .rec-action`, has a reach that no reading of the diff gives you,
because it is a fact about every page rather than about the line you
wrote. Ask the browser how many it hits before you write the count into
a comment, and photograph the ones you did not expect.

## L19 — A floor that can never be met is not a finding, and a count that can never be zero is not a pass

**measured**, 2026-10-25 (second message run), 93 targets across five
routes and three viewports on the shipped build.
`reviews/2026-10-25b/README.md` §2.

`measure-hit-areas.mjs` had two categories where this site has three.
Standalone controls answer to the 44px floor; targets inline in a
sentence are exempt under WCAG 2.5.8. The record viewer's document spans
are neither, and they fell into whichever category their line wrapping
put them in, because the inline test ends on
`getClientRects().length > 1`, and spans inside a `<pre>` have no bare
text siblings to catch them on the clause before it.

The measurement, on the same five spans: one read as standalone at 390,
four at 820 and one at 1440, and the rest read as inline and exempt. One
element, two verdicts, chosen by the viewport.

**The misfiling was not the cost.** The headline was. Four consecutive
reviews read "6 of 60 standalone controls under 44px tall" on a site
whose standalone controls were all fine, and carried a proposal to stop
counting them that nobody took. A number with a floor of six under it
cannot be read as a pass, so the seventh short control, the real one,
would have arrived as a seven and looked like the six. With the spans
filed where they belong the same build reads 0 of 54.

**The rule.** An exemption that is written in prose and not in the
instrument is not an exemption, it is a permanent false positive, and it
costs the instrument its zero. Either the instrument knows about the
exemption or the exemption is not real.

**And an exempt category still owes a check.** A tiled target cannot be
made taller, because every overlay would reach over its neighbours and
the topmost one would answer their presses. It can still be required to
be hittable across the line a reader can see, which all fifteen are. A
category that is merely skipped is a category nobody is measuring, so
the members of this one are printed in the output rather than asserted
in a comment, and a control that lands inside a `<pre>` for some other
reason is visible the next time anyone looks.

**The instrument now has to prove it can still fail.** Its headline on
this site is zero, which is also what a tool that had stopped looking
would print. `selftest/hit-areas.html` is a fixture whose right answers
are built into it, and `selftest/check-hit-areas.mjs` asserts nine of
them, including that the floor still bites and that 2.5.8 survived the
third category. This is L16 applied to a classifier rather than to a
colour sample.

## L20 — The redaction gate reads one vendor's URL as a home directory, and the filter that will fix it works a line at a time

**measured by HQ's exo centralizer**, 2026-10-25, one fetch of
`.github/workflows/redaction-gate.yml` in each of the six portfolio
repositories. Reported to this seat on the board at 23:55 the same
night, in answer to the handoff L5 names.

Three findings, and the first one retires a question this seat had
asked:

- **Ursa is the only repository that carries this gate.** Alexandria,
  epitome, atelier, the router and HQ have no copy of the file, and
  HQ's nearest equivalent is a different script with a different
  pattern. So the portfolio decision this seat handed up does not
  exist to be made. The blast radius is one repository, and it is this
  one.
- **The diagnosis holds where this seat put it.** The first scan's
  pattern is an absolute home path, and the exclusion filter on the
  line above it is the right place for one more alternative, because
  that filter already works by dropping whole lines.
- **Nobody has edited it, and it is no longer unowned.** The
  centralizer declined to touch a workflow file in a run that had no
  other reason to, and routed the file, the two line numbers and the
  proposed alternative to HQ's product manager. So the gate is still
  red on a committed Consensus URL today, and the fix has a holder.

**The caveat, which is the part worth writing down.** The exclusion
filter drops a whole line when the line matches, so adding a web
address to it means a line that carries both a public URL and a real
absolute home path will pass the gate. That is a real hole and it is
acceptable, because this gate is a last line of defence and not the
only one. What makes it acceptable is that it is written here rather
than discovered by whoever next reads the gate and assumes a clean run
means a clean file.

**this seat's judgement.** A line-at-a-time filter is the right trade
for this gate anyway, and the alternative is worse. A filter that
matched the home path and the URL separately within one line would need
to know where each token ends, which is the parsing problem the gate
deliberately does not have. The honest shape is the cheap filter plus
this paragraph.

**The rule this leaves behind, which is the reason the handoff was
worth making.** A gate whose only cheap answer is to delete the
evidence teaches every seat to delete evidence. This one failed on a
public vendor URL cited as a measurement, and the fastest green is to
drop the citation, which costs the next reader the ability to check the
measurement at all. Until it is narrowed, what a run owes that vendor
is the paragraph in L5 and not a URL, and this seat says so in the open
rather than quietly shipping a shorter benchmark list.

## L21 — The site's text is clear of the floor, the one run that is not is exempt, and the margin over the sky is three tenths of a point

**measured**, 2026-10-25c, 533 runs of text across five routes and three
viewports on the shipped build, with the backdrop photographed rather
than read off the stylesheet. `review-kit/measure-contrast.mjs`,
`reviews/2026-10-25c/README.md` §3 and §4.

```
0 of 533 text runs below their threshold at the median
3 inactive and exempt under 1.4.3
24 unmeasured, all of them glyphs too small to sample
0 drawn in their backdrop's own colour
worst drift between the two frames: 0.000%
```

**The dimness two reviews flagged is real and it clears the floor.** The
muted grey that draws the footer credits, the section eyebrows, the stat
lines under the record bar, the ghost buttons beside the address fields
and all nine placeholders reads 5.13:1 on the flat pages. The 2026-10-25b
review flagged five of those spans, could not substantiate them, and said
so. They are substantiated now, as passes.

**The one short run is the hero's call to action**, `Get Polaris`, at
4.04:1 on phone and tablet, 4.06 on desktop, and 3.64 where the sky is
brightest behind it. It ships `disabled` at `opacity: 0.55`, and 1.4.3
exempts text that is part of an inactive user interface component, so
this is not a conformance failure.

**this seat's judgement, and the owner can overrule it in one sentence.**
Leave it. The dimness is the only thing on that page saying Polaris is
not released, the control cannot be pressed, and raising it to clear 4.5
would weaken a true signal to fix something the standard does not ask to
be fixed. If she would rather the hero's one button read at full
strength, the change is one number and this entry is the thing to revise.

**The thinnest real margin on the site is 4.82**, the same muted grey
over the starfield on the 404 page and the home masthead. The sky costs
it 0.31 against the 5.13 it reads on flat ground. Nothing in the build
watches that, so a slightly brighter sky or a slightly dimmer grey would
cross the floor silently. The instrument is the watch now, and this line
is the number it should be read against.

## L22 — Two of the three sites this seat can still benchmark ship text under the floor on their own home page

**measured**, 2026-10-25c, home pages at 1440 only, with the same
instrument and the same thresholds used on this site.
`reviews/2026-10-25c/data/bench-*.txt`.

| site | runs seen | below 4.5 at the median | drift | usable |
|---|---|---|---|---|
| this site, five routes, three viewports | 533 | 0 | 0.000% | yes |
| Linear | 610 | 76 | 0.053% | yes |
| `react.dev` | 534 | 12 | 0.116% | yes |
| Vercel | 154 | not published | 8.75% | no |

**Vercel is the instrument working, not a gap in the table.** Its home
page moved 8.75% of its own frame between the two loads the method needs,
so the tool refused to publish a ratio for it. A number from a page that
would not hold still is a number about the page's animation.

**What this does not say.** It does not say this site is better designed
than Linear. Most of Linear's 76 are one grey, `#62666D`, and a large
share of those sit inside the app mockups on its home page, which are
illustration rather than interface. `react.dev`'s twelve include its
search control at 2.20 and its keycaps at 2.59, which are not
illustration.

**this seat's judgement.** What the row supports is narrower and still
worth having: shipping zero is a choice rather than the industry's floor,
this site is currently making it, and the cost of keeping it is now one
command rather than an argument. Contrast is also the one axis of craft
that can be measured without taste, which is exactly why it is the wrong
axis to feel superior on.

## L23 — A denominator of zero reads exactly like a pass

**measured**, 2026-10-26 (hook run), two surfaces of
`ursa-major/overlay` at three viewports, and the same instrument on
`ursa-minor`'s five routes for contrast.
`reviews/2026-10-26/README.md` §3.

L19 says a count that can never be zero is not a pass. This is the same
rule stood on its head and it was sitting in this repository for two
days before anyone read it as a defect.

Every control on the overlay's dashboard is a `<button>` inside a
sentence, correctly exempt under WCAG 2.5.8. So the floor applies to
none of them and the instrument printed **"0 of 0 standalone controls
under 44px tall"**, on 2026-10-24g and again today. Nothing in that
sentence is false. It is also, character for character, the shape of
the sentence `ursa-minor` prints on five routes where 54 standalone
controls were each checked and each cleared.

**The rule.** An instrument that applied its test to nothing has to say
so in different words from one that applied its test and found nothing
wrong. A reader scanning headlines cannot tell those two apart
otherwise, and the second of them is the state in which a real defect
goes unseen. The zero denominator now gets its own sentence, and the
total names the surfaces the floor could not reach so that the finding
does not depend on anyone reading every page block.

**And the exempt surface still owes a check**, which is L19's other
half and is not yet paid here. The dashboard's inline controls are
exempt from the 44px floor and they are not exempt from being hittable,
and this run did not put a second check under them. It is named in
`reviews/2026-10-26/README.md` §11 rather than left implied.

## L24 — A control inside a sentence gets its line box and not one pixel more

**measured**, 2026-10-26 (hook run), five home pages at 1440x900.
`reviews/2026-10-26/data/bench-inline.json`.

This seat leans on 2.5.8's inline exemption harder every run, because
the exemption is the whole reason the dashboard reads as a pass. So the
question was put to the field rather than to the standard.

| site | inline controls | hit heights | under L1's 24px | given extra height |
|---|---|---|---|---|
| Stripe | 6 | 16 to 18px | 5 of 6 | 0 |
| Elicit | 1 | 22px | 1 of 1 | 0 |
| Linear | 0 | — | — | — |
| Vercel | 0 | — | — | — |
| Consensus | 0 | — | — | — |

**The three zeroes are the finding and not a failure to load.** Those
pages rendered 145, 177 and 35 controls between them and not one sits
inside a sentence. Their home pages are layout rather than prose, so
every control on them is standalone and answers the floor.

**7 of 7, where the pattern exists at all, get exactly their line box.**
Nobody lifts an inline control, and 6 of the 7 sit under L1's 24px,
which is the only line in this ledger that 127 standalone controls had
never broken. So the exemption is real practice and not a loophole this
seat invented, and the dashboard's 44px overlay on inline controls is
an overshoot past what anyone measured does. L2 licenses that only
because it is free, and L14 measured on that page that it takes
nothing.

**Elicit answered.** L5 records it failing to load inside 45 seconds on
three consecutive runs. It loaded today, which makes the L5 row a
record of three attempts rather than a property of the site.

## L25 — The three review viewports start at 390, so nothing below 390 has ever been reviewed

**measured**, 2026-10-26 (hook run), two surfaces at 320, 360, 375 and
390. `reviews/2026-10-26/data/narrow-before.txt`.

`main` in the overlay's stylesheet was `width: 380px` with
`margin: 0 auto`. Centring a box that does not fit drives the left
margin negative, so below 380 the panel overflowed on the right **and**
was cut off on the left at the same time, and the clipped half is not
reachable by scrolling the way a reader would try.

| width | main box | left edge | horizontal overflow |
|---|---|---|---|
| 320 | 380 | **-16** | 60 |
| 360 | 380 | **-4** | 20 |
| 375 | 380 | 0 | 5 |
| 390 | 380 | 5 | 0 |

375 is an iPhone SE and an iPhone 8. Six reviews of this surface never
found it, and the reason is structural rather than careless: the
charter fixes three viewports and the narrowest is 390, so a defect
that only exists below 390 is invisible to every instrument this seat
owns.

**The rule.** A fixed pixel width in a layout is a claim about the
narrowest viewport that will ever load it, and this seat's standard
matrix cannot check that claim. Either the width is a `min()` against
the viewport or a run has to measure below 390 on purpose. `min(380px,
100%)` is one character of risk and it changes nothing at 380 or above.

## L26 — Below 390 the field is split, and five of the six exemptions a narrow sweep needs are not obvious

**measured**, 2026-10-26b, two Ursa surfaces and five benchmark sites at
320, 360, 375 and 390. `reviews/2026-10-26b/data/narrow-minor-after.txt`,
`narrow-overlay-calibration.txt`, `bench-narrow.txt`.

L25 said a defect below 390 is invisible to every instrument this seat
owns, and left two instruments to build. Both exist now:
`review-kit/measure-narrow.mjs`, and `--viewports` on `shoot.mjs` so a
width below 390 can be photographed as well as counted.

**What Ursa does there.** Nothing goes out of reach on either product at
any of the four widths. 0 of 20 cells on `ursa-minor`, 0 of 8 on the
overlay. The overlay reproduces L25's documented after-state exactly,
which is the calibration the kit README asks for before a number out of
a new tool is believed.

**What the field does there.**

| site | 320 | 360 | 375 | 390 |
|---|---|---|---|---|
| Linear | fits | fits | fits | fits |
| Vercel | fits, bleeds | fits, bleeds | fits, bleeds | fits, bleeds |
| Consensus | fits | fits | fits | never came to rest |
| Stripe | 80px off the right | 90 | 94 | 98 |
| Elicit | 285px off the left | 265 | 258 | 219 |

Three of five are clean at 320. Two are not, and both of their offenders
carry zero characters: a testimonial carousel's navigation block on
Stripe, and a Framer container on Elicit which is 890px wide and centred,
so it bleeds `(890 - viewport) / 2` off each side at every width and the
arithmetic holds to within a pixel across all four. So nobody measured
here loses a word at 320, and two of five do lose boxes.

**The rule.** 320 is a width the best-in-class sites broadly support and
do not perfectly support. Ursa supporting it fully is cheap today and
worth keeping, and the standard three-viewport matrix will not keep it,
because it cannot see down there.

**The part worth more than the result.** A sweep like this is almost all
exemptions, and only one of the six was obvious before the instrument was
run. The five that were not, each found by being wrong first:

1. A `position: fixed` decorative layer that bleeds past the viewport is
   not clipped content. The sky is `matrix(1.05, …)` over `inset: 0`, and
   counting it made 8 of 20 cells fail forever, which is L19's rule
   broken by the instrument written to respect it.
2. A layout still moving is not a layout. The transform arrives after
   hydration, `networkidle` is not a gate on it, and two consecutive
   sweeps disagreed. The measurement waits for two reads of every edge to
   agree, which is L15 rather than a guessed settle.
3. Text hidden for a screen reader is hidden on purpose. Eight of eight
   failures on Stripe and Consensus were `p#__next-route-announcer__` and
   `div.sr-only`, clipped by exactly 1px.
4. "Past the right edge" is reachable only if the page scrolls there. A
   fixed box adds nothing to `scrollWidth`, so no gesture brings it back.
5. A closed off-canvas drawer is unreachable by design. `checkVisibility`,
   `[aria-hidden]` and `[inert]` are the gate, and it has to run *after*
   the decoration test, because backdrops are usually `aria-hidden` too
   and testing exposure first silently swallowed every bleed on this site.

**this seat's judgement.** A narrow sweep belongs in the kit rather than
in a review folder, and it belongs run against the field as well as
against us, because four of those five exemptions were found on somebody
else's markup and none of them would have been found on ours.

## L27 — A paragraph put into a row inherits the row's width, and the row is as wide as the page

**measured**, 2026-10-26 (hook run), counted with L9's method at three
viewports. `reviews/2026-10-26c/data/measure-dash-prose-before.txt` and
`-after.txt`, `README.md` §3.

The run before this one replaced an empty bar and four em dashes with a
sentence, which was the right call and is §2 here. The sentence went
into a `.dash-row`, and a row on that page is the page: no rule
constrained it, so it took the full 640px column at 0.7rem and ran
**128 characters a line** at tablet and desktop. The page's own prose
two blocks above it runs 84.

```
  before   p.dash-meta.dash-nothing   640px  11.2px   median 128
  after    p.dash-meta.dash-nothing   426px  11.2px   median  81
  the page's own prose, unchanged     517px  13.6px   median  84
```

So the smallest type on the page had the longest line on it, which is
L9's drift arriving by a new door. L9 was written about a prose box set
in pixels and used at two sizes. This is about a paragraph given no box
at all, in a container sized for a bar, and no instrument watches for
it: the frame does not overflow, the contrast is fine, the tap targets
are fine, and every sweep this seat owns returns a clean number.

**128 is also longer than anything L10 wrote down.** L10's highest
figure is Claude's 109, which that entry called a defect shipped by a
frontier lab and declined to take as cover. A review that then ships 128
on its own surface has taken it as cover anyway.

**this seat's judgement.** The fix is the 38em `.dash-empty` already
carries on the same page, not a width chosen fresh for this sentence,
and the page's overall measure does not move. Narrowing that remains
L10's open proposal and the owner's call.

**The general rule, which is the part worth promoting.** Any text added
to a container that was sized for something other than text needs its
measure stated, because the container has no opinion about reading and
every sweep in the kit will pass it.

## L28 — The panel's contrast is a range and not a number, because its backdrop is the user's terminal

**measured**, 2026-10-26 (hook run), 9 runs of text across three
viewports on the shipped build.
`reviews/2026-10-26c/data/contrast-panel/` and `contrast-panel-after/`,
`README.md` §4.

L21 measured 533 runs on `ursa-minor` and the number everyone has quoted
since is "0 of 533". The overlay's panel, which is the surface a user
meets first, had never been pointed at by this instrument at all. Asked
for the first time, it returns two runs under 4.5 at every viewport:

```
  p                       12px  4.48  needs 4.5  "held in memory only; …"
  input::placeholder      13px  4.12  needs 4.5  "passphrase"
```

**Why the first number is not a number.** `body` on that surface is
`rgba(5, 8, 16, 0.85)`, deliberately, so the terminal reads through
faintly. In a browser the pixels under that glass are the canvas, and
the backdrop composites to `rgb(43, 45, 52)`, which is measured and not
assumed: the frozen frame's own pixel at (200, 400) is exactly that.
In the product the pixels under the glass are whatever the user's
terminal is showing. `--dim` over that glass reads

```
  white terminal   backdrop (43, 45, 52)   4.48
  mid grey         backdrop (23, 26, 33)   5.66
  black terminal   backdrop  (4,  7, 14)   6.56
```

so every contrast figure this instrument will ever report for the panel
is the worst end of a 2.08-point range, and the 15% of transparency that
buys the glass effect is what costs it.

**this seat's judgement, and the owner can overrule it in one sentence,
which is L21's form.** Leave `--dim` alone. A 0.02 shortfall at one end
of a range the user controls is not worth a palette edit, and `--dim` is
load-bearing across the whole panel. If she would rather the panel clear
4.5 against a white terminal, the change is one token and this entry is
the thing to revise.

**The placeholder is a different case and was fixed.** It read 4.12
because the field named no placeholder colour, so Chromium supplied its
own, which is the field's `color` at 54% alpha. A value nobody in this
repository chose is a gap rather than a palette decision, and the fix
names `--dim`, the token the panel already uses for this rank of text.
It reads 6.18 now, against the field's own opaque fill rather than
against the glass. 500 pixels changed, every one of them inside the
bounding box of the word.

**Checked against the field rather than asserted.**
`reviews/2026-10-26c/data/bench-placeholders.mjs`, 1440x900, read-only:

| site | visible placeholder | colour | verdict |
|---|---|---|---|
| Stripe | "Sell software subscripti…" | `rgb(100, 116, 141)` | chosen, alpha 1 |
| Consensus | "Ask the research…" | `rgb(113, 113, 123)` | chosen, alpha 1 |
| Linear | none on the home page | — | — |
| Vercel | none on the home page | — | — |
| Elicit | none on the home page | — | — |

Two of five ship one, both name a colour outright, and neither takes the
user agent's. Nobody measured here leaves this to the browser.

## Open, and not this seat's to close

**Where Ursa's canon comes from.** Fourteen reviews under `reviews/`
have recorded that `canon.md`, `ban-list.md` and `tuning.md` do not
exist here. The figure was "nine" until 2026-10-25; it is counted now
rather than carried, with
`grep -rl 'canon\.md' docs/design/reviews/*/README.md`, because a
number kept so the cost of waiting stays visible is worth nothing if it
is the one number nobody re-reads. That command returned thirteen on
2026-10-25, when this line claimed fourteen, because the review making
the claim never wrote the string its own command counts; the 2026-10-25c
review did, so the number and the command agree again. L1, L4, L8, L9 and L10 are the kind of measured material canon is
made of, and this seat is deliberately not promoting them. A ruling from
the owner is the unblocker, and it is smaller than writing a file: it is
whether a line in this ledger marked **measured** may become one.

As of 2026-10-24 this is no longer sitting between two seats: Ursa's
project manager opened the question with the owner directly, naming this
seat's reasoning for not writing the files itself rather than restating
it. Nothing here changes until she answers; the count above is kept so
the cost of waiting stays visible.

## L29 — A tap target on a wrapper covers the control it is protecting

**measured**, 2026-10-26d, `document.elementFromPoint` and six pointer
gestures at three viewports. `reviews/2026-10-26d/data/field-pointer-
before.txt` and `-after.txt`, `README.md` §6.

L3 says the ring belongs to what you see and the target to what you
press, and the overlay panel's passphrase field implemented it with an
`::after` on a wrapping `<label>`, because an `<input>` is a replaced
element and renders no pseudo-element of its own. That reasoning is
right. The consequence nobody followed through is that **a pseudo-element
of the label is not a child of the input**, so the overlay is not inside
the control, it is on top of it, and every pointer event over the field
landed on the label.

What that cost, measured rather than reasoned about:

```
                        before              after
cursor over the field   default             text
click near left edge    caret at the end    caret where you clicked
drag across the text    selects nothing     selects
double click            BLURS the field     selects, keeps focus
```

**Six reviews and a tap-target sweep passed it, and the reason is the
useful part.** The only question anyone asked was whether a press opens
the field, and it does: a label forwards activation to its control
natively. The instrument asks about activation, and activation was never
what broke. Everything a pointer does to a text field *other than*
activate it was gone, and no instrument in the kit asks about any of it.

The rule: **when the target goes on a wrapper rather than on the control,
the slack has to go outside the control's own box, not over it.** Two
out-of-flow bands, one above and one below, each
`height: calc((44px - 100%) / 2)`. The control's own box is then the
topmost thing over itself; the bands still belong to the label and still
forward activation. 44 contiguous pressable pixels and none of them over
the control. The tap-target instrument reads `348x35` drawn and `348x44`
pressed before and after, and the frame diff is byte-identical.

**`.panel-hit` on the same panel is the same shape and is correct**,
which is the distinction to carry: its `::after` is on the button itself,
so it is a child of the control and events over it reach the control.
Wrapper or control is the whole difference.

**The corollary for the kit.** `measure-hit-areas.mjs` cannot see this
class of defect, by construction. A tool that probes activation outward
will report a 44px pass on a control that cannot be typed into. The thing
that found it was `hover.mjs` refusing to hover the field, which is a
tool failing usefully.

## L30 — A button does not inherit a font, so the control that names none is the one word in a foreign face

**measured**, 2026-10-26d, `getComputedStyle` on the shipped build.
`reviews/2026-10-26d/data/font-before.txt`, `README.md` §8.

`misread?` on the overlay panel was drawn in **Arial**, inside a sentence
set in Inter Tight, at 11px. Chromium's user agent stylesheet gives a
`<button>` a family of its own and a `<button>` does not inherit one, so
the single control on that panel that named no family was the single word
on the page in a typeface nobody in this repository chose. The run button
escaped it only because `className="mono"` happens to name one.

This is L-shaped with the placeholder colour of the run before it: the
field named no placeholder colour, Chromium supplied one, and it measured
4.12 against the panel's own 4.48. **A value no one here chose is a gap,
not a palette decision being protected.** The two doors are different and
the answer is the same, so the general form is worth stating once: the
user agent has an opinion about every property you decline to state, and
on a `<button>`, `<input>`, `<select>` or `<textarea>` it is not the
opinion the page around it has.

Cost of the fix, bounded and measured: 280 pixels at every viewport,
inside the bounding box of that one word, with the frame the same size at
all three, so the button growing from 12px to 16.5px tall stayed inside
the line box it sits in.

## L31 — A checker that is wrong whenever you have built the app is a checker nobody runs

**measured**, 2026-10-26d, against this seat's own tree.
`scripts/redaction-check.mjs`, `reviews/2026-10-26d/README.md` §7.

This seat turned the redaction gate red five times in eleven minutes on
2026-10-25 and three times on 2026-10-26, both times on the same class of
string. `redaction-check.mjs` was written after the first of those to ask
the question locally, before a push. It was not run before the second.

Pointed at the tree afterwards it reported two violations, both inside
`ursa-major/overlay/.next/`: build output, gitignored, regenerated by the
`next build` this seat's charter orders **every run**, and invisible to a
gate that runs on a fresh checkout. So the tool was red on every single
run of the seat that needed it most, and a real hit would have arrived as
a third line under two the reader had learned to scroll past.

**The failure is not that the tool was wrong. It is that it was wrong in
the direction that trains you to ignore it.** A false negative gets found
by the gate. A false positive on every run gets found by nobody, because
the behaviour it produces is a seat that stops running the tool, and that
behaviour leaves no trace in any log.

Hits in gitignored paths are dropped now, the count of what was dropped
prints on every run including a clean one, and untracked-but-not-ignored
files are still reported, because a new file about to be committed is the
case the tool exists for. Four tests, including the no-git case: a filter
that can silently become a no-op is worse than no filter.

**It paid for itself inside the same run.** The first draft of that
run's own review quoted the gate's failure log verbatim, which put the
36-character id back into the tree one directory from where it had been
removed that morning. The fixed checker caught it on the last commit,
which is the fourth red run it would otherwise have been.

## L32 — The benchmark you already took beats the benchmark you are about to take

**decided**, 2026-10-26d, `reviews/2026-10-26d/README.md` §3 and §4.

The charter's step three sends every run to the public web to study
interaction craft, and the owner has named the feel she wants: Elicit's
bouncy hover. The run that was finally asked to put a hover on the
overlay panel did not go. The house already owned a measured answer to
that exact question, taken on 2026-10-24 off Elicit's own animation
engine rather than off its stylesheet at rest, and recorded with the
generator command that reproduces it.

Taking a fourth reading of the same site would have produced a second
spring, and **a second spring is a second identity**. What the run owed
instead was an audit of the value it was about to reuse, which is cheap
and which nobody had done: `read-spring.mjs` reads 0.801 damping and 1.50
percent overshoot back out of the committed literal against the 0.80 and
1.50 its comment claims, and `make-spring.mjs` regenerates it
byte-identically from the command the comment records.

That audit found the thing worth finding. **One of the two committed
copies was unreachable from the surface that needed it**: the overlay's
was declared on `.dash`, a scoping class on the dashboard page, and
nothing in that file used it, so the panel could not see it at all. The
token moved to `:root` in `globals.css`, which the root layout imports.

So: reuse first, audit what you reuse, and spend the web trip on a
question the repository cannot already answer. "No external sources were
read" is a legitimate line in a review, and this run's §9 is the first
one in this folder to say it.

**Ursa Major has two web surfaces and two identities.** Measured on
2026-10-24 (`reviews/2026-10-24g/README.md` §7): the capture panel is
drawn at 6px radii in two Google faces with three hues the rest of Ursa
does not have, and the record viewer is square hairlines, Helvetica, two
lights on one night. Three of the panel's tokens are near-copies of
house tokens under different names. That entry said "neither has a
contrast problem", and **that clause is withdrawn**: it was written
before either surface had been contrast-measured, and when the panel was
finally asked on 2026-10-26 it returned two runs under 4.5 (L28). One of
them is fixed and the other is a range the user controls, so the
conclusion below survives, but it survives on a measurement now instead
of on an absence of one. The drift is still drift and not a defect, so It is left open rather than fixed
because the panel's three hues carry satisfied, unsatisfied and tension,
which is meaning the two-light palette currently cannot say, and
choosing which identity wins is the owner's.

**Editing an inference has no door.** `ursa consent revoke-axiom` and
`ursa forget` exist; nothing anywhere lets the owner reword an axiom,
and `user-edited` is written by one function that releases a held
statement rather than by any edit. `CLAUDE.md` calls "see, edit, revoke
and delete" load-bearing. Named here by the seat that found it while
building the first surface that would offer one, and routed to the
engineer rather than designed around.

**One record, two percentages, two pages of one product.**
`/record/mini-fixture` prints 41.2 / 24.0 / 34.7 and the published set
view prints 40.4 / 23.6 / 34.1 for the same record. The record file
carries both figures, `pct` over the classified characters and
`pctOfFinal` over the whole finished work, and each surface picked one.
`published-index.ts` says in its own comment that `finalChars` is the
denominator "the resolver's own fallback page uses, so the two surfaces
cannot disagree about the same record". They disagree. Named by the
frontend seat on 2026-10-24 (ninth run) while fixing the bar that draws
both, and left alone: changing a published number is a product decision,
and the viewer's bar and its printed figures at least agree with each
other today.

## L33 — A cleanup the tool undoes on its next run is not a fix

**measured**, 2026-10-26e and the hook run that finished it,
`reviews/2026-10-26e/README.md` §4.

The 2026-10-26e run renamed four review frames by hand, because
`shoot.mjs` had slugged `/dashboard?port=7831` into their names and a `?`
in a file name has to be percent-escaped in every markdown link that
points at it. Then it shot four more frames an hour later and got
`dashboard?port=7831-narrow.png` straight back. Nothing had changed in
the thing that makes the names.

The repair reached the artifacts and not the generator, so it had a
half-life of one invocation. `slug()` drops everything from the first `?`
or `#` now, which is the fix at the only place that can hold.

**The general form, which is the part worth keeping.** A manual cleanup
of generated output is a measurement that the generator is wrong. Doing
the cleanup and not the generator leaves the finding undiscovered and
leaves a reader of the directory unable to tell which convention is the
real one, because both are present. The four frames and the nineteen
beside them disagreed about their own naming for an hour inside one
review folder.

This is the same shape as L31 one door over. There the tool was wrong in
the direction that trains you to ignore it. Here the tool was right about
nothing and the output was corrected instead, which trains the next run
to correct it again.

## L34 — On a shared host a port is an address, not an identity

**measured**, 2026-10-26 (hook), `reviews/2026-10-26e/README.md` §5.

The reproduction block every review in this folder inherits starts the
store server on `--port 7831`, and the three probes written on 2026-10-26e
had `7831` compiled into them. On this host the port was held by another
seat's store server. `ursa serve` refused the bind and named the fix,
which is correct behaviour and is also the only reason this was caught.

What answered on the port instead:

```
{"server":"ursa-store","project":"store-demo","store":".ursa","routes":[…]}
```

**That is byte-indistinguishable from this seat's own server**, because
every run of this seat clones into a directory called `store-demo` and
the project name is the directory name. The server refuses the bind, but
a probe pointed at a port never asks the server anything. It asks the
page, and the page fetches whatever is listening.

The review kit already carries the `/tmp` version of this hazard, written
after this seat published another seat's prose from `/tmp/prbody.md` on
2026-10-24g. Twenty or so seats share one unix user here, so every
unqualified name in a shared namespace is the same bug: a path, a port, a
lock file, a database name. The probes take `--store <port>` now.

**The cheap property that settled it, and is worth keeping on purpose.**
Whether the cut-off run's own frames had been shot against a stranger's
store was checkable rather than a matter of trust, because its frames
carry record identifiers and a commit hash, and
`crops/figures-320-before.png` reads `commit 3e35dbe`, that run's own
first commit, which exists on no branch but this seat's. A frame that
names the commit it was taken from names whose store it came from. It was
free here. It is worth not losing.

## L35 — The benchmark that comes back saying you are ahead

**measured**, 2026-10-26 (hook), `reviews/2026-10-26e/README.md` §7.

The charter's step three sends every run to the public web to study
interaction craft, and the implicit shape of the answer is a curve, a
timing or a spring to translate into this identity. This run asked a
question with a different answer.

The question was the one it had just shipped: how do other people's
products cue a command block that does not fit? L32 had already
established that the trip should be spent on something the repository
cannot answer, and the repository could not answer this. Its only prior
art was `.rec-cmd`, which is this house's own, so "we do it this way" was
the entire evidence base under a fix that had just landed.

Measured at 390, block-level code only, 24px or more hidden, every fact
read off the live element: **126 clipped command blocks across
vercel.com, docs.stripe.com, nextjs.org and tailwindcss.com, and not one
paints a cue of any kind.** Two of the 126 can be reached from a
keyboard. Stripe's CLI reference hides 1435px of one command and cuts it
mid-literal at a clean edge, which is the before this run fixed at four
times the magnitude.

**So the honest report is that the house is ahead on this question, and
the better prior art was already in the repository.** That is a
legitimate outcome of step three and it should not be written up as a
disappointment or padded into a refinement to justify the trip. L32
established that "no external sources were read" is a legitimate line in
a review. This establishes the next one along: "they were read and they
were worse" is also a result.

**Two guards on the number, both of which changed it.** The first run of
the probe counted every inline `<code>` in prose and reported 74
scrolling blocks on one site with a minimum of 3px hidden, which is a
subpixel inside a sentence rather than a command anyone is asked to run.
Tightening to block-level and to 24px held the finding, where a softer
threshold would have inflated it. And two of the six sites return a zero
denominator, having no block-level code at all on the pages fetched, so
they are reported as zero denominators and not as passes.

## L36 — A key nobody can see keys nothing

**proposed, not decided**, 2026-10-26 (hook),
`reviews/2026-10-26e/README.md` §6, `data/bar-contrast.txt`.
**Closed by L43 on 2026-10-27**, by a third repair that costs neither of
the two things the options below were weighing. The entry stands as
written, because the reasoning in it is why the third one was looked for.

The provenance bar is the one graphic on the overlay's dashboard that has
to be read rather than looked at. Its four classes are the data artifact
`CLAUDE.md` calls the technically distinctive part of the company, and
the legend beneath it is the only key to them. WCAG 1.4.11 asks 3:1 of a
graphical object required to understand the content, which this is.

Measured against the pixels actually behind each swatch, sampling every
row of it rather than its centre: 11.99, 11.99 and 3.93 for the first
three, and **1.20 for `covered by no span`**, where the floor is 3.

The fourth swatch is `var(--line)`, the track's own colour, and it is
that deliberately. The stylesheet states the reasoning in its own words,
"so the faintest mark on the page is at least named next to the three
that are easy to see." That is honest, and it is also precisely why the
key is invisible.

**Left to the owner rather than fixed, and the reason is not the
charter's two-change cap.** Both available repairs are palette decisions.
Drawing the swatch as an outline in its own label's colour introduces no
new value and would read, but the swatch then stops showing what the
track actually looks like. Lifting `--line` itself fixes the legend and
every bar on the page at once. Which of the two honesties wins is a
product decision, which is where L28 left the panel's second sub-4.5 run
for the same reason.

**The probe's own near miss, because it bears on how to read the number.**
Its first draft sampled each swatch at its centre and reported 1.00:1
between `kept as written` and `kept and edited`, a second finding that
does not exist: `.dash-seg-mutated` is the same fill with a 2px inset at
the bottom of a 6px swatch, so a centre sample cannot see the one thing
that distinguishes them. It samples every row now and reports how many
distinct rows each swatch has, which turns the inset into a fact instead
of an absence. A swatch is a column, so sample the column.

## L37 — A port answering 200 is not evidence that your build is behind it

**measured**, 2026-10-27 (2026-10-26 scheduled slot).
`reviews/2026-10-26g/README.md` §7.

This run rebuilt the overlay, ran `pkill -f "next start -p 4961"`,
started a new server, got `200` from the port, and measured both of its
fixes as having changed nothing.

The `pkill` matched the npm parent and killed it. The `next-server`
child it had spawned kept the port, so the new `next start` failed with
`EADDRINUSE` into a log nobody was reading, and every probe for the next
several minutes read the old build. Three things made it silent at once:
the port answered, the pages rendered, and the failure was in a
background log rather than in an exit status the run saw.

**The check that works is not a status code.** It is whether the thing
you just changed is in the response. A run that has just edited a width
can ask for that width. `ss -ltnp` names the process holding the port,
which is the other half, because the fix is to kill the server and not
its parent.

This is L34's shape through a second door. There the port was a
stranger's store and the page could not tell; here it was this run's own
previous build and the probe could not tell. **An address is not an
identity**, and that holds for a process you started yourself four
minutes ago.

## L38 — A floor is not a column, because flex shrinks down to it

**measured and judged**, 2026-10-27.
`reviews/2026-10-26g/data/tuning-gap-before.txt`, `README.md` §3.

The overlay panel's label column was `minWidth: 34` with `whiteSpace:
nowrap`, shipped 2026-10-26d under the note *"a floor and not a ceiling,
so the column still grows to fit and nothing else moves."*

`min-width` floors the **used** width. It does not stop a flex item
shrinking to that floor, and when the content is `nowrap` the glyphs then
overflow the box they were given. Measured at 320 across four rows: boxes
of 34, 34, 41 and 34, with the text overrunning each by up to 8px and
eating the whole flex gap to the sign beside it. **Two rows carried the
identical word `tension` in two different boxes**, because flex shares
shrinkage in proportion to base size and the statement beside each row
has a different natural width. So the column's right edge was ragged in a
way no two renderings would repeat.

`flex-shrink: 0` is the repair. The floor restated as `7ch` is L9, and it
is what makes the floor survive a change of type size; it is not what
fixed anything.

**The reason this stood for a week is the part worth keeping.** The note
beside the value was wrong, and nothing could catch it, because this list
is drawn only when a payload has landed and no instrument had ever put
one there. A claim in a comment is not a measurement. The surface that
would have falsified it did not exist until the run that built
`state/panel-payload.mjs`.

## L39 — At phone width the web does not align the label column, it stops having one

**measured**, 2026-10-27, 390x844, five sites, one load each.
`reviews/2026-10-26g/data/bench-label-columns.txt`, `README.md` §6.

Asked of `linear.app/changelog`, `vercel.com/changelog`,
`docs.stripe.com/api`, `elicit.com` and `anthropic.com/news`: in a
stacked list of rows that put a short label beside body text, do the rows
share one left edge for that text?

**Nineteen candidate lists. Fifteen put the label above the text rather
than beside it. Of the four that kept it beside, one was
indistinguishable because every label was the same width, two were
ragged, and none held a column.** Zero columns in the sample.

So the craft answer at 390 is not a better gutter. It is that the
beside-the-text label is itself the wide layout's idea, and the narrow
layout drops it.

**The strength of this entry is capped by its denominator and the entry
says so.** Four measured lists on one site is thin. What it supports is
"the pattern is rare at 390", which fifteen rejections establish
directly. What it does not support is any claim about which treatment
reads better, and no such claim is made here.

**The first version of this probe would have answered confidently and
wrongly.** Without a constraint that rows be stacked in one column and
the label sit on the body's own first line, it matched a horizontal
carousel as "8 rows, 8 left edges, 2156px of spread" and a card grid as
ragged, and would have reported a web full of broken label columns that
are not label columns. Those numbers were never written to a file. This
is the kit README's warning about exemptions arriving in person: a sweep
is mostly exemptions, and getting one wrong looks exactly like a result.

## L40 — Stack the dashboard's polarity tag below 640 (proposal, not a decision)

**proposed**, 2026-10-27. `reviews/2026-10-26g/README.md` §6.

This run gave `.dash-tag` a `4.5em` column below 640, where it previously
had none, taking the statement's left edge from three distinct values to
one at 320. That is strictly better than what was there and it is not
necessarily what the surface wants.

L39 measured the alternative the web actually uses: put the tag above the
statement at phone width and spend no horizontal gutter at all. On a
320px line the column costs 46.8px of 280, which is seventeen per cent of
every statement's measure, and the statements here are long because they
are sentences about the reader.

**What it buys.** Seventeen per cent more measure on the narrowest
viewport, on the one surface in this company whose whole job is to be
read.

**What it costs.** The tag stops being a column at all below 640, so
scanning down a list for `AVOID` becomes reading each row's first line
rather than reading one column. It also puts a second line into every
row, which on a list of six units is six more lines of height. And it
splits the layout into two shapes rather than one shape at two widths,
which is more stylesheet than this page currently has.

Not done here, because the charter's repair step is for defects and this
is a design decision about a surface the owner has not yet seen with
units in it. `reviews/2026-10-26g/crops/units-320-after.png` is that
surface as it stands.

## L41 — Compressing a review's frames moves the numbers they are evidence for

**measured**, 2026-10-27. `reviews/2026-10-26g/README.md` §7.

The charter asks for compressed screenshots so the repository stays
light, and an adaptive 256-colour palette takes a review folder of dark
UI frames from 5.1MB to 2.2MB, which is where the last two reviews sit.
It is also not lossless, and the way it fails is the dangerous way.

Re-running `diff-frames.py` over the quantised hover pairs reproduced
three counts exactly: 1355, 317 and 246 pixels, the three this run had
just reported. **Two others had moved.** `rec-row-index` from 218 to
312, and `sp-verbatim` from 10451 to 11416, which is nine per cent.
Whether a frame survives quantisation depends on how many distinct
colours it holds, so the frames with the subtlest washes — exactly the
ones whose pixel count is the whole finding — are the ones that move.

**Three exact reproductions are not evidence that a transform is
lossless.** That is the transferable half. A spot check drawn from the
frames you care most about is drawn from a biased sample, because you
looked at the ones you had just written numbers for.

The rule this seat follows now: **any frame set a tool reads a number
off is committed uncompressed**, and everything else is compressed. In
practice that is `data/hover-*`, and it is re-shot after the compression
pass rather than restored from it, because a restored frame is only as
trustworthy as the copy it came from.

This is L6 and L8's family — a review frame that differs from itself —
with the difference introduced on the way into the repository rather
than on the way out of the browser.

## L42 — A regex lifted out of a document is not what the document does with it

**measured**, 2026-10-27. `ship-first-sweep-blindness.md` §3.4, which is
this entry's retraction of this seat's own published measurement.

That file scored eleven seat charters for a split between two branch
patterns. Its instrument took the first two `test("…")` strings in each
charter and called them the two sweep patterns. **It never read what
each pattern was being applied to.**

Ten charters of eleven hold exactly two `test()` calls and both sit to
the right of `.headRefName`, so on ten rows the shortcut was right by
luck. The exo charter holds nine, and the second of them is
`select(.workflowName|test("agent"))` — a filter over the Actions run
list, not over branches. That seat is the only one of eleven that reads
other seats through their workflow runs, so it is the only charter that
has such a filter, which makes the false positive **single-seat by
construction rather than by chance**. The seat it landed on told me so
on the board, with the control an absence needs: `agent` matches zero of
its 67 branches, `exo` matches 67 of 67.

The published row said 19 of 19 drafts invisible. The true row is 0. The
roster total goes from twenty-one to two, and both survivors are this
seat's PR 141 and the security seat's PR 165.

**When an extractor is right on ten of eleven cases, the eleventh is not
noise.** It is the case that tells you what the extractor is actually
measuring. Bind the field to the left of the pipe.

This is L9's family — the unit a number is in — one level up: not the
unit of the value, but the identity of the thing the value describes.

## L43 — When both repairs trade the same thing, the trade is in the assumption and not in the surface

**measured**, 2026-10-27 (hook), `reviews/2026-10-27d/README.md` §3,
`data/swatches-before.txt`, `data/swatches-after.txt`. **This entry
closes L36.**

L36 measured the dashboard legend's fourth key at 1.20:1 and left it to
the owner, because both repairs it could see were palette decisions.
Painting the swatch in its label's colour makes it visible and stops it
showing what the track looks like. Lifting `--line` itself fixes the
legend and changes every bar on the page with it. One trades honesty for
visibility, the other trades blast radius for both, and neither is this
seat's to choose.

**Both options assumed the mark has to be the whole swatch.** Drop that
and a third appears: a 1px hairline drawn inside the box, in `--dim`,
which is the colour the key's own label is already set in. The interior
stays exactly `--line`, so the swatch is still a specimen of the mark it
keys. The edge that locates it is a value already on that line of the
stylesheet. The measurement, same instrument, same frozen frame:

```
                                    before   after
  covered by no span, vs the night    1.20    5.13
  the same, vs the pixel beside it    1.20    5.13
  share of the swatch at >=3:1           0%     29%
  the interior                   20,27,43   20,27,43
```

**What it did cost, because something always does.** The legend's third
and fourth swatches fall from 3.28:1 to 1.31:1 against each other, so
they are now told apart by shape rather than by lightness: a solid fill
beside an outline. That is the device this same file already uses for its
first two keys, `--polar` solid against `--polar` with a 2px foot, which
is why it is a cost this surface has already decided it can pay. The bar
itself did not move: the before and after frames differ by 42 pixels at
desktop and 44 at phone, which is the swatch's perimeter and nothing else.

**The transferable half.** Two repairs that trade different things tell
you the decision is the owner's. Two repairs that trade *the same* thing
tell you they share a premise, and the premise is usually the thing to
drop. Both of L36's options changed the whole swatch because a swatch
"is" a fill, and a swatch is a region with an edge.

## L44 — The brightest pixel is not the mark; the mark is whatever the page is least like

**measured**, 2026-10-27 (hook),
`reviews/2026-10-27d/data/bench-github-legend.txt`,
`review-kit/measure-swatches.mjs`.

`probe-bar-contrast.mjs` ranked each swatch's pixels by brightness and
scored the brightest as the mark. On a page whose ground is `--night`
that is correct and invisible as an assumption. It is not a property of
contrast, it is a property of dark mode, and the first foreign page the
promoted tool was pointed at said so immediately.

L17 names GitHub's repository language bar as the one real comparable
this seat has. Its legend is the comparable for the key under ours, and
on it the brightest pixel inside every 8px dot is the **white page**
showing through the circle's antialiased corners. All seven dots came
back at 1.00:1 against a page they are plainly visible on. Ranking by
ratio against the ground instead reads both directions and needs no flag
for which kind of page it is on.

**With the instrument corrected, the benchmark itself.** 4 of GitHub's 7
dots clear 3:1. The three that do not are Rust at 2.14, JavaScript at
1.35, and **Other at 1.17** — the class that means the same thing as the
one this run repaired, failing by the same margin, in the most-used
developer product in the world. This house's four keys now read 11.99,
11.99, 3.93 and 5.13. That is the shape L17 already found in the bar, one
level down in the legend, and it is the second time a benchmark of this
surface has come back saying the comparable ships the defect too.

**The transferable half, which is not about colour.** An extremum is a
stand-in for a distance, and it is only the right stand-in while the
reference point holds still. Measure the distance.

## L45 — The freeze pins the animation clock and the randomness, and this page prints the wall clock

**measured**, 2026-10-27 (hook), `reviews/2026-10-27d/README.md` §5.

`lib/freeze.mjs` closes L8 with a verified claim: with the rAF timestamp
pinned and `Math.random` seeded, all fifteen frames are bit-identical
across two shoots. That was true of the fifteen frames that existed when
it was written. The overlay's dashboard was not one of them, and it
prints `read at HH:MM:SS` in its header.

So a before-and-after on this page carries a diff nobody introduced. This
run's two frame sets differ by 134 pixels at desktop and 180 at phone.
**42 and 44 of those are the repair.** The remaining 92 and 136 are the
clock, which is 69% and 76% of the diff, and the repair is the smaller
half of its own measurement.

That is survivable here only because the repair's own footprint was known
in advance, exactly 42 pixels being the perimeter of a 17x6 box, so the
two clusters could be told apart by where they are. A fix with no
predicted footprint would be indistinguishable from the clock.

**Proposed, not built:** `--pin-now <iso>` on `shoot.mjs`, passed through
to `freezeInit`, so a run comparing two shoots pins `Date` to one instant
across both and a run that is only photographing gets the real page.
Pinning it to `PINNED_MS` is not the fix, because this page computes days
from record timestamps against now, and a 1970 clock would draw a page
the product never draws.

This is L6, L8 and L41's family, and the fourth distinct way into it: the
frame differs from itself because the page is telling the truth about
when it was read.

## L46 — A default output path is relative to wherever the run happened to be standing

**measured**, 2026-10-27 (hook).

`diff-frames.py` writes `data/frame-diff.txt` when it is given no third
argument. Every recipe in every review folder passes one, so the default
had never fired until this run called the tool from the repository root
to diff two folders by absolute path. It overwrote
**`data/frame-diff.txt` at the root of this repository**, a tracked file,
which turns out to be a stray this seat committed from the same mistake
on 2026-10-26d: nothing references it, no review folder claims it, and
its three lines say the home page frames were identical.

It was restored and left in place rather than deleted, because removing
another run's committed artifact is not this run's change to make.

The tool now prints the path it wrote. That is the whole fix and it is
deliberately not a refusal: the path is right for every caller that
passes one, and the failure here was that a wrong path was written in
silence. A run that sees `wrote data/frame-diff.txt` when it expected a
review folder knows inside one second.

This is L33's family — a tool that quietly undoes work on its next run —
with the quiet part being the whole defect rather than a side effect.

## L47 — The clock that moves the frame was never in the browser

**measured**, 2026-11-02. `reviews/2026-11-02/README.md` §3 and §4.

L45 proposed `--pin-now <iso>` on `shoot.mjs`, passed through to
`freezeInit`, to stop the overlay dashboard's `read at HH:MM:SS` from
putting a diff into every before-and-after on that page. It is built and
it works, verified on a fixture in `selftest/check-pin-now.mjs`. It does
not close the defect L45 named.

| condition | page clock | server clock | desktop | tablet | phone |
|---|---|---|---|---|---|
| as reviewed today | running | running | 146 px | 145 px | 157 px |
| **exactly what L45 proposed** | **pinned** | running | 100 px | 95 px | 96 px |
| the preload | running | **pinned** | 0 px | 0 px | 0 px |

`ursa-major/src/serve.ts:298` builds the payload with `readAt: new
Date().toISOString()` in the process holding the store. The browser
renders a string it was handed. By the time any init script runs, the
timestamp has been written in another process and sent over loopback, so
no init script can reach it.

**The scope, counted and not assumed: neither product reads the wall
clock client-side at all.** One `new Date(…)` in `overlay/app/page.tsx`
parses a payload field; `ursa-minor` has none. So the page-side pin moves
no pixel on any of the fifteen frames this seat photographs, and the
repair is `lib/pin-clock.mjs`, a `node --import` preload that pins `Date`
in whatever process is serving. The product ships unchanged, because a
review instrument should not need a product change to take a
measurement.

**The transferable half.** L45 reasoned correctly from a correct symptom
to the wrong process. The page was the only process it was holding an
instrument on, so the clock was assumed to be in the page. The question
that would have caught it costs one `grep` and is worth asking of any
value a frame is being diffed over: **which process computes this
string.** This is L42's family, a thing read out of one place and assumed
to behave the way that place would, with the gap here being a process
boundary rather than a document.

A second rule falls out of it. `shoot.mjs` runs the browser and cannot
see whether the server behind it was preloaded, so its `measurements.txt`
now states that limit on both branches, pinned and unpinned. A frame set
whose header reports a pin is the set most likely to be trusted past what
the pin covers.

## L48 — A one-pixel floor on the phone dashboard, which is not the clock

**measured**, 2026-11-02. `reviews/2026-11-02/README.md` §6.

With both clocks pinned, the two shoots compared above came back at 0 px
on all three viewports. **That is a fact about the pair and not about the
condition.** Eight shoots of the phone frame off the pinned server differ
in exactly one pixel, at (19, 110), which takes one of two values: five
give `(2, 6, 31)` and three give `(2, 3, 8)`, the page's own background.
It is bistable rather than drifting. Five shoots at desktop are
bit-identical, so the floor is phone-only.

`.dash-head`'s `border-bottom: 1px solid var(--line)` draws at row 107
from x=20 rightwards. The stray sits three rows below that rule and one
pixel to the left of where it starts, detached, on an element that
`elementsFromPoint` and a sweep of every box within 6px both fail to
place. Not chased further: it is one pixel and it is invisible at 1x.

**Why it is written down anyway.** "0 px" was about to be a sentence in a
review, and the next run comparing a repair on this page at phone width
would have found an unexplained pixel in its diff with no record saying
it was already there. That is this ledger's recurring failure, L6, L8,
L41 and L45, arriving a fifth time: a frame that differs from itself. The
difference between a known floor and an unknown one is the difference
between a 43-pixel repair being legible and not.

The rule, stated once for the family: **a determinism claim needs
repeats, not a pair.** Two frames agreeing is the weakest evidence that a
page is reproducible, because the pair is the sample you stopped at.

## L49 — An unrelated `npm install` uninstalls the review kit

**measured**, 2026-11-02. `reviews/2026-11-02/README.md` §5.

The kit installs playwright with `npm i -D --no-save`, deliberately,
because it is a review tool and not a shipped one and neither site should
carry it as a dependency. The consequence was not written down anywhere:
**it is in no `package.json`, so the next plain `npm install` in that
package removes it.**

This run started a build of `ursa-minor` for an unrelated check, and some
minutes later every kit tool began failing with `ERR_MODULE_NOT_FOUND` at
`lib/browser.mjs`. The two events do not look connected. The install
prints nothing about a package it is removing that nobody declared, and
the failure surfaces in a different directory against a different tool.

`lib/browser.mjs` already searches `ursa-minor/node_modules`,
`ursa-major/node_modules` and the repository root in that order, so the
cheap repair is to install it into the package you are **not** about to
build. This run put it back into `ursa-major` and carried on.

The transferable half is the one `--no-save` always carries and this
repository had only ever stated the upside of: **a dependency nothing
declares is a dependency nothing protects.** It is the right call here,
and the cost belongs next to the reason.

It also made the better instrument obvious. The check that needed the
site was "does the freeze still pin the clock", and the site was only
ever a page to observe it on. Asking the browser what a `requestAnimationFrame`
callback receives answers it in two seconds with no build at all, and
that is now the last two lines of `selftest/check-pin-now.mjs`, where
the claim in `freeze.mjs`'s header has an executable assertion behind it
for the first time.

## L51 — Two installs in one tree, and the build blames the workspace root

**measured**, 2026-11-02. `reviews/2026-11-02-message/NOTES.md` §2.

L49 wrote down one half of the review kit's install hazard: playwright is
installed with `npm i -D --no-save`, so it is in no `package.json` and the
next plain `npm install` in that package removes it. This run found the
other half, and paid four failed builds for it.

The run started `npm install` in `ursa-minor` in the background and then,
before it had finished, ran the kit's own install line in the same
package. Both commands are in the README. Neither says anything about the
other. What they produce together is a tree where a package directory
exists and its `package.json` does not, and the build's error for that
state is:

> Could not find the Next.js package (next/package.json)

followed by five possible causes, of which the nearest is "node_modules is
being reorganized by a concurrent install" and the loudest is a
suggestion that the workspace root is misconfigured. Nothing in it names
the two commands the run actually issued. The second attempt failed the
same way, because the first install was still alive and had rewritten the
tree underneath an `npm ci`. Killing it corrupted the npm cache as well,
which `npm cache verify` then garbage-collected as one 31 MB content
entry, and the build after that failed on a different half-unpacked
package, `@swc/helpers`, with a different message.

**The repair, which was already in the code.** `PW_ROOT` is the first
entry in `lib/browser.mjs`'s resolution order and has been since that
file was written. It appeared in no document and in one error string. So
the kit can be installed into a prefix that neither site's `npm install`
can ever reach, which makes both halves of the hazard unreachable:

```bash
mkdir -p /tmp/pw && cd /tmp/pw && npm i --no-save playwright && npx playwright install chromium
export PW_ROOT=/tmp/pw/node_modules
```

Verified this run: chromium launches through `lib/browser.mjs` with
nothing playwright-shaped inside either site. `review-kit/README.md`
carries this as its install block now instead of the line that named
`ursa-minor`.

**The transferable half.** L49's rule was that a dependency nothing
declares is a dependency nothing protects. This one is narrower and
sharper: **when a tool's install and the product's install target the
same tree, the two commands a run naturally issues in parallel are
mutually destructive, and the failure surfaces as a configuration error
in a third thing.** The fix is never to remember the ordering. It is to
put the tool somewhere the product's installer does not own.

## L52 — The hero's first sentence is below the fold in portrait, and the code says 92svh

**measured**, 2026-11-02. `reviews/2026-11-02-message/NOTES.md` §5.
**Proposal, not a decision.**

The home page's hero copy carries `portrait:mt-[92svh]`, and the comment
above it says portrait is untouched because the copy already sits 92svh
below the mark. Measured on the rendered page, with the top of the `h1`
against the viewport:

| viewport | fold | top of the sentence | |
|---|---|---|---|
| phone 390x844 | 844 | 887 | 43px below |
| tablet 820x1180 | 1180 | 1196 | 16px below |
| desktop 1440x900 | 900 | 452 | in view |

92svh is 776 at phone and 1086 at tablet. The sentence is at 887 and
1196, which is 105svh and 101svh. The gap is the same 110px at both,
because the margin is a top margin on a block that already sits below
the header, so the header's height is added to the number rather than
contained by it.

**Why it is worth writing down rather than fixing.** 92 is a choice with
a shape to it: a sliver of the sentence above the fold is what turns a
full-screen starfield into an invitation to scroll. What the page does
instead is give both portrait sizes a first screen with no sentence on
it at all, and it misses by 43px and by 16px. Sixteen pixels is the
worst distance to miss by, because nobody reads it as a decision.

The portrait cue is there and it is doing its job, which is why this has
survived eight reviews. The eye only catches it when the frames are read
against the viewport height rather than as pictures.

**What this seat is not doing.** Moving the first sentence on every
portrait device is a change to the hero, and the hero is identity. The
charter says the identity is mine to protect and not to reinvent, so the
decision is the owner's. The two shapes, if she wants one:

1. Subtract the header from the margin, so 92svh means 92svh. The
   sentence then peeks by about 68px at phone and 94px at tablet.
2. Keep the behaviour and change the number to say what it does, which
   costs nothing and stops the next run from reading the comment as a
   description of the page.

The measurement is reproducible with
`reviews/2026-11-02-message/data/probe-fold.mjs`.

## L53 — An instrument with no progress output cannot be told from a wedged one, and the cost is a number nobody takes

**measured**, 2026-11-02 (run e). `reviews/2026-11-02e/NOTES.md` §2.1.

`measure-contrast.mjs` wrote nothing at all until after `browser.close()`:
every line of its report, and the only file it produced, came after all
fifteen page/viewport pairs were done. The one thing it did at startup was
`mkdirSync(OUT)`.

So a run of it had exactly two observable states, and they were the same
state: an empty directory, and nothing on either stream. On 2026-11-02 the
previous run of this seat watched that for eight minutes, killed it,
shipped the review with **no contrast number in it**, and wrote down that
it could not say whether it had killed a wedged tool or a slow one. It
ranked contention first and a defect in the tool second, and it was right,
but it could not show that it was right.

**What the progress output costs and what it bought.** Nineteen lines,
stderr only, so stdout is still the report a caller pipes. First run with
it:

| | |
|---|---|
| whole sweep, 15 pairs | 129.8s |
| slowest pair | 20.7s |
| slowest single stage | 7.7s |
| the only timeout this tool can hang on | 30s, `networkidle` |

Nothing came within a factor of three of the one bound that can hang, at
any stage, on any page. The hypothesis the last run could not test was
answerable in one run once the instrument said which stage the seconds
were in.

**The rule.** A measurement tool that runs for minutes must emit per-unit
progress with per-stage timings, on stderr, from its first unit. Not for
comfort: "slow" and "stuck" are the same observation until the stages are
separated, and a run that cannot separate them pays by dropping the
measurement entirely. That is a worse outcome than a slow one, and it is
the outcome this org's ship-first rule exists to prevent in the large and
had no answer for in the small.

This is L15's posture ("a timeout is not a wait") one step earlier. L15
is about an instrument refusing to return a number it cannot stand
behind. L53 is about an instrument letting you watch it try.

## L54 — The fitting story about your own last merge is the one to test first

**measured**, 2026-11-02 (run e). `reviews/2026-11-02e/NOTES.md` §3.

Across 533 text runs re-measured against the 2026-10-25c baseline, 532
were identical line for line. One moved: the disabled home CTA at
desktop, whose worst pixel rose from 3.93 to 4.06 to meet its own median.

A `min` below its own median means one glyph pixel sat on a brighter
backdrop, which on this site means a star. PR #670, this seat's own
immediately preceding merge, had just guarded `PixelSky` against
re-dealing its starfield when the canvas collapses to 1x1 during a
full-page capture. This tool photographs the text and the backdrop in two
separate loads, so before that guard the backdrop measured under a glyph
need not have been the backdrop that glyph sat on. The story fits in
every particular, and `drift` is structurally incapable of catching it,
because drift is measured **outside** every text box and this artifact is
inside one.

It is also false. Reverting the guard, rebuilding, restarting and
re-measuring the same row:

| build | repeats | min |
|---|---|---|
| guard present, as merged | 4 | 4.06 every time |
| guard reverted | 6 | 4.06 every time |

Ten measurements across two builds. #670 did not move that number.

**Why this is a ledger entry and not a footnote.** The number was one
row, exempt under 1.4.3 at both values, with an unmoved median, so
nothing a reader sees depended on it. The temptation was therefore at its
maximum: a cheap, flattering, mechanistically detailed explanation
crediting the run's own last merge, on a quantity too small for anyone to
check. L48's rule said what to do and this is it restated for causes
rather than for frames: **a pair of observations across a change is not
evidence the change caused it.** The cost of testing it was one revert,
two builds and ten runs of a 20-second measurement.

What actually moved it is unknown. The chromium in `/tmp/pw` was
installed fresh between the two dates, and a glyph's worst antialiased
pixel is precisely the quantity a renderer version may move. That is
labelled a hypothesis and left unmeasured on purpose, which is the
honest shape when the answer changes nothing.

## L55 — The isolation this kit documents is the tree, and the contended resource is the cache

**measured**, 2026-11-02 (run f). `reviews/2026-11-02-message-f/NOTES.md` §2.

`npm ci` in `ursa-minor` failed with `EEXIST` on a rename into
`/srv/asc/home/.npm/_cacache/content-v2/…`, having already emptied
`node_modules`, so the tree was left at zero packages and the build had
nothing to run against.

This is the third install hazard in this kit's short history and it is
not the other two. L49 is a dependency nothing declares being removed by
an unrelated install. L51 is two installs in one tree leaving a package
half-unpacked while `npm` exits 0. Both are about **`node_modules`**, and
both have the same remedy, which the README now gives: install into a
prefix nothing else owns, and point `PW_ROOT` at it.

That remedy does not reach this one. npm's content-addressed cache is not
a path the kit chooses. It is a path npm chooses, inside a home directory
that about twenty seats of several companies share on this host, and it
is written by every one of their installs. Measured the same morning: a
`npm ci` from `/tmp/epito-epitome-engineer-Tisktd/cli`, another company's
seat, was writing that cache four minutes before this run's install
started.

**The fitting story this entry exists to reject.** This run had started
the kit's playwright install and the site's install within one minute of
each other, which is L51's shape exactly. The clock refuses it: the two
overlapped for fourteen seconds and the failure landed six minutes after
that window closed. L54's rule, restated for a cause that flatters your
own most recent action rather than your own most recent merge.

**What the evidence supports, and where it stops.** The failing blob is
`zod`, whose integrity appears exactly once in the lockfile, so no single
`npm ci` had two writers for it; the three `zod` paths in the tree are two
different versions, which was the next fitting story and is also dead. A
destination that already exists means another process wrote it, and an
`ENOENT` on the source tmp file in the same error means another process
removed this one's. npm logs only its own process and no npm started
against that cache in the six minutes before the failure, so **the writer
cannot be named**. Established: the resource is shared across companies,
this run added a writer to it, the install died on it.

**The rule.** Any `npm` this seat runs passes `--cache` a directory under
its own `/tmp/<seat>-<date>-<trigger>/`. That is the same rule the README
already states for scratch files, server logs and `--body-file`, written
after a path collision in shared `/tmp` published another seat's prose in
this seat's pull request on 2026-10-24g. The npm cache is that hazard one
level down, in a directory nobody chose, and the cost when it fires is
higher: a scratch collision corrupts one file, and this one empties
`node_modules` first and fails after, so the tree is worse than it was
before the command ran.

The cost: a cold cache, which on this host means a tarball fetch at 30 to
46 seconds and an install of some minutes where a warm shared cache is
near-instant. That is the trade and it is worth stating rather than
discovering: this rule makes every install slower, and it makes none of
them fail in a way that leaves nothing behind to build.

## L56 — A private npm cache is scratch, so it has a home and a deletion, and the second one is the half L55 left out

**measured**, 2026-11-02 (run g). `reviews/2026-11-02-message-f/NOTES.md`
§2.1, with the logs in that directory's `data/`.

L55 established the failure and proposed the remedy. This entry is the
remedy's verdict, taken one run later because the install L55 was waiting
on outlived the run that issued it.

**It works.** `npm ci --cache <a directory this run owns>` in
`ursa-minor` exited 0 at 611 packages in 4m48s against an empty cache,
and `npm run build` then exited 0 in 1m28s. The `EEXIST` did not recur
and the build the failure was blocking is unblocked.

**L55 priced it in time and the price is disk.** Its time estimate holds:
612 cache misses, per-request durations from 17.2s to 271.0s with a
median of 39.7s under npm's own concurrency, install under five minutes.
What it did not price is that `/tmp` and `/srv/asc` are one 45G volume on
this host, that the volume was at 100% with 199M free at 07:27Z, and that
a private cache for `ursa-minor` alone measures **176M** where a shared
one adds nothing. The second `npm ci`, issued to price the warm case,
failed with `ENOSPC` rather than returning a number. The cost was not
predicted and then confirmed. It fired on the run measuring it.

**So the rule gains two clauses and loses a path.**

1. **The cache lives in the run's own checkout**, not at a bare `/tmp`
   name. L55's rule said `/tmp/<seat>-<date>-<trigger>/` and run f
   reached for `/tmp/npm-fe-f`, which is the shared-and-not-private shape
   the rule exists to forbid: `/tmp` is mode 1777 and every seat on this
   host runs as the same unix user. The checkout is the one directory the
   host hands a single run, and `.gitignore` ignores every root-level
   dot-entry, so `.{seat}-run-{id}/npm-cache` is private by construction
   and cannot be committed by accident.
2. **Delete it before the run ends.** Nothing on this host collects run
   scratch. Run f's 210M cache was still at `/tmp/npm-fe-f` thirty-two
   minutes after that run's `run.end`, on a volume with 199M free, and no
   later run would have recognised it as garbage. Run g deleted both.

**The trade, stated rather than discovered.** Six seat checkouts at
roughly 870M each were live on this volume while it was full, so private
caches are a minority of the pressure and not its cause. They are still a
steady 176M charge per project per run against a resource with no
headroom, in exchange for removing a rare failure whose blast radius is
large because `npm ci` empties `node_modules` before it dies. That trade
is worth taking with clause 2 attached and is not worth taking without
it.

**One hypothesis, labelled and unmeasured.** The shared cache every seat
contends over measured **65M** entire, against 176M for one project's
closure. A cache twenty seats have been filling should not be a third the
size of one install. If it is pruned, or simply holds much less of any
given install than "warm" suggests, then L55's "a warm shared cache is
near-instant" is unearned and the private cache buys its safety for
almost no extra time. That changes how the trade above reads, so it is
worth a measurement by whichever run next has a reason to install.

---

## L57 — An exit status describes the process that exited, and the install was not it

**measured**, 2026-11-02 (run h). `reviews/2026-11-02-message-h/NOTES.md` §1.1.

This seat reproduced L51, two installs in one tree, from a direction
L51's remedy does not cover. The remedy is "do not run two installs in
one tree". The gap is that a run cannot obey it without a reliable
answer to "is one running", and the answer it was handed was wrong.

The install was launched as `bash install.sh` backgrounded inside an
already-backgrounded shell. The wrapper exited at 08:11:30 and the run
was told the task had **completed, exit code 0**. The `npm ci` inside it
was orphaned to init and ran for another two minutes. Believing the tree
was free, the run started a second `npm ci` at 08:11:49; it died at
08:11:56 on `ENOTEMPTY: rmdir '…/node_modules/has-proto/test'`, and the
first install's log filled with `TAR_ENTRY_ERROR ENOENT` as it unpacked
into directories the second had just removed. Both trees were discarded.

**The check that works, and it is not an exit status.** A process's own
working directory says which tree it is in, and the kernel publishes it:

```bash
for pid in $(pgrep -f "npm (ci|install)"); do
  [ "$(readlink -f /proc/$pid/cwd 2>/dev/null)" = "$PWD" ] &&
    echo "REFUSING: npm $pid is live in this tree"
done
```

**The same mistake twice in one run, which is why this is an entry
rather than a line in a review.** Forty minutes later the same run wrote
a wait-loop, `while pgrep -f "[c]heck-focus"; do sleep 10; done`, to hold
a measurement until a selftest finished. It never finished. `pgrep -f`
matches against full command lines, the `[c]` bracket trick is a `grep`
idiom that `pgrep`'s regex reads as the literal class "c", and two
earlier shells that were themselves watching for the same string carried
it in their own command lines. The loop was waiting on the watchers. In
both cases the run asked "is that thing still alive" and got an answer
about something else.

**this seat's judgement.** Any wait in this seat's runs names the thing
it is waiting for by a property of that thing, a pid or a working
directory, and never by a string that the waiter's own command line
contains.

---

## L58 — The page was still scrolling when the shutter opened

**measured**, 2026-11-02 (run h). `reviews/2026-11-02-message-h/NOTES.md` §3.

`ursa-minor/app/globals.css` declares `html { scroll-behavior: smooth }`.
Nothing in the kit's freeze touches it. It is not driven by
`requestAnimationFrame` callbacks the page owns, so pinning rAF's
timestamp does not stop it, and Playwright's `animations: 'disabled'`
does not reach it either. It had never mattered, because every
instrument before `measure-focus.mjs` photographs a page it has not
asked to move.

`measure-focus.mjs` asks it to move. It takes a control's box, then
drives `Shift+Tab` and `Tab` to put a keyboard focus on it, which makes
the browser scroll two controls into view, and then photographs the
rectangle it computed before any of that. With a smooth scroll in
progress the two frames of one stop come from two different offsets.

**What that produced, on the real site, at 820x1180.** The `mini-fixture`
link on `/record` was reported `BELOW_FLOOR` at 49% of 655 indicator
pixels with a median of 2.87. The magnified frames show the focused
shutter on a passage reading `no_generation_pro…` and the blurred one on
a different row of the page entirely. Neither frame contains the link.
The 655 pixels were page text that had slid, and a contrast ratio was
printed from them. The same cause produced two `UNSTABLE` verdicts, a
`NO_INDICATOR` on a header link that measured 11.99 one viewport over,
and the crash in the next entry.

**The repair, in two halves.** `lib/freeze.mjs` takes a `scroll` option
that pins `scroll-behavior: auto` for the document, opt-in on the same
reasoning as `now`. And `measure-focus.mjs` re-reads the bounding box
**after** the keyboard focus has landed rather than before it, because
the pin makes the scroll instant and the re-read is what makes the
rectangle right.

**The general shape, which is the part worth keeping.** This tool already
refuses to measure a stop it could not give a keyboard focus to, with
the comment that "measuring whatever Chromium focused and labelling it
with this element's name is the failure mode that produces confident
nonsense". It had the identical hazard one line down in space rather
than in focus and did not see it. An instrument that moves the page it
is measuring has to re-establish **where** as carefully as it
establishes **what**.

---

## L59 — The one tab stop where focus moves and the screen does not

**measured**, 2026-11-02 (run h), `/record` at 1440x900 and 820x1180.

"Open a record" is a `<label class="cta">` wrapping an
`<input type="file" class="sr-only">`. That is the ordinary way to give
a file picker a styled trigger. Its consequence had never been looked at:
the focusable element is the input, the input is clipped to **1x1**, and
the site's global `:focus-visible` ring is therefore drawn correctly,
around a single pixel, behind the label.

Tab stop 4 of 6 on that page. **Zero pixels** differ between the focused
frame and the blurred one, at both viewports, on a page where every
other stop reports 11.99:1. A keyboard user tabs onto the control and
nothing on the screen changes.

**Why six reviews missed it and this one did not.** `measure-hit-areas.mjs`
sees the label's full box and a pointer finds the control fine, so the
instrument that would normally catch a control this size reports it as
healthy. Reading the stylesheet finds a global focus rule that is
correct and applies here. The defect exists only in the join between the
two, and the only way to see it is to put a keyboard on the control and
photograph what happens.

The fix forwards the ring to the label with `:has(> input:focus-visible)`,
same token, same weight, same offset, so it introduces no new value into
the design system. `:has()` rather than `:focus-within`, because the
label also contains text and `:focus-within` would fire for a focus the
user did not give the input.

**this seat's judgement.** Any control on this site whose visible box and
whose focusable element are different elements is a focus defect until
somebody has photographed it. There is one today. The rule is for the
next one.

---

## L60 — A share of the indicator assumes the indicator is only the ring

**measured**, 2026-11-02 (run h), the 404 page at 1440x900 and 820x1180.

`measure-focus.mjs` defines the focus indicator as every pixel that
differs between the focused frame and the blurred one, which is what
makes it robust to how an indicator is drawn, and then judges it by the
**share** of those pixels clearing 3:1. The share's floor of 60% was
calibrated on fixtures whose indicator is an outline and nothing else.

`.quiet-link` answers focus with three things at once: the site ring at
about 11:1, a brightened border, and a 6% background wash across the
control's whole interior. On the 404 page's only control that is 11,319
changed pixels, of which roughly 566 are the ring and the rest are the
wash at about 1.12:1. The share came out at **5%** and the tool printed
`BELOW_FLOOR`. The magnified frames, committed with this run, show a
bright unbroken ring. The verdict was wrong and the site was right.

**What makes this worth an entry rather than a tuned constant.** The
share is not a bad statistic, it is a statistic with an unstated
assumption, and the assumption is that the indicator is the ring. Every
focus treatment that layers a quiet wash under a loud ring inverts it,
and the louder the ring the worse the dilution, because the wash's area
is the control and the ring's area is its edge.

**The second question, which needs no new constant.** A stop that fails
the share is now asked whether the pixels that *do* clear 3:1 cover at
least a 1 CSS px perimeter of the control on their own, `(w+2)(h+2) - wh`.
That is the ring this site declares, taken off the control's own box, and
it is the same yardstick as the 2.4.11 column one weight down. The 404's
566 clearing pixels against a 558 pixel perimeter clear it, and the stop
is reported `COMPOSITE` rather than failed. A ring along one edge only
does not clear it, since one edge of that control is 230 pixels. A ring
drawn in its own backdrop's colour has no clearing pixels at all. Both of
those stay `BELOW_FLOOR`, and the second is the selftest's fixture 4,
which still fails as it should.

---

## L61 — The walk identified a tab stop by where it had been scrolled to

**measured**, 2026-11-09, the home page at 390x844, with the mechanism
reproduced on a fixture first and then photographed on the site.

Run h left this as the next item in the lane and named the right first
question, which was whether the tab walk was terminating early rather
than whether the control was genuinely stranded. It was terminating
early. The site was right.

`measure-focus.mjs` walks the page with Tab and stops when a stop's
identity repeats, because that is how a closed ring is detected. A stop
the DOM enumeration declared carries a probe attribute and is identified
by it. A stop the enumeration never declared has no probe, and it was
identified by its tag and its `getBoundingClientRect` coordinates.

Those coordinates are **viewport-relative**, and Tab scrolls each stop
into view before the walk reads them. So the coordinate of an undeclared
stop is not a fact about the stop. It is a fact about where the browser
parks whatever it has just focused, and on a long page it is very nearly
the same number every time.

The measurement, taken by walking past the point where the tool quits:

| stop | identity the tool used | document y | element |
|---|---|---|---|
| 0 | `pre@49,401` | 2510 | the `git clone` command |
| 2 | `pre@49,560` | 2669 | the `npx tsx` command |
| 6 | `pre@49,401` | 3204 | the `curl` command |

Stops 0 and 6 are two different elements 694 pixels apart in the
document, and they handed the walk the same identity. The walk called
the ring closed at stop 6, so stop 7 was never reached, and stop 7 is
the third copy button. It was reported as a control the keyboard cannot
reach. It is reachable, and it answers focus with 200 indicator pixels
at 100% share and a median of 11.25, which is exactly what its two
siblings answer.

**Why it was only the phone.** Chromium makes an overflowing `<pre>`
keyboard-focusable, so the undeclared stops are the install commands,
and whether a command overflows depends on the width. At 390 all three
overflow and there are three undeclared stops to collide. At 820 and
1440 only one does, so there was nothing to collide with and the page
reported clean.

**The shape of the defect, which is the part worth carrying.** Both of
this tool's headline numbers are set differences against the walk, so
anything that shortens the walk inflates the unreachable count and
deflates the stop count at the same time, and the two errors corroborate
each other. The run that found this had a reason to trust the report: it
reported a real defect on the same page in the same pass. An instrument
whose two numbers are derived from one traversal has one failure that
moves both, so agreement between them is not evidence.

**The fix.** The identity is stamped onto the element on first sight,
`data-focus-walk`, rather than computed from where it happens to be. Two
elements cannot share it and one element keeps it however far the page
scrolls under it. A repeat now means the keyboard genuinely returned to
a stop it had already been on.

**The check.** A new selftest fixture, `tall.html`: a 4000px page with
three scrollable `<pre>` blocks at absolute integer tops, so all three
land at exactly `20,289` at the selftest's 800x600 rather than within a
pixel, which is the difference between a fixture that fails on the old
code every time and one that fails on it sometimes. The first version of
that fixture used uniform margins and the landings came out 412 and 411,
one pixel apart, which is how close the near-miss is. Five of its six
assertions fail with the identity line put back, reporting two of six
stops and two false unreachables. Receipt committed.

**What it changes about the record.** The site has no keyboard-reach
defect and has never had one. Run h's second deferred finding, the
undeclared `<pre>` stops, was also undercounted by the same break: it
reported two and there are three at 390. Whether those blocks should
carry an accessible name is still the product question run h said it was.
The sweep after the fix reads 86 tab stops across five pages and three
viewports, 0 below a floor, 0 unreachable, 0 unstable.

## L62 — A board card can be rewritten, and the run that said it could not had asked the wrong three verbs

**measured**, 2026-11-09, against the live board at
`board.libraryofalexandria.dev` with this seat's own runtime token, and
against the source it runs, `/srv/asc/hq/runtime/board/api.py` and
`store.py` on the resident host.

The previous run of this seat closed its notes with a lesson for whoever
wrote the next card: keep every block under 420 characters, "and know
that a board write is final the moment it returns 201." It had found
that `/api/items/<id>` answers 501 to `PATCH`, `PUT` and `DELETE` alike,
and it concluded from those three refusals that a card's prose is
immutable. It then left two cards it called unfixable, one carrying the
body `test` and one titled `probe why the body was refused`, on a board
the owner reads.

**The conclusion does not follow from the measurement.** Three verbs
were asked of one path. The route that rewrites a card is a fourth verb
on a different path, and it is the first thing the API's own module
docstring lists after the two reads:

```
POST /api/items/<id>/edit     {company, seat, title?, body?, source_url?}
```

`ITEM_ROUTE` in `api.py` is
`^/api/items/([0-9a-fA-F-]{36})/(move|comments|edit)/?$`, so `edit`,
`move` and `comments` are siblings. The run had already used `move` and
`comments` that same hour. It reached for the REST verbs on the bare
path, got three refusals in a row, and generalised from them instead of
reading the list of actions it was already using two of.

**What it costs to check, measured.** Two `POST`s, both `201`:

| card | what it carried | what it carries now |
|---|---|---|
| the install-command card in Review | body `test` | the three paragraphs of prose the run meant to write |
| the probe card parked in Done | title `probe why the body was refused` | a sentence naming what the card holds |

So nothing was lost and nothing was permanent. `store.edit_item` applies
the same `prose_violation` the create path applies, which is where the
420-character block rule lives, so the half of the lesson about block
length is right and worth keeping. Only the finality clause was wrong.

**The shape of the defect, which is the part worth carrying.** A refusal
tells you about the thing you asked, and nothing about the things you did
not ask. Three refusals that share a path share whatever is wrong with
that path, so they are one observation and not three, and treating them
as three is what made the conclusion feel measured. The cheap control
was available and unused: the run had the route table open, because it
was already calling two routes out of it.

What this seat owes the board is therefore narrower than the last run
said. A card's **words** are editable by the seat that owns them. Its
**column** moves with `move`. What genuinely has no door is deletion: no
route removes a card, so a card that should never have existed can be
rewritten into something true but cannot be taken away, and the two the
last run created are now two true cards rather than two junk ones.

## L63 — Two renderings of one object, one with a key and one without

**measured**, 2026-11-09, off the shipped frames in
`docs/design/reviews/2026-11-09-message-c/`, by sampling the provenance
bar's own pixel rows rather than reading the stylesheet.

The set view draws a 6px provenance bar per record card and prints three
figures under it. The bar's three marks are `--polar` filling all 6px,
`--polar` filling 4px over a 2px foot of `--night`, and rgb(116,121,134)
filling all 6px. **Two of the three are the same colour** and differ only
by that foot. The legend carried no swatch, so nothing in the frame
joined a figure to a segment except the fact that both lists happened to
run in the same order.

At 390 even that is gone. The bar stays horizontal and the legend stacks
into a column, so the one correspondence the desktop frame had is
removed outright. That is the viewport where the omission is total, and
it is the charter's narrowest review viewport.

**The remedy was already in the repository.**
`components/record/record-summary.tsx` has put
`<span class="rec-swatch rec-seg-{c}">` before each label since it was
written, and `globals.css` already scales the edited mark's foot to a
third of its height at 0.5rem for exactly that size. The record view and
the set view draw the same bar from the same three classes. One had the
key and one did not. No new class, no new value and no new colour was
needed, and none was introduced.

**The shape worth carrying, because it is not about this bar.** A design
system makes a component's *parts* reusable and does nothing at all to
make its *obligations* travel with it. `rec-bar` was reused; the rule
that a bar needs a key was not, because that rule lived in the other
file's markup rather than anywhere a second author would meet it. So the
second rendering was not a mistake anybody made. It was a thing nobody
was asked.

The check this suggests is cheap and this seat should run it: when one
page reuses a component class another page already uses, diff the two
call sites and ask what the older one carries that the newer one does
not. Here the diff was one span.

**What this did not turn out to be.** The bar's track is 1.7% unfilled,
and 40.4 + 23.6 + 34.1 is 98.1. That is deliberate and the page says so
directly underneath: the shares divide the whole finished work rather
than the classified part of it. Which sharpens the entry rather than
softening it. The thing that needed no key got a sentence of prose; the
thing that needed one got nothing.
## L64 — Deleting a server's directory does not stop the server, and it removes the only record of whose server it was

**measured**, 2026-11-09 (run k), `reviews/2026-11-09-k/NOTES.md` §1.

HQ's engineer reported two `next-server` processes still listening on this
host from directories that no longer exist, one of them two and a half
hours old, on a volume at 94 per cent. It routed the finding to this seat
as the half that was ours, and it is ours, but not where the kit's own
documentation had been looking.

The review kit's teardown step was one line, `rm -rf "$FE_RUN"`, and the
review that wrote it had already observed the other half: "three server
processes still pointed at two of them six and seven hours after the runs
ended" (L56's folder, 2026-11-02). The deletion and the processes were
named in the same paragraph. **Only the deletion became a step.** So the
documented teardown ran, correctly, and the servers stayed. Both of the
leaked directories were gone when this run looked, which is the proof that
the prose step had done exactly what it said.

The ordering is the finding. A server outlives its directory, and once the
directory is gone the only surviving record of which run owned the process
is a `(deleted)` symlink in `/proc/<pid>/cwd`. So the documented order
disposes of the evidence and keeps the garbage. Stop first, delete second.

**Why it is now a script with an exit code and not a better sentence.**
Three runs of this seat have leaked a server with the prose in place, and
the fourth was told about it by another company's seat. `teardown.sh`
prints `servers_stopped=`, `servers_left=` and `dirs_removed=` on every
path, which is L53's rule applied to a cleanup: a teardown that looked and
found nothing has to be distinguishable from one that did not look.

### The defect inside the repair, which is the transferable half

The first version matched `pgrep -u "$(id -u)" -f 'next-server|next start|next dev'`.
`-f` matches the whole command line, so it matches every process that
merely **mentions** a server. Measured while writing it: a diagnostic
shell running `pgrep -f next-server` matched itself, and a shell's working
directory is the checkout root, so the script classified it as this
checkout's and printed `would stop` for it. The selftest matched its own
`bash -c` wrapper for the same reason, the wrapper holding the whole
script text including the pattern.

A teardown that can stop the shell it was invoked from is worse than no
teardown, and it would have presented as the run dying with no output,
which is the one failure this seat already cannot tell apart from a wall.

The test is now argv[0], read from the first NUL-delimited field of
`/proc/<pid>/cmdline`: the name the process was actually exec'd under.
Next renames itself to `next-server (v16.4.3)` there, which makes the
match precise rather than merely narrower, and self plus every ancestor of
self is excluded outright. Verified against the shape that actually
leaked: both of HQ's two processes were bare `next-server` with no
launcher above them, and the dry run on this run's own server went from
three matches, two of which were its `npm exec` and `sh -c` wrappers, to
the one process that matters.

**The class, stated for anything that kills by name.** A pattern wide
enough to find every instance of what you are looking for is usually also
wide enough to find the thing doing the looking. `/tmp` is shared between
every seat on this host, so the blast radius of a name match here is
another company's live server, and a server is exactly what another seat
is mid-screenshot against. Match on identity, scope by ownership, and
exclude yourself before you ask the question rather than after.

## L65 — `disabled` is a focus decision before it is a styling one

**measured**, 2026-11-09, at 1440x900 against the two real stylesheets, by
driving the set view's record rows from the keyboard. Instrument and
numbers in `docs/design/reviews/2026-11-09-message-e/`.

The set view's record row shipped as
`<button disabled={opening !== null}>`. One piece of state names the
record being fetched, and it is held across an awaited `fetch`, so
activating any row disables every row in the list for the length of a
network round trip. Including the one the person is standing on.

A disabled button is not focusable. So the state change takes focus off
the control that was just activated and the browser puts it on `<body>`:

| | `disabled` | `aria-disabled` |
|---|---|---|
| `document.activeElement` after Enter | **BODY** | the row |
| still BODY once the fetch settles | **yes** | — |
| Tab presses back to that row | **7** | **0** |
| the row's DOM node survives the change | yes | yes |

Row 2 of 3 was chosen so a focus loss could not be read as the top of the
list, and seven is what two rows of two stops each costs with the address
field in front of them. On a real index it is however long the list is.

**The last line of that table is the one that makes the rest mean
anything.** The row's DOM node is the same object before and after, in
both arms, so the focus did not go anywhere because the node was
replaced. It went because of the attribute. This matters here
specifically: run k reported a press state that arrived on three
invocations out of five and attributed it to the set view replacing its
row nodes when the fetched index lands. The rows are keyed `key={s.id}`
(`published-site.tsx:364`), so React's reconciler keeps the node, and the
fixture that establishes the table above holds node identity and
reproduces the loss anyway. **The cause run k named is not the cause.**
The attribute is, and the flake it saw is the same defect seen through a
pointer instead of a keyboard.

**this seat's judgement.** A control that is busy is not a control that
is unavailable, and the two want different attributes. `disabled`
removes the control from the focus order and from the accessibility tree,
which is right for something a person may not use at all and wrong for
something they have just used and are waiting on. `aria-disabled` plus a
guard in the handler keeps the control where the person left it, keeps it
announced, and still refuses the second activation. The refusal moves
from the browser into one line of the handler, which is the cost.

**The corollary that is easy to miss, and was load-bearing here.** Six
rules in `globals.css` guarded `.rec-row`'s hover and press wash with
`:not(:disabled)`. Once the attribute changes, `:disabled` matches
nothing on that control and all six guards become selectors that can
never fire. Nothing about that is visible: the resting page is unchanged
and only a pointer held over a busy row shows it. `check-wash-guard.py`
asserts the guard from both sides in both arms, twelve assertions, and
two of them fail when the old guard is restored. **A guard rewritten to
follow an attribute has to be tested in its negative case, because a
guard that never matches and a guard that always passes produce the same
frame.** L61 and L63 are the same shape: an instrument or a rule that has
stopped discriminating looks exactly like one that found nothing wrong.

**Confirmed in the shipped component, not only in a fixture.** The table
above was taken over the real stylesheet with a hand-built list, and the
same drive was then run against `published-site.tsx` itself under
`next dev`, with the `before` arm being `origin/main`'s two files checked
into the tree and recompiled. Same result, including the last row:
`disabled=true` and `activeElement` BODY before, `aria-disabled=true` with
focus held after, and the row's DOM node surviving in both arms.

**Where else this applies, not changed this run.** The same file's
`readSite` submit button is `disabled={busy}` while the index is
fetched. It is one control rather than a list, so the person lands on
`<body>` from a single stop rather than from seven, and the form's
`onSubmit` would need the same guard. It is the same defect at a smaller
size and it is written here rather than fixed, because the charter allows
two interaction refinements a run and this run spent its measurement on
the row.

## L66 — One attribute over two kinds of unavailable, and a guard that was never asked of the second rendering

**measured**, 2026-11-09, at 1440x900 against the real `/record` page under
`next dev`, both arms recompiled from the tree. Instrument and numbers in
`docs/design/reviews/2026-11-09-message-n/`.

L65 settled the record row and carried the submit button forward as "the
same defect at a smaller size, one stop rather than seven". Two of the
three claims in that sentence are wrong, and finding out which is what
this entry is for.

### The condition was a disjunction, and the halves want different attributes

The button shipped as `disabled={busy || !address}`. That is two kinds of
unavailable wearing one attribute:

- `!address` is genuinely unavailable. Nothing is typed, the control has
  never been used, there is nothing to submit. `disabled` is right, and
  it cannot cost a focus loss, because the only way to empty the field is
  to be standing in the field.
- `busy` is L65's case. The person has just pressed this and is waiting.

So the repair is not the swap L65 implied. It splits the disjunction:
`disabled={!address}`, `aria-disabled={busy}`, and the second-activation
refusal moves into `readSite`.

### What the row's number did not predict

| | before | after |
|---|---|---|
| busy attributes | **`disabled=true`** | `disabled=false`, `aria-disabled=true`, `aria-busy=true` |
| `activeElement` after Enter | **BODY** | the submit button |
| still there once the fetch settles | **BODY** | the submit button |
| Tab presses back to the button | **13** | **0** |
| the button's DOM node survives | yes | yes |
| index fetches after two Enters | 1 | **1** |

**Thirteen, not one.** L65 reasoned from the control: one button instead of
three rows, so one stop instead of seven. That is the wrong measurement.
Focus does not land near the control it left, it lands on `<body>`, so the
cost of a focus loss is the distance from the **top of the document**, and
the form sits below a paragraph of links. A smaller control in a deeper
page is a bigger defect, not a smaller one. The row's seven was never a
property of the row.

**The last line is the one that had to be measured rather than reasoned.**
A `disabled` submit button refuses a second activation for free, and
`aria-disabled` is advisory, so that refusal had to be rebuilt in the
handler. One fetch in both arms is the proof it was. The guard also covers
a path `disabled` never did: Enter from inside the field submits the form
without touching the button at all, and on `main` that reached `readSite`
and started a second fetch while the first was open.

### The second finding, which is L63's shape again

`.rec-row`'s hover and press wash has been guarded on
`:not([aria-disabled="true"])` since L65. `.rec-action` is the same device
on seven other controls and carried **no guard at all**, neither that one
nor `:not(:disabled)`. Measured under the pointer with the button busy:
`:hover` matched, `:disabled` matched, and the button computed
`rgb(168,199,250)` — full `--polar` — with its underline lit, while its
cursor computed `not-allowed`. The control refused the pointer and
answered it in the same frame.

Nobody made that mistake. The rule that a wash needs a busy guard lived in
the other selector, which is exactly L63: a design system makes a
component's parts reusable and does nothing to make its obligations travel.

Guarded now on both kinds, and **the after arm still matches `:hover`**
while refusing the wash, which is L65's corollary honoured: a guard that
never matches and a guard that always passes produce the same frame, so it
has to be tested in its negative case.

### One thing closed and one thing left open

**Closed.** L65 moved `disabled:cursor-wait` out of Tailwind into
`globals.css` because that run had no disk to build the stylesheet and so
could not see whether the `aria-disabled:` variant was emitted. This run
had the build. It is emitted: `aria-disabled:cursor-wait` and
`aria-disabled:text-[var(--dim)]` both compute. Nothing needs to move out
of Tailwind for that reason.

**Open, and named rather than papered over.** The same pointer probe reads
`:hover` as false over the button in the empty-field state and true in the
busy state, identically in both arms, at the same computed centre of the
same element. Both readings are stable across three runs and the probe
moves the pointer away and back before every reading, so it is not the
first-move artefact it first looked like. No claim in this entry rests on
the empty-state reading. **An earlier draft of the comment in `globals.css`
asserted a specificity-and-source-order cause for the busy reading. It was
not measured and it has been removed**, which is the same discipline as the
paragraph above it: the frame showed a defect, and the defect is reported
without a mechanism it cannot support.

### The allocation, because this number collided last time

Ursa's PM merged two of this seat's rows on 2026-11-09 and found both had
written the same ledger number for different findings, keeping both and
renumbering one up. The cause is not carelessness between two runs. Both
allocated the next free number by reading `ledger.md` on `main`, and `main`
is a subset of this organization's memory. This number was taken from the
union of `main` and every open pull request's branch instead, which is one
loop over `gh pr list` and reads 65 as the high-water mark where `main`
alone reads 65 too — this time. The check costs seconds and is the only
form of the question that can be right.

## L67 — A liveness proxy that agrees with reality 15 of 15 times still cannot see the stranded case

**measured**, 2026-11-09 (run message-r), `reviews/2026-11-09-message-r/NOTES.md` §1.

L64 gave this seat a teardown that stops a server before it deletes the
directory. The remaining question that script has to answer is whether a
server sitting in another `epito-ursa-frontend-*` tree belongs to a
previous run of this seat or to a sibling run that is still working, and
the answer it used was the existence of the directory: a deleted tree is
takeable and a tree still on disk is a sibling mid-screenshot.

Measured across every seat checkout on this host at
2026-11-09T05:45:21Z, that proxy is right. All 13 checkouts on disk had a
live owning `claude` process, so `the tree exists` and `a sibling is
working` agreed 13 of 13 times, with 0 stranded. There was no false
positive to report and no bug to point at. The set churns between reads,
so that is a count of one instant and not of the day.

**The denominator was wrong the first time it was written here, which is
worth leaving in.** The first survey globbed `/tmp/epito-*` and counted
`/tmp/epito-stub`, a shared jsonl store with no checkout in it, as a seat
tree. It was the only row with no owner, so the loose glob produced a
`14 of 15` with one apparent stranded tree that was not a tree at all. A
count is only as good as its membership test, and the membership test now
sits in the evidence file above the numbers it produces.

It is still a proxy, and naming what it rests on is what shows the gap.
It rests on the host deleting a tree when its run ends, which is a
behaviour of the host rather than an invariant of anything. HQ's engineer
measured six stranded scratch directories on this same box the same night,
three of them complete checkouts, from a tool whose teardown runs in a
`finally` that a kill never reaches. A stranded tree is precisely the
input where this proxy answers `a sibling may be mid-screenshot` forever,
every run, and nothing ever reclaims the server inside it.

So the repair is not a correction. The directory was the wrong question
and the right one was already answerable: `/proc` holds the working
directory of every live process, so the run that owns a tree can be read
instead of inferred. `teardown.sh` now asks `owner_of`, and it prints what
it found on the line where it declines to act:

    leave  3565625  owner=3565626 claude  /tmp/.../epito-ursa-frontend-AAAAAA/ursa-minor
    leave  3565627  owner=none  /tmp/.../epito-ursa-frontend-BBBBBB/ursa-minor  (--orphans would stop this)

**Where this came from, because the attribution is the point.** HQ's
engineer hit the same class four hours after this seat reported L64 and
wrote back that it had put the owning process in its scratch directory's
name, so that a sibling still working is identified rather than guessed
at. Its directories are its own to name and this seat's tree name comes
from the runtime, so the adaptation is to read the owner rather than to
write it. The sentence that transferred was not the mechanism. It was
`identified rather than guessed at`.

**The class.** A proxy that is correct on every input you have is
indistinguishable from the thing it stands for until you name the
behaviour it depends on. Do that first, and the input that breaks it is
usually already in front of you in somebody else's incident.

### The defect inside the repair: a test that passes before it arrives

Case 4 of `check-teardown.sh` read `--orphans still refuses a live
directory, because a concurrent run of this seat may be mid-screenshot
against it`, and it asserted that against a decoy in
`$TMP/epito-ursa-exo-ZZZZZZ/ursa-minor`. The seat pattern is
`epito-ursa-frontend-[A-Za-z0-9]+`, and it is tested several lines above
the `--orphans` branch, so that decoy was discarded as another seat's
before the branch the case names was ever reached. Verified by spawning
the same decoy in an `epito-ursa-frontend-*` tree instead: that one
produces a `leave` line and the exo one produces no line at all.

The case had been green since it was written and it was green for the
scoping filter, which case 1 already covers. The branch it was the only
test of had none.

**Why this is the same shape as L64 rather than a separate kind of
mistake.** A green assertion and a teardown that printed nothing are both
outputs that look like the absence of a problem. The reason this one
survived is that its decoy was reused from the case above it, where the
wrong-seat tree was the whole point, and reuse carried the scoping with
it. The four replacement cases were each run against `main`'s
`teardown.sh` before being trusted: all four fail there and pass here,
which is the only evidence that a case reaches what it claims to.

**And running the suite early is not the repair, which is worth stating
because it is the obvious one.** This seat does run its selftest before
deciding, and it ran green here while case 4's premise was false. A green
case cannot tell you which branch it was green for, so the order of the
run is not what asks the question. Running it against the version without
the fix is. Ursa's security seat reached the same edge from its own side
the same night: a staleness check that fires when an exempted test starts
passing cannot see that test arriving broken, which is the direction that
matters.

### A second one, in the driver for the other fix

`argv0()` applied its redirection before the `2>/dev/null` meant to
silence that redirection's own failure, so a pid that exited between the
`ls /proc` listing and the read of its `cmdline` printed a shell error
between a `leave` row and the count line. Reproduced both halves at one
instant: the unbraced form printed `No such file or directory` for pid
3663191 while the braced form over the same scan printed nothing.

The first attempt to test it behaviourally spawned short-lived processes
to drive the race. It passed against the unfixed script, left processes
on a shared host, and hung the suite until they were killed by hand. The
window is a few syscalls wide, between the `-O` test and the read, so it
is not worth driving. What is asserted instead is the shell property the
fix rests on, against a real missing path, plus the fact that the script
still uses the form that has it. That is written in the test as a
limitation rather than left to read as a behavioural check.

**And the smallest instance of all, recorded because it is this seat's
own.** The manual probe that found the `leave` branch ended with
`pkill ...; rm -rf "$T"`. `pkill` killed a process in this shell's own
chain, the chain aborted at exit 144, and the `rm` never ran, so the
probe stranded the directory it had made. Cleanup placed after a command
that can kill the shell is cleanup that does not run.

## L68 — npm's argv[0] is its whole command line, so the fix that made one process match precise is what breaks the other

**measured**, 2026-11-09 (run 2026-11-09-message).
`reviews/2026-11-09-message/NOTES.md` §1.

The kit's README carried four lines under *before any npm in a tree: is
one already running there?*, added the morning L64 shipped `teardown.sh`.
They were never tested and they were wrong in three independent ways,
none of which a reader could see, because the block printed nothing on
the clean path.

Measured with one real `npm install` live in a sibling tree of the same
run, and a decoy process carrying the words `npm install` in its argv
without being npm:

| | old block | `check-installs.sh` |
|---|---|---|
| pids its pattern claimed | 6 | 1 |
| of those, live npm installs | 1 | 1 |
| `REFUSING` lines printed | 3 | 1 |
| of those, the live install | **0** | 1 |
| exit, clean | 1 | 0 |
| exit, while refusing | 0 | 3 |

**The three faults.** It matched `pgrep -f`, which reads the whole command
line, so two of its three false positives were the measuring shell itself
and another seat's `claude -p` process, whose prompt quotes a board
message this seat had sent about npm installs. It tested
`cwd = $PWD`, so it missed the install six directories away on the same
cache. And its exit status was its last command rather than its finding:
1 from a failed `[` test when clean, 0 from a successful `echo` while
refusing, so nothing could gate on it and the word `REFUSING` was the
whole of the refusal.

**Why this is a ledger entry and not a one-line repair.** It is the third
instance of the class L64 named for the same file. L64 was the process
match in `teardown.sh`, L65's run found the directory half, and the
remedy both times was *read argv[0], the name the process was exec'd
under, not the command line*. That remedy was never carried across to
the install block in the same README, which is the guard nobody checked
because it is four lines of prose in a code fence rather than a script
with a selftest. **A lesson that lands as a fix to one call site and not
as a rule in the file it was learned in gets re-learned.**

**And the remedy does not transfer verbatim, which is the new fact.**
`next` renames itself to `next-server (v16.4.3)`, a short distinctive
argv[0], and that is what makes the teardown's test precise rather than
merely narrower. **npm renames itself to its own command line.** Measured
on a live install: `/proc/<pid>/cmdline` is 123 bytes holding ONE field,
`npm install typescript playwright esbuild`, followed by eighty empty
ones, because npm sets `process.title` to its whole invocation. So the
field a teardown reads to get a short exec name returns the full line
here, and the first version of `check-installs.sh` — which tested that
field's basename against `npm`, exactly as `teardown.sh` does — reported
**zero installs live while one was running**, which is the same false
clean as the block it replaces.

What survives both shapes is to anchor at the **start** of argv[0] rather
than to search the command line. A shell that mentions npm has argv[0]
`/bin/bash` and an agent process has `claude`, so the anchor excludes
both, and npm's self-titled `npm <subcommand> ...` is caught. Case 8 of
the selftest is this file's own shell, whose command line names
`npm install` a dozen times, inverted into an assertion.

**The resource is the cache, and that correction is not this seat's.**
Ursa's exo seat rebuilt every install's interval on this host from npm's
debug log filenames and their mtimes, and found that no two intervals
from different sandboxes overlap anywhere in the day: three npm processes
were alive at 05:02, started 05:00:08, 05:00:41 and 05:01:59, and the
nearest other seat's install had ended 56 seconds before the first of
them. Verified here from the same logs' own `cwd` lines, which this seat
had not read: all three carry
`/tmp/epito-ursa-frontend-Z6GAU1/ursa-minor`. **The concurrency was one
seat's own, in one sandbox, in one tree.** L55's rule gives a run a
private `--cache`, and a private cache holds all of that run's installs,
so it does not separate them and the race survives the new path intact.
`same-checkout` is that case and it is a separate exit from `same-tree`.

**What cannot be read, and is not guessed.** npm's `process.title` keeps
the subcommand and the positional arguments and **drops the flags**, so a
live install's `--cache` is not recoverable from `/proc` at all. The
first version of this tool printed npm's default path for it, which is a
specific shared directory asserted from nothing read — the same shape as
the detection line below. It prints `UNREADABLE` now, and an unreadable
cache counts as a race only when **ours** is the shared default, because
that is the only cache a process outside this checkout can reach.
Refusing on it unconditionally would stop every window in which any of
about twenty seats on this host installs anything.

**The detection line this seat gave away, and took back.** Offered to the
exo seat for `runner-facts.md`: `ls -ld /srv/asc/home/.npm/_cacache`. It
fails open. npm removes that directory between installs, on a host whose
watcher reclaims at eighty per cent, so it reads *not shared* exactly
when nobody has installed yet, which is the moment a run is about to.
Measured absent twice by the exo seat and a third time here. The seat
that wrote L61 and L63 about an instrument that has stopped
discriminating looking exactly like one that found nothing wrong put that
line in another seat's file the same night. `npm config get cache`
resolves unconditionally, so its answer is the finding, and
`--cache-path` prints it with a verdict on whether the path is shared.
Case 9 of the selftest reads the tool's code, with its comments stripped,
and fails if `_cacache` ever comes back into it — the comments explain
the hazard and have to be allowed to name it.

**Where the number came from.** The high-water mark is 67, read from the
union of `main` and every open pull-request branch rather than from
`main` alone, which reads 66. L67 is on this seat's `#806`, unmerged.
The allocation paragraph at the end of L66 says why that is the only
form of the question that can be right, and this is the first run to owe
it a number it would otherwise have got wrong.

## L69 — The instrument that handled its own failure is the one whose exit status lied about it

**measured**, 2026-11-09 (run 2026-11-09-message-t).
`reviews/2026-11-09-message-t/NOTES.md` §"The defect, stated".

`measure-narrow.mjs` was pointed at its default port while this run's
server was on another one. All twenty cells failed to load. It printed

    NOT MEASURED: 20 of 20 page-by-width cells could not be loaded or
    never came to rest, so this run makes no claim about them.

and exited 0.

Both halves were already the tool's own work. The comment above that line
cites L23 and says the headline "refuses to report a pass while any cell is
unmeasured". The refusal was written in prose and never in the number a
caller gates on, because the exit status was whatever the last statement
left behind and the last statement is a successful `writeFileSync`.

**The control, and the part worth keeping.** Against a dead port:

| tool | exit |
|---|---|
| `measure-narrow.mjs` | **0** |
| `measure-contrast.mjs` | 1 |
| `measure-hit-areas.mjs` | 1 |
| `measure-focus.mjs` | 1 |
| `verify-hover.mjs` | 1 |

The four that are right are right **by accident**. They let the navigation
error escape and node sets the status for them. `measure-narrow.mjs` is the
only one of the five that catches the failure and reports it, and catching
it is exactly what let the run continue to a success exit. So the care is
what broke it, and the four that look correct here are one `try` away from
the same defect without anything in them changing. That is the general
claim and it is why this is a ledger entry rather than a line in a diff:
**error handling converts a crash into a pass unless the handler also owns
the exit status.**

**The line the repair does not cross.** Exit 2 for blindness and no exit 1
for a finding. `selftest/check-contrast.mjs` runs `measure-contrast.mjs`
over a fixture built to fail and asserts a non-zero exit is an error,
because it reads the findings as JSON. A tool whose findings are data must
exit 0 when it measured, however bad the findings. Whether a cell puts
content out of reach is a verdict about the **site**, made by the reader of
the table. Whether anything was measured is a verdict about the
**instrument**, which no caller can make from outside. Only the second is
this file's to state, and conflating them would have broken a selftest that
was right.

`selftest/check-narrow.mjs` proves both directions, because case 1 alone is
satisfied by a tool that always fails: blind exits 2 and still says so in
words, measured exits 0 and prints the passing headline.

This is `runner-facts` §48, reached by Ursa's exo, security and engineer
seats in one night and now by this seat's instrument rather than its site.
The witness detail: this run's own transcript records `narrow exit=0` after
that invocation, so it came one careless step from entering a clean sweep
over a matrix it never loaded.

## L70 — Proposal: the home page is the only page that leaves the site's one-column grid, and only at desktop

**measured, not decided**, 2026-11-09 (run 2026-11-09-message-t).
`reviews/2026-11-09-message-t/data/grid.txt`.

Content edges, every page, the three charter viewports:

| viewport | home | the other three |
|---|---|---|
| phone 390 | 32..358 | 32..358 |
| tablet 820 | 66..754 | 66..754 |
| desktop 1440 | **416..1024** | 240..1200 |

At phone and tablet the site has exactly one left edge and the wordmark,
the `h1` and the section content all sit on it, across all four pages. That
is the designed system and it holds. At desktop the home page takes a
column 176px narrower on each side than the one the rest of the site uses.

Two differences in the markup rather than one, and the second is the one a
reader would miss:

    app/page.tsx:103              lg:mx-auto lg:max-w-2xl lg:px-8
    app/record/page.tsx:23        xl:mx-auto xl:max-w-6xl
    app/record/[id]/page.tsx:38   xl:mx-auto xl:max-w-6xl
    app/record/at/…/page.tsx:60   xl:mx-auto xl:max-w-6xl

The container differs **and so does the breakpoint it starts at**, so
between 1024 and 1280 the home page has already centred into a 608px column
while the other three are still full-bleed on the clamp padding.

**Not changed by this run, and the reason is the charter rather than
doubt.** A marketing page with a narrower measure than a data page is a
legitimate design decision, and the charter routes bigger ideas into a
proposal instead of into this seat's diff. What is offered here is the
measurement, which did not exist before, and one observation: whichever
column the owner wants, the two breakpoints should probably be the same
one, because the 1024-to-1280 band is a width nobody chose and both pages
pass through it.

## L71 — A max-width behind a breakpoint prefix does not apply between the two, and the band in between is the only place it matters

**fixed**, 2026-11-09 (run 2026-11-09-message-v).
`reviews/2026-11-09-message-v/data/sweep-grid.txt` and `sweep-grid-after.txt`.

L70 offered the measurement and left the column choice to the owner, with
one observation attached: the two breakpoints should probably become the
same one, because the band between them is a width nobody chose. This run
took that card and found the observation understated. The band is not
merely unchosen. Inside it the record pages' column was **wider than the
maximum the markup declares for it**, and `max-w-6xl` is the thing that
declares it.

`xl:max-w-6xl` names a 1152px column and gates it behind the 1280px
breakpoint. A `max-width` is inert whenever it exceeds the space available,
so the prefix buys nothing below 1152 and the only widths it changes are
1152 to 1279, which are exactly the widths where the clamp was needed and
absent. At 1200 the column ran 1008px wide against a declared maximum of
1152 minus its padding, 960.

**The sweep that found it.** The three charter viewports cannot see this:
820 is below both breakpoints and 1440 is above both, so the band had never
been photographed or measured. 960 to 1440 in 16px steps, plus the four
breakpoints probed at single-pixel resolution, four pages. A left edge that
moves further than the viewport moved is a discontinuity:

| page | at | viewport | left edge |
|---|---|---|---|
| home | 1023 to 1024 | +1px | **+126px** |
| set | 1279 to 1280 | +1px | +64px |
| record | 1279 to 1280 | +1px | +64px |
| address | 1279 to 1280 | +1px | +64px |

**The repair is the prefix and nothing else.** `xl:mx-auto xl:max-w-6xl`
became `mx-auto max-w-6xl` on the three record pages and in the footer's
`wide` measure. No measure width changed, so the owner's open decision from
L70 is still open and still has the same two options. Three of the four
discontinuities are gone and the record pages' column is now continuous
from 960 to 1440.

**The evidence that the fix is confined to the band.** `diff-frames.py`
over six viewports times three pages: phone 390, tablet 820, desktop 1440
and 1152 are **0px, identical** on every page, and only 1200 and 1279 move,
and only on the two record pages. A change invisible at every width anyone
has ever reviewed is the shape this repair should have, and it is reported
as a measurement rather than as an intention.

**What it also does to L70's number.** The home-to-record divergence is 176px
by design above both breakpoints. Before, it drifted from 126 to 240 across
1024 to 1279 and only settled at 1280. Now it reaches 176 at 1200 and holds.

### The cost, which this run went looking for and found

`data/header-offset.txt`. `site-header.tsx` carries page padding and no
max-width, so the wordmark sits on the page edge while the body column may
be centred: at 1440 the body sits 144px inside the header, which reads as a
rail and a column and is the design. The gap has to get from 0 to 144
somehow, and this change decides how.

| | widths sharing one left edge | widths with a gap under 48px, non-zero |
|---|---|---|
| before | 25 of 37 | **0** |
| after | 16 of 37 | **6** |

Before, the gap was 0 up to 1279 and 64 at 1280. Now it ramps 1, 8, 16, 24,
32, 40, 48, 56, 64 across 1153 to 1279. **A small non-zero stagger is the
one that reads as a mistake**, and six sampled widths now have one where
none did before. This is named rather than buried because it is the part of
the change a reviewer might want reversed. The judgement for keeping it:
the thing it replaces is a 64px jump at one pixel of viewport, which is
visible as a snap while resizing and is the symptom of a clamp that was not
applying. A continuous ramp expressing a real design intent is better than a
discontinuity hiding a defect. The third option, giving the header the body's
measure so the two always share one edge, would change every page at every
width and belongs to the owner, like L70's column.
