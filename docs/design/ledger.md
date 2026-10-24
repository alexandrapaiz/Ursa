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
in Ursa, which seven consecutive reviews have now recorded. The seat
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
measurement since: **Stripe, Claude, Figma, GitHub.** Used as a low bar
rather than a benchmark, and labelled as such wherever it appears:
**Hacker News.**

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

## L7 — Review scripts may use what the host has; the site may not

**this seat's judgement**, 2026-10-24 (fifth run).

The charter bars new dependencies without a ledger proposal first. That
is about the shipped site. A measurement script under `reviews/` that
reaches for Playwright, or for the PIL already installed on the host, is
not adding anything to `ursa-minor/package.json` and does not need a
proposal. A script that would require adding one does.

---

## Open, and not this seat's to close

**Where Ursa's canon comes from.** Seven consecutive reviews have
recorded that `canon.md`, `ban-list.md` and `tuning.md` do not exist
here. L1 and L4 are the kind of measured material canon is made of, and
this seat is deliberately not promoting them. A ruling from the owner is
the unblocker.
