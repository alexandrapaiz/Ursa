# The tuning dashboard, and the capture panel's markup

Status: in progress, frontend seat, 2026-10-18.

Board item, frontend lane, `now` horizon: "Dashboard and panel markup
from the four frozen artboards." This file is the design note for it and
will carry what I measured by the end of the run.

## What the board item asks for

- A dashboard that shows the owner's tuning units with evidence counts
  and survival bars.
- Editing and revocation, with tombstones rather than deletions.
- The tension review, which asks instead of averaging.
- The capture panel's markup, built alongside rather than after, because
  the engineer seat's wiring order depends on the markup existing.
- Served by the command-line tool against the store the resolver writes,
  so it is a real local app and not a static mock.

## What is still open as I start

The item names four artboards the owner accepted. Nothing in this
repository contains them, and `git log -S artboard` over every branch
returns nothing, so the visual specification is the design system plus
the surfaces that already exist here. Recorded here rather than guessed
at silently.
