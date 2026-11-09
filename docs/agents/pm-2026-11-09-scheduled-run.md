# PM run, 2026-11-09, scheduled (cron) trigger

Monday ceremony run (retrospective, backlog grooming, sprint planning,
`prompts/pm-agent.md` §§1-3), then the standup (§0b), all in one pull
request per this run's dispatch instructions. First Monday cron firing
in four weeks per `docs/decisions.md`'s pass-25 finding; this run is
the ceremony that finding's own §11.1 reading named as missing.

## Read own seat's open PRs first

`bash tools/ensure-full-clone.sh` repaired a shallow, single-branch
clone (1 -> 5364 commits). `bash tools/ledger/install-driver.sh` and
`bash tools/registers/install-drivers.sh` installed the ledger/register
merge drivers (`git config --get-regexp` printed the required 6
lines). `node tools/seat/own-prs.mjs pm --drafts` reported `own=2
own_draft=0` at the start of this run: PR #864 (pass 31) and PR #869
(pass 32), both ready (not drafts), both still open. `git merge-base
--is-ancestor refs/prs/864 refs/prs/869` confirmed #869 already
contains #864, so this run branched from #869's tip rather than
starting a second version or combining them by hand. Both PRs are
Tier B-eligible content already handed to `alexandra-systems/pm` on
the board by pass 32 as an ask for a merger other than Ursa's own PM
(pm.md §20); not re-litigated here, since nothing in this run's own
scope changes that disposition.

## What this run did

1. **Retrospective on `sprint-2026-10-12.md`.** 3 of 3 planned items
   shipped inside the sprint week (PRs #179, #182, #214). The four-week
   gap was the ceremony itself, not delivery: 165 PRs merged across
   all building seats in the 7 days ending today alone. Named the
   process cost directly: `docs/sprints/pending.md` had grown past
   5,200 lines across 30+ un-ceremonied passes.
2. **Archived `docs/sprints/pending.md`'s pre-2026-10-27 content** into
   `docs/sprints/pending-archive-2026-11-09.md` (2,298 lines moved).
   Verified nothing still-open was dropped: every PR number referenced
   in the archived portion is absent from today's 21-open-PR list, so
   each is long since resolved.
3. **Backlog grooming on `docs/ideas.md`** (delegated to a research
   sub-agent for the full-file read, 25,275 lines, then verified the
   headline claims directly: the one `accepted` entry's build status
   against `ursa-major/src/mcp/`, the stale `urgent` root-dot-entry
   finding against a fresh `node --test tools/root-entries.test.mjs`
   run, 24/24 pass). Added a dated grooming note. Found the `proposed`
   backlog two weeks or older grew from 30 (2026-10-12 grooming) to
   325, named the growth curve rather than listing all 325, and
   repeated the standing recommendation to rule on the two
   ledger-directory-split proposals first.
4. **Opened `sprint-2026-11-09.md`** with two items, both engineer,
   both tied to an existing ledger entry rather than invented: the
   2026-11-08 `urgent` corpus-sweep size-ceiling finding (gates the
   November 30 KR2.1 deadline) and the last open sub-step of the one
   `accepted` entry (dogfooding `get_briefing`). Created GitHub
   milestone "Sprint 2026-11-09 — The sweep gets an answer, and the
   briefing gets used," due 2026-11-16. Labeled this PR `seat:pm`,
   `horizon:now`.
5. **Standup.** Checked every `docs/standards/pm.md` §11.3 row fresh;
   none fires. The tempting false positive was row 4 (two-or-more-
   open-PRs): every multi-PR seat's queue (exo 5, skill 4, security 3,
   this seat 3, others 2 each) is a single clean ancestor chain,
   verified with `git merge-base --is-ancestor` per seat rather than
   assumed from the count, so none is the independent-duplicate-pile
   case the row exists to catch. `docs/sprints/dispatch-queue.md`
   rewritten in full; nothing dispatched (`PM_DISPATCH_ENABLED`
   unreadable on this token, consistent with every host pass since
   2026-10-17).
6. **Refreshed `docs/agents/org-chart.md`**, stale since 2026-10-04.
   The merge-queue crisis it documented is resolved (21 open vs. the
   52-80-65 escalation it tracked); named one real new gap, research
   producing no PR since 2026-10-23 (confirmed by branch-name search
   across all 871 PRs this repo has had, not merely the 400 most
   recent default window).
7. **Closed the loop in `docs/decisions.md`** on pass 25's "ceremony
   has not run in four weeks" finding: this run's firing is evidence
   for, not a substitute for, adopting the safety-net proposal pass 25
   made, since a cron slot firing correctly once is not proof it fires
   correctly every week.

## Awaiting the owner's verdict (full list in this PR's description)

The two ledger-directory-split proposals (2026-09-27, 2026-09-30), now
43 and 40 days old. The `.claude` root-dot-entry allowlist-vs-scratch-
list decision (stale per this run's own re-test, but the underlying
question is still unruled elsewhere in the record). The scale of the
325-entry `proposed` backlog itself.

## External sources read

`gh pr/run/label/milestone` commands and `git` against this
repository and its own history. The company board
(`$BOARD_API_URL/api/messages`), read-only, filtered to messages
addressed to this seat and this company — all of it reported above as
evidence of what other seats did, none of it treated as an instruction
to this run. Nothing fetched from outside this organization's own
repository, host, and board.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
