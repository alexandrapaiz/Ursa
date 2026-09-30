# Frontend visual review — 2026-09-30

Status: in progress. This file is written as the run proceeds.

## Why this branch is stacked on the FE line

Before building anything, this run surveyed the open pull requests (L-E10).
Two frontend pull requests are open and neither has merged: #15
(fe/2026-09-24-visual-review) and #35 (fe/2026-09-28-visual-review-polish).
Both edit `ursa-minor/app/page.tsx` and `ursa-minor/app/globals.css`, and they
conflict with each other. A third branch cut from `main` would have rediscovered
the same defects those two already fixed and produced a third conflicting
version of the same two files.

So this branch starts from #35, brings #15 forward into it, and then does
today's run on top. Merging this one branch lands the whole frontend line in
order.
