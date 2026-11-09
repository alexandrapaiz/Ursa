# engineer run — 2026-11-08 (scheduled, second window)

- Trigger: cron. Branch `ursa-engineer/2026-11-08-scheduled`, pull request
  #742. The run crossed midnight UTC into 2026-11-09 while working; the
  branch and the ledger entries keep the 2026-11-08 date of the slot that
  fired them, which is the date the measurements carry.

## Own open pull requests, read first (org rule, 2026-10-04)

One: `#739`, this seat's earlier window today, on
`ursa-engineer/2026-11-08-hook`. **Not a draft** and not abandoned, so
there was nothing to resolve under "Ready it, or hand it over in
writing". Per the charter's rule that an open pull request of this seat
is built on rather than reimplemented, it was merged into this branch at
its tip before any work started, because both branches append to
`docs/ideas.md`. The owner then merged it to `main` at 23:47Z, together
with the exo seat's `#743`, and `origin/main` was merged into this branch
after that. So this pull request no longer subsumes #739; it sits on top
of it.

No other open draft belongs to this seat.

## Observe

- **Sprint.** The newest file in `docs/sprints/` is
  `sprint-2026-10-12.md`, 27 days old, and both of its `engineer` items
  are shipped on `main` (verified by this seat's earlier window today and
  not re-litigated). Item 3 is the security seat's. The sprint's engineer
  lane is empty, so the charter's fallback order applies.
- **Fallback, first branch: `accepted` entries no sprint picked up.** One
  exists, "Agentic-forward: Ursa as the agents' HQ", and its first step is
  built (`ursa-major/src/hq/`, `ursa-major/src/mcp/`). Nothing in it is
  this seat's to take today.
- **Break-fix sweep.** `node scripts/ci-checks.mjs` over all 16 checks:
  14 passed, 1 unrunnable (clone integrity, because the clone this run was
  handed had **7 commits**; repaired below), 1 failed. The failure was
  `tooling-suites`, one case of 996, "a run that could not check the
  product exits 2 and says so, end to end" in
  `scripts/ci-checks.test.mjs`. It was **this run's own doing**: the test
  nests `ci-checks --only=product-suites`, which was red because an edit
  to `ursa-major/src/bin/ursa.ts` had not yet been followed by
  `npm run regen`, so the two bundle-staleness suites were failing.
  Confirmed by stashing the edit, re-running the two suites (23 passed),
  and restoring it. **Nothing was broken on `main`**, so no break-fix
  outranked the day's work. `tools/ledger/recheck-urgent.mjs`, which this
  seat's earlier window built, reports 19 `urgent` entries with **0 still
  failing a probe they name**.
- **Pipeline health.** No Modal in this repository and no `modal` CLI on
  the host, so that Observe step does not apply; `scripts/ci-checks.mjs`
  is the equivalent and was run as above.
- **Queue.** Three other open pull requests touch `docs/ideas.md`: `#725`
  (market), `#711` and `#700` (both skill). Named in the pull request
  description with the merge order.

## Orient and decide

`docs/okrs/2026-q4.md` KR1.3 is `at-risk` and gates KR2.1, which is due
2026-11-30. Nothing in the repository could say where KR1.3 stood,
because every launch reports one work unit at a time. Worse, the claim
`README.md` makes in its n=3 row — that the owner's corrections are in
the pull requests she merged, which is the pull-request path's job — is a
claim about 358 merged pull requests that had been checked against one,
#645, which produces three records over one file and zero edited
characters. Read alone, #645 says the claim is false.

So the day's work is the corpus: the unit at which that claim can be
checked at all.

## Act

Built `ursa corpus`, ran it, and reported what it found. The figures,
the correction it recovered in full, and the defect the larger sweep
exposed are in `docs/design/corpus-sweep.md` and in the pull request
description. Three ledger entries and the craft scan are appended to
`docs/ideas.md`; one entry is `urgent`.
