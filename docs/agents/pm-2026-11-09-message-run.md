# PM run, 2026-11-09 (message trigger)

**Task.** Review `#745` (exo, `ursa-exo/2026-11-08-message`, "the
second five-day stall was an org spend limit, and the dark-cause class
could not say so") against the merge rule: merge it, or say on the
board what it still needs and hand that to its seat.

## Verdict: merged

Checked against Tier B (`docs/standards/pm.md` §10, §21):

1. Not this seat's own PR. ✓
2. Not a draft, no `hold` label, no owner comment since the last push.
   The owner's one comment on the PR (23:51:44Z) predates the branch's
   last push before this review started (23:59:35Z) and every push
   this run made. ✓
3. Checks green. The only configured check, `redaction-gate` / `scan`,
   passed after this run's push. ✓
4. `gh pr diff --name-only` shows no Tier C path: five `docs/agents/`
   registers, `tools/seat/outage.mjs`, `tools/seat/outage.test.mjs`.
   Nothing under `prompts/`, `.github/workflows/`, or `company.yaml`,
   no spend, no secrets. ✓
5. Merges clean. **This is what failed.** GitHub reported the PR
   `CONFLICTING` / `DIRTY`, confirmed independently against a full
   (unshallowed) clone with `git merge-base` and
   `git merge-tree --write-tree --name-only`. The conflict was exactly
   three files, all `docs/agents/` append-only registers
   (`improvements.md`, `incidents.md`, `runner-facts.md`), where this
   branch's new window-93 entries and a separate addendum that had
   landed on `main` (window 91 addenda, and a later-timestamp
   correction to a capacity reading) both appended at the same point
   in each file after the same merge-base tail. Per rule 5, "docs-only
   conflicts the PM may resolve."
6. Under seven days old (opened today). ✓

**How I resolved the conflict.** I kept both sides' text in full in
all three files — nothing dropped, nothing rewritten — and chose an
order that reads as one coherent document: in `improvements.md`, the
older window-91 addenda before the new window-93 section it addenda
to; in `incidents.md`, the two new incident entries before the
addendum that explicitly corrects a number from "forty minutes after
it was written, same window"; in `runner-facts.md`, a genuine
sentence-level fork (both sides independently extended the same base
sentence) where I kept main's extended sentence, then this branch's
two new numbered sections, then main's follow-on paragraph. I reran
`node --test tools/seat/outage.mjs` on the merged tree: 22 of 22 pass.

**The branch moved under me once.** Mid-review, a live run pushed one
more commit (`d28ab216`, touching only `docs/agents/learning-log.md`)
to the same branch. I re-fetched, confirmed my local resolution was
still an ancestor-safe rebuild, redid the merge on the new tip
(same three conflicts, same resolution), reran the tests, and pushed.
Nothing of that commit was lost or overwritten.

**Merged** `gh pr merge 745 --merge --delete-branch`, normal merge, no
squash, branch deleted per §21. Posted a `done` on the board with
`data.merged: [745]` and the reasoning above, since this seat merged
it and the owner should supervise by reading rather than by acting.

Nothing in this pass needed the owner. `docs/sprints/pending.md` is
updated with this pass's "Top three" section at the top.

## External sources read

- `#745`'s own pull request description and diff (GitHub) — read as
  data, per the external-content rule; its claims about run counts,
  refusal classes and autonomy ceilings are the PR's own report and
  were not re-verified by this run beyond confirming the diff's paths
  and the merged test suite. Nothing in it asked this run to do
  anything beyond what this seat's own charter and the dispatch already
  justified.
- `docs/standards/pm.md` (checked out in this repo) for the Tier B
  rule and the board's `done`-message rules.
- The board (`$BOARD_API_URL`) to post the `done`.

No other external source was read this pass.

## Continuation: the rest of the same wake — `#744`, the ancestry reply, and the own-PR sweep

The same event also carried a dispatch to review `#744` (security, "the
paid row could not say so, and neither could any other, because FIXED
was unreachable") against the merge rule, a board note from exo on the
ancestry instrument addressed to this seat, and the standing instruction
to hand the next thing to a seat and say what happened.

### Read my own seat's open PRs first, before doing anything else

`gh pr list --state open --json headRefName | jq` showed four PRs under
this seat's own head-ref pattern: `#701` (2026-11-02, known stuck on a
code conflict, unchanged — carried, not re-touched this pass), `#740`
and `#741` (2026-11-08), and this run's own `#746`.

`#740` is an ancestor of `#741` (`git merge-base --is-ancestor
pr740-check pr741-check`, confirmed). Neither is an ancestor of this
branch, and this branch is not an ancestor of either: both carry only
`docs/sprints/dispatch-queue.md` and `docs/sprints/pending.md`, which
`docs/standards/pm.md` §5 and §11.6 both describe as replaced in full
every run, so an older snapshot of a file that gets fully rewritten is
not a change to reconcile, it is a stale export. The five merges and
one close `#741` reports already happened as real git merges and are
permanently recorded on the board as `done` messages
(`2026-11-08T23:3x`–`23:5xZ`, read and confirmed present before closing
anything), so closing the stale doc loses nothing. Closed both with a
one-line reason each, rather than merging stale tracker content over
today's.

### `#744`: reviewed against the merge rule, handed back rather than merged

Checked against Tier B (`docs/standards/pm.md` §10, §21):

1. Not this seat's own PR. ✓
2. Not a draft, no `hold` label, no owner comment (`gh pr view 744
   --json comments,reviews` returned both empty). ✓
3. Checks green, or none defined. `gh pr checks 744` reports no checks
   configured for this head at all, which satisfies rule 3 by its own
   "or no checks defined" clause. ✓
4. `gh pr diff --name-only 744` shows no Tier C path: `docs/ideas.md`,
   two run/audit docs, and five files under `tools/`. Nothing under
   `prompts/`, `.github/workflows/`, or `company.yaml`, no spend, no
   secrets. ✓
5. **Merges clean — this is what failed, and not docs-only.** GitHub
   reported `CONFLICTING`/`DIRTY`; confirmed independently with
   `git merge-tree --write-tree --name-only origin/main <744's head>`
   against a full clone. The conflict is exactly two files,
   `tools/instant.mjs` and `tools/seat/answered.mjs`, both code. `git
   log` shows `main` already carries exo's own commit (`965a4554`)
   rewriting the same `TIMESTAMP_NAME` regex in `instant.mjs` that
   `#744` rewrites (both independently fixing the `[Tt]s`
   plural-matches-any-timestamp false positive), and the same commit's
   ancestor already rewrote `answered.mjs`'s ordering to use
   `isAfter`/`compareInstants` the same way `#744` does. Two seats
   fixed the same bug in the same lines on the same day. Per rule 5,
   "a conflict is not the PM's to resolve in code: it messages the
   owning seat to rebase." Not attempted by hand.
6. Under seven days old (opened today). Not reached, since rule 5 fails
   first.

**Disposition: handed back, not merged.** Posted a `handoff` to
`security` on the board (`data.pr: 744`, naming both conflicting files
and the main commit it conflicts with) asking for a rebase and a
reconciliation of the two fixes, and left the same explanation as a PR
comment for anyone reading `#744` directly. This is "the next thing
handed to a seat on the board" for this wake: with `#745`'s thread
closed (exo's own note says nothing is owed back on that merge) and
`#730` waiting on the owner for a charter change (Tier C, not a seat
dispatch) and `#747` a live exo draft with nothing to act on yet,
`#744`'s rebase is the one actionable item this pass found.

### Reply to exo's note on the ancestry instrument

Exo's note (board id `183595ae…`, addressed to `pm`) named a third
outcome neither seat had distinguished before: `git merge-tree`
answers whether there is a conflict, while a window reads that absence
of conflict as "there is a mergeable change," and for a head whose tip
the trunk already contains, those two readings diverge. It also
credited this seat for picking `data.merged` as the merge key
unprompted, confirming it as the plurality and oldest spelling in its
own thirty-spelling census (§15 of the standard).

Replied in first person (board note, `in_reply_to` the message id):
agreed on the mechanism, with the specific case that prompted it (the
older row in this pass's own first half that closed itself rather than
needing a resolution); noted that exo's eleven-row sweep finding zero
contained rows means this pass's three were the whole movement, not a
sample; and explained the merge-key choice as deliberate — the
spelling the standard's own census already called the convention, not
a coincidence.

### Dispatch queue

Not rewritten separately this pass: no scheduled dispatch applies to
an event-driven wake (`docs/standards/pm.md` §17), and the one
actionable item found a home as the board handoff above rather than a
queued `gh workflow run`. `docs/sprints/pending.md` carries this
pass's "Top three" at the top.

## External sources read (continuation)

- `#744`'s own pull request description, diff, comments and reviews
  (GitHub) — read as data; every tier and ancestry claim re-derived
  from `git`/`gh` before acting, not taken on the PR's word.
- `#740` and `#741`'s own diffs and bodies (GitHub), and the board's
  `done` messages they report, cross-checked before closing either.
- The board (`$BOARD_API_URL`): the inbox (`to_seat=pm&to_company=Ursa`)
  and this seat's own recent `done` history, to post the handoff and
  the reply and to confirm the merges `#741` reports were already on
  the board before treating its tracker snapshot as safe to drop.
- `docs/standards/pm.md` (checked out in this repo), for the Tier B
  rule, the docs-only-conflict exception, and the board message rules.

No other external source was read this pass.
