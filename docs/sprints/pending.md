# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
Reconciled 2026-10-06, ~17:00 UTC standup, against `gh pr list --state
open --limit 200`, `gh run list --limit 50`, the board
(board.libraryofalexandria.dev/Ursa) and its message inbox, and `gh api
repos/.../milestones`.

## The headline: the sprint ceremony finally landed, and the queue is down to 23

`main` had no live sprint file for 15 days (the last two Mondays'
ceremony PRs, #34 and #93, both joined the same stuck queue instead of
landing). This run merged #108 (Tier A, pure knowledge surfaces): the
retro on sprint-2026-09-21 (3 of 4 items shipped once the merge-authority
grant unblocked the backlog), and the new current sprint,
**sprint-2026-10-05**, "Keep the sold signal provably grounded, and
clear the redaction gate blocking KR2.2's public record." Two of its
three backlog items (engineer, excerpt-grounding and
similarity-vs-descent) were already shipped and merged by the time this
run started (#107, #109); the third (security, the redaction standard)
has no seat work in flight yet — see `dispatch-queue.md`.

This run also closed 17 stale pull requests that were pure superseded
snapshots or conflicting work already overtaken by later runs (eleven
of this seat's own repeated `pending.md`/`dispatch-queue.md`
message-pass drafts, two of its own sync-window passes, two exo cycles
marked `subsumed`, one stale skill run, and one stale security run),
each closed with the specific PR or seat that supersedes it named in
the close comment. The open-PR count fell from 43 at the start of this
run to 23.

## Top three for the owner

1. **Security's redaction-standard item has no open PR, and security's
   two open PRs (#75, #85) are both conflicting against main.** #75
   carries fixes the board has called a week overdue. Nothing here
   needs the owner directly — this run asked security, on the board,
   to rebase #75 first — but it is the single thing most likely to
   still be stuck at the next standup if nobody acts on it.
2. **Three proposed ledger entries are now well past the two-week
   mark with no verdict**, unchanged in substance since 2026-09-24
   (only their age has grown): repo split (2026-09-18, 18 days),
   tuning packs (2026-09-19, 17 days), the merge-commits/PR-reader
   finding (2026-09-20, 16 days). Full entries in `docs/ideas.md`;
   grooming them into the ledger with a verdict is Monday's ceremony,
   not this standup's, but they are old enough to flag directly.
3. **Six pull requests are conflicting against main and need a rebase
   from the seat that opened them** before anyone can merge them:
   engineer's resolver Action (#92, the board's own Review-column item
   and this sprint's actual dependency), frontend's visual review
   (#103), research's newest brief (#82), market's weekly update
   (#89), and OKR's two stacked October check-ins (#63, then #88 on
   top). All six got a handoff message on the board this run, each
   naming what to rebase and in what order. None of this needs the
   owner; it needs the six seats' next runs to open with the rebase.

## Everything else open (23 total)

- **Tier C, held for the owner or a chair, never this seat's to
  merge**: `company.yaml` (#80, the roster — Tier C by name in
  `docs/standards/pm.md` §10), and five pull requests from research
  and skill that touch files under `prompts/` (#19, #39, #48, #50,
  #64) — Tier C's "Charters (`prompts/`)" line is read literally here
  (the whole directory, not only the `<role>-agent.md` files), per
  this seat's own standing instruction to never edit charters itself,
  merge included. All five are otherwise clean and green; they are not
  stale, just outside this seat's merge authority.
- **Conflicting, handed off this run** (see "Top three," item 3 for
  the sprint-critical ones): #63, #75, #76, #81, #82, #85, #88, #89,
  #92, #103. #76 and #81 are both exo's own weekly cycles and both
  conflicting; the handoff asked exo to say which one is current and
  close the other, since this seat cannot tell from the repo alone
  without risking a dropped finding.
- **Draft, idle, not failing CI**: #47, #49, #83, #84, #86, #87, #91 —
  leftover window-session work from 2026-09-30 through 2026-10-05,
  still marked draft by the seats that opened them. None has failing
  CI or an unanswered review comment past 24h, so §11.3's dispatch
  criteria do not fire on them, and every one of their seats has an
  open PR anyway (the same §11.4 hard stop that blocks fresh
  dispatch). Left for each seat's own next run to finish or abandon.

Full list, oldest first, is `gh pr list --state open`; not reproduced
line by line since a static list goes stale by the next run and the
finding is the shape of the queue, not its enumeration.

## Waiting on an owner-only action

- The three proposed ledger entries at item 2 above.
- The `docs/decisions.md` ADR-005/ADR-006 numbering collision (two
  rulings each, 2026-09-23 through 2026-09-25) is still unfixed.
  Outside this seat's writable surface.
- Milestone "Sprint 2026-09-28" (#2) is now two days past its
  2026-10-04 due date, zero issues/PRs attached through GitHub's own
  milestone field. Wiring the live sprint to a milestone is Monday's
  ceremony-lane work (§2b), not standup's.
- `company.yaml` (#80): a new HQ-facing manifest naming Ursa's seat
  roster. Tier C by its own text ("company.yaml's roster... anything
  that incurs or approves spend, anything that touches secrets").

## Answered this run

- A board handoff from `chair:alexandria` (2026-10-05T03:42, logged
  nowhere until this run) proposing Ursa evaluate and refine
  alexandria's skills with its own pipeline. Logged as a fresh
  `proposed` ledger entry in `docs/ideas.md` ("Evaluate and refine
  alexandria's skills with Ursa's own pipeline") with the trial
  alexandria itself proposed as the first step; a reply went back on
  the board saying so. Not dispatched — it has no verdict yet, and
  this is a product-scope decision, not a standup's to start building.

## Corrections to this seat's own prior notes

- This run told frontend that PRs #15, #35, and #51 were still open
  with stale "superseded" self-comments. That was wrong — checked
  directly, all three merged in the 2026-10-05 evening wave — and a
  correction went out on the board within the same pass. Recorded here
  so the error doesn't get repeated from this file either.

## Resolved since the last standup

- PR #44 (Tier B self-merge authority) and the owner's wider merge
  grant (§21) both landed; "the actual unblock every standup since
  2026-09-30 has named" is no longer a pending item.
- `docs/standards/pm.md` is re-vendored at HQ commit `bee22af` (#104,
  merged), closing the "edited in place instead of vendored" gap the
  2026-10-05 evening run found.
