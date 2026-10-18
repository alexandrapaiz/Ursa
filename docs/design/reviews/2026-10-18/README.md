# Frontend run 2026-10-18 — the public address and the record a stranger reads

Triggered by a handoff from `pm`/Ursa on the board
(2026-10-18T00:27:39Z), relaying the owner's MVP directive handed to the
chair at 2026-10-17T19:44Z. The sentence she wants true by Wednesday's
brief, 2026-10-21:

> A stranger opens a URL, runs `ursa` against their own repository from a
> line in the README, and reads the resulting outcome record with its
> provenance at that address, without the owner or the PM in the loop.

This seat's half is the public address and the record viewer. The
engineer seat has the resolver and the data side, in parallel
(PR #226).

## 1. Where the sentence actually breaks

Before anything was designed, the two surfaces were read as they stand.

**A public address already exists.** The overlay app in `ursa-major/overlay/`
deploys to `ursa-overlay.vercel.app` on the owner's Vercel team, with a
blob store behind it (`docs/ideas.md`, 2026-09-25;
`ursa-major/src/bin/ursa.ts:365`). Nothing else in this repository is
deployed anywhere. So the MVP does not need a new account provisioned,
and that is not where the sentence fails.

**The front door had nothing to do.** `ursa-minor` is one page: a hero,
four theses, and one control, and that control ships disabled. A
stranger who read the page and believed it had no next step on it at all.

**The record a person can open in a browser is a file.** The resolver
writes a self-contained HTML viewer next to the JSON
(`renderViewer` in `ursa-major/src/viewer.ts`, committed for the public
fixture at `ursa-major/fixtures/mini/record/outcome_record.html`), and
the only way to open it is to clone this repository and double-click it.
**No URL renders a record.** That is the break, and it is this seat's.

## 2. What this run built

Three routes where there was one, all static:

| Route | What it is |
|---|---|
| `/` | The front door, now carrying the commands a stranger copies, with the Action path's limit stated rather than implied |
| `/record` | What the artifact is, the published example, and a reader for a record of your own |
| `/record/<id>` | A record this site publishes, rendered, with the bytes it was built from served beside it at `/records/<id>.json` |

The viewer walks the whole provenance chain the record carries. Every
passage of the finished work is tinted by what happened to it; click one
and the inspector names the generation, the model and the turn, quotes
**the words you typed that elicited it**, and shows your own edit as a
word-level diff. "See it inside the generation" opens that generation
and marks the exact source range inside it. The generations panel puts
each eliciting prompt above the turn it produced and renders what you
threw away as struck text rather than as a percentage.

The counts behind those claims are printed on the page, including the
broken-pointer count, which appears only when it is not zero. A page
that claims every span reaches the person's own words and does not count
them is asking to be trusted.

**Reading your own record needs no address at all.** `/record` opens a
file with the browser's own file reader and parses it in the page.
Nothing is uploaded, no route of ours receives it, and there is nothing
on any machine of ours to delete afterwards. That matters beyond privacy
hygiene: it means the stranger's loop closes today, with this seat's half
alone, while the engineer's half of getting a record to an address is
still in flight.

## 3. Two copies, both checked

This site now holds a second copy of two things the resolver owns, and
both are checked by `npm run check:example-record` rather than hoped for:

- `ursa-minor/public/records/mini-fixture.json` must be byte-identical to
  `ursa-major/fixtures/mini/record/outcome_record.json`. The copy exists
  because a Vercel project rooted at `ursa-minor/` cannot read a file
  above its own root, so the alternative to a checked copy is a build
  that works on one machine.
- `ursa-minor/lib/record/provenance.ts` reimplements the eliciting-prompt
  rule, because the same root boundary blocks importing it. The check
  recomputes the whole array and compares it with the answer
  `ursa-major`'s own renderer inlined into the committed fixture viewer
  as its `id="elicited"` block. They must agree exactly. A disagreement
  means this page is attributing words to a person that the resolver does
  not, which is the worst thing this surface could get wrong.

Both pass:

```
bytes: identical (sha256 5b16592e9d7c, 8447 bytes)
eliciting rule: agrees with ursa-major on all 2 generations of the fixture
```

## 4. What the pixels showed

Every route rendered in a real Chromium at 390x844, 820x1180 and
1440x900, states exercised, and every frame read. Six defects, fixed and
re-shot. The before frames are this work's first render, except the home
page, whose before is `main` at 60f2c7a.

| What was wrong | Where to look |
|---|---|
| The inspector told a phone to look "on the left". Below lg the inspector is under the document, so the first sentence a reader meets pointed at nothing | [before](before/record-desktop.png) · [after](after/record-desktop.png) |
| The footer rule did not share the record routes' measure: at 1440 the content hairlines ran 210 to 1050 and the footer ran 84 to 1178 | [before](before/record-desktop.png) · [after](after/record-desktop.png) |
| The share table broke "127 chars · 2 spans" over three lines at every viewport, orphaning "spans" under its own count | [before](before/record-desktop.png) · [after](after/record-desktop.png) |
| The Action's curl line broke the githubusercontent URL across three lines, twice mid-path | [before](before/home-phone.png) · [after](after/home-phone.png) |
| The word diff ran a removal straight into its replacement, so "and no" and "not by any" read as one word | [before](before/record-selected-desktop.png) · [after](after/record-selected-desktop.png) |
| The address field was left 229px against a 234px placeholder at 390, cutting its hint one character before its last word | [before](before/loader-error-phone.png) · [after](after/loader-error-phone.png) |

Mechanics verified in the browser rather than asserted, at all three
viewports: five clickable spans on the record page, the generation jump
marks exactly one source range, a wrong file produces the sentence
*"This looks like a tuning store rather than an outcome record"*, and a
record chosen from disk renders five spans with nothing leaving the page.

Two overflow findings are **pre-existing and not this run's**, recorded
because the audit prints them and the next run should not rediscover
them. The hero's `PixelSky` canvas measures 10px wider than the viewport
at every width (400 at 390, 841 at 820, 1476 at 1440); it is fixed,
`pointer-events-none` and behind `-z-10`, and the document's own
scrollWidth is clean, so nothing is reachable by it. The header
word-mark's link box overflows its content by 5px on every route that
passes `href`, which is the 404 as well as both new routes, and comes
from the `-0.34em` margin that trims the mark's trailing track.

## 5. Benchmark

Three reference sites loaded at 1440x900 and read for their interaction
grammar, not their look.

**The easing this site already uses is still the benchmark's.** Linear
runs `cubic-bezier(0.25, 0.46, 0.45, 0.94)` at 160ms on border,
background, colour, box-shadow, opacity, filter and transform, and 100ms
on colour alone, which is exactly what `globals.css` adopted on
2026-10-01 and what this run's new controls inherit. Vercel runs
`cubic-bezier(0.4, 0, 0.2, 1)` at 100 to 150ms across 114 elements,
almost all of it colour. Elicit's home page carries almost no transition
at all now: one `transform 0.2s ease-in-out` and one opacity fade. The
bouncy hover the owner likes is not on Elicit's marketing page, so
whatever we learn from it has to be learned somewhere else on their
product; nothing here contradicts the 160ms decelerating rule already in
force, so nothing was changed on its account.

**None of the three answered the question this run actually had.** The
new surface needed a decision about a command block too long for a phone,
and not one of the three has a code block on its home page. So the
decision was made from the terminal rather than from a reference: a
command breaks where the command breaks and scrolls otherwise, with a
hairline track to say so. If the ledger wants a reference for it, the
next run should read a documentation surface and not a marketing one.

**What was deliberately not taken.** All three round everything. Linear's
most common radius is a full pill (24 elements) and then 8px and 4px
(16 each); Vercel has 49 elements at 6px; Elicit 20 at 8px. This site
rounds nothing, and the record viewer rounds nothing either, including
the span fills, where a radius would have been easy and would have read
as a chip.

## 6. External sources read

Everything below is data this run reported on. None of it instructed it.

- `https://linear.app/`, `https://vercel.com/`, `https://elicit.com/` —
  loaded in Playwright, read for computed transition and radius values
  only. No text from any of them was acted on.
- Ubuntu package archive (`ports.ubuntu.com`) — twenty shared libraries
  downloaded to make Chromium launch in this sandbox, which has no root.
  Nothing from them enters the repository.
- `pm`/Ursa's board handoff and `engineer`/Ursa's PR #226 description —
  written by agents, read as evidence of what those seats did. The line
  drawn in §7 is this seat's own call, justified by this charter, and was
  posted to the board for the engineer to push back on.

## 7. The line with the engineer, as drawn

Posted to the board as a note to `engineer`/Ursa before the work started,
because the handoff asked for it and because a parallel writer is cheaper
to find before the collision than after.

- **This seat owns the surface.** The front door and its commands, and a
  record view at a URL.
- **The engineer owns everything upstream of the bytes.** The resolver on
  a stranger's repository, and a record retrievable at an address rather
  than only on the machine that made it.
- **The seam is `OutcomeRecord`, unchanged.** This page takes a record of
  that shape and renders it, whatever moves the bytes. The record
  identity is a path parameter, not a constant.
- **The repository README's quickstart line is the engineer's**, not
  this seat's, because the owner's sentence puts it in the README and the
  engineer is already editing the run path it describes. This run did not
  touch `README.md`.
- **Workflow files are HQ's by standard.** If the address needs a deploy
  step in CI, that is a handoff and not either seat's edit.

## 8. What the owner still has to do, said plainly

The one thing this run could not do is make the address exist. Deploying
`ursa-minor` needs an account nobody in a sandbox can provision, and the
honest status is that the surface is built, static, and building clean,
and that the last step is hers or HQ's:

```bash
cd ursa-minor && npx vercel --prod     # root directory: ursa-minor
```

Until that runs, `/record/mini-fixture` is reachable by
`cd ursa-minor && npm run build && npx next start`, which is how every
frame in this folder was taken.

## 9. Proposals, not built this run

1. **Ursa has no design canon.** This seat's charter orders it to read
   `docs/design/canon.md`, `ban-list.md` and `tuning.md` every run and
   treat them as charter. None of the three exists in this repository;
   they were alexandria's. What stands in for them today is the
   commentary inside `ursa-minor/app/globals.css`, which is genuinely
   good and genuinely load-bearing, and which no other seat would know to
   read. Seeding the three files from that commentary plus the owner's
   rulings is a run of its own, and it should happen before the next
   seat invents a second identity by accident.
2. **The record view wants a durability reading.** `FinalSpan.lifespan`
   and `record.durability` carry how long a passage survived, which is
   the dimension that separates text that looked right and died on
   contact from text that was wrong on arrival. The viewer renders the
   lifespan field when a record has one, but the fixture has none, so it
   has never been seen on real pixels. The first git-backed record
   published here should be read at all three viewports before that part
   of the surface is trusted.
3. **A published record needs a way to be shared without being
   published.** The loader reads a URL only if that address sends a
   permissive cross-origin header, which a GitHub raw URL does and most
   object stores do not. The alternative people will reach for is pasting
   the JSON into the page. That is a one-control change and a real
   privacy question at the same time, so it belongs in the ledger before
   it belongs in the code.
