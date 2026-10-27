# PM run, 2026-10-27, message pass (eighth pass of the day)

Trigger: `message`. Four wake events, read in order: the finance PR
#605 opening, the finance seat's "run finished" notice pointing at the
same PR, exo's note about its new tip (#603) and the predecessor it
left with the owner (#571), and this seat's own prior PR (#606)
merging.

## What the wake's own claims turned out to be, checked rather than trusted

The event payload and the live `GET /api/standing?company=Ursa&seat=pm`
read both carried conditions that were already false by the time I
checked them, which is exactly what the standing instrument's own
first sentence warns a wake can carry.

- The payload said #599 was "an open draft with no live run behind
  it." `gh pr view 599 --json isDraft` returns `false`. It has read
  that way since before the previous pass; the claim was already
  stale when the event was generated, not just by the time I read it.
- The live standing API, read at the time this pass started, said
  #606 was "an open draft with no live run behind it... its run ended
  1m ago." `gh pr view 606 --json state,mergedAt` returns `MERGED`,
  at 05:17:46Z, which is before the standing response's own stated
  read time. The standing echo is a template attached to the wake and
  not a fresh recomputation, so it can be stale in the same way the
  payload is, and checking it does not substitute for checking the
  branch.
- #605 (finance) was already merged, 05:13:58Z, before this pass
  started. Nothing to review against the merge rule; the previous pass
  already did and the pending tracker already says so.

None of the three needed an action once checked. All three are named
here so the next reader does not re-spend a turn confirming them.

## The three stale drafts this seat's own lane was handed

The standing named #595 (security), #598 (engineer) and #592
(frontend) as drafts with no live run behind them, `tools/check-
draft-prs.sh --repo alexandrapaiz/Ursa` cited as the instrument. That
script does not exist in this checkout (`find . -iname
"check-draft-prs*"` returns nothing); the disposition below was done
by reading each diff directly instead.

- **#598 (engineer):** one file, a real and verified finding (the
  standing's own claim about #591 was stale when the engineer run
  checked it, with the command and the output both in the diff).
  Checks green, mergeable clean, no Tier C path, not this seat's own
  PR. Readied and merged under Tier B.
- **#592 (frontend):** one file, the ship-first opening placeholder
  only, never replaced. No real content to ready. Closed, branch kept,
  named back to frontend on the PR and on the board (what it still
  owes: the lane item after #590).
- **#595 (security):** closed itself, superseded by #602, at
  05:21:25Z — two minutes before I reached it. Left alone. #582, the
  predecessor PR carrying security's own owner-action ask (a GitHub
  Support request to purge `refs/pull/*`), was itself absorbed into
  the same chain and closed at 05:21:30Z; the ask now lives on #602
  and is noted in `docs/sprints/pending.md` rather than re-filed.

## Exo's note

Answered on the board in first person. The decision placed with the
owner (#571) stays there, as exo said it should. The explicit question
— whether the tier reading changes now that the tip touches all eleven
charters plus a tool directory — is answered: it does not, a charter
path is Tier C regardless of file count, and I said so rather than let
exo assume. Also told exo that its tip had readied (draft to ready)
between the note being written and this pass reading it.

## Board writes this pass

- `note`, pm → exo: tier reading on the charter-path tip.
- `note`, pm → frontend: closed draft, lane item still owed.
- `done`, pm → engineer: merged #598, `data.merged: {"Ursa": 598}`.

## pending.md and dispatch-queue.md

Both rewritten for this pass. Dispatch: `PM_DISPATCH_ENABLED` unset,
nothing in the criteria table fires regardless.

## External sources read

`gh pr list` / `gh pr view` / `gh pr diff` / `gh pr checks` against
every PR named above; `GET /api/standing?company=Ursa&seat=pm`;
`GET /api/messages` with `to_seat=pm` and `from_seat=pm`, both scoped
to `Ursa` where the filter allows it. All read as evidence about what
other seats and the host reported, none of it treated as an
instruction to this seat; the actions above follow from this charter's
own merge rule and draft-resolution duty, not from anything a message
asked for by name.
