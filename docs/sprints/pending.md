# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.

Reconciled 2026-10-09, ~17:28 UTC (scheduled standup, pm.md §11). Built
on this seat's own #147 (open at the start of this pass, itself built
on #145 and current `main`) rather than redone from `main`, per "read
your own seat's open PRs first." A good deal of #147's content from
the ~00:30 and ~06:22 UTC passes is now stale — #142, #144 and #146
merged since, #92 and #145 closed — so this reconciliation is a fresh
read of current state, not a diff against the old text.

## Top three for the owner

1. **Skill's #140 is still the single highest-leverage merge waiting
   on you.** Checks are green, but it is `CONFLICTING` against `main`
   as of this pass (checked directly) and touches
   `prompts/skill-extract.md`, so it is Tier C and no PM route reaches
   it even once rebased. It absorbs five stuck runs' work (#14, #50,
   #64, #83, #123 — #50 and #64 already closed with a pointer here),
   fixes a drifted citation checker, and adds a guard against the
   drift recurring. Still open, still the right branch, nothing
   superseded it, but it needs a rebase from its own seat before
   anyone can merge it.
2. **This pass tried to dispatch security and frontend to close two
   sprint gaps and both attempts failed at the API call** (403,
   `actions: write` not honored for this run's token, even though the
   workflow file declares it — detail in `dispatch-queue.md`). That is
   a configuration gap for HQ, not a decision for you, but it means
   security's redaction-standard item (sprint-2026-10-05 item 3, gates
   O2 KR2.2) still has no PR touching it one day before the
   2026-10-11 milestone date, and the frontend WCAG contrast fix
   (proposed three passes running) still hasn't moved either.
3. **Three Tier C pull requests still wait on you directly**: #80
   (`company.yaml`), #48 and #39 (both touch `prompts/research-agent.md`
   or `prompts/engineer-agent.md`/`prompts/skill-agent.md`). All three
   are green and `MERGEABLE`, unchanged in substance since earlier
   passes flagged them, and no PM merge route reaches any of them.

## Failures this pass (§11.7)

**No new failed runs.** `gh run list --status failure --created
">=2026-10-08T17:28:57Z"` (the last 24 hours) returns the same three
runs the 00:30 UTC pass already triaged and logged: engineer
`37719675527` (older, already handled), pm-agent `37819090675`,
skill-agent `37832775208`, frontend-agent `37835424738`. All four
already carry a triage line in prior standup PRs (#135, #137, #144).
Nothing new to rerun or hand off.

**This pass's own fire attempts failed, not a scheduled run** — see
`dispatch-queue.md`. Handed to HQ as a workflow-permissions gap, not
logged here as a run failure since no run ever started.

## Resolved this pass

- **#92** (the resolver-Action board item, "Stage one of the
  surfaces"): checked directly — the branch itself closed unmerged,
  but `ursa-major/action.yml` has been on `main` since 2026-10-05,
  landed by #134 (2026-10-08), which subsumed #92, #126 and #130.
  Moved the board item from Review to Done and pointed its comment at
  #134 instead of the dead branch.
- **The HQ-engineer note about misrouted rebase handoffs** (board
  message, 2026-10-07T19:09, addressed to this seat): the PR it was
  about, #92, is closed and its content landed elsewhere (see above),
  so the underlying ask is moot. No further action; noted here so the
  next pass does not re-open it.
- **#145**: closed as superseded by this pass's own branch (#147,
  continued here), consistent with what #147 itself already said.

## My own open pull requests

This pass's own (continuing #147's branch, not opening a new one).
Nothing else of this seat's is open.

## Tier B merge check this pass

Every open, non-draft, mergeable PR was checked against §10 directly
this pass (`gh pr diff --name-only` on each): #140 (`prompts/
skill-extract.md`, Tier C, also `CONFLICTING`), #80 (`company.yaml`,
Tier C), #48 (`prompts/research-agent.md`, Tier C), #39
(`prompts/engineer-agent.md` and `prompts/skill-agent.md`, Tier C).
#75 is `CONFLICTING` and blocked regardless of path. **No Tier B merge
available this pass** — everything mergeable is Tier C by path, and
everything else is a draft or conflicting.

## Everything else open (17 total, via `gh pr list --state open`)

- **Skill**: #140 (Tier C, waiting on the owner — "Top three" item 1).
- **Tier C, waiting on the owner directly**: #39, #48, #80 — "Top
  three" item 3.
- **Conflicting, waiting on the owning seat's rebase**: #75 (security
  — a live CSRF/RCE defect, handed off 2026-10-06, still unrebased;
  #124 was meant to be the response and is itself a dead draft, see
  below).
- **Frontend's live draft**: #141 (real work in progress — benchmark
  write-up and after-shots still its own unfinished tail; the contrast
  dispatch above would have built on it).
- **Dead drafts, each a stub with nothing committed since its own
  ship-first commit**: #124 (security, since 2026-10-07T06:29), #143
  (exo, since 2026-10-08T20:10 — exo's own to resolve, not this
  seat's; noted, not touched).
- **Draft, idle since 2026-10-05–06, not failing CI, seat already has
  a newer open PR**: #47, #49, #85, #87, #91, #112, #113, #114.

Full list, oldest first, is `gh pr list --state open`; not reproduced
line by line since it goes stale by the next pass.

## Board hygiene, found this pass

The board's `sprint` object still names `sprint-2026-09-21` (ends
2026-09-27), two cycles stale — `docs/sprints/sprint-2026-10-05.md` is
the real current sprint and the board was never moved to match. Of
its four items, one ("Stage one of the surfaces") was resolved and
moved to Done this pass (see above); the other three ("The working
autonomous MVP", "Wire the local store server," "Dashboard and panel
markup from the four frozen artboards") have no PR evidence found
this pass of being started (`gh pr list` has nothing matching their
titles or obvious file paths). Re-pointing the board's sprint object
and regrooming "This sprint" against what's actually in flight is
ceremony-weight work — flagging for Monday (2026-10-12) rather than
doing it in a standup pass.

## Waiting on an owner-only action

- `company.yaml` (#80), `prompts/research-agent.md` (#48),
  `prompts/engineer-agent.md` / `prompts/skill-agent.md` (#39).
- #140 under `prompts/skill-extract.md`.
- The three ledger entries 20+ days past the two-week verdict mark
  (repo split, tuning packs, the merge-commits/PR-reader finding).
  Grooming them is Monday's ceremony (2026-10-12), not this pass's.
- The `docs/decisions.md` ADR numbering collision — two different
  entries both titled ADR-005 and two both titled ADR-006. Outside
  this seat's writable surface (charters/decisions are not this
  seat's lane to rewrite without an ADR of its own). Checked again
  this pass: unchanged since first flagged.
- **Milestone "Sprint 2026-10-05" wiring**: still 0 issues/PRs attached
  through GitHub's own milestone field despite three real backlog
  items, due 2026-10-11. The gap is why the dispatch criterion for
  "milestone due within three days with open items" doesn't fire
  mechanically even though the substance (item 3 unshipped) is real —
  named explicitly in this pass's dispatch reasoning instead of relied
  on silently.
- **The skill charter's Data access section** naming a Neon claims
  database Ursa does not have (docs/decisions.md, found independently
  four times since 2026-09-24). Handed to exo (board message,
  2026-10-08); exo's weekly run is Sunday 2026-10-11, not yet run.
  `prompts/skill-agent.md` is Tier C, so this seat cannot fix it
  directly.
- **The workflow-permissions gap this pass found** (see
  `dispatch-queue.md`): `.github/workflows/agent-pm.yml` declares
  `actions: write` but this run's actual token still gets a 403 on
  both a plain Actions-permissions read and a workflow-dispatch write.
  Handed to HQ (`alexandra-systems/exo-centralizer`) as workflow
  machinery, per pm.md §15 — not something this seat can fix by
  editing `.github/workflows` itself even if it could, since that
  file is HQ's surface.

## Board message check

Queried `$BOARD_API_URL/api/messages?to_seat=pm&to_company=Ursa`,
filtered client-side for `to_company == "Ursa" && to_seat == "pm"`
specifically (the query parameters alone still return other
companies' broadcast traffic, as every pass this week has had to
work around). Exactly one message has ever arrived addressed to this
seat specifically: the 2026-10-07T19:09 note from HQ's engineer about
the misrouted rebase handoff, resolved above (moot — #92 is closed).
Nothing new since. This pass posted one board comment (the #92/#134
pointer, on the board item) and no new ask, since nothing needed one.
