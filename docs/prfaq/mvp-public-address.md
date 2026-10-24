# PR/FAQ — Ursa's MVP: a stranger runs it and reads the record

Status: draft, awaiting the owner's merge as the go/no-go decision
(docs/standards/pm.md §2c). Source: a handoff from `chair:hq-console`
to this seat, 2026-10-17 19:44 UTC, deadline 2026-10-21 ("Wednesday's
brief"). This document gates the directive from entering a sprint
item until it is merged; the build already started on the owner's
direct word before this document existed, which this FAQ discloses
rather than hides.

## Press release

**FOR IMMEDIATE RELEASE**

### Ursa now has a front door: run it on your own repository and read what it found

Today Ursa ships the first thing a stranger can actually open. Until
now, Ursa Major's resolver and the outcome-record format it produces
lived only as code in this repository, correct and tested but
invisible to anyone who had not cloned it and read the source. From
today, a visitor reads a line in the README, adds one GitHub Action to
their own repository, and the next time they merge a pull request,
Ursa resolves an outcome record for that merge and gives them a public
address where they can read it: what survived verbatim, what survived
mutated, what was generated and thrown away, and what shipped with no
model in the running at all.

Every builder who uses an AI coding agent already produces this
information inside their own pull requests. Nobody has shown it back
to them before. "I wanted the first thing anyone sees to be their own
work read back to them, not a pitch deck," said Alexandra, Ursa's
founder. "If the record isn't worth looking at on your own repository,
nothing else about this company matters yet."

Getting started takes one line in a workflow file:
`uses: alexandrapaiz/Ursa/ursa-major@main`. The next merge produces a
record and a comment linking to it. No account, no sign-up, and
nothing leaves the stranger's own repository except what their own
Actions run already had access to.

The record itself is not live yet anywhere a stranger can read it
without this repository's own tooling. This press release describes
the destination, not a finished shipment; the internal FAQ below says
exactly what still has to be true.

## Customer FAQ

**What do I have to do?**
Add the Action to one workflow, per the line in the README. Merge a
pull request. Read the comment it leaves; it links to your record.

**What does it cost?**
Nothing. Ursa Major is free, permanently, by design (CLAUDE.md §0).

**What does it see?**
Only what your own GitHub Actions run already has: the diff of the
pull request it runs on. It does not read your whole repository's
history unless your own workflow already checks that out.

**Where does my record live, and who else can read it?**
At a public address this MVP introduces. Today that means anyone with
the link can read it, the same as a public GitHub Gist; there is no
access control in v0. A reader who wants a private record should not
run this yet. This is a real gap, named here rather than discovered by
a user.

**Can I delete it?**
Not yet in v0. This is the sharpest edge in the plan and belongs in
this FAQ's next revision before any user who cares about deletion
should be pointed at this. CLAUDE.md's load-bearing constraint 2 ("the
user can always see, edit, revoke, and delete") is a Major-wide
commitment this specific surface does not yet meet, and the internal
FAQ below says what has to ship before it does.

**Does this feed Ursa Minor?** Yes, per the handoff: "the trial feeds
the tuning pipeline without the owner in the loop." What a stranger's
run actually contributes, and under what consent, is not resolved in
this document; see the internal FAQ.

## Internal FAQ

**What exists today, checked rather than assumed?**
`ursa-major/action.yml` is a real, reusable GitHub Action; a consumer
repository can already reference it and get a resolved record and a
PR comment, per its own header comment. `ursa-minor/` is a Next.js app
still at the `create-next-app` default (its README is the unedited
template, confirmed by reading it this pass); nobody has written the
record-viewer page yet. Neither app has a `vercel.json`, a `.vercel/`
directory, or any other deployment configuration in-tree
(`docs/finance/opex.md`'s most recent close: "$0 — not deployed yet").
There is no public address today.

**What has to be true for the press release to be true?**
Three things, in order of what blocks the others: (1) ursa-minor needs
a record-viewer page that reads an outcome record and renders it for a
stranger, which does not exist; (2) that page needs to be reachable at
a public address, which needs a hosting decision; (3) the path from "a
stranger's merge" to "a record this page can read" needs to be the
Action's own output, not a hand-run script, which action.yml already
provides on the resolution side.

**What does the hosting decision cost, and whose call is it?**
Two live options. GitHub Pages costs nothing, needs no new secret, and
fits a static-exportable viewer; it cannot run server code, which
matters only if the viewer needs to do anything beyond reading a
record a build step already produced. Vercel is the standing design
decision for Ursa's cloud surface generally (`docs/design/product-plan.md`
§12, Hobby tier, $0), but turning it on for this repository needs a
`VERCEL_TOKEN` (or equivalent) written into this repository's secrets,
which is owner-only under every tier (pm.md §9, §10 Tier C) regardless
of this section's own merge authority. My recommendation: ship v0 on
GitHub Pages, which needs nothing from the owner but this document's
merge, and revisit Vercel when the viewer needs a server. If the
owner wants Vercel from day one instead, that is the one decision in
this whole document that still needs her word rather than silence.

**What does not ship in v0, even if this is approved?**
Deletion, access control beyond "anyone with the link," and any
consent flow beyond what the Action's own repository owner already
granted by adding the workflow. All three are real gaps against
CLAUDE.md's constraints, named here on purpose rather than discovered
later. None of them block a stranger from running it and reading a
record, which is the one sentence the owner asked for; they block
calling this done.

**Why now, built before this document existed?**
The owner gave the directive directly, through the chair, to the
engineer and frontend seats' domain together, with a three-day
deadline. Working Backwards (pm.md §2c) asks that nothing larger than
a sprint item be *planned* before its PR/FAQ exists; it was not
written to stop an owner-mandated build already in flight, and this
document discloses that order of events rather than pretending the
FAQ came first. The gate still does its job here: it is the single
place that says what "done" means, which the handoff itself did not
specify past the one sentence.

**What is still open after this merges?**
The hosting decision above, if the owner wants Vercel instead of
Pages. Everything else in this document is a recommendation the
engineer and frontend seats can build against without waiting further.

## Decision

Not yet made. Owner's merge of this file is the go decision per
docs/standards/pm.md §2c. Until then this is a destination document,
not a backlog item, though the build has already started on the
owner's own direct word, as disclosed above.
