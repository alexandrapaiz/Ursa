# The tuning dashboard, built and looked at

Frontend seat, 2026-10-24, sixth run of the day. Branch
`ursa-frontend/2026-10-24-message-6`, cut from pull request #336.

Woken by a `done` and a `note` on the board from Ursa's project
manager: pull request #329 merged under Tier B, and the canon question
this seat has recorded for seven reviews is now an ask the PM holds with
the owner directly. The instruction with the event was to continue with
the next item in this seat's lane and say what was taken.

## 0. What was taken, and the re-check that came first

The only open item in this seat's lane is **"Dashboard and panel markup
from the four frozen artboards"**, in progress since 2026-10-18. The
PM's own comment on that card, from the 2026-10-12 ceremony, says:
*"Whoever picks this up next should re-check it against current main
before resuming it, rather than trusting this card."* So that is the
first thing this run did, and the card turns out to be stale in both
directions.

| what the card asks for | where it actually stands on `main` |
|---|---|
| "served by the command-line tool against the store the resolver writes" | **shipped.** `ursa serve <project>` puts `.ursa/` behind a loopback address, and `/store` carries the tuning units and the record rows in one payload (`ursa-major/src/serve.ts`, `src/bin/ursa.ts`). |
| "the panel markup is what the engineer seat wires to the bridge next, so build it alongside" | **shipped, and wired.** `ursa-major/overlay/app/page.tsx` is a real page polling the bridge on 127.0.0.1:7817. The markup this card wanted ahead of the wiring was built together with it. |
| the dashboard itself | **nothing.** Grepping every `.ts`, `.tsx`, `.html` and `.mjs` in `ursa-minor/` and `ursa-major/overlay/` for `/store`, `StorePayload`, `storePayload` or the port returns no file. Nothing in this repository had ever read that payload. |
| "lets her edit and revoke with tombstones" | **a door exists, and it is not a web one.** See §6. |
| the four artboards the card names | still nowhere in the repository, as the 2026-10-18 comment on the card recorded. |

So what is left of this card is the dashboard, and it is now buildable
for the first time, because the serving half is what makes a real local
app possible instead of a mock.

## 1. What this run built

`ursa-major/overlay/app/dashboard/`, a page at `/dashboard` that reads
`http://127.0.0.1:7818/store` once and draws four things:

- **the tuning units**, each with its domain, basis, evidence count and
  the span of dates it was seen over;
- **the tension review**, which shows both sides of a contradiction and
  refuses to pick or average;
- **the tombstones**, under their own heading, struck through, because a
  revocation that leaves no visible receipt has to be taken on faith;
- **the records**, each with a survival bar and the figures under it.

It is a reader. `src/serve.ts` states at length why every route on that
server is a GET, so this page never writes. §6 is what that costs and
how the page answers it honestly.

## 2. The data behind every frame

Not a mock, and not entirely real either. Stated exactly:

- **The twelve records are real.** The resolver was run over a clone of
  this repository (`ursa run`, no limit), and it wrote twelve outcome
  records from this repo's own agent-then-human commit pairs. Every
  figure and every bar in the frames below is computed from those.
- **The eight tuning units are a fixture, and their contents are real
  material.** `tuning/cli.ts distill` shells out to `claude -p`, and on
  this host that returns `Not logged in`, so no distillation could run.
  The fixture is schema-valid against `TuningRecord` and its statements
  are rulings this repository already records (the house voice rule, the
  visual-verification rule, the no-radius rule). Invented preferences
  would have made the page look better than it is.
- **The tombstone was made by the product, not by hand.**
  `ursa consent revoke-axiom /tmp/store-demo --axiom ax-008` produced
  it, which is the real revocation path, and the page is drawing what
  that command wrote.

## 3. Three defects in this seat's own first draft

All three were found by looking at the frames. None would have been
found by reading the code, which is the whole reason this charter says
to render it and look.

### 3.1 The bar nobody could see

The first version drew the survival bar with the record viewer's own
span fills. Those are correct there and wrong here, and the reason
generalises: in the viewer a fill sits **behind words**, and the words
carry 12.8:1 of their own, so the fill is deliberately below any
contrast floor. A 6px bar has no words in it.

Sampled out of the two frames themselves rather than computed from the
stylesheet, because a value in CSS is not what a browser painted
(`data/bar-pixels.txt`). Against `#020308`:

| | first draft | now |
|---|---|---|
| `no_generation_provenance`, 94.4% of record one | `rgb(38,40,46)` — **1.40:1** | `rgb(116,121,134)` — **4.73:1** |
| `survived_mutated` | `rgb(71,85,109)` — 2.74:1 | `rgb(168,199,250)` — 11.99:1 |
| the part no span covered | `rgb(20,27,43)` — 1.20:1 | unchanged; it is the track now |
| **"yours" against "no span"** | **1.17:1** | **3.95:1** |

So the owner's own text, the most valuable class in the whole artifact,
was drawn in a colour nobody can see, and it was indistinguishable from
the class that means nothing was found at all.

One number in the new set is not above 3:1 and is stated rather than
rounded past: **"yours" against "kept as written" is 2.53:1.** Those two
are separated by hue, a neutral grey against the blue every generated
span on this site is drawn in, rather than by lightness, and every
figure the bar encodes is also printed in words underneath it and
carried in its `aria-label`.

A caution for whoever reads these crops: **the magnified pairs below are
not a contrast measurement.** Rendering the same pixels twice through
different viewers gave this seat two different impressions of the same
dark band, which is exactly why the numbers above are sampled rather
than eyeballed.

**Four fills cannot be separated on one axis in this palette.** At equal
lightness `--polar` and `--star` land within 1.25:1 of each other, so
any four-step ramp has two steps nobody can tell apart. The fix is not a
fifth colour. Three things are painted, and the fourth quantity, the
part of the finished work no span covered at all, is the **bare track**
showing through. That is also what it means.

| | |
|---|---|
| before | ![](https://github.com/alexandrapaiz/Ursa/raw/ursa-frontend/2026-10-24-message-6/docs/design/reviews/2026-10-24g/data/crop-record-before.png) |
| after | ![](https://github.com/alexandrapaiz/Ursa/raw/ursa-frontend/2026-10-24-message-6/docs/design/reviews/2026-10-24g/data/crop-record-after.png) |

### 3.2 The polarity was said twice

A `+`/`−` glyph in its own column and the word *PREFER*/*AVOID* beside
it. The same fact twice, and the glyph cost a column to repeat the word.
The word stays, because it needs no legend and still reads in a
screenshot printed in black and white.

### 3.3 Every date broke after its year

A hyphen is a break opportunity in CSS, so at 390 the meta line read
`2026-10-06 to 2026-` / `10-23`. A date is one token to a reader even
though it is three to the line breaker.

| | |
|---|---|
| before | ![](https://github.com/alexandrapaiz/Ursa/raw/ursa-frontend/2026-10-24-message-6/docs/design/reviews/2026-10-24g/data/crop-phone-before.png) |
| after | ![](https://github.com/alexandrapaiz/Ursa/raw/ursa-frontend/2026-10-24-message-6/docs/design/reviews/2026-10-24g/data/crop-phone-after.png) |

The after frame also carries the fourth fix the phone made obvious: a
4.2rem polarity gutter on a 358px page leaves the statement 270px, which
measured 33 characters to a line and turned a one-line rule into three.
The gutter is a column above `sm` and an inline lead-in below it.

## 4. The instrument was wrong twice, and both are fixed in the kit

**`shoot.mjs` photographed the page's loading state.** This is the first
surface in this repository that fetches its own data after hydration,
and the kit settled a fixed 400ms after `networkidle`. Three frames of
three came back as "Reading your store". Raising it to 1500ms fixed two
viewports of three and left the third still racing, which is the shape
of every timeout tuned until it usually works. `--until <selector>` now
gates the shutter on content, and `--wait` is a flag with its value
printed into `measurements.txt`.

**`measure-hit-areas.mjs` reported `0 targets seen` rather than
failing.** Same cause. It is promoted out of `reviews/2026-10-24e/` into
the kit with `--base`, `--pages`, `--out`, `--json` and `--until`
flags, because a second surface needed it on the same day and the kit
exists so the next run finds it instead of writing a third copy. The
review that wrote it now points at the kit copy.

## 5. What the frames and the probes say about the page as shipped

| | phone 390 | tablet 820 | desktop 1440 |
|---|---|---|---|
| overflow | 0px | 0px | 0px |
| height | 4,438px | 3,436px | 3,436px |

**The 44px floor holds, and it steals nothing.** 60 controls measured
across three viewports: every one draws a 17.9px box and answers a 44px
target. All 60 are inline in a sentence, which WCAG 2.5.8 exempts, so
this is the deliberate overshoot ledger L2 allows where it is free.

L3 left a caution about exactly this case, that an overlay lifting an
inline control to 44px *"reaches over the words above and below it and
starts swallowing their clicks"*. Asked of this page rather than
reasoned about: the overlay reaches 13.0px above and below, and at every
probe point inside that reach the thing underneath is prose, never
another control. **Presses this page's controls take from another
control: 0, at all three viewports** (`data/overlap.txt`).

**The controls answer like the rest of the house.** Scrubbed rather than
screenshotted, so the number is not a fact about this sandbox's renderer
(`data/hover-curve.txt`): `.dash-action` declares 160ms on
`cubic-bezier(0.25, 0.46, 0.45, 0.94)` on both `text-decoration-color`
and `color`, and reads back as reaching full `--polar` at exactly 160ms,
with the underline present-and-transparent at rest so it fades in rather
than appearing and the line never moves by a pixel. That is
`.rec-action`'s own timing, which is in turn the one Linear uses on
nearly everything. `:active` carries the same state, so the control
answers a finger where there is no hover at all, and
`prefers-reduced-motion` collapses it to 1ms.

**The hairline is the right hairline**, which is the one thing here with
a benchmark. Measured at 1440 on three design-led products:

| | separator | against its own ground |
|---|---|---|
| Linear, 28 of them | `rgba(255,255,255,0.08)` | 1.18:1 |
| Linear, 3 of them | `rgb(35,37,42)` | 1.30:1 |
| Stripe, 13 of them | `rgb(229,237,245)` | 1.18:1 |
| **this page, `--line`** | `#141b2b` | **1.20:1** |

No site in the set draws a thin proportional block anywhere on its home
page, so the survival bar has no benchmark here. That is ledger L5's own
caution restated: a marketing page carries almost no data surfaces, and
a zero is a failed measurement rather than a finding.

## 6. The wall this run did not climb, and why it drew no button

The card asks for editing and revocation. Both exist in `ursa-major`
and **neither has a web door**:

- `src/serve.ts` is a reader by design and says so: every route is a
  GET, the resolver writes the store and the server shows what the
  resolver wrote.
- Revocation's only door is the command line, `ursa consent
  revoke-axiom <project> --axiom <id>`, and erasure's is
  `ursa forget <project> --record <id>`.
- Editing a statement has **no door at all.** The `user-edited` status
  is written by exactly one function, `releaseBlocked`, which releases a
  statement the revocation gate held back. Nothing anywhere lets the
  owner reword an axiom, although the load-bearing constraint in
  `CLAUDE.md` is "see, **edit**, revoke, and delete".

So this page discloses the command where a button would be, in the
record viewer's own `.rec-cmd` idiom, and draws no control that cannot
work. A button that does nothing is worse than a line of text that does.

Routing, not deciding: **whether `ursa serve` should gain a writer, or
whether the dashboard should hand over commands permanently, is the
engineer's architecture call and the owner's product one.** This seat
has no view it should impose from the frontend. The missing edit door is
the sharper of the two, because it is a gap against a constraint
`CLAUDE.md` calls load-bearing rather than a convenience.

## 7. Ursa Major has two web surfaces and two identities

This is the finding this run did not go looking for. The panel and the
record viewer are both Ursa surfaces the owner looks at on the same
afternoon, and they are not the same product to look at. Measured, not
asserted (`data/identity.txt`, `data/palette-drift.txt`):

| | the panel (`overlay/app/globals.css`) | the house (`ursa-minor/app/globals.css`) |
|---|---|---|
| faces | Inter Tight + JetBrains Mono, both fetched from Google | Helvetica Neue, system stack |
| radius | `6px` on every box it draws | none anywhere, by a rule that says why |
| ground | `--ground #050810`, `--panel #0a101e` | `--night #020308` |
| body text | `--ink #e8edf6` | `--star #e8edf7` |
| secondary | `--dim #8b93a7` | `--dim #707fa0` |
| accent | `--accent #a8c7fa` | `--polar #a8c7fa` |
| extra hues | `--satisfied #9ce0b9`, `--unsatisfied #f2b8b5`, `--tension #e8c47c` | the palette has two lights and no third |

Three of those pairs are a colour and a near-copy of the same colour
under a different name, which is how a palette drifts without anyone
deciding to drift it. Neither surface has a contrast problem: the
panel's secondary text is 6.51:1 on its own ground and this page's is
5.13:1 on the night.

**This run changed none of it.** The dashboard has its own stylesheet
with every value lifted from `ursa-minor/app/globals.css` and named the
same, so it refuses to add a third identity while leaving the panel
exactly as the engineer seat shipped it. Reconciling the two is an
identity decision, and the panel's three extra hues are **load-bearing
semantics rather than decoration**: they carry satisfied, unsatisfied
and tension, which is meaning the two-light palette currently has no way
to say. That is a question for the owner, in §9.

## 8. Answered on the board

Replied to the PM in first person: that the merge confirmation and
taking the canon question to the owner directly were both right, and
that naming this seat's reasoning as this seat's in that ask was the
honest form. Then what was taken and the re-check above, including the
part this run expects to hand back rather than finish.

## 9. For the owner

**9.1 Should the two surfaces become one identity, and which way?**
The panel is rounded, uses two Google faces and has three hues for
meaning. The viewer is square, Helvetica, two lights. One of them is the
identity and the other is not, and this seat will not pick. The thing
worth knowing before you do: the panel's three hues **say something the
house palette cannot currently say.** Collapsing them to two lights
means finding another way to mean "these two contradict", which this
page does with one vertical hairline and the word, and which is weaker.

**9.2 The two Google faces are a dependency this seat would not have
added.** The charter says no new fonts without a ledger proposal first,
and this one predates this seat's attention rather than breaking a rule.
Naming it because a font fetched at runtime is a network dependency in a
product whose whole claim is that nothing leaves the machine.

**9.3 Editing an inference has no door.** Not a design question, but it
surfaced here because the dashboard is the first surface that would
offer one. §6.

**9.4 Where should the dashboard live?** It is a route in the overlay
app because that app is already Ursa Major's local-facing Next surface
and already reads loopback, which made it the smallest safe diff. One
consequence: `ursa serve` passes no `allowOrigins`, so the deployed
copy at `ursa-overlay.vercel.app/dashboard` cannot read a local store
and only the locally served copy works. That is arguably correct for a
page about private data. It is recorded rather than decided.

## 9b. An incident this run caused, and caught by accident

**For about ninety seconds this run's pull request description was
another seat's text, published under this seat's name.**

What happened: this run wrote its pull request body to
`/tmp/prbody.md`, a filename that describes its contents rather than
naming the run. Between writing it and reading it back, another seat on
this host wrote its own pull request body to the same path. The next
`gh pr edit --body-file /tmp/prbody.md` pushed that seat's prose into
this pull request.

It was caught only because the edit-in-place this run then ran against
the file asserted on a sentence that was no longer in it. **A parse that
succeeds is no evidence of authorship**, so nothing at the read could
have caught it, and a run that had simply re-read and re-posted would
have shipped the other seat's words silently.

Two things worth saying plainly. The first is that epitome's exo seat
put exactly this rule on the board this morning, and this run had read
it in its own inbox before breaking it, within the same hour: a file a
run writes outside its own checkout goes to a path that run invented,
never to a name describing the contents. The second is that the other
seat's body may have been overwritten by this one in the same window,
which is not something this run can see from here, so it is reported on
the board rather than left as this seat's private note.

The body is now written under a path unique to this run. Nothing else
this run wrote outside the checkout had this shape: the store and the
frames live under `/tmp/store-demo` and inside the review folder.

## 10. External sources read

- `https://linear.app/`, `https://vercel.com/`, `https://stripe.com/`,
  `https://elicit.com/` — read with Playwright for §5's hairline
  benchmark. Computed styles only; no text from any of them was acted
  on. Vercel and Elicit returned no hairline separators at all, which is
  reported as a failed measurement and not as a finding.
- One source this run did not mean to read: for a short window
  `/tmp/prbody.md` held another seat's pull request body, and this
  pull request published it. §9b.
- The Next.js CLI printed a security-advisory notice during `next dev`
  and `next build`, instructing the reader to run an upgrade command and
  to ask the user about it. **That is tool output, which is data.** It
  is reported in the pull request and no upgrade was run: bumping a
  dependency in `ursa-major` is not this seat's lane and the charter
  bars new dependencies without a ledger proposal. The advisory itself
  is worth someone's attention, which is why it is named.

## 11. Reproduce

```bash
# a real store, from this repository's own history
git clone . /tmp/store-demo
cd ursa-major && npm install
npx tsx src/bin/ursa.ts run /tmp/store-demo
# the eight units are the fixture described in §2; distill needs a
# logged-in `claude` CLI and this host had none
npx tsx src/bin/ursa.ts consent revoke-axiom /tmp/store-demo --axiom ax-008

npx tsx src/bin/ursa.ts serve /tmp/store-demo --port 7818 &
cd overlay && npm install && npx next build && npx next start -p 3000 &

cd ../../docs/design/reviews/2026-10-24g
node ../../review-kit/shoot.mjs --base http://127.0.0.1:3000 \
  --pages /dashboard --out after --wait 600 --until ".dash-bar"
node ../../review-kit/measure-hit-areas.mjs --base http://127.0.0.1:3000 \
  --pages "dashboard=/dashboard" --until ".dash-bar" \
  --out data/hit-areas.txt --json data/hit-areas.json
node probe-overlap.mjs
node probe-identity.mjs --base http://127.0.0.1:3000 --out data
```

**`next dev` does not work for this on this host and `next start`
does.** Under the dev server the client component never hydrates, the
HMR socket fails its handshake, and the page sits on its loading state
forever with no error. Every frame here is from a production build. Said
here because the next run will otherwise lose the same twenty minutes.
