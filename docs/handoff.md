# Ursa handoff, 2026-11-19

For the owner and for whichever session picks Ursa up next. Read this first,
then `CLAUDE.md` §0 and `docs/vision.md`. Everything here was checked against
the repository and the live sites on 2026-11-19.

## What Ursa is

**Turn AI peer-to-peer.** Ursa Major imports your tuning into every model.
Ursa Minor trains models on the world's dispersed knowledge. Major is free
and has to be genuinely useful on its own; Minor sells the consented,
cross-model, revealed-preference signal Major's existence produces.

The core idea, in the owner's words (2026-09-30): what a user does when they
correct an AI is unpaid fine-tuning. Ursa picks that tuning up and gives it
back to the user as a portable memory of their preferences that every model
can read. The signal is the trace (what the model wrote, what survived, what
the person changed), never a label someone typed.

The word is **tuning**, never "taste" (vocabulary decision of 2026-09-20).

## Where everything is

| What | Where |
|---|---|
| Repository | `github.com/alexandrapaiz/Ursa`, public. Personal account `alexandrapaiz`, never `alexandrapaiz-pdc` |
| Local checkout | `~/Documents/Alexandra Programming/Ursa` (see "Before anything" below: it is far behind) |
| The product code | `ursa-major/` (TypeScript, vitest). Entry point `ursa-major/src/bin/ursa.ts` |
| The landing page | `ursa-minor/` in this repo, live at https://ursa-minor-site-sigma.vercel.app |
| The overlay (encrypted sync) | https://ursa-overlay.vercel.app, Vercel team `alexandrapd` (ALEX), project `ursa-overlay` |
| Raw trial records | private repo `alexandrapaiz/ursa-private`; never commit raw records to this public repo |
| Plan of record | `docs/design/product-plan.md` |
| Methods position | `docs/beyond-preference-pairs.md` |
| Decisions | `docs/decisions.md` |
| Frozen design | the four surface artboards the owner accepted on 2026-10-05; they are the spec for the dashboard and the panel |

## What is built and runs

From `ursa-major/` after `npm install` (the README's "What is built" section
is the long form):

```bash
npx tsx src/bin/ursa.ts run <repo> --declare unsatisfied   # resolve a repo's history into outcome records under <repo>/.ursa/
npx tsx src/bin/ursa.ts pr <repo> --pr <n>                  # resolve one pull request
npx tsx src/bin/ursa.ts corpus <repo> --prs 700-710          # many pull requests read as one corpus
npx tsx src/bin/ursa.ts publish <repo>                       # show what would go public, then --out ./site --yes
npx tsx src/bin/ursa.ts address <repo>                       # the public address of one record
npx tsx src/tuning/cli.ts distill --record <record.json>     # distil corrections into tuning units (runs on your own Claude)
```

Also in place: the GitHub Action (`ursa-major/action.yml`, bundled into
`dist/ursa.cjs`; rebuild with the bundle and regen scripts after any edit
under `src/`), the bridge to the overlay (`ursa bridge`, passphrase-encrypted,
server holds ciphertext only), an MCP server (`npm run mcp`), the local store
server the dashboard reads, and an invariants gate with violation fixtures.

Acceptance is **declaration-only**: a record is satisfied or unsatisfied only
when the owner says so (`--declare`). Retention is never read as approval.

## Honest state of the product

- **The last product-shaped sprint was 2026-10-12.** Since then the seats
  spent most of their effort on the machinery around the product (gates,
  ledgers, checks on checks). Real progress in that time: the repository
  publishes its own outcome records, the dashboard and panel were marked up
  from the frozen artboards, the store server joins the resolver and the
  dashboard, every page was checked on narrow phones, and a person read every
  claim in every skill against its source.
- **The definition of done the owner set on 2026-10-05 has not been
  walked end to end:** one install; the dashboard shows her real tuning;
  a chat is captured in the panel; a resolver run lands in the same store;
  a verdict is collected in her own words. Nobody has checked all five in a
  row, so treat each as unproven until it has been seen working.
- **The public address in the README does not resolve yet:**
  `https://alexandrapaiz.github.io/Ursa/` answers 404 (GitHub Pages is not
  serving it). The per-record raw URLs are the working public path today.
- **About twenty open pull requests from the seats** (all dated 2026-11-09),
  mostly "opening, no work yet" drafts and PM pass reports. None is product
  work worth keeping as is; read the titles and close them.

## The seats are off, on purpose

Ursa's eleven agent seats ran on the owner's Oracle host through the
Alexandra Systems event bus, on her **personal Claude subscription**. From
mid-October to 2026-11-10 they spent every weekly limit within hours of its
reset (measured: 2,208 working runs, 184,736 turns, 124 million output
tokens), so she could not use Claude for three weeks. The host daemon is now
masked and the reset job is off.

**Do not restart them.** If seats ever run again it is on a budget that is
not hers (Kimi or a separate API key with a hard cap), with wakes only on
asks, handoffs and failures (never on notes), turn caps around 40 that seats
cannot raise, and Sonnet or Kimi by default. Until then, Ursa is built in an
interactive session, by her or with her.

## Rules that hold

- GitHub: `gh auth switch -u alexandrapaiz` before any push, pull request or
  merge. Another tool sometimes switches to the work account.
- Never point an agent, workflow or daemon at her Claude account.
- No recurring jobs (crons, schedules, launch agents) without her explicit
  approval; weekly at most.
- Secrets live in Infisical by name and never appear in a terminal, log or
  chat. The way to add one: she clicks copy in her own Chrome, the session
  runs `tools/secrets.sh infisical-clip NAME` from the Alexandra Systems repo.
- Deploys: Vercel team `alexandrapd`, `vercel --prod --yes --scope alexandrapd`
  from the project folder.
- Prose for her: one thought per line, plain sentences, no em dashes, no
  marketing register. Design: she decides, the artboards are frozen, never add
  explanatory subtitles under headings.
- She rejected: an ambient daemon or chat-reading watcher (Ursa is
  launch-based, git is the interface), "trust layer" as the mission,
  "taste", inferred acceptance.

## Before anything

The local checkout is on an old branch (`chair/langfuse-traces`) and about
2,500 commits behind main. Start fresh:

```bash
cd ~/Documents/"Alexandra Programming"/Ursa
git fetch origin && git switch main && git reset --hard origin/main
cd ursa-major && npm install && npm test
```

If the tests are red on main, that is the first thing to know.

## Suggested next steps, in order

1. **Close the stale seat pull requests** so the queue shows only real work.
2. **Walk the five-step definition of done on one of her real repositories**
   and write down, for each step, "works" or what breaks. That list is the
   real backlog; anything not on it waits.
3. **Make the public address resolve** (GitHub Pages for the records), so a
   stranger can open a record from the README.
4. **Pick the first broken step from (2) and fix it in the product**, not in
   the machinery around it.

## Open questions for the owner

- Which repository is the first real install: one of hers, or a stranger's?
- Is Fatima (`fatimamichelg`, admin on the repo) part of the next stretch, and on which half?
- When seats come back, which budget: Kimi (prepaid, about $38 left; the key on file was rejected on 2026-11-10 and needs replacing) or a capped API key?

## Surfaces session, 2026-11-19 (afternoon)

The owner finalized the four product surfaces in Magic Patterns and started porting them into the overlay app.
Read this section before touching `ursa-major/overlay`.

### Where things are

| What | Where |
|---|---|
| The design source | Magic Patterns OS `hRdJbZZZKBarz62jf715GB` (https://www.magicpatterns.com/os/hRdJbZZZKBarz62jf715GB) |
| The frozen artboards it came from | claude.ai artifact "Ursa Surfaces", https://claude.ai/artifact/Vj5jEG72MKmxn7ZzS6t2UV |
| The port, uncommitted | worktree `~/Documents/Alexandra Programming/Ursa-surfaces`, branch `surfaces/port-from-magic-patterns`, cut from `origin/main` at 4efed904 |
| The owner's original checkout | `~/Documents/Alexandra Programming/Ursa`, still on `chair/langfuse-traces`, untouched |

In the Magic Patterns OS, the Surfaces prototype holds the four real frames: Chrome Panel, PR Comment, Editor Hover and Tuning Dashboard.
Shared code is in `shared/surfaces/` (ui, PanelBody, AuroraWave, GlassCard3D, dashboardData).
Two option canvases sit beside it: Chrome Panel Options and Motion Options.
The six screenshot-built frames of the Ursa Minor site are still there for a later design-system pass.

### Design decisions the owner made today

The system is the Ursa Minor site's: its five colours, Helvetica body, Inter Tight 200 for display, Geist Mono for labels and data, one polar accent.
Two departures from the site, both her calls.
Rounded corners throughout the product surfaces, even though the site is square.
Motion only on a trigger. Everything is still at rest.

The Chrome panel is a collapsible floating window, Granola style, over the chat.
It is a pane of real glass rendered with three.js, with the aurora inside it.
It turns once when a capture or run starts and nods once when new data lands.

The aurora is a 3D raymarched one: thin curtains seen from the ground in perspective, green below and violet above.
She rejected every flat 2D version, because they read as mountains, strings or fingers.
On the dashboard it is revealed only in a spotlight around the pointer and fades when the pointer stops.
A reread sets off a three-second substorm.
It reaches down behind the content, and the content sits on frosted glass cards so the light shows through.
The dashboard sidebar is a floating rounded panel.

She rejected an aurora halo around the card's edge and a shimmer sweep on text.

### What the port contains

All of it is in `ursa-major/overlay`.

`app/page.tsx` is the capture panel. Its wiring is unchanged: passphrase, encrypted sync, run, verdict line and `misread?`. It now renders inside the glass card.
`app/dashboard/page.tsx` is the dashboard on the real `/store` payload, with four sections (tuning, records, tensions, exports) and a unit sheet.
`app/components/GlassCard.tsx` and `app/components/AuroraSky.tsx` are the glass and the sky.
`lib/aurora-shader.ts` is the shader both use.
`app/globals.css` and `app/dashboard/dashboard.css` are rewritten in plain CSS, because the overlay has no Tailwind.
The 44px press targets, focus rings, house spring and reduced-motion rules from the old stylesheets are kept.

New dependencies: `three` 0.187, `@react-three/fiber` 9 and `@react-three/drei` 10, the React 19 lines.
They add no audit findings, and `node scripts/dep-floor.mjs` holds.

### What was checked

Type-check and `next build` pass.
Both pages were viewed in a browser against the owner's real local store, served with `ursa serve`. It has 8 tuning units and 0 records, so the records view has not been seen with data.
Three bugs were found that way and fixed.
The three.js canvas stayed at the browser's default 300 by 150, and a resize kick after mount fixes it.
Additive blending squared the aurora's brightness. It now adds the colour scaled.
The sky clock started on a quiet stretch, so it now starts at 58.

### Left out on purpose

The design's `edit` action and the tension review's "this one is me" buttons are not drawn.
Neither has a door in the product, and `src/serve.ts` is read only.
The page shows the real command where those buttons would go.
The unit sheet has no evidence quotes, because the store payload does not carry them.

The editor hover and the PR comment are not ported.
There is no VS Code extension or comment UI in the repository for them to live in.

### Open items

1. Commit the port and open a pull request. The owner has not said yes yet. Run `gh auth switch -u alexandrapaiz` first.
2. `next` in the overlay carries a moderate advisory that was already on main. `next build` and `next dev` stop on a security reminder and continue when run again. Upgrading `next` is its own change.
3. The `asc-chair` MCP was down all session, so nothing was claimed or posted on the board.
4. The five-step definition of done from 2026-10-05 still has not been walked end to end.
