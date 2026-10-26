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
2026-10-25 and not into a pull request here. `react.dev` stood in for
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

## Open, and not this seat's to close

**Where Ursa's canon comes from.** Thirteen reviews under `reviews/`
have recorded that `canon.md`, `ban-list.md` and `tuning.md` do not
exist here, and this one makes fourteen. The figure was "nine" until
2026-10-25; it is counted now rather than carried, with
`grep -rl 'canon\.md' docs/design/reviews/*/README.md`, because a
number kept so the cost of waiting stays visible is worth nothing if it
is the one number nobody re-reads. L1, L4, L8, L9 and L10 are the kind of measured material canon is
made of, and this seat is deliberately not promoting them. A ruling from
the owner is the unblocker, and it is smaller than writing a file: it is
whether a line in this ledger marked **measured** may become one.

As of 2026-10-24 this is no longer sitting between two seats: Ursa's
project manager opened the question with the owner directly, naming this
seat's reasoning for not writing the files itself rather than restating
it. Nothing here changes until she answers; the count above is kept so
the cost of waiting stays visible.

**Ursa Major has two web surfaces and two identities.** Measured on
2026-10-24 (`reviews/2026-10-24g/README.md` §7): the capture panel is
drawn at 6px radii in two Google faces with three hues the rest of Ursa
does not have, and the record viewer is square hairlines, Helvetica, two
lights on one night. Three of the panel's tokens are near-copies of
house tokens under different names. Neither has a contrast problem, so
this is drift and not a defect. It is left open rather than fixed
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
