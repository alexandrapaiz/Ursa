# Frontend visual review — 2026-10-01

Run under `prompts/frontend-agent.md`. Surface: the Ursa Minor site
(`ursa-minor/`, Next.js 16). `ursa-major/` is a CLI and has no frontend
of its own.

Draft opened before the work, per the ship-first rule in the charter and
`docs/standards/pm.md` §8. Findings, fixes, benchmark notes and the
evidence index land here as the run proceeds.

## Branch survey (L-E10)

The frontend lane had three open pull requests and nothing merged:

- **#15** `fe/2026-09-24-visual-review` — contrast fix, identity 404, tablet alignment
- **#35** `fe/2026-09-28-visual-review-polish` — contrast, typography, wrap fixes, scroll cue, CTA craft
- **#51** `ursa-frontend/2026-09-30-window` — carried #15 into #35, captured a before set, then stopped

This branch starts from #51's head, so the whole line merges as one
branch. Nothing here is a reimplementation of work already sitting in
those branches.
