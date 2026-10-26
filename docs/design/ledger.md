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
