# The tuning dashboard, and the capture panel's markup

Status: dashboard built and verified, 2026-10-24 (sixth run). The panel
half of the board item turned out to be already built and wired. The
full account, with every measurement, is
`docs/design/reviews/2026-10-24g/README.md`.

Board item, frontend lane: "Dashboard and panel markup from the four
frozen artboards." This file is the design note for it.

## What the card asked for, and where each part actually stands

The PM's own comment on the card asked whoever resumed it to re-check it
against the default branch first rather than trusting it. That check is
the first thing the sixth run did, and the card was stale in both
directions.

- **A dashboard showing tuning units with evidence counts and survival
  bars.** Built this run, at `/dashboard` in `ursa-major/overlay/`,
  reading `http://127.0.0.1:7818/store`.
- **Editing and revocation, with tombstones rather than deletions.**
  Tombstones are shown, under their own heading and struck, because the
  receipt is the only thing that lets a revocation be believed rather
  than taken on faith. Revocation itself cannot be performed from a web
  surface: `ursa-major/src/serve.ts` is a reader by design and every
  route on it is a GET. The page therefore discloses
  `ursa consent revoke-axiom`, which is the door that does exist, and
  draws no control that cannot work. **Editing has no door anywhere**,
  which is a gap against a constraint `CLAUDE.md` calls load-bearing and
  is routed to the engineer rather than designed around.
- **The tension review that asks instead of averaging.** Built. Both
  sides of a contradiction are shown whole, with no resolution offered
  and no average taken, and the only thing on offer is the way to
  withdraw either one.
- **The capture panel's markup, built alongside rather than after.**
  Already exists as `ursa-major/overlay/app/page.tsx` and is already
  wired to the bridge. The engineer seat built the markup together with
  the wiring, so the ordering this card worried about did not arise.
- **Served by the command-line tool against the store the resolver
  writes, so it is a real local app and not a static mock.** The serving
  half shipped while this card sat. Every figure in every frame of the
  review comes from twelve real outcome records the resolver wrote over
  this repository's own history. The one fixture, and why, is §2 there.

## What is still open

- The four artboards the card names are still nowhere in this
  repository, so the visual specification remains the design system plus
  the surfaces that already exist.
- Ursa Major now has two web surfaces drawn in two identities. Measured
  in §7 of the review and recorded as an owner question in the ledger,
  deliberately not resolved by this seat, because the panel's three
  extra hues carry meaning the two-light palette cannot currently say.
- Where the dashboard should live permanently. It is a route in the
  overlay app because that app is already Ursa Major's local-facing Next
  surface, which made it the smallest safe diff. `ursa serve` passes no
  `allowOrigins`, so only a locally served copy can read the store.
